import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0'
import { GoogleGenAI, Modality } from 'npm:@google/genai@^1.23.0'
import jimp from 'https://esm.sh/jimp@0.22.10';
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generatePrompt(tool, params) {
    let textPrompt = `Apply the ${tool.name} transformation.`;
    switch(tool.id) {
        case 'hairstyle':
            textPrompt = `Change the hairstyle to "${params.style}".`;
            if (params.color) textPrompt += ` The hair color should be ${params.color}.`;
            break;
        case 'hair-color': textPrompt = `Change the hair color to ${params.color}.`; break;
        case 'eye-color': textPrompt = `Change the eye color to ${params.color}.`; break;
        case 'skin-color': textPrompt = `Change the skin tone to ${params.skinTone}.`; break;
        case 'age': textPrompt = `Make the person in the image look ${params.age} years old.`; break;
        case 'smile': textPrompt = `Add a natural smile to the person's face with an intensity of ${params.intensity}%.`; break;
        case 'fat': textPrompt = `Make the person in the image look heavier by an intensity of ${params.intensity}%.`; break;
        case 'bald': textPrompt = `Make the person in the image look bald with an intensity of ${params.intensity}%.`; break;
        case 'beard': textPrompt = `Apply a "${params.beardStyle}" beard style.`; break;
        case 'halloween': textPrompt = `Apply a halloween filter. The style should focus on "${params.halloweenStyle}".`; break;
    }
    return textPrompt;
}

const bufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let storagePathToDelete: string | null = null;

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    const { tool, params, storagePath } = await req.json();
    if (!tool || !params || !storagePath) {
        throw new Error('Missing required parameters.');
    }
    storagePathToDelete = storagePath;

    // Download image from temporary storage
    const { data: imageBlob, error: downloadError } = await supabaseAdmin.storage
      .from('image-processing-uploads')
      .download(storagePath);
    
    if (downloadError) throw downloadError;
    if (!imageBlob) throw new Error('Failed to download image from storage.');

    const imageBuffer = await imageBlob.arrayBuffer();
    const imageBase64 = bufferToBase64(imageBuffer);
    const imageMimeType = imageBlob.type;

    const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('*, plans(name)').eq('id', user.id).single();
    if (profileError) throw profileError;
    if (userProfile.credits < 1) throw new Error('Insufficient credits.');

    if (tool.id === 'hairstyle' && params.style) {
        const { data: hs } = await supabaseAdmin.from('hairstyles').select('is_pro').eq('name', params.style).single();
        if (hs?.is_pro && userProfile.plans?.name === 'Free') {
             return new Response(JSON.stringify({ error: 'This is a Pro feature. Please upgrade.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402,
            });
        }
    }

    const textPrompt = generatePrompt(tool, params);
    const ai = new GoogleGenAI({ apiKey: Deno.env.get('GEMINI_API_KEY')! });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { data: imageBase64, mimeType: imageMimeType } }, { text: textPrompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
      
    const imgPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imgPart?.inlineData?.data) {
        throw new Error(`API call failed: ${response.promptFeedback?.blockReason || 'No image data returned'}`);
    }

    // --- Image Processing and Optimization ---
    const originalPngBase64 = imgPart.inlineData.data;
    const originalPngBytes = Uint8Array.from(atob(originalPngBase64), c => c.charCodeAt(0));
    
    // FIX: Robustly handle CJS/ESM interop for the Jimp library.
    const Jimp = (jimp as any).default || jimp;
    
    const jimpImageBuffer = Buffer.from(originalPngBytes);
    const image = await Jimp.read(jimpImageBuffer);
    await image.quality(75);
    const optimizedJpegBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    const optimizedJpegBytes = new Uint8Array(optimizedJpegBuffer);
    const optimizedJpegBase64 = bufferToBase64(optimizedJpegBytes.buffer);

    // --- Storage Operations ---
    const filenameBase = `${tool.id}-${Date.now()}`;
    const hqPngPath = `${user.id}/${filenameBase}.png`;
    const optimizedJpegPath = `${user.id}/${filenameBase}.jpeg`;

    const { error: hqUploadError } = await supabaseAdmin.storage.from('generations-hq').upload(hqPngPath, originalPngBytes, { contentType: 'image/png' });
    if (hqUploadError) throw hqUploadError;

    const { error: optimizedUploadError } = await supabaseAdmin.storage.from('generations').upload(optimizedJpegPath, optimizedJpegBytes, { contentType: 'image/jpeg' });
    if (optimizedUploadError) throw optimizedUploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage.from('generations').getPublicUrl(optimizedJpegPath);

    // --- Database Inserts ---
    const { error: usageError } = await supabaseAdmin.from('credit_usage').insert({ user_id: user.id, tool_id: tool.id, credits_used: 1 });
    if (usageError) throw usageError;

    const { data: generationData, error: genError } = await supabaseAdmin.from('generations')
      .insert({ user_id: user.id, tool_id: tool.id, image_url: publicUrl, image_url_hq: hqPngPath })
      .select('id').single();
    if (genError) throw genError;
    if (!generationData) throw new Error('Failed to create generation record.');

    // --- Cleanup and Response ---
    await supabaseAdmin.storage.from('image-processing-uploads').remove([storagePath]);
    storagePathToDelete = null;

    return new Response(JSON.stringify({ newImageBase64: optimizedJpegBase64, generationId: generationData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // If an error occurred, try to clean up the temp file
    if (storagePathToDelete) {
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        await supabaseAdmin.storage.from('image-processing-uploads').remove([storagePathToDelete]);
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

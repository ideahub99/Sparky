import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0'
import { GoogleGenAI, Type } from 'npm:@google/genai@^1.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        faceShape: { type: Type.STRING }, symmetryScore: { type: Type.NUMBER },
        youthfulnessScore: { type: Type.NUMBER }, skinClarity: { type: Type.NUMBER },
        overallAnalysis: { type: Type.STRING }, eyeShape: { type: Type.STRING },
        jawlineDefinitionScore: { type: Type.NUMBER }, cheekboneProminenceScore: { type: Type.NUMBER },
        lipFullnessScore: { type: Type.NUMBER }, skinEvennessScore: { type: Type.NUMBER },
        goldenRatioScore: { type: Type.NUMBER }, emotionalExpression: { type: Type.STRING },
        perceivedAge: { type: Type.INTEGER },
    },
    required: [ 'faceShape', 'symmetryScore', 'youthfulnessScore', 'skinClarity', 'overallAnalysis', 'eyeShape', 'jawlineDefinitionScore', 'cheekboneProminenceScore', 'lipFullnessScore', 'skinEvennessScore', 'goldenRatioScore', 'emotionalExpression', 'perceivedAge' ]
};

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

    const { storagePath } = await req.json();
    if (!storagePath) throw new Error('Missing storage path.');
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

    const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('credits').eq('id', user.id).single();
    if (profileError) throw profileError;
    if (userProfile.credits < 1) throw new Error('Insufficient credits.');

    const ai = new GoogleGenAI({ apiKey: Deno.env.get('GEMINI_API_KEY')! });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [
            { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
            { text: 'Analyze the facial features in this image and provide a detailed report according to the provided JSON schema.' },
        ]},
        config: { responseMimeType: "application/json", responseSchema: analysisSchema },
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7, -3);
    }
    const analysisResult = JSON.parse(jsonText);

    await supabaseAdmin.from('credit_usage').insert({ user_id: user.id, tool_id: 'analysis', credits_used: 1 });
    await supabaseAdmin.from('generations').insert({ user_id: user.id, tool_id: 'analysis' });

    await supabaseAdmin.storage.from('image-processing-uploads').remove([storagePath]);
    storagePathToDelete = null;

    return new Response(JSON.stringify({ analysisResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (error) {
     if (storagePathToDelete) {
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        await supabaseAdmin.storage.from('image-processing-uploads').remove([storagePathToDelete]);
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});

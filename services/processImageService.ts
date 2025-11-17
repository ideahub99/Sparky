import { supabase } from '../lib/supabaseClient';
import { GoogleGenAI, Modality } from '@google/genai';
import { notifyGenerationComplete, notifyLowCredits } from './notificationService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function generatePrompt(tool: any, params: any): string {
  let textPrompt = `Apply the ${tool.name} transformation.`;
  switch(tool.id) {
    case 'hairstyle':
      textPrompt = `Change the hairstyle to "${params.style}".`;
      if (params.color) textPrompt += ` The hair color should be ${params.color}.`;
      break;
    case 'hair-color':
      textPrompt = `Change the hair color to ${params.color}.`;
      break;
    case 'eye-color':
      textPrompt = `Change the eye color to ${params.color}.`;
      break;
    case 'skin-color':
      textPrompt = `Change the skin tone to ${params.skinTone}.`;
      break;
    case 'age':
      textPrompt = `Make the person in the image look ${params.age} years old.`;
      break;
    case 'smile':
      textPrompt = `Add a natural smile to the person's face with an intensity of ${params.intensity}%.`;
      break;
    case 'fat':
      textPrompt = `Make the person in the image look heavier by an intensity of ${params.intensity}%.`;
      break;
    case 'bald':
      textPrompt = `Make the person in the image look bald with an intensity of ${params.intensity}%.`;
      break;
    case 'beard':
      textPrompt = `Apply a "${params.beardStyle}" beard style.`;
      break;
    case 'halloween':
      textPrompt = `Apply a halloween filter. The style should focus on "${params.halloweenStyle}".`;
      break;
  }
  return textPrompt;
}

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToBuffer = (base64: string): Uint8Array => {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
};

export const processImageService = async (
  tool: any,
  params: any,
  storagePath: string
): Promise<{ newImageBase64: string; generationId: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let storagePathToDelete: string | null = storagePath;

  try {
    // Download image from temporary storage
    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from('image-processing-uploads')
      .download(storagePath);
    
    if (downloadError) throw downloadError;
    if (!imageBlob) throw new Error('Failed to download image from storage.');

    const imageBuffer = await imageBlob.arrayBuffer();
    const imageBase64 = bufferToBase64(imageBuffer);
    const imageMimeType = imageBlob.type;

    // Check user credits and plan
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*, plans(name)')
      .eq('id', user.id)
      .single();
    
    if (profileError) throw profileError;
    if (userProfile.credits < 1) throw new Error('Insufficient credits.');

    // Check if hairstyle is pro
    if (tool.id === 'hairstyle' && params.style) {
      const { data: hs } = await supabase
        .from('hairstyles')
        .select('is_pro')
        .eq('name', params.style)
        .single();
      
      if (hs?.is_pro && userProfile.plans?.name === 'Free') {
        throw new Error('This is a Pro feature. Please upgrade.');
      }
    }

    // Call Gemini API
    const textPrompt = generatePrompt(tool, params);
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: imageMimeType } },
          { text: textPrompt }
        ]
      },
      config: { responseModalities: [Modality.IMAGE] },
    });
      
    const imgPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!imgPart?.inlineData?.data) {
      throw new Error(`API call failed: ${response.promptFeedback?.blockReason || 'No image data returned'}`);
    }

    // Get the generated image
    const originalPngBase64 = imgPart.inlineData.data;
    const originalPngBytes = base64ToBuffer(originalPngBase64);

    // For now, we'll use the PNG directly (optimization can be added later)
    const optimizedJpegBase64 = originalPngBase64;
    const optimizedJpegBytes = originalPngBytes;

    // Storage Operations
    const filenameBase = `${tool.id}-${Date.now()}`;
    const hqPngPath = `${user.id}/${filenameBase}.png`;
    const optimizedJpegPath = `${user.id}/${filenameBase}.jpeg`;

    const { error: hqUploadError } = await supabase.storage
      .from('generations-hq')
      .upload(hqPngPath, originalPngBytes, { contentType: 'image/png' });
    
    if (hqUploadError) throw hqUploadError;

    const { error: optimizedUploadError } = await supabase.storage
      .from('generations')
      .upload(optimizedJpegPath, optimizedJpegBytes, { contentType: 'image/jpeg' });
    
    if (optimizedUploadError) throw optimizedUploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('generations')
      .getPublicUrl(optimizedJpegPath);

    // Database Inserts
    const { error: usageError } = await supabase
      .from('credit_usage')
      .insert({ user_id: user.id, tool_id: tool.id, credits_used: 1 });
    
    if (usageError) throw usageError;

    const { data: generationData, error: genError } = await supabase
      .from('generations')
      .insert({ user_id: user.id, tool_id: tool.id, image_url: publicUrl, image_url_hq: hqPngPath })
      .select('id')
      .single();
    
    if (genError) throw genError;
    if (!generationData) throw new Error('Failed to create generation record.');

    // Cleanup
    await supabase.storage.from('image-processing-uploads').remove([storagePath]);
    storagePathToDelete = null;

    // Send notifications
    await notifyGenerationComplete(user.id, tool.name);
    
    // Check if credits are low after this generation
    const newCredits = userProfile.credits - 1;
    if (newCredits <= 5) {
      await notifyLowCredits(user.id, newCredits);
    }

    return {
      newImageBase64: optimizedJpegBase64,
      generationId: generationData.id
    };
  } catch (error) {
    // Cleanup on error
    if (storagePathToDelete) {
      await supabase.storage.from('image-processing-uploads').remove([storagePathToDelete]);
    }
    throw error;
  }
};

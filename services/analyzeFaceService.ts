import { supabase } from '../lib/supabaseClient';
import { GoogleGenAI, Type } from '@google/genai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    faceShape: { type: Type.STRING },
    symmetryScore: { type: Type.NUMBER },
    youthfulnessScore: { type: Type.NUMBER },
    skinClarity: { type: Type.NUMBER },
    overallAnalysis: { type: Type.STRING },
    eyeShape: { type: Type.STRING },
    jawlineDefinitionScore: { type: Type.NUMBER },
    cheekboneProminenceScore: { type: Type.NUMBER },
    lipFullnessScore: { type: Type.NUMBER },
    skinEvennessScore: { type: Type.NUMBER },
    goldenRatioScore: { type: Type.NUMBER },
    emotionalExpression: { type: Type.STRING },
    perceivedAge: { type: Type.INTEGER },
  },
  required: [
    'faceShape',
    'symmetryScore',
    'youthfulnessScore',
    'skinClarity',
    'overallAnalysis',
    'eyeShape',
    'jawlineDefinitionScore',
    'cheekboneProminenceScore',
    'lipFullnessScore',
    'skinEvennessScore',
    'goldenRatioScore',
    'emotionalExpression',
    'perceivedAge'
  ]
};

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const analyzeFaceService = async (storagePath: string): Promise<any> => {
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

    // Check user credits
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();
    
    if (profileError) throw profileError;
    if (userProfile.credits < 1) throw new Error('Insufficient credits.');

    // Call Gemini API
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
          { text: 'Analyze the facial features in this image and provide a detailed report according to the provided JSON schema.' },
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      },
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7, -3);
    }
    const analysisResult = JSON.parse(jsonText);

    // Record usage
    await supabase
      .from('credit_usage')
      .insert({ user_id: user.id, tool_id: 'analysis', credits_used: 1 });
    
    await supabase
      .from('generations')
      .insert({ user_id: user.id, tool_id: 'analysis' });

    // Cleanup
    await supabase.storage.from('image-processing-uploads').remove([storagePath]);
    storagePathToDelete = null;

    return { analysisResult };
  } catch (error) {
    // Cleanup on error
    if (storagePathToDelete) {
      await supabase.storage.from('image-processing-uploads').remove([storagePathToDelete]);
    }
    throw error;
  }
};

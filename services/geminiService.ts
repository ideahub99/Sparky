// FIX: Implemented the missing geminiService to handle API calls.
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Tool, ToolParameters, FacialAnalysisResult } from '../types';
import { supabase } from '../lib/supabaseClient';

// Helper function to convert image blob to base64 string without data prefix
const imageBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            // The Gemini API expects just the base64 string, without the data URL prefix.
            resolve(base64data.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


// Function for image transformation, now invoking a secure Edge Function
export const transformImage = async (
    image: Blob,
    tool: Tool,
    params: ToolParameters
): Promise<string> => { // Returns base64 string of the new image
    
    const imageBase64 = await imageBlobToBase64(image);

    const { data, error } = await supabase.functions.invoke('process-image', {
      body: {
        tool,
        params,
        imageBase64,
        imageMimeType: image.type,
      },
    });

    if (error) {
      // Handle network or function invocation errors
      throw new Error(error.message || 'Function invocation failed. Please check your network and Supabase status.');
    }

    if (data.error) {
      // Handle business logic errors returned from the function
      throw new Error(data.error);
    }
    
    if (!data.newImageBase64) {
      throw new Error('The function did not return valid image data.');
    }

    return data.newImageBase64;
};

// Function for facial analysis, now invoking a secure Edge Function
export const analyzeFace = async (image: Blob): Promise<FacialAnalysisResult> => {
    const imageBase64 = await imageBlobToBase64(image);

    const { data, error } = await supabase.functions.invoke('analyze-face', {
      body: {
        imageBase64,
        imageMimeType: image.type,
      },
    });

    if (error) {
      throw new Error(error.message || 'Function invocation failed.');
    }

    if (data.error) {
      throw new Error(data.error);
    }
    
    if (!data.analysisResult) {
       throw new Error('The function did not return a valid analysis.');
    }

    return data.analysisResult as FacialAnalysisResult;
};
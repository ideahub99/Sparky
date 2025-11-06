// FIX: Implemented the missing geminiService to handle API calls.
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Tool, ToolParameters, FacialAnalysisResult } from '../types';
import { supabase } from '../lib/supabaseClient';

export interface TransformImageResponse {
    newImageBase64: string;
    generationId: number;
}

// Function for image transformation, now invoking a secure Edge Function
export const transformImage = async (
    image: Blob,
    tool: Tool,
    params: ToolParameters,
    userId: string
): Promise<TransformImageResponse> => {
    // 1. Upload the image to a temporary private bucket to avoid payload size limits.
    const fileExtension = image.type.split('/')[1] || 'png';
    const storagePath = `${userId}/${Date.now()}.${fileExtension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('image-processing-uploads')
        .upload(storagePath, image);

    if (uploadError) {
        throw new Error(`Failed to upload image for processing: ${uploadError.message}`);
    }

    // 2. Invoke the edge function with the storage path instead of the full image data.
    const { data, error } = await supabase.functions.invoke('process-image', {
      body: {
        tool,
        params,
        storagePath: uploadData.path,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to send a request to the Edge Function.');
    }

    if (data.error) {
      throw new Error(data.error);
    }
    
    if (!data.newImageBase64 || !data.generationId) {
      throw new Error('The function did not return valid image data.');
    }

    return data as TransformImageResponse;
};

// Function for facial analysis, now invoking a secure Edge Function
export const analyzeFace = async (image: Blob, userId: string): Promise<FacialAnalysisResult> => {
    // 1. Upload the image to a temporary private bucket.
    const fileExtension = image.type.split('/')[1] || 'png';
    const storagePath = `${userId}/${Date.now()}.${fileExtension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('image-processing-uploads')
        .upload(storagePath, image);

    if (uploadError) {
        throw new Error(`Failed to upload image for analysis: ${uploadError.message}`);
    }
    
    // 2. Invoke the edge function with the storage path.
    const { data, error } = await supabase.functions.invoke('analyze-face', {
      body: {
        storagePath: uploadData.path,
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

export const getHqDownloadUrl = async (generationId: number): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('download-hq-image', {
        body: { generationId }
    });
    if (error) throw new Error(error.message);
    if (!data.signedUrl) throw new Error('Could not retrieve high-quality download URL.');
    return data.signedUrl;
};
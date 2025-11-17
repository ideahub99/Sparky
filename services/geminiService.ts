// FIX: Implemented the missing geminiService to handle API calls.
import type { Tool, ToolParameters, FacialAnalysisResult } from '../types';
import { supabase } from '../lib/supabaseClient';
import { processImageService } from './processImageService';
import { analyzeFaceService } from './analyzeFaceService';
import { downloadHqImageService } from './downloadHqImageService';

export interface TransformImageResponse {
    newImageBase64: string;
    generationId: number;
}

// Function for image transformation
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

    // 2. Call the local service to process the image
    const result = await processImageService(tool, params, uploadData.path);
    
    if (!result.newImageBase64 || !result.generationId) {
      throw new Error('The function did not return valid image data.');
    }

    return result as TransformImageResponse;
};

// Function for facial analysis
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
    
    // 2. Call the local service to analyze the face
    const result = await analyzeFaceService(uploadData.path);
    
    if (!result.analysisResult) {
       throw new Error('The function did not return a valid analysis.');
    }

    return result.analysisResult as FacialAnalysisResult;
};

export const getHqDownloadUrl = async (generationId: number): Promise<string> => {
    const signedUrl = await downloadHqImageService(generationId.toString());
    if (!signedUrl) throw new Error('Could not retrieve high-quality download URL.');
    return signedUrl;
};
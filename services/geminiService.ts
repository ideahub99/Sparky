import type { Tool, ToolParameters, FacialAnalysisResult } from '../types';
import { supabase } from '../lib/supabaseClient';

/**
 * Invokes a Supabase Edge Function to apply an AI image modification.
 * All logic, including credit checks and Gemini API calls, happens on the server.
 */
export const applyImageModification = async (
  base64Image: string,
  tool: Tool,
  params: ToolParameters
): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('process-image', {
        body: { base64Image, tool, params },
    });

    if (error) {
        throw new Error(error.message);
    }
    
    if (data.error) {
        throw new Error(data.error);
    }

    return data.base64Image;
};

/**
 * Invokes a Supabase Edge Function to perform a facial analysis.
 * All logic, including credit checks and Gemini API calls, happens on the server.
 */
export const analyzeFace = async (base64Image: string): Promise<FacialAnalysisResult> => {
    const { data, error } = await supabase.functions.invoke('analyze-face', {
        body: { base64Image },
    });

    if (error) {
        throw new Error(error.message);
    }
    
    if (data.error) {
        throw new Error(data.error);
    }

    // Restructure to match our app's type, which is now done on the client from the server response.
    return {
        overallAnalysis: data.overallAnalysis,
        faceShape: data.faceShape,
        eyeShape: data.eyeShape,
        symmetryScore: data.symmetryScore,
        youthfulnessScore: data.youthfulnessScore,
        skinClarity: data.skinClarity,
        jawlineDefinitionScore: data.jawlineDefinitionScore,
        cheekboneProminenceScore: data.cheekboneProminenceScore,
        lipFullnessScore: data.lipFullnessScore,
        skinEvennessScore: data.skinEvennessScore,
        goldenRatioScore: data.goldenRatioScore,
        emotionalExpression: data.emotionalExpression,
        perceivedAge: data.perceivedAge,
    };
};

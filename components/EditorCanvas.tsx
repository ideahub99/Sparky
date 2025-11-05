import React from 'react';
import { ImageUploader } from './ImageUploader';
import { Spinner } from './ui/Elements';
import type { FacialAnalysisResult, Tool } from '../types';
import { DownloadIcon, ShareIcon } from './icons';

interface EditorCanvasProps {
  originalImage: string | null;
  generatedImage: string | null;
  analysisResult: FacialAnalysisResult | null;
  onImageUpload: (base64Image: string) => void;
  isLoading: boolean;
  error: string | null;
  isProUser: boolean;
  activeTool: Tool;
}

const ResultDisplay: React.FC<{
    image: string;
    isProUser: boolean;
    onDownload: () => void;
}> = ({ image, isProUser, onDownload }) => {
    return (
        <div className="relative group w-full h-full">
            <img src={image} alt="Generated result" className="object-contain w-full h-full rounded-lg" />
            {!isProUser && (
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    My Face AI
                </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                 <button onClick={onDownload} className="bg-indigo-600 p-3 rounded-full text-white hover:bg-indigo-500 transition-colors">
                    <DownloadIcon className="w-6 h-6" />
                 </button>
                 <button className="bg-indigo-600 p-3 rounded-full text-white hover:bg-indigo-500 transition-colors">
                    <ShareIcon className="w-6 h-6" />
                 </button>
            </div>
        </div>
    );
};

const AnalysisDisplay: React.FC<{ result: FacialAnalysisResult }> = ({ result }) => {
  return (
    <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md mx-auto text-center border border-gray-700">
      <h3 className="text-2xl font-bold text-indigo-400 mb-6">Facial Analysis Results</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-baseline bg-gray-700 p-4 rounded-md">
          <span className="text-gray-300">Face Shape:</span>
          <span className="text-xl font-semibold text-white">{result.faceShape}</span>
        </div>
        <div className="flex justify-between items-baseline bg-gray-700 p-4 rounded-md">
          <span className="text-gray-300">Symmetry Score:</span>
          <span className="text-xl font-semibold text-white">{result.symmetryScore} / 100</span>
        </div>
        <div className="flex justify-between items-baseline bg-gray-700 p-4 rounded-md">
          <span className="text-gray-300">Youthfulness Score:</span>
          <span className="text-xl font-semibold text-white">{result.youthfulnessScore} / 100</span>
        </div>
      </div>
    </div>
  );
};


export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  originalImage,
  generatedImage,
  analysisResult,
  onImageUpload,
  isLoading,
  error,
  isProUser,
  activeTool
}) => {
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `myfaceai_result.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <div className="flex-grow bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center relative min-h-[400px] md:min-h-0">
      {isLoading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 rounded-lg">
          <Spinner />
          <p className="mt-4 text-lg">AI is thinking...</p>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/80 text-white p-3 rounded-lg z-30 text-center">
            {error}
        </div>
      )}
      
      {!originalImage && <ImageUploader onImageUpload={onImageUpload} />}

      {originalImage && !(generatedImage || analysisResult) && (
         <div className="w-full h-full flex items-center justify-center">
             <img src={originalImage} alt="Uploaded by user" className="max-w-full max-h-full object-contain rounded-lg" />
         </div>
      )}

      {generatedImage && (
        <ResultDisplay image={generatedImage} isProUser={isProUser} onDownload={handleDownload} />
      )}
      
      {analysisResult && (
         <div className="w-full h-full flex flex-col items-center justify-center gap-8">
            <div className="w-1/3 max-w-[200px] flex-shrink-0">
                <img src={originalImage || ''} alt="Analyzed face" className="object-contain w-full h-full rounded-lg shadow-lg"/>
            </div>
            <AnalysisDisplay result={analysisResult} />
        </div>
      )}
    </div>
  );
};
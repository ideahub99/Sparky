// FIX: Implemented the missing EditorCanvas component.
import React from 'react';
import { UndoIcon, RedoIcon, DownloadIcon, ShareIcon } from './icons';
import { Spinner } from './ui/Elements';
import { useTranslation } from '../contexts';

interface EditorCanvasProps {
  originalImage: string; // URL or data URI
  generatedImage: string | null; // URL or data URI
  isLoading: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  onShare: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  originalImage,
  generatedImage,
  isLoading,
  onUndo,
  onRedo,
  onDownload,
  onShare,
  canUndo,
  canRedo,
}) => {
  const { t } = useTranslation();
  const displayImage = generatedImage || originalImage;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-0">
      <div className="relative w-full h-full flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 bg-black/70 z-20 flex flex-col items-center justify-center rounded-2xl">
            <Spinner />
            <p className="mt-4 text-white font-semibold">{t('editor.loading')}</p>
          </div>
        )}
        <img
          src={displayImage}
          alt="User content"
          className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
        />
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-card/80 backdrop-blur-md p-3 rounded-full border border-border shadow-lg">
         <button 
          onClick={onUndo} 
          disabled={!canUndo || isLoading}
          className="p-3 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Undo"
        >
          <UndoIcon className="w-6 h-6" />
        </button>
         <button 
          onClick={onRedo} 
          disabled={!canRedo || isLoading}
          className="p-3 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Redo"
        >
          <RedoIcon className="w-6 h-6" />
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button 
          onClick={onDownload} 
          disabled={!generatedImage || isLoading}
          className="p-3 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Download"
        >
          <DownloadIcon className="w-6 h-6" />
        </button>
        <button 
          onClick={onShare} 
          disabled={!generatedImage || isLoading}
          className="p-3 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Share"
        >
          <ShareIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

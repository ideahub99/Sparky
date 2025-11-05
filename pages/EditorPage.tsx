// FIX: Implemented the missing EditorPage component.
import React, { useState, useMemo, useEffect } from 'react';
import type { Page, Tool, ToolParameters, User, FacialAnalysisResult, Hairstyle } from '../types';
import { useTranslation } from '../contexts';
import { PageHeader, Button, ErrorDisplay, Modal } from '../components/ui/Elements';
import { ImageUploader } from '../components/ImageUploader';
import { EditorCanvas } from '../components/EditorCanvas';
import { ToolSidebar } from '../components/ToolSidebar';
import { AnalysisReport } from '../components/AnalysisReport';
import { transformImage, analyzeFace } from '../services/geminiService';
import { supabase } from '../lib/supabaseClient';

interface EditorPageProps {
  activeTool: Tool;
  goBack: () => void;
  user: User;
  onNavigate: (page: Page) => void;
  onDataRefresh: () => void;
  hairstyles: Hairstyle[];
}

export const EditorPage: React.FC<EditorPageProps> = ({ activeTool, goBack, user, onNavigate, onDataRefresh, hairstyles }) => {
    const { t } = useTranslation();

    const [originalImage, setOriginalImage] = useState<Blob | null>(null);
    const [history, setHistory] = useState<Blob[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [params, setParams] = useState<ToolParameters>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<FacialAnalysisResult | null>(null);
    
    // Modal states
    const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
    
    const originalImageUrl = useMemo(() => originalImage ? URL.createObjectURL(originalImage) : null, [originalImage]);
    const currentImageUrl = useMemo(() => {
        if (historyIndex >= 0 && history[historyIndex]) {
            return URL.createObjectURL(history[historyIndex]);
        }
        return originalImageUrl;
    }, [history, historyIndex, originalImageUrl]);

    const canUndo = historyIndex > -1;
    const canRedo = historyIndex < history.length - 1;

    useEffect(() => {
        // Revoke object URLs on cleanup to prevent memory leaks
        const urlsToRevoke = [originalImageUrl, ...history.map(blob => URL.createObjectURL(blob))];
        return () => {
            urlsToRevoke.forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [originalImageUrl, history]);
    
    const handleImageConfirm = (image: Blob) => {
        setOriginalImage(image);
    };

    const handleGenerate = async () => {
        if (!originalImage) {
            setError(t('editor.error.no_image'));
            return;
        }

        if (user.credits < 1) {
            setShowNoCreditsModal(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        const imageToProcess = historyIndex > -1 ? history[historyIndex] : originalImage;

        try {
            if (activeTool.type === 'ANALYSIS') {
                const result = await analyzeFace(imageToProcess);
                setAnalysisResult(result);
            } else {
                const base64Image = await transformImage(imageToProcess, activeTool, params);
                const byteString = atob(base64Image);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const newImageBlob = new Blob([ab], { type: 'image/png' });
                
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(newImageBlob);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }

            // Deduct credit
            await supabase
              .from('users')
              .update({ credits: user.credits - 1 })
              .eq('id', user.id);
            
            await supabase.from('credit_usage').insert({
              user_id: user.id,
              tool_id: activeTool.id,
              credits_used: 1,
            });

            onDataRefresh();

        } catch (e: any) {
            setError(e.message || t('editor.error.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleUndo = () => canUndo && setHistoryIndex(historyIndex - 1);
    const handleRedo = () => canRedo && setHistoryIndex(historyIndex + 1);

    const handleDownload = () => {
        if (!currentImageUrl) return;
        const a = document.createElement('a');
        a.href = currentImageUrl;
        a.download = `sparky-edit-${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleShare = async () => {
        if (!currentImageUrl) return;
        try {
            const blob = await fetch(currentImageUrl).then(res => res.blob());
            const file = new File([blob], 'sparky-edit.png', { type: blob.type });
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: t('editor.share_title'),
                    text: t('editor.share_text'),
                    files: [file],
                });
            } else {
                setError(t('editor.error.share_failed'));
            }
        } catch (e) {
            console.error(e);
            setError(t('editor.error.share_failed'));
        }
    };
    
    if (!originalImage || !originalImageUrl) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title={t(activeTool.name)} onBack={goBack} />
                <ImageUploader onImageConfirm={handleImageConfirm} />
            </div>
        );
    }

    if (analysisResult) {
        return <AnalysisReport result={analysisResult} onDone={() => setAnalysisResult(null)} />;
    }

    return (
        <div className="flex flex-col h-full">
            <PageHeader title={t(activeTool.name)} onBack={goBack} />
            <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0">
                <EditorCanvas 
                    originalImage={originalImageUrl}
                    generatedImage={currentImageUrl}
                    isLoading={isLoading}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onDownload={handleDownload}
                    onShare={handleShare}
                    canUndo={canUndo}
                    canRedo={canRedo}
                />
                <ToolSidebar 
                    tools={[]}
                    activeTool={activeTool}
                    setActiveTool={() => {}}
                    params={params}
                    setParams={setParams}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                    isDisabled={!originalImage || isLoading}
                    hairstyles={hairstyles}
                />
            </div>
             {error && (
                <div className="absolute bottom-24 left-4 right-4 z-30">
                    <ErrorDisplay message={error} />
                </div>
            )}
            {showNoCreditsModal && (
                <Modal title={t('modal.no_credits.title')} onClose={() => setShowNoCreditsModal(false)}>
                    <p className="text-muted-foreground mb-6 text-center">{t('modal.no_credits.text')}</p>
                    <Button className="w-full" onClick={() => { setShowNoCreditsModal(false); onNavigate('subscription'); }}>
                        {t('modal.no_credits.button')}
                    </Button>
                </Modal>
            )}
        </div>
    );
};

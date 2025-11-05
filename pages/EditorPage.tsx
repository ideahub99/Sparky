
import React, { useState, useCallback, useEffect } from 'react';
import type { User, Tool, ToolParameters, FacialAnalysisResult, Page, Hairstyle } from '../types';
import { useTranslation } from '../contexts';
import { applyImageModification, analyzeFace } from '../services/geminiService';
import { PageHeader, Button, Modal } from '../components/ui/Elements';
import { EditorCanvas } from '../components/EditorCanvas';
import { ToolControls } from '../components/ToolControls';

export const EditorPage: React.FC<{
  activeTool: Tool;
  goBack: () => void;
  user: User;
  onNavigate: (page: Page) => void;
  onDataRefresh: () => void;
  hairstyles: Hairstyle[];
}> = ({ activeTool, goBack, user, onNavigate, onDataRefresh }) => {
  const { t } = useTranslation();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FacialAnalysisResult | null>(null);
  const [params, setParams] = useState<ToolParameters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  
  const isProUser = user.plan.name !== 'Free';

  const handleImageUpload = (base64Image: string) => {
    setOriginalImage(base64Image);
    setGeneratedImage(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleGenerate = useCallback(async () => {
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
    setGeneratedImage(null);
    setAnalysisResult(null);

    try {
      if (activeTool.type === 'ANALYSIS') {
        const result = await analyzeFace(originalImage);
        setAnalysisResult(result);
      } else {
        const result = await applyImageModification(originalImage, activeTool, params);
        setGeneratedImage(result);
      }
      onDataRefresh();
    } catch (e: any) {
      setError(e.message || t('editor.error.generic'));
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, activeTool, params, user.credits, onDataRefresh, t]);

  const isDisabled = isLoading || !originalImage || user.credits < 1;
  
  useEffect(() => {
    setError(null);
    setParams({});
  }, [activeTool.id]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <PageHeader title={t(activeTool.name)} onBack={goBack} />

      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex-grow min-h-[300px] flex">
            <EditorCanvas
                originalImage={originalImage}
                generatedImage={generatedImage}
                analysisResult={analysisResult}
                onImageUpload={handleImageUpload}
                isLoading={isLoading}
                error={error}
                isProUser={isProUser}
                activeTool={activeTool}
            />
        </div>
        
        {originalImage && (
            <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-lg font-bold mb-4">{t(activeTool.name)} Controls</h3>
                <ToolControls activeTool={activeTool} params={params} setParams={setParams} />
            </div>
        )}
      </div>

      {originalImage && (
        <div className="p-4 bg-background border-t border-border">
          <p className="text-center text-sm text-muted-foreground mb-2">{t('editor.credit_cost', {remaining: Math.max(0, user.credits - (isLoading ? 1 : 0))})}</p>
          <Button onClick={handleGenerate} isLoading={isLoading} disabled={isDisabled} className="w-full !py-4">
            {isLoading 
              ? t('editor.button_applying') 
              : (activeTool.type === 'ANALYSIS' 
                  ? t('editor.button_analyzing') 
                  : t('editor.button_apply_filter'))
            }
          </Button>
        </div>
      )}

      {showNoCreditsModal && (
        <Modal title={t('modal.no_credits.title')} onClose={() => setShowNoCreditsModal(false)}>
            <p className="text-muted-foreground mb-6 text-center">{t('modal.no_credits.text')}</p>
            <Button className="w-full" onClick={() => {
                setShowNoCreditsModal(false);
                onNavigate('subscription');
            }}>
                {t('modal.no_credits.button')}
            </Button>
        </Modal>
      )}
    </div>
  );
};

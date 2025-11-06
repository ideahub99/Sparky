import React from 'react';
import type { Tool, ToolParameters, Hairstyle } from '../types';
import { Button } from './ui/Elements';
import { ToolControls } from './ToolControls';
import { useTranslation } from '../contexts';

interface ToolSidebarProps {
  activeTool: Tool;
  params: ToolParameters;
  setParams: (params: ToolParameters) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isDisabled: boolean;
  hairstyles: Hairstyle[];
}

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
  activeTool,
  params,
  setParams,
  onGenerate,
  isLoading,
  isDisabled,
  hairstyles,
}) => {
  const { t } = useTranslation();
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
      <h3 className="text-lg font-bold mb-4">{`${t(activeTool.name)} ${t('editor.controls_suffix')}`}</h3>
      <div className="flex-grow">
        <ToolControls activeTool={activeTool} params={params} setParams={setParams} hairstyles={hairstyles} />
      </div>
      <div className="mt-auto pt-4 border-t border-border">
        <Button onClick={onGenerate} isLoading={isLoading} disabled={isDisabled} className="w-full">
          {isLoading ? t('editor.loading') : t('uploader.generate_button')}
        </Button>
      </div>
    </div>
  );
};
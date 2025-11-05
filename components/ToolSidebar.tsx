import React from 'react';
import type { Tool, ToolParameters, Hairstyle } from '../types';
import { Button } from './ui/Elements';
import { ToolControls } from './ToolControls';

interface ToolSidebarProps {
  tools: Tool[];
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  params: ToolParameters;
  setParams: (params: ToolParameters) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isDisabled: boolean;
  hairstyles: Hairstyle[];
}

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
  tools,
  activeTool,
  setActiveTool,
  params,
  setParams,
  onGenerate,
  isLoading,
  isDisabled,
  hairstyles,
}) => {
  return (
    <aside className="w-full md:w-96 bg-gray-800 rounded-lg p-6 flex flex-col gap-6 self-start">
      <div>
        <h2 className="text-lg font-semibold mb-4 text-indigo-300">Tools</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool)}
              className={`flex flex-col items-center justify-center text-center p-3 rounded-lg transition-colors aspect-square ${
                activeTool.id === tool.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title={tool.name}
            >
              <tool.icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-lg font-semibold mb-4 text-indigo-300">{activeTool.name} Controls</h3>
        {/* FIX: Pass hairstyles to ToolControls */}
        <ToolControls activeTool={activeTool} params={params} setParams={setParams} hairstyles={hairstyles} />
      </div>

      <div className="mt-auto pt-6 border-t border-gray-700">
        <Button onClick={onGenerate} isLoading={isLoading} disabled={isDisabled} className="w-full">
          {isLoading ? 'Generating...' : 'Generate'}
        </Button>
      </div>
    </aside>
  );
};
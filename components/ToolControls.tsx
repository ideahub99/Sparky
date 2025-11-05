
import React from 'react';
import type { Tool, ToolParameters } from '../types';
import { Slider } from './ui/Elements';

interface ToolControlsProps {
  activeTool: Tool;
  params: ToolParameters;
  setParams: (params: ToolParameters) => void;
}

export const ToolControls: React.FC<ToolControlsProps> = ({ activeTool, params, setParams }) => {

  const handleParamChange = <K extends keyof ToolParameters,>(param: K, value: ToolParameters[K]) => {
    setParams({ ...params, [param]: value });
  };
  
  if (activeTool.type === 'ANALYSIS') {
    return <p className="text-gray-400 text-sm">{activeTool.description}</p>;
  }

  return (
    <div className="space-y-6">
      {activeTool.id === 'hairstyle' && (
        <>
          <div>
            <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-2">Style</label>
            <input
              type="text"
              id="style"
              value={params.style || ''}
              onChange={(e) => handleParamChange('style', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Short Buzz Cut"
            />
          </div>
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <input
              type="text"
              id="color"
              value={params.color || ''}
              onChange={(e) => handleParamChange('color', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Platinum Blonde"
            />
          </div>
        </>
      )}

      {['beard', 'bald', 'fat', 'smile'].includes(activeTool.id) && (
        <div>
          <label htmlFor="intensity" className="block text-sm font-medium text-gray-300 mb-2">Intensity</label>
          <Slider
            min={0}
            max={100}
            value={params.intensity || 50}
            onChange={(e) => handleParamChange('intensity', Number(e.target.value))}
          />
        </div>
      )}

      {activeTool.id === 'age' && (
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-300 mb-2">Target Age</label>
          <Slider
            min={10}
            max={90}
            value={params.age || 40}
            onChange={(e) => handleParamChange('age', Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
};

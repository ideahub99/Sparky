import React, { useState, useMemo, useEffect } from 'react';
import type { Tool, ToolParameters, Hairstyle } from '../types';
import { useTranslation } from '../contexts';
import { Slider } from './ui/Elements';
import { HAIR_COLORS, SKIN_COLORS } from '../constants/tools';
import { CrownIcon } from './icons';

// --- Helper Components for Controls ---

const ColorPalette: React.FC<{
  colors: (string | { name: string; hex: string })[];
  selectedColor?: string;
  onSelect: (color: string) => void;
}> = ({ colors, selectedColor, onSelect }) => (
  <div className="flex flex-wrap gap-4 mt-2">
    {colors.map(colorItem => {
      const color = typeof colorItem === 'string' ? colorItem : colorItem.hex;
      const name = typeof colorItem === 'string' ? color : colorItem.name;
      return (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className={`w-10 h-10 rounded-full border border-border/50 transition-transform duration-150 focus:outline-none ${selectedColor === color ? 'ring-2 ring-offset-2 ring-accent ring-offset-card' : ''}`}
          style={{ 
            backgroundColor: color,
          }}
          aria-label={`Select color ${name}`}
          title={name}
        />
      )
    })}
  </div>
);

const SegmentedControl: React.FC<{
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
}> = ({ options, selectedValue, onSelect }) => {
  const { t } = useTranslation();
  return (
    <div className="flex w-full bg-muted p-1 rounded-lg">
      {options.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onSelect(value)}
          className={`w-full text-center text-sm font-semibold p-2 rounded-md transition-colors ${
            selectedValue === value ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:bg-background/50'
          }`}
        >
          {t(label)}
        </button>
      ))}
    </div>
  );
};

const HairstyleBrowser: React.FC<{
  hairstyles: Hairstyle[];
  selectedStyle?: string;
  onSelect: (styleName: string) => void;
}> = ({ hairstyles, selectedStyle, onSelect }) => {
    const { t } = useTranslation();
    const [gender, setGender] = useState<'female' | 'male'>('female');

    const categories = useMemo(() => {
        const genderHairstyles = hairstyles.filter(h => h.gender === gender);
        // FIX: Filter out any empty/falsy category names and sort them for a consistent UI.
        const uniqueCategories = [...new Set(genderHairstyles.map(h => h.category).filter(Boolean))];
        uniqueCategories.sort();
        return ['All', ...uniqueCategories];
    }, [hairstyles, gender]);
    
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredHairstyles = useMemo(() => {
        return hairstyles.filter(h => {
            if (h.gender !== gender) return false;
            if (activeCategory === 'All' && h.category !== 'Styled') return true; // Exclude 'Styled' from 'All' for male
            if (activeCategory === 'All') return true;
            return h.category === activeCategory;
        });
    }, [hairstyles, gender, activeCategory]);

    // FIX: useEffect was used but not imported.
    useEffect(() => {
      setActiveCategory('All');
    }, [gender]);

    return (
      <div className="space-y-4">
        <SegmentedControl
          options={[{ label: 'editor.hairstyle.female', value: 'female' }, { label: 'editor.hairstyle.male', value: 'male' }]}
          selectedValue={gender}
          onSelect={(value) => setGender(value as 'female' | 'male')}
        />
        <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-sm font-semibold rounded-full flex-shrink-0 ${
                activeCategory === category ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <span className="whitespace-nowrap">{t(`editor.hairstyle.category.${category.toLowerCase()}`)}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {filteredHairstyles.map(style => (
                <div 
                    key={style.id} 
                    onClick={() => onSelect(style.name)} 
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 bg-muted ${selectedStyle === style.name ? 'border-accent' : 'border-transparent'}`}
                >
                    <img src={style.imageUrl} alt={style.name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'}/>
                    {style.isPro && (
                        <div className="absolute top-1.5 right-1.5 bg-accent/80 backdrop-blur-sm rounded-full p-1 shadow-lg">
                            <CrownIcon className="w-3 h-3 text-white" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <p className="absolute bottom-1.5 left-1.5 right-1.5 text-xs font-bold text-white text-center leading-tight">{style.name}</p>
                </div>
            ))}
        </div>
      </div>
    );
};


// --- Main ToolControls Component ---

interface ToolControlsProps {
  activeTool: Tool;
  params: ToolParameters;
  setParams: (params: ToolParameters) => void;
  hairstyles: Hairstyle[];
}

export const ToolControls: React.FC<ToolControlsProps> = ({ activeTool, params, setParams, hairstyles }) => {
  const { t } = useTranslation();

  const handleParamChange = <K extends keyof ToolParameters,>(param: K, value: ToolParameters[K]) => {
    setParams({ ...params, [param]: value });
  };
  
  if (activeTool.type === 'ANALYSIS') {
    return <p className="text-muted-foreground text-sm">{t(activeTool.description)}</p>;
  }

  const renderControls = () => {
    switch(activeTool.id) {
        case 'hairstyle':
            return (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">{t('editor.hairstyle.title')}</label>
                        <HairstyleBrowser 
                            hairstyles={hairstyles}
                            selectedStyle={params.style}
                            onSelect={(styleName) => handleParamChange('style', styleName)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">{t('editor.hair_color.title')}</label>
                        <ColorPalette 
                            colors={HAIR_COLORS} 
                            selectedColor={params.color} 
                            onSelect={(color) => handleParamChange('color', color)}
                        />
                    </div>
                </div>
            );
        case 'hair-color':
        case 'eye-color':
             return (
                <div>
                    <label className="block text-sm font-bold text-foreground mb-2">{activeTool.id === 'hair-color' ? t('editor.hair_color.select_title') : t('editor.eye_color.select_title')}</label>
                    <ColorPalette 
                        colors={HAIR_COLORS} 
                        selectedColor={params.color} 
                        onSelect={(color) => handleParamChange('color', color)}
                    />
                </div>
            );
        case 'skin-color':
            return (
                <div>
                    <label className="block text-sm font-bold text-foreground mb-2">{t('editor.skin_tone.title')}</label>
                    <ColorPalette 
                        colors={SKIN_COLORS} 
                        selectedColor={params.skinTone} 
                        onSelect={(color) => handleParamChange('skinTone', color)}
                    />
                </div>
            );
        case 'age':
            return (
                <div>
                    <label htmlFor="age" className="block text-sm font-bold text-foreground mb-2">{t('editor.age.subtitle')}</label>
                    <Slider
                        min={10} max={90} value={params.age || 40}
                        onChange={(e) => handleParamChange('age', Number(e.target.value))}
                    />
                </div>
            );
        case 'beard':
             return (
                <div>
                    <label className="block text-sm font-bold text-foreground mb-2">{t('editor.beard.title')}</label>
                    <SegmentedControl
                        options={[
                            { label: 'editor.beard.Clean_Shaven', value: 'Clean Shaven' },
                            { label: 'editor.beard.Stubble', value: 'Stubble' },
                            { label: 'editor.beard.Goatee', value: 'Goatee' }
                        ]}
                        selectedValue={params.beardStyle || 'Stubble'}
                        onSelect={(value) => handleParamChange('beardStyle', value as any)}
                    />
                </div>
            );
        case 'halloween':
             return (
                <div>
                    <label className="block text-sm font-bold text-foreground mb-2">{t('editor.halloween.title')}</label>
                    <SegmentedControl
                        options={[
                            { label: 'editor.halloween.face_only', value: 'face only' },
                            { label: 'editor.halloween.whole_figure', value: 'whole figure' },
                            { label: 'editor.halloween.add_objects', value: 'add objects' }
                        ]}
                        selectedValue={params.halloweenStyle || 'face only'}
                        onSelect={(value) => handleParamChange('halloweenStyle', value as any)}
                    />
                </div>
            );
        case 'smile':
        case 'fat':
        case 'bald':
            const titleMap = {
                smile: t('editor.smile.title'),
                fat: t('editor.fat.title'),
                bald: t('editor.bald.title'),
            };
            return (
                <div>
                    <label htmlFor="intensity" className="block text-sm font-bold text-foreground mb-2">{titleMap[activeTool.id]}</label>
                    <Slider
                        min={0} max={100} value={params.intensity || 50}
                        onChange={(e) => handleParamChange('intensity', Number(e.target.value))}
                    />
                </div>
            );
        default:
            return null;
    }
  };

  return <div className="space-y-6">{renderControls()}</div>;
};
import React from 'react';
import type { FacialAnalysisResult } from '../types';
import { useTranslation } from '../contexts';
import { Button, PageHeader } from './ui/Elements';
import { StarIcon, ScaleIcon, GiftIcon, SunIcon, UserIcon } from './icons';

export const AnalysisReport: React.FC<{ result: FacialAnalysisResult; onDone: () => void; }> = ({ result, onDone }) => {
    const { t } = useTranslation();

    const metrics = [
        { key: 'golden_ratio', label: t('analysis.metric.golden_ratio'), score: result.goldenRatioScore, icon: StarIcon },
        { key: 'symmetry', label: t('analysis.metric.symmetry'), score: result.symmetryScore, icon: ScaleIcon },
        { key: 'youthfulness', label: t('analysis.metric.youthfulness'), score: result.youthfulnessScore, icon: GiftIcon },
        { key: 'skin_clarity', label: t('analysis.metric.skin_clarity'), score: result.skinClarity, icon: SunIcon },
        { key: 'skin_evenness', label: t('analysis.metric.skin_evenness'), score: result.skinEvennessScore, icon: SunIcon },
        { key: 'jawline', label: t('analysis.metric.jawline'), score: result.jawlineDefinitionScore, icon: UserIcon },
        { key: 'cheekbones', label: t('analysis.metric.cheekbones'), score: result.cheekboneProminenceScore, icon: UserIcon },
        { key: 'lips', label: t('analysis.metric.lips'), score: result.lipFullnessScore, icon: UserIcon },
    ];

    return (
        <div className="p-4 flex flex-col h-full">
            <PageHeader title={t('analysis.report_title')} showBack={false} />
            <div className="flex-grow overflow-y-auto space-y-6 scrollbar-hide">
                <div className="bg-card border border-border rounded-2xl p-4">
                    <h3 className="font-bold text-lg mb-3">{t('analysis.insights_title')}</h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">{t('analysis.face_shape')}</p>
                            <p className="font-bold text-lg">{result.faceShape}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">{t('analysis.perceived_age')}</p>
                            <p className="font-bold text-lg">{result.perceivedAge}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">{t('analysis.expression')}</p>
                            <p className="font-bold text-lg">{result.emotionalExpression}</p>
                        </div>
                    </div>
                     <p className="text-muted-foreground mt-4 text-sm">{result.overallAnalysis}</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4">
                    <h3 className="font-bold text-lg mb-4">{t('analysis.metrics_title')}</h3>
                    <div className="space-y-4">
                        {metrics.map(metric => (
                            <div key={metric.key}>
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-semibold text-sm flex items-center gap-2"><metric.icon className="w-4 h-4 text-muted-foreground" />{metric.label}</p>
                                    <p className="font-bold text-sm text-accent">{metric.score} / 100</p>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5">
                                    <div className="bg-accent h-2.5 rounded-full" style={{ width: `${metric.score}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             <div className="pt-4">
                <Button onClick={onDone} className="w-full !py-4">{t('editor.done_button')}</Button>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Strain, AIResponse, StructuredGrowTips } from '@/types';
import { useTranslation } from 'react-i18next';
import { geminiService } from '@/services/geminiService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppDispatch } from '@/stores/store';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { useGetStrainTipsMutation, useGenerateStrainImageMutation } from '@/stores/api';

const StructuredTipDisplay: React.FC<{ tips: StructuredGrowTips; onSave: () => void; isSaved: boolean }> = ({ tips, onSave, isSaved }) => {
    const { t } = useTranslation();

    const tipCategories = [
        { key: 'nutrientTip', icon: <PhosphorIcons.Flask />, label: t('strainsView.tips.form.categories.nutrientTip') },
        { key: 'trainingTip', icon: <PhosphorIcons.Scissors />, label: t('strainsView.tips.form.categories.trainingTip') },
        { key: 'environmentalTip', icon: <PhosphorIcons.Fan />, label: t('strainsView.tips.form.categories.environmentalTip') },
        { key: 'proTip', icon: <PhosphorIcons.Sparkle />, label: t('strainsView.tips.form.categories.proTip') },
    ];

    return (
        <Card className="bg-slate-800 animate-fade-in">
            <div className="space-y-4">
                {tipCategories.map(cat => (
                    <div key={cat.key}>
                        <h4 className="font-bold text-primary-300 flex items-center gap-2 mb-1">
                           {cat.icon} {cat.label}
                        </h4>
                        <p className="text-sm text-slate-300 pl-8">{tips[cat.key as keyof StructuredGrowTips]}</p>
                    </div>
                ))}
            </div>
            <div className="text-right mt-4">
                <Button size="sm" variant="secondary" onClick={onSave} disabled={isSaved}>
                    {isSaved ? <><PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" weight="fill" /> {t('strainsView.tips.saved')}</> : <><PhosphorIcons.ArchiveBox className="w-4 h-4 mr-1.5" /> {t('strainsView.tips.saveButton')}</>}
                </Button>
            </div>
        </Card>
    );
};

interface StrainAiTipsProps {
    strain: Strain;
    onSaveTip: (strain: Strain, tip: AIResponse, imageUrl?: string) => void;
}

export const StrainAiTips: React.FC<StrainAiTipsProps> = ({ strain, onSaveTip }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    
    const [getStrainTips, { data: tip, isLoading: isTextLoading, error: textError }] = useGetStrainTipsMutation();
    const [generateStrainImage, { data: imageBase64, isLoading: isImageLoading, error: imageError }] = useGenerateStrainImageMutation();
    
    const isLoading = isTextLoading || isImageLoading;
    const error = textError || imageError;

    const [loadingMessage, setLoadingMessage] = useState('');
    const [isTipSaved, setIsTipSaved] = useState(false);
    const [tipRequest, setTipRequest] = useState({
        focus: 'overall',
        stage: 'all',
        experience: 'advanced'
    });

    const hasGeneratedOnce = !!tip || !!imageBase64;

    useEffect(() => {
        setIsTipSaved(false);
    }, [strain]);
    
    useEffect(() => {
        if (isLoading) {
            const messages = geminiService.getDynamicLoadingMessages({ 
                useCase: 'growTips',
                data: {
                    strainName: strain.name,
                    focus: t(`strainsView.tips.form.focusOptions.${tipRequest.focus}`),
                    stage: t(`strainsView.tips.form.stageOptions.${tipRequest.stage}`)
                }
            });
            let messageIndex = 0;
            const updateLoadingMessage = () => {
                setLoadingMessage(messages[messageIndex % messages.length]);
                messageIndex++;
            };
            
            updateLoadingMessage();
            const intervalId = setInterval(updateLoadingMessage, 2000);
            return () => clearInterval(intervalId);
        }
    }, [isLoading, t, strain.name, tipRequest]);

    const handleGetAiTips = () => {
        setIsTipSaved(false);
        const focusText = t(`strainsView.tips.form.focusOptions.${tipRequest.focus}`);
        const stageText = t(`strainsView.tips.form.stageOptions.${tipRequest.stage}`);
        const experienceText = t(`strainsView.tips.form.experienceOptions.${tipRequest.experience}`);
        getStrainTips({strain, context: { focus: focusText, stage: stageText, experience: experienceText }});
        generateStrainImage(strain);
    };

    const handleSaveTip = () => {
        if (!tip) return;
        const title = t('strainsView.tips.getTipsFor', { name: strain.name });
        const content = `
            <h3>${t('strainsView.tips.form.categories.nutrientTip')}</h3><p>${tip.nutrientTip}</p>
            <h3>${t('strainsView.tips.form.categories.trainingTip')}</h3><p>${tip.trainingTip}</p>
            <h3>${t('strainsView.tips.form.categories.environmentalTip')}</h3><p>${tip.environmentalTip}</p>
            <h3>${t('strainsView.tips.form.categories.proTip')}</h3><p>${tip.proTip}</p>
        `;
        const imageUrl = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined;
        onSaveTip(strain, { title, content }, imageUrl);
        setIsTipSaved(true);
    };

    return (
        <Card>
            <h3 className="text-lg font-bold text-primary-400 flex items-center gap-2 mb-2">{t('strainsView.tips.form.title')}</h3>
            <p className="text-sm text-slate-400 mb-4">{t('strainsView.tips.form.description')}</p>
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">{t('strainsView.tips.form.focus')}</label>
                        <select value={tipRequest.focus} onChange={e => setTipRequest(p => ({...p, focus: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm">
                            {Object.keys(t('strainsView.tips.form.focusOptions', { returnObjects: true })).map(k => <option key={k} value={k}>{t(`strainsView.tips.form.focusOptions.${k}`)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">{t('strainsView.tips.form.stage')}</label>
                        <select value={tipRequest.stage} onChange={e => setTipRequest(p => ({...p, stage: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm">
                            {Object.keys(t('strainsView.tips.form.stageOptions', { returnObjects: true })).map(k => <option key={k} value={k}>{t(`strainsView.tips.form.stageOptions.${k}`)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">{t('strainsView.tips.form.experience')}</label>
                        <select value={tipRequest.experience} onChange={e => setTipRequest(p => ({...p, experience: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm">
                            {Object.keys(t('strainsView.tips.form.experienceOptions', { returnObjects: true })).map(k => <option key={k} value={k}>{t(`strainsView.tips.form.experienceOptions.${k}`)}</option>)}
                        </select>
                    </div>
                </div>
                <Button size="sm" onClick={handleGetAiTips} disabled={isLoading} className="w-full">
                    {isLoading ? loadingMessage : (hasGeneratedOnce ? t('common.regenerate') : t('strainsView.tips.form.generate'))}
                </Button>
                
                {isLoading && <AiLoadingIndicator loadingMessage={loadingMessage} />}
                {error && !isLoading && <div className="text-center text-sm text-red-400">{'message' in error ? (error as any).message : t('ai.error.unknown')}</div>}

                {isImageLoading ? (
                    <SkeletonLoader className="w-full h-64 rounded-lg" />
                ) : (
                    imageBase64 && (
                        <div className="mt-4 animate-fade-in">
                            <img src={`data:image/jpeg;base64,${imageBase64}`} alt={t('ai.prompts.strainImage', { strainName: strain.name })} className="rounded-lg w-full" />
                        </div>
                    )
                )}
                
                {isTextLoading && !tip ? (
                     <div className="mt-4"><SkeletonLoader count={4} /></div>
                ) : (
                    tip && (
                        <StructuredTipDisplay tips={tip} onSave={handleSaveTip} isSaved={isTipSaved} />
                    )
                )}
            </div>
        </Card>
    );
};

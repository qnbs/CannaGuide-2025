import React, { useState, useEffect } from 'react';
import { Strain, StructuredGrowTips } from '@/types';
import { useTranslation } from 'react-i18next';
import { geminiService } from '@/services/geminiService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { useGetStrainTipsMutation, useGenerateStrainImageMutation } from '@/stores/api';
import { selectLanguage } from '@/stores/selectors';
import { Speakable } from '@/components/common/Speakable';
import { addStrainTip } from '@/stores/slices/savedItemsSlice';
import { Select } from '@/components/ui/ThemePrimitives';
import { SegmentedControl } from '@/components/common/SegmentedControl';

const StructuredTipDisplay: React.FC<{ tips: StructuredGrowTips; onSave: () => void; isSaved: boolean; strainId: string; }> = ({ tips, onSave, isSaved, strainId }) => {
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
                {tipCategories.map(cat => {
                    const tipContent = tips[cat.key as keyof StructuredGrowTips];
                    if (!tipContent) return null;
                    return (
                        <div key={cat.key}>
                             <h4 className="font-bold text-primary-300 flex items-center gap-2 mb-1">
                               {cat.icon} {cat.label}
                            </h4>
                            <Speakable elementId={`strain-tip-${strainId}-${cat.key}`}>
                                <p className="text-sm text-slate-300 pl-8">{tipContent}</p>
                            </Speakable>
                        </div>
                    )
                 })}
            </div>
            <div className="text-right mt-4">
                <Button size="sm" variant="secondary" onClick={onSave} disabled={isSaved}>
                    {isSaved ? <><PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" weight="fill" /> {t('strainsView.tips.saved')}</> : <><PhosphorIcons.ArchiveBox className="w-4 h-4 mr-1.5" /> {t('strainsView.tips.saveButton')}</>}
                </Button>
            </div>
        </Card>
    );
};

const ImageGenerationControls: React.FC<{
    style: string;
    setStyle: (s: string) => void;
    criteria: { focus: string; composition: string; mood: string };
    setCriteria: (c: { focus: string; composition: string; mood: string }) => void;
}> = ({ style, setStyle, criteria, setCriteria }) => {
    const { t } = useTranslation();

    const styleOptions = Object.keys(t('strainsView.tips.form.imageStyles', { returnObjects: true })).map(k => ({ value: k, label: t(`strainsView.tips.form.imageStyles.${k}`) }));
    const focusOptions = Object.keys(t('strainsView.tips.form.imageFocusOptions', { returnObjects: true })).map(k => ({ value: k, label: t(`strainsView.tips.form.imageFocusOptions.${k}`) }));
    const compositionOptions = Object.keys(t('strainsView.tips.form.imageCompositionOptions', { returnObjects: true })).map(k => ({ value: k, label: t(`strainsView.tips.form.imageCompositionOptions.${k}`) }));
    const moodOptions = Object.keys(t('strainsView.tips.form.imageMoodOptions', { returnObjects: true })).map(k => ({ value: k, label: t(`strainsView.tips.form.imageMoodOptions.${k}`) }));

    return (
        <details className="group bg-slate-800/30 rounded-lg p-3 mt-4">
            <summary className="list-none text-sm font-semibold text-slate-300 cursor-pointer flex items-center gap-2">
                 <PhosphorIcons.MagicWand /> {t('strainsView.tips.form.imageCriteria')}
                 <PhosphorIcons.ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180 ml-auto" />
            </summary>
            <div className="pt-4 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">{t('strainsView.tips.form.imageStyle')}</label>
                    <SegmentedControl value={[style]} onToggle={(v) => setStyle(v as string)} options={styleOptions} />
                </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">{t('strainsView.tips.form.imageFocus')}</label>
                    <SegmentedControl value={[criteria.focus]} onToggle={(v) => setCriteria({...criteria, focus: v as string})} options={focusOptions} />
                </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">{t('strainsView.tips.form.imageComposition')}</label>
                    <SegmentedControl value={[criteria.composition]} onToggle={(v) => setCriteria({...criteria, composition: v as string})} options={compositionOptions} />
                </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">{t('strainsView.tips.form.imageMood')}</label>
                    <SegmentedControl value={[criteria.mood]} onToggle={(v) => setCriteria({...criteria, mood: v as string})} options={moodOptions} />
                </div>
            </div>
        </details>
    );
};


interface StrainAiTipsProps {
    strain: Strain;
}

export const StrainAiTips: React.FC<StrainAiTipsProps> = ({ strain }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const lang = useAppSelector(selectLanguage);
    
    const [getStrainTips, { data: tip, isLoading: isTextLoading, error: textError }] = useGetStrainTipsMutation({
        fixedCacheKey: `strain-tip-text-${strain.id}`,
    });
    const [generateStrainImage, { data: imageBase64, isLoading: isImageLoading, error: imageError }] = useGenerateStrainImageMutation({
        fixedCacheKey: `strain-tip-image-${strain.id}`,
    });
    
    const isLoading = isTextLoading || isImageLoading;
    const error = textError || imageError;

    const [loadingMessage, setLoadingMessage] = useState('');
    const [isTipSaved, setIsTipSaved] = useState(false);
    const [tipRequest, setTipRequest] = useState({
        focus: 'overall',
        stage: 'all',
        experienceLevel: 'advanced'
    });
    const [imageStyle, setImageStyle] = useState('random');
    const [imageCriteria, setImageCriteria] = useState({
        focus: 'buds',
        composition: 'dynamic',
        mood: 'mystical'
    });

    const hasGeneratedOnce = !!tip || !!imageBase64;

    useEffect(() => {
        setIsTipSaved(false);
    }, [strain]);
    
    useEffect(() => {
        if (isLoading) {
            const experienceText = t(`strainsView.tips.form.experienceOptions.${tipRequest.experienceLevel}`);
            const messages = geminiService.getDynamicLoadingMessages({ 
                useCase: 'growTips',
                data: {
                    strainName: strain.name,
                    focus: t(`strainsView.tips.form.focusOptions.${tipRequest.focus}`),
                    stage: t(`strainsView.tips.form.stageOptions.${tipRequest.stage}`),
                    experienceLevel: experienceText,
                }
            });
            let messageIndex = 0;
            const updateLoadingMessage = () => {
                setLoadingMessage(messages[messageIndex % messages.length]);
                messageIndex++;
            };
            
            updateLoadingMessage();
            const intervalId = setInterval(updateLoadingMessage, 2500);
            return () => clearInterval(intervalId);
        }
    }, [isLoading, t, strain.name, tipRequest]);

    const handleGetAiTips = () => {
        setIsTipSaved(false);
        const focusText = t(`strainsView.tips.form.focusOptions.${tipRequest.focus}`);
        const stageText = t(`strainsView.tips.form.stageOptions.${tipRequest.stage}`);
        const experienceText = t(`strainsView.tips.form.experienceOptions.${tipRequest.experienceLevel}`);
        getStrainTips({strain, context: { focus: focusText, stage: stageText, experienceLevel: experienceText }, lang});
        generateStrainImage({ strain, style: imageStyle, criteria: imageCriteria });
    };

    const handleSaveTip = () => {
        if (!tip) return;
        const title = t('strainsView.tips.getTipsFor', { name: strain.name });
        const imageUrl = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined;
        dispatch(addStrainTip({ strain, tip, title, imageUrl }));
        setIsTipSaved(true);
    };

    return (
        <Card>
            <h3 className="text-lg font-bold text-primary-400 flex items-center gap-2 mb-2">{t('strainsView.tips.form.title')}</h3>
            <p className="text-sm text-slate-400 mb-4">{t('strainsView.tips.form.description')}</p>
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                        label={t('strainsView.tips.form.focus')}
                        value={tipRequest.focus}
                        onChange={e => setTipRequest(p => ({ ...p, focus: e.target.value as string }))}
                        options={Object.keys(t('strainsView.tips.form.focusOptions', { returnObjects: true })).map(k => ({ value: k, label: t(`strainsView.tips.form.focusOptions.${k}`) }))}
                    />
                    <Select
                        label={t('strainsView.tips.form.stage')}
                        value={tipRequest.stage}
                        onChange={e => setTipRequest(p => ({ ...p, stage: e.target.value as string }))}
                        options={Object.keys(t('strainsView.tips.form.stageOptions', { returnObjects: true })).map(k => ({ value: k, label: t(`strainsView.tips.form.stageOptions.${k}`) }))}
                    />
                    <Select
                        label={t('strainsView.tips.form.experience')}
                        value={tipRequest.experienceLevel}
                        onChange={e => setTipRequest(p => ({ ...p, experienceLevel: e.target.value as string }))}
                        options={Object.keys(t('strainsView.tips.form.experienceOptions', { returnObjects: true })).map(k => ({ value: k, label: t(`strainsView.tips.form.experienceOptions.${k}`) }))}
                    />
                </div>
                <Button size="sm" onClick={handleGetAiTips} disabled={isLoading} className="w-full">
                    {isLoading ? loadingMessage : (hasGeneratedOnce ? t('common.regenerate') : t('strainsView.tips.form.generate'))}
                </Button>

                 <ImageGenerationControls
                    style={imageStyle}
                    setStyle={setImageStyle}
                    criteria={imageCriteria}
                    setCriteria={setImageCriteria}
                />
                
                {isLoading && <AiLoadingIndicator loadingMessage={loadingMessage} />}
                {error && !isLoading && <div className="text-center text-sm text-red-400">{'message' in (error as any) ? (error as any).message : t('ai.error.unknown')}</div>}

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
                        <StructuredTipDisplay tips={tip} onSave={handleSaveTip} isSaved={isTipSaved} strainId={strain.id} />
                    )
                )}
            </div>
        </Card>
    );
};

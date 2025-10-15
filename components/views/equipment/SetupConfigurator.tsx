import React, { useState, useMemo, useEffect, memo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { SavedSetup, Recommendation, RecommendationItem, PlantCount, ExperienceLevel, GrowPriority, RecommendationCategory } from '@/types';
import { geminiService } from '@/services/geminiService';
import { useAppSelector } from '@/stores/store';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { useGetEquipmentRecommendationMutation } from '@/stores/api';
import { selectLanguage } from '@/stores/selectors';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { RangeSlider } from '@/components/common/RangeSlider';
import { Input, FormSection } from '@/components/ui/ThemePrimitives';

interface SetupConfiguratorProps {
    onSaveSetup: (setupData: Omit<SavedSetup, 'id' | 'createdAt' | 'name'>) => void;
}

const Stepper: React.FC<{ currentStep: number; steps: string[] }> = ({ currentStep, steps }) => (
    <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => (
            <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${index + 1 <= currentStep ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        {index + 1}
                    </div>
                    <span className={`text-xs mt-1 transition-colors ${index + 1 <= currentStep ? 'text-primary-300 font-semibold' : 'text-slate-400'}`}>{step}</span>
                </div>
                {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-colors ${index + 1 < currentStep ? 'bg-primary-500' : 'bg-slate-700'}`}></div>
                )}
            </React.Fragment>
        ))}
    </div>
);

const SetupResultDisplay: React.FC<{
    recommendation: Recommendation;
    sourceDetails: Omit<SavedSetup, 'id' | 'createdAt' | 'name' | 'recommendation' | 'totalCost'>['sourceDetails'],
    onSave: () => void;
    onReset: () => void;
}> = memo(({ recommendation, sourceDetails, onSave, onReset }) => {
    const { t } = useTranslation();
    const categoryOrder: RecommendationCategory[] = ['tent', 'light', 'ventilation', 'circulationFan', 'pots', 'soil', 'nutrients', 'extra'];
    const totalCost = (Object.values(recommendation) as (RecommendationItem | string)[]).reduce((sum, item) => {
        if (typeof item === 'object' && item.price) {
            return sum + item.price;
        }
        return sum;
    }, 0);

    const prioritiesText = sourceDetails.priorities.map(p => t(`equipmentView.configurator.priorities.${p}`)).join(', ');

    return (
        <div className="animate-fade-in">
             <h2 className="text-2xl font-bold text-primary-400">{t('equipmentView.configurator.resultsTitle')}</h2>
            <p className="text-slate-300 mb-4 text-sm">{t('equipmentView.configurator.resultsSubtitleAdvanced', {
                plantCount: parseInt(sourceDetails.plantCount, 10),
                experience: t(`strainsView.tips.form.experienceOptions.${sourceDetails.experience}`),
                budget: sourceDetails.budget,
                priorities: prioritiesText
            })}</p>
            
            <div className="space-y-3">
                {categoryOrder.map(key => {
                    const item = recommendation[key as RecommendationCategory];
                    if (!item || typeof item !== 'object' || !item.name) return null;
                    const categoryLabel = t(`equipmentView.configurator.categories.${key}`);
                    return (
                        <div key={key} className="p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1">
                                <div>
                                    <h4 className="font-semibold text-slate-100">{categoryLabel}</h4>
                                    <p className="text-sm text-primary-300">{item.name} {item.watts && `(${item.watts}W)`}</p>
                                </div>
                                <p className="text-sm font-mono font-semibold text-slate-200 flex-shrink-0">{item.price.toFixed(2)} {t('common.units.currency_eur')}</p>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 italic">"{item.rationale}"</p>
                        </div>
                    );
                })}
            </div>
            
            {recommendation.proTip && (
                <div className="p-3 bg-primary-900/30 mt-4 rounded-lg">
                    <h4 className="font-bold text-primary-300 flex items-center gap-2 mb-1">
                        <PhosphorIcons.Sparkle /> {t('strainsView.tips.form.categories.proTip')}
                    </h4>
                    <p className="text-sm text-slate-300">{recommendation.proTip}</p>
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-2xl font-bold">
                    <span>{t('equipmentView.configurator.total')}: </span>
                    <span className="text-primary-400">{totalCost.toFixed(2)} {t('common.units.currency_eur')}</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onReset}>{t('equipmentView.configurator.startOver')}</Button>
                    <Button onClick={onSave} glow>{t('equipmentView.configurator.saveSetup')}</Button>
                </div>
            </div>
        </div>
    );
});


export const SetupConfigurator: React.FC<SetupConfiguratorProps> = ({ onSaveSetup }) => {
    const { t } = useTranslation();
    const lang = useAppSelector(selectLanguage);
    
    const [getEquipmentRecommendation, { data: recommendation, isLoading, error, reset }] = useGetEquipmentRecommendationMutation();

    const [step, setStep] = useState<number>(1);
    const [plantCount, setPlantCount] = useState<PlantCount>('1');
    const [experience, setExperience] = useState<ExperienceLevel>('beginner');
    const [growSpace, setGrowSpace] = useState({ width: 80, depth: 80 });
    const [floweringTypePreference, setFloweringTypePreference] = useState<'autoflower' | 'photoperiod' | 'any'>('any');
    const [budget, setBudget] = useState<number>(1000);
    const [priorities, setPriorities] = useState<GrowPriority[]>([]);
    const [customNotes, setCustomNotes] = useState('');

    const [loadingMessage, setLoadingMessage] = useState('');
    
    const sourceDetails = useMemo(() => ({
        plantCount, experience, budget, priorities, customNotes, growSpace, floweringTypePreference
    }), [plantCount, experience, budget, priorities, customNotes, growSpace, floweringTypePreference]);

    useEffect(() => {
        if (isLoading) {
            const messages = geminiService.getDynamicLoadingMessages({
                useCase: 'equipment',
                data: { 
                    plantCount,
                    experience: t(`strainsView.tips.form.experienceOptions.${experience}`),
                    priorities: priorities.map(p => t(`equipmentView.configurator.priorities.${p}`)).join(', ')
                }
            });
            let messageIndex = 0;
            const intervalId = setInterval(() => {
                setLoadingMessage(messages[messageIndex % messages.length]);
                messageIndex++;
            }, 2500);
            return () => clearInterval(intervalId);
        }
    }, [isLoading, t, plantCount, experience, priorities]);
    
    const handleGenerate = () => {
        const prioritiesText = priorities.map(p => t(`equipmentView.configurator.priorities.${p}`)).join(', ');
        
        const prompt = t('ai.prompts.equipmentRequestAdvanced', {
            plantCount: parseInt(plantCount, 10),
            growSpaceWidth: growSpace.width,
            growSpaceDepth: growSpace.depth,
            experience: t(`strainsView.tips.form.experienceOptions.${experience}`),
            floweringTypePreference,
            budget,
            priorities: prioritiesText || 'a balanced setup',
            customNotes: customNotes || 'None'
        });

        getEquipmentRecommendation({ prompt, lang });
    };

    const handleSaveSetup = () => {
        if (!recommendation) return;
        const totalCost = (Object.values(recommendation) as (RecommendationItem | string)[])
            .reduce((sum, item) => (typeof item === 'object' && item.price) ? sum + item.price : sum, 0);
        
        onSaveSetup({ recommendation, totalCost, sourceDetails });
    };

    const resetFlow = () => {
        setStep(1);
        setPlantCount('1');
        setExperience('beginner');
        setGrowSpace({ width: 80, depth: 80 });
        setFloweringTypePreference('any');
        setBudget(1000);
        setPriorities([]);
        setCustomNotes('');
        reset();
    };

    const handlePriorityToggle = (priority: GrowPriority) => {
        setPriorities(prev => {
            const newPriorities = new Set(prev);
            if(newPriorities.has(priority)) {
                newPriorities.delete(priority);
            } else {
                if (newPriorities.size < 2) {
                    newPriorities.add(priority);
                }
            }
            return Array.from(newPriorities);
        });
    };

    const stepperSteps = [
        t('equipmentView.configurator.step1Title'),
        t('equipmentView.configurator.step2Title'),
        t('equipmentView.configurator.step3Title'),
    ];

    if (isLoading) return <AiLoadingIndicator loadingMessage={loadingMessage} />;
    
    if (error) return (
        <div className="text-center p-8">
            <PhosphorIcons.XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400">{t('equipmentView.configurator.error')}</p>
            <p className="text-sm text-slate-400 mb-4">{'message' in error ? (error as any).message : t('ai.error.unknown')}</p>
            <Button onClick={handleGenerate}>{t('equipmentView.configurator.tryAgain')}</Button>
        </div>
    );

    if (recommendation) return (
        <SetupResultDisplay 
            recommendation={recommendation}
            sourceDetails={sourceDetails}
            onSave={handleSaveSetup}
            onReset={resetFlow}
        />
    );
    
    return (
        <div> 
            <h2 className="text-2xl font-bold font-display text-primary-400">{t('equipmentView.configurator.title')}</h2>
            <p className="text-slate-300 mb-6">{t('equipmentView.configurator.subtitleNew')}</p>
            
            <Stepper currentStep={step} steps={stepperSteps} />

            {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                    <FormSection title={t('equipmentView.configurator.plantCount_other', { count: ''})} defaultOpen>
                        <SegmentedControl value={[plantCount]} onToggle={(v) => setPlantCount(v as PlantCount)} options={[ { value: '1', label: t('equipmentView.configurator.plantCount_one')}, { value: '2', label: t('equipmentView.configurator.plantCount_other', {count: 2})}, { value: '3', label: t('equipmentView.configurator.plantCount_other', {count: 3})} ]} />
                    </FormSection>
                    <FormSection title={t('strainsView.tips.form.experience')} defaultOpen>
                         <SegmentedControl value={[experience]} onToggle={(v) => setExperience(v as ExperienceLevel)} options={Object.keys(t('strainsView.tips.form.experienceOptions', { returnObjects: true })).map(k => ({ value: k as ExperienceLevel, label: t(`strainsView.tips.form.experienceOptions.${k}`) }))} />
                    </FormSection>
                    <FormSection title={t('equipmentView.configurator.growSpaceTitle')} defaultOpen>
                        <p className="text-sm text-slate-400 -mt-2 mb-2 sm:col-span-2">{t('equipmentView.configurator.growSpaceDescription')}</p>
                        <Input label={t('equipmentView.configurator.width')} type="number" value={growSpace.width} onChange={e => setGrowSpace(s => ({...s, width: parseInt(e.target.value, 10) || 0}))} />
                        <Input label={t('equipmentView.configurator.depth')} type="number" value={growSpace.depth} onChange={e => setGrowSpace(s => ({...s, depth: parseInt(e.target.value, 10) || 0}))} />
                    </FormSection>
                     <FormSection title={t('equipmentView.configurator.floweringTypeTitle')} defaultOpen>
                        <SegmentedControl value={[floweringTypePreference]} onToggle={(v) => setFloweringTypePreference(v as any)} options={[ { value: 'any', label: t('equipmentView.configurator.floweringTypeAny')}, { value: 'autoflower', label: t('equipmentView.configurator.floweringTypeAutoflower')}, { value: 'photoperiod', label: t('equipmentView.configurator.floweringTypePhotoperiod')} ]} />
                    </FormSection>
                    <div className="flex justify-end mt-8">
                        <Button onClick={() => setStep(2)}>
                            {t('common.next')} <PhosphorIcons.ArrowRight className="w-4 h-4 ml-2"/>
                        </Button>
                    </div>
                </div>
            )}
            
            {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                     <FormSection title={t('equipmentView.configurator.budgetTitle')} defaultOpen>
                        <RangeSlider label="" min={300} max={5000} step={50} value={budget} onChange={setBudget} unit="€" singleValue />
                    </FormSection>
                    <FormSection title={t('equipmentView.configurator.step3TitleNew')} defaultOpen>
                        <p className="text-sm text-slate-400 -mt-2 mb-2 sm:col-span-2">{t('equipmentView.configurator.priorityDescription')}</p>
                        <div className="sm:col-span-2">
                            <SegmentedControl 
                                value={priorities} 
                                onToggle={handlePriorityToggle} 
                                options={Object.keys(t('equipmentView.configurator.priorities', { returnObjects: true })).map(k => ({ value: k as GrowPriority, label: t(`equipmentView.configurator.priorities.${k}`) }))}
                            />
                        </div>
                    </FormSection>
                    <div className="flex justify-between mt-8">
                         <Button onClick={() => setStep(1)} variant="secondary">
                            <PhosphorIcons.ArrowLeft className="w-4 h-4 mr-2"/> {t('common.back')}
                        </Button>
                        <Button onClick={() => setStep(3)}>
                            {t('common.next')} <PhosphorIcons.ArrowRight className="w-4 h-4 ml-2"/>
                        </Button>
                    </div>
                </div>
            )}

            {step === 3 && (
                 <div className="space-y-6 animate-fade-in">
                    <FormSection title={t('equipmentView.configurator.step4TitleNew')} defaultOpen>
                        <p className="text-sm text-slate-400 -mt-2 mb-2 sm:col-span-2">{t('equipmentView.configurator.customNotesDescription')}</p>
                         <div className="sm:col-span-2">
                            <Input as="textarea" rows={4} value={customNotes} onChange={e => setCustomNotes(e.target.value)} placeholder={t('equipmentView.configurator.customNotesPlaceholder')} />
                         </div>
                    </FormSection>
                    <div className="flex justify-between mt-8">
                         <Button onClick={() => setStep(2)} variant="secondary">
                            <PhosphorIcons.ArrowLeft className="w-4 h-4 mr-2"/> {t('common.back')}
                        </Button>
                         <Button onClick={handleGenerate} glow>
                            <PhosphorIcons.Sparkle className="inline w-5 h-5 mr-2" />
                            {t('equipmentView.configurator.generate')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
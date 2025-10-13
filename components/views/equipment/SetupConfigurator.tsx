import React, { useState, useMemo, useEffect, memo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { SavedSetup, Recommendation, RecommendationCategory, RecommendationItem, PlantCount } from '@/types';
import { geminiService } from '@/services/geminiService';
import { useAppSelector } from '@/stores/store';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { useGetEquipmentRecommendationMutation } from '@/stores/api';
import { selectLanguage } from '@/stores/selectors';

interface SetupConfiguratorProps {
    onSaveSetup: (setupData: Omit<SavedSetup, 'id' | 'createdAt' | 'name'>) => void;
}

type Step = 'plants' | 'budget';
type Budget = 'value' | 'balanced' | 'premium';

const SetupResultDisplay: React.FC<{
    recommendation: Recommendation;
    plantCount: PlantCount;
    budget: Budget;
    onSave: () => void;
    onReset: () => void;
}> = memo(({ recommendation, plantCount, budget, onSave, onReset }) => {
    const { t } = useTranslation();
    const categoryOrder: RecommendationCategory[] = ['tent', 'light', 'ventilation', 'circulationFan', 'pots', 'soil', 'nutrients', 'extra'];
    const totalCost = (Object.values(recommendation) as (RecommendationItem | string)[]).reduce((sum, item) => {
        if (typeof item === 'object' && item.price) {
            return sum + item.price;
        }
        return sum;
    }, 0);

    return (
        <div className="animate-fade-in">
             <h2 className="text-2xl font-bold text-primary-400">{t('equipmentView.configurator.resultsTitle')}</h2>
            <p className="text-slate-300 mb-4 text-sm">{t('equipmentView.configurator.resultsSubtitleNew', {
                plants: plantCount,
                budget: t(`equipmentView.configurator.budgets.${budget}`),
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
    
    const [getEquipmentRecommendation, { data: recommendation, isLoading, error, reset }] = useGetEquipmentRecommendationMutation({
        fixedCacheKey: 'equipment-recommendation',
    });

    const [step, setStep] = useState<Step>('plants');
    const [plantCount, setPlantCount] = useState<PlantCount | null>(null);
    const [budget, setBudget] = useState<Budget | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');

    const sourceDetails = useMemo(() => {
        if (!plantCount || !budget) return null;
        return {
            plants: plantCount,
            budget: budget
        };
    }, [plantCount, budget]);

    useEffect(() => {
        if (isLoading && sourceDetails) {
            const messages = geminiService.getDynamicLoadingMessages({
                useCase: 'equipment',
                data: { configName: `${t(`equipmentView.configurator.budgets.${sourceDetails.budget}`)} for ${sourceDetails.plants} plants` }
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
    }, [isLoading, t, sourceDetails]);
    
    const handleGenerate = () => {
        if (!plantCount || !budget) return;

        const tentSizes: Record<PlantCount, string> = { '1': '60x60cm', '2-3': '100x100cm' };
        const tentSize = tentSizes[plantCount];
        
        const prompt = t('ai.prompts.equipmentRequest', {
            plantCount,
            budget: t(`equipmentView.configurator.budgets.${budget}`),
            tentSize
        });

        getEquipmentRecommendation({ prompt, lang });
    };

    const handleSaveSetup = () => {
        if (!recommendation || !plantCount || !budget) return;
        
        const tentSizes: Record<PlantCount, string> = { '1': '60x60cm', '2-3': '100x100cm' };
        const tentSize = tentSizes[plantCount];

        const totalCost = (Object.values(recommendation) as (RecommendationItem | string)[]).reduce((sum, item) => {
            if (typeof item === 'object' && item.price) {
                return sum + item.price;
            }
            return sum;
        }, 0);
        
        onSaveSetup({
            recommendation,
            totalCost,
            sourceDetails: {
                area: tentSize,
                budget: budget,
                growStyle: '', // Obsolete, but kept for type consistency
                plantCount: plantCount,
            }
        });
    };

    const resetFlow = () => {
        setStep('plants');
        setPlantCount(null);
        setBudget(null);
        reset();
    };
    
    const plantOptions: { value: PlantCount, label: string, icon: React.ReactNode }[] = [
        { value: '1', label: t('equipmentView.configurator.plantCount_one'), icon: <PhosphorIcons.Plant className="w-8 h-8" /> },
        { value: '2-3', label: t('equipmentView.configurator.plantCount_other', { count: 2, range: '2-3' }), icon: <><PhosphorIcons.Plant className="w-8 h-8" /><PhosphorIcons.Plant className="w-8 h-8" /></> },
    ];
    
    const budgetOptions: { value: Budget, label: string, description: string, icon: React.ReactNode }[] = [
        { value: 'value', label: t('equipmentView.configurator.budgets.value'), description: t('equipmentView.configurator.budgetDescriptions.value'), icon: <PhosphorIcons.ChartPieSlice /> },
        { value: 'balanced', label: t('equipmentView.configurator.budgets.balanced'), description: t('equipmentView.configurator.budgetDescriptions.balanced'), icon: <PhosphorIcons.Cube /> },
        { value: 'premium', label: t('equipmentView.configurator.budgets.premium'), description: t('equipmentView.configurator.budgetDescriptions.premium'), icon: <PhosphorIcons.Sparkle /> },
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
            plantCount={plantCount!}
            budget={budget!}
            onSave={handleSaveSetup}
            onReset={resetFlow}
        />
    );
    
    return (
        <div> 
            <h2 className="text-2xl font-bold font-display text-primary-400">{t('equipmentView.configurator.title')}</h2>
            <p className="text-slate-300 mb-6">{t('equipmentView.configurator.subtitleNew')}</p>
            
            {step === 'plants' && (
                <div className="animate-fade-in">
                    <h3 className="text-xl font-semibold text-slate-100 mb-3">{t('equipmentView.configurator.step1TitleNew')}</h3>
                     <div className="space-y-4">
                        {plantOptions.map(opt => (
                             <Card 
                                key={opt.value} 
                                onClick={() => { setPlantCount(opt.value); setStep('budget'); }}
                                className="p-4 text-center cursor-pointer bg-slate-800/50 hover:bg-slate-700/50"
                            >
                                <div className="flex justify-center items-center h-10 mb-2 text-primary-400">{opt.icon}</div>
                                <span className="font-bold text-lg">{opt.label}</span>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            
            {step === 'budget' && (
                <div className="animate-fade-in">
                    <button onClick={() => setStep('plants')} className="text-sm flex items-center gap-1 text-slate-400 hover:text-primary-300 mb-4">
                        <PhosphorIcons.ArrowLeft /> {t('common.back')}
                    </button>
                    <h3 className="text-xl font-semibold text-slate-100 mb-3">{t('equipmentView.configurator.step2TitleNew')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {budgetOptions.map(opt => (
                            <Card 
                                key={opt.value} 
                                onClick={() => setBudget(opt.value)}
                                className={`p-4 text-left h-full flex flex-col cursor-pointer bg-slate-800/50 hover:bg-slate-700/50 ${budget === opt.value ? 'ring-2 ring-primary-500' : 'ring-1 ring-inset ring-transparent'}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-primary-400 w-5 h-5">{opt.icon}</div>
                                    <h4 className="font-bold text-slate-100">{opt.label}</h4>
                                </div>
                                <p className="text-xs text-slate-400 flex-grow">{opt.description}</p>
                            </Card>
                        ))}
                    </div>
                    <div className="flex justify-end mt-8">
                         <Button onClick={handleGenerate} disabled={!budget} glow>
                            <PhosphorIcons.Sparkle className="inline w-5 h-5 mr-2" />
                            {t('equipmentView.configurator.generate')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

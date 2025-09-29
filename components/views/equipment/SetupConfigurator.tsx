import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { SavedSetup, Recommendation, RecommendationCategory, RecommendationItem } from '@/types';
import { geminiService } from '@/services/geminiService';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectEquipmentGenerationState } from '@/stores/selectors';
import { startEquipmentGeneration, resetEquipmentGenerationState } from '@/stores/slices/aiSlice';
import { openSaveSetupModal } from '@/stores/slices/uiSlice';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';

interface SetupConfiguratorProps {
    onSaveSetup: () => void;
}

type Step = 1 | 2;
type PlantCount = '1' | '2-3';
type Budget = 'value' | 'balanced' | 'premium';

export const SetupConfigurator: React.FC<SetupConfiguratorProps> = ({ onSaveSetup }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { isLoading, response: recommendation, error } = useAppSelector(selectEquipmentGenerationState);

    const [step, setStep] = useState<Step>(1);
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

        dispatch(startEquipmentGeneration({ prompt, details: { plantCount, budget } }));
    };

    const handleSaveSetup = () => {
        if (!recommendation || !sourceDetails) return;

        const totalCost = (Object.values(recommendation) as (RecommendationItem | string)[]).reduce((sum, item) => {
            if (typeof item === 'object' && item.price) {
                return sum + item.price;
            }
            return sum;
        }, 0);
        
        dispatch(openSaveSetupModal({
            recommendation,
            totalCost,
            sourceDetails: {
                area: '',
                budget: sourceDetails.budget,
                growStyle: '',
            }
        }));
    };

    const resetFlow = () => {
        setStep(1);
        setPlantCount(null);
        setBudget(null);
        dispatch(resetEquipmentGenerationState());
    };

    const showResults = isLoading || recommendation || error;
    
    const plantOptions: { value: PlantCount, label: string, icon: React.ReactNode }[] = [
        { value: '1', label: t('equipmentView.configurator.plantCount_one'), icon: <PhosphorIcons.Plant className="w-8 h-8" /> },
        { value: '2-3', label: t('equipmentView.configurator.plantCount_other', { count: 2, range: '2-3' }), icon: <><PhosphorIcons.Plant className="w-8 h-8" /><PhosphorIcons.Plant className="w-8 h-8" /></> },
    ];
    
    const budgetOptions: { value: Budget, label: string, description: string, icon: React.ReactNode }[] = [
        { value: 'value', label: t('equipmentView.configurator.budgets.value'), description: t('equipmentView.configurator.budgetDescriptions.value'), icon: <PhosphorIcons.ChartPieSlice /> },
        { value: 'balanced', label: t('equipmentView.configurator.budgets.balanced'), description: t('equipmentView.configurator.budgetDescriptions.balanced'), icon: <PhosphorIcons.Cube /> },
        { value: 'premium', label: t('equipmentView.configurator.budgets.premium'), description: t('equipmentView.configurator.budgetDescriptions.premium'), icon: <PhosphorIcons.Sparkle /> },
    ];

    if (showResults) {
        const categoryOrder: RecommendationCategory[] = ['tent', 'light', 'ventilation', 'circulationFan', 'pots', 'soil', 'nutrients', 'extra'];
        
        return (
            <div className="animate-fade-in">
                {isLoading && <AiLoadingIndicator loadingMessage={loadingMessage} />}
                {error && (
                     <div className="text-center p-8">
                        <PhosphorIcons.XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-400">{t('equipmentView.configurator.error')}</p>
                        <p className="text-sm text-slate-400 mb-4">{error}</p>
                        <Button onClick={handleGenerate}>{t('equipmentView.configurator.tryAgain')}</Button>
                    </div>
                )}
                {recommendation && !isLoading && (
                    <>
                        <h2 className="text-2xl font-bold text-primary-400">{t('equipmentView.configurator.resultsTitle')}</h2>
                        <p className="text-slate-400 mb-4 text-sm">{t('equipmentView.configurator.resultsSubtitleNew', {
                            plants: plantCount,
                            budget: t(`equipmentView.configurator.budgets.${budget || 'value'}`),
                        })}</p>
                        
                         <div className="space-y-3">
                            {categoryOrder.map(key => {
                                const item = recommendation[key as RecommendationCategory];
                                if (!item || typeof item !== 'object' || !item.name) return null;
                                const categoryLabel = t(`equipmentView.configurator.categories.${key}`);
                                return (
                                    <Card key={key} className="p-3 bg-slate-800/50">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                            <div>
                                                <h4 className="font-bold text-slate-100">{categoryLabel}</h4>
                                                <p className="text-sm text-primary-300">{item.name} {item.watts && `(${item.watts}W)`}</p>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                        
                        {recommendation.proTip && (
                             <Card key="proTip" className="p-3 bg-primary-900/30 mt-4">
                                <h4 className="font-bold text-primary-300 flex items-center gap-2 mb-1">
                                    <PhosphorIcons.Sparkle /> {t('strainsView.tips.form.categories.proTip')}
                                </h4>
                                <p className="text-sm text-slate-300">{recommendation.proTip}</p>
                            </Card>
                        )}

                        <div className="mt-6 pt-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                             <div className="text-2xl font-bold">
                                <span>{t('equipmentView.configurator.total')}: </span>
                                <span className="text-primary-400">{
                                    (Object.values(recommendation) as (RecommendationItem | string)[])
                                        .reduce((sum, item) => typeof item === 'object' && item.price ? sum + item.price : sum, 0)
                                        .toFixed(2)
                                } {t('common.units.currency_eur')}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={resetFlow}>{t('equipmentView.configurator.startOver')}</Button>
                                <Button onClick={handleSaveSetup}>{t('equipmentView.configurator.saveSetup')}</Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }
    
    return (
        <div> 
            <h2 className="text-2xl font-bold text-primary-400">{t('equipmentView.configurator.title')}</h2>
            <p className="text-slate-400 mb-6">{t('equipmentView.configurator.subtitleNew')}</p>
            
            {step === 1 && (
                <div className="animate-fade-in">
                    <h3 className="text-xl font-semibold text-slate-200 mb-3">{t('equipmentView.configurator.step1TitleNew')}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plantOptions.map(opt => (
                             <button key={opt.value} onClick={() => { setPlantCount(opt.value); setStep(2); }}
                                className={`p-4 text-center rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${plantCount === opt.value ? 'bg-primary-900/50 border-primary-500 scale-105' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                                <div className="flex justify-center items-center h-10 mb-2 text-primary-400">{opt.icon}</div>
                                <span className="font-bold text-lg">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {step === 2 && plantCount && (
                <div className="animate-fade-in">
                    <button onClick={() => setStep(1)} className="text-sm flex items-center gap-1 text-slate-400 hover:text-primary-300 mb-4">
                        <PhosphorIcons.ArrowLeft /> {t('common.back')}
                    </button>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3">{t('equipmentView.configurator.step2TitleNew')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {budgetOptions.map(opt => (
                            <button key={opt.value} onClick={() => setBudget(opt.value)}
                                className={`p-4 text-left rounded-lg border-2 h-full flex flex-col transition-all duration-300 transform hover:scale-105 ${budget === opt.value ? 'bg-primary-900/50 border-primary-500 scale-105 shadow-lg' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-primary-400">{opt.icon}</div>
                                    <h4 className="font-bold text-slate-100">{opt.label}</h4>
                                </div>
                                <p className="text-xs text-slate-400 flex-grow">{opt.description}</p>
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end mt-8">
                         <Button onClick={handleGenerate} disabled={!budget}>
                            <PhosphorIcons.Sparkle className="inline w-5 h-5 mr-2" />
                            {t('equipmentView.configurator.generate')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
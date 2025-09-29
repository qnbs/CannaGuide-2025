import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
// FIX: Corrected import path for types to use the '@/' alias.
import { SavedSetup } from '@/types';
import { SetupResults } from './SetupResults';
import { configurations } from './setupConfigurations';
import { geminiService } from '@/services/geminiService';
// FIX: Corrected import path for Redux store to use the '@/' alias.
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectEquipmentGenerationState } from '@/stores/selectors';
import { startEquipmentGeneration, resetEquipmentGenerationState } from '@/stores/slices/aiSlice';
import { addSetup } from '@/stores/slices/savedItemsSlice';

interface SetupConfiguratorProps {
    onSaveSetup: () => void;
}

type PlantCount = 1 | 2 | 3;
type ConfigType = 'standard' | 'medium' | 'premium';

type Area = '60x60' | '80x80' | '100x100' | '120x60' | '120x120';
type Budget = 'low' | 'medium' | 'high';
type GrowStyle = 'beginner' | 'balanced' | 'yield';

interface ConfigCardProps {
    config: any;
    isSelected: boolean;
    onSelect: () => void;
}

const ConfigCard: React.FC<ConfigCardProps> = ({ config, isSelected, onSelect }) => {
    const { t } = useTranslation();
    return (
        <button
            onClick={onSelect}
            className={`p-4 text-left rounded-lg border-2 h-full flex flex-col transition-all duration-200 ${
                isSelected 
                ? 'bg-primary-900/50 border-primary-500 scale-105 shadow-lg' 
                : 'bg-slate-800 border-slate-700 hover:border-slate-500'
            }`}
        >
            <h4 className="font-bold text-primary-300">{t(config.titleKey)}</h4>
            <p className="text-xs text-slate-400 mb-3 flex-grow">{t(config.descriptionKey)}</p>
            <ul className="text-xs space-y-1 text-slate-300">
                {Object.entries(config.details).map(([key, value]) => (
                     <li key={key} className="flex items-start gap-1.5">
                        <span className="font-semibold">{t(`equipmentView.configurator.details.${key}`)}:</span>
                        <span>{value as string}</span>
                     </li>
                ))}
            </ul>
        </button>
    );
};


export const SetupConfigurator: React.FC<SetupConfiguratorProps> = ({ onSaveSetup }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { isLoading, response: recommendation, error, sourceDetails } = useAppSelector(selectEquipmentGenerationState);

    const [plantCount, setPlantCount] = useState<PlantCount | null>(null);
    const [selectedConfigKey, setSelectedConfigKey] = useState<ConfigType | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    
    const derivedSourceDetails = useMemo(() => {
        if (!plantCount || !selectedConfigKey) return null;
        const selectedConfigData = configurations[plantCount]?.[selectedConfigKey];
        if (!selectedConfigData) return null;

        const areaString = (selectedConfigData.details.zelt.split(' ')[0].split('x').slice(0, 2).join('x')) as Area;
        
        const budgetMap: Record<ConfigType, Budget> = { standard: 'low', medium: 'medium', premium: 'high' };
        const growStyleMap: Record<ConfigType, GrowStyle> = { standard: 'beginner', medium: 'balanced', premium: 'yield' };
        
        return { area: areaString, growStyle: growStyleMap[selectedConfigKey], budget: budgetMap[selectedConfigKey] };
    }, [plantCount, selectedConfigKey]);

    useEffect(() => {
        if (isLoading && plantCount && selectedConfigKey) {
            const config = configurations[plantCount][selectedConfigKey];
            const configName = t(config.titleKey);
            const messages = geminiService.getDynamicLoadingMessages({ useCase: 'equipment', data: { configName } });
            let messageIndex = 0;
            const updateLoadingMessage = () => {
                setLoadingMessage(messages[messageIndex % messages.length]);
                messageIndex++;
            };
            
            updateLoadingMessage();
            const intervalId = setInterval(updateLoadingMessage, 2000);

            return () => clearInterval(intervalId);
        }
    }, [isLoading, t, plantCount, selectedConfigKey]);

    const handleGenerate = () => {
        if (!plantCount || !selectedConfigKey) return;
        const config = configurations[plantCount][selectedConfigKey];
        const details = derivedSourceDetails;
        if(details) {
            dispatch(startEquipmentGeneration({ prompt: t(config.promptKey), details }));
        }
    };
    
     const handleSaveSetup = (setupToSave: Omit<SavedSetup, 'id' | 'createdAt'>) => {
        dispatch(addSetup(setupToSave))
            .unwrap()
            .then(() => {
                onSaveSetup();
            })
            .catch((err) => {
                // Error notification is handled within the thunk, so we just log here.
                console.error("Save setup failed:", err);
            });
    };
    
    const showResults = isLoading || recommendation || error;
    const currentConfigs = plantCount ? configurations[plantCount] : null;

    return (
        <Card>
            {!showResults ? (
                 <>
                    <h2 className="text-2xl font-bold text-primary-400">{t('equipmentView.configurator.title')}</h2>
                    <p className="text-slate-400 mb-6">{t('equipmentView.configurator.subtitleNew')}</p>
                    
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-200 mb-3">{t('equipmentView.configurator.step1TitleNew')}</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {([1, 2, 3] as PlantCount[]).map(count => 
                                    <button 
                                        key={count} 
                                        onClick={() => { setPlantCount(count); setSelectedConfigKey(null); }}
                                        className={`p-4 text-center rounded-lg border-2 transition-colors ${plantCount === count ? 'bg-primary-900/50 border-primary-500' : 'bg-slate-800 border-transparent hover:border-slate-500'}`}
                                    >
                                        <div className="flex justify-center items-center h-8 mb-1">
                                            {Array.from({ length: count }).map((_, i) => (
                                                <PhosphorIcons.Plant key={i} className="w-8 h-8 text-primary-500"/>
                                            ))}
                                        </div>
                                        <span className="font-bold">{t('equipmentView.configurator.plantCount', { count })}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {currentConfigs && (
                            <div className="animate-fade-in">
                                <h3 className="text-xl font-semibold text-slate-200 mb-3">{t('equipmentView.configurator.step2TitleNew')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <ConfigCard config={currentConfigs.standard} isSelected={selectedConfigKey === 'standard'} onSelect={() => setSelectedConfigKey('standard')} />
                                   <ConfigCard config={currentConfigs.medium} isSelected={selectedConfigKey === 'medium'} onSelect={() => setSelectedConfigKey('medium')} />
                                   <ConfigCard config={currentConfigs.premium} isSelected={selectedConfigKey === 'premium'} onSelect={() => setSelectedConfigKey('premium')} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-8">
                         <Button onClick={handleGenerate} disabled={!plantCount || !selectedConfigKey}>
                            <PhosphorIcons.Sparkle className="inline w-5 h-5 mr-2" />
                            {t('equipmentView.configurator.generate')}
                        </Button>
                    </div>
                 </>
            ) : (
                <SetupResults
                    recommendation={recommendation}
                    isLoading={isLoading}
                    error={error}
                    onSaveSetup={handleSaveSetup}
                    startOver={() => dispatch(resetEquipmentGenerationState())}
                    handleGenerate={handleGenerate}
                    sourceDetails={sourceDetails!}
                    loadingMessage={loadingMessage}
                />
            )}
        </Card>
    );
};
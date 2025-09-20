import React, { useState, useMemo } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { SavedSetup, Recommendation } from '../../../types';
import { SetupResults } from './SetupResults';
import { configurations } from './setupConfigurations';

interface SetupConfiguratorProps {
    onGenerate: (promptDetails: string) => void;
    onSaveSetup: (setup: Omit<SavedSetup, 'id' | 'createdAt'>) => void;
    recommendation: Recommendation | null;
    setRecommendation: (rec: Recommendation | null) => void;
    isLoading: boolean;
    error: string | null;
    setError: (err: string | null) => void;
}

type PlantCount = 1 | 2 | 3;
type ConfigType = 'standard' | 'premium';

type Area = '60x60' | '80x80' | '100x100' | '120x60' | '120x120';
type Budget = 'low' | 'medium' | 'high';
type GrowStyle = 'beginner' | 'yield' | 'stealth';

interface ConfigCardProps {
    config: any;
    isSelected: boolean;
    onSelect: () => void;
}

const ConfigCard: React.FC<ConfigCardProps> = ({ config, isSelected, onSelect }) => {
    const { t } = useTranslations();
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


export const SetupConfigurator: React.FC<SetupConfiguratorProps> = ({ 
    onGenerate, onSaveSetup, recommendation, setRecommendation, isLoading, error, setError
}) => {
    const { t } = useTranslations();
    const [step, setStep] = useState<1 | 2>(1);
    const [plantCount, setPlantCount] = useState<PlantCount | null>(null);
    const [selectedConfigKey, setSelectedConfigKey] = useState<ConfigType | null>(null);

    const handleGenerate = () => {
        if (!plantCount || !selectedConfigKey) return;
        const config = configurations[plantCount][selectedConfigKey];
        onGenerate(t(config.promptKey));
        setStep(2);
    };

    const startOver = () => {
        setStep(1);
        setPlantCount(null);
        setSelectedConfigKey(null);
        setRecommendation(null);
        setError(null);
    };
    
    const currentConfigs = plantCount ? configurations[plantCount] : null;
    const selectedConfigData = (plantCount && selectedConfigKey) ? configurations[plantCount][selectedConfigKey] : null;

    const sourceDetails = useMemo(() => {
        if (!selectedConfigKey || !selectedConfigData) {
            // Provide default values that match the expected types.
            return {
                area: '60x60' as Area,
                budget: 'low' as Budget,
                growStyle: 'beginner' as GrowStyle
            };
        }

        const areaString = selectedConfigData.details.zelt.split(' ')[0].split('x').slice(0, 2).join('x');
        const growStyle: GrowStyle = selectedConfigKey === 'premium' ? 'yield' : 'beginner';
        const budget: Budget = selectedConfigKey === 'premium' ? 'high' : 'medium';
        
        return {
            area: areaString as Area,
            growStyle,
            budget
        };
    }, [selectedConfigData, selectedConfigKey]);

    return (
        <Card>
            {step === 1 ? (
                 <>
                    <h2 className="text-2xl font-bold text-primary-400">{t('equipmentView.configurator.title')}</h2>
                    <p className="text-slate-400 mb-6">{t('equipmentView.configurator.subtitleNew')}</p>
                    
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-200 mb-3">1. {t('equipmentView.configurator.step1TitleNew')}</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {([1, 2, 3] as PlantCount[]).map(count => 
                                    <button 
                                        key={count} 
                                        onClick={() => { setPlantCount(count); setSelectedConfigKey(null); }}
                                        className={`p-4 text-center rounded-lg border-2 transition-colors ${plantCount === count ? 'bg-primary-900/50 border-primary-500' : 'bg-slate-800 border-transparent hover:border-slate-500'}`}
                                    >
                                        <PhosphorIcons.Plant className="w-8 h-8 mx-auto mb-1 text-primary-500"/>
                                        <span className="font-bold">{t('equipmentView.configurator.plantCount', { count })}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {currentConfigs && (
                            <div className="animate-fade-in">
                                <h3 className="text-xl font-semibold text-slate-200 mb-3">2. {t('equipmentView.configurator.step2TitleNew')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <ConfigCard config={currentConfigs.standard} isSelected={selectedConfigKey === 'standard'} onSelect={() => setSelectedConfigKey('standard')} />
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
                    onSaveSetup={onSaveSetup}
                    startOver={startOver}
                    handleGenerate={handleGenerate}
                    area={sourceDetails.area}
                    budget={sourceDetails.budget}
                    growStyle={sourceDetails.growStyle}
                />
            )}
        </Card>
    );
};

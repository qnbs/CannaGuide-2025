import React, { useState, useCallback } from 'react';
import { Card } from '../common/Card';
import { useTranslations } from '../../hooks/useTranslations';
import { SetupConfigurator } from './equipment/SetupConfigurator';
import { Calculators } from './equipment/Calculators';
import { SavedSetupsView } from './equipment/SavedSetupsView';
import { useSetupManager } from '../../hooks/useSetupManager';
import { geminiService } from '../../services/geminiService';
import { Recommendation, SavedSetup } from '../../types';

type EquipmentViewTab = 'configurator' | 'calculators' | 'setups';
type Area = '60x60' | '80x80' | '100x100' | '120x120';
type Budget = 'low' | 'medium' | 'high';
type GrowStyle = 'beginner' | 'yield' | 'stealth';

export const EquipmentView: React.FC = () => {
    const { t } = useTranslations();
    const { savedSetups, addSetup, updateSetup, deleteSetup } = useSetupManager();
    const [activeTab, setActiveTab] = useState<EquipmentViewTab>('configurator');

    // Configurator state
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [area, setArea] = useState<Area>('80x80');
    const [budget, setBudget] = useState<Budget>('medium');
    const [growStyle, setGrowStyle] = useState<GrowStyle>('beginner');
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        setStep(4);
        setIsLoading(true);
        setError(null);
        setRecommendation(null);

        try {
            const result = await geminiService.getEquipmentRecommendation(area, budget, growStyle);
            setRecommendation(result);
        } catch (err) {
            console.error("Failed to generate setup:", err);
            setError(err instanceof Error ? err.message : t('equipmentView.configurator.errorNetwork'));
        } finally {
            setIsLoading(false);
        }
    }, [area, budget, growStyle, t]);

    const startOver = () => {
        setStep(1);
        setRecommendation(null);
        setError(null);
    };

    const handleSaveSetup = (setupToSave: Omit<SavedSetup, 'id' | 'createdAt'>) => {
        addSetup(setupToSave);
        setActiveTab('setups');
    };

    const tabs = [
        { id: 'configurator', label: t('equipmentView.tabs.configurator') },
        { id: 'setups', label: t('equipmentView.tabs.setups') },
        { id: 'calculators', label: t('equipmentView.tabs.calculators') },
    ];
    
    return (
        <div className="space-y-6">
            <Card>
                <nav className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as EquipmentViewTab)}
                            className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-slate-700 text-primary-300 shadow-sm'
                                    : 'text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </Card>

            {activeTab === 'configurator' && (
                <SetupConfigurator
                    onSaveSetup={handleSaveSetup}
                    step={step}
                    setStep={setStep}
                    area={area}
                    setArea={setArea}
                    budget={budget}
                    setBudget={setBudget}
                    growStyle={growStyle}
                    setGrowStyle={setGrowStyle}
                    recommendation={recommendation}
                    isLoading={isLoading}
                    error={error}
                    handleGenerate={handleGenerate}
                    startOver={startOver}
                />
            )}
            
            {activeTab === 'calculators' && <Calculators />}
            
            {activeTab === 'setups' && <SavedSetupsView savedSetups={savedSetups} updateSetup={updateSetup} deleteSetup={deleteSetup} />}
        </div>
    );
};
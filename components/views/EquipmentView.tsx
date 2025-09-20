import React, { useState, useCallback } from 'react';
import { Card } from '../common/Card';
import { useTranslations } from '../../hooks/useTranslations';
import { SetupConfigurator } from './equipment/SetupConfigurator';
import { Calculators } from './equipment/Calculators';
import { SavedSetupsView } from './equipment/SavedSetupsView';
import { useSetupManager } from '../../hooks/useSetupManager';
import { geminiService } from '../../services/geminiService';
import { Recommendation, SavedSetup } from '../../types';
import { Tabs } from '../common/Tabs';
import { useNotifications } from '../../context/NotificationContext';

type EquipmentViewTab = 'configurator' | 'calculators' | 'setups';

export const EquipmentView: React.FC = () => {
    const { t } = useTranslations();
    const { addNotification } = useNotifications();
    const { savedSetups, addSetup, updateSetup, deleteSetup } = useSetupManager();
    const [activeTab, setActiveTab] = useState<EquipmentViewTab>('configurator');
    
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async (promptDetails: string) => {
        setIsLoading(true);
        setError(null);
        setRecommendation(null);
        try {
            const result = await geminiService.getEquipmentRecommendation(promptDetails);
            setRecommendation(result);
        } catch (err) {
            console.error("Failed to generate setup:", err);
            const errorMessageKey = err instanceof Error ? err.message : 'ai.error.unknown';
            const errorMessage = t(errorMessageKey) === errorMessageKey ? t('ai.error.unknown') : t(errorMessageKey);
            setError(errorMessage);
            addNotification(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [t, addNotification]);

    const handleSaveSetup = (setupToSave: Omit<SavedSetup, 'id' | 'createdAt'>) => {
        addSetup(setupToSave);
        addNotification(t('equipmentView.configurator.setupSaveSuccess', { name: setupToSave.name }), 'success');
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
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as EquipmentViewTab)} />
            </Card>

            {activeTab === 'configurator' && (
                <SetupConfigurator
                    onGenerate={handleGenerate}
                    onSaveSetup={handleSaveSetup}
                    recommendation={recommendation}
                    setRecommendation={setRecommendation}
                    isLoading={isLoading}
                    error={error}
                    setError={setError}
                />
            )}
            
            {activeTab === 'calculators' && <Calculators />}
            
            {activeTab === 'setups' && <SavedSetupsView savedSetups={savedSetups} updateSetup={updateSetup} deleteSetup={deleteSetup} />}
        </div>
    );
};

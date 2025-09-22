import React, { useState, useCallback } from 'react';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { SetupConfigurator } from '@/components/views/equipment/SetupConfigurator';
import { Calculators } from '@/components/views/equipment/Calculators';
import { SavedSetupsView } from '@/components/views/equipment/SavedSetupsView';
// FIX: Replaced multiple hook imports with a single import from the central Zustand store.
import { useAppStore } from '@/stores/useAppStore';
import { geminiService } from '@/services/geminiService';
import { Recommendation, SavedSetup } from '@/types';
import { Tabs } from '@/components/common/Tabs';
import { GrowShopsView } from '@/components/views/equipment/GrowShopsView';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

type EquipmentViewTab = 'configurator' | 'calculators' | 'setups' | 'grow-shops';

export const EquipmentView: React.FC = () => {
    const { t } = useTranslations();
    // FIX: Get state and actions from the central Zustand store.
    const { addNotification, savedSetups, addSetup, updateSetup, deleteSetup } = useAppStore(state => ({
        addNotification: state.addNotification,
        savedSetups: state.savedSetups,
        addSetup: state.addSetup,
        updateSetup: state.updateSetup,
        deleteSetup: state.deleteSetup,
    }));
    const [activeTab, setActiveTab] = useState<EquipmentViewTab>('configurator');
    
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async (promptDetails: string) => {
        setIsLoading(true);
        setError(null);
        setRecommendation(null);
        try {
            const result = await geminiService.getEquipmentRecommendation(promptDetails, t);
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
        { id: 'configurator', label: t('equipmentView.tabs.configurator'), icon: <PhosphorIcons.MagicWand /> },
        { id: 'setups', label: t('equipmentView.tabs.setups'), icon: <PhosphorIcons.Cube /> },
        { id: 'calculators', label: t('equipmentView.tabs.calculators'), icon: <PhosphorIcons.Calculator /> },
        { id: 'grow-shops', label: t('equipmentView.tabs.growShops'), icon: <PhosphorIcons.Storefront /> },
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

            {activeTab === 'grow-shops' && <GrowShopsView />}
        </div>
    );
};
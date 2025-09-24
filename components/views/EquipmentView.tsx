import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { SetupConfigurator } from '@/components/views/equipment/SetupConfigurator';
import { Calculators } from '@/components/views/equipment/Calculators';
import { SavedSetupsView } from '@/components/views/equipment/SavedSetupsView';
import { useAppStore } from '@/stores/useAppStore';
import { SavedSetup } from '@/types';
import { Tabs } from '@/components/common/Tabs';
import { GrowShopsView } from '@/components/views/equipment/GrowShopsView';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { selectSavedSetups } from '@/stores/selectors';

type EquipmentViewTab = 'configurator' | 'calculators' | 'setups' | 'grow-shops';

export const EquipmentView: React.FC = () => {
    const { t } = useTranslations();
    const savedSetups = useAppStore(selectSavedSetups);
    const { addNotification, addSetup, updateSetup, deleteSetup, generateEquipmentRecommendation, equipmentTask, resetAiTask } = useAppStore(state => ({
        addNotification: state.addNotification,
        addSetup: state.addSetup,
        updateSetup: state.updateSetup,
        deleteSetup: state.deleteSetup,
        generateEquipmentRecommendation: state.generateEquipmentRecommendation,
        equipmentTask: state.equipmentTask,
        resetAiTask: state.resetAiTask
    }));
    const [activeTab, setActiveTab] = useState<EquipmentViewTab>('configurator');
    
    useEffect(() => {
        // If the task was successful but the user navigates away and back,
        // we might not want to show the configurator immediately in the results step.
        // However, for this implementation, we'll reset if the tab changes.
        return () => {
            if (activeTab !== 'configurator') {
                resetAiTask('equipmentTask');
            }
        };
    }, [activeTab, resetAiTask]);

    const handleGenerate = useCallback(async (promptDetails: string) => {
        await generateEquipmentRecommendation(promptDetails);
    }, [generateEquipmentRecommendation]);

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
                    task={equipmentTask}
                    resetTask={() => resetAiTask('equipmentTask')}
                />
            )}
            
            {activeTab === 'calculators' && <Calculators />}
            
            {activeTab === 'setups' && <SavedSetupsView savedSetups={savedSetups} updateSetup={updateSetup} deleteSetup={deleteSetup} />}

            {activeTab === 'grow-shops' && <GrowShopsView />}
        </div>
    );
};
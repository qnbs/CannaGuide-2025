import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { SetupConfigurator } from '@/components/views/equipment/SetupConfigurator';
import { Calculators } from '@/components/views/equipment/Calculators';
import { SavedSetupsView } from '@/components/views/equipment/SavedSetupsView';
import { useAppStore } from '@/stores/useAppStore';
import { Tabs } from '@/components/common/Tabs';
import { GrowShopsView } from '@/components/views/equipment/GrowShopsView';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { selectSavedSetups } from '@/stores/selectors';

type EquipmentViewTab = 'configurator' | 'calculators' | 'setups' | 'grow-shops';

export const EquipmentView: React.FC = () => {
    const { t } = useTranslations();
    const savedSetups = useAppStore(selectSavedSetups);
    const { updateSetup, deleteSetup } = useAppStore(state => ({
        updateSetup: state.updateSetup,
        deleteSetup: state.deleteSetup,
    }));
    const [activeTab, setActiveTab] = useState<EquipmentViewTab>('configurator');

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

            {activeTab === 'configurator' && <SetupConfigurator onSaveSetup={() => setActiveTab('setups')} />}
            
            {activeTab === 'calculators' && <Calculators />}
            
            {activeTab === 'setups' && <SavedSetupsView savedSetups={savedSetups} updateSetup={updateSetup} deleteSetup={deleteSetup} />}

            {activeTab === 'grow-shops' && <GrowShopsView />}
        </div>
    );
};
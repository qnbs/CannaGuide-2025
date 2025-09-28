import React from 'react';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { SetupConfigurator } from '@/components/views/equipment/SetupConfigurator';
import { Calculators } from '@/components/views/equipment/Calculators';
import { SavedSetupsView } from './equipment/SavedSetupsView';
import { Tabs } from '@/components/common/Tabs';
import { GrowShopsView } from '@/components/views/equipment/GrowShopsView';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EquipmentViewTab } from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectSavedSetups, selectUi } from '@/stores/selectors';
import { setEquipmentViewTab } from '@/stores/slices/uiSlice';
import { updateSetup, deleteSetup } from '@/stores/slices/savedItemsSlice';

export const EquipmentView: React.FC = () => {
    const { t } = useTranslations();
    const dispatch = useAppDispatch();
    const savedSetups = useAppSelector(selectSavedSetups);
    const { equipmentViewTab: activeTab } = useAppSelector(selectUi);

    const tabs = [
        { id: 'configurator' as EquipmentViewTab, label: t('equipmentView.tabs.configurator'), icon: <PhosphorIcons.MagicWand /> },
        { id: 'setups' as EquipmentViewTab, label: t('equipmentView.tabs.setups'), icon: <PhosphorIcons.Cube /> },
        { id: 'calculators' as EquipmentViewTab, label: t('equipmentView.tabs.calculators'), icon: <PhosphorIcons.Calculator /> },
        { id: 'grow-shops' as EquipmentViewTab, label: t('equipmentView.tabs.growShops'), icon: <PhosphorIcons.Storefront /> },
    ];
    
    return (
        <div className="space-y-6">
            <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => dispatch(setEquipmentViewTab(id as EquipmentViewTab))} />
            </Card>

            {activeTab === 'configurator' && <SetupConfigurator onSaveSetup={() => dispatch(setEquipmentViewTab('setups'))} />}
            
            {activeTab === 'calculators' && <Calculators />}
            
            {activeTab === 'setups' && <SavedSetupsView savedSetups={savedSetups} updateSetup={(setup) => dispatch(updateSetup(setup))} deleteSetup={(id) => dispatch(deleteSetup(id))} />}

            {activeTab === 'grow-shops' && <GrowShopsView />}
        </div>
    );
};
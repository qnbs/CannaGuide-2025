import React from 'react';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { SetupConfigurator } from '@/components/views/equipment/SetupConfigurator';
import { Calculators } from '@/components/views/equipment/Calculators';
import { SavedSetupsView } from './equipment/SavedSetupsView';
import { Tabs } from '@/components/common/Tabs';
import { GrowShopsView } from '@/components/views/equipment/GrowShopsView';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
// FIX: Corrected import path for types to use the '@/' alias.
import { EquipmentViewTab } from '@/types';
// FIX: Corrected import path for Redux store to use the '@/' alias.
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectSavedSetups, selectUi } from '@/stores/selectors';
import { setEquipmentViewTab } from '@/stores/slices/uiSlice';
import { updateSetup, deleteSetup } from '@/stores/slices/savedItemsSlice';

export const EquipmentView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const savedSetups = useAppSelector(selectSavedSetups);
    const { equipmentViewTab: activeTab } = useAppSelector(selectUi);

    const tabs = [
        // FIX: Changed tab IDs to match enum members.
        { id: EquipmentViewTab.Configurator, label: t('equipmentView.tabs.configurator'), icon: <PhosphorIcons.MagicWand /> },
        { id: EquipmentViewTab.Setups, label: t('equipmentView.tabs.setups'), icon: <PhosphorIcons.Cube /> },
        { id: EquipmentViewTab.Calculators, label: t('equipmentView.tabs.calculators'), icon: <PhosphorIcons.Calculator /> },
        { id: EquipmentViewTab.GrowShops, label: t('equipmentView.tabs.growShops'), icon: <PhosphorIcons.Storefront /> },
    ];
    
    return (
        <div className="space-y-6">
            <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => dispatch(setEquipmentViewTab(id as EquipmentViewTab))} />
            </Card>

            {activeTab === EquipmentViewTab.Configurator && <SetupConfigurator onSaveSetup={() => dispatch(setEquipmentViewTab(EquipmentViewTab.Setups))} />}
            
            {activeTab === EquipmentViewTab.Calculators && <Calculators />}
            
            {activeTab === EquipmentViewTab.Setups && <SavedSetupsView savedSetups={savedSetups} updateSetup={(setup) => dispatch(updateSetup(setup))} deleteSetup={(id) => dispatch(deleteSetup(id))} />}

            {activeTab === EquipmentViewTab.GrowShops && <GrowShopsView />}
        </div>
    );
};
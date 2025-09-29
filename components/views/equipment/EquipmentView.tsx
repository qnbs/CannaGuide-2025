import React from 'react';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { SetupConfigurator } from '@/components/views/equipment/SetupConfigurator';
import { Calculators } from '@/components/views/equipment/Calculators';
import { SavedSetupsView } from './SavedSetupsView';
import { Tabs } from '@/components/common/Tabs';
import { GrowShopsView } from '@/components/views/equipment/GrowShopsView';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EquipmentViewTab } from '@/types';
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
        { id: EquipmentViewTab.Configurator, label: t('equipmentView.tabs.configurator'), icon: <PhosphorIcons.MagicWand /> },
        { id: EquipmentViewTab.Setups, label: t('equipmentView.tabs.setups'), icon: <PhosphorIcons.Cube /> },
        { id: EquipmentViewTab.Calculators, label: t('equipmentView.tabs.calculators'), icon: <PhosphorIcons.Calculator /> },
        { id: EquipmentViewTab.GrowShops, label: t('equipmentView.tabs.growShops'), icon: <PhosphorIcons.Storefront /> },
    ];

    const renderContent = () => {
        switch(activeTab) {
            case EquipmentViewTab.Configurator:
                return <SetupConfigurator onSaveSetup={() => dispatch(setEquipmentViewTab(EquipmentViewTab.Setups))} />;
            case EquipmentViewTab.Calculators:
                return <Calculators />;
            case EquipmentViewTab.Setups:
                return <SavedSetupsView savedSetups={savedSetups} updateSetup={(setup) => dispatch(updateSetup(setup))} deleteSetup={(id) => dispatch(deleteSetup(id))} />;
            case EquipmentViewTab.GrowShops:
                return <GrowShopsView />;
            default:
                return null;
        }
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => dispatch(setEquipmentViewTab(id as EquipmentViewTab))} />
            </Card>

            <Card>
                {renderContent()}
            </Card>
        </div>
    );
};

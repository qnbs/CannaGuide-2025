import React, { useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Tabs } from '@/components/common/Tabs';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EquipmentViewTab, SavedSetup } from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setEquipmentViewTab } from '@/stores/slices/uiSlice';
import { selectUi, selectSavedSetups } from '@/stores/selectors';
import { updateSetup, deleteSetup } from '@/stores/slices/savedItemsSlice';
import { SetupConfigurator } from './SetupConfigurator';
import { SavedSetupsView } from './SavedSetupsView';
import { Calculators } from './Calculators';
import { GrowShopsView } from './GrowShopsView';

export const EquipmentView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { equipmentViewTab: activeTab } = useAppSelector(selectUi);
    const savedSetups = useAppSelector(selectSavedSetups);
    const [isPending, startTransition] = useTransition();

    const handleSetTab = (id: string) => {
        startTransition(() => {
            dispatch(setEquipmentViewTab(id as EquipmentViewTab));
        });
    };

    const tabs = [
        { id: EquipmentViewTab.Configurator, label: t('equipmentView.tabs.configurator'), icon: <PhosphorIcons.MagicWand /> },
        { id: EquipmentViewTab.Setups, label: t('equipmentView.tabs.setups'), icon: <PhosphorIcons.ArchiveBox /> },
        { id: EquipmentViewTab.Calculators, label: t('equipmentView.tabs.calculators'), icon: <PhosphorIcons.Calculator /> },
        { id: EquipmentViewTab.GrowShops, label: t('equipmentView.tabs.growShops'), icon: <PhosphorIcons.Storefront /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case EquipmentViewTab.Configurator:
                return <SetupConfigurator onSaveSetup={() => {}} />;
            case EquipmentViewTab.Setups:
                return <SavedSetupsView 
                            savedSetups={savedSetups} 
                            updateSetup={(setup) => dispatch(updateSetup(setup))} 
                            deleteSetup={(id) => dispatch(deleteSetup(id))} 
                        />;
            case EquipmentViewTab.Calculators:
                return <Calculators />;
            case EquipmentViewTab.GrowShops:
                return <GrowShopsView />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-3xl font-bold font-display text-slate-100">{t('nav.equipment')}</h2>
                <p className="text-slate-400 mt-1">{t('equipmentView.configurator.subtitleNew')}</p>
            </Card>
            
            <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleSetTab} />
            </Card>

            <div className={`transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                {renderContent()}
            </div>
        </div>
    );
};
import React, { useTransition, lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EquipmentViewTab, SavedSetup } from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setEquipmentViewTab, openSaveSetupModal } from '@/stores/slices/uiSlice';
import { selectUi, selectSavedSetups } from '@/stores/selectors';
import { updateSetup, deleteSetup } from '@/stores/slices/savedItemsSlice';
import { Card } from '@/components/common/Card';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Tabs } from '@/components/common/Tabs';

const SetupConfigurator = lazy(() => import('./SetupConfigurator').then(m => ({ default: m.SetupConfigurator })));
const SavedSetupsView = lazy(() => import('./SavedSetupsView').then(m => ({ default: m.SavedSetupsView })));
const Calculators = lazy(() => import('./Calculators').then(m => ({ default: m.Calculators })));
const GrowShopsView = lazy(() => import('./GrowShopsView').then(m => ({ default: m.GrowShopsView })));
const SeedbanksView = lazy(() => import('./SeedbanksView'));


export const EquipmentView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { equipmentViewTab: activeTab } = useAppSelector(selectUi);
    const savedSetups = useAppSelector(selectSavedSetups);
    const [isPending, startTransition] = useTransition();

    const tabs = useMemo(() => [
        { id: EquipmentViewTab.Configurator, label: t('equipmentView.tabs.configurator'), icon: <PhosphorIcons.MagicWand /> },
        { id: EquipmentViewTab.Setups, label: t('equipmentView.tabs.setups'), icon: <PhosphorIcons.ArchiveBox /> },
        { id: EquipmentViewTab.Calculators, label: t('equipmentView.tabs.calculators'), icon: <PhosphorIcons.Calculator /> },
        { id: EquipmentViewTab.GrowShops, label: t('equipmentView.tabs.growShops'), icon: <PhosphorIcons.Storefront /> },
        { id: EquipmentViewTab.Seedbanks, label: t('equipmentView.tabs.seedbanks'), icon: <PhosphorIcons.Cannabis /> },
    ], [t]);

    const viewIcons = useMemo(() => ({
        [EquipmentViewTab.Configurator]: <PhosphorIcons.MagicWand className="w-16 h-16 mx-auto text-purple-400" />,
        [EquipmentViewTab.Setups]: <PhosphorIcons.ArchiveBox className="w-16 h-16 mx-auto text-orange-400" />,
        [EquipmentViewTab.Calculators]: <PhosphorIcons.Calculator className="w-16 h-16 mx-auto text-cyan-400" />,
        [EquipmentViewTab.GrowShops]: <PhosphorIcons.Storefront className="w-16 h-16 mx-auto text-lime-400" />,
        [EquipmentViewTab.Seedbanks]: <PhosphorIcons.Cannabis className="w-16 h-16 mx-auto text-green-400" />,
    }), []);

    const handleSetTab = (id: string) => {
        startTransition(() => {
            dispatch(setEquipmentViewTab(id as EquipmentViewTab));
        });
    };
    
    const handleSaveGeneratedSetup = (setupData: Omit<SavedSetup, 'id' | 'createdAt' | 'name'>) => {
        dispatch(openSaveSetupModal(setupData));
    };

    const renderContent = () => {
        switch (activeTab) {
            case EquipmentViewTab.Configurator:
                return <SetupConfigurator onSaveSetup={handleSaveGeneratedSetup} />;
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
            case EquipmentViewTab.Seedbanks:
                return <SeedbanksView />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6 animate-fade-in">
                {viewIcons[activeTab]}
                <h2 className="text-3xl font-bold font-display text-primary-300 mt-2">{t('nav.equipment')}</h2>
            </div>
            
            <Card className="!p-2 !bg-slate-950">
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleSetTab} />
            </Card>

            <main className={`transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                 <Card>
                    <Suspense fallback={<SkeletonLoader count={5} />}>
                        {renderContent()}
                    </Suspense>
                </Card>
            </main>
        </div>
    );
};

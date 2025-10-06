import React, { useTransition, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EquipmentViewTab } from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setEquipmentViewTab } from '@/stores/slices/uiSlice';
import { selectUi, selectSavedSetups } from '@/stores/selectors';
import { updateSetup, deleteSetup } from '@/stores/slices/savedItemsSlice';
import { Card } from '@/components/common/Card';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

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
        { id: EquipmentViewTab.Seedbanks, label: t('equipmentView.tabs.seedbanks'), icon: <PhosphorIcons.Globe /> },
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
            case EquipmentViewTab.Seedbanks:
                return <SeedbanksView />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6 animate-fade-in">
                <PhosphorIcons.Wrench className="w-16 h-16 mx-auto text-primary-400" />
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">{t('nav.equipment')}</h2>
                <p className="text-slate-400 mt-1 max-w-2xl mx-auto">{t('equipmentView.configurator.subtitleNew')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <nav className="lg:col-span-1 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleSetTab(tab.id)}
                            className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ring-1 ring-inset ring-white/20 ${
                                activeTab === tab.id
                                    ? 'bg-slate-700 text-primary-300 font-semibold'
                                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                            }`}
                        >
                            <div className="w-6 h-6">{tab.icon}</div>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
                <main className={`lg:col-span-3 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                    <Card>
                        <Suspense fallback={<SkeletonLoader count={5} />}>
                            {renderContent()}
                        </Suspense>
                    </Card>
                </main>
            </div>
        </div>
    );
};
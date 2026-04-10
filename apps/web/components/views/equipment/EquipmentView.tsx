import React, { useTransition, useEffect, lazy, Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { EquipmentViewTab, SavedSetup } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { useUIStore, getUISnapshot } from '@/stores/useUIStore'
import { selectSavedSetups } from '@/stores/selectors'
import { updateSetup, deleteSetup } from '@/stores/slices/savedItemsSlice'
import { Card } from '@/components/common/Card'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { EquipmentSubNav } from './EquipmentSubNav'

const SetupConfigurator = lazy(() =>
    import('./SetupConfigurator').then((m) => ({ default: m.SetupConfigurator })),
)
const SavedSetupsView = lazy(() =>
    import('./SavedSetupsView').then((m) => ({ default: m.SavedSetupsView })),
)
const Calculators = lazy(() => import('./Calculators').then((m) => ({ default: m.Calculators })))
const GrowShopsView = lazy(() =>
    import('./GrowShopsView').then((m) => ({ default: m.GrowShopsView })),
)
const SeedbanksView = lazy(() => import('./SeedbanksView'))
const GrowTechView = lazy(() => import('./GrowTechView'))
const IotDashboardView = lazy(() =>
    import('./IotDashboardView').then((m) => ({ default: m.IotDashboardView })),
)
const HydroMonitorView = lazy(() =>
    import('./HydroMonitorView').then((m) => ({ default: m.HydroMonitorView })),
)

export const EquipmentView: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const activeTab = useUIStore((s) => s.equipmentViewTab)
    const savedSetups = useAppSelector(selectSavedSetups)
    const [isPending, startTransition] = useTransition()
    const contentOpacityClass = isPending ? 'opacity-50' : 'opacity-100'

    // Scroll to top on tab change
    useEffect(() => {
        const mainEl = document.getElementById('main-content')
        if (mainEl) {
            mainEl.scrollTop = 0
        }
    }, [activeTab])

    const viewIcons = useMemo(
        () => ({
            [EquipmentViewTab.Configurator]: (
                <PhosphorIcons.MagicWand className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-accent-400" />
            ),
            [EquipmentViewTab.Setups]: (
                <PhosphorIcons.ArchiveBox className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-primary-400" />
            ),
            [EquipmentViewTab.Calculators]: (
                <PhosphorIcons.Calculator className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-secondary-400" />
            ),
            [EquipmentViewTab.GrowShops]: (
                <PhosphorIcons.Storefront className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-accent-400" />
            ),
            [EquipmentViewTab.Seedbanks]: (
                <PhosphorIcons.Cannabis className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-secondary-400" />
            ),
            [EquipmentViewTab.GrowTech]: (
                <PhosphorIcons.Lightning className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-primary-400" />
            ),
            [EquipmentViewTab.IotDashboard]: (
                <PhosphorIcons.WifiHigh className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-accent-400" />
            ),
            [EquipmentViewTab.HydroMonitoring]: (
                <PhosphorIcons.Drop className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-secondary-400" />
            ),
        }),
        [],
    )

    const viewTitles = useMemo(
        () => ({
            [EquipmentViewTab.Configurator]: t('equipmentView.tabs.configurator'),
            [EquipmentViewTab.Setups]: t('equipmentView.tabs.setups'),
            [EquipmentViewTab.Calculators]: t('equipmentView.tabs.calculators'),
            [EquipmentViewTab.GrowShops]: t('equipmentView.tabs.growShops'),
            [EquipmentViewTab.Seedbanks]: t('equipmentView.tabs.seedbanks'),
            [EquipmentViewTab.GrowTech]: t('equipmentView.tabs.growTech'),
            [EquipmentViewTab.IotDashboard]: t('equipmentView.tabs.iotDashboard'),
            [EquipmentViewTab.HydroMonitoring]: t('equipmentView.tabs.hydroMonitoring'),
        }),
        [t],
    )

    const handleSetTab = (id: EquipmentViewTab) => {
        startTransition(() => {
            getUISnapshot().setEquipmentViewTab(id)
        })
    }

    const handleSaveGeneratedSetup = (setupData: Omit<SavedSetup, 'id' | 'createdAt' | 'name'>) => {
        getUISnapshot().openSaveSetupModal(setupData)
    }

    const renderContent = () => {
        switch (activeTab) {
            case EquipmentViewTab.Configurator:
                return <SetupConfigurator onSaveSetup={handleSaveGeneratedSetup} />
            case EquipmentViewTab.Setups:
                return (
                    <SavedSetupsView
                        savedSetups={savedSetups}
                        updateSetup={(setup) => dispatch(updateSetup(setup))}
                        deleteSetup={(id) => dispatch(deleteSetup(id))}
                    />
                )
            case EquipmentViewTab.Calculators:
                return <Calculators />
            case EquipmentViewTab.GrowShops:
                return <GrowShopsView />
            case EquipmentViewTab.Seedbanks:
                return <SeedbanksView />
            case EquipmentViewTab.GrowTech:
                return <GrowTechView />
            case EquipmentViewTab.IotDashboard:
                return <IotDashboardView />
            case EquipmentViewTab.HydroMonitoring:
                return <HydroMonitorView />
            default:
                return null
        }
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center mb-4 sm:mb-6 animate-fade-in">
                {viewIcons[activeTab]}
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-primary-300 mt-2">
                    {viewTitles[activeTab]}
                </h2>
            </div>

            <EquipmentSubNav activeTab={activeTab} onTabChange={handleSetTab} />

            <section className={`transition-opacity duration-300 ${contentOpacityClass}`}>
                <Card>
                    <Suspense fallback={<SkeletonLoader count={5} />}>{renderContent()}</Suspense>
                </Card>
            </section>
        </div>
    )
}

EquipmentView.displayName = 'EquipmentView'

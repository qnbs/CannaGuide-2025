import React, { memo, useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Plant } from '@/types'
import { PlantSlot } from './plants/PlantSlot'
import { TipOfTheDay } from './plants/TipOfTheDay'
import { DashboardSummary } from './plants/DashboardSummary'
import { GrowStatsDashboard } from './plants/GrowStatsDashboard'
import { TasksAndWarnings } from './plants/TasksAndWarnings'
import { InlineStrainSelector } from './plants/InlineStrainSelector'
import { usePlantSlotsData, useGardenSummary, useSelectedPlant } from '@/hooks/useSimulationBridge'

// Lazy-loaded heavy sub-views (only rendered when needed)
const DetailedPlantView = lazy(() =>
    import('./plants/DetailedPlantView').then((m) => ({ default: m.DetailedPlantView })),
)
const GlobalAdvisorArchiveView = lazy(() =>
    import('./plants/GlobalAdvisorArchiveView').then((m) => ({
        default: m.GlobalAdvisorArchiveView,
    })),
)
const GrowReminderPanel = lazy(() =>
    import('./plants/GrowReminderPanel').then((m) => ({ default: m.GrowReminderPanel })),
)
const SensorIntegrationPanel = lazy(() =>
    import('./plants/SensorIntegrationPanel').then((m) => ({ default: m.SensorIntegrationPanel })),
)
const GrowRoom3D = lazy(() =>
    import('./plants/GrowRoom3D').then((m) => ({ default: m.GrowRoom3D })),
)

import { useAppDispatch, useAppSelector } from '@/stores/store'
// FIX: Removed unused `selectIsExpertMode` which was causing an import error.
import { selectNewGrowFlow } from '@/stores/selectors'
import {
    startGrowInSlot,
    selectStrainForGrow,
    cancelNewGrow,
    selectSlotForGrow,
} from '@/stores/slices/uiSlice'
import { setSelectedPlantId } from '@/stores/slices/simulationSlice'

interface EmptyPlantSlotProps {
    index: number
    onSlotClick: (index: number) => void
}

interface HiddenArchivedSlotProps {
    plantId: string
}

const EmptyPlantSlot: React.FC<EmptyPlantSlotProps> = memo(({ index, onSlotClick }) => {
    const { t } = useTranslation()
    const handleStart = useCallback(() => onSlotClick(index), [onSlotClick, index])
    return (
        <Card
            onClick={handleStart}
            aria-label={t('plantsView.emptySlot.title')}
            className="empty-slot-pulse flex h-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-center transition-all hover:border-primary-400/60 hover:bg-primary-900/20"
        >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/5 shadow-[0_14px_32px_rgba(2,6,23,0.2)]">
                <PhosphorIcons.PlusCircle className="h-10 w-10 text-primary-300" />
            </div>
            <h3 className="font-semibold text-slate-100">{t('plantsView.emptySlot.title')}</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                {t('plantsView.emptySlot.subtitle')}{' '}
                <span className="hidden md:inline">{t('plantsView.emptySlot.subtitleInline')}</span>
            </p>
        </Card>
    )
})

EmptyPlantSlot.displayName = 'EmptyPlantSlot'

const HiddenArchivedSlot: React.FC<HiddenArchivedSlotProps> = memo(({ plantId }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    return (
        <Card className="flex h-full flex-col items-center justify-center border border-slate-700/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] text-center">
            <PhosphorIcons.ArchiveBox className="mb-3 h-10 w-10 text-slate-500" />
            <h3 className="font-semibold text-slate-200">
                {t('settingsView.plants.archivedHiddenTitle')}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
                {t('settingsView.plants.archivedHiddenDesc')}
            </p>
            <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => dispatch(setSelectedPlantId(plantId))}
            >
                {t('settingsView.plants.inspectArchived')}
            </Button>
        </Card>
    )
})

HiddenArchivedSlot.displayName = 'HiddenArchivedSlot'

// Wrapper creates stable onInspect callback so PlantSlot's memo is never defeated
const PlantSlotWrapper: React.FC<{ plant: Plant }> = memo(({ plant }) => {
    const dispatch = useAppDispatch()
    const handleInspect = useCallback(
        () => dispatch(setSelectedPlantId(plant.id)),
        [dispatch, plant.id],
    )
    return <PlantSlot plant={plant} onInspect={handleInspect} />
})

PlantSlotWrapper.displayName = 'PlantSlotWrapper'

const PlantSlotsSkeleton: React.FC = memo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="flex flex-col h-full animate-pulse">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-slate-700 rounded"></div>
                        <div className="h-3 w-16 bg-slate-700 rounded"></div>
                    </div>
                    <div className="h-4 w-12 bg-slate-700 rounded-full"></div>
                </div>
                <div className="flex-grow flex items-center justify-center my-4 min-h-[96px]">
                    <div className="w-24 h-24 bg-slate-700 rounded-full"></div>
                </div>
                <div className="flex justify-around items-center border-t border-slate-700/50 pt-3 mt-auto">
                    <div className="h-4 w-8 bg-slate-700 rounded"></div>
                    <div className="h-4 w-8 bg-slate-700 rounded"></div>
                    <div className="h-4 w-8 bg-slate-700 rounded"></div>
                </div>
            </Card>
        ))}
    </div>
))

export const PlantsView: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300)
        return () => clearTimeout(timer)
    }, [])

    const newGrowFlow = useAppSelector(selectNewGrowFlow)

    const { slotsWithData } = usePlantSlotsData()
    const { tasks, problems } = useGardenSummary()
    const selectedPlant = useSelectedPlant()

    const showGrowFromStrainBanner = newGrowFlow.strain && newGrowFlow.status === 'selectingSlot'

    const handleEmptySlotClick = useCallback(
        (index: number) => {
            if (newGrowFlow.status === 'selectingSlot') {
                dispatch(selectSlotForGrow(index))
            } else {
                dispatch(startGrowInSlot(index))
            }
        },
        [dispatch, newGrowFlow.status],
    )

    return (
        <>
            {/* Detail View - Rendered on top when active */}
            {selectedPlant && (
                <Suspense fallback={null}>
                    <DetailedPlantView
                        plant={selectedPlant}
                        onClose={() => dispatch(setSelectedPlantId(null))}
                    />
                </Suspense>
            )}

            {/* Main Dashboard View - Hidden when a plant is selected to preserve state */}
            <div style={{ display: selectedPlant ? 'none' : 'block' }}>
                <div className="space-y-6">
                    <div className="section-hero animate-fade-in">
                        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                                <div className="surface-badge mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-primary-200">
                                    <PhosphorIcons.Sparkle className="h-3.5 w-3.5" />
                                    {t('plantsView.hero.badge')}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/5 shadow-[0_16px_32px_rgba(2,6,23,0.22)]">
                                        <PhosphorIcons.Plant className="h-8 w-8 text-green-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="mt-1 text-3xl font-bold font-display text-slate-50 sm:text-4xl">
                                            {t('nav.plants')}
                                        </h2>
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                            {t('plantsView.hero.description')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:max-w-sm sm:grid-cols-3 lg:min-w-[20rem]">
                                <div className="stat-tile flex flex-col justify-between p-4">
                                    <span className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">
                                        {t('plantsView.hero.slots')}
                                    </span>
                                    <span className="mt-3 text-3xl font-bold font-display text-slate-50">
                                        {slotsWithData.length}
                                    </span>
                                </div>
                                <div className="stat-tile flex flex-col justify-between p-4">
                                    <span className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">
                                        {t('plantsView.hero.tasks')}
                                    </span>
                                    <span className="mt-3 text-3xl font-bold font-display text-slate-50">
                                        {tasks.length}
                                    </span>
                                </div>
                                <div className="stat-tile col-span-2 flex flex-col justify-between p-4 sm:col-span-1">
                                    <span className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">
                                        {t('plantsView.hero.alerts')}
                                    </span>
                                    <span className="mt-3 text-3xl font-bold font-display text-slate-50">
                                        {problems.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <DashboardSummary />
                            <ErrorBoundary>
                                <Suspense fallback={null}>
                                    <GrowRoom3D />
                                </Suspense>
                            </ErrorBoundary>
                            <GrowStatsDashboard />
                            <TipOfTheDay />
                            {showGrowFromStrainBanner && (
                                <Card className="bg-primary-900/40 border-primary-500/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-primary-300">
                                            {t('plantsView.inlineSelector.title')}
                                        </h3>
                                        <p className="text-sm text-slate-300">
                                            {t('plantsView.inlineSelector.subtitle')}{' '}
                                            {newGrowFlow.strain?.name}.
                                        </p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => dispatch(cancelNewGrow())}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                </Card>
                            )}
                            {isLoading ? (
                                <PlantSlotsSkeleton />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {slotsWithData.map((slot, index) => {
                                        if (
                                            newGrowFlow.status === 'selectingStrain' &&
                                            newGrowFlow.slotIndex === index
                                        ) {
                                            return (
                                                <InlineStrainSelector
                                                    key={`selector-${index}`}
                                                    onClose={() => dispatch(cancelNewGrow())}
                                                    onSelectStrain={(strain) =>
                                                        dispatch(selectStrainForGrow(strain))
                                                    }
                                                />
                                            )
                                        }
                                        return slot.plant ? (
                                            <PlantSlotWrapper
                                                key={slot.plant.id}
                                                plant={slot.plant}
                                            />
                                        ) : slot.isArchivedHidden && slot.archivedPlantId ? (
                                            <HiddenArchivedSlot
                                                key={`archived-${slot.archivedPlantId}`}
                                                plantId={slot.archivedPlantId}
                                            />
                                        ) : (
                                            <EmptyPlantSlot
                                                key={`empty-${index}`}
                                                index={index}
                                                onSlotClick={handleEmptySlotClick}
                                            />
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <Suspense fallback={null}>
                                <GrowReminderPanel />
                                <SensorIntegrationPanel />
                            </Suspense>
                            <TasksAndWarnings tasks={tasks} problems={problems} />
                            <Suspense fallback={null}>
                                <GlobalAdvisorArchiveView />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

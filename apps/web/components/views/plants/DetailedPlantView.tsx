import React, { useState, memo, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plant, PlantStage } from '@/types'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { OverviewTab } from './detailedPlantViewTabs/OverviewTab'
import { JournalTab } from './detailedPlantViewTabs/JournalTab'
import { TasksTab } from './detailedPlantViewTabs/TasksTab'
import { PhotosTab } from './detailedPlantViewTabs/PhotosTab'
import { AiTab } from './detailedPlantViewTabs/AiTab'
import { PostHarvestTab } from './detailedPlantViewTabs/PostHarvestTab'
import { SimulationDebugTab } from './detailedPlantViewTabs/SimulationDebugTab'
import { useAppDispatch } from '@/stores/store'
import { completeTask, updatePlantToNow } from '@/stores/slices/simulationSlice'
import { EnvironmentControlPanel } from './controls/EnvironmentControlPanel'

interface DetailedPlantViewProps {
    plant: Plant
    onClose: () => void
}

const HEALTH_THRESHOLDS = { critical: 40, warn: 70 } as const

const getHealthTone = (health: number): { color: string; bg: string; label: string } => {
    if (health < HEALTH_THRESHOLDS.critical)
        return { color: 'text-red-400', bg: 'bg-red-500/15', label: 'critical' }
    if (health < HEALTH_THRESHOLDS.warn)
        return { color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'warn' }
    return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'good' }
}

const getStageBadgeColor = (stage: PlantStage): string => {
    switch (stage) {
        case PlantStage.Seed:
        case PlantStage.Germination:
            return 'bg-amber-500/20 text-amber-300 ring-amber-400/30'
        case PlantStage.Seedling:
            return 'bg-lime-500/20 text-lime-300 ring-lime-400/30'
        case PlantStage.Vegetative:
            return 'bg-green-500/20 text-green-300 ring-green-400/30'
        case PlantStage.Flowering:
            return 'bg-purple-500/20 text-purple-300 ring-purple-400/30'
        case PlantStage.Harvest:
            return 'bg-orange-500/20 text-orange-300 ring-orange-400/30'
        case PlantStage.Drying:
        case PlantStage.Curing:
            return 'bg-cyan-500/20 text-cyan-300 ring-cyan-400/30'
        case PlantStage.Finished:
            return 'bg-primary-500/20 text-primary-300 ring-primary-400/30'
        default:
            return 'bg-slate-500/20 text-slate-300 ring-slate-400/30'
    }
}

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = memo(({ plant, onClose }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [activeTab, setActiveTab] = useState('overview')
    const tabListRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        dispatch(updatePlantToNow(plant.id))
    }, [plant.id, dispatch])

    const isPostHarvest = useMemo(
        () =>
            [
                PlantStage.Harvest,
                PlantStage.Drying,
                PlantStage.Curing,
                PlantStage.Finished,
            ].includes(plant.stage),
        [plant.stage],
    )

    const tabs = useMemo(
        () => [
            {
                id: 'overview',
                label: t('plantsView.detailedView.tabs.overview'),
                icon: <PhosphorIcons.ChartPieSlice />,
            },
            {
                id: 'environment',
                label: t('plantsView.detailedView.tabs.environment', {
                    defaultValue: 'Environment',
                }),
                icon: <PhosphorIcons.Thermometer />,
            },
            ...(isPostHarvest
                ? [
                      {
                          id: 'postharvest',
                          label: t('plantsView.detailedView.tabs.postHarvest'),
                          icon: <PhosphorIcons.ArchiveBox />,
                      },
                  ]
                : []),
            {
                id: 'simulation',
                label: t('plantsView.detailedView.tabs.simulation'),
                icon: <PhosphorIcons.GearSix />,
            },
            {
                id: 'journal',
                label: t('plantsView.detailedView.tabs.journal'),
                icon: <PhosphorIcons.BookOpenText />,
                badge: plant.journal.length > 0 ? plant.journal.length : undefined,
            },
            {
                id: 'tasks',
                label: t('plantsView.detailedView.tabs.tasks'),
                icon: <PhosphorIcons.ListChecks />,
                badge: plant.tasks.filter((task) => !task.isCompleted).length || undefined,
            },
            {
                id: 'photos',
                label: t('plantsView.detailedView.tabs.photos'),
                icon: <PhosphorIcons.Camera />,
            },
            {
                id: 'ai',
                label: t('plantsView.detailedView.tabs.ai'),
                icon: <PhosphorIcons.Sparkle />,
            },
        ],
        [t, isPostHarvest, plant.journal.length, plant.tasks],
    )

    // Keyboard navigation: Escape closes, left/right arrows navigate tabs
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
                return
            }
            if (!tabListRef.current?.contains(document.activeElement)) return

            const currentIndex = tabs.findIndex((tab) => tab.id === activeTab)
            let nextIndex: number | undefined
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % tabs.length
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
            } else if (e.key === 'Home') {
                nextIndex = 0
            } else if (e.key === 'End') {
                nextIndex = tabs.length - 1
            }
            if (nextIndex != null) {
                e.preventDefault()
                const target = tabs[nextIndex]
                if (target) {
                    setActiveTab(target.id)
                    ;(tabListRef.current?.children[nextIndex] as HTMLElement)?.focus()
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [activeTab, tabs, onClose])

    const handleCompleteTask = useCallback(
        (taskId: string) => dispatch(completeTask({ plantId: plant.id, taskId })),
        [dispatch, plant.id],
    )

    const healthTone = getHealthTone(plant.health)
    const openProblems = plant.problems.filter((p) => p.status === 'active').length
    const stageBadgeColor = getStageBadgeColor(plant.stage)

    const header = (
        <header className="relative">
            <div className="flex items-center justify-between">
                <Button variant="secondary" onClick={onClose} size="sm">
                    <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                    {t('common.back')}
                </Button>
                {openProblems > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 ring-1 ring-inset ring-red-400/30">
                        <PhosphorIcons.WarningCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-bold text-red-300">
                            {openProblems} {t('plantsView.warnings.title')}
                        </span>
                    </div>
                )}
            </div>
            <div className="mt-4 text-center space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold font-display text-primary-300">
                    {plant.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${stageBadgeColor}`}
                    >
                        {t(`plantStages.${plant.stage}`)}
                    </span>
                    <span className="text-slate-400 text-sm">
                        {plant.strain.name} · {t('plantsView.plantCard.day')} {plant.age}
                    </span>
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${healthTone.bg} ${healthTone.color} ring-current/30`}
                    >
                        <PhosphorIcons.Heart className="w-3.5 h-3.5" weight="fill" />
                        {Math.round(plant.health)}%
                    </span>
                </div>
            </div>
        </header>
    )

    return (
        <div className="animate-fade-in space-y-6">
            {header}

            <div
                ref={tabListRef}
                className="flex flex-wrap justify-center gap-2 sm:gap-3"
                role="tablist"
                aria-label={t('plantsView.detailedView.tabs.overview')}
            >
                {tabs.map((tab) => (
                    <button
                        type="button"
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                        className={`relative flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-xl transition-all duration-200 w-[4.5rem] h-16 sm:w-24 sm:h-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                            activeTab === tab.id
                                ? 'bg-primary-600/90 text-white scale-105 shadow-lg shadow-primary-500/20 ring-1 ring-primary-400/60'
                                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white hover:scale-[1.02]'
                        }`}
                        role="tab"
                        id={`tab-${tab.id}`}
                        aria-selected={activeTab === tab.id}
                        aria-controls={`tabpanel-${tab.id}`}
                    >
                        <div className="w-6 h-6">{tab.icon}</div>
                        <span className="text-[0.65rem] sm:text-xs font-semibold text-center leading-tight">
                            {tab.label}
                        </span>
                        {'badge' in tab && tab.badge != null && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-900">
                                {tab.badge > 99 ? '99+' : tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className="animate-fade-in"
            >
                {activeTab === 'overview' && <OverviewTab plant={plant} />}
                {activeTab === 'environment' && (
                    <EnvironmentControlPanel plant={plant} />
                )}
                {activeTab === 'postharvest' && <PostHarvestTab plant={plant} />}
                {activeTab === 'simulation' && <SimulationDebugTab plant={plant} />}
                {activeTab === 'journal' && <JournalTab journal={plant.journal} />}
                {activeTab === 'tasks' && (
                    <TasksTab tasks={plant.tasks} onCompleteTask={handleCompleteTask} />
                )}
                {activeTab === 'photos' && <PhotosTab journal={plant.journal} />}
                {activeTab === 'ai' && <AiTab plant={plant} />}
            </div>
        </div>
    )
})

DetailedPlantView.displayName = 'DetailedPlantView'

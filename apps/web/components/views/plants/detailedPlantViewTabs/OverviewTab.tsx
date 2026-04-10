import React, { lazy, Suspense, useState, useMemo, memo, useCallback } from 'react'
import { Plant, ModalType, JournalEntryType, PlantStage } from '@/types'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'
import { EquipmentControls } from '../EquipmentControls'
import { ActionToolbar } from '../ActionToolbar'
import { useUIStore } from '@/stores/useUIStore'
import { PlantLifecycleTimeline } from '../PlantLifecycleTimeline'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { PlantVisualizer } from '../PlantVisualizer'
import { dbService } from '@/services/dbService'
import { RealtimeStatus } from '../RealtimeStatus'

const HistoryChart = lazy(() =>
    import('../HistoryChart').then((m) => ({ default: m.HistoryChart })),
)
const VPDChart = lazy(() => import('../VPDChart').then((m) => ({ default: m.VPDChart })))

interface OverviewTabProps {
    plant: Plant
}

interface QuickVital {
    label: string
    value: string
    icon: React.ReactNode
    tone: 'good' | 'warn' | 'critical'
}

const VitalStat: React.FC<{
    label: string
    value: string
    icon: React.ReactNode
    tone?: 'good' | 'warn' | 'critical'
}> = ({ label, value, icon, tone = 'good' }) => {
    const toneClasses = {
        good: 'text-emerald-400 bg-emerald-500/10 ring-emerald-400/20',
        warn: 'text-amber-400 bg-amber-500/10 ring-amber-400/20',
        critical: 'text-red-400 bg-red-500/10 ring-red-400/20',
    }
    return (
        <div
            className={`flex items-center gap-3 rounded-lg p-3 ring-1 ring-inset ${toneClasses[tone]}`}
        >
            <div className="w-5 h-5 flex-shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-bold">{value}</p>
            </div>
        </div>
    )
}

export const OverviewTab: React.FC<OverviewTabProps> = memo(({ plant }) => {
    const { t } = useTranslation()
    const [isExporting, setIsExporting] = useState(false)

    const openActionModalAction = useCallback(
        (type: ModalType) => {
            useUIStore.getState().openActionModal({ plantId: plant.id, type })
        },
        [plant.id],
    )

    const handleDiagnose = useCallback(() => {
        useUIStore.getState().openDiagnosticsModal(plant.id)
    }, [plant.id])

    const handleExportReport = useCallback(async () => {
        setIsExporting(true)
        try {
            const photoEntries = plant.journal
                .filter((entry) => entry.type === JournalEntryType.Photo)
                .slice(-6)

            const photoDataUrls: string[] = []
            for (const entry of photoEntries) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const details = entry.details as { imageUrl?: string; imageId?: string } | undefined
                if (details?.imageUrl) {
                    photoDataUrls.push(details.imageUrl)
                    continue
                }
                if (details?.imageId) {
                    const storedImage = await dbService.getImage(details.imageId)
                    if (storedImage?.data) {
                        photoDataUrls.push(storedImage.data)
                    }
                }
            }

            const { exportService } = await import('@/services/exportService')
            await exportService.exportPlantReportPdf({
                plant,
                t,
                chartElement: document.getElementById(`history-chart-${plant.id}`),
                photos: photoDataUrls,
            })
        } finally {
            setIsExporting(false)
        }
    }, [plant, t])

    const vitalsTone = useCallback(
        (value: number, min: number, max: number): 'good' | 'warn' | 'critical' => {
            if (value < min * 0.8 || value > max * 1.2) return 'critical'
            if (value < min || value > max) return 'warn'
            return 'good'
        },
        [],
    )

    const isPostHarvest = useMemo(
        () => [PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(plant.stage),
        [plant.stage],
    )

    const quickVitals = useMemo<QuickVital[]>(
        () => [
            {
                label: t('plantsView.vitals.ph'),
                value: plant.medium.ph.toFixed(2),
                icon: <span className="font-bold text-xs">pH</span>,
                tone: vitalsTone(plant.medium.ph, 5.8, 6.8),
            },
            {
                label: t('plantsView.vitals.ec'),
                value: plant.medium.ec.toFixed(2),
                icon: <PhosphorIcons.Lightning className="w-full h-full" />,
                tone: vitalsTone(plant.medium.ec, 0.8, 2.4),
            },
            {
                label: t('plantsView.vitals.moisture'),
                value: `${plant.medium.moisture.toFixed(0)}%`,
                icon: <PhosphorIcons.Drop className="w-full h-full" />,
                tone: vitalsTone(plant.medium.moisture, 30, 70),
            },
            {
                label: t('plantsView.gardenVitals.avgTemp'),
                value: `${plant.environment.internalTemperature.toFixed(1)}°C`,
                icon: <PhosphorIcons.Thermometer className="w-full h-full" />,
                tone: vitalsTone(plant.environment.internalTemperature, 20, 30),
            },
            {
                label: t('plantsView.gardenVitals.avgHumidity'),
                value: `${plant.environment.internalHumidity.toFixed(0)}%`,
                icon: <PhosphorIcons.Drop className="w-full h-full" />,
                tone: vitalsTone(plant.environment.internalHumidity, 40, 70),
            },
            {
                label: 'VPD',
                value: `${plant.environment.vpd.toFixed(2)} kPa`,
                icon: <PhosphorIcons.ChartLineUp className="w-full h-full" />,
                tone: vitalsTone(plant.environment.vpd, 0.8, 1.6),
            },
        ],
        [plant.medium, plant.environment, t, vitalsTone],
    )

    return (
        <div className="space-y-6">
            {/* 1. Visualizer + Quick Vitals */}
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                    {t('plantsView.detailedView.growthAndVisuals')}
                </h3>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="h-64 md:h-72 flex items-center justify-center flex-shrink-0">
                        <PlantVisualizer plant={plant} className="w-56 h-56 md:w-64 md:h-64" />
                    </div>
                    <div className="flex-grow w-full space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {quickVitals.map((vital) => (
                                <VitalStat
                                    key={vital.label}
                                    label={vital.label}
                                    value={vital.value}
                                    icon={vital.icon}
                                    tone={vital.tone}
                                />
                            ))}
                        </div>
                        {!isPostHarvest && <RealtimeStatus createdAt={plant.createdAt} />}
                    </div>
                </div>
            </Card>

            {/* 2. Lifecycle */}
            <Card>
                <PlantLifecycleTimeline currentStage={plant.stage} currentAge={plant.age} />
            </Card>

            {/* 3. Actions */}
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                    {t('common.actions')}
                </h3>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                    <ActionToolbar onLogAction={openActionModalAction} />
                </div>
                <Button onClick={handleDiagnose} size="sm" className="w-full mt-4">
                    <PhosphorIcons.Sparkle className="w-5 h-5 mr-2" />
                    {t('plantsView.aiDiagnostics.diagnoseProblem')}
                </Button>
            </Card>

            {/* 4. Equipment Controls */}
            <EquipmentControls plant={plant} />

            {/* 5. Growth History Chart */}
            <Card>
                <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-xl font-bold font-display text-primary-400">
                        {t('plantsView.detailedView.history')}
                    </h3>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleExportReport}
                        disabled={isExporting}
                    >
                        <PhosphorIcons.FilePdf className="w-5 h-5 mr-1" />
                        {isExporting ? t('common.exporting') : t('common.exportPdf')}
                    </Button>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div
                        className="h-64 rounded-lg"
                        data-highlight-id="history-chart"
                        id={`history-chart-${plant.id}`}
                    >
                        <Suspense
                            fallback={
                                <div className="h-64 animate-pulse bg-slate-700/30 rounded-lg" />
                            }
                        >
                            <HistoryChart
                                history={plant.history}
                                journal={plant.journal}
                                plantCreatedAt={plant.createdAt}
                            />
                        </Suspense>
                    </div>
                </div>
            </Card>

            {/* 6. Hourly VPD Simulation */}
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                    {t('plantsView.vpd.simulation24h')}
                </h3>
                <Suspense
                    fallback={<div className="h-64 animate-pulse bg-slate-700/30 rounded-lg" />}
                >
                    <VPDChart plant={plant} />
                </Suspense>
            </Card>
        </div>
    )
})

OverviewTab.displayName = 'OverviewTab'

import React, { memo } from 'react'
import { JournalEntryType, Plant, PlantStage } from '@/types'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { processPostHarvest } from '@/stores/slices/simulationSlice'
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { selectSettings } from '@/stores/selectors'

interface PostHarvestTabProps {
    plant: Plant
}

type WarningTone = 'good' | 'warn' | 'critical'

type ProcessWarning = {
    title: string
    value: string
    description: string
    tone: WarningTone
}

const isStringValue = (value: string | null): value is string => value !== null
const isNumericEntry = (entry: [string, unknown]): entry is [string, number] => {
    const [, value] = entry
    return typeof value === 'number' && Number.isFinite(value)
}

const calculateBurpDebtDays = (currentCureDay: number, lastBurpDay: number): number =>
    Math.max(0, currentCureDay - lastBurpDay - 1)

const getPostHarvestRecommendations = (
    plant: Plant,
    harvestData: NonNullable<Plant['harvestData']>,
    burpDebtDays: number,
    t: (key: string) => string,
): string[] =>
    [
        plant.stage === PlantStage.Drying && harvestData.jarHumidity > 64
            ? t('plantsView.postHarvest.recommendations.lowerHumidity')
            : null,
        plant.stage === PlantStage.Drying && harvestData.moldRiskPercent > 28
            ? t('plantsView.postHarvest.recommendations.increaseAirflow')
            : null,
        plant.stage === PlantStage.Curing && burpDebtDays > 0
            ? t('plantsView.postHarvest.recommendations.burpNow')
            : null,
        plant.stage === PlantStage.Curing && Math.abs(harvestData.jarHumidity - 61) > 2
            ? t('plantsView.postHarvest.recommendations.stabilizeJarRh')
            : null,
        harvestData.finalQuality > 85
            ? t('plantsView.postHarvest.recommendations.holdSteady')
            : null,
    ].filter(isStringValue)

const getJarHumidityTone = (stage: PlantStage, jarHumidity: number): WarningTone => {
    if (stage === PlantStage.Curing) {
        if (Math.abs(jarHumidity - 61) > 4) return 'critical'
        if (Math.abs(jarHumidity - 61) > 2) return 'warn'
        return 'good'
    }

    if (jarHumidity > 66) return 'critical'
    if (jarHumidity > 63) return 'warn'
    return 'good'
}

const getMoldRiskTone = (moldRiskPercent: number): WarningTone => {
    if (moldRiskPercent > 35) return 'critical'
    if (moldRiskPercent > 20) return 'warn'
    return 'good'
}

const getBurpDebtTone = (burpDebtDays: number): WarningTone => {
    if (burpDebtDays > 1) return 'critical'
    if (burpDebtDays > 0) return 'warn'
    return 'good'
}

const getTerpeneRetentionTone = (terpeneRetentionPercent: number): WarningTone => {
    if (terpeneRetentionPercent < 65) return 'critical'
    if (terpeneRetentionPercent < 80) return 'warn'
    return 'good'
}

const buildProcessWarnings = (
    plant: Plant,
    harvestData: NonNullable<Plant['harvestData']>,
    burpDebtDays: number,
    t: (key: string) => string,
): ProcessWarning[] => [
    {
        title: t('plantsView.postHarvest.thresholds.jarHumidity'),
        value: `${harvestData.jarHumidity.toFixed(1)}%`,
        description:
            plant.stage === PlantStage.Curing
                ? t('plantsView.postHarvest.thresholds.jarHumidityCureHint')
                : t('plantsView.postHarvest.thresholds.jarHumidityDryHint'),
        tone: getJarHumidityTone(plant.stage, harvestData.jarHumidity),
    },
    {
        title: t('plantsView.postHarvest.thresholds.moldRisk'),
        value: `${harvestData.moldRiskPercent.toFixed(0)}%`,
        description: t('plantsView.postHarvest.thresholds.moldRiskHint'),
        tone: getMoldRiskTone(harvestData.moldRiskPercent),
    },
    {
        title: t('plantsView.postHarvest.thresholds.burpDebt'),
        value: `${burpDebtDays}`,
        description: t('plantsView.postHarvest.thresholds.burpDebtHint'),
        tone: getBurpDebtTone(burpDebtDays),
    },
    {
        title: t('plantsView.postHarvest.thresholds.terpeneRetention'),
        value: `${harvestData.terpeneRetentionPercent.toFixed(0)}%`,
        description: t('plantsView.postHarvest.thresholds.terpeneRetentionHint'),
        tone: getTerpeneRetentionTone(harvestData.terpeneRetentionPercent),
    },
]

const ProgressBar: React.FC<{ label: string; progress: number; color?: string }> = ({
    label,
    progress,
    color = 'bg-primary-500',
}) => (
    <div>
        <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-slate-300">{label}</span>
            <span className="text-sm font-medium text-slate-300">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
                className={`${color} h-2.5 rounded-full transition-all duration-300`}
                style={{ width: `${progress}%` }}
            />
        </div>
    </div>
)

const toneClasses: Record<WarningTone, string> = {
    good: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    warn: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    critical: 'border-red-400/30 bg-red-500/10 text-red-200',
}

const WarningBadge: React.FC<{
    title: string
    value: string
    description: string
    tone: WarningTone
}> = ({ title, value, description, tone }) => (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
        <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{title}</p>
            <span className="text-xs font-bold uppercase tracking-[0.2em]">{value}</span>
        </div>
        <p className="mt-2 text-xs opacity-90">{description}</p>
    </div>
)

const BurpCalendar: React.FC<{ currentDay: number; lastBurpDay: number }> = ({
    currentDay,
    lastBurpDay,
}) => {
    const { t } = useTranslation()
    const days = Array.from(
        { length: PLANT_STAGE_DETAILS[PlantStage.Curing].duration },
        (_, i) => i + 1,
    )
    const isOverdue = currentDay > lastBurpDay + 1

    return (
        <div>
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-lg text-slate-100 mb-2">
                    {t('plantsView.postHarvest.burpJars')}
                </h4>
                {isOverdue && (
                    <span className="text-sm font-bold text-red-400 animate-pulse">
                        {t('plantsView.postHarvest.burpOverdue')}
                    </span>
                )}
            </div>
            <div className="flex flex-wrap gap-1">
                {days.map((day) => {
                    const isBurped = day <= lastBurpDay
                    const isCurrent = day === currentDay
                    const ringClass = isCurrent ? 'ring-2 ring-primary-400' : ''
                    const stateClass = isBurped ? 'bg-green-500 text-white' : 'bg-slate-700'
                    return (
                        <div
                            key={day}
                            title={`Day ${day}`}
                            className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold ${ringClass} ${stateClass}`}
                        >
                            {day}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export const PostHarvestTab: React.FC<PostHarvestTabProps> = memo(({ plant }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const harvestData = plant.harvestData
    const isFinished = plant.stage === PlantStage.Finished

    if (!harvestData) {
        return (
            <Card>
                <p>{t('common.error')}</p>
            </Card>
        )
    }

    const dryingProgress =
        (harvestData.currentDryDay / PLANT_STAGE_DETAILS[PlantStage.Drying].duration) * 100
    const curingProgress =
        (harvestData.currentCureDay / PLANT_STAGE_DETAILS[PlantStage.Curing].duration) * 100
    const burpDebtDays = calculateBurpDebtDays(harvestData.currentCureDay, harvestData.lastBurpDay)
    const postHarvestEvents = plant.journal
        .filter((entry) => entry.type === JournalEntryType.PostHarvest)
        .toSorted((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8)

    const postHarvestRecommendations = getPostHarvestRecommendations(
        plant,
        harvestData,
        burpDebtDays,
        t,
    )
    const processWarnings = buildProcessWarnings(plant, harvestData, burpDebtDays, t)
    const getStagePanelClassName = (isActiveStage: boolean): string =>
        `p-4 rounded-lg space-y-4 ${isActiveStage ? 'bg-slate-800' : 'bg-slate-800/50 opacity-70'}`
    const handleProcessPostHarvest = (action: 'dry' | 'burp' | 'cure'): void => {
        dispatch(
            processPostHarvest({
                plantId: plant.id,
                action,
                simulationSettings: settings.simulation,
            }),
        )
    }

    const topTerpenes = Object.entries(harvestData.terpeneProfile ?? {})
        .filter(isNumericEntry)
        .toSorted(([, a], [, b]) => b - a)
        .slice(0, 3)

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">
                    {t('plantsView.postHarvest.title')}
                </h3>

                {isFinished ? (
                    <div className="text-center p-8 bg-slate-800 rounded-lg">
                        <h4 className="text-2xl font-bold text-green-400">
                            {t('plantsView.postHarvest.processComplete')}
                        </h4>
                        <p className="text-lg mt-2">
                            {t('plantsView.postHarvest.finalQuality')}:{' '}
                            <span className="font-bold">
                                {harvestData.finalQuality.toFixed(1)}/100
                            </span>
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={getStagePanelClassName(plant.stage === PlantStage.Drying)}>
                            <h4 className="font-bold text-lg text-slate-100">
                                {t('plantsView.postHarvest.drying')}
                            </h4>
                            <ProgressBar
                                label={t('plantsView.postHarvest.dryingProgress')}
                                progress={dryingProgress}
                            />
                            <p className="text-sm text-slate-400">
                                {t('plantsView.postHarvest.day')} {harvestData.currentDryDay} /{' '}
                                {PLANT_STAGE_DETAILS[PlantStage.Drying].duration}
                            </p>
                            <p className="text-xs text-slate-500">
                                {t('plantsView.postHarvest.targetDryingWindow')}
                            </p>
                            <div className="space-y-2">
                                <ProgressBar
                                    label={t('plantsView.postHarvest.terpeneRetention')}
                                    progress={harvestData.terpeneRetentionPercent}
                                    color="bg-amber-500"
                                />
                                <ProgressBar
                                    label={t('plantsView.postHarvest.moldRisk')}
                                    progress={harvestData.moldRiskPercent}
                                    color="bg-red-500"
                                />
                            </div>
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleProcessPostHarvest('dry')}
                                disabled={
                                    ![PlantStage.Harvest, PlantStage.Drying].includes(plant.stage)
                                }
                            >
                                {t('plantsView.postHarvest.simulateNextDay')}
                            </Button>
                        </div>

                        <div className={getStagePanelClassName(plant.stage === PlantStage.Curing)}>
                            <h4 className="font-bold text-lg text-slate-100">
                                {t('plantsView.postHarvest.curing')}
                            </h4>
                            <ProgressBar
                                label={t('plantsView.postHarvest.curingProgress')}
                                progress={curingProgress}
                            />
                            <p className="text-sm text-slate-400">
                                {t('plantsView.postHarvest.day')} {harvestData.currentCureDay} /{' '}
                                {PLANT_STAGE_DETAILS[PlantStage.Curing].duration}
                            </p>
                            <p className="text-xs text-slate-500">
                                {t('plantsView.postHarvest.targetCuringWindow')}
                            </p>
                            <BurpCalendar
                                currentDay={harvestData.currentCureDay}
                                lastBurpDay={harvestData.lastBurpDay}
                            />
                            <div className="flex gap-2 mt-4">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => handleProcessPostHarvest('burp')}
                                    disabled={plant.stage !== PlantStage.Curing}
                                >
                                    <PhosphorIcons.Fan className="w-4 h-4 mr-1" />{' '}
                                    {t('plantsView.postHarvest.burpJars')}
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleProcessPostHarvest('cure')}
                                    disabled={plant.stage !== PlantStage.Curing}
                                >
                                    {t('plantsView.postHarvest.simulateNextDay')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">
                    {t('plantsView.postHarvest.thresholds.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {processWarnings.map((warning) => (
                        <WarningBadge
                            key={warning.title}
                            title={warning.title}
                            value={warning.value}
                            description={warning.description}
                            tone={warning.tone}
                        />
                    ))}
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">
                    {t('plantsView.postHarvest.processNotes')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10">
                        <p className="text-sm text-slate-400">
                            {t('plantsView.postHarvest.jarHumidity')}
                        </p>
                        <p className="text-2xl font-bold text-cyan-300">
                            {harvestData.jarHumidity.toFixed(1)}%
                        </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10">
                        <p className="text-sm text-slate-400">
                            {t('plantsView.postHarvest.chlorophyll')}
                        </p>
                        <p className="text-2xl font-bold text-lime-300">
                            {harvestData.chlorophyllPercent.toFixed(1)}%
                        </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10">
                        <p className="text-sm text-slate-400">
                            {t('plantsView.postHarvest.burpDebt')}
                        </p>
                        <p className="text-2xl font-bold text-amber-300">{burpDebtDays}</p>
                    </div>
                </div>
                <div className="mt-4 rounded-lg bg-slate-900/60 p-4 ring-1 ring-white/10">
                    <p className="text-sm font-semibold text-slate-200 mb-2">
                        {t('plantsView.postHarvest.recommendationsTitle')}
                    </p>
                    {postHarvestRecommendations.length > 0 ? (
                        <div className="space-y-2 text-sm text-slate-300">
                            {postHarvestRecommendations.map((recommendation) => (
                                <p key={recommendation}>• {recommendation}</p>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">
                            {t('plantsView.postHarvest.recommendations.none')}
                        </p>
                    )}
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">
                    {t('plantsView.postHarvest.eventTimeline')}
                </h3>
                {postHarvestEvents.length > 0 ? (
                    <div className="space-y-3">
                        {postHarvestEvents.map((entry) => (
                            <div
                                key={entry.id}
                                className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="font-semibold text-slate-100">{entry.notes}</p>
                                    <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                                        {new Date(entry.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400">
                        {t('plantsView.postHarvest.noEventsYet')}
                    </p>
                )}
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">
                    {t('plantsView.postHarvest.chemicalProfile')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-300">
                            {t('plantsView.postHarvest.chlorophyll')}
                        </p>
                        <p className="text-2xl font-bold text-green-400">
                            {harvestData.chlorophyllPercent.toFixed(1)}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-300">THC</p>
                        <p className="text-2xl font-bold text-amber-400">
                            {harvestData.cannabinoidProfile.thc.toFixed(2)}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-300">
                            {t('plantsView.postHarvest.cbn')}
                        </p>
                        <p className="text-2xl font-bold text-indigo-400">
                            {harvestData.cannabinoidProfile.cbn.toFixed(2)}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-300">
                            {t('plantsView.postHarvest.terpenes')}
                        </p>
                        <div className="text-sm font-bold text-purple-400">
                            {topTerpenes.map(([name, val]) => (
                                <div key={name}>
                                    {name}: {val.toFixed(2)}%
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
})

PostHarvestTab.displayName = 'PostHarvestTab'

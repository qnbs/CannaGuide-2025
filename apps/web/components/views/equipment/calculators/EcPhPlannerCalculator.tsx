import React, { memo, useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection, Input, ResultDisplay, Select } from './common'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { PlantStage } from '@/types'
import {
    addReading,
    setMedium,
    toggleAutoAdjust,
    updateScheduleEntry,
    dismissAlert,
    clearAlerts,
    setAiLoading,
    setAiRecommendation,
    getOptimalRange,
    applyPluginSchedule,
    detachPlugin,
} from '@/stores/slices/nutrientPlannerSlice'
import {
    selectNutrientSchedule,
    selectNutrientReadings,
    selectActiveNutrientAlerts,
    selectNutrientMedium,
    selectNutrientAutoAdjust,
    selectNutrientAiLoading,
    selectNutrientAiRecommendation,
    selectNutrientAutoAdjustRecommendation,
} from '@/stores/selectors'
import { selectActivePlants, selectSettings } from '@/stores/selectors'
import { aiService } from '@/services/aiService'
import { pluginService } from '@/services/pluginService'
import type { NutrientSchedulePlugin } from '@/services/pluginService'
import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StageLabel: React.FC<{ stage: PlantStage }> = memo(({ stage }) => {
    const { t } = useTranslation()
    return <span>{t(`plantStages.${stage}`)}</span>
})
StageLabel.displayName = 'StageLabel'

const AlertBadge: React.FC<{ type: string }> = memo(({ type }) => {
    const isHigh = type.includes('high')
    const isEc = type.includes('ec')
    const metricLabel = isEc ? 'EC' : 'pH'
    const directionLabel = isHigh ? '↑' : '↓'
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                isHigh ? 'bg-red-900/50 text-red-300' : 'bg-amber-900/50 text-amber-300',
            )}
        >
            {metricLabel} {directionLabel}
        </span>
    )
})
AlertBadge.displayName = 'AlertBadge'

// ---------------------------------------------------------------------------
// Optimal Range Display
// ---------------------------------------------------------------------------

const OptimalRangeBar: React.FC<{
    label: string
    value: number
    min: number
    max: number
    absoluteMin: number
    absoluteMax: number
    unit: string
}> = memo(({ label, value, min, max, absoluteMin, absoluteMax, unit }) => {
    const range = absoluteMax - absoluteMin
    const leftPct = ((min - absoluteMin) / range) * 100
    const widthPct = ((max - min) / range) * 100
    const valuePct = Math.max(0, Math.min(100, ((value - absoluteMin) / range) * 100))
    const inRange = value >= min && value <= max

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
                <span>{label}</span>
                <span className={cn(inRange ? 'text-green-400' : 'text-red-400', 'font-semibold')}>
                    {value.toFixed(2)} {unit}
                </span>
            </div>
            <div className="relative h-3 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                    className="absolute inset-y-0 bg-green-900/40 border border-green-500/30 rounded-full"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
                <div
                    className={cn(
                        'absolute top-0 h-full w-1 rounded-full transition-all',
                        inRange ? 'bg-green-400' : 'bg-red-400',
                    )}
                    style={{ left: `${valuePct}%` }}
                />
            </div>
            <div className="flex justify-between text-[0.6rem] text-slate-500">
                <span>{absoluteMin.toFixed(1)}</span>
                <span className="text-green-500/70">
                    {min.toFixed(1)} – {max.toFixed(1)}
                </span>
                <span>{absoluteMax.toFixed(1)}</span>
            </div>
        </div>
    )
})
OptimalRangeBar.displayName = 'OptimalRangeBar'

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const EcPhPlannerCalculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    // Redux state
    const schedule = useAppSelector(selectNutrientSchedule)
    const readings = useAppSelector(selectNutrientReadings)
    const alerts = useAppSelector(selectActiveNutrientAlerts)
    const medium = useAppSelector(selectNutrientMedium)
    const autoAdjust = useAppSelector(selectNutrientAutoAdjust)
    const aiLoading = useAppSelector(selectNutrientAiLoading)
    const aiRecommendation = useAppSelector(selectNutrientAiRecommendation)
    const autoAdjustRecommendation = useAppSelector(selectNutrientAutoAdjustRecommendation)
    const activePlants = useAppSelector(selectActivePlants)
    const settings = useAppSelector(selectSettings)

    // Local input state
    const [inputEc, setInputEc] = useState(1.2)
    const [inputPh, setInputPh] = useState(6.2)
    const [inputWaterTemp, setInputWaterTemp] = useState(20)
    const [readingType, setReadingType] = useState<'input' | 'runoff'>('input')
    const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'monitor' | 'schedule' | 'history'>('monitor')

    // Nutrient plugins
    const [nutrientPlugins, setNutrientPlugins] = useState<NutrientSchedulePlugin[]>([])
    useEffect(() => {
        setNutrientPlugins(pluginService.getNutrientSchedules())
    }, [])

    // Derived
    const currentStage = useMemo(() => {
        if (selectedPlantId) {
            const plant = activePlants.find((p) => p.id === selectedPlantId)
            return plant?.stage ?? PlantStage.Vegetative
        }
        return PlantStage.Vegetative
    }, [activePlants, selectedPlantId])

    const optimalRange = useMemo(
        () => getOptimalRange(medium, currentStage),
        [medium, currentStage],
    )

    const recentReadings = useMemo(() => readings.slice(-10).reverse(), [readings])

    const plantOptions = useMemo(
        () => [
            { value: '', label: t('equipmentView.calculators.ecPhPlanner.allPlants') },
            ...activePlants.map((p) => ({ value: p.id, label: p.name })),
        ],
        [activePlants, t],
    )

    // Handlers
    const handleAddReading = useCallback(() => {
        dispatch(
            addReading({
                plantId: selectedPlantId,
                ec: inputEc,
                ph: inputPh,
                waterTempC: inputWaterTemp,
                readingType,
                notes: '',
            }),
        )
    }, [dispatch, selectedPlantId, inputEc, inputPh, inputWaterTemp, readingType])

    const handleGetAiRecommendation = useCallback(async () => {
        dispatch(setAiLoading(true))
        try {
            const lang = settings.general.language ?? 'en'
            const plantContext = selectedPlantId
                ? activePlants.find((p) => p.id === selectedPlantId)
                : null

            const recommendation = await aiService.getNutrientRecommendation(
                {
                    medium,
                    stage: currentStage,
                    currentEc: inputEc,
                    currentPh: inputPh,
                    optimalRange,
                    readings: recentReadings.slice(0, 5),
                    plant: plantContext ?? undefined,
                },
                lang,
            )
            dispatch(setAiRecommendation(recommendation))
        } catch {
            dispatch(setAiRecommendation(null))
        }
    }, [
        dispatch,
        settings.general.language,
        selectedPlantId,
        activePlants,
        medium,
        currentStage,
        inputEc,
        inputPh,
        optimalRange,
        recentReadings,
    ])

    const tabs = useMemo(
        () => [
            {
                id: 'monitor' as const,
                label: t('equipmentView.calculators.ecPhPlanner.tabs.monitor'),
                icon: <PhosphorIcons.ChartLineUp className="w-4 h-4" />,
            },
            {
                id: 'schedule' as const,
                label: t('equipmentView.calculators.ecPhPlanner.tabs.schedule'),
                icon: <PhosphorIcons.Book className="w-4 h-4" />,
            },
            {
                id: 'history' as const,
                label: t('equipmentView.calculators.ecPhPlanner.tabs.history'),
                icon: <PhosphorIcons.ChartPieSlice className="w-4 h-4" />,
            },
        ],
        [t],
    )

    return (
        <CalculatorSection
            title={t('equipmentView.calculators.ecPhPlanner.title')}
            description={t('equipmentView.calculators.ecPhPlanner.description')}
        >
            {/* Medium Selector */}
            <div className="flex gap-2 flex-wrap">
                {(['Soil', 'Coco', 'Hydro'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => dispatch(setMedium(m))}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                            medium === m
                                ? 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/50'
                                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200',
                        )}
                    >
                        {m}
                    </button>
                ))}
                <button
                    onClick={() => dispatch(toggleAutoAdjust())}
                    className={cn(
                        'ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                        autoAdjust
                            ? 'bg-green-900/30 text-green-300 ring-1 ring-green-500/50'
                            : 'bg-slate-800/50 text-slate-400 hover:text-slate-200',
                    )}
                >
                    <PhosphorIcons.Lightning className="w-3.5 h-3.5" />
                    {t('equipmentView.calculators.ecPhPlanner.autoAdjust')}
                </button>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="flex items-center gap-2 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2"
                        >
                            <PhosphorIcons.WarningCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <AlertBadge type={alert.type} />
                            <span className="text-sm text-slate-300 flex-grow">
                                {alert.message}
                            </span>
                            <button
                                onClick={() => dispatch(dismissAlert(alert.id))}
                                className="text-slate-500 hover:text-slate-300"
                            >
                                <PhosphorIcons.X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {alerts.length > 1 && (
                        <button
                            onClick={() => dispatch(clearAlerts())}
                            className="text-xs text-slate-500 hover:text-slate-300"
                        >
                            {t('equipmentView.calculators.ecPhPlanner.clearAlerts')}
                        </button>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-800/30 rounded-lg p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-md text-sm font-semibold transition-colors',
                            activeTab === tab.id
                                ? 'bg-slate-700/60 text-primary-300'
                                : 'text-slate-400 hover:text-slate-200',
                        )}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Monitor Tab */}
            {activeTab === 'monitor' && (
                <div className="space-y-4">
                    {/* Optimal Range Visualization */}
                    <Card className="!p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <PhosphorIcons.CheckCircle className="w-4 h-4 text-primary-400" />
                            {t('equipmentView.calculators.ecPhPlanner.optimalRange')} ({medium} –{' '}
                            <StageLabel stage={currentStage} />)
                        </h4>
                        <OptimalRangeBar
                            label="EC"
                            value={inputEc}
                            min={optimalRange.ecMin}
                            max={optimalRange.ecMax}
                            absoluteMin={0}
                            absoluteMax={3.0}
                            unit="mS/cm"
                        />
                        <OptimalRangeBar
                            label="pH"
                            value={inputPh}
                            min={optimalRange.phMin}
                            max={optimalRange.phMax}
                            absoluteMin={4.0}
                            absoluteMax={8.0}
                            unit=""
                        />
                    </Card>

                    {/* Input Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                            label={t('equipmentView.calculators.ecPhPlanner.plant')}
                            options={plantOptions}
                            value={selectedPlantId ?? ''}
                            onChange={(e) => setSelectedPlantId(String(e.target.value) || null)}
                        />
                        <Select
                            label={t('equipmentView.calculators.ecPhPlanner.readingType')}
                            options={[
                                {
                                    value: 'input',
                                    label: t('equipmentView.calculators.ecPhPlanner.input'),
                                },
                                {
                                    value: 'runoff',
                                    label: t('equipmentView.calculators.ecPhPlanner.runoff'),
                                },
                            ]}
                            value={readingType}
                            onChange={(e) =>
                                setReadingType(String(e.target.value) as 'input' | 'runoff')
                            }
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                            label={t('equipmentView.calculators.ecPhPlanner.ecValue')}
                            type="number"
                            unit="mS/cm"
                            step="0.1"
                            min="0"
                            max="5"
                            value={inputEc}
                            onChange={(e) => setInputEc(Number(e.target.value))}
                            tooltip={t('equipmentView.calculators.ecPhPlanner.ecTooltip')}
                        />
                        <Input
                            label={t('equipmentView.calculators.ecPhPlanner.phValue')}
                            type="number"
                            unit=""
                            step="0.1"
                            min="0"
                            max="14"
                            value={inputPh}
                            onChange={(e) => setInputPh(Number(e.target.value))}
                            tooltip={t('equipmentView.calculators.ecPhPlanner.phTooltip')}
                        />
                        <Input
                            label={t('equipmentView.calculators.ecPhPlanner.waterTemp')}
                            type="number"
                            unit="°C"
                            step="0.5"
                            min="0"
                            max="40"
                            value={inputWaterTemp}
                            onChange={(e) => setInputWaterTemp(Number(e.target.value))}
                        />
                    </div>
                    <Button variant="primary" onClick={handleAddReading} className="w-full">
                        <PhosphorIcons.Plus className="w-4 h-4 mr-2" />
                        {t('equipmentView.calculators.ecPhPlanner.logReading')}
                    </Button>

                    {/* Auto-Adjust Recommendation */}
                    {autoAdjust && autoAdjustRecommendation && (
                        <Card className="!p-4 space-y-2 border-amber-500/20 bg-amber-900/10">
                            <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                                <PhosphorIcons.ArrowClockwise className="w-4 h-4" />
                                {t('equipmentView.calculators.ecPhPlanner.autoAdjust')}
                            </h4>
                            <p className="text-sm text-slate-300">{autoAdjustRecommendation}</p>
                        </Card>
                    )}

                    {/* AI Recommendation */}
                    <Card className="!p-4 space-y-3 border-primary-500/20">
                        <h4 className="text-sm font-semibold text-primary-300 flex items-center gap-2">
                            <PhosphorIcons.Sparkle className="w-4 h-4" />
                            {t('equipmentView.calculators.ecPhPlanner.aiRecommendation')}
                        </h4>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleGetAiRecommendation}
                            disabled={aiLoading}
                            className="w-full"
                        >
                            {aiLoading ? (
                                <>
                                    <PhosphorIcons.ArrowClockwise className="w-4 h-4 mr-2 animate-spin" />
                                    {t('ai.generating')}
                                </>
                            ) : (
                                <>
                                    <PhosphorIcons.Lightning className="w-4 h-4 mr-2" />
                                    {t('equipmentView.calculators.ecPhPlanner.getAiAdvice')}
                                </>
                            )}
                        </Button>
                        {aiRecommendation && (
                            <div
                                className="prose prose-sm prose-invert max-w-none text-slate-300 bg-slate-800/30 rounded-lg p-3"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(aiRecommendation),
                                }}
                            />
                        )}
                    </Card>
                </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
                <div className="space-y-3">
                    {/* Plugin Schedule Buttons */}
                    {nutrientPlugins.length > 0 && (
                        <Card className="!p-4 space-y-2">
                            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <PhosphorIcons.Lightning className="w-4 h-4 text-primary-400" />
                                {t('equipmentView.calculators.ecPhPlanner.nutrientPlugins')}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {nutrientPlugins.map((plugin) => (
                                    <Button
                                        key={plugin.id}
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            dispatch(
                                                applyPluginSchedule({
                                                    pluginId: plugin.id,
                                                    weeks: plugin.data.weeks,
                                                }),
                                            )
                                        }
                                    >
                                        {plugin.name}
                                    </Button>
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => dispatch(detachPlugin())}
                                >
                                    <PhosphorIcons.X className="w-3 h-3 mr-1" />
                                    {t('common.reset')}
                                </Button>
                            </div>
                        </Card>
                    )}
                    {schedule.map((entry) => {
                        const range = getOptimalRange(medium, entry.stage)
                        return (
                            <Card key={entry.id} className="!p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-slate-200">
                                        <StageLabel stage={entry.stage} />
                                    </h4>
                                    <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider">
                                        {t('equipmentView.calculators.ecPhPlanner.optimal')}: EC{' '}
                                        {range.ecMin}-{range.ecMax} | pH {range.phMin}-{range.phMax}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <Input
                                        label={t('equipmentView.calculators.ecPhPlanner.targetEc')}
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={entry.targetEc}
                                        onChange={(e) =>
                                            dispatch(
                                                updateScheduleEntry({
                                                    id: entry.id,
                                                    changes: { targetEc: Number(e.target.value) },
                                                }),
                                            )
                                        }
                                    />
                                    <Input
                                        label={t('equipmentView.calculators.ecPhPlanner.targetPh')}
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="14"
                                        value={entry.targetPh}
                                        onChange={(e) =>
                                            dispatch(
                                                updateScheduleEntry({
                                                    id: entry.id,
                                                    changes: { targetPh: Number(e.target.value) },
                                                }),
                                            )
                                        }
                                    />
                                    <Input
                                        label="N:P:K (N)"
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={entry.npkRatio.n}
                                        onChange={(e) =>
                                            dispatch(
                                                updateScheduleEntry({
                                                    id: entry.id,
                                                    changes: {
                                                        npkRatio: {
                                                            ...entry.npkRatio,
                                                            n: Number(e.target.value),
                                                        },
                                                    },
                                                }),
                                            )
                                        }
                                    />
                                    <Input
                                        label="N:P:K (P/K)"
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={entry.npkRatio.p}
                                        onChange={(e) =>
                                            dispatch(
                                                updateScheduleEntry({
                                                    id: entry.id,
                                                    changes: {
                                                        npkRatio: {
                                                            ...entry.npkRatio,
                                                            p: Number(e.target.value),
                                                            k: Number(e.target.value),
                                                        },
                                                    },
                                                }),
                                            )
                                        }
                                    />
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="space-y-2">
                    {recentReadings.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-6">
                            {t('equipmentView.calculators.ecPhPlanner.noReadings')}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-700/50">
                                        <th className="py-2 px-2">
                                            {t('equipmentView.calculators.ecPhPlanner.time')}
                                        </th>
                                        <th className="py-2 px-2">EC</th>
                                        <th className="py-2 px-2">pH</th>
                                        <th className="py-2 px-2">°C</th>
                                        <th className="py-2 px-2">
                                            {t('equipmentView.calculators.ecPhPlanner.type')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentReadings.map((reading) => {
                                        const range = getOptimalRange(medium, currentStage)
                                        const ecOk =
                                            reading.ec >= range.ecMin && reading.ec <= range.ecMax
                                        const phOk =
                                            reading.ph >= range.phMin && reading.ph <= range.phMax
                                        return (
                                            <tr
                                                key={reading.id}
                                                className="border-b border-slate-800/50"
                                            >
                                                <td className="py-1.5 px-2 text-slate-400">
                                                    {new Date(reading.timestamp).toLocaleTimeString(
                                                        [],
                                                        { hour: '2-digit', minute: '2-digit' },
                                                    )}
                                                </td>
                                                <td
                                                    className={cn(
                                                        'py-1.5 px-2 font-semibold',
                                                        ecOk ? 'text-green-400' : 'text-red-400',
                                                    )}
                                                >
                                                    {reading.ec.toFixed(2)}
                                                </td>
                                                <td
                                                    className={cn(
                                                        'py-1.5 px-2 font-semibold',
                                                        phOk ? 'text-green-400' : 'text-red-400',
                                                    )}
                                                >
                                                    {reading.ph.toFixed(2)}
                                                </td>
                                                <td className="py-1.5 px-2 text-slate-400">
                                                    {reading.waterTempC?.toFixed(1) ?? '–'}
                                                </td>
                                                <td className="py-1.5 px-2">
                                                    <span
                                                        className={cn(
                                                            'text-xs px-1.5 py-0.5 rounded',
                                                            reading.readingType === 'runoff'
                                                                ? 'bg-amber-900/30 text-amber-300'
                                                                : 'bg-blue-900/30 text-blue-300',
                                                        )}
                                                    >
                                                        {reading.readingType}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Summary Stats */}
                    {recentReadings.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                            <ResultDisplay
                                label={t('equipmentView.calculators.ecPhPlanner.avgEc')}
                                value={(
                                    recentReadings.reduce((s, r) => s + r.ec, 0) /
                                    recentReadings.length
                                ).toFixed(2)}
                                unit="mS/cm"
                            />
                            <ResultDisplay
                                label={t('equipmentView.calculators.ecPhPlanner.avgPh')}
                                value={(
                                    recentReadings.reduce((s, r) => s + r.ph, 0) /
                                    recentReadings.length
                                ).toFixed(2)}
                            />
                            <ResultDisplay
                                label={t('equipmentView.calculators.ecPhPlanner.minEc')}
                                value={Math.min(...recentReadings.map((r) => r.ec)).toFixed(2)}
                                unit="mS/cm"
                            />
                            <ResultDisplay
                                label={t('equipmentView.calculators.ecPhPlanner.maxEc')}
                                value={Math.max(...recentReadings.map((r) => r.ec)).toFixed(2)}
                                unit="mS/cm"
                            />
                        </div>
                    )}
                </div>
            )}
        </CalculatorSection>
    )
})

EcPhPlannerCalculator.displayName = 'EcPhPlannerCalculator'

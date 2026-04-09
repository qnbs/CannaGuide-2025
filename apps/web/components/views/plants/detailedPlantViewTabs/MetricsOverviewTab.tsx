import React, { useState, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'
import type { Plant } from '@/types'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectMetricsForPlant, addMetricsReading } from '@/stores/slices/metricsSlice'
import { selectHydroReadings } from '@/stores/slices/hydroSlice'
import { calculateVPD } from '@/lib/vpd/calculator'
import { VPDZoneMap } from '../VPDZoneMap'
import { secureRandom } from '@/utils/random'
import type { GrowthStage } from '@/types/simulation.types'
import { PlantStage } from '@/types'

interface MetricsOverviewTabProps {
    plant: Plant
}

type TimeRange = '24h' | '48h' | '7d'

const TIME_RANGES: Record<TimeRange, number> = {
    '24h': 86_400_000,
    '48h': 172_800_000,
    '7d': 604_800_000,
}

function mapPlantStageToGrowthStage(stage: PlantStage): GrowthStage | undefined {
    switch (stage) {
        case PlantStage.Seed:
        case PlantStage.Germination:
        case PlantStage.Seedling:
            return 'seedling'
        case PlantStage.Vegetative:
            return 'vegetative'
        case PlantStage.Flowering:
            return 'earlyFlower'
        case PlantStage.Harvest:
        case PlantStage.Drying:
        case PlantStage.Curing:
        case PlantStage.Finished:
            return 'lateFlower'
        default:
            return undefined
    }
}

export const MetricsOverviewTab: React.FC<MetricsOverviewTabProps> = memo(({ plant }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [timeRange, setTimeRange] = useState<TimeRange>('24h')
    const [activeTab, setActiveTab] = useState<'vpd' | 'metrics' | 'log'>('vpd')

    // Form state for quick log
    const [height, setHeight] = useState('')
    const [potWeight, setPotWeight] = useState('')
    const [co2, setCo2] = useState('')

    const metricsReadings = useAppSelector(selectMetricsForPlant(plant.id))
    const hydroReadings = useAppSelector(selectHydroReadings)

    const currentVPD = useMemo(
        () =>
            calculateVPD(plant.environment.internalTemperature, plant.environment.internalHumidity),
        [plant.environment.internalTemperature, plant.environment.internalHumidity],
    )

    const growthStage = useMemo(() => mapPlantStageToGrowthStage(plant.stage), [plant.stage])

    // Filter data by time range
    const cutoff = Date.now() - TIME_RANGES[timeRange]

    const chartData = useMemo(() => {
        const metricsFiltered = metricsReadings.filter((r) => r.timestamp >= cutoff)
        const hydroFiltered = hydroReadings.filter((r) => r.timestamp >= cutoff)

        // Merge timelines
        const allTimestamps = new Set([
            ...metricsFiltered.map((r) => r.timestamp),
            ...hydroFiltered.map((r) => r.timestamp),
        ])

        return Array.from(allTimestamps)
            .sort((a, b) => a - b)
            .map((ts) => {
                const metric = metricsFiltered.find((r) => r.timestamp === ts)
                const hydro = hydroFiltered.find((r) => r.timestamp === ts)
                return {
                    time: new Date(ts).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    vpd: currentVPD,
                    ph: hydro?.ph,
                    ec: hydro?.ec,
                    height: metric?.height,
                    potWeight: metric?.potWeight,
                    co2: metric?.co2,
                }
            })
    }, [metricsReadings, hydroReadings, cutoff, currentVPD])

    const handleAddReading = useCallback(() => {
        const reading = {
            id: `metrics-${Date.now()}-${Math.floor(secureRandom() * 1e6)}`,
            plantId: plant.id,
            timestamp: Date.now(),
            height: height !== '' ? Number(height) : undefined,
            potWeight: potWeight !== '' ? Number(potWeight) : undefined,
            co2: co2 !== '' ? Number(co2) : undefined,
        }
        dispatch(addMetricsReading(reading))
        setHeight('')
        setPotWeight('')
        setCo2('')
    }, [dispatch, plant.id, height, potWeight, co2])

    const tabs = [
        {
            id: 'vpd' as const,
            label: t('plantsView.metrics.vpdZone', { defaultValue: 'VPD Zone' }),
        },
        {
            id: 'metrics' as const,
            label: t('plantsView.metrics.charts', { defaultValue: 'Charts' }),
        },
        {
            id: 'log' as const,
            label: t('plantsView.metrics.quickLog', { defaultValue: 'Quick Log' }),
        },
    ]

    return (
        <div className="space-y-4">
            {/* Sub-tab navigation */}
            <div className="flex gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-primary-600/80 text-white'
                                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* VPD Zone Tab */}
            {activeTab === 'vpd' && (
                <VPDZoneMap
                    currentTemp={plant.environment.internalTemperature}
                    currentRH={plant.environment.internalHumidity}
                    currentStage={growthStage}
                />
            )}

            {/* Multi-Metric Charts Tab */}
            {activeTab === 'metrics' && (
                <div className="space-y-4">
                    {/* Time range selector */}
                    <div className="flex gap-2">
                        {(['24h', '48h', '7d'] as const).map((range) => (
                            <button
                                key={range}
                                type="button"
                                onClick={() => setTimeRange(range)}
                                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                                    timeRange === range
                                        ? 'bg-primary-600/80 text-white'
                                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    {/* Metric cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <MetricCard
                            label="VPD"
                            value={currentVPD.toFixed(2)}
                            unit="kPa"
                            color="text-green-400"
                        />
                        <MetricCard
                            label="pH"
                            value={
                                hydroReadings.length > 0
                                    ? (hydroReadings[hydroReadings.length - 1]?.ph.toFixed(1) ??
                                      '--')
                                    : '--'
                            }
                            unit=""
                            color="text-blue-400"
                        />
                        <MetricCard
                            label="EC"
                            value={
                                hydroReadings.length > 0
                                    ? (hydroReadings[hydroReadings.length - 1]?.ec.toFixed(2) ??
                                      '--')
                                    : '--'
                            }
                            unit="mS/cm"
                            color="text-purple-400"
                        />
                        <MetricCard
                            label={t('plantsView.metrics.heightLabel', {
                                defaultValue: 'Height',
                            })}
                            value={
                                metricsReadings.length > 0
                                    ? (metricsReadings[metricsReadings.length - 1]?.height?.toFixed(
                                          1,
                                      ) ?? '--')
                                    : '--'
                            }
                            unit="cm"
                            color="text-emerald-400"
                        />
                    </div>

                    {/* Chart */}
                    {chartData.length > 0 ? (
                        <div className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-inset ring-slate-700/50">
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis
                                        dataKey="time"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="ph"
                                        stroke="#3b82f6"
                                        dot={false}
                                        strokeWidth={2}
                                        name="pH"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ec"
                                        stroke="#a855f7"
                                        dot={false}
                                        strokeWidth={2}
                                        name="EC"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="height"
                                        stroke="#10b981"
                                        dot={false}
                                        strokeWidth={2}
                                        name={t('plantsView.metrics.heightLabel', {
                                            defaultValue: 'Height',
                                        })}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-slate-800/40 p-8 text-center">
                            <p className="text-sm text-slate-500">
                                {t('plantsView.metrics.noData', {
                                    defaultValue:
                                        'No metrics data yet. Add readings using Quick Log.',
                                })}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Log Form */}
            {activeTab === 'log' && (
                <div className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-inset ring-slate-700/50 space-y-4">
                    <p className="text-sm font-medium text-slate-300">
                        {t('plantsView.metrics.addReading', {
                            defaultValue: 'Add Metrics Reading',
                        })}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label
                                htmlFor="metrics-height"
                                className="block text-xs text-slate-400 mb-1"
                            >
                                {t('plantsView.metrics.heightLabel', { defaultValue: 'Height' })}{' '}
                                (cm)
                            </label>
                            <input
                                id="metrics-height"
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                min="0"
                                max="400"
                                step="0.5"
                                className="w-full rounded-lg bg-slate-700/60 border-0 px-3 py-2 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-primary-500"
                                placeholder="0.0"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="metrics-potweight"
                                className="block text-xs text-slate-400 mb-1"
                            >
                                {t('plantsView.metrics.potWeight', {
                                    defaultValue: 'Pot Weight',
                                })}{' '}
                                (g)
                            </label>
                            <input
                                id="metrics-potweight"
                                type="number"
                                value={potWeight}
                                onChange={(e) => setPotWeight(e.target.value)}
                                min="0"
                                max="50000"
                                step="10"
                                className="w-full rounded-lg bg-slate-700/60 border-0 px-3 py-2 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-primary-500"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="metrics-co2"
                                className="block text-xs text-slate-400 mb-1"
                            >
                                CO2 (ppm)
                            </label>
                            <input
                                id="metrics-co2"
                                type="number"
                                value={co2}
                                onChange={(e) => setCo2(e.target.value)}
                                min="0"
                                max="5000"
                                step="10"
                                className="w-full rounded-lg bg-slate-700/60 border-0 px-3 py-2 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-primary-500"
                                placeholder="400"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddReading}
                        disabled={height === '' && potWeight === '' && co2 === ''}
                        className="w-full rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-white transition-colors"
                    >
                        {t('plantsView.metrics.addReading', {
                            defaultValue: 'Add Metrics Reading',
                        })}
                    </button>
                </div>
            )}
        </div>
    )
})
MetricsOverviewTab.displayName = 'MetricsOverviewTab'

// ---------------------------------------------------------------------------
// MetricCard sub-component
// ---------------------------------------------------------------------------

const MetricCard: React.FC<{
    label: string
    value: string
    unit: string
    color: string
}> = memo(({ label, value, unit, color }) => (
    <div className="rounded-xl bg-slate-800/60 p-3 ring-1 ring-inset ring-slate-700/50 text-center">
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-xl font-bold ${color}`}>
            {value}
            {unit !== '' && <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>}
        </p>
    </div>
))
MetricCard.displayName = 'MetricCard'

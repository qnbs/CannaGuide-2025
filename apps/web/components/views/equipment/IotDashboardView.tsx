import React, {
    memo,
    useMemo,
    useEffect,
    useState,
    useCallback,
    useDeferredValue,
    useRef,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useSyncExternalStore } from 'react'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { sensorStore } from '@/stores/sensorStore'
import type { SensorConnectionState } from '@/stores/sensorStore'
import type { MqttTelemetryMetrics } from '@/types/iotSchemas'
import { useIotStore } from '@/stores/useIotStore'
import { cn } from '@/lib/utils'
import { predictiveAnalyticsService } from '@/services/predictiveAnalyticsService'
import type { PredictiveInsight, RiskLevel } from '@/services/predictiveAnalyticsService'
import { useAppSelector } from '@/stores/store'
import { selectActivePlants } from '@/stores/selectors'
import { timeSeriesService } from '@/services/timeSeriesService'

// ---------------------------------------------------------------------------
// Sparkline -- lightweight inline SVG chart for sensor history
// ---------------------------------------------------------------------------

interface SparklineProps {
    data: number[]
    width?: number
    height?: number
    color: string
    label: string
}

const Sparkline: React.FC<SparklineProps> = memo(
    ({ data, width = 200, height = 40, color, label }) => {
        if (data.length < 2) {
            return (
                <div
                    className="flex items-center justify-center text-xs text-slate-600"
                    style={{ width, height }}
                    role="img"
                    aria-label={label}
                >
                    --
                </div>
            )
        }

        const min = Math.min(...data)
        const max = Math.max(...data)
        const range = max - min || 1

        const points = data
            .map((val, i) => {
                const x = (i / (data.length - 1)) * width
                const y = height - ((val - min) / range) * (height - 4) - 2
                return `${x},${y}`
            })
            .join(' ')

        return (
            <svg width={width} height={height} role="img" aria-label={label} className="block">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
        )
    },
)
Sparkline.displayName = 'Sparkline'

// ---------------------------------------------------------------------------
// Connection status badge
// ---------------------------------------------------------------------------

const statusConfig: Record<SensorConnectionState, { color: string; pulse: boolean }> = {
    connected: { color: 'bg-emerald-500', pulse: true },
    connecting: { color: 'bg-yellow-500', pulse: true },
    disconnected: { color: 'bg-slate-600', pulse: false },
    error: { color: 'bg-red-500', pulse: false },
}

const ConnectionBadge: React.FC<{ status: SensorConnectionState }> = memo(({ status }) => {
    const cfg = statusConfig[status]
    return (
        <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
                {cfg.pulse && (
                    <span
                        className={cn(
                            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                            cfg.color,
                        )}
                    />
                )}
                <span className={cn('relative inline-flex rounded-full h-3 w-3', cfg.color)} />
            </span>
            <span className="text-sm text-slate-300 capitalize">{status}</span>
        </div>
    )
})
ConnectionBadge.displayName = 'ConnectionBadge'

// ---------------------------------------------------------------------------
// Gauge card for a single metric
// ---------------------------------------------------------------------------

interface GaugeCardProps {
    label: string
    value: number | null
    unit: string
    sparkData: number[]
    color: string
    optimalMin?: number
    optimalMax?: number
}

const GaugeCard: React.FC<GaugeCardProps> = memo(
    ({ label, value, unit, sparkData, color, optimalMin, optimalMax }) => {
        const isOptimal =
            value !== null &&
            optimalMin !== undefined &&
            optimalMax !== undefined &&
            value >= optimalMin &&
            value <= optimalMax

        const valueColor =
            value === null
                ? 'text-slate-500'
                : isOptimal
                  ? 'text-emerald-400'
                  : optimalMin !== undefined
                    ? 'text-amber-400'
                    : 'text-slate-100'

        return (
            <Card className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
                    {optimalMin !== undefined && optimalMax !== undefined && (
                        <span className="text-[10px] text-slate-600">
                            {optimalMin}-{optimalMax} {unit}
                        </span>
                    )}
                </div>
                <div className={cn('text-2xl font-bold font-display', valueColor)}>
                    {value !== null ? value.toFixed(1) : '--'}
                    <span className="text-sm text-slate-500 ml-1">{unit}</span>
                </div>
                <Sparkline data={sparkData} color={color} label={`${label} trend`} />
            </Card>
        )
    },
)
GaugeCard.displayName = 'GaugeCard'

// ---------------------------------------------------------------------------
// Telemetry panel
// ---------------------------------------------------------------------------

const TelemetryPanel: React.FC<{ telemetry: MqttTelemetryMetrics }> = memo(({ telemetry }) => {
    const { t } = useTranslation()
    const uptimePercent =
        telemetry.messagesReceived > 0
            ? (
                  ((telemetry.messagesReceived - telemetry.validationErrors) /
                      telemetry.messagesReceived) *
                  100
              ).toFixed(1)
            : '0.0'

    return (
        <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
                {t('settingsView.iot.telemetryTitle', { defaultValue: 'MQTT Telemetry' })}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                    <div className="text-lg font-bold text-slate-100">
                        {telemetry.messagesReceived}
                    </div>
                    <div className="text-[10px] uppercase text-slate-500">
                        {t('settingsView.iot.messages', { defaultValue: 'Messages' })}
                    </div>
                </div>
                <div>
                    <div className="text-lg font-bold text-emerald-400">{uptimePercent}%</div>
                    <div className="text-[10px] uppercase text-slate-500">
                        {t('settingsView.iot.validRate', { defaultValue: 'Valid Rate' })}
                    </div>
                </div>
                <div>
                    <div className="text-lg font-bold text-cyan-400">
                        {telemetry.avgLatencyMs.toFixed(0)}
                    </div>
                    <div className="text-[10px] uppercase text-slate-500">
                        {t('settingsView.iot.latencyMs', { defaultValue: 'Latency (ms)' })}
                    </div>
                </div>
                <div>
                    <div className="text-lg font-bold text-red-400">
                        {telemetry.validationErrors}
                    </div>
                    <div className="text-[10px] uppercase text-slate-500">
                        {t('settingsView.iot.errors', { defaultValue: 'Errors' })}
                    </div>
                </div>
            </div>
        </Card>
    )
})
TelemetryPanel.displayName = 'TelemetryPanel'

// ---------------------------------------------------------------------------
// Risk-level style helpers
// ---------------------------------------------------------------------------

const RISK_STYLES: Record<RiskLevel, { ring: string; bg: string; text: string }> = {
    low: {
        ring: 'ring-emerald-400/20',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
    },
    moderate: {
        ring: 'ring-amber-400/20',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
    },
    high: {
        ring: 'ring-orange-400/20',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
    },
    critical: {
        ring: 'ring-red-400/20',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
    },
}

// ---------------------------------------------------------------------------
// Predictive Insights Panel
// ---------------------------------------------------------------------------

interface PredictiveInsightsPanelProps {
    insight: PredictiveInsight | null
    loading: boolean
}

const PredictiveInsightsPanel: React.FC<PredictiveInsightsPanelProps> = memo(
    ({ insight, loading }) => {
        const { t } = useTranslation()

        if (loading) {
            return (
                <Card className="p-4">
                    <div className="flex items-center gap-2">
                        <PhosphorIcons.Brain
                            className="w-4 h-4 text-primary-400 animate-pulse"
                            aria-hidden="true"
                        />
                        <span className="text-sm text-slate-400">
                            {t('equipmentView.iotDashboard.predictive.analyzing')}
                        </span>
                    </div>
                </Card>
            )
        }

        if (!insight) {
            return (
                <Card className="p-4">
                    <div className="flex items-center gap-2">
                        <PhosphorIcons.Brain
                            className="w-4 h-4 text-slate-600"
                            aria-hidden="true"
                        />
                        <span className="text-sm text-slate-500">
                            {t('equipmentView.iotDashboard.predictive.noData')}
                        </span>
                    </div>
                </Card>
            )
        }

        const botrytis = insight.botrytisRisk
        const bStyle = RISK_STYLES[botrytis.riskLevel]

        return (
            <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <PhosphorIcons.Brain
                            className="w-4 h-4 text-primary-400"
                            aria-hidden="true"
                        />
                        {t('equipmentView.iotDashboard.predictive.title')}
                    </h3>
                    <span className="text-[10px] text-slate-600">
                        {insight.analyzedSamples}{' '}
                        {t('equipmentView.iotDashboard.predictive.samples')}
                    </span>
                </div>

                {/* Botrytis Risk */}
                <div
                    className={cn(
                        'rounded-xl ring-1 ring-inset backdrop-blur-sm p-3',
                        bStyle.ring,
                        bStyle.bg,
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-300">
                            {t('equipmentView.iotDashboard.predictive.botrytisRisk')}
                        </span>
                        <span
                            className={cn(
                                'text-xs font-bold uppercase tracking-wider',
                                bStyle.text,
                            )}
                        >
                            {t(`equipmentView.iotDashboard.predictive.risk.${botrytis.riskLevel}`)}
                        </span>
                    </div>
                    {botrytis.factors.length > 0 && (
                        <ul className="text-[11px] text-slate-400 space-y-0.5 mb-2">
                            {botrytis.factors.map((f) => (
                                <li key={f} className="flex items-start gap-1">
                                    <span className="shrink-0 mt-0.5">--</span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    )}
                    <p className="text-xs text-slate-300">{botrytis.recommendation}</p>
                </div>

                {/* Environment Alerts */}
                {insight.environmentAlerts.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-slate-400">
                            {t('equipmentView.iotDashboard.predictive.envAlerts')}
                        </h4>
                        {insight.environmentAlerts.map((alert, idx) => {
                            const aStyle = RISK_STYLES[alert.severity]
                            return (
                                <div
                                    key={`${alert.type}-${idx}`}
                                    className={cn(
                                        'rounded-lg ring-1 ring-inset backdrop-blur-sm px-3 py-2 flex items-center justify-between',
                                        aStyle.ring,
                                        aStyle.bg,
                                    )}
                                >
                                    <span className="text-xs text-slate-300">{alert.message}</span>
                                    <span
                                        className={cn(
                                            'text-[10px] font-bold uppercase ml-2 shrink-0',
                                            aStyle.text,
                                        )}
                                    >
                                        {alert.currentValue.toFixed(1)} ({alert.idealRange[0]}-
                                        {alert.idealRange[1]})
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Yield Impact */}
                <div className="rounded-xl ring-1 ring-inset ring-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">
                            {t('equipmentView.iotDashboard.predictive.yieldImpact')}
                        </span>
                        <span
                            className={cn(
                                'text-sm font-bold tabular-nums',
                                insight.yieldImpact.impactPercent >= 0
                                    ? 'text-emerald-400'
                                    : 'text-red-400',
                            )}
                        >
                            {insight.yieldImpact.impactPercent >= 0 ? '+' : ''}
                            {insight.yieldImpact.impactPercent}%
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{insight.yieldImpact.description}</p>
                </div>
            </Card>
        )
    },
)
PredictiveInsightsPanel.displayName = 'PredictiveInsightsPanel'

// ---------------------------------------------------------------------------
// Main IoT Dashboard
// ---------------------------------------------------------------------------

function IotDashboardViewComponent(): React.JSX.Element {
    const { t } = useTranslation()
    const isEnabled = useIotStore((s) => s.isEnabled)
    const brokerUrl = useIotStore((s) => s.brokerUrl)
    const topicPrefix = useIotStore((s) => s.topicPrefix)
    const activePlants = useAppSelector(selectActivePlants)
    const deviceId = topicPrefix || 'default'

    // Subscribe to sensor store (vanilla Zustand)
    const connectionState = useSyncExternalStore(
        useCallback((cb: () => void) => sensorStore.subscribe(cb), []),
        () => sensorStore.getState().connectionState,
    )
    const currentReading = useSyncExternalStore(
        useCallback((cb: () => void) => sensorStore.subscribe(cb), []),
        () => sensorStore.getState().currentReading,
    )
    const history = useSyncExternalStore(
        useCallback((cb: () => void) => sensorStore.subscribe(cb), []),
        () => sensorStore.getState().history,
    )
    const deferredHistory = useDeferredValue(history)
    const telemetry = useSyncExternalStore(
        useCallback((cb: () => void) => sensorStore.subscribe(cb), []),
        () => sensorStore.getState().telemetry,
    )

    // Extract sparkline data from history (deferred to avoid blocking urgent updates)
    const tempData = useMemo(() => deferredHistory.map((r) => r.temperatureC), [deferredHistory])
    const humidityData = useMemo(
        () => deferredHistory.map((r) => r.humidityPercent),
        [deferredHistory],
    )
    const phData = useMemo(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        () => deferredHistory.filter((r) => r.ph != null).map((r) => r.ph as number),
        [deferredHistory],
    )

    // Compute VPD from latest reading
    const vpd = useMemo(() => {
        if (!currentReading) return null
        const { temperatureC: temp, humidityPercent: rh } = currentReading
        const svp = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3))
        return svp * (1 - rh / 100)
    }, [currentReading])

    const vpdData = useMemo(() => {
        return deferredHistory.map((r) => {
            const svp = 0.6108 * Math.exp((17.27 * r.temperatureC) / (r.temperatureC + 237.3))
            return svp * (1 - r.humidityPercent / 100)
        })
    }, [deferredHistory])

    // Last update relative time
    const [, setTick] = useState(0)
    useEffect(() => {
        const id = setInterval(() => setTick((n) => n + 1), 5000)
        return () => clearInterval(id)
    }, [])

    const lastUpdateText = useMemo(() => {
        if (!currentReading) return '--'
        const seconds = Math.floor((Date.now() - currentReading.receivedAt) / 1000)
        if (seconds < 5) return 'just now'
        if (seconds < 60) return `${seconds}s`
        return `${Math.floor(seconds / 60)}m`
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentReading, t])

    // Bridge: persist sensor readings to timeSeriesService for analytics
    const prevReadingRef = useRef(currentReading)
    useEffect(() => {
        if (currentReading && currentReading !== prevReadingRef.current) {
            prevReadingRef.current = currentReading
            void timeSeriesService.recordReading(deviceId, currentReading)
        }
    }, [currentReading, deviceId])

    // Predictive analytics — run every 5 minutes or when plant context changes
    const [insight, setInsight] = useState<PredictiveInsight | null>(null)
    const [insightLoading, setInsightLoading] = useState(false)
    const firstPlant = activePlants[0] ?? null

    useEffect(() => {
        if (!firstPlant || !isEnabled) {
            setInsight(null)
            return
        }

        let cancelled = false
        const runAnalysis = (): void => {
            setInsightLoading(true)
            void predictiveAnalyticsService
                .analyze(firstPlant, deviceId)
                .then((result) => {
                    if (!cancelled) {
                        setInsight(result)
                        setInsightLoading(false)
                    }
                })
                .catch(() => {
                    if (!cancelled) setInsightLoading(false)
                })
        }

        runAnalysis()
        const intervalId = setInterval(runAnalysis, 5 * 60 * 1000)
        return () => {
            cancelled = true
            clearInterval(intervalId)
        }
    }, [firstPlant, deviceId, isEnabled])

    if (!isEnabled) {
        return (
            <div className="text-center py-16 space-y-4">
                <PhosphorIcons.WifiHigh className="w-16 h-16 mx-auto text-slate-600" />
                <h2 className="text-xl font-bold text-slate-300">
                    {t('settingsView.iot.dashboardDisabled', {
                        defaultValue: 'IoT Sensors Disabled',
                    })}
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                    {t('settingsView.iot.dashboardEnableHint', {
                        defaultValue:
                            'Enable IoT sensors in Settings to see live data from your ESP32 devices.',
                    })}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">
                        {t('equipmentView.tabs.iotDashboard')}
                    </h2>
                    <p className="text-xs text-slate-500">{brokerUrl}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">Last update: {lastUpdateText}</span>
                    <ConnectionBadge status={connectionState} />
                </div>
            </div>

            {/* Sensor gauges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <GaugeCard
                    label={t('plantsView.growRoom3d.temp')}
                    value={currentReading?.temperatureC ?? null}
                    unit="C"
                    sparkData={tempData}
                    color="#34d399"
                    optimalMin={20}
                    optimalMax={28}
                />
                <GaugeCard
                    label={t('plantsView.growRoom3d.humidity')}
                    value={currentReading?.humidityPercent ?? null}
                    unit="%"
                    sparkData={humidityData}
                    color="#60a5fa"
                    optimalMin={40}
                    optimalMax={70}
                />
                <GaugeCard
                    label="VPD"
                    value={vpd}
                    unit="kPa"
                    sparkData={vpdData}
                    color="#a78bfa"
                    optimalMin={0.8}
                    optimalMax={1.2}
                />
                <GaugeCard
                    label="pH"
                    value={currentReading?.ph ?? null}
                    unit=""
                    sparkData={phData}
                    color="#fbbf24"
                    optimalMin={5.8}
                    optimalMax={6.5}
                />
            </div>

            {/* Predictive Insights */}
            {firstPlant && <PredictiveInsightsPanel insight={insight} loading={insightLoading} />}

            {/* Telemetry */}
            <TelemetryPanel telemetry={telemetry} />

            {/* History count */}
            <div className="text-xs text-slate-600 text-right">
                {t('equipmentView.iotDashboard.readingsBuffer', {
                    count: history.length,
                    max: 120,
                })}
            </div>
        </div>
    )
}

const IotDashboardView = memo(IotDashboardViewComponent)
IotDashboardView.displayName = 'IotDashboardView'
export { IotDashboardView }

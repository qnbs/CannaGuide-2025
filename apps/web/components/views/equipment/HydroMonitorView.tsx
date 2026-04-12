import React, { memo, useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import {
    addReading,
    selectHydroReadings,
    selectHydroAlerts,
    selectHydroSystemType,
    selectHydroThresholds,
    selectLatestReading,
    setSystemType,
    setThresholds,
    dismissAlert,
    clearReadings,
    clearAlerts,
} from '@/stores/slices/hydroSlice'
import type { HydroSystemType, HydroThresholds, HydroForecast } from '@/types'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import { forecastNextHour, initForecastModel } from '@/services/hydroForecastService'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SYSTEM_TYPES: HydroSystemType[] = [
    'DWC',
    'NFT',
    'DripSystem',
    'EbbFlow',
    'Aeroponics',
    'Kratky',
]

const TIME_RANGES = ['24h', '48h', '7d'] as const
type TimeRange = (typeof TIME_RANGES)[number]

const TIME_RANGE_MS: Record<TimeRange, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
}

// ---------------------------------------------------------------------------
// Gauge Card component
// ---------------------------------------------------------------------------

interface GaugeProps {
    label: string
    value: number | undefined
    unit: string
    min: number
    max: number
    decimals?: number | undefined
}

const GaugeCard: React.FC<GaugeProps> = memo(({ label, value, unit, min, max, decimals = 1 }) => {
    const status =
        value === undefined ? 'unknown' : value < min ? 'low' : value > max ? 'high' : 'ok'

    const colorMap = {
        ok: 'ring-emerald-400/30 bg-emerald-500/10',
        low: 'ring-amber-400/30 bg-amber-500/10',
        high: 'ring-red-400/30 bg-red-500/10',
        unknown: 'ring-white/[0.08] bg-white/[0.04]',
    }

    const textColor = {
        ok: 'text-emerald-400',
        low: 'text-amber-400',
        high: 'text-red-400',
        unknown: 'text-slate-500',
    }

    return (
        <div
            className={cn(
                'rounded-2xl p-3 text-center transition-all duration-300 ring-1 ring-inset backdrop-blur-sm',
                colorMap[status],
            )}
        >
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={cn('text-2xl font-bold tabular-nums', textColor[status])}>
                {value !== undefined ? value.toFixed(decimals) : '--'}
            </p>
            <p className="text-xs text-slate-500">
                {unit} ({min}-{max})
            </p>
        </div>
    )
})
GaugeCard.displayName = 'GaugeCard'

// ---------------------------------------------------------------------------
// Hydro system type guard
// ---------------------------------------------------------------------------

const VALID_SYSTEM_TYPES: readonly string[] = [
    'DWC',
    'NFT',
    'DripSystem',
    'EbbFlow',
    'Aeroponics',
    'Kratky',
]

function isHydroSystemType(value: string): value is HydroSystemType {
    return VALID_SYSTEM_TYPES.includes(value)
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const HydroMonitorView: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    const readings = useAppSelector(selectHydroReadings)
    const alerts = useAppSelector(selectHydroAlerts)
    const systemType = useAppSelector(selectHydroSystemType)
    const thresholds = useAppSelector(selectHydroThresholds)
    const latestReading = useAppSelector(selectLatestReading)

    const [timeRange, setTimeRange] = useState<TimeRange>('24h')
    const [formPh, setFormPh] = useState('')
    const [formEc, setFormEc] = useState('')
    const [formTemp, setFormTemp] = useState('')
    const [showThresholdEditor, setShowThresholdEditor] = useState(false)
    const [forecast, setForecast] = useState<HydroForecast | null>(null)
    const [forecastLoading, setForecastLoading] = useState(false)

    // Initialise forecast model on mount
    useEffect(() => {
        void initForecastModel()
    }, [])

    // Refresh forecast when readings change
    useEffect(() => {
        if (readings.length < 3) {
            setForecast(null)
            return
        }
        let cancelled = false
        setForecastLoading(true)
        void forecastNextHour(readings).then((result) => {
            if (!cancelled) {
                setForecast(result)
                setForecastLoading(false)
            }
        })
        return () => {
            cancelled = true
        }
    }, [readings])

    // Filtered readings for chart
    const chartData = useMemo(() => {
        const cutoff = Date.now() - TIME_RANGE_MS[timeRange]
        return readings
            .filter((r) => r.timestamp >= cutoff)
            .map((r) => ({
                time: new Date(r.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                ph: r.ph,
                ec: r.ec,
                waterTemp: r.waterTemp,
            }))
    }, [readings, timeRange])

    // Form submit
    const handleAddReading = useCallback(() => {
        const ph = parseFloat(formPh)
        const ec = parseFloat(formEc)
        const waterTemp = parseFloat(formTemp)
        if (Number.isNaN(ph) || Number.isNaN(ec) || Number.isNaN(waterTemp)) return
        dispatch(
            addReading({
                timestamp: Date.now(),
                ph,
                ec,
                waterTemp,
            }),
        )
        setFormPh('')
        setFormEc('')
        setFormTemp('')
    }, [dispatch, formPh, formEc, formTemp])

    const handleSystemChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value
            if (isHydroSystemType(value)) {
                dispatch(setSystemType(value))
            }
        },
        [dispatch],
    )

    const handleThresholdChange = useCallback(
        (field: keyof HydroThresholds, value: string) => {
            const num = parseFloat(value)
            if (!Number.isNaN(num)) {
                dispatch(setThresholds({ [field]: num }))
            }
        },
        [dispatch],
    )

    return (
        <div className="space-y-6 p-2 sm:p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-slate-100">
                        {t('equipmentView.hydroMonitoring.title')}
                    </h2>
                    <p className="text-sm text-slate-400">
                        {t('equipmentView.hydroMonitoring.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="hydro-system-select" className="text-xs text-slate-400">
                        {t('equipmentView.hydroMonitoring.systemType')}:
                    </label>
                    <select
                        id="hydro-system-select"
                        value={systemType}
                        onChange={handleSystemChange}
                        className="text-xs rounded-xl border-white/[0.1] bg-white/[0.06] backdrop-blur-sm px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
                    >
                        {SYSTEM_TYPES.map((st) => (
                            <option key={st} value={st}>
                                {t(`equipmentView.hydroMonitoring.systems.${st}`)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Gauge Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <GaugeCard
                    label={t('equipmentView.hydroMonitoring.gauges.ph')}
                    value={latestReading?.ph}
                    unit="pH"
                    min={thresholds.phMin}
                    max={thresholds.phMax}
                    decimals={2}
                />
                <GaugeCard
                    label={t('equipmentView.hydroMonitoring.gauges.ec')}
                    value={latestReading?.ec}
                    unit="mS/cm"
                    min={thresholds.ecMin}
                    max={thresholds.ecMax}
                    decimals={2}
                />
                <GaugeCard
                    label={t('equipmentView.hydroMonitoring.gauges.waterTemp')}
                    value={latestReading?.waterTemp}
                    unit="C"
                    min={thresholds.waterTempMin}
                    max={thresholds.waterTempMax}
                    decimals={1}
                />
                <GaugeCard
                    label={t('equipmentView.hydroMonitoring.gauges.readings')}
                    value={readings.length > 0 ? readings.length : undefined}
                    unit="#"
                    min={0}
                    max={168}
                    decimals={0}
                />
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-red-400">
                        <PhosphorIcons.WarningCircle
                            className="w-4 h-4 inline mr-1"
                            aria-hidden="true"
                        />
                        {t('equipmentView.hydroMonitoring.alerts.title')} ({alerts.length})
                    </h3>
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="flex items-center justify-between rounded-xl bg-red-500/10 ring-1 ring-inset ring-red-400/20 backdrop-blur-sm px-3 py-2"
                        >
                            <span className="text-xs text-red-300">
                                {t(`equipmentView.hydroMonitoring.gauges.${alert.metric}`)} ={' '}
                                {alert.value.toFixed(2)} (
                                {alert.direction === 'low'
                                    ? t('equipmentView.hydroMonitoring.alerts.tooLow')
                                    : t('equipmentView.hydroMonitoring.alerts.tooHigh')}
                                , {t('equipmentView.hydroMonitoring.alerts.threshold')}:{' '}
                                {alert.threshold})
                            </span>
                            <button
                                type="button"
                                onClick={() => dispatch(dismissAlert(alert.id))}
                                className="text-xs text-red-400 hover:text-red-300 ml-2"
                            >
                                {t('equipmentView.hydroMonitoring.alerts.dismiss')}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Chart */}
            {chartData.length > 1 && (
                <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-200">
                            {t('equipmentView.hydroMonitoring.chart.title')}
                        </h3>
                        <div className="flex gap-1">
                            {TIME_RANGES.map((tr) => (
                                <button
                                    key={tr}
                                    type="button"
                                    onClick={() => setTimeRange(tr)}
                                    aria-label={t('common.accessibility.selectTimeRange', {
                                        range: t(`equipmentView.hydroMonitoring.chart.${tr}`),
                                    })}
                                    aria-pressed={timeRange === tr}
                                    className={cn(
                                        'text-xs px-2.5 py-1 rounded min-h-[44px] min-w-[44px]',
                                        timeRange === tr
                                            ? 'bg-[linear-gradient(135deg,rgba(var(--color-primary-400),0.95),rgba(var(--color-primary-600),0.92))] text-white shadow-[0_0_12px_rgba(var(--color-primary-500),0.25)]'
                                            : 'bg-white/[0.06] text-slate-400 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.1]',
                                    )}
                                >
                                    {t(`equipmentView.hydroMonitoring.chart.${tr}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div role="img" aria-label={t('common.accessibility.hydroChart')}>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    stroke="#475569"
                                />
                                <YAxis
                                    yAxisId="ph"
                                    orientation="left"
                                    domain={[4, 8]}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    stroke="#475569"
                                    label={{
                                        value: t('equipmentView.hydroMonitoring.chart.axisLabelPh'),
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: { fontSize: 10, fill: '#94a3b8' },
                                    }}
                                />
                                <YAxis
                                    yAxisId="ec"
                                    orientation="right"
                                    domain={[0, 4]}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    stroke="#475569"
                                    label={{
                                        value: t('equipmentView.hydroMonitoring.chart.axisLabelEc'),
                                        angle: 90,
                                        position: 'insideRight',
                                        style: { fontSize: 10, fill: '#94a3b8' },
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '12px',
                                        backdropFilter: 'blur(8px)',
                                        fontSize: 12,
                                    }}
                                />
                                <Line
                                    yAxisId="ph"
                                    type="monotone"
                                    dataKey="ph"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={false}
                                    name={t('equipmentView.hydroMonitoring.chart.legendPh')}
                                />
                                <Line
                                    yAxisId="ec"
                                    type="monotone"
                                    dataKey="ec"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                    name={t('equipmentView.hydroMonitoring.chart.legendEc')}
                                />
                                <YAxis yAxisId="temp" hide domain={[10, 35]} />
                                <Line
                                    yAxisId="temp"
                                    type="monotone"
                                    dataKey="waterTemp"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    dot={false}
                                    name={t('equipmentView.hydroMonitoring.chart.legendTemp')}
                                    strokeDasharray="5 3"
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                                    iconType="plainline"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Forecast Panel */}
            <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-200">
                        <PhosphorIcons.ChartLineUp
                            className="w-4 h-4 inline mr-1"
                            aria-hidden="true"
                        />
                        {t('equipmentView.hydroMonitoring.forecast.title')}
                    </h3>
                    <span
                        data-testid="forecast-model-badge"
                        className={cn(
                            'text-xs rounded-lg px-2.5 py-0.5',
                            forecast?.modelBased
                                ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20'
                                : 'bg-white/[0.06] text-slate-400 ring-1 ring-inset ring-white/[0.08]',
                        )}
                    >
                        {forecast?.modelBased
                            ? t('equipmentView.hydroMonitoring.forecast.modelActive')
                            : t('equipmentView.hydroMonitoring.forecast.basicMode')}
                    </span>
                </div>

                {forecastLoading && (
                    <p className="text-xs text-slate-500">
                        {t('equipmentView.hydroMonitoring.forecast.loading')}
                    </p>
                )}

                {!forecastLoading && !forecast && (
                    <p className="text-xs text-slate-500">
                        {t('equipmentView.hydroMonitoring.forecast.insufficientReadings')}
                    </p>
                )}

                {!forecastLoading && forecast && (
                    <>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 ring-1 ring-inset ring-emerald-400/20 p-2.5 text-center">
                                <p className="text-xs text-slate-400">pH</p>
                                <p className="text-lg font-bold text-emerald-400 tabular-nums">
                                    {forecast.nextHour.ph.toFixed(2)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 ring-1 ring-inset ring-blue-400/20 p-2.5 text-center">
                                <p className="text-xs text-slate-400">EC</p>
                                <p className="text-lg font-bold text-blue-400 tabular-nums">
                                    {forecast.nextHour.ec.toFixed(2)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 ring-1 ring-inset ring-amber-400/20 p-2.5 text-center">
                                <p className="text-xs text-slate-400">
                                    {t('equipmentView.hydroMonitoring.gauges.waterTemp')}
                                </p>
                                <p className="text-lg font-bold text-amber-400 tabular-nums">
                                    {forecast.nextHour.temp.toFixed(1)}C
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-slate-300">
                                {forecast.trend === 'rising' && (
                                    <PhosphorIcons.ArrowUp
                                        className="w-3.5 h-3.5 text-amber-400"
                                        aria-hidden="true"
                                    />
                                )}
                                {forecast.trend === 'falling' && (
                                    <PhosphorIcons.ArrowDown
                                        className="w-3.5 h-3.5 text-blue-400"
                                        aria-hidden="true"
                                    />
                                )}
                                {forecast.trend === 'stable' && (
                                    <PhosphorIcons.ArrowRight
                                        className="w-3.5 h-3.5 text-emerald-400"
                                        aria-hidden="true"
                                    />
                                )}
                                {forecast.trend === 'critical' && (
                                    <PhosphorIcons.WarningCircle
                                        className="w-3.5 h-3.5 text-red-400"
                                        aria-hidden="true"
                                    />
                                )}
                                {t(
                                    `equipmentView.hydroMonitoring.forecast.trends.${forecast.trend}`,
                                )}
                            </span>
                            {forecast.confidence > 0 && (
                                <span className="text-slate-500">
                                    {t('equipmentView.hydroMonitoring.forecast.confidence')}:{' '}
                                    {Math.round(forecast.confidence * 100)}%
                                </span>
                            )}
                        </div>

                        {forecast.alerts.length > 0 && (
                            <div className="mt-2 text-xs text-amber-400">
                                {forecast.alerts.map((alert) => (
                                    <span key={alert} className="mr-2">
                                        {t(
                                            `equipmentView.hydroMonitoring.forecast.alerts.${alert}`,
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Manual Input Form */}
            <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                    {t('equipmentView.hydroMonitoring.input.title')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label htmlFor="hydro-ph" className="text-xs text-slate-400 block mb-1">
                            {t('equipmentView.hydroMonitoring.input.ph')}
                        </label>
                        <input
                            id="hydro-ph"
                            type="number"
                            step="0.01"
                            min="0"
                            max="14"
                            value={formPh}
                            onChange={(e) => setFormPh(e.target.value)}
                            className="w-full text-sm rounded-xl border-white/[0.1] bg-white/[0.06] backdrop-blur-sm px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
                            placeholder="6.0"
                        />
                    </div>
                    <div>
                        <label htmlFor="hydro-ec" className="text-xs text-slate-400 block mb-1">
                            {t('equipmentView.hydroMonitoring.input.ec')}
                        </label>
                        <input
                            id="hydro-ec"
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={formEc}
                            onChange={(e) => setFormEc(e.target.value)}
                            className="w-full text-sm rounded-xl border-white/[0.1] bg-white/[0.06] backdrop-blur-sm px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
                            placeholder="1.6"
                        />
                    </div>
                    <div>
                        <label htmlFor="hydro-temp" className="text-xs text-slate-400 block mb-1">
                            {t('equipmentView.hydroMonitoring.input.waterTemp')}
                        </label>
                        <input
                            id="hydro-temp"
                            type="number"
                            step="0.1"
                            min="0"
                            max="40"
                            value={formTemp}
                            onChange={(e) => setFormTemp(e.target.value)}
                            className="w-full text-sm rounded-xl border-white/[0.1] bg-white/[0.06] backdrop-blur-sm px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
                            placeholder="21.0"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <button
                        type="button"
                        onClick={handleAddReading}
                        disabled={!formPh || !formEc || !formTemp}
                        className="text-xs bg-[linear-gradient(135deg,rgba(var(--color-primary-400),0.95),rgba(var(--color-primary-600),0.92))] shadow-[0_0_16px_rgba(var(--color-primary-500),0.3)] hover:shadow-[0_0_20px_rgba(var(--color-primary-500),0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none text-white px-4 py-1.5 rounded-xl transition-all duration-300"
                    >
                        {t('equipmentView.hydroMonitoring.input.addReading')}
                    </button>
                    {readings.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                dispatch(clearReadings())
                                dispatch(clearAlerts())
                            }}
                            className="text-xs text-slate-500 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                        >
                            {t('equipmentView.hydroMonitoring.input.clearAll')}
                        </button>
                    )}
                </div>
            </div>

            {/* Threshold Editor */}
            <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm p-4">
                <button
                    type="button"
                    onClick={() => setShowThresholdEditor(!showThresholdEditor)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-slate-100 w-full transition-colors duration-200"
                >
                    <PhosphorIcons.GearSix className="w-4 h-4" aria-hidden="true" />
                    {t('equipmentView.hydroMonitoring.thresholds.title')}
                    <span className="ml-auto text-xs text-slate-500">
                        {showThresholdEditor ? '-' : '+'}
                    </span>
                </button>
                {showThresholdEditor && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                        {(
                            [
                                ['phMin', t('equipmentView.hydroMonitoring.thresholds.phMin')],
                                ['phMax', t('equipmentView.hydroMonitoring.thresholds.phMax')],
                                ['ecMin', t('equipmentView.hydroMonitoring.thresholds.ecMin')],
                                ['ecMax', t('equipmentView.hydroMonitoring.thresholds.ecMax')],
                                [
                                    'waterTempMin',
                                    t('equipmentView.hydroMonitoring.thresholds.tempMin'),
                                ],
                                [
                                    'waterTempMax',
                                    t('equipmentView.hydroMonitoring.thresholds.tempMax'),
                                ],
                            ] as [keyof HydroThresholds, string][]
                        ).map(([field, label]) => (
                            <div key={field}>
                                <label
                                    htmlFor={`thresh-${field}`}
                                    className="text-xs text-slate-400 block mb-1"
                                >
                                    {label}
                                </label>
                                <input
                                    id={`thresh-${field}`}
                                    type="number"
                                    step="0.1"
                                    value={thresholds[field]}
                                    onChange={(e) => handleThresholdChange(field, e.target.value)}
                                    className="w-full text-sm rounded-xl border-white/[0.1] bg-white/[0.06] backdrop-blur-sm px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dosing Reference */}
            <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                    <PhosphorIcons.Flask className="w-4 h-4 inline mr-1" aria-hidden="true" />
                    {t('equipmentView.hydroMonitoring.dosing.title')}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-white/[0.08]">
                                <th className="text-left py-2 text-slate-400 font-medium">
                                    {t('equipmentView.hydroMonitoring.dosing.stage')}
                                </th>
                                <th className="text-center py-2 text-slate-400 font-medium">
                                    {t('equipmentView.hydroMonitoring.dosing.ecColumn')}
                                </th>
                                <th className="text-center py-2 text-slate-400 font-medium">
                                    {t('equipmentView.hydroMonitoring.dosing.phColumn')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-white/[0.06]">
                                <td className="py-2 text-slate-300">
                                    {t('equipmentView.hydroMonitoring.dosing.seedling')}
                                </td>
                                <td className="text-center text-slate-400">0.3 - 0.6</td>
                                <td className="text-center text-slate-400">5.5 - 6.0</td>
                            </tr>
                            <tr className="border-b border-white/[0.06]">
                                <td className="py-2 text-slate-300">
                                    {t('equipmentView.hydroMonitoring.dosing.vegetative')}
                                </td>
                                <td className="text-center text-slate-400">0.8 - 1.6</td>
                                <td className="text-center text-slate-400">5.5 - 6.0</td>
                            </tr>
                            <tr className="border-b border-white/[0.06]">
                                <td className="py-2 text-slate-300">
                                    {t('equipmentView.hydroMonitoring.dosing.flowering')}
                                </td>
                                <td className="text-center text-slate-400">1.4 - 2.4</td>
                                <td className="text-center text-slate-400">5.5 - 6.0</td>
                            </tr>
                            <tr className="border-b border-white/[0.06]">
                                <td className="py-2 text-slate-300">
                                    {t('equipmentView.hydroMonitoring.dosing.lateFlower')}
                                </td>
                                <td className="text-center text-slate-400">1.0 - 1.8</td>
                                <td className="text-center text-slate-400">5.8 - 6.2</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-slate-300">
                                    {t('equipmentView.hydroMonitoring.dosing.flush')}
                                </td>
                                <td className="text-center text-slate-400">0.0 - 0.3</td>
                                <td className="text-center text-slate-400">5.8 - 6.2</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
})
HydroMonitorView.displayName = 'HydroMonitorView'

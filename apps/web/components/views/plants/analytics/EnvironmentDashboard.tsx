import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { selectEnvironmentLogs, EnvironmentLogEntry } from '@/stores/selectors'
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceArea,
} from 'recharts'
import type { ReactNode } from 'react'

interface EnvironmentDashboardProps {
    plantId: string
}

const formatTime = (ts: number): string => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatTooltipLabel = (label: ReactNode): ReactNode =>
    typeof label === 'number' ? formatTime(label) : String(label ?? '')

const VPD_ZONES = {
    low: { min: 0, max: 0.4, color: 'rgba(59,130,246,0.08)', label: 'Too Low' },
    optimal: { min: 0.8, max: 1.2, color: 'rgba(34,197,94,0.10)', label: 'Optimal' },
    high: { min: 1.6, max: 2.5, color: 'rgba(239,68,68,0.10)', label: 'Danger' },
} as const

const CHART_MARGIN = { top: 8, right: 12, left: 0, bottom: 0 } as const

const TemperatureHumidityChart: React.FC<{ data: EnvironmentLogEntry[] }> = memo(({ data }) => {
    const { t } = useTranslation()
    const filtered = useMemo(() => data.filter((d) => d.temp != null || d.humidity != null), [data])

    if (filtered.length === 0) return null

    return (
        <div
            className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50"
            role="img"
            aria-label={t('plantsView.analytics.tempHumidity', {
                defaultValue: 'Temperature and Humidity over time',
            })}
        >
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
                {t('plantsView.analytics.tempHumidityTitle', {
                    defaultValue: 'Temperature & Humidity',
                })}
            </h3>
            <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={filtered} margin={CHART_MARGIN}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatTime}
                        stroke="#64748b"
                        fontSize={11}
                    />
                    <YAxis
                        yAxisId="temp"
                        orientation="left"
                        stroke="#f97316"
                        fontSize={11}
                        label={{
                            value: '\u00B0C',
                            position: 'insideTopLeft',
                            style: { fill: '#f97316', fontSize: 11 },
                        }}
                    />
                    <YAxis
                        yAxisId="hum"
                        orientation="right"
                        stroke="#3b82f6"
                        fontSize={11}
                        domain={[0, 100]}
                        label={{
                            value: '%',
                            position: 'insideTopRight',
                            style: { fill: '#3b82f6', fontSize: 11 },
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                        labelFormatter={formatTooltipLabel}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                        yAxisId="temp"
                        type="monotone"
                        dataKey="temp"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={false}
                        name={t('plantsView.analytics.temperature', {
                            defaultValue: 'Temp (\u00B0C)',
                        })}
                    />
                    <Line
                        yAxisId="hum"
                        type="monotone"
                        dataKey="humidity"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name={t('plantsView.analytics.humidity', { defaultValue: 'Humidity (%)' })}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
})
TemperatureHumidityChart.displayName = 'TemperatureHumidityChart'

const VpdChart: React.FC<{ data: EnvironmentLogEntry[] }> = memo(({ data }) => {
    const { t } = useTranslation()
    const filtered = useMemo(() => data.filter((d) => d.vpd != null), [data])

    if (filtered.length === 0) return null

    const maxVpd = Math.max(2.5, ...filtered.map((d) => d.vpd ?? 0))

    return (
        <div
            className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50"
            role="img"
            aria-label={t('plantsView.analytics.vpdOverTime', {
                defaultValue: 'Vapor Pressure Deficit over time',
            })}
        >
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
                {t('plantsView.analytics.vpdTitle', {
                    defaultValue: 'VPD (Vapor Pressure Deficit)',
                })}
            </h3>
            <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={filtered} margin={CHART_MARGIN}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    {/* VPD zone backgrounds */}
                    <ReferenceArea
                        y1={VPD_ZONES.low.min}
                        y2={VPD_ZONES.low.max}
                        fill={VPD_ZONES.low.color}
                        fillOpacity={1}
                        label={{
                            value: VPD_ZONES.low.label,
                            position: 'insideTopLeft',
                            style: { fill: '#60a5fa', fontSize: 10, opacity: 0.7 },
                        }}
                    />
                    <ReferenceArea
                        y1={VPD_ZONES.optimal.min}
                        y2={VPD_ZONES.optimal.max}
                        fill={VPD_ZONES.optimal.color}
                        fillOpacity={1}
                        label={{
                            value: VPD_ZONES.optimal.label,
                            position: 'insideTopLeft',
                            style: { fill: '#22c55e', fontSize: 10, opacity: 0.7 },
                        }}
                    />
                    <ReferenceArea
                        y1={VPD_ZONES.high.min}
                        y2={Math.min(VPD_ZONES.high.max, maxVpd)}
                        fill={VPD_ZONES.high.color}
                        fillOpacity={1}
                        label={{
                            value: VPD_ZONES.high.label,
                            position: 'insideTopLeft',
                            style: { fill: '#ef4444', fontSize: 10, opacity: 0.7 },
                        }}
                    />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatTime}
                        stroke="#64748b"
                        fontSize={11}
                    />
                    <YAxis
                        stroke="#a855f7"
                        fontSize={11}
                        domain={[0, maxVpd]}
                        label={{
                            value: 'kPa',
                            position: 'insideTopLeft',
                            style: { fill: '#a855f7', fontSize: 11 },
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                        labelFormatter={formatTooltipLabel}
                        formatter={(value: unknown) => {
                            const n = typeof value === 'number' ? value : 0
                            return [n.toFixed(2) + ' kPa', 'VPD']
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                        type="monotone"
                        dataKey="vpd"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={false}
                        name="VPD (kPa)"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
})
VpdChart.displayName = 'VpdChart'

const NutrientWateringChart: React.FC<{ data: EnvironmentLogEntry[] }> = memo(({ data }) => {
    const { t } = useTranslation()
    const filtered = useMemo(
        () => data.filter((d) => d.ph != null || d.ec != null || d.waterVolumeMl != null),
        [data],
    )

    if (filtered.length === 0) return null

    return (
        <div
            className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50"
            role="img"
            aria-label={t('plantsView.analytics.nutrientWatering', {
                defaultValue: 'pH, EC and watering over time',
            })}
        >
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
                {t('plantsView.analytics.nutrientTitle', {
                    defaultValue: 'Nutrients & Watering',
                })}
            </h3>
            <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={filtered} margin={CHART_MARGIN}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatTime}
                        stroke="#64748b"
                        fontSize={11}
                    />
                    <YAxis
                        yAxisId="ph"
                        orientation="left"
                        stroke="#22c55e"
                        fontSize={11}
                        domain={[4, 8]}
                        label={{
                            value: 'pH / EC',
                            position: 'insideTopLeft',
                            style: { fill: '#22c55e', fontSize: 11 },
                        }}
                    />
                    <YAxis
                        yAxisId="water"
                        orientation="right"
                        stroke="#06b6d4"
                        fontSize={11}
                        label={{
                            value: 'ml',
                            position: 'insideTopRight',
                            style: { fill: '#06b6d4', fontSize: 11 },
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                        labelFormatter={formatTooltipLabel}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                        yAxisId="ph"
                        type="monotone"
                        dataKey="ph"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                        name="pH"
                    />
                    <Line
                        yAxisId="ph"
                        type="monotone"
                        dataKey="ec"
                        stroke="#eab308"
                        strokeWidth={2}
                        dot={false}
                        name="EC (mS/cm)"
                    />
                    <Bar
                        yAxisId="water"
                        dataKey="waterVolumeMl"
                        fill="#06b6d4"
                        opacity={0.6}
                        name={t('plantsView.analytics.waterVolume', { defaultValue: 'Water (ml)' })}
                        radius={[2, 2, 0, 0]}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
})
NutrientWateringChart.displayName = 'NutrientWateringChart'

export const EnvironmentDashboard: React.FC<EnvironmentDashboardProps> = memo(({ plantId }) => {
    const { t } = useTranslation()
    const envLogs = useAppSelector(selectEnvironmentLogs(plantId))

    if (envLogs.length === 0) {
        return (
            <div className="rounded-xl bg-slate-800/40 p-8 text-center text-slate-400">
                <p className="text-sm">
                    {t('plantsView.analytics.noData', {
                        defaultValue:
                            'No environment data logged yet. Use the Environment tab to add readings.',
                    })}
                </p>
            </div>
        )
    }

    return (
        <section
            aria-label={t('plantsView.analytics.dashboardLabel', {
                defaultValue: 'Environment Analytics Dashboard',
            })}
            className="space-y-4"
        >
            <h2 className="text-lg font-bold text-slate-100">
                {t('plantsView.analytics.dashboardTitle', {
                    defaultValue: 'Environment Analytics',
                })}
            </h2>
            <p className="text-xs text-slate-400">
                {t('plantsView.analytics.dataPoints', {
                    defaultValue: '{{count}} data points',
                    count: envLogs.length,
                })}
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
                <TemperatureHumidityChart data={envLogs} />
                <VpdChart data={envLogs} />
                <div className="lg:col-span-2">
                    <NutrientWateringChart data={envLogs} />
                </div>
            </div>
        </section>
    )
})
EnvironmentDashboard.displayName = 'EnvironmentDashboard'

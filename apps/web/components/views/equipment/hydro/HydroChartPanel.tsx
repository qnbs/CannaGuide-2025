import React, { memo, useMemo, useState } from 'react'
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
import type { HydroReading } from '@/types'
import { cn } from '@/lib/utils'
import { TIME_RANGES, TIME_RANGE_MS, type TimeRange } from './hydroConstants'

export interface HydroChartPanelProps {
    readings: HydroReading[]
}

export const HydroChartPanel: React.FC<HydroChartPanelProps> = memo(({ readings }) => {
    const { t } = useTranslation()
    const [timeRange, setTimeRange] = useState<TimeRange>('24h')

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

    if (chartData.length <= 1) {
        return null
    }

    return (
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
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="plainline" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
})
HydroChartPanel.displayName = 'HydroChartPanel'

import React, { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HydroForecast, HydroReading } from '@/types'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import { forecastNextHour, initForecastModel } from '@/services/hydroForecastService'

export interface HydroForecastPanelProps {
    readings: HydroReading[]
}

export const HydroForecastPanel: React.FC<HydroForecastPanelProps> = memo(({ readings }) => {
    const { t } = useTranslation()
    const [forecast, setForecast] = useState<HydroForecast | null>(null)
    const [forecastLoading, setForecastLoading] = useState(false)

    useEffect(() => {
        void initForecastModel()
    }, [])

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

    return (
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
                <p className="text-xs text-muted">
                    {t('equipmentView.hydroMonitoring.forecast.loading')}
                </p>
            )}

            {!forecastLoading && !forecast && (
                <p className="text-xs text-muted">
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
                        <span
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset',
                                forecast.trend === 'stable' &&
                                    'bg-emerald-500/10 text-emerald-400 ring-emerald-400/20',
                                forecast.trend === 'rising' &&
                                    'bg-amber-500/10 text-amber-400 ring-amber-400/20',
                                forecast.trend === 'falling' &&
                                    'bg-blue-500/10 text-blue-400 ring-blue-400/20',
                                forecast.trend === 'critical' &&
                                    'bg-red-500/10 text-red-400 ring-red-400/20',
                            )}
                            role="status"
                            aria-label={t(
                                `equipmentView.hydroMonitoring.forecast.trends.${forecast.trend}`,
                            )}
                        >
                            {forecast.trend === 'rising' && (
                                <PhosphorIcons.ArrowUp
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                />
                            )}
                            {forecast.trend === 'falling' && (
                                <PhosphorIcons.ArrowDown
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                />
                            )}
                            {forecast.trend === 'stable' && (
                                <PhosphorIcons.ArrowRight
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                />
                            )}
                            {forecast.trend === 'critical' && (
                                <PhosphorIcons.WarningCircle
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                />
                            )}
                            {t(`equipmentView.hydroMonitoring.forecast.trends.${forecast.trend}`)}
                        </span>
                        {forecast.confidence > 0 && (
                            <span className="text-muted">
                                {t('equipmentView.hydroMonitoring.forecast.confidence')}:{' '}
                                {Math.round(forecast.confidence * 100)}%
                            </span>
                        )}
                    </div>

                    {forecast.alerts.length > 0 && (
                        <div className="mt-2 text-xs text-amber-400">
                            {forecast.alerts.map((alert) => (
                                <span key={alert} className="mr-2">
                                    {t(`equipmentView.hydroMonitoring.forecast.alerts.${alert}`)}
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
})
HydroForecastPanel.displayName = 'HydroForecastPanel'

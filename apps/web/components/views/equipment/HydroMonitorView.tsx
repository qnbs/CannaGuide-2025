import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import {
    selectHydroReadings,
    selectHydroAlerts,
    selectHydroSystemType,
    selectHydroThresholds,
    selectLatestReading,
    setSystemType,
    dismissAlert,
} from '@/stores/slices/hydroSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SYSTEM_TYPES, isHydroSystemType } from './hydro/hydroConstants'
import { HydroGaugeCard } from './hydro/HydroGaugeCard'
import { HydroChartPanel } from './hydro/HydroChartPanel'
import { HydroForecastPanel } from './hydro/HydroForecastPanel'
import { HydroReadingForm } from './hydro/HydroReadingForm'
import { HydroThresholdEditor } from './hydro/HydroThresholdEditor'
import { HydroDosingReference } from './hydro/HydroDosingReference'

export const HydroMonitorView: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    const readings = useAppSelector(selectHydroReadings)
    const alerts = useAppSelector(selectHydroAlerts)
    const systemType = useAppSelector(selectHydroSystemType)
    const thresholds = useAppSelector(selectHydroThresholds)
    const latestReading = useAppSelector(selectLatestReading)

    const handleSystemChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value
            if (isHydroSystemType(value)) {
                dispatch(setSystemType(value))
            }
        },
        [dispatch],
    )

    return (
        <div className="space-y-6 p-2 sm:p-4">
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <HydroGaugeCard
                    label={t('equipmentView.hydroMonitoring.gauges.ph')}
                    value={latestReading?.ph}
                    unit="pH"
                    min={thresholds.phMin}
                    max={thresholds.phMax}
                    decimals={2}
                />
                <HydroGaugeCard
                    label={t('equipmentView.hydroMonitoring.gauges.ec')}
                    value={latestReading?.ec}
                    unit="mS/cm"
                    min={thresholds.ecMin}
                    max={thresholds.ecMax}
                    decimals={2}
                />
                <HydroGaugeCard
                    label={t('equipmentView.hydroMonitoring.gauges.waterTemp')}
                    value={latestReading?.waterTemp}
                    unit="C"
                    min={thresholds.waterTempMin}
                    max={thresholds.waterTempMax}
                    decimals={1}
                />
                <HydroGaugeCard
                    label={t('equipmentView.hydroMonitoring.gauges.readings')}
                    value={readings.length > 0 ? readings.length : undefined}
                    unit="#"
                    min={0}
                    max={168}
                    decimals={0}
                />
            </div>

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

            <HydroChartPanel readings={readings} />
            <HydroForecastPanel readings={readings} />
            <HydroReadingForm />
            <HydroThresholdEditor />
            <HydroDosingReference />
        </div>
    )
})
HydroMonitorView.displayName = 'HydroMonitorView'

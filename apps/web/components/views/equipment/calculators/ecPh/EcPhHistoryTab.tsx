import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ResultDisplay } from '../common'
import { PlantStage } from '@/types'
import { getOptimalRange } from '@/stores/slices/nutrientPlannerSlice'
import type { EcPhReading } from '@/stores/slices/nutrientPlannerSlice'
import { cn } from '@/lib/utils'

export interface EcPhHistoryTabProps {
    recentReadings: EcPhReading[]
    medium: string
    currentStage: PlantStage
}

export const EcPhHistoryTab: React.FC<EcPhHistoryTabProps> = memo(
    ({ recentReadings, medium, currentStage }) => {
        const { t } = useTranslation()

        return (
            <div className="space-y-2">
                {recentReadings.length === 0 ? (
                    <p className="text-sm text-muted text-center py-6">
                        {t('equipmentView.calculators.ecPhPlanner.noReadings')}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wider text-muted border-b border-slate-700/50">
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
                                                    {t(
                                                        `equipmentView.calculators.ecPhPlanner.${reading.readingType}`,
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {recentReadings.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        <ResultDisplay
                            label={t('equipmentView.calculators.ecPhPlanner.avgEc')}
                            value={(
                                recentReadings.reduce((s, r) => s + r.ec, 0) / recentReadings.length
                            ).toFixed(2)}
                            unit="mS/cm"
                        />
                        <ResultDisplay
                            label={t('equipmentView.calculators.ecPhPlanner.avgPh')}
                            value={(
                                recentReadings.reduce((s, r) => s + r.ph, 0) / recentReadings.length
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
        )
    },
)
EcPhHistoryTab.displayName = 'EcPhHistoryTab'

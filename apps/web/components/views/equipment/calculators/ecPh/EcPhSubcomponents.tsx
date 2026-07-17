import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { PlantStage } from '@/types'
import type { NutrientAlert } from '@/stores/slices/nutrientPlannerSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'

export type EcPhTabId = 'monitor' | 'schedule' | 'history'

export const StageLabel: React.FC<{ stage: PlantStage }> = memo(({ stage }) => {
    const { t } = useTranslation()
    return <span>{t(`plantStages.${stage}`)}</span>
})
StageLabel.displayName = 'StageLabel'

export const AlertBadge: React.FC<{ type: string }> = memo(({ type }) => {
    const { t } = useTranslation()
    const isHigh = type.includes('high')
    const isEc = type.includes('ec')
    const metricLabel = isEc ? 'EC' : 'pH'
    const directionLabel = isHigh
        ? t('equipmentView.calculators.ecPhPlanner.directionHigh')
        : t('equipmentView.calculators.ecPhPlanner.directionLow')
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

export const OptimalRangeBar: React.FC<{
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
            <div className="flex justify-between text-3xs text-slate-500">
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

export const EcPhMediumToolbar: React.FC<{
    medium: string
    autoAdjust: boolean
    onMediumChange: (medium: 'Soil' | 'Coco' | 'Hydro') => void
    onToggleAutoAdjust: () => void
}> = memo(({ medium, autoAdjust, onMediumChange, onToggleAutoAdjust }) => {
    const { t } = useTranslation()

    return (
        <div className="flex gap-2 flex-wrap">
            {(['Soil', 'Coco', 'Hydro'] as const).map((m) => (
                <button
                    key={m}
                    onClick={() => onMediumChange(m)}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                        medium === m
                            ? 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/50'
                            : 'bg-slate-800/50 text-slate-400 hover:text-slate-200',
                    )}
                >
                    {t(`equipmentView.calculators.ecPhPlanner.mediums.${m.toLowerCase()}`)}
                </button>
            ))}
            <button
                onClick={onToggleAutoAdjust}
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
    )
})
EcPhMediumToolbar.displayName = 'EcPhMediumToolbar'

export const EcPhAlertsPanel: React.FC<{
    alerts: NutrientAlert[]
    onDismissAlert: (id: string) => void
    onClearAlerts: () => void
}> = memo(({ alerts, onDismissAlert, onClearAlerts }) => {
    const { t } = useTranslation()

    if (alerts.length === 0) return null

    return (
        <div className="space-y-2">
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className="flex items-center gap-2 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2"
                >
                    <PhosphorIcons.WarningCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <AlertBadge type={alert.type} />
                    <span className="text-sm text-slate-300 flex-grow">{alert.message}</span>
                    <button
                        onClick={() => onDismissAlert(alert.id)}
                        className="text-slate-500 hover:text-slate-300"
                    >
                        <PhosphorIcons.X className="w-4 h-4" />
                    </button>
                </div>
            ))}
            {alerts.length > 1 && (
                <button
                    onClick={onClearAlerts}
                    className="text-xs text-slate-500 hover:text-slate-300"
                >
                    {t('equipmentView.calculators.ecPhPlanner.clearAlerts')}
                </button>
            )}
        </div>
    )
})
EcPhAlertsPanel.displayName = 'EcPhAlertsPanel'

export const EcPhTabBar: React.FC<{
    tabs: { id: EcPhTabId; label: string; icon: React.ReactNode }[]
    activeTab: EcPhTabId
    onTabChange: (tab: EcPhTabId) => void
}> = memo(({ tabs, activeTab, onTabChange }) => (
    <div className="flex gap-1 bg-slate-800/30 rounded-lg p-1">
        {tabs.map((tab) => (
            <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
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
))
EcPhTabBar.displayName = 'EcPhTabBar'

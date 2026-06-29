import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useBatteryStatus } from '@/hooks/useBatteryStatus'
import { cn } from '@/lib/utils'

export const BatteryEcoStatusBadge: React.FC = memo(() => {
    const { t } = useTranslation()
    const battery = useBatteryStatus()

    return (
        <div className="flex flex-wrap gap-2 text-xs">
            {battery.level != null && (
                <span
                    className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
                        battery.level <= 15
                            ? 'bg-red-900/40 text-red-300'
                            : battery.level <= 25
                              ? 'bg-amber-900/40 text-amber-300'
                              : 'bg-slate-700/60 text-slate-300',
                    )}
                >
                    <PhosphorIcons.Lightning className="w-3 h-3" />
                    {t('settingsView.offlineAi.batteryStatusLabel')}: {battery.level}%
                    {battery.charging ? ' (+)' : ''}
                </span>
            )}
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
                    battery.ecoActive
                        ? 'bg-amber-900/40 text-amber-300'
                        : 'bg-green-900/40 text-green-300',
                )}
            >
                {battery.ecoActive
                    ? t('settingsView.offlineAi.ecoStatusActive')
                    : t('settingsView.offlineAi.ecoStatusInactive')}
            </span>
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
                    battery.gpuGated
                        ? 'bg-red-900/40 text-red-300'
                        : 'bg-green-900/40 text-green-300',
                )}
            >
                {battery.gpuGated
                    ? t('settingsView.offlineAi.gpuStatusGated')
                    : t('settingsView.offlineAi.gpuStatusAvailable')}
            </span>
        </div>
    )
})
BatteryEcoStatusBadge.displayName = 'BatteryEcoStatusBadge'

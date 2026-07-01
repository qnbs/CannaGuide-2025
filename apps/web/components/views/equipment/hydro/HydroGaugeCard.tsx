import React, { memo } from 'react'
import { cn } from '@/lib/utils'

export interface HydroGaugeCardProps {
    label: string
    value: number | undefined
    unit: string
    min: number
    max: number
    decimals?: number | undefined
}

export const HydroGaugeCard: React.FC<HydroGaugeCardProps> = memo(
    ({ label, value, unit, min, max, decimals = 1 }) => {
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
    },
)
HydroGaugeCard.displayName = 'HydroGaugeCard'

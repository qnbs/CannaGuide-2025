import React, { memo } from 'react'
import { cn } from '@/lib/utils'

export interface HydroGaugeCardProps {
    label: string
    value: number | undefined
    unit: string
    /** The healthy range; a plain count (the number of readings) has none. */
    min?: number
    max?: number
    decimals?: number | undefined
}

type GaugeStatus = 'ok' | 'low' | 'high' | 'unknown'

/** Low or high only against a range; a value without one is just shown. */
const statusOf = (value: number | undefined, min?: number, max?: number): GaugeStatus => {
    if (value === undefined) return 'unknown'
    if (min !== undefined && value < min) return 'low'
    if (max !== undefined && value > max) return 'high'
    return 'ok'
}

export const HydroGaugeCard: React.FC<HydroGaugeCardProps> = memo(
    ({ label, value, unit, min, max, decimals = 1 }) => {
        const status = statusOf(value, min, max)
        const range =
            min !== undefined && max !== undefined ? ` (${String(min)}-${String(max)})` : ''

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
            unknown: 'text-muted',
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
                <p className="text-xs text-muted">
                    {unit}
                    {range}
                </p>
            </div>
        )
    },
)
HydroGaugeCard.displayName = 'HydroGaugeCard'

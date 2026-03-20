import React, { memo } from 'react'
import { useAppSelector } from '@/stores/store'
import { selectHighlightedElement } from '@/stores/selectors'

interface VitalBarProps {
    label: string
    value: number
    min: number
    max: number
    unit?: string
    highlightId?: string
    icon?: React.ReactNode
}

const getBarColor = (value: number, min: number, max: number): string => {
    const range = max - min
    const margin = range * 0.15
    if (value < min - margin || value > max + margin) return 'bg-red-500'
    if (value < min || value > max) return 'bg-amber-500'
    return 'bg-emerald-500'
}

export const VitalBar: React.FC<VitalBarProps> = memo(
    ({ label, value, min, max, unit = '', highlightId, icon }) => {
        const highlightedElement = useAppSelector(selectHighlightedElement)
        const range = max - min
        const margin = range * 0.5
        const displayMin = min - margin
        const displayMax = max + margin
        const percentage = Math.max(
            0,
            Math.min(100, ((value - displayMin) / (displayMax - displayMin)) * 100),
        )
        const isIdeal = value >= min && value <= max
        const isHighlighted = highlightedElement === highlightId
        const barColor = getBarColor(value, min, max)

        // Ideal zone indicator positions
        const zoneLeft = ((min - displayMin) / (displayMax - displayMin)) * 100
        const zoneWidth = ((max - min) / (displayMax - displayMin)) * 100

        return (
            <div
                className={`text-center p-2 rounded-lg transition-all duration-300 ${isHighlighted ? 'animate-pulse-glow' : ''}`}
                data-highlight-id={highlightId}
            >
                <div className="flex items-center justify-center gap-2">
                    {icon && (
                        <div
                            className={`w-4 h-4 flex-shrink-0 ${isIdeal ? 'text-primary-400' : 'text-amber-400'}`}
                        >
                            {icon}
                        </div>
                    )}
                    <p className="text-sm font-semibold text-slate-300">{label}</p>
                </div>
                <div className="relative w-full bg-slate-700 rounded-full h-2.5 my-1">
                    {/* Ideal zone background */}
                    <div
                        className="absolute top-0 h-full bg-emerald-500/15 rounded-full"
                        style={{ left: `${zoneLeft}%`, width: `${zoneWidth}%` }}
                    />
                    <div
                        role="progressbar"
                        aria-label={label}
                        aria-valuenow={Math.round(percentage)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className={`h-2.5 rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <p className={`text-xs font-mono ${isIdeal ? 'text-slate-400' : 'text-amber-400'}`}>
                    {value.toFixed(1)}
                    {unit}
                </p>
            </div>
        )
    },
)

VitalBar.displayName = 'VitalBar'

import React, { memo } from 'react'
import { useUIStore } from '@/stores/useUIStore'

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
        const highlightedElement = useUIStore((s) => s.highlightedElement)
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
        const iconColorClassName = isIdeal ? 'text-primary-400' : 'text-amber-400'
        const valueColorClassName = isIdeal ? 'text-slate-400' : 'text-amber-400'

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
                        <div className={`w-4 h-4 flex-shrink-0 ${iconColorClassName}`}>{icon}</div>
                    )}
                    <p className="text-sm font-semibold text-slate-300">{label}</p>
                </div>
                <div className="relative w-full bg-slate-700 rounded-full h-2.5 my-1">
                    {/* Ideal zone background */}
                    <div
                        className="absolute top-0 h-full bg-emerald-500/15 rounded-full"
                        style={{ left: `${zoneLeft}%`, width: `${zoneWidth}%` }}
                    />
                    <progress
                        value={Math.round(percentage)}
                        max={100}
                        aria-label={label}
                        className={`h-2.5 w-full appearance-none rounded-full bg-transparent [&::-moz-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full ${barColor}`}
                    />
                </div>
                <p className={`text-xs font-mono ${valueColorClassName}`}>
                    {value.toFixed(1)}
                    {unit}
                </p>
            </div>
        )
    },
)

VitalBar.displayName = 'VitalBar'

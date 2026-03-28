import React, { useId, memo } from 'react'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Input as PrimitiveInput, Select as PrimitiveSelect } from '@/components/ui/form'

export const CalculatorSection: React.FC<{
    title: string
    description: string
    children: React.ReactNode
}> = memo(({ title, description, children }) => (
    <div className="space-y-4">
        <div>
            <h3 className="text-xl font-bold font-display text-primary-400">{title}</h3>
            <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
        <div className="space-y-4">{children}</div>
    </div>
))
CalculatorSection.displayName = 'CalculatorSection'

export const Input: React.FC<
    React.InputHTMLAttributes<HTMLInputElement> & { label: string; unit?: string; tooltip?: string }
> = ({ label, unit, tooltip, ...props }) => {
    const id = useId()
    const tooltipId = useId()
    return (
        <div>
            <div className="mb-1 flex items-center gap-1">
                <label htmlFor={id} className="block text-sm font-semibold text-slate-300">
                    {label}
                </label>
                {tooltip && (
                    <span className="group/tooltip relative">
                        <button
                            type="button"
                            className="rounded text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                            aria-label={label}
                            aria-describedby={tooltipId}
                        >
                            <PhosphorIcons.Question className="w-4 h-4" />
                        </button>
                        <span
                            id={tooltipId}
                            role="tooltip"
                            className="absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-md bg-slate-900 p-2 text-xs text-slate-200 opacity-0 shadow-lg transition-opacity pointer-events-none group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
                        >
                            {tooltip}
                        </span>
                    </span>
                )}
            </div>
            <div className="relative">
                <PrimitiveInput id={id} {...props} />
                {unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    )
}

export const Select: React.FC<{
    label: string
    options: { value: string | number; label: string }[]
    value?: string | number
    onChange?: (e: { target: { value: string | number } }) => void
    className?: string
}> = ({ label, options, ...props }) => {
    const id = useId()
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1">
                {label}
            </label>
            <PrimitiveSelect options={options} {...props} />
        </div>
    )
}

export const ResultDisplay: React.FC<{
    label: string
    value: string
    unit?: string
    children?: React.ReactNode
}> = memo(({ label, value, unit, children }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg text-center">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-primary-400 my-1">
            {value} <span className="text-xl">{unit}</span>
        </p>
        {children}
    </div>
))
ResultDisplay.displayName = 'ResultDisplay'

import React from 'react'

interface SegmentedControlProps<T extends string> {
    options: { value: T; label: string; icon?: React.ReactNode }[]
    value: T[]
    onToggle: (value: T) => void
    className?: string
    buttonClassName?: string
}

export function SegmentedControl<T extends string>({
    options,
    value,
    onToggle,
    className = '',
    buttonClassName = '',
}: SegmentedControlProps<T>) {
    return (
        <div
            className={`flex flex-wrap items-center gap-2 ${className}`}
            role="group"
        >
            {options.map((option) => {
                const isActive = value.includes(option.value)
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onToggle(option.value)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                            isActive
                                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 ring-1 ring-inset ring-slate-700/50'
                        } ${buttonClassName}`}
                        aria-pressed={isActive}
                    >
                        {option.icon}
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
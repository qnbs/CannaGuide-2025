import React, { useCallback, useRef } from 'react'

interface SegmentedControlProps<T extends string> {
    options: { value: T; label: string; icon?: React.ReactNode }[]
    value: T[]
    onToggle: (value: T) => void
    className?: string
    buttonClassName?: string
    'aria-label'?: string
}

export function SegmentedControl<T extends string>({
    options,
    value,
    onToggle,
    className = '',
    buttonClassName = '',
    'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
    const groupRef = useRef<HTMLFieldSetElement>(null)

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const buttons = Array.from(
            groupRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
        )
        const target = e.target
        if (!(target instanceof HTMLButtonElement)) return
        const currentIndex = buttons.indexOf(target)
        if (currentIndex < 0) return

        let nextIndex = -1
        if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % buttons.length
        else if (e.key === 'ArrowLeft')
            nextIndex = (currentIndex - 1 + buttons.length) % buttons.length
        else if (e.key === 'Home') nextIndex = 0
        else if (e.key === 'End') nextIndex = buttons.length - 1

        if (nextIndex >= 0) {
            e.preventDefault()
            buttons[nextIndex]?.focus()
        }
    }, [])

    return (
        <fieldset ref={groupRef} className={`flex flex-wrap items-center gap-2 ${className}`}>
            {ariaLabel && <legend className="sr-only">{ariaLabel}</legend>}
            {options.map((option) => {
                const isActive = value.includes(option.value)
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onToggle(option.value)}
                        onKeyDown={handleKeyDown}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                            isActive
                                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20 ring-1 ring-inset ring-white/50'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 ring-1 ring-inset ring-white/20'
                        } ${buttonClassName}`}
                        aria-pressed={isActive}
                    >
                        {option.icon}
                        {option.label}
                    </button>
                )
            })}
        </fieldset>
    )
}

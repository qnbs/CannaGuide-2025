import React, { useId, memo } from 'react'

interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string // Made label optional
    'aria-label'?: string
}

export const Switch: React.FC<SwitchProps> = memo(
    ({ checked, onChange, label, 'aria-label': ariaLabel }) => {
        const id = useId()
        return (
            <div className="flex items-center">
                {label && (
                    <label
                        htmlFor={id}
                        className="text-sm font-semibold text-slate-300 cursor-pointer mr-3"
                    >
                        {label}
                    </label>
                )}
                <button
                    id={id}
                    role="switch"
                    aria-checked={checked}
                    aria-label={ariaLabel || label}
                    onClick={() => onChange(!checked)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${
                        checked ? 'bg-primary-500 border-primary-400' : 'bg-slate-700 border-slate-600'
                    }`}
                >
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>
        )
    }
)
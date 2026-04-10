import React, { useId } from 'react'
import {
    Select as UiSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input as UiInput } from '@/components/ui/input'
import { Textarea as UiTextarea } from '@/components/ui/textarea'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

type InputProps =
    | ({ as?: 'input' } & React.InputHTMLAttributes<HTMLInputElement> & { label?: string })
    | ({ as: 'textarea' } & React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string })

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
    ({ as = 'input', label, className, ...props }, ref) => {
        const id = useId()

        const control =
            as === 'textarea' ? (
                <UiTextarea
                    id={id}
                    className={className}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    ref={ref as React.Ref<HTMLTextAreaElement>}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                />
            ) : (
                <UiInput
                    id={id}
                    className={className}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    ref={ref as React.Ref<HTMLInputElement>}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                />
            )

        if (!label) return control

        return (
            <div>
                <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-300">
                    {label}
                </label>
                {control}
            </div>
        )
    },
)
Input.displayName = 'FormInput'

export type LegacySelectOption = { value: string | number; label: string }

interface SelectProps {
    options: LegacySelectOption[]
    value?: string | number
    onChange?: (e: { target: { value: string | number } }) => void
    label?: string
    className?: string
    disabled?: boolean
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
    ({ options, value, onChange, label, className, disabled, ...props }, ref) => {
        const id = useId()
        // Radix Select uses value="" to mean "clear selection and show placeholder".
        // Always pass a controlled value (never undefined) to prevent the React
        // "uncontrolled to controlled" warning when callers initialise state with ''.
        const stringValue = value != null ? String(value) : ''

        // Radix SelectItem throws on empty-string values, so separate the
        // placeholder option (value === '') from the real items.
        const placeholderOption = options.find((o) => String(o.value) === '')
        const realOptions = options.filter((o) => String(o.value) !== '')

        return (
            <div>
                {label && (
                    <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-300">
                        {label}
                    </label>
                )}
                <UiSelect
                    value={stringValue}
                    onValueChange={(next) => {
                        const matched = realOptions.find((option) => String(option.value) === next)
                        onChange?.({ target: { value: matched ? matched.value : next } })
                    }}
                    {...(disabled != null ? { disabled } : {})}
                >
                    <SelectTrigger id={id} ref={ref} className={className} {...props}>
                        <SelectValue placeholder={placeholderOption?.label} />
                    </SelectTrigger>
                    <SelectContent>
                        {realOptions.map((option) => (
                            <SelectItem key={String(option.value)} value={String(option.value)}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </UiSelect>
            </div>
        )
    },
)
Select.displayName = 'FormSelect'

export const FormSection: React.FC<{
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
    icon?: React.ReactNode
}> = ({ title, children, defaultOpen = false, icon }) => (
    <details
        open={defaultOpen}
        className="group rounded-xl bg-slate-800/30 p-4 ring-1 ring-inset ring-slate-700/50 hover:ring-primary-500/30 transition-[box-shadow,color] duration-200"
    >
        <summary className="mb-3 flex list-none items-center justify-between text-lg font-semibold text-primary-400 cursor-pointer">
            <div className="flex items-center gap-2">
                {icon}
                {title}
            </div>
            <PhosphorIcons.ChevronDown className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-1 gap-4 border-t border-slate-700/50 pt-4 sm:grid-cols-2">
            {children}
        </div>
    </details>
)

import type React from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export const SettingsRow: React.FC<{
    label: string
    description?: string
    children: React.ReactNode
    id?: string
}> = ({ label, description, children, id }) => (
    <div
        id={id}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-b border-slate-700/50 pb-4 last:border-b-0 last:pb-0 last:mb-0"
    >
        <div className="min-w-0">
            <h4 className="font-semibold text-slate-100">{label}</h4>
            {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
        </div>
        <div className="w-full flex-shrink-0 sm:w-auto sm:max-w-xs">{children}</div>
    </div>
)
SettingsRow.displayName = 'SettingsRow'

export const SettingsSelect: React.FC<{
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
    disabled?: boolean
}> = ({ value, options, onChange, disabled }) => (
    <Select value={value ?? ''} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                    {option.label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
)
SettingsSelect.displayName = 'SettingsSelect'

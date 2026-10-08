import { Children, cloneElement, useId, type ReactElement, type ReactNode } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    SettingsRowLabelProvider,
    useSettingsRowLabelProps,
} from '@/components/common/settingsRowLabel'

function labelDomControl(child: ReactNode, labelId: string): ReactNode {
    if (!isDomControl(child)) return child
    const labelled =
        typeof child.props['aria-label'] === 'string' && child.props['aria-label'].trim().length > 0
    const labelledBy =
        typeof child.props['aria-labelledby'] === 'string' &&
        child.props['aria-labelledby'].trim().length > 0
    if (labelled || labelledBy) return child
    return cloneElement(child, { 'aria-labelledby': labelId })
}

function isDomControl(child: ReactNode): child is ReactElement<{
    'aria-label'?: string
    'aria-labelledby'?: string
}> {
    return (
        typeof child === 'object' &&
        child !== null &&
        'type' in child &&
        (child.type === 'input' || child.type === 'select' || child.type === 'textarea')
    )
}

export function SettingsRow({
    label,
    description,
    children,
    id,
}: {
    label: string
    description?: string
    children: ReactNode
    id?: string
}) {
    const generatedId = useId()
    const labelId = id ? `${id}-label` : generatedId
    const namedChildren = Children.map(children, (child) => labelDomControl(child, labelId))
    return (
        <div
            id={id}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-b border-slate-700/50 pb-4 last:border-b-0 last:pb-0 last:mb-0"
        >
            <div className="min-w-0">
                <h4 id={labelId} className="font-semibold text-slate-100">
                    {label}
                </h4>
                {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
            </div>
            <SettingsRowLabelProvider labelId={labelId}>
                <div className="w-full flex-shrink-0 sm:w-auto sm:max-w-xs">{namedChildren}</div>
            </SettingsRowLabelProvider>
        </div>
    )
}
SettingsRow.displayName = 'SettingsRow'

export function SettingsSelect({
    value,
    options,
    onChange,
    disabled,
}: {
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
    disabled?: boolean
}) {
    const labelProps = useSettingsRowLabelProps()
    return (
        <Select
            value={value ?? ''}
            onValueChange={onChange}
            {...(disabled != null ? { disabled } : {})}
        >
            <SelectTrigger {...labelProps}>
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
}
SettingsSelect.displayName = 'SettingsSelect'

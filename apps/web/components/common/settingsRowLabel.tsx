import { createContext, useContext, type ReactNode } from 'react'

const SettingsRowLabelContext = createContext<string | undefined>(undefined)

export function SettingsRowLabelProvider({
    labelId,
    children,
}: {
    labelId: string
    children: ReactNode
}) {
    return (
        <SettingsRowLabelContext.Provider value={labelId}>
            {children}
        </SettingsRowLabelContext.Provider>
    )
}

export function useSettingsRowLabelId(): string | undefined {
    return useContext(SettingsRowLabelContext)
}

/** An explicit name wins. Otherwise the enclosing SettingsRow label is the name. */
export function useSettingsRowLabelProps(explicitLabel?: string): {
    'aria-label'?: string
    'aria-labelledby'?: string
} {
    const rowLabelId = useSettingsRowLabelId()
    const trimmed = explicitLabel?.trim() ?? ''
    if (trimmed.length > 0) return { 'aria-label': trimmed }
    if (rowLabelId) return { 'aria-labelledby': rowLabelId }
    return {}
}

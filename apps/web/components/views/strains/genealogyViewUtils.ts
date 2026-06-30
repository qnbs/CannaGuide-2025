export type HighlightMode = 'none' | 'landraces' | 'sativa' | 'indica'

export const getNodeGroupClass = (highlightMode: HighlightMode, matches: boolean): string => {
    if (highlightMode === 'none') return ''
    if (matches) return 'genealogy-node-highlighted'
    return 'genealogy-node-dimmed'
}

export const getNextLayoutOrientation = (
    layoutOrientation: 'horizontal' | 'vertical',
): 'horizontal' | 'vertical' => {
    return layoutOrientation === 'horizontal' ? 'vertical' : 'horizontal'
}

export const toSelectedStrainId = (value: string | number | null | undefined): string | null => {
    if (value == null) return null
    const normalized = String(value)
    return normalized.length > 0 ? normalized : null
}

/** Map raw d3 layout coords to screen coords based on tree orientation. */
export const layoutPosition = (
    orientation: 'horizontal' | 'vertical',
    x: number | undefined,
    y: number | undefined,
): { x: number; y: number } => {
    if (orientation === 'horizontal') {
        return { x: y ?? 0, y: x ?? 0 }
    }
    return { x: x ?? 0, y: y ?? 0 }
}

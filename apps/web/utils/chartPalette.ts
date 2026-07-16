/**
 * Categorical chart palette -- the single source for Recharts series colors.
 *
 * These hexes mirror `--color-chart-1..8` in `packages/ui/src/tokens.css` (keep
 * the two in sync). Recharts sets `fill`/`stroke` as SVG presentation
 * attributes, which do NOT resolve CSS `var()`, so charts read hex from here
 * rather than the CSS custom properties. The set is CVD-safe -- validated via
 * the data-viz method against the darkest theme chart surface (worst adjacent
 * CVD separation 8.4, normal-vision 19.3). Assign in FIXED slot order; a 9th
 * series folds to "Other", never a cycled hue.
 */
export const CHART_SERIES = [
    '#3987e5', // 1 blue
    '#008300', // 2 green
    '#d55181', // 3 magenta
    '#c98500', // 4 yellow
    '#199e70', // 5 aqua
    '#d95926', // 6 orange
    '#9085e9', // 7 violet
    '#e66767', // 8 red
] as const

/** Non-series chart chrome. Mirrors `--color-chart-grid/-axis/-label`. */
export const CHART_CHROME = {
    grid: '#475569', // slate-600 hairline (use at low opacity)
    axis: '#64748b', // slate-500 axis / baseline
    label: '#94a3b8', // slate-400 tick + axis labels
} as const

/**
 * Series color by 0-based index, in fixed slot order. Past the 8th slot the
 * palette does not cycle -- callers with more than 8 series should fold the
 * remainder into "Other" (this returns the muted label grey as that bucket).
 */
export function chartSeriesColor(index: number): string {
    return CHART_SERIES[index] ?? CHART_CHROME.label
}

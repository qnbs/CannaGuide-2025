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

// ---------------------------------------------------------------------------
// Domain color families -- fixed-meaning colors, NOT the categorical palette.
// Mirror --color-cannabinoid-* / --color-vpd-zone-* / --color-metric-* in
// packages/ui/src/tokens.css (kept in sync by chartPalette.test.ts). Recharts
// props read hex from here; HTML sites can use rgb(var(--color-...)) instead.
// ---------------------------------------------------------------------------

/** Cannabinoid colors (conventional hues). Mirror `--color-cannabinoid-*`. */
export const CANNABINOID_COLORS = {
    thc: '#10b981',
    cbd: '#3b82f6',
    cbg: '#a855f7',
    thcv: '#f97316',
    cbc: '#eab308',
    cbn: '#6366f1',
} as const

/** VPD grow-phase zone colors, cool -> warm. Mirror `--color-vpd-zone-*`. */
export const VPD_ZONE_COLORS = {
    propagation: '#3b82f6',
    seedling: '#06b6d4',
    vegetative: '#22c55e',
    earlyFlower: '#eab308',
    lateFlower: '#f97316',
    danger: '#ef4444',
} as const

/** Sensor / grow metric colors, distinct within any one chart. Mirror `--color-metric-*`. */
export const METRIC_COLORS = {
    temperature: '#f97316',
    humidity: '#3b82f6',
    ph: '#22c55e',
    ec: '#a855f7',
    height: '#06b6d4',
    health: '#10b981',
} as const

/** Flavonoid colors (conventional). Mirror `--color-flavonoid-*`. Keyed by display name. */
export const FLAVONOID_COLORS: Record<string, string> = {
    'Cannflavin A': '#f59e0b',
    'Cannflavin B': '#f97316',
    Quercetin: '#84cc16',
    Apigenin: '#22d3ee',
    Luteolin: '#a78bfa',
    Kaempferol: '#fb7185',
}

/** Fixed status colors for SVG chart marks (rings/gauges). Mirror `--color-chart-status-*`. */
export const CHART_STATUS = {
    good: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
} as const

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CHART_SERIES, CHART_CHROME } from './chartPalette'

// The chart palette is duplicated by necessity: CSS custom properties in
// packages/ui/src/tokens.css (for CSS-styled chart chrome) and the hex constants
// here (for Recharts fill/stroke props, which don't resolve CSS var()). This is
// the automated parity check that keeps the two in sync -- flagged by CodeRabbit
// and the Claude review on #442 as the follow-up to the hand-comment "keep in sync".
const TOKENS_CSS = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'packages', 'ui', 'src', 'tokens.css'),
    'utf8',
)

/** Parse `--color-<name>: R G B;` from tokens.css and return it as `#rrggbb`. */
function tokenHex(name: string): string {
    const m = TOKENS_CSS.match(new RegExp(`--color-${name}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)\\s*;`))
    if (!m) throw new Error(`token --color-${name} not found in tokens.css`)
    const [, r, g, b] = m
    return '#' + [r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
}

describe('chart palette parity: chartPalette.ts <-> tokens.css', () => {
    it('CHART_SERIES matches --color-chart-1..8', () => {
        expect(CHART_SERIES).toHaveLength(8)
        CHART_SERIES.forEach((hex, i) => {
            expect(tokenHex(`chart-${i + 1}`)).toBe(hex.toLowerCase())
        })
    })

    it('CHART_CHROME matches --color-chart-grid/-axis/-label', () => {
        expect(tokenHex('chart-grid')).toBe(CHART_CHROME.grid.toLowerCase())
        expect(tokenHex('chart-axis')).toBe(CHART_CHROME.axis.toLowerCase())
        expect(tokenHex('chart-label')).toBe(CHART_CHROME.label.toLowerCase())
    })
})

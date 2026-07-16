#!/usr/bin/env node
// ---------------------------------------------------------------------------
// check-contrast.mjs — WCAG-AA contrast audit for every theme
// ---------------------------------------------------------------------------
// The design system in packages/ui/src/tokens.css defines 9 dark themes as
// space-separated RGB triplets, but nothing verified that text/interactive
// colors actually clear WCAG-AA against their backgrounds. This script parses
// tokens.css, reconstructs each theme exactly as the browser would (the
// `:root, :root.dark.theme-midnight` block is the BASE; every other theme
// block overlays only the tokens it redefines — omitted tokens inherit the
// base), and checks a curated set of real foreground/background pairs.
//
//   node scripts/check-contrast.mjs            # advisory: report + exit 0
//   node scripts/check-contrast.mjs --strict   # exit 1 if any pair fails
//   node scripts/check-contrast.mjs --json      # machine-readable summary
//
// It is intentionally NOT a package.json script (see CLAUDE.md: root scripts
// widen the scoped typecheck). CI runs it via `node scripts/check-contrast.mjs`
// in the quality job as an advisory step. It has zero dependencies.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TOKENS_PATH = join(__dirname, '..', 'packages', 'ui', 'src', 'tokens.css')

const args = new Set(process.argv.slice(2))
const STRICT = args.has('--strict')
const JSON_OUT = args.has('--json')

// AA thresholds.
const AA_TEXT = 4.5 // normal-size body text
const AA_LARGE = 3.0 // large text (>=18.66px bold / 24px) and UI components/graphics

// --- Curated semantic pairs (foreground token, background token, min ratio) ---
// These mirror how the tokens are actually consumed in apps/web (slate-* maps
// to --color-neutral-*; primary buttons use --color-text-on-accent on
// --color-primary-600; focus rings use --color-primary-400).
const PAIRS = [
    ['neutral-100', 'bg-primary', AA_TEXT, 'body text on page'],
    ['neutral-200', 'bg-component', AA_TEXT, 'body text on card'],
    ['neutral-300', 'bg-component', AA_TEXT, 'secondary text on card'],
    ['neutral-400', 'bg-component', AA_TEXT, 'muted text on card'],
    ['neutral-500', 'bg-component', AA_TEXT, 'subtle text on card'],
    ['text-on-accent', 'primary-600', AA_TEXT, 'primary button label'],
    ['primary-300', 'bg-primary', AA_TEXT, 'link/interactive text'],
    ['primary-400', 'bg-primary', AA_LARGE, 'focus ring / interactive border'],
    ['success', 'bg-component', AA_LARGE, 'success status'],
    ['warning', 'bg-component', AA_LARGE, 'warning status'],
    ['danger', 'bg-component', AA_TEXT, 'danger status text'],
    ['info', 'bg-component', AA_TEXT, 'info status text'],
]

// --- WCAG relative luminance + contrast ratio ---------------------------------
const srgbToLinear = (c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const luminance = ([r, g, b]) =>
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
const contrast = (fg, bg) => {
    const l1 = luminance(fg)
    const l2 = luminance(bg)
    const light = Math.max(l1, l2)
    const dark = Math.min(l1, l2)
    return (light + 0.05) / (dark + 0.05)
}

// --- Parse tokens.css into { themeName: { colorToken: [r,g,b] } } -------------
function parseThemes(css) {
    const blocks = css.split('}')
    const base = {} // from :root / theme-midnight
    const themeOverrides = {} // themeName -> { token: [r,g,b] }
    const order = []

    for (const block of blocks) {
        const braceIdx = block.indexOf('{')
        if (braceIdx === -1) continue
        const selector = block.slice(0, braceIdx)
        const body = block.slice(braceIdx + 1)

        const colors = {}
        const re = /--color-([a-z0-9-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g
        let m
        while ((m = re.exec(body)) !== null) {
            colors[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])]
        }
        if (Object.keys(colors).length === 0) continue // e.g. the typography :root block

        // The midnight block also carries the bare `:root` selector — treat it as base.
        const themeMatch = selector.match(/theme-([A-Za-z0-9]+)/)
        if (/(^|,)\s*:root\s*(,|$)/.test(selector) || (themeMatch && themeMatch[1] === 'midnight')) {
            Object.assign(base, colors)
        }
        if (themeMatch) {
            const name = themeMatch[1]
            if (!themeOverrides[name]) {
                themeOverrides[name] = {}
                order.push(name)
            }
            Object.assign(themeOverrides[name], colors)
        }
    }

    const themes = {}
    for (const name of order) {
        themes[name] = { ...base, ...themeOverrides[name] }
    }
    return themes
}

// --- Run ----------------------------------------------------------------------
const css = readFileSync(TOKENS_PATH, 'utf8')
const themes = parseThemes(css)
const themeNames = Object.keys(themes)

const results = []
let totalChecks = 0
let totalFails = 0

for (const theme of themeNames) {
    const tokens = themes[theme]
    for (const [fgKey, bgKey, min, label] of PAIRS) {
        const fg = tokens[fgKey]
        const bg = tokens[bgKey]
        if (!fg || !bg) continue // token genuinely undefined in this theme + base
        // Round before the verdict so the printed number and pass/fail agree
        // (a raw 4.495 must not display as "4.50 … FAIL").
        const ratio = Number(contrast(fg, bg).toFixed(2))
        const pass = ratio >= min
        totalChecks++
        if (!pass) totalFails++
        results.push({ theme, fgKey, bgKey, min, label, ratio, pass })
    }
}

if (JSON_OUT) {
    console.log(JSON.stringify({ totalChecks, totalFails, results }, null, 2))
} else {
    console.log('\nWCAG-AA theme contrast audit  (advisory)')
    console.log('='.repeat(72))
    for (const theme of themeNames) {
        const rows = results.filter((r) => r.theme === theme)
        const fails = rows.filter((r) => !r.pass)
        const flag = fails.length === 0 ? 'PASS' : `${fails.length} FAIL`
        console.log(`\n${theme}  [${flag}]`)
        for (const r of fails) {
            console.log(
                `   FAIL  ${r.ratio.toFixed(2)}:1  (need ${r.min})  ${r.fgKey} on ${r.bgKey}  — ${r.label}`,
            )
        }
    }
    console.log('\n' + '='.repeat(72))
    console.log(
        `${themeNames.length} themes · ${totalChecks} checks · ${totalFails} below AA · ${totalChecks - totalFails} pass`,
    )
    console.log(STRICT ? '(strict mode — non-zero exit on failures)' : '(advisory mode — non-blocking)')
}

// --- GitHub step summary (when running in Actions) ----------------------------
if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = ['## WCAG-AA theme contrast audit', '']
    lines.push(`**${totalFails}** of ${totalChecks} pairs below AA across ${themeNames.length} themes.`, '')
    if (totalFails > 0) {
        lines.push('| Theme | Pair | Ratio | Needs |', '| --- | --- | --- | --- |')
        for (const r of results.filter((x) => !x.pass)) {
            lines.push(`| ${r.theme} | ${r.fgKey} on ${r.bgKey} (${r.label}) | ${r.ratio}:1 | ${r.min} |`)
        }
    } else {
        lines.push('All pairs clear AA. ✅')
    }
    try {
        const { appendFileSync } = await import('node:fs')
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
    } catch {
        /* summary is best-effort */
    }
}

process.exit(STRICT && totalFails > 0 ? 1 : 0)

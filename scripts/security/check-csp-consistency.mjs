#!/usr/bin/env node
// ---------------------------------------------------------------------------
// CSP Consistency Checker
// ---------------------------------------------------------------------------
// Extracts CSP directives from all 4 delivery paths and compares them.
// Exits with code 1 if any directives differ (excluding Tauri-specific ones).
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

/**
 * Parse a CSP string into a sorted map of directive -> sorted values.
 */
function parseCSP(csp) {
    const directives = new Map()
    const parts = csp
        .replace(/\s+/g, ' ')
        .trim()
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)

    for (const part of parts) {
        const tokens = part.split(/\s+/)
        const name = tokens[0]
        const values = tokens.slice(1).sort()
        directives.set(name, values.join(' '))
    }
    return directives
}

/**
 * Extract CSP from index.html meta tag.
 */
function extractFromIndexHtml() {
    const html = readFileSync(resolve(ROOT, 'apps/web/index.html'), 'utf-8')
    const match =
        html.match(/content="([^"]*)"[^>]*http-equiv="Content-Security-Policy"/i) ||
        html.match(/http-equiv="Content-Security-Policy"[^>]*content="([^"]*)"/i)
    if (!match) {
        console.error('[FAIL] Could not find CSP meta tag in index.html')
        process.exit(1)
    }
    return match[1]
}

/**
 * Extract CSP from netlify.toml headers.
 */
function extractFromNetlify() {
    const toml = readFileSync(resolve(ROOT, 'netlify.toml'), 'utf-8')
    const match = toml.match(/Content-Security-Policy\s*=\s*"([^"]*)"/i)
    if (!match) {
        console.error('[FAIL] Could not find CSP in netlify.toml')
        process.exit(1)
    }
    return match[1]
}

/**
 * Extract CSP from tauri.conf.json.
 */
function extractFromTauri() {
    const json = JSON.parse(readFileSync(resolve(ROOT, 'src-tauri/tauri.conf.json'), 'utf-8'))
    const csp = json?.app?.security?.csp ?? json?.tauri?.security?.csp
    if (!csp) {
        console.error('[FAIL] Could not find CSP in tauri.conf.json')
        process.exit(1)
    }
    return csp
}

/**
 * Extract CSP from securityHeaders.ts (the single source of truth).
 */
function extractFromSecurityHeaders() {
    const ts = readFileSync(resolve(ROOT, 'apps/web/securityHeaders.ts'), 'utf-8')
    // Match: export const CSP = `...` or export const CSP = '...'
    const match = ts.match(/export\s+const\s+CSP\s*=\s*[`'"]([^`'"]+)[`'"]/s)
    if (!match) {
        console.error('[FAIL] Could not find CSP export in securityHeaders.ts')
        process.exit(1)
    }
    return match[1].replace(/\n/g, ' ')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// Directives that are expected to differ in Tauri (desktop app needs blob:/data: in default-src)
const TAURI_EXPECTED_DIFFS = new Set(['default-src', 'font-src'])
// Netlify adds frame-ancestors which others may not have
const NETLIFY_EXTRAS = new Set(['frame-ancestors'])

const sources = {
    'securityHeaders.ts': extractFromSecurityHeaders(),
    'index.html': extractFromIndexHtml(),
    'netlify.toml': extractFromNetlify(),
    'tauri.conf.json': extractFromTauri(),
}

const parsed = Object.fromEntries(
    Object.entries(sources).map(([name, csp]) => [name, parseCSP(csp)]),
)

const reference = parsed['securityHeaders.ts']
let hasErrors = false

for (const [name, directives] of Object.entries(parsed)) {
    if (name === 'securityHeaders.ts') continue

    for (const [directive, refValue] of reference) {
        // Skip Tauri-specific expected differences
        if (name === 'tauri.conf.json' && TAURI_EXPECTED_DIFFS.has(directive)) continue

        const actual = directives.get(directive)
        if (!actual) {
            console.error(`[FAIL] ${name}: missing directive '${directive}'`)
            hasErrors = true
        } else if (actual !== refValue) {
            console.error(
                `[FAIL] ${name}: directive '${directive}' differs\n  expected: ${refValue}\n  actual:   ${actual}`,
            )
            hasErrors = true
        }
    }

    // Check for extra directives not in reference (except known extras)
    for (const directive of directives.keys()) {
        if (!reference.has(directive)) {
            if (name === 'netlify.toml' && NETLIFY_EXTRAS.has(directive)) continue
            if (name === 'tauri.conf.json' && TAURI_EXPECTED_DIFFS.has(directive)) continue
            console.warn(`[WARN] ${name}: extra directive '${directive}' not in securityHeaders.ts`)
        }
    }
}

if (hasErrors) {
    console.error('\n[FAIL] CSP inconsistencies detected. Fix the above issues.')
    process.exit(1)
} else {
    console.log('[OK] All CSP delivery paths are consistent with securityHeaders.ts.')
}

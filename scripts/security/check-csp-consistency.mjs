#!/usr/bin/env node
// ---------------------------------------------------------------------------
// CSP Consistency Checker
// ---------------------------------------------------------------------------
// Extracts CSP directives from all 5 delivery paths and compares them.
// Exits with code 1 if any directives differ.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')

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
 * Extract CSP from vercel.json headers.
 */
function extractFromVercel() {
    const json = readFileSync(resolve(ROOT, 'vercel.json'), 'utf-8')
    const config = JSON.parse(json)
    for (const rule of config.headers ?? []) {
        for (const h of rule.headers ?? []) {
            if (h.key === 'Content-Security-Policy') {
                return h.value
            }
        }
    }
    console.error('[FAIL] Could not find CSP in vercel.json')
    process.exit(1)
}

/**
 * Extract CSP from public/_headers (Cloudflare Pages / Netlify fallback).
 */
function extractFromPublicHeaders() {
    const text = readFileSync(resolve(ROOT, 'apps/web/public/_headers'), 'utf-8')
    const match = text.match(/Content-Security-Policy:\s*(.+)/i)
    if (!match) {
        console.error('[FAIL] Could not find CSP in public/_headers')
        process.exit(1)
    }
    return match[1].trim()
}

/**
 * Extract CSP from securityHeaders.ts (the single source of truth).
 * Parses the CSP_DIRECTIVES array and joins them like the runtime does.
 */
function extractFromSecurityHeaders() {
    const ts = readFileSync(resolve(ROOT, 'apps/web/securityHeaders.ts'), 'utf-8')
    // Extract individual directive strings from the CSP_DIRECTIVES array
    const arrayMatch = ts.match(/const\s+CSP_DIRECTIVES[\s\S]*?=\s*\[([\s\S]*?)\]/m)
    if (!arrayMatch) {
        console.error('[FAIL] Could not find CSP_DIRECTIVES array in securityHeaders.ts')
        process.exit(1)
    }
    const directiveStrings = []
    // Match double-quoted strings (directives use double quotes in the TS array)
    // or single-quoted strings that contain a CSP directive name
    const stringPattern = /"([^"]+)"/g
    let m
    while ((m = stringPattern.exec(arrayMatch[1])) !== null) {
        directiveStrings.push(m[1])
    }
    // Fallback: try single-quoted if no double-quoted found
    if (directiveStrings.length === 0) {
        const singlePattern = /'([^']+)'/g
        while ((m = singlePattern.exec(arrayMatch[1])) !== null) {
            directiveStrings.push(m[1])
        }
    }
    if (directiveStrings.length === 0) {
        console.error('[FAIL] Could not parse any directives from CSP_DIRECTIVES')
        process.exit(1)
    }
    return directiveStrings.join('; ') + ';'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// Netlify/vercel add frame-ancestors which securityHeaders.ts may not have
const PLATFORM_EXTRAS = new Set(['frame-ancestors'])

const sources = {
    'securityHeaders.ts': extractFromSecurityHeaders(),
    'index.html': extractFromIndexHtml(),
    'netlify.toml': extractFromNetlify(),
    'vercel.json': extractFromVercel(),
    'public/_headers': extractFromPublicHeaders(),
}

const parsed = Object.fromEntries(
    Object.entries(sources).map(([name, csp]) => [name, parseCSP(csp)]),
)

const reference = parsed['securityHeaders.ts']
let hasErrors = false

for (const [name, directives] of Object.entries(parsed)) {
    if (name === 'securityHeaders.ts') continue

    for (const [directive, refValue] of reference) {
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
            if (PLATFORM_EXTRAS.has(directive)) continue
            console.warn(`[WARN] ${name}: extra directive '${directive}' not in securityHeaders.ts`)
        }
    }
}

if (hasErrors) {
    console.error('\n[FAIL] CSP inconsistencies detected. Fix the above issues.')
    process.exit(1)
} else {
    console.log('[OK] All 5 CSP delivery paths are consistent with securityHeaders.ts.')
}

#!/usr/bin/env node
/**
 * check-audit-backlog.mjs
 *
 * Parses docs/AUDIT_BACKLOG.md and counts open items by severity.
 * Exits with code 1 if any CRITICAL- or HIGH-severity items are still Open or
 * In Progress. Used in CI to block releases with unresolved audit findings.
 *
 * `critical` used to be bucketed into `counts.low` and only `high` gated, so an
 * open CRITICAL item passed -- the one severity such a gate most obviously
 * exists to stop. Callers and docs must state both severities, or a
 * critical-only failure looks like unexpected gate behaviour and the wrong
 * check gets troubleshot.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BACKLOG_PATH = resolve('docs/AUDIT_BACKLOG.md')

let content
try {
    content = readFileSync(BACKLOG_PATH, 'utf-8')
} catch {
    console.error('[FAIL] Could not read', BACKLOG_PATH)
    process.exit(1)
}

// Split into sections by ### headers (each audit entry starts with ###)
const sections = content.split(/^### /m).slice(1)

const counts = { critical: 0, high: 0, medium: 0, low: 0 }

for (const section of sections) {
    // Extract severity from table row: | Severity | XYZ |
    // Read the WHOLE severity cell, not just a leading `\w+`. `(\w+)\s*\|` fails
    // to match a qualified value such as `Critical (upstream advisory)`, and a
    // row that fails to match is skipped entirely -- so the most severe entries
    // are exactly the ones a strict pattern is most likely to drop.
    const severityMatch = section.match(/\|\s*Severity\s*\|([^|]+)\|/i)
    // Extract status from table row: | Status | **XYZ** | (strip bold markers)
    const statusMatch = section.match(/\|\s*Status\s*\|\s*\**([^|*]+)\**\s*\|/i)

    if (!severityMatch || !statusMatch) continue

    // Normalise the cell: strip markdown emphasis, then classify on the leading
    // word so `**Critical** (upstream advisory)` still counts as critical.
    const severity = severityMatch[1]
        .replace(/[*`_]/g, '')
        .trim()
        .toLowerCase()
        .split(/[\s(,/-]/)[0]
    const status = statusMatch[1].trim().toLowerCase()

    // Only count Open and In Progress items
    if (status !== 'open' && status !== 'in progress') continue

    // `critical` used to be bucketed into `counts.low`, and only `high` blocked.
    // An open CRITICAL audit item therefore passed the release gate -- the one
    // severity the gate most obviously exists to stop.
    if (severity === 'critical') counts.critical++
    else if (severity === 'high') counts.high++
    else if (severity === 'medium') counts.medium++
    else if (severity === 'low') counts.low++
}

const total = counts.critical + counts.high + counts.medium + counts.low
const blocking = counts.critical + counts.high

console.log('')
console.log('AUDIT BACKLOG CHECK')
console.log('===================')
console.log(`Open CRITICAL: ${counts.critical}`)
console.log(`Open HIGH:     ${counts.high}`)
console.log(`Open MEDIUM:   ${counts.medium}`)
console.log(`Open LOW:      ${counts.low}`)
console.log(`Total Open:    ${total}`)
console.log('')

if (blocking > 0) {
    if (counts.critical > 0) {
        console.log(
            `[FAIL] ${counts.critical} open CRITICAL-severity item(s) found -- release blocked.`,
        )
    }
    if (counts.high > 0) {
        console.log(`[FAIL] ${counts.high} open HIGH-severity item(s) found -- release blocked.`)
    }
    process.exit(1)
}

console.log('[OK] No open CRITICAL or HIGH severity items -- release gate passed.')
process.exit(0)

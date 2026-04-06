#!/usr/bin/env node
/**
 * check-audit-backlog.mjs
 *
 * Parses docs/AUDIT_BACKLOG.md and counts open items by severity.
 * Exits with code 1 if any HIGH-severity items are still Open or In Progress.
 * Used in CI to block releases with unresolved high-priority audit findings.
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

const counts = { high: 0, medium: 0, low: 0 }

for (const section of sections) {
    // Extract severity from table row: | Severity | XYZ |
    const severityMatch = section.match(/\|\s*Severity\s*\|\s*(\w+)\s*\|/i)
    // Extract status from table row: | Status | **XYZ** | (strip bold markers)
    const statusMatch = section.match(/\|\s*Status\s*\|\s*\**([^|*]+)\**\s*\|/i)

    if (!severityMatch || !statusMatch) continue

    const severity = severityMatch[1].trim().toLowerCase()
    const status = statusMatch[1].trim().toLowerCase()

    // Only count Open and In Progress items
    if (status !== 'open' && status !== 'in progress') continue

    if (severity === 'high') counts.high++
    else if (severity === 'medium') counts.medium++
    else if (severity === 'low' || severity === 'critical') counts.low++
}

const total = counts.high + counts.medium + counts.low

console.log('')
console.log('AUDIT BACKLOG CHECK')
console.log('===================')
console.log(`Open HIGH:    ${counts.high}`)
console.log(`Open MEDIUM:  ${counts.medium}`)
console.log(`Open LOW:     ${counts.low}`)
console.log(`Total Open:   ${total}`)
console.log('')

if (counts.high > 0) {
    console.log(`[FAIL] ${counts.high} open HIGH-severity item(s) found -- release blocked.`)
    process.exit(1)
}

console.log('[OK] No open HIGH-severity items -- release gate passed.')
process.exit(0)

#!/usr/bin/env node
/**
 * Enforces minimum test coverage on security- and safety-critical services.
 *
 * Reads vitest json-summary output (apps/web/coverage/coverage-summary.json).
 * Default floor: 80 % lines + functions + branches per file.
 *
 * Usage:
 *   pnpm run test:coverage && pnpm run check:critical-path-coverage
 *
 * Env:
 *   CRITICAL_PATH_COVERAGE_MIN — default 80
 *   CRITICAL_PATH_COVERAGE_ADVISORY=1 — warn only, exit 0
 *   CRITICAL_PATH_COVERAGE_SUMMARY — override summary path
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const MIN_PCT = Number(process.env.CRITICAL_PATH_COVERAGE_MIN || '80')
const ADVISORY = process.env.CRITICAL_PATH_COVERAGE_ADVISORY === '1'
const SUMMARY_PATH =
    process.env.CRITICAL_PATH_COVERAGE_SUMMARY ||
    resolve('apps/web/coverage/coverage-summary.json')

/** Repo-relative paths (must match coverage-summary keys suffix). */
const CRITICAL_FILES = [
    'apps/web/services/ai/safetyPipeline.ts',
    'apps/web/services/syncEncryptionService.ts',
    'apps/web/services/plantSimulationService.ts',
    'apps/web/services/local-ai/vision/diagnosisService.ts',
]

function findEntry(summary, relPath) {
    const norm = relPath.replace(/\\/g, '/')
    if (summary[norm]) return summary[norm]
    const suffix = `/${norm}`
    const key = Object.keys(summary).find((k) => k === norm || k.endsWith(suffix))
    return key ? summary[key] : null
}

function pct(metric) {
    return metric?.pct ?? 0
}

function main() {
    if (!existsSync(SUMMARY_PATH)) {
        console.error(`[FAIL] Missing coverage summary: ${SUMMARY_PATH}`)
        console.error('       Run: pnpm run test:coverage')
        process.exit(ADVISORY ? 0 : 1)
    }

    const summary = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'))
    let failures = 0
    let branchWarnings = 0
    console.log('======================')
    console.log(`Min lines/functions: ${MIN_PCT}% | Advisory: ${ADVISORY}`)
    console.log('')

    for (const rel of CRITICAL_FILES) {
        const entry = findEntry(summary, rel)
        if (!entry) {
            console.log(`[FAIL] ${rel} — not found in coverage summary`)
            failures++
            continue
        }

        const lines = pct(entry.lines)
        const functions = pct(entry.functions)
        const branches = pct(entry.branches)
        const statements = pct(entry.statements)

        const lineOk = lines >= MIN_PCT
        const fnOk = functions >= MIN_PCT
        const branchOk = branches >= MIN_PCT
        const ok = lineOk && fnOk && branchOk

        const status = ok ? '[OK]' : '[FAIL]'
        console.log(
            `${status} ${rel}\n` +
                `       lines ${lines.toFixed(1)}% | functions ${functions.toFixed(1)}% | ` +
                `branches ${branches.toFixed(1)}% | statements ${statements.toFixed(1)}%`,
        )

        if (!lineOk) failures++
        if (!fnOk) failures++
        if (!branchOk) failures++
    }

    console.log('')
    console.log(
        `Files: ${CRITICAL_FILES.length} | Failures: ${failures} | Branch warnings: ${branchWarnings}`,
    )

    if (failures > 0 && !ADVISORY) {
        console.error('[FAIL] Critical path coverage below minimum')
        process.exit(1)
    }

    console.log('[OK] Critical path coverage gate passed')
    process.exit(0)
}

main()

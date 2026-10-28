#!/usr/bin/env node
/**
 * Workflow-lint ratchet: zizmor + actionlint findings may only go down
 * (CG-AUD-20261028-A-S6).
 *
 * Both tools report on .github/ (workflows, composite actions, dependabot).
 * A clean run is far off -- the A-0 inventory found 99 zizmor findings -- so a
 * pass/fail gate would either never go green or be switched off. Instead the
 * committed baseline holds a ceiling per finding class (`<severity> <rule>` for
 * zizmor, `<kind> <shellcheck code>` for actionlint) and CI fails when any
 * class rises or a new one appears. Per class, not in total: fixing 30 Low
 * findings must not pay for one new High.
 *
 *   node scripts/security/check-workflow-lint-ratchet.mjs           # check
 *   node scripts/security/check-workflow-lint-ratchet.mjs --update  # lower the baseline
 *
 * `--update` only ever lowers: it refuses to write while any class is above
 * its ceiling. Raising a ceiling is a reviewed hand edit of the baseline file.
 *
 * Needs `zizmor` and `actionlint` (with `shellcheck`) on PATH; CI installs
 * hash-pinned versions. zizmor runs --offline, so no token is needed.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '../..')
export const BASELINE = path.join(ROOT, '.workflow-lint-baseline.json')

/** Ceiling classes for zizmor's JSON findings: `<severity> <rule>`. */
export function countZizmor(findings) {
    const counts = {}
    for (const finding of findings) {
        const key = `${finding.determinations.severity} ${finding.ident}`
        counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
}

/** Ceiling classes for actionlint's JSON errors: `<kind>` plus the shellcheck code. */
export function countActionlint(errors) {
    const counts = {}
    for (const error of errors) {
        const code = /\bSC\d+\b/.exec(error.message)?.[0]
        const key = code ? `${error.kind} ${code}` : error.kind
        counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
}

/** Classes above their ceiling (a class missing from the baseline has ceiling 0). */
export function regressions(current, baseline) {
    const problems = []
    for (const tool of Object.keys(current)) {
        for (const [key, count] of Object.entries(current[tool])) {
            const ceiling = baseline[tool]?.[key] ?? 0
            if (count > ceiling) problems.push(`${tool}: ${key} ${ceiling} -> ${count}`)
        }
    }
    return problems
}

/** Classes now below their ceiling: the baseline can be lowered. */
export function improvements(current, baseline) {
    const lowered = []
    for (const [tool, ceilings] of Object.entries(baseline)) {
        if (tool.startsWith('_')) continue
        for (const [key, ceiling] of Object.entries(ceilings)) {
            const count = current[tool]?.[key] ?? 0
            if (count < ceiling) lowered.push(`${tool}: ${key} ${ceiling} -> ${count}`)
        }
    }
    return lowered
}

const sorted = (counts) =>
    Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)))

/** Run a linter that exits non-zero on findings; its stdout must still be a JSON array. */
function runJson(command, args) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    })
    if (result.error) throw new Error(`${command} could not run: ${result.error.message}`)
    try {
        const parsed = JSON.parse(result.stdout || 'null')
        if (Array.isArray(parsed)) return parsed
    } catch {
        // fall through to the error below
    }
    throw new Error(`${command} exited ${result.status} without JSON output:\n${result.stderr}`)
}

function main() {
    const current = {
        zizmor: sorted(
            countZizmor(runJson('zizmor', ['--offline', '--format', 'json', '.github/'])),
        ),
        actionlint: sorted(countActionlint(runJson('actionlint', ['-format', '{{json .}}']))),
    }
    const seeding = !existsSync(BASELINE)
    if (seeding && !process.argv.includes('--update')) {
        throw new Error(`no baseline at ${BASELINE}; seed it once with --update and commit it`)
    }
    const baseline = seeding ? current : JSON.parse(readFileSync(BASELINE, 'utf8'))
    const rising = regressions(current, baseline)
    const lowered = improvements(current, baseline)

    for (const [tool, counts] of Object.entries(current)) {
        const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
        console.log(`[workflow-lint] ${tool}: ${total} finding(s)`)
        for (const [key, n] of Object.entries(counts))
            console.log(`  ${String(n).padStart(4)}  ${key}`)
    }
    if (rising.length) {
        console.error(`\n[FAIL] Workflow findings above the baseline (${path.basename(BASELINE)}):`)
        for (const line of rising) console.error(`  - ${line}`)
        console.error('Fix the new finding; the ratchet only goes down.')
        process.exit(1)
    }
    if (process.argv.includes('--update')) {
        writeFileSync(
            BASELINE,
            `${JSON.stringify(
                {
                    _comment:
                        'Workflow-lint ratchet (zizmor --offline + actionlint). Ceilings per class may only drop: lower them with `node scripts/security/check-workflow-lint-ratchet.mjs --update`. See docs/DEVOPS-GATES.md.',
                    ...current,
                },
                null,
                4,
            )}\n`,
        )
        console.log(`[OK] Baseline written (${lowered.length} class(es) lowered).`)
        return
    }
    if (lowered.length) {
        console.log('\n[INFO] Below the baseline -- lower it in this PR with --update:')
        for (const line of lowered) console.log(`  - ${line}`)
    }
    console.log('[OK] No workflow-lint class rose above its baseline.')
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    try {
        main()
    } catch (error) {
        console.error(`[FAIL] ${error.message}`)
        process.exit(1)
    }
}

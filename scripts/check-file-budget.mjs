#!/usr/bin/env node
/**
 * Enforces the 200–700 LOC architecture budget for app source.
 *
 * - Grandfathered files over budget: WARN only (tracked burn-down list).
 * - New/changed files over budget: FAIL (unless FILE_BUDGET_ADVISORY=1).
 * - Test files (*.test.ts, *.spec.ts) are excluded from the scan.
 *
 * Usage: node scripts/check-file-budget.mjs [baseRef]
 *   baseRef defaults to origin/main for CI, or checks all tracked files locally.
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_LINES = Number(process.env.FILE_BUDGET_MAX_LINES || '700')
const ADVISORY = process.env.FILE_BUDGET_ADVISORY === '1'
const SAFE_REF_RE = /^[a-zA-Z0-9._/\-]+$/

const baseRef = process.argv[2] || process.env.FILE_BUDGET_BASE || 'origin/main'

function assertSafeGitRef(ref) {
    if (!SAFE_REF_RE.test(ref)) {
        throw new Error(`[file-budget] Invalid git ref: ${ref}`)
    }
}

/** Known god-files — Phase 1 burn-down (warn only until split). Empty when all splits complete. */
const GRANDFATHERED = new Set([])

export const SCAN_GLOBS = [
    'apps/web/services',
    'apps/web/stores',
    'apps/web/components',
    'apps/web/hooks',
    'apps/web/workers',
    'apps/web/utils',
    'apps/web/bootstrap',
    'apps/web/lib',
    'apps/web/useCases',
    'apps/web/constants',
    'apps/web/types',
    'packages/ai-core/src',
    'packages/ui/src',
]
/** Directories whose own top-level source files are app source too (apps/web/i18n.ts). */
export const SCAN_ROOT_FILES_OF = ['apps/web']
const SOURCE = /\.(ts|tsx|mjs)$/
const TEST = /\.(test|spec)\.(ts|tsx|mjs)$/

function lineCount(filePath) {
    const content = readFileSync(filePath, 'utf8')
    return content.split('\n').length
}

/** Every path in the diff, unfiltered -- the answer to "did this branch change anything?". */
function gitDiffRaw(ref) {
    try {
        assertSafeGitRef(ref)
        const result = spawnSync('git', ['diff', '--name-only', `${ref}...HEAD`], {
            encoding: 'utf8',
        })
        if (result.status !== 0) {
            return []
        }
        return (result.stdout ?? '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
    } catch {
        return []
    }
}

/** The subset of the diff the budget can even apply to: source files, no tests. */
function gitDiffFiles(ref) {
    return gitDiffRaw(ref)
        .filter((f) => SOURCE.test(f) && existsSync(f))
        .filter((f) => !TEST.test(f))
}

/**
 * Every tracked source file in scope. The previous quoted git pathspec with a
 * `{ts,tsx,mjs}` brace list matched nothing: git pathspecs have no brace expansion and the
 * quotes kept the shell from doing it, so a full scan checked zero files. The type filter
 * now runs here instead.
 */
export function allTrackedInScanDirs(cwd = process.cwd()) {
    const result = spawnSync(
        'git',
        ['ls-files', '-z', '--', ...SCAN_GLOBS, ...SCAN_ROOT_FILES_OF],
        { cwd, encoding: 'utf8' },
    )
    if (result.status !== 0) throw new Error('[file-budget] git ls-files failed')
    return result.stdout
        .split('\0')
        .filter((file) => SOURCE.test(file) && !TEST.test(file) && inScanDirs(file))
        .sort()
}

/**
 * The budget targets god-files in application source, which is what SCAN_GLOBS
 * lists. The changed-file path has to honour the same scope as the full scan --
 * otherwise touching any long file outside it (a locale dictionary is ~1000
 * lines by nature, and no amount of splitting changes that) fails the gate for
 * a file the budget was never meant to police.
 */
export const inScanDirs = (file) =>
    SCAN_GLOBS.some((dir) => file === dir || file.startsWith(`${dir}/`)) ||
    SCAN_ROOT_FILES_OF.some(
        (dir) => file.startsWith(`${dir}/`) && !file.slice(dir.length + 1).includes('/'),
    )

function main() {
    // "Did this branch change anything at all?" has to be answered from the raw
    // diff. Asking gitDiffFiles() would answer "no" for a branch that only touched
    // package.json, a workflow, docs or tests -- and that empty result would then
    // escalate to a full scan, which is the opposite of out-of-scope.
    const touchedAnything = gitDiffRaw(baseRef).length > 0
    const changed = gitDiffFiles(baseRef).filter(inScanDirs)
    const scope = touchedAnything ? changed : allTrackedInScanDirs()

    let failures = 0
    let warnings = 0

    console.log('\nFILE BUDGET CHECK')
    console.log('=================')
    console.log(`Max lines: ${MAX_LINES} | Advisory: ${ADVISORY} | Scope: ${scope.length} file(s)`)
    console.log('')

    for (const file of scope) {
        if (!existsSync(file)) continue
        const lines = lineCount(file)
        if (lines <= MAX_LINES) continue

        const rel = file.replace(/\\/g, '/')
        const msg = `${rel}: ${lines} lines (budget ${MAX_LINES})`

        if (GRANDFATHERED.has(rel)) {
            console.log(`[WARN] grandfathered — ${msg}`)
            warnings++
            continue
        }

        const isChanged = changed.includes(file)
        if (isChanged) {
            console.log(`[FAIL] changed file over budget — ${msg}`)
            failures++
        } else {
            console.log(`[WARN] over budget — ${msg}`)
            warnings++
        }
    }

    console.log('')
    console.log(
        `Grandfathered: ${GRANDFATHERED.size} | Warnings: ${warnings} | Failures: ${failures}`,
    )

    if (failures > 0 && !ADVISORY) {
        console.error('[FAIL] File budget exceeded on changed files')
        process.exit(1)
    }

    console.log('[OK] File budget gate passed')
    process.exit(0)
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) main()

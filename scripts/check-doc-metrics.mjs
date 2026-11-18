#!/usr/bin/env node
// ---------------------------------------------------------------------------
// check-doc-metrics.mjs -- Documentation-Truth Gate
//
// Fails CI when a README badge/metric contradicts the value read from source,
// so the doc-truth work (WS-TRUTH) cannot silently decay every release.
//
// Checks (all deterministic, read from the working tree):
//   1. README release badge     == package.json version
//   2. README TypeScript badge   == root devDep `typescript` major
//   3. README Vite badge         == apps/web devDep `vite` major
//   4. README coverage badge     == apps/web/vite.config.ts `lines` threshold
//   5. README CI-workflow count  == number of .github/workflows/*.yml files: the inline
//      "NN CI workflows", the "CI/CD Workflows (NN)" heading and its table sum (required),
//      plus a "CI workflows-NN" badge if one is present
//
// The README is English-only since the 2026-11-18 rework (#740); the German spots this gate
// used to require (DE badges, the "| **CI/CD** | NN Workflows" row) no longer exist.
//
// NOT checked here: the test-count badge -- it cannot be derived from the tree
// without running the suite. It is synced by `docs:sync-metrics` (from a CI-run
// count) and is out of scope for this deterministic gate.
//
// Usage: node scripts/check-doc-metrics.mjs
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const README = join(ROOT, 'README.md')

const failures = []
const fail = (msg) => failures.push(msg)

const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'))
const majorOf = (range) => {
    const m = /(\d+)/.exec(String(range ?? ''))
    return m ? m[1] : null
}

// Normalized to LF: a Windows checkout (core.autocrlf) must not read as drift (CodeRabbit, #880).
const readme = readFileSync(README, 'utf8').replace(/\r\n?/g, '\n')

// --- sources -------------------------------------------------------------
const rootPkg = readJson('package.json')
const webPkg = readJson('apps/web/package.json')
const tsMajor = majorOf(rootPkg.devDependencies?.typescript)
const viteMajor = majorOf(webPkg.devDependencies?.vite)

const viteConfig = readFileSync(join(ROOT, 'apps/web/vite.config.ts'), 'utf8')
const linesMatch = /thresholds:\s*\{[\s\S]*?lines:\s*(\d+)/.exec(viteConfig)
const coverageLines = linesMatch ? linesMatch[1] : null

const workflowCount = readdirSync(join(ROOT, '.github/workflows')).filter((f) =>
    /\.ya?ml$/.test(f),
).length

// --- assertions ----------------------------------------------------------
// 1. Release badge
const relBadge = /release-v([0-9]+\.[0-9]+\.[0-9]+)-/.exec(readme)?.[1]
if (relBadge !== rootPkg.version) {
    fail(`release badge: README "v${relBadge}" != package.json "${rootPkg.version}"`)
}

// A missing/renamed badge is exactly the drift this gate exists to catch, so each check
// asserts the badge is PRESENT (>=1 match) before comparing values -- a matchAll that
// yields nothing must fail, not silently pass.
const assertPresent = (matches, label) => {
    if (matches.length === 0)
        fail(`${label} not found in README (deleted, renamed, or format drifted)`)
    return matches
}

// 2. TypeScript badge
for (const m of assertPresent([...readme.matchAll(/TypeScript-(\d+)\.x-/g)], 'TypeScript badge')) {
    if (m[1] !== tsMajor) {
        fail(
            `TypeScript badge: README "${m[1]}.x" != devDep major "${tsMajor}" (typescript ${rootPkg.devDependencies?.typescript})`,
        )
    }
}

// 3. Vite badge
for (const m of assertPresent([...readme.matchAll(/Vite-(\d+)-/g)], 'Vite badge')) {
    if (m[1] !== viteMajor) {
        fail(
            `Vite badge: README "${m[1]}" != apps/web vite major "${viteMajor}" (${webPkg.devDependencies?.vite})`,
        )
    }
}

// 4. Coverage badge ("coverage-NN%25%20lines")
for (const m of assertPresent(
    [...readme.matchAll(/[Cc]overage-(\d+)%25%20lines/g)],
    'coverage badge',
)) {
    if (m[1] !== coverageLines) {
        fail(
            `coverage badge: README "${m[1]}%" != vite.config.ts lines threshold "${coverageLines}%"`,
        )
    }
}

// 5. CI-workflow count: the inline "NN CI workflows", the "CI/CD Workflows (NN)" heading and
//    its table are required; a "CI workflows-NN" badge is optional but must agree if present.
const wf = String(workflowCount)
for (const m of readme.matchAll(/CI%20[Ww]orkflows-(\d+)-/g)) {
    if (m[1] !== wf) fail(`CI-workflow badge: README "${m[1]}" != actual .yml count "${wf}"`)
}
for (const m of assertPresent(
    [...readme.matchAll(/(\d+)\s+CI[- ][Ww]orkflows/g)],
    'CI-workflow inline count',
)) {
    if (m[1] !== wf) fail(`CI-workflow inline: README "${m[1]}" != actual .yml count "${wf}"`)
}
// The section heading "CI/CD Workflows (NN)" drifted past the checks above when a workflow
// was removed (PR #880).
for (const m of assertPresent(
    [...readme.matchAll(/CI\/CD Workflows \((\d+)\)/g)],
    'CI/CD workflows heading',
)) {
    if (m[1] !== wf) fail(`CI/CD workflows heading: README "${m[1]}" != actual .yml count "${wf}"`)
}
// The workflow table under that heading: its named rows plus "+ NN more" must add up too
// (it said 13 + 15 = 28 under a heading of 30 before PR #880).
const workflowSection = readme.match(/### CI\/CD Workflows \(\d+\)\n([\s\S]*?)\n#/)?.[1] ?? ''
const tableRows = workflowSection.split('\n').filter((line) => line.startsWith('| '))
const moreRow = tableRows.map((line) => /^\|\s*\+\s*(\d+) more\s*\|/.exec(line)).find(Boolean)
if (tableRows.length < 4 || !moreRow) {
    fail('CI/CD workflow table or its "+ NN more" row not found in README (format drifted)')
} else {
    // Header and separator rows, one row per named workflow, then the "+ NN more" row.
    const named = tableRows.length - 3
    const listed = named + Number(moreRow[1])
    if (String(listed) !== wf) {
        fail(
            `CI/CD workflow table: ${named} named + ${moreRow[1]} more = ${listed} != actual .yml count "${wf}"`,
        )
    }
}

// --- report --------------------------------------------------------------
console.log('=== DOC-METRIC TRUTH CHECK ===')
console.log(
    `sources: version=${rootPkg.version} ts=${tsMajor} vite=${viteMajor} coverageLines=${coverageLines} workflows=${wf}`,
)
if (failures.length > 0) {
    console.error(
        `\n[FAIL] ${failures.length} doc-metric drift(s) -- fix README.md to match source:`,
    )
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
}
console.log('[OK] README badges match source.')

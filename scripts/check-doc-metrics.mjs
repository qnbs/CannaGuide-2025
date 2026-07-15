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
//   4. README coverage badges    == apps/web/vite.config.ts `lines` threshold (EN + DE)
//   5. README CI-workflow count  == number of .github/workflows/*.yml files (badges + inline, EN + DE)
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

const readme = readFileSync(README, 'utf8')

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

// 2. TypeScript badge (appears twice: EN + DE)
for (const m of readme.matchAll(/TypeScript-(\d+)\.x-/g)) {
    if (m[1] !== tsMajor) {
        fail(`TypeScript badge: README "${m[1]}.x" != devDep major "${tsMajor}" (typescript ${rootPkg.devDependencies?.typescript})`)
    }
}

// 3. Vite badge (EN + DE)
for (const m of readme.matchAll(/Vite-(\d+)-/g)) {
    if (m[1] !== viteMajor) {
        fail(`Vite badge: README "${m[1]}" != apps/web vite major "${viteMajor}" (${webPkg.devDependencies?.vite})`)
    }
}

// 4. Coverage badges (EN "coverage-NN%..lines", DE "Coverage-NN%..Zeilen")
for (const m of readme.matchAll(/[Cc]overage-(\d+)%25%20(?:lines|Zeilen)/g)) {
    if (m[1] !== coverageLines) {
        fail(`coverage badge: README "${m[1]}%" != vite.config.ts lines threshold "${coverageLines}%"`)
    }
}

// 5. CI-workflow count (EN + DE badges, and EN/DE inline "NN CI workflows"/"NN CI-Workflows")
const wf = String(workflowCount)
for (const m of readme.matchAll(/CI%20[Ww]orkflows-(\d+)-/g)) {
    if (m[1] !== wf) fail(`CI-workflow badge: README "${m[1]}" != actual .yml count "${wf}"`)
}
for (const m of readme.matchAll(/(\d+)\s+CI[- ][Ww]orkflows/g)) {
    if (m[1] !== wf) fail(`CI-workflow inline: README "${m[1]}" != actual .yml count "${wf}"`)
}

// --- report --------------------------------------------------------------
console.log('=== DOC-METRIC TRUTH CHECK ===')
console.log(
    `sources: version=${rootPkg.version} ts=${tsMajor} vite=${viteMajor} coverageLines=${coverageLines} workflows=${wf}`,
)
if (failures.length > 0) {
    console.error(`\n[FAIL] ${failures.length} doc-metric drift(s) -- fix README.md to match source:`)
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
}
console.log('[OK] README badges match source.')

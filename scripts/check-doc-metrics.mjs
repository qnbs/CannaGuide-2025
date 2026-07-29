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
//   6. CHANGELOG release headings -- "## [x.y.z] - YYYY-MM-DD" shape, real calendar
//      dates, newest-first ordering, and newest release == package.json version
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

// A missing/renamed badge is exactly the drift this gate exists to catch, so each check
// asserts the badge is PRESENT (>=1 match) before comparing values -- a matchAll that
// yields nothing must fail, not silently pass.
const assertPresent = (matches, label) => {
    if (matches.length === 0)
        fail(`${label} not found in README (deleted, renamed, or format drifted)`)
    return matches
}

// 2. TypeScript badge (appears twice: EN + DE)
for (const m of assertPresent([...readme.matchAll(/TypeScript-(\d+)\.x-/g)], 'TypeScript badge')) {
    if (m[1] !== tsMajor) {
        fail(
            `TypeScript badge: README "${m[1]}.x" != devDep major "${tsMajor}" (typescript ${rootPkg.devDependencies?.typescript})`,
        )
    }
}

// 3. Vite badge (EN + DE)
for (const m of assertPresent([...readme.matchAll(/Vite-(\d+)-/g)], 'Vite badge')) {
    if (m[1] !== viteMajor) {
        fail(
            `Vite badge: README "${m[1]}" != apps/web vite major "${viteMajor}" (${webPkg.devDependencies?.vite})`,
        )
    }
}

// 4. Coverage badges (EN "coverage-NN%..lines", DE "Coverage-NN%..Zeilen")
for (const m of assertPresent(
    [...readme.matchAll(/[Cc]overage-(\d+)%25%20(?:lines|Zeilen)/g)],
    'coverage badge',
)) {
    if (m[1] !== coverageLines) {
        fail(
            `coverage badge: README "${m[1]}%" != vite.config.ts lines threshold "${coverageLines}%"`,
        )
    }
}

// 5. CI-workflow count (EN + DE badges, and EN/DE inline "NN CI workflows"/"NN CI-Workflows")
const wf = String(workflowCount)
for (const m of assertPresent(
    [...readme.matchAll(/CI%20[Ww]orkflows-(\d+)-/g)],
    'CI-workflow badge',
)) {
    if (m[1] !== wf) fail(`CI-workflow badge: README "${m[1]}" != actual .yml count "${wf}"`)
}
for (const m of assertPresent(
    [...readme.matchAll(/(\d+)\s+CI[- ][Ww]orkflows/g)],
    'CI-workflow inline count',
)) {
    if (m[1] !== wf) fail(`CI-workflow inline: README "${m[1]}" != actual .yml count "${wf}"`)
}

// 6. CHANGELOG release headings -- format, real dates, order, version coupling.
// Keep a Changelog fixes the heading shape as "## [x.y.z] - YYYY-MM-DD". Three
// drifts had accumulated unnoticed (a 2025 year on a 2026 release, and two
// headings using "--" instead of "-"), because nothing read this file.
const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8')
const HEADING = /^## \[([^\]]+)\](.*)$/gm
// Semver, optionally with a prerelease suffix (the alpha-era used "1.4.0-alpha").
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
// The alpha-era tail was generated by release-please and carries its own shape:
// "## [x.y.z](compare-url) (YYYY-MM-DD)". That block is frozen history -- accept
// the shape, and stop the ordering scan there (see below).
const LEGACY_HEADING = /^\((https?:\/\/\S+)\) \(\d{4}-\d{2}-\d{2}\)$/
const releases = []
let inLegacyTail = false
for (const m of assertPresent([...changelog.matchAll(HEADING)], 'CHANGELOG release heading')) {
    const [, version, rest] = m
    if (version === 'Unreleased') {
        if (rest.trim() !== '')
            fail(`CHANGELOG "[Unreleased]" must carry no date (found "${rest.trim()}")`)
        continue
    }
    if (!SEMVER.test(version)) {
        fail(`CHANGELOG heading "[${version}]" is not a semver version`)
        continue
    }
    if (LEGACY_HEADING.test(rest.trim())) {
        inLegacyTail = true
        continue
    }
    if (inLegacyTail) continue
    // Exactly one space-hyphen-space separator, then an ISO date -- "--" fails here.
    const dm = /^ - (\d{4})-(\d{2})-(\d{2})$/.exec(rest)
    if (!dm) {
        fail(
            `CHANGELOG "[${version}]" heading must read "## [${version}] - YYYY-MM-DD" (found "## [${version}]${rest}")`,
        )
        continue
    }
    const [, y, mo, d] = dm
    const iso = `${y}-${mo}-${d}`
    // Round-trip through Date to reject impossible dates (e.g. 2026-02-30).
    const parsed = new Date(`${iso}T00:00:00Z`)
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) {
        fail(`CHANGELOG "[${version}]" has an invalid calendar date "${iso}"`)
        continue
    }
    releases.push({ version, iso })
}

// Newest-first ordering across the modern block: a heading dated before the
// release below it is the year-typo signature (1.8.0 sat at "2025-04-12", older
// than the 1.7.x entries beneath it). Entries at/below the release-please tail
// are skipped above -- that block predates the tagging discipline and one of its
// dates is known-bad but unverifiable, so freezing it beats guessing.
for (let i = 0; i < releases.length - 1; i++) {
    const cur = releases[i]
    const next = releases[i + 1]
    if (cur.iso < next.iso) {
        fail(
            `CHANGELOG out of order: [${cur.version}] ${cur.iso} is dated before [${next.version}] ${next.iso} below it`,
        )
    }
}

// The newest released section must be the version we ship.
if (releases.length > 0 && releases[0].version !== rootPkg.version) {
    fail(
        `CHANGELOG newest release "[${releases[0].version}]" != package.json version "${rootPkg.version}"`,
    )
}

// --- report --------------------------------------------------------------
console.log('=== DOC-METRIC TRUTH CHECK ===')
console.log(
    `sources: version=${rootPkg.version} ts=${tsMajor} vite=${viteMajor} coverageLines=${coverageLines} workflows=${wf} changelogReleases=${releases.length}`,
)
if (failures.length > 0) {
    console.error(
        `\n[FAIL] ${failures.length} doc-metric drift(s) -- fix README.md to match source:`,
    )
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
}
console.log('[OK] README badges match source.')

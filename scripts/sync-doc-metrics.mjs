#!/usr/bin/env node
/**
 * Sync Vitest test counts across README, ARCHITECTURE, CI-AUDIT, copilot-instructions.
 *
 * Usage:
 *   node scripts/sync-doc-metrics.mjs           # run vitest json reporter (~3 min)
 *   node scripts/sync-doc-metrics.mjs --dry-run
 *   node scripts/sync-doc-metrics.mjs --tests 2794 --files 263
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const WEB = join(ROOT, 'apps/web')
const dryRun = process.argv.includes('--dry-run')

function parseArgs() {
    const testsIdx = process.argv.indexOf('--tests')
    const filesIdx = process.argv.indexOf('--files')
    if (testsIdx !== -1 && filesIdx !== -1) {
        return {
            tests: Number(process.argv[testsIdx + 1]),
            files: Number(process.argv[filesIdx + 1]),
        }
    }
    return null
}

function countTestFiles() {
    const out = execSync(
        `find apps/web \\( -name '*.test.ts' -o -name '*.test.tsx' \\) | wc -l`,
        { cwd: ROOT, encoding: 'utf8' },
    )
    return Number(out.trim())
}

function runVitestCount() {
    const json = execSync('pnpm exec vitest run --reporter=json', {
        cwd: WEB,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, CI: '1' },
    })
    const parsed = JSON.parse(json)
    return {
        tests: parsed.numTotalTests ?? 0,
        files: countTestFiles(),
    }
}

function replaceInFile(relPath, replacements) {
    const abs = join(ROOT, relPath)
    let content = readFileSync(abs, 'utf8')
    let changed = false
    for (const [pattern, replacement] of replacements) {
        const next = content.replace(pattern, replacement)
        if (next !== content) {
            changed = true
            content = next
        }
    }
    if (changed) {
        if (dryRun) {
            console.log(`[dry-run] would update ${relPath}`)
        } else {
            writeFileSync(abs, content)
            console.log(`updated ${relPath}`)
        }
    } else {
        console.log(`no changes ${relPath}`)
    }
}

const args = parseArgs()
const { tests, files } = args ?? runVitestCount()

console.log(`metrics: ${tests} tests, ${files} test files`)

const testBadge = `tests-${tests}%20passed`
const testBadgeDe = `Tests-${tests}%20bestanden`

const targets = [
    'README.md',
    'docs/ARCHITECTURE.md',
    '.github/CI-AUDIT.md',
    '.github/copilot-instructions.md',
]

for (const rel of targets) {
    replaceInFile(rel, [
        [/tests-\d+%20passed/g, testBadge],
        [/Tests-\d+%20bestanden/g, testBadgeDe],
        [/Vitest \d+ unit tests \(\d+ files\)/g, `Vitest ${tests} unit tests (${files} files)`],
        [/Vitest \(\d+ tests\)/g, `Vitest (${tests} tests)`],
        [/\d+ tests · 130 services/g, `${tests} tests · 130 services`],
        [/\d+ Sorten · \d+ Tests/g, `776 Sorten · ${tests} Tests`],
        [/# Vitest unit\/integration \(\d+ tests\)/g, `# Vitest unit/integration (${tests} tests)`],
        [/pnpm test\s+# Vitest unit\/integration \(\d+ tests\)/g, `pnpm test                 # Vitest unit/integration (${tests} tests)`],
        [/\| \*\*Unit\/Integration\*\*\s+\| Vitest\s+\| \d+ tests/g, `| **Unit/Integration**  | Vitest          | ${tests} tests`],
        [/\| \*\*Testing\*\*\s+\| Vitest \+ Playwright\s+\| \d+ unit/g, `| **Testing**     | Vitest + Playwright                  | ${tests} unit`],
        [/\| \*\*Testing\*\*\s+\| Vitest \+ Playwright\s+\| \d+ Unit/g, `| **Testing**    | Vitest + Playwright                  | ${tests} Unit`],
        [/pnpm run test:run\s+# \d+ tests \(\d+ files\)/g, `pnpm run test:run           # ${tests} tests (${files} files)`],
        [/pnpm run test:run\s+# \d+ Tests \(\d+ Dateien\)/g, `pnpm run test:run           # ${tests} Tests (${files} Dateien)`],
        [/Lint, typecheck, \d+ tests, build/g, `Lint, typecheck, ${tests} tests, build`],
        [/\| \*\*Tests\*\*\s+\| \d+ \(Vitest/g, `| **Tests**        | ${tests} (Vitest`],
        [/### Testing \(\d+ tests/g, `### Testing (${tests} tests`],
        [/Baseline: \d+ tests/g, `Baseline: ${tests} tests`],
        [/Full Vitest \(\d+ tests\)/g, `Full Vitest (${tests} tests)`],
        [/\^19\.2\.\d+`[^\n]*/g, '^19.2.7` — ' + tests + ' Vitest tests'],
    ])
}

console.log(dryRun ? 'dry-run complete' : 'sync complete')

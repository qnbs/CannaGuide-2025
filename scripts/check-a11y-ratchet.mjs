#!/usr/bin/env node
// ---------------------------------------------------------------------------
// check-a11y-ratchet.mjs -- jsx-a11y warning ratchet (warn-count, not flip-to-error)
//
// The repo's eslint.config.js carries the jsx-a11y recommended rules as WARN, spread
// in only when LINT_A11Y=1 so lint-staged's `--max-warnings 0` does not trip. Nothing
// enforces a ceiling, so a11y warnings can silently accumulate. This gate captures a
// committed baseline count and FAILS when the count RISES -- a ratchet that can only go
// down. It never flips rules to `error` (that would be a policy change / stop-and-ask).
//
// It runs its own minimal, AST-only ESLint instance (jsx-a11y rules are syntactic and
// need no type information), so it is fast and low-memory -- cheap enough to run on every
// PR in CI and to regenerate the baseline in CI rather than on a dev box.
//
//   node scripts/check-a11y-ratchet.mjs            # check against .a11y-baseline.json
//   node scripts/check-a11y-ratchet.mjs --update   # rewrite the baseline to current
//   node scripts/check-a11y-ratchet.mjs --json      # machine-readable summary on stdout
//
// Exit 1 when the current warning count exceeds the baseline (or the baseline is missing
// without --update). Lowering warnings lets the same PR run --update to drop the baseline.
// ---------------------------------------------------------------------------

import { ESLint } from 'eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tsParser from '@typescript-eslint/parser'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE = join(ROOT, '.a11y-baseline.json')

const UPDATE = process.argv.includes('--update')
const AS_JSON = process.argv.includes('--json')

// The UI surfaces that actually render to users. Tests/stories are excluded: a11y
// warnings there are not shipped and would only add noise to the ratchet.
const TARGETS = ['apps/web/**/*.{tsx,jsx}', 'packages/ui/**/*.{tsx,jsx}']
const IGNORES = [
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/*.test.{tsx,jsx}',
    '**/*.spec.{tsx,jsx}',
    '**/*.stories.{tsx,jsx}',
]

// Mirror eslint.config.js: every jsx-a11y recommended rule as `warn`, with the
// deprecated `label-has-for` turned off.
const a11yRules = Object.fromEntries(
    Object.keys(jsxA11y.configs.recommended.rules).map((k) => [k, 'warn']),
)
a11yRules['jsx-a11y/label-has-for'] = 'off'

const eslint = new ESLint({
    cwd: ROOT,
    errorOnUnmatchedPattern: false,
    overrideConfigFile: true, // ignore the heavy repo flat config -- AST-only here
    baseConfig: [
        { ignores: IGNORES },
        {
            files: ['**/*.{tsx,jsx}'],
            languageOptions: {
                parser: tsParser,
                ecmaVersion: 'latest',
                sourceType: 'module',
                parserOptions: { ecmaFeatures: { jsx: true } },
            },
            plugins: { 'jsx-a11y': jsxA11y },
            rules: a11yRules,
        },
    ],
})

const results = await eslint.lintFiles(TARGETS)

let total = 0
const byRule = {}
for (const file of results) {
    for (const msg of file.messages) {
        if (!msg.ruleId?.startsWith('jsx-a11y/')) continue
        total += 1
        byRule[msg.ruleId] = (byRule[msg.ruleId] ?? 0) + 1
    }
}
const sortedByRule = Object.fromEntries(Object.entries(byRule).sort((a, b) => b[1] - a[1]))

function writeBaseline() {
    const payload = {
        _comment:
            'jsx-a11y warning ratchet. Regenerate in CI (or via `node scripts/check-a11y-ratchet.mjs --update`). See docs/DEVOPS-GATES.md.',
        maxWarnings: total,
        byRule: sortedByRule,
    }
    writeFileSync(BASELINE, `${JSON.stringify(payload, null, 2)}\n`)
}

if (AS_JSON) {
    console.log(JSON.stringify({ total, byRule: sortedByRule }, null, 2))
}

if (UPDATE) {
    writeBaseline()
    console.log(`[a11y-ratchet] baseline written: ${total} jsx-a11y warning(s) -> ${BASELINE}`)
    process.exit(0)
}

if (!existsSync(BASELINE)) {
    console.error(
        `[a11y-ratchet] no baseline at ${BASELINE}. Current count is ${total}.\n` +
            'Seed it in CI (or run `node scripts/check-a11y-ratchet.mjs --update`) and commit the file.',
    )
    process.exit(1)
}

let baseline
try {
    baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
} catch (err) {
    console.error(`[a11y-ratchet] ${BASELINE} is unreadable: ${err.message}`)
    process.exit(1)
}
const max = baseline.maxWarnings
if (typeof max !== 'number') {
    console.error(`[a11y-ratchet] ${BASELINE} has no numeric "maxWarnings"; re-seed with --update.`)
    process.exit(1)
}

console.log(`[a11y-ratchet] jsx-a11y warnings: ${total} (baseline ${max})`)
for (const [rule, n] of Object.entries(sortedByRule)) console.log(`  ${n.toString().padStart(4)}  ${rule}`)

if (total > max) {
    console.error(
        `\n[FAIL] jsx-a11y warnings rose from ${max} to ${total} (+${total - max}). ` +
            'Fix the new violation(s) above; do not raise the baseline.',
    )
    process.exit(1)
}
if (total < max) {
    console.log(
        `\n[OK] warnings dropped by ${max - total}. Run \`node scripts/check-a11y-ratchet.mjs --update\` ` +
            'in this PR to lower the baseline (ratchet only goes down).',
    )
} else {
    console.log('\n[OK] jsx-a11y warnings held at baseline.')
}
process.exit(0)

#!/usr/bin/env node
/**
 * Local CI audit — mirrors lightweight gates from .github/CI-AUDIT.md
 * Usage: pnpm run ci:audit
 * Exit 1 on first failure unless CI_AUDIT_CONTINUE=1
 */
import { execSync } from 'node:child_process'

const continueOnFail = process.env.CI_AUDIT_CONTINUE === '1'

function hasCommand(cmd) {
    try {
        execSync(`command -v ${cmd}`, { stdio: 'ignore' })
        return true
    } catch {
        return false
    }
}

/** @type {{ name: string; cmd: string; optional?: boolean }[]} */
const steps = [
    { name: 'typecheck', cmd: 'pnpm run typecheck' },
    { name: 'lint:scopes', cmd: 'pnpm run lint:scopes' },
    { name: 'mdc:e2e', cmd: 'pnpm run mdc:e2e' },
    ...(hasCommand('uv')
        ? [{ name: 'graphify:mcp:doctor', cmd: 'pnpm run graphify:mcp:doctor' }]
        : [
              {
                  name: 'graphify:mcp:doctor',
                  cmd: 'echo "[skip] uv not on PATH — install uv or run in CI"',
                  optional: true,
              },
          ]),
    { name: 'audit-backlog', cmd: 'node scripts/check-audit-backlog.mjs' },
    { name: 'csp-consistency', cmd: 'node scripts/security/check-csp-consistency.mjs' },
    { name: 'e2e-selectors', cmd: 'node scripts/check-e2e-selectors.mjs' },
    { name: 'build', cmd: 'pnpm run build' },
    {
        name: 'bundle-budget',
        cmd: 'node scripts/check-bundle-budget.mjs apps/web/dist/assets',
    },
    {
        name: 'critical-path',
        cmd: 'node scripts/measure-critical-path.mjs apps/web/dist/assets',
        optional: true,
    },
    {
        name: 'file-budget',
        cmd: 'FILE_BUDGET_ADVISORY=1 node scripts/check-file-budget.mjs',
        optional: true,
    },
    { name: 'localstorage-allowlist', cmd: 'node scripts/security/check-localstorage-usage.mjs' },
    { name: 'i18n', cmd: 'pnpm run check:i18n' },
    {
        name: 'service-acyclic',
        cmd: 'node scripts/generate-service-map.mjs',
        optional: true,
    },
]

let failed = 0
const results = []

for (const step of steps) {
    const start = Date.now()
    process.stdout.write(`\n[ci:audit] ${step.name} ... `)
    try {
        execSync(step.cmd, { stdio: 'pipe', encoding: 'utf8' })
        const sec = ((Date.now() - start) / 1000).toFixed(1)
        console.log(`PASS (${sec}s)`)
        results.push({ name: step.name, ok: true, sec })
    } catch (err) {
        const sec = ((Date.now() - start) / 1000).toFixed(1)
        const msg = err instanceof Error ? err.message : String(err)
        if (step.optional) {
            console.log(`WARN (${sec}s)`)
            results.push({ name: step.name, ok: true, sec, warn: true })
            continue
        }
        console.log(`FAIL (${sec}s)`)
        failed++
        if (err.stdout) process.stderr.write(String(err.stdout))
        if (err.stderr) process.stderr.write(String(err.stderr))
        results.push({ name: step.name, ok: false, sec, msg })
        if (!continueOnFail) break
    }
}

console.log('\n--- ci:audit summary ---')
for (const r of results) {
    console.log(`  ${r.ok ? '[OK]' : '[FAIL]'} ${r.name} (${r.sec}s)`)
}
console.log(`\n${failed === 0 ? '[PASS]' : '[FAIL]'} ${results.length} steps, ${failed} failure(s)`)
process.exit(failed > 0 ? 1 : 0)

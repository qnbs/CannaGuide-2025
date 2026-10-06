#!/usr/bin/env node
/**
 * Keeps pnpm auditConfig.ignoreGhsas honest.
 *
 * Every ignored GHSA must have an entry in audit-exceptions.json with a
 * reachability note and an expiry. The check fails when:
 *   - an ignore has no exception record (or the reverse);
 *   - today is after the expiry;
 *   - the patched version named in the record is now published (override it).
 *
 * Network lookup of the patched version runs only with --check-registry
 * (CI dependency-health). The default mode is offline so pre-commit stays cheap.
 *
 * Run: node scripts/security/check-audit-exceptions.mjs [--check-registry]
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const WORKSPACE = resolve('pnpm-workspace.yaml')
const EXCEPTIONS = resolve('scripts/security/audit-exceptions.json')
const checkRegistry = process.argv.includes('--check-registry')

function fail(messages) {
    console.error('[FAIL] audit exception check')
    for (const message of messages) console.error(`       - ${message}`)
    process.exit(1)
}

function parseIgnoreGhsas(yaml) {
    const ids = []
    let inAudit = false
    let inIgnore = false
    for (const line of yaml.split('\n')) {
        if (/^auditConfig:\s*$/.test(line)) {
            inAudit = true
            continue
        }
        if (inAudit && line.trim() !== '' && !/^\s/.test(line)) break
        if (!inAudit) continue
        if (/^\s+ignoreGhsas:\s*$/.test(line)) {
            inIgnore = true
            continue
        }
        if (!inIgnore) continue
        const match = line.match(/^\s+-\s+(GHSA-[A-Za-z0-9-]+)/)
        if (match) ids.push(match[1])
        else if (line.trim() !== '' && !line.trim().startsWith('#')) break
    }
    return ids
}

const yaml = readFileSync(WORKSPACE, 'utf8')
const ignored = parseIgnoreGhsas(yaml)
const record = JSON.parse(readFileSync(EXCEPTIONS, 'utf8'))
const exceptions = Array.isArray(record.exceptions) ? record.exceptions : []
const byId = new Map(exceptions.map((entry) => [entry.ghsa, entry]))
const problems = []
const today = new Date().toISOString().slice(0, 10)

for (const id of ignored) {
    const entry = byId.get(id)
    if (!entry) {
        problems.push(
            `${id} is ignored in pnpm-workspace.yaml but has no audit-exceptions.json record`,
        )
        continue
    }
    if (!entry.expiry || !entry.reachability || !entry.reason || !entry.package || !entry.patched) {
        problems.push(
            `${id} exception is missing package, patched, expiry, reachability, or reason`,
        )
        continue
    }
    if (entry.expiry < today) {
        problems.push(
            `${id} exception expired on ${entry.expiry} -- override ${entry.package} or renew with a new analysis`,
        )
    }
}

for (const entry of exceptions) {
    if (!ignored.includes(entry.ghsa)) {
        problems.push(`${entry.ghsa} is recorded but not ignored -- delete the stale exception`)
    }
}

if (checkRegistry) {
    for (const entry of exceptions) {
        if (problems.some((p) => p.startsWith(entry.ghsa))) continue
        let published = ''
        try {
            published = execFileSync(
                'npm',
                ['view', `${entry.package}@${entry.patched}`, 'version'],
                {
                    encoding: 'utf8',
                    stdio: ['ignore', 'pipe', 'pipe'],
                },
            ).trim()
        } catch {
            published = ''
        }
        if (published === entry.patched) {
            problems.push(
                `${entry.ghsa}: ${entry.package}@${entry.patched} is published. Remove the ignore and add a bounded override.`,
            )
        }
    }
}

if (problems.length > 0) fail(problems)
console.log(`[OK] ${ignored.length} audit exception(s) documented and unexpired (${today}).`)

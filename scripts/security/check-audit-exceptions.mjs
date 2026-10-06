#!/usr/bin/env node
/**
 * Keeps pnpm auditConfig.ignoreGhsas honest.
 *
 * Every ignored GHSA must have an entry in audit-exceptions.json with a
 * reachability note and an expiry. The check fails when:
 *   - an ignore has no exception record (or the reverse);
 *   - the expiry is not a real YYYY-MM-DD calendar date;
 *   - today is after the expiry;
 *   - the patched version named in the record is now published (override it).
 *
 * Network lookup of the patched version runs only with --check-registry
 * (CI dependency-health). A registry or network error fails the check.
 * Only a confirmed npm E404 means the patched version is still unpublished.
 * The default mode is offline so pre-commit stays cheap.
 *
 * Run: node scripts/security/check-audit-exceptions.mjs [--check-registry]
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const WORKSPACE = resolve('pnpm-workspace.yaml')
const EXCEPTIONS = resolve('scripts/security/audit-exceptions.json')

export function isIsoCalendarDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const year = Number(value.slice(0, 4))
    const month = Number(value.slice(5, 7))
    const day = Number(value.slice(8, 10))
    const date = new Date(Date.UTC(year, month - 1, day))
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    )
}

/**
 * npm prints `npm error code E404` when the requested version does not exist.
 * Timeouts, DNS failures, and 5xx responses are lookup failures, not proof
 * that the patch is unpublished.
 */
export function registryLookupFailure(error) {
    const stderr = String(error?.stderr ?? '')
    const stdout = String(error?.stdout ?? '')
    const text = `${stderr}\n${stdout}`
    if (/\bE404\b/.test(text)) return { kind: 'unpublished' }
    const detail = (stderr || error?.message || 'registry lookup failed').split('\n')[0].trim()
    return { kind: 'error', detail: detail || 'registry lookup failed' }
}

export function parseIgnoreGhsas(yaml) {
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

export function collectProblems({ ignored, exceptions, today, lookups }) {
    const byId = new Map(exceptions.map((entry) => [entry.ghsa, entry]))
    const problems = []

    for (const id of ignored) {
        const entry = byId.get(id)
        if (!entry) {
            problems.push(
                `${id} is ignored in pnpm-workspace.yaml but has no audit-exceptions.json record`,
            )
            continue
        }
        if (
            !entry.expiry ||
            !entry.reachability ||
            !entry.reason ||
            !entry.package ||
            !entry.patched
        ) {
            problems.push(
                `${id} exception is missing package, patched, expiry, reachability, or reason`,
            )
            continue
        }
        if (!isIsoCalendarDate(entry.expiry)) {
            problems.push(`${id} expiry must be a real YYYY-MM-DD date (found "${entry.expiry}")`)
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

    if (lookups) {
        for (const entry of exceptions) {
            if (problems.some((problem) => problem.startsWith(entry.ghsa))) continue
            const lookup = lookups.get(entry.ghsa)
            if (!lookup) {
                problems.push(`${entry.ghsa}: registry lookup missing`)
                continue
            }
            if (lookup.kind === 'unpublished') continue
            if (lookup.kind === 'error') {
                problems.push(
                    `${entry.ghsa}: registry lookup failed (${lookup.detail}). This is not evidence that ${entry.package}@${entry.patched} is unpublished.`,
                )
                continue
            }
            if (lookup.published === entry.patched) {
                problems.push(
                    `${entry.ghsa}: ${entry.package}@${entry.patched} is published. Remove the ignore and add a bounded override.`,
                )
            }
        }
    }

    return problems
}

function lookupPatched(entry) {
    try {
        const published = execFileSync(
            'npm',
            ['view', `${entry.package}@${entry.patched}`, 'version'],
            {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
            },
        ).trim()
        return { kind: 'published', published }
    } catch (error) {
        return registryLookupFailure(error)
    }
}

function fail(messages) {
    console.error('[FAIL] audit exception check')
    for (const message of messages) console.error(`       - ${message}`)
    process.exit(1)
}

function main() {
    const checkRegistry = process.argv.includes('--check-registry')
    const yaml = readFileSync(WORKSPACE, 'utf8')
    const ignored = parseIgnoreGhsas(yaml)
    const record = JSON.parse(readFileSync(EXCEPTIONS, 'utf8'))
    const exceptions = Array.isArray(record.exceptions) ? record.exceptions : []
    const today = new Date().toISOString().slice(0, 10)
    const lookups = checkRegistry ? new Map() : undefined
    if (lookups) {
        for (const entry of exceptions) {
            if (!entry?.ghsa) continue
            lookups.set(entry.ghsa, lookupPatched(entry))
        }
    }
    const problems = collectProblems({ ignored, exceptions, today, lookups })
    if (problems.length > 0) fail(problems)
    console.log(`[OK] ${ignored.length} audit exception(s) documented and unexpired (${today}).`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()

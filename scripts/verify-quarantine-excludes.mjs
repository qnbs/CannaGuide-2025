#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-quarantine-excludes.mjs -- provenance guard for the quarantine allow-list
//
// pnpm-workspace.yaml `minimumReleaseAgeExclude` lets a few packages skip the 24h
// `minimumReleaseAge` quarantine. That list matches on NAME, not provenance, so a
// future release of an excluded package could skip the quarantine even if it shipped
// WITHOUT a provenance attestation. This job re-verifies (weekly, advisory) that every
// installed exclude still publishes `dist.attestations` on npm.
//
// Fails closed: an unparseable exclude list, unreadable installed metadata, or an npm
// lookup that could not complete are all reported as verification failures -- never as
// a silent "OK". Only a genuinely absent package is skipped, and only a genuinely
// empty `dist.attestations` counts as "no attestation".
//
// Usage: node scripts/verify-quarantine-excludes.mjs
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const NPM_VIEW_TIMEOUT_MS = 60_000

// Parse the `minimumReleaseAgeExclude:` list from pnpm-workspace.yaml (simple
// indented `- entry` block; avoids adding a YAML parser dependency). Fails closed:
// a missing key or a malformed entry throws instead of silently returning fewer
// packages than are actually excluded.
function parseExcludes() {
    const lines = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8').split('\n')
    const start = lines.findIndex((l) => /^\s*minimumReleaseAgeExclude:\s*(#.*)?$/.test(l))
    if (start === -1) {
        throw new Error(
            'minimumReleaseAgeExclude: not found in pnpm-workspace.yaml. If the exclude ' +
                'list was intentionally removed, remove this provenance check as well.',
        )
    }
    const keyIndent = lines[start].search(/\S/)
    const out = []
    for (let i = start + 1; i < lines.length; i++) {
        const line = lines[i]
        if (line.trim() === '' || line.trim().startsWith('#')) continue // blank / comment
        if (line.search(/\S/) <= keyIndent) break // dedent -> end of the block
        // A YAML list item `- name`, quoted (single/double) or bare, with an optional
        // trailing comment. A more-indented line that is NOT a parseable item is
        // malformed -- throw rather than silently drop a real exclude entry.
        const m = /^\s*-\s+(?:'([^']+)'|"([^"]+)"|([^\s#'"]+))\s*(?:#.*)?$/.exec(line)
        if (!m) {
            throw new Error(
                `Malformed minimumReleaseAgeExclude entry at pnpm-workspace.yaml:${i + 1}: "${line.trim()}"`,
            )
        }
        out.push(m[1] ?? m[2] ?? m[3])
    }
    return out
}

// All node_modules trees an exclude could be installed into: the workspace root plus
// every workspace importer (pnpm symlinks direct deps into each package's node_modules,
// so e.g. postcss can live under apps/web/node_modules and never at the root).
function nodeModulesRoots() {
    const roots = [join(ROOT, 'node_modules')]
    for (const base of ['apps', 'packages']) {
        const baseDir = join(ROOT, base)
        if (!existsSync(baseDir)) continue
        for (const name of readdirSync(baseDir)) {
            const nm = join(baseDir, name, 'node_modules')
            if (existsSync(nm)) roots.push(nm)
        }
    }
    return roots
}

// Expand a pattern to concrete installed package names across every node_modules root
// (`@scope/*` -> each installed package under any `node_modules/@scope/`), de-duped.
function resolvePackages(pattern, roots) {
    if (!pattern.endsWith('/*')) return [pattern]
    const scope = pattern.slice(0, -2)
    const found = new Set()
    for (const root of roots) {
        const scopeDir = join(root, scope)
        if (!existsSync(scopeDir)) continue
        for (const n of readdirSync(scopeDir)) {
            if (!n.startsWith('.')) found.add(`${scope}/${n}`)
        }
    }
    return [...found]
}

// Distinct installed versions of `pkg` across all roots. Returns `[]` only when the
// package is genuinely absent everywhere; an existing-but-unreadable `package.json`
// throws (a verification failure, not "not installed").
function installedVersions(pkg, roots) {
    const versions = new Set()
    for (const root of roots) {
        const pj = join(root, pkg, 'package.json')
        if (!existsSync(pj)) continue
        const version = JSON.parse(readFileSync(pj, 'utf8')).version
        if (!version) throw new Error(`${pj} has no "version" field`)
        versions.add(version)
    }
    return [...versions]
}

// Tri-state provenance lookup: 'attested' | 'none' | 'error'. A registry outage,
// auth/rate-limit failure, or hung npm process is an 'error' (distinct from a genuine
// empty `dist.attestations`), keeps stderr for diagnosis, and cannot stall the job.
function attestationStatus(pkg, version) {
    try {
        const out = execFileSync(
            'npm',
            ['view', `${pkg}@${version}`, 'dist.attestations', '--json'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: NPM_VIEW_TIMEOUT_MS },
        ).trim()
        const attested = out !== '' && out !== 'undefined' && out !== 'null'
        return { status: attested ? 'attested' : 'none' }
    } catch (err) {
        const detail = (err.stderr?.toString().trim() || err.message || 'unknown error')
            .split('\n')
            .slice(0, 3)
            .join(' ')
        return { status: 'error', detail }
    }
}

let excludes
try {
    excludes = parseExcludes()
} catch (err) {
    console.error(`[FAIL] could not read the quarantine-exclude list: ${err.message}`)
    process.exit(1)
}

const roots = nodeModulesRoots()
console.log(`quarantine-exclude patterns: ${excludes.join(', ') || '(none)'}`)
console.log(`node_modules roots scanned: ${roots.length}`)

const missing = [] // genuine "no provenance attestation" (advisory security finding)
const lookupErrors = [] // npm view could not complete -- provenance UNKNOWN
const metaErrors = [] // installed package.json present but unreadable
let checked = 0

for (const pattern of excludes) {
    for (const pkg of resolvePackages(pattern, roots)) {
        let versions
        try {
            versions = installedVersions(pkg, roots)
        } catch (err) {
            console.error(`FAIL ${pkg}: unreadable installed metadata -- ${err.message}`)
            metaErrors.push(pkg)
            continue
        }
        if (versions.length === 0) {
            console.log(`skip ${pkg} (not installed)`)
            continue
        }
        for (const version of versions) {
            checked++
            const { status, detail } = attestationStatus(pkg, version)
            if (status === 'attested') {
                console.log(`ok   ${pkg}@${version} has a provenance attestation`)
            } else if (status === 'none') {
                console.warn(`WARN ${pkg}@${version} has NO provenance attestation`)
                missing.push(`${pkg}@${version}`)
            } else {
                console.error(`ERR  ${pkg}@${version} attestation lookup failed: ${detail}`)
                lookupErrors.push(`${pkg}@${version}`)
            }
        }
    }
}

console.log(
    `\nchecked ${checked} package(s); ${missing.length} without an attestation, ` +
        `${lookupErrors.length} lookup error(s), ${metaErrors.length} metadata error(s).`,
)

let failed = false
if (missing.length > 0) {
    console.error(
        `[ADVISORY] ${missing.length} quarantine-excluded package(s) lack a provenance attestation:\n` +
            missing.map((p) => `  - ${p}`).join('\n') +
            '\nThese skip the 24h minimumReleaseAge quarantine -- re-verify they are safe to keep excluded.',
    )
    failed = true
}
if (lookupErrors.length > 0) {
    console.error(
        `[ERROR] ${lookupErrors.length} attestation lookup(s) could not complete -- provenance was NOT verified:\n` +
            lookupErrors.map((p) => `  - ${p}`).join('\n'),
    )
    failed = true
}
if (metaErrors.length > 0) {
    console.error(
        `[ERROR] ${metaErrors.length} package(s) had unreadable installed metadata:\n` +
            metaErrors.map((p) => `  - ${p}`).join('\n'),
    )
    failed = true
}
if (failed) process.exit(1)

console.log('[OK] every installed quarantine-excluded package ships a provenance attestation.')

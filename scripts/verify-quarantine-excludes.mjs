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
// Usage: node scripts/verify-quarantine-excludes.mjs
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// Parse the `minimumReleaseAgeExclude:` list from pnpm-workspace.yaml (simple
// indented `- entry` block; avoids adding a YAML parser dependency).
function parseExcludes() {
    const lines = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8').split('\n')
    const start = lines.findIndex((l) => l.trim().startsWith('minimumReleaseAgeExclude:'))
    if (start === -1) return []
    const out = []
    for (let i = start + 1; i < lines.length; i++) {
        const m = /^\s+-\s+'?([^'\s]+)'?\s*$/.exec(lines[i])
        if (!m) break
        out.push(m[1])
    }
    return out
}

// Expand a pattern to concrete installed package names (`@scope/*` -> each installed
// package under node_modules/@scope/).
function resolvePackages(pattern) {
    if (pattern.endsWith('/*')) {
        const scope = pattern.slice(0, -2)
        const scopeDir = join(ROOT, 'node_modules', scope)
        if (!existsSync(scopeDir)) return []
        return readdirSync(scopeDir)
            .filter((n) => !n.startsWith('.'))
            .map((n) => `${scope}/${n}`)
    }
    return [pattern]
}

function installedVersion(pkg) {
    const pj = join(ROOT, 'node_modules', pkg, 'package.json')
    if (!existsSync(pj)) return null
    try {
        return JSON.parse(readFileSync(pj, 'utf8')).version ?? null
    } catch {
        return null
    }
}

function hasAttestation(pkg, version) {
    try {
        const out = execFileSync(
            'npm',
            ['view', `${pkg}@${version}`, 'dist.attestations', '--json'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
        ).trim()
        return out !== '' && out !== 'undefined' && out !== 'null'
    } catch {
        return false
    }
}

const excludes = parseExcludes()
console.log(`quarantine-exclude patterns: ${excludes.join(', ') || '(none)'}`)

const missing = []
let checked = 0
for (const pattern of excludes) {
    for (const pkg of resolvePackages(pattern)) {
        const version = installedVersion(pkg)
        if (!version) {
            console.log(`skip ${pkg} (not installed)`)
            continue
        }
        checked++
        if (hasAttestation(pkg, version)) {
            console.log(`ok   ${pkg}@${version} has a provenance attestation`)
        } else {
            console.warn(`WARN ${pkg}@${version} has NO provenance attestation`)
            missing.push(`${pkg}@${version}`)
        }
    }
}

console.log(`\nchecked ${checked} package(s); ${missing.length} without an attestation.`)
if (missing.length > 0) {
    console.error(
        `[ADVISORY] ${missing.length} quarantine-excluded package(s) lack a provenance attestation:\n` +
            missing.map((p) => `  - ${p}`).join('\n') +
            '\nThese skip the 24h minimumReleaseAge quarantine -- re-verify they are safe to keep excluded.',
    )
    process.exit(1)
}
console.log('[OK] every installed quarantine-excluded package ships a provenance attestation.')

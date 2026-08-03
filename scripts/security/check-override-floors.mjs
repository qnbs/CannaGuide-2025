#!/usr/bin/env node
/**
 * check-override-floors.mjs
 *
 * Guards the pnpm-overrides / dependabot-ignore pair against silent drift.
 *
 * Background: `pnpm-workspace.yaml` pins vulnerable transitive dependencies via
 * `overrides`, and `.github/dependabot.yml` *ignores* those same packages
 * because "they are pinned here". That pair is load-bearing, and it failed
 * silently once already: the override keys were `js-yaml@3` and `js-yaml@4`,
 * the tree moved on to js-yaml 5.x, the `@3`/`@4` selectors stopped matching
 * anything, dependabot stayed muted -- and GHSA-pm4m-ph32-ghv5 (js-yaml 5.x)
 * went unprotected until it broke CI.
 *
 * Two failure modes are checked, both offline (lockfile + config only):
 *
 *   [FAIL] a package dependabot is told to ignore has no override at all
 *          -> silenced with nothing standing in for the silenced updates.
 *   [FAIL] an override carries a major selector (`name@N`) that matches no
 *          resolved version in the lockfile
 *          -> orphaned pin; the tree moved to another major, unprotected.
 *
 * One advisory signal is reported but does not fail:
 *
 *   [WARN] an override floor with no upper bound (`>=x` without `<y`).
 *          pnpm resolves such a floor to the highest version in the registry,
 *          which crosses majors -- `fast-uri: '>=3.1.2'` resolved to 4.1.0,
 *          a version that was itself vulnerable. Bounding the legacy pins can
 *          downgrade a working resolution, so it is a deliberate follow-up
 *          rather than an immediate hard failure.
 *
 * Run: node scripts/security/check-override-floors.mjs
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const WORKSPACE_PATH = resolve('pnpm-workspace.yaml')
const LOCKFILE_PATH = resolve('pnpm-lock.yaml')
const DEPENDABOT_PATH = resolve('.github/dependabot.yml')

const read = (path, label) => {
    try {
        return readFileSync(path, 'utf-8')
    } catch {
        console.error(`[FAIL] Could not read ${label} at ${path}`)
        process.exit(1)
    }
}

/** Strip surrounding single/double quotes from a YAML scalar. */
const unquote = (value) => value.trim().replace(/^['"]|['"]$/g, '')

/**
 * Split an override key into package name and optional major selector.
 * Handles scoped names: `@babel/core` -> name `@babel/core`, no selector;
 * `js-yaml@5` -> name `js-yaml`, selector `5`.
 */
const parseOverrideKey = (key) => {
    const at = key.lastIndexOf('@')
    if (at <= 0) return { name: key, selector: null }
    return { name: key.slice(0, at), selector: key.slice(at + 1) }
}

/**
 * Parse the `overrides:` block of pnpm-workspace.yaml. The block is a flat map,
 * so a minimal reader beats adding a YAML dependency (which `check:phantom-deps`
 * would flag anyway).
 *
 * Indent width is deliberately NOT hard-coded. pnpm-workspace.yaml is
 * prettier-governed (it is not in .prettierignore, and lint-staged formats
 * `*.{json,yml,yaml,md}`), so the pre-commit hook can reindent the whole file
 * as a side effect of an unrelated edit. A `^ {2}` matcher parses zero entries
 * the moment that happens -- which is caught only by the empty-result guard
 * below, and would otherwise be a gate that passes while checking nothing.
 */
const parseOverrides = (yaml) => {
    const overrides = []
    let inBlock = false

    for (const line of yaml.split('\n')) {
        if (/^overrides:\s*$/.test(line)) {
            inBlock = true
            continue
        }
        if (!inBlock) continue

        // Any non-indented, non-blank line ends the block.
        if (line.trim() !== '' && !/^\s/.test(line)) break
        if (line.trim() === '' || line.trim().startsWith('#')) continue

        const match = line.match(/^\s+(\S.*?):\s*(\S.*)$/)
        if (!match) continue

        const key = unquote(match[1])
        const range = unquote(match[2])
        overrides.push({ key, range, ...parseOverrideKey(key) })
    }

    return overrides
}

/**
 * Collect every resolved `name@version` from the lockfile's `packages:` and
 * `snapshots:` sections. Entries look like `  js-yaml@4.3.0:` (peer suffixes in
 * parentheses are stripped).
 *
 * Section tracking is not optional: the lockfile mirrors the workspace's own
 * `overrides:` block at the same two-space indentation, so an unscoped scan
 * reads `js-yaml@3: '>=3.15.0'` back as a resolved js-yaml 3.x and the orphan
 * check silently passes on exactly the drift it exists to catch.
 *
 * Unlike the workspace reader above, the two-space match here IS load-bearing
 * and correct: pnpm writes this file and it is in .prettierignore, so the
 * indent is stable -- and package entries must be distinguished from the
 * more deeply indented dependency lines nested underneath them.
 */
const RESOLVED_SECTIONS = new Set(['packages', 'snapshots'])

const parseResolved = (lockfile) => {
    const byName = new Map()
    let section = null

    for (const line of lockfile.split('\n')) {
        const sectionMatch = line.match(/^([A-Za-z][\w-]*):\s*$/)
        if (sectionMatch) {
            section = sectionMatch[1]
            continue
        }
        if (!RESOLVED_SECTIONS.has(section)) continue

        const match = line.match(/^ {2}(@?[^@\s'"]+(?:\/[^@\s'"]+)?)@([0-9][^(:\s]*)/)
        if (!match) continue

        const [, name, version] = match
        if (!byName.has(name)) byName.set(name, new Set())
        byName.get(name).add(version)
    }

    return byName
}

/**
 * Collect packages the npm ecosystem block tells dependabot to ignore
 * completely. Entries carrying `update-types:` are partial ignores (e.g.
 * majors only) and still receive minor/patch PRs, so they are not required to
 * have an override.
 */
const parseDependabotIgnores = (yaml) => {
    const lines = yaml.split('\n')
    const ignored = []

    let ecosystem = null
    let inIgnore = false
    let pending = null

    const flush = () => {
        if (pending && !pending.partial && ecosystem === 'npm') ignored.push(pending.name)
        pending = null
    }

    for (const line of lines) {
        const ecoMatch = line.match(/^\s*-?\s*package-ecosystem:\s*(\S+)/)
        if (ecoMatch) {
            flush()
            ecosystem = unquote(ecoMatch[1])
            inIgnore = false
            continue
        }

        if (/^\s*ignore:\s*$/.test(line)) {
            flush()
            inIgnore = true
            continue
        }

        if (!inIgnore) continue

        const nameMatch = line.match(/^\s*-\s*dependency-name:\s*(\S+)/)
        if (nameMatch) {
            flush()
            pending = { name: unquote(nameMatch[1]), partial: false }
            continue
        }

        if (pending && /^\s*update-types:/.test(line)) {
            pending.partial = true
            continue
        }

        // A key at the ignore list's own indentation ends the block.
        if (/^\s{6}\S/.test(line) && !/^\s*-/.test(line) && !/^\s*#/.test(line)) {
            flush()
            inIgnore = false
        }
    }

    flush()
    return ignored
}

const overrides = parseOverrides(read(WORKSPACE_PATH, 'pnpm-workspace.yaml'))
const resolved = parseResolved(read(LOCKFILE_PATH, 'pnpm-lock.yaml'))
const ignored = parseDependabotIgnores(read(DEPENDABOT_PATH, '.github/dependabot.yml'))

const failures = []
const warnings = []

if (overrides.length === 0) {
    console.error('[FAIL] No overrides parsed from pnpm-workspace.yaml -- refusing to pass.')
    process.exit(1)
}

const overriddenNames = new Set(overrides.map((o) => o.name))

// -- Check 1: every fully-ignored npm package must still be pinned ----------
for (const name of ignored) {
    if (!overriddenNames.has(name)) {
        failures.push(
            `${name}: on dependabot's npm ignore list but has no override in pnpm-workspace.yaml. ` +
                `Updates are suppressed and nothing pins it -- add an override or drop the ignore.`,
        )
    }
}

// -- Check 2: no orphaned major selectors ----------------------------------
for (const { key, name, selector } of overrides) {
    if (!selector) continue
    // Only plain major selectors are checked; range selectors are ambiguous.
    if (!/^\d+$/.test(selector)) continue

    const versions = resolved.get(name)
    const matching = versions ? [...versions].filter((v) => v.split('.')[0] === selector) : []

    if (matching.length === 0) {
        const present = versions ? [...versions].sort().join(', ') : 'none'
        failures.push(
            `${key}: orphaned pin -- no ${name}@${selector}.x is resolved in pnpm-lock.yaml ` +
                `(resolved: ${present}). The tree moved to another major and this override ` +
                `protects nothing. Retarget it or remove it.`,
        )
    }
}

// -- Check 3 (advisory): unbounded floors ----------------------------------
for (const { key, range } of overrides) {
    if (!/^\s*>=?/.test(range)) continue
    if (range.includes('<')) continue
    warnings.push(`${key}: '${range}' has no upper bound -- resolves across majors.`)
}

console.log('')
console.log('PNPM OVERRIDE FLOOR CHECK')
console.log('=========================')
console.log(`Overrides parsed:        ${overrides.length}`)
console.log(`Dependabot npm ignores:  ${ignored.length}`)
console.log(`Resolved package names:  ${resolved.size}`)
console.log('')

if (warnings.length > 0) {
    console.log(`[WARN] ${warnings.length} unbounded override floor(s):`)
    for (const w of warnings) console.log(`       - ${w}`)
    console.log('')
}

if (failures.length > 0) {
    console.log(`[FAIL] ${failures.length} override/ignore drift issue(s):`)
    for (const f of failures) console.log(`       - ${f}`)
    console.log('')
    process.exit(1)
}

console.log('[OK] Every ignored package is pinned and every major selector matches the lockfile.')
process.exit(0)

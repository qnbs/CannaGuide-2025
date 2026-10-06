#!/usr/bin/env node
/**
 * Stamp (and verify) dist/version.json OUTSIDE the cached build task.
 *
 * Why this exists
 * ---------------
 * `version.json` used to be written by a Vite plugin inside the turbo `build`
 * task. That task caches `dist/**`, so on a cache hit the plugin never runs and
 * the artifact carries whatever commit the ORIGINAL build had. This is not
 * theoretical: a Vercel preview built for 95848cf shipped {"commit":"3501ef2"}.
 *
 * Turbo's `env` list for `build` / `build:gh` was ["BUILD_BASE_PATH","VITE_*"],
 * so neither GITHUB_SHA nor VERCEL_GIT_COMMIT_SHA affected the hash -- two
 * different commits with identical sources hash the same, by design. The fix is
 * not to add the SHA to the hash (that would defeat caching for every commit,
 * which is the point of caching); it is to keep commit identity OUT of the
 * cached artifact and stamp it afterwards.
 *
 * Usage
 * -----
 *   node scripts/stamp-build-metadata.mjs            # write dist/version.json
 *   node scripts/stamp-build-metadata.mjs --verify   # assert it, do not write
 *
 * Commit source, in precedence order:
 *   BUILD_COMMIT            explicit, wins over everything (CI passes this)
 *   VERCEL_GIT_COMMIT_SHA   Vercel
 *   GITHUB_SHA              GitHub Actions
 *   git rev-parse HEAD      local
 *
 * Always the full 40-character SHA. The old fallback used `rev-parse --short`,
 * so Vercel stamped 7 characters while Pages stamped 40 -- a comparison that
 * only worked because nothing compared them.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { RELEASE_MODEL, buildVersion } from './build-identity.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'apps', 'web', 'dist')
const TARGET = path.join(DIST, 'version.json')

const FULL_SHA = /^[0-9a-f]{40}$/i
const BUILD_META = /<meta name="cannaguide-build" content="([^"]*)">/

export function upsertBuildMeta(html, buildVersion) {
    const tag = `<meta name="cannaguide-build" content="${buildVersion}">`
    if (BUILD_META.test(html)) return html.replace(BUILD_META, tag)
    const head = html.indexOf('</head>')
    if (head < 0) {
        throw new Error('index.html has no </head>, so the running build cannot be stamped')
    }
    return `${html.slice(0, head)}    ${tag}\n${html.slice(head)}`
}

function fail(msg) {
    console.error(`[FAIL] ${msg}`)
    process.exit(1)
}

function resolveCommit() {
    for (const key of ['BUILD_COMMIT', 'VERCEL_GIT_COMMIT_SHA', 'GITHUB_SHA']) {
        const value = process.env[key]?.trim()
        if (value) return { commit: value, source: key }
    }
    try {
        const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
            encoding: 'utf8',
            cwd: ROOT,
        }).trim()
        return { commit, source: 'git rev-parse HEAD' }
    } catch {
        return { commit: '', source: 'none' }
    }
}

function readVersion() {
    const pkg = path.join(ROOT, 'apps', 'web', 'package.json')
    try {
        return JSON.parse(readFileSync(pkg, 'utf8')).version ?? '0.0.0'
    } catch {
        return '0.0.0'
    }
}

function main() {
    const verifyOnly = process.argv.includes('--verify')
    const { commit, source } = resolveCommit()

    if (!commit) {
        fail(
            'No commit SHA available. Set BUILD_COMMIT (or VERCEL_GIT_COMMIT_SHA / GITHUB_SHA).\n' +
                '       Refusing to stamp an unidentifiable build -- an artifact nobody can trace\n' +
                '       back to a commit is exactly what this script exists to prevent.',
        )
    }

    // Fail closed on a short SHA. Accepting one silently is how Vercel ended up
    // stamping 7 characters while every consumer compared against 40.
    if (!FULL_SHA.test(commit)) {
        fail(
            `Commit "${commit}" (from ${source}) is not a full 40-character SHA.\n` +
                '       Short SHAs cannot be compared against the deploy SHA without truncating\n' +
                '       one side, so they are rejected rather than normalised.',
        )
    }

    if (!existsSync(DIST)) {
        fail(`${path.relative(ROOT, DIST)} does not exist -- run the build first.`)
    }

    const version = readVersion()

    if (verifyOnly) {
        if (!existsSync(TARGET)) {
            fail(`${path.relative(ROOT, TARGET)} is missing -- the stamping step did not run.`)
        }
        let stamped
        try {
            stamped = JSON.parse(readFileSync(TARGET, 'utf8'))
        } catch (err) {
            fail(`${path.relative(ROOT, TARGET)} is not valid JSON: ${err.message}`)
        }
        if (stamped.commit !== commit) {
            fail(
                `version.json says commit ${stamped.commit}, expected ${commit} (from ${source}).\n` +
                    '       This is the cached-artifact defect: the dist/ directory belongs to a\n' +
                    '       different commit than the one being built or deployed.',
            )
        }
        if (stamped.version !== version) {
            fail(`version.json says version ${stamped.version}, expected ${version}.`)
        }
        const expectedBuild = buildVersion(version, commit)
        if (stamped.buildVersion !== expectedBuild) {
            fail(
                `version.json says buildVersion ${stamped.buildVersion}, expected ${expectedBuild}.`,
            )
        }
        if (stamped.releaseModel !== RELEASE_MODEL) {
            fail(
                `version.json says releaseModel ${stamped.releaseModel}, expected ${RELEASE_MODEL}.`,
            )
        }
        const indexPath = path.join(DIST, 'index.html')
        if (!existsSync(indexPath)) {
            fail(
                `${path.relative(ROOT, indexPath)} is missing -- the running build meta cannot be checked.`,
            )
        }
        const meta = readFileSync(indexPath, 'utf8').match(BUILD_META)
        if (!meta || meta[1] !== expectedBuild) {
            fail(
                `index.html cannaguide-build is ${meta?.[1] ?? 'missing'}, expected ${expectedBuild}.\n` +
                    '       The document this browser loads must carry the same identity as version.json.',
            )
        }
        console.log(`[OK] version.json matches: ${expectedBuild} (via ${source})`)
        process.exit(0)
    }

    const payload = {
        version,
        commit,
        builtAt: new Date().toISOString(),
        releaseModel: RELEASE_MODEL,
        buildVersion: buildVersion(version, commit),
    }
    writeFileSync(TARGET, `${JSON.stringify(payload, null, 2)}\n`)
    const indexPath = path.join(DIST, 'index.html')
    if (!existsSync(indexPath)) {
        fail(
            `${path.relative(ROOT, indexPath)} is missing -- refusing to stamp version.json alone.`,
        )
    }
    const html = readFileSync(indexPath, 'utf8')
    writeFileSync(indexPath, upsertBuildMeta(html, payload.buildVersion))
    console.log(`[OK] Stamped version.json: ${payload.buildVersion} (via ${source})`)
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) main()

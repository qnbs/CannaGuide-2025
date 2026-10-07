#!/usr/bin/env node
/**
 * Fail-closed preflight for a cloud or devcontainer agent.
 * It does not install packages, browsers, or models.
 *
 * Run: pnpm run agent:doctor
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

export function captureCommand(cmd, args) {
    try {
        const stdout = execFileSync(cmd, args, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim()
        return { ok: true, stdout, detail: '' }
    } catch (error) {
        const detail = error instanceof Error ? error.message.split('\n')[0] : 'command failed'
        return { ok: false, stdout: '', detail }
    }
}

/** Major.minor match, so image 1.62.1 satisfies a range of ^1.62.0. */
export function playwrightMajorMinorMatch(imageVersion, range) {
    const image = /^(\d+)\.(\d+)\.\d+$/.exec(imageVersion)
    const declared = /(\d+)\.(\d+)\.\d+/.exec(range)
    if (!image || !declared) return false
    return image[1] === declared[1] && image[2] === declared[2]
}

/** True when two declared ranges name the same major.minor release line. */
export function playwrightSpecsShareMinor(leftRange, rightRange) {
    const left = /(\d+)\.(\d+)\.\d+/.exec(String(leftRange ?? ''))
    const right = /(\d+)\.(\d+)\.\d+/.exec(String(rightRange ?? ''))
    if (!left || !right) return false
    return left[1] === right[1] && left[2] === right[2]
}

const PLAYWRIGHT_LOCK_SLOTS = [
    ['.', '@playwright/test'],
    ['apps/web', '@playwright/test'],
    ['apps/web', '@playwright/experimental-ct-react'],
]

/**
 * Importer resolutions from a pnpm v9 lockfile. A shared caret such as
 * `^1.62.1` still allows a later 1.x minor, so the installed version is
 * the value before any peer suffix: `1.63.0` or `1.62.1(vite@8)`.
 */
export function resolvedPlaywrightVersions(lockText) {
    const entries = []
    let inImporters = false
    let importer = null
    let inDev = false
    let currentPkg = null
    for (const line of String(lockText).split(/\r?\n/)) {
        if (!inImporters) {
            if (line === 'importers:') inImporters = true
            continue
        }
        if (line.length > 0 && !line.startsWith(' ')) break
        const importerMatch = /^ {2}(\S+):$/.exec(line)
        if (importerMatch) {
            importer = importerMatch[1]
            inDev = false
            currentPkg = null
            continue
        }
        if (line === '    devDependencies:') {
            inDev = true
            currentPkg = null
            continue
        }
        if (/^ {4}\S/.test(line)) {
            inDev = false
            currentPkg = null
            continue
        }
        if (!inDev) continue
        const pkgMatch = /^ {6}'(@playwright\/(?:test|experimental-ct-react))':$/.exec(line)
        if (pkgMatch) {
            currentPkg = pkgMatch[1]
            continue
        }
        if (/^ {6}'/.test(line)) {
            currentPkg = null
            continue
        }
        const versionMatch = currentPkg ? /^ {8}version: (\d+\.\d+\.\d+)/.exec(line) : null
        if (versionMatch) {
            entries.push({ importer, name: currentPkg, version: versionMatch[1] })
            currentPkg = null
        }
    }
    return entries
}

/** Fail closed unless every required Playwright slot resolves to one major.minor. */
export function playwrightLockfileSharesMinor(entries) {
    const described = []
    const lines = []
    for (const [importer, name] of PLAYWRIGHT_LOCK_SLOTS) {
        const hit = entries.find((entry) => entry.importer === importer && entry.name === name)
        const match = hit ? /^(\d+)\.(\d+)\.\d+$/.exec(hit.version) : null
        if (!hit || !match) {
            return { ok: false, detail: `missing lockfile resolution for ${importer} ${name}` }
        }
        lines.push(`${match[1]}.${match[2]}`)
        described.push(`${importer} ${name}@${hit.version}`)
    }
    const ok = lines.every((line) => line === lines[0])
    return { ok, detail: described.join('; ') }
}

/**
 * engines.node is either `>=MAJOR` or `>=MAJOR.MINOR.PATCH <NEXT_MAJOR`.
 * Stripping every non-digit would turn `>=24.15.0 <25` into 2415025.
 */
export function nodeSatisfiesDeclaredEngines(nodeVersion, enginesRange) {
    const parts = String(nodeVersion)
        .replace(/^v/, '')
        .split('.')
        .map((part) => Number(part))
    if (parts.length < 3 || parts.some((part) => !Number.isInteger(part))) return false
    const [major, minor, patch] = parts
    const range = String(enginesRange ?? '').trim()
    const bounded = /^>=(\d+)\.(\d+)\.(\d+) <(\d+)$/.exec(range)
    if (bounded) {
        const floor = [Number(bounded[1]), Number(bounded[2]), Number(bounded[3])]
        const ceiling = Number(bounded[4])
        if (major >= ceiling) return false
        if (major !== floor[0]) return major > floor[0] && major < ceiling
        if (minor !== floor[1]) return minor > floor[1]
        return patch >= floor[2]
    }
    const majorOnly = /^>=(\d+)$/.exec(range)
    if (majorOnly) return major >= Number(majorOnly[1])
    return false
}

function main() {
    const problems = []
    const warnings = []

    function check(label, ok, detail) {
        if (ok) console.log(`[OK] ${label}${detail ? `: ${detail}` : ''}`)
        else problems.push(`${label}${detail ? `: ${detail}` : ''}`)
    }

    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
    const enginesNode = pkg.engines?.node ?? '>=24'
    check(
        'Node engines',
        nodeSatisfiesDeclaredEngines(process.versions.node, enginesNode),
        `${process.version} against ${enginesNode}`,
    )

    const wantedPnpm = (pkg.packageManager ?? '').replace(/^pnpm@/, '')
    const pnpmCommand = captureCommand('pnpm', ['--version'])
    check(
        'pnpm version',
        pnpmCommand.ok && pnpmCommand.stdout === wantedPnpm,
        pnpmCommand.ok
            ? `${pnpmCommand.stdout} (packageManager ${wantedPnpm})`
            : pnpmCommand.detail,
    )

    const gitCommand = captureCommand('git', ['--version'])
    check(
        'git',
        gitCommand.ok && gitCommand.stdout.startsWith('git version'),
        gitCommand.ok ? gitCommand.stdout : gitCommand.detail,
    )
    const signing = captureCommand('git', ['config', '--get', 'commit.gpgsign'])
    check(
        'git commit.gpgsign',
        signing.ok && signing.stdout === 'true',
        signing.ok ? signing.stdout : signing.detail || 'unset',
    )

    const gh = captureCommand('gh', ['--version'])
    check(
        'gh',
        gh.ok && gh.stdout.startsWith('gh version'),
        gh.ok ? gh.stdout.split('\n')[0] : gh.detail || 'missing',
    )

    const freeMb = Math.round(os.freemem() / 1024 / 1024)
    if (freeMb < 512) problems.push(`low memory: ${freeMb} MB free`)
    else console.log(`[OK] memory free ${freeMb} MB`)

    check('MCP config', existsSync('.mcp.json'))
    try {
        JSON.parse(readFileSync('.mcp.json', 'utf8'))
        console.log('[OK] .mcp.json parses')
    } catch (error) {
        problems.push(`.mcp.json is not JSON: ${error.message}`)
    }

    const dockerFile = existsSync('.devcontainer/Dockerfile')
        ? readFileSync('.devcontainer/Dockerfile', 'utf8')
        : ''
    const image = dockerFile.match(/playwright:v([0-9.]+)-/)
    const webPkgPath = 'apps/web/package.json'
    let playwright = ''
    if (!existsSync(webPkgPath)) {
        problems.push('apps/web/package.json is missing')
    } else {
        try {
            const webPkg = JSON.parse(readFileSync(webPkgPath, 'utf8'))
            playwright = webPkg.devDependencies?.['@playwright/test'] ?? ''
            const component = webPkg.devDependencies?.['@playwright/experimental-ct-react'] ?? ''
            const rootPlaywright = pkg.devDependencies?.['@playwright/test'] ?? ''
            if (
                !playwrightSpecsShareMinor(playwright, component) ||
                !playwrightSpecsShareMinor(playwright, rootPlaywright)
            ) {
                problems.push(
                    `Playwright packages must share a major.minor: test ${playwright || 'missing'}, component ${component || 'missing'}, root ${rootPlaywright || 'missing'}`,
                )
            } else {
                console.log(`[OK] Playwright package ranges share ${playwright}`)
            }
        } catch (error) {
            problems.push(`apps/web/package.json is not JSON: ${error.message}`)
        }
    }
    try {
        const lock = readFileSync(resolve('pnpm-lock.yaml'), 'utf8')
        const resolved = playwrightLockfileSharesMinor(resolvedPlaywrightVersions(lock))
        if (!resolved.ok) {
            problems.push(`Playwright lockfile resolutions diverged: ${resolved.detail}`)
        } else {
            console.log('[OK] Playwright lockfile resolutions share one release line')
        }
    } catch (error) {
        problems.push(`pnpm-lock.yaml could not be read: ${error.message}`)
    }
    if (image && !playwrightMajorMinorMatch(image[1], playwright)) {
        warnings.push(
            `Playwright image v${image[1]} does not match apps/web @playwright/test ${playwright || 'missing'}`,
        )
    } else if (image) {
        console.log(`[OK] Playwright image v${image[1]} matches the workspace range`)
    }

    const setup = existsSync('.devcontainer/setup.sh')
        ? readFileSync('.devcontainer/setup.sh', 'utf8')
        : ''
    check('devcontainer setup fails closed', /set -euo pipefail/.test(setup))

    try {
        execFileSync('node', ['scripts/check-repository-governance.mjs'], { stdio: 'inherit' })
    } catch {
        problems.push('governance expected-ruleset check failed')
    }

    if (warnings.length > 0) {
        console.log(`[WARN] ${warnings.length} optional gap(s):`)
        for (const warning of warnings) console.log(`       - ${warning}`)
    }
    if (problems.length > 0) {
        console.error(`[FAIL] ${problems.length} doctor check(s):`)
        for (const problem of problems) console.error(`       - ${problem}`)
        process.exit(1)
    }
    console.log('[OK] agent doctor')
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) main()

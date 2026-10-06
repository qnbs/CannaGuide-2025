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

const problems = []
const warnings = []

function run(cmd, args) {
    try {
        return execFileSync(cmd, args, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim()
    } catch (error) {
        return error.stdout?.toString().trim() || ''
    }
}

function check(label, ok, detail) {
    if (ok) console.log(`[OK] ${label}${detail ? `: ${detail}` : ''}`)
    else problems.push(`${label}${detail ? `: ${detail}` : ''}`)
}

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
const wantedNode = Number((pkg.engines?.node ?? '>=24').replace(/[^\d]/g, '') || 24)
const nodeMajor = Number(process.versions.node.split('.')[0])
check('Node major', nodeMajor >= wantedNode, process.version)

const wantedPnpm = (pkg.packageManager ?? '').replace(/^pnpm@/, '')
const pnpmVersion = run('pnpm', ['--version'])
check('pnpm version', pnpmVersion === wantedPnpm, `${pnpmVersion} (packageManager ${wantedPnpm})`)

check('git', run('git', ['--version']).startsWith('git version'))
const signing = run('git', ['config', '--get', 'commit.gpgsign'])
check('git commit.gpgsign', signing === 'true', signing || 'unset')

const gh = run('gh', ['--version'])
check('gh', gh.startsWith('gh version'), gh.split('\n')[0] || 'missing')

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
const webPkg = JSON.parse(readFileSync('apps/web/package.json', 'utf8'))
const playwright = webPkg.devDependencies?.['@playwright/test'] ?? ''
if (image && !playwright.includes(image[1])) {
    warnings.push(
        `Playwright image v${image[1]} does not match apps/web @playwright/test ${playwright}`,
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

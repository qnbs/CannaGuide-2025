#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const checks = []

function run(command, args) {
    return spawnSync(command, args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
    })
}

function addResult(name, ok, details) {
    checks.push({ name, ok, details })
}

function checkCommandVersion(name, cmd, args = ['--version']) {
    const result = run(cmd, args)
    if (result.status !== 0) {
        addResult(name, false, `${cmd} not available`)
        return
    }
    const firstLine = (result.stdout || '').split('\n')[0]?.trim() || 'version unknown'
    addResult(name, true, firstLine)
}

function readGitConfig(key) {
    const result = run('git', ['config', '--get', key])
    if (result.status !== 0) return ''
    return result.stdout.trim()
}

checkCommandVersion('Node.js', 'node')
checkCommandVersion('npm', 'npm')
checkCommandVersion('git', 'git')
checkCommandVersion('gh', 'gh')

const userName = readGitConfig('user.name')
const userEmail = readGitConfig('user.email')
const gpgSign = readGitConfig('commit.gpgsign')
const gpgFormat = readGitConfig('gpg.format')
const signingKey = readGitConfig('user.signingkey')

addResult('Git user.name', Boolean(userName), userName || 'missing')
addResult('Git user.email', Boolean(userEmail), userEmail || 'missing')
addResult('Git commit.gpgsign', gpgSign === 'true', gpgSign || 'missing')
addResult('Git gpg.format', gpgFormat === 'ssh', gpgFormat || 'missing')

if (!signingKey) {
    addResult('Git user.signingkey', false, 'missing')
} else {
    addResult(
        'Git user.signingkey',
        existsSync(signingKey),
        existsSync(signingKey) ? `${signingKey} (exists)` : `${signingKey} (not found)`,
    )
}

const authorNameOverride = process.env.GIT_AUTHOR_NAME || ''
const authorEmailOverride = process.env.GIT_AUTHOR_EMAIL || ''
const committerNameOverride = process.env.GIT_COMMITTER_NAME || ''
const committerEmailOverride = process.env.GIT_COMMITTER_EMAIL || ''

const authorMismatch =
    (authorNameOverride && userName && authorNameOverride !== userName) ||
    (authorEmailOverride && userEmail && authorEmailOverride !== userEmail)

const committerMismatch =
    (committerNameOverride && userName && committerNameOverride !== userName) ||
    (committerEmailOverride && userEmail && committerEmailOverride !== userEmail)

const hasAuthorOverride = Boolean(authorNameOverride || authorEmailOverride)
const hasCommitterOverride = Boolean(committerNameOverride || committerEmailOverride)

addResult(
    'Env override GIT_AUTHOR_*',
    !authorMismatch,
    hasAuthorOverride
        ? authorMismatch
            ? 'set (mismatch with git config)'
            : 'set (matches git config)'
        : 'not set',
)
addResult(
    'Env override GIT_COMMITTER_*',
    !committerMismatch,
    hasCommitterOverride
        ? committerMismatch
            ? 'set (mismatch with git config)'
            : 'set (matches git config)'
        : 'not set',
)

console.log('=== Devcontainer Doctor ===')
for (const check of checks) {
    const status = check.ok ? 'OK' : 'FAIL'
    console.log(`${status}  ${check.name}: ${check.details}`)
}

const failed = checks.filter((c) => !c.ok)
if (failed.length > 0) {
    if (committerMismatch || authorMismatch) {
        console.error('\nRemediation: remove override variables in current shell:')
        console.error(
            '  unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL',
        )
        console.error('Then re-run: npm run devcontainer:doctor')
    }
    console.error(`\nDoctor failed: ${failed.length} check(s) need attention.`)
    process.exit(1)
}

console.log('\nDoctor passed: environment and signing readiness look good.')

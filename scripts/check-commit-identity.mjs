import { spawnSync } from 'node:child_process'

function readGitConfig(key) {
    const result = spawnSync('git', ['config', '--get', key], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        shell: false,
    })

    if (result.status !== 0) return ''
    return result.stdout.trim()
}

function fail(message) {
    console.error(`[check:commit-identity] ${message}`)
}

function warn(message) {
    console.warn(`[check:commit-identity] ${message}`)
}

const userName = readGitConfig('user.name')
const userEmail = readGitConfig('user.email')
const signEnabled = readGitConfig('commit.gpgsign')
const signingKey = readGitConfig('user.signingkey')
const gpgProgram = readGitConfig('gpg.program')

// Codespaces uses gh-gpgsign which manages keys internally — no user.signingkey needed
const isCodespacesGpg = gpgProgram.includes('gh-gpgsign')

const authorName = process.env.GIT_AUTHOR_NAME || ''
const authorEmail = process.env.GIT_AUTHOR_EMAIL || ''
const committerName = process.env.GIT_COMMITTER_NAME || ''
const committerEmail = process.env.GIT_COMMITTER_EMAIL || ''

const issues = []
const warnings = []
const mode = process.env.CHECK_COMMIT_IDENTITY_MODE === 'warn' ? 'warn' : 'enforce'
const enforceIdentity = mode === 'enforce'

if (!userName || !userEmail) {
    warnings.push('git user.name/user.email are missing')
}

if (signEnabled !== 'true') {
    warnings.push('commit signing is disabled (commit.gpgsign != true)')
}

if (!signingKey && !isCodespacesGpg) {
    warnings.push('user.signingkey is not configured')
}

const hasUnsafeCommitterOverride =
    committerName === 'GitHub' ||
    committerEmail === 'noreply@github.com' ||
    authorName === 'GitHub' ||
    authorEmail === 'noreply@github.com'

if (hasUnsafeCommitterOverride) {
    issues.push('unsafe author/committer override detected (GitHub/noreply)')
}

if (committerName && userName && committerName !== userName) {
    const message = `GIT_COMMITTER_NAME differs from git user.name (${committerName} != ${userName})`
    if (enforceIdentity) {
        issues.push(message)
    } else {
        warnings.push(message)
    }
}

if (committerEmail && userEmail && committerEmail !== userEmail) {
    const message = `GIT_COMMITTER_EMAIL differs from git user.email (${committerEmail} != ${userEmail})`
    if (enforceIdentity) {
        issues.push(message)
    } else {
        warnings.push(message)
    }
}

if (authorName && userName && authorName !== userName) {
    const message = `GIT_AUTHOR_NAME differs from git user.name (${authorName} != ${userName})`
    if (enforceIdentity) {
        issues.push(message)
    } else {
        warnings.push(message)
    }
}

if (authorEmail && userEmail && authorEmail !== userEmail) {
    const message = `GIT_AUTHOR_EMAIL differs from git user.email (${authorEmail} != ${userEmail})`
    if (enforceIdentity) {
        issues.push(message)
    } else {
        warnings.push(message)
    }
}

if (issues.length > 0) {
    fail('commit identity/signing check failed:')
    for (const issue of issues) {
        fail(`- ${issue}`)
    }
    process.exit(1)
}

if (warnings.length > 0) {
    const modeLabel = enforceIdentity ? 'enforced' : 'advisory'
    warn(`commit identity/signing warnings (${modeLabel} mode):`)
    for (const warningMessage of warnings) {
        warn(`- ${warningMessage}`)
    }

    if (enforceIdentity) process.exit(1)
}

console.log('[check:commit-identity] OK')

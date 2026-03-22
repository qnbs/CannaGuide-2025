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

const userName = readGitConfig('user.name')
const userEmail = readGitConfig('user.email')
const signEnabled = readGitConfig('commit.gpgsign')
const signingKey = readGitConfig('user.signingkey')

const authorName = process.env.GIT_AUTHOR_NAME || ''
const authorEmail = process.env.GIT_AUTHOR_EMAIL || ''
const committerName = process.env.GIT_COMMITTER_NAME || ''
const committerEmail = process.env.GIT_COMMITTER_EMAIL || ''

const issues = []

if (!userName || !userEmail) {
    issues.push('git user.name/user.email are missing')
}

if (signEnabled !== 'true') {
    issues.push('commit signing is disabled (commit.gpgsign != true)')
}

if (!signingKey) {
    issues.push('user.signingkey is not configured')
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
    issues.push(`GIT_COMMITTER_NAME differs from git user.name (${committerName} != ${userName})`)
}

if (committerEmail && userEmail && committerEmail !== userEmail) {
    issues.push(
        `GIT_COMMITTER_EMAIL differs from git user.email (${committerEmail} != ${userEmail})`,
    )
}

if (authorName && userName && authorName !== userName) {
    issues.push(`GIT_AUTHOR_NAME differs from git user.name (${authorName} != ${userName})`)
}

if (authorEmail && userEmail && authorEmail !== userEmail) {
    issues.push(`GIT_AUTHOR_EMAIL differs from git user.email (${authorEmail} != ${userEmail})`)
}

if (issues.length > 0) {
    fail('commit identity/signing check failed:')
    for (const issue of issues) {
        fail(`- ${issue}`)
    }
    process.exit(1)
}

console.log('[check:commit-identity] OK')

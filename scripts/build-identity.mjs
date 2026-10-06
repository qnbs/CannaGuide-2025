/**
 * Continuous-web identity.
 *
 * Production may deploy every green main commit without a new git tag.
 * The semantic package version stays the last release. The build version
 * appends the full commit so About, Sentry, and version.json can tell
 * 1.9.0 apart from 1.9.0+<sha>.
 */

export const RELEASE_MODEL = 'continuous-web'
const FULL_SHA = /^[0-9a-f]{40}$/i

export function isFullSha(commit) {
    return FULL_SHA.test(commit ?? '')
}

export function buildVersion(version, commit) {
    const semantic = version || '0.0.0'
    return isFullSha(commit) ? `${semantic}+${commit}` : semantic
}

export function resolveCommitFromEnv(env = process.env) {
    for (const key of ['BUILD_COMMIT', 'VERCEL_GIT_COMMIT_SHA', 'GITHUB_SHA']) {
        const value = env[key]?.trim()
        if (value) return { commit: value, source: key }
    }
    return { commit: '', source: 'none' }
}

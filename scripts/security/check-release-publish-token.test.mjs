import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { problemsInReleasePublish } from './check-release-publish-token.mjs'

const LIVE = readFileSync('.github/workflows/release-publish.yml', 'utf8')

test('the live release workflow keeps RELEASE_PAT on the tag step', () => {
    assert.deepEqual(problemsInReleasePublish(LIVE), [])
})

test('checkout that prefers RELEASE_PAT fails', () => {
    const text = LIVE.replaceAll(
        'token: ${{ github.token }}',
        'token: ${{ secrets.RELEASE_PAT || github.token }}',
    )
    const problems = problemsInReleasePublish(text)
    assert.ok(problems.some((problem) => problem.includes('reads RELEASE_PAT')))
})

test('a dry-run step that pushes a tag fails', () => {
    const text = LIVE.replace(
        'echo "[FAIL] Dry-run will not create tag ${TAG}."',
        'git push origin "refs/tags/${TAG}"\necho "[FAIL] Dry-run will not create tag ${TAG}."',
    )
    const problems = problemsInReleasePublish(text)
    assert.ok(problems.some((problem) => problem.includes('creates or pushes')))
})

test('a tag step without a GH013 classification fails', () => {
    const text = LIVE.replaceAll('GH013', 'RULESET')
    const problems = problemsInReleasePublish(text)
    assert.ok(problems.some((problem) => problem.includes('GH013')))
})

test('the tag step redacts the token before any failure text is printed', () => {
    const start = LIVE.indexOf('redact() {')
    const end = LIVE.indexOf('if [[ -z "${RELEASE_PAT}" ]]', start)
    assert.ok(start > 0 && end > start)
    const secret = 'github_pat_example.secret'
    const script = `
${LIVE.slice(start, end)}
SECRET=${JSON.stringify(secret)}
OUT=$(redact "denied https://x-access-token:\${SECRET}@github.com/qnbs/CannaGuide-2025.git and again \${SECRET}" "\${SECRET}")
printf '%s' "\${OUT}"
`
    const out = execFileSync('bash', ['-c', script], { encoding: 'utf8' })
    assert.equal(out.includes(secret), false)
    assert.equal(out.split('[REDACTED]').length, 3)
})

test('a tag push through origin fails the policy', () => {
    const text = LIVE.replace(
        'git push "https://x-access-token:${RELEASE_PAT}@github.com/${REPO}.git" "refs/tags/${TAG}"',
        'git push origin "refs/tags/${TAG}"',
    )
    const problems = problemsInReleasePublish(text)
    assert.ok(problems.some((problem) => problem.includes('RELEASE_PAT URL')))
})

test('a lookalike host does not satisfy the extraheader check', () => {
    const text = LIVE.replaceAll(
        'http.https://github.com/.extraheader',
        'http.https://notgithub.com/.extraheader',
    )
    const problems = problemsInReleasePublish(text)
    assert.ok(problems.some((problem) => problem.includes('extraheader')))
})

test('persisting the checkout token fails the policy', () => {
    const text = LIVE.replaceAll('persist-credentials: false', 'persist-credentials: true')
    const problems = problemsInReleasePublish(text)
    assert.ok(problems.some((problem) => problem.includes('persists the read-only job token')))
})

test('publishing the release with RELEASE_PAT fails the policy', () => {
    const text = LIVE.replace(
        'GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}',
        'GH_TOKEN: ${{ secrets.RELEASE_PAT || secrets.GITHUB_TOKEN }}',
    )
    const problems = problemsInReleasePublish(text)
    assert.ok(problems.some((problem) => problem.includes('Create GitHub Release')))
})

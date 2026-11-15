import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const ROOT = path.resolve(import.meta.dirname, '../..')
const HEAD = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const OTHER = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const runbook = readFileSync(path.join(ROOT, 'docs/PR-REVIEW-LOOP.md'), 'utf8')
const program = runbook
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.includes('group_by(.user.login)'))

function coverageFilter() {
    assert.ok(program, 'coverage jq missing from docs/PR-REVIEW-LOOP.md')
    assert.match(program, /coderabbitai\[bot\]/)
    assert.match(program, /codeant-ai\[bot\]/)
    assert.match(program, /chatgpt-codex-connector\[bot\]/)
    assert.doesNotMatch(program, /unique_by/)
    const filter = program
        .replace(/^.*\| jq -s --arg head \"\$HEAD_SHA\" '/, '')
        .replace(/'\)$/, '')
    return filter
}

function review(login, state, commit = HEAD, submitted = '2026-11-02T10:00:00Z') {
    return { user: { login, type: 'Bot' }, state, commit_id: commit, submitted_at: submitted }
}

/** Run the documented `jq -s` program over REST review pages. */
function covered(pages) {
    const out = execFileSync('jq', ['-s', '-c', '--arg', 'head', HEAD, `[${coverageFilter()}]`], {
        input: pages.map((page) => JSON.stringify(page)).join('\n'),
        encoding: 'utf8',
    })
    return JSON.parse(out)
}

test('review coverage reads the current GitHub PR head rather than local HEAD', () => {
    assert.ok(
        runbook.includes('HEAD_SHA=$(gh pr view "$PR_NUMBER" --json headRefOid --jq .headRefOid)'),
    )
    assert.ok(!runbook.includes('HEAD_SHA=$(git rev-parse HEAD)'))
})

test('review coverage rechecks the PR head before reporting results', () => {
    const initialRead = runbook.indexOf('HEAD_SHA=$(gh pr view "$PR_NUMBER" --json headRefOid')
    const reviewRead = runbook.indexOf('REVIEW_COVERAGE=$(gh api')
    const finalRead = runbook.indexOf(
        'RECHECK_HEAD_SHA=$(gh pr view "$PR_NUMBER" --json headRefOid',
    )
    const mismatchGuard = runbook.indexOf('if [ "$RECHECK_HEAD_SHA" != "$HEAD_SHA" ]; then')
    const output = runbook.indexOf(`printf '%s\\n' "$REVIEW_COVERAGE"`)

    assert.ok(initialRead >= 0 && initialRead < reviewRead)
    assert.ok(reviewRead < finalRead && finalRead < mismatchGuard && mismatchGuard < output)
    assert.ok(runbook.includes('exit 1'))
})

test('the documented query keeps the newest review per bot login on the head', () => {
    const pages = [
        [
            review('coderabbitai[bot]', 'COMMENTED', HEAD, '2026-11-02T10:00:00Z'),
            review('coderabbitai[bot]', 'CHANGES_REQUESTED', HEAD, '2026-11-02T11:00:00Z'),
            review('codeant-ai[bot]', 'COMMENTED', HEAD, '2026-11-02T09:00:00Z'),
            review('codeant-ai[bot]', 'DISMISSED', HEAD, '2026-11-02T12:00:00Z'),
            review('chatgpt-codex-connector[bot]', 'COMMENTED', OTHER),
            review('greptile-apps[bot]', 'COMMENTED'),
            review('coderabbitai', 'COMMENTED'),
        ],
        [review('cubic-dev-ai[bot]', 'COMMENTED')],
    ]
    assert.deepEqual(covered(pages), [{ user: 'coderabbitai[bot]', state: 'CHANGES_REQUESTED' }])
})

test('names without the [bot] suffix match nothing, so a stripped filter fails closed', () => {
    const pages = [
        [
            review('coderabbitai', 'COMMENTED'),
            review('codeant-ai', 'APPROVED'),
            review('chatgpt-codex-connector', 'CHANGES_REQUESTED'),
        ],
    ]
    assert.deepEqual(covered(pages), [])
})

test('a dismissed-only login, a silent reviewer, and a trial notice add no row', () => {
    const pages = [
        [
            review('chatgpt-codex-connector[bot]', 'DISMISSED'),
            review('greptile-apps[bot]', 'COMMENTED'),
            review('coderabbitai[bot]', 'COMMENTED'),
        ],
    ]
    assert.deepEqual(
        covered(pages).map((row) => row.user),
        ['coderabbitai[bot]'],
    )
})

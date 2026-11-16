import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { evaluateReviewCoverage } from './review-coverage-policy.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const HEAD = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const OTHER = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const runbook = readFileSync(path.join(ROOT, 'docs/PR-REVIEW-LOOP.md'), 'utf8')
const workflow = readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8')
const filterPath = path.join(ROOT, 'scripts/security/pr-review-coverage.jq')
const filter = readFileSync(filterPath, 'utf8')
const workflowProgram = workflow.match(/jq -s --arg head "\$PR_HEAD_SHA" '([\s\S]*?)'\)/)?.[1]
assert.ok(workflowProgram, 'CI must contain its trusted exact-head jq program')
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

function review(login, state, commit = HEAD, submitted = '2026-11-02T10:00:00Z', id = 1) {
    return { id, user: { login, type: 'Bot' }, state, commit_id: commit, submitted_at: submitted }
}

/** Run the documented `jq -s` program over REST review pages. */
function covered(pages) {
    const out = execFileSync('jq', ['-s', '-c', '--arg', 'head', HEAD, `[${coverageFilter()}]`], {
        input: pages.map((page) => JSON.stringify(page)).join('\n'),
        encoding: 'utf8',
    })
    const result = JSON.parse(out)
    const filterOut = execFileSync('jq', ['-s', '-c', '--arg', 'head', HEAD, filter], {
        input: pages.map((page) => JSON.stringify(page)).join('\n'),
        encoding: 'utf8',
    })
    assert.deepEqual(JSON.parse(filterOut), result, 'shared jq filter must match the runbook')
    const sharedOut = execFileSync('jq', ['-s', '-c', '--arg', 'head', HEAD, '-f', filterPath], {
        input: pages.map((page) => JSON.stringify(page)).join('\n'),
        encoding: 'utf8',
    })
    assert.deepEqual(JSON.parse(sharedOut), result, 'CI and runbook review filters must agree')
    const workflowOut = execFileSync('jq', ['-s', '-c', '--arg', 'head', HEAD, workflowProgram], {
        input: pages.map((page) => JSON.stringify(page)).join('\n'),
        encoding: 'utf8',
    })
    assert.deepEqual(JSON.parse(workflowOut), result, 'CI must use the tested review filter')
    return result
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
            review('coderabbitai[bot]', 'COMMENTED', HEAD, '2026-11-02T10:00:00Z', 10),
            review('coderabbitai[bot]', 'CHANGES_REQUESTED', HEAD, '2026-11-02T11:00:00Z', 11),
            review('codeant-ai[bot]', 'COMMENTED', HEAD, '2026-11-02T09:00:00Z', 20),
            review('codeant-ai[bot]', 'DISMISSED', HEAD, '2026-11-02T12:00:00Z', 21),
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

test('two permitted reviewers on the exact head satisfy the merge gate', () => {
    const pages = [
        [
            review('coderabbitai[bot]', 'COMMENTED'),
            review('codeant-ai[bot]', 'APPROVED', HEAD, '2026-11-02T11:00:00Z'),
        ],
    ]
    assert.equal(covered(pages).length, 2)
})

test('one permitted reviewer is insufficient for the two-review gate', () => {
    const pages = [[review('coderabbitai[bot]', 'COMMENTED')]]
    assert.equal(covered(pages).length, 1)
})

test('pending and unknown review states never satisfy coverage', () => {
    const pages = [
        [
            review('coderabbitai[bot]', 'PENDING', HEAD, '2026-11-02T10:00:00Z', 1),
            review('codeant-ai[bot]', 'UNRECOGNIZED', HEAD, '2026-11-02T11:00:00Z', 2),
        ],
    ]
    assert.deepEqual(covered(pages), [])
})

test('review ID deterministically breaks identical timestamp ties', () => {
    const timestamp = '2026-11-02T10:00:00Z'
    const pages = [
        [
            review('coderabbitai[bot]', 'DISMISSED', HEAD, timestamp, 42),
            review('coderabbitai[bot]', 'COMMENTED', HEAD, timestamp, 41),
        ],
    ]
    assert.deepEqual(covered(pages), [])

    const reverseState = [
        [
            review('codeant-ai[bot]', 'COMMENTED', HEAD, timestamp, 43),
            review('codeant-ai[bot]', 'DISMISSED', HEAD, timestamp, 42),
        ],
    ]
    assert.deepEqual(covered(reverseState), [{ user: 'codeant-ai[bot]', state: 'COMMENTED' }])
})

test('reviews attached to a previous commit do not count for the current head', () => {
    const pages = [
        [
            review('coderabbitai[bot]', 'COMMENTED', OTHER),
            review('codeant-ai[bot]', 'APPROVED', OTHER, '2026-11-02T11:00:00Z'),
        ],
    ]
    assert.deepEqual(covered(pages), [])
})

test('required CI Status enforces the shared filter with a read-only PR token', () => {
    const ciGate = workflow.slice(workflow.indexOf('    ci-status:'))
    assert.match(ciGate, /name: Enforce exact-head review coverage/)
    assert.match(
        ciGate,
        /if: github\.event_name == 'pull_request' \|\| github\.event_name == 'workflow_dispatch'/,
    )
    assert.match(ciGate, /pull-requests: read/)
    assert.ok(ciGate.includes('GH_TOKEN: $' + '{{ github.token }}'))
    assert.match(ciGate, /jq -s --arg head "\$PR_HEAD_SHA" '/)
    assert.match(ciGate, /node scripts\/security\/review-coverage-policy\.mjs/)
    assert.match(ciGate, /PR_AUTHOR_LOGIN/)
    assert.match(ciGate, /PR_AUTHOR_ID/)
    assert.match(ciGate, /PR_AUTHOR_TYPE/)
    assert.match(ciGate, /LIVE_PR_BEFORE/)
    assert.match(ciGate, /LIVE_PR_AFTER/)
    const policyInvocation = `printf '%s\\n' "$GATE_INPUT" | node scripts/security/review-coverage-policy.mjs`
    assert.ok(ciGate.includes('set -euo pipefail'))
    assert.ok(
        ciGate.trimEnd().endsWith(policyInvocation),
        'the policy exit status must control the step',
    )
})

function gateInput(overrides = {}) {
    const user = { login: 'contributor', id: 123, type: 'User' }
    const pr = { number: 856, state: 'open', head_sha: HEAD, user }
    return {
        eventName: 'pull_request',
        eventRef: 'refs/pull/856/merge',
        eventPullRequest: { number: 856, head: { sha: HEAD }, user: { ...user } },
        livePullRequestBefore: structuredClone(pr),
        livePullRequestAfter: structuredClone(pr),
        reviews: [
            { user: 'coderabbitai[bot]', state: 'COMMENTED' },
            { user: 'codeant-ai[bot]', state: 'APPROVED' },
        ],
        ...overrides,
    }
}

test('the actual gate policy requires two completed reviewers', () => {
    assert.equal(evaluateReviewCoverage(gateInput()).ok, true)
    assert.equal(
        evaluateReviewCoverage(
            gateInput({ reviews: [{ user: 'coderabbitai[bot]', state: 'COMMENTED' }] }),
        ).ok,
        false,
    )
    assert.equal(
        evaluateReviewCoverage(
            gateInput({ reviews: [{ user: 'coderabbitai[bot]', state: 'PENDING' }] }),
        ).ok,
        false,
    )
})

test('only the verified Dependabot account identity bypasses the extra reviewer count', () => {
    const user = { login: 'dependabot[bot]', id: 49699333, type: 'Bot' }
    const pr = { number: 856, state: 'open', head_sha: HEAD, user }
    const input = gateInput({
        eventPullRequest: { number: 856, head: { sha: HEAD }, user },
        livePullRequestBefore: structuredClone(pr),
        livePullRequestAfter: structuredClone(pr),
        reviews: [],
    })
    assert.equal(evaluateReviewCoverage(input).dependabotException, true)
})

test('Dependabot exception requires the event and both live API reads to agree', () => {
    const official = { login: 'dependabot[bot]', id: 49699333, type: 'Bot' }
    const changed = { login: 'dependabot[bot]', id: 49699333, type: 'Bot' }
    const before = { number: 856, state: 'open', head_sha: HEAD, user: official }
    const after = { ...before, user: changed }
    const input = gateInput({
        eventPullRequest: { number: 856, head: { sha: HEAD }, user: official },
        livePullRequestBefore: before,
        livePullRequestAfter: { ...after, user: { ...changed, id: 49699334 } },
        reviews: [],
    })
    assert.equal(evaluateReviewCoverage(input).ok, false)
    assert.equal(evaluateReviewCoverage(input).dependabotException, false)
})

test('a spoofed branch name or Dependabot login with another identity does not bypass', () => {
    const branchSpoof = gateInput({
        eventRef: 'refs/heads/dependabot/github_actions/example',
        reviews: [{ user: 'coderabbitai[bot]', state: 'COMMENTED' }],
    })
    assert.equal(evaluateReviewCoverage(branchSpoof).ok, false)

    const fakeUser = { login: 'dependabot[bot]', id: 999, type: 'Bot' }
    const fakePr = { number: 856, state: 'open', head_sha: HEAD, user: fakeUser }
    const impersonation = gateInput({
        eventPullRequest: { number: 856, head: { sha: HEAD }, user: fakeUser },
        livePullRequestBefore: structuredClone(fakePr),
        livePullRequestAfter: structuredClone(fakePr),
        reviews: [{ user: 'coderabbitai[bot]', state: 'COMMENTED' }],
    })
    assert.equal(evaluateReviewCoverage(impersonation).ok, false)
})

test('malformed author metadata and head changes fail closed', () => {
    const malformed = gateInput({
        eventPullRequest: {
            number: 856,
            head: { sha: HEAD },
            user: { login: '', id: null, type: 'User' },
        },
    })
    assert.equal(evaluateReviewCoverage(malformed).ok, false)

    const changedBefore = gateInput({
        livePullRequestBefore: { ...gateInput().livePullRequestBefore, head_sha: OTHER },
    })
    assert.equal(evaluateReviewCoverage(changedBefore).ok, false)

    const changedAfter = gateInput({
        livePullRequestAfter: { ...gateInput().livePullRequestAfter, head_sha: OTHER },
    })
    assert.equal(evaluateReviewCoverage(changedAfter).ok, false)
})

test('workflow_dispatch cannot publish review-gate success from a PR branch', () => {
    assert.equal(
        evaluateReviewCoverage({ eventName: 'workflow_dispatch', eventRef: 'refs/heads/main' }).ok,
        true,
    )
    assert.equal(
        evaluateReviewCoverage({ eventName: 'workflow_dispatch', eventRef: 'refs/heads/feature' })
            .ok,
        false,
    )
})

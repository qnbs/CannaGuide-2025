import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { test } from 'node:test'

import {
    changedFilesFromPullFiles,
    filterEvidenceForPull,
    readClaudeRuns,
    readEvidenceSupplement,
    runChild,
} from './collect-review-evidence.mjs'
import { evaluateReviewCoverage } from './review-coverage-policy.mjs'

const PULL = 903
const PULL_URL = 'https://api.github.com/repos/qnbs/CannaGuide-2025/pulls/903'
const ISSUE_URL = 'https://api.github.com/repos/qnbs/CannaGuide-2025/issues/903'
const OTHER_PULL = 'https://api.github.com/repos/qnbs/CannaGuide-2025/pulls/902'
const OTHER_ISSUE = 'https://api.github.com/repos/qnbs/CannaGuide-2025/issues/902'
const SOURCE_REF_PATH = 'repos/qnbs/CannaGuide-2025/git/ref/heads/feature/source'
const ENCODED_SOURCE_REF_PATH = 'repos/qnbs/CannaGuide-2025/git/ref/heads/feature/source%23review'

test('filterEvidenceForPull keeps only matching pull/issue URLs and sorts by id', () => {
    const { reviews, issueComments } = filterEvidenceForPull(
        PULL,
        [
            { id: 3, pull_request_url: PULL_URL, user: { login: 'coderabbitai[bot]' } },
            { id: 1, pull_request_url: PULL_URL, user: { login: 'sourcery-ai[bot]' } },
            { id: 1, pull_request_url: OTHER_PULL },
        ],
        [
            { id: 4, issue_url: ISSUE_URL, body: 'later' },
            { id: 2, issue_url: ISSUE_URL, body: 'earlier' },
            { id: 2, issue_url: OTHER_ISSUE, body: 'foreign' },
        ],
    )
    assert.deepEqual(
        reviews.map(({ id }) => id),
        [1, 3],
    )
    assert.deepEqual(
        issueComments.map(({ id }) => id),
        [2, 4],
    )
})

test('changedFilesFromPullFiles retains previous_filename on rename', () => {
    const files = changedFilesFromPullFiles([
        {
            filename: 'scripts/security/review-coverage-policy.mjs',
            previous_filename: 'scripts/security/old-collector.mjs',
        },
    ])
    assert.deepEqual(files, [
        'scripts/security/old-collector.mjs',
        'scripts/security/review-coverage-policy.mjs',
    ])
})

test('readEvidenceSupplement accepts headEquivalence and secondReviewRequest only', (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'cg-evidence-'))
    t.after(() => rmSync(dir, { force: true, recursive: true }))
    const path = join(dir, 'extra.json')
    writeFileSync(
        path,
        JSON.stringify({
            headEquivalence: { priorHeadSha: 'a'.repeat(40), changeDigest: 'deadbeef' },
            secondReviewRequest: {
                provider: 'CodeRabbit',
                pullNumber: 907,
                headSha: 'b'.repeat(40),
                requestCount: 1,
                requestedAt: '2026-01-01T00:00:00.000Z',
                observedAt: '2026-01-01T12:00:00.000Z',
                result: 'unavailable',
                reference: 'https://github.com/qnbs/CannaGuide-2025/pull/907#issuecomment-1',
            },
        }),
    )
    const supplement = readEvidenceSupplement(path)
    assert.equal(supplement.headEquivalence.priorHeadSha, 'a'.repeat(40))
    assert.equal(supplement.secondReviewRequest.provider, 'CodeRabbit')
})

test('readEvidenceSupplement rejects unsupported keys', (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'cg-evidence-'))
    t.after(() => rmSync(dir, { force: true, recursive: true }))
    const path = join(dir, 'extra.json')
    writeFileSync(path, JSON.stringify({ headEquivalence: {}, reviewers: ['CodeRabbit'] }))
    const result = spawnSync(
        process.execPath,
        [
            '--input-type=module',
            '-e',
            `
        import { readEvidenceSupplement } from ${JSON.stringify(CLI.href)}
        readEvidenceSupplement(${JSON.stringify(path)})
    `,
        ],
        { encoding: 'utf8' },
    )
    assert.equal(result.status, 2)
    assert.match(result.stderr, /unsupported key/)
})

test('runChild returns a timeout result without signaling the collector', () => {
    const result = runChild(process.execPath, ['-e', 'setTimeout(() => {}, 1000)'], {
        timeout: 20,
    })
    assert.equal(result.error?.code, 'ETIMEDOUT')
})

const HEAD = 'a'.repeat(40)
const BASE = 'b'.repeat(40)
const CLI = new URL('./collect-review-evidence.mjs', import.meta.url)
const POLICY = new URL('./review-coverage-policy.mjs', import.meta.url)
const PULL_PATH = `repos/qnbs/CannaGuide-2025/pulls/${PULL}`
const COMMENTS_PATH = `repos/qnbs/CannaGuide-2025/issues/${PULL}/comments`
const COMPARE_PATH = `repos/qnbs/CannaGuide-2025/compare/${BASE}...${HEAD}?per_page=1`
const CLI_TEST = { skip: process.platform === 'win32' && 'Uses a POSIX gh shim and signals' }

function review(login) {
    return {
        pull_request_url: PULL_URL,
        user: { login, type: 'Bot' },
        commit_id: HEAD,
        state: 'COMMENTED',
        body: 'Reviewed.',
        submitted_at: '2026-01-01T00:00:00Z',
    }
}

function pullMetadata(head = HEAD, changedFiles = 2, sourceRef = 'feature/source') {
    return {
        head: { sha: head, ref: sourceRef, repo: { full_name: 'qnbs/CannaGuide-2025' } },
        base: { sha: BASE },
        changed_files: changedFiles,
        updated_at: '2026-01-01T00:00:00Z',
    }
}

function runCollector(t, overrides = {}, argv = [String(PULL), '--expect-head', HEAD]) {
    const dir = mkdtempSync(join(tmpdir(), 'cg evidence '))
    t.after(() => rmSync(dir, { force: true, recursive: true }))
    const scriptDir = join(dir, 'scripts', 'security')
    mkdirSync(scriptDir, { recursive: true })
    const cli = join(scriptDir, 'collect-review-evidence.mjs')
    copyFileSync(CLI, cli)
    copyFileSync(POLICY, join(scriptDir, 'review-coverage-policy.mjs'))
    const responses = {
        [PULL_PATH]: { values: [pullMetadata(), pullMetadata(), pullMetadata()] },
        [SOURCE_REF_PATH]: {
            values: [
                { object: { sha: HEAD } },
                { object: { sha: HEAD } },
                { object: { sha: HEAD } },
            ],
        },
        [COMPARE_PATH]: {
            values: [{ files: [{ filename: 'docs/readme.md' }, { filename: 'scripts/ci.mjs' }] }],
        },
        [`${PULL_PATH}/reviews`]: {
            values: [
                [[review('coderabbitai[bot]')], [review('sourcery-ai[bot]')]],
                [[review('coderabbitai[bot]')], [review('sourcery-ai[bot]')]],
            ],
        },
        [COMMENTS_PATH]: { values: [[[]], [[]]] },
        [`${PULL_PATH}/comments`]: { values: [[[]], [[]]] },
        ...overrides,
    }

    writeFileSync(
        join(dir, 'gh'),
        `#!/usr/bin/env node
import * as fs from 'node:fs'
const route = process.argv[3]
const responses = JSON.parse(process.env.CANNAGUIDE_REVIEW_FIXTURE)
const response = responses[route]
if (process.argv[2] !== 'api' || !response) process.exit(90)
if (response.signal) process.kill(process.pid, response.signal)
if (response.exit) {
    process.stderr.write('fixture private diagnostic')
    process.exit(response.exit)
}
const paginated = route.endsWith('/reviews') || route.endsWith('/comments')
if (paginated && process.argv.slice(4).join(' ') !== '--paginate --slurp') process.exit(91)
const countFile = process.env.CANNAGUIDE_REVIEW_REQUESTS
const counts = fs.existsSync(countFile) ? JSON.parse(fs.readFileSync(countFile)) : {}
const index = counts[route] || 0
if (index >= response.values.length) process.exit(92)
counts[route] = index + 1
fs.writeFileSync(countFile, JSON.stringify(counts))
process.stdout.write(JSON.stringify(response.values[index], null, 2))
`,
        { mode: 0o755 },
    )
    return spawnSync(process.execPath, [cli, ...argv], {
        encoding: 'utf8',
        env: {
            ...process.env,
            PATH: `${dir}${delimiter}${process.env.PATH ?? ''}`,
            CANNAGUIDE_REVIEW_FIXTURE: JSON.stringify(responses),
            CANNAGUIDE_REVIEW_REQUESTS: join(dir, 'requests.json'),
        },
    })
}

test(
    'CLI reads pretty-printed pages and runs the policy from a path with spaces',
    CLI_TEST,
    (t) => {
        const result = runCollector(t)
        assert.equal(result.status, 0, result.stderr || result.stdout)
        assert.deepEqual(JSON.parse(result.stdout).highRiskFiles, ['scripts/ci.mjs'])
    },
)

test('CLI preserves an insufficient-coverage result and its exit status', CLI_TEST, (t) => {
    const result = runCollector(t, { [`${PULL_PATH}/reviews`]: { values: [[[]], [[]]] } })
    assert.equal(result.status, 1)
    assert.equal(JSON.parse(result.stdout).status, 'insufficient_coverage')
})

test('CLI does not count a bot reply in a thread as a review', CLI_TEST, (t) => {
    const reply = { ...review('coderabbitai[bot]'), id: 7, body: '' }
    const replyPage = [[reply], [review('sourcery-ai[bot]')]]
    const inline = [
        [{ id: 8, pull_request_url: PULL_URL, pull_request_review_id: 7, in_reply_to_id: 3 }],
    ]
    const result = runCollector(t, {
        [`${PULL_PATH}/reviews`]: { values: [replyPage, replyPage] },
        [`${PULL_PATH}/comments`]: { values: [inline, inline] },
    })

    assert.equal(result.status, 1)
    assert.deepEqual(
        JSON.parse(result.stdout).qualifiedReviewers.map((reviewer) => reviewer.provider),
        ['Sourcery'],
    )
})

test('CLI forwards inline comments, so a blank review with a finding counts', CLI_TEST, (t) => {
    const blank = { ...review('coderabbitai[bot]'), id: 7, body: '' }
    const reviews = [[blank], [review('sourcery-ai[bot]')]]
    const inline = [[{ id: 8, pull_request_url: PULL_URL, pull_request_review_id: 7 }]]
    const result = runCollector(t, {
        [`${PULL_PATH}/reviews`]: { values: [reviews, reviews] },
        [`${PULL_PATH}/comments`]: { values: [inline, inline] },
    })

    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.deepEqual(
        JSON.parse(result.stdout)
            .qualifiedReviewers.map((reviewer) => reviewer.provider)
            .sort(),
        ['CodeRabbit', 'Sourcery'],
    )
})

test('CLI preserves a late GitHub failure without emitting partial evidence', CLI_TEST, (t) => {
    const result = runCollector(t, { [COMMENTS_PATH]: { exit: 4 } })
    assert.equal(result.status, 4)
    assert.equal(result.stdout, '')
    assert.doesNotMatch(result.stderr, /private diagnostic/)
})

test('CLI propagates child signal termination', CLI_TEST, (t) => {
    const result = runCollector(t, { [COMMENTS_PATH]: { signal: 'SIGTERM' } })
    assert.equal(result.signal, 'SIGTERM')
    assert.equal(result.stdout, '')
})

test('CLI discards evidence when the PR advances during collection', CLI_TEST, (t) => {
    const result = runCollector(t, {
        [PULL_PATH]: {
            values: [pullMetadata(), pullMetadata('c'.repeat(40)), pullMetadata('c'.repeat(40))],
        },
    })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /PR changed/)
})

test('CLI rejects a source ref that is ahead of the pull metadata head', CLI_TEST, (t) => {
    const result = runCollector(t, {
        [SOURCE_REF_PATH]: { values: [{ object: { sha: 'c'.repeat(40) } }] },
    })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /Source branch and pull request heads differ/)
})

test('CLI encodes reserved source branch characters without encoding slashes', CLI_TEST, (t) => {
    const pull = pullMetadata(HEAD, 2, 'feature/source#review')
    const result = runCollector(t, {
        [PULL_PATH]: { values: [pull, pull, pull] },
        [ENCODED_SOURCE_REF_PATH]: {
            values: [
                { object: { sha: HEAD } },
                { object: { sha: HEAD } },
                { object: { sha: HEAD } },
            ],
        },
    })
    assert.equal(result.status, 0, result.stderr || result.stdout)
})

test('CLI rechecks the source branch after collecting initial evidence', CLI_TEST, (t) => {
    const result = runCollector(t, {
        [SOURCE_REF_PATH]: {
            values: [
                { object: { sha: HEAD } },
                { object: { sha: 'c'.repeat(40) } },
                { object: { sha: 'c'.repeat(40) } },
            ],
        },
    })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /Source branch and pull request heads differ/)
})

test('CLI rejects review or receipt changes during evidence collection', CLI_TEST, (t) => {
    const initial = [[review('coderabbitai[bot]')], [review('sourcery-ai[bot]')]]
    const changed = [[review('coderabbitai[bot]')], []]
    const result = runCollector(t, {
        [`${PULL_PATH}/reviews`]: { values: [initial, changed] },
    })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /Review evidence changed/)
})

test('CLI rejects an edited issue receipt during evidence collection', CLI_TEST, (t) => {
    const result = runCollector(t, {
        [COMMENTS_PATH]: {
            values: [
                [[{ id: 1, issue_url: ISSUE_URL, body: 'first' }]],
                [[{ id: 1, issue_url: ISSUE_URL, body: 'edited' }]],
            ],
        },
    })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /Review evidence changed/)
})

test('CLI rejects truncated, duplicate, or over-limit file lists', CLI_TEST, (t) => {
    const entry = { filename: 'docs/readme.md' }
    for (const files of [[entry], [entry, entry]]) {
        const result = runCollector(t, { [COMPARE_PATH]: { values: [{ files }] } })
        assert.equal(result.status, 1)
        assert.equal(result.stdout, '')
        assert.match(result.stderr, /incomplete or duplicate/)
    }
    const result = runCollector(t, { [PULL_PATH]: { values: [pullMetadata(HEAD, 301)] } })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /file-list limit/)
})

test('CLI rejects unknown options and duplicate PR numbers before collecting', CLI_TEST, (t) => {
    for (const args of [
        [String(PULL), `--expect-head=${HEAD}`],
        [String(PULL), '902'],
    ]) {
        const result = runCollector(t, {}, args)
        assert.equal(result.status, 2)
        assert.equal(result.stdout, '')
        assert.match(result.stderr, /Usage:/)
    }
})

test('policy does not qualify prose as a structured review receipt', () => {
    const { issueComments } = filterEvidenceForPull(
        PULL,
        [],
        [
            {
                id: 1,
                issue_url: ISSUE_URL,
                user: { login: 'codeant-ai[bot]', type: 'Bot' },
                body: 'Low Risk summary without supported structured receipt markers',
                created_at: '2026-01-01T00:00:00Z',
            },
        ],
    )
    assert.equal(issueComments.length, 1)
    const result = evaluateReviewCoverage({
        pullNumber: PULL,
        headSha: HEAD,
        recheckedHeadSha: HEAD,
        changedFiles: ['docs/readme.md'],
        reviews: [],
        issueComments,
        now: '2026-01-01T01:00:00Z',
    })
    assert.equal(result.qualifiedReviewers.length, 0)
    assert.equal(result.satisfied, false)
})

test('readClaudeRuns verifies the latest review run with its receipt artifact', () => {
    const api = 'https://api.github.com/repos/qnbs/CannaGuide-2025'
    const head = 'a'.repeat(40)
    const receiptReview = (id, runId, submitted, login = 'github-actions[bot]') => ({
        id,
        pull_request_url: `${api}/pulls/42`,
        user: { login, type: login === 'qnbs' ? 'User' : 'Bot' },
        state: 'COMMENTED',
        commit_id: head,
        submitted_at: submitted,
        body: `x\n<!-- claude-review-receipt:v1 ${JSON.stringify({ commit_sha: head, status: 'completed', findings: 0, run_id: runId, run_attempt: 2 })} -->`,
    })
    const reviews = [
        receiptReview(1, 7, '2026-11-24T10:00:00Z'),
        receiptReview(2, 9, '2026-11-24T11:00:00Z'),
        receiptReview(3, 8, '2026-11-24T12:00:00Z', 'qnbs'),
    ]
    const fetched = []
    const run = (id) => ({
        id,
        path: '.github/workflows/claude-review.yml',
        event: 'issue_comment',
        head_branch: 'main',
        repository: { full_name: 'qnbs/CannaGuide-2025' },
        head_repository: { full_name: 'qnbs/CannaGuide-2025' },
        run_attempt: 2,
        created_at: '2026-11-24T10:00:00Z',
        triggering_actor: { login: 'someone' },
    })
    const receipts = []
    const runs = readClaudeRuns(
        'repos/qnbs/CannaGuide-2025',
        reviews,
        head,
        42,
        (path) => {
            fetched.push(path)
            return run(Number(path.split('/').at(-1)))
        },
        (runId, attempt) => {
            receipts.push([runId, attempt])
            return { review_id: 2 }
        },
    )
    // Only the latest receipt-carrying review by github-actions[bot] on the head decides.
    assert.deepEqual(fetched, ['repos/qnbs/CannaGuide-2025/actions/runs/9'])
    assert.deepEqual(receipts, [[9, 2]])
    assert.deepEqual(runs, {
        9: {
            id: 9,
            path: '.github/workflows/claude-review.yml',
            event: 'issue_comment',
            head_branch: 'main',
            repository: 'qnbs/CannaGuide-2025',
            head_repository: 'qnbs/CannaGuide-2025',
            run_attempt: 2,
            created_at: '2026-11-24T10:00:00Z',
            receipt: { review_id: 2 },
        },
    })
    // An unreadable or mismatched run proves nothing, and no artifact is fetched for it.
    assert.deepEqual(
        readClaudeRuns(
            'r',
            reviews,
            head,
            42,
            () => null,
            () => assert.fail(),
        ),
        {},
    )
    assert.deepEqual(
        readClaudeRuns(
            'r',
            reviews,
            head,
            42,
            () => run(10),
            () => assert.fail(),
        ),
        {},
    )
    assert.deepEqual(
        readClaudeRuns(
            'r',
            [],
            head,
            42,
            () => assert.fail(),
            () => assert.fail(),
        ),
        {},
    )
})

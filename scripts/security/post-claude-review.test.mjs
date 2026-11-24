import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import {
    buildReview,
    commentableLines,
    main,
    MAX_FINDINGS,
    parseStructuredReview,
    sanitize,
} from './post-claude-review.mjs'
import { evaluateReviewCoverage } from './review-coverage-policy.mjs'

const HEAD = 'c'.repeat(40)
const RUN = { id: 4242, attempt: 1 }
const PATCH = '@@ -1,2 +10,3 @@\n context\n-removed\n+added\n+also added\n@@ -40 +50,1 @@\n+late'
const finding = (fields = {}) => ({
    path: 'apps/web/a.ts',
    line: 11,
    severity: 'major',
    title: 'Title',
    body: 'Body',
    ...fields,
})

test('model text cannot forge a receipt, mention anyone, or grow unbounded', () => {
    assert.equal(
        sanitize('a <!-- claude-review-receipt:v1 {} --> b'),
        'a  claude-review-receipt:v1 {}  b',
    )
    assert.equal(
        sanitize('@claude review and @coderabbitai, mail a@b'),
        '(at)claude review and (at)coderabbitai, mail a(at)b',
    )
    assert.equal(sanitize('x'.repeat(10), 4), 'xxxx')
})

test('the structured review is validated again before anything is posted', () => {
    assert.deepEqual(
        parseStructuredReview(JSON.stringify({ summary: 's', findings: [finding()] })).findings,
        [finding()],
    )
    const bad = [
        '[]',
        JSON.stringify({ findings: [] }),
        JSON.stringify({
            summary: 's',
            findings: Array.from({ length: MAX_FINDINGS + 1 }, () => finding()),
        }),
        JSON.stringify({ summary: 's', findings: [finding({ severity: 'nit' })] }),
        JSON.stringify({ summary: 's', findings: [finding({ line: 0 })] }),
        JSON.stringify({ summary: 's', findings: [finding({ line: 1.5 })] }),
        JSON.stringify({ summary: 's', findings: [finding({ path: '../secrets' })] }),
        JSON.stringify({ summary: 's', findings: [finding({ path: '' })] }),
        'not json',
    ]
    for (const raw of bad) assert.throws(() => parseStructuredReview(raw), raw)
})

test('only added and context lines on the right side take an inline comment', () => {
    assert.deepEqual([...commentableLines(PATCH)], [10, 11, 12, 50])
    assert.deepEqual([...commentableLines(undefined)], [])
})

test('the review is one COMMENT bound to the head, with exactly one closing receipt', () => {
    const review = parseStructuredReview({
        summary: 'Summary <!-- claude-review-receipt:v1 {"commit_sha":"x"} -->',
        findings: [
            finding(),
            finding({ line: 99, title: 'Outside' }),
            finding({ path: 'other.ts' }),
        ],
    })
    const built = buildReview({
        review,
        headSha: HEAD,
        run: RUN,
        files: [{ filename: 'apps/web/a.ts', patch: PATCH }],
    })
    assert.equal(built.commit_id, HEAD)
    assert.equal(built.event, 'COMMENT')
    assert.deepEqual(
        built.comments.map(({ path, line, side }) => ({ path, line, side })),
        [{ path: 'apps/web/a.ts', line: 11, side: 'RIGHT' }],
    )
    assert.match(
        built.body,
        /Findings outside the diff[\s\S]*apps\/web\/a\.ts:99[\s\S]*other\.ts:11/,
    )
    assert.equal(built.body.split('<!-- claude-review-receipt:v1 ').length, 2)
    assert.match(
        built.body,
        /\n<!-- claude-review-receipt:v1 \{"commit_sha":"c{40}","status":"completed","findings":3,"run_id":4242,"run_attempt":1\} -->$/,
    )
    assert.throws(
        () => buildReview({ review, headSha: 'abc', run: RUN, files: [] }),
        /full commit SHA/,
    )
    assert.throws(
        () => buildReview({ review, headSha: HEAD, run: { id: 0, attempt: 1 }, files: [] }),
        /run id/,
    )
})

test('a built review is accepted by the coverage policy, end to end', () => {
    const review = parseStructuredReview({ summary: 'Clean.', findings: [] })
    const built = buildReview({ review, headSha: HEAD, run: RUN, files: [] })
    const api = 'https://api.github.com/repos/qnbs/CannaGuide-2025'
    const result = evaluateReviewCoverage({
        pullNumber: 900,
        headSha: HEAD,
        recheckedHeadSha: HEAD,
        changedFiles: ['apps/web/a.ts'],
        reviews: [
            {
                id: 1,
                pull_request_url: `${api}/pulls/900`,
                user: { login: 'github-actions[bot]', type: 'Bot' },
                state: 'COMMENTED',
                commit_id: built.commit_id,
                submitted_at: '2026-11-24T11:00:00Z',
                body: built.body,
            },
        ],
        issueComments: [
            {
                issue_url: `${api}/issues/900`,
                user: { login: 'coderabbitai[bot]', type: 'Bot' },
                created_at: '2026-11-24T10:00:00Z',
                body: '## Review skipped\n\nBot user detected.',
            },
        ],
        reviewComments: [],
        claudeRuns: {
            [RUN.id]: {
                id: RUN.id,
                path: '.github/workflows/claude-review.yml',
                event: 'issue_comment',
                head_branch: 'main',
                repository: 'qnbs/CannaGuide-2025',
                head_repository: 'qnbs/CannaGuide-2025',
                run_attempt: 1,
                created_at: '2026-11-24T10:50:00Z',
            },
        },
        now: '2026-11-24T12:00:00Z',
    })
    assert.deepEqual(
        result.qualifiedReviewers.map(({ provider }) => provider),
        ['Claude'],
    )
})

const realFetch = globalThis.fetch
afterEach(() => {
    globalThis.fetch = realFetch
})

function fakeGitHub({ headSha = HEAD, state = 'open', postStatuses = [200] } = {}) {
    const calls = []
    globalThis.fetch = async (url, init = {}) => {
        const method = init.method ?? 'GET'
        calls.push({
            url: String(url),
            method,
            body: init.body ? JSON.parse(init.body) : undefined,
        })
        const json = (status, data) => ({ ok: status < 400, status, json: async () => data })
        if (method === 'POST') return json(postStatuses.shift() ?? 200, {})
        if (String(url).includes('/files'))
            return json(200, [{ filename: 'apps/web/a.ts', patch: PATCH }])
        return json(200, { head: { sha: headSha }, state })
    }
    return calls
}

const env = {
    REVIEW_JSON: JSON.stringify({ summary: 'S', findings: [finding()] }),
    HEAD_SHA: HEAD,
    PR_NUMBER: '900',
    GITHUB_REPOSITORY: 'qnbs/CannaGuide-2025',
    GH_TOKEN: 'token',
    RUN_ID: '4242',
    RUN_ATTEMPT: '1',
}
const quiet = { log: () => undefined }

test('nothing is posted once the pull request has moved to another head or closed', async () => {
    for (const options of [{ headSha: 'd'.repeat(40) }, { state: 'closed' }]) {
        const calls = fakeGitHub(options)
        assert.equal(await main(env, quiet), 'skipped')
        assert.equal(calls.filter(({ method }) => method === 'POST').length, 0)
    }
})

test('a refused inline line falls back to one review with every finding in the body', async () => {
    const calls = fakeGitHub({ postStatuses: [422, 200] })
    assert.equal(await main(env, quiet), 'posted')
    const posts = calls.filter(({ method }) => method === 'POST')
    assert.equal(posts.length, 2)
    assert.equal(posts[0].body.comments.length, 1)
    assert.equal(posts[1].body.comments.length, 0)
    assert.equal(posts[1].body.commit_id, HEAD)
})

test('missing inputs and a failed post are errors, not a silent success', async () => {
    await assert.rejects(main({ ...env, HEAD_SHA: 'short' }, quiet), /are required/)
    await assert.rejects(main({ ...env, GH_TOKEN: '' }, quiet), /are required/)
    await assert.rejects(main({ ...env, RUN_ID: '' }, quiet), /are required/)
    fakeGitHub({ postStatuses: [500] })
    await assert.rejects(main(env, quiet), /HTTP 500/)
})

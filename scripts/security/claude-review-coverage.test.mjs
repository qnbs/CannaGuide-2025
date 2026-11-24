import assert from 'node:assert/strict'
import { test } from 'node:test'

import { claudeRunToVerify, evaluateReviewCoverage } from './review-coverage-policy.mjs'

// The on-demand Claude review counts as one qualified provider of its own, but only as one
// formal review with a head-bound receipt, posted by a run of the default branch's
// claude-review workflow. Standing in for CodeRabbit is recorded only when CodeRabbit
// demonstrably could not review the exact head.

const PULL = 900
const HEAD = 'a'.repeat(40)
const OTHER = 'b'.repeat(40)
const API = 'https://api.github.com/repos/qnbs/CannaGuide-2025'
const NOW = '2026-11-24T12:00:00.000Z'
const RUN_ID = 4242

const receiptLine = (payload) => `<!-- claude-review-receipt:v1 ${JSON.stringify(payload)} -->`
const goodReceipt = {
    commit_sha: HEAD,
    status: 'completed',
    findings: 0,
    run_id: RUN_ID,
    run_attempt: 1,
}

function claudeReview({
    login = 'github-actions[bot]',
    type = 'Bot',
    commit = HEAD,
    state = 'COMMENTED',
    submitted = '2026-11-24T11:00:00Z',
    pull = PULL,
    body,
    receipt = goodReceipt,
    id = 501,
} = {}) {
    return {
        id,
        pull_request_url: `${API}/pulls/${pull}`,
        user: { login, type },
        state,
        commit_id: commit,
        submitted_at: submitted,
        body: body ?? `## Claude review (on demand)\n\nNo findings.\n\n${receiptLine(receipt)}`,
    }
}

const goodRun = {
    id: RUN_ID,
    path: '.github/workflows/claude-review.yml',
    event: 'issue_comment',
    head_branch: 'main',
    repository: 'qnbs/CannaGuide-2025',
    head_repository: 'qnbs/CannaGuide-2025',
    run_attempt: 1,
    created_at: '2026-11-24T10:50:00Z',
}

/** The run's own receipt artifact, as the collector downloads it: it names one review. */
const withReceipt = (run, reviewId, fields = {}) => ({
    ...run,
    receipt: {
        pull: PULL,
        head_sha: HEAD,
        review_id: reviewId,
        run_id: RUN_ID,
        run_attempt: 1,
        ...fields,
    },
})

/** What the collector fetches: the run of the latest Claude candidate, with its artifact. */
const runsFor = (reviews) => {
    const latest = reviews
        .filter(
            (review) =>
                review.user?.login === 'github-actions[bot]' &&
                review.body?.includes('claude-review-receipt:v1'),
        )
        .sort((a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at))
        .at(-1)
    return { [RUN_ID]: withReceipt(goodRun, latest?.id ?? 501) }
}

function comment({ login = 'qnbs', type = 'User', body, created = '2026-11-24T10:00:00Z' }) {
    return {
        id: 7,
        issue_url: `${API}/issues/${PULL}`,
        user: { login, type },
        body,
        created_at: created,
    }
}

const codexReceipt = {
    id: 9,
    issue_url: `${API}/issues/${PULL}`,
    user: { login: 'chatgpt-codex-connector[bot]', type: 'Bot' },
    created_at: '2026-11-24T10:30:00Z',
    body: `<!-- codex-pull-request-review-summary -->\n<!-- codex-review-state:v1 ${JSON.stringify({
        code_review: {
            commit_sha: HEAD,
            has_any_findings: false,
            has_unresolved_findings: false,
            status: 'completed',
        },
    })} -->`,
}

const coderabbitRequest = comment({
    body: `@coderabbitai review\n\nPlease review exact head \`${HEAD}\`.`,
})
const coderabbitLimit = comment({
    login: 'coderabbitai[bot]',
    type: 'Bot',
    created: '2026-11-24T10:01:00Z',
    body: '> [!WARNING]\n> ## Review limit reached\n> Next included review available in 17 minutes.',
})

function evaluate({
    reviews = [claudeReview()],
    issueComments = [codexReceipt, coderabbitRequest, coderabbitLimit],
    claudeRuns,
    pullNumber = PULL,
} = {}) {
    return evaluateReviewCoverage({
        pullNumber,
        headSha: HEAD,
        recheckedHeadSha: HEAD,
        changedFiles: ['apps/web/services/example.ts'],
        reviews,
        issueComments,
        reviewComments: [],
        claudeRuns: claudeRuns ?? runsFor(reviews),
        now: NOW,
    })
}

const providers = (result) => result.qualifiedReviewers.map(({ provider }) => provider).sort()

test('a receipt-bound review from the Claude workflow run counts and stands in for CodeRabbit', () => {
    const result = evaluate()
    assert.deepEqual(providers(result), ['Claude', 'Codex'])
    assert.equal(result.satisfied, true)
    assert.deepEqual(result.claudeReview, {
        findings: 0,
        runId: RUN_ID,
        standsInFor: 'CodeRabbit',
    })
})

test('Claude counts on its own; the CodeRabbit stand-in is recorded only with evidence', () => {
    const standsIn = (issueComments) => {
        const result = evaluate({ issueComments })
        assert.deepEqual(providers(result), ['Claude', 'Codex'])
        return result.claudeReview.standsInFor
    }
    assert.equal(standsIn([codexReceipt]), null)
    // A limit notice without a request for this head proves nothing about this head.
    assert.equal(standsIn([codexReceipt, coderabbitLimit]), null)
    // Neither does a request for another head, or a notice older than the request.
    const otherHead = comment({ body: `@coderabbitai review \`${OTHER}\`` })
    const early = { ...coderabbitLimit, created_at: '2026-11-24T09:00:00Z' }
    assert.equal(standsIn([codexReceipt, otherHead, coderabbitLimit]), null)
    assert.equal(standsIn([codexReceipt, coderabbitRequest, early]), null)
    // A bot that echoes the request is not a request.
    const botRequest = comment({
        login: 'github-actions[bot]',
        type: 'Bot',
        body: coderabbitRequest.body,
    })
    assert.equal(standsIn([codexReceipt, botRequest, coderabbitLimit]), null)
    // CodeRabbit's standing skip of a bot-authored pull request is unavailability.
    const skip = comment({
        login: 'coderabbitai[bot]',
        type: 'Bot',
        body: '> [!IMPORTANT]\n> ## Review skipped\n>\n> Bot user detected.',
    })
    assert.equal(standsIn([codexReceipt, skip]), 'CodeRabbit')
})

test('only a default-branch run of the Claude workflow, started by a comment, proves provenance', () => {
    const runs = [
        undefined,
        { ...goodRun, id: RUN_ID + 1 },
        { ...goodRun, path: '.github/workflows/claude.yml' },
        // A pull request can run its own copy of the file, but only on pull_request events.
        { ...goodRun, event: 'pull_request' },
        { ...goodRun, event: 'workflow_dispatch' },
        { ...goodRun, head_branch: 'feature' },
        { ...goodRun, head_repository: 'someone/fork' },
        { ...goodRun, repository: 'someone/CannaGuide-2025' },
        { ...goodRun, created_at: '2026-11-24T11:30:00Z' },
        { ...goodRun, run_attempt: 0 },
    ]
    for (const run of runs) {
        const claudeRuns = run === undefined ? {} : { [RUN_ID]: withReceipt(run, 501) }
        assert.deepEqual(providers(evaluate({ claudeRuns })), ['Codex'], JSON.stringify(run))
    }
    // A rerun keeps an earlier attempt's receipt valid.
    const rerun = { [RUN_ID]: withReceipt({ ...goodRun, run_attempt: 2 }, 501) }
    assert.deepEqual(providers(evaluate({ claudeRuns: rerun })), ['Claude', 'Codex'])
})

test('a stale, mismatched or malformed receipt is rejected', () => {
    const cases = [
        claudeReview({ commit: OTHER }),
        claudeReview({ receipt: { ...goodReceipt, commit_sha: OTHER } }),
        claudeReview({ receipt: { ...goodReceipt, commit_sha: HEAD.slice(0, 12) } }),
        claudeReview({ receipt: { ...goodReceipt, status: 'running' } }),
        claudeReview({ receipt: { ...goodReceipt, findings: -1 } }),
        claudeReview({ receipt: { ...goodReceipt, findings: 1.5 } }),
        claudeReview({ receipt: { ...goodReceipt, run_id: 'x' } }),
        claudeReview({ receipt: { ...goodReceipt, run_attempt: 2 } }),
        claudeReview({ body: '' }),
        claudeReview({ body: 'Looks good to me.' }),
        // The receipt must end the body, and there must be exactly one.
        claudeReview({ body: `${receiptLine(goodReceipt)}\n\nMore text.` }),
        claudeReview({ body: `x\n${receiptLine(goodReceipt)}\n${receiptLine(goodReceipt)}` }),
        claudeReview({ body: 'x\n<!-- claude-review-receipt:v1 {not json} -->' }),
        claudeReview({ pull: 901 }),
    ]
    for (const review of cases) {
        assert.deepEqual(providers(evaluate({ reviews: [review] })), ['Codex'], review.body)
    }
})

test('a copied receipt from any other account does not count', () => {
    for (const review of [
        claudeReview({ login: 'qnbs', type: 'User' }),
        claudeReview({ login: 'claude[bot]' }),
        claudeReview({ login: 'github-actions[bot]', type: 'User' }),
        claudeReview({ login: 'coderabbitai[bot]' }),
    ]) {
        // Another provider's review may count as that provider, but never as Claude.
        const result = evaluate({ reviews: [review] })
        assert.ok(!providers(result).includes('Claude'), review.user.login)
        assert.equal(result.claudeReview, null)
    }
})

test('the latest Claude review on the head decides; a dismissal or pending state blocks it', () => {
    const older = claudeReview({ id: 1, submitted: '2026-11-24T10:55:00Z' })
    const dismissed = claudeReview({
        id: 2,
        state: 'DISMISSED',
        submitted: '2026-11-24T11:30:00Z',
    })
    const pending = claudeReview({ id: 3, state: 'PENDING', submitted: '2026-11-24T11:40:00Z' })
    const invalid = claudeReview({
        id: 4,
        receipt: { ...goodReceipt, status: 'failed' },
        submitted: '2026-11-24T11:50:00Z',
    })
    for (const later of [dismissed, pending, invalid]) {
        assert.deepEqual(providers(evaluate({ reviews: [older, later] })), ['Codex'], later.state)
    }
    const newer = claudeReview({ id: 5, submitted: '2026-11-24T11:55:00Z' })
    assert.deepEqual(providers(evaluate({ reviews: [dismissed, newer] })), ['Claude', 'Codex'])
    // An unrelated github-actions review, such as an auto-merge approval, does not void it.
    const approval = {
        ...claudeReview({ id: 6, state: 'APPROVED', submitted: '2026-11-24T11:58:00Z' }),
        body: '',
    }
    assert.deepEqual(providers(evaluate({ reviews: [newer, approval] })), ['Claude', 'Codex'])
})

test('Claude is one review, never two, and never stands in for a CodeRabbit that reviewed', () => {
    const alone = evaluate({ issueComments: [coderabbitRequest, coderabbitLimit] })
    assert.deepEqual(providers(alone), ['Claude'])
    assert.equal(alone.satisfied, false)
    const twice = evaluate({
        reviews: [
            claudeReview({ id: 1 }),
            claudeReview({ id: 2, submitted: '2026-11-24T11:10:00Z' }),
        ],
        issueComments: [coderabbitRequest, coderabbitLimit],
    })
    assert.deepEqual(providers(twice), ['Claude'])
    const coderabbit = {
        id: 600,
        pull_request_url: `${API}/pulls/${PULL}`,
        user: { login: 'coderabbitai[bot]', type: 'Bot' },
        state: 'COMMENTED',
        commit_id: HEAD,
        submitted_at: '2026-11-24T11:20:00Z',
        body: 'Actionable comments posted: 0',
    }
    const all = evaluate({ reviews: [coderabbit, claudeReview()] })
    assert.deepEqual(providers(all), ['Claude', 'CodeRabbit', 'Codex'])
    assert.equal(all.claudeReview.standsInFor, null)
    assert.equal(all.requiredReviews, 2)
})

test('the PR #857 transition rules ignore the Claude review', () => {
    const result = evaluate({
        pullNumber: 857,
        reviews: [claudeReview({ pull: 857 })],
        issueComments: [],
    })
    assert.deepEqual(result.qualifiedReviewers, [])
})

test('a review that only names a genuine run fails: the run artifact must name this review', () => {
    // Another same-repository workflow can post as github-actions[bot] and cite any run.
    const forged = [
        { [RUN_ID]: goodRun },
        { [RUN_ID]: withReceipt(goodRun, 999) },
        { [RUN_ID]: withReceipt(goodRun, 501, { head_sha: OTHER }) },
        { [RUN_ID]: withReceipt(goodRun, 501, { pull: 901 }) },
        { [RUN_ID]: withReceipt(goodRun, 501, { run_id: RUN_ID + 1 }) },
        { [RUN_ID]: withReceipt(goodRun, 501, { run_attempt: 2 }) },
    ]
    for (const claudeRuns of forged) {
        assert.deepEqual(
            providers(evaluate({ claudeRuns })),
            ['Codex'],
            JSON.stringify(claudeRuns[RUN_ID].receipt ?? null),
        )
    }
    assert.deepEqual(providers(evaluate({ claudeRuns: { [RUN_ID]: withReceipt(goodRun, 501) } })), [
        'Claude',
        'Codex',
    ])
})

test('the collector verifies exactly the run of the latest review on the head', () => {
    const reviews = [
        claudeReview({
            id: 1,
            submitted: '2026-11-24T10:00:00Z',
            receipt: { ...goodReceipt, run_id: 17 },
        }),
        claudeReview({
            id: 2,
            submitted: '2026-11-24T11:00:00Z',
            receipt: { ...goodReceipt, run_id: 18, run_attempt: 2 },
        }),
        claudeReview({
            id: 3,
            submitted: '2026-11-24T11:30:00Z',
            commit: OTHER,
            receipt: { ...goodReceipt, run_id: 19 },
        }),
        claudeReview({
            id: 4,
            submitted: '2026-11-24T11:40:00Z',
            pull: 901,
            receipt: { ...goodReceipt, run_id: 20 },
        }),
        claudeReview({ id: 5, submitted: '2026-11-24T11:50:00Z', login: 'qnbs', type: 'User' }),
    ]
    assert.deepEqual(claudeRunToVerify(reviews, HEAD, PULL), { runId: 18, runAttempt: 2 })
    assert.equal(claudeRunToVerify([], HEAD, PULL), null)
    assert.equal(
        claudeRunToVerify([claudeReview({ receipt: { ...goodReceipt, run_id: -3 } })], HEAD, PULL),
        null,
    )
})

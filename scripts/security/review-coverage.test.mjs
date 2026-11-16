import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

import { evaluateReviewCoverage } from './review-coverage-policy.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const runbook = readFileSync(path.join(ROOT, 'docs/PR-REVIEW-LOOP.md'), 'utf8')
const HEAD = 'a'.repeat(40)
const OTHER = 'b'.repeat(40)
const NOW = '2026-11-16T12:00:00.000Z'
const DOC_FILES = ['docs/quickstart.md']
const HIGH_FILES = ['docs/PR-REVIEW-LOOP.md']

function review(login, state = 'COMMENTED', commit = HEAD, submitted = '2026-11-16T10:00:00Z') {
    return {
        id: 100,
        pull_request_url: 'https://api.github.com/repos/qnbs/CannaGuide-2025/pulls/857',
        user: { login, type: 'Bot' },
        state,
        commit_id: commit,
        submitted_at: submitted,
    }
}

function receipt({
    login = 'chatgpt-codex-connector[bot]',
    type = 'Bot',
    commit = HEAD,
    status = 'completed',
    hasAnyFindings = false,
    hasUnresolvedFindings = false,
    createdAt = '2026-11-16T10:00:00Z',
} = {}) {
    const state = {
        code_review: {
            commit_sha: commit,
            has_any_findings: hasAnyFindings,
            has_unresolved_findings: hasUnresolvedFindings,
            status,
        },
    }
    return {
        id: 200,
        issue_url: 'https://api.github.com/repos/qnbs/CannaGuide-2025/issues/857',
        user: { login, type },
        created_at: createdAt,
        body: `<!-- codex-pull-request-review-summary -->\n<!-- codex-review-state:v1 ${JSON.stringify(state)} -->`,
    }
}

function evaluate(overrides = {}) {
    return evaluateReviewCoverage({
        pullNumber: 857,
        headSha: HEAD,
        recheckedHeadSha: HEAD,
        changedFiles: DOC_FILES,
        reviews: [],
        issueComments: [],
        now: NOW,
        ...overrides,
    })
}

test('runbook documents the four-provider pool and exact-head evidence boundary', () => {
    for (const provider of ['CodeRabbit', 'CodeAnt', 'Codex', 'Sourcery']) {
        assert.ok(runbook.includes(provider), `missing ${provider}`)
    }
    assert.match(runbook, /full 40-character (?:current head )?SHA/i)
    assert.match(runbook, /not a required CI check/i)
    assert.match(runbook, /pull_request_url[\s\S]{0,120}issue_url/i)
    assert.match(runbook, /pullNumber[\s\S]{0,120}recheckedHeadSha/i)
})

test('an authentic completed Codex receipt for the exact head counts once', () => {
    const result = evaluate({ issueComments: [receipt()] })
    assert.deepEqual(result.qualifiedReviewers.map((reviewer) => reviewer.login), [
        'chatgpt-codex-connector[bot]',
    ])
    assert.equal(result.receiptFindings.hasUnresolvedFindings, false)
    assert.equal(result.satisfied, false, 'two reviews are preferred absent a documented fallback')
})

test('a user-authored, copied or malformed Codex receipt is rejected', () => {
    const copied = receipt({ login: 'maintainer-account', type: 'User' })
    const malformed = { ...receipt(), body: 'LGTM <!-- codex-review-state:v1 {"status":"completed"} -->' }
    assert.deepEqual(evaluate({ issueComments: [copied, malformed] }).qualifiedReviewers, [])
})

test('a receipt with a short or stale SHA, pending state, or missing findings status is rejected', () => {
    const shortSha = receipt({ commit: HEAD.slice(0, 10) })
    const oldHead = receipt({ commit: OTHER })
    const pending = receipt({ status: 'pending' })
    const missingFindingState = receipt()
    missingFindingState.body = missingFindingState.body.replace(
        '"has_any_findings":false,',
        '',
    )
    for (const candidate of [shortSha, oldHead, pending, missingFindingState]) {
        assert.deepEqual(evaluate({ issueComments: [candidate] }).qualifiedReviewers, [])
    }
})

test('formal reviews require a trusted bot, exact head, submitted completed state, and dedupe per bot', () => {
    const reviews = [
        review('coderabbitai[bot]', 'COMMENTED'),
        review('coderabbitai[bot]', 'APPROVED', HEAD, '2026-11-16T11:00:00Z'),
        review('codeant-ai[bot]', 'COMMENTED', OTHER),
        review('sourcery-ai[bot]', 'PENDING', HEAD, null),
        review('greptile-apps[bot]', 'APPROVED'),
        review('codeant-ai', 'APPROVED'),
    ]
    const result = evaluate({ reviews })
    assert.deepEqual(result.formalReviewers, [
        { provider: 'CodeRabbit', login: 'coderabbitai[bot]', state: 'APPROVED' },
    ])
})

test('dismissed, pending, unknown, and non-bot review records do not qualify', () => {
    const result = evaluate({
        reviews: [
            review('chatgpt-codex-connector[bot]', 'DISMISSED'),
            review('codeant-ai[bot]', 'PENDING', HEAD, null),
            review('sourcery-ai[bot]', 'UNKNOWN'),
            { ...review('codeant-ai[bot]', 'APPROVED'), user: { login: 'codeant-ai[bot]', type: 'User' } },
        ],
        issueComments: [receipt()],
    })
    assert.deepEqual(result.qualifiedReviewers, [], 'dismissal must not be bypassed by a receipt')
})

test('Sourcery is accepted when complete but never adds a third-review requirement', () => {
    const result = evaluate({
        reviews: [
            review('coderabbitai[bot]', 'COMMENTED'),
            review('codeant-ai[bot]', 'APPROVED'),
            review('sourcery-ai[bot]', 'APPROVED'),
        ],
    })
    assert.equal(result.satisfied, true)
    assert.equal(result.qualifiedReviewers.length, 3)
    assert.equal(result.requiredReviews, 2)
})

test('two qualified reviewers satisfy the gate without requesting or waiting for a third', () => {
    const result = evaluate({
        reviews: [
            review('coderabbitai[bot]', 'COMMENTED'),
            review('codeant-ai[bot]', 'APPROVED'),
        ],
        secondReviewRequest: { result: 'silent' },
    })
    assert.equal(result.satisfied, true)
    assert.equal(result.requiredReviews, 2)
    assert.equal(result.fallback, false)
})

test('only low-risk work gets a one-review fallback after one evidenced bounded request', () => {
    const reviewRequest = {
        provider: 'codeant-ai[bot]',
        pullNumber: 857,
        headSha: HEAD,
        requestCount: 1,
        requestedAt: '2026-11-16T06:00:00Z',
        observedAt: '2026-11-16T06:30:00Z',
        result: 'rate_limited',
        reference: 'issue-comment-123',
    }
    const lowRisk = evaluate({
        reviews: [review('coderabbitai[bot]', 'COMMENTED')],
        secondReviewRequest: reviewRequest,
    })
    const highRisk = evaluate({
        changedFiles: HIGH_FILES,
        reviews: [review('coderabbitai[bot]', 'COMMENTED')],
        secondReviewRequest: reviewRequest,
    })
    assert.equal(lowRisk.risk, 'low')
    assert.equal(lowRisk.fallback, true)
    assert.equal(lowRisk.satisfied, true)
    assert.equal(highRisk.risk, 'high')
    assert.equal(highRisk.fallback, false)
    assert.equal(highRisk.satisfied, false)
})

test('fallback rejects repeated requests, wrong heads, and premature silence', () => {
    const base = {
        provider: 'codeant-ai[bot]',
        pullNumber: 857,
        headSha: HEAD,
        requestCount: 1,
        requestedAt: '2026-11-16T11:00:00Z',
        observedAt: '2026-11-16T11:00:00Z',
        result: 'silent',
        reference: 'issue-comment-123',
    }
    for (const secondReviewRequest of [
        { ...base, requestCount: 2 },
        { ...base, headSha: OTHER },
        base,
    ]) {
        const result = evaluate({
            reviews: [review('coderabbitai[bot]', 'COMMENTED')],
            secondReviewRequest,
        })
        assert.equal(result.fallback, false)
        assert.equal(result.satisfied, false)
    }
})


test('review evidence from another PR is rejected even when its commit SHA matches', () => {
    const wrongReview = {
        ...review('coderabbitai[bot]', 'APPROVED'),
        pull_request_url: 'https://api.github.com/repos/qnbs/CannaGuide-2025/pulls/856',
    }
    const wrongReceipt = {
        ...receipt(),
        issue_url: 'https://api.github.com/repos/qnbs/CannaGuide-2025/issues/856',
    }
    assert.deepEqual(evaluate({ reviews: [wrongReview], issueComments: [wrongReceipt] }).qualifiedReviewers, [])
})

test('head changes during collection fail closed and policy changes classify high risk', () => {
    assert.equal(evaluate({ recheckedHeadSha: OTHER }).status, 'invalid_or_changed_head')
    assert.equal(evaluate({ changedFiles: HIGH_FILES }).risk, 'high')
    assert.equal(evaluate({ changedFiles: ['scripts/security/review-coverage-policy.mjs'] }).risk, 'high')
})

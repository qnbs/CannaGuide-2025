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

function review(
    login,
    state = 'COMMENTED',
    commit = HEAD,
    submitted = '2026-11-16T10:00:00Z',
    pullNumber = 857,
) {
    return {
        id: 100,
        pull_request_url: `https://api.github.com/repos/qnbs/CannaGuide-2025/pulls/${pullNumber}`,
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
    pullNumber = 857,
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
        issue_url: `https://api.github.com/repos/qnbs/CannaGuide-2025/issues/${pullNumber}`,
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
    assert.deepEqual(
        result.qualifiedReviewers.map((reviewer) => reviewer.login),
        ['chatgpt-codex-connector[bot]'],
    )
    assert.equal(result.receiptFindings.hasUnresolvedFindings, false)
    assert.equal(result.satisfied, false, 'two reviews are preferred absent a documented fallback')
})

test('a user-authored, copied or malformed Codex receipt is rejected', () => {
    const copied = receipt({ login: 'maintainer-account', type: 'User' })
    const malformed = {
        ...receipt(),
        body: 'LGTM <!-- codex-review-state:v1 {"status":"completed"} -->',
    }
    assert.deepEqual(evaluate({ issueComments: [copied, malformed] }).qualifiedReviewers, [])
})

test('a receipt with a short or stale SHA, pending state, or missing findings status is rejected', () => {
    const shortSha = receipt({ commit: HEAD.slice(0, 10) })
    const oldHead = receipt({ commit: OTHER })
    const pending = receipt({ status: 'pending' })
    const missingFindingState = receipt()
    missingFindingState.body = missingFindingState.body.replace('"has_any_findings":false,', '')
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
            {
                ...review('codeant-ai[bot]', 'APPROVED'),
                user: { login: 'codeant-ai[bot]', type: 'User' },
            },
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
        reviews: [review('coderabbitai[bot]', 'COMMENTED'), review('codeant-ai[bot]', 'APPROVED')],
        secondReviewRequest: { result: 'silent' },
    })
    assert.equal(result.satisfied, true)
    assert.equal(result.requiredReviews, 2)
    assert.equal(result.fallback, false)
})

test('only low-risk work gets a one-review fallback after one evidenced bounded request', () => {
    const reviewRequest = {
        provider: 'codeant-ai[bot]',
        pullNumber: 860,
        headSha: HEAD,
        requestCount: 1,
        requestedAt: '2026-11-16T06:00:00Z',
        observedAt: '2026-11-16T06:30:00Z',
        result: 'rate_limited',
        reference: 'issue-comment-123',
    }
    const lowRisk = evaluate({
        pullNumber: 860,
        reviews: [review('coderabbitai[bot]', 'COMMENTED', HEAD, '2026-11-16T10:00:00Z', 860)],
        secondReviewRequest: reviewRequest,
    })
    const highRisk = evaluate({
        pullNumber: 860,
        changedFiles: HIGH_FILES,
        reviews: [review('coderabbitai[bot]', 'COMMENTED', HEAD, '2026-11-16T10:00:00Z', 860)],
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
    assert.deepEqual(
        evaluate({ reviews: [wrongReview], issueComments: [wrongReceipt] }).qualifiedReviewers,
        [],
    )
})

test('head changes during collection fail closed and policy changes classify high risk', () => {
    assert.equal(evaluate({ recheckedHeadSha: OTHER }).status, 'invalid_or_changed_head')
    assert.equal(evaluate({ changedFiles: HIGH_FILES }).risk, 'high')
    assert.equal(
        evaluate({ changedFiles: ['scripts/security/review-coverage-policy.mjs'] }).risk,
        'high',
    )
})

test('trust-boundary docs are never classified low risk', () => {
    assert.equal(evaluate({ changedFiles: ['docs/GITHUB-SETTINGS-GUIDE.md'] }).risk, 'high')
    assert.equal(evaluate({ changedFiles: ['docs/quickstart.md'] }).risk, 'low')
})

test('credential and security tests are not low risk', () => {
    assert.equal(evaluate({ changedFiles: ['tests/credentials.test.ts'] }).risk, 'high')
    assert.equal(evaluate({ changedFiles: ['apps/web/__tests__/smoke.test.ts'] }).risk, 'low')
})

test('high-risk coverage counts an exact-head Codex receipt with one formal review', () => {
    const result = evaluate({
        pullNumber: 860,
        changedFiles: HIGH_FILES,
        reviews: [review('coderabbitai[bot]', 'COMMENTED', HEAD, '2026-11-16T10:00:00Z', 860)],
        issueComments: [receipt({ pullNumber: 860 })],
    })
    assert.equal(result.satisfied, true)
    assert.equal(result.qualifiedReviewers.length, 2)
})

test('PR #857 transition requires two formal reviews and rejects receipts and fallback', () => {
    const formalOnly = evaluate({
        reviews: [review('coderabbitai[bot]', 'COMMENTED'), review('codeant-ai[bot]', 'APPROVED')],
    })
    assert.equal(formalOnly.transitionPull, true)
    assert.equal(formalOnly.satisfied, true)
    assert.equal(formalOnly.fallback, false)

    const receiptBypass = evaluate({
        reviews: [review('coderabbitai[bot]', 'COMMENTED')],
        issueComments: [receipt()],
    })
    assert.equal(receiptBypass.satisfied, false)

    const fallbackBypass = evaluate({
        reviews: [review('coderabbitai[bot]', 'COMMENTED')],
        secondReviewRequest: {
            provider: 'codeant-ai[bot]',
            pullNumber: 857,
            headSha: HEAD,
            requestCount: 1,
            requestedAt: '2026-11-16T06:00:00Z',
            observedAt: '2026-11-16T06:30:00Z',
            result: 'rate_limited',
            reference: 'issue-comment-123',
        },
    })
    assert.equal(fallbackBypass.fallback, false)
    assert.equal(fallbackBypass.satisfied, false)
})

test('secondReviewRequest fails when pullNumber mismatches the evidence pull', () => {
    const result = evaluate({
        pullNumber: 860,
        reviews: [review('coderabbitai[bot]', 'COMMENTED', HEAD, '2026-11-16T10:00:00Z', 860)],
        secondReviewRequest: {
            provider: 'codeant-ai[bot]',
            pullNumber: 857,
            headSha: HEAD,
            requestCount: 1,
            requestedAt: '2026-11-16T06:00:00Z',
            observedAt: '2026-11-16T06:30:00Z',
            result: 'rate_limited',
            reference: 'issue-comment-123',
        },
    })
    assert.equal(result.fallback, false)
})

function coderabbitSummary({
    login = 'coderabbitai[bot]',
    type = 'Bot',
    source = HEAD,
    covered = HEAD,
    kind = 'reviewed',
    pullNumber = 866,
    updatedAt = '2026-11-16T10:30:00Z',
    extra = '',
    id = 300,
} = {}) {
    const coverage = JSON.stringify({ sourceCommitId: source, coveredCommitId: covered, kind })
    return {
        id,
        issue_url: `https://api.github.com/repos/qnbs/CannaGuide-2025/issues/${pullNumber}`,
        user: { login, type },
        created_at: '2026-11-16T09:00:00Z',
        updated_at: updatedAt,
        body: [
            '<!-- This is an auto-generated comment: summarize by coderabbit.ai -->',
            'No actionable comments were generated in the recent review.',
            `<!-- final_review_risk_coverage:${coverage} -->`,
            extra,
        ].join('\n'),
    }
}

test('a clean exact-head CodeRabbit coverage marker counts as CodeRabbit (PR 866 regression)', () => {
    // PR 866: Codex receipt plus a clean CodeRabbit pass on the head, no review object.
    const result = evaluate({
        pullNumber: 866,
        changedFiles: HIGH_FILES,
        issueComments: [receipt({ pullNumber: 866 }), coderabbitSummary()],
    })
    assert.equal(result.risk, 'high')
    assert.equal(result.satisfied, true)
    assert.deepEqual(
        result.qualifiedReviewers.map(({ provider, source }) => `${provider}:${source}`).sort(),
        ['CodeRabbit:coverage_marker_issue_comment', 'Codex:structured_issue_comment_receipt'],
    )
})

test('a CodeRabbit marker for another head, kind, author, PR, or body shape is rejected', () => {
    const rejected = [
        ['older covered commit', coderabbitSummary({ covered: OTHER })],
        ['older source commit', coderabbitSummary({ source: OTHER })],
        ['short SHA', coderabbitSummary({ source: HEAD.slice(0, 8), covered: HEAD.slice(0, 8) })],
        ['not reviewed', coderabbitSummary({ kind: 'skipped' })],
        ['user-authored copy', coderabbitSummary({ login: 'qnbs', type: 'User' })],
        ['impostor type', coderabbitSummary({ type: 'User' })],
        ['other PR', coderabbitSummary({ pullNumber: 865 })],
        [
            'duplicated marker',
            coderabbitSummary({
                extra: `<!-- final_review_risk_coverage:${JSON.stringify({ sourceCommitId: HEAD, coveredCommitId: HEAD, kind: 'reviewed' })} -->`,
            }),
        ],
    ]
    for (const [label, comment] of rejected) {
        const result = evaluate({
            pullNumber: 866,
            changedFiles: HIGH_FILES,
            issueComments: [receipt({ pullNumber: 866 }), comment],
        })
        assert.equal(result.satisfied, false, `${label} must not count`)
        assert.deepEqual(
            result.qualifiedReviewers.map((reviewer) => reviewer.provider),
            ['Codex'],
            label,
        )
    }

    const noSummary = coderabbitSummary()
    noSummary.body = noSummary.body.replace(
        '<!-- This is an auto-generated comment: summarize by coderabbit.ai -->',
        '',
    )
    const malformed = coderabbitSummary()
    malformed.body = malformed.body.replace('"kind":"reviewed"}', '"kind":"reviewed"')
    for (const comment of [noSummary, malformed]) {
        const result = evaluate({
            pullNumber: 866,
            changedFiles: HIGH_FILES,
            issueComments: [comment],
        })
        assert.equal(result.qualifiedReviewers.length, 0)
    }
})

test('GH #906: incremental CodeRabbit summary prose without exact-head marker does not count', () => {
    const priorCr = '47c0abe6f21d846ba53a0c725301769a6c79f53b'
    const head903 = 'd03a667f4db0b85df09b2fa4bd64b2dd0de62587'
    const summary = coderabbitSummary({
        pullNumber: 903,
        source: priorCr,
        covered: priorCr,
        updatedAt: '2026-11-20T15:44:51Z',
    })
    summary.body = [
        '<!-- This is an auto-generated comment: summarize by coderabbit.ai -->',
        `Reviewing files that changed between ${priorCr} and ${head903}.`,
        `<!-- final_review_risk_coverage:${JSON.stringify({
            sourceCommitId: priorCr,
            coveredCommitId: priorCr,
            kind: 'reviewed',
        })} -->`,
    ].join('\n')
    const result = evaluateReviewCoverage({
        pullNumber: 903,
        headSha: head903,
        recheckedHeadSha: head903,
        changedFiles: ['scripts/mutation-cache-fingerprint.mjs'],
        reviews: [],
        issueComments: [summary],
        now: '2026-11-20T16:00:00.000Z',
    })
    assert.equal(result.qualifiedReviewers.length, 0)
    assert.equal(result.satisfied, false)
    assert.equal(result.status, 'insufficient_coverage')
})

test('the latest CodeRabbit summary edit decides, and a stale edit cannot win', () => {
    const current = coderabbitSummary({
        covered: OTHER,
        source: OTHER,
        updatedAt: '2026-11-16T11:00:00Z',
        id: 301,
    })
    const older = coderabbitSummary({ updatedAt: '2026-11-16T10:00:00Z', id: 302 })
    const result = evaluate({
        pullNumber: 866,
        changedFiles: HIGH_FILES,
        issueComments: [older, current],
    })
    assert.equal(result.qualifiedReviewers.length, 0)
})

test('a newer CodeRabbit summary without a marker voids an older valid marker', () => {
    const olderValid = coderabbitSummary({ updatedAt: '2026-11-16T10:00:00Z', id: 303 })
    const newerWithoutMarker = coderabbitSummary({ updatedAt: '2026-11-16T11:00:00Z', id: 304 })
    newerWithoutMarker.body = [
        '<!-- This is an auto-generated comment: summarize by coderabbit.ai -->',
        '<!-- This is an auto-generated comment: rate limited by coderabbit.ai -->',
        'Review limit reached.',
    ].join('\n')
    const result = evaluate({
        pullNumber: 866,
        changedFiles: HIGH_FILES,
        issueComments: [receipt({ pullNumber: 866 }), olderValid, newerWithoutMarker],
    })
    assert.equal(result.satisfied, false)
    assert.deepEqual(
        result.qualifiedReviewers.map((reviewer) => reviewer.provider),
        ['Codex'],
    )
})

test('a CodeRabbit marker never double-counts a formal review or overrides a dismissal', () => {
    const both = evaluate({
        pullNumber: 866,
        changedFiles: HIGH_FILES,
        reviews: [review('coderabbitai[bot]', 'COMMENTED', HEAD, '2026-11-16T10:00:00Z', 866)],
        issueComments: [coderabbitSummary()],
    })
    assert.deepEqual(
        both.qualifiedReviewers.map(({ source }) => source),
        ['github_pull_request_review'],
    )
    assert.equal(both.satisfied, false)

    const dismissed = evaluate({
        pullNumber: 866,
        changedFiles: HIGH_FILES,
        reviews: [review('coderabbitai[bot]', 'DISMISSED', HEAD, '2026-11-16T10:00:00Z', 866)],
        issueComments: [receipt({ pullNumber: 866 }), coderabbitSummary()],
    })
    assert.deepEqual(
        dismissed.qualifiedReviewers.map(({ provider }) => provider),
        ['Codex'],
    )
    assert.equal(dismissed.satisfied, false)
})

test('PR #857 transition ignores the CodeRabbit marker too', () => {
    const result = evaluate({
        changedFiles: HIGH_FILES,
        reviews: [review('sourcery-ai[bot]')],
        issueComments: [coderabbitSummary({ pullNumber: 857 })],
    })
    assert.equal(result.transitionPull, true)
    assert.equal(result.satisfied, false)
})

const PRIOR = OTHER
const BASE_TIP = 'c'.repeat(40)
const MERGE_TREE = 'e'.repeat(40)

function mergeCommit(overrides = {}) {
    return {
        sha: HEAD,
        parents: [PRIOR, BASE_TIP],
        mergedParentOnBase: true,
        tree: MERGE_TREE,
        automaticMergeTree: MERGE_TREE,
        cleanAutomaticMerge: true,
        ...overrides,
    }
}

function equivalenceProof(overrides = {}) {
    const digest = 'd'.repeat(64)
    return {
        version: 2,
        equivalent: true,
        baseRef: 'origin/main',
        baseSha: BASE_TIP,
        priorHeadSha: PRIOR,
        headSha: HEAD,
        priorChangeDigest: digest,
        headChangeDigest: digest,
        mergeCommits: [mergeCommit()],
        ...overrides,
    }
}

function evaluateEquivalent({ proof = equivalenceProof(), marker = {}, reviews = [] } = {}) {
    return evaluate({
        pullNumber: 868,
        changedFiles: HIGH_FILES,
        reviews,
        issueComments: [
            receipt({ pullNumber: 868 }),
            coderabbitSummary({ pullNumber: 868, source: PRIOR, covered: PRIOR, ...marker }),
        ],
        headEquivalence: proof,
    })
}

test('after a pure base merge, the reviewed-head CodeRabbit marker counts with a proof (PR 868 regression)', () => {
    const result = evaluateEquivalent()
    assert.equal(result.satisfied, true)
    assert.deepEqual(
        result.qualifiedReviewers.map(({ provider, source }) => `${provider}:${source}`).sort(),
        ['CodeRabbit:coverage_marker_equivalent_head', 'Codex:structured_issue_comment_receipt'],
    )
    assert.deepEqual(result.equivalentHead, {
        reviewedHeadSha: PRIOR,
        changeDigest: 'd'.repeat(64),
    })
    const withoutProof = evaluateEquivalent({ proof: null })
    assert.equal(withoutProof.satisfied, false)
    assert.equal(withoutProof.equivalentHead, null)
})

test('a head-equivalence proof that is incomplete, inconsistent, or for other commits fails closed', () => {
    const merge = mergeCommit()
    const rejected = [
        ['not equivalent', equivalenceProof({ equivalent: false })],
        ['version 1 (no merge-tree check)', equivalenceProof({ version: 1 })],
        ['unknown version', equivalenceProof({ version: 3 })],
        ['proof against a side branch', equivalenceProof({ baseRef: 'origin/side' })],
        ['proof without a base SHA', equivalenceProof({ baseSha: undefined })],
        [
            'merge is not a clean automatic merge',
            equivalenceProof({ mergeCommits: [{ ...merge, cleanAutomaticMerge: false }] }),
        ],
        [
            'merge tree differs from the automatic merge',
            equivalenceProof({ mergeCommits: [{ ...merge, automaticMergeTree: 'f'.repeat(40) }] }),
        ],
        [
            'conflicted automatic merge',
            equivalenceProof({ mergeCommits: [{ ...merge, automaticMergeTree: null }] }),
        ],
        [
            'short merge tree',
            equivalenceProof({
                mergeCommits: [
                    { ...merge, tree: 'e'.repeat(12), automaticMergeTree: 'e'.repeat(12) },
                ],
            }),
        ],
        ['changed lines differ', equivalenceProof({ headChangeDigest: 'e'.repeat(64) })],
        [
            'short digest',
            equivalenceProof({
                priorChangeDigest: 'd'.repeat(40),
                headChangeDigest: 'd'.repeat(40),
            }),
        ],
        ['proof for another head', equivalenceProof({ headSha: BASE_TIP })],
        ['prior head equals head', equivalenceProof({ priorHeadSha: HEAD })],
        ['no merge commits', equivalenceProof({ mergeCommits: [] })],
        [
            'merged parent not on base',
            equivalenceProof({ mergeCommits: [{ ...merge, mergedParentOnBase: false }] }),
        ],
        [
            'chain does not start at the reviewed head',
            equivalenceProof({ mergeCommits: [{ ...merge, parents: [BASE_TIP, PRIOR] }] }),
        ],
        [
            'three parents',
            equivalenceProof({
                mergeCommits: [{ ...merge, parents: [PRIOR, BASE_TIP, BASE_TIP] }],
            }),
        ],
        [
            'chain ends before the head',
            equivalenceProof({ mergeCommits: [{ ...merge, sha: BASE_TIP }] }),
        ],
        [
            'short merge SHA',
            equivalenceProof({ mergeCommits: [{ ...merge, sha: HEAD.slice(0, 12) }] }),
        ],
    ]
    for (const [label, proof] of rejected) {
        const result = evaluateEquivalent({ proof })
        assert.equal(result.satisfied, false, `${label} must not count`)
        assert.deepEqual(
            result.qualifiedReviewers.map((reviewer) => reviewer.provider),
            ['Codex'],
            label,
        )
    }

    const otherMarkers = [
        ['marker names another commit', { source: BASE_TIP, covered: BASE_TIP }],
        ['marker covered commit differs', { covered: HEAD }],
        ['marker kind not reviewed', { kind: 'skipped' }],
    ]
    for (const [label, marker] of otherMarkers) {
        const result = evaluateEquivalent({ marker })
        assert.equal(result.satisfied, false, `${label} must not count`)
    }
})

test('a dismissed CodeRabbit review on the reviewed head blocks the equivalent-head marker', () => {
    const dismissed = review('coderabbitai[bot]', 'DISMISSED', PRIOR, '2026-11-16T10:45:00Z', 868)
    const result = evaluateEquivalent({ reviews: [dismissed] })
    assert.equal(result.satisfied, false)
    assert.deepEqual(
        result.qualifiedReviewers.map((reviewer) => reviewer.provider),
        ['Codex'],
    )
})

test('the runbook requires the head-equivalence proof for a marker on an earlier head', () => {
    assert.match(runbook, /review-head-equivalence\.mjs/)
    assert.match(runbook, /headEquivalence/)
})

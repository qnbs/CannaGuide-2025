import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
    changedFilesFromPullFiles,
    combinePaginatedJsonArrays,
    filterEvidenceForPull,
    readEvidenceSupplement,
} from './collect-review-evidence.mjs'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import {join} from 'node:path'

const PULL = 903
const PULL_URL = 'https://api.github.com/repos/qnbs/CannaGuide-2025/pulls/903'
const ISSUE_URL = 'https://api.github.com/repos/qnbs/CannaGuide-2025/issues/903'
const OTHER_PULL = 'https://api.github.com/repos/qnbs/CannaGuide-2025/pulls/902'
const OTHER_ISSUE = 'https://api.github.com/repos/qnbs/CannaGuide-2025/issues/902'

test('filterEvidenceForPull keeps only matching pull/issue URLs and sorts by id', () => {
    const { reviews, issueComments } = filterEvidenceForPull(PULL, [
        { id: 2, pull_request_url: PULL_URL, user: { login: 'coderabbitai[bot]' } },
        { id: 1, pull_request_url: OTHER_PULL },
    ], [
        { id: 3, issue_url: ISSUE_URL, body: 'ok' },
        { id: 2, issue_url: OTHER_ISSUE, body: 'foreign' },
    ])
    assert.equal(reviews.length, 1)
    assert.equal(reviews[0].id, 2)
    assert.equal(issueComments.length, 1)
    assert.equal(issueComments[0].id, 3)
})

test('combinePaginatedJsonArrays flattens multi-page gh api output', () => {
    const stdout = '[{"id":1}]\n[{"id":2},{"id":3}]\n'
    const merged = combinePaginatedJsonArrays(stdout)
    assert.deepEqual(merged.map((entry) => entry.id), [1, 2, 3])
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

test('readEvidenceSupplement accepts headEquivalence and secondReviewRequest only', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cg-evidence-'))
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

test('filterEvidenceForPull does not treat prose as structured receipt input', () => {
    const { issueComments } = filterEvidenceForPull(PULL, [], [
        {
            id: 1,
            issue_url: ISSUE_URL,
            user: { login: 'codeant-ai[bot]' },
            body: 'Low Risk summary without supported structured receipt markers',
        },
    ])
    assert.equal(issueComments.length, 1)
    assert.ok(!issueComments[0].body.includes('final_review_risk_coverage'))
})
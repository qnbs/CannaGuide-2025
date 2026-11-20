import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
    changedFilesFromPullFiles,
    combinePaginatedJsonArrays,
    filterEvidenceForPull,
} from './collect-review-evidence.mjs'

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
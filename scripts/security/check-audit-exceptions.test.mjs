import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    collectProblems,
    isIsoCalendarDate,
    registryLookupFailure,
} from './check-audit-exceptions.mjs'

const entry = {
    ghsa: 'GHSA-test-test-test',
    package: 'extract-zip',
    patched: '2.0.2',
    expiry: '2026-11-15',
    reachability: 'dev-only',
    reason: 'unpublished',
}

test('expiry must be a real calendar date', () => {
    assert.equal(isIsoCalendarDate('2026-11-15'), true)
    assert.equal(isIsoCalendarDate('2026/11/15'), false)
    assert.equal(isIsoCalendarDate('2026-02-31'), false)
    assert.equal(isIsoCalendarDate('2026-13-01'), false)
    assert.equal(isIsoCalendarDate('2026-11-15T00:00:00'), false)
})

test('a slash date cannot outlive its intended expiry', () => {
    const problems = collectProblems({
        ignored: [entry.ghsa],
        exceptions: [{ ...entry, expiry: '2026/11/15' }],
        today: '2026-11-16',
    })
    assert.match(problems[0], /real YYYY-MM-DD/)
})

test('an expired calendar date fails', () => {
    const problems = collectProblems({
        ignored: [entry.ghsa],
        exceptions: [entry],
        today: '2026-11-16',
    })
    assert.match(problems[0], /expired on 2026-11-15/)
})

test('registry errors are not treated as unpublished', () => {
    const failure = registryLookupFailure({
        stderr: 'npm error code EAI_AGAIN\nnpm error request to registry.npmjs.org failed',
        message: 'spawn npm ENOENT',
    })
    assert.equal(failure.kind, 'error')
    const missing = registryLookupFailure({
        stderr: 'npm error code E404\nnpm error 404 No match found for version 2.0.2',
    })
    assert.equal(missing.kind, 'unpublished')

    const problems = collectProblems({
        ignored: [entry.ghsa],
        exceptions: [entry],
        today: '2026-10-06',
        lookups: new Map([[entry.ghsa, failure]]),
    })
    assert.match(problems[0], /registry lookup failed/)
    assert.doesNotMatch(problems[0], /is published/)
})

test('a published patched version fails the exception', () => {
    const problems = collectProblems({
        ignored: [entry.ghsa],
        exceptions: [entry],
        today: '2026-10-06',
        lookups: new Map([[entry.ghsa, { kind: 'published', published: '2.0.2' }]]),
    })
    assert.match(problems[0], /is published/)
})

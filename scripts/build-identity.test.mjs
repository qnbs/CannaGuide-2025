import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildVersion, resolveCommitFromEnv } from './build-identity.mjs'

const SHA = '40c2d9020cc8d01f8df0a4f6ecf6629d501c0eef'

test('build version appends a full sha', () => {
    assert.equal(buildVersion('1.9.0', SHA), `1.9.0+${SHA}`)
})

test('short sha is not treated as build metadata', () => {
    assert.equal(buildVersion('1.9.0', '40c2d902'), '1.9.0')
})

test('commit env precedence is BUILD_COMMIT then Vercel then GitHub', () => {
    assert.equal(
        resolveCommitFromEnv({ BUILD_COMMIT: SHA, GITHUB_SHA: 'b'.repeat(40) }).source,
        'BUILD_COMMIT',
    )
    assert.equal(
        resolveCommitFromEnv({ VERCEL_GIT_COMMIT_SHA: SHA }).source,
        'VERCEL_GIT_COMMIT_SHA',
    )
    assert.equal(resolveCommitFromEnv({}).source, 'none')
})

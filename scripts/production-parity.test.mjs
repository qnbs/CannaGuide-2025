import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { classifySha, compareHeaders, normalizeHeader } from './production-parity-policy.mjs'
import { readBoundedText } from './production-parity.mjs'

const SHA = 'c5088863c168819cd031dd37480ae37a9a7f6211'

test('classifies exact main and expected deployment skew without treating skew as pass', () => {
    assert.equal(classifySha(SHA, SHA), 'EXACT_MAIN')
    assert.equal(classifySha('d'.repeat(40), SHA, false), 'EXPECTED_SKEW')
    assert.equal(classifySha('d'.repeat(40), SHA, true), 'DRIFT')
})

test('rejects invalid or abbreviated build identities', () => {
    assert.equal(classifySha('c5088863', SHA), 'INVALID')
    assert.equal(classifySha(SHA, 'c5088863'), 'INVALID')
})

test('normalizes insignificant header whitespace and case', () => {
    assert.equal(normalizeHeader('  SAME-origin  '), 'same-origin')
    assert.equal(normalizeHeader('max-age=600;  '), 'max-age=600')
})

test('reports missing and mismatched required headers as drift', () => {
    const result = compareHeaders(
        { 'x-frame-options': 'DENY', 'content-security-policy': "default-src 'self'" },
        {
            'X-Frame-Options': 'deny',
            'Content-Security-Policy': "default-src 'self'; object-src 'none'",
        },
    )
    assert.equal(result['x-frame-options'].status, 'MATCH')
    assert.equal(result['content-security-policy'].status, 'DRIFT')
    assert.equal(result['content-security-policy'].actual, "default-src 'self'")
})

test('reads only response bytes within the configured inspection limit', async () => {
    const chunks = [Buffer.from('small'), Buffer.from(' body')]
    let index = 0
    const response = {
        headers: { get: () => null },
        body: {
            getReader: () => ({
                read: async () =>
                    index < chunks.length
                        ? { done: false, value: chunks[index++] }
                        : { done: true },
                cancel: async () => {},
            }),
        },
    }
    assert.equal(await readBoundedText(response, 10), 'small body')
    assert.equal(index, 2)
})

test('cancels oversized response streams and refuses unbounded collection', async () => {
    let cancelled = false
    const response = {
        headers: { get: () => null },
        body: {
            getReader: () => ({
                read: async () => ({ done: false, value: Buffer.from('too large') }),
                cancel: async () => {
                    cancelled = true
                },
            }),
        },
    }
    await assert.rejects(readBoundedText(response, 4), /4-byte inspection limit/)
    assert.equal(cancelled, true)
})

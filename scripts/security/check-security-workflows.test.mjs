import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('labeler does not use pull_request_target', () => {
    const yaml = readFileSync('.github/workflows/labeler.yml', 'utf8')
    assert.equal(yaml.includes('pull_request_target'), false)
    assert.match(yaml, /pull_request:\s*\n\s+types:\s*\[opened, synchronize, reopened\]/)
    assert.match(yaml, /contents:\s*read/)
    assert.match(yaml, /pull-requests:\s*write/)
    assert.match(yaml, /actions\/labeler@bf12e9b00b37c5c0ca2b87b79b2daf7891dbda13/)
    assert.equal(yaml.includes('actions/checkout'), false)
})

test('snyk scan cannot continue on error', () => {
    const yaml = readFileSync('.github/workflows/snyk.yml', 'utf8')
    const scanAt = yaml.indexOf('Snyk Open Source scan')
    assert.ok(scanAt > 0)
    const beforeScan = yaml.slice(0, scanAt)
    assert.equal(beforeScan.includes('continue-on-error'), false)
    const monitorAt = yaml.indexOf('Snyk Monitor')
    const scanBlock = yaml.slice(scanAt, monitorAt)
    assert.equal(scanBlock.includes('continue-on-error'), false)
})

test('ci runs the security policy node tests', () => {
    const yaml = readFileSync('.github/workflows/ci.yml', 'utf8')
    assert.match(yaml, /node --test --test-concurrency=1 \.\/scripts\/security\/\*\.test\.mjs/)
})

test('dependency health fails closed and still runs later checks', () => {
    const yaml = readFileSync('.github/workflows/dependency-health.yml', 'utf8')
    assert.equal(yaml.includes('continue-on-error'), false)
    assert.match(yaml, /id:\s*setup/)
    assert.match(yaml, /run: pnpm audit --audit-level=high --prod\s*$/m)
    assert.match(yaml, /run: pnpm audit --audit-level=high\s*$/m)
    const guarded = yaml.match(/if: always\(\) && steps\.setup\.outcome == 'success'/g) ?? []
    assert.equal(guarded.length, 5)
})

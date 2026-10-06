import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

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
    assert.match(yaml, /pnpm audit --audit-level=high --prod/)
    assert.match(yaml, /pnpm audit --audit-level=high/)
    const guarded = yaml.match(/if: always\(\) && steps\.setup\.outcome == 'success'/g) ?? []
    assert.equal(guarded.length, 5)
})

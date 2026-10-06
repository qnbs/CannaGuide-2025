import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('devcontainer start does not signal an unrelated pid and bounds curl', () => {
    const start = readFileSync('.devcontainer/start.sh', 'utf8')
    assert.equal(start.includes('pkill'), false)
    assert.match(start, /iot-mocks\/src\/server\.mjs/)
    assert.match(start, /--connect-timeout 2/)
    assert.match(start, /--max-time 2/)
})

test('agent doctor fails when commit signing is off', () => {
    const doctor = readFileSync('scripts/agent-doctor.mjs', 'utf8')
    assert.match(doctor, /check\('git commit\.gpgsign', signing === 'true'/)
    assert.equal(doctor.includes('warnings.push'), true)
    assert.equal(doctor.includes('gpgsign is not true'), false)
})

test('vite define does not bake a commit into the cached bundle', () => {
    const vite = readFileSync('apps/web/vite.config.ts', 'utf8')
    const defineAt = vite.indexOf('define:')
    const pluginsAt = vite.indexOf('plugins:', defineAt)
    const define = vite.slice(defineAt, pluginsAt)
    assert.equal(define.includes('resolveCommitFromEnv'), false)
    assert.equal(define.includes('buildVersion'), false)
    assert.match(define, /npm_package_version/)
})

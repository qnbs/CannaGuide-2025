import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'

test('updater policy accepts the committed desktop config', () => {
    const out = execFileSync('node', ['scripts/security/check-updater-policy.mjs'], {
        encoding: 'utf8',
    })
    assert.match(out, /\[OK\]/)
})

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../check-node-engine.mjs', import.meta.url))
const nodeRange = '>=24.15.0 <25'

function check(t, pin, args = ['--pinned']) {
    const cwd = mkdtempSync(join(tmpdir(), 'cannaguide-node-pin-'))
    t.after(() => rmSync(cwd, { recursive: true, force: true }))
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ engines: { node: nodeRange } }))
    if (pin !== undefined) writeFileSync(join(cwd, '.node-version'), pin)
    return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' })
}

test('accepts the pinned runtime and a Windows line ending', (t) => {
    const result = check(t, `${process.versions.node}\r\n`)
    assert.equal(result.status, 0, result.stderr)
})

test('rejects missing, floating and unsupported pins', async (t) => {
    for (const pin of [undefined, '24', '24.14.0', '25.0.0', '26.0.0']) {
        await t.test(`${pin ?? 'missing'}`, (subtest) => {
            const result = check(subtest, pin)
            assert.equal(result.status, 1)
            assert.match(result.stderr, /\.node-version must pin an exact Node version/)
        })
    }
})

test('requires exact parity in CI and permits a compatible patch for local setup', (t) => {
    const [major, minor, patch] = process.versions.node.split('.').map(Number)
    const otherPatch = `${major}.${minor}.${patch + 1}`
    const ci = check(t, otherPatch)
    assert.equal(ci.status, 1)
    assert.match(ci.stderr, /differs from the \.node-version pin/)

    const local = check(t, otherPatch, [])
    assert.equal(local.status, 0, local.stderr)
})

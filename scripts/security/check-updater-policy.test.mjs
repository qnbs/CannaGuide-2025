import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { readCargoDependency, sameVersion, updaterPolicyProblems } from './check-updater-policy.mjs'

const conf = {
    plugins: {
        updater: {
            pubkey: 'A'.repeat(32),
            endpoints: ['https://example.com/update.json'],
        },
    },
}

test('updater policy accepts the committed desktop config', () => {
    const out = execFileSync('node', ['scripts/security/check-updater-policy.mjs'], {
        encoding: 'utf8',
    })
    assert.match(out, /\[OK\]/)
})

test('a Cargo comment cannot hide an older updater crate', () => {
    const cargoToml = `
[dependencies]
# tauri-plugin-updater = "2.13.1"
tauri-plugin-updater = "2.0.0"
`
    assert.equal(readCargoDependency(cargoToml, 'tauri-plugin-updater'), '2.0.0')
    const problems = updaterPolicyProblems({
        declared: '^2.13.1',
        cargoToml,
        conf,
    })
    assert.ok(problems.some((problem) => problem.includes('found "2.0.0"')))
})

test('the JS package and the Cargo crate must declare the same version', () => {
    const cargoToml = `
[package]
name = "example"
[dependencies]
tauri-plugin-updater = "2.12.0"
[dev-dependencies]
tauri-plugin-updater = "2.13.1"
`
    assert.equal(readCargoDependency(cargoToml, 'tauri-plugin-updater'), '2.12.0')
    assert.equal(sameVersion([2, 13, 1], [2, 12, 0]), false)
    const problems = updaterPolicyProblems({
        declared: '^2.13.1',
        cargoToml,
        conf,
    })
    assert.ok(problems.some((problem) => problem.includes('must declare the same version')))
})

test('an inline Cargo table version is read from dependencies only', () => {
    const cargoToml = `
[dependencies]
tauri-plugin-updater = { version = "2.13.1" } # not "2.0.0"
`
    assert.equal(readCargoDependency(cargoToml, 'tauri-plugin-updater'), '2.13.1')
})

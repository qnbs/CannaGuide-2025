import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { captureCommand, playwrightMajorMinorMatch } from './agent-doctor.mjs'
import { upsertBuildMeta } from './stamp-build-metadata.mjs'

const SHA = '40c2d9020cc8d01f8df0a4f6ecf6629d501c0eef'

test('devcontainer start does not signal an unrelated pid and bounds curl', () => {
    const start = readFileSync('.devcontainer/start.sh', 'utf8')
    assert.equal(start.includes('pkill'), false)
    assert.match(start, /iot-mocks\/src\/server\.mjs/)
    assert.match(start, /--connect-timeout 2/)
    assert.match(start, /--max-time 2/)
    assert.match(start, /pid_is_iot_mock "\$mock_pid"/)
})

test('a failed command cannot pass its stdout through as success', () => {
    const failed = captureCommand(process.execPath, [
        '-e',
        'process.stdout.write("9.9.9"); process.exit(1)',
    ])
    assert.equal(failed.ok, false)
    assert.equal(failed.stdout, '')
    assert.match(failed.detail, /exit code 1|Command failed/)
})

test('playwright image match uses major.minor, not a substring', () => {
    assert.equal(playwrightMajorMinorMatch('1.62.1', '^1.62.0'), true)
    assert.equal(playwrightMajorMinorMatch('1.62.1', '^1.63.0'), false)
    assert.equal(playwrightMajorMinorMatch('1.62.1', '^1.62.10'), true)
})

test('running build meta is stamped into the document head', () => {
    const build = `1.9.0+${SHA}`
    const stamped = upsertBuildMeta(
        '<html><head><title>x</title></head><body></body></html>',
        build,
    )
    assert.equal(stamped.includes(`<meta name="cannaguide-build" content="${build}">`), true)
    const replaced = upsertBuildMeta(stamped, `1.9.0+${'a'.repeat(40)}`)
    assert.equal(replaced.includes(build), false)
})

test('vite define does not bake a commit into the cached bundle', () => {
    const vite = readFileSync('apps/web/vite.config.ts', 'utf8')
    const defineAt = vite.indexOf('define:')
    const pluginsAt = vite.indexOf('plugins:', defineAt)
    assert.ok(defineAt >= 0 && pluginsAt > defineAt)
    const define = vite.slice(defineAt, pluginsAt)
    assert.equal(define.includes('resolveCommitFromEnv'), false)
    assert.equal(define.includes('buildVersion'), false)
    assert.match(define, /npm_package_version/)
})

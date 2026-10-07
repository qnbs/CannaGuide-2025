import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
    captureCommand,
    nodeSatisfiesDeclaredEngines,
    playwrightMajorMinorMatch,
    playwrightSpecsShareMinor,
} from './agent-doctor.mjs'
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
    assert.equal(playwrightSpecsShareMinor('^1.62.1', '^1.62.1'), true)
    assert.equal(playwrightSpecsShareMinor('^1.63.0', '^1.62.1'), false)
})

test('declared node engines accept 24.15 through 24.x and reject 24.14 and 25', () => {
    const range = JSON.parse(readFileSync('package.json', 'utf8')).engines.node
    assert.equal(range, '>=24.15.0 <25')
    assert.equal(nodeSatisfiesDeclaredEngines('24.15.0', range), true)
    assert.equal(nodeSatisfiesDeclaredEngines('24.21.0', range), true)
    assert.equal(nodeSatisfiesDeclaredEngines('v24.21.0', range), true)
    assert.equal(nodeSatisfiesDeclaredEngines('24.14.0', range), false)
    assert.equal(nodeSatisfiesDeclaredEngines('25.0.0', range), false)
    assert.equal(nodeSatisfiesDeclaredEngines('22.22.2', range), false)
    assert.equal(nodeSatisfiesDeclaredEngines('24.0.0', '>=24'), true)
    assert.equal(nodeSatisfiesDeclaredEngines('22.0.0', '>=24'), false)
})

test('playwright test and component packages stay on one release line', () => {
    const root = JSON.parse(readFileSync('package.json', 'utf8'))
    const web = JSON.parse(readFileSync('apps/web/package.json', 'utf8'))
    const testSpec = web.devDependencies['@playwright/test']
    const componentSpec = web.devDependencies['@playwright/experimental-ct-react']
    const rootSpec = root.devDependencies['@playwright/test']
    assert.equal(playwrightSpecsShareMinor(testSpec, componentSpec), true)
    assert.equal(playwrightSpecsShareMinor(testSpec, rootSpec), true)
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

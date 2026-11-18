import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import {
    appWindowId,
    evaluateExit,
    evaluateRecord,
    isolatedEnv,
    pixelSpread,
    runSmoke,
    windowStateFile,
} from './desktop-smoke.mjs'

const record = (frontend = {}) => ({
    schema: 1,
    nativeVersion: '1.12.1',
    os: 'linux',
    arch: 'x86_64',
    readyAfterMs: 900,
    frontend: {
        outcome: 'started',
        frontendVersion: '1.12.1',
        view: 'dialog',
        localOnly: false,
        savedSnapshotPresent: false,
        ...frontend,
    },
})

const failed = (results) => results.filter((r) => r.status === 'FAIL').map((r) => r.name)

test('a good first-start record passes; every field that matters can fail it', () => {
    assert.deepEqual(
        failed(evaluateRecord(record(), { version: '1.12.1', run: 'first-start' })),
        [],
    )
    assert.deepEqual(failed(evaluateRecord(undefined, { version: '1.12.1', run: 'first-start' })), [
        'first-start: startup report written',
    ])
    const bad = evaluateRecord(
        {
            ...record({
                outcome: 'error',
                detail: 'boom',
                view: 'none',
                frontendVersion: '1.12.0',
            }),
            nativeVersion: '1.12.0',
        },
        { version: '1.12.1', run: 'first-start' },
    )
    assert.deepEqual(failed(bad), [
        'first-start: native version',
        'first-start: bundled frontend version',
        'first-start: frontend start outcome',
        'first-start: rendered view',
    ])
    assert.match(bad.find((r) => r.name.endsWith('outcome')).detail, /error: boom/)
})

test('a restart must find the first run saved snapshot', () => {
    assert.deepEqual(
        failed(
            evaluateRecord(record({ savedSnapshotPresent: true }), {
                version: '1.12.1',
                run: 'restart',
            }),
        ),
        [],
    )
    assert.deepEqual(failed(evaluateRecord(record(), { version: '1.12.1', run: 'restart' })), [
        'restart: saved snapshot from the first run found',
    ])
})

test('the exit checks catch a non-zero exit, a timeout, a flush timeout and a panic', () => {
    const ok = evaluateExit({ run: 'r', exit: { code: 0, signal: null }, stderr: '' })
    assert.deepEqual(failed(ok), [])
    const bad = evaluateExit({
        run: 'r',
        exit: { code: null, signal: null, timedOut: true },
        stderr: "[quit] no flush confirmation from the frontend; exiting anyway\nthread 'main' panicked at src/lib.rs:1:1",
    })
    assert.deepEqual(failed(bad), [
        'r: quit exits with code 0',
        'r: quit waited for the frontend flush',
        'r: no panic',
    ])
})

test('isolation points every Linux and macOS app folder into the profile', () => {
    const linux = isolatedEnv('linux', '/p', { HOME: '/home/real', PATH: '/bin' })
    assert.equal(linux.HOME, '/p/home')
    for (const key of ['XDG_DATA_HOME', 'XDG_CONFIG_HOME', 'XDG_CACHE_HOME', 'XDG_STATE_HOME']) {
        assert.ok(linux[key].startsWith('/p/'), key)
    }
    assert.equal(linux.PATH, '/bin')
    const mac = isolatedEnv('darwin', '/p', { HOME: '/Users/real' })
    assert.equal(mac.HOME, '/p/home')
    assert.equal(mac.CFFIXED_USER_HOME, '/p/home')
    assert.equal(
        windowStateFile('linux', '/p'),
        '/p/config/com.cannaguide.desktop/.window-state.json',
    )
})

test('pixel statistics parse, and garbage is not a number', () => {
    assert.equal(pixelSpread('0.1834\n'), 0.1834)
    assert.equal(pixelSpread(''), undefined)
    assert.equal(pixelSpread('convert: not found'), undefined)
})

// A stand-in for the packaged app, driven by FAKE_MODE. It follows the same contract
// as startup.rs: report to CANNAGUIDE_SMOKE_REPORT, hold until <report>.quit, and a
// second launch on a live profile hands over and exits 0 (single instance).
const FAKE_APP = `
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const mode = process.env.FAKE_MODE
const report = process.env.CANNAGUIDE_SMOKE_REPORT
const config = join(process.env.XDG_CONFIG_HOME, 'com.cannaguide.desktop')
const live = join(process.env.HOME, 'instance.lock')
const saved = join(process.env.HOME, 'saved')
if (mode === 'panic') {
    console.error("thread 'main' panicked at src/lib.rs:215:10:\\nerror while building tauri application")
    process.exit(101)
}
if (existsSync(live) && mode !== 'no-single-instance') process.exit(0)
writeFileSync(live, '')
writeFileSync(report, JSON.stringify({
    schema: 1, nativeVersion: '1.12.1', os: 'linux', arch: 'x86_64', readyAfterMs: 5,
    frontend: { outcome: 'started', frontendVersion: '1.12.1', view: 'app', localOnly: false,
        savedSnapshotPresent: existsSync(saved) },
}))
const quit = () => {
    if (mode === 'flush-timeout') console.error('[quit] no flush confirmation from the frontend; exiting anyway')
    writeFileSync(saved, '')
    mkdirSync(config, { recursive: true })
    writeFileSync(join(config, '.window-state.json'), '{}')
    rmSync(live, { force: true })
    process.exit(0)
}
if (process.env.CANNAGUIDE_SMOKE_HOLD) {
    const timer = setInterval(() => { if (existsSync(report + '.quit')) { clearInterval(timer); quit() } }, 50)
} else {
    setTimeout(quit, 50)
}
`

const withFakeApp = async (t, mode) => {
    const dir = mkdtempSync(join(tmpdir(), 'cannaguide-fake-desktop-'))
    t.after(() => rmSync(dir, { recursive: true, force: true }))
    writeFileSync(join(dir, 'fake.mjs'), FAKE_APP)
    const app = join(dir, 'app')
    writeFileSync(
        app,
        `#!/bin/sh\nFAKE_MODE=${mode} exec "${process.execPath}" "${join(dir, 'fake.mjs')}" "$@"\n`,
    )
    chmodSync(app, 0o755)
    const display = process.env.DISPLAY
    delete process.env.DISPLAY
    t.after(() => {
        if (display !== undefined) process.env.DISPLAY = display
    })
    return runSmoke({
        app,
        expectVersion: '1.12.1',
        label: `fake-${mode}`,
        evidence: join(dir, 'evidence'),
        appimage: false,
        reportTimeoutSeconds: 10,
    })
}

const skipOnWindows = {
    skip: process.platform === 'win32' ? 'the stand-in app is a shell script' : false,
}

test('a cooperating app passes both runs', skipOnWindows, async (t) => {
    const { summary, passed } = await withFakeApp(t, 'good')
    assert.deepEqual(failed(summary.results), [])
    assert.ok(passed)
    const names = summary.results.map((r) => r.name)
    for (const expected of [
        'second instance: hands over and exits',
        'first-start: quit exits with code 0',
        'restart: saved snapshot from the first run found',
        'restart: window state saved by the first run',
    ]) {
        assert.ok(names.includes(expected), expected)
    }
    assert.equal(
        summary.results.find((r) => r.name === 'first-start: window painted').status,
        'NOT_RUN',
    )
})

test('the v1.12.0 startup panic fails the smoke test', skipOnWindows, async (t) => {
    const { summary, passed } = await withFakeApp(t, 'panic')
    assert.equal(passed, false)
    assert.deepEqual(failed(summary.results), [
        'first-start: startup report written',
        'first-start: quit exits with code 0',
        'first-start: no panic',
    ])
    assert.equal(summary.results.at(-1).status, 'NOT_RUN')
})

test('a second instance that starts its own frontend fails', skipOnWindows, async (t) => {
    const { summary } = await withFakeApp(t, 'no-single-instance')
    assert.deepEqual(failed(summary.results), ['second instance: hands over and exits'])
})

test('a quit that only ends by the flush timeout fails', skipOnWindows, async (t) => {
    const { summary } = await withFakeApp(t, 'flush-timeout')
    assert.deepEqual(failed(summary.results), [
        'first-start: quit waited for the frontend flush',
        'restart: quit waited for the frontend flush',
    ])
})

test('the screenshot targets the app window by title, never the root window', () => {
    const tree = [
        'xwininfo: Window id: 0x5c5 (the root window) (has no name)',
        '  Root window id: 0x5c5 (the root window) (has no name)',
        '     0x1e00003 "Terminal": ("mate-terminal" "Mate-terminal")  800x600+10+10  +10+10',
        '     0x3a00007 "CannaGuide 2025": ("cannaguide-desktop" "Cannaguide-desktop")  1280x800+0+0  +0+0',
    ].join('\n')
    assert.equal(appWindowId(tree), '0x3a00007')
    assert.equal(appWindowId('     0x1e00003 "Terminal": ()'), undefined)
    assert.equal(appWindowId(''), undefined)
})

import assert from 'node:assert/strict'
import {
    chmodSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import {
    appWindowId,
    appWindows,
    windowPid,
    evaluateExit,
    evaluateQuitAck,
    evaluateRecord,
    isolatedEnv,
    pixelSpread,
    REPORT_SCHEMA,
    runSmoke,
    windowStateFile,
} from './desktop-smoke.mjs'

const record = (frontend = {}) => ({
    schema: REPORT_SCHEMA,
    nativeVersion: '1.12.1',
    os: 'linux',
    arch: 'x86_64',
    readyAfterMs: 900,
    frontend: {
        outcome: 'started',
        frontendVersion: '1.12.1',
        view: 'dialog',
        visible: true,
        hydration: 'snapshot',
        localOnly: false,
        savedSnapshotPresent: true,
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
                errorCode: 'TypeError',
                view: 'none',
                frontendVersion: '1.12.0',
            }),
            nativeVersion: '1.12.0',
            schema: 1,
        },
        { version: '1.12.1', run: 'first-start' },
    )
    assert.deepEqual(failed(bad), [
        'first-start: report schema',
        'first-start: native version',
        'first-start: bundled frontend version',
        'first-start: frontend start outcome',
        'first-start: rendered view',
    ])
    assert.match(bad.find((r) => r.name.endsWith('outcome')).detail, /error \(TypeError\)/)
})

test('a window that starts hidden fails, even with a rendered view', () => {
    assert.deepEqual(
        failed(
            evaluateRecord(record({ visible: false }), { version: '1.12.1', run: 'first-start' }),
        ),
        ['first-start: window visible'],
    )
})

test('a restart must load the saved snapshot; finding it on disk is not enough', () => {
    assert.deepEqual(failed(evaluateRecord(record(), { version: '1.12.1', run: 'restart' })), [])
    for (const hydration of ['fresh', 'backup', undefined]) {
        assert.deepEqual(
            failed(
                evaluateRecord(record({ hydration, savedSnapshotPresent: true }), {
                    version: '1.12.1',
                    run: 'restart',
                }),
            ),
            ['restart: state loaded from the saved snapshot'],
            String(hydration),
        )
    }
})

test('only an acknowledged quit with a successful save passes', () => {
    assert.equal(evaluateQuitAck({ schema: 2, saved: true }, 'r').status, 'PASS')
    assert.equal(evaluateQuitAck({ schema: 2, saved: false }, 'r').status, 'FAIL')
    assert.equal(evaluateQuitAck({ schema: 2, saved: null }, 'r').status, 'FAIL')
    const missing = evaluateQuitAck(undefined, 'r')
    assert.equal(missing.status, 'FAIL')
    assert.match(missing.detail, /did not go through confirm_quit/)
})

test('the exit checks catch a non-zero exit, a timeout, a failed kill, a flush timeout and a panic', () => {
    assert.deepEqual(
        failed(evaluateExit({ run: 'r', exit: { code: 0, signal: null }, stderr: '' })),
        [],
    )
    const bad = evaluateExit({
        run: 'r',
        exit: { code: null, signal: null, timedOut: true, killFailed: true },
        stderr: "[quit] no flush confirmation from the frontend; exiting anyway\nthread 'main' panicked at src/lib.rs:1:1",
    })
    assert.deepEqual(failed(bad), [
        'r: quit exits with code 0',
        'r: quit not ended by the flush timeout',
        'r: no panic',
    ])
    assert.equal(bad[0].detail, 'still running after a kill')
})

test('isolation points every Linux and macOS app folder into the profile', () => {
    const profile = join(tmpdir(), 'profile')
    const linux = isolatedEnv('linux', profile, { HOME: join(tmpdir(), 'real'), PATH: '/bin' })
    assert.equal(linux.HOME, join(profile, 'home'))
    for (const [key, dir] of [
        ['XDG_DATA_HOME', 'data'],
        ['XDG_CONFIG_HOME', 'config'],
        ['XDG_CACHE_HOME', 'cache'],
        ['XDG_STATE_HOME', 'state'],
    ]) {
        assert.equal(linux[key], join(profile, dir), key)
    }
    assert.equal(linux.PATH, '/bin')
    const mac = isolatedEnv('darwin', profile, { HOME: join(tmpdir(), 'real') })
    assert.equal(mac.HOME, join(profile, 'home'))
    assert.equal(mac.CFFIXED_USER_HOME, join(profile, 'home'))
    assert.equal(
        windowStateFile('linux', profile),
        join(profile, 'config', 'com.cannaguide.desktop', '.window-state.json'),
    )
    assert.equal(
        windowStateFile('darwin', profile),
        join(
            profile,
            'home',
            'Library',
            'Application Support',
            'com.cannaguide.desktop',
            '.window-state.json',
        ),
    )
})

test('pixel statistics parse, and garbage is not a number', () => {
    assert.equal(pixelSpread('0.1834\n'), 0.1834)
    assert.equal(pixelSpread(''), undefined)
    assert.equal(pixelSpread('convert: not found'), undefined)
})

test('the screenshot targets the largest app window by title, never the root window', () => {
    const tree = [
        'xwininfo: Window id: 0x5c5 (the root window) (has no name)',
        '  Root window id: 0x5c5 (the root window) (has no name)',
        '     0x1e00003 "Terminal": ("mate-terminal" "Mate-terminal")  800x600+10+10  +10+10',
        '     0x3a00001 "CannaGuide 2025": ("cannaguide-desktop" "Cannaguide-desktop")  10x10+0+0  +0+0',
        '     0x3a00007 "CannaGuide 2025": ("cannaguide-desktop" "Cannaguide-desktop")  1280x800+0+0  +0+0',
    ].join('\n')
    assert.equal(appWindowId(tree), '0x3a00007')
    assert.equal(appWindowId('     0x1e00003 "Terminal": ()'), undefined)
    assert.equal(appWindowId(''), undefined)
})

// A stand-in for the packaged app, driven by FAKE_MODE. It follows the contract of
// startup.rs and instance_lock.rs: report to CANNAGUIDE_SMOKE_REPORT; one instance per
// profile (an exclusive lock file; a later launch asks the first to show itself and
// exits 0); with HOLD it hides on .hide, records the restore, quits on .quit; a quit
// writes .quit-ack with the save result; a restart loads what the quit saved.
const FAKE_APP = `
import { existsSync, mkdirSync, openSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
// Written beside the final name and renamed, as startup.rs does.
const publish = (file, text) => {
    writeFileSync(file + '.partial', text)
    renameSync(file + '.partial', file)
}
if (process.env.FAKE_MARKER_DIR) writeFileSync(join(process.env.FAKE_MARKER_DIR, 'started-' + process.pid), '')
const mode = process.env.FAKE_MODE
const report = process.env.CANNAGUIDE_SMOKE_REPORT
const home = process.env.HOME
const configDir = process.platform === 'darwin'
    ? join(home, 'Library', 'Application Support', 'com.cannaguide.desktop')
    : join(process.env.XDG_CONFIG_HOME, 'com.cannaguide.desktop')
const lock = join(home, 'instance.lock')
const focus = join(home, 'focus')
const saved = join(home, 'saved')
if (mode === 'panic') {
    console.error("thread 'main' panicked at src/lib.rs:215:10:\\nerror while building tauri application")
    process.exit(101)
}
if (mode !== 'no-single-instance') {
    try {
        openSync(lock, 'wx')
    } catch {
        writeFileSync(focus, '')
        process.exit(0)
    }
}
const hydration = mode === 'fresh-restart' ? 'fresh' : existsSync(saved) ? 'snapshot' : 'fresh'
publish(report, JSON.stringify({
    schema: ${REPORT_SCHEMA}, nativeVersion: '1.12.1', os: process.platform, arch: process.arch, readyAfterMs: 5,
    frontend: { outcome: 'started', frontendVersion: '1.12.1', view: 'app', visible: true, hydration,
        localOnly: false, savedSnapshotPresent: existsSync(saved) },
}))
const quit = () => {
    if (mode === 'flush-timeout') {
        console.error('[quit] no flush confirmation from the frontend; exiting anyway')
    } else {
        publish(report + '.quit-ack', JSON.stringify({ schema: ${REPORT_SCHEMA}, saved: mode !== 'unsaved' }))
    }
    writeFileSync(saved, '')
    mkdirSync(configDir, { recursive: true })
    writeFileSync(join(configDir, '.window-state.json'), '{}')
    rmSync(lock, { force: true })
    process.exit(0)
}
if (process.env.CANNAGUIDE_SMOKE_HOLD) {
    let hidden = false
    const timer = setInterval(() => {
        if (!hidden && existsSync(report + '.hide')) {
            hidden = true
            publish(report + '.hidden', JSON.stringify({ visible: false }))
        }
        if (existsSync(focus) && mode !== 'no-restore') {
            rmSync(focus, { force: true })
            publish(report + '.restored', JSON.stringify({ visible: true, focused: true }))
        }
        if (existsSync(report + '.quit')) {
            clearInterval(timer)
            quit()
        }
    }, 50)
} else {
    setTimeout(quit, 50)
}
`

const withFakeApp = async (t, mode, extra = {}) => {
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
    const isProfile = (name) => name.startsWith('cannaguide-smoke-profile-')
    const before = new Set(readdirSync(tmpdir()).filter(isProfile))
    const result = await runSmoke({
        app,
        expectVersion: '1.12.1',
        label: `fake-${mode}`,
        evidence: join(dir, 'evidence'),
        appimage: false,
        reportTimeoutSeconds: 10,
        requireScreenshot: false,
        // How long the concurrent run waits for a second start; the stand-in starts in ms.
        settleMs: 2000,
        concurrentRounds: 2,
        ...extra,
    })
    const leftover = readdirSync(tmpdir()).filter((name) => isProfile(name) && !before.has(name))
    const evidenceKept = existsSync(join(dir, 'evidence', `fake-${mode}-smoke.json`))
    return { ...result, leftover, evidenceKept }
}

const skipOnWindows = {
    skip: process.platform === 'win32' ? 'the stand-in app is a shell script' : false,
}

test(
    'a cooperating app passes every run, and the profiles are removed',
    skipOnWindows,
    async (t) => {
        const { summary, passed, leftover, evidenceKept } = await withFakeApp(t, 'good')
        assert.deepEqual(failed(summary.results), [])
        assert.ok(passed)
        const names = summary.results.map((r) => r.name)
        for (const expected of [
            'second instance: first window hidden before the second launch',
            'second instance: hands over and exits 0',
            'second instance: first window shown again',
            'first-start: quit acknowledged after a successful save',
            'first-start: window state saved on quit',
            'restart: state loaded from the saved snapshot',
            'restart: quit acknowledged after a successful save',
            'concurrent launch: exactly one instance started',
            'concurrent launch: the running instance showed its window for the other',
        ]) {
            assert.ok(names.includes(expected), expected)
        }
        assert.equal(
            summary.results.find((r) => r.name === 'first-start: window painted').status,
            'NOT_RUN',
        )
        assert.deepEqual(leftover, [], 'no temporary profile stays behind')
        assert.ok(evidenceKept, 'the evidence stays')
    },
)

test('the v1.12.0 startup panic fails the smoke test', skipOnWindows, async (t) => {
    const { summary, passed } = await withFakeApp(t, 'panic')
    assert.equal(passed, false)
    assert.ok(failed(summary.results).includes('first-start: startup report written'))
    assert.ok(failed(summary.results).includes('first-start: no panic'))
    assert.equal(summary.results.find((r) => r.name === 'restart').status, 'NOT_RUN')
})

test(
    'without single-instance protection both the second and the concurrent launch fail',
    skipOnWindows,
    async (t) => {
        const { summary } = await withFakeApp(t, 'no-single-instance')
        const fails = failed(summary.results)
        assert.ok(fails.includes('second instance: hands over and exits 0'), fails.join(', '))
        assert.ok(
            fails.includes('concurrent launch: exactly one instance started'),
            fails.join(', '),
        )
    },
)

test(
    'a handover that does not show the running window fails, also for concurrent launches',
    skipOnWindows,
    async (t) => {
        const { summary } = await withFakeApp(t, 'no-restore')
        assert.deepEqual(failed(summary.results), [
            'second instance: first window shown again',
            'concurrent launch: the running instance showed its window for the other',
        ])
    },
)

test('a quit that only ends by the flush timeout fails', skipOnWindows, async (t) => {
    const { summary } = await withFakeApp(t, 'flush-timeout')
    const fails = failed(summary.results)
    for (const run of ['first-start', 'restart']) {
        assert.ok(fails.includes(`${run}: quit not ended by the flush timeout`), run)
        assert.ok(fails.includes(`${run}: quit acknowledged after a successful save`), run)
    }
})

test('a quit whose save failed fails, even with exit 0', skipOnWindows, async (t) => {
    const { summary } = await withFakeApp(t, 'unsaved')
    assert.deepEqual(failed(summary.results), [
        'first-start: quit acknowledged after a successful save',
        'restart: quit acknowledged after a successful save',
        'concurrent launch: its quit acknowledged a successful save',
    ])
})

test(
    'a restart that starts fresh fails although the snapshot is on disk',
    skipOnWindows,
    async (t) => {
        const { summary } = await withFakeApp(t, 'fresh-restart')
        assert.deepEqual(failed(summary.results), ['restart: state loaded from the saved snapshot'])
    },
)

test('a required screenshot that cannot run fails instead of NOT_RUN', skipOnWindows, async (t) => {
    const { summary } = await withFakeApp(t, 'good', { requireScreenshot: true })
    const painted = summary.results.find((r) => r.name === 'first-start: window painted')
    assert.equal(painted.status, 'FAIL')
    assert.match(painted.detail, /required but not run/)
})

test('the window owner comes from _NET_WM_PID, and windows are ordered by size', () => {
    assert.equal(windowPid('_NET_WM_PID(CARDINAL) = 4242'), 4242)
    assert.equal(windowPid('_NET_WM_PID:  not found.'), undefined)
    const windows = appWindows(
        [
            '     0x3a00001 "CannaGuide 2025": ("cannaguide-desktop" "x")  10x10+0+0  +0+0',
            '     0x3a00007 "CannaGuide 2025": ("cannaguide-desktop" "x")  1280x800+0+0  +0+0',
            '     0x1e00003 "Terminal": ("mate-terminal" "x")  800x600+10+10  +10+10',
        ].join('\n'),
    )
    assert.deepEqual(
        windows.map((window) => window.id),
        ['0x3a00007', '0x3a00001'],
    )
})

test(
    'Ctrl+C stops the held app and removes the profiles, exiting 130',
    skipOnWindows,
    async (t) => {
        const dir = mkdtempSync(join(tmpdir(), 'cannaguide-fake-desktop-'))
        t.after(() => rmSync(dir, { recursive: true, force: true }))
        writeFileSync(join(dir, 'fake.mjs'), FAKE_APP)
        const app = join(dir, 'app')
        writeFileSync(
            app,
            `#!/bin/sh\nFAKE_MODE=good exec "${process.execPath}" "${join(dir, 'fake.mjs')}" "$@"\n`,
        )
        chmodSync(app, 0o755)
        const markers = join(dir, 'markers')
        mkdirSync(markers)
        const isProfile = (name) => name.startsWith('cannaguide-smoke-profile-')
        const before = new Set(readdirSync(tmpdir()).filter(isProfile))
        const harness = fileURLToPath(new URL('./desktop-smoke.mjs', import.meta.url))
        const env = { ...process.env, FAKE_MARKER_DIR: markers }
        delete env.DISPLAY
        const child = spawn(
            process.execPath,
            [
                harness,
                '--app',
                app,
                '--expect-version',
                '1.12.1',
                '--evidence',
                join(dir, 'evidence'),
            ],
            { env, stdio: 'ignore' },
        )
        const exited = new Promise((done) => child.on('exit', (code) => done(code)))
        // Interrupt once the first, held instance is up.
        const deadline = Date.now() + 15_000
        while (readdirSync(markers).length === 0 && Date.now() < deadline) {
            await new Promise((done) => setTimeout(done, 100))
        }
        const started = readdirSync(markers).map((name) => Number(name.replace('started-', '')))
        assert.ok(started.length > 0, 'the stand-in app started')
        child.kill('SIGINT')
        assert.equal(await exited, 130)
        const isAlive = (pid) => {
            try {
                process.kill(pid, 0)
                return true
            } catch {
                return false
            }
        }
        // SIGKILL is sent before the harness exits; the killed process lingers only until
        // init has reaped it.
        const gone = Date.now() + 5000
        while (started.some(isAlive) && Date.now() < gone) {
            await new Promise((done) => setTimeout(done, 100))
        }
        assert.deepEqual(started.filter(isAlive), [], 'no stand-in app outlives the interrupt')
        const leftover = readdirSync(tmpdir()).filter(
            (name) => isProfile(name) && !before.has(name),
        )
        assert.deepEqual(leftover, [], 'no profile outlives the interrupt')
    },
)

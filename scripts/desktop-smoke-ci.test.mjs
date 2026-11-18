import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import {
    appBinary,
    findIn,
    findInstalled,
    main,
    msiInstallDir,
    readMsiLog,
    rosettaPlan,
    uninstallNsis,
    waitUntil,
} from './desktop-smoke-ci.mjs'

const tree = (t) => {
    const root = mkdtempSync(join(tmpdir(), 'cannaguide-smoke-ci-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    return root
}

test('an Intel bundle on Apple Silicon needs Rosetta; nothing else does', () => {
    assert.equal(
        rosettaPlan({ target: 'x86_64-apple-darwin', machine: 'arm64', rosettaWorks: false }),
        'install-rosetta',
    )
    assert.equal(
        rosettaPlan({ target: 'x86_64-apple-darwin', machine: 'arm64', rosettaWorks: true }),
        'launch',
    )
    assert.equal(
        rosettaPlan({ target: 'x86_64-apple-darwin', machine: 'x86_64', rosettaWorks: false }),
        'launch',
    )
    assert.equal(
        rosettaPlan({ target: 'aarch64-apple-darwin', machine: 'arm64', rosettaWorks: false }),
        'launch',
    )
})

test('bundles are found by kind, and a missing kind is undefined', (t) => {
    const root = tree(t)
    mkdirSync(join(root, 'deb'))
    writeFileSync(join(root, 'deb', 'CannaGuide 2025_1.12.1_amd64.deb'), '')
    assert.equal(
        findIn(join(root, 'deb'), /\.deb$/),
        join(root, 'deb', 'CannaGuide 2025_1.12.1_amd64.deb'),
    )
    assert.equal(findIn(join(root, 'appimage'), /\.AppImage$/), undefined)
})

test('the installed program is found by its exact name within the depth limit', (t) => {
    const root = tree(t)
    mkdirSync(join(root, 'Programs', 'CannaGuide 2025'), { recursive: true })
    writeFileSync(join(root, 'Programs', 'CannaGuide 2025', 'uninstall.exe'), '')
    writeFileSync(join(root, 'Programs', 'CannaGuide 2025', 'cannaguide-desktop.exe'), '')
    assert.equal(
        findInstalled([join(root, 'missing'), root], 'cannaguide-desktop.exe'),
        join(root, 'Programs', 'CannaGuide 2025', 'cannaguide-desktop.exe'),
    )
    assert.equal(
        findInstalled([root], 'cannaguide-desktop.exe', 0),
        undefined,
        'too deep for depth 0',
    )
    assert.equal(findInstalled([undefined, root], 'other.exe'), undefined)
})

// Windows has no POSIX execute bits, so chmod cannot set one there; the macOS bundle
// this test models is only ever looked at on macOS.
test(
    'the executable inside a .app bundle is the one with an exec bit',
    { skip: process.platform === 'win32' && 'no POSIX execute bits on Windows' },
    (t) => {
        const root = tree(t)
        const app = join(root, 'CannaGuide 2025.app')
        mkdirSync(join(app, 'Contents', 'MacOS'), { recursive: true })
        writeFileSync(join(app, 'Contents', 'MacOS', 'cannaguide-desktop'), '')
        chmodSync(join(app, 'Contents', 'MacOS', 'cannaguide-desktop'), 0o755)
        assert.equal(appBinary(app), join(app, 'Contents', 'MacOS', 'cannaguide-desktop'))
        assert.equal(appBinary(join(root, 'missing.app')), undefined)
    },
)

test('missing arguments are a usage error', (t) => {
    t.mock.method(console, 'error', () => {})
    assert.equal(main([]), 2)
    assert.equal(main(['--target', 'x86_64-unknown-linux-gnu']), 2)
    assert.equal(main(['--bogus']), 2)
})

test('the MSI program is taken from the INSTALLDIR its own log records', (t) => {
    // From the Windows run on #881 (c0143d0b): with an NSIS install present, the MSI
    // reused that per-user folder instead of Program Files.
    const log = [
        'Property(S): ProgramFiles64Folder = C:\\Program Files\\',
        'Property(S): INSTALLDIR = C:\\Users\\runneradmin\\AppData\\Local\\CannaGuide 2025\\',
        'Property(S): ALLUSERS = 1',
    ].join('\r\n')
    assert.equal(msiInstallDir(log), 'C:\\Users\\runneradmin\\AppData\\Local\\CannaGuide 2025\\')
    assert.equal(msiInstallDir('no such property'), undefined)

    const root = tree(t)
    const file = join(root, 'msi.log')
    writeFileSync(file, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(log, 'utf16le')]))
    assert.equal(
        msiInstallDir(readMsiLog(file)),
        'C:\\Users\\runneradmin\\AppData\\Local\\CannaGuide 2025\\',
    )
    assert.equal(readMsiLog(join(root, 'missing.log')), '')
})

test('outside a disposable GitHub-hosted runner it refuses before touching anything', (t) => {
    // CI runs these tests on a GitHub-hosted runner, so the refusal is forced here.
    const saved = { ...process.env }
    t.after(() => {
        for (const key of ['GITHUB_ACTIONS', 'RUNNER_ENVIRONMENT']) {
            if (saved[key] === undefined) delete process.env[key]
            else process.env[key] = saved[key]
        }
    })
    t.mock.method(console, 'error', () => {})
    for (const env of [{}, { GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'self-hosted' }]) {
        delete process.env.GITHUB_ACTIONS
        delete process.env.RUNNER_ENVIRONMENT
        Object.assign(process.env, env)
        assert.equal(
            main(['--target', 'x86_64-pc-windows-msvc', '--bundle-dir', '/nonexistent']),
            2,
            JSON.stringify(env),
        )
    }
})

test('waiting ends when the condition holds, and a late one does not count', () => {
    // A clock the test controls; each sleep overshoots by 5 ms, as real sleeps can.
    let now = 0
    const clock = { now: () => now, sleep: (ms) => (now += ms + 5) }
    assert.equal(
        waitUntil(() => now >= 50, 100, 40, clock),
        true,
    )
    now = 0
    // True from 100 ms on: first seen at 105 ms, after the deadline -- not accepted.
    assert.equal(
        waitUntil(() => now >= 100, 100, 40, clock),
        false,
    )
    assert.ok(now <= 105, 'no sleep ran past the deadline by more than its overshoot')
    now = 0
    assert.equal(
        waitUntil(() => true, 0, 40, clock),
        true,
        'a state already there counts',
    )
})

test('the NSIS uninstaller runs in place, and every way it can fail stops the sequence', () => {
    const app = join('/opt', 'CannaGuide 2025', 'cannaguide-desktop.exe')
    const calls = []
    const spawn = (result) => (command, options) => {
        calls.push({ command, options })
        return result
    }
    const gone = { exists: () => false, wait: (predicate) => predicate() }
    assert.deepEqual(uninstallNsis(app, { spawn: spawn({ status: 0 }), ...gone }), {
        removed: true,
        detail: 'removed',
    })
    // `_?=` last and unquoted, the program path quoted, bounded in time.
    // Built with the same join() as the code, so it holds on Windows separators too.
    const nsisDir = join('/opt', 'CannaGuide 2025')
    assert.equal(calls[0].command, `"${join(nsisDir, 'uninstall.exe')}" /S _?=${nsisDir}`)
    assert.equal(calls[0].options.shell, true)
    assert.ok(calls[0].options.timeout > 0)

    const failures = [
        [{ status: 2 }, 'uninstaller exited 2'],
        [{ status: null, signal: 'SIGKILL' }, 'uninstaller killed by SIGKILL'],
        [
            { status: null, error: new Error('spawnSync cmd.exe ETIMEDOUT') },
            'uninstaller spawnSync cmd.exe ETIMEDOUT',
        ],
    ]
    for (const [result, detail] of failures) {
        assert.deepEqual(uninstallNsis(app, { spawn: spawn(result), ...gone }), {
            removed: false,
            detail,
        })
    }
    // A folder cmd.exe might read (here & and parentheses) is refused before anything runs.
    const before = calls.length
    for (const folder of ['A&B', 'Program Files (x86)', '100%', 'a^b']) {
        const odd = join('/opt', folder, 'cannaguide-desktop.exe')
        assert.deepEqual(uninstallNsis(odd, { spawn: spawn({ status: 0 }), ...gone }), {
            removed: false,
            detail: `install folder ${join('/opt', folder)} has characters cmd.exe would interpret`,
        })
    }
    assert.equal(calls.length, before, 'the uninstaller was not started')
    // The runner's own folder shape passes.
    const plain = String.raw`C:\Users\runneradmin\AppData\Local\CannaGuide 2025`
    assert.ok(/^[\w .:\\/-]+$/.test(plain))
    // Exit 0 while the program stays: the uninstaller did not finish its job.
    const stays = uninstallNsis(app, {
        spawn: spawn({ status: 0 }),
        exists: () => true,
        wait: (predicate) => predicate(),
    })
    assert.equal(stays.removed, false)
    assert.match(stays.detail, /exited 0, but .* is still there/)
})

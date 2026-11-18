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

test('the executable inside a .app bundle is the one with an exec bit', (t) => {
    const root = tree(t)
    const app = join(root, 'CannaGuide 2025.app')
    mkdirSync(join(app, 'Contents', 'MacOS'), { recursive: true })
    writeFileSync(join(app, 'Contents', 'MacOS', 'cannaguide-desktop'), '')
    chmodSync(join(app, 'Contents', 'MacOS', 'cannaguide-desktop'), 0o755)
    assert.equal(appBinary(app), join(app, 'Contents', 'MacOS', 'cannaguide-desktop'))
    assert.equal(appBinary(join(root, 'missing.app')), undefined)
})

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

test('waiting for an uninstall ends when the program is gone, or at the deadline', () => {
    let checks = 0
    assert.equal(
        waitUntil(() => ++checks >= 3, 5000, 10),
        true,
    )
    assert.equal(checks, 3)
    const started = Date.now()
    assert.equal(
        waitUntil(() => false, 120, 20),
        false,
    )
    assert.ok(Date.now() - started >= 100, 'it waited up to the deadline')
})

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { desktopVersionProblems, main, readDesktopVersions } from './check-desktop-version.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')

test('the repository carries one version for the web and the desktop app', () => {
    const versions = readDesktopVersions(ROOT)
    assert.deepEqual(desktopVersionProblems(versions), [])
    assert.equal(new Set(Object.values(versions)).size, 1)
})

test('any drift, a missing version or a tag mismatch is reported', () => {
    const good = {
        'package.json': '1.12.0',
        'apps/web/package.json': '1.12.0',
        'apps/desktop/package.json': '1.12.0',
        'apps/desktop/src-tauri/tauri.conf.json': '1.12.0',
        'apps/desktop/src-tauri/Cargo.toml': '1.12.0',
        'apps/desktop/src-tauri/Cargo.lock': '1.12.0',
    }
    assert.deepEqual(desktopVersionProblems(good, 'v1.12.0'), [])
    assert.match(
        desktopVersionProblems({ ...good, 'apps/desktop/src-tauri/tauri.conf.json': '0.1.0' })[0],
        /tauri\.conf\.json: 0\.1\.0 \(expected 1\.12\.0\)/,
    )
    assert.match(
        desktopVersionProblems({ ...good, 'apps/desktop/src-tauri/Cargo.lock': undefined })[0],
        /no version/,
    )
    assert.match(desktopVersionProblems(good, 'v1.11.0')[0], /does not match v1\.12\.0/)
})

test('the CLI exits 0 on this repository and 2 on bad arguments', () => {
    const quiet = [console.log, console.error]
    console.log = console.error = () => undefined
    try {
        assert.equal(main([], ROOT), 0)
        assert.equal(main(['--tag'], ROOT), 2)
    } finally {
        ;[console.log, console.error] = quiet
    }
})

/** A minimal repository with every version location, in LF or CRLF. */
function fixtureRoot(t, { eol = '\n', version = '1.12.0', lock = {}, tauriConfig } = {}) {
    const root = mkdtempSync(path.join(tmpdir(), 'cannaguide-desktop-version-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const write = (file, text) => {
        mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
        writeFileSync(path.join(root, file), text.replaceAll('\n', eol))
    }
    write('package.json', `{\n  "version": "${version}"\n}\n`)
    write('apps/web/package.json', `{\n  "version": "${version}"\n}\n`)
    write('apps/desktop/package.json', `{\n  "version": "${version}"\n}\n`)
    write(
        'apps/desktop/src-tauri/tauri.conf.json',
        tauriConfig ?? `{\n  "version": "${version}"\n}\n`,
    )
    write(
        'apps/desktop/src-tauri/Cargo.toml',
        `[package]\nname = "cannaguide-desktop"\nversion = "${version}"\n\n[dependencies]\ntauri = { version = "2.11.0" }\n`,
    )
    write(
        'apps/desktop/src-tauri/Cargo.lock',
        `version = 4\n\n[[package]]\nname = "aaa-dependency"\nversion = "9.9.9"\n\n[[package]]\nname = "${lock.name ?? 'cannaguide-desktop'}"\nversion = "${lock.version ?? version}"\n`,
    )
    return root
}

const quietly = (fn) => {
    const saved = [console.log, console.error]
    console.log = console.error = () => undefined
    try {
        return fn()
    } finally {
        ;[console.log, console.error] = saved
    }
}

test('LF and CRLF checkouts read the same versions', (t) => {
    for (const eol of ['\n', '\r\n']) {
        const root = fixtureRoot(t, { eol })
        const versions = readDesktopVersions(root)
        assert.deepEqual(new Set(Object.values(versions)), new Set(['1.12.0']), JSON.stringify(eol))
        assert.equal(
            quietly(() => main(['--tag', 'v1.12.0'], root)),
            0,
        )
    }
})

test('a CRLF checkout still fails on real drift, a missing crate and malformed input', (t) => {
    const drift = readDesktopVersions(fixtureRoot(t, { eol: '\r\n', lock: { version: '1.11.0' } }))
    assert.match(
        desktopVersionProblems(drift).join('\n'),
        /Cargo\.lock: 1\.11\.0 \(expected 1\.12\.0\)/,
    )
    // The version of another crate is never taken for ours.
    const missing = readDesktopVersions(
        fixtureRoot(t, { eol: '\r\n', lock: { name: 'other-crate' } }),
    )
    assert.match(desktopVersionProblems(missing).join('\n'), /Cargo\.lock: no version/)

    const malformed = fixtureRoot(t, { eol: '\r\n', tauriConfig: '{ "version": ' })
    assert.equal(
        quietly(() => main([], malformed)),
        1,
    )
    assert.equal(
        quietly(() => main([], path.join(malformed, 'does-not-exist'))),
        1,
    )
})

test('web-only drift fails too (CodeAnt on #874)', (t) => {
    const root = fixtureRoot(t)
    writeFileSync(path.join(root, 'apps/web/package.json'), '{ "version": "0.0.1" }\n')
    assert.match(
        desktopVersionProblems(readDesktopVersions(root)).join('\n'),
        /apps\/web\/package\.json: 0\.0\.1 \(expected 1\.12\.0\)/,
    )
    assert.equal(
        quietly(() => main([], root)),
        1,
    )
})

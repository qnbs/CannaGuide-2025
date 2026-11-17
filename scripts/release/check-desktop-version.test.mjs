import assert from 'node:assert/strict'
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

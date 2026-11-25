import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { syntaxErrors, UNLINTED, unlintedScripts } from './check-script-syntax.mjs'

test('the scope is the JavaScript that ESLint ignores', () => {
    const files = unlintedScripts()
    for (const covered of [
        'scripts/check-i18n-hardcoded.mjs',
        'scripts/security/check-localstorage-usage.mjs',
        'apps/web/public/sw.js',
        'apps/web/tailwind.config.cjs',
    ]) {
        assert.ok(files.includes(covered), covered)
    }
    assert.ok(!files.includes('apps/web/index.tsx'))
    // Every service-worker path eslint.config.js ignores, whether or not it exists today.
    for (const worker of [
        'public/sw.js',
        'public/sw.mjs',
        'apps/web/public/sw.js',
        'apps/web/public/sw.mjs',
    ]) {
        assert.ok(
            UNLINTED.some((pattern) => pattern.test(worker)),
            worker,
        )
    }
    assert.ok(!UNLINTED.some((pattern) => pattern.test('apps/web/public/other.js')))
})

test('a script that does not parse is reported, and one that does is not', (t) => {
    const root = mkdtempSync(join(tmpdir(), 'cg-syntax-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(join(root, 'good.mjs'), "console.log('fine')\n")
    // The 2026-11-24 regression: an apostrophe inside a single-quoted string.
    writeFileSync(join(root, 'bad.mjs'), "console.log('the app's files')\n")
    const errors = syntaxErrors(['good.mjs', 'bad.mjs'], root)
    assert.deepEqual(
        errors.map(({ file }) => file),
        ['bad.mjs'],
    )
    assert.match(errors[0].detail, /SyntaxError/)
})

test('every unlinted script in the repository parses', () => {
    assert.deepEqual(syntaxErrors(unlintedScripts()), [])
})

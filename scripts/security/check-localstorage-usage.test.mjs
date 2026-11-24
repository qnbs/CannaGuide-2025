import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
    ALLOWED_PATTERNS,
    appSourceFiles,
    firstArgument,
    isShadowed,
    resolveConstant,
    stalePatterns,
    storageCalls,
    violations,
} from './check-localstorage-usage.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function fixture(t, files) {
    const root = mkdtempSync(join(tmpdir(), 'cg-storage-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    for (const [path, text] of Object.entries(files)) {
        mkdirSync(dirname(join(root, path)), { recursive: true })
        writeFileSync(join(root, path), text)
    }
    return root
}

test('the scope is all tracked web app source, without tests, locales or assets', () => {
    const files = appSourceFiles()
    for (const covered of [
        'apps/web/i18n.ts',
        'apps/web/index.tsx',
        'apps/web/lib/transformersOrtAssets.mjs',
        'apps/web/bootstrap/serviceWorker.ts',
        'apps/web/stores/useIotStore.ts',
    ]) {
        assert.ok(files.includes(covered), covered)
    }
    for (const file of files) {
        assert.doesNotMatch(
            file,
            /\.(test|spec)\.|\/tests\/|^apps\/web\/(locales|public)\/|\.d\.ts$/,
            file,
        )
    }
})

test('the first argument is read up to its top-level comma or paren', () => {
    const source = "localStorage.setItem(key(a, b), JSON.stringify({ x: ')' }))"
    assert.equal(firstArgument(source, source.indexOf('(') + 1), 'key(a, b)')
    const call = "getItem('a,b')"
    assert.equal(firstArgument(call, call.indexOf('(') + 1), "'a,b'")
    assert.equal(firstArgument('getItem(`k`', 8), null)
})

test('a constant resolves in the file, through an alias, an import and a re-export', (t) => {
    const root = fixture(t, {
        'apps/web/constants.ts': "export const BASE_KEY = 'cg.ai.auditLog'\n",
        'apps/web/keys/index.ts':
            "export { BASE_KEY } from '../constants'\nexport const OTHER = 'x' as const\n",
        'apps/web/a.ts': [
            "import { BASE_KEY as LOG } from '@/keys'",
            "import { OTHER } from './keys'",
            "const LOCAL: string = 'cg.ai.costTracker'",
            'const ALIAS = LOCAL',
            'const COMPUTED = `cg.${x}`',
        ].join('\n'),
    })
    assert.equal(resolveConstant('apps/web/a.ts', 'LOCAL', root), 'cg.ai.costTracker')
    assert.equal(resolveConstant('apps/web/a.ts', 'ALIAS', root), 'cg.ai.costTracker')
    assert.equal(resolveConstant('apps/web/a.ts', 'LOG', root), 'cg.ai.auditLog')
    assert.equal(resolveConstant('apps/web/a.ts', 'OTHER', root), 'x')
    assert.equal(resolveConstant('apps/web/a.ts', 'COMPUTED', root), null)
    assert.equal(resolveConstant('apps/web/a.ts', 'MISSING', root), null)
})

test('calls are classified by how their key is known, including a persisted store', (t) => {
    const root = fixture(t, {
        'apps/web/s.ts': [
            "const KEY = 'cg.ai.activeProvider'",
            "localStorage.getItem('cg.ai.auditLog')",
            'localStorage.setItem(KEY, value)',
            'sessionStorage.removeItem(keyFor(id))',
            "persist(store, { name: 'cannaguide-iot-settings', storage: createJSONStorage(() => localStorage) })",
        ].join('\n'),
    })
    const calls = storageCalls(
        'apps/web/s.ts',
        readFileSync(join(root, 'apps/web/s.ts'), 'utf8'),
        root,
    )
    assert.deepEqual(
        calls.map(({ kind, key, method, storage }) => ({ kind, key, method, storage })),
        [
            { kind: 'literal', key: 'cg.ai.auditLog', method: 'getItem', storage: 'localStorage' },
            {
                kind: 'constant',
                key: 'cg.ai.activeProvider',
                method: 'setItem',
                storage: 'localStorage',
            },
            { kind: 'dynamic', key: undefined, method: 'removeItem', storage: 'sessionStorage' },
            {
                kind: 'persist',
                key: 'cannaguide-iot-settings',
                method: 'setItem',
                storage: 'localStorage',
            },
        ],
    )
})

test('a constant name that a parameter or local binding shadows counts as computed', (t) => {
    const source = [
        "const KEY = 'cg.ai.auditLog'",
        'function save(KEY, value) {',
        '    localStorage.setItem(KEY, value)',
        '}',
        'localStorage.getItem(OTHER)',
        "const OTHER = 'cg.ai.costTracker'",
    ].join('\n')
    const root = fixture(t, { 'apps/web/shadow.ts': source })
    const calls = storageCalls('apps/web/shadow.ts', source, root)
    // save('raw_api_key', value) would otherwise pass as the allowed constant.
    assert.deepEqual(
        calls.map(({ expression, kind, key }) => ({ expression, kind, key })),
        [
            { expression: 'KEY', kind: 'dynamic', key: undefined },
            { expression: 'OTHER', kind: 'constant', key: 'cg.ai.costTracker' },
        ],
    )
    for (const shadowing of [
        '(KEY) => localStorage.getItem(KEY)',
        'KEY => 1',
        'let KEY = x',
        'try {} catch (KEY) {}',
        "const KEY = 'a'\n{ const KEY = 'b' }",
        'method(a, ...KEY) {}',
    ]) {
        assert.equal(isShadowed(shadowing, 'KEY'), true, shadowing)
    }
    assert.equal(isShadowed("const KEY = 'a'\nlocalStorage.getItem(KEY)", 'KEY'), false)
})

test('the persisted store name comes from its own options object, in any order', (t) => {
    const source = [
        "const unrelated = { name: 'cannaguide-iot-settings' }",
        'export const useStore = create(persist(state, {',
        '    storage: createJSONStorage(() => localStorage),',
        "    partialize: (s) => ({ name: 'not-this-one' }),",
        "    name: 'raw-secret-store',",
        '}))',
    ].join('\n')
    const root = fixture(t, { 'apps/web/store.ts': source })
    const [persisted] = storageCalls('apps/web/store.ts', source, root)
    assert.equal(persisted.kind, 'persist')
    assert.equal(persisted.key, 'raw-secret-store')
})

const call = (fields) => ({ file: 'apps/web/x.ts', line: 1, storage: 'localStorage', ...fields })

test('unknown keys, unreviewed computed keys and stale review entries fail', () => {
    const reviewed = [
        {
            file: 'apps/web/x.ts',
            expression: 'k(a)',
            methods: ['getItem'],
            example: 'cg.ai.consent.a',
        },
        {
            file: 'apps/web/x.ts',
            expression: 'gone()',
            methods: ['getItem'],
            example: 'cg.ai.consent.a',
        },
        {
            file: 'apps/web/x.ts',
            expression: 'all',
            methods: ['getItem', 'removeItem'],
            example: null,
        },
    ]
    const reasons = violations(
        [
            call({ kind: 'constant', key: 'raw_api_key', method: 'setItem' }),
            call({ kind: 'literal', key: 'cg.ai.auditLog', method: 'setItem' }),
            call({ kind: 'dynamic', expression: 'unknown(x)', method: 'getItem' }),
            call({ kind: 'dynamic', expression: 'k(a)', method: 'getItem' }),
            call({ kind: 'dynamic', expression: 'k(a)', method: 'setItem' }),
            call({ kind: 'dynamic', expression: 'all', method: 'removeItem' }),
        ],
        reviewed,
    ).map(({ reason }) => reason)
    assert.deepEqual(reasons, [
        'key "raw_api_key" not in allowlist',
        'computed key `unknown(x)` is not reviewed',
        'computed key `k(a)` is reviewed for getItem only, not setItem',
        'a reviewed read-every-key site may only read',
        'stale review entry `gone()`',
    ])
})

test('a legacy key may be read and removed, never written again', () => {
    const legacy = (method) => call({ kind: 'constant', key: 'cg.crypto.key.v1', method })
    assert.deepEqual(violations([legacy('getItem'), legacy('removeItem')], []), [])
    assert.deepEqual(
        violations([legacy('setItem')], []).map(({ reason }) => reason),
        ['key "cg.crypto.key.v1" not in allowlist'],
    )
})

test('an allowlist pattern that no key uses fails as stale', () => {
    const stale = stalePatterns(
        [call({ kind: 'literal', key: 'cg.ai.auditLog' })],
        [/^cg\.ai\./, /^gemini_key_/],
        [],
    )
    assert.deepEqual(
        stale.map(({ reason }) => reason),
        ['allowlist pattern /^gemini_key_/ matches no key any more'],
    )
    // Raw provider keys have no allowance any more.
    for (const key of ['gemini_key_x', 'openai_key_x', 'xai_key_x', 'anthropic_key_x']) {
        assert.ok(!ALLOWED_PATTERNS.some((pattern) => pattern.test(key)), key)
    }
})

test('the real tree passes: every key is allowed, reviewed, and every pattern is used', () => {
    const calls = appSourceFiles().flatMap((file) =>
        storageCalls(file, readFileSync(join(ROOT, file), 'utf8')),
    )
    assert.ok(calls.length > 90, `only ${calls.length} storage calls found`)
    assert.deepEqual([...violations(calls), ...stalePatterns(calls)], [])
})

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
    maskComments,
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

test('a commented-out name, or a comma inside a string, is not the store name', (t) => {
    const sources = {
        'apps/web/after.ts': [
            'persist(store, {',
            '    storage: createJSONStorage(() => localStorage),',
            "    // Previously used, name: 'cannaguide-iot-settings'",
            "    name: 'raw-secret-store',",
            '})',
        ].join('\n'),
        'apps/web/before.ts': [
            'persist(store, {',
            "    /* old, name: 'cannaguide-iot-settings' */",
            "    name: 'raw-secret-store',",
            "    note: 'a, name: cannaguide-iot-settings',",
            '    storage: createJSONStorage(() => localStorage),',
            '})',
        ].join('\n'),
        'apps/web/only-comment.ts': [
            'persist(store, {',
            "    // name: 'cannaguide-iot-settings',",
            '    storage: createJSONStorage(() => localStorage),',
            '})',
        ].join('\n'),
    }
    const root = fixture(t, sources)
    const keyOf = (file) => storageCalls(file, sources[file], root)[0]
    assert.equal(keyOf('apps/web/after.ts').key, 'raw-secret-store')
    assert.equal(keyOf('apps/web/before.ts').key, 'raw-secret-store')
    // No live name: the store counts as computed and needs a review.
    assert.equal(keyOf('apps/web/only-comment.ts').kind, 'dynamic')
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

test('a commented-out call is not a call, and masking keeps code after a regex literal', () => {
    const source = [
        "// localStorage.setItem('installed_plugins_v1', value)",
        "/* sessionStorage.getItem(ANY) */ localStorage.getItem('cg.ai.auditLog')",
        "const url = /https?:\\/\\// ; localStorage.removeItem('cg.ai.costTracker')",
        'const quote = /[\'"]/',
        "localStorage.getItem('cg.ai.auditLog')",
    ].join('\n')
    assert.equal(maskComments(source).split('\n').length, 5)
    const calls = storageCalls('apps/web/masked.ts', source)
    assert.deepEqual(
        calls.map(({ line, key }) => [line, key]),
        [
            [2, 'cg.ai.auditLog'],
            [3, 'cg.ai.costTracker'],
            [5, 'cg.ai.auditLog'],
        ],
    )
})

test('a backtick inside a regex literal opens no template that shifts the masking', () => {
    // Read as a template opener, the regex's backtick kept the commented-out call below as code
    // and turned the real template on line 3 into code, whose `//` then hid the real call.
    const source = [
        'const tick = /`/',
        "// localStorage.setItem('installed_plugins_v1', value)",
        "const note = `a // b`; localStorage.getItem('cg.ai.auditLog')",
        'const quotes = /[`\'"]/g.test(value)',
        "localStorage.removeItem('cg.ai.costTracker')",
        'const half = total / 2 / count',
        "localStorage.setItem('cg.ai.auditLog', `x`)",
    ].join('\n')
    const calls = storageCalls('apps/web/regex.ts', source)
    assert.deepEqual(
        calls.map(({ line, key }) => [line, key]),
        [
            [3, 'cg.ai.auditLog'],
            [5, 'cg.ai.costTracker'],
            [7, 'cg.ai.auditLog'],
        ],
    )
})

test('a constant that continues past its line is computed, a one-line one resolves', (t) => {
    const root = fixture(t, {
        'apps/web/multi.ts': "export const KEY = 'cg.ai.auditLog'\n    + '.private'\n",
        'apps/web/single.ts': "export const KEY = 'cg.ai.auditLog'\nexport const OTHER = 1\n",
    })
    assert.equal(resolveConstant('apps/web/multi.ts', 'KEY', root), null)
    assert.equal(resolveConstant('apps/web/single.ts', 'KEY', root), 'cg.ai.auditLog')
})

test('destructured bindings and parameters shadow a constant; a condition does not', () => {
    for (const shadowing of [
        'function save({ KEY }) {}',
        'const load = ([KEY]) => KEY',
        'function f(value = KEY) {}',
        'const { KEY } = settings',
        'let [first, KEY] = pair',
        'for (const KEY of keys) {}',
    ]) {
        assert.equal(isShadowed(`const KEY = 'a'\n${shadowing}`, 'KEY'), true, shadowing)
    }
    for (const plain of ['if (stored !== KEY) {}', 'while (KEY) {}', 'other.KEY_SUFFIX']) {
        assert.equal(isShadowed(`const KEY = 'a'\n${plain}`, 'KEY'), false, plain)
    }
})

test('the last persisted name wins, and a spread after it makes the name unknown', (t) => {
    const sources = {
        'apps/web/spread.ts': [
            'persist(store, {',
            "    name: 'cannaguide-iot-settings',",
            '    storage: createJSONStorage(() => localStorage),',
            "    ...{ name: 'raw-secret-store' },",
            '})',
        ].join('\n'),
        'apps/web/spread-first.ts': [
            'persist(store, {',
            '    ...defaults,',
            "    name: 'cannaguide-iot-settings',",
            '    storage: createJSONStorage(() => localStorage),',
            '})',
        ].join('\n'),
        'apps/web/twice.ts': [
            'persist(store, {',
            "    name: 'cannaguide-iot-settings',",
            '    storage: createJSONStorage(() => localStorage),',
            "    name: 'raw-secret-store',",
            '})',
        ].join('\n'),
    }
    const root = fixture(t, sources)
    const first = (file) => storageCalls(file, sources[file], root)[0]
    assert.equal(first('apps/web/spread.ts').kind, 'dynamic')
    assert.equal(first('apps/web/spread-first.ts').key, 'cannaguide-iot-settings')
    assert.equal(first('apps/web/twice.ts').key, 'raw-secret-store')
})

test('a persisted name is known only when it is one complete literal', (t) => {
    const store = (...nameLines) =>
        [
            'persist(store, {',
            '    storage: createJSONStorage(() => localStorage),',
            ...nameLines,
            '})',
        ].join('\n')
    const sources = {
        // Each of these starts with an allowed literal, but writes under another key.
        'apps/web/concat.ts': store("    name: 'cannaguide-iot-settings' + '-private',"),
        'apps/web/ternary.ts': store("    name: 'cannaguide-iot-settings' ? a : b,"),
        'apps/web/later.ts': store("    name: 'cannaguide-iot-settings',", '    name: suffixed,'),
        'apps/web/shorthand.ts': store("    name: 'cannaguide-iot-settings',", '    name,'),
        // A literal stays known: last property, before a comment, or before a comma.
        'apps/web/last.ts': store("    name: 'cannaguide-iot-settings'"),
        'apps/web/commented.ts': store("    name: 'cannaguide-iot-settings' /* store */,"),
        'apps/web/literal-wins.ts': store(
            '    name: suffixed,',
            "    name: 'cannaguide-iot-settings',",
        ),
    }
    const root = fixture(t, sources)
    const first = (file) => storageCalls(file, sources[file], root)[0]
    for (const file of ['concat', 'ternary', 'later', 'shorthand']) {
        assert.equal(first(`apps/web/${file}.ts`).kind, 'dynamic', file)
    }
    for (const file of ['last', 'commented', 'literal-wins']) {
        assert.deepEqual(
            [first(`apps/web/${file}.ts`).kind, first(`apps/web/${file}.ts`).key],
            ['persist', 'cannaguide-iot-settings'],
            file,
        )
    }
})

test('a comment inside the call is no part of its key', (t) => {
    const source = [
        "localStorage.getItem(/* cache */ 'cg.ai.auditLog')",
        "localStorage.setItem('cg.ai.auditLog' /* trailing */, value)",
        'localStorage.removeItem(/* every */ storedKey)',
    ].join('\n')
    const root = fixture(t, { 'apps/web/commented-call.ts': source })
    const calls = storageCalls('apps/web/commented-call.ts', source, root)
    assert.deepEqual(
        calls.map(({ kind, key, expression }) => [kind, key ?? expression]),
        [
            ['literal', 'cg.ai.auditLog'],
            ['literal', 'cg.ai.auditLog'],
            ['dynamic', 'storedKey'],
        ],
    )
    // The computed key matches its review entry, which names the expression without the comment.
    const reviewed = [
        {
            file: 'apps/web/commented-call.ts',
            expression: 'storedKey',
            methods: ['removeItem'],
            example: 'cg.ai.auditLog',
        },
    ]
    assert.deepEqual(violations(calls, reviewed), [])
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

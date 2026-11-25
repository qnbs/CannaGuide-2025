import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
    ALLOWED_PATTERNS,
    appSourceFiles,
    resolveConstant,
    stalePatterns,
    storageCalls,
    violations,
} from './check-localstorage-usage.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** The kind and key of each storage call in `snippet`, below `const KEY = 'cg.ai.auditLog'`. */
function keyIn(snippet) {
    const source = `const KEY = 'cg.ai.auditLog'\n${snippet}`
    return storageCalls('apps/web/scope.ts', source).map(({ kind, key }) => [kind, key])
}

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

test('the key argument is read from the call, and an unreadable one fails', (t) => {
    const source = [
        "localStorage.setItem(key(a, b), JSON.stringify({ x: ')' }))",
        "localStorage.getItem('a,b')",
        'localStorage.getItem()',
        'localStorage.removeItem(...keys)',
    ].join('\n')
    const calls = storageCalls('apps/web/args.ts', source, fixture(t, {}))
    assert.deepEqual(
        calls.map(({ kind, key, expression }) => [kind, key ?? expression]),
        [
            ['dynamic', 'key(a, b)'],
            ['literal', 'a,b'],
            ['unparsed', ''],
            ['unparsed', '...keys'],
        ],
    )
    // No review entry can approve a key nobody can read.
    const reviewed = [
        {
            file: 'apps/web/args.ts',
            expression: '...keys',
            methods: ['removeItem'],
            example: 'cg.ai.auditLog',
        },
    ]
    assert.deepEqual(
        violations(calls, reviewed).map(({ reason }) => reason),
        [
            'computed key `key(a, b)` is not reviewed',
            'key "a,b" not in allowlist',
            'the call passes no key',
            'a spread key argument cannot be read',
            'stale review entry `...keys`',
        ],
    )
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
        'apps/web/barrel.ts': [
            "export * from './constants'",
            "const INNER = 'cg.ai.monthlyBudget'",
            'export { INNER as OUTER }',
        ].join('\n'),
    })
    assert.equal(resolveConstant('apps/web/a.ts', 'LOCAL', root), 'cg.ai.costTracker')
    assert.equal(resolveConstant('apps/web/a.ts', 'ALIAS', root), 'cg.ai.costTracker')
    assert.equal(resolveConstant('apps/web/a.ts', 'LOG', root), 'cg.ai.auditLog')
    assert.equal(resolveConstant('apps/web/a.ts', 'OTHER', root), 'x')
    assert.equal(resolveConstant('apps/web/a.ts', 'COMPUTED', root), null)
    assert.equal(resolveConstant('apps/web/a.ts', 'MISSING', root), null)
    assert.equal(resolveConstant('apps/web/barrel.ts', 'BASE_KEY', root), 'cg.ai.auditLog')
    assert.equal(resolveConstant('apps/web/barrel.ts', 'OUTER', root), 'cg.ai.monthlyBudget')
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
        'const read = (KEY) => localStorage.getItem(KEY)',
        'const read = KEY => localStorage.getItem(KEY)',
        '{ let KEY = x; localStorage.getItem(KEY) }',
        'try {} catch (KEY) { localStorage.getItem(KEY) }',
        'class A { method(a, ...KEY) { localStorage.getItem(KEY) } }',
        // A var anywhere in the function is hoisted over the call.
        'function load() { localStorage.getItem(KEY); if (x) { var KEY = raw } }',
        // Declared twice in one scope: which one the call sees is unknown.
        "const KEY = 'raw_api_key'\nlocalStorage.getItem(KEY)",
    ]) {
        assert.deepEqual(keyIn(shadowing), [['dynamic', undefined]], shadowing)
    }
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

test('a commented-out call is not a call, and code after a regex literal is read', () => {
    const source = [
        "// localStorage.setItem('installed_plugins_v1', value)",
        "/* sessionStorage.getItem(ANY) */ localStorage.getItem('cg.ai.auditLog')",
        "const url = /https?:\\/\\// ; localStorage.removeItem('cg.ai.costTracker')",
        'const quote = /[\'"]/',
        "localStorage.getItem('cg.ai.auditLog')",
    ].join('\n')
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
        // Divisions after a name that is also a keyword: the comment must stay a comment.
        'const of = 8',
        "const ratio = of / 2 // localStorage.setItem('raw_api_key', value)",
        "const share = box.return / 2 // localStorage.setItem('raw_api_key', value)",
        // A division continued on its own line: the line start counts as a regex start.
        'const wrapped = total',
        "    / 2 // localStorage.setItem('raw_api_key', value)",
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

test('a name with a $ is matched as one whole identifier, so shadowing still counts', (t) => {
    // `$` is legal in an identifier but an anchor in a pattern, and \b sees no boundary
    // before it: unescaped, the shadowed import below resolved and passed the gate.
    const root = fixture(t, {
        'apps/web/keys.ts': "export const $KEY = 'cg.ai.auditLog'\n",
        'apps/web/declared.ts': "const $KEY = 'cg.ai.auditLog'\nlocalStorage.getItem($KEY)\n",
        'apps/web/shadowed.ts': [
            "import { $KEY } from './keys'",
            'function load($KEY) {',
            '    return localStorage.getItem($KEY)',
            '}',
        ].join('\n'),
    })
    const first = (file) => storageCalls(file, readFileSync(join(root, file), 'utf8'), root)[0]
    assert.deepEqual(
        [first('apps/web/declared.ts').kind, first('apps/web/declared.ts').key],
        ['constant', 'cg.ai.auditLog'],
    )
    assert.equal(first('apps/web/shadowed.ts').kind, 'dynamic')
    const kinds = (source) => storageCalls('apps/web/dollar.ts', source, root).map((c) => c.kind)
    const outer = "const $KEY = 'cg.ai.auditLog'\n"
    // A default value with its own parentheses still leaves $KEY a parameter.
    assert.deepEqual(
        kinds(`${outer}function save($KEY, fallback = make()) { localStorage.setItem($KEY, v) }`),
        ['dynamic'],
    )
    assert.deepEqual(kinds(`${outer}const KEY = other\nlocalStorage.getItem($KEY)`), ['constant'])
    assert.equal(resolveConstant('apps/web/declared.ts', '$KEY', root), 'cg.ai.auditLog')
})

test('destructured and default parameters shadow a constant; a condition does not', () => {
    for (const shadowing of [
        'function save({ KEY }) { localStorage.getItem(KEY) }',
        'const load = ([KEY]) => localStorage.getItem(KEY)',
        'function save(KEY, fallback = make(), { a } = {}) { localStorage.setItem(KEY, v) }',
        '{ const { KEY } = settings; localStorage.getItem(KEY) }',
        '{ let [first, KEY] = pair; localStorage.getItem(KEY) }',
        'for (const KEY of keys) { localStorage.getItem(KEY) }',
    ]) {
        assert.deepEqual(keyIn(shadowing), [['dynamic', undefined]], shadowing)
    }
    for (const plain of [
        'if (stored !== KEY) { localStorage.getItem(KEY) }',
        'while (KEY) { localStorage.getItem(KEY) }',
        // A default value reads the outer constant, and a parameter elsewhere binds nothing here.
        'function f(value = KEY) { localStorage.getItem(KEY) }',
        'function other(KEY) {}\nlocalStorage.getItem(KEY)',
        'other.KEY = 1\nlocalStorage.getItem(KEY)',
    ]) {
        assert.deepEqual(keyIn(plain), [['constant', 'cg.ai.auditLog']], plain)
    }
    // An inner constant is the one the call sees.
    assert.deepEqual(keyIn("{ const KEY = 'cg.ai.costTracker'; localStorage.getItem(KEY) }"), [
        ['constant', 'cg.ai.costTracker'],
    ])
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

test('every zustand persist call is a persisted store, and an unreadable storage fails closed', (t) => {
    const sources = {
        // zustand 5 writes to window.localStorage when no storage option is set.
        'apps/web/default.ts': "persist(store, { name: 'cannaguide-iot-settings' })",
        'apps/web/window.ts':
            "persist(store, { name: 'cannaguide-iot-settings', storage: createJSONStorage(() => window.localStorage) })",
        'apps/web/session.ts':
            "persist(store, { storage: createJSONStorage(() => globalThis.sessionStorage), name: 'cannaguide-iot-settings' })",
        // Storage this scan cannot read: the key is computed and needs a review entry.
        'apps/web/reference.ts':
            "persist(store, { name: 'cannaguide-iot-settings', storage: createJSONStorage(getStorage) })",
        'apps/web/adapter.ts':
            "persist(store, { name: 'cannaguide-iot-settings', storage: adapter })",
        'apps/web/spread.ts':
            "persist(store, { name: 'cannaguide-iot-settings', storage: createJSONStorage(() => localStorage), ...extra })",
        'apps/web/variable.ts': 'persist(store, options)',
        // Imported under another name, or through a namespace.
        'apps/web/alias.ts': [
            "import { persist as keep } from 'zustand/middleware'",
            "keep(store, { name: 'cannaguide-iot-settings' })",
        ].join('\n'),
        'apps/web/namespace.ts': [
            "import * as mw from 'zustand/middleware'",
            "mw.persist(store, { name: 'cannaguide-iot-settings' })",
        ].join('\n'),
        // A storage accessor outside any persist call.
        'apps/web/stray.ts': 'const storage = createJSONStorage(() => localStorage)',
        // Member calls are not zustand's persist.
        'apps/web/member.ts': 'await navigator.storage.persist(); queue.persist()',
    }
    const root = fixture(t, sources)
    const stores = (file) =>
        storageCalls(file, sources[file], root).map(({ kind, key, storage }) => ({
            kind,
            key,
            storage,
        }))
    const known = (storage) => [{ kind: 'persist', key: 'cannaguide-iot-settings', storage }]
    const unknown = () => [{ kind: 'dynamic', key: undefined, storage: 'unknown' }]
    assert.deepEqual(stores('apps/web/default.ts'), known('localStorage'))
    assert.deepEqual(stores('apps/web/window.ts'), known('localStorage'))
    assert.deepEqual(stores('apps/web/session.ts'), known('sessionStorage'))
    for (const file of ['reference', 'adapter', 'spread', 'variable']) {
        assert.deepEqual(stores(`apps/web/${file}.ts`), unknown(), file)
    }
    assert.deepEqual(stores('apps/web/alias.ts'), known('localStorage'))
    assert.deepEqual(stores('apps/web/namespace.ts'), known('localStorage'))
    assert.deepEqual(stores('apps/web/stray.ts'), unknown())
    assert.deepEqual(stores('apps/web/member.ts'), [])
    // An unknown store is a violation until it is reviewed.
    const [reason] = violations(
        storageCalls('apps/web/adapter.ts', sources['apps/web/adapter.ts'], root),
        [],
    )
    assert.equal(
        reason.reason,
        "computed key `persist({ name: 'cannaguide-iot-settings', storage: adapter })` is not reviewed",
    )
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

const IOT = 'cannaguide-iot-settings'
const LOCAL_ACCESSOR = 'createJSONStorage(() => localStorage)'

/** Each call's kind, then its key, or its expression when the key is computed. */
const found = (file, sources, root) =>
    storageCalls(file, sources[file], root).map(({ kind, key, expression }) => [
        kind,
        key ?? expression,
    ])

test('type arguments, regex literals and strings do not change what a persist call is', (t) => {
    const options = `{ name: '${IOT}', storage: ${LOCAL_ACCESSOR} }`
    const sources = {
        'apps/web/typed.ts': `persist<State>(store, { name: '${IOT}' })`,
        'apps/web/tuple.ts': `persist<State, [['zustand/persist', unknown]]>(store, ${options})`,
        // A bracket or a quote inside a regex literal is no part of the call's structure.
        'apps/web/regex.ts': `persist(() => ({ pattern: /[)]/, quote: /'/ }), ${options})`,
        // Text that only looks like a call is no call.
        'apps/web/strings.ts': [
            `const example = "persist(init, { name: 'draft-store' })"`,
            "const doc = `localStorage.setItem('raw_api_key', value)`",
        ].join('\n'),
    }
    const root = fixture(t, sources)
    for (const file of ['typed', 'tuple', 'regex']) {
        assert.deepEqual(found(`apps/web/${file}.ts`, sources, root), [['persist', IOT]], file)
    }
    assert.deepEqual(found('apps/web/strings.ts', sources, root), [])
})

test('a persist the file declares itself is no store; an imported or aliased one is', (t) => {
    const sources = {
        'apps/web/local.ts': 'function persist(value) {\n    return value\n}\npersist(1)',
        'apps/web/arrow.ts': "const persist = (value) => value\npersist({ name: 'draft-store' })",
        // A wrapper module that re-exports persist still writes a store.
        'apps/web/wrapper.ts': `import { persist } from './middleware'\npersist(store, { name: '${IOT}' })`,
        'apps/web/alias.ts': [
            "import { persist } from 'zustand/middleware'",
            'const keep = persist',
            `keep(store, { name: '${IOT}' })`,
        ].join('\n'),
    }
    const root = fixture(t, sources)
    assert.deepEqual(found('apps/web/local.ts', sources, root), [])
    assert.deepEqual(found('apps/web/arrow.ts', sources, root), [])
    assert.deepEqual(found('apps/web/wrapper.ts', sources, root), [['persist', IOT]])
    assert.deepEqual(found('apps/web/alias.ts', sources, root), [['persist', IOT]])
})

test('the last name wins however its key is written, and a computed key may override it', (t) => {
    const store = (...lines) =>
        ['persist(store, {', `    storage: ${LOCAL_ACCESSOR},`, ...lines, '})'].join('\n')
    const sources = {
        'apps/web/quoted.ts': store(`    name: '${IOT}',`, "    'name': 'draft-store',"),
        'apps/web/literal-key.ts': store(`    name: '${IOT}',`, "    ['name']: 'draft-store',"),
        'apps/web/computed.ts': store(`    name: '${IOT}',`, '    [field]: value,'),
        'apps/web/restored.ts': store(
            '    [field]: value,',
            `    name: '${IOT}',`,
            `    storage: ${LOCAL_ACCESSOR},`,
        ),
        'apps/web/constant.ts': `const STORE = '${IOT}'\n${store('    name: STORE,')}`,
    }
    const root = fixture(t, sources)
    const first = (file) => found(`apps/web/${file}.ts`, sources, root)[0]
    assert.deepEqual(first('quoted'), ['persist', 'draft-store'])
    assert.deepEqual(first('literal-key'), ['persist', 'draft-store'])
    assert.equal(first('computed')[0], 'dynamic')
    assert.deepEqual(first('restored'), ['persist', IOT])
    assert.deepEqual(first('constant'), ['persist', IOT])
    const quoted = storageCalls('apps/web/quoted.ts', sources['apps/web/quoted.ts'], root)
    assert.deepEqual(
        violations(quoted, []).map(({ reason }) => reason),
        ['key "draft-store" not in allowlist'],
    )
})

test('a storage option the scan cannot read is unknown, whatever form it takes', (t) => {
    const store = (storage) => `persist(store, { name: '${IOT}', ${storage} })`
    const sources = {
        'apps/web/shorthand.ts': store('storage'),
        'apps/web/quoted.ts': store("'storage': adapter"),
        'apps/web/computed.ts': store("['storage']: adapter"),
        'apps/web/getter.ts': store('get storage() { return adapter }'),
        'apps/web/block.ts': store('storage: createJSONStorage(() => { return localStorage })'),
        'apps/web/quoted-known.ts': store("'storage': createJSONStorage(() => sessionStorage)"),
    }
    const root = fixture(t, sources)
    const storages = (file) =>
        storageCalls(`apps/web/${file}.ts`, sources[`apps/web/${file}.ts`], root).map(
            ({ kind, storage }) => [kind, storage],
        )
    for (const file of ['shorthand', 'quoted', 'computed', 'getter', 'block']) {
        assert.deepEqual(storages(file), [['dynamic', 'unknown']], file)
    }
    assert.deepEqual(storages('quoted-known'), [['persist', 'sessionStorage']])
})

test('a createJSONStorage that is no persist storage option is a stray, wherever it is', (t) => {
    const sources = {
        // A quote in the store's initializer cannot hide an accessor after the call.
        'apps/web/after.ts': [
            "persist(() => ({ quote: '(' }), options)",
            `const storage = ${LOCAL_ACCESSOR}`,
        ].join('\n'),
        'apps/web/inside.ts': `persist(() => ({ cache: ${LOCAL_ACCESSOR} }), { name: '${IOT}' })`,
    }
    const root = fixture(t, sources)
    assert.deepEqual(found('apps/web/after.ts', sources, root), [
        ['dynamic', 'persist(options)'],
        ['dynamic', LOCAL_ACCESSOR],
    ])
    assert.deepEqual(found('apps/web/inside.ts', sources, root), [
        ['persist', IOT],
        ['dynamic', LOCAL_ACCESSOR],
    ])
})

test('a review approves one persisted store, not every computed store in its file', (t) => {
    const source = [
        `persist(store, { name: storeName(id), storage: ${LOCAL_ACCESSOR} })`,
        'persist(other, {',
        '    name: otherName(id),',
        `    storage: ${LOCAL_ACCESSOR},`,
        '})',
    ].join('\n')
    const calls = storageCalls('apps/web/stores.ts', source, fixture(t, {}))
    // Line breaks and their indentation fold to one space.
    assert.deepEqual(
        calls.map(({ expression }) => expression),
        [
            `persist({ name: storeName(id), storage: ${LOCAL_ACCESSOR} })`,
            `persist({ name: otherName(id), storage: ${LOCAL_ACCESSOR}, })`,
        ],
    )
    const entry = (expression) => ({
        file: 'apps/web/stores.ts',
        expression,
        methods: ['setItem'],
        example: 'cg.ai.auditLog',
    })
    const reviewed = [entry(calls[0].expression), entry('persist({ name: goneName(id) })')]
    assert.deepEqual(
        violations(calls, reviewed).map(({ reason }) => reason),
        [
            `computed key \`${calls[1].expression}\` is not reviewed`,
            'stale review entry `persist({ name: goneName(id) })`',
        ],
    )
})

test('a file that does not parse fails, instead of passing what the parser skipped', () => {
    const source = "const a = ;\nlocalStorage.setItem('cg.ai.auditLog', value)"
    const [failure] = violations(storageCalls('apps/web/broken.ts', source), [])
    assert.deepEqual(
        [failure.line, failure.reason],
        [1, 'the file does not parse: Expression expected.'],
    )
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

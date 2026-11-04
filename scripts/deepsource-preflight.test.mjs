import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    MIRRORED,
    PREFLIGHT_RULES,
    baselinePath,
    createPreflightLinter,
    findingKey,
    functionOf,
    isPreflightFinding,
    isSkippedPath,
    lintableFiles,
    parseNameStatus,
    raisedFindings,
} from './deepsource-preflight.mjs'

const lint = async (code, filePath = 'apps/web/sample.ts') => {
    const [result] = await createPreflightLinter().lintText(code, { filePath })
    return result.messages.filter(isPreflightFinding).map((message) => message.message)
}

test('flags a template literal without interpolation, not a tagged one', async () => {
    assert.match(
        (await lint('export const a = `plain`\n')).join(),
        /Template literal without interpolation/u,
    )
    assert.deepEqual(await lint('export const b = css`plain`\n'), [])
    assert.deepEqual(await lint('const name = 1\nexport const c = `n${name}`\n'), [])
})

test('flags `undefined` passed as the last argument', async () => {
    assert.match((await lint('run(1, undefined)\n')).join(), /Redundant `undefined`/u)
    assert.deepEqual(await lint('run(undefined, 1)\n'), [])
})

test('does not bring back the retired JS-0067 (module-scope declarations)', async () => {
    assert.deepEqual(await lint('function a() { return 1 }\na()\n'), [])
    assert.deepEqual(await lint('export function b() { return 1 }\n'), [])
})

test('does not bring back the retired JS-T1001 (optional with undefined)', async () => {
    assert.deepEqual(await lint('export interface A { b?: string | undefined }\n'), [])
})

test('flags a class method that does not use this', async () => {
    assert.match(
        (await lint('export class A { m() { return 1 } }\n')).join(),
        /Expected 'this' to be used/u,
    )
})

test('flags cyclomatic complexity of 6, not 5', async () => {
    const branches = (n) =>
        `export const f = (x: number) => {\n${Array.from({ length: n }, (_, i) => `    if (x === ${String(i)}) return ${String(i)}`).join('\n')}\n    return -1\n}\n`
    assert.deepEqual(await lint(branches(4)), [])
    assert.match((await lint(branches(5))).join(), /complexity of 6/u)
})

test('flags a non-null assertion, an async function without await and a missing default', async () => {
    assert.match((await lint('export const a = (b?: string) => b!.length\n')).join(), /JS-0339/u)
    assert.match((await lint('export const c = async () => 1\n')).join(), /has no 'await'/u)
    assert.match(
        (
            await lint(
                'export const d = (x: number) => {\n    switch (x) {\n        case 1:\n            return 1\n    }\n    return 0\n}\n',
            )
        ).join(),
        /default case/u,
    )
})

test('maps every mirrored rule to a DeepSource rule', () => {
    assert.deepEqual(Object.keys(MIRRORED).sort(), Object.keys(PREFLIGHT_RULES).sort())
})

test('ignores messages of rules the preflight does not load', () => {
    assert.equal(
        isPreflightFinding({ ruleId: '@typescript-eslint/no-unsafe-type-assertion' }),
        false,
    )
    assert.equal(isPreflightFinding({ ruleId: 'complexity' }), true)
    assert.equal(isPreflightFinding({ ruleId: null }), true)
})

test('reports a rule only where its count went up against the base', () => {
    const finding = (ruleId, message = 'm') => ({ ruleId, message })
    const before = [finding('complexity'), finding('no-restricted-syntax', 'JS-0339 x')]
    const now = [
        finding('complexity'),
        finding('no-restricted-syntax', 'JS-0339 x'),
        finding('no-restricted-syntax', 'JS-0339 x'),
        finding('no-restricted-syntax', 'JS-R1004 y'),
    ]

    const raised = raisedFindings(now, before).map(findingKey)

    // complexity is unchanged; JS-0339 went from 1 to 2; JS-R1004 is new.
    assert.deepEqual(raised, [
        'no-restricted-syntax: JS-0339 x',
        'no-restricted-syntax: JS-0339 x',
        'no-restricted-syntax: JS-R1004 y',
    ])
})

test('reports a function that got more complex, not one that got simpler', () => {
    const complexity = (value) => ({
        ruleId: 'complexity',
        message: `Arrow function has a complexity of ${String(value)}. Maximum allowed is 5.`,
    })
    const before = [complexity(10), complexity(11), complexity(7)]

    // The case DeepSource reported on PR 802 (649592d1): 11 -> 15 in the same file.
    assert.deepEqual(
        raisedFindings([complexity(10), complexity(15), complexity(7)], before).map(
            (message) => message.message,
        ),
        ['Arrow function has a complexity of 15. Maximum allowed is 5.'],
    )
    assert.deepEqual(raisedFindings([complexity(10), complexity(7)], before), [])
    assert.equal(raisedFindings([...before, complexity(6)], before).length, 1)
})

test('compares named functions with themselves, so a swap does not hide a regression', () => {
    const named = (name, value) => ({
        ruleId: 'complexity',
        message: `Arrow function '${name}' has a complexity of ${String(value)}. Maximum allowed is 5.`,
    })

    // A gets simpler (11 -> 7), B more complex (7 -> 10): by value alone they cancel out.
    const raised = raisedFindings([named('a', 7), named('b', 10)], [named('a', 11), named('b', 7)])

    assert.deepEqual(raised.map(functionOf), ["Arrow function 'b'"])
})

test('pairs same-name and anonymous functions by order when their number is unchanged', () => {
    const at = (name, value, line) => ({
        ruleId: 'complexity',
        line,
        message: `${name} has a complexity of ${String(value)}. Maximum allowed is 5.`,
    })

    // Two `render` methods: the first 11 -> 7, the second 7 -> 10.
    const renders = raisedFindings(
        [at("Method 'render'", 7, 10), at("Method 'render'", 10, 40)],
        [at("Method 'render'", 11, 10), at("Method 'render'", 7, 40)],
    )
    // Two inline callbacks, swapped the same way.
    const callbacks = raisedFindings(
        [at('Arrow function', 7, 5), at('Arrow function', 10, 30)],
        [at('Arrow function', 11, 5), at('Arrow function', 7, 30)],
    )

    assert.deepEqual(
        renders.map(({ line }) => line),
        [40],
    )
    assert.deepEqual(
        callbacks.map(({ line }) => line),
        [30],
    )
})

test('reads renames, copies and odd paths from NUL-separated name-status output', () => {
    const output = [
        'M',
        'apps/web/a b.ts',
        'R100',
        'scripts/old.mjs',
        'scripts/new.mjs',
        'A',
        'apps/web/caf\u00e9.ts',
        '',
    ].join('\0')

    assert.deepEqual(parseNameStatus(output), [
        { file: 'apps/web/a b.ts', basePath: 'apps/web/a b.ts' },
        { file: 'scripts/new.mjs', basePath: 'scripts/old.mjs' },
        { file: 'apps/web/caf\u00e9.ts', basePath: 'apps/web/caf\u00e9.ts' },
    ])
})

test('skips the paths .deepsource.toml excludes', () => {
    for (const path of [
        'out/a.js',
        'apps/x/vendor/b.js',
        '.venv/c.js',
        'pkg/x.egg-info/d.js',
        'a/dist/e.js',
    ]) {
        assert.equal(isSkippedPath(path), true, path)
    }
    assert.equal(isSkippedPath('apps/web/services/output.ts'), false)
})

test('compares a file renamed out of an excluded path with nothing', () => {
    assert.equal(baselinePath({ file: 'apps/web/lib/x.ts', basePath: 'vendor/x.ts' }), null)
    assert.equal(
        baselinePath({ file: 'scripts/new.mjs', basePath: 'scripts/old.mjs' }),
        'scripts/old.mjs',
    )
})

test('parses TSX', async () => {
    assert.deepEqual(await lint('export const A = () => <div>{1}</div>\n', 'apps/web/A.tsx'), [])
})

test('lints only existing source files outside build output', () => {
    assert.deepEqual(
        lintableFiles([
            'scripts/deepsource-preflight.mjs',
            'README.md',
            'apps/web/dist/x.js',
            'apps/web/does-not-exist.ts',
        ]),
        ['scripts/deepsource-preflight.mjs'],
    )
})

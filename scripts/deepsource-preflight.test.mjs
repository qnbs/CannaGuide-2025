import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPreflightLinter, lintableFiles } from './deepsource-preflight.mjs'

const lint = async (code, filePath = 'apps/web/sample.ts') => {
    const [result] = await createPreflightLinter().lintText(code, { filePath })
    return result.messages.map((message) => message.message)
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

test('flags a module-scope function declaration, exported or not', async () => {
    assert.match(
        (await lint('function a() { return 1 }\na()\n')).join(),
        /Function declaration at module scope/u,
    )
    assert.match(
        (await lint('export function b() { return 1 }\n')).join(),
        /Function declaration at module scope/u,
    )
    assert.deepEqual(await lint('export const c = () => 1\n'), [])
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

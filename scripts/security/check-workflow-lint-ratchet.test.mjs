import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import {
    assertShellcheck,
    BASELINE,
    countActionlint,
    countZizmor,
    improvements,
    isBaseline,
    LINTERS,
    linterFindings,
    regressions,
} from './check-workflow-lint-ratchet.mjs'

const zizmorFinding = (severity, ident) => ({ ident, determinations: { severity } })

test('zizmor findings count per severity and rule', () => {
    const counts = countZizmor([
        zizmorFinding('High', 'cache-poisoning'),
        zizmorFinding('Medium', 'artipacked'),
        zizmorFinding('Medium', 'artipacked'),
    ])
    assert.deepEqual(counts, { 'High cache-poisoning': 1, 'Medium artipacked': 2 })
})

test('actionlint errors count per kind and shellcheck code', () => {
    const counts = countActionlint([
        {
            kind: 'shellcheck',
            message: 'shellcheck reported issue in this script: SC2126:style:1:250: ...',
        },
        {
            kind: 'shellcheck',
            message: 'shellcheck reported issue in this script: SC2086:info:3:9: ...',
        },
        { kind: 'expression', message: 'property "foo" is not defined' },
    ])
    assert.deepEqual(counts, {
        'shellcheck SC2126': 1,
        'shellcheck SC2086': 1,
        expression: 1,
    })
})

test('a class above its ceiling or missing from the baseline is a regression', () => {
    const baseline = {
        zizmor: { 'Medium artipacked': 38, 'Low self-repository': 38 },
        actionlint: {},
    }
    const current = {
        zizmor: {
            'Medium artipacked': 39,
            'Low self-repository': 10,
            'High template-injection': 1,
        },
        actionlint: { 'shellcheck SC2086': 1 },
    }
    assert.deepEqual(regressions(current, baseline), [
        'zizmor: Medium artipacked 38 -> 39',
        'zizmor: High template-injection 0 -> 1',
        'actionlint: shellcheck SC2086 0 -> 1',
    ])
})

test('fixing one class does not pay for a rise in another', () => {
    const baseline = { zizmor: { 'Low self-repository': 38, 'High cache-poisoning': 1 } }
    const current = { zizmor: { 'Low self-repository': 0, 'High cache-poisoning': 2 } }
    assert.deepEqual(regressions(current, baseline), ['zizmor: High cache-poisoning 1 -> 2'])
})

test('classes below the ceiling, including ones fixed to zero, are reported as lowerable', () => {
    const baseline = {
        _comment: 'x',
        zizmor: { 'High cache-poisoning': 1, 'Medium artipacked': 38 },
    }
    const current = { zizmor: { 'Medium artipacked': 30 } }
    assert.deepEqual(improvements(current, baseline), [
        'zizmor: High cache-poisoning 1 -> 0',
        'zizmor: Medium artipacked 38 -> 30',
    ])
})

test('the committed baseline has numeric ceilings for both tools', () => {
    const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
    for (const tool of ['zizmor', 'actionlint']) {
        assert.ok(baseline[tool] && typeof baseline[tool] === 'object', `${tool} missing`)
        for (const [key, value] of Object.entries(baseline[tool])) {
            assert.ok(Number.isInteger(value) && value >= 0, `${tool} ${key} = ${value}`)
        }
    }
    assert.equal(
        baseline.zizmor['High template-injection'] ?? 0,
        0,
        'template injection was fixed in A-S7; its ceiling stays 0',
    )
})

test('only an object with ceiling maps for both tools is a baseline (#649 review)', () => {
    assert.equal(isBaseline({ zizmor: { 'Low x': 1 }, actionlint: {} }), true)
    for (const bad of [
        null,
        [],
        {},
        { zizmor: null, actionlint: {} },
        { zizmor: { 'Low x': -1 }, actionlint: {} },
        { zizmor: { 'Low x': 1.5 }, actionlint: {} },
        { zizmor: {}, actionlint: [] },
    ]) {
        assert.equal(isBaseline(bad), false, JSON.stringify(bad))
    }
    assert.equal(isBaseline(JSON.parse(readFileSync(BASELINE, 'utf8'))), true)
})

test('a missing or broken shellcheck stops the ratchet instead of counting 0 (#649 review)', () => {
    const missing = () => ({ error: Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }) })
    const broken = () => ({ status: 127, stdout: '', stderr: 'not found' })
    for (const spawn of [missing, broken]) {
        assert.throws(() => assertShellcheck(spawn), /shellcheck is not runnable/)
    }
    const calls = []
    const present = (command, args) => {
        calls.push([command, ...args])
        return { status: 0, stdout: 'version: 0.11.0\n' }
    }
    assert.doesNotThrow(() => assertShellcheck(present))
    assert.deepEqual(calls, [['shellcheck', '--version']])
})

test('only a completed audit counts; a failed one fails even with a JSON array (#649 review)', () => {
    const run = (status, stdout = '[]') => ({ status, stdout, stderr: 'x' })
    // zizmor: 0 clean, 10-14 findings by severity; actionlint: 0 clean, 1 findings.
    for (const status of [0, 10, 11, 12, 13, 14]) {
        assert.deepEqual(linterFindings('zizmor', run(status)), [], `zizmor ${status}`)
    }
    for (const status of [0, 1]) {
        assert.deepEqual(linterFindings('actionlint', run(status)), [], `actionlint ${status}`)
    }
    for (const [command, status] of [
        ['zizmor', 1],
        ['zizmor', 2],
        ['zizmor', 3],
        ['zizmor', 15],
        ['actionlint', 2],
        ['actionlint', 3],
    ]) {
        assert.throws(
            () => linterFindings(command, run(status)),
            /audit did not complete/,
            `${command} ${status}`,
        )
    }
    assert.throws(() => linterFindings('zizmor', run(14, 'not json')), /without JSON/)
    assert.throws(
        () => linterFindings('zizmor', { error: new Error('spawn zizmor ENOENT') }),
        /could not run/,
    )
    // A workflow zizmor cannot parse is an error, not a silently skipped file.
    assert.ok(LINTERS.zizmor.args.includes('--strict-collection'))
})

test('CI installs all three linters pinned and checksum-verified (#649 review)', () => {
    const ci = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8')
    assert.match(
        ci,
        /--require-hashes\s*\\?\s*\n?\s*-r scripts\/security\/zizmor-requirements\.txt/,
    )
    for (const tool of ['ACTIONLINT', 'SHELLCHECK']) {
        assert.match(ci, new RegExp(`${tool}_VERSION: '\\d+\\.\\d+\\.\\d+'`), `${tool} version`)
        assert.match(ci, new RegExp(`${tool}_SHA256: '[0-9a-f]{64}'`), `${tool} digest`)
        assert.match(ci, new RegExp(`echo "\\$\\{${tool}_SHA256\\}  /tmp/\\S+" \\| sha256sum -c -`))
    }
    assert.match(ci, /shellcheck --version \| grep -qx "version: \$\{SHELLCHECK_VERSION\}"/)
})

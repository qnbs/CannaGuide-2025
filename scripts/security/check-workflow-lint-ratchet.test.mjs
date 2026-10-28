import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import {
    BASELINE,
    countActionlint,
    countZizmor,
    improvements,
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

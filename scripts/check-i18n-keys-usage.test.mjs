// CG-AUD-20261027-N03: resolution rules of check-i18n-keys-usage.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { extractTKeys, resolveKey } from './check-i18n-keys-usage.mjs'

const locale = new Set([
    'common.save',
    'strainsView.selectedCount_one',
    'strainsView.selectedCount_other',
    'legacy.items',
    'settingsView.workerTelemetry.title',
])

test('exact keys resolve', () => {
    assert.equal(resolveKey('common.save', locale), true)
})

test('a key used with { count } resolves against its _one/_other plural forms', () => {
    assert.equal(resolveKey('strainsView.selectedCount', locale), true)
})

test('a plural suffix named in code does not resolve against a plain key (#647 review)', () => {
    // i18next looks `t('legacy.items_other')` up literally; it never strips the suffix.
    assert.equal(resolveKey('legacy.items_other', locale), false)
    assert.equal(resolveKey('legacy.items', locale), true)
})

test('a key naming an object resolves (parent of a leaf)', () => {
    assert.equal(resolveKey('settingsView.workerTelemetry', locale), true)
})

test('wrong paths and missing keys do not resolve', () => {
    assert.equal(resolveKey('workerTelemetry.title', locale), false)
    assert.equal(resolveKey('common.undo', locale), false)
    assert.equal(resolveKey('strainsView.selectedCount_two', new Set(['other.key'])), false)
})

test('a plural key needs both English forms, _one and _other (#647 review)', () => {
    const half = new Set(['seedVault.items_one', 'seedVault.rows_other'])
    assert.equal(resolveKey('seedVault.items', half), false)
    assert.equal(resolveKey('seedVault.rows', half), false)
})

test('extractTKeys sees t(), getT()() and a stored translate()', () => {
    const source = [
        "t('common.save')",
        "getT()('common.mqtt.connectionLost', { x: 1 })",
        'const translate = getT(); translate("common.staleTab.title")',
        'getT()(`common.egress.blockedByLocalOnly`)',
    ].join('\n')

    assert.deepEqual([...extractTKeys(source)].sort(), [
        'common.egress.blockedByLocalOnly',
        'common.mqtt.connectionLost',
        'common.save',
        'common.staleTab.title',
    ])
})

test('extractTKeys ignores dynamic keys and look-alike names', () => {
    const source = ['t(`common.${name}`)', "format('common.save')", "restart('common.undo')"].join(
        '\n',
    )

    assert.deepEqual([...extractTKeys(source)], [])
})

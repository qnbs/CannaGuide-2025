// CG-AUD-20261027-N03: resolution rules of check-i18n-keys-usage.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { resolveKey } from './check-i18n-keys-usage.mjs'

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

test('a plural form used in code resolves against a plain locale key', () => {
    assert.equal(resolveKey('legacy.items_other', locale), true)
})

test('a key naming an object resolves (parent of a leaf)', () => {
    assert.equal(resolveKey('settingsView.workerTelemetry', locale), true)
})

test('wrong paths and missing keys do not resolve', () => {
    assert.equal(resolveKey('workerTelemetry.title', locale), false)
    assert.equal(resolveKey('common.undo', locale), false)
    assert.equal(resolveKey('strainsView.selectedCount_two', new Set(['other.key'])), false)
})

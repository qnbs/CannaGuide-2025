import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { APP_ID, isDisposableRunner, removeAppFolder } from './desktop-smoke-profile.mjs'

const DISPOSABLE = { GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'github-hosted' }

const base = (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'cannaguide-profile-guard-'))
    t.after(() => rmSync(dir, { recursive: true, force: true }))
    return dir
}

const withAppData = (dir) => {
    mkdirSync(join(dir, APP_ID))
    writeFileSync(join(dir, APP_ID, 'grow-journal.db'), 'real data')
    return join(dir, APP_ID, 'grow-journal.db')
}

test('only a GitHub-hosted runner counts as disposable', () => {
    assert.equal(isDisposableRunner(DISPOSABLE), true)
    for (const env of [
        {},
        { CI: 'true' },
        { CI: 'false' },
        { GITHUB_ACTIONS: 'true' },
        { GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'self-hosted' },
        { RUNNER_ENVIRONMENT: 'github-hosted' },
    ]) {
        assert.equal(isDisposableRunner(env), false, JSON.stringify(env))
    }
})

test("on a person's machine the app data is never touched", (t) => {
    const dir = base(t)
    const data = withAppData(dir)
    for (const env of [
        {},
        { CI: 'true' },
        { GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'self-hosted' },
    ]) {
        const result = removeAppFolder(dir, { env })
        assert.equal(result.removed, false)
        assert.equal(result.reason, 'not a disposable runner')
        assert.ok(existsSync(data), `data kept for ${JSON.stringify(env)}`)
    }
})

test('a linked app folder is refused and what it points at is kept', (t) => {
    const dir = base(t)
    const elsewhere = join(dir, 'elsewhere')
    mkdirSync(elsewhere)
    writeFileSync(join(elsewhere, 'other.db'), 'not ours')
    const appBase = join(dir, 'appdata')
    mkdirSync(appBase)
    symlinkSync(elsewhere, join(appBase, APP_ID), 'junction')
    const result = removeAppFolder(appBase, { env: DISPOSABLE })
    assert.equal(result.removed, false)
    assert.equal(result.reason, 'app folder is a link')
    assert.ok(existsSync(join(elsewhere, 'other.db')))
})

test('a base reached through a link, or a relative base, is refused', (t) => {
    const dir = base(t)
    const real = join(dir, 'real')
    mkdirSync(real)
    const data = withAppData(real)
    symlinkSync(real, join(dir, 'link'), 'junction')
    assert.equal(
        removeAppFolder(join(dir, 'link'), { env: DISPOSABLE }).reason,
        'base folder is reached through a link',
    )
    assert.equal(removeAppFolder('relative/appdata', { env: DISPOSABLE }).removed, false)
    assert.ok(existsSync(data))
})

test('on a disposable runner only the app folder is removed', (t) => {
    const dir = base(t)
    withAppData(dir)
    writeFileSync(join(dir, 'neighbour.txt'), 'other app')
    const result = removeAppFolder(dir, { env: DISPOSABLE })
    assert.deepEqual(result, { removed: true, reason: 'removed' })
    assert.equal(existsSync(join(dir, APP_ID)), false)
    assert.ok(existsSync(join(dir, 'neighbour.txt')), 'the rest of the base folder stays')
    assert.deepEqual(removeAppFolder(dir, { env: DISPOSABLE }), {
        removed: true,
        reason: 'nothing to remove',
    })
})

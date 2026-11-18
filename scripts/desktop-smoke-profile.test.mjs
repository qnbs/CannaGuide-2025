import assert from 'node:assert/strict'
import {
    existsSync,
    lstatSync,
    mkdirSync,
    mkdtempSync,
    realpathSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { APP_ID, isDisposableRunner, removeAppFolder } from './desktop-smoke-profile.mjs'

const RUNNER_ENV = { GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'github-hosted' }
/** removeAppFolder options for a GitHub-hosted runner (environment and OS account). */
const DISPOSABLE = { env: RUNNER_ENV, account: 'runneradmin' }

const base = (t) => {
    // Canonical: on macOS /tmp resolves to /private/tmp, which the guard would refuse.
    const dir = mkdtempSync(join(realpathSync(tmpdir()), 'cannaguide-profile-guard-'))
    t.after(() => rmSync(dir, { recursive: true, force: true }))
    return dir
}

const withAppData = (dir) => {
    mkdirSync(join(dir, APP_ID))
    writeFileSync(join(dir, APP_ID, 'grow-journal.db'), 'real data')
    return join(dir, APP_ID, 'grow-journal.db')
}

test('only a GitHub-hosted runner counts as disposable: its environment and its account', () => {
    assert.equal(isDisposableRunner(RUNNER_ENV, 'runneradmin'), true)
    assert.equal(isDisposableRunner(RUNNER_ENV, 'runner'), true)
    for (const env of [
        {},
        { CI: 'true' },
        { CI: 'false' },
        { GITHUB_ACTIONS: 'true' },
        { GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'self-hosted' },
        { RUNNER_ENVIRONMENT: 'github-hosted' },
    ]) {
        assert.equal(isDisposableRunner(env, 'runneradmin'), false, JSON.stringify(env))
    }
    // The runner's variables set in a person's own shell are not enough. (An omitted
    // account means the real one, so every case here passes one explicitly.)
    for (const account of ['pc', 'alice', '', null]) {
        assert.equal(isDisposableRunner(RUNNER_ENV, account), false, String(account))
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
        const result = removeAppFolder(dir, { env, account: 'runneradmin' })
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
    const result = removeAppFolder(appBase, DISPOSABLE)
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
        removeAppFolder(join(dir, 'link'), DISPOSABLE).reason,
        'base folder is reached through a link',
    )
    assert.equal(removeAppFolder('relative/appdata', DISPOSABLE).removed, false)
    assert.ok(existsSync(data))
})

test('on a disposable runner only the app folder is removed', (t) => {
    const dir = base(t)
    withAppData(dir)
    writeFileSync(join(dir, 'neighbour.txt'), 'other app')
    const result = removeAppFolder(dir, DISPOSABLE)
    assert.deepEqual(result, { removed: true, reason: 'removed' })
    assert.equal(existsSync(join(dir, APP_ID)), false)
    assert.ok(existsSync(join(dir, 'neighbour.txt')), 'the rest of the base folder stays')
    assert.deepEqual(removeAppFolder(dir, DISPOSABLE), {
        removed: true,
        reason: 'nothing to remove',
    })
})

test('a dangling link is refused, not reported as nothing to remove', (t) => {
    const dir = base(t)
    symlinkSync(join(dir, 'gone'), join(dir, APP_ID), 'junction')
    const result = removeAppFolder(dir, DISPOSABLE)
    assert.deepEqual(result, { removed: false, reason: 'app folder is a link' })
    assert.ok(
        lstatSync(join(dir, APP_ID)).isSymbolicLink(),
        'the link stays for a person to look at',
    )
})

test("the runner's variables in a person's shell still delete nothing", (t) => {
    const dir = base(t)
    const data = withAppData(dir)
    const result = removeAppFolder(dir, { env: RUNNER_ENV, account: 'pc' })
    assert.deepEqual(result, { removed: false, reason: 'not a disposable runner' })
    assert.ok(existsSync(data))
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/platformService', () => ({ platform: { isTauri: true } }))

import {
    createDesktopUpdater,
    DesktopUpdateError,
    flushThenConfirmFinalSave,
    flushThenConfirmQuit,
    flushUntilStable,
    scheduleStartupUpdateCheck,
    syncNativeLocalOnly,
    type DesktopUpdateInfo,
    type DesktopUpdaterDeps,
    type PersistFlush,
    type TauriBridge,
} from './desktopLifecycleService'

const INFO: DesktopUpdateInfo = {
    version: '1.12.0',
    currentVersion: '1.11.0',
    notes: 'Notes',
    date: null,
}
const NEWER: DesktopUpdateInfo = { ...INFO, version: '1.12.1' }

type Responder = (args?: Record<string, unknown>) => unknown

/** A bridge that records calls; `responses` decides what each command returns. */
const fakeBridge = (responses: Record<string, Responder> = {}) => {
    const calls: string[] = []
    const bridge: TauriBridge = {
        invoke: async <T>(command: string, args?: Record<string, unknown>) => {
            calls.push(command)
            const respond = responses[command]
            return (respond ? await respond(args) : undefined) as T
        },
        channel: <T>(onMessage: (message: T) => void) => ({ onMessage }),
    }
    return { bridge, calls }
}

const updaterWith = (bridge: TauriBridge, overrides: Partial<DesktopUpdaterDeps> = {}) =>
    createDesktopUpdater({
        isDesktop: () => true,
        isLocalOnly: () => false,
        isOnline: () => true,
        loadBridge: async () => bridge,
        getFlush: () => async () => true,
        ...overrides,
    })

const reasonOf = async (promise: Promise<unknown>) => {
    const error = await promise.then(
        () => undefined,
        (caught: unknown) => caught,
    )
    expect(error).toBeInstanceOf(DesktopUpdateError)
    return (error as DesktopUpdateError).reason
}

describe('desktop updater: rules', () => {
    it('does nothing outside the desktop app', async () => {
        const { bridge, calls } = fakeBridge()
        const updater = updaterWith(bridge, { isDesktop: () => false })
        expect(await reasonOf(updater.check())).toBe('not-desktop')
        expect(await reasonOf(updater.installAndRestart())).toBe('not-desktop')
        expect(calls).toEqual([])
    })

    it.each([
        ['Local-Only mode', { isLocalOnly: () => true }, 'local-only'],
        ['offline', { isOnline: () => false }, 'offline'],
    ] as const)(
        '%s blocks checks and downloads but not installing a downloaded bundle',
        async (_label, overrides, reason) => {
            const { bridge, calls } = fakeBridge()
            const updater = updaterWith(bridge, overrides)
            expect(await reasonOf(updater.check())).toBe(reason)
            expect(await reasonOf(updater.download())).toBe(reason)
            await updater.installAndRestart()
            expect(calls).toEqual(['update_install'])
        },
    )

    it('runs one step at a time, and the snapshot names the running step', async () => {
        let release: (value: unknown) => void = () => undefined
        let checks = 0
        const { bridge } = fakeBridge({
            update_check: () => {
                checks += 1
                return checks === 1 ? new Promise((resolve) => (release = resolve)) : null
            },
        })
        const updater = updaterWith(bridge)
        const first = updater.check()
        await vi.waitFor(() => expect(updater.getSnapshot().operation).toBe('checking'))
        expect(await reasonOf(updater.download())).toBe('busy')
        release(INFO)
        await expect(first).resolves.toEqual(INFO)
        expect(updater.getSnapshot().operation).toBe('idle')
        await expect(updater.check()).resolves.toBeNull()
        expect(updater.getSnapshot().upToDate).toBe(true)
    })

    it('a command error is a failed step with the native message, shown in the snapshot', async () => {
        const { bridge } = fakeBridge({
            update_check: () => INFO,
            update_download: () => Promise.reject('signature verification failed'),
        })
        const updater = updaterWith(bridge)
        await updater.check()
        expect(await reasonOf(updater.download())).toBe('failed')
        expect(updater.getSnapshot().error).toEqual({
            reason: 'failed',
            message: 'signature verification failed',
        })
        // The stage still says what can be retried.
        expect(updater.getSnapshot().stage).toEqual({ kind: 'available', info: INFO })
    })

    it('maps the native Local-Only refusal to its own reason', async () => {
        const { bridge } = fakeBridge({
            update_check: () =>
                Promise.reject('Local-only mode is on; the update server is not contacted'),
        })
        expect(await reasonOf(updaterWith(bridge).check())).toBe('local-only')
    })
})

describe('desktop updater: one shared state for every viewer', () => {
    it('keeps the stage for the launch; a later check of the same version keeps the download', async () => {
        let next: DesktopUpdateInfo | null = INFO
        const { bridge } = fakeBridge({ update_check: () => next })
        const updater = updaterWith(bridge)
        expect(updater.getSnapshot().stage).toBeNull()
        await updater.check()
        expect(updater.getSnapshot().stage).toEqual({ kind: 'available', info: INFO })
        await updater.download()
        expect(updater.getSnapshot().stage).toEqual({ kind: 'ready', info: INFO })
        await updater.check({ background: true })
        expect(updater.getSnapshot().stage?.kind).toBe('ready')
        next = NEWER
        await updater.check()
        expect(updater.getSnapshot().stage).toEqual({ kind: 'available', info: NEWER })
        next = null
        await updater.check()
        expect(updater.getSnapshot().stage).toBeNull()
    })

    it('a startup check that finds a newer release between check and download moves everyone to it', async () => {
        // CodeRabbit on #878: the card used to keep release A while the shared stage
        // had moved to B.
        let next: DesktopUpdateInfo = INFO
        const { bridge } = fakeBridge({ update_check: () => next })
        const updater = updaterWith(bridge)
        await updater.check()
        next = NEWER
        await updater.check({ background: true })
        await updater.download()
        expect(updater.getSnapshot().stage).toEqual({ kind: 'ready', info: NEWER })
    })

    it('publishes download progress to subscribers and clears it when the step ends', async () => {
        const { bridge } = fakeBridge({
            update_check: () => INFO,
            update_download: (args) => {
                const channel = args?.onEvent as { onMessage: (message: unknown) => void }
                channel.onMessage({ event: 'progress', data: { downloaded: 10, total: 40 } })
                channel.onMessage({ event: 'progress', data: { downloaded: 40, total: 40 } })
                channel.onMessage({ event: 'finished' })
            },
        })
        const updater = updaterWith(bridge)
        await updater.check()
        const seen: unknown[] = []
        let last: unknown = null
        const unsubscribe = updater.subscribe(() => {
            // Subscribers hear every change (stage too); count each progress value once.
            const { progress } = updater.getSnapshot()
            if (progress && progress !== last) seen.push(progress)
            last = progress
        })
        await updater.download()
        unsubscribe()
        expect(seen).toEqual([
            { downloaded: 10, total: 40 },
            { downloaded: 40, total: 40 },
        ])
        expect(updater.getSnapshot().progress).toBeNull()
    })

    it('a successful check, also in the background, clears an older failure', async () => {
        // CodeAnt on #878: the card kept showing a failure the newer check had resolved.
        let fail = true
        const { bridge } = fakeBridge({
            update_check: () => (fail ? Promise.reject('timed out') : INFO),
        })
        const updater = updaterWith(bridge)
        await reasonOf(updater.check())
        expect(updater.getSnapshot().error?.message).toBe('timed out')
        fail = false
        await updater.check({ background: true })
        expect(updater.getSnapshot().error).toBeNull()
    })

    it('a failed background check stays out of the snapshot', async () => {
        const { bridge } = fakeBridge({ update_check: () => Promise.reject('timed out') })
        const updater = updaterWith(bridge)
        expect(await reasonOf(updater.check({ background: true }))).toBe('failed')
        expect(updater.getSnapshot().error).toBeNull()
    })
})

describe('desktop updater: stopping a running step', () => {
    it('Local-Only switched on during a check stops it, and the stage it had stays', async () => {
        // CodeAnt on #878: a real overlap -- the check is still waiting when the mode
        // turns on, and the native mirror aborts exactly that request.
        let rejectPending: (reason: unknown) => void = () => undefined
        let checks = 0
        const { bridge } = fakeBridge({
            update_check: () => {
                checks += 1
                if (checks === 1) return INFO
                return new Promise((_resolve, reject) => (rejectPending = reject))
            },
            update_set_local_only: (args) => {
                if (args?.enabled === true) rejectPending('update request cancelled')
            },
        })
        const updater = updaterWith(bridge)
        await updater.check()
        const pending = updater.check()
        await vi.waitFor(() => expect(checks).toBe(2))
        await syncNativeLocalOnly(true, async () => bridge)
        expect(await reasonOf(pending)).toBe('cancelled')
        expect(updater.getSnapshot().stage).toEqual({ kind: 'available', info: INFO })
        expect(updater.getSnapshot().operation).toBe('idle')
    })

    it('Cancel is offered only once the native download reports it started', async () => {
        // CodeAnt on #878: a Cancel shown before the task existed could miss it.
        let started: () => void = () => undefined
        let finish: () => void = () => undefined
        const { bridge } = fakeBridge({
            update_check: () => INFO,
            update_download: (args) => {
                const channel = args?.onEvent as { onMessage: (message: unknown) => void }
                started = () => channel.onMessage({ event: 'started' })
                return new Promise<void>((resolve) => (finish = resolve))
            },
        })
        const updater = updaterWith(bridge)
        await updater.check()
        const download = updater.download()
        await vi.waitFor(() => expect(updater.getSnapshot().operation).toBe('downloading'))
        expect(updater.getSnapshot().cancellable).toBe(false)
        started()
        expect(updater.getSnapshot().cancellable).toBe(true)
        finish()
        await download
        expect(updater.getSnapshot().cancellable).toBe(false)
    })

    it('Cancel reaches a running download past the one-step guard', async () => {
        let rejectPending: (reason: unknown) => void = () => undefined
        const { bridge, calls } = fakeBridge({
            update_check: () => INFO,
            update_download: () => new Promise((_resolve, reject) => (rejectPending = reject)),
            update_cancel: () => {
                rejectPending('update request cancelled')
                return true
            },
        })
        const updater = updaterWith(bridge)
        await updater.check()
        const download = updater.download()
        await vi.waitFor(() => expect(updater.getSnapshot().operation).toBe('downloading'))
        await expect(updater.cancelDownload()).resolves.toBe(true)
        expect(await reasonOf(download)).toBe('cancelled')
        expect(calls).toContain('update_cancel')
        expect(updater.getSnapshot().stage).toEqual({ kind: 'available', info: INFO })
    })

    it('tells update.rs about Local-Only mode', async () => {
        const seen: unknown[] = []
        const { bridge } = fakeBridge({
            update_set_local_only: (args) => {
                seen.push(args)
            },
        })
        await syncNativeLocalOnly(true, async () => bridge)
        await syncNativeLocalOnly(false, async () => bridge)
        expect(seen).toEqual([{ enabled: true }, { enabled: false }])
    })
})

describe('desktop updater: save before install', () => {
    it('installs only after the latest changes were saved', async () => {
        const order: string[] = []
        const { bridge, calls } = fakeBridge({ update_install: () => order.push('install') })
        const flush: PersistFlush = async () => {
            order.push('flush')
            return true
        }
        await updaterWith(bridge, { getFlush: () => flush }).installAndRestart()
        expect(order).toEqual(['flush', 'install'])
        expect(calls).toEqual(['update_install'])
    })

    it.each([
        ['reports not saved', async () => false],
        [
            'throws',
            async () => {
                throw new Error('QuotaExceededError')
            },
        ],
        ['is not registered', undefined],
    ])('never installs when the save %s', async (_label, flush) => {
        const { bridge, calls } = fakeBridge()
        const updater = updaterWith(bridge, {
            getFlush: () => flush as PersistFlush | undefined,
        })
        expect(await reasonOf(updater.installAndRestart())).toBe('not-saved')
        expect(updater.getSnapshot().error?.reason).toBe('not-saved')
        expect(calls).toEqual([])
    })
})

describe('save until the state settles (CodeAnt and CodeRabbit on #878)', () => {
    it('saves once when nothing changes during the save', async () => {
        const state = { value: 1 }
        const flush = vi.fn(async () => true)
        await expect(flushUntilStable(flush, () => state)()).resolves.toBe(true)
        expect(flush).toHaveBeenCalledTimes(1)
    })

    it('saves again when the state changed during the save', async () => {
        let state = { value: 1 }
        const flush = vi.fn(async () => {
            if (flush.mock.calls.length === 1) state = { value: 2 }
            return true
        })
        await expect(flushUntilStable(flush, () => state)()).resolves.toBe(true)
        expect(flush).toHaveBeenCalledTimes(2)
    })

    it('for a store that never settles a quit accepts the last save and an install refuses', async () => {
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        let tick = 0
        const flush = vi.fn(async () => {
            tick += 1
            return true
        })
        const churn = () => ({ tick })
        await expect(flushUntilStable(flush, churn)()).resolves.toBe(true)
        expect(flush).toHaveBeenCalledTimes(3)

        flush.mockClear()
        const install = flushUntilStable(flush, churn, { maxRounds: 5, whenUnsettled: 'refuse' })
        await expect(install()).resolves.toBe(false)
        expect(flush).toHaveBeenCalledTimes(5)
        debug.mockRestore()
    })

    it('compares with isSame, so a change outside the snapshot does not count', async () => {
        let runtime = 0
        const flush = vi.fn(async () => {
            runtime += 1
            return true
        })
        const persisted = ['grows']
        const getState = () => ({ persisted, runtime })
        const isSame = (a: unknown, b: unknown) =>
            (a as { persisted: unknown }).persisted === (b as { persisted: unknown }).persisted
        const install = flushUntilStable(flush, getState, { whenUnsettled: 'refuse', isSame })
        await expect(install()).resolves.toBe(true)
        expect(flush).toHaveBeenCalledTimes(1)
    })

    it('a comparison that throws never skips the save: quit saves, install refuses', async () => {
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        const flush = vi.fn(async () => true)
        const broken = () => {
            throw new TypeError('cannot read the state')
        }
        await expect(flushUntilStable(flush, broken)()).resolves.toBe(true)
        expect(flush).toHaveBeenCalled()
        await expect(flushUntilStable(flush, broken, { whenUnsettled: 'refuse' })()).resolves.toBe(
            false,
        )
        debug.mockRestore()
    })

    it('a failed save is never reported as saved', async () => {
        const failing = vi.fn(async () => false)
        await expect(flushUntilStable(failing, () => ({}))()).resolves.toBe(false)
        expect(failing).toHaveBeenCalledTimes(1)
    })
})

describe('startup update check', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    const deps = (overrides: Record<string, unknown> = {}) => {
        const check = vi.fn(
            async (_options?: { background?: boolean | undefined }) =>
                INFO as DesktopUpdateInfo | null,
        )
        const onAvailable = vi.fn()
        return {
            check,
            onAvailable,
            deps: {
                updater: { check },
                isDesktop: () => true,
                isLocalOnly: () => false,
                isOnline: () => true,
                onAvailable,
                delayMs: 1000,
                ...overrides,
            },
        }
    }

    it('checks once in the background after the delay and reports an update', async () => {
        const { check, onAvailable, deps: options } = deps()
        scheduleStartupUpdateCheck(options)
        expect(check).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(1000)
        expect(check).toHaveBeenCalledTimes(1)
        expect(check).toHaveBeenCalledWith({ background: true })
        expect(onAvailable).toHaveBeenCalledWith(INFO)
    })

    it.each([
        ['outside the desktop app', { isDesktop: () => false }],
        ['in Local-Only mode', { isLocalOnly: () => true }],
        ['offline', { isOnline: () => false }],
    ])('never checks %s', async (_label, overrides) => {
        const { check, deps: options } = deps(overrides)
        scheduleStartupUpdateCheck(options)
        await vi.advanceTimersByTimeAsync(5000)
        expect(check).not.toHaveBeenCalled()
    })

    it('does not check when Local-Only mode was switched on during the delay', async () => {
        let localOnly = false
        const { check, deps: options } = deps({ isLocalOnly: () => localOnly })
        scheduleStartupUpdateCheck(options)
        localOnly = true
        await vi.advanceTimersByTimeAsync(1000)
        expect(check).not.toHaveBeenCalled()
    })

    it('stays quiet when there is no update or the check fails, and can be cancelled', async () => {
        const none = deps()
        none.check.mockResolvedValueOnce(null)
        scheduleStartupUpdateCheck(none.deps)
        await vi.advanceTimersByTimeAsync(1000)
        expect(none.onAvailable).not.toHaveBeenCalled()

        const failing = deps()
        failing.check.mockRejectedValueOnce(new Error('offline'))
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        scheduleStartupUpdateCheck(failing.deps)
        await vi.advanceTimersByTimeAsync(1000)
        expect(failing.onAvailable).not.toHaveBeenCalled()
        debug.mockRestore()

        const cancelled = deps()
        scheduleStartupUpdateCheck(cancelled.deps)()
        await vi.advanceTimersByTimeAsync(1000)
        expect(cancelled.check).not.toHaveBeenCalled()
    })
})

/** A save that stays pending until the test resolves it. */
const deferredSave = () => {
    let finish: (saved: boolean) => void = () => undefined
    const flush: PersistFlush = () => new Promise<boolean>((resolve) => (finish = resolve))
    return { flush, finish: (saved: boolean) => finish(saved) }
}

/** Lets pending promise callbacks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('final save before an install ends the process', () => {
    it('confirms only once the save has finished', async () => {
        // CodeRabbit on #878: with a save that resolves at once, a handler that did
        // not await it would pass too.
        const save = deferredSave()
        const { bridge, calls } = fakeBridge()
        const done = flushThenConfirmFinalSave(save.flush, async () => bridge)
        await settle()
        expect(calls).not.toContain('confirm_final_save')
        save.finish(true)
        await done
        expect(calls).toEqual(['confirm_final_save'])
    })

    it('still confirms after a failed save, once it has finished', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const save = deferredSave()
        const { bridge, calls } = fakeBridge()
        const done = flushThenConfirmFinalSave(save.flush, async () => bridge)
        await settle()
        expect(calls).toEqual([])
        save.finish(false)
        await done
        expect(calls).toEqual(['confirm_final_save'])
        warn.mockRestore()
    })
})

describe('quit after flush', () => {
    it('confirms the quit only once the save has finished', async () => {
        const save = deferredSave()
        const { bridge, calls } = fakeBridge()
        const done = flushThenConfirmQuit(save.flush, async () => bridge)
        await settle()
        expect(calls).not.toContain('confirm_quit')
        save.finish(true)
        await done
        expect(calls).toEqual(['confirm_quit'])
    })

    it('still quits when the save fails, after it has finished', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const order: string[] = []
        const { bridge } = fakeBridge({ confirm_quit: () => order.push('confirm') })
        await flushThenConfirmQuit(
            async () => {
                order.push('flush')
                throw new Error('IndexedDB closed')
            },
            async () => bridge,
        )
        await flushThenConfirmQuit(undefined, async () => bridge)
        expect(order).toEqual(['flush', 'confirm', 'confirm'])
        warn.mockRestore()
    })
})

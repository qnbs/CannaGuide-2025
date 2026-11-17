import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
    createDesktopUpdater,
    DesktopUpdateError,
    flushThenConfirmQuit,
    scheduleStartupUpdateCheck,
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

/** A bridge that records calls; `responses` decides what each command returns. */
const fakeBridge = (
    responses: Record<string, (args?: Record<string, unknown>) => unknown> = {},
) => {
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

describe('desktop updater', () => {
    it('does nothing outside the desktop app', async () => {
        const { bridge, calls } = fakeBridge()
        const updater = updaterWith(bridge, { isDesktop: () => false })
        expect(await reasonOf(updater.check())).toBe('not-desktop')
        expect(await reasonOf(updater.installAndRestart())).toBe('not-desktop')
        expect(calls).toEqual([])
    })

    it('Local-Only mode blocks checks and downloads but not installing a downloaded bundle', async () => {
        const { bridge, calls } = fakeBridge()
        const updater = updaterWith(bridge, { isLocalOnly: () => true })
        expect(await reasonOf(updater.check())).toBe('local-only')
        expect(await reasonOf(updater.download(() => undefined))).toBe('local-only')
        await updater.installAndRestart()
        expect(calls).toEqual(['update_install'])
    })

    it('reports an available update or none', async () => {
        const available = fakeBridge({ update_check: () => INFO })
        expect(await updaterWith(available.bridge).check()).toEqual(INFO)
        const none = fakeBridge({ update_check: () => null })
        expect(await updaterWith(none.bridge).check()).toBeNull()
    })

    it('runs one step at a time', async () => {
        let release: (value: unknown) => void = () => undefined
        let checks = 0
        const { bridge, calls } = fakeBridge({
            update_check: () => {
                checks += 1
                return checks === 1 ? new Promise((resolve) => (release = resolve)) : null
            },
        })
        const updater = updaterWith(bridge)
        const first = updater.check()
        await vi.waitFor(() => expect(calls).toEqual(['update_check']))
        expect(await reasonOf(updater.download(() => undefined))).toBe('busy')
        release(INFO)
        await expect(first).resolves.toEqual(INFO)
        // Released after the first step finished.
        await expect(updater.check()).resolves.toBeNull()
    })

    it('forwards download progress and nothing else', async () => {
        const { bridge } = fakeBridge({
            update_download: (args) => {
                const channel = args?.onEvent as { onMessage: (message: unknown) => void }
                channel.onMessage({ event: 'progress', data: { downloaded: 10, total: 40 } })
                channel.onMessage({ event: 'progress', data: { downloaded: 40, total: 40 } })
                channel.onMessage({ event: 'finished' })
            },
        })
        const progress: unknown[] = []
        await updaterWith(bridge).download((step) => progress.push(step))
        expect(progress).toEqual([
            { downloaded: 10, total: 40 },
            { downloaded: 40, total: 40 },
        ])
    })

    it('a command error is a failed step with the native message', async () => {
        const { bridge } = fakeBridge({
            update_download: () => Promise.reject('signature verification failed'),
        })
        const error = await updaterWith(bridge)
            .download(() => undefined)
            .catch((caught: unknown) => caught)
        expect(error).toBeInstanceOf(DesktopUpdateError)
        expect((error as DesktopUpdateError).reason).toBe('failed')
        expect((error as DesktopUpdateError).message).toBe('signature verification failed')
    })

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
    ])('never installs when the save %s', async (_label, flush) => {
        const { bridge, calls } = fakeBridge()
        const updater = updaterWith(bridge, { getFlush: () => flush as PersistFlush })
        expect(await reasonOf(updater.installAndRestart())).toBe('not-saved')
        expect(calls).toEqual([])
    })

    it('never installs when no save function is registered', async () => {
        const { bridge, calls } = fakeBridge()
        const updater = updaterWith(bridge, { getFlush: () => undefined })
        expect(await reasonOf(updater.installAndRestart())).toBe('not-saved')
        expect(calls).toEqual([])
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
        const check = vi.fn(async () => INFO as DesktopUpdateInfo | null)
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

    it('checks once after the delay and reports an update', async () => {
        const { check, onAvailable, deps: options } = deps()
        scheduleStartupUpdateCheck(options)
        expect(check).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(1000)
        expect(check).toHaveBeenCalledTimes(1)
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

describe('quit after flush', () => {
    it('confirms the quit only after the save finished', async () => {
        const order: string[] = []
        const { bridge } = fakeBridge({ confirm_quit: () => order.push('confirm') })
        await flushThenConfirmQuit(
            async () => {
                order.push('flush')
                return true
            },
            async () => bridge,
        )
        expect(order).toEqual(['flush', 'confirm'])
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

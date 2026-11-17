import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/platformService', () => ({ platform: { isTauri: true } }))

import {
    createDesktopUpdater,
    DesktopUpdateError,
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

describe('desktop updater: review fixes on #878', () => {
    it('offline blocks checks and downloads but not installing a downloaded bundle', async () => {
        const { bridge, calls } = fakeBridge()
        const updater = updaterWith(bridge, { isOnline: () => false })
        expect(await reasonOf(updater.check())).toBe('offline')
        expect(await reasonOf(updater.download(() => undefined))).toBe('offline')
        await updater.installAndRestart()
        expect(calls).toEqual(['update_install'])
    })

    it('remembers the stage for the launch, and a later check of the same version keeps the download', async () => {
        let next: DesktopUpdateInfo | null = INFO
        const { bridge } = fakeBridge({ update_check: () => next })
        const updater = updaterWith(bridge)
        expect(updater.currentStage()).toBeNull()
        await updater.check()
        expect(updater.currentStage()).toEqual({ kind: 'available', info: INFO })
        await updater.download(() => undefined)
        expect(updater.currentStage()).toEqual({ kind: 'ready', info: INFO })
        // The startup check after a manual download (Codex and CodeRabbit on #878).
        await updater.check()
        expect(updater.currentStage()?.kind).toBe('ready')
        next = { ...INFO, version: '1.12.1' }
        await updater.check()
        expect(updater.currentStage()).toEqual({ kind: 'available', info: next })
        next = null
        await updater.check()
        expect(updater.currentStage()).toBeNull()
    })

    it('a failed or cancelled download leaves the update available', async () => {
        const { bridge } = fakeBridge({
            update_check: () => INFO,
            update_download: () => Promise.reject('update request cancelled'),
        })
        const updater = updaterWith(bridge)
        await updater.check()
        expect(await reasonOf(updater.download(() => undefined))).toBe('cancelled')
        expect(updater.currentStage()).toEqual({ kind: 'available', info: INFO })
    })

    it('a check stopped by Local-Only is cancelled and keeps the stage it had', async () => {
        // Codex on #878: switching Local-Only on aborts a running check, not only a download.
        let checks = 0
        const { bridge } = fakeBridge({
            update_check: () => {
                checks += 1
                return checks === 1 ? INFO : Promise.reject('update request cancelled')
            },
        })
        const updater = updaterWith(bridge)
        await updater.check()
        expect(await reasonOf(updater.check())).toBe('cancelled')
        expect(updater.currentStage()).toEqual({ kind: 'available', info: INFO })
    })

    it('maps the native Local-Only refusal to its own reason', async () => {
        const { bridge } = fakeBridge({
            update_check: () =>
                Promise.reject('Local-only mode is on; the update server is not contacted'),
        })
        expect(await reasonOf(updaterWith(bridge).check())).toBe('local-only')
    })

    it('cancel reaches a running download past the one-step guard', async () => {
        let finish: (value: unknown) => void = () => undefined
        const { bridge, calls } = fakeBridge({
            update_check: () => INFO,
            update_download: () => new Promise((resolve) => (finish = resolve)),
            update_cancel: () => true,
        })
        const updater = updaterWith(bridge)
        await updater.check()
        const download = updater.download(() => undefined)
        await vi.waitFor(() => expect(calls).toContain('update_download'))
        await expect(updater.cancelDownload()).resolves.toBe(true)
        expect(calls).toContain('update_cancel')
        finish(undefined)
        await download
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

describe('save until the state settles (CodeAnt on #878)', () => {
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

    it('stops after the last round for a store that never settles, and fails on a failed save', async () => {
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        let tick = 0
        const flush = vi.fn(async () => {
            tick += 1
            return true
        })
        await expect(flushUntilStable(flush, () => ({ tick }), 3)()).resolves.toBe(true)
        expect(flush).toHaveBeenCalledTimes(3)
        debug.mockRestore()

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

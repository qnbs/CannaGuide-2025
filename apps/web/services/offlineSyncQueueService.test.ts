import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pushToGistMock = vi.fn()
const setSyncStatusMock = vi.fn()
const setSyncPendingRetriesMock = vi.fn()
const setSyncLastSyncAtMock = vi.fn()

vi.mock('@/services/syncService', () => ({
    syncService: {
        pushToGist: (...args: unknown[]) => pushToGistMock(...args),
    },
}))

vi.mock('@/stores/useUIStore', () => ({
    useUIStore: {
        getState: () => ({
            setSyncStatus: setSyncStatusMock,
            setSyncPendingRetries: setSyncPendingRetriesMock,
            setSyncLastSyncAt: setSyncLastSyncAtMock,
        }),
    },
}))

const loadService = async () => (await import('./offlineSyncQueueService')).offlineSyncQueueService

describe('offlineSyncQueueService', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        vi.useFakeTimers()
        pushToGistMock.mockResolvedValue({ gistId: 'g1', url: 'u', syncedAt: 1000 })
        Object.defineProperty(globalThis, 'navigator', {
            value: { onLine: true },
            writable: true,
            configurable: true,
        })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('pushes immediately when online', async () => {
        const svc = await loadService()
        svc.queueSyncWhenOnline('gist-1', null)

        // Let the async push resolve
        await vi.runAllTimersAsync()

        expect(pushToGistMock).toHaveBeenCalledWith('gist-1', null)
        expect(setSyncStatusMock).toHaveBeenCalledWith('synced')
        expect(setSyncLastSyncAtMock).toHaveBeenCalledWith(1000)
    })

    it('queues push when offline and executes on online event', async () => {
        Object.defineProperty(globalThis.navigator, 'onLine', {
            value: false,
            configurable: true,
        })

        const svc = await loadService()
        svc.queueSyncWhenOnline('gist-2', 'key')

        expect(pushToGistMock).not.toHaveBeenCalled()
        expect(svc.hasPendingSync()).toBe(true)

        // Simulate coming back online
        Object.defineProperty(globalThis.navigator, 'onLine', {
            value: true,
            configurable: true,
        })
        globalThis.dispatchEvent(new Event('online'))

        await vi.runAllTimersAsync()

        expect(pushToGistMock).toHaveBeenCalledWith('gist-2', 'key')
    })

    it('retries with backoff on push failure', async () => {
        pushToGistMock
            .mockRejectedValueOnce(new Error('network'))
            .mockResolvedValueOnce({ gistId: 'g', url: 'u', syncedAt: 2000 })

        const svc = await loadService()
        svc.queueSyncWhenOnline('gist-3', null)

        // Let the first attempt (immediate) + backoff retry resolve
        // runAllTimersAsync resolves both the initial promise and the 2s setTimeout
        for (let i = 0; i < 5; i++) {
            await vi.advanceTimersByTimeAsync(3000)
            await vi.runAllTimersAsync()
        }

        expect(pushToGistMock).toHaveBeenCalledTimes(2)
        expect(setSyncStatusMock).toHaveBeenCalledWith('synced')
    })

    it('gives up after max retries', async () => {
        pushToGistMock.mockRejectedValue(new Error('network'))

        const svc = await loadService()
        svc.queueSyncWhenOnline('gist-4', null)

        // Exhaust all 3 retries with generous time advances
        for (let i = 0; i < 5; i++) {
            await vi.advanceTimersByTimeAsync(10000)
            await vi.runAllTimersAsync()
        }

        expect(pushToGistMock).toHaveBeenCalledTimes(3)
        expect(setSyncStatusMock).toHaveBeenCalledWith('error', 'Sync failed after retries')
    })

    it('cancelPending clears the queue', async () => {
        Object.defineProperty(globalThis.navigator, 'onLine', {
            value: false,
            configurable: true,
        })

        const svc = await loadService()
        svc.queueSyncWhenOnline('gist-5', null)

        expect(svc.hasPendingSync()).toBe(true)

        svc.cancelPending()

        expect(svc.hasPendingSync()).toBe(false)
        expect(setSyncPendingRetriesMock).toHaveBeenCalledWith(0)
    })
})

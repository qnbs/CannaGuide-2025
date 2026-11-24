import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const listOfflineActions = vi.fn()
const countOfflineActions = vi.fn()
const clearOfflineActions = vi.fn()
const addOfflineAction = vi.fn()

vi.mock('@/services/dbService', () => ({
    dbService: {
        listOfflineActions,
        countOfflineActions,
        clearOfflineActions,
        addOfflineAction,
    },
}))

const platform = vi.hoisted(() => ({ isTauri: false }))
vi.mock('@/services/platformService', () => ({ platform }))

describe('requestBackgroundSync without a service worker (GH #931)', () => {
    beforeEach(() => {
        platform.isTauri = false
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('reports sync as unavailable in the desktop shell without waiting for a worker', async () => {
        platform.isTauri = true
        const ready = vi.fn()
        vi.stubGlobal('navigator', {
            serviceWorker: {
                get ready() {
                    ready()
                    return new Promise(() => undefined)
                },
            },
        })
        const { offlineActionQueueService } = await import('./offlineActionQueueService')
        await expect(offlineActionQueueService.requestBackgroundSync()).resolves.toBe(false)
        expect(ready).not.toHaveBeenCalled()
    })

    it('answers unavailable in time, and still schedules the replay for a late worker', async () => {
        vi.useFakeTimers()
        let becomeReady: (registration: unknown) => void = () => undefined
        const ready = new Promise((resolve) => {
            becomeReady = resolve
        })
        const register = vi.fn().mockResolvedValue(undefined)
        vi.stubGlobal('navigator', { serviceWorker: { ready } })
        const { offlineActionQueueService, SERVICE_WORKER_READY_MS } =
            await import('./offlineActionQueueService')
        const pending = offlineActionQueueService.requestBackgroundSync()
        await vi.advanceTimersByTimeAsync(SERVICE_WORKER_READY_MS)
        await expect(pending).resolves.toBe(false)
        expect(register).not.toHaveBeenCalled()

        becomeReady({ sync: { register } })
        await vi.advanceTimersByTimeAsync(0)
        expect(register).toHaveBeenCalledWith('data-sync')
    })

    it('still registers the sync once a worker is ready', async () => {
        const register = vi.fn().mockResolvedValue(undefined)
        vi.stubGlobal('navigator', {
            serviceWorker: { ready: Promise.resolve({ sync: { register } }) },
        })
        const { offlineActionQueueService } = await import('./offlineActionQueueService')
        await expect(offlineActionQueueService.requestBackgroundSync()).resolves.toBe(true)
        expect(register).toHaveBeenCalledWith('data-sync')
    })
})

describe('offlineActionQueueService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('lists queued actions from dbService', async () => {
        listOfflineActions.mockResolvedValue([{ type: 'journal/add', id: 1 }])
        const { offlineActionQueueService } = await import('./offlineActionQueueService')
        const items = await offlineActionQueueService.list()
        expect(items).toHaveLength(1)
        expect(offlineActionQueueService.describeAction(items[0]!)).toBe('journal/add')
    })

    it('describes unknown actions', async () => {
        const { offlineActionQueueService } = await import('./offlineActionQueueService')
        expect(offlineActionQueueService.describeAction({})).toBe('unknown')
    })

    it('clears the queue via dbService', async () => {
        const { offlineActionQueueService } = await import('./offlineActionQueueService')
        await offlineActionQueueService.clear()
        expect(clearOfflineActions).toHaveBeenCalled()
    })

    it('queues journal entries with idempotency key', async () => {
        const { offlineActionQueueService } = await import('./offlineActionQueueService')
        const { OFFLINE_ACTION_TYPES } = await import('@/constants/offlineActions')
        const entry = { id: 'j-1', createdAt: 1, type: 'note', title: 't', details: {} }
        await offlineActionQueueService.queueJournalEntry('plant-1', entry as never)
        expect(addOfflineAction).toHaveBeenCalledWith(
            expect.objectContaining({
                type: OFFLINE_ACTION_TYPES.ADD_JOURNAL_ENTRY,
                plantId: 'plant-1',
                entry,
                idempotencyKey: 'journal-entry-plant-1-j-1',
            }),
        )
    })
})

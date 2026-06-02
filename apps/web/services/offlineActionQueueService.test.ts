import { describe, it, expect, vi, beforeEach } from 'vitest'

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

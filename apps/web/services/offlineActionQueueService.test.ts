import { describe, it, expect, vi, beforeEach } from 'vitest'

const listOfflineActions = vi.fn()
const countOfflineActions = vi.fn()
const clearOfflineActions = vi.fn()

vi.mock('@/services/dbService', () => ({
    dbService: {
        listOfflineActions,
        countOfflineActions,
        clearOfflineActions,
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
})

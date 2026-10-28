import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAllData } from '@/stores/slices/settingsSlice'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { removePrimaryPersistedSnapshot } from '@/services/persistedStateService'

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: { removeItem: vi.fn(async () => undefined) },
}))
vi.mock('@/services/persistedStateService', () => ({
    removePrimaryPersistedSnapshot: vi.fn(async () => true),
    updatePrimaryPersistedSnapshot: vi.fn(),
}))
vi.mock('@/services/aiProviderService', () => ({
    aiProviderService: { clearAllProviderApiKeys: vi.fn(async () => undefined) },
}))
vi.mock('@/services/cloudTtsKeyService', () => ({
    cloudTtsKeyService: { clearApiKey: vi.fn(async () => undefined) },
}))

const reload = vi.fn()
const runReset = () => resetAllData()(vi.fn(), () => ({}), undefined)

describe('resetAllData (#711 review)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...window.location, reload },
        })
    })

    it('deletes the startup backup and the recovery rollback with the snapshot', async () => {
        const result = await runReset()
        expect(result.meta.requestStatus).toBe('fulfilled')
        const removed = vi.mocked(indexedDBStorage.removeItem).mock.calls.map(([key]) => key)
        expect(removed).toEqual(
            expect.arrayContaining([
                'cannaguide-redux-storage-backup',
                'cannaguide-redux-storage-recovery-rollback',
                'geminiApiKey',
            ]),
        )
        expect(reload).toHaveBeenCalled()
    })

    it('keeps every copy when safe recovery blocks the reset', async () => {
        vi.mocked(removePrimaryPersistedSnapshot).mockResolvedValueOnce(false)
        const result = await runReset()
        expect(result.meta.requestStatus).toBe('rejected')
        expect(indexedDBStorage.removeItem).not.toHaveBeenCalled()
        expect(reload).not.toHaveBeenCalled()
    })
})

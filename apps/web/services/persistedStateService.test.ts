import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    schedule: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    migrate: vi.fn((snapshot: string) => `migrated:${snapshot}`),
}))

vi.mock('@/bootstrap/persistenceCoordinator', () => ({
    schedulePersistenceWrite: mocks.schedule,
}))
vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: mocks.getItem,
        setItem: mocks.setItem,
        removeItem: mocks.removeItem,
    },
}))
vi.mock('@/services/migration/persistedSnapshot', () => ({
    migratePersistedSnapshot: mocks.migrate,
}))
vi.mock('@/constants', () => ({ REDUX_STATE_KEY: 'primary' }))

describe('persistedStateService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.schedule.mockImplementation(async (write: () => Promise<void>) => {
            await write()
            return true
        })
    })

    it('validates and coordinates primary replacement', async () => {
        const { replacePrimaryPersistedSnapshot } = await import('./persistedStateService')

        await expect(replacePrimaryPersistedSnapshot('{"version":1}')).resolves.toBe(true)
        expect(mocks.setItem).toHaveBeenCalledWith('primary', 'migrated:{"version":1}')
    })

    it('coordinates primary removal', async () => {
        const { removePrimaryPersistedSnapshot } = await import('./persistedStateService')

        await expect(removePrimaryPersistedSnapshot()).resolves.toBe(true)
        expect(mocks.removeItem).toHaveBeenCalledWith('primary')
    })

    it('holds one coordinator operation across read-modify-write', async () => {
        const { updatePrimaryPersistedSnapshot } = await import('./persistedStateService')
        mocks.getItem.mockResolvedValueOnce('{"settings":{}}')
        mocks.migrate
            .mockReturnValueOnce('{"settings":{}}')
            .mockReturnValueOnce('{"settings":{"changed":true}}')

        await expect(
            updatePrimaryPersistedSnapshot((state) => {
                state.settings = { changed: true }
            }),
        ).resolves.toBe(true)

        expect(mocks.schedule).toHaveBeenCalledOnce()
        expect(mocks.setItem).toHaveBeenCalledWith('primary', '{"settings":{"changed":true}}')
    })
})

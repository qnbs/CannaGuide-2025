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

    it.each([
        ['fenced', false],
        ['failed', new Error('storage unavailable')],
    ])('does not report a %s backup repair as successful', async (_case, outcome) => {
        const { tryRepairPrimaryPersistedSnapshot } = await import('./persistedStateService')
        vi.spyOn(console, 'debug').mockImplementation(() => {})
        if (outcome instanceof Error) {
            mocks.schedule.mockRejectedValueOnce(outcome)
        } else {
            mocks.schedule.mockResolvedValueOnce(outcome)
        }

        await expect(tryRepairPrimaryPersistedSnapshot('{"version":1}')).resolves.toBe(false)
    })

    it('coordinates primary removal', async () => {
        const { removePrimaryPersistedSnapshot } = await import('./persistedStateService')

        await expect(removePrimaryPersistedSnapshot()).resolves.toBe(true)
        expect(mocks.removeItem).toHaveBeenCalledWith('primary')
    })

    it('holds one coordinator operation across read-modify-write', async () => {
        const { updatePrimaryPersistedSnapshot } = await import('./persistedStateService')
        mocks.getItem.mockResolvedValueOnce('{"settings":{}}')
        mocks.migrate.mockReturnValueOnce('{"settings":{"changed":true}}')

        await expect(
            updatePrimaryPersistedSnapshot((state) => {
                state.settings = { changed: true }
            }),
        ).resolves.toBe(true)

        expect(mocks.schedule).toHaveBeenCalledOnce()
        expect(mocks.migrate).toHaveBeenCalledWith('{"settings":{"changed":true}}')
        expect(mocks.setItem).toHaveBeenCalledWith('primary', '{"settings":{"changed":true}}')
    })

    it('removes a corrupt target slice before canonical migration', async () => {
        const { updatePrimaryPersistedSnapshot } = await import('./persistedStateService')
        mocks.getItem.mockResolvedValueOnce(
            '{"version":6,"simulation":{"plants":[]},"notes":{"strainNotes":{}}}',
        )
        mocks.migrate.mockReturnValueOnce('migrated-without-simulation')

        await expect(
            updatePrimaryPersistedSnapshot((state) => {
                delete state.simulation
            }),
        ).resolves.toBe(true)

        expect(mocks.migrate).toHaveBeenCalledWith('{"version":6,"notes":{"strainNotes":{}}}')
        expect(mocks.setItem).toHaveBeenCalledWith('primary', 'migrated-without-simulation')
    })

    it('does not access IndexedDB when coordinated primary mutations are blocked', async () => {
        const {
            removePrimaryPersistedSnapshot,
            replacePrimaryPersistedSnapshot,
            updatePrimaryPersistedSnapshot,
        } = await import('./persistedStateService')
        mocks.schedule.mockResolvedValue(false)

        await expect(replacePrimaryPersistedSnapshot('{"version":1}')).resolves.toBe(false)
        await expect(removePrimaryPersistedSnapshot()).resolves.toBe(false)
        await expect(updatePrimaryPersistedSnapshot(() => {})).resolves.toBe(false)

        expect(mocks.getItem).not.toHaveBeenCalled()
        expect(mocks.setItem).not.toHaveBeenCalled()
        expect(mocks.removeItem).not.toHaveBeenCalled()
    })
})

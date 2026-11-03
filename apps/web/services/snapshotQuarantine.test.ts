import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    schedule: vi.fn(),
    runExclusive: vi.fn(),
    removePrimary: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
}))

vi.mock('@/bootstrap/persistenceCoordinator', () => ({
    schedulePersistenceWrite: mocks.schedule,
    runWithExclusiveRecoveryLock: mocks.runExclusive,
}))
vi.mock('@/services/persistedStateService', () => ({
    removePrimaryPersistedSnapshot: mocks.removePrimary,
}))
vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: { getItem: mocks.getItem, setItem: mocks.setItem },
}))
vi.mock('@/constants', () => ({ REDUX_STATE_QUARANTINE_KEY: 'quarantine' }))

import {
    discardUnreadablePrimarySnapshot,
    quarantineUnreadableSnapshot,
} from './snapshotQuarantine'

/** Backs the mocked storage with a plain object and returns it for inspection. */
const useMemoryStorage = (initial: Record<string, string> = {}): Record<string, string> => {
    const stored = { ...initial }
    mocks.getItem.mockImplementation((key: string) => Promise.resolve(stored[key] ?? null))
    mocks.setItem.mockImplementation((key: string, value: string) => {
        stored[key] = value
        return Promise.resolve()
    })
    return stored
}

const TRUNCATED_WITH_KEY =
    '{"version":5,"settings":{"settings":{"tts":{"cloudTtsApiKey":"sk-secret-value"}},'

describe('quarantineUnreadableSnapshot', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        mocks.runExclusive.mockImplementation(async (operation: () => Promise<unknown>) =>
            operation(),
        )
        mocks.schedule.mockImplementation(async (write: () => Promise<void>) => {
            await write()
            return true
        })
        mocks.removePrimary.mockResolvedValue(true)
    })

    it('stores the first unreadable snapshot and reads it back', async () => {
        const stored = useMemoryStorage()

        await expect(quarantineUnreadableSnapshot('{"version":5}')).resolves.toBe('stored')

        expect(stored.quarantine).toBe('{"version":5}')
    })

    it('runs the check and the write under the exclusive cross-tab lock', async () => {
        useMemoryStorage()

        await quarantineUnreadableSnapshot('{"version":5}')

        expect(mocks.runExclusive).toHaveBeenCalledTimes(1)
        expect(mocks.schedule).not.toHaveBeenCalled()
    })

    it('falls back to the shared write path when the exclusive lock is unavailable', async () => {
        const stored = useMemoryStorage()
        mocks.runExclusive.mockResolvedValue(null)

        await expect(quarantineUnreadableSnapshot('{"version":5}')).resolves.toBe('stored')

        expect(mocks.schedule).toHaveBeenCalledTimes(1)
        expect(stored.quarantine).toBe('{"version":5}')
    })

    it('never replaces a snapshot that is already quarantined', async () => {
        const stored = useMemoryStorage({ quarantine: '{"first":true}' })

        await expect(quarantineUnreadableSnapshot('{"second":true}')).resolves.toBe('kept-earlier')

        expect(mocks.setItem).not.toHaveBeenCalled()
        expect(stored.quarantine).toBe('{"first":true}')
    })

    it('blanks a stored credential and keeps everything else', async () => {
        const stored = useMemoryStorage()
        const snapshot = JSON.stringify({
            version: 5,
            favorites: { favoriteIds: ['strain-a'] },
            settings: { settings: { tts: { cloudTtsApiKey: 'sk-secret-value', voice: 'en' } } },
        })

        await quarantineUnreadableSnapshot(snapshot)

        const kept = JSON.parse(stored.quarantine ?? 'null') as {
            version: number
            favorites: { favoriteIds: string[] }
            settings: { settings: { tts: { cloudTtsApiKey: string | null; voice: string } } }
        }
        expect(kept.settings.settings.tts.cloudTtsApiKey).toBeNull()
        expect(kept.settings.settings.tts.voice).toBe('en')
        expect(kept.version).toBe(5)
        expect(kept.favorites.favoriteIds).toEqual(['strain-a'])
    })

    it('redacts a credential in a snapshot that is not valid JSON', async () => {
        const stored = useMemoryStorage()

        await quarantineUnreadableSnapshot(TRUNCATED_WITH_KEY)

        expect(stored.quarantine).toBeDefined()
        expect(stored.quarantine).not.toContain('sk-secret-value')
        expect(stored.quarantine).toContain('"version":5')
    })

    it('reports a failed write as failed instead of throwing', async () => {
        mocks.getItem.mockResolvedValue(null)
        mocks.setItem.mockRejectedValue(new Error('QuotaExceededError'))

        await expect(quarantineUnreadableSnapshot('{"version":5}')).resolves.toBe('failed')
    })

    it('reports a readback mismatch as failed', async () => {
        mocks.getItem.mockResolvedValueOnce(null).mockResolvedValueOnce('truncated')
        mocks.setItem.mockImplementation(() => Promise.resolve())

        await expect(quarantineUnreadableSnapshot('{"version":5}')).resolves.toBe('failed')
    })

    it('reports a fenced write as failed, because nothing was written', async () => {
        useMemoryStorage()
        mocks.runExclusive.mockResolvedValue(null)
        mocks.schedule.mockResolvedValue(false)

        await expect(quarantineUnreadableSnapshot('{"version":5}')).resolves.toBe('failed')

        expect(mocks.setItem).not.toHaveBeenCalled()
    })

    it('has nothing to keep for a missing snapshot', async () => {
        await expect(quarantineUnreadableSnapshot(null)).resolves.toBe('nothing')
        await expect(quarantineUnreadableSnapshot()).resolves.toBe('nothing')
        expect(mocks.runExclusive).not.toHaveBeenCalled()
    })
})

describe('discardUnreadablePrimarySnapshot', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        mocks.runExclusive.mockImplementation(async (operation: () => Promise<unknown>) =>
            operation(),
        )
        mocks.removePrimary.mockResolvedValue(true)
    })

    it('removes the primary once the snapshot is quarantined', async () => {
        useMemoryStorage()

        await expect(discardUnreadablePrimarySnapshot('{"version":5}')).resolves.toBe(true)

        expect(mocks.removePrimary).toHaveBeenCalledTimes(1)
    })

    it('keeps the primary when the quarantine could not be written', async () => {
        mocks.getItem.mockResolvedValue(null)
        mocks.setItem.mockRejectedValue(new Error('QuotaExceededError'))

        await expect(discardUnreadablePrimarySnapshot('{"version":5}')).resolves.toBe(false)

        expect(mocks.removePrimary).not.toHaveBeenCalled()
    })

    it('still removes the primary when an earlier snapshot already holds the key', async () => {
        useMemoryStorage({ quarantine: '{"first":true}' })

        await expect(discardUnreadablePrimarySnapshot('{"second":true}')).resolves.toBe(true)

        expect(mocks.removePrimary).toHaveBeenCalledTimes(1)
    })
})

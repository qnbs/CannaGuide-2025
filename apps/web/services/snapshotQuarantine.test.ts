import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    schedule: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
}))

vi.mock('@/bootstrap/persistenceCoordinator', () => ({
    schedulePersistenceWrite: mocks.schedule,
}))
vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: { getItem: mocks.getItem, setItem: mocks.setItem },
}))
vi.mock('@/constants', () => ({ REDUX_STATE_QUARANTINE_KEY: 'quarantine' }))

import { quarantineUnreadableSnapshot } from './snapshotQuarantine'

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
        mocks.schedule.mockImplementation(async (write: () => Promise<void>) => {
            await write()
            return true
        })
    })

    it('stores the first unreadable snapshot and reads it back', async () => {
        const stored = useMemoryStorage()

        await expect(quarantineUnreadableSnapshot('{"version":5}')).resolves.toBe(true)

        expect(stored.quarantine).toBe('{"version":5}')
    })

    it('never replaces a snapshot that is already quarantined', async () => {
        const stored = useMemoryStorage({ quarantine: '{"first":true}' })

        await expect(quarantineUnreadableSnapshot('{"second":true}')).resolves.toBe(false)

        expect(mocks.setItem).not.toHaveBeenCalled()
        expect(stored.quarantine).toBe('{"first":true}')
    })

    it('redacts a stored credential instead of keeping it in plain text', async () => {
        const stored = useMemoryStorage()
        const snapshot = JSON.stringify({
            version: 5,
            settings: { settings: { tts: { cloudTtsApiKey: 'sk-secret-value' } } },
        })

        await quarantineUnreadableSnapshot(snapshot)

        expect(stored.quarantine).toBeDefined()
        expect(stored.quarantine).not.toContain('sk-secret-value')
    })

    it('redacts a credential in a snapshot that is not valid JSON', async () => {
        const stored = useMemoryStorage()

        await quarantineUnreadableSnapshot(TRUNCATED_WITH_KEY)

        expect(stored.quarantine).toBeDefined()
        expect(stored.quarantine).not.toContain('sk-secret-value')
        expect(stored.quarantine).toContain('"version":5')
    })

    it('reports a failed write as false instead of throwing', async () => {
        mocks.getItem.mockResolvedValue(null)
        mocks.setItem.mockRejectedValue(new Error('QuotaExceededError'))

        await expect(quarantineUnreadableSnapshot('{"version":5}')).resolves.toBe(false)
    })

    it('reports a readback mismatch as false', async () => {
        mocks.getItem.mockResolvedValueOnce(null).mockResolvedValueOnce('truncated')
        mocks.setItem.mockImplementation(() => Promise.resolve())

        await expect(quarantineUnreadableSnapshot('{"version":5}')).resolves.toBe(false)
    })

    it('ignores a missing snapshot', async () => {
        await expect(quarantineUnreadableSnapshot(null)).resolves.toBe(false)
        await expect(quarantineUnreadableSnapshot()).resolves.toBe(false)
        expect(mocks.schedule).not.toHaveBeenCalled()
    })
})

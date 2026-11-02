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
        const stored: Record<string, string> = {}
        mocks.getItem.mockImplementation(async (key: string) => stored[key] ?? null)
        mocks.setItem.mockImplementation(async (key: string, value: string) => {
            stored[key] = value
        })

        await expect(quarantineUnreadableSnapshot('{"version":5}')).resolves.toBe(true)

        expect(stored.quarantine).toBe('{"version":5}')
    })

    it('never replaces a snapshot that is already quarantined', async () => {
        mocks.getItem.mockResolvedValue('{"first":true}')

        await expect(quarantineUnreadableSnapshot('{"second":true}')).resolves.toBe(false)

        expect(mocks.setItem).not.toHaveBeenCalled()
    })

    it('redacts a stored credential instead of keeping it in plain text', async () => {
        const stored: Record<string, string> = {}
        mocks.getItem.mockImplementation(async (key: string) => stored[key] ?? null)
        mocks.setItem.mockImplementation(async (key: string, value: string) => {
            stored[key] = value
        })
        const snapshot = JSON.stringify({
            version: 5,
            settings: { settings: { tts: { cloudTtsApiKey: 'sk-secret-value' } } },
        })

        await quarantineUnreadableSnapshot(snapshot)

        expect(stored.quarantine).toBeDefined()
        expect(stored.quarantine).not.toContain('sk-secret-value')
    })

    it('redacts a credential in a snapshot that is not valid JSON', async () => {
        const stored: Record<string, string> = {}
        mocks.getItem.mockImplementation(async (key: string) => stored[key] ?? null)
        mocks.setItem.mockImplementation(async (key: string, value: string) => {
            stored[key] = value
        })
        const truncated =
            '{"version":5,"settings":{"settings":{"tts":{"cloudTtsApiKey":"sk-secret-value"}},'

        await quarantineUnreadableSnapshot(truncated)

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
        mocks.setItem.mockResolvedValue(undefined)

        await expect(quarantineUnreadableSnapshot('{"version":5}')).resolves.toBe(false)
    })

    it('ignores a missing snapshot', async () => {
        await expect(quarantineUnreadableSnapshot(null)).resolves.toBe(false)
        await expect(quarantineUnreadableSnapshot(undefined)).resolves.toBe(false)
        expect(mocks.schedule).not.toHaveBeenCalled()
    })
})

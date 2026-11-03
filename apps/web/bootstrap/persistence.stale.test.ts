import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { StaleSnapshotError, writeSnapshot } from '@/stores/snapshotRevision'
import { setupPersistedStateSync } from './persistence'

vi.mock('./persistenceCoordinator', () => ({
    schedulePersistenceWrite: vi.fn((write: () => Promise<unknown>) => write().then(() => true)),
}))
vi.mock('@/services/dbService', () => ({
    dbService: {
        optimizeSimulationForPersistence: vi.fn((simulation: unknown) =>
            Promise.resolve(simulation),
        ),
    },
}))
vi.mock('@/services/workerBus', () => ({ workerBus: { dispose: vi.fn() } }))
vi.mock('@/stores/useUIStore', () => ({ getUISnapshot: () => ({}) }))
vi.mock('@/services/settingsSecretStores', () => ({
    pendingLegacySecretPaths: vi.fn(() => []),
}))
vi.mock('@/stores/snapshotRevision', () => ({
    StaleSnapshotError: class StaleSnapshotError extends Error {},
    writeSnapshot: vi.fn(),
}))

const store = (): AppStore =>
    ({
        getState: () => ({
            settings: {
                version: 5,
                settings: {
                    tts: { cloudTtsEnabled: false, cloudTtsApiKey: null },
                    voiceControl: { porcupineAccessKey: null },
                    data: { persistenceIntervalMs: 1500 },
                },
            },
            simulation: { plants: {} },
            nutrientPlanner: {},
            sandbox: {},
        }),
        subscribe: vi.fn(),
    }) as unknown as AppStore

describe('a save refused because another tab saved (GH #669)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('reports it to the caller and does not count as saved', async () => {
        vi.mocked(writeSnapshot).mockRejectedValueOnce(new StaleSnapshotError())
        const onStale = vi.fn()

        const saved = await setupPersistedStateSync(store(), onStale)()

        expect(saved).toBe(false)
        expect(onStale).toHaveBeenCalledOnce()
    })

    it('does not report an ordinary failure as stale', async () => {
        vi.mocked(writeSnapshot).mockRejectedValueOnce(new Error('QuotaExceededError'))
        const onStale = vi.fn()

        const saved = await setupPersistedStateSync(store(), onStale)()

        expect(saved).toBe(false)
        expect(onStale).not.toHaveBeenCalled()
    })

    it('saves normally when the revision is current', async () => {
        vi.mocked(writeSnapshot).mockResolvedValueOnce(undefined)
        const onStale = vi.fn()

        await expect(setupPersistedStateSync(store(), onStale)()).resolves.toBe(true)

        expect(onStale).not.toHaveBeenCalled()
    })

    it('works without a stale callback', async () => {
        vi.mocked(writeSnapshot).mockRejectedValueOnce(new StaleSnapshotError())

        await expect(setupPersistedStateSync(store())()).resolves.toBe(false)
    })
})

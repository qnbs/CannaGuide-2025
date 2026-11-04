import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { REDUX_STATE_KEY } from '@/constants'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { pendingLegacySecretPaths } from '@/services/settingsSecretStores'
import { setUncheckedWritePermit } from '@/stores/snapshotRevision'
import { setupPersistedStateSync } from './persistence'
import { schedulePersistenceWrite } from './persistenceCoordinator'

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'

vi.mock('./persistenceCoordinator', () => ({
    schedulePersistenceWrite: vi.fn((write: () => Promise<unknown>) => write()),
}))
vi.mock('@/services/dbService', () => ({
    dbService: {
        optimizeSimulationForPersistence: vi.fn(async (simulation: unknown) => simulation),
    },
}))
vi.mock('@/services/workerBus', () => ({ workerBus: { dispose: vi.fn() } }))
vi.mock('@/stores/useUIStore', () => ({ getUISnapshot: () => ({}) }))
vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: { setItem: vi.fn().mockResolvedValue(undefined) },
}))
vi.mock('@/services/settingsSecretStores', () => ({
    pendingLegacySecretPaths: vi.fn(() => []),
}))

const PORCUPINE_CANARY = 'pv_canary_0000000000000000000000000000'

const storeWithKey = (): AppStore =>
    ({
        getState: () => ({
            settings: {
                version: 5,
                settings: {
                    tts: { cloudTtsEnabled: true, cloudTtsApiKey: CANARY },
                    voiceControl: { porcupineAccessKey: PORCUPINE_CANARY },
                    data: { persistenceIntervalMs: 1500 },
                },
            },
            simulation: { plants: {} },
            nutrientPlanner: {},
            sandbox: {},
        }),
        subscribe: vi.fn(),
    }) as unknown as AppStore

const savedSnapshot = (): string => {
    const call = vi
        .mocked(indexedDBStorage.setItem)
        .mock.calls.find(([key]) => key === REDUX_STATE_KEY)
    expect(call).toBeDefined()
    return String(call?.[1])
}

describe('persisted settings snapshot (#654)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // These tests save without a revision, as the writer-lock holder may; the
        // revision check itself is covered in stores/snapshotRevision.test.ts.
        setUncheckedWritePermit(() => true)
    })

    it('never writes the Cloud TTS key', async () => {
        const flush = setupPersistedStateSync(storeWithKey())
        await flush()
        const snapshot = savedSnapshot()
        expect(snapshot).not.toContain(CANARY)
        expect(snapshot).not.toContain(PORCUPINE_CANARY)
        expect(JSON.parse(snapshot).settings.settings.tts).toEqual({
            cloudTtsEnabled: true,
            cloudTtsApiKey: null,
        })
    })

    it('keeps a legacy key only while its migration is pending (preserve first)', async () => {
        vi.mocked(pendingLegacySecretPaths).mockReturnValue(['tts.cloudTtsApiKey'])
        const flush = setupPersistedStateSync(storeWithKey())
        await flush()
        expect(savedSnapshot()).toContain(CANARY)
        expect(savedSnapshot()).not.toContain(PORCUPINE_CANARY)
        vi.mocked(pendingLegacySecretPaths).mockReturnValue([])
    })
})

describe('a save that fails (GH #686)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        setUncheckedWritePermit(() => true)
    })

    const quotaError = () => new DOMException('The quota has been exceeded.', 'QuotaExceededError')

    it('tells the caller once per run of failures, and again after a save succeeded', async () => {
        // The coordinator's real contract: true once the write completed.
        vi.mocked(schedulePersistenceWrite).mockImplementation((write) => write().then(() => true))
        const onSaveFailure = vi.fn()
        const flush = setupPersistedStateSync(storeWithKey(), undefined, onSaveFailure)
        vi.mocked(indexedDBStorage.setItem).mockRejectedValue(quotaError())
        vi.spyOn(console, 'error').mockImplementation(() => undefined)

        expect(await flush()).toBe(false)
        expect(await flush()).toBe(false)
        expect(onSaveFailure).toHaveBeenCalledTimes(1)
        expect(onSaveFailure.mock.calls[0]?.[0]).toBeInstanceOf(DOMException)

        vi.mocked(indexedDBStorage.setItem).mockImplementation(() => Promise.resolve())
        expect(await flush()).toBe(true)
        vi.mocked(indexedDBStorage.setItem).mockRejectedValue(quotaError())
        await flush()

        expect(onSaveFailure).toHaveBeenCalledTimes(2)
        vi.mocked(indexedDBStorage.setItem).mockImplementation(() => Promise.resolve())
    })
})

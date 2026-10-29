import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { REDUX_STATE_KEY } from '@/constants'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'
import { setupPersistedStateSync } from './persistence'

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
vi.mock('@/services/cloudTtsKeyService', () => ({
    cloudTtsKeyService: { isLegacyKeyPending: vi.fn(() => false) },
}))

const storeWithKey = (): AppStore =>
    ({
        getState: () => ({
            settings: {
                version: 5,
                settings: {
                    tts: { cloudTtsEnabled: true, cloudTtsApiKey: CANARY },
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
    beforeEach(() => vi.clearAllMocks())

    it('never writes the Cloud TTS key', async () => {
        const flush = setupPersistedStateSync(storeWithKey())
        await flush()
        const snapshot = savedSnapshot()
        expect(snapshot).not.toContain(CANARY)
        expect(JSON.parse(snapshot).settings.settings.tts).toEqual({
            cloudTtsEnabled: true,
            cloudTtsApiKey: null,
        })
    })

    it('keeps a legacy key only while its migration is pending (preserve first)', async () => {
        vi.mocked(cloudTtsKeyService.isLegacyKeyPending).mockReturnValue(true)
        const flush = setupPersistedStateSync(storeWithKey())
        await flush()
        expect(savedSnapshot()).toContain(CANARY)
        vi.mocked(cloudTtsKeyService.isLegacyKeyPending).mockReturnValue(false)
    })
})

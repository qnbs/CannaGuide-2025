import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { REDUX_STATE_KEY, REDUX_STATE_REVISION_KEY, SLICE_SCHEMA_VERSIONS } from '@/constants'

vi.mock('@/services/dbService', () => ({
    dbService: {
        optimizeSimulationForPersistence: vi.fn(async (simulation: unknown) => simulation),
    },
}))
vi.mock('@/services/workerBus', () => ({ workerBus: { dispose: vi.fn() } }))
vi.mock('@/stores/useUIStore', () => ({ getUISnapshot: () => ({}) }))
vi.mock('@/services/settingsSecretStores', () => ({
    pendingLegacySecretPaths: vi.fn(() => []),
}))

const runtimeTabContext = globalThis as typeof globalThis & {
    __cannaguidePersistenceFailureTabId?: string
}

const openedTabClosers: Array<() => void> = []

const deleteStateDatabase = async () => {
    for (const close of openedTabClosers) close()
    openedTabClosers.length = 0
    vi.resetModules()
    const { closeIndexedDBStorage } = await import('@/stores/indexedDBStorage')
    closeIndexedDBStorage()
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('CannaGuideStateDB')
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
        request.onblocked = () => resolve()
    })
}

/**
 * Isolated module instances share one fake IndexedDB, like two browser tabs.
 */
const openTab = async () => {
    vi.resetModules()
    const idbModule = await import('@/stores/indexedDBStorage')
    const revision = await import('@/stores/snapshotRevision')
    const { setupPersistedStateSync } = await import('./persistence')
    const close = () => idbModule.closeIndexedDBStorage()
    openedTabClosers.push(close)
    return { storage: idbModule.indexedDBStorage, revision, setupPersistedStateSync, close }
}

const makeStore = (marker: string): AppStore =>
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
            simulation: {
                plants: { ids: [marker], entities: { [marker]: { id: marker, name: marker } } },
                plantSlots: [marker, null, null],
                selectedPlantId: null,
                vpdProfiles: {},
                isCatchingUp: false,
            },
            nutrientPlanner: {},
            sandbox: {},
            userStrains: { ids: [], entities: {} },
            _sliceVersions: SLICE_SCHEMA_VERSIONS,
        }),
        subscribe: vi.fn(),
    }) as unknown as AppStore

describe('setupPersistedStateSync across tabs (GH #669)', () => {
    beforeEach(async () => {
        await deleteStateDatabase()
        localStorage.clear()
        sessionStorage.clear()
        delete runtimeTabContext.__cannaguidePersistenceFailureTabId
        vi.stubGlobal('navigator', { locks: undefined })
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('refuses the second tab flush after the first tab saved through the full persistence path', async () => {
        const tabA = await openTab()
        const tabB = await openTab()
        await tabA.revision.rememberStoredRevision()
        await tabB.revision.rememberStoredRevision()

        const flushA = tabA.setupPersistedStateSync(makeStore('tab-a-plant'))()
        await expect(flushA).resolves.toBe(true)

        const revisionAfterA = await tabA.storage.getItem(REDUX_STATE_REVISION_KEY)
        expect(revisionAfterA).toBeTruthy()

        const onStaleB = vi.fn()
        const flushB = tabB.setupPersistedStateSync(makeStore('tab-b-plant'), onStaleB)
        await expect(flushB()).resolves.toBe(false)

        expect(onStaleB).toHaveBeenCalledOnce()
        expect(await tabB.storage.getItem(REDUX_STATE_REVISION_KEY)).toBe(revisionAfterA)
        const onDisk = await tabB.storage.getItem(REDUX_STATE_KEY)
        expect(onDisk).toContain('tab-a-plant')
        expect(onDisk).not.toContain('tab-b-plant')
        const revision = await tabB.storage.getItem(REDUX_STATE_REVISION_KEY)
        expect(revision).toBeTruthy()
    })

    it('lets only one tab win when both flush without Web Locks at the same revision', async () => {
        const tabA = await openTab()
        const tabB = await openTab()
        await tabA.revision.rememberStoredRevision()
        await tabB.revision.rememberStoredRevision()
        const sharedRevision = await tabA.storage.getItem(REDUX_STATE_REVISION_KEY)
        expect(sharedRevision).toBe(await tabB.storage.getItem(REDUX_STATE_REVISION_KEY))

        const onStaleA = vi.fn()
        const onStaleB = vi.fn()
        const flushA = tabA.setupPersistedStateSync(makeStore('concurrent-a'), onStaleA)
        const flushB = tabB.setupPersistedStateSync(makeStore('concurrent-b'), onStaleB)

        const results = await Promise.all([flushA(), flushB()])
        expect(results.filter(Boolean)).toEqual([true])
        expect(onStaleA.mock.calls.length + onStaleB.mock.calls.length).toBe(1)

        const onDisk = await tabA.storage.getItem(REDUX_STATE_KEY)
        const wonWithA = onDisk?.includes('concurrent-a') ?? false
        const wonWithB = onDisk?.includes('concurrent-b') ?? false
        expect(wonWithA !== wonWithB).toBe(true)
        const revisionAfterRace = await tabA.storage.getItem(REDUX_STATE_REVISION_KEY)
        expect(revisionAfterRace).toBeTruthy()
        expect(revisionAfterRace).not.toBe(sharedRevision)
    })
})

describe('persistenceCoordinator recovery epoch across modules (GH #669)', () => {
    const openCoordinator = async () => {
        vi.resetModules()
        return import('./persistenceCoordinator')
    }

    beforeEach(() => {
        localStorage.clear()
    })

    it('refuses writes in a module that booted before another tab committed recovery', async () => {
        const bootedBeforeRecovery = await openCoordinator()
        const peer = await openCoordinator()
        expect(peer.commitRecoveryEpoch()).toBe(true)
        const blockedWrite = vi.fn(async () => {})
        await expect(bootedBeforeRecovery.schedulePersistenceWrite(blockedWrite)).resolves.toBe(
            false,
        )
        expect(blockedWrite).not.toHaveBeenCalled()
    })
})
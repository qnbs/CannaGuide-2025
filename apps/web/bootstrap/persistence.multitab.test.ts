import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { REDUX_STATE_KEY, REDUX_STATE_REVISION_KEY, SLICE_SCHEMA_VERSIONS } from '@/constants'
import {
    getPendingSnapshotSaveFailureMarkers,
    hasPendingSnapshotSaveFailure,
    markSnapshotSaveFailurePresented,
} from '@/services/persistenceFailureMarker'

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
    const coordinator = await import('./persistenceCoordinator')
    const close = () => idbModule.closeIndexedDBStorage()
    openedTabClosers.push(close)
    return {
        storage: idbModule.indexedDBStorage,
        revision,
        setupPersistedStateSync,
        coordinator,
        close,
    }
}

const quotaError = () =>
    new DOMException('The quota has been exceeded.', 'QuotaExceededError')

const TAB_ID_KEY = 'cannaguide.persistenceTabId'

/** Vitest shares one sessionStorage; give each openTab() a distinct browser tab id. */
const rotatePersistenceTabSession = (tabId: string) => {
    sessionStorage.setItem(TAB_ID_KEY, tabId)
    delete runtimeTabContext.__cannaguidePersistenceFailureTabId
}

const TAB_A = '11111111-1111-4111-8111-111111111111'
const TAB_B = '22222222-2222-4222-8222-222222222222'
const TAB_ERASE = '33333333-3333-4333-8333-333333333333'
const TAB_PEER = '44444444-4444-4444-8444-444444444444'

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
        rotatePersistenceTabSession(TAB_A)
        const tabA = await openTab()
        rotatePersistenceTabSession(TAB_B)
        const tabB = await openTab()
        await tabA.revision.rememberStoredRevision()
        await tabB.revision.rememberStoredRevision()

        rotatePersistenceTabSession(TAB_A)
        const flushA = tabA.setupPersistedStateSync(makeStore('tab-a-plant'))()
        await expect(flushA).resolves.toBe(true)

        const revisionAfterA = await tabA.storage.getItem(REDUX_STATE_REVISION_KEY)
        expect(revisionAfterA).toBeTruthy()

        const onStaleB = vi.fn()
        rotatePersistenceTabSession(TAB_B)
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
        rotatePersistenceTabSession(TAB_A)
        const tabA = await openTab()
        rotatePersistenceTabSession(TAB_B)
        const tabB = await openTab()
        await tabA.revision.rememberStoredRevision()
        await tabB.revision.rememberStoredRevision()
        const sharedRevision = await tabA.storage.getItem(REDUX_STATE_REVISION_KEY)
        expect(sharedRevision).toBe(await tabB.storage.getItem(REDUX_STATE_REVISION_KEY))

        const onStaleA = vi.fn()
        const onStaleB = vi.fn()
        rotatePersistenceTabSession(TAB_A)
        const flushA = tabA.setupPersistedStateSync(makeStore('concurrent-a'), onStaleA)
        rotatePersistenceTabSession(TAB_B)
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

    it('keeps the quota failure marker on the failing tab when a peer saves successfully', async () => {
        rotatePersistenceTabSession(TAB_A)
        const tabA = await openTab()
        rotatePersistenceTabSession(TAB_B)
        const tabB = await openTab()
        await tabA.revision.rememberStoredRevision()
        await tabB.revision.rememberStoredRevision()

        vi.spyOn(tabA.storage, 'setItemIfRevision').mockRejectedValueOnce(quotaError())
        const onSaveFailure = vi.fn()
        rotatePersistenceTabSession(TAB_A)
        const flushA = tabA.setupPersistedStateSync(makeStore('quota-tab-a'), undefined, onSaveFailure)
        await expect(flushA()).resolves.toBe(false)
        expect(onSaveFailure).toHaveBeenCalledOnce()
        const markersAfterFailure = getPendingSnapshotSaveFailureMarkers()
        expect(markersAfterFailure).toHaveLength(1)
        expect(markersAfterFailure[0]?.tabId).toBe(TAB_A)

        rotatePersistenceTabSession(TAB_B)
        const flushB = tabB.setupPersistedStateSync(makeStore('quota-tab-b'))
        await expect(flushB()).resolves.toBe(true)
        expect(hasPendingSnapshotSaveFailure()).toBe(true)

        await tabA.revision.rememberStoredRevision()
        rotatePersistenceTabSession(TAB_A)
        const flushARecover = tabA.setupPersistedStateSync(makeStore('quota-tab-a-recovered'))
        await expect(flushARecover()).resolves.toBe(true)
        expect(hasPendingSnapshotSaveFailure()).toBe(false)
    })

    it('survives a simulated reload with the same tab marker until presentation and a successful save', async () => {
        rotatePersistenceTabSession(TAB_A)
        const tabA = await openTab()
        await tabA.revision.rememberStoredRevision()
        vi.spyOn(tabA.storage, 'setItemIfRevision').mockRejectedValueOnce(quotaError())
        rotatePersistenceTabSession(TAB_A)
        const failingFlush = tabA.setupPersistedStateSync(makeStore('pre-reload'))
        await expect(failingFlush()).resolves.toBe(false)
        const capturedFailures = getPendingSnapshotSaveFailureMarkers()
        expect(capturedFailures.length).toBeGreaterThan(0)

        rotatePersistenceTabSession(TAB_A)
        const afterReload = await openTab()
        await afterReload.revision.rememberStoredRevision()
        rotatePersistenceTabSession(TAB_A)
        const startupFlush = afterReload.setupPersistedStateSync(
            makeStore('post-reload-startup'),
            undefined,
            undefined,
            capturedFailures,
        )
        await expect(startupFlush()).resolves.toBe(true)
        expect(getPendingSnapshotSaveFailureMarkers()).toEqual(capturedFailures)

        markSnapshotSaveFailurePresented(capturedFailures[0]!)
        rotatePersistenceTabSession(TAB_A)
        const userFlush = afterReload.setupPersistedStateSync(
            makeStore('post-reload-user-edit'),
            undefined,
            undefined,
            capturedFailures,
        )
        await expect(userFlush()).resolves.toBe(true)
        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([])
    })
})

describe('ownership loss and privacy erasure across tab modules (GH #669)', () => {
    beforeEach(async () => {
        await deleteStateDatabase()
        localStorage.clear()
        sessionStorage.clear()
        delete runtimeTabContext.__cannaguidePersistenceFailureTabId
        vi.stubGlobal('navigator', { locks: undefined })
    })

    it('stops persistence in the tab that erases data but still lets the peer save', async () => {
        rotatePersistenceTabSession(TAB_ERASE)
        const erasingTab = await openTab()
        rotatePersistenceTabSession(TAB_PEER)
        const peerTab = await openTab()
        await erasingTab.revision.rememberStoredRevision()
        await peerTab.revision.rememberStoredRevision()

        await erasingTab.coordinator.stopPersistenceForOwnershipLoss()
        rotatePersistenceTabSession(TAB_ERASE)
        await expect(erasingTab.setupPersistedStateSync(makeStore('erased'))()).resolves.toBe(false)

        rotatePersistenceTabSession(TAB_PEER)
        await expect(peerTab.setupPersistedStateSync(makeStore('peer-keeps-saving'))()).resolves.toBe(
            true,
        )
        const onDisk = await peerTab.storage.getItem(REDUX_STATE_KEY)
        expect(onDisk).toContain('peer-keeps-saving')
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
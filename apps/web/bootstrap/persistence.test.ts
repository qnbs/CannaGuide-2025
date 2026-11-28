import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import {
    REDUX_STATE_BACKUP_KEY,
    REDUX_STATE_KEY,
    REDUX_STATE_QUARANTINE_KEY,
    REDUX_STATE_ROLLBACK_KEY,
} from '@/constants'
import { clearArchives, type ArchivesState } from '@/stores/slices/archivesSlice'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { AI_HISTORY_CLEAR_PENDING_KEY, getAiHistoryClearPhase } from '@/services/aiHistoryRetention'
import { PlantStage } from '@/types'
import { pendingLegacySecretPaths } from '@/services/settingsSecretStores'
import {
    getPendingSnapshotSaveFailureMarkers,
    hasPendingSnapshotSaveFailure,
    markSnapshotSaveFailurePresented,
} from '@/services/persistenceFailureMarker'
import { setUncheckedWritePermit } from '@/stores/snapshotRevision'
import { setupPersistedStateSync } from './persistence'
import { runWithExclusiveRecoveryLock, schedulePersistenceWrite } from './persistenceCoordinator'
import { dbService } from '@/services/dbService'

const runtimeTabContext = globalThis as typeof globalThis & {
    __cannaguidePersistenceFailureTabId?: string
}
const { persistedItems, storageSetItem } = vi.hoisted(() => {
    const items = new Map<string, string>()
    return {
        persistedItems: items,
        storageSetItem: vi.fn(async (key: string, value: string) => {
            items.set(key, value)
        }),
    }
})

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'
const RECOVERY_KEYS = [REDUX_STATE_BACKUP_KEY, REDUX_STATE_QUARANTINE_KEY, REDUX_STATE_ROLLBACK_KEY]

vi.mock('./persistenceCoordinator', () => ({
    schedulePersistenceWrite: vi.fn((write: (isBlocked: () => boolean) => Promise<unknown>) =>
        write(() => false),
    ),
    runWithExclusiveRecoveryLock: vi.fn(async (operation: () => Promise<unknown>) => operation()),
}))
vi.mock('@/services/dbService', () => ({
    dbService: {
        optimizeSimulationForPersistence: vi.fn(async (simulation: unknown) => simulation),
    },
}))
vi.mock('@/services/workerBus', () => ({ workerBus: { dispose: vi.fn() } }))
vi.mock('@/stores/useUIStore', () => ({ getUISnapshot: () => ({}) }))
vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: vi.fn(async (key: string) => persistedItems.get(key) ?? null),
        setItem: storageSetItem,
        removeItem: vi.fn(async (key: string) => {
            persistedItems.delete(key)
        }),
        setItemIfRevision: vi.fn(
            async (
                key: string,
                value: string,
                revisionKey: string,
                _expected: string | null,
                next: string,
            ) => {
                await storageSetItem(key, value)
                persistedItems.set(revisionKey, next)
                return true
            },
        ),
    },
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

const storeWithAiArchives = (
    clearOnExit = true,
): AppStore & {
    replaceArchives: (archives: ArchivesState) => void
} => {
    let state: {
        settings: { version: number; settings: Record<string, unknown> }
        simulation: { plants: Record<string, unknown> }
        nutrientPlanner: Record<string, unknown>
        sandbox: Record<string, unknown>
        archives: ArchivesState
    } = {
        settings: {
            version: 5,
            settings: {
                tts: { cloudTtsEnabled: false, cloudTtsApiKey: null },
                voiceControl: { porcupineAccessKey: null },
                data: { persistenceIntervalMs: 1500 },
                privacy: { clearAiHistoryOnExit: clearOnExit },
            },
        },
        simulation: { plants: {} },
        nutrientPlanner: {},
        sandbox: {},
        archives: {
            archivedMentorResponses: [
                {
                    id: 'mentor-1',
                    createdAt: 1,
                    query: 'test query',
                    title: 'Saved mentor reply',
                    content: 'Saved mentor content',
                },
            ],
            archivedAdvisorResponses: {
                'plant-1': [
                    {
                        id: 'advisor-1',
                        createdAt: 1,
                        plantId: 'plant-1',
                        plantStage: PlantStage.Vegetative,
                        query: 'test query',
                        title: 'Saved advisor reply',
                        content: 'Saved advisor content',
                    },
                ],
            },
        },
    }
    return {
        getState: () => state,
        dispatch: vi.fn((action: ReturnType<typeof clearArchives>) => {
            if (clearArchives.match(action)) {
                state = {
                    ...state,
                    archives: { archivedMentorResponses: [], archivedAdvisorResponses: {} },
                }
            }
            return action
        }),
        replaceArchives: (archives: ArchivesState) => {
            state = { ...state, archives }
        },
        subscribe: vi.fn(),
    } as unknown as AppStore & { replaceArchives: (archives: ArchivesState) => void }
}

const savedSnapshot = (): string => {
    const call = [...vi.mocked(indexedDBStorage.setItem).mock.calls]
        .reverse()
        .find(([key]) => key === REDUX_STATE_KEY)
    expect(call).toBeDefined()
    return String(call?.[1])
}

describe('persisted settings snapshot (#654)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        persistedItems.clear()
        localStorage.clear()
        sessionStorage.clear()
        delete runtimeTabContext.__cannaguidePersistenceFailureTabId
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

    it('commits nothing when a quit deadline passed while the snapshot was prepared (GH #883)', async () => {
        // Unblocked when the write starts; the deadline passes during preparation.
        let blocked = false
        vi.mocked(dbService.optimizeSimulationForPersistence).mockImplementationOnce(
            async (simulation) => {
                blocked = true
                return simulation
            },
        )
        vi.mocked(schedulePersistenceWrite).mockImplementationOnce(
            async (write) => (await write(() => blocked)) !== false,
        )
        const flush = setupPersistedStateSync(storeWithKey())

        expect(await flush()).toBe(false)
        expect(indexedDBStorage.setItem).not.toHaveBeenCalled()
    })
})

describe('AI archive cleanup on app exit (#678)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        persistedItems.clear()
        localStorage.clear()
        sessionStorage.clear()
        setUncheckedWritePermit(() => true)
    })

    it('clears archived Mentor and Advisor replies before the pagehide snapshot is written', async () => {
        const store = storeWithAiArchives()
        const fallback = JSON.stringify({
            version: 5,
            simulation: { selectedPlantId: 'plant-1' },
            archives: {
                archivedMentorResponses: [{ id: 'mentor-old' }],
                archivedAdvisorResponses: { 'plant-1': [{ id: 'advisor-old' }] },
            },
        })
        for (const key of RECOVERY_KEYS) {
            persistedItems.set(key, fallback)
        }
        setupPersistedStateSync(store)

        window.dispatchEvent(new Event('pagehide'))
        await vi.waitFor(() => expect(indexedDBStorage.setItem).toHaveBeenCalled())

        expect(store.dispatch).toHaveBeenCalledWith(clearArchives())
        const snapshot = JSON.parse(savedSnapshot()) as {
            archives: {
                archivedMentorResponses: unknown[]
                archivedAdvisorResponses: Record<string, unknown[]>
            }
        }
        expect(snapshot.archives).toEqual({
            archivedMentorResponses: [],
            archivedAdvisorResponses: {},
        })
        for (const key of RECOVERY_KEYS) {
            expect(JSON.parse(persistedItems.get(key) ?? '{}').archives).toEqual({
                archivedMentorResponses: [],
                archivedAdvisorResponses: {},
            })
        }
        await vi.waitFor(() =>
            expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBeNull(),
        )
    })

    it('preserves opaque recovery bytes while clearing the completed cleanup marker', async () => {
        const store = storeWithAiArchives()
        persistedItems.set(REDUX_STATE_QUARANTINE_KEY, '{unrecognized recovery bytes')
        setupPersistedStateSync(store)

        window.dispatchEvent(new Event('pagehide'))

        await vi.waitFor(() =>
            expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBeNull(),
        )
        expect(persistedItems.get(REDUX_STATE_QUARANTINE_KEY)).toBe('{unrecognized recovery bytes')
    })

    it('does not clear active archives when the durable retry marker cannot be written', async () => {
        const store = storeWithAiArchives()
        const savedSetItem = Storage.prototype.setItem
        const failedMarkerWrite = vi
            .spyOn(Storage.prototype, 'setItem')
            .mockImplementation(function (this: Storage, key: string, value: string) {
                if (key === AI_HISTORY_CLEAR_PENDING_KEY) throw new Error('storage unavailable')
                savedSetItem.call(this, key, value)
            })
        setupPersistedStateSync(store)

        window.dispatchEvent(new Event('pagehide'))
        await vi.waitFor(() => expect(indexedDBStorage.setItem).toHaveBeenCalled())

        expect(store.dispatch).not.toHaveBeenCalledWith(clearArchives())
        expect(JSON.parse(savedSnapshot()).archives.archivedMentorResponses).toHaveLength(1)
        expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBeNull()
        failedMarkerWrite.mockRestore()
    })

    it('does not clear archives when pagehide enters the back-forward cache', async () => {
        const store = storeWithAiArchives()
        setupPersistedStateSync(store)
        const event = new Event('pagehide') as PageTransitionEvent
        Object.defineProperty(event, 'persisted', { value: true })

        window.dispatchEvent(event)
        await vi.waitFor(() => expect(indexedDBStorage.setItem).toHaveBeenCalled())

        expect(store.dispatch).not.toHaveBeenCalledWith(clearArchives())
        expect(JSON.parse(savedSnapshot()).archives.archivedMentorResponses).toHaveLength(1)
        expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBeNull()
    })

    it.each([
        { description: 'recovery-only cleanup', marker: '2' },
        { description: 'an opted-out active cleanup', marker: '1' },
    ])('preserves new archives while finishing $description', async ({ marker }) => {
        const store = storeWithAiArchives(false)
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, marker)
        persistedItems.set(
            REDUX_STATE_BACKUP_KEY,
            JSON.stringify({
                version: 5,
                archives: {
                    archivedMentorResponses: [{ id: 'old-mentor' }],
                    archivedAdvisorResponses: { old: [{ id: 'old-advisor' }] },
                },
            }),
        )
        const flush = setupPersistedStateSync(store)

        await expect(flush()).resolves.toBe(true)

        expect(JSON.parse(savedSnapshot()).archives.archivedMentorResponses[0]?.id).toBe('mentor-1')
        expect(JSON.parse(persistedItems.get(REDUX_STATE_BACKUP_KEY) ?? '{}').archives).toEqual({
            archivedMentorResponses: [],
            archivedAdvisorResponses: {},
        })
        expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBeNull()
    })

    it('does not reuse startup cleanup allowance after new archives are added', async () => {
        const store = storeWithAiArchives()
        store.dispatch(clearArchives())
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '1')
        const flush = setupPersistedStateSync(store)
        store.replaceArchives({
            archivedMentorResponses: [
                { id: 'mentor-new', createdAt: 2, query: 'new', title: 'New', content: 'New' },
            ],
            archivedAdvisorResponses: {},
        })

        await expect(flush()).resolves.toBe(true)

        expect(JSON.parse(savedSnapshot()).archives.archivedMentorResponses[0]?.id).toBe(
            'mentor-new',
        )
        expect(getAiHistoryClearPhase()).toBe('active')
    })

    it('keeps the recovery retry marker when recovery locking is unavailable', async () => {
        const store = storeWithAiArchives()
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '2')
        vi.mocked(runWithExclusiveRecoveryLock).mockResolvedValueOnce(null)
        const flush = setupPersistedStateSync(store)

        await expect(flush()).resolves.toBe(true)

        expect(getAiHistoryClearPhase()).toBe('recovery')
    })

    it('keeps the retry marker when a recognized recovery copy cannot be rewritten', async () => {
        const original = JSON.stringify({
            version: 5,
            archives: {
                archivedMentorResponses: [{ id: 'old-mentor' }],
                archivedAdvisorResponses: {},
            },
        })
        persistedItems.set(REDUX_STATE_BACKUP_KEY, original)
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '2')
        const setItem = vi.mocked(indexedDBStorage.setItem)
        const savedImplementation = setItem.getMockImplementation()
        setItem.mockImplementation(async (key, value) => {
            if (key === REDUX_STATE_BACKUP_KEY) throw new Error('recovery write failed')
            await savedImplementation?.(key, value)
        })
        const flush = setupPersistedStateSync(storeWithAiArchives(false))

        await expect(flush()).resolves.toBe(true)

        expect(persistedItems.get(REDUX_STATE_BACKUP_KEY)).toBe(original)
        expect(getAiHistoryClearPhase()).toBe('recovery')
        setItem.mockImplementation(savedImplementation ?? (async () => undefined))
    })

    it('keeps the retry marker when recovery-copy read-back does not match', async () => {
        const original = JSON.stringify({
            version: 5,
            archives: {
                archivedMentorResponses: [{ id: 'old-mentor' }],
                archivedAdvisorResponses: {},
            },
        })
        persistedItems.set(REDUX_STATE_BACKUP_KEY, original)
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '2')
        const getItem = vi.mocked(indexedDBStorage.getItem)
        const savedImplementation = getItem.getMockImplementation()
        let backupReads = 0
        getItem.mockImplementation(async (key) => {
            if (key === REDUX_STATE_BACKUP_KEY && backupReads++ > 0) return '{stale read-back}'
            return (await savedImplementation?.(key)) ?? null
        })
        const flush = setupPersistedStateSync(storeWithAiArchives(false))

        await expect(flush()).resolves.toBe(true)

        expect(persistedItems.get(REDUX_STATE_BACKUP_KEY)).not.toBe(original)
        expect(getAiHistoryClearPhase()).toBe('recovery')
        getItem.mockImplementation(savedImplementation ?? (async () => null))
    })

    it('saves on the document hidden event without clearing archived replies', async () => {
        const store = storeWithAiArchives()
        setupPersistedStateSync(store)
        const visibilityState = vi
            .spyOn(document, 'visibilityState', 'get')
            .mockReturnValue('hidden')

        document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
        await vi.waitFor(() => expect(indexedDBStorage.setItem).toHaveBeenCalled())

        expect(store.dispatch).not.toHaveBeenCalledWith(clearArchives())
        expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBeNull()
        expect(JSON.parse(savedSnapshot()).archives.archivedMentorResponses).toHaveLength(1)
        visibilityState.mockRestore()
    })

    it('retains the retry marker when the primary snapshot write fails', async () => {
        const store = storeWithAiArchives()
        store.dispatch(clearArchives())
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '1')
        const flush = setupPersistedStateSync(store)
        vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(new Error('write failed'))
        vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await expect(flush()).resolves.toBe(false)

        expect(getAiHistoryClearPhase()).toBe('active')
    })
})

describe('a save that fails (GH #686)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        sessionStorage.clear()
        delete runtimeTabContext.__cannaguidePersistenceFailureTabId
        setUncheckedWritePermit(() => true)
    })

    const quotaError = () => new DOMException('The quota has been exceeded.', 'QuotaExceededError')

    it('tells the caller once per run of failures, and again after a save succeeded', async () => {
        // The coordinator's real contract: true once the write completed.
        vi.mocked(schedulePersistenceWrite).mockImplementation((write) =>
            write(() => false).then(() => true),
        )
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

    it('keeps a payload-free warning marker until a later snapshot save succeeds', async () => {
        vi.mocked(schedulePersistenceWrite).mockImplementation((write) =>
            write(() => false).then(() => true),
        )
        const onSaveFailure = vi.fn()
        const flush = setupPersistedStateSync(storeWithKey(), undefined, onSaveFailure)
        sessionStorage.clear()
        delete runtimeTabContext.__cannaguidePersistenceFailureTabId
        const otherTabFlush = setupPersistedStateSync(storeWithKey())
        vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(quotaError())

        await expect(flush()).resolves.toBe(false)

        expect(localStorage.length).toBe(1)
        const markerValues = Array.from({ length: localStorage.length }, (_, index) =>
            localStorage.getItem(localStorage.key(index) ?? ''),
        )
        expect(markerValues).toHaveLength(1)
        expect(markerValues[0]).toBeTruthy()
        expect(JSON.stringify(markerValues)).not.toContain(CANARY)
        expect(JSON.stringify(markerValues)).not.toContain(PORCUPINE_CANARY)
        expect(hasPendingSnapshotSaveFailure()).toBe(true)
        expect(onSaveFailure).toHaveBeenCalledOnce()

        // Another tab that started before the failure has not observed it and
        // cannot clear this tab's marker when it saves successfully.
        vi.mocked(indexedDBStorage.setItem).mockResolvedValueOnce(undefined)
        await expect(otherTabFlush()).resolves.toBe(true)
        expect(hasPendingSnapshotSaveFailure()).toBe(true)

        vi.mocked(indexedDBStorage.setItem).mockResolvedValueOnce(undefined)
        await expect(flush()).resolves.toBe(true)
        expect(hasPendingSnapshotSaveFailure()).toBe(false)
    })

    it('records an ordinary failure before the scheduled write slot is released', async () => {
        let failureInWriteSlot!: () => void
        const writeFailed = new Promise<void>((resolve) => {
            failureInWriteSlot = resolve
        })
        let releaseFailure!: () => void
        const holdFailedSlot = new Promise<void>((resolve) => {
            releaseFailure = resolve
        })
        vi.mocked(schedulePersistenceWrite).mockImplementationOnce(async (write) => {
            try {
                await write(() => false)
                return true
            } catch (error) {
                failureInWriteSlot()
                await holdFailedSlot
                throw error
            }
        })
        const failedTabFlush = setupPersistedStateSync(storeWithKey())
        sessionStorage.clear()
        delete runtimeTabContext.__cannaguidePersistenceFailureTabId
        const otherTabFlush = setupPersistedStateSync(storeWithKey())
        vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(quotaError())

        const failedWrite = failedTabFlush()
        await writeFailed
        expect(hasPendingSnapshotSaveFailure()).toBe(true)

        vi.mocked(indexedDBStorage.setItem).mockResolvedValueOnce(undefined)
        await expect(otherTabFlush()).resolves.toBe(true)
        expect(hasPendingSnapshotSaveFailure()).toBe(true)

        releaseFailure()
        await expect(failedWrite).resolves.toBe(false)
        expect(hasPendingSnapshotSaveFailure()).toBe(true)
    })

    it('records a failure when the coordinator rejects before invoking the write callback', async () => {
        vi.mocked(schedulePersistenceWrite).mockImplementation((write) =>
            write(() => false).then(() => true),
        )
        const onSaveFailure = vi.fn()
        const flush = setupPersistedStateSync(storeWithKey(), undefined, onSaveFailure)
        const coordinationError = new Error('Persistence lock request failed')
        vi.mocked(schedulePersistenceWrite).mockRejectedValueOnce(coordinationError)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await expect(flush()).resolves.toBe(false)

        expect(indexedDBStorage.setItem).not.toHaveBeenCalled()
        expect(hasPendingSnapshotSaveFailure()).toBe(true)
        expect(onSaveFailure).toHaveBeenCalledOnce()
        expect(onSaveFailure).toHaveBeenCalledWith(coordinationError)

        await expect(flush()).resolves.toBe(true)
        expect(hasPendingSnapshotSaveFailure()).toBe(false)
    })

    it('does not let an automatic startup save hide a warning captured during hydration', async () => {
        vi.mocked(schedulePersistenceWrite).mockImplementation((write) =>
            write(() => false).then(() => true),
        )
        const failedTabFlush = setupPersistedStateSync(storeWithKey())
        vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(quotaError())
        await expect(failedTabFlush()).resolves.toBe(false)
        const capturedFailures = getPendingSnapshotSaveFailureMarkers()

        // The same sessionStorage tab id survives reload. The startup repair/save is
        // successful, but it only writes the restored snapshot and cannot recover edits
        // that were lost before hydration.
        const startupFlush = setupPersistedStateSync(
            storeWithKey(),
            undefined,
            undefined,
            capturedFailures,
        )
        vi.mocked(indexedDBStorage.setItem).mockResolvedValueOnce(undefined)
        await expect(startupFlush()).resolves.toBe(true)

        expect(getPendingSnapshotSaveFailureMarkers()).toEqual(capturedFailures)

        markSnapshotSaveFailurePresented(capturedFailures[0]!)
        vi.mocked(indexedDBStorage.setItem).mockResolvedValueOnce(undefined)
        await expect(startupFlush()).resolves.toBe(true)
        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([])
    })

    it('gives a new failure after presentation a new token so a successful retry resolves it', async () => {
        vi.mocked(schedulePersistenceWrite).mockImplementation((write) =>
            write(() => false).then(() => true),
        )
        const tabFlush = setupPersistedStateSync(storeWithKey())
        vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(quotaError())
        await expect(tabFlush()).resolves.toBe(false)
        const capturedFailure = getPendingSnapshotSaveFailureMarkers()[0]!

        const startupFlush = setupPersistedStateSync(storeWithKey(), undefined, undefined, [
            capturedFailure,
        ])
        vi.mocked(indexedDBStorage.setItem).mockResolvedValueOnce(undefined)
        await expect(startupFlush()).resolves.toBe(true)
        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([capturedFailure])

        markSnapshotSaveFailurePresented(capturedFailure)
        vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(quotaError())
        await expect(tabFlush()).resolves.toBe(false)
        const retriedFailure = getPendingSnapshotSaveFailureMarkers()[0]!
        expect(retriedFailure.token).not.toBe(capturedFailure.token)
        expect(retriedFailure.warningState).toBe('unpresented')

        vi.mocked(indexedDBStorage.setItem).mockResolvedValueOnce(undefined)
        await expect(startupFlush()).resolves.toBe(true)
        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([])
    })

    it('keeps the IndexedDB result authoritative when localStorage is unavailable', async () => {
        localStorage.clear()
        vi.mocked(schedulePersistenceWrite).mockImplementation((write) =>
            write(() => false).then(() => true),
        )
        const onSaveFailure = vi.fn()
        const flush = setupPersistedStateSync(storeWithKey(), undefined, onSaveFailure)
        const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Storage is blocked.', 'SecurityError')
        })
        const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new DOMException('Storage is blocked.', 'SecurityError')
        })
        vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(quotaError())

        try {
            await expect(flush()).resolves.toBe(false)
            expect(onSaveFailure).toHaveBeenCalledOnce()

            vi.mocked(indexedDBStorage.setItem).mockResolvedValueOnce(undefined)
            await expect(flush()).resolves.toBe(true)
        } finally {
            setItem.mockRestore()
            removeItem.mockRestore()
        }
    })
})

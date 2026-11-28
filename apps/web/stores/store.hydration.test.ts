import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => {
    const data = new Map<string, string>()
    const failSet = new Set<string>()
    return {
        data,
        reads: [] as string[],
        beforeRead: new Map<string, () => void>(),
        failGet: new Set<string>(),
        failSet,
        writeFails: (...names: string[]) => names.some((name) => failSet.has(name)),
        isCurrent: (revisionName: string, expected: string | null) =>
            (data.get(revisionName) ?? null) === expected,
        put: (name: string, value: string | null) => {
            if (value === null) data.delete(name)
            else data.set(name, value)
        },
    }
})

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: (key: string) => {
            db.reads.push(key)
            db.beforeRead.get(key)?.()
            return db.failGet.has(key)
                ? Promise.reject(new Error('read failed'))
                : Promise.resolve(db.data.get(key) ?? null)
        },
        setItem: (key: string, value: string) => {
            if (db.failSet.has(key)) return Promise.reject(new Error('QuotaExceededError'))
            db.data.set(key, value)
            return Promise.resolve()
        },
        removeItem: (key: string) => {
            db.data.delete(key)
            return Promise.resolve()
        },
        replaceItemRotatingRevision: (
            name: string,
            value: string | null,
            revisionName: string,
            next: string,
            expected: string | null,
            onlyIfExpected = false,
        ) => {
            if (db.writeFails(name, revisionName)) {
                return Promise.reject(new Error('QuotaExceededError'))
            }
            const wasCurrent = db.isCurrent(revisionName, expected)
            if (onlyIfExpected && !wasCurrent) return Promise.resolve(false)
            db.put(name, value)
            db.data.set(revisionName, next)
            return Promise.resolve(wasCurrent)
        },
        setItemIfRevision: (
            name: string,
            value: string,
            revisionName: string,
            expected: string | null,
            next: string,
        ) => {
            if (db.writeFails(name, revisionName)) {
                return Promise.reject(new Error('QuotaExceededError'))
            }
            if (!db.isCurrent(revisionName, expected)) return Promise.resolve(false)
            db.put(name, value)
            db.data.set(revisionName, next)
            return Promise.resolve(true)
        },
    },
}))
vi.mock('@/services/voiceOrchestratorService', () => ({
    voiceOrchestratorService: { init: vi.fn() },
}))
vi.mock('@/services/uiStateBridge', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/uiStateBridge')>()),
    initUIStateBridgeFull: vi.fn(),
}))
vi.mock('./listenerMiddleware', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./listenerMiddleware')>()),
    initFilterUrlSync: vi.fn(),
    initOnboardingSubscription: vi.fn(),
}))
vi.mock('@/services/dbService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/services/dbService')>()
    return {
        ...actual,
        dbService: {
            ...actual.dbService,
            optimizeSimulationForPersistence: (simulation: unknown) => Promise.resolve(simulation),
        },
    }
})

import { setupPersistedStateSync } from '@/bootstrap/persistence'
import {
    APP_VERSION,
    REDUX_STATE_BACKUP_KEY,
    REDUX_STATE_KEY,
    REDUX_STATE_QUARANTINE_KEY,
    REDUX_STATE_REVISION_KEY,
    SLICE_SCHEMA_VERSIONS,
} from '@/constants'
import { PlantStage } from '@/types'
import { createAppStore, getStartupHydration } from './store'
import { NewerSnapshotError } from '@/services/migration/newerSnapshot'
import { AI_HISTORY_CLEAR_PENDING_KEY } from '@/services/aiHistoryRetention'

const legacyPlant = () => ({
    id: 'plant-1',
    name: 'Legacy Plant',
    stage: PlantStage.Vegetative,
    createdAt: 1,
    lastUpdated: 1,
    strain: {
        id: 'strain-1',
        name: 'Legacy Strain',
        type: 'Hybrid',
        thc: 20,
        cbd: 1,
        floweringTime: 56,
        floweringType: 'Photoperiod',
        agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
        geneticModifiers: {
            pestResistance: 1,
            nutrientUptakeRate: 1,
            stressTolerance: 1,
            rue: 1,
            vpdTolerance: { min: 0.8, max: 1.6 },
            transpirationFactor: 1,
            stomataSensitivity: 1,
        },
    },
})

/** A snapshot saved under an older simulation schema, with one plant in it. */
const olderSnapshotWithPlant = (): string =>
    JSON.stringify({
        version: 5,
        _sliceVersions: { simulation: SLICE_SCHEMA_VERSIONS.simulation - 1 },
        simulation: {
            plants: { ids: ['plant-1'], entities: { 'plant-1': legacyPlant() } },
            plantSlots: ['plant-1', null, null],
            selectedPlantId: null,
            vpdProfiles: {},
            isCatchingUp: false,
        },
    })

/** A legacy-shaped user-strains slice that the shape guards cannot keep. */
const unreadableSnapshot = (): string =>
    JSON.stringify({
        version: 5,
        _sliceVersions: { userStrains: 0 },
        userStrains: [{ id: 'mine-1', name: 'My Cross' }],
    })

describe('createAppStore with a persisted slice of another schema version', () => {
    beforeEach(() => {
        db.data.clear()
        db.reads.length = 0
        db.beforeRead.clear()
        db.failGet.clear()
        db.failSet.clear()
        localStorage.clear()
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('hides saved archives on startup when a previous close could not finish saving', async () => {
        const snapshot = JSON.parse(olderSnapshotWithPlant()) as Record<string, unknown>
        snapshot.archives = {
            archivedMentorResponses: [{ id: 'mentor-1', title: 'Private saved reply' }],
            archivedAdvisorResponses: {
                'plant-1': [{ id: 'advisor-1', title: 'Private saved reply' }],
            },
        }
        db.data.set(REDUX_STATE_KEY, JSON.stringify(snapshot))
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '1')

        const store = await createAppStore()

        expect(store.getState().archives).toEqual({
            archivedMentorResponses: [],
            archivedAdvisorResponses: {},
        })
        expect(getStartupHydration()).toBe('snapshot')
        expect(store.getState().simulation.plants.ids).toEqual(['plant-1'])
        expect(JSON.parse(db.data.get(REDUX_STATE_BACKUP_KEY) ?? '{}').archives).toEqual({
            archivedMentorResponses: [],
            archivedAdvisorResponses: {},
        })
        expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBe('1')
    })

    it('honors an active exit request when the saved setting change was not written', async () => {
        const snapshot = JSON.parse(olderSnapshotWithPlant()) as Record<string, unknown>
        snapshot.settings = {
            version: APP_VERSION,
            settings: { privacy: { clearAiHistoryOnExit: false } },
        }
        snapshot.archives = {
            archivedMentorResponses: [{ id: 'mentor-private' }],
            archivedAdvisorResponses: { 'plant-1': [{ id: 'advisor-private' }] },
        }
        db.data.set(REDUX_STATE_KEY, JSON.stringify(snapshot))
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '1')

        const store = await createAppStore()

        expect(store.getState().archives).toEqual({
            archivedMentorResponses: [],
            archivedAdvisorResponses: {},
        })
        expect(JSON.parse(db.data.get(REDUX_STATE_BACKUP_KEY) ?? '{}').archives).toEqual({
            archivedMentorResponses: [],
            archivedAdvisorResponses: {},
        })
        expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBe('1')
    })

    it('preserves a later opt-out snapshot after the exit request was committed', async () => {
        const snapshot = JSON.parse(olderSnapshotWithPlant()) as Record<string, unknown>
        snapshot.settings = {
            version: APP_VERSION,
            settings: { privacy: { clearAiHistoryOnExit: false } },
        }
        snapshot.archives = {
            archivedMentorResponses: [{ id: 'mentor-after-opt-out' }],
            archivedAdvisorResponses: {},
        }
        db.data.set(REDUX_STATE_KEY, JSON.stringify(snapshot))
        db.data.set(REDUX_STATE_REVISION_KEY, 'revision-after-request')
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '1:request-1:revision-before-request')

        const store = await createAppStore()

        expect(store.getState().archives.archivedMentorResponses).toEqual([
            { id: 'mentor-after-opt-out' },
        ])
        expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBe(
            '2:request-1:revision-before-request',
        )
    })

    it('clears archives when recovery falls back to an unsanitized backup', async () => {
        const backup = JSON.parse(olderSnapshotWithPlant()) as Record<string, unknown>
        backup.archives = {
            archivedMentorResponses: [{ id: 'mentor-private' }],
            archivedAdvisorResponses: { 'plant-1': [{ id: 'advisor-private' }] },
        }
        db.data.set(REDUX_STATE_KEY, unreadableSnapshot())
        db.data.set(REDUX_STATE_BACKUP_KEY, JSON.stringify(backup))
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '2')

        const store = await createAppStore()

        expect(getStartupHydration()).toBe('backup')
        expect(store.getState().archives).toEqual({
            archivedMentorResponses: [],
            archivedAdvisorResponses: {},
        })
        expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBe('2')
    })

    it.each([
        { description: 'the setting was disabled', settingDisabled: true },
        { description: 'only recovery copies remain', settingDisabled: false },
    ])('preserves current primary archives when $description', async ({ settingDisabled }) => {
        const snapshot = JSON.parse(olderSnapshotWithPlant()) as Record<string, unknown>
        if (settingDisabled) {
            snapshot.settings = {
                version: APP_VERSION,
                settings: { privacy: { clearAiHistoryOnExit: false } },
            }
        }
        snapshot.archives = {
            archivedMentorResponses: [{ id: 'mentor-new', title: 'New saved reply' }],
            archivedAdvisorResponses: {},
        }
        db.data.set(REDUX_STATE_KEY, JSON.stringify(snapshot))
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '2')

        const store = await createAppStore()

        expect(store.getState().archives.archivedMentorResponses).toEqual([
            { id: 'mentor-new', title: 'New saved reply' },
        ])
        expect(localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)).toBe('2')
    })

    it('keeps the plants through a start, a save and a second start', async () => {
        db.data.set(REDUX_STATE_KEY, olderSnapshotWithPlant())

        const first = await createAppStore()
        expect(first.getState().simulation.plants.ids).toEqual(['plant-1'])
        // The desktop startup report sends this; the runtime smoke test requires it.
        expect(getStartupHydration()).toBe('snapshot')

        const save = setupPersistedStateSync(first)
        await expect(save()).resolves.toBe(true)
        const saved = JSON.parse(db.data.get(REDUX_STATE_KEY) ?? 'null') as {
            _sliceVersions: unknown
            simulation: { plants: { ids: string[] } }
        }
        expect(saved._sliceVersions).toEqual(SLICE_SCHEMA_VERSIONS)
        expect(saved.simulation.plants.ids).toEqual(['plant-1'])

        const second = await createAppStore()
        expect(second.getState().simulation.plants.ids).toEqual(['plant-1'])
        expect(db.data.has(REDUX_STATE_QUARANTINE_KEY)).toBe(false)
    })

    it('quarantines a snapshot it cannot keep, then starts empty', async () => {
        db.data.set(REDUX_STATE_KEY, unreadableSnapshot())

        const store = await createAppStore()

        expect(store.getState().userStrains.ids).toEqual([])
        expect(db.data.get(REDUX_STATE_QUARANTINE_KEY)).toBe(unreadableSnapshot())
        expect(db.data.has(REDUX_STATE_KEY)).toBe(false)
        // A stored but unreadable snapshot is not a loaded one.
        expect(getStartupHydration()).toBe('fresh')
    })

    it('keeps the first quarantined snapshot when a later one also fails', async () => {
        db.data.set(REDUX_STATE_QUARANTINE_KEY, '{"first":true}')
        db.data.set(REDUX_STATE_KEY, unreadableSnapshot())

        await createAppStore()

        expect(db.data.get(REDUX_STATE_QUARANTINE_KEY)).toBe('{"first":true}')
    })

    it('still starts and quarantines when the backup cannot be read', async () => {
        db.data.set(REDUX_STATE_KEY, unreadableSnapshot())
        db.failGet.add(REDUX_STATE_BACKUP_KEY)

        const store = await createAppStore()

        expect(store.getState().userStrains.ids).toEqual([])
        expect(db.data.get(REDUX_STATE_QUARANTINE_KEY)).toBe(unreadableSnapshot())
    })

    it('keeps the primary when the quarantine cannot be written', async () => {
        db.data.set(REDUX_STATE_KEY, unreadableSnapshot())
        db.failSet.add(REDUX_STATE_QUARANTINE_KEY)

        await createAppStore()

        expect(db.data.get(REDUX_STATE_KEY)).toBe(unreadableSnapshot())
        expect(db.data.has(REDUX_STATE_QUARANTINE_KEY)).toBe(false)
    })

    it('refuses the first save when another tab saved between the revision and the snapshot read', async () => {
        db.data.set(REDUX_STATE_KEY, olderSnapshotWithPlant())
        db.beforeRead.set(REDUX_STATE_KEY, () => {
            db.beforeRead.clear()
            db.data.set(REDUX_STATE_REVISION_KEY, 'saved-by-another-tab-in-between')
        })
        const store = await createAppStore()
        const onStale = vi.fn()
        const save = setupPersistedStateSync(store, onStale)

        await expect(save()).resolves.toBe(false)

        expect(onStale).toHaveBeenCalledOnce()
        expect(db.data.get(REDUX_STATE_REVISION_KEY)).toBe('saved-by-another-tab-in-between')
    })

    it('reads the revision before the snapshot', async () => {
        db.data.set(REDUX_STATE_KEY, olderSnapshotWithPlant())

        await createAppStore()

        expect(db.reads.indexOf(REDUX_STATE_REVISION_KEY)).toBeGreaterThanOrEqual(0)
        expect(db.reads.indexOf(REDUX_STATE_REVISION_KEY)).toBeLessThan(
            db.reads.indexOf(REDUX_STATE_KEY),
        )
    })

    it('refuses a save when another tab saved after this one started', async () => {
        db.data.set(REDUX_STATE_KEY, olderSnapshotWithPlant())
        const store = await createAppStore()
        const onStale = vi.fn()
        const save = setupPersistedStateSync(store, onStale)
        db.data.set(REDUX_STATE_REVISION_KEY, 'written-by-another-tab')
        db.data.set(REDUX_STATE_KEY, 'newer snapshot of the other tab')

        await expect(save()).resolves.toBe(false)

        expect(onStale).toHaveBeenCalledOnce()
        expect(db.data.get(REDUX_STATE_KEY)).toBe('newer snapshot of the other tab')
    })
})

describe('createAppStore with a corrupt primary and a good backup (#666)', () => {
    beforeEach(() => {
        db.data.clear()
        db.reads.length = 0
        db.beforeRead.clear()
        db.failGet.clear()
        db.failSet.clear()
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('recovers the plants from the backup instead of overwriting it with the corrupt bytes', async () => {
        db.data.set(REDUX_STATE_KEY, '{corrupt')
        db.data.set(REDUX_STATE_BACKUP_KEY, olderSnapshotWithPlant())

        const store = await createAppStore()

        expect(store.getState().simulation.plants.ids).toEqual(['plant-1'])
        expect(getStartupHydration()).toBe('backup')
        expect(db.data.get(REDUX_STATE_BACKUP_KEY)).not.toBe('{corrupt')
    })

    it('replaces the backup only after a snapshot migrated', async () => {
        db.data.set(REDUX_STATE_KEY, olderSnapshotWithPlant())
        db.data.set(REDUX_STATE_BACKUP_KEY, JSON.stringify({ version: 4 }))

        await createAppStore()

        expect(db.data.get(REDUX_STATE_BACKUP_KEY)).toBe(olderSnapshotWithPlant())
        expect(db.data.has(REDUX_STATE_QUARANTINE_KEY)).toBe(false)
    })

    // A rollback to a release without the newer-snapshot guard relabelled the primary
    // and left the newer original in the backup (CodeAnt on #871).
    const newerOriginal = (): string =>
        JSON.stringify({ version: APP_VERSION + 1, original: 'from the newer build' })

    it('quarantines a backup newer than the primary before replacing it', async () => {
        db.data.set(REDUX_STATE_KEY, olderSnapshotWithPlant())
        db.data.set(REDUX_STATE_BACKUP_KEY, newerOriginal())

        const store = await createAppStore()

        expect(store.getState().simulation.plants.ids).toEqual(['plant-1'])
        expect(db.data.get(REDUX_STATE_QUARANTINE_KEY)).toBe(newerOriginal())
        expect(db.data.get(REDUX_STATE_BACKUP_KEY)).toBe(olderSnapshotWithPlant())
    })

    it('quarantines a backup with a slice newer than this build, even when the primary has no slice versions', async () => {
        // CodeRabbit on #871: the primary alone cannot show that this backup is newer.
        const primary = JSON.stringify({ version: APP_VERSION, settings: { settings: {} } })
        const backup = JSON.stringify({
            version: APP_VERSION,
            _sliceVersions: { simulation: SLICE_SCHEMA_VERSIONS.simulation + 1 },
            simulation: { futureField: true },
        })
        db.data.set(REDUX_STATE_KEY, primary)
        db.data.set(REDUX_STATE_BACKUP_KEY, backup)

        await createAppStore()

        expect(db.data.get(REDUX_STATE_QUARANTINE_KEY)).toBe(backup)
        expect(db.data.get(REDUX_STATE_BACKUP_KEY)).toBe(primary)
    })

    it('does not refresh the backup when another tab saved after this page read the snapshot', async () => {
        // CodeAnt on #871: without Web Locks a second tab may save in between.
        const earlierBackup = JSON.stringify({ version: 5, earlier: true })
        db.data.set(REDUX_STATE_KEY, olderSnapshotWithPlant())
        db.data.set(REDUX_STATE_BACKUP_KEY, earlierBackup)
        db.beforeRead.set(REDUX_STATE_BACKUP_KEY, () => {
            db.data.set(REDUX_STATE_REVISION_KEY, 'saved-by-another-tab')
        })

        await createAppStore()

        expect(db.data.get(REDUX_STATE_BACKUP_KEY)).toBe(earlierBackup)
    })

    it('keeps a newer backup in place when the quarantine already holds a snapshot', async () => {
        db.data.set(REDUX_STATE_KEY, olderSnapshotWithPlant())
        db.data.set(REDUX_STATE_BACKUP_KEY, newerOriginal())
        db.data.set(REDUX_STATE_QUARANTINE_KEY, '{"earlier":true}')

        await createAppStore()

        expect(db.data.get(REDUX_STATE_QUARANTINE_KEY)).toBe('{"earlier":true}')
        expect(db.data.get(REDUX_STATE_BACKUP_KEY)).toBe(newerOriginal())
    })
})

describe('createAppStore with a snapshot from a newer build (#666)', () => {
    beforeEach(() => {
        db.data.clear()
        db.reads.length = 0
        db.beforeRead.clear()
        db.failGet.clear()
        db.failSet.clear()
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    const newerBuildSnapshot = (): string =>
        JSON.stringify({
            version: APP_VERSION + 1,
            settings: { version: APP_VERSION + 1, settings: { futureOption: true } },
            futureSlice: { kept: true },
        })

    it('does not start from it and leaves it and the backup in place, unquarantined', async () => {
        const earlierBackup = JSON.stringify({ version: APP_VERSION + 1, earlier: true })
        db.data.set(REDUX_STATE_KEY, newerBuildSnapshot())
        db.data.set(REDUX_STATE_BACKUP_KEY, earlierBackup)

        await expect(createAppStore()).rejects.toBeInstanceOf(NewerSnapshotError)

        expect(db.data.get(REDUX_STATE_KEY)).toBe(newerBuildSnapshot())
        expect(db.data.get(REDUX_STATE_BACKUP_KEY)).toBe(earlierBackup)
        expect(db.data.has(REDUX_STATE_QUARANTINE_KEY)).toBe(false)
    })

    it('stops at a newer backup when the primary cannot be read, instead of starting empty', async () => {
        db.data.set(REDUX_STATE_BACKUP_KEY, newerBuildSnapshot())
        db.failGet.add(REDUX_STATE_KEY)

        await expect(createAppStore()).rejects.toBeInstanceOf(NewerSnapshotError)

        expect(db.data.has(REDUX_STATE_KEY)).toBe(false)
        expect(db.data.get(REDUX_STATE_BACKUP_KEY)).toBe(newerBuildSnapshot())
        expect(db.data.has(REDUX_STATE_QUARANTINE_KEY)).toBe(false)
    })

    it('stops at a newer backup when the primary is corrupt, and keeps both', async () => {
        db.data.set(REDUX_STATE_KEY, '{corrupt')
        db.data.set(REDUX_STATE_BACKUP_KEY, newerBuildSnapshot())

        await expect(createAppStore()).rejects.toBeInstanceOf(NewerSnapshotError)

        expect(db.data.get(REDUX_STATE_KEY)).toBe('{corrupt')
        expect(db.data.get(REDUX_STATE_BACKUP_KEY)).toBe(newerBuildSnapshot())
        expect(db.data.has(REDUX_STATE_QUARANTINE_KEY)).toBe(false)
    })

    it('treats one slice from a newer schema the same way', async () => {
        const newerSlice = JSON.stringify({
            version: APP_VERSION,
            _sliceVersions: {
                ...SLICE_SCHEMA_VERSIONS,
                simulation: SLICE_SCHEMA_VERSIONS.simulation + 1,
            },
            simulation: { plants: { ids: [], entities: {} }, futureField: [1, 2, 3] },
        })
        db.data.set(REDUX_STATE_KEY, newerSlice)

        await expect(createAppStore()).rejects.toBeInstanceOf(NewerSnapshotError)

        expect(db.data.get(REDUX_STATE_KEY)).toBe(newerSlice)
        expect(db.data.has(REDUX_STATE_QUARANTINE_KEY)).toBe(false)
    })
})

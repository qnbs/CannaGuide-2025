import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
    data: new Map<string, string>(),
    reads: [] as string[],
    beforeRead: new Map<string, () => void>(),
    failGet: new Set<string>(),
    failSet: new Set<string>(),
}))

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
        setItemIfRevision: (
            name: string,
            value: string,
            revisionName: string,
            expected: string | null,
            next: string,
        ) => {
            if (db.failSet.has(name) || db.failSet.has(revisionName)) {
                return Promise.reject(new Error('QuotaExceededError'))
            }
            if ((db.data.get(revisionName) ?? null) !== expected) return Promise.resolve(false)
            db.data.set(name, value)
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
    REDUX_STATE_BACKUP_KEY,
    REDUX_STATE_KEY,
    REDUX_STATE_QUARANTINE_KEY,
    REDUX_STATE_REVISION_KEY,
    SLICE_SCHEMA_VERSIONS,
} from '@/constants'
import { PlantStage } from '@/types'
import { createAppStore } from './store'

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
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('keeps the plants through a start, a save and a second start', async () => {
        db.data.set(REDUX_STATE_KEY, olderSnapshotWithPlant())

        const first = await createAppStore()
        expect(first.getState().simulation.plants.ids).toEqual(['plant-1'])

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

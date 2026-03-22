import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { indexedDB } from 'fake-indexeddb'

import { DB_NAME, DB_VERSION, STRAIN_SEARCH_INDEX_STORE } from '@/constants'
import {
    JournalEntryType,
    PlantStage,
    ProblemType,
    StrainType,
    type Plant,
    type SimulationState,
    type StoredImageData,
    type Strain,
} from '@/types'

const deleteMainDb = async (): Promise<void> => {
    await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(DB_NAME)
        request.onsuccess = () => resolve()
        request.onerror = () => resolve()
        request.onblocked = () => resolve()
    })
}

const loadDbService = async () => (await import('./dbService')).dbService

const makeStoredImage = (id = 'img-1'): StoredImageData => ({
    id,
    data: 'data:image/png;base64,ZmFrZQ==',
    createdAt: Date.now(),
})

const makeStrain = (): Strain => ({
    id: 'strain-1',
    name: 'Test Strain',
    type: StrainType.Hybrid,
    floweringType: 'Photoperiod',
    thc: 20,
    cbd: 1,
    floweringTime: 63,
    agronomic: {
        difficulty: 'Medium',
        yield: 'Medium',
        height: 'Medium',
    },
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1,
        vpdTolerance: { min: 0.8, max: 1.4 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
})

const makePlant = (journalCount: number): Plant => {
    const now = Date.now()
    return {
        id: 'plant-1',
        name: 'Plant One',
        strain: makeStrain(),
        mediumType: 'Soil',
        createdAt: now - 10 * 24 * 60 * 60 * 1000,
        lastUpdated: now,
        age: 10,
        stage: PlantStage.Vegetative,
        health: 85,
        stressLevel: 10,
        height: 25,
        biomass: { total: 1, stem: 0.3, leaves: 0.6, flowers: 0.1 },
        leafAreaIndex: 1,
        isTopped: false,
        lstApplied: 0,
        environment: {
            internalTemperature: 24,
            internalHumidity: 55,
            vpd: 1.1,
            co2Level: 420,
        },
        medium: {
            ph: 6.2,
            ec: 1.4,
            moisture: 45,
            microbeHealth: 80,
            substrateWater: 60,
            nutrientConcentration: { nitrogen: 1, phosphorus: 1, potassium: 1 },
        },
        nutrientPool: {
            nitrogen: 1,
            phosphorus: 1,
            potassium: 1,
        },
        rootSystem: {
            health: 80,
            rootMass: 1,
        },
        equipment: {
            light: { type: 'LED', wattage: 200, isOn: true, lightHours: 18 },
            exhaustFan: { power: 'medium', isOn: true },
            circulationFan: { isOn: true },
            potSize: 11,
            potType: 'Fabric',
        },
        problems: [
            {
                type: ProblemType.Overwatering,
                severity: 15,
                onsetDay: 3,
                status: 'active',
            },
        ],
        journal: Array.from({ length: journalCount }, (_, index) => ({
            id: `j-${index}`,
            createdAt: now - (journalCount - index) * 60_000,
            type: JournalEntryType.Observation,
            notes: `Journal ${index}`,
            details: {
                diagnosis: `Diag ${index}`,
            },
        })),
        tasks: [],
        harvestData: null,
        structuralModel: { branches: 2, nodes: 8 },
        history: [],
        cannabinoidProfile: { thc: 18, cbd: 1, cbn: 0.1 },
        terpeneProfile: { Myrcene: 0.4 },
        stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
        simulationClock: { accumulatedDayMs: 0 },
    }
}

const makeSimulationState = (journalCount: number): SimulationState => {
    const plant = makePlant(journalCount)
    return {
        plants: {
            ids: [plant.id],
            entities: { [plant.id]: plant },
        },
        plantSlots: [plant.id, null, null],
        selectedPlantId: plant.id,
        vpdProfiles: {},
    }
}

describe('dbService', () => {
    beforeEach(async () => {
        vi.resetModules()
        await deleteMainDb()
    })

    afterEach(async () => {
        await deleteMainDb()
    })

    it('returns an empty set for empty search tokens', async () => {
        const dbService = await loadDbService()
        const result = await dbService.searchIndex([])
        expect(result.size).toBe(0)
    })

    it('performs prefix-based AND search intersection', async () => {
        const dbService = await loadDbService()

        await dbService.updateSearchIndex({
            blue: ['a', 'b'],
            bluetooth: ['b'],
            berry: ['b', 'c'],
        })

        const result = await dbService.searchIndex(['blu', 'ber'])
        expect([...result]).toEqual(['b'])
    })

    it('filters non-string IDs from malformed search-index rows', async () => {
        const dbService = await loadDbService()

        // Ensure DB and object stores are initialized.
        await dbService.updateSearchIndex({ malformed: ['seed'] })

        await new Promise<void>((resolve, reject) => {
            const openRequest = indexedDB.open(DB_NAME, DB_VERSION)
            openRequest.onerror = () => reject(openRequest.error)
            openRequest.onsuccess = () => {
                const db = openRequest.result
                const tx = db.transaction(STRAIN_SEARCH_INDEX_STORE, 'readwrite')
                const store = tx.objectStore(STRAIN_SEARCH_INDEX_STORE)

                store.put({
                    word: 'malformed',
                    ids: ['valid-id', 123, null, { id: 'x' }],
                })

                tx.oncomplete = () => {
                    db.close()
                    resolve()
                }
                tx.onerror = () => reject(tx.error)
            }
        })

        const result = await dbService.searchIndex(['malformed'])
        expect(result.has('valid-id')).toBe(true)
        expect(result.size).toBe(1)
    })

    it('returns empty result when querying unknown strain index', async () => {
        const dbService = await loadDbService()
        const result = await dbService.queryStrainsByIndex('by_unknown', 'anything')
        expect(result).toEqual([])
    })

    it('returns empty set when search cursor emits an error', async () => {
        const dbService = await loadDbService()
        await dbService.updateSearchIndex({ token: ['id-1'] })

        const openCursorSpy = vi
            .spyOn(IDBObjectStore.prototype, 'openCursor')
            .mockImplementation(() => {
                const request = {
                    result: null,
                } as unknown as IDBRequest<IDBCursorWithValue | null>

                queueMicrotask(() => {
                    const onError = request.onerror
                    if (onError) {
                        onError.call(request, new Event('error'))
                    }
                })

                return request
            })

        const result = await dbService.searchIndex(['token'])
        expect(result.size).toBe(0)

        openCursorSpy.mockRestore()
    })

    it('archives overflow journal entries during persistence optimization', async () => {
        const dbService = await loadDbService()
        const simulationState = makeSimulationState(360)

        const optimized = await dbService.optimizeSimulationForPersistence(simulationState)
        const optimizedPlant = optimized.plants.entities['plant-1']
        expect(optimizedPlant?.journal.length).toBe(350)

        const archived = await dbService.getArchivedPlantLogs('plant-1')
        expect(archived.length).toBe(10)
    })

    it('returns empty archived logs for unknown plant ids', async () => {
        const dbService = await loadDbService()
        const archived = await dbService.getArchivedPlantLogs('missing-plant')
        expect(archived).toEqual([])
    })

    it('triggers image pruning before write when storage usage is in warning range', async () => {
        vi.doMock('@/services/imageService', () => ({
            resizeImage: vi.fn(async (data: string) => data),
        }))

        Object.defineProperty(globalThis.navigator, 'storage', {
            configurable: true,
            value: {
                estimate: vi.fn(async () => ({ usage: 78, quota: 100 })),
            },
        })

        const dbService = await loadDbService()
        const pruneSpy = vi.spyOn(dbService, 'pruneOldImages').mockResolvedValue(0)

        await dbService.addImage(makeStoredImage('warn-image'))

        expect(pruneSpy).toHaveBeenCalledWith(20)
        const stored = await dbService.getImage('warn-image')
        expect(stored?.id).toBe('warn-image')
    })

    it('stores original image payload when compression fails', async () => {
        vi.doMock('@/services/imageService', () => ({
            resizeImage: vi.fn(async () => {
                throw new Error('compression failed')
            }),
        }))

        const dbService = await loadDbService()
        const original = makeStoredImage('raw-image')

        await dbService.addImage(original)
        const stored = await dbService.getImage('raw-image')

        expect(stored?.data).toBe(original.data)
    })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Y from 'yjs'
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import simulationReducer, {
    addPlant,
    updatePlant,
    upsertPlant,
    removePlant,
    addJournalEntry,
} from '@/stores/slices/simulationSlice'
import nutrientPlannerReducer, {
    addReading,
    updateScheduleEntry,
    upsertScheduleEntry,
    removeScheduleEntry,
} from '@/stores/slices/nutrientPlannerSlice'
import settingsReducer, { defaultSettings } from '@/stores/slices/settingsSlice'
import { plantToYMap } from './crdtAdapters'
import type { Plant } from '@/types'
import { PlantStage, StrainType, JournalEntryType } from '@/types'
import type { NutrientScheduleEntry } from '@/stores/slices/nutrientPlannerSlice'
import type { AppStore } from '@/stores/store'

// ---------------------------------------------------------------------------
// Mock crdtService with an in-memory Y.Doc (no IndexedDB)
// ---------------------------------------------------------------------------

vi.mock('@sentry/react', () => ({
    captureException: vi.fn(),
    addBreadcrumb: vi.fn(),
}))

const testDoc = new Y.Doc()

vi.mock('./crdtService', () => ({
    crdtService: {
        isInitialized: () => true,
        isFallbackMode: () => false,
        getDoc: () => testDoc,
        getPlantsMap: () => testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>,
        getNutrientScheduleMap: () => testDoc.getMap('nutrient-schedule') as Y.Map<Y.Map<unknown>>,
        getNutrientReadingsMap: () => testDoc.getMap('nutrient-readings') as Y.Map<Y.Map<unknown>>,
        getSettingsMap: () => testDoc.getMap('settings'),
        getDocSizeBytes: () => 0,
    },
    CrdtError: class CrdtError extends Error {
        constructor(
            message: string,
            public readonly code: string,
            public readonly docSizeBytes: number = 0,
            public readonly pendingOps: number = 0,
        ) {
            super(message)
            this.name = 'CrdtError'
        }
    },
    CrdtErrorCode: {
        INIT_FAILED: 'CRDT_INIT_FAILED',
        SYNC_ENCODE_FAILED: 'CRDT_SYNC_ENCODE_FAILED',
        SYNC_APPLY_FAILED: 'CRDT_SYNC_APPLY_FAILED',
        STORAGE_QUOTA_EXCEEDED: 'CRDT_STORAGE_QUOTA_EXCEEDED',
        BRIDGE_LOOP_DETECTED: 'CRDT_BRIDGE_LOOP_DETECTED',
    },
}))

// ---------------------------------------------------------------------------
// Import bridge AFTER mock is set up
// ---------------------------------------------------------------------------

const {
    initCrdtSyncBridge,
    registerCrdtListeners,
    destroyCrdtSyncBridge,
    _getLoopDetectorState,
    _resetLoopDetector,
    _flushBridgeBatch,
    _getBatchQueueLength,
    _getCrdtTelemetryState,
    _resetCrdtTelemetry,
} = await import('./crdtSyncBridge')
const { startAppListening } = await import('@/stores/listenerMiddleware')
const { listenerMiddleware } = await import('@/stores/listenerMiddleware')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makePlant = (id = 'plant-1'): Plant =>
    ({
        id,
        growId: 'default-grow',
        name: `Test Plant ${id}`,
        strain: {
            id: 's1',
            name: 'Test Strain',
            type: StrainType.Hybrid,
            floweringType: 'Photoperiod',
            thc: 20,
            cbd: 1,
            floweringTime: 60,
            agronomic: {
                difficulty: 'Easy',
                yield: 'High',
                height: 'Medium',
            },
            geneticModifiers: {
                pestResistance: 1,
                nutrientUptakeRate: 1,
                stressTolerance: 1,
                rue: 1,
                vpdTolerance: { min: 0.4, max: 1.6 },
                transpirationFactor: 1,
                stomataSensitivity: 1,
            },
        },
        mediumType: 'Soil',
        createdAt: 1700000000000,
        lastUpdated: 1700000000000,
        age: 7,
        stage: PlantStage.Vegetative,
        health: 90,
        stressLevel: 5,
        height: 20,
        biomass: { total: 50, stem: 15, leaves: 25, flowers: 10 },
        leafAreaIndex: 2.5,
        isTopped: false,
        lstApplied: 0,
        environment: { internalTemperature: 25, internalHumidity: 60, vpd: 1.2, co2Level: 400 },
        medium: {
            ph: 6.2,
            ec: 1.0,
            moisture: 60,
            microbeHealth: 80,
            substrateWater: 2000,
            nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.3, potassium: 0.4 },
        },
        nutrientPool: { nitrogen: 50, phosphorus: 30, potassium: 40 },
        rootSystem: { health: 85, rootMass: 10 },
        equipment: {
            light: { type: 'LED', wattage: 300, isOn: true, lightHours: 18 },
            exhaustFan: { power: 'medium', isOn: true },
            circulationFan: { isOn: true },
            potSize: 11,
            potType: 'Fabric',
        },
        problems: [],
        journal: [],
        tasks: [],
        harvestData: null,
        structuralModel: { branches: 4, nodes: 8 },
        history: [],
        cannabinoidProfile: { thc: 0.1, cbd: 0.05, cbn: 0 },
        terpeneProfile: { myrcene: 0.3 },
        stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
        simulationClock: { accumulatedDayMs: 0 },
    }) as Plant

const makeScheduleEntry = (id = 'schedule-veg'): NutrientScheduleEntry => ({
    id,
    growId: 'default-grow',
    stage: PlantStage.Vegetative,
    targetEc: 1.2,
    targetPh: 6.3,
    npkRatio: { n: 3, p: 1, k: 2 },
    notes: '',
})

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

const rootReducer = combineReducers({
    simulation: simulationReducer,
    nutrientPlanner: nutrientPlannerReducer,
    settings: settingsReducer,
})

function createTestStore() {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().prepend(listenerMiddleware.middleware),
        preloadedState: {
            settings: {
                settings: {
                    ...defaultSettings,
                    notifications: { ...defaultSettings.notifications, enabled: false },
                },
                version: 4,
            },
        },
    }) as unknown as AppStore
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('crdtSyncBridge', () => {
    let store: AppStore

    beforeEach(() => {
        // Reset loop detector state
        _resetLoopDetector()
        _resetCrdtTelemetry()

        // Clear Y.Doc between tests
        const plantsMap = testDoc.getMap('plants')
        const scheduleMap = testDoc.getMap('nutrient-schedule')
        const readingsMap = testDoc.getMap('nutrient-readings')
        plantsMap.forEach((_: unknown, key: string) => plantsMap.delete(key))
        scheduleMap.forEach((_: unknown, key: string) => scheduleMap.delete(key))
        readingsMap.forEach((_: unknown, key: string) => readingsMap.delete(key))

        store = createTestStore()
        registerCrdtListeners(startAppListening)
        initCrdtSyncBridge(store)
    })

    afterEach(() => {
        destroyCrdtSyncBridge()
        vi.restoreAllMocks()
    })

    // -- Redux -> CRDT --------------------------------------------------------

    describe('Redux -> CRDT propagation', () => {
        it('addPlant writes to Y.Map', () => {
            const plant = makePlant()
            store.dispatch(addPlant({ plant, slotIndex: 0 }))
            _flushBridgeBatch()

            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            expect(plantsMap.has('plant-1')).toBe(true)
            const yMap = plantsMap.get('plant-1')!
            expect(yMap.get('name')).toBe('Test Plant plant-1')
        })

        it('upsertPlant (non-CRDT) writes to Y.Map', () => {
            const plant = makePlant('plant-upsert')
            store.dispatch(upsertPlant(plant))
            _flushBridgeBatch()

            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            expect(plantsMap.has('plant-upsert')).toBe(true)
        })

        it('removePlant (non-CRDT) deletes from Y.Map', () => {
            // First add a plant
            const plant = makePlant('plant-remove')
            store.dispatch(addPlant({ plant, slotIndex: 0 }))
            _flushBridgeBatch()
            expect((testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>).has('plant-remove')).toBe(
                true,
            )

            // Then remove it
            store.dispatch(removePlant('plant-remove'))
            _flushBridgeBatch()
            expect((testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>).has('plant-remove')).toBe(
                false,
            )
        })
    })

    // -- CRDT -> Redux --------------------------------------------------------

    describe('CRDT -> Redux propagation', () => {
        it('Y.Map plant add dispatches upsertPlant with fromCrdt', () => {
            const plant = makePlant('remote-plant')
            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>

            // Simulate a remote CRDT update (NOT from bridge origin)
            testDoc.transact(() => {
                const yMap = new Y.Map<unknown>()
                for (const [key, value] of Object.entries(plantToYMap(plant))) {
                    yMap.set(key, value)
                }
                plantsMap.set('remote-plant', yMap as Y.Map<unknown>)
            }, 'remote-peer')

            // Check Redux state
            const state = store.getState()
            const remotePlant = state.simulation.plants.entities['remote-plant']
            expect(remotePlant).toBeDefined()
            expect(remotePlant!.name).toBe('Test Plant remote-plant')
        })

        it('Y.Map plant delete dispatches removePlant with fromCrdt', () => {
            // First add via Redux so it exists
            const plant = makePlant('to-delete-remote')
            store.dispatch(addPlant({ plant, slotIndex: 1 }))
            _flushBridgeBatch()
            expect(store.getState().simulation.plants.entities['to-delete-remote']).toBeDefined()

            // Simulate remote deletion
            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            testDoc.transact(() => {
                plantsMap.delete('to-delete-remote')
            }, 'remote-peer')

            expect(store.getState().simulation.plants.entities['to-delete-remote']).toBeUndefined()
        })

        it('nutrient schedule add from CRDT propagates to Redux', () => {
            const entry = makeScheduleEntry('remote-schedule')
            const scheduleMap = testDoc.getMap('nutrient-schedule') as Y.Map<Y.Map<unknown>>

            testDoc.transact(() => {
                const yMap = new Y.Map<unknown>()
                yMap.set('id', entry.id)
                yMap.set('stage', entry.stage)
                yMap.set('targetEc', entry.targetEc)
                yMap.set('targetPh', entry.targetPh)
                yMap.set('npkRatio', JSON.stringify(entry.npkRatio))
                yMap.set('notes', entry.notes)
                scheduleMap.set('remote-schedule', yMap as Y.Map<unknown>)
            }, 'remote-peer')

            const state = store.getState()
            const found = state.nutrientPlanner.schedule.find((e) => e.id === 'remote-schedule')
            expect(found).toBeDefined()
            expect(found!.targetEc).toBe(1.2)
        })
    })

    // -- Loop prevention ------------------------------------------------------

    describe('loop prevention', () => {
        it('upsertPlant with fromCrdt=true does NOT trigger CRDT write', () => {
            // Clear Y.Doc plants first
            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            plantsMap.forEach((_: unknown, key: string) => plantsMap.delete(key))

            const plant = makePlant('crdt-origin-plant')
            store.dispatch(upsertPlant(plant, { fromCrdt: true }))
            _flushBridgeBatch()

            // The plant should be in Redux
            expect(store.getState().simulation.plants.entities['crdt-origin-plant']).toBeDefined()

            // But should NOT be in Y.Map (because fromCrdt flag prevents bridge write)
            expect(plantsMap.has('crdt-origin-plant')).toBe(false)
        })

        it('removePlant with fromCrdt=true does NOT trigger CRDT delete', () => {
            // Add a plant via CRDT first
            const plant = makePlant('crdt-remove-test')
            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            testDoc.transact(() => {
                const yMap = new Y.Map<unknown>()
                for (const [key, value] of Object.entries(plantToYMap(plant))) {
                    yMap.set(key, value)
                }
                plantsMap.set('crdt-remove-test', yMap as Y.Map<unknown>)
            }, 'remote-peer')

            // Now dispatch removePlant with fromCrdt=true
            store.dispatch(removePlant('crdt-remove-test', { fromCrdt: true }))
            _flushBridgeBatch()

            // Plant should be removed from Redux
            expect(store.getState().simulation.plants.entities['crdt-remove-test']).toBeUndefined()

            // But should still exist in Y.Map (bridge didn't propagate the delete)
            expect(plantsMap.has('crdt-remove-test')).toBe(true)
        })

        it('bridge-origin CRDT updates do not feed back to Redux', () => {
            // This test verifies that updates originated by the bridge itself
            // (origin === 'redux-bridge') are ignored by the CRDT->Redux observer
            const dispatchSpy = vi.spyOn(store, 'dispatch')
            const initialCallCount = dispatchSpy.mock.calls.length

            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            testDoc.transact(() => {
                const yMap = new Y.Map<unknown>()
                yMap.set('id', 'bridge-test')
                yMap.set('name', 'Bridge Test')
                plantsMap.set('bridge-test', yMap as Y.Map<unknown>)
            }, 'redux-bridge') // Using bridge origin

            // No additional dispatch calls should have been made
            // (the observer ignores bridge-originated transactions)
            const newCalls = dispatchSpy.mock.calls.slice(initialCallCount)
            const upsertCalls = newCalls.filter(
                (call) =>
                    call[0] &&
                    typeof call[0] === 'object' &&
                    'type' in call[0] &&
                    (call[0] as { type: string }).type.includes('upsertPlant'),
            )
            expect(upsertCalls).toHaveLength(0)
        })
    })

    // -- Error resilience -----------------------------------------------------

    describe('error resilience', () => {
        it('invalid CRDT data does not crash the bridge', () => {
            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>

            // Insert corrupt data (missing required fields)
            testDoc.transact(() => {
                const yMap = new Y.Map<unknown>()
                yMap.set('id', 'corrupt')
                // Missing all other required fields
                plantsMap.set('corrupt', yMap as Y.Map<unknown>)
            }, 'remote-peer')

            // Should not crash -- plant not added to Redux due to validation failure
            expect(store.getState().simulation.plants.entities['corrupt']).toBeUndefined()
        })
    })

    // -- Initial seeding ------------------------------------------------------

    describe('initial seeding', () => {
        it('seeds Y.Doc from Redux state when Y.Doc is empty', () => {
            // Create a fresh store with a pre-existing plant
            const plantStore = createTestStore()
            const plant = makePlant('pre-existing')
            plantStore.dispatch(addPlant({ plant, slotIndex: 0 }))

            // Clear Y.Doc
            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            plantsMap.forEach((_: unknown, key: string) => plantsMap.delete(key))

            // initCrdtSyncBridge should seed Y.Doc from the pre-existing Redux state
            initCrdtSyncBridge(plantStore)

            expect(plantsMap.has('pre-existing')).toBe(true)
        })
    })

    // -- Loop detector --------------------------------------------------------

    describe('loop detector', () => {
        it('starts with bridge enabled and zero dispatch count', () => {
            const state = _getLoopDetectorState()
            expect(state.bridgeDisabled).toBe(false)
            expect(state.recentDispatchCount).toBe(0)
        })

        it('resets cleanly via _resetLoopDetector', () => {
            _resetLoopDetector()
            const state = _getLoopDetectorState()
            expect(state.bridgeDisabled).toBe(false)
            expect(state.recentDispatchCount).toBe(0)
        })
    })

    // -- Redux -> CRDT: updatePlant -------------------------------------------

    describe('Redux -> CRDT: updatePlant', () => {
        it('updatePlant syncs changed fields to existing Y.Map entry', () => {
            const plant = makePlant('plant-update')
            store.dispatch(addPlant({ plant, slotIndex: 0 }))
            _flushBridgeBatch()

            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            expect(plantsMap.get('plant-update')!.get('name')).toBe('Test Plant plant-update')

            store.dispatch(updatePlant({ id: 'plant-update', changes: { name: 'Renamed Plant' } }))
            _flushBridgeBatch()
            expect(plantsMap.get('plant-update')!.get('name')).toBe('Renamed Plant')
        })

        it('updatePlant serialises object changes as JSON', () => {
            const plant = makePlant('plant-obj')
            store.dispatch(addPlant({ plant, slotIndex: 0 }))
            _flushBridgeBatch()

            store.dispatch(
                updatePlant({
                    id: 'plant-obj',
                    changes: { nutrientPool: { nitrogen: 99, phosphorus: 88, potassium: 77 } },
                }),
            )
            _flushBridgeBatch()

            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            const raw = plantsMap.get('plant-obj')!.get('nutrientPool')
            expect(typeof raw).toBe('string')
            expect(JSON.parse(raw as string)).toEqual({
                nitrogen: 99,
                phosphorus: 88,
                potassium: 77,
            })
        })

        it('updatePlant ignores non-existing plant id', () => {
            // Should not throw when updating a plant that is not in Y.Doc
            expect(() => {
                store.dispatch(updatePlant({ id: 'ghost', changes: { name: 'Ghost' } }))
            }).not.toThrow()
        })
    })

    // -- Redux -> CRDT: addJournalEntry ---------------------------------------

    describe('Redux -> CRDT: addJournalEntry', () => {
        it('syncs journal array to CRDT after addJournalEntry', () => {
            const plant = makePlant('plant-journal')
            store.dispatch(addPlant({ plant, slotIndex: 0 }))
            _flushBridgeBatch()

            store.dispatch(
                addJournalEntry({
                    plantId: 'plant-journal',
                    entry: {
                        type: JournalEntryType.Observation,
                        notes: 'Watered today',
                    },
                }),
            )
            _flushBridgeBatch()

            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            const journalRaw = plantsMap.get('plant-journal')!.get('journal')
            expect(journalRaw).toBeDefined()
            const journal = JSON.parse(journalRaw as string) as unknown[]
            expect(journal.length).toBeGreaterThanOrEqual(1)
        })
    })

    // -- Redux -> CRDT: Nutrient schedule actions -----------------------------

    describe('Redux -> CRDT: nutrient schedule', () => {
        it('updateScheduleEntry writes updated entry to CRDT', () => {
            // First seed a schedule entry via initCrdtSyncBridge preload
            const entry = makeScheduleEntry('sched-update')
            const scheduleMap = testDoc.getMap('nutrient-schedule') as Y.Map<Y.Map<unknown>>

            // Manually add to CRDT so it exists
            testDoc.transact(() => {
                const yMap = new Y.Map<unknown>()
                yMap.set('id', entry.id)
                yMap.set('stage', entry.stage)
                yMap.set('targetEc', entry.targetEc)
                yMap.set('targetPh', entry.targetPh)
                yMap.set('npkRatio', JSON.stringify(entry.npkRatio))
                yMap.set('notes', entry.notes)
                scheduleMap.set(entry.id, yMap as Y.Map<unknown>)
            }, 'remote-peer')

            // Dispatch updateScheduleEntry
            store.dispatch(upsertScheduleEntry(entry))
            store.dispatch(updateScheduleEntry({ id: 'sched-update', changes: { targetEc: 2.0 } }))
            _flushBridgeBatch()

            // The CRDT map should have the updated schedule entry
            const updatedYMap = scheduleMap.get('sched-update')
            expect(updatedYMap).toBeDefined()
        })

        it('removeScheduleEntry deletes from CRDT', () => {
            const entry = makeScheduleEntry('sched-remove')
            // Add entry to Redux store first
            store.dispatch(upsertScheduleEntry(entry))
            _flushBridgeBatch()

            const scheduleMap = testDoc.getMap('nutrient-schedule') as Y.Map<Y.Map<unknown>>
            expect(scheduleMap.has('sched-remove')).toBe(true)

            // Remove it
            store.dispatch(removeScheduleEntry('sched-remove'))
            _flushBridgeBatch()
            expect(scheduleMap.has('sched-remove')).toBe(false)
        })

        it('upsertScheduleEntry with fromCrdt=true skips CRDT write', () => {
            const entry = makeScheduleEntry('sched-crdt')
            const scheduleMap = testDoc.getMap('nutrient-schedule') as Y.Map<Y.Map<unknown>>

            store.dispatch(upsertScheduleEntry(entry, { fromCrdt: true }))
            _flushBridgeBatch()

            // Should be in Redux but NOT in CRDT (bridge skipped due to fromCrdt)
            const state = store.getState()
            expect(state.nutrientPlanner.schedule.find((e) => e.id === 'sched-crdt')).toBeDefined()
            expect(scheduleMap.has('sched-crdt')).toBe(false)
        })
    })

    // -- Redux -> CRDT: Nutrient reading actions ------------------------------

    describe('Redux -> CRDT: nutrient readings', () => {
        it('addReading writes latest reading to CRDT', () => {
            store.dispatch(
                addReading({
                    plantId: null,
                    ec: 1.8,
                    ph: 6.0,
                    waterTempC: 21,
                    readingType: 'input',
                    notes: '',
                }),
            )
            _flushBridgeBatch()

            const readingsMap = testDoc.getMap('nutrient-readings') as Y.Map<Y.Map<unknown>>
            // addReading generates id in reducer, so we check the map has at least one entry
            expect(readingsMap.size).toBeGreaterThanOrEqual(1)
        })
    })

    // -- CRDT -> Redux: schedule observer -------------------------------------

    describe('CRDT -> Redux: schedule observer', () => {
        it('schedule deletion from CRDT propagates to Redux', () => {
            const entry = makeScheduleEntry('sched-remote-del')
            // Add via Redux first
            store.dispatch(upsertScheduleEntry(entry))
            _flushBridgeBatch()
            expect(
                store.getState().nutrientPlanner.schedule.find((e) => e.id === 'sched-remote-del'),
            ).toBeDefined()

            // Simulate remote deletion from CRDT
            const scheduleMap = testDoc.getMap('nutrient-schedule') as Y.Map<Y.Map<unknown>>
            testDoc.transact(() => {
                scheduleMap.delete('sched-remote-del')
            }, 'remote-peer')

            expect(
                store.getState().nutrientPlanner.schedule.find((e) => e.id === 'sched-remote-del'),
            ).toBeUndefined()
        })
    })

    // -- CRDT -> Redux: readings observer -------------------------------------

    describe('CRDT -> Redux: readings observer', () => {
        it('reading add from CRDT propagates to Redux', () => {
            const readingsMap = testDoc.getMap('nutrient-readings') as Y.Map<Y.Map<unknown>>

            testDoc.transact(() => {
                const yMap = new Y.Map<unknown>()
                yMap.set('id', 'remote-reading-1')
                yMap.set('plantId', null)
                yMap.set('timestamp', 1700000000000)
                yMap.set('ec', 2.1)
                yMap.set('ph', 5.8)
                yMap.set('waterTempC', 22)
                yMap.set('readingType', 'input')
                yMap.set('notes', '')
                readingsMap.set('remote-reading-1', yMap as Y.Map<unknown>)
            }, 'remote-peer')

            const state = store.getState()
            const found = state.nutrientPlanner.readings.find((r) => r.id === 'remote-reading-1')
            expect(found).toBeDefined()
            expect(found!.ec).toBe(2.1)
        })
    })

    // -- Loop detector threshold breach ---------------------------------------

    describe('loop detector threshold breach', () => {
        it('disables bridge and reports to Sentry after >50 dispatches', async () => {
            const Sentry = await import('@sentry/react')
            const captureExceptionSpy = vi.spyOn(Sentry, 'captureException')

            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>

            // Rapid-fire >50 remote updates within the loop window
            for (let i = 0; i < 55; i++) {
                testDoc.transact(() => {
                    const yMap = new Y.Map<unknown>()
                    for (const [key, value] of Object.entries(
                        plantToYMap(makePlant(`loop-plant-${i}`)),
                    )) {
                        yMap.set(key, value)
                    }
                    plantsMap.set(`loop-plant-${i}`, yMap as Y.Map<unknown>)
                }, 'remote-peer')
            }

            const state = _getLoopDetectorState()
            expect(state.bridgeDisabled).toBe(true)
            expect(captureExceptionSpy).toHaveBeenCalled()
        })
    })

    // -- Seeding: schedule and readings ---------------------------------------

    describe('initial seeding: schedule and readings', () => {
        it('seeds nutrient schedule from Redux when CRDT map is empty', () => {
            const freshStore = createTestStore()
            const entry = makeScheduleEntry('seed-sched')
            freshStore.dispatch(upsertScheduleEntry(entry))

            // Clear CRDT schedule map
            const scheduleMap = testDoc.getMap('nutrient-schedule') as Y.Map<Y.Map<unknown>>
            scheduleMap.forEach((_: unknown, key: string) => scheduleMap.delete(key))

            // Also clear plants so seeding runs all branches
            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            plantsMap.forEach((_: unknown, key: string) => plantsMap.delete(key))

            // Clear readings too
            const readingsMap = testDoc.getMap('nutrient-readings') as Y.Map<Y.Map<unknown>>
            readingsMap.forEach((_: unknown, key: string) => readingsMap.delete(key))

            initCrdtSyncBridge(freshStore)

            expect(scheduleMap.has('seed-sched')).toBe(true)
        })

        it('seeds nutrient readings from Redux when CRDT map is empty', () => {
            const freshStore = createTestStore()
            freshStore.dispatch(
                addReading({
                    plantId: null,
                    ec: 1.5,
                    ph: 6.2,
                    waterTempC: 20,
                    readingType: 'input',
                    notes: '',
                }),
            )

            // Clear all CRDT maps
            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            plantsMap.forEach((_: unknown, key: string) => plantsMap.delete(key))
            const scheduleMap = testDoc.getMap('nutrient-schedule') as Y.Map<Y.Map<unknown>>
            scheduleMap.forEach((_: unknown, key: string) => scheduleMap.delete(key))
            const readingsMap = testDoc.getMap('nutrient-readings') as Y.Map<Y.Map<unknown>>
            readingsMap.forEach((_: unknown, key: string) => readingsMap.delete(key))

            initCrdtSyncBridge(freshStore)

            expect(readingsMap.size).toBeGreaterThanOrEqual(1)
        })
    })

    // -- Cleanup (destroyCrdtSyncBridge) --------------------------------------

    describe('destroyCrdtSyncBridge', () => {
        it('cleans up without error', () => {
            expect(() => destroyCrdtSyncBridge()).not.toThrow()
        })

        it('can be called multiple times safely', () => {
            destroyCrdtSyncBridge()
            destroyCrdtSyncBridge()
            // should not throw on double-destroy
        })
    })

    // -- Batch debounce -------------------------------------------------------

    describe('bridge batching', () => {
        it('dispatches are queued and not written until flush', () => {
            _flushBridgeBatch() // clear any pending from setup

            const plant = makePlant('batch-test')
            store.dispatch(addPlant({ plant, slotIndex: 0 }))

            // Before flush: queue should have entries, Y.Doc should NOT
            expect(_getBatchQueueLength()).toBeGreaterThan(0)
            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            expect(plantsMap.has('batch-test')).toBe(false)

            // After flush: queue empty, Y.Doc has the plant
            _flushBridgeBatch()
            expect(_getBatchQueueLength()).toBe(0)
            expect(plantsMap.has('batch-test')).toBe(true)
        })

        it('multiple dispatches are flushed in a single transaction', () => {
            _flushBridgeBatch() // clear any pending from setup

            const transactSpy = vi.spyOn(testDoc, 'transact')
            const countBefore = transactSpy.mock.calls.length

            const plant1 = makePlant('batch-a')
            const plant2 = makePlant('batch-b')
            store.dispatch(addPlant({ plant: plant1, slotIndex: 0 }))
            store.dispatch(addPlant({ plant: plant2, slotIndex: 1 }))

            // Queue should have entries from both dispatches
            expect(_getBatchQueueLength()).toBeGreaterThan(0)

            _flushBridgeBatch()

            // Only one transact() call should have been made for the flush
            const transactCalls = transactSpy.mock.calls.slice(countBefore)
            expect(transactCalls).toHaveLength(1)

            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            expect(plantsMap.has('batch-a')).toBe(true)
            expect(plantsMap.has('batch-b')).toBe(true)

            transactSpy.mockRestore()
        })

        it('fromCrdt actions are not enqueued', () => {
            _flushBridgeBatch() // clear any pending from setup
            const queueBefore = _getBatchQueueLength()

            const plant = makePlant('batch-skip')
            store.dispatch(upsertPlant(plant, { fromCrdt: true }))

            // Queue should not grow -- fromCrdt check prevents enqueue
            expect(_getBatchQueueLength()).toBe(queueBefore)
        })
    })

    // -- CRDT telemetry accumulator -------------------------------------------

    describe('CRDT telemetry', () => {
        it('starts with zeroed telemetry state', () => {
            _resetCrdtTelemetry()
            const state = _getCrdtTelemetryState()
            expect(state.divergenceCount).toBe(0)
            expect(state.syncPayloadBytes).toBe(0)
            expect(state.conflictsResolved).toBe(0)
            expect(state.lastSyncMs).toBe(0)
        })

        it('resets telemetry cleanly', () => {
            _resetCrdtTelemetry()
            const state = _getCrdtTelemetryState()
            expect(state.divergenceCount).toBe(0)
        })
    })
})

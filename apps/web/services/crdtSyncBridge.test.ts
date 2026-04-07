import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Y from 'yjs'
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import simulationReducer, {
    addPlant,
    upsertPlant,
    removePlant,
} from '@/stores/slices/simulationSlice'
import nutrientPlannerReducer from '@/stores/slices/nutrientPlannerSlice'
import settingsReducer, { defaultSettings } from '@/stores/slices/settingsSlice'
import { plantToYMap } from './crdtAdapters'
import type { Plant } from '@/types'
import { PlantStage, StrainType } from '@/types'
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

            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            expect(plantsMap.has('plant-1')).toBe(true)
            const yMap = plantsMap.get('plant-1')!
            expect(yMap.get('name')).toBe('Test Plant plant-1')
        })

        it('upsertPlant (non-CRDT) writes to Y.Map', () => {
            const plant = makePlant('plant-upsert')
            store.dispatch(upsertPlant(plant))

            const plantsMap = testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>
            expect(plantsMap.has('plant-upsert')).toBe(true)
        })

        it('removePlant (non-CRDT) deletes from Y.Map', () => {
            // First add a plant
            const plant = makePlant('plant-remove')
            store.dispatch(addPlant({ plant, slotIndex: 0 }))
            expect((testDoc.getMap('plants') as Y.Map<Y.Map<unknown>>).has('plant-remove')).toBe(
                true,
            )

            // Then remove it
            store.dispatch(removePlant('plant-remove'))
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
})

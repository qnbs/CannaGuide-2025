import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, vi, afterEach } from 'vitest'
import sandboxReducer, {
    saveExperiment,
    clearCurrentExperiment,
    deleteExperiment,
    runComparisonScenario,
} from '@/stores/slices/sandboxSlice'
import simulationReducer from '@/stores/slices/simulationSlice'
import settingsReducer, { defaultSettings } from '@/stores/slices/settingsSlice'
import { workerBus } from '@/services/workerBus'
import { plantSimulationService } from '@/services/plantSimulationService'
import {
    StrainType,
    type Strain,
    type ExperimentResult,
    type SavedExperiment,
    type Scenario,
} from '@/types'

const initial = { currentExperiment: null, status: 'idle' as const, savedExperiments: [] }

const testStrain: Strain = {
    id: 'sandbox-strain',
    name: 'Sandbox Strain',
    type: StrainType.Hybrid,
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
}

const rootReducer = combineReducers({
    sandbox: sandboxReducer,
    simulation: simulationReducer,
    settings: settingsReducer,
})

afterEach(() => {
    workerBus.reset()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('sandboxSlice', () => {
    it('returns initial state', () => {
        const state = sandboxReducer(undefined, { type: 'unknown' })
        expect(state).toEqual(initial)
    })

    it('clearCurrentExperiment resets experiment and status', () => {
        const running = {
            ...initial,
            status: 'succeeded' as const,
            currentExperiment: { id: 'exp-1' } as unknown as ExperimentResult,
        }
        const state = sandboxReducer(running, clearCurrentExperiment())
        expect(state.currentExperiment).toBeNull()
        expect(state.status).toBe('idle')
    })

    it('deleteExperiment removes by id', () => {
        const withExps = {
            ...initial,
            savedExperiments: [
                { id: 'exp-1' } as unknown as SavedExperiment,
                { id: 'exp-2' } as unknown as SavedExperiment,
            ],
        }
        const state = sandboxReducer(withExps, deleteExperiment('exp-1'))
        expect(state.savedExperiments).toHaveLength(1)
        expect(state.savedExperiments[0]!.id).toBe('exp-2')
    })

    it('saveExperiment saves current experiment and resets state', () => {
        const withExp = {
            ...initial,
            status: 'succeeded' as const,
            currentExperiment: { plantA: {}, plantB: {} } as unknown as ExperimentResult,
        }
        const state = sandboxReducer(
            withExp,
            saveExperiment({
                scenario: { id: 'sc-1' } as unknown as Scenario,
                basePlantName: 'TestPlant',
            }),
        )
        expect(state.savedExperiments).toHaveLength(1)
        expect(state.savedExperiments[0]!.basePlantName).toBe('TestPlant')
        expect(state.currentExperiment).toBeNull()
        expect(state.status).toBe('idle')
    })

    it('runComparisonScenario forwards active simulation settings to the worker', async () => {
        const basePlant = plantSimulationService.createPlant(
            testStrain,
            {
                lightType: 'LED',
                lightWattage: 300,
                lightHours: 18,
                ventilation: 'medium',
                hasCirculationFan: true,
                potSize: 11,
                potType: 'Fabric',
                medium: 'Soil',
                dynamicLighting: false,
            },
            'Scenario Plant',
        )

        let workerPayload: unknown

        class MockWorker {
            private _listeners: Array<(event: MessageEvent) => void> = []

            addEventListener(type: string, handler: (event: MessageEvent) => void) {
                if (type === 'message') this._listeners.push(handler)
            }

            removeEventListener(type: string, handler: (event: MessageEvent) => void) {
                if (type === 'message')
                    this._listeners = this._listeners.filter((h) => h !== handler)
            }

            postMessage(msg: { messageId: string; type: string; payload: unknown }) {
                workerPayload = msg.payload
                const response = {
                    messageId: msg.messageId,
                    success: true,
                    data: {
                        originalHistory: [],
                        modifiedHistory: [],
                        originalFinalState: basePlant,
                        modifiedFinalState: basePlant,
                    },
                }
                setTimeout(() => {
                    for (const listener of this._listeners) {
                        listener({ data: response } as MessageEvent)
                    }
                }, 0)
            }

            terminate() {}
        }

        vi.stubGlobal('Worker', MockWorker)

        // W-06: WorkerPool auto-spawn not wired in tests; register manually.
        workerBus.register('scenario', new MockWorker() as unknown as Worker)

        const store = configureStore({
            reducer: rootReducer,
            preloadedState: {
                settings: {
                    settings: {
                        ...defaultSettings,
                        simulation: {
                            ...defaultSettings.simulation,
                            simulationProfile: 'expert',
                            altitudeM: 1350,
                        },
                    },
                    version: 4,
                },
                simulation: {
                    plants: {
                        ids: [basePlant.id],
                        entities: { [basePlant.id]: basePlant },
                    },
                    plantSlots: [basePlant.id, null, null],
                    selectedPlantId: null,
                    vpdProfiles: {},
                    isCatchingUp: false,
                },
            },
        })

        await store.dispatch(
            runComparisonScenario({
                plantId: basePlant.id,
                scenario: {
                    id: 'scenario-1',
                    titleKey: 'scenario.title',
                    descriptionKey: 'scenario.description',
                    durationDays: 2,
                    plantAModifier: { day: 1, action: 'NONE' },
                    plantBModifier: { day: 1, action: 'TEMP_PLUS_2' },
                },
            }) as never,
        )

        expect(workerPayload).toMatchObject({
            simulationSettings: expect.objectContaining({
                simulationProfile: 'expert',
                altitudeM: 1350,
            }),
        })
    })
})

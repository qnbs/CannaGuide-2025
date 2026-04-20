import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SIM_SECONDS_PER_DAY } from '@/constants'
import { plantSimulationService } from '@/services/plantSimulationService'
import settingsReducer, { defaultSettings } from '@/stores/slices/settingsSlice'
import simulationReducer, { addPlant, updatePlantToNow, setSelectedPlantId, completeTask, toggleLight, toggleFan, setLightHours, setLightWattage, toggleCirculationFan, setVentilationPower, resetPlants, setCatchUpState, setPlantVpdProfile, removePlant, addJournalEntry } from '@/stores/slices/simulationSlice'
import { StrainType, JournalEntryType, type Strain } from '@/types'

const testStrain: Strain = {
    id: 'strain-test-slice',
    name: 'Slice Test Strain',
    type: StrainType.Hybrid,
    thc: 21,
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

const testSetup = {
    lightType: 'LED' as const,
    lightWattage: 320,
    lightHours: 18,
    ventilation: 'medium' as const,
    hasCirculationFan: true,
    potSize: 11,
    potType: 'Fabric' as const,
    medium: 'Soil' as const,
    dynamicLighting: false,
}

const rootReducer = combineReducers({
    simulation: simulationReducer,
    settings: settingsReducer,
})

const createTestStore = () =>
    configureStore({
        reducer: rootReducer,
        preloadedState: {
            settings: {
                settings: {
                    ...defaultSettings,
                    notifications: {
                        ...defaultSettings.notifications,
                        enabled: false,
                    },
                },
                version: 4,
            },
        },
    })

const daysMs = (days: number) => days * SIM_SECONDS_PER_DAY * 1000

describe('simulationSlice catch-up edge cases', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-01-10T00:00:00Z'))
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    it('skips catch-up entirely when less than one minute elapsed', async () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Quick Plant')
        plant.lastUpdated = Date.now() - 30_000

        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        await store.dispatch(updatePlantToNow(plant.id) as never)

        const updatedPlant = store.getState().simulation.plants.entities[plant.id]
        expect(updatedPlant?.age).toBe(0)
        expect(updatedPlant?.lastUpdated).toBe(plant.lastUpdated)
        expect(store.getState().simulation.isCatchingUp).toBe(false)
    })

    it('uses the synchronous fallback when Worker is unavailable and clears catch-up state afterwards', async () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Fallback Plant')
        plant.lastUpdated = Date.now() - daysMs(2)

        vi.stubGlobal('Worker', undefined)

        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        await store.dispatch(updatePlantToNow(plant.id) as never)

        const updatedPlant = store.getState().simulation.plants.entities[plant.id]
        expect(updatedPlant?.age).toBeGreaterThan(plant.age)
        expect(updatedPlant?.lastUpdated).toBe(Date.now())
        expect(store.getState().simulation.isCatchingUp).toBe(false)
    })

    it('recovers from worker failures without leaving catch-up mode stuck on', async () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(
            testStrain,
            testSetup,
            'Broken Worker Plant',
        )
        plant.lastUpdated = Date.now() - daysMs(1)

        const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

        class ThrowingWorker {
            onmessage: ((event: MessageEvent) => void) | null = null
            onerror: ((event: ErrorEvent | { message: string }) => void) | null = null

            postMessage() {
                this.onerror?.({ message: 'worker failed' })
            }

            terminate() {}
        }

        vi.stubGlobal('Worker', ThrowingWorker)

        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        await store.dispatch(updatePlantToNow(plant.id) as never)

        const updatedPlant = store.getState().simulation.plants.entities[plant.id]
        expect(updatedPlant?.age).toBe(plant.age)
        expect(updatedPlant?.lastUpdated).toBe(plant.lastUpdated)
        expect(store.getState().simulation.isCatchingUp).toBe(false)
        expect(consoleDebugSpy).toHaveBeenCalled()
    })
})

describe('simulationSlice basic reducers', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-01-10T00:00:00Z'))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    it('sets selected plant ID', () => {
        const store = createTestStore()
        store.dispatch(setSelectedPlantId('plant-1'))
        expect(store.getState().simulation.selectedPlantId).toBe('plant-1')
    })

    it('sets selected plant ID to null', () => {
        const store = createTestStore()
        store.dispatch(setSelectedPlantId('plant-1'))
        store.dispatch(setSelectedPlantId(null))
        expect(store.getState().simulation.selectedPlantId).toBeNull()
    })

    it('adds a plant to a specific slot', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Slot Plant')
        store.dispatch(addPlant({ plant, slotIndex: 1 }))
        expect(store.getState().simulation.plantSlots[1]).toBe(plant.id)
        expect(store.getState().simulation.plants.entities[plant.id]).toBeDefined()
    })

    it('removes a plant', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Remove Me')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(removePlant(plant.id))
        expect(store.getState().simulation.plants.entities[plant.id]).toBeUndefined()
        expect(store.getState().simulation.plantSlots[0]).toBeNull()
    })

    it('removes selected plant id when that plant is removed', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Selected')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(setSelectedPlantId(plant.id))
        store.dispatch(removePlant(plant.id))
        expect(store.getState().simulation.selectedPlantId).toBeNull()
    })

    it('resets all plants', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Reset Me')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(resetPlants())
        expect(store.getState().simulation.plants.ids).toHaveLength(0)
        expect(store.getState().simulation.plantSlots).toEqual([null, null, null])
    })

    it('sets catch-up state', () => {
        const store = createTestStore()
        store.dispatch(setCatchUpState(true))
        expect(store.getState().simulation.isCatchingUp).toBe(true)
        store.dispatch(setCatchUpState(false))
        expect(store.getState().simulation.isCatchingUp).toBe(false)
    })

    it('sets VPD profile for a plant', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'VPD Plant')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        const points = [{ time: 0, vpd: 1.2, leaf: 25, air: 26, rh: 55, lightOn: true }]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.dispatch(setPlantVpdProfile({ plantId: plant.id, points: points as any }))
        expect(store.getState().simulation.vpdProfiles[plant.id]).toBeDefined()
    })

    it('adds journal entry', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Journal Plant')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(addJournalEntry({
            plantId: plant.id,
            entry: { type: JournalEntryType.Observation, notes: 'Test entry' },
        }))
        const updated = store.getState().simulation.plants.entities[plant.id]
        expect(updated?.journal.length).toBeGreaterThan(plant.journal.length)
    })

    it('completes a task', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Task Plant')
        // Add a task manually
        plant.tasks = [{ id: 'task-1', title: 'Water', description: '', isCompleted: false, priority: 'medium', createdAt: Date.now() }]
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(completeTask({ plantId: plant.id, taskId: 'task-1' }))
        const updated = store.getState().simulation.plants.entities[plant.id]
        expect(updated?.tasks[0]?.isCompleted).toBe(true)
    })

    it('toggles light', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Light Plant')
        const initialLight = plant.equipment.light.isOn
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(toggleLight({ plantId: plant.id }))
        const updated = store.getState().simulation.plants.entities[plant.id]
        expect(updated?.equipment.light.isOn).toBe(!initialLight)
    })

    it('toggles fan', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Fan Plant')
        const initialFan = plant.equipment.exhaustFan.isOn
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(toggleFan({ plantId: plant.id }))
        const updated = store.getState().simulation.plants.entities[plant.id]
        expect(updated?.equipment.exhaustFan.isOn).toBe(!initialFan)
    })

    it('sets light hours', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Hours Plant')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(setLightHours({ plantId: plant.id, hours: 12 }))
        const updated = store.getState().simulation.plants.entities[plant.id]
        expect(updated?.equipment.light.lightHours).toBe(12)
    })

    it('sets light wattage', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Wattage Plant')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(setLightWattage({ plantId: plant.id, wattage: 600 }))
        const updated = store.getState().simulation.plants.entities[plant.id]
        expect(updated?.equipment.light.wattage).toBe(600)
    })

    it('toggles circulation fan', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Circ Plant')
        const initialCirc = plant.equipment.circulationFan.isOn
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(toggleCirculationFan({ plantId: plant.id }))
        const updated = store.getState().simulation.plants.entities[plant.id]
        expect(updated?.equipment.circulationFan.isOn).toBe(!initialCirc)
    })

    it('sets ventilation power', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Vent Plant')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        store.dispatch(setVentilationPower({ plantId: plant.id, power: 'high' }))
        const updated = store.getState().simulation.plants.entities[plant.id]
        expect(updated?.equipment.exhaustFan.power).toBe('high')
    })
})

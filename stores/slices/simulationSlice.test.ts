import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SIM_SECONDS_PER_DAY } from '@/constants'
import { plantSimulationService } from '@/services/plantSimulationService'
import settingsReducer, { defaultSettings } from '@/stores/slices/settingsSlice'
import simulationReducer, { addPlant, updatePlantToNow } from '@/stores/slices/simulationSlice'
import { StrainType, type Strain } from '@/types'

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
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Broken Worker Plant')
        plant.lastUpdated = Date.now() - daysMs(1)

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

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
        expect(consoleErrorSpy).toHaveBeenCalled()
    })
})
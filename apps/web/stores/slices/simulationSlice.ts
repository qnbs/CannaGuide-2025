import { createSlice, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit'
import {
    Plant,
    JournalEntry,
    Task,
    VentilationPower,
    SimulationState,
    AppSettings,
} from '@/types'
import { plantSimulationService } from '@/services/plantSimulationService'
import type { SimulationPoint } from '@/types/simulation.types'

export const plantsAdapter = createEntityAdapter<Plant>()

const initialState: SimulationState = {
    plants: plantsAdapter.getInitialState(),
    plantSlots: [null, null, null],
    selectedPlantId: null,
    vpdProfiles: {},
    isCatchingUp: false,
}

export const simulationSlice = createSlice({
    name: 'simulation',
    initialState,
    reducers: {
        setSimulationState: (state, action: PayloadAction<SimulationState>) => {
            state.plants = action.payload.plants
            state.plantSlots = action.payload.plantSlots
            state.selectedPlantId = action.payload.selectedPlantId
            state.vpdProfiles = action.payload.vpdProfiles || {}
            state.isCatchingUp = action.payload.isCatchingUp ?? false
        },
        addPlant: (state, action: PayloadAction<{ plant: Plant; slotIndex: number }>) => {
            const { plant, slotIndex } = action.payload
            plantsAdapter.addOne(state.plants, plant)
            state.plantSlots[slotIndex] = plant.id
        },
        updatePlant: (state, action: PayloadAction<{ id: string; changes: Partial<Plant> }>) => {
            plantsAdapter.updateOne(state.plants, action.payload)
        },
        plantStateUpdated: (
            state,
            action: PayloadAction<{
                updatedPlant: Plant
                newJournalEntries: JournalEntry[]
                newTasks: Task[]
            }>,
        ) => {
            const { updatedPlant, newJournalEntries, newTasks } = action.payload
            const existingPlant = state.plants.entities[updatedPlant.id]
            if (!existingPlant) return

            // Give new journal entries unique IDs and current timestamps to ensure they are unique.
            const newJournalWithIds = newJournalEntries.map((entry, index) => ({
                ...entry,
                id: `journal-${updatedPlant.id}-${Date.now()}-${index}`,
                createdAt: Date.now(),
            }))

            // Prevent duplicate tasks by checking titles of existing incomplete tasks.
            const existingIncompleteTaskTitles = new Set(
                existingPlant.tasks.filter((t) => !t.isCompleted).map((t) => t.title),
            )
            const tasksToAdd = newTasks.filter((t) => !existingIncompleteTaskTitles.has(t.title))

            // Create a changes object that merges the worker's calculations with the latest journal/task state.
            const changes = {
                ...updatedPlant,
                journal: [...existingPlant.journal, ...newJournalWithIds],
                tasks: [...existingPlant.tasks, ...tasksToAdd],
            }

            plantsAdapter.updateOne(state.plants, { id: updatedPlant.id, changes })
        },
        setSelectedPlantId: (state, action: PayloadAction<string | null>) => {
            state.selectedPlantId = action.payload
        },
        addJournalEntry: (
            state,
            action: PayloadAction<{
                plantId: string
                entry: Omit<JournalEntry, 'id' | 'createdAt'>
            }>,
        ) => {
            const { plantId, entry } = action.payload
            const plant = state.plants.entities[plantId]
            if (plant) {
                const newEntry: JournalEntry = {
                    ...entry,
                    id: `journal-${plantId}-${Date.now()}`,
                    createdAt: Date.now(),
                }
                plant.journal.push(newEntry)
            }
        },
        /** Idempotent merge when the service worker replays a queued offline journal entry. */
        applyQueuedJournalEntry: (
            state,
            action: PayloadAction<{ plantId: string; entry: JournalEntry }>,
        ) => {
            const { plantId, entry } = action.payload
            const plant = state.plants.entities[plantId]
            if (!plant) return
            if (plant.journal.some((j) => j.id === entry.id)) return
            plant.journal.push(entry)
        },
        completeTask: (state, action: PayloadAction<{ plantId: string; taskId: string }>) => {
            const { plantId, taskId } = action.payload
            const plant = state.plants.entities[plantId]
            if (plant) {
                const task = plant.tasks.find((t) => t.id === taskId)
                if (task) {
                    task.isCompleted = true
                    task.completedAt = Date.now()
                }
            }
        },
        // Equipment controls
        toggleLight: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId]
            if (plant) plant.equipment.light.isOn = !plant.equipment.light.isOn
        },
        toggleFan: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId]
            if (plant) plant.equipment.exhaustFan.isOn = !plant.equipment.exhaustFan.isOn
        },
        setLightHours: (state, action: PayloadAction<{ plantId: string; hours: number }>) => {
            const plant = state.plants.entities[action.payload.plantId]
            if (plant) plant.equipment.light.lightHours = action.payload.hours
        },
        setLightWattage: (state, action: PayloadAction<{ plantId: string; wattage: number }>) => {
            const plant = state.plants.entities[action.payload.plantId]
            if (plant) plant.equipment.light.wattage = action.payload.wattage
        },
        toggleCirculationFan: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId]
            if (plant) plant.equipment.circulationFan.isOn = !plant.equipment.circulationFan.isOn
        },
        setVentilationPower: (
            state,
            action: PayloadAction<{ plantId: string; power: VentilationPower }>,
        ) => {
            const plant = state.plants.entities[action.payload.plantId]
            if (plant) plant.equipment.exhaustFan.power = action.payload.power
        },
        setGlobalEnvironment: (
            state,
            action: PayloadAction<{
                temperature?: number | undefined
                humidity?: number | undefined
                ph?: number | undefined
                simulationSettings?: AppSettings['simulation'] | undefined
            }>,
        ) => {
            const { temperature, humidity, ph, simulationSettings } = action.payload
            state.plantSlots.forEach((plantId) => {
                if (plantId) {
                    const plant = state.plants.entities[plantId]
                    if (plant) {
                        if (temperature !== undefined) {
                            plant.environment.internalTemperature = temperature
                        }
                        if (humidity !== undefined) {
                            plant.environment.internalHumidity = humidity
                        }
                        if (ph !== undefined) {
                            plant.medium.ph = ph
                        }
                        plant.environment = plantSimulationService.applyEnvironmentalCorrections(
                            plant,
                            simulationSettings,
                        ).environment
                    }
                }
            })
        },
        processPostHarvest: (
            state,
            action: PayloadAction<{
                plantId: string
                action: 'dry' | 'burp' | 'cure'
                simulationSettings?: AppSettings['simulation']
            }>,
        ) => {
            const plant = state.plants.entities[action.payload.plantId]
            if (plant) {
                const { updatedPlant, newJournalEntries } =
                    plantSimulationService.advancePostHarvestState(
                        plant,
                        action.payload.action,
                        action.payload.simulationSettings,
                    )

                const stampedEntries = newJournalEntries.map((entry, index) => ({
                    ...entry,
                    id: `journal-postharvest-${updatedPlant.id}-${Date.now()}-${index}`,
                    createdAt: Date.now(),
                }))

                Object.assign(plant, updatedPlant)
                plant.journal.push(...stampedEntries)
            }
        },
        resetPlants: (state) => {
            plantsAdapter.removeAll(state.plants)
            state.plantSlots = [null, null, null]
            state.selectedPlantId = null
            state.vpdProfiles = {}
        },
        setPlantVpdProfile: (
            state,
            action: PayloadAction<{ plantId: string; points: SimulationPoint[] }>,
        ) => {
            state.vpdProfiles[action.payload.plantId] = action.payload.points
        },
        setCatchUpState: (state, action: PayloadAction<boolean>) => {
            state.isCatchingUp = action.payload
        },

        // --- Multi-Grow environment actions ---
        /** Set environment for all plants belonging to a specific grow */
        setGrowEnvironment: (
            state,
            action: PayloadAction<{
                growId: string
                temperature?: number | undefined
                humidity?: number | undefined
                ph?: number | undefined
                simulationSettings?: AppSettings['simulation'] | undefined
            }>,
        ) => {
            const { growId, temperature, humidity, ph, simulationSettings } = action.payload
            for (const plantId of state.plants.ids) {
                const plant = state.plants.entities[plantId as string]
                if (plant && plant.growId === growId) {
                    if (temperature !== undefined) {
                        plant.environment.internalTemperature = temperature
                    }
                    if (humidity !== undefined) {
                        plant.environment.internalHumidity = humidity
                    }
                    if (ph !== undefined) {
                        plant.medium.ph = ph
                    }
                    plant.environment = plantSimulationService.applyEnvironmentalCorrections(
                        plant,
                        simulationSettings,
                    ).environment
                }
            }
        },

        /** Copy environment settings from one grow's plants to another grow's plants */
        copyGrowEnvironment: (
            state,
            action: PayloadAction<{ fromGrowId: string; toGrowId: string }>,
        ) => {
            const { fromGrowId, toGrowId } = action.payload
            // Find first plant in the source grow to use as environment template
            let sourceEnv: Plant['environment'] | undefined
            let sourcePh: number | undefined
            for (const plantId of state.plants.ids) {
                const plant = state.plants.entities[plantId as string]
                if (plant && plant.growId === fromGrowId) {
                    sourceEnv = plant.environment
                    sourcePh = plant.medium.ph
                    break
                }
            }
            if (!sourceEnv) return
            // Apply to all plants in the target grow
            for (const plantId of state.plants.ids) {
                const plant = state.plants.entities[plantId as string]
                if (plant && plant.growId === toGrowId) {
                    plant.environment.internalTemperature = sourceEnv.internalTemperature
                    plant.environment.internalHumidity = sourceEnv.internalHumidity
                    plant.environment.co2Level = sourceEnv.co2Level
                    if (sourcePh !== undefined) {
                        plant.medium.ph = sourcePh
                    }
                    plant.environment =
                        plantSimulationService.applyEnvironmentalCorrections(plant).environment
                }
            }
        },

        // --- CRDT sync actions (Session I) ---
        upsertPlant: {
            reducer(state, action: PayloadAction<Plant>) {
                const plant = action.payload
                plantsAdapter.upsertOne(state.plants, plant)
                // Assign to first empty slot if this is a new plant
                if (!state.plantSlots.includes(plant.id)) {
                    const emptySlotIndex = state.plantSlots.findIndex((slot) => slot === null)
                    if (emptySlotIndex >= 0) {
                        state.plantSlots[emptySlotIndex] = plant.id
                    }
                }
            },
            prepare(plant: Plant, meta?: { fromCrdt?: boolean | undefined }) {
                return { payload: plant, meta: { fromCrdt: meta?.fromCrdt } }
            },
        },
        removePlant: {
            reducer(state, action: PayloadAction<string>) {
                const plantId = action.payload
                plantsAdapter.removeOne(state.plants, plantId)
                /* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- tuple shape preserved */
                state.plantSlots = state.plantSlots.map((slot) =>
                    slot === plantId ? null : slot,
                ) as [string | null, string | null, string | null]
                /* eslint-enable @typescript-eslint/no-unsafe-type-assertion */
                if (state.selectedPlantId === plantId) {
                    state.selectedPlantId = null
                }
            },
            prepare(plantId: string, meta?: { fromCrdt?: boolean | undefined }) {
                return { payload: plantId, meta: { fromCrdt: meta?.fromCrdt } }
            },
        },
    },
})

export const {
    setSimulationState,
    addPlant,
    updatePlant,
    plantStateUpdated,
    setSelectedPlantId,
    addJournalEntry,
    applyQueuedJournalEntry,
    completeTask,
    toggleLight,
    toggleFan,
    setLightHours,
    setLightWattage,
    toggleCirculationFan,
    setVentilationPower,
    setGlobalEnvironment,
    setGrowEnvironment,
    copyGrowEnvironment,
    processPostHarvest,
    resetPlants,
    setPlantVpdProfile,
    setCatchUpState,
    upsertPlant,
    removePlant,
} = simulationSlice.actions

export default simulationSlice.reducer

export {
    generatePlantVpdProfile,
    startNewPlant,
    updatePlantToNow,
    initializeSimulation,
    waterAllPlants,
    applyWateringAction,
    applyTrainingAction,
    applyPestControlAction,
    applyAmendmentAction,
} from './simulation/simulationThunks'

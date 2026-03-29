import { createSlice, PayloadAction, createEntityAdapter, createAsyncThunk } from '@reduxjs/toolkit'
import {
    Plant,
    GrowSetup,
    JournalEntry,
    Task,
    JournalEntryType,
    VentilationPower,
    SimulationState,
    AppSettings,
} from '@/types'
import { plantSimulationService, vpdService } from '@/services/plantSimulationService'
import { RootState } from '../store'
import { getUISnapshot } from '../useUIStore'
import { getT } from '@/i18n'
import {
    GrowSetupSchema,
    WaterDataSchema,
    TrainingDataSchema,
    PestControlDataSchema,
    AmendmentDataSchema,
} from '@/types/schemas'
import { View } from '@/types'
import type { SimulationPoint } from '@/types/simulation.types'
import { workerBus } from '@/services/workerBus'

export const plantsAdapter = createEntityAdapter<Plant>()

const initialState: SimulationState = {
    plants: plantsAdapter.getInitialState(),
    plantSlots: [null, null, null],
    selectedPlantId: null,
    vpdProfiles: {},
    isCatchingUp: false,
}

const isWithinQuietHours = (start: string, end: string, now = new Date()): boolean => {
    const [startHour = 0, startMinute = 0] = start.split(':').map(Number)
    const [endHour = 0, endMinute = 0] = end.split(':').map(Number)
    if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) {
        return false
    }

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    if (startMinutes === endMinutes) {
        return true
    }

    if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

const showBrowserNotification = async (
    title: string,
    body: string,
    tag: string,
    plantId: string,
) => {
    if (
        typeof window === 'undefined' ||
        !('Notification' in window) ||
        Notification.permission !== 'granted'
    ) {
        return
    }

    const registration = await navigator.serviceWorker.getRegistration().catch(() => undefined)
    if (registration) {
        await registration.showNotification(title, {
            body,
            icon: registration.scope + 'icon.svg',
            badge: registration.scope + 'icon.svg',
            tag,
            data: { plantId },
        })
        return
    }

    new Notification(title, { body, tag })
}

const areNotificationsMuted = (settings: AppSettings): boolean => {
    const quietHoursEnabled = settings.notifications.quietHours.enabled
    return (
        quietHoursEnabled &&
        isWithinQuietHours(
            settings.notifications.quietHours.start,
            settings.notifications.quietHours.end,
        )
    )
}

const findStageChangeEntry = (entries: JournalEntry[]): JournalEntry | undefined =>
    entries.find(
        (entry) =>
            entry.type === JournalEntryType.System && entry.notes.startsWith('Stage changed'),
    )

const notifyPlantEvents = async (
    settings: AppSettings,
    plant: Plant,
    filteredJournalEntries: JournalEntry[],
    newProblemEntries: JournalEntry[],
    filteredTasks: Task[],
): Promise<void> => {
    if (!settings.notifications.enabled || areNotificationsMuted(settings)) {
        return
    }

    const stageChangeEntry = findStageChangeEntry(filteredJournalEntries)
    if (settings.notifications.stageChange && stageChangeEntry) {
        await showBrowserNotification(
            plant.name,
            stageChangeEntry.notes,
            `stage-change-${plant.id}`,
            plant.id,
        )
    }

    if (
        settings.notifications.problemDetected &&
        newProblemEntries.length > 0 &&
        newProblemEntries[0]
    ) {
        await showBrowserNotification(
            plant.name,
            newProblemEntries[0].notes,
            `problem-${plant.id}`,
            plant.id,
        )
    }

    if (settings.notifications.newTask && filteredTasks.length > 0 && filteredTasks[0]) {
        await showBrowserNotification(
            plant.name,
            filteredTasks[0].title,
            `task-${plant.id}`,
            plant.id,
        )
    }
}

const simulationSlice = createSlice({
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
                temperature?: number
                humidity?: number
                ph?: number
                simulationSettings?: AppSettings['simulation']
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
    },
})

export const generatePlantVpdProfile = createAsyncThunk<void, string, { state: RootState }>(
    'simulation/generatePlantVpdProfile',
    async (plantId, { getState, dispatch }) => {
        const state = getState()
        const plant = state.simulation.plants.entities[plantId]
        if (!plant) return

        const input = vpdService.createInputFromPlant(plant, state.settings.settings.simulation)
        const points = await vpdService.runDailyVPD(input)
        dispatch(simulationSlice.actions.setPlantVpdProfile({ plantId, points }))
    },
)

export const startNewPlant = createAsyncThunk<void, void, { state: RootState }>(
    'simulation/startNewPlant',
    (_, { dispatch, getState }) => {
        const { simulation, settings } = getState()
        const { strain, setup, slotIndex } = getUISnapshot().newGrowFlow

        let finalSlotIndex = slotIndex

        // This logic remains as a safety net in case a flow is initiated without a slot pre-selected.
        if (finalSlotIndex === null || finalSlotIndex === undefined) {
            finalSlotIndex = simulation.plantSlots.findIndex((slot) => slot === null)
        }

        // Check if a slot was found (could be -1 if all are full).
        if (finalSlotIndex === -1) {
            const t = getT()
            getUISnapshot().addNotification({
                message: t('plantsView.notifications.allSlotsFull'),
                type: 'error',
            })
            getUISnapshot().cancelNewGrow()
            return
        }

        if (strain && setup) {
            const mergedSetup = {
                ...settings.settings.defaults.growSetup,
                ...setup,
            }

            const validation = GrowSetupSchema.safeParse(mergedSetup)
            if (!validation.success) {
                const t = getT()
                console.error('Grow setup validation failed:', validation.error)
                getUISnapshot().addNotification({
                    message: t('common.simulationErrors.invalidSetup'),
                    type: 'error',
                })
                getUISnapshot().cancelNewGrow()
                return
            }

            const normalizedSetup: GrowSetup = {
                lightType: validation.data.lightType ?? 'LED',
                lightWattage: validation.data.lightWattage ?? 300,
                lightHours: validation.data.lightHours,
                ventilation: validation.data.ventilation ?? 'medium',
                hasCirculationFan: validation.data.hasCirculationFan ?? true,
                potSize: validation.data.potSize,
                potType: validation.data.potType ?? 'Fabric',
                medium: validation.data.medium,
            }

            const newPlant = plantSimulationService.createPlant(
                strain,
                normalizedSetup,
                `${strain.name} #${finalSlotIndex + 1}`,
            )
            dispatch(
                simulationSlice.actions.addPlant({ plant: newPlant, slotIndex: finalSlotIndex }),
            )

            const t = getT()
            getUISnapshot().addNotification({
                message: t('plantsView.notifications.growStarted', { name: newPlant.name }),
                type: 'success',
            })

            // Navigate to plants view to show the new plant, regardless of where the flow started.
            getUISnapshot().setActiveView(View.Plants)

            // Clean up the flow state.
            getUISnapshot().cancelNewGrow()
        } else {
            console.error('startNewPlant called without complete strain or setup data.', {
                strain,
                setup,
                finalSlotIndex,
            })
            getUISnapshot().cancelNewGrow()
        }
    },
)

export const updatePlantToNow = createAsyncThunk<void, string, { state: RootState }>(
    'simulation/updatePlantToNow',
    async (plantId, { dispatch, getState }) => {
        const state = getState()
        const plant = state.simulation.plants.entities[plantId]
        if (plant) {
            const actualElapsed = Date.now() - plant.lastUpdated
            const settings = state.settings.settings
            const deltaTime = actualElapsed
            if (actualElapsed > 1000 * 60) {
                // Only update if more than a minute has passed
                dispatch(simulationSlice.actions.setCatchUpState(true))
                try {
                    const result = await (async () => {
                        if (typeof Worker === 'undefined') {
                            return plantSimulationService.calculateStateForTimeDelta(
                                plant,
                                deltaTime,
                                settings.simulation,
                            )
                        }

                        const SIM_WORKER = 'simulation'
                        if (!workerBus.has(SIM_WORKER)) {
                            workerBus.register(
                                SIM_WORKER,
                                new Worker(new URL('../../simulation.worker.ts', import.meta.url), {
                                    type: 'module',
                                }),
                            )
                        }

                        return workerBus.dispatch<{
                            updatedPlant: Plant
                            newJournalEntries: JournalEntry[]
                            newTasks: Task[]
                        }>(SIM_WORKER, 'SIMULATE', {
                            plant,
                            deltaTime,
                            simulationSettings: settings.simulation,
                        })
                    })()

                    const filteredJournalEntries = result.newJournalEntries.filter((entry) => {
                        if (entry.type !== JournalEntryType.System) {
                            return true
                        }

                        if (entry.notes.startsWith('Stage changed')) {
                            return settings.simulation.autoJournaling.logStageChanges
                        }

                        return true
                    })

                    const newProblemEntries = settings.simulation.autoJournaling.logProblems
                        ? result.updatedPlant.problems
                              .filter(
                                  (problem) =>
                                      problem.status === 'active' &&
                                      !plant.problems.some(
                                          (existing) =>
                                              existing.type === problem.type &&
                                              existing.status === 'active',
                                      ),
                              )
                              .map((problem, index) => ({
                                  id: `journal-problem-${result.updatedPlant.id}-${problem.type}-${Date.now()}-${index}`,
                                  createdAt: Date.now(),
                                  type: JournalEntryType.System,
                                  notes: `Problem detected: ${problem.type}`,
                              }))
                        : []

                    const filteredTasks = settings.plantsView.autoGenerateTasks
                        ? result.newTasks
                        : []
                    const taskJournalEntries = settings.simulation.autoJournaling.logTasks
                        ? filteredTasks.map((task, index) => ({
                              id: `journal-task-${result.updatedPlant.id}-${Date.now()}-${index}`,
                              createdAt: Date.now(),
                              type: JournalEntryType.System,
                              notes: `Task generated: ${task.title}`,
                          }))
                        : []

                    await notifyPlantEvents(
                        settings,
                        result.updatedPlant,
                        filteredJournalEntries,
                        newProblemEntries,
                        filteredTasks,
                    )

                    dispatch(
                        simulationSlice.actions.plantStateUpdated({
                            updatedPlant: result.updatedPlant,
                            newJournalEntries: [
                                ...filteredJournalEntries,
                                ...newProblemEntries,
                                ...taskJournalEntries,
                            ],
                            newTasks: filteredTasks,
                        }),
                    )
                } catch (error) {
                    console.error('[SimWorker] Error during plant state update:', error)
                } finally {
                    dispatch(simulationSlice.actions.setCatchUpState(false))
                }
            }
        }
    },
)

export const initializeSimulation = createAsyncThunk<void, void, { state: RootState }>(
    'simulation/initialize',
    async (_, { dispatch, getState }) => {
        const { plants } = getState().simulation
        const plantIds = plants.ids as string[]
        for (const id of plantIds) {
            await dispatch(updatePlantToNow(id))
        }
    },
)

export const waterAllPlants = createAsyncThunk<void, void, { state: RootState }>(
    'simulation/waterAll',
    (_, { dispatch, getState }) => {
        const { plants } = getState().simulation
        const plantIds = plants.ids as string[]
        plantIds.forEach((id) => {
            dispatch(applyWateringAction({ plantId: id, data: {}, notes: 'Watered all plants.' }))
        })
    },
)

// --- RING 3 VALIDATING THUNKS ---

export const applyWateringAction = createAsyncThunk<
    void,
    { plantId: string; data: unknown; notes: string },
    { state: RootState }
>('simulation/applyWatering', ({ plantId, data, notes }, { dispatch, getState }) => {
    const validation = WaterDataSchema.safeParse(data)
    if (!validation.success) {
        console.error('Watering action validation failed:', validation.error)
        getUISnapshot().addNotification({
            message: getT()('common.simulationErrors.invalidActionData', {
                action: 'Watering',
            }),
            type: 'error',
        })
        return
    }

    const plant = getState().simulation.plants.entities[plantId]
    if (plant) {
        const updatedPlant = plantSimulationService.clonePlant(plant)
        const waterCapacity =
            updatedPlant.equipment.potSize *
            1000 *
            (updatedPlant.equipment.potType === 'Fabric' ? 0.28 : 0.35)
        updatedPlant.medium.substrateWater = waterCapacity
        updatedPlant.medium.moisture = 100
        if (validation.data.ph) updatedPlant.medium.ph = validation.data.ph
        if (validation.data.ec) updatedPlant.medium.ec = validation.data.ec

        dispatch(simulationSlice.actions.updatePlant({ id: plantId, changes: updatedPlant }))
        dispatch(
            addJournalEntry({
                plantId,
                entry: { type: JournalEntryType.Watering, notes, details: validation.data },
            }),
        )
    }
})

export const applyTrainingAction = createAsyncThunk<
    void,
    { plantId: string; data: unknown; notes: string },
    { state: RootState }
>('simulation/applyTraining', ({ plantId, data, notes }, { dispatch, getState }) => {
    const validation = TrainingDataSchema.safeParse(data)
    if (!validation.success) {
        console.error('Training action validation failed:', validation.error)
        getUISnapshot().addNotification({
            message: getT()('common.simulationErrors.invalidActionData', {
                action: 'Training',
            }),
            type: 'error',
        })
        return
    }

    const plant = getState().simulation.plants.entities[plantId]
    if (plant) {
        let updatedPlant = plantSimulationService.clonePlant(plant)
        if (validation.data.type === 'Topping') {
            updatedPlant = plantSimulationService.topPlant(updatedPlant).updatedPlant
        } else if (validation.data.type === 'LST') {
            updatedPlant = plantSimulationService.applyLst(updatedPlant).updatedPlant
        }
        dispatch(simulationSlice.actions.updatePlant({ id: plantId, changes: updatedPlant }))
        dispatch(
            addJournalEntry({
                plantId,
                entry: { type: JournalEntryType.Training, notes, details: validation.data },
            }),
        )
    }
})

export const applyPestControlAction = createAsyncThunk<
    void,
    { plantId: string; data: unknown; notes: string },
    { state: RootState }
>('simulation/applyPestControl', ({ plantId, data, notes }, { dispatch }) => {
    const validation = PestControlDataSchema.safeParse(data)
    if (!validation.success) {
        console.error('Pest Control action validation failed:', validation.error)
        getUISnapshot().addNotification({
            message: getT()('common.simulationErrors.invalidActionData', {
                action: 'Pest Control',
            }),
            type: 'error',
        })
        return
    }
    dispatch(
        addJournalEntry({
            plantId,
            entry: { type: JournalEntryType.PestControl, notes, details: validation.data },
        }),
    )
})

export const applyAmendmentAction = createAsyncThunk<
    void,
    { plantId: string; data: unknown; notes: string },
    { state: RootState }
>('simulation/applyAmendment', ({ plantId, data, notes }, { dispatch }) => {
    const validation = AmendmentDataSchema.safeParse(data)
    if (!validation.success) {
        console.error('Amendment action validation failed:', validation.error)
        getUISnapshot().addNotification({
            message: getT()('common.simulationErrors.invalidActionData', {
                action: 'Amendment',
            }),
            type: 'error',
        })
        return
    }
    dispatch(
        addJournalEntry({
            plantId,
            entry: { type: JournalEntryType.Amendment, notes, details: validation.data },
        }),
    )
})

export const {
    setSimulationState,
    addPlant,
    updatePlant,
    plantStateUpdated,
    setSelectedPlantId,
    addJournalEntry,
    completeTask,
    toggleLight,
    toggleFan,
    setLightHours,
    setLightWattage,
    toggleCirculationFan,
    setVentilationPower,
    setGlobalEnvironment,
    processPostHarvest,
    resetPlants,
    setPlantVpdProfile,
    setCatchUpState,
} = simulationSlice.actions

export default simulationSlice.reducer

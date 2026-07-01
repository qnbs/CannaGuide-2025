import { createAsyncThunk } from '@reduxjs/toolkit'
import {
    Plant,
    GrowSetup,
    JournalEntry,
    Task,
    JournalEntryType,
} from '@/types'
import { plantSimulationService, vpdService } from '@/services/plantSimulationService'
import { RootState } from '../../store'
import { getUISnapshot } from '../../useUIStore'
import { getT } from '@/i18n'
import {
    GrowSetupSchema,
    WaterDataSchema,
    TrainingDataSchema,
    PestControlDataSchema,
    AmendmentDataSchema,
} from '@/types/schemas'
import { View } from '@/types'
import { workerBus } from '@/services/workerBus'
import { simulationSlice } from '../simulationSlice'
import { notifyPlantEvents } from './simulationNotifications'

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

        if (finalSlotIndex === null || finalSlotIndex === undefined) {
            finalSlotIndex = simulation.plantSlots.findIndex((slot) => slot === null)
        }

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
                console.debug('Grow setup validation failed:', validation.error)
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
                dynamicLighting: validation.data.dynamicLighting ?? false,
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

            getUISnapshot().setActiveView(View.Plants)
            getUISnapshot().cancelNewGrow()
        } else {
            console.debug('startNewPlant called without complete strain or setup data.', {
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
                        return workerBus.dispatch<{
                            updatedPlant: Plant
                            newJournalEntries: JournalEntry[]
                            newTasks: Task[]
                        }>(
                            SIM_WORKER,
                            'SIMULATE',
                            {
                                plant,
                                deltaTime,
                                simulationSettings: settings.simulation,
                            },
                            { priority: 'high' },
                        )
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
                    console.debug('[SimWorker] Error during plant state update:', error)
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

export const applyWateringAction = createAsyncThunk<
    void,
    { plantId: string; data: unknown; notes: string },
    { state: RootState }
>('simulation/applyWatering', ({ plantId, data, notes }, { dispatch, getState }) => {
    const validation = WaterDataSchema.safeParse(data)
    if (!validation.success) {
        console.debug('Watering action validation failed:', validation.error)
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
            simulationSlice.actions.addJournalEntry({
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
        console.debug('Training action validation failed:', validation.error)
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
            simulationSlice.actions.addJournalEntry({
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
        console.debug('Pest Control action validation failed:', validation.error)
        getUISnapshot().addNotification({
            message: getT()('common.simulationErrors.invalidActionData', {
                action: 'Pest Control',
            }),
            type: 'error',
        })
        return
    }
    dispatch(
        simulationSlice.actions.addJournalEntry({
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
        console.debug('Amendment action validation failed:', validation.error)
        getUISnapshot().addNotification({
            message: getT()('common.simulationErrors.invalidActionData', {
                action: 'Amendment',
            }),
            type: 'error',
        })
        return
    }
    dispatch(
        simulationSlice.actions.addJournalEntry({
            plantId,
            entry: { type: JournalEntryType.Amendment, notes, details: validation.data },
        }),
    )
})

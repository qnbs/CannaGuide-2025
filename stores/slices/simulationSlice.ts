import { createSlice, PayloadAction, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { Plant, GrowSetup, Strain, JournalEntry, Task, SimulationState, PlantStage, ProblemType, JournalEntryType, AppSettings, HarvestData, TrainingType } from '@/types';
import { simulationService } from '@/services/plantSimulationService';
import type { RootState } from '../store';
import { cancelNewGrow, addNotification } from './uiSlice';
import { getT } from '@/i18n';
import { z } from 'zod';
import { GrowSetupSchema, WaterDataSchema, TrainingTypeSchema } from '@/types/schemas';

export const plantsAdapter = createEntityAdapter<Plant, string>();

const initialState: SimulationState = {
    plants: plantsAdapter.getInitialState(),
    plantSlots: [null, null, null],
    selectedPlantId: null,
    devSpeedMultiplier: 1,
};

// --- Async Thunks ---

export const startNewPlant = createAsyncThunk<void, void, { state: RootState }>(
    'simulation/startNewPlant',
    (arg, { dispatch, getState }) => {
        const { ui, settings, simulation } = getState();
        const { strain: strainForNewGrow, setup: setupForNewGrow, slotIndex: initiatingGrowForSlot } = ui.newGrowFlow;

        const validationResult = GrowSetupSchema.safeParse(setupForNewGrow);
        if (!validationResult.success) {
            console.error("GrowSetup validation failed:", validationResult.error.flatten());
            dispatch(addNotification({ message: getT()('simulationErrors.invalidGrowSetup'), type: 'error' }));
            dispatch(cancelNewGrow());
            return;
        }
        
        let targetSlot = initiatingGrowForSlot;
        // If the flow didn't start by clicking a slot, find the first available one.
        if (targetSlot === null) {
            targetSlot = simulation.plantSlots.findIndex(slot => slot === null);
        }
        
        if (strainForNewGrow && validationResult.data && targetSlot !== null && targetSlot !== -1) {
            const name = `${strainForNewGrow.name} #${targetSlot + 1}`;
            
            const newPlant = simulationService.createPlant(
                strainForNewGrow,
                validationResult.data,
                settings.settings.defaultGrowSetup.light,
                name
            );

            dispatch(simulationSlice.actions._addPlant({ plant: newPlant, slotIndex: targetSlot }));
            dispatch(cancelNewGrow());
            dispatch(addNotification({ message: getT()('plantsView.notifications.growStarted', { name }), type: 'success' }));
        } else {
            dispatch(addNotification({ message: getT()('plantsView.notifications.allSlotsFull'), type: 'error' }));
            dispatch(cancelNewGrow());
        }
    }
);

export const applyWateringAction = createAsyncThunk<void, { plantId: string, waterData: { amount: number, ph: number, ec?: number }, notes: string }, { state: RootState }>(
    'simulation/applyWateringAction',
    async ({ plantId, waterData, notes }, { dispatch, getState }) => {
        const validation = WaterDataSchema.safeParse(waterData);
        if (!validation.success) {
            dispatch(addNotification({ message: getT()('simulationErrors.invalidWateringData'), type: 'error' }));
            return;
        }

        const plant = getState().simulation.plants.entities[plantId];
        if (!plant) {
            dispatch(addNotification({ message: getT()('simulationErrors.plantNotFoundWatering'), type: 'error' }));
            return;
        }

        dispatch(waterPlant({ plantId, ...validation.data }));
        
        const entryType = validation.data.ec ? JournalEntryType.Feeding : JournalEntryType.Watering;
        dispatch(addJournalEntry({ plantId, entry: { type: entryType, notes, details: validation.data } }));
    }
);

export const applyTrainingAction = createAsyncThunk<void, { plantId: string, trainingType: TrainingType, notes: string }, { state: RootState }>(
    'simulation/applyTrainingAction',
    async ({ plantId, trainingType, notes }, { dispatch, getState }) => {
        const validation = TrainingTypeSchema.safeParse(trainingType);
        if (!validation.success) {
            dispatch(addNotification({ message: getT()('simulationErrors.invalidTrainingType'), type: 'error' }));
            return;
        }
        const validatedTrainingType = validation.data;

        const plant = getState().simulation.plants.entities[plantId];
        if (!plant) {
            dispatch(addNotification({ message: getT()('simulationErrors.plantNotFoundTraining'), type: 'error' }));
            return;
        }

        if (validatedTrainingType === 'Topping') {
            dispatch(topPlant({ plantId }));
        } else if (validatedTrainingType === 'LST') {
            dispatch(applyLst({ plantId }));
        }
        
        dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.Training, notes, details: { trainingType: validatedTrainingType } } }));
    }
);

const PestControlSchema = z.object({ notes: z.string().min(1, { message: getT()('simulationErrors.pestControlNotesEmpty') }) });
export const applyPestControlAction = createAsyncThunk<void, { plantId: string, notes: string }, { state: RootState }>(
    'simulation/applyPestControlAction',
    async({ plantId, notes }, { dispatch }) => {
        const validation = PestControlSchema.safeParse({ notes });
        if(!validation.success){
            dispatch(addNotification({ message: validation.error.issues[0].message, type: 'error' }));
            return;
        }
        dispatch(applyPestControl({ plantId, notes: validation.data.notes }));
        dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.PestControl, notes: validation.data.notes } }));
    }
);


export const updatePlantToNow = createAsyncThunk<void, string, { state: RootState }>(
    'simulation/updatePlantToNow',
    async (plantId, { getState, dispatch }) => {
        const plant = getState().simulation.plants.entities[plantId];
        if (!plant) return;

        const deltaTime = Date.now() - plant.lastUpdated;
        
        if (deltaTime > 1000) {
            const { updatedPlant, newJournalEntries, newTasks } = simulationService.calculateStateForTimeDelta(plant, deltaTime);
            
            const daysSimulated = updatedPlant.age - plant.age;
            if (daysSimulated > 0) {
                const simulatedMilliseconds = daysSimulated * 24 * 60 * 60 * 1000;
                updatedPlant.lastUpdated = plant.lastUpdated + simulatedMilliseconds;

                dispatch(simulationSlice.actions.plantStateUpdated({ updatedPlant, newJournalEntries, newTasks }));
            }
        }
    }
);

export const initializeSimulation = createAsyncThunk<
    { plants: SimulationState['plants'], plantSlots: (string | null)[] } | null,
    void,
    { state: RootState }
>(
    'simulation/initializeSimulation',
    async (_, { getState }) => {
        const { simulation } = getState();
        if (simulation && simulation.plants && simulation.plants.ids.length > 0) {
            return {
                plants: simulation.plants,
                plantSlots: simulation.plantSlots
            };
        }
        return null;
    }
);


const simulationSlice = createSlice({
    name: 'simulation',
    initialState,
    reducers: {
        setSimulationState: (state, action: PayloadAction<SimulationState>) => {
            if (action.payload && action.payload.plants) {
                plantsAdapter.setAll(state.plants, action.payload.plants);
            }
            if (action.payload && action.payload.plantSlots) {
                state.plantSlots = action.payload.plantSlots;
            }
            if (action.payload && action.payload.selectedPlantId) {
                state.selectedPlantId = action.payload.selectedPlantId;
            }
        },
        plantStateUpdated: (state, action: PayloadAction<{ updatedPlant: Plant, newJournalEntries: JournalEntry[], newTasks: Task[] }>) => {
            const { updatedPlant, newJournalEntries, newTasks } = action.payload;
            plantsAdapter.upsertOne(state.plants, updatedPlant);
            const currentPlant = state.plants.entities[updatedPlant.id];
            if (currentPlant) {
                if (newJournalEntries.length > 0) {
                    currentPlant.journal.push(...newJournalEntries);
                }
                if (newTasks.length > 0) {
                    currentPlant.tasks.push(...newTasks);
                }
            }
        },
        setSelectedPlantId: (state, action: PayloadAction<string | null>) => {
            state.selectedPlantId = action.payload;
        },
        _addPlant: (state, action: PayloadAction<{ plant: Plant, slotIndex: number }>) => {
            const { plant, slotIndex } = action.payload;
            plantsAdapter.addOne(state.plants, plant);
            state.plantSlots[slotIndex] = plant.id;
        },
        waterPlant: (state, action: PayloadAction<{ plantId: string, amount: number, ph: number, ec?: number }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) {
                plant.medium.moisture = 100;
                plant.medium.ph = (plant.medium.ph + action.payload.ph) / 2;
                if (action.payload.ec) {
                    plant.medium.ec = (plant.medium.ec + action.payload.ec) / 2;
                }
                plant.lastUpdated = Date.now();
            }
        },
        addJournalEntry: (state, action: PayloadAction<{ plantId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'> }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if(plant) {
                const newEntry: JournalEntry = {
                    ...action.payload.entry,
                    id: `journal-${plant.id}-${Date.now()}`,
                    createdAt: Date.now(),
                };
                plant.journal.push(newEntry);
            }
        },
        completeTask: (state, action: PayloadAction<{ plantId: string, taskId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            const task = plant?.tasks.find(t => t.id === action.payload.taskId);
            if(task) {
                task.isCompleted = true;
                task.completedAt = Date.now();
            }
        },
        resetPlants: (state) => {
            plantsAdapter.removeAll(state.plants);
            state.plantSlots = [null, null, null];
        },
        waterAllPlants: (state) => {
            state.plantSlots.forEach(plantId => {
                if (plantId) {
                    const plant = state.plants.entities[plantId];
                    if (plant) {
                       plant.medium.moisture = 100;
                       plant.lastUpdated = Date.now();
                       plant.journal.push({id: `journal-water-all-${Date.now()}`, createdAt: Date.now(), type: JournalEntryType.Watering, notes: 'Watered all plants.'});
                    }
                }
            });
        },
        topPlant: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) {
                plant.isTopped = true;
                plant.structuralModel.branches *= 2;
                plant.stressLevel = Math.min(100, plant.stressLevel + 15);
                plant.lastUpdated = Date.now();
            }
        },
        applyLst: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) {
                plant.lstApplied += 1;
                plant.stressLevel = Math.min(100, plant.stressLevel + 5);
                plant.lastUpdated = Date.now();
            }
        },
        applyPestControl: (state, action: PayloadAction<{ plantId: string; notes: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) {
                plant.problems = plant.problems.filter(p => p.type !== ProblemType.PestInfestation);
                plant.health = Math.min(100, plant.health + 5);
                plant.lastUpdated = Date.now();
            }
        },
        harvestPlant: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if(plant) {
                plant.stage = PlantStage.Harvest;
                plant.lastUpdated = Date.now();
                plant.harvestData = { 
                    wetWeight: plant.biomass * 4,
                    dryWeight: plant.biomass,
                    terpeneRetentionPercent: 100,
                    moldRiskPercent: 0,
                    dryingEnvironment: { temperature: 20, humidity: 60 },
                    currentDryDay: 0, 
                    currentCureDay: 0, 
                    jarHumidity: 75, 
                    finalQuality: 0,
                    chlorophyllPercent: 100,
                    terpeneProfile: {},
                    cannabinoidProfile: { thc: 0, cbn: 0 },
                    lastBurpDay: 0,
                };
            }
        },
        processPostHarvest: (state, action: PayloadAction<{ plantId: string, action: 'dry' | 'cure' | 'burp' }>) => {
             const plant = state.plants.entities[action.payload.plantId];
             if(plant && plant.harvestData) {
                 switch(action.payload.action) {
                     case 'dry':
                         plant.harvestData.currentDryDay += 1;
                         if(plant.harvestData.currentDryDay >= 10) {
                             plant.stage = PlantStage.Curing;
                         }
                         break;
                     case 'cure':
                         plant.harvestData.currentCureDay += 1;
                          plant.harvestData.jarHumidity = Math.max(55, plant.harvestData.jarHumidity - 0.5);
                         if(plant.harvestData.currentCureDay >= 21) {
                             plant.stage = PlantStage.Finished;
                             plant.harvestData.finalQuality = plant.health + (Math.random() * 10);
                         }
                         break;
                     case 'burp':
                         plant.harvestData.jarHumidity = 62;
                         break;
                 }
                 plant.lastUpdated = Date.now();
             }
        },
        toggleLight: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if(plant) plant.equipment.light.isOn = !plant.equipment.light.isOn;
        },
        toggleFan: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if(plant) plant.equipment.fan.isOn = !plant.equipment.fan.isOn;
        },
        setFanSpeed: (state, action: PayloadAction<{ plantId: string, speed: number }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if(plant) plant.equipment.fan.speed = action.payload.speed;
        },
        setLightHours: (state, action: PayloadAction<{ plantId: string; hours: number }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) {
                plant.equipment.light.lightHours = action.payload.hours;
                plant.lastUpdated = Date.now();
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initializeSimulation.fulfilled, (state, action) => {
            const payload = action.payload;
            if (payload && payload.plants.ids && payload.plants.entities) {
                plantsAdapter.setAll(state.plants, payload.plants);
                state.plantSlots = payload.plantSlots;
            }
        });
    },
});

export const { 
    setSimulationState,
    plantStateUpdated,
    setSelectedPlantId,
    _addPlant,
    waterPlant,
    addJournalEntry,
    completeTask,
    resetPlants,
    waterAllPlants,
    topPlant,
    applyLst,
    applyPestControl,
    harvestPlant,
    processPostHarvest,
    toggleLight,
    toggleFan,
    setFanSpeed,
    setLightHours,
} = simulationSlice.actions;
export default simulationSlice.reducer;
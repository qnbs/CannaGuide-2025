import { createSlice, PayloadAction, createEntityAdapter, createAsyncThunk } from '@reduxjs/toolkit';
import { Plant, GrowSetup, Strain, JournalEntry, Task, ProblemType, TaskPriority, JournalEntryType, TrainingType, AmendmentType, VentilationPower, SimulationState, PlantStage } from '@/types';
import { plantSimulationService, PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import { RootState } from '../store';
import { addNotification, cancelNewGrow } from './uiSlice';
import { getT } from '@/i18n';
import { GrowSetupSchema, WaterDataSchema, TrainingDataSchema, PestControlDataSchema, AmendmentDataSchema, FeedDataSchema } from '@/types/schemas';

export const plantsAdapter = createEntityAdapter<Plant>();

const initialState: SimulationState = {
    plants: plantsAdapter.getInitialState(),
    plantSlots: [null, null, null],
    selectedPlantId: null,
    devSpeedMultiplier: 1,
};

// This is a pure function, copied here to avoid circular dependencies with plantSimulationService
const calculateVPD = (tempC: number, rh: number, leafTempOffset: number): number => {
    const tempLeaf = tempC + leafTempOffset;
    const svpAir = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
    const avp = svpAir * (rh / 100);
    const svpLeaf = 0.61078 * Math.exp((17.27 * tempLeaf) / (tempLeaf + 237.3));
    return svpLeaf - avp;
};

const simulationSlice = createSlice({
    name: 'simulation',
    initialState,
    reducers: {
        setSimulationState: (state, action: PayloadAction<SimulationState>) => {
            state.plants = action.payload.plants;
            state.plantSlots = action.payload.plantSlots;
            state.selectedPlantId = action.payload.selectedPlantId;
        },
        addPlant: (state, action: PayloadAction<{ plant: Plant, slotIndex: number }>) => {
            const { plant, slotIndex } = action.payload;
            plantsAdapter.addOne(state.plants, plant);
            state.plantSlots[slotIndex] = plant.id;
        },
        updatePlant: plantsAdapter.updateOne,
        plantStateUpdated: (state, action: PayloadAction<{ updatedPlant: Plant, newJournalEntries: JournalEntry[], newTasks: Task[] }>) => {
            const { updatedPlant, newJournalEntries, newTasks } = action.payload;
            plantsAdapter.updateOne(state.plants, { id: updatedPlant.id, changes: updatedPlant });
            
            // This is a simple way to merge tasks; a more robust solution might check for duplicates
            const existingTaskIds = new Set(state.plants.entities[updatedPlant.id]?.tasks.map(t => t.id));
            const tasksToAdd = newTasks.filter(t => !existingTaskIds.has(t.id));
            if (state.plants.entities[updatedPlant.id]) {
                state.plants.entities[updatedPlant.id]!.tasks.push(...tasksToAdd);
            }
        },
        setSelectedPlantId: (state, action: PayloadAction<string | null>) => {
            state.selectedPlantId = action.payload;
        },
        addJournalEntry: (state, action: PayloadAction<{ plantId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'> }>) => {
            const { plantId, entry } = action.payload;
            const plant = state.plants.entities[plantId];
            if (plant) {
                const newEntry: JournalEntry = {
                    ...entry,
                    id: `journal-${plantId}-${Date.now()}`,
                    createdAt: Date.now(),
                };
                plant.journal.push(newEntry);
            }
        },
        completeTask: (state, action: PayloadAction<{ plantId: string, taskId: string }>) => {
            const { plantId, taskId } = action.payload;
            const plant = state.plants.entities[plantId];
            if (plant) {
                const task = plant.tasks.find(t => t.id === taskId);
                if (task) {
                    task.isCompleted = true;
                    task.completedAt = Date.now();
                }
            }
        },
        // Equipment controls
        toggleLight: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.light.isOn = !plant.equipment.light.isOn;
        },
        toggleFan: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.exhaustFan.isOn = !plant.equipment.exhaustFan.isOn;
        },
        setLightHours: (state, action: PayloadAction<{ plantId: string, hours: number }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.light.lightHours = action.payload.hours;
        },
        setLightWattage: (state, action: PayloadAction<{ plantId: string, wattage: number }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.light.wattage = action.payload.wattage;
        },
        toggleCirculationFan: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.circulationFan.isOn = !plant.equipment.circulationFan.isOn;
        },
        setVentilationPower: (state, action: PayloadAction<{ plantId: string, power: VentilationPower }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.exhaustFan.power = action.payload.power;
        },
        setGlobalEnvironment: (state, action: PayloadAction<{ temperature?: number; humidity?: number }>) => {
            const { temperature, humidity } = action.payload;
            state.plantSlots.forEach(plantId => {
                if (plantId) {
                    const plant = state.plants.entities[plantId];
                    if (plant) {
                        if (temperature !== undefined) {
                            plant.environment.internalTemperature = temperature;
                        }
                        if (humidity !== undefined) {
                            plant.environment.internalHumidity = humidity;
                        }
                        plant.environment.vpd = calculateVPD(plant.environment.internalTemperature, plant.environment.internalHumidity, -2);
                    }
                }
            });
        },
        processPostHarvest: (state, action: PayloadAction<{ plantId: string, action: 'dry' | 'burp' | 'cure' }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant && plant.harvestData) {
                // Simplified post-harvest logic
                if (action.payload.action === 'dry' && plant.stage === PlantStage.Drying) {
                    plant.harvestData.currentDryDay += 1;
                    if (plant.harvestData.currentDryDay >= PLANT_STAGE_DETAILS[PlantStage.Drying].duration) {
                        plant.stage = PlantStage.Curing;
                    }
                }
                if (action.payload.action === 'cure' && plant.stage === PlantStage.Curing) {
                    plant.harvestData.currentCureDay += 1;
                    if (plant.harvestData.currentCureDay >= PLANT_STAGE_DETAILS[PlantStage.Curing].duration) {
                        plant.stage = PlantStage.Finished;
                    }
                }
                 if (action.payload.action === 'burp' && plant.stage === PlantStage.Curing) {
                    plant.harvestData.lastBurpDay = plant.harvestData.currentCureDay;
                }
            }
        },
        resetPlants: (state) => {
            plantsAdapter.removeAll(state.plants);
            state.plantSlots = [null, null, null];
            state.selectedPlantId = null;
        },
    }
});

export const startNewPlant = createAsyncThunk<void, void, { state: RootState }>(
    'simulation/startNewPlant',
    (arg, { dispatch, getState }) => {
        const { newGrowFlow } = getState().ui;
        if (newGrowFlow.status === 'confirming' && newGrowFlow.strain && newGrowFlow.setup && newGrowFlow.slotIndex !== null) {
            const validation = GrowSetupSchema.safeParse(newGrowFlow.setup);
            if (!validation.success) {
                console.error("Invalid Grow Setup:", validation.error);
                dispatch(addNotification({ message: getT()('common.simulationErrors.invalidSetup'), type: 'error' }));
                dispatch(cancelNewGrow());
                return;
            }

            const newPlant = plantSimulationService.createPlant(newGrowFlow.strain, validation.data, `${newGrowFlow.strain.name} #${newGrowFlow.slotIndex + 1}`);
            dispatch(simulationSlice.actions.addPlant({ plant: newPlant, slotIndex: newGrowFlow.slotIndex }));
            dispatch(addNotification({ message: getT()('plantsView.notifications.growStarted', { name: newPlant.name }), type: 'success' }));
            dispatch(cancelNewGrow());
        }
    }
);

export const updatePlantToNow = createAsyncThunk<void, string, { state: RootState }>(
    'simulation/updatePlantToNow',
    async (plantId, { dispatch, getState }) => {
        const state = getState();
        const plant = state.simulation.plants.entities[plantId];
        if (plant) {
            const deltaTime = Date.now() - plant.lastUpdated;
            if (deltaTime > 1000 * 60) { // Only update if more than a minute has passed
                const worker = new Worker(new URL('/simulation.worker.ts', import.meta.url), { type: 'module' });
                worker.onmessage = (e) => {
                    dispatch(simulationSlice.actions.plantStateUpdated(e.data));
                    worker.terminate();
                };
                worker.postMessage({ plant, deltaTime });
            }
        }
    }
);

export const initializeSimulation = createAsyncThunk<void, void, { state: RootState }>(
    'simulation/initialize',
    async (_, { dispatch, getState }) => {
        const { plants } = getState().simulation;
        const plantIds = plants.ids as string[];
        for (const id of plantIds) {
            await dispatch(updatePlantToNow(id));
        }
    }
);

export const waterAllPlants = createAsyncThunk<void, void, { state: RootState }>(
    'simulation/waterAll',
    (_, { dispatch, getState }) => {
        const { plants } = getState().simulation;
        const plantIds = plants.ids as string[];
        plantIds.forEach(id => {
            dispatch(applyWateringAction({ plantId: id, data: {}, notes: 'Watered all plants.'}));
        });
    }
);

// --- RING 3 VALIDATING THUNKS ---

export const applyWateringAction = createAsyncThunk<void, { plantId: string, data: any, notes: string }, { state: RootState }>(
    'simulation/applyWatering',
    ({ plantId, data, notes }, { dispatch, getState }) => {
        const validation = WaterDataSchema.safeParse(data);
        if (!validation.success) {
            dispatch(addNotification({ message: getT()('common.simulationErrors.invalidActionData', { action: 'Watering' }), type: 'error' }));
            return;
        }
        
        const plant = getState().simulation.plants.entities[plantId];
        if (plant) {
            const updatedPlant = plantSimulationService.clonePlant(plant);
            const waterCapacity = updatedPlant.equipment.potSize * 1000 * (updatedPlant.equipment.potType === 'Fabric' ? 0.28 : 0.35);
            updatedPlant.medium.substrateWater = waterCapacity;
            updatedPlant.medium.moisture = 100;
            if (validation.data.ph) updatedPlant.medium.ph = validation.data.ph;
            if (validation.data.ec) updatedPlant.medium.ec = validation.data.ec;

            dispatch(simulationSlice.actions.updatePlant({ id: plantId, changes: updatedPlant }));
            dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.Watering, notes, details: validation.data } }));
        }
    }
);

export const applyTrainingAction = createAsyncThunk<void, { plantId: string, data: any, notes: string }, { state: RootState }>(
    'simulation/applyTraining',
    ({ plantId, data, notes }, { dispatch, getState }) => {
        const validation = TrainingDataSchema.safeParse(data);
        if (!validation.success) {
             dispatch(addNotification({ message: getT()('common.simulationErrors.invalidActionData', { action: 'Training' }), type: 'error' }));
            return;
        }

        const plant = getState().simulation.plants.entities[plantId];
        if (plant) {
            let updatedPlant = plantSimulationService.clonePlant(plant);
            if (validation.data.type === 'Topping') {
                updatedPlant = plantSimulationService.topPlant(updatedPlant).updatedPlant;
            } else if (validation.data.type === 'LST') {
                updatedPlant = plantSimulationService.applyLst(updatedPlant).updatedPlant;
            }
            dispatch(simulationSlice.actions.updatePlant({ id: plantId, changes: updatedPlant }));
            dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.Training, notes, details: validation.data } }));
        }
    }
);

export const applyPestControlAction = createAsyncThunk<void, { plantId: string, data: any, notes: string }, { state: RootState }>(
    'simulation/applyPestControl',
    ({ plantId, data, notes }, { dispatch, getState }) => {
        // Validation, simulation logic, then dispatch journal entry
        dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.PestControl, notes, details: data } }));
    }
);

export const applyAmendmentAction = createAsyncThunk<void, { plantId: string, data: any, notes: string }, { state: RootState }>(
    'simulation/applyAmendment',
    ({ plantId, data, notes }, { dispatch, getState }) => {
        // Validation, simulation logic, then dispatch journal entry
        dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.Amendment, notes, details: data } }));
    }
);

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
    resetPlants
} = simulationSlice.actions;

export default simulationSlice.reducer;
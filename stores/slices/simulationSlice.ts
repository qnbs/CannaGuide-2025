import { createSlice, PayloadAction, createEntityAdapter, createAsyncThunk } from '@reduxjs/toolkit';
import { Plant, GrowSetup, Strain, JournalEntry, Task, SimulationState, PlantStage, JournalEntryType, TrainingType, AmendmentType, VentilationPower } from '@/types';
// FIX: Added missing import for PLANT_STAGE_DETAILS.
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
                 const { updatedPlant, newJournalEntries, newTasks } = plantSimulationService.calculateStateForTimeDelta(plant, deltaTime);
                 dispatch(plantStateUpdated({ updatedPlant }));
                 newJournalEntries.forEach(entry => dispatch(addJournalEntry({ plantId, entry })));
                 newTasks.forEach(task => dispatch(simulationSlice.actions.addTask({ plantId, task })));
            }
        }
    }
);

// --- Validating Async Thunks for all interactions ---

export const applyWateringAction = createAsyncThunk<void, { plantId: string, data: { amountMl?: number, ph?: number }, notes: string }, { state: RootState }>(
    'simulation/applyWatering',
    ({ plantId, data, notes }, { dispatch }) => {
        const validation = WaterDataSchema.safeParse(data);
        if (!validation.success) {
            dispatch(addNotification({ message: getT()('common.simulationErrors.invalidActionData', { action: 'Watering' }), type: 'error' }));
            return;
        }
        dispatch(simulationSlice.actions.applyWatering({ plantId, amountMl: validation.data.amountMl || 500, ph: validation.data.ph }));
        dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.Watering, notes, details: validation.data } }));
    }
);

export const applyFeedingAction = createAsyncThunk<void, { plantId: string, data: any, notes: string }, { state: RootState }>(
    'simulation/applyFeeding',
    ({ plantId, data, notes }, { dispatch }) => {
        const validation = FeedDataSchema.safeParse(data);
        if (!validation.success) {
            dispatch(addNotification({ message: getT()('common.simulationErrors.invalidActionData', { action: 'Feeding' }), type: 'error' }));
            return;
        }
        dispatch(simulationSlice.actions.applyFeeding({ plantId, ...validation.data }));
        dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.Feeding, notes, details: validation.data } }));
    }
);


export const applyTrainingAction = createAsyncThunk<void, { plantId: string, data: { type: TrainingType }, notes: string }, { state: RootState }>(
    'simulation/applyTraining',
    ({ plantId, data, notes }, { dispatch }) => {
        const validation = TrainingDataSchema.safeParse(data);
        if (!validation.success) {
            dispatch(addNotification({ message: getT()('common.simulationErrors.invalidActionData', { action: 'Training' }), type: 'error' }));
            return;
        }
        dispatch(simulationSlice.actions.applyTraining({ plantId, type: validation.data.type }));
        dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.Training, notes, details: validation.data } }));
    }
);

export const applyPestControlAction = createAsyncThunk<void, { plantId: string, data: { method: string }, notes: string }, { state: RootState }>(
    'simulation/applyPestControl',
    ({ plantId, data, notes }, { dispatch }) => {
        const validation = PestControlDataSchema.safeParse(data);
         if (!validation.success) {
            dispatch(addNotification({ message: getT()('common.simulationErrors.invalidActionData', { action: 'Pest Control' }), type: 'error' }));
            return;
        }
        dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.PestControl, notes, details: validation.data } }));
    }
);

export const applyAmendmentAction = createAsyncThunk<void, { plantId: string, data: { type: AmendmentType }, notes: string }, { state: RootState }>(
    'simulation/applyAmendment',
    ({ plantId, data, notes }, { dispatch }) => {
        const validation = AmendmentDataSchema.safeParse(data);
         if (!validation.success) {
            dispatch(addNotification({ message: getT()('common.simulationErrors.invalidActionData', { action: 'Amendment' }), type: 'error' }));
            return;
        }
        dispatch(addJournalEntry({ plantId, entry: { type: JournalEntryType.Amendment, notes, details: validation.data } }));
    }
);


const simulationSlice = createSlice({
    name: 'simulation',
    initialState,
    reducers: {
        setSimulationState: (state, action: PayloadAction<SimulationState>) => {
            return action.payload;
        },
        addPlant: (state, action: PayloadAction<{ plant: Plant, slotIndex: number }>) => {
            plantsAdapter.addOne(state.plants, action.payload.plant);
            state.plantSlots[action.payload.slotIndex] = action.payload.plant.id;
        },
        setSelectedPlantId: (state, action: PayloadAction<string | null>) => {
            state.selectedPlantId = action.payload;
        },
        plantStateUpdated: (state, action: PayloadAction<{ updatedPlant: Plant }>) => {
            plantsAdapter.updateOne(state.plants, { id: action.payload.updatedPlant.id, changes: action.payload.updatedPlant });
        },
        addJournalEntry: (state, action: PayloadAction<{ plantId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'> }>) => {
            const { plantId, entry } = action.payload;
            const plant = state.plants.entities[plantId];
            if (plant) {
                const newEntry: JournalEntry = { ...entry, id: `journal-${Date.now()}`, createdAt: Date.now() };
                plant.journal.push(newEntry);
            }
        },
        addTask: (state, action: PayloadAction<{ plantId: string, task: Task }>) => {
            const { plantId, task } = action.payload;
            const plant = state.plants.entities[plantId];
            if(plant && !plant.tasks.some(t => t.id === task.id)) {
                plant.tasks.push(task);
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
        waterAllPlants: (state) => {
            state.plantSlots.forEach(plantId => {
                if (plantId) {
                    const plant = state.plants.entities[plantId];
                    if (plant) {
                        const waterCapacity = (plant.setup as unknown as GrowSetup)?.potSize * 1000 * ((plant.setup as unknown as GrowSetup)?.potType === 'Fabric' ? 0.28 : 0.35) || 5000;
                        plant.medium.substrateWater = Math.min(waterCapacity, plant.medium.substrateWater + 1000);
                        plant.medium.moisture = (plant.medium.substrateWater / waterCapacity) * 100;
                    }
                }
            });
        },
        resetPlants: (state) => {
            plantsAdapter.removeAll(state.plants);
            state.plantSlots = [null, null, null];
            state.selectedPlantId = null;
        },
        toggleLight: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.light.isOn = !plant.equipment.light.isOn;
        },
        toggleFan: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.exhaustFan.isOn = !plant.equipment.exhaustFan.isOn;
        },
        toggleCirculationFan: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.circulationFan.isOn = !plant.equipment.circulationFan.isOn;
        },
        setLightWattage: (state, action: PayloadAction<{ plantId: string; wattage: number }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.light.wattage = action.payload.wattage;
        },
        setVentilationPower: (state, action: PayloadAction<{ plantId: string; power: VentilationPower }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.exhaustFan.power = action.payload.power;
        },
        setLightHours: (state, action: PayloadAction<{ plantId: string, hours: number }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) plant.equipment.light.lightHours = action.payload.hours;
        },
        processPostHarvest: (state, action: PayloadAction<{ plantId: string, action: 'dry' | 'burp' | 'cure' }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (!plant || !plant.harvestData) return;
            if (plant.stage === PlantStage.Drying && action.payload.action === 'dry') {
                plant.harvestData.currentDryDay++;
                if (plant.harvestData.currentDryDay >= PLANT_STAGE_DETAILS[PlantStage.Drying].duration) plant.stage = PlantStage.Curing;
            }
            if (plant.stage === PlantStage.Curing) {
                if (action.payload.action === 'burp') plant.harvestData.lastBurpDay = plant.harvestData.currentCureDay;
                if (action.payload.action === 'cure') {
                    plant.harvestData.currentCureDay++;
                    if (plant.harvestData.currentCureDay >= PLANT_STAGE_DETAILS[PlantStage.Curing].duration) plant.stage = PlantStage.Finished;
                }
            }
        },
        initializeSimulation: (state) => {},
        applyWatering: (state, action: PayloadAction<{ plantId: string; amountMl?: number; ph?: number }>) => {
             const plant = state.plants.entities[action.payload.plantId];
             if (plant) {
                const waterCapacity = (plant.setup as unknown as GrowSetup)?.potSize * 1000 * ((plant.setup as unknown as GrowSetup)?.potType === 'Fabric' ? 0.28 : 0.35) || 5000;
                plant.medium.substrateWater = Math.min(waterCapacity, plant.medium.substrateWater + (action.payload.amountMl || 500));
                plant.medium.moisture = (plant.medium.substrateWater / waterCapacity) * 100;
                if(action.payload.ph) plant.medium.ph = (plant.medium.ph + action.payload.ph) / 2; // Average pH
             }
        },
        applyFeeding: (state, action: PayloadAction<{ plantId: string, ec: number, ph: number }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) {
                plant.medium.ec = (plant.medium.ec + action.payload.ec) / 2;
                plant.medium.ph = (plant.medium.ph + action.payload.ph) / 2;
            }
        },
        applyTraining: (state, action: PayloadAction<{ plantId: string, type: TrainingType }>) => {
            const plant = state.plants.entities[action.payload.plantId];
            if (plant) {
                let result;
                if (action.payload.type === 'LST') result = plantSimulationService.applyLst(plant);
                else if (action.payload.type === 'Topping' || action.payload.type === 'FIMing') result = plantSimulationService.topPlant(plant);
                
                if (result) {
                    plantsAdapter.updateOne(state.plants, { id: action.payload.plantId, changes: result.updatedPlant });
                }
            }
        },
    }
});

export const {
    setSimulationState,
    addPlant,
    setSelectedPlantId,
    plantStateUpdated,
    addJournalEntry,
    addTask,
    completeTask,
    waterAllPlants,
    resetPlants,
    toggleLight,
    toggleFan,
    toggleCirculationFan,
    setLightWattage,
    setVentilationPower,
    setLightHours,
    processPostHarvest,
    initializeSimulation
} = simulationSlice.actions;

export default simulationSlice.reducer;
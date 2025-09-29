import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Plant, GrowSetup, Strain, JournalEntry, Task, SimulationState, PlantStage, ProblemType, JournalEntryType, AppSettings } from '@/types';
import { simulationService } from '@/services/plantSimulationService';
import { RootState } from '../store';
import { cancelNewGrow, addNotification } from './uiSlice';
import { getT } from '@/i18n';

// FIX: Added missing `devSpeedMultiplier` property to match the `SimulationState` type.
const initialState: SimulationState = {
    plants: {},
    plantSlots: [null, null, null],
    selectedPlantId: null,
    devSpeedMultiplier: 1,
};

// --- Async Thunks ---

export const startNewPlant = createAsyncThunk<void, void, { state: RootState }>(
    'simulation/startNewPlant',
    (arg, { dispatch, getState }) => {
        const { ui, settings } = getState();
        const { strainForNewGrow, setupForNewGrow, initiatingGrowForSlot } = ui;
        
        if (strainForNewGrow && setupForNewGrow && initiatingGrowForSlot !== null) {
            const name = `${strainForNewGrow.name} #${initiatingGrowForSlot + 1}`;
            
            const newPlant = simulationService.createPlant(
                strainForNewGrow,
                setupForNewGrow,
                settings.settings.defaultGrowSetup.light,
                name
            );

            dispatch(simulationSlice.actions._addPlant({ plant: newPlant, slotIndex: initiatingGrowForSlot }));
            dispatch(cancelNewGrow());
            dispatch(addNotification({ message: getT()('plantsView.notifications.growStarted', { name }), type: 'success' }));
        }
    }
);

export const updatePlantToNow = createAsyncThunk<void, string, { state: RootState }>(
    'simulation/updatePlantToNow',
    async (plantId, { getState, dispatch }) => {
        const plant = getState().simulation.plants[plantId];
        if (!plant) return;

        const deltaTime = Date.now() - plant.lastUpdated;
        
        // Only run simulation if more than a second has passed to avoid excessive calls
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


const simulationSlice = createSlice({
    name: 'simulation',
    initialState,
    reducers: {
        initializeSimulation: (state, action: PayloadAction<AppSettings | { settings: AppSettings, plants: Record<string, Plant>, plantSlots: (string | null)[] }>) => {
            const payload = action.payload;
            if ('plants' in payload) { // Hydrating from persisted Redux state
                state.plants = payload.plants;
                state.plantSlots = payload.plantSlots;
                // Migration for older states that don't have lastUpdated
                Object.keys(state.plants).forEach(plantId => {
                    const plant = state.plants[plantId];
                    if (plant && !plant.lastUpdated) {
                        plant.lastUpdated = Date.now();
                    }
                });
            }
        },
        plantStateUpdated: (state, action: PayloadAction<{ updatedPlant: Plant, newJournalEntries: JournalEntry[], newTasks: Task[] }>) => {
            const { updatedPlant, newJournalEntries, newTasks } = action.payload;
            state.plants[updatedPlant.id] = updatedPlant;
            if (newJournalEntries.length > 0) {
                state.plants[updatedPlant.id].journal.push(...newJournalEntries);
            }
            if (newTasks.length > 0) {
                state.plants[updatedPlant.id].tasks.push(...newTasks);
            }
        },
        setSelectedPlantId: (state, action: PayloadAction<string | null>) => {
            state.selectedPlantId = action.payload;
        },
        _addPlant: (state, action: PayloadAction<{ plant: Plant, slotIndex: number }>) => {
            const { plant, slotIndex } = action.payload;
            state.plants[plant.id] = plant;
            state.plantSlots[slotIndex] = plant.id;
        },
        waterPlant: (state, action: PayloadAction<{ plantId: string, amount: number, ph: number, ec?: number }>) => {
            const plant = state.plants[action.payload.plantId];
            if (plant) {
                plant.substrate.moisture = 100;
                plant.substrate.ph = (plant.substrate.ph + action.payload.ph) / 2;
                if (action.payload.ec) {
                    plant.substrate.ec = (plant.substrate.ec + action.payload.ec) / 2;
                }
                plant.lastUpdated = Date.now();
            }
        },
        addJournalEntry: (state, action: PayloadAction<{ plantId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'> }>) => {
            const plant = state.plants[action.payload.plantId];
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
            const plant = state.plants[action.payload.plantId];
            const task = plant?.tasks.find(t => t.id === action.payload.taskId);
            if(task) {
                task.isCompleted = true;
                task.completedAt = Date.now();
            }
        },
        resetPlants: (state) => {
            state.plants = {};
            state.plantSlots = [null, null, null];
        },
        waterAllPlants: (state) => {
            state.plantSlots.forEach(plantId => {
                if (plantId) {
                    const plant = state.plants[plantId];
                    if (plant) {
                       plant.substrate.moisture = 100;
                       plant.lastUpdated = Date.now();
                       plant.journal.push({id: `journal-water-all-${Date.now()}`, createdAt: Date.now(), type: JournalEntryType.Watering, notes: 'Watered all plants.'});
                    }
                }
            });
        },
        topPlant: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants[action.payload.plantId];
            if (plant) {
                const { updatedPlant } = simulationService.topPlant(plant);
                state.plants[action.payload.plantId] = updatedPlant;
                state.plants[action.payload.plantId].lastUpdated = Date.now();
            }
        },
        applyLst: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants[action.payload.plantId];
            if (plant) {
                const { updatedPlant } = simulationService.applyLst(plant);
                state.plants[action.payload.plantId] = updatedPlant;
                state.plants[action.payload.plantId].lastUpdated = Date.now();
            }
        },
        applyPestControl: (state, action: PayloadAction<{ plantId: string; notes: string }>) => {
            const plant = state.plants[action.payload.plantId];
            if (plant) {
                plant.problems = plant.problems.filter(p => p.type !== ProblemType.PestInfestation);
                plant.health = Math.min(100, plant.health + 5);
                plant.lastUpdated = Date.now();
            }
        },
        harvestPlant: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants[action.payload.plantId];
            if(plant) {
                plant.stage = PlantStage.Harvest;
                plant.lastUpdated = Date.now();
                // @ts-ignore
                plant.postHarvest = { 
                    wetWeight: plant.biomass * 4, // Example calculation
                    dryWeight: plant.biomass, // Example calculation
                    terpeneRetentionPercent: 100,
                    moldRiskPercent: 0,
                    dryingEnvironment: { temperature: 20, humidity: 60 },
                    currentDryDay: 0, 
                    currentCureDay: 0, 
                    jarHumidity: 75, 
                    finalQuality: 0,
                    chlorophyllPercent: 100,
                    terpeneProfile: { 'Myrcene': 40, 'Limonene': 30, 'Caryophyllene': 20, 'Pinene': 10 },
                    cannabinoidProfile: { thc: plant.strain.thc, cbn: 0 },
                    lastBurpDay: 0,
                };
            }
        },
        processPostHarvest: (state, action: PayloadAction<{ plantId: string, action: 'dry' | 'cure' | 'burp' }>) => {
             const plant = state.plants[action.payload.plantId];
             if(plant && plant.postHarvest) {
                 switch(action.payload.action) {
                     case 'dry':
                         plant.postHarvest.currentDryDay += 1;
                         if(plant.postHarvest.currentDryDay >= 10) {
                             plant.stage = PlantStage.Curing;
                         }
                         break;
                     case 'cure':
                         plant.postHarvest.currentCureDay += 1;
                          plant.postHarvest.jarHumidity = Math.max(55, plant.postHarvest.jarHumidity - 0.5);
                         if(plant.postHarvest.currentCureDay >= 21) {
                             plant.stage = PlantStage.Finished;
                             plant.postHarvest.finalQuality = plant.health + (Math.random() * 10);
                         }
                         break;
                     case 'burp':
                         plant.postHarvest.jarHumidity = 62;
                         break;
                 }
                 plant.lastUpdated = Date.now();
             }
        },
        toggleLight: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants[action.payload.plantId];
            if(plant) plant.equipment.light.isOn = !plant.equipment.light.isOn;
        },
        toggleFan: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants[action.payload.plantId];
            if(plant) plant.equipment.fan.isOn = !plant.equipment.fan.isOn;
        },
        setFanSpeed: (state, action: PayloadAction<{ plantId: string, speed: number }>) => {
            const plant = state.plants[action.payload.plantId];
            if(plant) plant.equipment.fan.speed = action.payload.speed;
        },
    },
});

export const { 
    initializeSimulation, 
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
} = simulationSlice.actions;
export default simulationSlice.reducer;
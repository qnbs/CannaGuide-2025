import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Plant, GrowSetup, Strain, JournalEntry, Task, SimulationState, PlantStage, ProblemType, JournalEntryType } from '@/types';
import { simulationService } from '@/services/plantSimulationService';
import { AppSettings } from '@/types';

const initialState: SimulationState = {
    plants: {},
    plantSlots: [null, null, null],
    selectedPlantId: null,
    isCatchingUp: false,
    lastTick: 0,
};

const simulationSlice = createSlice({
    name: 'simulation',
    initialState,
    reducers: {
        initializeSimulation: (state, action: PayloadAction<AppSettings | { settings: AppSettings, plants: Record<string, Plant>, plantSlots: (string | null)[] }>) => {
            const payload = action.payload;
            if ('plants' in payload) { // Hydrating from persisted Redux state
                state.plants = payload.plants;
                state.plantSlots = payload.plantSlots;
            }
            state.lastTick = Date.now();
            state.isCatchingUp = false;
        },
        tick: (state, action: PayloadAction<{ deltaTime: number }>) => {
            // Placeholder for a more complex time-based simulation update
        },
        setSelectedPlantId: (state, action: PayloadAction<string | null>) => {
            state.selectedPlantId = action.payload;
        },
        startNewPlant: (state, action: PayloadAction<{ strain: Strain, setup: GrowSetup, slotIndex: number, name: string }>) => {
            const { strain, setup, slotIndex, name } = action.payload;
            const newPlant = simulationService.createPlant(strain, setup, name);
            state.plants[newPlant.id] = newPlant;
            state.plantSlots[slotIndex] = newPlant.id;
        },
        waterPlant: (state, action: PayloadAction<{ plantId: string, amount: number, ph: number, ec?: number }>) => {
            const plant = state.plants[action.payload.plantId];
            if (plant) {
                plant.substrate.moisture = 100;
                plant.substrate.ph = (plant.substrate.ph + action.payload.ph) / 2;
                if (action.payload.ec) {
                    plant.substrate.ec = (plant.substrate.ec + action.payload.ec) / 2;
                }
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
            }
        },
        applyLst: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants[action.payload.plantId];
            if (plant) {
                const { updatedPlant } = simulationService.applyLst(plant);
                state.plants[action.payload.plantId] = updatedPlant;
            }
        },
        // FIX: Add missing applyPestControl reducer.
        applyPestControl: (state, action: PayloadAction<{ plantId: string; notes: string }>) => {
            const plant = state.plants[action.payload.plantId];
            if (plant) {
                plant.problems = plant.problems.filter(p => p.type !== ProblemType.PestInfestation);
                plant.health = Math.min(100, plant.health + 5);
            }
        },
        harvestPlant: (state, action: PayloadAction<{ plantId: string }>) => {
            const plant = state.plants[action.payload.plantId];
            if(plant) {
                plant.stage = PlantStage.Harvest;
                plant.postHarvest = { currentDryDay: 0, currentCureDay: 0, jarHumidity: 70, finalQuality: 0 };
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
    tick, 
    setSelectedPlantId,
    startNewPlant,
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
    setFanSpeed
} = simulationSlice.actions;
export default simulationSlice.reducer;

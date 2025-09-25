import { Plant, Strain, GrowSetup, JournalEntry, Task, PlantStage } from '@/types';
import { runSimulationInWorker, SIMULATION_CONSTANTS } from '@/services/plantSimulationService';
import type { AppState, StoreSet, StoreGet, TFunction } from '@/stores/useAppStore';

export interface PlantSlice {
    plants: Record<string, Plant>;
    plantSlots: (string | null)[];
    startNewPlant: (strain: Strain, setup: GrowSetup, slotIndex?: number) => boolean;
    advanceSimulation: () => Promise<void>;
    addJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
    completeTask: (plantId: string, taskId: string) => void;
    waterAllPlants: () => number;
    advanceDay: () => Promise<void>;
    resetPlants: () => void;
}

export const createPlantSlice = (set: StoreSet, get: StoreGet, t: () => TFunction): PlantSlice => ({
    plants: {},
    plantSlots: [null, null, null],

    startNewPlant: (strain, setup, slotIndex) => {
        const { plantSlots } = get();
        const emptySlotIndex = slotIndex !== undefined && plantSlots[slotIndex] === null ? slotIndex : plantSlots.findIndex(p => p === null);

        if (emptySlotIndex === -1) {
            return false;
        }
        
        const now = Date.now();
        const newPlantId = `${strain.id.replace(/\s/g, '-')}-${now}`;
        const newPlant: Plant = {
            id: newPlantId, name: strain.name, strain, stage: PlantStage.Seed, age: 0, height: 0, health: 100, startedAt: now, lastUpdated: now,
            growSetup: setup, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2, nutrients: 100 }, environment: { temperature: setup.temperature, humidity: setup.humidity, light: 100 },
            stressLevel: 0, problems: [], journal: [], tasks: [], history: [{ day: 0, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2, nutrients: 100 }, stressLevel: 0, height: 0 }],
        };
        
        set(state => {
            state.plantSlots[emptySlotIndex] = newPlantId;
            state.plants[newPlantId] = newPlant;
        });

        get().addJournalEntry(newPlant.id, { type: 'SYSTEM', notes: t()('plantsView.journal.startGrowing', { name: newPlant.name }) });
        return true;
    },
    
    advanceSimulation: async () => {
        const { settings, plants } = get();
        const activePlants = Object.values(plants).filter((p): p is Plant => !!p && p.stage !== PlantStage.Finished);
        if (activePlants.length === 0) return;

        const now = Date.now();
        const speedInMinutes = { '1x': 5, '2x': 2.5, '5x': 1, '10x': 0.5, '20x': 0.25 }[settings.simulationSettings.speed] || 5;
        const simulationDayDuration = speedInMinutes * 60 * 1000;

        for (const plant of activePlants) {
            const timeElapsed = now - plant.lastUpdated;
            const daysToSimulate = Math.floor(timeElapsed / simulationDayDuration);

            if (daysToSimulate > 0) {
                let currentPlantState = plant;
                for (let i = 0; i < daysToSimulate; i++) {
                    const { updatedPlant, events } = await runSimulationInWorker(currentPlantState, settings);
                    currentPlantState = updatedPlant;
                    
                    events.forEach((event: any) => {
                        if (event.type === 'notification') get().addNotification(t()(event.data.messageKey, event.data.params), event.data.type);
                        if (event.type === 'journal') get().addJournalEntry(updatedPlant.id, { type: event.data.type, notes: t()(event.data.notesKey, event.data.params) });
                        if (event.type === 'task') {
                            const newTask: Task = { ...event.data, id: `${event.data.title}-${Date.now()}`, isCompleted: false, createdAt: Date.now() };
                            set(state => { state.plants[updatedPlant.id]?.tasks.push(newTask); });
                        }
                    });
                }
                
                set(state => {
                    state.plants[currentPlantState.id] = { ...currentPlantState, lastUpdated: now };
                });
            }
        }
    },

    advanceDay: async () => {
        const { settings, plants } = get();
        const activePlants = Object.values(plants).filter((p): p is Plant => !!p && p.stage !== PlantStage.Finished);
        if (activePlants.length === 0) return;

        for (const plant of activePlants) {
            const { updatedPlant, events } = await runSimulationInWorker(plant, settings);
            set(state => {
                state.plants[updatedPlant.id] = updatedPlant;
            });
            events.forEach((event: any) => {
                if (event.type === 'notification') get().addNotification(t()(event.data.messageKey, event.data.params), event.data.type);
                if (event.type === 'journal') get().addJournalEntry(updatedPlant.id, { type: event.data.type, notes: t()(event.data.notesKey, event.data.params) });
                if (event.type === 'task') {
                    const newTask: Task = { ...event.data, id: `${event.data.title}-${Date.now()}`, isCompleted: false, createdAt: Date.now() };
                    set(state => { state.plants[updatedPlant.id]?.tasks.push(newTask); });
                }
            });
        }
    },

    addJournalEntry: (plantId, entryData) => set(state => {
        const plant = state.plants[plantId];
        if (!plant) return;
        
        const newEntry: JournalEntry = { ...entryData, id: `${entryData.type}-${Date.now()}`, createdAt: Date.now() };
        plant.journal.push(newEntry);
        
        if (entryData.type === 'WATERING') {
            if (entryData.details?.waterAmount) {
                 plant.vitals.substrateMoisture = Math.min(100, plant.vitals.substrateMoisture + (entryData.details.waterAmount / (plant.growSetup.potSize * SIMULATION_CONSTANTS.ML_PER_LITER)) * SIMULATION_CONSTANTS.WATER_REPLENISH_FACTOR);
            }
            if(entryData.details?.ph) plant.vitals.ph = entryData.details.ph;
        }
        if (entryData.type === 'FEEDING') {
            // Replenish nutrients on feeding. A simple model: feeding restores nutrients.
            plant.vitals.nutrients = 100;
            if(entryData.details?.ec) plant.vitals.ec = entryData.details.ec;
            if(entryData.details?.ph) plant.vitals.ph = entryData.details.ph;
        }
    }),

    completeTask: (plantId, taskId) => set(state => {
        const task = state.plants[plantId]?.tasks.find(t => t.id === taskId);
        if (task) {
            task.isCompleted = true;
            task.completedAt = Date.now();
        }
    }),

    waterAllPlants: () => {
        let wateredCount = 0;
        
        for (const plantId in get().plants) {
            const p = get().plants[plantId];
            if (p && p.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATER_ALL_THRESHOLD) {
                wateredCount++;
                const potSizeL = p.growSetup.potSize;
                const waterAmount = Math.max(500, potSizeL * 100);
                get().addJournalEntry(p.id, { type: 'WATERING', notes: t()('plantsView.actionModals.defaultNotes.watering'), details: { waterAmount, ph: 6.5 }});
            }
        }
        return wateredCount;
    },

    resetPlants: () => {
        set({ plants: {}, plantSlots: [null, null, null], archivedAdvisorResponses: {}, selectedPlantId: null });
    },
});
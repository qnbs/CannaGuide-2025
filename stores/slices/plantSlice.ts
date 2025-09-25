import { Plant, PlantStage, GrowSetup, Strain, JournalEntry, JournalEntryType, TrainingType, Task, PlantProblem } from '@/types';
// FIX: Import AppState to resolve type errors in produce() callbacks.
import { StoreSet, StoreGet, TFunction, AppState } from '../useAppStore';
import { produce } from 'immer';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';

const PLANT_SLOTS = 3;

const createInitialPlant = (strain: Strain, setup: GrowSetup, name: string): Plant => {
    // A simplified structural model to start with
    const initialStructuralModel = {
        id: `stem-${Date.now()}`,
        type: 'stem' as 'stem',
        height: 1,
        nodes: [],
    };
    const initialVitals = { ph: 6.5, ec: 0.3, substrateMoisture: 100 };
    return {
        id: `plant-${Date.now()}`,
        name: name,
        strain,
        age: 0, // days
        stage: PlantStage.Seed,
        health: 100,
        height: 1, // cm
        stressLevel: 0,
        vitals: initialVitals,
        environment: { temperature: setup.temperature, humidity: setup.humidity },
        problems: [],
        journal: [],
        history: [{ day: 0, stage: PlantStage.Seed, height: 1, stressLevel: 0, vitals: initialVitals }],
        growSetup: setup,
        tasks: [],
        structuralModel: initialStructuralModel
    };
};

export interface PlantSlice {
    plants: Record<string, Plant | undefined>;
    plantSlots: (string | null)[];
    startNewPlant: (strain: Strain, setup: GrowSetup, slotIndex: number) => boolean;
    advanceDay: (plantId?: string) => void;
    waterPlant: (plantId: string, amount: number, ph: number) => void;
    addJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
    completeTask: (plantId: string, taskId: string) => void;
    resetPlants: () => void;
    // New actions for training and pest control
    topPlant: (plantId: string) => void;
    applyLst: (plantId: string, shootId: string, angle: number) => void;
    applyPestControl: (plantId: string, method: string) => void;
}

export const createPlantSlice = (set: StoreSet, get: StoreGet, t: () => TFunction): PlantSlice => ({
    plants: {},
    plantSlots: Array(PLANT_SLOTS).fill(null),
    startNewPlant: (strain, setup, slotIndex) => {
        const { plantSlots, plants } = get();
        if (slotIndex < 0 || slotIndex >= plantSlots.length || plantSlots[slotIndex] !== null) {
            return false;
        }

        const plantNames = Object.values(plants).map(p => p?.name.toLowerCase());
        let newName = strain.name;
        let counter = 2;
        while (plantNames.includes(newName.toLowerCase())) {
            newName = `${strain.name} #${counter}`;
            counter++;
        }

        const newPlant = createInitialPlant(strain, setup, newName);
        set(produce((draft: PlantSlice) => {
            draft.plants[newPlant.id] = newPlant;
            draft.plantSlots[slotIndex] = newPlant.id;
        }));
        return true;
    },
    advanceDay: (plantId) => {
        // This is a simplified simulation logic. A real one would be much more complex.
        set(produce((draft: AppState) => {
            const plantIdsToAdvance = plantId ? [plantId] : Object.keys(draft.plants);
            
            plantIdsToAdvance.forEach(id => {
                const plant = draft.plants[id];
                if (!plant || plant.stage === PlantStage.Finished) return;
                
                plant.age += 1;
                
                // Stage progression
                const currentStageDetails = PLANT_STAGE_DETAILS[plant.stage];
                const stageStartDay = plant.history.find(h => h.stage === plant.stage)?.day ?? plant.age;
                
                let currentStageDuration = 0;
                for(const entry of plant.history) {
                    if (entry.stage === plant.stage) {
                        currentStageDuration++;
                    }
                }

                if (currentStageDuration >= currentStageDetails.duration) {
                    const stageOrder = Object.values(PlantStage);
                    const currentIndex = stageOrder.indexOf(plant.stage);
                    if (currentIndex < stageOrder.length - 1) {
                        plant.stage = stageOrder[currentIndex + 1];
                    }
                }
                
                // Vitals change
                plant.vitals.substrateMoisture = Math.max(0, plant.vitals.substrateMoisture - (currentStageDetails.dailyWaterRequirement / 2));
                
                // Growth
                plant.height += currentStageDetails.growthRate;
                
                // Add history
                plant.history.push({
                    day: plant.age,
                    stage: plant.stage,
                    height: plant.height,
                    stressLevel: plant.stressLevel,
                    vitals: { ...plant.vitals },
                });

                 // Simple task generation
                 if (plant.vitals.substrateMoisture < 40 && !plant.tasks.some(t => t.title.includes('watering') && !t.isCompleted)) {
                    plant.tasks.push({ id: `task-${Date.now()}`, title: 'plantsView.tasks.needsWatering', description: 'plantsView.tasks.needsWateringDesc', isCompleted: false, createdAt: Date.now(), priority: 'high', source: 'system' });
                }
            });
        }));
    },
    waterPlant: (plantId, amount, ph) => {
        set(produce((draft: AppState) => {
            const plant = draft.plants[plantId];
            if (!plant) return;
            // Simple logic: watering increases moisture.
            plant.vitals.substrateMoisture = Math.min(100, plant.vitals.substrateMoisture + (amount / (plant.growSetup.potSize * 10)));
            plant.vitals.ph = (plant.vitals.ph + ph) / 2; // Average out pH
        }));
    },
    addJournalEntry: (plantId, entry) => {
        set(produce((draft: AppState) => {
            const plant = draft.plants[plantId];
            if (plant) {
                const newEntry: JournalEntry = {
                    ...entry,
                    id: `journal-${Date.now()}`,
                    createdAt: Date.now(),
                };
                plant.journal.push(newEntry);
            }
        }));
    },
    completeTask: (plantId, taskId) => {
        set(produce((draft: AppState) => {
            const plant = draft.plants[plantId];
            if (plant) {
                const task = plant.tasks.find(t => t.id === taskId);
                if (task) {
                    task.isCompleted = true;
                    task.completedAt = Date.now();
                }
            }
        }));
    },
    resetPlants: () => {
        set({
            plants: {},
            plantSlots: Array(PLANT_SLOTS).fill(null),
        });
    },
    topPlant: (plantId) => {
        // Simplified logic
        get().addJournalEntry(plantId, { type: 'TRAINING', notes: 'Topped the main stem.' });
    },
    applyLst: (plantId, shootId, angle) => {
        // Simplified logic
         get().addJournalEntry(plantId, { type: 'TRAINING', notes: `Applied LST to main stem at a ${angle}° angle.` });
    },
    applyPestControl: (plantId, method) => {
        get().addJournalEntry(plantId, { type: 'PEST_CONTROL', notes: `Applied ${method} for pest control.` });
    },
}));
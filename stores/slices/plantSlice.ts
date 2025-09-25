import { Plant, GrowSetup, Strain, PlantStage, JournalEntry, PlantVitals, Task, PlantProblem, PlantHistoryEntry } from '@/types';
import { PLANT_STAGE_DETAILS, simulationService } from '@/services/plantSimulationService';
import type { StoreSet, StoreGet, TFunction } from '@/stores/useAppStore';
import { produce } from 'immer';

export interface PlantSlice {
    plants: Record<string, Plant>;
    plantSlots: (string | null)[];
    startNewPlant: (strain: Strain, setup: GrowSetup, slotIndex: number) => boolean;
    advanceDay: (plantId?: string) => void;
    addJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
    waterAllPlants: () => number;
    completeTask: (plantId: string, taskId: string) => void;
    resetPlants: () => void;
    _runSimulationForPlant: (plant: Plant) => Plant;
    topPlant: (plantId: string) => void;
    applyLST: (plantId: string, shootId: string, angle: number) => void;
}

const MAX_PLANTS = 3;
const initialPlantSlots = Array(MAX_PLANTS).fill(null);

// Utility to get a random number in a range
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export const createPlantSlice = (set: StoreSet, get: StoreGet, t: () => TFunction): PlantSlice => ({
    plants: {},
    plantSlots: initialPlantSlots,

    startNewPlant: (strain, setup, slotIndex) => {
        const { plantSlots } = get();
        if (slotIndex < 0 || slotIndex >= plantSlots.length || plantSlots[slotIndex] !== null) {
            get().addNotification(t()('plantsView.notifications.allSlotsFull'), 'error');
            return false;
        }

        const newPlantId = `plant-${Date.now()}`;
        const newPlant: Plant = {
            id: newPlantId,
            name: strain.name,
            strain,
            createdAt: Date.now(),
            age: 0,
            stage: PlantStage.Seed,
            height: 1,
            health: 100,
            stressLevel: 0,
            vitals: { ph: 6.5, ec: 0.2, substrateMoisture: 80 },
            environment: { temperature: setup.temperature, humidity: setup.humidity },
            problems: [],
            journal: [{
                id: `journal-${Date.now()}`,
                createdAt: Date.now(),
                type: 'SYSTEM',
                notes: t()('plantsView.journal.startGrowing', { name: strain.name }),
            }],
            tasks: [],
            history: [],
            growSetup: setup,
            internalClock: 0,
            hormoneLevels: { florigen: 0 },
            daysOn1212: 0,
            daysInFlowering: 0,
            structuralModel: {
                id: `shoot-${newPlantId}-main`,
                length: 1,
                nodes: [{
                    id: `node-${newPlantId}-0`,
                    position: 0,
                    lightExposure: 1,
                    isTopped: false,
                    shoots: []
                }],
                isMainStem: true,
                angle: 0
            },
        };

        set(state => {
            state.plants[newPlantId] = newPlant;
            state.plantSlots[slotIndex] = newPlantId;
        });
        return true;
    },

    addJournalEntry: (plantId, entry) => {
        set(state => {
            const plant = state.plants[plantId];
            if (plant) {
                const newEntry: JournalEntry = {
                    ...entry,
                    id: `journal-${plantId}-${Date.now()}`,
                    createdAt: Date.now(),
                };
                plant.journal.push(newEntry);
            }
        });
    },

    waterAllPlants: () => {
        let wateredCount = 0;
        const plantIds = Object.keys(get().plants);
        plantIds.forEach(id => {
            const plant = get().plants[id];
            if (plant.vitals.substrateMoisture < 40) {
                set(produce(draft => {
                    draft.plants[id].vitals.substrateMoisture = 100;
                }));
                get().addJournalEntry(id, {
                    type: 'WATERING',
                    notes: t()('plantsView.actionModals.defaultNotes.watering'),
                    details: { waterAmount: 'N/A' }
                });
                wateredCount++;
            }
        });
        return wateredCount;
    },

    completeTask: (plantId, taskId) => {
        set(state => {
            const plant = state.plants[plantId];
            if (plant) {
                const task = plant.tasks.find(t => t.id === taskId);
                if (task) {
                    task.isCompleted = true;
                    task.completedAt = Date.now();
                }
            }
        });
    },
    
    resetPlants: () => {
        set({ plants: {}, plantSlots: initialPlantSlots });
    },

    advanceDay: (plantId) => {
        const plantIdsToSimulate = plantId ? [plantId] : Object.keys(get().plants);

        plantIdsToSimulate.forEach(id => {
             const plant = get().plants[id];
             if (plant && plant.stage !== PlantStage.Finished) {
                const updatedPlant = get()._runSimulationForPlant(plant);
                set(state => {
                    state.plants[id] = updatedPlant;
                });
             }
        });
    },
    
    _runSimulationForPlant: (plant) => {
        return produce(plant, draft => {
            draft.age += 1;
            
            // Basic vitals drift
            draft.vitals.ph += rand(-0.1, 0.1);
            draft.vitals.ph = Math.max(4.0, Math.min(9.0, draft.vitals.ph));
            draft.vitals.substrateMoisture = Math.max(0, draft.vitals.substrateMoisture - rand(15, 30));

            const stageOrder = [PlantStage.Seed, PlantStage.Germination, PlantStage.Seedling, PlantStage.Vegetative, PlantStage.Flowering, PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing];
            const currentStageIndex = stageOrder.indexOf(draft.stage);

            // Hormone & Flowering Logic
            if (currentStageIndex < stageOrder.indexOf(PlantStage.Flowering)) {
                if (currentStageIndex >= stageOrder.indexOf(PlantStage.Seedling)) {
                    draft.internalClock += 1;
                }

                const isAutoflower = draft.strain.geneticsDetails?.isAutoflower ?? false;
                const AUTOFLOWER_FLOWERING_AGE = 21; // days from seed
                const PHOTOPERIOD_FLIP_DAYS = 3; // days on 12/12

                if (isAutoflower) {
                    if (draft.internalClock > AUTOFLOWER_FLOWERING_AGE) {
                        draft.hormoneLevels.florigen += 10;
                    }
                } else { // Photoperiod
                    if (draft.growSetup.lightHours <= 12) {
                        draft.daysOn1212 += 1;
                    } else {
                        draft.daysOn1212 = 0; // Reset if light schedule changes back
                    }
                    
                    if (draft.daysOn1212 >= PHOTOPERIOD_FLIP_DAYS) {
                        draft.hormoneLevels.florigen += 10;
                    }
                }

                if (draft.hormoneLevels.florigen >= 100 && draft.stage === PlantStage.Vegetative) {
                    draft.stage = PlantStage.Flowering;
                    draft.daysInFlowering = 1;
                    get().addNotification(t()('plantsView.notifications.stageChange', { stage: t()(`plantStages.${PlantStage.Flowering}`) }), 'info');
                    if (get().settings.simulationSettings.autoJournaling.stageChanges) {
                        get().addJournalEntry(draft.id, {
                            type: 'SYSTEM',
                            notes: `Stage changed to ${t()(`plantStages.${PlantStage.Flowering}`)}. The stretch begins.`
                        });
                    }
                }
            } else if (draft.stage === PlantStage.Flowering) {
                draft.daysInFlowering += 1;
            }

            // Age-based stage progression (for non-flowering transitions)
            let cumulativeDuration = 0;
            for (let i = 0; i <= currentStageIndex; i++) {
                cumulativeDuration += PLANT_STAGE_DETAILS[stageOrder[i]].duration;
            }

            const nextStageIndex = currentStageIndex + 1;
            if (draft.age >= cumulativeDuration && nextStageIndex < stageOrder.length) {
                const newStage = stageOrder[nextStageIndex];
                if (newStage !== PlantStage.Flowering) {
                     draft.stage = newStage;
                     get().addNotification(t()('plantsView.notifications.stageChange', { stage: t()(`plantStages.${newStage}`) }), 'info');
                     if (get().settings.simulationSettings.autoJournaling.stageChanges) {
                         get().addJournalEntry(draft.id, {
                             type: 'SYSTEM',
                             notes: `Stage changed to ${t()(`plantStages.${newStage}`)}.`
                         });
                     }
                }
            }
            
            // Structural growth
            const grownPlant = simulationService.calculateGrowth(draft);
            draft.structuralModel = grownPlant.structuralModel;
            draft.height = grownPlant.height;
        });
    },

    topPlant: (plantId) => {
        set(state => {
            const plant = state.plants[plantId];
            if (plant) {
                const updatedPlant = simulationService.topPlant(plant);
                state.plants[plantId] = updatedPlant;
            }
        });
    },

    applyLST: (plantId, shootId, angle) => {
        set(state => {
            const plant = state.plants[plantId];
            if (plant) {
                const updatedPlant = simulationService.applyLST(plant, shootId, angle);
                state.plants[plantId] = updatedPlant;
            }
        });
    },
});
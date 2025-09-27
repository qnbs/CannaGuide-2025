import {
    Plant,
    Strain,
    GrowSetup,
    JournalEntry,
    Task,
    PlantStage
} from '../../types';
import {
    StoreSet,
    StoreGet
} from '../useAppStore';
import {
    simulationService
} from '../../services/plantSimulationService';
import {
    i18nInstance
} from '../../i18n';

export interface PlantSlice {
    plants: Record < string, Plant > ;
    plantSlots: (string | null) [];
    selectedPlantId: string | null;
    allStrains: Strain[]; // To avoid passing it down as prop

    startNewPlant: (strain: Strain, setup: GrowSetup, slot: number) => boolean;
    deletePlant: (plantId: string) => void;
    waterPlant: (plantId: string, amount: number, ph: number, ec: number) => void;
    waterAllPlants: () => void;
    addJournalEntry: (plantId: string, entry: Omit < JournalEntry, 'id' | 'createdAt' > ) => void;
    completeTask: (plantId: string, taskId: string) => void;
    setSelectedPlantId: (plantId: string | null) => void;
    advanceDay: () => void;
    advanceMultipleDays: (days: number) => void;
    resetPlants: () => void;

    // Direct plant manipulations
    topPlant: (plantId: string) => void;
    applyLst: (plantId: string) => void;
    applyPestControl: (plantId: string, notes: string) => void;
    addAmendment: (plantId: string, type: string, notes: string) => void;
    toggleLight: (plantId: string) => void;
    toggleFan: (plantId: string) => void;
    setFanSpeed: (plantId: string, speed: number) => void;
    harvestPlant: (plantId: string) => void;
    processPostHarvest: (plantId: string, action: 'dry' | 'burp' | 'cure', settings ? : { temp: number, humidity: number }) => void;
}

export const createPlantSlice = (set: StoreSet, get: StoreGet): PlantSlice => ({
    plants: {},
    plantSlots: [null, null, null],
    selectedPlantId: null,
    allStrains: [],

    startNewPlant: (strain, setup, slot) => {
        const {
            plantSlots
        } = get();
        if (plantSlots[slot] === null) {
            const name = `${strain.name} #${Object.keys(get().plants).length + 1}`;
            const newPlant = simulationService.createNewPlant(strain, setup, name);
            set(state => {
                state.plants[newPlant.id] = newPlant;
                state.plantSlots[slot] = newPlant.id;
            });
            return true;
        }
        return false;
    },
    deletePlant: (plantId) => {
        set(state => {
            delete state.plants[plantId];
            const slotIndex = state.plantSlots.indexOf(plantId);
            if (slotIndex > -1) {
                state.plantSlots[slotIndex] = null;
            }
        });
    },
    waterPlant: (plantId, amount, ph, ec) => {
        set(state => {
            const plant = state.plants[plantId];
            if (plant) {
                const {
                    updatedPlant
                } = simulationService.waterPlant(plant, amount, ph, ec);
                state.plants[plantId] = updatedPlant;
            }
        });
    },
    waterAllPlants: () => {
        set(state => {
            Object.values(state.plants).forEach(plant => {
                if (plant && plant.stage !== PlantStage.Finished) {
                    const {
                        updatedPlant
                    } = simulationService.waterPlant(plant, 500, 6.5, 0); // Default watering
                    state.plants[plant.id] = updatedPlant;
                }
            });
        });
    },
    addJournalEntry: (plantId, entry) => {
        set(state => {
            const plant = state.plants[plantId];
            if (plant) {
                plant.journal.push({
                    ...entry,
                    id: `journal-${Date.now()}`,
                    createdAt: Date.now()
                });
            }
        });
    },
    completeTask: (plantId, taskId) => {
        set(state => {
            const plant = state.plants[plantId];
            const task = plant?.tasks.find(t => t.id === taskId);
            if (task) {
                task.isCompleted = true;
                task.completedAt = Date.now();
            }
        });
    },
    setSelectedPlantId: (plantId) => set(state => {
        state.selectedPlantId = plantId;
    }),
    advanceDay: () => {
        set(state => {
            for (const plantId in state.plants) {
                const plant = state.plants[plantId];
                if (plant.stage !== PlantStage.Finished) {
                    const {
                        updatedPlant,
                        newJournalEntries
                    } = simulationService.runDailyCycle(plant);
                    state.plants[plantId] = updatedPlant;
                    newJournalEntries.forEach(entry => get().addJournalEntry(plantId, entry));
                }
            }
        });
    },
    advanceMultipleDays: (days) => {
        for (let i = 0; i < days; i++) {
            get().advanceDay();
        }
    },
    resetPlants: () => {
        set(state => {
            state.plants = {};
            state.plantSlots = [null, null, null];
        });
    },
    topPlant: (plantId) => set(state => {
        const plant = state.plants[plantId];
        if (plant) state.plants[plantId] = simulationService.topPlant(plant).updatedPlant;
    }),
    applyLst: (plantId) => set(state => {
        const plant = state.plants[plantId];
        if (plant) state.plants[plantId] = simulationService.applyLst(plant).updatedPlant;
    }),
    applyPestControl: (plantId, notes) => set(state => {
        const plant = state.plants[plantId];
        if (plant) {
            plant.health = Math.min(100, plant.health + 15);
            plant.stressLevel = Math.max(0, plant.stressLevel - 20);
        }
    }),
    addAmendment: (plantId, type, notes) => set(state => {
        const plant = state.plants[plantId];
        if (plant) state.plants[plantId] = simulationService.addAmendment(plant, type).updatedPlant;
    }),
    toggleLight: (plantId) => set(state => {
        const plant = state.plants[plantId];
        if (plant) plant.equipment.light.isOn = !plant.equipment.light.isOn;
    }),
    toggleFan: (plantId) => set(state => {
        const plant = state.plants[plantId];
        if (plant) plant.equipment.fan.isOn = !plant.equipment.fan.isOn;
    }),
    setFanSpeed: (plantId, speed) => set(state => {
        const plant = state.plants[plantId];
        if (plant) plant.equipment.fan.speed = speed;
    }),
    harvestPlant: (plantId) => {
        set(state => {
            const plant = state.plants[plantId];
            if (plant) {
                const harvestedPlant = simulationService.harvestPlant(plant);
                state.plants[plantId] = harvestedPlant;
                if (harvestedPlant.postHarvest && harvestedPlant.postHarvest.finalQuality > 90) {
                    get().addSeed(harvestedPlant);
                    get().addNotification(i18nInstance.t('plantsView.notifications.seedCollected', {
                        name: harvestedPlant.name
                    }), 'success');
                }
            }
        });
    },
    processPostHarvest: (plantId, action, settings) => {
        set(state => {
            const plant = state.plants[plantId];
            if (plant && plant.postHarvest) {
                state.plants[plantId] = simulationService.runPostHarvestCycle(plant, action, settings);
            }
        });
    },
});

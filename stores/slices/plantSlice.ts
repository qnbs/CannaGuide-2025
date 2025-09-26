import { Plant, Strain, GrowSetup, JournalEntry, TrainingType, PlantStage } from '@/types';
import type { StoreSet, StoreGet, TFunction } from '@/stores/useAppStore';
import { simulationService } from '@/services/plantSimulationService';

export interface PlantSlice {
    plants: Record<string, Plant | undefined>;
    plantSlots: (string | null)[];
    selectedPlantId: string | null;
    setSelectedPlantId: (plantId: string | null) => void;
    startNewPlant: (strain: Strain, setup: GrowSetup, slotIndex: number) => boolean;
    waterPlant: (plantId: string, amount: number, ph: number) => void;
    waterAllPlants: () => void;
    advanceDay: () => void;
    advanceMultipleDays: (days: number) => void;
    addJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
    completeTask: (plantId: string, taskId: string) => void;
    topPlant: (plantId: string) => void;
    applyLst: (plantId: string) => void;
    applyPestControl: (plantId: string, notes: string) => void;
    resetPlants: () => void;
    toggleLight: (plantId: string) => void;
    toggleFan: (plantId: string) => void;
    setFanSpeed: (plantId: string, speed: number) => void;
}

const createNewPlant = (strain: Strain, setup: GrowSetup): Plant => {
    const id = `plant-${Date.now()}`;
    return {
        id,
        createdAt: Date.now(),
        name: `${strain.name} #${Math.floor(Math.random() * 100)}`,
        strain,
        stage: PlantStage.Seed,
        age: 0,
        height: 0,
        health: 100,
        stressLevel: 0,
        biomass: 1,
        vitals: {}, // Simplified
        environment: {
            internalTemperature: setup.temperature,
            internalHumidity: setup.humidity,
            externalTemperature: 20,
            externalHumidity: 50,
        },
        substrate: {
            ph: 6.5,
            ec: 0.8,
            moisture: 100,
        },
        equipment: {
            light: { type: setup.lightType as any, wattage: setup.wattage, isOn: true },
            potSize: setup.potSize,
            medium: setup.medium as any,
            fan: { isOn: true, speed: 50 },
        },
        journal: [],
        tasks: [],
        problems: [],
        history: [],
    };
};

export const createPlantSlice = (set: StoreSet, get: StoreGet, t: () => TFunction): PlantSlice => ({
    plants: {},
    plantSlots: Array(3).fill(null),
    selectedPlantId: null,
    setSelectedPlantId: (plantId) => set({ selectedPlantId: plantId }),
    startNewPlant: (strain, setup, slotIndex) => {
        const { plantSlots } = get();
        if (slotIndex < 0 || slotIndex >= plantSlots.length || plantSlots[slotIndex] !== null) {
            return false;
        }
        const newPlant = createNewPlant(strain, setup);
        set(state => {
            state.plants[newPlant.id] = newPlant;
            state.plantSlots[slotIndex] = newPlant.id;
        });
        return true;
    },
    waterPlant: (plantId, amount, ph) => {
        set(state => {
            const plant = state.plants[plantId];
            if (plant) {
                plant.substrate.moisture = 100; // Simplified
                plant.substrate.ph = (plant.substrate.ph + ph) / 2;
                state.addJournalEntry(plantId, { type: 'WATERING', notes: `Watered with ${amount}ml.`, details: { amount, ph } });
            }
        });
    },
    waterAllPlants: () => {
        const activePlants = Object.values(get().plants).filter((p): p is Plant => !!p).filter(p => p.stage !== 'FINISHED');
        let wateredCount = 0;
        activePlants.forEach(plant => {
            if (plant.substrate.moisture < 50) {
                get().waterPlant(plant.id, 500, 6.5);
                wateredCount++;
            }
        });
        get().addNotification(
            wateredCount > 0
                ? t()('plantsView.notifications.waterAllSuccess', { count: wateredCount })
                : t()('plantsView.notifications.waterAllNone'),
            'info'
        );
    },
    advanceDay: () => {
        set(state => {
            Object.keys(state.plants).forEach(plantId => {
                const plant = state.plants[plantId];
                if (plant && plant.stage !== 'FINISHED') {
                    state.plants[plantId] = simulationService.runDailyCycle(plant);
                }
            });
        });
    },
    advanceMultipleDays: (days) => {
        if (days <= 0) return;
        set(state => {
            for (let i = 0; i < days; i++) {
                Object.keys(state.plants).forEach(plantId => {
                    const plant = state.plants[plantId];
                    if (plant && plant.stage !== 'FINISHED') {
                         state.plants[plantId] = simulationService.runDailyCycle(plant);
                    }
                });
            }
        });
    },
    addJournalEntry: (plantId, entry) => {
        set(state => {
            const plant = state.plants[plantId];
            if (plant) {
                const newEntry: JournalEntry = { ...entry, id: `journal-${plantId}-${Date.now()}`, createdAt: Date.now() };
                plant.journal.push(newEntry);
            }
        });
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
    topPlant: (plantId) => {
        set(state => {
            const plant = state.plants[plantId];
            if(plant) {
                state.plants[plantId] = simulationService.topPlant(plant);
            }
        });
    },
    applyLst: (plantId) => {
        set(state => {
            const plant = state.plants[plantId];
            if(plant) {
                state.plants[plantId] = simulationService.applyLst(plant);
            }
        });
    },
    applyPestControl: (plantId, notes) => {
        set(state => {
            const plant = state.plants[plantId];
            if(plant) {
                plant.health = Math.min(100, plant.health + 10);
                plant.stressLevel = Math.max(0, plant.stressLevel - 5);
                state.addJournalEntry(plantId, {type: 'PEST_CONTROL', notes});
            }
        });
    },
    resetPlants: () => {
        set({ plants: {}, plantSlots: Array(3).fill(null), selectedPlantId: null });
    },
    toggleLight: (plantId) => set(state => {
        const plant = state.plants[plantId];
        if (plant) {
            plant.equipment.light.isOn = !plant.equipment.light.isOn;
        }
    }),
    toggleFan: (plantId) => set(state => {
        const plant = state.plants[plantId];
        if (plant) {
            plant.equipment.fan.isOn = !plant.equipment.fan.isOn;
        }
    }),
    setFanSpeed: (plantId, speed) => set(state => {
        const plant = state.plants[plantId];
        if (plant) {
            plant.equipment.fan.speed = Math.max(0, Math.min(100, speed));
        }
    }),
});
import { Plant, PlantStage, GrowSetup, Strain, JournalEntry, TrainingType, Task, PlantProblem, PlantSubstrate } from '@/types';
import { StoreSet, StoreGet, TFunction, AppState } from '../useAppStore';
import { simulationService } from '@/services/plantSimulationService';

const PLANT_SLOTS = 3;

const createInitialPlant = (strain: Strain, setup: GrowSetup, name: string): Plant => {
    const initialSubstrate: PlantSubstrate = {
        type: setup.medium,
        volumeLiters: setup.potSize,
        ph: 6.5,
        ec: 0.3,
        moisture: 100,
        microbeHealth: 100,
        runoff: { ph: 6.5, ec: 0.3 },
    };
    
    const getRandomModifier = (min: number, max: number) => Math.random() * (max - min) + min;

    return {
        id: `plant-${Date.now()}`,
        name,
        strain,
        age: 0,
        stage: PlantStage.Seed,
        health: 100,
        height: 1,
        biomass: 1,
        stressLevel: 0,
        vitals: {
            transpirationRate: 0.1,
            photosynthesisRate: 0.1,
        },
        substrate: initialSubstrate,
        environment: {
            ambientTemperature: setup.temperature - 2,
            ambientHumidity: setup.humidity + 5,
            co2Level: 410,
            airExchangeRate: 150,
            internalTemperature: setup.temperature,
            internalHumidity: setup.humidity,
        },
        equipment: {
            light: { type: setup.lightType, wattage: setup.wattage, isOn: true },
            exhaustFan: { cfm: 100, speed: 1, isOn: true },
        },
        waterSource: {
            type: 'TapWater',
            basePh: 7.0,
            baseEc: 0.4
        },
        internalClock: 0,
        hormoneLevels: { florigen: 0 },
        geneticModifiers: {
            growthSpeedFactor: getRandomModifier(0.9, 1.1),
            nutrientDemandFactor: getRandomModifier(0.9, 1.1),
            pestResistanceFactor: getRandomModifier(0.9, 1.1),
            stressToleranceFactor: getRandomModifier(0.9, 1.1),
        },
        currentChemicals: { thc: 0, cbd: 0, terpenes: {} },
        rootSystem: { rootMass: 0.1, rootHealth: 100 },
        problems: [],
        journal: [],
        history: [{
            day: 0,
            stage: PlantStage.Seed,
            height: 1,
            stressLevel: 0,
            substrate: { ph: initialSubstrate.ph, ec: initialSubstrate.ec, moisture: initialSubstrate.moisture },
        }],
        tasks: [],
        structuralModel: {
            id: `stem-${Date.now()}`,
            length: 1,
            nodes: [],
            isMainStem: true,
            angle: 0
        },
    };
};

export interface PlantSlice {
    plants: Record<string, Plant | undefined>;
    plantSlots: (string | null)[];
    startNewPlant: (strain: Strain, setup: GrowSetup, slotIndex: number) => boolean;
    advanceDay: (plantId?: string) => void;
    waterPlant: (plantId: string, amount: number, ph: number) => void;
    waterAllPlants: () => number;
    addJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
    completeTask: (plantId: string, taskId: string) => void;
    resetPlants: () => void;
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
        set((draft: AppState) => {
            draft.plants[newPlant.id] = newPlant;
            draft.plantSlots[slotIndex] = newPlant.id;
        });
        return true;
    },
    advanceDay: (plantId) => {
        set((draft: AppState) => {
            const plantIdsToAdvance = plantId ? [plantId] : Object.keys(draft.plants);
            
            plantIdsToAdvance.forEach(id => {
                const currentPlant = draft.plants[id];
                if (!currentPlant || currentPlant.stage === PlantStage.Finished) return;
                
                const updatedPlant = simulationService.runDailyCycle(currentPlant);
                draft.plants[id] = updatedPlant;
            });
        });
    },
    waterPlant: (plantId, amount, ph) => {
        set((draft: AppState) => {
            const plant = draft.plants[plantId];
            if (!plant) return;
            plant.substrate.moisture = Math.min(100, plant.substrate.moisture + (amount / (plant.substrate.volumeLiters * 10)));
            plant.substrate.ph = (plant.substrate.ph + ph) / 2;
        });
    },
    waterAllPlants: () => {
        let wateredCount = 0;
        const state = get();
        const activePlants = Object.values(state.plants).filter(p => p && p.stage !== PlantStage.Finished);

        activePlants.forEach(plant => {
            if (plant && plant.substrate.moisture < 60) {
                 get().waterPlant(plant.id, 500, 6.5); 
                 get().addJournalEntry(plant.id, {
                    type: 'WATERING',
                    notes: t()('plantsView.actionModals.defaultNotes.watering'),
                    details: { waterAmount: 500, ph: 6.5 }
                });
                wateredCount++;
            }
        });
        return wateredCount;
    },
    addJournalEntry: (plantId, entry) => {
        set((draft: AppState) => {
            const plant = draft.plants[plantId];
            if (plant) {
                const newEntry: JournalEntry = {
                    ...entry,
                    id: `journal-${Date.now()}`,
                    createdAt: Date.now(),
                };
                plant.journal.push(newEntry);
            }
        });
    },
    completeTask: (plantId, taskId) => {
        set((draft: AppState) => {
            const plant = draft.plants[plantId];
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
        set({
            plants: {},
            plantSlots: Array(PLANT_SLOTS).fill(null),
        });
    },
    topPlant: (plantId) => {
        set((draft: AppState) => {
            const plant = draft.plants[plantId];
            if(plant) {
                draft.plants[plantId] = simulationService.topPlant(plant);
            }
        });
        get().addJournalEntry(plantId, { type: 'TRAINING', notes: 'Topped the main stem.' });
    },
    applyLst: (plantId, shootId, angle) => {
        set((draft: AppState) => {
             const plant = draft.plants[plantId];
            if (plant) {
                const shoot = plant.structuralModel; // Simplified for now
                if(shoot) shoot.angle = angle;
            }
        });
         get().addJournalEntry(plantId, { type: 'TRAINING', notes: `Applied LST to main stem at a ${angle}° angle.` });
    },
    applyPestControl: (plantId, method) => {
        get().addJournalEntry(plantId, { type: 'PEST_CONTROL', notes: `Applied ${method} for pest control.` });
    },
}));

import { Plant, PlantStage, GrowSetup, Strain, ProblemType, TaskPriority, JournalEntryType, HarvestData } from '@/types';

// Constants for simulation
export const PLANT_STAGE_DETAILS: Record<PlantStage, { duration: number; idealVitals: any }> = {
    [PlantStage.Seed]: { duration: 2, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.6 } } },
    [PlantStage.Germination]: { duration: 5, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.6 } } },
    [PlantStage.Seedling]: { duration: 14, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.5, max: 1.0 } } },
    [PlantStage.Vegetative]: { duration: 28, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 1.0, max: 1.8 } } },
    [PlantStage.Flowering]: { duration: 56, idealVitals: { ph: { min: 6.0, max: 6.8 }, ec: { min: 1.2, max: 2.2 } } },
    [PlantStage.Harvest]: { duration: 1, idealVitals: {} },
    [PlantStage.Drying]: { duration: 10, idealVitals: {} },
    [PlantStage.Curing]: { duration: 21, idealVitals: {} },
    [PlantStage.Finished]: { duration: Infinity, idealVitals: {} },
};

class SimulationService {
    createPlant(strain: Strain, setup: GrowSetup, light: { type: string, wattage: number }, name: string): Plant {
        const now = Date.now();
        return {
            id: `plant-${now}`,
            name,
            strain,
            createdAt: now,
            lastUpdated: now,
            age: 0,
            stage: PlantStage.Seed,
            height: 0,
            biomass: 0.1,
            health: 100,
            stressLevel: 0,
            nutrientPool: 100,
            problems: [],
            tasks: [],
            journal: [{
                id: `journal-${now}`,
                createdAt: now,
                type: JournalEntryType.System,
                notes: `Grow started for ${name} (${strain.name}).`
            }],
            history: [],
            isTopped: false,
            lstApplied: 0,
            environment: {
                internalTemperature: 24,
                internalHumidity: 70,
                vpd: 0.8,
                co2Level: 400,
            },
            medium: {
                ph: 6.5,
                ec: 0.4,
                moisture: 100,
                microbeHealth: 100,
            },
            rootSystem: {
                health: 100,
                microbeActivity: 100,
                rootMass: 0.1,
            },
            structuralModel: {
                branches: 1,
                nodes: 0,
                leafCount: 0,
            },
            equipment: {
                light: { wattage: light.wattage, isOn: true, lightHours: setup.lightHours },
                fan: { isOn: true, speed: 50 },
            }
        };
    }

    clonePlant(plant: Plant): Plant {
        // Simple deep clone for simulation purposes
        return JSON.parse(JSON.stringify(plant));
    }

    topPlant(plant: Plant): { updatedPlant: Plant } {
        const newPlant = this.clonePlant(plant);
        newPlant.isTopped = true;
        newPlant.structuralModel.branches *= 2;
        newPlant.stressLevel = Math.min(100, newPlant.stressLevel + 15); // Topping is stressful
        return { updatedPlant: newPlant };
    }

    applyLst(plant: Plant): { updatedPlant: Plant } {
        const newPlant = this.clonePlant(plant);
        newPlant.lstApplied += 1;
        newPlant.stressLevel = Math.min(100, newPlant.stressLevel + 5); // LST is less stressful
        return { updatedPlant: newPlant };
    }
    
    calculateStateForTimeDelta(plant: Plant, deltaTime: number): { updatedPlant: Plant, newJournalEntries: any[], newTasks: any[] } {
        // This is a simplified placeholder. A real implementation would have complex logic.
        const updatedPlant = this.clonePlant(plant);
        const hoursPassed = deltaTime / (1000 * 60 * 60);

        // Age and Stage
        const daysPassed = hoursPassed / 24;
        updatedPlant.age += daysPassed;
        
        const stageDetails = PLANT_STAGE_DETAILS[plant.stage];
        if (plant.age > stageDetails.duration) {
            const stages = Object.values(PlantStage);
            const currentIndex = stages.indexOf(plant.stage);
            if (currentIndex < stages.length - 1) {
                updatedPlant.stage = stages[currentIndex + 1];
            }
        }

        // Basic growth
        updatedPlant.height += 0.1 * daysPassed;
        updatedPlant.biomass += 0.2 * daysPassed;

        // Vitals drift
        updatedPlant.medium.moisture = Math.max(0, plant.medium.moisture - (2 * hoursPassed));
        updatedPlant.medium.ph += (Math.random() - 0.5) * 0.1 * hoursPassed;

        // Health & Stress
        if (updatedPlant.medium.moisture < 20) {
            updatedPlant.stressLevel = Math.min(100, plant.stressLevel + (1 * hoursPassed));
        } else {
            updatedPlant.stressLevel = Math.max(0, plant.stressLevel - (0.5 * hoursPassed));
        }
        if(updatedPlant.stressLevel > 50) {
            updatedPlant.health = Math.max(0, plant.health - (0.5 * hoursPassed));
        } else {
            updatedPlant.health = Math.min(100, plant.health + (0.2 * hoursPassed));
        }
        
        // This timestamp is now correctly handled in the thunk that calls this service.
        // updatedPlant.lastUpdated = Date.now();

        return { updatedPlant, newJournalEntries: [], newTasks: [] };
    }
}

export const simulationService = new SimulationService();

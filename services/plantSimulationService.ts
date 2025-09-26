import { Plant, PlantStage, PlantHistoryEntry, Task, PlantProblem } from '@/types';

// Central configuration for each plant stage
export const PLANT_STAGE_DETAILS: Record<PlantStage, { duration: number, idealVitals: { ph: { min: number, max: number }, ec: { min: number, max: number } } }> = {
    [PlantStage.Seed]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.4 } } },
    [PlantStage.Germination]: { duration: 5, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.4 } } },
    [PlantStage.Seedling]: { duration: 14, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.4, max: 0.8 } } },
    [PlantStage.Vegetative]: { duration: 30, idealVitals: { ph: { min: 5.8, max: 6.2 }, ec: { min: 0.8, max: 1.6 } } },
    [PlantStage.Flowering]: { duration: 60, idealVitals: { ph: { min: 6.0, max: 6.5 }, ec: { min: 1.2, max: 2.2 } } },
    [PlantStage.Harvest]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.0, max: 0.4 } } },
    [PlantStage.Drying]: { duration: 10, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } } },
    [PlantStage.Curing]: { duration: 21, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } } },
    [PlantStage.Finished]: { duration: Infinity, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } } },
};


class PlantSimulationService {
    
    runDailyCycle(plant: Plant): Plant {
        const newPlant = { ...plant, age: plant.age + 1 };

        // Stage transition logic
        const currentStageInfo = PLANT_STAGE_DETAILS[newPlant.stage];
        const stageAge = newPlant.history.filter(h => h.stage === newPlant.stage).length;
        if (stageAge >= currentStageInfo.duration) {
            const stageOrder = Object.values(PlantStage);
            const currentIndex = stageOrder.indexOf(newPlant.stage);
            if (currentIndex < stageOrder.length - 1) {
                newPlant.stage = stageOrder[currentIndex + 1];
            }
        }
        
        // Basic growth simulation
        newPlant.height += (newPlant.health / 100) * (Math.random() * 1.5 + 0.5);
        newPlant.substrate.moisture = Math.max(0, newPlant.substrate.moisture - (10 + Math.random() * 5));
        
        // Add history entry
        newPlant.history.push({
            day: newPlant.age,
            stage: newPlant.stage,
            height: newPlant.height,
            stressLevel: newPlant.stressLevel,
            substrate: {
                ph: newPlant.substrate.ph,
                ec: newPlant.substrate.ec,
                moisture: newPlant.substrate.moisture,
            },
        });
        
        return newPlant;
    }

    topPlant(plant: Plant): Plant {
        const newPlant = { ...plant };
        // Simplified: topping reduces height slightly and adds a bit of stress
        newPlant.height *= 0.95;
        newPlant.stressLevel = Math.min(100, plant.stressLevel + 15);
        newPlant.biomass *= 0.98;
        return newPlant;
    }
    
    applyLst(plant: Plant): Plant {
        const newPlant = { ...plant };
        newPlant.stressLevel = Math.min(100, plant.stressLevel + 5);
        // LST would affect the structural model, for now, we just simulate a small stress
        return newPlant;
    }

    clonePlant(plant: Plant): Plant {
        return JSON.parse(JSON.stringify(plant));
    }
}

export const simulationService = new PlantSimulationService();
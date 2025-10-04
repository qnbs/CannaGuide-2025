import { Plant, PlantStage, GrowSetup, Strain, ProblemType, TaskPriority, JournalEntryType, HarvestData, Task, JournalEntry } from '@/types';
import { PLANT_STAGE_DETAILS as STAGE_DETAILS_BASE } from '@/constants';

export const PLANT_STAGE_DETAILS = STAGE_DETAILS_BASE;

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
            history: [{ day: 0, height: 0, health: 100, stressLevel: 0, medium: { ph: 6.5, ec: 0.4, moisture: 100 }}],
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
    
    calculateStateForTimeDelta(plant: Plant, deltaTime: number): { updatedPlant: Plant, newJournalEntries: JournalEntry[], newTasks: Task[] } {
        let updatedPlant = this.clonePlant(plant);
        const newJournalEntries: JournalEntry[] = [];
        const newTasks: Task[] = [];
        
        const hoursPassedTotal = deltaTime / (1000 * 60 * 60);
        let hoursProcessed = 0;
        let lastDayLogged = Math.floor(plant.age);

        while (hoursProcessed < hoursPassedTotal) {
            const currentHour = hoursProcessed;
            hoursProcessed++;

            // --- Vitals Drift ---
            updatedPlant.medium.moisture = Math.max(0, updatedPlant.medium.moisture - 0.5); // Depletes over 8 days
            updatedPlant.nutrientPool = Math.max(0, updatedPlant.nutrientPool - 0.2); // Depletes over ~20 days
            updatedPlant.medium.ph += (Math.random() - 0.5) * 0.02;

            // --- Stress & Health ---
            let hourlyStress = 0;
            if (updatedPlant.medium.moisture < 20) hourlyStress += 0.5;
            if (updatedPlant.nutrientPool < 20) hourlyStress += 0.3;

            updatedPlant.stressLevel = Math.max(0, Math.min(100, updatedPlant.stressLevel + hourlyStress - 0.2));

            if (updatedPlant.stressLevel > 50) {
                updatedPlant.health = Math.max(0, updatedPlant.health - (0.1 * (updatedPlant.stressLevel / 100)));
            } else {
                updatedPlant.health = Math.min(100, updatedPlant.health + 0.05);
            }

            // --- Age, Stage, Growth ---
            if (currentHour % 24 === 0 && currentHour > 0) {
                updatedPlant.age++;

                const stageDetails = PLANT_STAGE_DETAILS[updatedPlant.stage];
                if (updatedPlant.age > stageDetails.duration) {
                    const stages = Object.values(PlantStage);
                    const currentIndex = stages.indexOf(updatedPlant.stage);
                    if (currentIndex < stages.length - 1) {
                        const newStage = stages[currentIndex + 1];
                        updatedPlant.stage = newStage;
                        newJournalEntries.push({ id: `j-${Date.now()}-${newStage}`, createdAt: Date.now(), type: JournalEntryType.System, notes: `Plant entered ${newStage} stage.` });
                    }
                }

                // Growth is proportional to health
                const growthFactor = updatedPlant.health / 100;
                updatedPlant.height += (0.5 + Math.random() * 0.5) * growthFactor;
                updatedPlant.biomass += (0.2 + Math.random() * 0.2) * growthFactor;
                
                // Log history once per simulated day
                if (Math.floor(updatedPlant.age) > lastDayLogged) {
                    lastDayLogged = Math.floor(updatedPlant.age);
                    updatedPlant.history.push({
                        day: lastDayLogged,
                        height: updatedPlant.height,
                        health: updatedPlant.health,
                        stressLevel: updatedPlant.stressLevel,
                        medium: { ...updatedPlant.medium }
                    });
                }
            }
        }
        
        // --- Task & Problem Generation (after loop) ---
        const hasWaterTask = updatedPlant.tasks.some(t => t.title.includes('Water') && !t.isCompleted);
        if (updatedPlant.medium.moisture < 30 && !hasWaterTask) {
            newTasks.push({ id: `task-water-${Date.now()}`, title: 'Water Plant', description: `Medium moisture is low.`, priority: 'high', isCompleted: false, createdAt: Date.now() });
        }
        
        const hasFeedTask = updatedPlant.tasks.some(t => t.title.includes('Feed') && !t.isCompleted);
        if (updatedPlant.nutrientPool < 30 && !hasFeedTask) {
            newTasks.push({ id: `task-feed-${Date.now()}`, title: 'Feed Plant', description: `Nutrient pool is running low.`, priority: 'medium', isCompleted: false, createdAt: Date.now() });
        }

        updatedPlant.lastUpdated = Date.now();

        return { updatedPlant, newJournalEntries, newTasks };
    }
}

export const simulationService = new SimulationService();

import { Plant, PlantStage, JournalEntry, GrowSetup, Strain, JournalEntryType, ProblemType, Task, AppSettings } from '@/types';

export const PLANT_STAGE_DETAILS: Record<PlantStage, { duration: number; idealVitals: any }> = {
  [PlantStage.Seed]: { duration: 1, idealVitals: { temp: {min: 22, max: 25}, humidity: {min: 70, max: 80}, ph: {min: 6.0, max: 7.0}, ec: {min: 0, max: 0.4} } },
  [PlantStage.Germination]: { duration: 4, idealVitals: { temp: {min: 22, max: 25}, humidity: {min: 70, max: 80}, ph: {min: 6.0, max: 7.0}, ec: {min: 0, max: 0.4} } },
  [PlantStage.Seedling]: { duration: 14, idealVitals: { temp: {min: 20, max: 26}, humidity: {min: 60, max: 70}, ph: {min: 5.8, max: 6.5}, ec: {min: 0.4, max: 0.8} } },
  [PlantStage.Vegetative]: { duration: 28, idealVitals: { temp: {min: 22, max: 28}, humidity: {min: 50, max: 60}, ph: {min: 5.8, max: 6.5}, ec: {min: 0.8, max: 1.5} } },
  [PlantStage.Flowering]: { duration: 56, idealVitals: { temp: {min: 20, max: 26}, humidity: {min: 40, max: 50}, ph: {min: 6.0, max: 6.8}, ec: {min: 1.2, max: 2.0} } },
  [PlantStage.Harvest]: { duration: 1, idealVitals: {} },
  [PlantStage.Drying]: { duration: 10, idealVitals: {} },
  [PlantStage.Curing]: { duration: 21, idealVitals: {} },
  [PlantStage.Finished]: { duration: Infinity, idealVitals: {} },
};

class SimulationService {
    private _calculateVPD(temp: number, humidity: number): number {
        const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        return svp * (1 - (humidity / 100));
    }

    createPlant(strain: Strain, setup: GrowSetup, defaultLight: AppSettings['defaultGrowSetup']['light'], name: string): Plant {
        const id = `plant-${Date.now()}`;
        const temp = 24; // Sensible default
        const humidity = 60; // Sensible default
        const vpd = this._calculateVPD(temp, humidity);
        return {
            id,
            name,
            strain,
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            age: 0,
            stage: PlantStage.Seed,
            height: 0,
            biomass: 0.1,
            health: 100,
            stressLevel: 0,
            problems: [],
            tasks: [],
            journal: [{
                id: `journal-${id}-start`,
                createdAt: Date.now(),
                type: JournalEntryType.System,
                notes: `Grow started for ${name} (${strain.name}).`
            }],
            history: [],
            isTopped: false,
            lstApplied: 0,
            environment: {
                internalTemperature: temp,
                internalHumidity: humidity,
                vpd: vpd,
            },
            substrate: {
                ph: 6.5,
                ec: 0.2,
                moisture: 100,
            },
            rootSystem: {
                health: 100,
                microbeActivity: 50,
            },
            equipment: {
                light: { wattage: defaultLight.wattage, isOn: true },
                fan: { isOn: true, speed: 50 },
            }
        };
    }
    
    topPlant(plant: Plant): { updatedPlant: Plant, journalEntry: JournalEntry } {
        const updatedPlant = { ...plant, isTopped: true, stressLevel: Math.min(100, plant.stressLevel + 15) };
        const journalEntry: JournalEntry = {
            id: `journal-${plant.id}-${Date.now()}`,
            createdAt: Date.now(),
            type: JournalEntryType.Training,
            notes: 'Topped the main stem.',
            details: { trainingType: 'Topping' }
        };
        return { updatedPlant, journalEntry };
    }
    
    applyLst(plant: Plant): { updatedPlant: Plant, journalEntry: JournalEntry } {
        const updatedPlant = { ...plant, lstApplied: plant.lstApplied + 1, stressLevel: Math.min(100, plant.stressLevel + 5) };
         const journalEntry: JournalEntry = {
            id: `journal-${plant.id}-${Date.now()}`,
            createdAt: Date.now(),
            type: JournalEntryType.Training,
            notes: 'Applied Low Stress Training.',
            details: { trainingType: 'LST' }
        };
        return { updatedPlant, journalEntry };
    }

    clonePlant(plant: Plant): Plant {
        return JSON.parse(JSON.stringify(plant));
    }

    calculateStateForTimeDelta(plant: Plant, deltaTime: number): { updatedPlant: Plant, newJournalEntries: JournalEntry[], newTasks: Task[] } {
        let updatedPlant = this.clonePlant(plant);
        const newJournalEntries: JournalEntry[] = [];
        const newTasks: Task[] = [];
        
        const fullDays = Math.floor(deltaTime / (1000 * 60 * 60 * 24));

        if (fullDays <= 0) {
            return { updatedPlant, newJournalEntries, newTasks };
        }

        for (let i = 0; i < fullDays; i++) {
            if (updatedPlant.stage === PlantStage.Finished) break;

            // --- Metabolism ---
            const vpdFactor = Math.max(0.5, Math.min(2, updatedPlant.environment.vpd / 1.0));
            const waterConsumption = (updatedPlant.biomass * 0.1) * vpdFactor;
            updatedPlant.substrate.moisture = Math.max(0, updatedPlant.substrate.moisture - waterConsumption);

            if (updatedPlant.substrate.moisture > 30) {
                const nutrientUptake = (updatedPlant.biomass * 0.005) * vpdFactor;
                updatedPlant.substrate.ec = Math.max(0, updatedPlant.substrate.ec - nutrientUptake);
            }
            updatedPlant.substrate.ph += (Math.random() - 0.45) * 0.05;
            updatedPlant.substrate.ph = Math.max(5.0, Math.min(8.0, updatedPlant.substrate.ph));

            // --- Growth ---
            const healthFactor = updatedPlant.health / 100;
            let growthRate = 0;
            switch (updatedPlant.stage) {
                case PlantStage.Seedling:
                    growthRate = 0.5 + Math.random() * 0.5;
                    break;
                case PlantStage.Vegetative:
                    growthRate = 1.0 + Math.random() * 1.5;
                    if (updatedPlant.isTopped) growthRate *= 0.8;
                    growthRate += updatedPlant.lstApplied * 0.1;
                    break;
                case PlantStage.Flowering:
                    growthRate = 0.2 + Math.random() * 0.3;
                    break;
            }
            const dailyGrowth = growthRate * healthFactor;
            updatedPlant.height += dailyGrowth;
            updatedPlant.biomass += dailyGrowth * 0.25;

            // --- Problem Checking ---
            const stageDetails = PLANT_STAGE_DETAILS[updatedPlant.stage];
            if (stageDetails.idealVitals?.ph) {
                if (updatedPlant.substrate.moisture < 20 && !updatedPlant.problems.some(p => p.type === ProblemType.Underwatering && p.status === 'active')) {
                    updatedPlant.problems.push({ type: ProblemType.Underwatering, status: 'active', severity: 1, detectedAt: updatedPlant.age });
                    updatedPlant.health = Math.max(0, updatedPlant.health - 5);
                }
                if (updatedPlant.substrate.ph < stageDetails.idealVitals.ph.min && !updatedPlant.problems.some(p => p.type === ProblemType.phTooLow && p.status === 'active')) {
                    updatedPlant.problems.push({ type: ProblemType.phTooLow, status: 'active', severity: 1, detectedAt: updatedPlant.age });
                    updatedPlant.health = Math.max(0, updatedPlant.health - 2);
                }
            }

            // --- Age & Stage Progression ---
            updatedPlant.age += 1;
            const stageDuration = PLANT_STAGE_DETAILS[updatedPlant.stage].duration;
            const previousStageDurations = Object.values(PLANT_STAGE_DETAILS).slice(0, Object.values(PlantStage).indexOf(updatedPlant.stage)).reduce((acc, s) => acc + s.duration, 0);
            const timeInStage = updatedPlant.age - previousStageDurations;

            if (timeInStage >= stageDuration) {
                const currentIndex = Object.values(PlantStage).indexOf(updatedPlant.stage);
                if (currentIndex < Object.values(PlantStage).length - 1) {
                    updatedPlant.stage = Object.values(PlantStage)[currentIndex + 1];
                }
            }
            
            updatedPlant.history.push({
                day: updatedPlant.age,
                height: updatedPlant.height,
                health: updatedPlant.health,
                stressLevel: updatedPlant.stressLevel,
                substrate: { ...updatedPlant.substrate },
            });
        }
        
        return { updatedPlant, newJournalEntries, newTasks };
    }
}

export const simulationService = new SimulationService();
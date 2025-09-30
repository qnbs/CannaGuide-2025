import { Plant, PlantStage, JournalEntry, GrowSetup, Strain, JournalEntryType, ProblemType, Task, AppSettings } from '@/types';

export const PLANT_STAGE_DETAILS: Record<PlantStage, { duration: number; idealVitals: any }> = {
  [PlantStage.Seed]: { duration: 1, idealVitals: { temp: {min: 22, max: 25}, humidity: {min: 70, max: 80}, ph: {min: 6.0, max: 7.0}, ec: {min: 0, max: 0.4}, co2: {min: 400, max: 600} } },
  [PlantStage.Germination]: { duration: 4, idealVitals: { temp: {min: 22, max: 25}, humidity: {min: 70, max: 80}, ph: {min: 6.0, max: 7.0}, ec: {min: 0, max: 0.4}, co2: {min: 400, max: 600} } },
  [PlantStage.Seedling]: { duration: 14, idealVitals: { temp: {min: 20, max: 26}, humidity: {min: 60, max: 70}, ph: {min: 5.8, max: 6.5}, ec: {min: 0.4, max: 0.8}, co2: {min: 400, max: 800} } },
  [PlantStage.Vegetative]: { duration: 28, idealVitals: { temp: {min: 22, max: 28}, humidity: {min: 50, max: 60}, ph: {min: 5.8, max: 6.5}, ec: {min: 0.8, max: 1.5}, co2: {min: 800, max: 1200} } },
  [PlantStage.Flowering]: { duration: 56, idealVitals: { temp: {min: 20, max: 26}, humidity: {min: 40, max: 50}, ph: {min: 6.0, max: 6.8}, ec: {min: 1.2, max: 2.0}, co2: {min: 1000, max: 1500} } },
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
        const temp = 24;
        const humidity = 60;
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
                co2Level: 400, // Atmospheric CO2
            },
            medium: {
                ph: 6.5,
                ec: 0.2,
                moisture: 100,
                microbeHealth: 70,
            },
            rootSystem: {
                health: 100,
                microbeActivity: 50,
                rootMass: 0.1,
            },
            structuralModel: {
                branches: 1,
                nodes: 0,
                leafCount: 0,
            },
            equipment: {
                light: { wattage: defaultLight.wattage, isOn: true, lightHours: setup.lightHours },
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
        return structuredClone(plant);
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

            const stageDetails = PLANT_STAGE_DETAILS[updatedPlant.stage];
            const geneticMods = updatedPlant.strain.geneticModifiers;
            let dailyStress = 0;

            // --- Ecosystem Simulation ---
            if (updatedPlant.equipment.light.isOn) {
                updatedPlant.environment.internalTemperature += 0.5; // Light produces heat
                updatedPlant.environment.co2Level -= 50; // Plants consume CO2
            } else {
                updatedPlant.environment.internalTemperature -= 0.3;
            }
            if (updatedPlant.equipment.fan.isOn) {
                updatedPlant.environment.internalTemperature -= 0.2 * (updatedPlant.equipment.fan.speed / 100);
                updatedPlant.environment.co2Level += 30; // Fan brings in fresh air
            }
            updatedPlant.environment.internalTemperature = Math.max(15, Math.min(35, updatedPlant.environment.internalTemperature));
            updatedPlant.environment.co2Level = Math.max(300, Math.min(2000, updatedPlant.environment.co2Level));
            updatedPlant.environment.vpd = this._calculateVPD(updatedPlant.environment.internalTemperature, updatedPlant.environment.internalHumidity);

            // --- Metabolism & Nutrient Uptake ---
            const vpdFactor = Math.max(0.5, Math.min(1.5, 1.2 - Math.abs(updatedPlant.environment.vpd - 1.0)));
            const co2Factor = Math.max(0.5, Math.min(1.5, updatedPlant.environment.co2Level / stageDetails.idealVitals.co2.min));
            const waterConsumption = (updatedPlant.biomass * 0.1) * vpdFactor;
            updatedPlant.medium.moisture = Math.max(0, updatedPlant.medium.moisture - waterConsumption);

            if (updatedPlant.medium.moisture > 30) {
                const nutrientUptake = (updatedPlant.rootSystem.rootMass * 0.05) * vpdFactor * geneticMods.nutrientUptakeRate;
                updatedPlant.medium.ec = Math.max(0, updatedPlant.medium.ec - nutrientUptake);
            }
            updatedPlant.medium.ph += (Math.random() - 0.45) * 0.05;
            updatedPlant.medium.ph = Math.max(5.0, Math.min(8.0, updatedPlant.medium.ph));

            // --- Growth (Biomass & Roots) ---
            const healthFactor = updatedPlant.health / 100;
            const photosynthesisRate = healthFactor * vpdFactor * co2Factor * (updatedPlant.medium.ec > 0.2 ? 1 : 0.5);
            let growthRate = 0;
            switch (updatedPlant.stage) {
                case PlantStage.Seedling: growthRate = 0.5 + Math.random() * 0.5; break;
                case PlantStage.Vegetative: growthRate = 1.0 + Math.random() * 1.5; break;
                case PlantStage.Flowering: growthRate = 0.2 + Math.random() * 0.3; break;
            }
            const dailyGrowth = growthRate * photosynthesisRate;
            updatedPlant.height += dailyGrowth * (updatedPlant.isTopped ? 0.7 : 1) + (updatedPlant.lstApplied * 0.05);
            updatedPlant.biomass += dailyGrowth * 0.25;
            updatedPlant.rootSystem.rootMass += dailyGrowth * 0.1;
            updatedPlant.structuralModel.leafCount = Math.floor(updatedPlant.biomass * 10);

            // --- Chemical Synthesis (Flowering) ---
            if (updatedPlant.stage === PlantStage.Flowering && updatedPlant.harvestData) {
                const synthesisFactor = healthFactor * (updatedPlant.biomass / 50);
                updatedPlant.harvestData.cannabinoidProfile.thc += (updatedPlant.strain.thc / 56) * synthesisFactor;
            }
            
            // --- Stress Calculation ---
            if (updatedPlant.medium.moisture < 20) dailyStress += 5;
            if (updatedPlant.medium.ph < stageDetails.idealVitals.ph.min || updatedPlant.medium.ph > stageDetails.idealVitals.ph.max) dailyStress += 3;
            if (updatedPlant.medium.ec < stageDetails.idealVitals.ec.min || updatedPlant.medium.ec > stageDetails.idealVitals.ec.max) dailyStress += 2;
            if (updatedPlant.environment.internalTemperature < stageDetails.idealVitals.temp.min || updatedPlant.environment.internalTemperature > stageDetails.idealVitals.temp.max) dailyStress += 2;
            updatedPlant.stressLevel = Math.min(100, updatedPlant.stressLevel + (dailyStress / geneticMods.stressTolerance));

            // --- Health Calculation ---
            if (updatedPlant.stressLevel > 30) {
                updatedPlant.health = Math.max(0, updatedPlant.health - (updatedPlant.stressLevel / 20));
            } else {
                updatedPlant.health = Math.min(100, updatedPlant.health + 2);
                updatedPlant.stressLevel = Math.max(0, updatedPlant.stressLevel - 5);
            }

            // --- Problem Checking ---
            if (updatedPlant.medium.moisture < 20 && !updatedPlant.problems.some(p => p.type === ProblemType.Underwatering && p.status === 'active')) {
                updatedPlant.problems.push({ type: ProblemType.Underwatering, status: 'active', severity: 1, detectedAt: updatedPlant.age });
            }
            
            // --- Age & Stage Progression ---
            updatedPlant.age += 1;
            
            const currentIndex = Object.values(PlantStage).indexOf(updatedPlant.stage);
            let nextStage: PlantStage | null = null;
            
            // Autoflower and other timed progressions
            const currentStageDuration = PLANT_STAGE_DETAILS[updatedPlant.stage].duration;
            const previousStagesDuration = Object.values(PlantStage).slice(0, currentIndex).reduce((acc, s) => acc + (PLANT_STAGE_DETAILS[s as PlantStage]?.duration || 0), 0);
            const timeInStage = updatedPlant.age - previousStagesDuration;

            if (timeInStage >= currentStageDuration) {
                if (currentIndex < Object.values(PlantStage).length - 1) {
                    nextStage = Object.values(PlantStage)[currentIndex + 1];
                }
            }

            // Specific logic for photoperiod flowering transition
            if (updatedPlant.stage === PlantStage.Vegetative && updatedPlant.strain.floweringType === 'Photoperiod' && updatedPlant.equipment.light.lightHours === 12) {
                nextStage = PlantStage.Flowering;
            }

            if (nextStage && updatedPlant.stage !== nextStage) {
                updatedPlant.stage = nextStage;
            }
            
            updatedPlant.history.push({
                day: updatedPlant.age,
                height: updatedPlant.height,
                health: updatedPlant.health,
                stressLevel: updatedPlant.stressLevel,
                medium: { ...updatedPlant.medium },
            });
        }
        
        return { updatedPlant, newJournalEntries, newTasks };
    }
}

export const simulationService = new SimulationService();
import { Plant, PlantStage, JournalEntry, GrowSetup, Strain, JournalEntryType, ProblemType, Task, AppSettings } from '@/types';

export const PLANT_STAGE_DETAILS: Record<PlantStage, { duration: number; idealVitals: any }> = {
  [PlantStage.Seed]: { duration: 1, idealVitals: { temp: {min: 22, max: 25}, humidity: {min: 70, max: 80}, ph: {min: 6.0, max: 7.0}, ec: {min: 0, max: 0.4}, co2: {min: 400, max: 600}, vpd: {min: 0.4, max: 0.8} } },
  [PlantStage.Germination]: { duration: 4, idealVitals: { temp: {min: 22, max: 25}, humidity: {min: 70, max: 80}, ph: {min: 6.0, max: 7.0}, ec: {min: 0, max: 0.4}, co2: {min: 400, max: 600}, vpd: {min: 0.4, max: 0.8} } },
  [PlantStage.Seedling]: { duration: 14, idealVitals: { temp: {min: 20, max: 26}, humidity: {min: 60, max: 70}, ph: {min: 5.8, max: 6.5}, ec: {min: 0.4, max: 0.8}, co2: {min: 400, max: 800}, vpd: {min: 0.8, max: 1.1} } },
  [PlantStage.Vegetative]: { duration: 28, idealVitals: { temp: {min: 22, max: 28}, humidity: {min: 50, max: 60}, ph: {min: 5.8, max: 6.5}, ec: {min: 0.8, max: 1.5}, co2: {min: 800, max: 1200}, vpd: {min: 1.0, max: 1.3} } },
  [PlantStage.Flowering]: { duration: 56, idealVitals: { temp: {min: 20, max: 26}, humidity: {min: 40, max: 50}, ph: {min: 6.0, max: 6.8}, ec: {min: 1.2, max: 2.0}, co2: {min: 1000, max: 1500}, vpd: {min: 1.2, max: 1.5} } },
  [PlantStage.Harvest]: { duration: 1, idealVitals: {} },
  [PlantStage.Drying]: { duration: 10, idealVitals: {} },
  [PlantStage.Curing]: { duration: 21, idealVitals: {} },
  [PlantStage.Finished]: { duration: Infinity, idealVitals: {} },
};

// --- Simulation Constants ---
const LIGHT_EXTINCTION_COEFFICIENT = 0.7;
const PAR_PER_WATT = 1.8; // Approximation for modern LEDs (µmol/s/W)
const NUTRIENT_TO_BIOMASS_CONVERSION = 0.1; // How much nutrient is needed for 1g of biomass

class SimulationService {
    private _calculateVPD(temp: number, humidity: number): number {
        const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        return svp * (1 - (humidity / 100));
    }

    createPlant(strain: Strain, setup: GrowSetup, defaultLight: AppSettings['defaultGrowSetup']['light'], name: string): Plant {
        const id = `plant-${Date.now()}`;
        const temp = 24;
        const humidity = 75;
        const vpd = this._calculateVPD(temp, humidity);
        return {
            id, name, strain,
            createdAt: Date.now(), lastUpdated: Date.now(), age: 0,
            stage: PlantStage.Seed,
            height: 0, biomass: 0.1, health: 100, stressLevel: 0,
            nutrientPool: 5, // Initial nutrient reserve
            problems: [], tasks: [],
            journal: [{ id: `journal-${id}-start`, createdAt: Date.now(), type: JournalEntryType.System, notes: `Grow started for ${name} (${strain.name}).` }],
            history: [], isTopped: false, lstApplied: 0,
            environment: { internalTemperature: temp, internalHumidity: humidity, vpd: vpd, co2Level: 400 },
            medium: { ph: 6.5, ec: 0.4, moisture: 100, microbeHealth: 70 },
            rootSystem: { health: 100, microbeActivity: 50, rootMass: 0.1 },
            structuralModel: { branches: 1, nodes: 0, leafCount: 0 },
            equipment: { light: { wattage: defaultLight.wattage, isOn: true, lightHours: setup.lightHours }, fan: { isOn: true, speed: 50 } }
        };
    }
    
    topPlant(plant: Plant): { updatedPlant: Plant, journalEntry: JournalEntry } {
        const updatedPlant = { ...plant, isTopped: true, stressLevel: Math.min(100, plant.stressLevel + 15) };
        const journalEntry: JournalEntry = { id: `journal-${plant.id}-${Date.now()}`, createdAt: Date.now(), type: JournalEntryType.Training, notes: 'Topped the main stem.', details: { trainingType: 'Topping' }};
        return { updatedPlant, journalEntry };
    }
    
    applyLst(plant: Plant): { updatedPlant: Plant, journalEntry: JournalEntry } {
        const updatedPlant = { ...plant, lstApplied: plant.lstApplied + 1, stressLevel: Math.min(100, plant.stressLevel + 5) };
         const journalEntry: JournalEntry = { id: `journal-${plant.id}-${Date.now()}`, createdAt: Date.now(), type: JournalEntryType.Training, notes: 'Applied Low Stress Training.', details: { trainingType: 'LST' }};
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
        if (fullDays <= 0) return { updatedPlant, newJournalEntries, newTasks };

        const stressCounters = { lowMoisture: 0, lowEc: 0, highPh: 0, lowPh: 0, highVpd: 0 };

        for (let i = 0; i < fullDays; i++) {
            if (updatedPlant.stage === PlantStage.Finished) break;
            
            const stageDetails = PLANT_STAGE_DETAILS[updatedPlant.stage];
            const geneticMods = updatedPlant.strain.geneticModifiers;
            let dailyStress = 0;

            updatedPlant.environment.vpd = this._calculateVPD(updatedPlant.environment.internalTemperature, updatedPlant.environment.internalHumidity);
            
            // Metabolism & Nutrient Uptake
            const vpdFactor = 1 - (Math.abs(updatedPlant.environment.vpd - (stageDetails.idealVitals.vpd.min + stageDetails.idealVitals.vpd.max) / 2) * 0.5);
            const waterConsumption = (updatedPlant.biomass * 0.1) * vpdFactor * (18 / updatedPlant.equipment.light.lightHours);
            updatedPlant.medium.moisture = Math.max(0, updatedPlant.medium.moisture - waterConsumption);
            if (updatedPlant.medium.moisture > 30) {
                const nutrientUptake = (updatedPlant.rootSystem.rootMass * 0.05 * updatedPlant.medium.ec) * vpdFactor * geneticMods.nutrientUptakeRate;
                updatedPlant.nutrientPool += nutrientUptake;
                updatedPlant.medium.ec = Math.max(0, updatedPlant.medium.ec - nutrientUptake * 0.1);
            }
            
            // RUE-based Growth Model
            const PAR = updatedPlant.equipment.light.wattage * PAR_PER_WATT * (updatedPlant.equipment.light.lightHours / 24);
            const LAI = updatedPlant.structuralModel.leafCount * 0.001;
            const lightAbsorption = 1 - Math.exp(-LIGHT_EXTINCTION_COEFFICIENT * LAI);
            const potentialBiomassGain = PAR * lightAbsorption * geneticMods.rue * (updatedPlant.health / 100);
            const nutrientLimitedGain = updatedPlant.nutrientPool * NUTRIENT_TO_BIOMASS_CONVERSION;
            const actualBiomassGain = Math.min(potentialBiomassGain, nutrientLimitedGain);

            updatedPlant.nutrientPool = Math.max(0, updatedPlant.nutrientPool - (actualBiomassGain / NUTRIENT_TO_BIOMASS_CONVERSION));
            updatedPlant.biomass += actualBiomassGain;
            updatedPlant.height += actualBiomassGain * (updatedPlant.isTopped ? 0.7 : 1) + (updatedPlant.lstApplied * 0.05);
            updatedPlant.rootSystem.rootMass += actualBiomassGain * 0.2;
            updatedPlant.structuralModel.leafCount = Math.floor(updatedPlant.biomass * 50);

            // Chemical Synthesis
            if (updatedPlant.stage === PlantStage.Flowering && updatedPlant.harvestData) {
                const synthesisFactor = (updatedPlant.health / 100) * (updatedPlant.biomass / 50);
                updatedPlant.harvestData.cannabinoidProfile.thc += (updatedPlant.strain.thc / 56) * synthesisFactor;
                if (!updatedPlant.harvestData.terpeneProfile) updatedPlant.harvestData.terpeneProfile = {};
                (updatedPlant.strain.dominantTerpenes || []).forEach(terp => {
                    if (!updatedPlant.harvestData.terpeneProfile[terp]) updatedPlant.harvestData.terpeneProfile[terp] = 0;
                    updatedPlant.harvestData.terpeneProfile[terp] += Math.random() * 0.05 * synthesisFactor;
                });
            }
            
            // Stress Calculation & Probabilistic Problem Generation
            const checkStress = (condition: boolean, counter: keyof typeof stressCounters, problem: ProblemType) => {
                stressCounters[counter] = condition ? stressCounters[counter] + 1 : 0;
                if (stressCounters[counter] > 3 && Math.random() < 0.2 / geneticMods.stressTolerance) {
                    if (!updatedPlant.problems.some(p => p.type === problem && p.status === 'active')) {
                        updatedPlant.problems.push({ type: problem, status: 'active', severity: 1, detectedAt: updatedPlant.age });
                    }
                }
                if (condition) dailyStress += 2;
            };
            checkStress(updatedPlant.medium.moisture < 20, 'lowMoisture', ProblemType.Underwatering);
            checkStress(updatedPlant.medium.ec < stageDetails.idealVitals.ec.min, 'lowEc', ProblemType.NutrientDeficiency);
            checkStress(updatedPlant.medium.ph > stageDetails.idealVitals.ph.max, 'highPh', ProblemType.phTooHigh);
            checkStress(updatedPlant.medium.ph < stageDetails.idealVitals.ph.min, 'lowPh', ProblemType.phTooLow);
            checkStress(updatedPlant.environment.vpd > stageDetails.idealVitals.vpd.max, 'highVpd', ProblemType.HumidityTooLow);
            
            updatedPlant.stressLevel = Math.min(100, updatedPlant.stressLevel + dailyStress);
            if (updatedPlant.stressLevel > 30) updatedPlant.health = Math.max(0, updatedPlant.health - (updatedPlant.stressLevel / 20));
            else { updatedPlant.health = Math.min(100, updatedPlant.health + 2); updatedPlant.stressLevel = Math.max(0, updatedPlant.stressLevel - 5); }
            
            updatedPlant.age += 1;

            const currentIndex = Object.values(PlantStage).indexOf(updatedPlant.stage);
            const timeInStage = updatedPlant.age - Object.values(PlantStage).slice(0, currentIndex).reduce((acc, s) => acc + (PLANT_STAGE_DETAILS[s as PlantStage]?.duration || 0), 0);
            if (timeInStage >= PLANT_STAGE_DETAILS[updatedPlant.stage].duration) {
                if (currentIndex < Object.values(PlantStage).length - 1) {
                    updatedPlant.stage = Object.values(PlantStage)[currentIndex + 1];
                }
            }
            if (updatedPlant.stage === PlantStage.Harvest && !updatedPlant.harvestData) {
                updatedPlant.harvestData = { wetWeight: updatedPlant.biomass * 4, dryWeight: updatedPlant.biomass, terpeneRetentionPercent: 100, moldRiskPercent: 0, dryingEnvironment: { temperature: 20, humidity: 60 }, currentDryDay: 0, currentCureDay: 0, jarHumidity: 75, finalQuality: 0, chlorophyllPercent: 100, terpeneProfile: {}, cannabinoidProfile: { thc: 0, cbn: 0 }, lastBurpDay: 0,};
            }
            
            updatedPlant.history.push({ day: updatedPlant.age, height: updatedPlant.height, health: updatedPlant.health, stressLevel: updatedPlant.stressLevel, medium: { ...updatedPlant.medium } });
        }
        
        return { updatedPlant, newJournalEntries, newTasks };
    }
}

export const simulationService = new SimulationService();
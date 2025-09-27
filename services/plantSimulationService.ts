import {
    Plant,
    PlantStage,
    PlantHistoryEntry,
    Task,
    PlantProblem,
    ProblemType,
    GrowSetup,
    Strain,
    DifficultyLevel,
    JournalEntry,
} from '../types';
import { STAGES_ORDER } from '../constants';

// CONSTANTS
const ATMOSPHERIC_CO2 = 415; // ppm
const OPTIMAL_CO2 = 1200; // ppm
const BASE_LIGHT_EFFICIENCY = 2.5; // µmol/J for LEDs
const STRESS_DECAY = 0.95; // Less decay per day
const HEALTH_IMPACT_FACTOR = 0.05; // Less impact from stress
const ROOT_HEALTH_RECOVERY_RATE = 2;
const ROOT_HEALTH_DECAY_RATE_OVERWATER = 5;
const ROOT_HEALTH_DECAY_RATE_UNDERWATER = 3;
const BIOMASS_TO_HEIGHT_FACTOR = 10;
const WATER_UPTAKE_PER_GRAM_BIOMASS = 0.02; // in Liters per day per gram
const NUTRIENT_UPTAKE_EC_MULTIPLIER = 0.01;

const DIFFICULTY_STRESS_MODIFIER: Record<DifficultyLevel, number> = {
    'Easy': 0.8,
    'Medium': 1.0,
    'Hard': 1.2,
};

const DEFAULT_IDEAL_CONDITIONS = {
    temperatureRange: [22, 28] as [number, number],
    humidityRange: [50, 70] as [number, number],
    phRange: [5.8, 6.8] as [number, number],
};

// Co-locating stage details here as they are simulation-specific
export const PLANT_STAGE_DETAILS: Record<PlantStage, {
    duration: number;
    idealVpd: { min: number; max: number };
    idealVitals: { ph: {min: number, max: number}, ec: {min: number, max: number} };
    lightHours: number;
}> = {
    [PlantStage.Seed]: { duration: 1, idealVpd: { min: 0.4, max: 0.8 }, idealVitals: { ph: {min: 6.0, max: 7.0}, ec: {min: 0.2, max: 0.6} }, lightHours: 18 },
    [PlantStage.Germination]: { duration: 3, idealVpd: { min: 0.4, max: 0.8 }, idealVitals: { ph: {min: 6.0, max: 7.0}, ec: {min: 0.2, max: 0.6} }, lightHours: 18 },
    [PlantStage.Seedling]: { duration: 14, idealVpd: { min: 0.4, max: 0.8 }, idealVitals: { ph: {min: 5.8, max: 6.5}, ec: {min: 0.5, max: 1.0} }, lightHours: 18 },
    [PlantStage.Vegetative]: { duration: 28, idealVpd: { min: 0.8, max: 1.2 }, idealVitals: { ph: {min: 5.8, max: 6.5}, ec: {min: 1.0, max: 1.8} }, lightHours: 18 },
    [PlantStage.Flowering]: { duration: 56, idealVpd: { min: 1.2, max: 1.6 }, idealVitals: { ph: {min: 6.0, max: 6.8}, ec: {min: 1.2, max: 2.2} }, lightHours: 12 },
    [PlantStage.Harvest]: { duration: 1, idealVpd: { min: 0.8, max: 1.2 }, idealVitals: { ph: {min: 6.0, max: 6.8}, ec: {min: 0.4, max: 0.8} }, lightHours: 12 },
    [PlantStage.Drying]: { duration: 10, idealVpd: { min: 0, max: 0 }, idealVitals: { ph: {min: 0, max: 0}, ec: {min: 0, max: 0} }, lightHours: 0 },
    [PlantStage.Curing]: { duration: 21, idealVpd: { min: 0, max: 0 }, idealVitals: { ph: {min: 0, max: 0}, ec: {min: 0, max: 0} }, lightHours: 0 },
    [PlantStage.Finished]: { duration: Infinity, idealVpd: { min: 0, max: 0 }, idealVitals: { ph: {min: 0, max: 0}, ec: {min: 0, max: 0} }, lightHours: 0 },
};


class PlantSimulationService {

    // FIX: Changed `clonePlant` to public to allow access from other services like ScenarioService.
    public clonePlant(plant: Plant): Plant {
        return JSON.parse(JSON.stringify(plant));
    }

    private getPpfd(plant: Plant): number {
        if (!plant.equipment.light.isOn) return 0;
        const area = 1; // Assuming 1m^2 area for simplicity in PPFD calc
        return (plant.equipment.light.wattage * BASE_LIGHT_EFFICIENCY) / area;
    }

    private updateEnvironment(plant: Plant): void {
        const { equipment, environment } = plant;
        let tempChange = 0;
        // Light heat effect
        if (equipment.light.isOn) {
            tempChange += (equipment.light.wattage / 150) * 0.2; // Slower heat build-up
        }
        // Fan cooling/heating effect (normalizing towards ambient)
        if (equipment.fan.isOn) {
            const coolingEffect = (environment.internalTemperature - environment.temperature) * (equipment.fan.speed / 150) * 0.1;
            tempChange -= coolingEffect;
        }
        // Natural heat dissipation
        tempChange -= (environment.internalTemperature - environment.temperature) * 0.05;
        environment.internalTemperature = Math.max(10, Math.min(40, environment.internalTemperature + tempChange));

        // Humidity from transpiration
        let humidityChange = (plant.biomass / 10) * 0.1;
        // Fan dehumidifying effect
        if (equipment.fan.isOn) {
             const dryingEffect = (environment.internalHumidity - environment.humidity) * (equipment.fan.speed / 100) * 0.1;
             humidityChange -= dryingEffect;
        }
        // Natural normalization
        humidityChange -= (environment.internalHumidity - environment.humidity) * 0.05;
        environment.internalHumidity = Math.max(20, Math.min(99, environment.internalHumidity + humidityChange));

        // CO2 consumption and replenishment
        let co2Change = -(plant.biomass * 2 * (this.getPpfd(plant) > 100 ? 1 : 0)); // Only consume CO2 when light is significant
        if (equipment.fan.isOn) {
            const co2Replenishment = (ATMOSPHERIC_CO2 - environment.co2Level) * (equipment.fan.speed / 100) * 0.5;
            co2Change += co2Replenishment;
        }
        environment.co2Level = Math.max(100, Math.min(2000, environment.co2Level + co2Change));

        // Calculate VPD
        const svp = 0.61078 * Math.exp((17.27 * environment.internalTemperature) / (environment.internalTemperature + 237.3));
        plant.environment.vpd = svp * (1 - (environment.internalHumidity / 100));
    }

    private updateSubstrate(plant: Plant, waterUptake: number, nutrientUptake: number): void {
        plant.substrate.moisture = Math.max(0, plant.substrate.moisture - waterUptake * 10);
        plant.substrate.ec = Math.max(0, plant.substrate.ec - nutrientUptake * 0.05);
        plant.substrate.microbeHealth = Math.max(0, plant.substrate.microbeHealth * 0.99); // Slow daily decay
    }
    
    private updateRootSystem(plant: Plant, biomassGain: number): void {
        plant.rootSystem.rootMass += biomassGain * 0.3; // Root growth is a fraction of total biomass gain
        
        if (plant.substrate.moisture > 90) {
            plant.rootSystem.rootHealth -= ROOT_HEALTH_DECAY_RATE_OVERWATER;
        } else if (plant.substrate.moisture < 20) {
            plant.rootSystem.rootHealth -= ROOT_HEALTH_DECAY_RATE_UNDERWATER;
        } else {
            plant.rootSystem.rootHealth += ROOT_HEALTH_RECOVERY_RATE;
        }
        plant.rootSystem.rootHealth = Math.max(0, Math.min(100, plant.rootSystem.rootHealth));
    }
    
    private calculateMetabolism(plant: Plant) {
        const { health, rootSystem, substrate, strain, environment } = plant;
        const healthFactor = health / 100;
        const lightIntensity = this.getPpfd(plant);

        const lightFactor = Math.min(1, lightIntensity / 1200); // Saturation point
        const co2Factor = Math.min(1, environment.co2Level / OPTIMAL_CO2);
        const photosynthesisRate = lightFactor * co2Factor * healthFactor;

        const waterDemand = photosynthesisRate * plant.biomass * WATER_UPTAKE_PER_GRAM_BIOMASS;
        const waterAvailability = Math.max(0, (substrate.moisture - 15) / 85); // Plant can't take water below 15%
        let waterUptake = waterDemand * waterAvailability;
        
        const idealPhRange = strain.idealConditions?.phRange ?? DEFAULT_IDEAL_CONDITIONS.phRange;
        const phDistance = Math.max(0, idealPhRange[0] - substrate.ph, substrate.ph - idealPhRange[1]);
        let phEfficiency = Math.max(0.1, 1 - phDistance * 0.5); // 50% efficiency penalty per 1.0 pH point off
        phEfficiency *= (1 + (substrate.microbeHealth / 200)); // Microbes improve efficiency up to 50%

        let nutrientUptake = waterUptake * substrate.ec * phEfficiency;

        const maxUptakeFromRoots = (rootSystem.rootMass * (rootSystem.rootHealth / 100)) / 10;
        waterUptake = Math.min(waterUptake, maxUptakeFromRoots);
        nutrientUptake = Math.min(nutrientUptake, maxUptakeFromRoots * substrate.ec);

        return { photosynthesisRate, waterUptake, nutrientUptake };
    }

    private calculateGrowth(plant: Plant, metabolism: { photosynthesisRate: number; nutrientUptake: number; }) {
        const potentialBiomassGain = metabolism.photosynthesisRate * 0.2 * (plant.biomass * 0.1);
        const nutrientDemand = plant.biomass * NUTRIENT_UPTAKE_EC_MULTIPLIER;
        const nutrientFactor = Math.min(1, metabolism.nutrientUptake / nutrientDemand);
        const actualBiomassGain = Math.max(0, potentialBiomassGain * nutrientFactor);
        
        plant.biomass += actualBiomassGain;
        plant.height = Math.pow(plant.biomass, 1/3) * BIOMASS_TO_HEIGHT_FACTOR;
        return actualBiomassGain;
    }

    private updateHealth(plant: Plant, strain: Strain): { newProblems: PlantProblem[], resolvedProblems: ProblemType[] } {
        let dailyStress = 0;
        const newProblems: PlantProblem[] = [];
        const resolvedProblems: ProblemType[] = [];
        const stressModifier = DIFFICULTY_STRESS_MODIFIER[strain.agronomic.difficulty];
        const idealVitals = PLANT_STAGE_DETAILS[plant.stage].idealVitals;
        const idealVpd = PLANT_STAGE_DETAILS[plant.stage].idealVpd;

        // Check environment
        const { internalTemperature, internalHumidity, vpd } = plant.environment;
        const idealTemp = DEFAULT_IDEAL_CONDITIONS.temperatureRange;
        if (internalTemperature < idealTemp[0]) { dailyStress += (idealTemp[0] - internalTemperature); this.addProblem(plant, newProblems, ProblemType.tempTooLow); } else { this.resolveProblem(resolvedProblems, ProblemType.tempTooLow); }
        if (internalTemperature > idealTemp[1]) { dailyStress += (internalTemperature - idealTemp[1]); this.addProblem(plant, newProblems, ProblemType.tempTooHigh); } else { this.resolveProblem(resolvedProblems, ProblemType.tempTooHigh); }
        if (vpd < idealVpd.min) { dailyStress += (idealVpd.min - vpd) * 5; this.addProblem(plant, newProblems, ProblemType.vpdTooLow); } else { this.resolveProblem(resolvedProblems, ProblemType.vpdTooLow); }
        if (vpd > idealVpd.max) { dailyStress += (vpd - idealVpd.max) * 5; this.addProblem(plant, newProblems, ProblemType.vpdTooHigh); } else { this.resolveProblem(resolvedProblems, ProblemType.vpdTooHigh); }

        // Check substrate
        const { ph, ec, moisture } = plant.substrate;
        if (ph < idealVitals.ph.min) { dailyStress += (idealVitals.ph.min - ph) * 10; this.addProblem(plant, newProblems, ProblemType.phTooLow); } else { this.resolveProblem(resolvedProblems, ProblemType.phTooLow); }
        if (ph > idealVitals.ph.max) { dailyStress += (ph - idealVitals.ph.max) * 10; this.addProblem(plant, newProblems, ProblemType.phTooHigh); } else { this.resolveProblem(resolvedProblems, ProblemType.phTooHigh); }
        if (ec > idealVitals.ec.max) { dailyStress += (ec - idealVitals.ec.max) * 15; this.addProblem(plant, newProblems, ProblemType.NutrientBurn); } else { this.resolveProblem(resolvedProblems, ProblemType.NutrientBurn); }
        if (moisture > 90) { this.addProblem(plant, newProblems, ProblemType.Overwatering); } else { this.resolveProblem(resolvedProblems, ProblemType.Overwatering); }
        if (moisture < 20) { dailyStress += (20-moisture) * 0.5; this.addProblem(plant, newProblems, ProblemType.Underwatering); } else { this.resolveProblem(resolvedProblems, ProblemType.Underwatering); }
        
        dailyStress *= stressModifier * (1 - (plant.substrate.microbeHealth / 250)); // Healthy soil reduces stress
        
        plant.stressLevel = Math.max(0, Math.min(100, plant.stressLevel * STRESS_DECAY + dailyStress));
        plant.health = Math.max(0, Math.min(100, plant.health - (plant.stressLevel / 100) * HEALTH_IMPACT_FACTOR * 5));
        
        return { newProblems, resolvedProblems };
    }

    private addProblem(plant: Plant, newProblems: PlantProblem[], type: ProblemType) {
        if (!plant.problems.some(p => p.type === type && p.status === 'active')) {
            newProblems.push({ type, status: 'active', detectedAt: Date.now() });
        }
    }

    private resolveProblem(resolvedProblems: ProblemType[], type: ProblemType) {
        resolvedProblems.push(type);
    }

    // --- Public API ---
    
    public runDailyCycle(plant: Plant): { updatedPlant: Plant, newJournalEntries: Omit<JournalEntry, 'id'|'createdAt'>[] } {
        const p = this.clonePlant(plant);
        const newJournalEntries: Omit<JournalEntry, 'id'|'createdAt'>[] = [];

        if ([PlantStage.Finished, PlantStage.Drying, PlantStage.Curing, PlantStage.Harvest].includes(p.stage)) {
            p.age += 1;
            return { updatedPlant: p, newJournalEntries };
        }
        
        this.updateEnvironment(p);
        const metabolism = this.calculateMetabolism(p);
        const biomassGain = this.calculateGrowth(p, metabolism);
        this.updateRootSystem(p, biomassGain);
        this.updateSubstrate(p, metabolism.waterUptake, metabolism.nutrientUptake);
        
        const { newProblems, resolvedProblems } = this.updateHealth(p, p.strain);

        p.age += 1;
        
        resolvedProblems.forEach(type => {
            const problem = p.problems.find(prob => prob.type === type && prob.status === 'active');
            if (problem) {
                problem.status = 'resolved';
                problem.resolvedAt = Date.now();
            }
        });
        
        if (newProblems.length > 0) {
            p.problems.push(...newProblems);
            newProblems.forEach(prob => {
                newJournalEntries.push({ type: 'SYSTEM', notes: `Problem detected: ${prob.type}` });
            });
        }
        
        const historyEntry: PlantHistoryEntry = { day: p.age, height: p.height, health: p.health, stressLevel: p.stressLevel, substrate: { ph: p.substrate.ph, ec: p.substrate.ec, moisture: p.substrate.moisture }};
        p.history.push(historyEntry);

        return { updatedPlant: p, newJournalEntries };
    }
    
    public topPlant(plant: Plant) {
        const p = this.clonePlant(plant);
        p.height *= 0.85;
        p.stressLevel = Math.min(100, p.stressLevel + 30);
        p.health = Math.max(0, p.health - 10);
        return { updatedPlant: p };
    }
    
    public applyLst(plant: Plant) {
        const p = this.clonePlant(plant);
        p.stressLevel = Math.min(100, p.stressLevel + 10);
        return { updatedPlant: p };
    }
    
    public addAmendment(plant: Plant, type: string) {
        const p = this.clonePlant(plant);
        if (type === 'Mycorrhizae') {
            p.substrate.microbeHealth = Math.min(100, p.substrate.microbeHealth + 50);
        } else if (type === 'Worm Castings') {
             p.substrate.microbeHealth = Math.min(100, p.substrate.microbeHealth + 25);
             p.substrate.ec = Math.min(3.0, p.substrate.ec + 0.1);
        }
        return { updatedPlant: p };
    }
    
    public waterPlant(plant: Plant, amount: number, ph: number, ec: number) {
         const p = this.clonePlant(plant);
         const waterLiters = amount / 1000;
         const currentWaterLiters = (p.substrate.moisture / 100) * p.substrate.volumeLiters;
         const newTotalWater = currentWaterLiters + waterLiters;
         
         // Avoid division by zero if pot is completely dry
         if (newTotalWater > 0) {
            p.substrate.ph = ((p.substrate.ph * currentWaterLiters) + (ph * waterLiters)) / newTotalWater;
            p.substrate.ec = ((p.substrate.ec * currentWaterLiters) + (ec * waterLiters)) / newTotalWater;
         } else {
            p.substrate.ph = ph;
            p.substrate.ec = ec;
         }

         p.substrate.moisture = Math.min(100, p.substrate.moisture + (amount / (p.substrate.volumeLiters * 10)));
         return { updatedPlant: p };
    }
    
    public createNewPlant(strain: Strain, setup: GrowSetup, name: string): Plant {
        const now = Date.now();
        // FIX: Completed the Plant object initialization to include all required properties, aligning with the type definition.
        return {
            id: `plant-${now}`, name, strain, createdAt: now, age: 0, stage: PlantStage.Seed,
            height: 0.5, health: 100, stressLevel: 0, biomass: 0.01, isTopped: false,
            structuralModel: {
                nodes: [{ id: 'node-0', age: 0 }],
                shoots: [{ id: 'shoot-0', length: 0.5, angle: 0, isMain: true, nodeIndex: 0 }]
            },
            cannabinoids: { thc: 0, cbd: 0 },
            terpenes: 0,
            postHarvest: undefined,
            substrate: { type: setup.medium, ph: 6.5, ec: 0.4, moisture: 100, volumeLiters: setup.potSize, microbeHealth: 20 },
            environment: { temperature: 25, humidity: 70, vpd: 0, internalTemperature: setup.temperature, internalHumidity: setup.humidity, co2Level: ATMOSPHERIC_CO2 },
            equipment: { light: { type: setup.lightType, wattage: setup.wattage, isOn: setup.lightHours > 0 }, fan: { isOn: true, speed: 50 } },
            rootSystem: { rootMass: 0.005, rootHealth: 100 },
            tasks: [], problems: [], journal: [], history: [],
        };
    }

    // FIX: Added missing harvestPlant method to handle harvesting logic.
    public harvestPlant(plant: Plant): Plant {
        const p = this.clonePlant(plant);
        p.stage = PlantStage.Harvest;

        const finalQuality = p.health - (p.stressLevel * 0.5);

        p.postHarvest = {
            dryWeight: 0,
            finalQuality: Math.max(0, Math.min(100, finalQuality)),
            currentDryDay: 0,
            currentCureDay: 0,
            jarHumidity: 0, // Not in jar yet
            lastBurpDay: 0,
        };

        p.cannabinoids.thc = p.biomass * (p.strain.thc / 100) * (p.postHarvest.finalQuality / 100);
        p.cannabinoids.cbd = p.biomass * (p.strain.cbd / 100) * (p.postHarvest.finalQuality / 100);
        p.terpenes = p.biomass * 0.02 * (p.postHarvest.finalQuality / 100);
        
        p.stage = PlantStage.Drying;

        return p;
    }

    // FIX: Added missing runPostHarvestCycle method to handle drying and curing logic.
    public runPostHarvestCycle(plant: Plant, action: 'dry' | 'burp' | 'cure', settings?: { temp: number, humidity: number }): Plant {
        const p = this.clonePlant(plant);
        if (!p.postHarvest) return p;

        if (p.stage === PlantStage.Drying) {
            p.postHarvest.currentDryDay += 1;
            
            const wetWeight = p.biomass;
            const targetDryWeight = wetWeight * 0.25;
            p.postHarvest.dryWeight = Math.min(targetDryWeight, p.postHarvest.dryWeight + (targetDryWeight / PLANT_STAGE_DETAILS[PlantStage.Drying].duration));
            
            if (p.postHarvest.currentDryDay >= PLANT_STAGE_DETAILS[PlantStage.Drying].duration) {
                p.stage = PlantStage.Curing;
                p.postHarvest.jarHumidity = 70;
            }
        }
        else if (p.stage === PlantStage.Curing) {
            p.postHarvest.currentCureDay += 1;
            
            if (action === 'burp') {
                p.postHarvest.jarHumidity = Math.max(55, p.postHarvest.jarHumidity - 10);
                p.postHarvest.lastBurpDay = p.age;
            } else {
                p.postHarvest.jarHumidity = Math.min(75, p.postHarvest.jarHumidity + 1);
            }

            p.postHarvest.finalQuality = Math.min(100, p.postHarvest.finalQuality * 1.005);
            
            if (p.postHarvest.currentCureDay >= PLANT_STAGE_DETAILS[PlantStage.Curing].duration) {
                p.stage = PlantStage.Finished;
            }
        }

        return p;
    }
}

export const simulationService = new PlantSimulationService();
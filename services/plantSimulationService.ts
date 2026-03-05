import { Plant, PlantStage, GrowSetup, Strain, JournalEntry, Task, ProblemType, JournalEntryType, GeneticModifiers } from '@/types';
import { STAGES_ORDER, SIM_PAR_PER_WATT_LED, SIM_LIGHT_EXTINCTION_COEFFICIENT_K, SIM_BIOMASS_CONVERSION_EFFICIENCY, SIM_SECONDS_PER_DAY } from '@/constants';
import type {
    AirflowLevel,
    GrowthStage,
    MediumType,
    PlantState as VPDPlantState,
    SimulationPoint,
    VPDInput,
    VPDWorkerResponse,
} from '@/types/simulation.types';
import { calculateVPD as calculateVpdValue, getVPDStatus, runDailySimulation } from '@/utils/vpdCalculator';

// More detailed stage information for the mechanistic model
export const PLANT_STAGE_DETAILS: Record<PlantStage, { 
    duration: number, // days
    idealVitals: { 
        ph: { min: number, max: number }, 
        ec: { min: number, max: number },
        vpd: { min: number, max: number }, // in kPa
        temp: { min: number, max: number } // in °C
    },
    nutrientRatio: { n: number, p: number, k: number }, // N-P-K uptake ratio
    biomassPartitioning: { roots: number, stem: number, leaves: number, flowers: number } // % distribution
}> = {
    [PlantStage.Seed]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.4 }, vpd: { min: 0.4, max: 0.8 }, temp: { min: 22, max: 26 } }, nutrientRatio: { n: 1, p: 2, k: 1 }, biomassPartitioning: { roots: 1.0, stem: 0, leaves: 0, flowers: 0 } },
    [PlantStage.Germination]: { duration: 3, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.4 }, vpd: { min: 0.4, max: 0.8 }, temp: { min: 22, max: 26 } }, nutrientRatio: { n: 1, p: 2, k: 1 }, biomassPartitioning: { roots: 0.8, stem: 0.1, leaves: 0.1, flowers: 0 } },
    [PlantStage.Seedling]: { duration: 14, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.4, max: 0.8 }, vpd: { min: 0.5, max: 0.9 }, temp: { min: 22, max: 28 } }, nutrientRatio: { n: 2, p: 1, k: 2 }, biomassPartitioning: { roots: 0.5, stem: 0.25, leaves: 0.25, flowers: 0 } },
    [PlantStage.Vegetative]: { duration: 28, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.8, max: 1.5 }, vpd: { min: 0.8, max: 1.2 }, temp: { min: 22, max: 28 } }, nutrientRatio: { n: 3, p: 1, k: 2 }, biomassPartitioning: { roots: 0.3, stem: 0.35, leaves: 0.35, flowers: 0 } },
    [PlantStage.Flowering]: { duration: 56, idealVitals: { ph: { min: 6.0, max: 6.8 }, ec: { min: 1.2, max: 2.0 }, vpd: { min: 1.2, max: 1.6 }, temp: { min: 20, max: 26 } }, nutrientRatio: { n: 1, p: 2, k: 3 }, biomassPartitioning: { roots: 0.1, stem: 0.1, leaves: 0.2, flowers: 0.6 } },
    [PlantStage.Harvest]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.0, max: 0.4 }, vpd: { min: 0.8, max: 1.2 }, temp: { min: 18, max: 22 } }, nutrientRatio: { n: 0, p: 0, k: 0 }, biomassPartitioning: { roots: 0.1, stem: 0.1, leaves: 0.2, flowers: 0.6 } },
    [PlantStage.Drying]: { duration: 10, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 }, vpd: { min: 0, max: 0 }, temp: { min: 0, max: 0 } }, nutrientRatio: { n: 0, p: 0, k: 0 }, biomassPartitioning: { roots: 0, stem: 0, leaves: 0, flowers: 1 } },
    [PlantStage.Curing]: { duration: 21, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 }, vpd: { min: 0, max: 0 }, temp: { min: 0, max: 0 } }, nutrientRatio: { n: 0, p: 0, k: 0 }, biomassPartitioning: { roots: 0, stem: 0, leaves: 0, flowers: 1 } },
    [PlantStage.Finished]: { duration: Infinity, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 }, vpd: { min: 0, max: 0 }, temp: { min: 0, max: 0 } }, nutrientRatio: { n: 0, p: 0, k: 0 }, biomassPartitioning: { roots: 0, stem: 0, leaves: 0, flowers: 1 } },
};

class PlantSimulationService {
    private _clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }

    /** Returns per-plant phenotype modifiers, falling back to strain defaults for legacy/uninitialized plants. */
    private _getModifiers(plant: Plant): GeneticModifiers {
        return plant.phenotypeModifiers ?? plant.strain.geneticModifiers;
    }

    private _getLeafTemperatureOffset(plant: Plant): number {
        const baseOffset = plant.equipment.light.type === 'HPS' ? 3.5 : 2.5;
        const circulationAdjustment = plant.equipment.circulationFan.isOn ? -0.3 : 0.4;
        return this._clamp(baseOffset + circulationAdjustment, 2, 4);
    }

    private _getSubstrateRhCorrection(plant: Plant): number {
        const byMediumType: Record<Plant['mediumType'], number> = {
            Soil: 0,
            Coco: -2,
            Hydro: 2,
        };

        const potAdjustment = plant.equipment.potType === 'Fabric' ? -1 : 0;
        return byMediumType[plant.mediumType || 'Soil'] + potAdjustment;
    }

    private _getCorrectedRh(plant: Plant): number {
        return this._clamp(
            plant.environment.internalHumidity + this._getSubstrateRhCorrection(plant),
            25,
            95,
        );
    }

    applyEnvironmentalCorrections(plant: Plant): Plant {
        const p = this.clonePlant(plant);
        const correctedRh = this._getCorrectedRh(p);
        const leafOffset = this._getLeafTemperatureOffset(p);
        p.environment.vpd = this._calculateVPD(p.environment.internalTemperature, correctedRh, leafOffset);
        return p;
    }

    createPlant(strain: Strain, setup: GrowSetup, name: string): Plant {
        const now = Date.now();
        const waterHoldingCapacity = setup.potSize * 1000 * (setup.potType === 'Fabric' ? 0.28 : 0.35);
        const newPlant: Plant = {
            id: `plant-${now}`,
            name,
            strain,
            mediumType: setup.medium,
            createdAt: now,
            lastUpdated: now,
            age: 0,
            stage: PlantStage.Seed,
            health: 100,
            stressLevel: 0,
            height: 0,
            biomass: { total: 0.01, stem: 0.01, leaves: 0, flowers: 0 },
            leafAreaIndex: 0.01,
            isTopped: false,
            lstApplied: 0,
            environment: {
                internalTemperature: 24,
                internalHumidity: 65,
                vpd: 0,
                co2Level: 400,
            },
            medium: {
                ph: 6.5,
                ec: 0.8,
                moisture: 100,
                microbeHealth: 80,
                substrateWater: waterHoldingCapacity,
                nutrientConcentration: { nitrogen: 100, phosphorus: 100, potassium: 100 },
            },
            nutrientPool: { nitrogen: 5, phosphorus: 5, potassium: 5 },
            rootSystem: { health: 100, rootMass: 0.01 },
            equipment: {
                light: {
                    type: setup.lightType,
                    wattage: setup.lightWattage,
                    isOn: true,
                    lightHours: setup.lightHours,
                },
                exhaustFan: {
                    power: setup.ventilation,
                    isOn: true,
                },
                circulationFan: {
                    isOn: setup.hasCirculationFan,
                },
                potSize: setup.potSize,
                potType: setup.potType,
            },
            problems: [],
            journal: [],
            tasks: [],
            harvestData: null,
            structuralModel: { branches: 1, nodes: 1 },
            // Copy strain defaults as starting phenotype; can be tuned per-plant via training or amendments
            phenotypeModifiers: { ...strain.geneticModifiers },
            history: [{ day: 0, health: 100, height: 0, stressLevel: 0, medium: { ph: 6.5, ec: 0.8, moisture: 100 } }],
            cannabinoidProfile: { thc: 0, cbd: 0, cbn: 0 },
            terpeneProfile: {},
            stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
        };

        return this.applyEnvironmentalCorrections(newPlant);
    }
    
    calculateStateForTimeDelta(plant: Plant, deltaTime: number): { updatedPlant: Plant, newJournalEntries: JournalEntry[], newTasks: Task[] } {
        let updatedPlant = this.clonePlant(plant);
        const newJournalEntries: JournalEntry[] = [];
        const newTasks: Task[] = [];
        const now = Date.now();

        const elapsedMillis = now - updatedPlant.lastUpdated;
        const totalMillisToSimulate = deltaTime < elapsedMillis ? elapsedMillis : deltaTime;
        const daysToSimulate = Math.floor(totalMillisToSimulate / SIM_SECONDS_PER_DAY / 1000);
        
        if (daysToSimulate < 1) {
            updatedPlant.lastUpdated = now;
            return { updatedPlant, newJournalEntries, newTasks };
        }

        for (let i = 0; i < daysToSimulate; i++) {
            updatedPlant.age += 1;

            updatedPlant = this._runDailyEcosystem(updatedPlant);
            updatedPlant = this._runDailyMetabolism(updatedPlant);
            updatedPlant = this._runDailyGrowth(updatedPlant);
            updatedPlant = this._runDailySynthesis(updatedPlant);
            updatedPlant = this._updateHealthAndStress(updatedPlant);

            const { plant: p, journalEntries: j, tasks: t } = this._checkForEvents(updatedPlant);
            updatedPlant = p;
            newJournalEntries.push(...j);
            newTasks.push(...t);

            updatedPlant.history.push({
                day: updatedPlant.age,
                height: updatedPlant.height,
                health: updatedPlant.health,
                stressLevel: updatedPlant.stressLevel,
                medium: { ph: updatedPlant.medium.ph, ec: updatedPlant.medium.ec, moisture: updatedPlant.medium.moisture },
            });
        }

        updatedPlant.lastUpdated = now;
        return { updatedPlant, newJournalEntries, newTasks };
    }

    private _runDailyEcosystem(plant: Plant): Plant {
        const p = this.clonePlant(plant);

        // Exhaust fan replenishes CO2 toward ambient (400 ppm).
        // With poor or disabled ventilation, photosynthesis steadily depletes CO2.
        const co2RefreshRate: Record<string, number> = { high: 0.9, medium: 0.7, low: 0.4 };
        const fanRefreshRate = p.equipment.exhaustFan.isOn
            ? (co2RefreshRate[p.equipment.exhaustFan.power] ?? 0.7)
            : 0.1;
        const ambientCo2 = 400;
        const co2Consumption = p.equipment.light.isOn ? p.biomass.leaves * 8 : 0;
        const co2After = p.environment.co2Level - co2Consumption;
        p.environment.co2Level = this._clamp(
            co2After + (ambientCo2 - co2After) * fanRefreshRate,
            200,
            1500,
        );

        return p;
    }

    private _runDailyMetabolism(plant: Plant): Plant {
        const p = this.clonePlant(plant);

        p.environment = this.applyEnvironmentalCorrections(p).environment;

        const mods = this._getModifiers(p);
        const vpd = p.environment.vpd;
        const vpdOptimum = (mods.vpdTolerance.min + mods.vpdTolerance.max) / 2;
        const vpdStressFactor = 1 - Math.abs(vpd - vpdOptimum);
        const transpirationRate = p.biomass.leaves * mods.transpirationFactor * vpdStressFactor;
        
        const waterUsed = Math.min(p.medium.substrateWater, transpirationRate * 100);
        p.medium.substrateWater -= waterUsed;
        const waterCapacity = p.equipment.potSize * 1000 * (p.equipment.potType === 'Fabric' ? 0.28 : 0.35);
        p.medium.moisture = (p.medium.substrateWater / waterCapacity) * 100;

        // pH lockout: nutrient availability is reduced when pH deviates beyond the ideal window
        const idealPh = PLANT_STAGE_DETAILS[p.stage].idealVitals.ph;
        const phOptimal = (idealPh.min + idealPh.max) / 2;
        const phHalfRange = Math.max(0.01, (idealPh.max - idealPh.min) / 2);
        const phDeviation = Math.max(0, Math.abs(p.medium.ph - phOptimal) - phHalfRange);
        const phLockoutFactor = this._clamp(1.0 - (phDeviation / phHalfRange) * 0.8, 0.2, 1.0);

        const uptakeFactor = mods.nutrientUptakeRate * (p.rootSystem.health / 100);
        const nutrientDemand = (p.biomass.total + p.rootSystem.rootMass) * 0.05;
        const availableNutrients = waterUsed * p.medium.ec * uptakeFactor * phLockoutFactor;
        
        const nutrientsTaken = Math.min(nutrientDemand, availableNutrients);
        if (nutrientsTaken > 0) {
            const ratio = PLANT_STAGE_DETAILS[p.stage].nutrientRatio;
            const totalRatio = ratio.n + ratio.p + ratio.k;
            p.nutrientPool.nitrogen += nutrientsTaken * (ratio.n / totalRatio);
            p.nutrientPool.phosphorus += nutrientsTaken * (ratio.p / totalRatio);
            p.nutrientPool.potassium += nutrientsTaken * (ratio.k / totalRatio);
        }

        return p;
    }

    private _runDailyGrowth(plant: Plant): Plant {
        const p = this.clonePlant(plant);
        
        const parEfficiency = p.equipment.light.type === 'LED' ? SIM_PAR_PER_WATT_LED : SIM_PAR_PER_WATT_LED * 0.8;
        const dailyLightIntegral = (p.equipment.light.wattage * parEfficiency * p.equipment.light.lightHours * 3600) / 1000000;
        const lightAbsorbed = 1 - Math.exp(-SIM_LIGHT_EXTINCTION_COEFFICIENT_K * p.leafAreaIndex);
        // CO2 enrichment factor: 1.0 at ambient 400 ppm, scales proportionally, capped at 2.0×
        const co2Factor = this._clamp(p.environment.co2Level / 400, 0.5, 2.0);
        const potentialBiomassGain = (dailyLightIntegral / 4) * lightAbsorbed * this._getModifiers(p).rue * co2Factor;
        
        const nutrientSupply = (p.nutrientPool.nitrogen + p.nutrientPool.phosphorus + p.nutrientPool.potassium) * SIM_BIOMASS_CONVERSION_EFFICIENCY;
        const actualBiomassGain = Math.min(potentialBiomassGain, nutrientSupply) * (p.health / 100);
        
        const partition = PLANT_STAGE_DETAILS[p.stage].biomassPartitioning;
        const gainedRoots = actualBiomassGain * partition.roots;
        const gainedStem = actualBiomassGain * partition.stem;
        const gainedLeaves = actualBiomassGain * partition.leaves;
        const gainedFlowers = actualBiomassGain * partition.flowers;
        
        p.rootSystem.rootMass += gainedRoots;
        p.biomass.stem += gainedStem;
        p.biomass.leaves += gainedLeaves;
        p.biomass.flowers += gainedFlowers;
        p.biomass.total = p.biomass.stem + p.biomass.leaves + p.biomass.flowers;
        
        p.height = p.biomass.stem * 20;
        p.leafAreaIndex = p.biomass.leaves * 0.05;

        const consumedNutrients = actualBiomassGain / SIM_BIOMASS_CONVERSION_EFFICIENCY;
        const ratio = PLANT_STAGE_DETAILS[p.stage].nutrientRatio;
        const totalRatio = ratio.n + ratio.p + ratio.k;
        if(totalRatio > 0) {
            p.nutrientPool.nitrogen = Math.max(0, p.nutrientPool.nitrogen - consumedNutrients * (ratio.n / totalRatio));
            p.nutrientPool.phosphorus = Math.max(0, p.nutrientPool.phosphorus - consumedNutrients * (ratio.p / totalRatio));
            p.nutrientPool.potassium = Math.max(0, p.nutrientPool.potassium - consumedNutrients * (ratio.k / totalRatio));
        }

        return p;
    }

    private _runDailySynthesis(plant: Plant): Plant {
        const p = this.clonePlant(plant);

        if (p.stage !== PlantStage.Flowering) {
            return p;
        }

        const productionFactor = 0.02 * (p.health / 100) * (1 - (p.stressLevel / 150));
        const newCannabinoids = p.biomass.flowers * productionFactor;

        if (newCannabinoids > 0) {
            const thcToCbdRatio = p.strain.thc / (p.strain.cbd + 0.1);
            p.cannabinoidProfile.thc += newCannabinoids * (thcToCbdRatio / (thcToCbdRatio + 1));
            p.cannabinoidProfile.cbd += newCannabinoids * (1 / (thcToCbdRatio + 1));
        }
        
        if (p.strain.dominantTerpenes && p.strain.dominantTerpenes.length > 0) {
            const newTerpenes = p.biomass.flowers * (productionFactor * 0.2);
            const terpeneCount = p.strain.dominantTerpenes.length;
            p.strain.dominantTerpenes.forEach(terpName => {
                p.terpeneProfile[terpName] = (p.terpeneProfile[terpName] || 0) + (newTerpenes / terpeneCount);
            });
        }

        return p;
    }

    private _updateHealthAndStress(plant: Plant): Plant {
        const p = this.clonePlant(plant);
        const ideal = PLANT_STAGE_DETAILS[p.stage].idealVitals;
        let stress = 0;

        // VPD Stress
        if (p.environment.vpd < ideal.vpd.min || p.environment.vpd > ideal.vpd.max) {
            stress += 10;
            p.stressCounters.vpd = (p.stressCounters.vpd || 0) + 1;
        } else {
            p.stressCounters.vpd = 0;
        }
        // pH Stress
        if (p.medium.ph < ideal.ph.min || p.medium.ph > ideal.ph.max) {
            stress += 15;
            p.stressCounters.ph = (p.stressCounters.ph || 0) + 1;
        } else {
            p.stressCounters.ph = 0;
        }
        // EC Stress
        if (p.medium.ec < ideal.ec.min || p.medium.ec > ideal.ec.max) {
            stress += 10;
            p.stressCounters.ec = (p.stressCounters.ec || 0) + 1;
        } else {
            p.stressCounters.ec = 0;
        }
        // Moisture Stress
        if (p.medium.moisture < 20) { // Underwatering
            stress += 20;
            p.stressCounters.moisture = (p.stressCounters.moisture || 0) + 1;
        } else if (p.medium.moisture > 98) { // Overwatering
            stress += 5;
            p.stressCounters.moisture = (p.stressCounters.moisture || 0) + 1;
        } else {
            p.stressCounters.moisture = 0;
        }
        
        p.stressLevel = Math.min(100, p.stressLevel * 0.8 + stress);
        p.health = Math.max(0, 100 - p.stressLevel);

        return p;
    }
    
    private _checkForEvents(plant: Plant): { plant: Plant, journalEntries: JournalEntry[], tasks: Task[] } {
        const p = this.clonePlant(plant);
        const journalEntries: JournalEntry[] = [];
        const newTasks: Task[] = [];
        const originalStage = p.stage;
    
        // --- Stage Progression Logic ---
        const currentStageIndex = STAGES_ORDER.indexOf(p.stage);
        if (currentStageIndex < STAGES_ORDER.length - 1 && ![PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(p.stage)) {
            let cumulativeDuration = 0;
            for (let i = 0; i <= currentStageIndex; i++) {
                cumulativeDuration += PLANT_STAGE_DETAILS[STAGES_ORDER[i]].duration;
            }
    
            let shouldAdvance = p.age >= cumulativeDuration;
            const nextStage = STAGES_ORDER[currentStageIndex + 1];
    
            if (nextStage === PlantStage.Flowering && p.strain.floweringType === 'Photoperiod' && p.equipment.light.lightHours > 12) {
                shouldAdvance = false;
            }
            
            if (shouldAdvance) {
                p.stage = nextStage;
            }
        }
    
        if (p.stage !== originalStage) {
            journalEntries.push({
                id: '',
                createdAt: 0,
                type: JournalEntryType.System,
                notes: `Stage changed from ${originalStage} to ${p.stage}`,
                details: { from: originalStage, to: p.stage }
            });
        }
        
        // --- Task Generation Logic ---
        if (p.medium.moisture < 30 && !p.tasks.some(t => t.title === 'Task: Water Plant')) {
            newTasks.push({ id: `task-water-${p.id}`, title: 'Task: Water Plant', description: `${p.name} is thirsty!`, isCompleted: false, createdAt: Date.now(), priority: 'high' });
        }

        // --- Probabilistic Problem Generation ---
        const hasProblem = (type: ProblemType) => p.problems.some(prob => prob.type === type && prob.status === 'active');
        
        // High VPD (too dry) -> Pest Risk
        if (p.stressCounters.vpd > 3 && !hasProblem(ProblemType.PestInfestation)) {
            const vpdStressChance = (p.stressCounters.vpd - 3) * 0.05 / this._getModifiers(p).pestResistance;
            if (Math.random() < vpdStressChance) {
                p.problems.push({ type: ProblemType.PestInfestation, severity: 1, onsetDay: p.age, status: 'active' });
                p.stressCounters.vpd = 0; // Reset counter after problem triggers
            }
        }
        
        // Nutrient/pH/EC Stress -> Nutrient Deficiency Risk
        if ((p.stressCounters.ph > 3 || p.stressCounters.ec > 3) && !hasProblem(ProblemType.NutrientDeficiency)) {
            const nutrientStressChance = ((p.stressCounters.ph + p.stressCounters.ec) - 3) * 0.04 / this._getModifiers(p).stressTolerance;
            if (Math.random() < nutrientStressChance) {
                 p.problems.push({ type: ProblemType.NutrientDeficiency, severity: 1, onsetDay: p.age, status: 'active' });
                 p.stressCounters.ph = 0;
                 p.stressCounters.ec = 0;
            }
        }
        
        // Moisture Stress -> Under/Overwatering
        if (p.stressCounters.moisture > 2 && !hasProblem(ProblemType.Underwatering) && p.medium.moisture < 20) {
             p.problems.push({ type: ProblemType.Underwatering, severity: 1, onsetDay: p.age, status: 'active' });
             p.stressCounters.moisture = 0;
        } else if (p.stressCounters.moisture > 4 && !hasProblem(ProblemType.Overwatering) && p.medium.moisture > 95) {
             p.problems.push({ type: ProblemType.Overwatering, severity: 1, onsetDay: p.age, status: 'active' });
             p.stressCounters.moisture = 0;
        }
        
        return { plant: p, journalEntries, tasks: newTasks };
    }

    private _calculateVPD(tempC: number, rh: number, leafTempOffset: number): number {
        const tempLeaf = tempC + leafTempOffset;
        const svpAir = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
        const avp = svpAir * (rh / 100);
        const svpLeaf = 0.61078 * Math.exp((17.27 * tempLeaf) / (tempLeaf + 237.3));
        return svpLeaf - avp;
    }

    clonePlant(plant: Plant): Plant {
        return JSON.parse(JSON.stringify(plant));
    }
    
    topPlant(plant: Plant): { updatedPlant: Plant } {
        const p = this.clonePlant(plant);
        if (p.stage === PlantStage.Vegetative && !p.isTopped) {
            p.isTopped = true;
            p.structuralModel.branches *= 2;
            p.stressLevel = Math.min(100, plant.stressLevel + 25);
        }
        return { updatedPlant: p };
    }
    
    applyLst(plant: Plant): { updatedPlant: Plant } {
        const p = this.clonePlant(plant);
        if (p.stage === PlantStage.Vegetative) {
            p.lstApplied += 1;
            p.stressLevel = Math.min(100, plant.stressLevel + 5);
        }
        return { updatedPlant: p };
    }
}

export const plantSimulationService = new PlantSimulationService();

const stageToGrowthStage = (stage: PlantStage): GrowthStage => {
    if (stage === PlantStage.Seed || stage === PlantStage.Germination || stage === PlantStage.Seedling) {
        return 'seedling';
    }
    if (stage === PlantStage.Vegetative) {
        return 'vegetative';
    }
    if (stage === PlantStage.Flowering) {
        return 'earlyFlower';
    }
    return 'lateFlower';
};

const mediumToVPDMedium = (medium: Plant['mediumType']): MediumType => {
    if (medium === 'Hydro') return 'hydro';
    if (medium === 'Coco') return 'coco';
    return 'soil';
};

const airflowToLevel = (power: Plant['equipment']['exhaustFan']['power']): AirflowLevel => {
    return power;
};

class VPDSimulationService {
    private worker: Worker | null = null;

    private getWorker(): Worker | null {
        if (typeof Worker === 'undefined') {
            return null;
        }

        if (!this.worker) {
            this.worker = new Worker(new URL('../workers/vpdSimulation.worker.ts', import.meta.url), { type: 'module' });
        }

        return this.worker;
    }

    private createProfiles(input: VPDInput): { tempProfile: number[]; rhProfile: number[] } {
        const tempProfile: number[] = [];
        const rhProfile: number[] = [];

        for (let hour = 0; hour < 24; hour += 1) {
            const lightOn = hour >= 6 && hour < 18;
            const tempDelta = lightOn ? 2.5 : -2.0;
            const rhDelta = lightOn ? -5 : 5;
            tempProfile.push(Number((input.airTemp + tempDelta).toFixed(2)));
            rhProfile.push(Math.max(25, Math.min(90, Number((input.rh + rhDelta).toFixed(2)))));
        }

        return { tempProfile, rhProfile };
    }

    createInputFromPlant(plant: Plant): VPDInput {
        return {
            airTemp: plant.environment.internalTemperature,
            rh: plant.environment.internalHumidity,
            medium: mediumToVPDMedium(plant.mediumType),
            airflow: airflowToLevel(plant.equipment.exhaustFan.power),
            lightOn: plant.equipment.light.isOn,
            phase: stageToGrowthStage(plant.stage),
        };
    }

    createProjectionStateFromPlant(plant: Plant): VPDPlantState {
        return {
            id: plant.id,
            ageDays: plant.age,
            growthStage: stageToGrowthStage(plant.stage),
            biomass: plant.biomass.total,
            health: plant.health,
            projectedYield: plant.harvestData?.dryWeight || 0,
            stressLevel: plant.stressLevel,
            vpdHistory: (plant.history || []).map((entry) => ({
                date: new Date(plant.createdAt + entry.day * 86400000).toISOString(),
                vpd: Number(plant.environment.vpd.toFixed(3)),
                status: 'optimal' as const,
            })),
        };
    }

    runDailyVPD(input: VPDInput, tempProfile?: number[], rhProfile?: number[]): Promise<SimulationPoint[]> {
        const profiles = tempProfile && rhProfile ? { tempProfile, rhProfile } : this.createProfiles(input);
        const worker = this.getWorker();

        if (!worker) {
            return Promise.resolve(
                runDailySimulation(
                    {
                        medium: input.medium,
                        airflow: input.airflow,
                        phase: input.phase,
                        leafTempOffset: input.leafTempOffset,
                    },
                    profiles.tempProfile,
                    profiles.rhProfile,
                ),
            );
        }

        return new Promise((resolve) => {
            worker.onmessage = (e: MessageEvent<VPDWorkerResponse>) => {
                if (e.data.type === 'DAILY_RESULT') {
                    resolve(e.data.data);
                }
            };

            worker.postMessage({
                type: 'RUN_DAILY',
                payload: {
                    baseInput: {
                        medium: input.medium,
                        airflow: input.airflow,
                        phase: input.phase,
                        leafTempOffset: input.leafTempOffset,
                    },
                    tempProfile: profiles.tempProfile,
                    rhProfile: profiles.rhProfile,
                },
            });
        });
    }

    runGrowthProjection(plant: VPDPlantState, env: VPDInput, days = 7): Promise<VPDPlantState> {
        const worker = this.getWorker();

        if (!worker) {
            let projectedPlant = { ...plant };
            const runDays = Math.max(1, days);

            for (let day = 0; day < runDays; day += 1) {
                const vpd = calculateVpdValue(env);
                const status = getVPDStatus(vpd, 1.2);
                const stressDelta = status === 'optimal' ? -1.2 : status === 'danger' ? 4.5 : 2.2;
                projectedPlant = {
                    ...projectedPlant,
                    ageDays: projectedPlant.ageDays + 1,
                    stressLevel: Math.max(0, Math.min(100, projectedPlant.stressLevel + stressDelta)),
                    health: Math.max(0, Math.min(100, projectedPlant.health - Math.max(0, stressDelta * 0.8))),
                    biomass: Number((projectedPlant.biomass * (1 + 0.01)).toFixed(4)),
                    projectedYield: Number((projectedPlant.projectedYield + projectedPlant.biomass * 0.01).toFixed(3)),
                    vpdHistory: [
                        ...projectedPlant.vpdHistory,
                        {
                            date: new Date().toISOString(),
                            vpd,
                            status,
                        },
                    ],
                };
            }

            return Promise.resolve(projectedPlant);
        }

        return new Promise((resolve) => {
            worker.onmessage = (e: MessageEvent<VPDWorkerResponse>) => {
                if (e.data.type === 'GROWTH_RESULT') {
                    resolve(e.data.plant);
                }
            };

            worker.postMessage({
                type: 'RUN_GROWTH',
                payload: { plant, env, days },
            });
        });
    }
}

export const vpdService = new VPDSimulationService();
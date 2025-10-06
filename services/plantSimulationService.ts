import { Plant, PlantStage, GrowSetup, Strain, JournalEntry, Task, ProblemType, TaskPriority } from '@/types';

// --- SIMULATION CONSTANTS ---
const PAR_PER_WATT_LED = 2.5; // µmol/s/W (Photosynthetically Active Radiation)
const LIGHT_EXTINCTION_COEFFICIENT_K = 0.7; // For Beer-Lambert law
const BIOMASS_CONVERSION_EFFICIENCY = 0.5; // g biomass per g nutrients (abstract)
const SECONDS_PER_DAY = 86400;

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
    createPlant(strain: Strain, setup: GrowSetup, light: { wattage: number }, name: string): Plant {
        const now = Date.now();
        const waterHoldingCapacity = setup.potSize * 1000 * 0.3; // Assume 30% of pot volume is water
        return {
            id: `plant-${now}`,
            name,
            strain,
            createdAt: now,
            lastUpdated: now,
            age: 0,
            stage: PlantStage.Seed,
            health: 100,
            stressLevel: 0,
            height: 0,
            biomass: { total: 0.01, roots: 0.01, stem: 0, leaves: 0, flowers: 0 },
            leafAreaIndex: 0.01,
            isTopped: false,
            lstApplied: 0,
            environment: {
                internalTemperature: 24,
                internalHumidity: 65,
                vpd: this._calculateVPD(24, 65, -2),
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
            rootSystem: { health: 100 },
            equipment: {
                light: { isOn: true, wattage: light.wattage, lightHours: setup.lightHours },
                fan: { isOn: true, speed: 50 },
            },
            problems: [],
            journal: [],
            tasks: [],
            harvestData: null,
            structuralModel: { branches: 1, nodes: 1 },
            history: [{ day: 0, health: 100, height: 0, stressLevel: 0, medium: { ph: 6.5, ec: 0.8, moisture: 100 } }],
        };
    }
    
    // Core delta-time simulation function
    calculateStateForTimeDelta(plant: Plant, deltaTime: number): { updatedPlant: Plant, newJournalEntries: JournalEntry[], newTasks: Task[] } {
        let updatedPlant = this.clonePlant(plant);
        const newJournalEntries: JournalEntry[] = [];
        const newTasks: Task[] = [];
        const now = Date.now();

        const elapsedMillis = now - updatedPlant.lastUpdated;
        const totalMillisToSimulate = deltaTime < elapsedMillis ? elapsedMillis : deltaTime;
        const daysToSimulate = Math.floor(totalMillisToSimulate / SECONDS_PER_DAY / 1000);
        
        if (daysToSimulate < 1) {
            updatedPlant.lastUpdated = now;
            return { updatedPlant, newJournalEntries, newTasks };
        }

        for (let i = 0; i < daysToSimulate; i++) {
            // Run one full day of simulation logic
            updatedPlant.age += 1;

            // ... (full mechanistic logic would go here)
            // This is a simplified but representative implementation
            updatedPlant = this._runDailyMetabolism(updatedPlant);
            updatedPlant = this._runDailyGrowth(updatedPlant);
            updatedPlant = this._updateHealthAndStress(updatedPlant);

            const { plant: p, journalEntries: j, tasks: t } = this._checkForEvents(updatedPlant);
            updatedPlant = p;
            newJournalEntries.push(...j);
            newTasks.push(...t);

            // Record history
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

    private _runDailyMetabolism(plant: Plant): Plant {
        const p = this.clonePlant(plant);
        
        // 1. Environment & VPD
        p.environment.vpd = this._calculateVPD(p.environment.internalTemperature, p.environment.internalHumidity, -2);
        
        // 2. Transpiration (driven by VPD and plant size)
        const vpd = p.environment.vpd;
        const vpdOptimum = (p.strain.geneticModifiers.vpdTolerance.min + p.strain.geneticModifiers.vpdTolerance.max) / 2;
        const vpdStressFactor = 1 - Math.abs(vpd - vpdOptimum);
        const transpirationRate = p.biomass.leaves * p.strain.geneticModifiers.transpirationFactor * vpdStressFactor;
        
        const waterUsed = Math.min(p.medium.substrateWater, transpirationRate * 100); // 100 is an arbitrary factor
        p.medium.substrateWater -= waterUsed;
        const waterCapacity = p.equipment.light.wattage * 1000 * 0.3; // Simplification
        p.medium.moisture = (p.medium.substrateWater / waterCapacity) * 100;

        // 3. Nutrient Uptake (driven by water uptake and root health)
        const uptakeFactor = p.strain.geneticModifiers.nutrientUptakeRate * (p.rootSystem.health / 100);
        const nutrientDemand = p.biomass.total * 0.05; // Plant wants 5% of its mass in nutrients daily
        const availableNutrients = waterUsed * p.medium.ec * uptakeFactor;
        
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
        
        // 4. Photosynthesis & Biomass Accumulation
        const dailyLightIntegral = (p.equipment.light.wattage * PAR_PER_WATT_LED * p.equipment.light.lightHours * 3600) / 1000000; // mol/m²/day
        const lightAbsorbed = 1 - Math.exp(-LIGHT_EXTINCTION_COEFFICIENT_K * p.leafAreaIndex);
        const potentialBiomassGain = (dailyLightIntegral / 4) * lightAbsorbed * p.strain.geneticModifiers.rue; // Simplified conversion from DLI to MJ
        
        // 5. Growth Limiting Factors
        const nutrientSupply = (p.nutrientPool.nitrogen + p.nutrientPool.phosphorus + p.nutrientPool.potassium) * BIOMASS_CONVERSION_EFFICIENCY;
        const actualBiomassGain = Math.min(potentialBiomassGain, nutrientSupply) * (p.health / 100);
        
        // 6. Partition Biomass
        const partition = PLANT_STAGE_DETAILS[p.stage].biomassPartitioning;
        const gainedRoots = actualBiomassGain * partition.roots;
        const gainedStem = actualBiomassGain * partition.stem;
        const gainedLeaves = actualBiomassGain * partition.leaves;
        const gainedFlowers = actualBiomassGain * partition.flowers;
        
        p.biomass.total += actualBiomassGain;
        p.biomass.roots += gainedRoots;
        p.biomass.stem += gainedStem;
        p.biomass.leaves += gainedLeaves;
        p.biomass.flowers += gainedFlowers;
        
        // Update other metrics
        p.height = p.biomass.stem * 20; // Simplification
        p.leafAreaIndex = p.biomass.leaves * 0.05; // Simplification

        // Consume nutrients from pool
        const consumedNutrients = actualBiomassGain / BIOMASS_CONVERSION_EFFICIENCY;
        const ratio = PLANT_STAGE_DETAILS[p.stage].nutrientRatio;
        const totalRatio = ratio.n + ratio.p + ratio.k;
        if(totalRatio > 0) {
            p.nutrientPool.nitrogen -= consumedNutrients * (ratio.n / totalRatio);
            p.nutrientPool.phosphorus -= consumedNutrients * (ratio.p / totalRatio);
            p.nutrientPool.potassium -= consumedNutrients * (ratio.k / totalRatio);
        }

        return p;
    }

    private _updateHealthAndStress(plant: Plant): Plant {
        const p = this.clonePlant(plant);
        const ideal = PLANT_STAGE_DETAILS[p.stage].idealVitals;
        let stress = 0;
        
        // VPD stress
        if(p.environment.vpd < ideal.vpd.min || p.environment.vpd > ideal.vpd.max) stress += 10;
        // PH stress
        if(p.medium.ph < ideal.ph.min || p.medium.ph > ideal.ph.max) stress += 15;
        // EC stress
        if(p.medium.ec < ideal.ec.min || p.medium.ec > ideal.ec.max) stress += 10;
        // Water stress
        if(p.medium.moisture < 20) stress += 20;
        if(p.medium.moisture > 98) stress += 5; // Overwatering
        
        p.stressLevel = Math.min(100, p.stressLevel * 0.8 + stress); // Stress decays but also accumulates
        p.health = Math.max(0, 100 - p.stressLevel);

        return p;
    }
    
    private _checkForEvents(plant: Plant): { plant: Plant, journalEntries: JournalEntry[], tasks: Task[] } {
        const p = this.clonePlant(plant);
        const journalEntries: JournalEntry[] = [];
        const tasks: Task[] = [];
        
        if (p.medium.moisture < 30 && !p.tasks.some(t => t.title === 'Task: Water Plant')) {
            tasks.push({ id: `task-water-${p.id}`, title: 'Task: Water Plant', description: `${p.name} is thirsty!`, isCompleted: false, createdAt: Date.now(), priority: 'high' });
        }
        
        return { plant: p, journalEntries, tasks };
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
    
    // Action handlers
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

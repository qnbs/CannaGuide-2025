import { Plant, PlantStage, PlantProblem, GrowSetup, Task, PlantShoot, PlantNode, WaterSource, JournalEntry } from '@/types';

// --- Constants & Stage Details ---

type StageDetails = {
    duration: number; // in days, Infinity for final stages
    idealVitals: {
        ph: { min: number; max: number };
        ec: { min: number; max: number };
    };
    idealEnvironment: {
        vpd: { min: number; max: number }; // Vapor Pressure Deficit in kPa
        temperature: { min: number; max: number };
        humidity: { min: number; max: number };
    };
    dailyWaterRequirement: number; // ml per day per unit of biomass
    baseGrowthRate: number; // abstract growth potential
    co2ConsumptionFactor: number; // relative
};

export const PLANT_STAGE_DETAILS: Record<PlantStage, StageDetails> = {
    [PlantStage.Seed]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.4 } }, idealEnvironment: { vpd: { min: 0.4, max: 0.8 }, temperature: { min: 22, max: 25 }, humidity: { min: 70, max: 80 } }, dailyWaterRequirement: 10, baseGrowthRate: 0, co2ConsumptionFactor: 0.1 },
    [PlantStage.Germination]: { duration: 5, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.4 } }, idealEnvironment: { vpd: { min: 0.4, max: 0.8 }, temperature: { min: 22, max: 25 }, humidity: { min: 70, max: 80 } }, dailyWaterRequirement: 20, baseGrowthRate: 0.1, co2ConsumptionFactor: 0.2 },
    [PlantStage.Seedling]: { duration: 14, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.4, max: 0.8 } }, idealEnvironment: { vpd: { min: 0.4, max: 0.8 }, temperature: { min: 20, max: 25 }, humidity: { min: 60, max: 70 } }, dailyWaterRequirement: 50, baseGrowthRate: 0.5, co2ConsumptionFactor: 0.5 },
    [PlantStage.Vegetative]: { duration: 28, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.8, max: 1.6 } }, idealEnvironment: { vpd: { min: 0.8, max: 1.2 }, temperature: { min: 22, max: 28 }, humidity: { min: 50, max: 70 } }, dailyWaterRequirement: 100, baseGrowthRate: 1.5, co2ConsumptionFactor: 1.0 },
    [PlantStage.Flowering]: { duration: 56, idealVitals: { ph: { min: 6.0, max: 6.8 }, ec: { min: 1.2, max: 2.2 } }, idealEnvironment: { vpd: { min: 1.2, max: 1.6 }, temperature: { min: 20, max: 26 }, humidity: { min: 40, max: 50 } }, dailyWaterRequirement: 150, baseGrowthRate: 1.0, co2ConsumptionFactor: 1.2 },
    [PlantStage.Harvest]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0.4 } }, idealEnvironment: { vpd: { min: 1.0, max: 1.4 }, temperature: { min: 18, max: 22 }, humidity: { min: 45, max: 55 } }, dailyWaterRequirement: 0, baseGrowthRate: 0, co2ConsumptionFactor: 0 },
    [PlantStage.Drying]: { duration: 10, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } }, idealEnvironment: { vpd: { min: 0, max: 0}, temperature: { min: 18, max: 20 }, humidity: { min: 50, max: 60 } }, dailyWaterRequirement: 0, baseGrowthRate: 0, co2ConsumptionFactor: 0 },
    [PlantStage.Curing]: { duration: 21, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } }, idealEnvironment: { vpd: { min: 0, max: 0}, temperature: { min: 18, max: 20 }, humidity: { min: 58, max: 62 } }, dailyWaterRequirement: 0, baseGrowthRate: 0, co2ConsumptionFactor: 0 },
    [PlantStage.Finished]: { duration: Infinity, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } }, idealEnvironment: { vpd: { min: 0, max: 0}, temperature: { min: 0, max: 0 }, humidity: { min: 0, max: 0 } }, dailyWaterRequirement: 0, baseGrowthRate: 0, co2ConsumptionFactor: 0 },
};

const STAGES_ORDER = Object.keys(PLANT_STAGE_DETAILS) as PlantStage[];
const AMBIENT_CO2 = 410; // ppm

// --- Helper Functions ---

const calculateSVP = (temp: number): number => 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
const calculateVPD = (temp: number, rh: number): number => calculateSVP(temp) * (1 - (rh / 100));

const getDeviationFactor = (value: number, min: number, max: number): number => {
    if (value >= min && value <= max) return 1.0;
    const range = max - min;
    const deviation = value < min ? min - value : value - max;
    return Math.max(0, 1 - (deviation / (range * 0.5))); // Penalize deviation more harshly
};

const addProblem = (plant: Plant, type: PlantProblem['type'], severity: PlantProblem['severity'] = 'Low'): Plant => {
    if (!plant.problems.some(p => p.type === type && p.status === 'active')) {
        plant.problems.push({
            type,
            status: 'active',
            startedAt: plant.age,
            severity,
        });
    }
    return plant;
};

// --- Core Simulation Logic ---

let updatedPlant: Plant;

const updateEnvironment = (plant: Plant): Plant => {
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];
    let internalTemp = plant.environment.ambientTemperature;
    let internalHumidity = plant.environment.ambientHumidity;

    // Light heat
    if (plant.equipment.light.isOn) {
        internalTemp += (plant.equipment.light.wattage / 100);
    }
    
    // Fan cooling/dehumidifying
    const fanEffect = (plant.equipment.exhaustFan.speed * plant.equipment.exhaustFan.cfm) / 500;
    internalTemp -= fanEffect * 2;
    internalHumidity -= fanEffect * 5;

    // Plant transpiration adds humidity
    internalHumidity += plant.vitals.transpirationRate / 10;
    
    plant.environment.internalTemperature = Math.max(10, Math.min(40, internalTemp));
    plant.environment.internalHumidity = Math.max(10, Math.min(99, internalHumidity));

    // CO2 Dynamics
    if(plant.equipment.light.isOn) {
        const co2Consumed = plant.vitals.photosynthesisRate * 10 * stageDetails.co2ConsumptionFactor;
        plant.environment.co2Level -= co2Consumed;
    }
    const co2Replenished = (plant.environment.airExchangeRate / 100) * (AMBIENT_CO2 - plant.environment.co2Level);
    plant.environment.co2Level = Math.max(200, plant.environment.co2Level + co2Replenished);
    
    return plant;
};

const updateHormonesAndLifecycle = (plant: Plant): Plant => {
    plant.internalClock += 1;
    const strain = plant.strain;
    let shouldFlower = false;

    if (strain.floweringType === 'Autoflower' && plant.stage === PlantStage.Vegetative) {
        if (plant.internalClock > (strain.floweringTime * 7 * 0.5)) { // Rough estimate for autoflower trigger
            shouldFlower = true;
        }
    } else if (strain.floweringType === 'Photoperiod' && plant.stage === PlantStage.Vegetative) {
        // This is triggered by light cycle change, so we check for florigen level
    }

    if (shouldFlower) {
        plant.hormoneLevels.florigen += 0.2;
    }

    if (plant.hormoneLevels.florigen >= 1.0 && plant.stage === PlantStage.Vegetative) {
        plant.stage = PlantStage.Flowering;
        plant.journal.push({ id: `journal-${Date.now()}`, type: 'SYSTEM', notes: `Plant entered ${plant.stage} stage.`, createdAt: Date.now() });
        // Trigger the stretch
        plant.geneticModifiers.growthSpeedFactor *= 1.5;
    }

    // End stretch after 2 weeks of flowering
    if (plant.stage === PlantStage.Flowering && plant.history.filter(h => h.stage === PlantStage.Flowering).length === 14) {
         plant.geneticModifiers.growthSpeedFactor /= 1.5;
    }

    return plant;
};

const calculateLightExposure = (plant: Plant): Plant => {
    // Simplified model: Traverse nodes from top to bottom, reducing light for lower nodes.
    const allNodes: {node: PlantNode, depth: number}[] = [];
    
    const traverse = (shoot: PlantShoot, depth: number) => {
        shoot.nodes.forEach(node => {
            allNodes.push({ node, depth });
            node.shoots.forEach(childShoot => traverse(childShoot, depth + 1));
        });
    };
    traverse(plant.structuralModel, 0);
    allNodes.sort((a, b) => a.depth - b.depth);

    let cumulativeShadow = 0;
    allNodes.forEach(({ node }) => {
        node.lightExposure = Math.max(0.1, 1 - cumulativeShadow);
        cumulativeShadow += 0.05; // Each node layer casts some shadow
    });

    return plant;
};

const calculateMetabolism = (plant: Plant): Plant => {
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];

    // Photosynthesis
    const avgLightExposure = plant.structuralModel.nodes.reduce((sum, node) => sum + node.lightExposure, 0) / (plant.structuralModel.nodes.length || 1);
    const co2Factor = getDeviationFactor(plant.environment.co2Level, 300, 1500);
    plant.vitals.photosynthesisRate = Math.max(0, avgLightExposure * co2Factor * (plant.health / 100));

    // Water & Nutrient Uptake
    const vpd = calculateVPD(plant.environment.internalTemperature, plant.environment.internalHumidity);
    const vpdFactor = getDeviationFactor(vpd, stageDetails.idealEnvironment.vpd.min, stageDetails.idealEnvironment.vpd.max);
    
    const waterDemand = stageDetails.dailyWaterRequirement * plant.biomass * vpdFactor;
    const waterAvailable = (plant.substrate.moisture / 100) * 1000 * plant.substrate.volumeLiters; // simplified
    const waterUptake = Math.min(waterDemand, waterAvailable);

    // Nutrient Lockout & Burn
    const phFactor = getDeviationFactor(plant.substrate.ph, stageDetails.idealVitals.ph.min, stageDetails.idealVitals.ph.max);
    let ecFactor = getDeviationFactor(plant.substrate.ec, stageDetails.idealVitals.ec.min, stageDetails.idealVitals.ec.max);

    if (plant.substrate.ec > 2.5) { // Nutrient Burn
        ecFactor *= 0.5;
        plant = addProblem(plant, 'NutrientBurn');
    }
    
    const nutrientUptake = waterUptake * plant.substrate.ec * phFactor * ecFactor * (plant.rootSystem.rootHealth / 100);

    plant.substrate.moisture -= (waterUptake / (plant.substrate.volumeLiters * 10));
    plant.substrate.ec = Math.max(0.1, plant.substrate.ec - (nutrientUptake / 1000));
    
    return plant;
};

const calculateGrowth = (plant: Plant): Plant => {
    const energy = plant.vitals.photosynthesisRate * plant.geneticModifiers.growthSpeedFactor;
    
    // Allocate energy
    const toRoots = energy * 0.3;
    const toStructure = energy * 0.7;

    // Root growth
    plant.rootSystem.rootMass += toRoots * 0.1;

    // Structural growth
    plant.biomass += toStructure;
    plant.height = plant.structuralModel.length;

    // Find all active shoots (not topped)
    const activeShoots: PlantShoot[] = [];
    const findActiveShoots = (shoot: PlantShoot) => {
        if (!shoot.nodes.some(n => n.isTopped)) {
            activeShoots.push(shoot);
        }
        shoot.nodes.forEach(node => node.shoots.forEach(findActiveShoots));
    };
    findActiveShoots(plant.structuralModel);
    
    // Apical Dominance
    activeShoots.forEach(shoot => {
        const growthAmount = (toStructure * (shoot.isMainStem ? 1.5 : 1)) / activeShoots.length;
        shoot.length += growthAmount;
    });

    // Add new nodes
    plant.structuralModel.length = Math.round(plant.structuralModel.length);
    if (plant.structuralModel.length > plant.structuralModel.nodes.length + 2) {
        plant.structuralModel.nodes.push({ id: `node-${plant.id}-${Date.now()}`, position: plant.structuralModel.nodes.length + 1, lightExposure: 1, isTopped: false, shoots: [] });
    }

    return plant;
};

const updateHealthAndStress = (plant: Plant): Plant => {
    let stress = 0;
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];

    // Environmental stress
    stress += (1 - getDeviationFactor(plant.environment.internalTemperature, stageDetails.idealEnvironment.temperature.min, stageDetails.idealEnvironment.temperature.max)) * 20;
    stress += (1 - getDeviationFactor(plant.environment.internalHumidity, stageDetails.idealEnvironment.humidity.min, stageDetails.idealEnvironment.humidity.max)) * 20;

    // Substrate stress
    stress += (1 - getDeviationFactor(plant.substrate.ph, stageDetails.idealVitals.ph.min, stageDetails.idealVitals.ph.max)) * 20;
    stress += (1 - getDeviationFactor(plant.substrate.ec, stageDetails.idealVitals.ec.min, stageDetails.idealVitals.ec.max)) * 20;
    if(plant.substrate.moisture < 20) stress += 30;
    if(plant.substrate.moisture > 95) {
        stress += 20;
        plant.rootSystem.rootHealth -= 5; // Risk of root rot
    }

    // Root bound stress
    if ((plant.rootSystem.rootMass / plant.substrate.volumeLiters) > 1.5) {
        stress += 25;
    }

    plant.stressLevel = Math.max(0, Math.min(100, stress * plant.geneticModifiers.stressToleranceFactor));
    
    // Health update
    if (plant.stressLevel > 50) {
        plant.health -= (plant.stressLevel - 50) / 10;
    } else {
        plant.health += (50 - plant.stressLevel) / 20;
    }
    plant.health = Math.max(0, Math.min(100, plant.health));

    return plant;
};

const updateHistory = (plant: Plant): Plant => {
    plant.history.push({
        day: plant.age,
        stage: plant.stage,
        height: plant.height,
        stressLevel: plant.stressLevel,
        substrate: { 
            ph: plant.substrate.ph, 
            ec: plant.substrate.ec, 
            moisture: plant.substrate.moisture 
        },
    });
    return plant;
};


// --- Public Service Interface ---

class PlantSimulationService {
    public runDailyCycle(plant: Plant): Plant {
        updatedPlant = { ...plant, age: plant.age + 1 };
        
        updatedPlant = updateEnvironment(updatedPlant);
        updatedPlant = updateHormonesAndLifecycle(updatedPlant);
        updatedPlant = calculateLightExposure(updatedPlant);
        updatedPlant = calculateMetabolism(updatedPlant);
        updatedPlant = calculateGrowth(updatedPlant);
        updatedPlant = updateHealthAndStress(updatedPlant);
        updatedPlant = updateHistory(updatedPlant);
        
        return updatedPlant;
    }

    public topPlant(plant: Plant): Plant {
        const findTopmostNode = (shoot: PlantShoot): PlantNode | null => {
            if (!shoot.nodes || shoot.nodes.length === 0) return null;
            let topNode = shoot.nodes[shoot.nodes.length - 1];
            for (const node of shoot.nodes) {
                for (const childShoot of node.shoots) {
                    const childTopNode = findTopmostNode(childShoot);
                    if (childTopNode && childTopNode.position > topNode.position) { // Simplistic depth check
                        topNode = childTopNode;
                    }
                }
            }
            return topNode;
        };

        const topNode = findTopmostNode(plant.structuralModel);
        if (topNode) {
            topNode.isTopped = true;
            // Simplified: add two new shoots at the node below
            // A real implementation would be more complex
        }
        return plant;
    }
}

export const simulationService = new PlantSimulationService();
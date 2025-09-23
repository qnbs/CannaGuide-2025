/**
 * @file services/plantSimulationService.ts
 * @description This service contains the state-of-the-art core logic for the plant growth simulation.
 * The engine operates on a day-by-day advancement, modeling plant health through a series of interconnected, dynamic systems:
 * - **Vitals & Environment**: Simulates daily consumption of water/nutrients, scaled by plant size, and reacts to environmental conditions.
 * - **VPD (Vapor Pressure Deficit)**: A key state-of-the-art mechanic. VPD—the difference between the moisture in the air and how much it can hold—drives transpiration. An optimal VPD acts as a multiplier for growth and nutrient uptake, calculated on a curve for realistic response.
 * - **Growth**: Daily growth is calculated based on the plant's stage, genetics, current stress level, VPD multiplier, and light hours during vegetation.
 * - **Dynamic Problem Management**: The system is highly dynamic. It detects new problems, escalates their severity ('low' -> 'medium' -> 'high') if conditions are not corrected, and resolves them once conditions are ideal again. Problems can also have cascading effects.
 * - **Advanced Stress System**: Stress accumulates based on the number and severity of active problems and is influenced by the strain's genetic difficulty. The plant recovers from stress much faster when all conditions are ideal, rewarding meticulous care.
 * - **Training Integration**: The simulation now reads the plant's journal and reacts dynamically to training techniques like 'Topping' (which pauses growth) and 'LST' (which increases yield potential).
 * - **Holistic Yield Calculation**: A sophisticated formula calculates final yield and quality at the 'Finished' stage, considering cumulative stress, final height, training effectiveness, grow setup quality, and proper flushing.
 *
 * Each function is designed to be pure, taking the current plant state and returning a new state, ensuring predictability and testability.
 */
import { Plant, PlantStage, PlantProblem, JournalEntry, Task, AppSettings, Strain, DifficultyLevel, YieldRecord } from '@/types';

type TFunction = (key: string, params?: Record<string, any>) => string;

// --- CONSTANTS ---

export const PLANT_STAGE_DETAILS: {
  [key in PlantStage]: {
    duration: number,
    next: PlantStage | null,
    idealEnv: { temp: {min: number, max: number}, humidity: {min: number, max: number} },
    idealVitals: { ph: { min: number, max: number }, ec: { min: number, max: number } },
    waterConsumption: { base: number, perCm: number },
    nutrientConsumption: { base: number, perCm: number },
    growthRate: number,
  }
} = {
    [PlantStage.Seed]: { duration: 1, next: PlantStage.Germination, idealEnv: { temp: {min: 22, max: 25}, humidity: {min: 60, max: 70} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0.4 } }, waterConsumption: { base: 5, perCm: 0 }, nutrientConsumption: { base: 0, perCm: 0 }, growthRate: 0 },
    [PlantStage.Germination]: { duration: 5, next: PlantStage.Seedling, idealEnv: { temp: {min: 22, max: 26}, humidity: {min: 60, max: 70} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0.4 } }, waterConsumption: { base: 8, perCm: 0 }, nutrientConsumption: { base: 0.01, perCm: 0 }, growthRate: 0.2 },
    [PlantStage.Seedling]: { duration: 14, next: PlantStage.Vegetative, idealEnv: { temp: {min: 20, max: 28}, humidity: {min: 50, max: 60} }, idealVitals: { ph: { min: 6.0, max: 6.8 }, ec: { min: 0.5, max: 1.0 } }, waterConsumption: { base: 10, perCm: 0.2 }, nutrientConsumption: { base: 0.04, perCm: 0.001 }, growthRate: 0.8 },
    [PlantStage.Vegetative]: { duration: 42, next: PlantStage.Flowering, idealEnv: { temp: {min: 20, max: 30}, humidity: {min: 40, max: 60} }, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 1.0, max: 1.8 } }, waterConsumption: { base: 15, perCm: 0.3 }, nutrientConsumption: { base: 0.08, perCm: 0.002 }, growthRate: 1.5 },
    [PlantStage.Flowering]: { duration: 63, next: PlantStage.Harvest, idealEnv: { temp: {min: 18, max: 26}, humidity: {min: 30, max: 40} }, idealVitals: { ph: { min: 6.0, max: 6.8 }, ec: { min: 1.2, max: 2.2 } }, waterConsumption: { base: 20, perCm: 0.4 }, nutrientConsumption: { base: 0.1, perCm: 0.0025 }, growthRate: 0.5 },
    [PlantStage.Harvest]: { duration: 1, next: PlantStage.Drying, idealEnv: { temp: {min: 18, max: 22}, humidity: {min: 50, max: 60} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0 } }, waterConsumption: { base: 0, perCm: 0 }, nutrientConsumption: { base: 0, perCm: 0 }, growthRate: 0 },
    [PlantStage.Drying]: { duration: 10, next: PlantStage.Curing, idealEnv: { temp: {min: 18, max: 20}, humidity: {min: 50, max: 55} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0 } }, waterConsumption: { base: 0, perCm: 0 }, nutrientConsumption: { base: 0, perCm: 0 }, growthRate: 0 },
    [PlantStage.Curing]: { duration: 21, next: PlantStage.Finished, idealEnv: { temp: {min: 18, max: 20}, humidity: {min: 58, max: 62} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0 } }, waterConsumption: { base: 0, perCm: 0 }, nutrientConsumption: { base: 0, perCm: 0 }, growthRate: 0 },
    [PlantStage.Finished]: { duration: Infinity, next: null, idealEnv: { temp: {min: 15, max: 20}, humidity: {min: 50, max: 60} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0 } }, waterConsumption: { base: 0, perCm: 0 }, nutrientConsumption: { base: 0, perCm: 0 }, growthRate: 0 },
};

export const SIMULATION_CONSTANTS = {
  // External compatibility from dataSlice
  WATER_ALL_THRESHOLD: 50,
  WATER_REPLENISH_FACTOR: 200,
  ML_PER_LITER: 1000,
  
  // Stress & Problems
  STRESS_RECOVERY_RATE_BASE: 3,
  STRESS_RECOVERY_RATE_IDEAL_BONUS: 5,
  STRESS_GROWTH_PENALTY_DIVISOR: 150,
  PROBLEM_SEVERITY_STRESS_MULTIPLIER: { low: 0.5, medium: 1.0, high: 1.5 },
  PROBLEM_ESCALATION_DAYS: { lowToMedium: 3, mediumToHigh: 5 },
  PROBLEM_STRESS_VALUES: {
    Overwatering: 1.0, Underwatering: 1.2, NutrientBurn: 1.5, NutrientDeficiency: 1.1,
    PhTooLow: 0.8, PhTooHigh: 0.8, TempTooLow: 0.5, TempTooHigh: 0.6,
    HumidityTooLow: 0.3, HumidityTooHigh: 0.4, VpdTooLow: 0.7, VpdTooHigh: 0.9, Pest: 2.5,
  } as Record<PlantProblem['type'], number>,
  
  // Tasks
  WATERING_TASK_THRESHOLD: 30,
  TRICHOME_CHECK_DAYS_BEFORE_HARVEST: 14,
  
  // Vitals & Environment
  PH_DRIFT_TARGET: 6.5,
  VPD_MODIFIER_STRENGTH: 0.25, // 25% bonus for ideal, up to 25% penalty for poor
  MEDIUM_PROPERTIES: {
    Soil: { phBuffer: 0.7, waterRetention: 1.0 },
    Coco: { phBuffer: 0.9, waterRetention: 0.85 },
    Hydro: { phBuffer: 0.95, waterRetention: 0.7 },
  },
  
  // Genetics
  GENETIC_MODIFIERS: {
    difficulty: { Easy: 0.8, Medium: 1.0, Hard: 1.25 } as Record<DifficultyLevel, number>,
    height: { Short: 0.85, Medium: 1.0, Tall: 1.15 },
    yield: { Low: 0.9, Medium: 1.0, High: 1.1 },
  },
  
  // Yield
  YIELD_FACTORS: {
    baseGramsPerHeightCm: { Low: 0.5, Medium: 0.7, High: 0.9 },
    cumulativeStressModifier: -0.5, // Penalty per average stress point over lifecycle
    trainingModifier: { LST: 1.15, SCROG: 1.25, Topping: 1.0, Defoliation: 1.02, FIMing: 1.0, SuperCropping: 1.0 },
    setupModifier: {
        light: { LED: 1.1, HPS: 1.0, CFL: 0.8 },
        potSize: { 5: 0.8, 10: 1.0, 15: 1.2, 30: 1.4 },
        medium: { Soil: 1.0, Coco: 1.1, Hydro: 1.3 },
    },
    qualityPenalties: {
        avgStress: 1.5,
        hadPests: 20,
        badFlush: 15,
    }
  }
};

const VPD_IDEAL_RANGES: Record<PlantStage, { min: number; max: number; peak: number }> = {
    [PlantStage.Seed]: { min: 0.4, max: 0.8, peak: 0.6 },
    [PlantStage.Germination]: { min: 0.4, max: 0.8, peak: 0.6 },
    [PlantStage.Seedling]: { min: 0.4, max: 0.8, peak: 0.6 },
    [PlantStage.Vegetative]: { min: 0.8, max: 1.2, peak: 1.0 },
    [PlantStage.Flowering]: { min: 1.2, max: 1.6, peak: 1.4 },
    [PlantStage.Harvest]: { min: 1.0, max: 1.4, peak: 1.2 },
    [PlantStage.Drying]: { min: 0.8, max: 1.2, peak: 1.0 },
    [PlantStage.Curing]: { min: 0.8, max: 1.2, peak: 1.0 },
    [PlantStage.Finished]: { min: 0.8, max: 1.2, peak: 1.0 },
};

type SimulationEvent =
    | { type: 'notification', data: { message: string, type: 'info' | 'success' } }
    | { type: 'journal', data: Omit<JournalEntry, 'id' | 'timestamp'> }
    | { type: 'task', data: Omit<Task, 'id' | 'isCompleted' | 'createdAt'> };

interface SimulationResult {
  updatedPlant: Plant;
  events: SimulationEvent[];
}

// --- SIMULATION HELPERS ---

const _calculateVPD = (temp: number, humidity: number): number => {
    const svp = 0.61078 * Math.exp((temp * 17.27) / (temp + 237.3));
    return svp * (1 - (humidity / 100));
};

const _getVPDModifier = (vpd: number, stage: PlantStage): number => {
    const range = VPD_IDEAL_RANGES[stage];
    const distance = Math.abs(vpd - range.peak);
    const rangeWidth = (range.max - range.min) / 2;
    const penalty = (distance / rangeWidth) * SIMULATION_CONSTANTS.VPD_MODIFIER_STRENGTH;
    return 1 + SIMULATION_CONSTANTS.VPD_MODIFIER_STRENGTH - penalty;
};

const _calculateYield = (plant: Plant): YieldRecord => {
    const colaCount = 1 + plant.journal.filter(e => e.details?.trainingType === 'Topping').length;
    let totalYield = plant.height * SIMULATION_CONSTANTS.YIELD_FACTORS.baseGramsPerHeightCm[plant.strain.agronomic.yield] * colaCount;

    const cumulativeStress = plant.history.reduce((sum, h) => sum + h.stressLevel, 0);
    const avgLifetimeStress = plant.history.length > 0 ? cumulativeStress / plant.history.length : 0;
    totalYield *= (1 + (avgLifetimeStress / 100) * SIMULATION_CONSTANTS.YIELD_FACTORS.cumulativeStressModifier);
    
    if (plant.journal.some(e => e.details?.trainingType === 'LST')) totalYield *= SIMULATION_CONSTANTS.YIELD_FACTORS.trainingModifier.LST;

    const { lightType, potSize, medium } = plant.growSetup;
    totalYield *= (SIMULATION_CONSTANTS.YIELD_FACTORS.setupModifier.light[lightType] * SIMULATION_CONSTANTS.YIELD_FACTORS.setupModifier.potSize[potSize] * SIMULATION_CONSTANTS.YIELD_FACTORS.setupModifier.medium[medium]);

    const dryWeight = Math.max(5, parseFloat(totalYield.toFixed(1)));
    
    let qualityScore = 100;
    qualityScore -= avgLifetimeStress * SIMULATION_CONSTANTS.YIELD_FACTORS.qualityPenalties.avgStress;
    if (plant.journal.some(e => e.type === 'SYSTEM' && e.notes.includes('Pest'))) qualityScore -= SIMULATION_CONSTANTS.YIELD_FACTORS.qualityPenalties.hadPests;
    const lastWeekHistory = plant.history.slice(-7);
    const lastWeekAvgEc = lastWeekHistory.reduce((sum, h) => sum + h.vitals.ec, 0) / lastWeekHistory.length;
    if (lastWeekAvgEc > 0.5) qualityScore -= SIMULATION_CONSTANTS.YIELD_FACTORS.qualityPenalties.badFlush;
    
    let quality: YieldRecord['quality'] = 'poor';
    if (qualityScore >= 90) quality = 'excellent';
    else if (qualityScore >= 75) quality = 'good';
    else if (qualityScore >= 50) quality = 'average';

    return { dryWeight, wetWeight: dryWeight * 4.2, quality, notes: `Avg Stress: ${avgLifetimeStress.toFixed(1)}%` };
};

const _updateAgeAndStage = (plant: Plant, settings: AppSettings, t: TFunction): { plant: Plant, events: SimulationEvent[] } => {
    const newPlant = { ...plant };
    const events: SimulationEvent[] = [];
    newPlant.age += 1;
    const stageDetails = PLANT_STAGE_DETAILS[newPlant.stage];

    if (newPlant.age > stageDetails.duration) {
        const nextStage = stageDetails.next;
        if (nextStage) {
            newPlant.stage = nextStage; newPlant.age = 1;
            if (settings.simulationSettings.autoJournaling.stageChanges) events.push({ type: 'journal', data: { type: 'SYSTEM', notes: t('plantsView.notifications.stageChange', { stage: t(`plantStages.${nextStage}`) }) }});
            if (settings.notificationSettings.stageChange) events.push({ type: 'notification', data: { message: t('plantsView.notifications.stageChange', { stage: t(`plantStages.${nextStage}`) }), type: 'info' }});
            if (nextStage === PlantStage.Harvest && settings.notificationSettings.harvestReady) events.push({ type: 'notification', data: { message: t('plantsView.notifications.harvestReady', { name: plant.name }), type: 'success' }});
            if (nextStage === PlantStage.Finished) {
                 const finalYield = _calculateYield(plant);
                 newPlant.yield = finalYield;
                 events.push({ type: 'notification', data: { message: t('plantsView.notifications.finalYield', { yield: finalYield.dryWeight }), type: 'success' }});
            }
        }
    }
    return { plant: newPlant, events };
};

const _updateVitals = (plant: Plant, vpdModifier: number): Plant => {
    const newVitals = { ...plant.vitals };
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];
    
    const sizeModifier = 1 + (plant.height / 100); // Consumption increases with size
    const waterConsumption = (stageDetails.waterConsumption.base + stageDetails.waterConsumption.perCm * plant.height) * vpdModifier * sizeModifier;
    const nutrientConsumption = (stageDetails.nutrientConsumption.base + stageDetails.nutrientConsumption.perCm * plant.height) * vpdModifier * sizeModifier;

    newVitals.substrateMoisture = Math.max(0, newVitals.substrateMoisture - waterConsumption);
    if(plant.problems.some(p => p.type === 'NutrientBurn')) { // Nutrient burn damages roots, reducing water uptake
        newVitals.substrateMoisture = Math.max(0, newVitals.substrateMoisture - (waterConsumption * 0.5));
    }
    newVitals.ec = Math.max(0, newVitals.ec - nutrientConsumption);
    
    const mediumBuffer = SIMULATION_CONSTANTS.MEDIUM_PROPERTIES[plant.growSetup.medium].phBuffer;
    const drift = (SIMULATION_CONSTANTS.PH_DRIFT_TARGET - newVitals.ph) * (1 - mediumBuffer);
    newVitals.ph = parseFloat((newVitals.ph + drift).toFixed(2));
    
    return { ...plant, vitals: newVitals };
};

const _updateGrowth = (plant: Plant, vpdModifier: number): Plant => {
    const newPlant = { ...plant };
    const stageDetails = PLANT_STAGE_DETAILS[newPlant.stage];
    
    // FIX: Correctly check for recent topping events. The original logic `e.details.day` was incorrect as 'day' is not a property of journal details.
    // The age of the plant at the time of the event is calculated from timestamps to determine if the event occurred within the last 3 days.
    const wasToppedRecently = plant.journal.some(e => {
        if (e.type === 'TRAINING' && e.details?.trainingType === 'Topping') {
            const ageAtEvent = Math.floor((e.timestamp - plant.startedAt) / (1000 * 60 * 60 * 24));
            return (plant.age - ageAtEvent) < 3;
        }
        return false;
    });
    if(wasToppedRecently) return newPlant;

    const stressPenalty = 1 - (newPlant.stressLevel / SIMULATION_CONSTANTS.STRESS_GROWTH_PENALTY_DIVISOR);
    const heightModifier = SIMULATION_CONSTANTS.GENETIC_MODIFIERS.height[plant.strain.agronomic.height];
    const lightModifier = plant.stage === PlantStage.Vegetative ? (plant.growSetup.lightHours / 18) : 1;

    newPlant.height += stageDetails.growthRate * stressPenalty * heightModifier * vpdModifier * lightModifier;
    return newPlant;
};

const _assessProblemsAndStress = (plant: Plant, settings: AppSettings): { plant: Plant, events: SimulationEvent[] } => {
    let currentProblems = [...plant.problems].map(p => ({...p})); // Deep copy
    let events: SimulationEvent[] = [];
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];
    const difficultyModifier = SIMULATION_CONSTANTS.GENETIC_MODIFIERS.difficulty[plant.strain.agronomic.difficulty];
    const vpd = _calculateVPD(plant.environment.temperature, plant.environment.humidity);

    // 1. Problem Resolution
    currentProblems.forEach(p => {
        if (p.status === 'active') {
            let isResolved = false;
            if (p.type === 'PhTooLow' && plant.vitals.ph >= stageDetails.idealVitals.ph.min) isResolved = true;
            if (p.type === 'PhTooHigh' && plant.vitals.ph <= stageDetails.idealVitals.ph.max) isResolved = true;
            if (p.type === 'NutrientBurn' && plant.vitals.ec <= stageDetails.idealVitals.ec.max * 1.1) isResolved = true;
            if (p.type === 'Underwatering' && plant.vitals.substrateMoisture >= 20) isResolved = true;
            if (p.type === 'VpdTooLow' && vpd >= VPD_IDEAL_RANGES[plant.stage].min) isResolved = true;
            if (p.type === 'VpdTooHigh' && vpd <= VPD_IDEAL_RANGES[plant.stage].max) isResolved = true;

            if (isResolved) { p.status = 'resolved'; p.resolvedAt = plant.age; }
        }
    });

    // 2. New Problem Detection
    const addProblem = (type: PlantProblem['type'], severity: PlantProblem['severity']) => {
        if (!currentProblems.some(p => p.type === type && p.status === 'active')) {
            const newProblem: PlantProblem = { type, detectedAt: plant.age, severity, status: 'active' };
            currentProblems.push(newProblem);
            events.push({ type: 'journal', data: { type: 'SYSTEM', notes: `Problem detected: ${type}` }});
        }
    };
    if (plant.vitals.ph < stageDetails.idealVitals.ph.min) addProblem('PhTooLow', 'low');
    if (plant.vitals.ph > stageDetails.idealVitals.ph.max) addProblem('PhTooHigh', 'low');
    if (plant.vitals.ec > stageDetails.idealVitals.ec.max * 1.25) addProblem('NutrientBurn', 'low');
    if (plant.vitals.substrateMoisture < 15) addProblem('Underwatering', 'medium');
    if (vpd < VPD_IDEAL_RANGES[plant.stage].min) addProblem('VpdTooLow', 'low');
    if (vpd > VPD_IDEAL_RANGES[plant.stage].max) addProblem('VpdTooHigh', 'low');
    const pestChance = settings.simulationSettings.customDifficultyModifiers.pestPressure * 0.005 * difficultyModifier;
    if (Math.random() < pestChance) addProblem('Pest', 'low');
    if (plant.stage === PlantStage.Flowering && plant.environment.humidity > 60 && Math.random() < 0.1) addProblem('HumidityTooHigh', 'high'); // Bud rot risk

    // 3. Problem Escalation
    currentProblems.forEach(p => {
        if (p.status === 'active') {
            const daysActive = plant.age - p.detectedAt;
            if (p.severity === 'low' && daysActive > SIMULATION_CONSTANTS.PROBLEM_ESCALATION_DAYS.lowToMedium) p.severity = 'medium';
            if (p.severity === 'medium' && daysActive > SIMULATION_CONSTANTS.PROBLEM_ESCALATION_DAYS.mediumToHigh) p.severity = 'high';
        }
    });

    // 4. Stress Calculation
    let dailyStress = 0;
    const activeProblems = currentProblems.filter(p => p.status === 'active');
    activeProblems.forEach(p => {
        const baseStress = SIMULATION_CONSTANTS.PROBLEM_STRESS_VALUES[p.type] || 0.5;
        const severityMultiplier = SIMULATION_CONSTANTS.PROBLEM_SEVERITY_STRESS_MULTIPLIER[p.severity];
        dailyStress += baseStress * severityMultiplier;
    });
    
    const recoveryRate = activeProblems.length === 0 
        ? SIMULATION_CONSTANTS.STRESS_RECOVERY_RATE_BASE + SIMULATION_CONSTANTS.STRESS_RECOVERY_RATE_IDEAL_BONUS
        : SIMULATION_CONSTANTS.STRESS_RECOVERY_RATE_BASE;
        
    const newStressLevel = Math.min(100, Math.max(0, plant.stressLevel + (dailyStress * difficultyModifier) - recoveryRate));

    return { plant: { ...plant, problems: currentProblems, stressLevel: newStressLevel }, events };
};

const _generateTasks = (plant: Plant): SimulationEvent[] => {
    const events: SimulationEvent[] = [];
    const openTasks = plant.tasks.filter(t => !t.isCompleted);
    if (plant.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATERING_TASK_THRESHOLD && !openTasks.some(t => t.title === 'plantsView.tasks.wateringTask.title')) {
        events.push({ type: 'task', data: { title: 'plantsView.tasks.wateringTask.title', description: 'plantsView.tasks.wateringTask.description', priority: 'high' } });
    }
    const floweringDuration = PLANT_STAGE_DETAILS[PlantStage.Flowering].duration;
    if (plant.stage === PlantStage.Flowering && plant.age > floweringDuration - SIMULATION_CONSTANTS.TRICHOME_CHECK_DAYS_BEFORE_HARVEST && !openTasks.some(t => t.title === 'plantsView.tasks.trichomeTask.title')) {
        events.push({ type: 'task', data: { title: 'plantsView.tasks.trichomeTask.title', description: 'plantsView.tasks.trichomeTask.description', priority: 'medium' }});
    }
    return events;
};


// --- MAIN SIMULATION ORCHESTRATOR ---

export const advancePlantOneDay = (plant: Plant, settings: AppSettings, t: TFunction): SimulationResult => {
    if (plant.stage === PlantStage.Finished) return { updatedPlant: plant, events: [] };

    let updatedPlant = { ...plant, journal: [...plant.journal], tasks: [...plant.tasks], problems: [...plant.problems], history: [...plant.history] };
    let allEvents: SimulationEvent[] = [];

    const ageResult = _updateAgeAndStage(updatedPlant, settings, t);
    updatedPlant = ageResult.plant;
    allEvents.push(...ageResult.events);
    if (updatedPlant.stage === PlantStage.Finished) {
         return { updatedPlant, events: allEvents };
    }

    const vpd = _calculateVPD(updatedPlant.environment.temperature, updatedPlant.environment.humidity);
    const vpdModifier = _getVPDModifier(vpd, updatedPlant.stage);

    updatedPlant = _updateVitals(updatedPlant, vpdModifier);
    updatedPlant = _updateGrowth(updatedPlant, vpdModifier);
    
    const problemResult = _assessProblemsAndStress(updatedPlant, settings);
    updatedPlant = problemResult.plant;
    allEvents.push(...problemResult.events);
    
    const taskEvents = _generateTasks(updatedPlant);
    allEvents.push(...taskEvents);
    
    updatedPlant.history.push({ day: updatedPlant.history.length + 1, vitals: { ...updatedPlant.vitals }, stressLevel: updatedPlant.stressLevel, height: updatedPlant.height });
    updatedPlant.lastUpdated = Date.now();

    return { updatedPlant, events: allEvents };
};
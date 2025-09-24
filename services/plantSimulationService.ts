import { Plant, PlantStage, AppSettings, PlantHistoryEntry } from '@/types';
import { STAGES_ORDER } from '@/constants';

// A simple TFunction type to avoid circular dependencies if this file were to import from the store.
type TFunction = (key: string, params?: Record<string, any>) => string;

// Simulation Constants
export const SIMULATION_CONSTANTS = {
    DAILY_WATER_CONSUMPTION: 15, // % of substrate moisture per day
    DAILY_NUTRIENT_CONSUMPTION: 0.1, // EC points per day
    STRESS_FROM_PROBLEM: 5, // Stress points per problem per day
    STRESS_RECOVERY_RATE: 2, // Stress points recovered per day without problems
    HEIGHT_GROWTH_BASE: 0.5, // cm per day
    HEIGHT_GROWTH_VEG_MULTIPLIER: 2.5,
    HEIGHT_GROWTH_FLOWER_MULTIPLIER: 1.2,
    HEIGHT_STRESS_IMPACT_FACTOR: 0.02, // Reduces height growth per stress point
    WATER_ALL_THRESHOLD: 40, // % moisture to trigger 'Water All'
    WATER_REPLENISH_FACTOR: 100, // Multiplier for water amount to moisture %
    ML_PER_LITER: 1000,
};

// Plant Stage Details
export const PLANT_STAGE_DETAILS: Record<PlantStage, { duration: number, idealVitals: { ph: {min: number, max: number}, ec: {min: number, max: number}}, idealEnv: {temp: {min: number, max: number}, humidity: {min: number, max: number}} }> = {
    [PlantStage.Seed]: { duration: 1, idealVitals: { ph: {min: 6.0, max: 7.0}, ec: {min: 0.1, max: 0.4} }, idealEnv: {temp: {min: 22, max: 26}, humidity: {min: 70, max: 80}} },
    [PlantStage.Germination]: { duration: 4, idealVitals: { ph: {min: 6.0, max: 7.0}, ec: {min: 0.1, max: 0.4} }, idealEnv: {temp: {min: 22, max: 26}, humidity: {min: 70, max: 80}} },
    [PlantStage.Seedling]: { duration: 14, idealVitals: { ph: {min: 5.8, max: 6.8}, ec: {min: 0.4, max: 0.8} }, idealEnv: {temp: {min: 21, max: 26}, humidity: {min: 60, max: 70}} },
    [PlantStage.Vegetative]: { duration: 28, idealVitals: { ph: {min: 5.8, max: 6.5}, ec: {min: 0.8, max: 1.6} }, idealEnv: {temp: {min: 22, max: 28}, humidity: {min: 50, max: 70}} },
    [PlantStage.Flowering]: { duration: 56, idealVitals: { ph: {min: 6.0, max: 6.8}, ec: {min: 1.2, max: 2.2} }, idealEnv: {temp: {min: 20, max: 26}, humidity: {min: 40, max: 50}} },
    [PlantStage.Harvest]: { duration: 1, idealVitals: { ph: {min: 6.0, max: 7.0}, ec: {min: 0.0, max: 0.4} }, idealEnv: {temp: {min: 18, max: 22}, humidity: {min: 45, max: 55}} },
    [PlantStage.Drying]: { duration: 10, idealVitals: { ph: {min: 0, max: 0}, ec: {min: 0, max: 0} }, idealEnv: {temp: {min: 18, max: 20}, humidity: {min: 55, max: 65}} },
    [PlantStage.Curing]: { duration: 21, idealVitals: { ph: {min: 0, max: 0}, ec: {min: 0, max: 0} }, idealEnv: {temp: {min: 18, max: 20}, humidity: {min: 60, max: 65}} },
    [PlantStage.Finished]: { duration: Infinity, idealVitals: { ph: {min: 0, max: 0}, ec: {min: 0, max: 0} }, idealEnv: {temp: {min: 0, max: 0}, humidity: {min: 0, max: 0}} },
};


const workerCode = `
    const PLANT_STAGE_DETAILS = ${JSON.stringify(PLANT_STAGE_DETAILS)};
    const STAGES_ORDER = ${JSON.stringify(STAGES_ORDER)};
    const SIMULATION_CONSTANTS = ${JSON.stringify(SIMULATION_CONSTANTS)};

    const advancePlantOneDay = (plant, settings) => {
        if (plant.stage === 'FINISHED') return { updatedPlant: plant, events: [] };

        let updatedPlant = JSON.parse(JSON.stringify(plant));
        const events = [];
        
        updatedPlant.age += 1;
        const currentStageIndex = STAGES_ORDER.indexOf(updatedPlant.stage);
        const stageDuration = PLANT_STAGE_DETAILS[updatedPlant.stage].duration;
        let stageAge = updatedPlant.age;
        if (currentStageIndex > 0) {
            stageAge -= STAGES_ORDER.slice(0, currentStageIndex).reduce((acc, s) => acc + PLANT_STAGE_DETAILS[s].duration, 0);
        }
        
        if (stageAge >= stageDuration && updatedPlant.stage !== 'Curing') {
            const nextStage = STAGES_ORDER[currentStageIndex + 1];
            if (nextStage) {
                updatedPlant.stage = nextStage;
                events.push({ type: 'notification', data: { messageKey: 'plantsView.notifications.stageChange', params: { stage: \`plantStages.\${nextStage}\` }, type: 'info' } });
                if (settings.simulationSettings.autoJournaling.stageChanges) {
                     events.push({ type: 'journal', data: { type: 'SYSTEM', notesKey: 'plantsView.notifications.stageChange', params: { stage: \`plantStages.\${nextStage}\` } } });
                }
                if (nextStage === 'HARVEST') {
                    events.push({ type: 'notification', data: { messageKey: 'plantsView.notifications.harvestReady', params: { name: plant.name }, type: 'success' } });
                }
            }
        }

        updatedPlant.vitals.substrateMoisture = Math.max(0, updatedPlant.vitals.substrateMoisture - SIMULATION_CONSTANTS.DAILY_WATER_CONSUMPTION);
        if (updatedPlant.stage === 'VEGETATIVE' || updatedPlant.stage === 'FLOWERING') {
            updatedPlant.vitals.ec = Math.max(0, updatedPlant.vitals.ec - SIMULATION_CONSTANTS.DAILY_NUTRIENT_CONSUMPTION);
        }

        let heightGrowth = SIMULATION_CONSTANTS.HEIGHT_GROWTH_BASE;
        if (updatedPlant.stage === 'VEGETATIVE') heightGrowth *= SIMULATION_CONSTANTS.HEIGHT_GROWTH_VEG_MULTIPLIER;
        if (updatedPlant.stage === 'FLOWERING') heightGrowth *= SIMULATION_CONSTANTS.HEIGHT_GROWTH_FLOWER_MULTIPLIER;
        heightGrowth *= (1 - (updatedPlant.stressLevel * SIMULATION_CONSTANTS.HEIGHT_STRESS_IMPACT_FACTOR / 100));
        if (STAGES_ORDER.indexOf(updatedPlant.stage) < STAGES_ORDER.indexOf('HARVEST')) {
            updatedPlant.height = parseFloat((updatedPlant.height + heightGrowth).toFixed(2));
        }

        updatedPlant.history.push({ day: updatedPlant.age, vitals: { ...updatedPlant.vitals }, stressLevel: updatedPlant.stressLevel, height: updatedPlant.height });
        
        const currentStageDetails = PLANT_STAGE_DETAILS[updatedPlant.stage];
        const idealVitals = currentStageDetails.idealVitals;
        let stressIncrease = 0;

        if (updatedPlant.vitals.substrateMoisture < 20) { stressIncrease += 2; }
        if (updatedPlant.vitals.ph < idealVitals.ph.min || updatedPlant.vitals.ph > idealVitals.ph.max) { stressIncrease += 1; }
        if (updatedPlant.vitals.ec > idealVitals.ec.max * 1.2) { stressIncrease += 2; }
        
        if (stressIncrease > 0) {
            updatedPlant.stressLevel = Math.min(100, updatedPlant.stressLevel + stressIncrease);
        } else {
            updatedPlant.stressLevel = Math.max(0, updatedPlant.stressLevel - SIMULATION_CONSTANTS.STRESS_RECOVERY_RATE);
        }

        const openTasks = updatedPlant.tasks.filter(t => !t.isCompleted);
        if (updatedPlant.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATER_ALL_THRESHOLD && !openTasks.some(t => t.title === 'plantsView.tasks.wateringTask.title')) {
            events.push({ type: 'task', data: { title: 'plantsView.tasks.wateringTask.title', description: 'plantsView.tasks.wateringTask.description', priority: 'high' } });
        }
        if (updatedPlant.stage === 'FLOWERING' && stageAge > stageDuration - 14 && !openTasks.some(t => t.title === 'plantsView.tasks.trichomeTask.title')) {
            events.push({ type: 'task', data: { title: 'plantsView.tasks.trichomeTask.title', description: 'plantsView.tasks.trichomeTask.description', priority: 'medium' } });
        }

        updatedPlant.lastUpdated = Date.now();
        return { updatedPlant, events };
    };

    self.onmessage = (e) => {
        const { plant, settings } = e.data;
        const result = advancePlantOneDay(plant, settings);
        self.postMessage(result);
    };
`;

let workerInstance: Worker | null = null;
const getWorker = () => {
    if (!workerInstance) {
        const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        workerInstance = new Worker(workerUrl);
    }
    return workerInstance;
}

export const runSimulationInWorker = (plant: Plant, settings: AppSettings): Promise<{ updatedPlant: Plant, events: any[] }> => {
    return new Promise((resolve, reject) => {
        const worker = getWorker();
        const messageHandler = (e: MessageEvent) => {
            resolve(e.data);
            worker.removeEventListener('message', messageHandler);
            worker.removeEventListener('error', errorHandler);
        };
        const errorHandler = (e: ErrorEvent) => {
            reject(e);
            worker.removeEventListener('message', messageHandler);
            worker.removeEventListener('error', errorHandler);
        };
        
        worker.addEventListener('message', messageHandler);
        worker.addEventListener('error', errorHandler);
        
        worker.postMessage({ plant, settings });
    });
};

export const generateIdealHistory = (plant: Plant): { idealHistory: PlantHistoryEntry[], idealVitalRanges: { day: number; ph: { min: number; max: number; }; ec: { min: number; max: number; }; }[] } => {
    const idealHistory: PlantHistoryEntry[] = [];
    const idealVitalRanges: { day: number; ph: { min: number; max: number; }; ec: { min: number; max: number; }; }[] = [];
    let cumulativeDays = 0;
    let currentHeight = 0;

    for (const stage of STAGES_ORDER) {
        if (stage === PlantStage.Finished) break;
        const details = PLANT_STAGE_DETAILS[stage];
        for (let i = 0; i < details.duration; i++) {
            const day = cumulativeDays + i + 1;
            
            let heightGrowth = SIMULATION_CONSTANTS.HEIGHT_GROWTH_BASE;
            if (stage === PlantStage.Vegetative) heightGrowth *= SIMULATION_CONSTANTS.HEIGHT_GROWTH_VEG_MULTIPLIER;
            if (stage === PlantStage.Flowering) heightGrowth *= SIMULATION_CONSTANTS.HEIGHT_GROWTH_FLOWER_MULTIPLIER;
            
            if (STAGES_ORDER.indexOf(stage) < STAGES_ORDER.indexOf(PlantStage.Harvest)) {
                 currentHeight += heightGrowth;
            }

            idealHistory.push({
                day,
                height: parseFloat(currentHeight.toFixed(2)),
                stressLevel: 0,
                vitals: {
                    ph: (details.idealVitals.ph.min + details.idealVitals.ph.max) / 2,
                    ec: (details.idealVitals.ec.min + details.idealVitals.ec.max) / 2,
                    substrateMoisture: 60,
                }
            });

            idealVitalRanges.push({
                day,
                ph: details.idealVitals.ph,
                ec: details.idealVitals.ec,
            });
        }
        cumulativeDays += details.duration;
    }
    
    return { idealHistory, idealVitalRanges };
};
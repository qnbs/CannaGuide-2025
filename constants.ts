import { PlantStage } from './types';

export const PLANT_STAGE_DETAILS: { 
  [key in PlantStage]: { 
    duration: number, 
    next: PlantStage | null,
    idealEnv: { temp: {min: number, max: number}, humidity: {min: number, max: number} },
    idealVitals: { ph: { min: number, max: number }, ec: { min: number, max: number } },
    waterConsumption: number, // % per day
    nutrientConsumption: number, // ec per day
    growthRate: number, // cm per day
  } 
} = {
    [PlantStage.Seed]: { duration: 1, next: PlantStage.Germination, idealEnv: { temp: {min: 22, max: 25}, humidity: {min: 60, max: 70} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0.4 } }, waterConsumption: 5, nutrientConsumption: 0, growthRate: 0 },
    [PlantStage.Germination]: { duration: 5, next: PlantStage.Seedling, idealEnv: { temp: {min: 22, max: 26}, humidity: {min: 60, max: 70} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0.4 } }, waterConsumption: 8, nutrientConsumption: 0.01, growthRate: 0.2 },
    [PlantStage.Seedling]: { duration: 14, next: PlantStage.Vegetative, idealEnv: { temp: {min: 20, max: 28}, humidity: {min: 50, max: 60} }, idealVitals: { ph: { min: 6.0, max: 6.8 }, ec: { min: 0.5, max: 1.0 } }, waterConsumption: 12, nutrientConsumption: 0.05, growthRate: 0.8 },
    [PlantStage.Vegetative]: { duration: 42, next: PlantStage.Flowering, idealEnv: { temp: {min: 20, max: 30}, humidity: {min: 40, max: 60} }, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 1.0, max: 1.8 } }, waterConsumption: 20, nutrientConsumption: 0.1, growthRate: 1.5 },
    [PlantStage.Flowering]: { duration: 63, next: PlantStage.Harvest, idealEnv: { temp: {min: 18, max: 26}, humidity: {min: 30, max: 40} }, idealVitals: { ph: { min: 6.0, max: 6.8 }, ec: { min: 1.2, max: 2.2 } }, waterConsumption: 25, nutrientConsumption: 0.12, growthRate: 0.5 },
    [PlantStage.Harvest]: { duration: 1, next: PlantStage.Drying, idealEnv: { temp: {min: 18, max: 22}, humidity: {min: 50, max: 60} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0 } }, waterConsumption: 0, nutrientConsumption: 0, growthRate: 0 },
    [PlantStage.Drying]: { duration: 10, next: PlantStage.Curing, idealEnv: { temp: {min: 18, max: 20}, humidity: {min: 50, max: 55} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0 } }, waterConsumption: 0, nutrientConsumption: 0, growthRate: 0 },
    [PlantStage.Curing]: { duration: 21, next: PlantStage.Finished, idealEnv: { temp: {min: 18, max: 20}, humidity: {min: 58, max: 62} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0 } }, waterConsumption: 0, nutrientConsumption: 0, growthRate: 0 },
    [PlantStage.Finished]: { duration: Infinity, next: null, idealEnv: { temp: {min: 15, max: 20}, humidity: {min: 50, max: 60} }, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0 } }, waterConsumption: 0, nutrientConsumption: 0, growthRate: 0 },
};

export const STAGES_ORDER: PlantStage[] = [
    PlantStage.Seed,
    PlantStage.Germination,
    PlantStage.Seedling,
    PlantStage.Vegetative,
    PlantStage.Flowering,
    PlantStage.Harvest,
    PlantStage.Drying,
    PlantStage.Curing,
    PlantStage.Finished,
];

export const PROBLEM_THRESHOLDS = {
  moisture: {
    over: 95,
    under: 25
  },
  ec: {
    over: 2.5,
    under: 0.4
  },
  ph: {
      high: 7.2,
      low: 5.5,
  },
  temp: {
    high: 32,
    low: 15,
  },
  humidity: {
    vegetative: {
        high: 75,
        low: 35,
    },
    flowering: {
        high: 55, // Lower threshold in flowering to prevent mold
        low: 25,
    }
  },
  light: {
    stress: 98
  }
};

export const YIELD_FACTORS = {
    base: { // g per plant potential
        Low: 30,
        Medium: 60,
        High: 100,
    },
    stressModifier: -0.6, // 60% penalty from avg stress
    heightModifier: 0.3, // 30% bonus from final height
    setupModifier: {
        light: {
            LED: 1.1,
            HPS: 1.0,
            CFL: 0.8,
        },
        potSize: {
            5: 0.8,
            10: 1.0,
            15: 1.2,
        },
        medium: {
            Soil: 1.0,
            Coco: 1.1,
            Hydro: 1.3,
        }
    }
};

export const SIMULATION_CONSTANTS = {
  // pH values below/above which nutrient uptake is reduced
  NUTRIENT_LOCKOUT_PH_LOW: 5.8,
  NUTRIENT_LOCKOUT_PH_HIGH: 7.0,
  // The pH value towards which the substrate naturally drifts
  PH_DRIFT_TARGET: 6.5,
  // The factor determining how fast pH drifts per day
  PH_DRIFT_FACTOR: 0.05,
  // A higher value means stress has less impact on growth
  STRESS_GROWTH_PENALTY_DIVISOR: 150,
  // Substrate moisture percentage below which a watering task is generated
  WATERING_TASK_THRESHOLD: 30,
  // Substrate moisture percentage below which "Water All" becomes effective
  WATER_ALL_THRESHOLD: 50,
  // A factor determining how much moisture is replenished relative to water amount and pot size
  WATER_REPLENISH_FACTOR: 200,
  // Milliliters per liter
  ML_PER_LITER: 1000,
};
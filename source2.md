# Cannabis Grow Guide 2025 - Source Code: App Logic

This document contains the source code for the application's core logic, including type definitions, constants, context providers, custom hooks, and services.

---

## 1. Type Definitions (`types.ts`)

This file contains all TypeScript type and interface definitions used throughout the application.

```typescript
// The `PlantStage` enum is defined and exported within this file.

export enum View {
  Strains = 'STRAINS',
  Plants = 'PLANTS',
  Equipment = 'EQUIPMENT',
  Knowledge = 'KNOWLEDGE',
  Settings = 'SETTINGS',
  Help = 'HELP',
}

export type FontSize = 'sm' | 'base' | 'lg';
export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purple-haze';

export interface NotificationSettings {
  stageChange: boolean;
  problemDetected: boolean;
  harvestReady: boolean;
  newTask: boolean;
}

export type SimulationSpeed = '1x' | '2x' | '5x' | '10x' | '20x';
export type SimulationDifficulty = 'easy' | 'normal' | 'hard';

export interface SimulationSettings {
    speed: SimulationSpeed;
    difficulty: SimulationDifficulty;
}

export interface GrowSetup {
  lightType: 'LED' | 'HPS' | 'CFL';
  potSize: 5 | 10 | 15; // in Liters
  medium: 'Soil' | 'Coco' | 'Hydro';
  temperature: number; // °C
  humidity: number; // %
  lightHours: number; // hours per day
}

export interface AppSettings {
  fontSize: FontSize;
  language: Language;
  theme: Theme;
  notificationsEnabled: boolean;
  notificationSettings: NotificationSettings;
  onboardingCompleted: boolean;
  simulationSettings: SimulationSettings;
  defaultGrowSetup: GrowSetup;
  defaultJournalNotes: {
    watering: string;
    feeding: string;
  };
  defaultExportSettings: {
    source: ExportSource;
    format: ExportFormat;
  };
  lastBackupTimestamp?: number;
}

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

export interface Strain {
  id: string;
  name: string;
  type: 'Sativa' | 'Indica' | 'Hybrid';
  typeDetails?: string;
  genetics?: string;
  thc: number;
  cbd: number;
  thcRange?: string;
  cbdRange?: string;
  floweringTime: number; // in weeks
  floweringTimeRange?: string;
  description?: string;
  terpenes?: { name: string; aroma: string }[];
  aromas?: string[];
  dominantTerpenes?: string[];
  agronomic: {
    difficulty: 'Easy' | 'Medium' | 'Hard';
    yield: 'Low' | 'Medium' | 'High'; // Kept for simple logic
    height: 'Short' | 'Medium' | 'Tall'; // Kept for simple logic
    yieldDetails?: {
      indoor?: string;
      outdoor?: string;
    };
    heightDetails?: {
      indoor?: string;
      outdoor?: string;
    };
  };
}

export enum PlantStage {
  Seed = 'SEED',
  Germination = 'GERMINATION',
  Seedling = 'SEEDLING',
  Vegetative = 'VEGETATIVE',
  Flowering = 'FLOWERING',
  Harvest = 'HARVEST',
  Drying = 'DRYING',
  Curing = 'CURING',
  Finished = 'FINISHED',
}

export type PlantProblemType = 
  | 'Overwatering' 
  | 'Underwatering' 
  | 'NutrientBurn' 
  | 'NutrientDeficiency' 
  | 'TempTooHigh' 
  | 'TempTooLow'
  | 'HumidityTooHigh'
  | 'HumidityTooLow'
  | 'LightStress' 
  | 'PhTooHigh' 
  | 'PhTooLow';

export interface PlantProblem {
  type: PlantProblemType;
  message: string;
  solution: string;
}

export type JournalEntryType = 'WATERING' | 'FEEDING' | 'TRAINING' | 'OBSERVATION' | 'SYSTEM' | 'PHOTO';
export type TrainingType = 'Topping' | 'LST' | 'Defoliation';

export interface JournalEntry {
  id: string;
  timestamp: number;
  type: JournalEntryType;
  notes: string;
  details?: {
    waterAmount?: number; // ml
    ph?: number;
    ec?: number; // mS/cm
    trainingType?: TrainingType;
    imageUrl?: string; // For optimistic UI preview
    imageId?: string; // For persistent IndexedDB storage
  }
}

export type TaskPriority = 'high' | 'medium' | 'low';
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  isCompleted: boolean;
  createdAt: number;
  completedAt?: number;
}


export interface PlantHistoryEntry {
  day: number;
  vitals: Plant['vitals'];
  stressLevel: number;
  height: number;
}

export interface Plant {
  id: string;
  name: string;
  strain: Strain;
  stage: PlantStage;
  age: number; // in days
  height: number; // cm
  yield?: number; // in grams
  startedAt: number;
  lastUpdated: number;
  growSetup: GrowSetup;
  vitals: {
    substrateMoisture: number; // 0-100%
    ph: number; // 3-8
    ec: number; // 0-3.0 mS/cm
  };
  stressLevel: number; // 0-100
  environment: {
    temperature: number; // °C
    humidity: number; // %
    light: number; // % intensity
  };
  problems: PlantProblem[];
  journal: JournalEntry[];
  tasks: Task[];
  history: PlantHistoryEntry[];
}


export interface AIResponse {
    title: string;
    content: string;
}

export interface ArchivedAIResponse extends AIResponse {
    id: string;
    timestamp: number;
    query: string;
}


export interface AIProTip {
    title: string;
    content: string;
}

export type KnowledgeProgress = Record<string, string[]>;

export type ExportSource = 'selected' | 'favorites' | 'filtered' | 'all';
export type ExportFormat = 'json' | 'csv' | 'pdf' | 'txt';

export interface SavedExport {
  id: string;
  name: string;
  createdAt: number;
  format: ExportFormat;
  source: ExportSource;
  count: number;
  strainIds: string[];
}

export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

// Types for Equipment Setup Recommendations
export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'pots' | 'soil' | 'nutrients' | 'extra';

export interface RecommendationItem {
    name: string;
    watts?: number;
    price: number;
    rationale: string;
}
export type Recommendation = Record<RecommendationCategory, RecommendationItem>;

export interface SavedSetup {
  id: string;
  name: string;
  createdAt: number;
  recommendation: Recommendation;
  sourceDetails: {
    area: string;
    budget: string;
    growStyle: string;
  };
  totalCost: number;
}

export interface ArchivedMentorResponse extends AIResponse {
    id: string;
    createdAt: number;
    query: string;
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string;
    createdAt: number;
    query: string; // The plant data string used for the query
    plantId: string;
    plantStage: PlantStage;
}
```

---

## 2. Constants (`constants.ts`)

This file defines constants for the plant simulation logic, such as stage durations, ideal environmental conditions, and problem thresholds.

```typescript
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

export const LIST_GRID_CLASS = "grid grid-cols-[auto_auto_1fr_auto_auto] sm:grid-cols-[auto_auto_minmax(120px,2fr)_minmax(80px,1fr)_70px_70px_100px_100px_auto] md:grid-cols-[auto_auto_minmax(120px,2fr)_minmax(80px,1fr)_70px_70px_100px_120px_100px_auto] gap-x-2 md:gap-x-4 items-center";
```

... (and so on for all contexts, hooks, and services)

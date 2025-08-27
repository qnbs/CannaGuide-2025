export enum View {
  Strains = 'Sorten',
  Plants = 'Pflanzen',
  Equipment = 'Equipment',
  Knowledge = 'Wissen',
  Settings = 'Setup',
  Help = 'Hilfe',
}

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'base' | 'lg';
export type Language = 'en' | 'de';

export interface NotificationSettings {
  stageChange: boolean;
  problemDetected: boolean;
  harvestReady: boolean;
}

export interface AppSettings {
  theme: Theme;
  fontSize: FontSize;
  language: Language;
  notificationsEnabled: boolean;
  notificationSettings: NotificationSettings;
  onboardingCompleted: boolean;
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
  Seed = 'Samen',
  Germination = 'Keimung',
  Seedling = 'Sämling',
  Vegetative = 'Wachstum',
  Flowering = 'Blüte',
  Harvest = 'Ernte',
  Drying = 'Trocknung',
  Curing = 'Aushärtung',
  Finished = 'Abgeschlossen',
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
    imageUrl?: string;
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


export interface GrowSetup {
  lightType: 'LED' | 'HPS' | 'CFL';
  potSize: 5 | 10 | 15; // in Liters
  medium: 'Soil' | 'Coco' | 'Hydro';
  temperature: number; // °C
  humidity: number; // %
  lightHours: number; // hours per day
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

export interface AIProTip {
    title: string;
    content: string;
}

export type KnowledgeProgress = Record<string, string[]>;

export type ExportSource = 'selected' | 'favorites' | 'filtered' | 'all';
export type ExportFormat = 'json' | 'csv' | 'pdf';

export interface SavedExport {
  id: string;
  name: string;
  createdAt: number;
  format: ExportFormat;
  source: ExportSource;
  count: number;
  strainIds: string[];
}
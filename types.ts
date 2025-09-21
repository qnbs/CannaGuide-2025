import React from "react";

export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purple-haze';
export type FontSize = 'sm' | 'base' | 'lg';
export type SortDirection = 'asc' | 'desc';
export type SortKey = 'name' | 'difficulty' | 'type' | 'thc' | 'cbd' | 'floweringTime';
export type ViewMode = 'list' | 'grid';

export enum View {
    Strains = 'strains',
    Plants = 'plants',
    Equipment = 'equipment',
    Knowledge = 'knowledge',
    Settings = 'settings',
    Help = 'help',
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
  | 'PhTooLow' 
  | 'PhTooHigh' 
  | 'TempTooLow' 
  | 'TempTooHigh' 
  | 'HumidityTooLow' 
  | 'HumidityTooHigh';

export interface Strain {
    id: string;
    name: string;
    type: 'Sativa' | 'Indica' | 'Hybrid';
    thc: number;
    cbd: number;
    floweringTime: number;
    thcRange?: string;
    cbdRange?: string;
    floweringTimeRange?: string;
    description?: string;
    typeDetails?: string;
    genetics?: string;
    aromas?: string[];
    dominantTerpenes?: string[];
    agronomic: {
        difficulty: 'Easy' | 'Medium' | 'Hard';
        yield: 'Low' | 'Medium' | 'High';
        height: 'Short' | 'Medium' | 'Tall';
        yieldDetails?: { indoor: string, outdoor: string };
        heightDetails?: { indoor: string, outdoor: string };
    };
}

export interface GrowSetup {
    lightType: 'LED' | 'HPS' | 'CFL';
    potSize: 5 | 10 | 15 | 30;
    medium: 'Soil' | 'Coco' | 'Hydro';
    temperature: number;
    humidity: number;
    lightHours: number;
}

export interface JournalEntry {
    id: string;
    timestamp: number;
    type: JournalEntryType;
    notes: string;
    details?: {
        waterAmount?: number;
        ph?: number;
        ec?: number;
        trainingType?: TrainingType;
        imageId?: string;
        imageUrl?: string;
    };
}

export type JournalEntryType = 'WATERING' | 'FEEDING' | 'TRAINING' | 'OBSERVATION' | 'SYSTEM' | 'PHOTO';
export type TrainingType = 'Topping' | 'LST' | 'Defoliation';
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

export interface PlantProblem {
    type: PlantProblemType;
    message: string;
    solution: string;
}

export interface PlantHistoryEntry {
    day: number;
    vitals: {
        substrateMoisture: number;
        ph: number;
        ec: number;
    };
    stressLevel: number;
    height: number;
}

export interface Plant {
    id: string;
    name: string;
    strain: Strain;
    stage: PlantStage;
    age: number; // in days
    height: number; // in cm
    startedAt: number;
    lastUpdated: number;
    growSetup: GrowSetup;
    vitals: {
        substrateMoisture: number; // %
        ph: number;
        ec: number; // mS/cm
    };
    environment: {
        temperature: number; // °C
        humidity: number; // %
        light: number; // %
    };
    stressLevel: number; // %
    problems: PlantProblem[];
    journal: JournalEntry[];
    tasks: Task[];
    history: PlantHistoryEntry[];
    yield?: number; // in grams
}

export interface Command {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
    keywords?: string;
    shortcut?: string[];
}

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

export interface AppSettings {
    fontSize: FontSize;
    language: Language;
    theme: Theme;
    defaultView: View;
    strainsViewSettings: {
        defaultSortKey: SortKey;
        defaultSortDirection: SortDirection;
        defaultViewMode: ViewMode;
        visibleColumns: {
            type: boolean;
            thc: boolean;
            cbd: boolean;
            floweringTime: boolean;
            yield: boolean;
            difficulty: boolean;
        };
    };
    notificationsEnabled: boolean;
    notificationSettings: NotificationSettings;
    onboardingCompleted: boolean;
    simulationSettings: {
        speed: '1x' | '2x' | '5x' | '10x' | '20x';
        difficulty: SimulationDifficulty;
        autoAdvance: boolean;
        autoJournaling: {
            stageChanges: boolean,
            problems: boolean,
            tasks: boolean,
        }
    };
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

export interface NotificationSettings {
    stageChange: boolean;
    problemDetected: boolean;
    harvestReady: boolean;
    newTask: boolean;
}

export type SimulationDifficulty = 'easy' | 'normal' | 'hard';
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

export interface RecommendationItem {
    name: string;
    price: number;
    rationale: string;
    watts?: number;
}
export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'pots' | 'soil' | 'nutrients' | 'extra';

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

export interface AIResponse {
    title: string;
    content: string;
}

export interface ArchivedMentorResponse extends AIResponse {
    id: string;
    createdAt: number;
    query: string;
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string;
    createdAt: number;
    plantId: string;
    query: string;
    plantStage: PlantStage;
}

export type KnowledgeProgress = Record<string, string[]>;

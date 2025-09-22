import React from 'react';

// General App Structure
export enum View {
    Strains = 'STRAINS',
    Plants = 'PLANTS',
    Equipment = 'EQUIPMENT',
    Knowledge = 'KNOWLEDGE',
    Settings = 'SETTINGS',
    Help = 'HELP',
}

// Plant-related types
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

export interface PlantProblem {
  type: PlantProblemType;
  message: string;
  solution: string;
}

export interface PlantVitals {
    substrateMoisture: number;
    ph: number;
    ec: number;
}

export interface PlantEnvironment {
    temperature: number;
    humidity: number;
    light: number;
}

export type TrainingType = 'LST' | 'Topping' | 'Defoliation' | 'FIMing' | 'SCROG' | 'SuperCropping';

export type JournalEntryType = 'WATERING' | 'FEEDING' | 'TRAINING' | 'OBSERVATION' | 'PHOTO' | 'SYSTEM';

export interface JournalEntry {
    id: string;
    timestamp: number;
    type: JournalEntryType;
    notes: string;
    details?: {
        // Watering & Feeding
        waterAmount?: number;
        ph?: number;
        ec?: number;
        runoffPh?: number;
        runoffEc?: number;
        nutrientDetails?: string;
        // Training
        trainingType?: TrainingType;
        // Photo
        imageId?: string;
        imageUrl?: string; // for immediate preview
        photoCategory?: 'Full Plant' | 'Bud' | 'Leaf' | 'Problem' | 'Trichomes';
        // Observation
        healthStatus?: 'Excellent' | 'Good' | 'Showing Issues';
        observationTags?: string[];
    };
}


export type TaskPriority = 'low' | 'medium' | 'high';

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
    vitals: PlantVitals;
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
    vitals: PlantVitals;
    environment: PlantEnvironment;
    stressLevel: number;
    problems: PlantProblem[];
    journal: JournalEntry[];
    tasks: Task[];
    history: PlantHistoryEntry[];
    yield?: number;
}

// Strain-related types
export type StrainType = 'Sativa' | 'Indica' | 'Hybrid';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type YieldLevel = 'Low' | 'Medium' | 'High';
export type HeightLevel = 'Short' | 'Medium' | 'Tall';

export interface Strain {
    id: string;
    name: string;
    type: StrainType;
    typeDetails?: string;
    genetics?: string;
    thc: number;
    cbd: number;
    thcRange?: string;
    cbdRange?: string;
    floweringTime: number;
    floweringTimeRange?: string;
    description?: string;
    aromas?: string[];
    dominantTerpenes?: string[];
    agronomic: {
        difficulty: DifficultyLevel;
        yield: YieldLevel;
        height: HeightLevel;
        yieldDetails?: {
            indoor: string;
            outdoor: string;
        };
        heightDetails?: {
            indoor: string;
            outdoor: string;
        };
    };
}

// Equipment & Setup types
export interface GrowSetup {
    lightType: 'LED' | 'HPS' | 'CFL';
    potSize: 5 | 10 | 15 | 30;
    medium: 'Soil' | 'Coco' | 'Hydro';
    temperature: number;
    humidity: number;
    lightHours: number;
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
    totalCost: number;
    sourceDetails: {
        area: string;
        budget: string;
        growStyle: string;
    };
}

export type ExportSource = 'selected' | 'favorites' | 'filtered' | 'all';
export type ExportFormat = 'pdf' | 'txt' | 'csv' | 'json';
export interface SavedExport {
    id: string;
    createdAt: number;
    name: string;
    source: ExportSource;
    format: ExportFormat;
    count: number;
    strainIds: string[];
    notes?: string;
}

// AI & Response types
export interface AIResponse {
    title: string;
    content: string;
}

export interface SavedStrainTip extends AIResponse {
  id: string;
  createdAt: number;
  strainId: string;
  strainName: string;
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
    plantStage: PlantStage;
    query: string;
}

// UI & Settings types
export type SortDirection = 'asc' | 'desc';
export type SortKey = 'name' | 'difficulty' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'yield';

export type NotificationType = 'success' | 'error' | 'info';
export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz';
export type UiDensity = 'comfortable' | 'compact';

export interface NotificationSettings {
    stageChange: boolean;
    problemDetected: boolean;
    harvestReady: boolean;
    newTask: boolean;
}

export interface AppSettings {
    language: Language;
    theme: Theme;
    fontSize: 'sm' | 'base' | 'lg';
    defaultView: View;
    strainsViewSettings: {
        defaultSortKey: SortKey;
        defaultSortDirection: SortDirection;
        defaultViewMode: 'list' | 'grid';
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
        difficulty: 'easy' | 'normal' | 'hard' | 'custom';
        autoAdvance: boolean;
        autoJournaling: {
            stageChanges: boolean;
            problems: boolean;
            tasks: boolean;
        };
        customDifficultyModifiers: {
            pestPressure: number;
            nutrientSensitivity: number;
            environmentalStability: number;
        };
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
    accessibility: {
        highContrast: boolean;
        reducedMotion: boolean;
        dyslexiaFont: boolean;
    };
    uiDensity: UiDensity;
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
    };
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

export interface KnowledgeProgress {
    [sectionId: string]: string[];
}
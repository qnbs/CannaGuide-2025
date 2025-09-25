import React from 'react';

// --- Core Enums ---

export enum View {
    Strains = 'Strains',
    Plants = 'Plants',
    Equipment = 'Equipment',
    Knowledge = 'Knowledge',
    Settings = 'Settings',
    Help = 'Help',
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

export type StrainType = 'Sativa' | 'Indica' | 'Hybrid';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type YieldLevel = 'Low' | 'Medium' | 'High';
export type HeightLevel = 'Short' | 'Medium' | 'Tall';

// --- Strain Data ---

export interface AgronomicData {
    difficulty: DifficultyLevel;
    yield: YieldLevel;
    height: HeightLevel;
    yieldDetails?: { indoor: string; outdoor: string };
    heightDetails?: { indoor: string; outdoor: string };
}

export interface Strain {
    id: string;
    name: string;
    type: StrainType;
    typeDetails?: string;
    genetics?: string;
    geneticsDetails?: { isAutoflower: boolean };
    floweringType: 'Photoperiod' | 'Autoflower';
    thc: number;
    cbd: number;
    thcRange?: string;
    cbdRange?: string;
    floweringTime: number;
    floweringTimeRange?: string;
    description?: string;
    agronomic: AgronomicData;
    aromas?: string[];
    dominantTerpenes?: string[];
}

export interface StrainTranslationData {
    description: string;
    typeDetails?: string;
    genetics?: string;
    yieldDetails?: { indoor: string; outdoor: string };
    heightDetails?: { indoor: string; outdoor: string };
}

// --- Plant & Grow Data ---

export interface PlantVitals {
    ph: number;
    ec: number;
    substrateMoisture: number; // 0-100
}

export interface PlantEnvironment {
    temperature: number; // Celsius
    humidity: number; // %
}

export type PlantIssueName = 
    | 'Overwatering' 
    | 'Underwatering' 
    | 'NutrientBurn' 
    | 'NutrientLockout' 
    | 'EcStress' 
    | 'SpiderMites' 
    | 'PowderyMildew' 
    | 'phTooLow' 
    | 'phTooHigh' 
    | 'tempTooHigh' 
    | 'tempTooLow' 
    | 'humidityTooHigh' 
    | 'humidityTooLow';

export interface PlantProblem {
    type: PlantIssueName;
    status: 'active' | 'resolved';
    detectedAt: number; // timestamp
    resolvedAt?: number;
    severity: 'Low' | 'Medium' | 'High';
}

export type JournalEntryType = 'WATERING' | 'FEEDING' | 'TRAINING' | 'OBSERVATION' | 'SYSTEM' | 'PHOTO' | 'PEST_CONTROL' | 'ENVIRONMENT';

export interface JournalEntry {
    id: string;
    createdAt: number; // timestamp
    type: JournalEntryType;
    notes: string;
    details?: Record<string, any>;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export interface Task {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    createdAt: number;
    completedAt?: number;
    priority: TaskPriority;
}

export interface PlantHistoryEntry {
    day: number;
    height: number;
    stressLevel: number; // 0-100
    vitals: PlantVitals;
}

export interface GrowSetup {
    lightType: 'LED' | 'HPS' | 'CFL';
    potSize: number; // in Liters
    medium: 'Soil' | 'Coco' | 'Hydro';
    temperature: number;
    humidity: number;
    lightHours: number;
}

export interface PlantNode {
  id: string;
  position: number; // e.g. 1 for the first node above ground
  lightExposure: number; // 0-1, how much light reaches this node
  isTopped: boolean;
  shoots: PlantShoot[]; // Shoots originating from this node
}

export interface PlantShoot {
  id: string;
  length: number; // length of the shoot/branch
  nodes: PlantNode[];
  isMainStem: boolean;
  angle: number; // 0 = vertical, 90 = horizontal (for LST)
}

export interface Plant {
    id: string;
    name: string;
    strain: Strain;
    createdAt: number; // timestamp
    age: number; // in days
    stage: PlantStage;
    height: number; // in cm
    health: number; // 0-100
    stressLevel: number; // 0-100
    vitals: PlantVitals;
    environment: PlantEnvironment;
    problems: PlantProblem[];
    journal: JournalEntry[];
    tasks: Task[];
    history: PlantHistoryEntry[];
    growSetup: GrowSetup;
    internalClock: number; // days since germination
    hormoneLevels: {
        florigen: number; // flowering hormone
    };
    daysOn1212: number;
    daysInFlowering: number;
    structuralModel: PlantShoot;
    resistanceBuffs?: {
        pest?: { ticks: number };
        fungus?: { ticks: number };
    };
}


// --- AI & Recommendations ---

export interface AIResponse {
    title: string;
    content: string; // Markdown content
}

export interface StructuredGrowTips {
    nutrientTip: string;
    trainingTip: string;
    environmentalTip: string;
    proTip: string;
}

export interface PlantDiagnosisResponse {
    problemName: string;
    confidence: number;
    diagnosis: string;
    immediateActions: string;
    longTermSolution: string;
    prevention: string;
}

export interface RecommendationItem {
    name: string;
    price: number;
    rationale: string;
    watts?: number;
}

export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'pots' | 'soil' | 'nutrients' | 'extra';

export type Recommendation = Record<RecommendationCategory, RecommendationItem>;


// --- UI & State Management ---

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

export type StrainViewTab = 'all' | 'my-strains' | 'favorites' | 'exports' | 'tips';

export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz';
export type UiDensity = 'comfortable' | 'compact';
export type SortKey = 'name' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'type' | 'yield';
export type SortDirection = 'asc' | 'desc';

export interface AppSettings {
    language: Language;
    theme: Theme;
    fontSize: 'sm' | 'base' | 'lg';
    defaultView: View;
    strainsViewSettings: {
        defaultSortKey: SortKey;
        defaultSortDirection: SortDirection;
        defaultViewMode: 'list' | 'grid';
        visibleColumns: Record<string, boolean>;
    };
    notificationsEnabled: boolean;
    notificationSettings: {
        stageChange: boolean;
        problemDetected: boolean;
        harvestReady: boolean;
        newTask: boolean;
    };
    onboardingCompleted: boolean;
    simulationSettings: {
        speed: '1x' | '2x' | '5x';
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
        reducedMotion: boolean;
        dyslexiaFont: boolean;
    };
    uiDensity: UiDensity;
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
    };
    tts: TTSSettings;
}

export interface TTSSettings {
    enabled: boolean;
    rate: number;
    pitch: number;
    voiceName: string | null;
}

export interface SpeechQueueItem {
    id: string;
    text: string;
}

export interface Command {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ElementType;
    action: () => void;
    keywords?: string;
    shortcut?: string[];
    group: string;
    isHeader?: boolean;
}

// --- Data & Storage ---

export type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt' | 'xml';
export type ExportSource = 'selected' | 'all' | 'filtered' | 'favorites';

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

export interface SavedSetup {
    id: string;
    createdAt: number;
    name: string;
    recommendation: Recommendation;
    totalCost: number;
    sourceDetails: {
        area: string;
        budget: string;
        growStyle: string;
    };
}

export interface StoredImageData {
    id: string;
    plantId: string;
    createdAt: number;
    data: string; // Data URL
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
    query: string; // The plant data JSON
}

export interface SavedStrainTip extends AIResponse {
    id: string;
    createdAt: number;
    strainId: string;
    strainName: string;
}

export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'SCROG' | 'Defoliation' | 'SuperCropping';

export type KnowledgeProgress = Record<string, string[]>; // sectionId: [itemId, itemId, ...]]
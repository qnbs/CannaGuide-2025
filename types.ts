// --- Core Enums & Simple Types ---
// FIX: Import React to use React.ElementType in the Command interface.
import React from 'react';

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
export type FloweringType = 'Photoperiod' | 'Autoflower';
export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz';
export type UiDensity = 'comfortable' | 'compact';
export type SortKey = 'name' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'type' | 'yield';
export type SortDirection = 'asc' | 'desc';
export type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt' | 'xml';
export type ExportSource = 'selected' | 'all' | 'filtered' | 'favorites';

// --- Strain Data ---

export interface Strain {
    id: string;
    name: string;
    type: StrainType;
    typeDetails?: string;
    genetics?: string;
    floweringType: FloweringType;
    geneticsDetails?: {
        isAutoflower: boolean;
    };
    thc: number;
    cbd: number;
    thcRange?: string;
    cbdRange?: string;
    floweringTime: number;
    floweringTimeRange?: string;
    description?: string;
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
    aromas?: string[];
    dominantTerpenes?: string[];
}

export interface StrainTranslationData {
    description?: string;
    typeDetails?: string;
    genetics?: string;
    // FIX: agronomic properties were incorrectly nested. This matches the structure of translation files.
    yieldDetails?: { indoor: string; outdoor: string };
    heightDetails?: { indoor: string; outdoor: string };
}


// --- Plant Simulation & Management ---

export interface PlantVitals {
    ph: number;
    ec: number;
    substrateMoisture: number; // 0-100%
}

export interface PlantEnvironment {
    temperature: number; // Celsius
    humidity: number; // %
}

export interface PlantProblem {
    type: 'overwatering' | 'underwatering' | 'nutrientBurn' | 'nutrientDeficiency' | 'phTooLow' | 'phTooHigh' | 'tempTooHigh' | 'tempTooLow' | 'humidityTooHigh' | 'humidityTooLow' | 'vpdTooLow' | 'vpdTooHigh' | 'pest';
    status: 'active' | 'resolved';
    startedAt: number; // timestamp
    resolvedAt?: number;
}

export type JournalEntryType = 'WATERING' | 'FEEDING' | 'TRAINING' | 'OBSERVATION' | 'SYSTEM' | 'PHOTO' | 'PEST_CONTROL' | 'ENVIRONMENT';
export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'SCROG' | 'Defoliation' | 'SuperCropping';

export interface JournalEntry {
    id: string;
    createdAt: number; // timestamp
    completedAt?: number;
    type: JournalEntryType;
    notes: string;
    details?: {
        waterAmount?: number;
        ph?: number;
        ec?: number;
        nutrientDetails?: string;
        trainingType?: TrainingType;
        healthStatus?: 'Excellent' | 'Good' | 'Showing Issues';
        observationTags?: string[];
        imageId?: string;
        imageUrl?: string;
        photoCategory?: 'Full Plant' | 'Bud' | 'Leaf' | 'Problem' | 'Trichomes';
        method?: string; // for pest control
    };
}

export interface PlantHistoryEntry {
    day: number;
    stage: PlantStage;
    height: number;
    stressLevel: number;
    vitals: PlantVitals;
}

export interface GrowSetup {
    lightType: 'LED' | 'HPS' | 'CFL';
    potSize: number; // Liters
    medium: 'Soil' | 'Coco' | 'Hydro';
    temperature: number;
    humidity: number;
    lightHours: number;
}

export interface PlantNode {
    id: string;
    type: 'node';
    position: number; // position along the stem, 0 is base, 1 is top
    children: (PlantBranch | PlantLeaf | PlantBud)[];
}

export interface PlantBranch {
    id: string;
    type: 'branch';
    length: number;
    angle: number; // angle from main stem
    nodes: PlantNode[];
}

export interface PlantLeaf {
    id: string;
    type: 'leaf';
    size: number;
    health: number; // 0-1, represents health of this specific leaf
}

export interface PlantBud {
    id: string;
    type: 'bud';
    size: number;
    maturity: number; // 0-1
}

export interface PlantStructuralModel {
    id: string;
    type: 'stem';
    height: number; // in cm
    nodes: PlantNode[];
}

export interface Plant {
    id: string;
    name: string;
    strain: Strain;
    age: number; // days
    stage: PlantStage;
    health: number; // 0-100
    height: number; // cm
    stressLevel: number; // 0-100
    vitals: PlantVitals;
    environment: PlantEnvironment;
    problems: PlantProblem[];
    journal: JournalEntry[];
    history: PlantHistoryEntry[];
    growSetup: GrowSetup;
    tasks: Task[];
    structuralModel: PlantStructuralModel;
    postHarvest?: {
        wetWeight?: number;
        dryWeight?: number;
        yieldPerWatt?: number;
        qualityRating?: number;
        dryingStartTime?: number;
        curingStartTime?: number;
    };
}


// --- AI & Recommendations ---

export interface RecommendationItem {
    name: string;
    price: number;
    rationale: string;
    watts?: number;
}

export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'pots' | 'soil' | 'nutrients' | 'extra';
export type Recommendation = Record<RecommendationCategory, RecommendationItem>;

export interface AIResponse {
    title: string;
    content: string; // Markdown supported
}

export interface PlantDiagnosisResponse {
    problemName: string;
    confidence: number;
    diagnosis: string;
    immediateActions: string;
    longTermSolution: string;
    prevention: string;
}

export interface StructuredGrowTips {
    nutrientTip: string;
    trainingTip: string;
    environmentalTip: string;
    proTip: string;
}

// --- App State & UI ---

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export type NotificationType = Notification['type'];

export enum CommandGroup {
    Navigation = 'Navigation',
    Plants = 'Plants',
    Strains = 'Strains',
    Knowledge = 'Knowledge',
    Settings = 'Settings',
    General = 'General Actions'
}

export interface Command {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ElementType;
    action: () => void;
    keywords?: string;
    shortcut?: string[];
    group: CommandGroup;
    isHeader?: boolean;
}

export interface AppSettings {
    language: Language;
    theme: Theme;
    fontSize: 'sm' | 'base' | 'lg';
    defaultView: View;
    onboardingCompleted: boolean;
    strainsViewSettings: {
        defaultSortKey: SortKey;
        defaultSortDirection: SortDirection;
        defaultViewMode: 'list' | 'grid';
        visibleColumns: Record<string, boolean>;
    };
    notificationSettings: {
        stageChange: boolean;
        problemDetected: boolean;
        harvestReady: boolean;
        newTask: boolean;
    };
    notificationsEnabled: boolean;
    simulationSettings: {
        speed: '1x' | '2x' | '4x';
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
        start: string; // "HH:MM"
        end: string; // "HH:MM"
    };
    tts: TTSSettings;
}

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

export interface SavedExport {
    id: string;
    name: string;
    createdAt: number;
    source: ExportSource;
    format: ExportFormat;
    notes?: string;
    count: number;
    strainIds: string[];
}

export interface ArchivedMentorResponse extends AIResponse {
    id: string;
    createdAt: number;
    query: string;
}

export interface SavedStrainTip extends AIResponse {
    id: string;
    createdAt: number;
    strainId: string;
    strainName: string;
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string;
    createdAt: number;
    plantId: string;
    plantStage: PlantStage;
    query: string; // The plant data JSON
}

export interface StoredImageData {
    id: string; // e.g., 'img-timestamp'
    plantId: string;
    createdAt: number;
    data: string; // base64 data URL
}

export interface Task {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    createdAt: number;
    completedAt?: number;
    priority: TaskPriority;
    source: 'system' | 'user';
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type StrainViewTab = 'all' | 'my-strains' | 'favorites' | 'exports' | 'tips';
export type KnowledgeProgress = Record<string, string[]>; // { [sectionId]: itemId[] }

export interface SpeechQueueItem {
    id: string; // Unique ID for the element to be spoken
    text: string;
}

export interface TTSSettings {
    enabled: boolean;
    rate: number;
    pitch: number;
    voiceName: string | null;
}
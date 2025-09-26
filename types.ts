import React from 'react';

// --- General & UI Types ---

export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz';
export type UiDensity = 'comfortable' | 'compact';
export type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt' | 'xml';
export type ExportSource = 'selected' | 'all' | 'filtered' | 'favorites';

export enum View {
    Strains = 'Strains',
    Plants = 'Plants',
    Equipment = 'Equipment',
    Knowledge = 'Knowledge',
    Settings = 'Settings',
    Help = 'Help',
}

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}
export type NotificationType = 'success' | 'error' | 'info';

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

// --- Strain Related Types ---

export type StrainType = 'Sativa' | 'Indica' | 'Hybrid';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type YieldLevel = 'Low' | 'Medium' | 'High';
export type HeightLevel = 'Short' | 'Medium' | 'Tall';
export type FloweringType = 'Photoperiod' | 'Autoflower';
export type SortKey = 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'yield';
export type SortDirection = 'asc' | 'desc';

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
    description?: string;
    thc: number;
    cbd: number;
    thcRange?: string;
    cbdRange?: string;
    floweringTime: number;
    floweringTimeRange?: string;
    agronomic: AgronomicData;
    genetics?: string;
    aromas?: string[];
    dominantTerpenes?: string[];
    floweringType?: FloweringType;
}

export interface StrainTranslationData {
    description: string;
    typeDetails?: string;
    genetics?: string;
    yieldDetails?: { indoor: string, outdoor: string };
    heightDetails?: { indoor: string, outdoor: string };
}

// --- Plant Related Types ---

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

export type JournalEntryType = 'WATERING' | 'FEEDING' | 'TRAINING' | 'OBSERVATION' | 'SYSTEM' | 'PHOTO' | 'PEST_CONTROL' | 'ENVIRONMENT' | 'AMENDMENT';
export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation';

export interface JournalEntry {
    id: string;
    createdAt: number;
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

export type ProblemType = 'Overwatering' | 'Underwatering' | 'NutrientBurn' | 'NutrientDeficiency' | 'PhTooLow' | 'PhTooHigh' | 'TempTooHigh' | 'TempTooLow' | 'HumidityTooHigh' | 'HumidityTooLow' | 'VpdTooLow' | 'VpdTooHigh' | 'Pest';
export interface PlantProblem {
    type: ProblemType;
    status: 'active' | 'resolved';
    detectedAt: number;
    resolvedAt?: number;
}

export interface PlantSubstrate {
    ph: number;
    ec: number;
    moisture: number; // as a percentage
}

export interface PlantEnvironment {
    internalTemperature: number;
    internalHumidity: number;
    externalTemperature: number;
    externalHumidity: number;
}

export interface PlantEquipment {
    light: { type: 'LED' | 'HPS' | 'CFL'; wattage: number; isOn: boolean; };
    potSize: number; // in Liters
    medium: 'Soil' | 'Coco' | 'Hydro';
    fan: { isOn: boolean; speed: number; }; // speed 0-100
}

export interface PlantHistoryEntry {
    day: number;
    stage: PlantStage;
    height: number;
    stressLevel: number;
    substrate: PlantSubstrate;
}

export interface PostHarvestData {
    wetWeight: number;
    dryWeight: number;
    yieldPerWatt: number;
    qualityRating: number;
}

export interface PlantNode {
    id: string;
    position: number; // 0-1 along the shoot
    lightExposure: number; // 0-1
    shoots: PlantShoot[];
}

export interface PlantShoot {
    id: string;
    length: number;
    angle: number; // relative to parent
    nodes: PlantNode[];
}

export type StructuralModel = PlantShoot;

export interface Plant {
    id: string;
    createdAt: number;
    name: string;
    strain: Strain;
    stage: PlantStage;
    age: number; // in days
    height: number; // in cm
    health: number; // 0-100
    stressLevel: number; // 0-100
    biomass: number; // abstract growth metric
    vitals: any;
    environment: PlantEnvironment;
    substrate: PlantSubstrate;
    equipment: PlantEquipment;
    journal: JournalEntry[];
    tasks: Task[];
    problems: PlantProblem[];
    history: PlantHistoryEntry[];
    postHarvest?: PostHarvestData;
    structuralModel?: StructuralModel;
}

export interface GrowSetup {
    lightType: string;
    wattage: number;
    potSize: number;
    medium: string;
    temperature: number;
    humidity: number;
    lightHours: number;
}

// --- AI & Saved Data Types ---

export interface AIResponse {
    title: string;
    content: string; // Markdown content
}

export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'pots' | 'soil' | 'nutrients' | 'extra';
export type RecommendationItem = { name: string; price: number; rationale: string; watts?: number };
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

export interface SavedExport {
    id: string;
    name: string;
    createdAt: number;
    source: 'selected' | 'all';
    format: ExportFormat;
    count: number;
    strainIds: string[];
    notes?: string;
}

export interface PlantDiagnosisResponse {
    title: string;
    confidence: number;
    diagnosis: string;
    immediateActions: string;
    longTermSolution: string;
    prevention: string;
}

export interface MentorMessage {
    role: 'user' | 'model';
    content: string;
    title?: string;
}

export interface ArchivedMentorResponse {
    id: string;
    createdAt: number;
    query: string;
    title: string;
    content: string;
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string;
    createdAt: number;
    plantId: string;
    plantStage: PlantStage;
    query: string;
}

export interface SavedStrainTip extends AIResponse {
    id: string;
    createdAt: number;
    strainId: string;
    strainName: string;
    notes?: string;
}

export interface StructuredGrowTips {
    nutrientTip: string;
    trainingTip: string;
    environmentalTip: string;
    proTip: string;
}

export interface StoredImageData {
    id: string;
    data: string; // base64 data URL
    createdAt: number;
}

export interface DeepDiveGuide {
    introduction: string;
    stepByStep: string[];
    prosAndCons: {
        pros: string[];
        cons: string[];
    };
    proTip: string;
    svgIcon: string;
}

export interface Scenario {
    id: string;
    titleKey: string;
    descriptionKey: string;
    durationDays: number;
    plantAModifier: { action: ScenarioAction; day: number; };
    plantBModifier: { action: ScenarioAction; day: number; };
}

export type ScenarioAction = 'TOP' | 'LST' | 'NONE';

// --- Knowledge & Settings Types ---

export interface KnowledgeArticle {
    id: string;
    titleKey: string;
    contentKey: string;
    tags: string[];
    triggers: {
        plantStage?: PlantStage | PlantStage[];
        ageInDays?: { min: number, max: number };
        activeProblems?: ProblemType[];
    }
}

export type KnowledgeProgress = Record<string, string[]>;

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
    notificationsEnabled: boolean;
    notificationSettings: {
        stageChange: boolean;
        problemDetected: boolean;
        harvestReady: boolean;
        newTask: boolean;
    };
    simulationSettings: {
        difficulty: 'easy' | 'normal' | 'hard' | 'custom';
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
        autoAdvance: boolean;
        speed: '1x' | '2x' | '4x';
    };
    defaultGrowSetup: Omit<PlantEquipment, 'isOn' | 'fan'>;
    defaultJournalNotes: Record<string, string>;
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

export type StrainViewTab = 'all' | 'my-strains' | 'favorites' | 'exports' | 'tips';

// --- Zustand Slice Interfaces ---

export interface PlantSlice {
    plants: Record<string, Plant | undefined>;
    plantSlots: (string | null)[];
    selectedPlantId: string | null;
}

export interface SimulationSlice {
    isCatchingUp: boolean;
    isInitialized: boolean;
    isSimulationRunning: boolean;
}

export interface UISlice {
    activeView: View;
    isCommandPaletteOpen: boolean;
    isAddModalOpen: boolean;
    isExportModalOpen: boolean;
    strainToEdit: Strain | null;
    notifications: Notification[];

    // New Grow Flow State
    initiatingGrowForSlot: number | null;
    strainForNewGrow: Strain | null;
    isGrowSetupModalOpen: boolean;
    isConfirmationModalOpen: boolean;
    confirmedGrowSetup: GrowSetup | null;
    
    // Mentor Chat State
    activeMentorPlantId: string | null;
}
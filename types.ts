import React from 'react';
import { store } from './stores/store';

// --- Global Redux State ---
export type RootState = ReturnType<typeof store.getState>;
export type AppState = RootState;

// --- Enums ---

export enum View {
    Strains = 'Strains',
    Plants = 'Plants',
    Equipment = 'Equipment',
    Knowledge = 'Knowledge',
    Settings = 'Settings',
    Help = 'Help',
}

export enum StrainType {
    Sativa = 'Sativa',
    Indica = 'Indica',
    Hybrid = 'Hybrid',
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

export enum ProblemType {
    NutrientDeficiency = 'NUTRIENT_DEFICIENCY',
    Overwatering = 'OVERWATERING',
    Underwatering = 'UNDERWATERING',
    PestInfestation = 'PEST_INFESTATION',
    NutrientBurn = 'NUTRIENT_BURN',
    LightBurn = 'LIGHT_BURN',
}

export enum TaskType {
    Watering = 'WATERING',
    Feeding = 'FEEDING',
    Training = 'TRAINING',
    Observation = 'OBSERVATION',
    PestControl = 'PEST_CONTROL',
}

export enum JournalEntryType {
    Watering = 'WATERING',
    Feeding = 'FEEDING',
    Training = 'TRAINING',
    Observation = 'OBSERVATION',
    Photo = 'PHOTO',
    System = 'SYSTEM',
    PestControl = 'PEST_CONTROL',
    Environment = 'ENVIRONMENT',
    Amendment = 'AMENDMENT',
}

export enum EquipmentViewTab {
    Configurator = 'configurator',
    Setups = 'setups',
    Calculators = 'calculators',
    GrowShops = 'grow-shops',
}

export enum KnowledgeViewTab {
    Mentor = 'mentor',
    Guide = 'guide',
    Archive = 'archive',
    Breeding = 'breeding',
}

export enum StrainViewTab {
    All = 'all',
    MyStrains = 'my-strains',
    Favorites = 'favorites',
    Exports = 'exports',
    Tips = 'tips',
}

// --- Type Aliases ---

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type YieldLevel = 'Low' | 'Medium' | 'High';
export type HeightLevel = 'Short' | 'Medium' | 'Tall';
export type SortKey = 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'yield';
export type SortDirection = 'asc' | 'desc';
export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz';
export type UiDensity = 'comfortable' | 'compact';
export type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt' | 'xml';
export type ExportSource = 'selected' | 'all';
export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation';
export type ModalType = 'watering' | 'feeding' | 'training' | 'pestControl' | 'observation' | 'photo' | 'amendment';
export type NotificationType = 'success' | 'error' | 'info';

// --- Core Data Interfaces ---

export interface Strain {
    id: string;
    name: string;
    type: StrainType;
    typeDetails?: string;
    genetics?: string;
    floweringType: 'Photoperiod' | 'Autoflower';
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
        yieldDetails?: { indoor: string; outdoor: string };
        heightDetails?: { indoor: string; outdoor: string };
    };
    aromas?: string[];
    dominantTerpenes?: string[];
}

export interface Plant {
    id: string;
    name: string;
    strain: Strain;
    createdAt: number;
    age: number;
    stage: PlantStage;
    height: number;
    biomass: number;
    health: number;
    stressLevel: number;
    problems: PlantProblem[];
    tasks: Task[];
    journal: JournalEntry[];
    history: PlantHistoryEntry[];
    isTopped: boolean;
    lstApplied: number;
    postHarvest?: PostHarvestData;
    environment: {
        internalTemperature: number;
        internalHumidity: number;
        vpd: number;
    };
    substrate: {
        ph: number;
        ec: number;
        moisture: number;
    };
    rootSystem: {
        health: number;
        microbeActivity: number;
    };
    equipment: {
        light: { wattage: number; isOn: boolean };
        fan: { isOn: boolean; speed: number };
    };
}

export interface PostHarvestData {
    currentDryDay: number;
    currentCureDay: number;
    jarHumidity: number;
    finalQuality: number;
}

export interface PlantProblem {
    type: ProblemType;
    severity: 'low' | 'medium' | 'high';
    status: 'active' | 'resolved';
    startedAt: number;
    resolvedAt?: number;
}
export type TaskPriority = 'low' | 'medium' | 'high';
export interface Task {
    id: string;
    title: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    isCompleted: boolean;
    createdAt: number;
    completedAt?: number;
}

export interface JournalEntry {
    id: string;
    createdAt: number;
    type: JournalEntryType;
    notes: string;
    details?: Record<string, any>;
}

export interface PlantHistoryEntry {
    day: number;
    height: number;
    stressLevel: number;
    health: number;
    substrate: { ph: number; ec: number; moisture: number };
}

export interface Seed {
    id: string;
    name: string;
    strainId: string;
    genetics: string;
    quality: number;
    createdAt: number;
}

// --- Settings Interfaces ---
export interface DefaultGrowSetup {
    light: { type: 'LED' | 'HPS' | 'CFL'; wattage: number };
    potSize: number;
    medium: 'Soil' | 'Coco' | 'Hydro';
}
export interface AppSettings {
    fontSize: 'sm' | 'base' | 'lg';
    language: Language;
    theme: Theme;
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
        difficulty: 'easy' | 'normal' | 'hard' | 'custom';
        autoJournaling: { stageChanges: boolean; problems: boolean; tasks: boolean; };
        customDifficultyModifiers: { pestPressure: number; nutrientSensitivity: number; environmentalStability: number; };
        autoAdvance: boolean;
        speed: '1x' | '2x' | '4x';
    };
    defaultGrowSetup: DefaultGrowSetup;
    defaultJournalNotes: { watering: string; feeding: string };
    defaultExportSettings: { source: ExportSource; format: ExportFormat; };
    lastBackupTimestamp?: number;
    accessibility: {
        reducedMotion: boolean;
        dyslexiaFont: boolean;
    };
    uiDensity: UiDensity;
    quietHours: { enabled: boolean; start: string; end: string; };
    tts: TTSSettings;
}

// --- AI & API Interfaces ---
export interface AIResponse {
    title: string;
    content: string; // HTML or Markdown
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
    uiHighlights?: { elementId: string; plantId: string; }[];
}
export interface StructuredGrowTips {
    nutrientTip: string;
    trainingTip: string;
    environmentalTip: string;
    proTip: string;
}
export interface DeepDiveGuide {
    introduction: string;
    stepByStep: string[];
    prosAndCons: { pros: string[]; cons: string[]; };
    proTip: string;
}
export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'pots' | 'soil' | 'nutrients' | 'extra';
export interface RecommendationItem {
    name: string;
    price: number;
    rationale: string;
    watts?: number;
}
export type Recommendation = Record<RecommendationCategory, RecommendationItem>;

export interface EquipmentRecommendationResponse {
    recommendation: Recommendation;
    proTip: string;
}

export interface KnowledgeArticle {
    id: string;
    titleKey: string;
    contentKey: string;
    tags: string[];
    triggers: {
        ageInDays?: { min: number; max: number };
        plantStage?: PlantStage | PlantStage[];
        activeProblems?: ProblemType[];
    };
}


// --- UI & State Interfaces ---
export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
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
export interface SavedSetup {
    id: string;
    name: string;
    createdAt: number;
    recommendation: Recommendation;
    totalCost: number;
    sourceDetails: { area: string; budget: string; growStyle: string; };
    proTip?: string;
}
export interface SavedExport {
    id: string;
    name: string;
    createdAt: number;
    source: ExportSource;
    format: ExportFormat;
    count: number;
    strainIds: string[];
    notes?: string;
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
}
export interface KnowledgeProgress {
    [sectionId: string]: string[];
}
export interface StoredImageData {
    id: string;
    data: string; // base64 data URL
    createdAt: number;
}
export interface GrowSetup {
    light: { type: 'LED' | 'HPS' | 'CFL'; wattage: number; };
    potSize: number;
    medium: 'Soil' | 'Coco' | 'Hydro';
    temperature: number;
    humidity: number;
    lightHours: number;
}

export interface SimulationState {
    plants: Record<string, Plant>;
    plantSlots: (string | null)[];
    selectedPlantId: string | null;
    isCatchingUp: boolean;
    lastTick: number;
}
export interface SpeechQueueItem {
    id: string;
    text: string;
}
export interface TTSSettings {
    enabled: boolean;
    rate: number;
    pitch: number;
    voiceName: string | null;
}
export interface StrainTranslationData {
    description?: string;
    typeDetails?: string;
    genetics?: string;
    yieldDetails?: { indoor: string; outdoor: string; };
    heightDetails?: { indoor: string; outdoor: string; };
}
export interface Scenario {
    id: string;
    titleKey: string;
    descriptionKey: string;
    durationDays: number;
    plantAModifier: { action: ScenarioAction; day: number };
    plantBModifier: { action: ScenarioAction; day: number };
}
export type ScenarioAction = 'TOP' | 'LST' | 'NONE';

export interface AiState<T> {
    isLoading: boolean;
    response: T | null;
    error: string | null;
    sourceDetails?: any;
}
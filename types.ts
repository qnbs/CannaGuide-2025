// FIX: Import React to resolve 'Cannot find namespace React' error for React.ElementType.
import React from 'react';

// This file was created to define all the shared types for the application.

// --- Enums ---

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

export enum StrainType {
    Sativa = 'Sativa',
    Indica = 'Indica',
    Hybrid = 'Hybrid',
}

export enum ProblemType {
    NutrientDeficiency = 'NUTRIENT_DEFICIENCY',
    Overwatering = 'OVERWATERING',
    Underwatering = 'UNDERWATERING',
    PestInfestation = 'PEST_INFESTATION',
    phTooHigh = 'PH_TOO_HIGH',
    phTooLow = 'PH_TOO_LOW',
}

export enum JournalEntryType {
    Watering = 'WATERING',
    Feeding = 'FEEDING',
    Training = 'TRAINING',
    Observation = 'OBSERVATION',
    System = 'SYSTEM',
    Photo = 'PHOTO',
    PestControl = 'PEST_CONTROL',
    Environment = 'ENVIRONMENT',
    Amendment = 'AMENDMENT',
}

export enum PhotoCategory {
    FullPlant = 'FullPlant',
    Bud = 'Bud',
    Leaf = 'Leaf',
    Roots = 'Roots',
    ProblemArea = 'ProblemArea',
    Trichomes = 'Trichomes',
    Setup = 'Setup',
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
    Sandbox = 'sandbox',
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
export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation';
export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz';
export type SortKey = 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'yield';
export type SortDirection = 'asc' | 'desc';
export type UiDensity = 'comfortable' | 'compact';
export type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt' | 'xml';
export type ModalType = 'watering' | 'feeding' | 'training' | 'pestControl' | 'observation' | 'photo' | 'amendment';
// FIX: Export TaskPriority type alias to be used in other components.
export type TaskPriority = 'high' | 'medium' | 'low';
// FIX: Export NotificationType type alias to be used in other components.
export type NotificationType = 'success' | 'error' | 'info';

// --- Interfaces ---

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
    lastUpdated: number;
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
    postHarvest?: PostHarvestData;
}

export interface PostHarvestData {
    wetWeight: number;
    dryWeight: number;
    terpeneRetentionPercent: number;
    moldRiskPercent: number;
    dryingEnvironment: { temperature: number; humidity: number };
    currentDryDay: number;
    currentCureDay: number;
    jarHumidity: number;
    finalQuality: number;
    chlorophyllPercent: number;
    terpeneProfile: Record<string, number>;
    cannabinoidProfile: { thc: number, cbn: number };
    lastBurpDay: number;
}


export interface PlantProblem {
    type: ProblemType;
    status: 'active' | 'resolved';
    severity: number;
    detectedAt: number;
    resolvedAt?: number;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    // FIX: Use TaskPriority type alias.
    priority: TaskPriority;
    isCompleted: boolean;
    createdAt: number;
    completedAt?: number;
}

export interface PhotoDetails {
    imageId?: string;
    imageUrl?: string;
    photoCategory: PhotoCategory;
}

export interface JournalEntry {
    id: string;
    createdAt: number;
    type: JournalEntryType;
    notes: string;
    details?: Record<string, any> | PhotoDetails;
}

export interface PlantHistoryEntry {
    day: number;
    height: number;
    health: number;
    stressLevel: number;
    substrate: {
        ph: number;
        ec: number;
        moisture: number;
    };
}

export interface RecommendationItem {
    name: string;
    price: number;
    rationale: string;
    watts?: number;
}

export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'circulationFan' | 'pots' | 'soil' | 'nutrients' | 'extra';

export interface Recommendation {
    tent: RecommendationItem;
    light: RecommendationItem;
    ventilation: RecommendationItem;
    circulationFan: RecommendationItem;
    pots: RecommendationItem;
    soil: RecommendationItem;
    nutrients: RecommendationItem;
    extra: RecommendationItem;
    proTip: string;
}

export interface PlantDiagnosisResponse {
    title: string;
    confidence: number;
    diagnosis: string;
    immediateActions: string;
    longTermSolution: string;
    prevention: string;
}

export interface AIResponse {
    title: string;
    content: string;
}

export interface MentorMessage {
    role: 'user' | 'model';
    // FIX: Made title required to ensure consistency and fix type errors with EditableResponse.
    title: string;
    content: string;
    uiHighlights?: { elementId: string; plantId?: string }[];
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
    prosAndCons: {
        pros: string[];
        cons: string[];
    };
    proTip: string;
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
    simulationProfile: 'beginner' | 'expert' | 'experimental' | 'custom';
    simulationSettings: {
        difficulty: 'easy' | 'medium' | 'hard' | 'custom';
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
    defaultGrowSetup: {
        light: { type: 'LED' | 'HPS' | 'CFL'; wattage: number };
        potSize: number;
        medium: 'Soil' | 'Coco' | 'Hydro';
    };
    defaultJournalNotes: {
        watering: string;
        feeding: string;
    };
    defaultExportSettings: {
        source: 'all' | 'selected';
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


export interface GrowSetup {
    potSize: number;
    medium: 'Soil' | 'Coco' | 'Hydro';
    lightHours: number;
}

export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export interface Notification {
    id: number;
    message: string;
    // FIX: Use NotificationType type alias.
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
    notes?: string;
    strainIds: string[];
}

export interface SavedStrainTip extends AIResponse {
    id: string;
    strainId: string;
    strainName: string;
    createdAt: number;
}

export interface ArchivedMentorResponse extends Omit<MentorMessage, 'role'> {
    id: string;
    createdAt: number;
    query: string;
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string;
    plantId: string;
    plantStage: PlantStage;
    createdAt: number;
    query: string;
}

export interface KnowledgeArticle {
    id: string;
    titleKey: string;
    contentKey: string;
    tags: string[];
    triggers: {
        plantStage?: PlantStage | PlantStage[];
        ageInDays?: { min: number; max: number };
        activeProblems?: ProblemType[];
    };
}

export interface StoredImageData {
    id: string;
    data: string;
    createdAt: number;
}

export interface TTSSettings {
    enabled: boolean;
    voiceName: string | null;
    rate: number;
    pitch: number;
}

export interface SpeechQueueItem {
    id: string;
    text: string;
}

export interface Seed {
    id: string;
    strainId: string;
    strainName: string;
    createdAt: number;
}

export interface BreedingState {
    collectedSeeds: Seed[];
    breedingSlots: {
        parentA: string | null; // seed id
        parentB: string | null;
    };
}

export interface SimulationState {
    plants: Record<string, Plant>;
    plantSlots: (string | null)[];
    selectedPlantId: string | null;
    isCatchingUp?: boolean; // Optional property for UI state
    devSpeedMultiplier: number;
}

export type ScenarioAction = 'TOP' | 'LST' | 'NONE';

export interface Scenario {
    id: string;
    titleKey: string;
    descriptionKey: string;
    durationDays: number;
    plantAModifier: { action: ScenarioAction, day: number };
    plantBModifier: { action: ScenarioAction, day: number };
}

export interface Experiment {
    id: string;
    createdAt: number;
    name: string;
    basePlantId: string;
    basePlantName: string;
    scenarioDescription: string;
    durationDays: number;
    originalHistory: PlantHistoryEntry[];
    modifiedHistory: PlantHistoryEntry[];
    originalFinalState: Plant;
    modifiedFinalState: Plant;
}

export interface SandboxState {
    savedExperiments: Experiment[];
    isLoading: boolean;
    error: string | null;
}

export interface LexiconEntry {
  key: string; // Eindeutiger Schlüssel, z.B. 'thc'
  category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General';
}

export interface AdvancedFilterState {
    thcRange: [number, number];
    cbdRange: [number, number];
    floweringRange: [number, number];
    selectedDifficulties: DifficultyLevel[];
    selectedYields: YieldLevel[];
    selectedHeights: HeightLevel[];
    selectedAromas: string[];
    selectedTerpenes: string[];
}

export interface StrainTranslationData {
    description: string;
    typeDetails?: string;
    genetics?: string;
    yieldDetails?: {
        indoor: string;
        outdoor: string;
    };
    heightDetails?: {
        indoor: string;
        outdoor: string;
    };
}

export interface KnowledgeProgress {
    [sectionId: string]: string[];
}

export interface VisualGuide {
  id: string;
  titleKey: string;
  descriptionKey: string;
}

export interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
  triggers: {
    plantStage?: PlantStage | PlantStage[];
  };
}
import { EntityState } from '@reduxjs/toolkit';
import React from 'react';

// =================================================================================================
// I. ENUMS & CORE TYPES
// =================================================================================================

export enum View {
    Strains = 'strains',
    Plants = 'plants',
    Equipment = 'equipment',
    Knowledge = 'knowledge',
    Settings = 'settings',
    Help = 'help',
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
    NutrientDeficiency = 'NutrientDeficiency',
    NutrientBurn = 'NutrientBurn',
    Overwatering = 'Overwatering',
    Underwatering = 'Underwatering',
    PestInfestation = 'PestInfestation',
    VpdHigh = 'VpdHigh',
    VpdLow = 'VpdLow',
    PhOutOfRange = 'PhOutOfRange',
}

export enum JournalEntryType {
    Watering = 'Watering',
    Feeding = 'Feeding',
    Training = 'Training',
    Observation = 'Observation',
    System = 'System',
    Photo = 'Photo',
    PestControl = 'PestControl',
    Environment = 'Environment',
    Amendment = 'Amendment',
    Harvest = 'Harvest',
    PostHarvest = 'PostHarvest',
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

export enum StrainViewTab {
    All = 'allStrains',
    MyStrains = 'myStrains',
    Favorites = 'favorites',
    Genealogy = 'genealogy',
    Exports = 'exports',
    Tips = 'tips',
}

export enum EquipmentViewTab {
    Configurator = 'configurator',
    Setups = 'setups',
    Calculators = 'calculators',
    GrowShops = 'growShops',
    Seedbanks = 'seedbanks',
}

export enum KnowledgeViewTab {
    Mentor = 'mentor',
    Guide = 'guide',
    Archive = 'archive',
    Breeding = 'breeding',
    Sandbox = 'sandbox',
}

export enum CommandGroup {
    Navigation = 'Navigation',
    Plants = 'Plants',
    Strains = 'Strains',
    Knowledge = 'Knowledge',
    Settings = 'Settings',
    General = 'General Actions'
}

export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz';

// =================================================================================================
// II. DOMAIN: STRAINS, GENEALOGY & BREEDING
// =================================================================================================

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type YieldLevel = 'Low' | 'Medium' | 'High';
export type HeightLevel = 'Short' | 'Medium' | 'Tall';

export interface GeneticModifiers {
    pestResistance: number; // Factor > 1 is better
    nutrientUptakeRate: number; // Factor > 1 is better
    stressTolerance: number; // Factor > 1 is better
    rue: number; // Radiation Use Efficiency (g/MJ)
    vpdTolerance: { min: number; max: number }; // ideal VPD range in kPa
    transpirationFactor: number; // base rate modifier
}

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
    geneticModifiers: GeneticModifiers;
}

export interface StrainTranslationData {
    description: string;
    typeDetails?: string;
    genetics?: string;
    yieldDetails?: { indoor: string; outdoor: string };
    heightDetails?: { indoor: string; outdoor: string };
}

export type SortKey = 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'yield' | 'height';
export type SortDirection = 'asc' | 'desc';

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

export interface GenealogyNode {
    id: string;
    name: string;
    type: StrainType;
    thc: number;
    isLandrace: boolean;
    children?: GenealogyNode[];
    _children?: GenealogyNode[]; // For d3 expand/collapse
    isPlaceholder?: boolean;
}

export interface GeneticContribution {
    name: string;
    contribution: number;
}

export interface Seed {
    id: string;
    strainId: string;
    strainName: string;
    quality: number; // 0-1
    createdAt: number;
}

// =================================================================================================
// III. DOMAIN: PLANTS & SIMULATION
// =================================================================================================

export interface GrowSetup {
    lightHours: number;
    potSize: number; // in Liters
    medium: 'Soil' | 'Coco' | 'Hydro';
}

export interface HarvestData {
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
    cannabinoidProfile: { thc: number; cbn: number };
    lastBurpDay: number;
}

export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation';
export type AmendmentType = 'Mycorrhizae' | 'WormCastings';

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
    details?: { [key: string]: any } | PhotoDetails;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    createdAt: number;
    completedAt?: number;
    priority: TaskPriority;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface PlantProblem {
    type: ProblemType;
    severity: number;
    status: 'active' | 'resolved';
}

export interface Plant {
    id: string;
    name: string;
    strain: Strain;
    createdAt: number;
    lastUpdated: number;
    age: number; // in days
    stage: PlantStage;
    health: number; // 0-100
    stressLevel: number; // 0-100
    height: number; // in cm
    biomass: {
        total: number;
        roots: number;
        stem: number;
        leaves: number;
        flowers: number;
    };
    leafAreaIndex: number; // LAI
    isTopped: boolean;
    lstApplied: number;
    environment: {
        internalTemperature: number;
        internalHumidity: number;
        vpd: number;
        co2Level: number;
    };
    medium: {
        ph: number;
        ec: number;
        moisture: number; // % of water holding capacity
        microbeHealth: number; // 0-100
        substrateWater: number; // available water in ml
        nutrientConcentration: { // N-P-K in abstract units
            nitrogen: number;
            phosphorus: number;
            potassium: number;
        };
    };
    nutrientPool: { // Internal plant reserves
        nitrogen: number;
        phosphorus: number;
        potassium: number;
    };
    rootSystem: {
        health: number; // health of the roots
        // root mass is now biomass.roots
    };
    equipment: {
        light: { wattage: number; isOn: boolean; lightHours: number };
        fan: { isOn: boolean; speed: number };
    };
    problems: PlantProblem[];
    journal: JournalEntry[];
    tasks: Task[];
    harvestData: HarvestData | null;
    structuralModel: {
        branches: number;
        nodes: number;
    };
    history: PlantHistoryEntry[];
}

export interface PlantHistoryEntry {
    day: number;
    height: number;
    health: number;
    stressLevel: number;
    medium: {
        ph: number;
        ec: number;
        moisture: number;
    };
}

// =================================================================================================
// IV. DOMAIN: UI, STATE & APP SETTINGS
// =================================================================================================

export interface Command {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.FC;
    group: CommandGroup;
    action: () => void;
    keywords?: string;
    isHeader?: boolean;
    shortcut?: string[];
}

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export type ModalType = 'watering' | 'feeding' | 'training' | 'pestControl' | 'observation' | 'photo' | 'amendment';

export interface TTSSettings {
    enabled: boolean;
    voiceName: string | null;
    rate: number;
    pitch: number;
}

export interface AppSettings {
    version: number;
    language: Language;
    theme: Theme;
    fontSize: 'sm' | 'base' | 'lg';
    defaultView: View;
    isExpertMode: boolean;
    accessibility: {
        highContrast: boolean;
        dyslexiaFont: boolean;
        reducedMotion: boolean;
    };
    tts: TTSSettings;
    uiDensity: 'comfortable' | 'compact';
    strainsViewSettings: {
        defaultSortKey: SortKey;
        defaultSortDirection: SortDirection;
        visibleColumns: (keyof Strain | 'agronomic')[];
    };
    simulationSettings: {
        autoAdvance: boolean;
        autoJournaling: {
            logStageChanges: boolean;
            logProblems: boolean;
            logTasks: boolean;
        };
        speedMultiplier: number;
        simulationProfile: 'beginner' | 'expert' | 'experimental' | 'custom';
        pestPressure: number;
        nutrientSensitivity: number;
        environmentalStability: number;
    };
    notificationSettings: {
        enabled: boolean;
        stageChange: boolean;
        problemDetected: boolean;
        harvestReady: boolean;
        newTask: boolean;
        quietHours: {
            enabled: boolean;
            start: string; // "HH:mm"
            end: string;   // "HH:mm"
        };
    };
    defaultGrowSetup: GrowSetup & { light: { wattage: number } };
    defaultExportFormat: ExportFormat;
    defaultJournalNotes: {
        watering: string;
        feeding: string;
    };
    onboardingCompleted: boolean;
    showArchivedInPlantsView: boolean;
}

export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export interface SpeechQueueItem {
    id: string;
    text: string;
}

// =================================================================================================
// V. DOMAIN: AI, KNOWLEDGE & MENTOR
// =================================================================================================

export type PlantCount = '1' | '2-3';

export interface RecommendationItem {
    name: string;
    price: number;
    rationale: string;
    watts?: number;
}
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
export type RecommendationCategory = keyof Omit<Recommendation, 'proTip'>;

export interface AIResponse {
    title: string;
    content: string;
}

export interface PlantDiagnosisResponse extends AIResponse {
    confidence: number;
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

export interface DeepDiveGuide {
    introduction: string;
    stepByStep: string[];
    prosAndCons: {
        pros: string[];
        cons: string[];
    };
    proTip: string;
}

export interface MentorMessage {
    id: string;
    role: 'user' | 'model';
    title: string;
    content: string;
    uiHighlights?: { elementId: string, plantId?: string }[];
}

export interface ArchivedMentorResponse extends MentorMessage {
    id: string;
    createdAt: number;
    query: string;
}

export interface SavedStrainTip extends AIResponse {
    id: string;
    createdAt: number;
    strainId: string;
    strainName: string;
    imageUrl?: string;
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string;
    createdAt: number;
    plantId: string;
    plantStage: PlantStage;
    query: string;
}

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

export interface LexiconEntry {
  key: string;
  category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General';
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

export interface Scenario {
    id: string;
    titleKey: string;
    descriptionKey: string;
    durationDays: number;
    plantAModifier: { action: ScenarioAction; day: number };
    plantBModifier: { action: ScenarioAction; day: number };
}
export type ScenarioAction = 'TOP' | 'LST' | 'NONE';

export interface Experiment {
    id: string;
    createdAt: number;
    name: string;
    basePlantId: string;
    basePlantName: string;
    scenarioDescription: string;
    durationDays: number;
    originalHistory: any[];
    modifiedHistory: any[];
    originalFinalState: Plant;
    modifiedFinalState: Plant;
}

// =================================================================================================
// VI. DOMAIN: STORAGE & EXPORTS
// =================================================================================================

export type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt' | 'xml';

export interface SavedExport {
    id: string;
    createdAt: number;
    name: string;
    source: 'selected' | 'all';
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
        plantCount: string;
        growStyle: string;
        budget: string;
    };
}

export interface StoredImageData {
    id: string;
    data: string; // base64 data URL
    createdAt: number;
}

// =================================================================================================
// VII. REDUX STATE SHAPES
// =================================================================================================

export interface SimulationState {
    plants: EntityState<Plant, string>;
    plantSlots: (string | null)[];
    selectedPlantId: string | null;
    devSpeedMultiplier: number;
}

export interface BreedingState {
    collectedSeeds: Seed[];
    breedingSlots: {
        parentA: string | null;
        parentB: string | null;
    };
}

export interface SandboxState {
    savedExperiments: Experiment[];
    isLoading: boolean;
    error: string | null;
}

export interface KnowledgeProgress {
    [sectionId: string]: string[];
}
import { EntityState } from '@reduxjs/toolkit';
import type { FC } from 'react';

// Enums and String Literal Types
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

export type FloweringType = 'Photoperiod' | 'Autoflower';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type YieldLevel = 'Low' | 'Medium' | 'High';
export type HeightLevel = 'Short' | 'Medium' | 'Tall';

export type Language = 'en' | 'de';

export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz' | 'rainbowKush';

export type SortKey = 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'yield' | 'height';
export type SortDirection = 'asc' | 'desc';

export type ModalType = 'watering' | 'feeding' | 'training' | 'observation' | 'photo' | 'pestControl' | 'amendment';

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

export enum StrainViewTab {
    All = 'all',
    MyStrains = 'my-strains',
    Favorites = 'favorites',
    Genealogy = 'genealogy',
    Exports = 'exports',
    Tips = 'tips',
}

export type TaskPriority = 'high' | 'medium' | 'low';

export enum ProblemType {
    NutrientDeficiency = 'NUTRIENT_DEFICIENCY',
    Overwatering = 'OVERWATERING',
    Underwatering = 'UNDERWATERING',
    PestInfestation = 'PEST_INFESTATION',
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
    Harvest = 'HARVEST',
    PostHarvest = 'POST_HARVEST',
}

export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation';
export type AmendmentType = 'Mycorrhizae' | 'WormCastings';
export enum PhotoCategory {
    FullPlant = 'FullPlant',
    Bud = 'Bud',
    Leaf = 'Leaf',
    Roots = 'Roots',
    ProblemArea = 'ProblemArea',
    Trichomes = 'Trichomes',
    Setup = 'Setup',
}

// Strain related types
export interface GeneticModifiers {
    pestResistance: number;
    nutrientUptakeRate: number;
    stressTolerance: number;
    rue: number; // Radiation Use Efficiency
    vpdTolerance: { min: number; max: number };
    transpirationFactor: number;
    stomataSensitivity: number;
}

export interface Strain {
    id: string;
    name: string;
    type: StrainType;
    typeDetails?: string;
    genetics?: string;
    floweringType: FloweringType;
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
        yieldDetails?: { indoor?: string; outdoor?: string };
        heightDetails?: { indoor?: string; outdoor?: string };
    };
    aromas?: string[];
    dominantTerpenes?: string[];
    geneticModifiers: GeneticModifiers;
}

export interface StrainTranslationData {
    description?: string;
    typeDetails?: string;
    genetics?: string;
    yieldDetails?: { indoor?: string; outdoor?: string };
    heightDetails?: { indoor?: string; outdoor?: string };
}

// Plant & Simulation types
export interface GrowSetup {
    lightType: LightType;
    lightWattage: number;
    lightHours: number;
    ventilation: VentilationPower;
    hasCirculationFan: boolean;
    potSize: number;
    potType: PotType;
    medium: 'Soil' | 'Coco' | 'Hydro';
}

export type LightType = 'LED' | 'HPS';
export type VentilationPower = 'low' | 'medium' | 'high';
export type PotType = 'Plastic' | 'Fabric';

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
    biomass: { total: number; stem: number; leaves: number; flowers: number };
    leafAreaIndex: number;
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
        moisture: number; // 0-100%
        microbeHealth: number;
        substrateWater: number;
        nutrientConcentration: { nitrogen: number; phosphorus: number; potassium: number };
    };
    nutrientPool: { nitrogen: number; phosphorus: number; potassium: number };
    rootSystem: { health: number; rootMass: number };
    equipment: {
        light: { type: LightType; wattage: number; isOn: boolean; lightHours: number };
        exhaustFan: { power: VentilationPower; isOn: boolean };
        circulationFan: { isOn: boolean };
        potSize: number;
        potType: PotType;
    };
    problems: PlantProblem[];
    journal: JournalEntry[];
    tasks: Task[];
    harvestData: HarvestData | null;
    structuralModel: { branches: number; nodes: number };
    history: PlantHistoryEntry[];
    // Real-time chemical synthesis tracking
    cannabinoidProfile: { thc: number; cbd: number; cbn: number; };
    terpeneProfile: Record<string, number>;
    stressCounters: {
        vpd: number;
        ph: number;
        ec: number;
        moisture: number;
    };
}

export interface PlantProblem {
    type: ProblemType;
    severity: number;
    onsetDay: number;
    status: 'active' | 'resolved';
}

export interface JournalEntry {
    id: string;
    createdAt: number;
    type: JournalEntryType;
    notes: string;
    details?: JournalEntryDetails;
}

export type JournalEntryDetails = WateringDetails | FeedingDetails | TrainingDetails | ObservationDetails | SystemDetails | PhotoDetails | PestControlDetails | EnvironmentDetails | AmendmentDetails | HarvestDetails | PostHarvestDetails;
export interface WateringDetails { amountMl?: number; ph?: number; ec?: number; }
export interface FeedingDetails extends WateringDetails { npk?: { n: number; p: number; k: number } }
export interface TrainingDetails { type: TrainingType; }
export interface ObservationDetails { diagnosis?: string; }
export interface SystemDetails { from: PlantStage, to: PlantStage }
export interface PhotoDetails { imageId?: string; imageUrl?: string; photoCategory: PhotoCategory }
export interface PestControlDetails { method: string; product?: string; }
export interface EnvironmentDetails { temp?: number; humidity?: number; }
export interface AmendmentDetails { type: AmendmentType; }
export interface HarvestDetails { wetWeight: number; }
export interface PostHarvestDetails { dryWeight: number; quality: number; }

export interface Task {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    createdAt: number;
    completedAt?: number;
    priority: TaskPriority;
}

export interface HarvestData {
    wetWeight: number;
    dryWeight: number;
    currentDryDay: number;
    currentCureDay: number;
    lastBurpDay: number;
    jarHumidity: number;
    chlorophyllPercent: number;
    terpeneRetentionPercent: number;
    moldRiskPercent: number;
    finalQuality: number;
    cannabinoidProfile: { thc: number; cbn: number };
    terpeneProfile: Record<string, number>;
}

export interface PlantHistoryEntry {
    day: number;
    health: number;
    height: number;
    stressLevel: number;
    medium: { ph: number; ec: number; moisture: number };
}

export interface SimulationState {
    plants: EntityState<Plant, string>;
    plantSlots: (string | null)[];
    selectedPlantId: string | null;
    devSpeedMultiplier: number;
}

// AI related types
export interface RecommendationItem {
    name: string;
    price: number;
    rationale: string;
    watts?: number;
}
export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'circulationFan' | 'pots' | 'soil' | 'nutrients' | 'extra';
export type Recommendation = Record<RecommendationCategory, RecommendationItem> & { proTip: string };

export interface PlantDiagnosisResponse {
    title: string;
    content: string;
    confidence: number;
    immediateActions: string;
    longTermSolution: string;
    prevention: string;
    diagnosis: string;
}

export interface AIResponse {
    title: string;
    content: string;
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
    prosAndCons: { pros: string[]; cons: string[] };
    proTip: string;
}

export interface MentorMessage {
    id?: string;
    role: 'user' | 'model';
    title: string;
    content: string;
    uiHighlights?: { elementId: string, plantId?: string }[];
}

// App settings
export interface AppSettings {
    version: number;
    onboardingCompleted: boolean;
    general: {
        language: Language;
        theme: Theme;
        fontSize: 'sm' | 'base' | 'lg';
        defaultView: View;
        uiDensity: 'comfortable' | 'compact';
        dyslexiaFont: boolean;
        reducedMotion: boolean;
        colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    };
    voiceControl: {
        enabled: boolean;
        hotwordEnabled: boolean;
        confirmationSound: boolean;
    };
    tts: TTSSettings;
    strainsView: {
        defaultSortKey: SortKey;
        defaultSortDirection: SortDirection;
        defaultViewMode: 'list' | 'grid';
        strainsPerPage: number;
        visibleColumns: string[];
        prioritizeUserStrains: boolean;
        genealogyDefaultDepth: number;
        genealogyDefaultLayout: 'horizontal' | 'vertical';
        aiTipsDefaultFocus: string;
        aiTipsDefaultExperience: string;
    };
    plantsView: {
        showArchived: boolean;
        autoGenerateTasks: boolean;
    };
    simulation: {
        speedMultiplier: number;
        autoJournaling: {
            logStageChanges: boolean;
            logProblems: boolean;
            logTasks: boolean;
        };
        simulationProfile: 'beginner' | 'intermediate' | 'expert';
        pestPressure: number;
        nutrientSensitivity: number;
        environmentalStability: number;
        leafTemperatureOffset: number;
        lightExtinctionCoefficient: number;
        nutrientConversionEfficiency: number;
        stomataSensitivity: number;
    };
    notifications: {
        enabled: boolean;
        stageChange: boolean;
        problemDetected: boolean;
        harvestReady: boolean;
        newTask: boolean;
        lowWaterWarning: boolean;
        phDriftWarning: boolean;
        quietHours: {
            enabled: boolean;
            start: string;
            end: string;
        };
    };
    defaults: {
        growSetup: GrowSetup;
        journalNotes: {
            watering: string;
            feeding: string;
        };
    };
    data: {
        autoBackup: 'off' | 'daily' | 'weekly';
        cloudSync: {
            enabled: boolean;
            provider: 'none' | 'gdrive';
        };
    };
    privacy: {
        requirePinOnLaunch: boolean;
        pin: string | null;
        clearAiHistoryOnExit: boolean;
    };
}

export interface TTSSettings {
    enabled: boolean;
    voiceName: string | null;
    rate: number;
    pitch: number;
    volume: number;
    highlightSpeakingText: boolean;
}

// UI & State types
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

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface StoredImageData {
    id: string;
    data: string; // base64 data URL
    createdAt: number;
}

export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

// Help & Knowledge types
export interface LexiconEntry {
    id?: string;
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

export interface KnowledgeArticle {
    id: string;
    titleKey: string;
    contentKey: string;
    tags: string[];
    triggers: {
        ageInDays?: { min: number; max: number };
        plantStage?: PlantStage | PlantStage[];
        activeProblems?: ProblemType[];
    }
}


export interface ArchivedMentorResponse {
    id: string;
    createdAt: number;
    query: string;
    title: string;
    content: string;
    uiHighlights?: { elementId: string; plantId?: string }[];
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string;
    createdAt: number;
    plantId: string;
    plantStage: PlantStage;
    query: string; // What was asked, or "Proactive Diagnosis"
}

export interface SavedStrainTip extends StructuredGrowTips {
    id: string;
    createdAt: number;
    strainId: string;
    strainName: string;
    title: string;
    imageUrl?: string;
}

export interface SavedSetup {
    id: string;
    name: string;
    createdAt: number;
    recommendation: Recommendation;
    totalCost: number;
    sourceDetails: {
        plantCount: PlantCount;
        experience: ExperienceLevel;
        budget: number;
        priorities: GrowPriority[];
        customNotes: string;
        growSpace: { width: number; depth: number };
        floweringTypePreference: 'autoflower' | 'photoperiod' | 'any';
    };
}

export type PlantCount = '1' | '2' | '3';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';
export type GrowPriority = 'yield' | 'quality' | 'stealth' | 'easeOfUse' | 'energy';


// Other types from slices
export interface Command {
    id: string;
    title: string;
    subtitle?: string;
    group: string;
    icon: FC;
    action: () => void;
    keywords?: string;
    shortcut?: string[];
    isHeader?: boolean;
}

export interface SpeechQueueItem {
    id: string;
    text: string;
}

export interface KnowledgeProgress {
    [sectionId: string]: string[];
}

export interface Seed {
    id: string;
    strainId: string;
    strainName: string;
    quality: number; // 0-1
    createdAt: number;
}

export interface Scenario {
    id: string;
    titleKey: string;
    descriptionKey: string;
    durationDays: number;
    plantAModifier: { day: number, action: ScenarioAction };
    plantBModifier: { day: number, action: ScenarioAction };
}
export type ScenarioAction = 'TOP' | 'LST' | 'NONE';

export interface ExperimentResult {
    originalHistory: PlantHistoryEntry[];
    modifiedHistory: PlantHistoryEntry[];
    originalFinalState: Plant;
    modifiedFinalState: Plant;
}

export interface SavedExperiment extends ExperimentResult {
    id: string;
    scenarioId: string;
    basePlantName: string;
    createdAt: number;
}

// Genealogy Types
export interface GenealogyNode {
    id: string;
    name: string;
    type: StrainType;
    thc: number;
    isLandrace: boolean;
    isPlaceholder?: boolean; // For circular dependencies
    children?: GenealogyNode[];
    _children?: GenealogyNode[]; // For d3 collapse/expand
}

export interface GeneticContribution {
    name: string;
    contribution: number;
}

export type SandboxState = {
    currentExperiment: (ExperimentResult & { basePlantId?: string, scenarioId?: string }) | null;
    status: 'idle' | 'running' | 'succeeded' | 'failed';
    savedExperiments: SavedExperiment[];
};

export interface SavedExport {
    id: string;
    name: string;
    createdAt: number;
    format: 'pdf' | 'txt' | 'csv' | 'json' | 'xml';
    strainIds: string[];
    sourceDescription: string;
}
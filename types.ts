import React from 'react';

// --- Basic types ---
export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz' | 'rainbowKush';

// --- Strain related types ---
export enum StrainType {
    Sativa = 'Sativa',
    Indica = 'Indica',
    Hybrid = 'Hybrid',
}
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type YieldLevel = 'Low' | 'Medium' | 'High';
export type HeightLevel = 'Short' | 'Medium' | 'Tall';

export interface GeneticModifiers {
    pestResistance: number;
    nutrientUptakeRate: number;
    stressTolerance: number;
    rue: number; // Radiation Use Efficiency
    vpdTolerance: { min: number; max: number };
    transpirationFactor: number;
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
        yieldDetails?: { indoor?: string; outdoor?: string };
        heightDetails?: { indoor?: string; outdoor?: string };
    };
    aromas?: string[];
    dominantTerpenes?: string[];
    geneticModifiers: GeneticModifiers;
}

// --- Plant and Simulation types ---
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
// FIX: Converted PhotoCategory from a type alias to an enum.
// This allows it to be used as a value (e.g., `Object.values(PhotoCategory)`) at runtime,
// fixing errors in LogActionModal.tsx and AiDiagnosticsModal.tsx.
export enum PhotoCategory {
    FullPlant = 'FullPlant',
    Bud = 'Bud',
    Leaf = 'Leaf',
    Roots = 'Roots',
    ProblemArea = 'ProblemArea',
    Trichomes = 'Trichomes',
    Setup = 'Setup',
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
    details?: any; // Could be more specific, but 'any' will work for now
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    createdAt: number;
    completedAt?: number;
    priority: TaskPriority;
}

export enum ProblemType {
    NutrientDeficiency = 'NUTRIENT_DEFICIENCY',
    Overwatering = 'OVERWATERING',
    Underwatering = 'UNDERWATERING',
    PestInfestation = 'PEST_INFESTATION',
}

export interface PlantProblem {
    type: ProblemType;
    status: 'active' | 'resolved';
    detectedAt: number;
}

export type LightType = 'LED' | 'HPS';
export type VentilationPower = 'low' | 'medium' | 'high';
export type PotType = 'Plastic' | 'Fabric';

export interface GrowSetup {
    lightType: LightType;
    lightWattage: number;
    lightHours: number;
    ventilation: VentilationPower;
    hasCirculationFan: boolean;
    potSize: number; // in Liters
    potType: PotType;
    medium: 'Soil' | 'Coco' | 'Hydro';
}

export interface HarvestData {
    wetWeight: number;
    dryWeight: number;
    finalQuality: number;
    currentDryDay: number;
    currentCureDay: number;
    lastBurpDay: number;
    terpeneRetentionPercent: number;
    moldRiskPercent: number;
    chlorophyllPercent: number;
    cannabinoidProfile: {
        thc: number;
        cbd: number;
        cbn: number;
    };
    terpeneProfile: Record<string, number>;
}

export interface Plant {
    id: string;
    name: string;
    strain: Strain;
    createdAt: number;
    lastUpdated: number;
    age: number;
    stage: PlantStage;
    health: number; // 0-100
    stressLevel: number; // 0-100
    height: number; // in cm
    biomass: { total: number; roots: number; stem: number; leaves: number; flowers: number; }; // in grams
    leafAreaIndex: number;
    isTopped: boolean;
    lstApplied: number; // count of LST applications
    environment: {
        internalTemperature: number; // C
        internalHumidity: number; // %
        vpd: number; // kPa
        co2Level: number; // ppm
    };
    medium: {
        ph: number;
        ec: number;
        moisture: number; // %
        microbeHealth: number; // %
        substrateWater: number; // mL
        nutrientConcentration: { nitrogen: number; phosphorus: number; potassium: number; };
    };
    nutrientPool: { nitrogen: number; phosphorus: number; potassium: number; }; // in grams
    rootSystem: { health: number; };
    equipment: {
        light: { type: LightType; wattage: number; isOn: boolean; lightHours: number; };
        exhaustFan: { power: VentilationPower; isOn: boolean; };
        circulationFan: { isOn: boolean; };
    };
    problems: PlantProblem[];
    journal: JournalEntry[];
    tasks: Task[];
    harvestData: HarvestData | null;
    structuralModel: { branches: number; nodes: number };
    history: PlantHistoryEntry[];
}

export interface SimulationState {
    plants: {
        ids: string[];
        entities: Record<string, Plant | undefined>;
    };
    plantSlots: (string | null)[];
    selectedPlantId: string | null;
    devSpeedMultiplier: number;
}


// UI and App State types
export enum View {
    Strains = 'strains',
    Plants = 'plants',
    Equipment = 'equipment',
    Knowledge = 'knowledge',
    Settings = 'settings',
    Help = 'help',
}
export enum StrainViewTab {
    All = 'all',
    MyStrains = 'my-strains',
    Favorites = 'favorites',
    Genealogy = 'genealogy',
    Exports = 'exports',
    Tips = 'tips',
}
export enum EquipmentViewTab {
    Configurator = 'configurator',
    Setups = 'setups',
    Calculators = 'calculators',
    GrowShops = 'grow-shops',
    Seedbanks = 'seedbanks',
}
export enum KnowledgeViewTab {
    Mentor = 'mentor',
    Guide = 'guide',
    Archive = 'archive',
    Breeding = 'breeding',
    Sandbox = 'sandbox',
}
export type ModalType = 'watering' | 'feeding' | 'training' | 'observation' | 'photo' | 'pestControl' | 'amendment';

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

// Settings
export type SortKey = 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'yield' | 'height';
export type SortDirection = 'asc' | 'desc';

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
        visibleColumns: ('type' | 'thc' | 'cbd' | 'floweringTime')[];
    };
    simulationSettings: {
        autoAdvance: boolean;
        autoJournaling: { logStageChanges: boolean; logProblems: boolean; logTasks: boolean };
        speedMultiplier: number;
        simulationProfile: 'beginner' | 'expert';
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
        quietHours: { enabled: boolean; start: string; end: string };
    };
    // FIX: Removed the `Omit` utility type. The default settings object includes these properties,
    // so the type definition must also include them to resolve the type mismatch error in settingsSlice.ts.
    defaultGrowSetup: GrowSetup;
    defaultExportFormat: ExportFormat;
    defaultJournalNotes: { watering: string; feeding: string };
    onboardingCompleted: boolean;
    showArchivedInPlantsView: boolean;
}

export interface StrainsViewState {
    strainsViewTab: StrainViewTab;
    strainsViewMode: 'list' | 'grid';
    selectedStrainIds: string[];
    selectedStrainId: string | null;
}

// AI related types
export interface AIResponse {
    title: string;
    content: string;
}
export interface PlantDiagnosisResponse extends AIResponse {
    confidence: number;
    immediateActions: string;
    longTermSolution: string;
    prevention: string;
    diagnosis?: string;
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
    uiHighlights?: { elementId: string; plantId?: string }[];
}

// Data and Archive types
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

export interface RecommendationItem {
    name: string;
    price: number;
    rationale: string;
    watts?: number;
}
export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'circulationFan' | 'pots' | 'soil' | 'nutrients' | 'extra';
export type Recommendation = Record<RecommendationCategory, RecommendationItem> & { proTip: string };
export type PlantCount = '1' | '2' | '3';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';
export type GrowPriority = 'yield' | 'quality' | 'stealth' | 'easeOfUse' | 'energy';


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
        customNotes?: string;
        growSpace?: { width: number; depth: number };
        floweringTypePreference?: 'autoflower' | 'photoperiod' | 'any';
    };
}

export interface ArchivedMentorResponse extends Omit<MentorMessage, 'role'> {
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

export interface SavedStrainTip extends StructuredGrowTips {
    id: string;
    createdAt: number;
    strainId: string;
    strainName: string;
    imageUrl?: string;
    title: string;
}

// Misc UI
export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export interface StoredImageData {
    id: string;
    data: string; // base64 data URL
    createdAt: number;
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

export interface Command {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.FC<any>;
    action: () => void;
    group: CommandGroup;
    keywords?: string;
    isHeader?: boolean;
    shortcut?: string[];
}
export enum CommandGroup {
    Navigation = 'Navigation',
    General = 'General Actions',
    Plants = 'Plant Actions',
    Strains = 'Strain Actions',
    Knowledge = 'Knowledge Base',
    Settings = 'Settings & Data',
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

export interface SpeechQueueItem {
    id: string;
    text: string;
}

export interface Seed {
    id: string;
    strainId: string;
    strainName: string;
    quality: number; // 0-1
    createdAt: number;
}
  
export interface BreedingState {
    collectedSeeds: Seed[];
    breedingSlots: {
        parentA: string | null; // seed ID
        parentB: string | null; // seed ID
    };
}

export interface KnowledgeProgress {
    [sectionId: string]: string[]; // Array of completed item IDs
}

export type ScenarioAction = 'TOP' | 'LST' | 'NONE';

export interface Scenario {
    id: string;
    titleKey: string;
    descriptionKey: string;
    durationDays: number;
    plantAModifier: {
        day: number;
        action: ScenarioAction;
    };
    plantBModifier: {
        day: number;
        action: ScenarioAction;
    };
}

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

// FIX: Export SandboxState type to be used in components, resolving an import error in SandboxView.tsx.
export interface SandboxState {
    currentExperiment: (ExperimentResult & { basePlantId?: string, scenarioId?: string }) | null;
    status: 'idle' | 'running' | 'succeeded' | 'failed';
    savedExperiments: SavedExperiment[];
}

export interface GenealogyNode {
    name: string;
    id: string;
    children?: GenealogyNode[];
    _children?: GenealogyNode[];
    isLandrace: boolean;
    type: StrainType;
    thc: number;
    isPlaceholder?: boolean;
}

export interface GeneticContribution {
    name: string;
    contribution: number;
}

export interface StrainTranslationData {
    description: string;
    typeDetails?: string;
    genetics?: string;
    yieldDetails?: {
      indoor?: string;
      outdoor?: string;
    };
    heightDetails?: {
      indoor?: string;
      outdoor?: string;
    };
}
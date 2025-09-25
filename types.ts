// --- Core Enums & Simple Types ---
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

export interface StrainChemicalProfile {
    thcPotential: [number, number];
    cbdPotential: [number, number];
    terpenes: Record<string, number>; // e.g. { myrcene: 0.8, limonene: 0.5 }
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
    chemicalProfile?: StrainChemicalProfile;
}

export interface StrainTranslationData {
    description?: string;
    typeDetails?: string;
    genetics?: string;
    yieldDetails?: { indoor: string; outdoor: string };
    heightDetails?: { indoor: string; outdoor: string };
}


// --- Plant Simulation & Management ---

export interface PlantVitals {
    // This now holds plant-specific biological metrics, not substrate metrics.
    transpirationRate: number; // ml/hour
    photosynthesisRate: number; // relative 0-1
}

export interface PlantEnvironment {
    ambientTemperature: number; // Temp outside the tent
    ambientHumidity: number; // Humidity outside the tent
    co2Level: number; // ppm
    airExchangeRate: number; // m³/hour
    // Calculated values
    internalTemperature: number;
    internalHumidity: number;
}

export interface PlantEquipment {
    light: { type: 'LED' | 'HPS' | 'CFL'; wattage: number; isOn: boolean };
    exhaustFan: { cfm: number; speed: number; isOn: boolean }; // CFM converted to m³/h
    humidifier?: { isOn: boolean };
    dehumidifier?: { isOn: boolean };
}

export type WaterSourceType = 'TapWater' | 'ReverseOsmosis' | 'RainWater';
export interface WaterSource {
    type: WaterSourceType;
    basePh: number;
    baseEc: number;
}

export interface PlantSubstrate {
    type: 'Soil' | 'Coco' | 'Hydro';
    volumeLiters: number;
    ph: number;
    ec: number;
    moisture: number; // 0-100%
    microbeHealth: number; // 0-100
    runoff: { ph: number; ec: number; };
}

export interface PlantProblem {
    type: 'Overwatering' | 'Underwatering' | 'NutrientBurn' | 'NutrientDeficiency' | 'pHLockout' | 'TempStress' | 'HumidityStress' | 'SpiderMites' | 'PowderyMildew' | 'RootRot';
    status: 'active' | 'resolved';
    startedAt: number; // timestamp
    resolvedAt?: number;
    severity: 'Low' | 'Medium' | 'High';
}

export type JournalEntryType = 'WATERING' | 'FEEDING' | 'TRAINING' | 'OBSERVATION' | 'SYSTEM' | 'PHOTO' | 'PEST_CONTROL' | 'ENVIRONMENT' | 'AMENDMENT';
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
        fertilizerType?: 'Organic' | 'SaltBased';
        amendmentType?: 'Mycorrhizae' | 'BeneficialBacteria' | 'WormCastings';
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
    // Snapshot of substrate for historical charts
    substrate: { ph: number; ec: number; moisture: number };
}

export interface PlantNode {
  id: string;
  position: number;
  lightExposure: number; // 0-1
  isTopped: boolean;
  shoots: PlantShoot[];
}

export interface PlantShoot {
  id: string;
  length: number; // in cm
  nodes: PlantNode[];
  isMainStem: boolean;
  angle: number; // 0 = vertical, 90 = horizontal
}

// FIX: Add alias for backwards compatibility where PlantStructuralModel was used.
export type PlantStructuralModel = PlantShoot;

export interface Plant {
    id: string;
    name: string;
    strain: Strain;
    age: number; // days
    stage: PlantStage;
    health: number; // 0-100
    height: number; // cm
    biomass: number; // abstract total mass
    stressLevel: number; // 0-100
    
    // Core Simulation Properties
    vitals: PlantVitals;
    substrate: PlantSubstrate;
    environment: PlantEnvironment;
    equipment: PlantEquipment;
    waterSource: WaterSource;
    internalClock: number;
    hormoneLevels: { florigen: number; };
    geneticModifiers: {
      growthSpeedFactor: number;
      nutrientDemandFactor: number;
      pestResistanceFactor: number;
      stressToleranceFactor: number;
    };
    currentChemicals: {
        thc: number;
        cbd: number;
        terpenes: Record<string, number>;
    };
    rootSystem: {
      rootMass: number;
      rootHealth: number; // 0-100
    };
    
    // Management Properties
    problems: PlantProblem[];
    journal: JournalEntry[];
    history: PlantHistoryEntry[];
    tasks: Task[];
    
    // Structure & Post-Harvest
    structuralModel: PlantShoot;
    postHarvest?: {
        wetWeight?: number;
        dryWeight?: number;
        yieldPerWatt?: number;
        qualityRating?: number; // will be `finalQuality`
        dryingStartTime?: number;
        curingStartTime?: number;
        isDrying?: boolean;
        isCuring?: boolean;
        finalQuality?: number;
    };
}


// --- AI & Recommendations ---

// FIX: Define and export the GrowSetup type.
export interface GrowSetup {
    lightType: 'LED' | 'HPS' | 'CFL';
    wattage: number;
    potSize: number;
    medium: PlantSubstrate['type'];
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
    defaultGrowSetup: Pick<PlantEquipment, 'light'> & { potSize: number, medium: PlantSubstrate['type'] };
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
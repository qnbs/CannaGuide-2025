import type React from 'react';
import {
    AiSlice
} from "./stores/slices/aiSlice";
import {
    ArchivesSlice
} from "./stores/slices/archivesSlice";
import {
    FavoritesSlice
} from "./stores/slices/favoritesSlice";
import {
    KnowledgeSlice
} from "./stores/slices/knowledgeSlice";
import {
    NotesSlice
} from "./stores/slices/notesSlice";
import {
    PlantSlice
} from "./stores/slices/plantSlice";
import {
    SavedItemsSlice
} from "./stores/slices/savedItemsSlice";
import {
    SettingsSlice
} from "./stores/slices/settingsSlice";
import {
    StrainsViewSlice
} from "./stores/slices/strainsViewSlice";
import {
    TTSSlice
} from "./stores/slices/ttsSlice";
import {
    UISlice
} from "./stores/slices/uiSlice";
import {
    UserStrainsSlice
} from "./stores/slices/userStrainsSlice";
import {
    SimulationSlice
} from "./stores/slices/simulationSlice";
import { BreedingSlice } from "./stores/slices/breedingSlice";

// --- ENUMS & LITERAL TYPES ---

export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz';
// FIX: Changed View from a type to an enum to be able to reference its values.
export enum View {
    Strains = 'Strains',
    Plants = 'Plants',
    Equipment = 'Equipment',
    Knowledge = 'Knowledge',
    Settings = 'Settings',
    Help = 'Help'
}
export type StrainType = 'Sativa' | 'Indica' | 'Hybrid';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type YieldLevel = 'Low' | 'Medium' | 'High';
export type HeightLevel = 'Short' | 'Medium' | 'Tall';
export type FloweringType = 'Photoperiod' | 'Autoflower';
export type SortDirection = 'asc' | 'desc';
export type SortKey = 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'yield';
export type StrainViewTab = 'all' | 'my-strains' | 'favorites' | 'exports' | 'tips';
export type ExportSource = 'selected' | 'all';
export type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt' | 'xml';
export type UiDensity = 'comfortable' | 'compact';
export type NotificationType = 'success' | 'error' | 'info';
export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation';

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
    Overwatering = 'OVERWATERING',
    Underwatering = 'UNDERWATERING',
    NutrientBurn = 'NUTRIENT_BURN',
    NutrientDeficiency = 'NUTRIENT_DEFICIENCY',
    phTooLow = 'PH_TOO_LOW',
    phTooHigh = 'PH_TOO_HIGH',
    tempTooHigh = 'TEMP_TOO_HIGH',
    tempTooLow = 'TEMP_TOO_LOW',
    humidityTooHigh = 'HUMIDITY_TOO_HIGH',
    humidityTooLow = 'HUMIDITY_TOO_LOW',
    vpdTooLow = 'VPD_TOO_LOW',
    vpdTooHigh = 'VPD_TOO_HIGH',
    Pest = 'PEST',
}

// --- CORE DATA STRUCTURES ---

export interface Strain {
    id: string;
    name: string;
    type: StrainType;
    typeDetails ? : string;
    genetics ? : string;
    floweringType: FloweringType;
    thc: number;
    cbd: number;
    thcRange ? : string;
    cbdRange ? : string;
    floweringTime: number;
    floweringTimeRange ? : string;
    description ? : string;
    agronomic: {
        difficulty: DifficultyLevel;
        yield: YieldLevel;
        height: HeightLevel;
        yieldDetails ? : {
            indoor: string;
            outdoor: string
        };
        heightDetails ? : {
            indoor: string;
            outdoor: string
        };
    };
    aromas ? : string[];
    dominantTerpenes ? : string[];
    idealConditions ? : {
        phRange ? : [number, number];
        ecRange ? : [number, number];
        tempRange ? : [number, number];
        humidityRange ? : [number, number];
    };
}

export interface Plant {
    id: string;
    name: string;
    strain: Strain;
    createdAt: number;
    age: number; // in days
    stage: PlantStage;
    height: number; // in cm
    biomass: number; // in grams
    health: number; // 0-100
    stressLevel: number; // 0-100
    isTopped: boolean;
    structuralModel: StructuralModel;
    cannabinoids: {
        thc: number,
        cbd: number
    };
    terpenes: number;
    postHarvest ? : PostHarvestData;
    substrate: {
        type: 'Soil' | 'Coco' | 'Hydro';
        ph: number;
        ec: number;
        moisture: number; // 0-100%
        volumeLiters: number;
        microbeHealth: number; // 0-100
    };
    environment: {
        temperature: number; // Ambient temp
        humidity: number; // Ambient humidity
        vpd: number;
        internalTemperature: number;
        internalHumidity: number;
        co2Level: number;
    };
    equipment: {
        light: {
            type: 'LED' | 'HPS' | 'CFL',
            wattage: number,
            isOn: boolean
        };
        fan: {
            isOn: boolean,
            speed: number
        };
    };
    rootSystem: {
        rootMass: number;
        rootHealth: number;
    };
    tasks: Task[];
    problems: PlantProblem[];
    journal: JournalEntry[];
    history: PlantHistoryEntry[];
}

// --- SUB-STRUCTURES ---

export interface StructuralModel {
    nodes: {
        id: string;
        age: number;
    }[];
    shoots: {
        id: string;
        length: number;
        angle: number;
        isMain: boolean;
        nodeIndex: number;
    }[];
}

export interface PostHarvestData {
    dryWeight: number;
    finalQuality: number;
    currentDryDay: number;
    currentCureDay: number;
    jarHumidity: number;
    lastBurpDay: number;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export interface Task {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    isCompleted: boolean;
    createdAt: number;
    completedAt ? : number;
}

export interface PlantProblem {
    type: ProblemType;
    status: 'active' | 'resolved';
    detectedAt: number;
    resolvedAt ? : number;
}

export type JournalEntryType = 'WATERING' | 'FEEDING' | 'TRAINING' | 'OBSERVATION' | 'SYSTEM' | 'PHOTO' | 'PEST_CONTROL' | 'ENVIRONMENT' | 'AMENDMENT';
export interface JournalEntry {
    id: string;
    createdAt: number;
    type: JournalEntryType;
    notes: string;
    details ? : Record < string, any > ;
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

// --- SETTINGS ---
export interface DefaultGrowSetup {
    light: {
        type: 'LED' | 'HPS' | 'CFL';
        wattage: number
    };
    potSize: number;
    medium: 'Soil' | 'Coco' | 'Hydro';
}
export interface GrowSetup {
    lightType: 'LED' | 'HPS' | 'CFL';
    wattage: number;
    potSize: number;
    medium: 'Soil' | 'Coco' | 'Hydro';
    temperature: number;
    humidity: number;
    lightHours: number;
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
    notificationSettings: {
        stageChange: boolean;
        problemDetected: boolean;
        harvestReady: boolean;
        newTask: boolean;
    };
    onboardingCompleted: boolean;
    simulationSettings: {
        autoAdvance: boolean;
        speed: '1x' | '2x' | '4x';
        difficulty: 'easy' | 'normal' | 'hard' | 'custom';
        customDifficultyModifiers: {
            pestPressure: number;
            nutrientSensitivity: number;
            environmentalStability: number;
        };
        autoJournaling: {
            stageChanges: boolean;
            problems: boolean;
            tasks: boolean;
        };
    };
    defaultGrowSetup: DefaultGrowSetup;
    defaultJournalNotes: {
        watering: string;
        feeding: string;
    };
    defaultExportSettings: {
        source: ExportSource;
        format: ExportFormat;
    };
    lastBackupTimestamp ? : number;
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

// --- UI & APP STATE ---

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

export interface Command {
    id: string;
    title: string;
    subtitle ? : string;
    icon: React.ElementType;
    action: () => void;
    keywords ? : string;
    shortcut ? : string[];
    group: string;
    isHeader ? : boolean;
}

export interface StoredImageData {
    id: string;
    data: string; // base64 data URL
    createdAt: number;
}

// --- AI & API RELATED ---

export interface AIResponse {
    title: string;
    content: string; // Can be markdown
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
    title ? : string;
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
    svgIcon: string;
}

export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'pots' | 'soil' | 'nutrients' | 'extra';
export interface RecommendationItem {
    name: string;
    price: number;
    rationale: string;
    watts ? : number;
}
export type Recommendation = Record < RecommendationCategory, RecommendationItem > ;

// --- SAVED ITEMS ---

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
    count: number;
    strainIds: string[];
    notes ? : string;
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
    query: string; // The plant data JSON string
}

export interface SavedStrainTip extends AIResponse {
    id: string;
    createdAt: number;
    strainId: string;
    strainName: string;
}


// --- KNOWLEDGE BASE ---
export interface KnowledgeArticle {
    id: string;
    titleKey: string;
    contentKey: string;
    tags: string[];
    triggers: {
        plantStage ? : PlantStage | PlantStage[];
        ageInDays ? : {
            min: number;
            max: number
        };
        activeProblems ? : ProblemType[];
    }
}

export type KnowledgeProgress = Record < string, string[] > ; // sectionId: itemId[]

// --- MISC ---
export interface StrainTranslationData {
    description ? : string;
    typeDetails ? : string;
    genetics ? : string;
    yieldDetails ? : {
        indoor: string;
        outdoor: string;
    };
    heightDetails ? : {
        indoor: string;
        outdoor: string;
    };
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

export interface Scenario {
    id: string;
    titleKey: string;
    descriptionKey: string;
    durationDays: number;
    plantAModifier: {
        action: ScenarioAction;
        day: number
    };
    plantBModifier: {
        action: ScenarioAction;
        day: number
    };
}
export type ScenarioAction = 'TOP' | 'LST' | 'NONE';

// --- ENDGAME ---
export interface Seed {
    id: string;
    name: string;
    strainId: string;
    genetics: string;
    quality: number;
    createdAt: number;
}


// --- APP STATE ---
export type AppState =
    AiSlice &
    ArchivesSlice &
    BreedingSlice &
    FavoritesSlice &
    KnowledgeSlice &
    NotesSlice &
    PlantSlice &
    SavedItemsSlice &
    SettingsSlice &
    SimulationSlice &
    StrainsViewSlice &
    TTSSlice &
    UISlice &
    UserStrainsSlice;
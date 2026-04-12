// ---------------------------------------------------------------------------
// ARCHITECTURE NOTE: Domain types are canonically defined in
// @cannaguide/ai-core/src/domain/. This file is the local bridge for the
// 150+ web-app consumers that import from '@/types'. New domain types should
// be added to ai-core first, then re-exported here if needed by the web app.
// See packages/ai-core/src/domain/index.ts for the canonical barrel export.
// ---------------------------------------------------------------------------

import { EntityState } from '@reduxjs/toolkit'
import type { FC } from 'react'
import type { SimulationPoint } from '@/types/simulation.types'
import type {
    AiMode,
    DifficultyLevel,
    Grow,
    GrowGoal,
    GrowSetup,
    HeightLevel,
    Plant,
    YieldLevel,
} from '@cannaguide/ai-core'

// ---------------------------------------------------------------------------
// Domain types re-exported from @cannaguide/ai-core (canonical source)
// ---------------------------------------------------------------------------

export {
    // Enums
    PlantStage,
    StrainType,
    ProblemType,
    JournalEntryType,
    PhotoCategory,
    // String literal types (enums)
    type FloweringType,
    type DifficultyLevel,
    type YieldLevel,
    type HeightLevel,
    type GrowGoal,
    type GrowAction,
    type HydroSystemType,
    type DiseaseCategory,
    type DiseaseUrgency,
    type IssueCategory,
    type IssueStatus,
    type IssueSeverity,
    type SeedType,
    type SeedSource,
    type TaskPriority,
    type TrainingType,
    type AmendmentType,
    type LightType,
    type VentilationPower,
    type PotType,
    type HydroAlertDirection,
    type HydroForecastTrend,
    type RiskLevel,
    type PluginCategory,
    type TimeSeriesResolution,
    type PlantCount,
    type ExperienceLevel,
    type GrowPriority,
    type GeneticTrendCategory,
    // Strain & phytochemistry
    type TerpeneName,
    type TerpeneProfile,
    type TerpeneProfileEntry,
    type DetailedTerpeneProfile,
    type CannabinoidName,
    type CannabinoidProfile,
    type CannabinoidProfileEntry,
    type DetailedCannabinoidProfile,
    type FlavonoidName,
    type FlavonoidProfile,
    type FlavonoidProfileEntry,
    type DetailedFlavonoidProfile,
    type EffectTag,
    type ChemovarType,
    type ChemovarProfile,
    type StrainApiProvider,
    type DataProvenance,
    type LabTestResult,
    type StrainLineage,
    type MedicalInfo,
    type DataQualityScore,
    type TerpeneSimilarityResult,
    type Seedbank,
    type SeedAvailability,
    type StrainTranslationData,
    type GeneticModifiers,
    type Strain,
    // Plant & simulation
    type GrowSetup,
    type PlantEnvironment,
    type PlantMedium,
    type PlantNutrientPool,
    type PlantRootSystem,
    type PlantEquipment,
    type PlantStructuralModel,
    type PlantStressCounters,
    type PlantSimulationClock,
    type PlantProblem,
    type JournalEntry,
    type JournalEntryDetails,
    type WateringDetails,
    type FeedingDetails,
    type TrainingDetails,
    type ObservationDetails,
    type SystemDetails,
    type PhotoDetails,
    type PestControlDetails,
    type EnvironmentDetails,
    type AmendmentDetails,
    type HarvestDetails,
    type PostHarvestDetails,
    type Task,
    type HarvestData,
    type PlantHistoryEntry,
    type Plant,
    type SimulationPoint as DomainSimulationPoint,
    // Grow & planner
    type Grow,
    type GrowExportData,
    type GrowSummary,
    type PlannerTask,
    type GrowPlannerState,
    // Hydro & metrics
    type HydroThresholds,
    type HydroReading,
    type HydroAlert,
    type HydroState,
    type HydroForecast,
    type MetricsReading,
    type MetricsState,
    // Knowledge
    type LexiconEntry,
    type DiseaseEntry,
    type LearningStep,
    type LearningPath,
    type VisualGuide,
    type FAQItem,
    type KnowledgeArticle,
    // Diagnosis & analytics
    type DiagnosisRecord,
    type DiagnosisHistoryState,
    type ModelStatus,
    type DiseaseRecommendation,
    type LeafDiagnosisResult,
    type YieldPredictionResult,
    type BotrytisRiskAssessment,
    type EnvironmentAlert,
    type PredictiveInsight,
    // Breeding & genealogy
    type Seed,
    type SeedInventoryEntry,
    type PollenRecord,
    type GenealogyNode,
    type GeneticContribution,
    // Issue tracking
    type IssueTreatment,
    type PlantIssue,
    type ProblemTrackerState,
    // Shared domain
    type GrowTechCategory,
    type TrendMatchScore,
    type TrendFilterState,
    type NutrientProduct,
    type NutrientWeekSchedule,
    type NutrientBrandSchedule,
    type PluginManifest,
    type OfflineAction,
    type TimeSeriesEntry,
    type StoredImageData,
    type Scenario,
    type ScenarioAction,
    type ExperimentResult,
    type SavedExperiment,
    type SandboxState,
    type KnowledgeProgress,
    type LearningPathProgress,
    type ArchivedMentorResponse,
    type ArchivedAdvisorResponse,
    type SavedStrainTip,
    type SavedSetup,
    type SavedExport,
    // AI response types
    type ProductLink,
    type RecommendationItem,
    type RecommendationCategory,
    type Recommendation,
    type PlantDiagnosisResponse,
    type AIResponse,
    type StructuredGrowTips,
    type DeepDiveGuide,
    type MentorMessage,
    type AiMode,
} from '@cannaguide/ai-core'

// ---------------------------------------------------------------------------
// UI-only types (not domain -- stay in the web app layer)
// ---------------------------------------------------------------------------

/** Top-level navigation views. */
export enum View {
    Plants = 'plants',
    Knowledge = 'knowledge',
    Equipment = 'equipment',
    Strains = 'strains',
    Settings = 'settings',
    Help = 'help',
}

/** Application language setting. */
export type Language = 'en' | 'de' | 'es' | 'fr' | 'nl'

/** Cannabis-themed UI themes. */
export type Theme =
    | 'midnight'
    | 'forest'
    | 'purpleHaze'
    | 'desertSky'
    | 'roseQuartz'
    | 'rainbowKush'
    | 'ogKushGreen'
    | 'runtzRainbow'
    | 'lemonSkunk'

/** Equipment tab navigation. */
export enum EquipmentViewTab {
    Configurator = 'configurator',
    PresetSetups = 'presetSetups',
    Setups = 'setups',
    Calculators = 'calculators',
    GrowShops = 'growShops',
    Seedbanks = 'seedbanks',
    GrowTech = 'growTech',
    IotDashboard = 'iotDashboard',
    HydroMonitoring = 'hydroMonitoring',
}

/** Knowledge tab navigation. */
export enum KnowledgeViewTab {
    Mentor = 'mentor',
    Guide = 'guide',
    Lexikon = 'lexikon',
    Atlas = 'atlas',
    Rechner = 'rechner',
    Lernpfad = 'lernpfad',
    Analytik = 'analytik',
    Archive = 'archive',
    Sandbox = 'sandbox',
}

/** Strain browser tab navigation. */
export enum StrainViewTab {
    All = 'all',
    MyStrains = 'my-strains',
    Favorites = 'favorites',
    DailyStrains = 'daily-strains',
    Comparison = 'comparison',
    Genealogy = 'genealogy',
    BreedingLab = 'breeding-lab',
    SeedVault = 'seed-vault',
    Exports = 'exports',
    Tips = 'tips',
    Trends = 'trends',
}

/** Strain browser sort keys. */
export type SortKey =
    | 'name'
    | 'type'
    | 'thc'
    | 'cbd'
    | 'floweringTime'
    | 'difficulty'
    | 'yield'
    | 'height'
export type SortDirection = 'asc' | 'desc'

/** Plant journal modal type. */
export type ModalType =
    | 'watering'
    | 'feeding'
    | 'training'
    | 'observation'
    | 'photo'
    | 'pestControl'
    | 'amendment'

// ---------------------------------------------------------------------------
// Redux state container types (depend on EntityState from RTK)
// ---------------------------------------------------------------------------

export interface SimulationState {
    plants: EntityState<Plant, string>
    plantSlots: (string | null)[]
    selectedPlantId: string | null
    vpdProfiles: Record<string, SimulationPoint[]>
    /** Set to true while the background worker is processing a catch-up delta. */
    isCatchingUp?: boolean | undefined
}

export interface GrowsState {
    /** All grows keyed by EntityAdapter (max MAX_GROWS) */
    grows: EntityState<Grow, string>
    /** Currently selected/active grow ID */
    activeGrowId: string
}

// ---------------------------------------------------------------------------
// App Settings (UI configuration -- not a domain entity)
// ---------------------------------------------------------------------------

export interface AppSettings {
    version: number
    onboardingCompleted: boolean
    aiMode: AiMode
    general: {
        language: Language
        theme: Theme
        fontSize: 'sm' | 'base' | 'lg'
        defaultView: View
        uiDensity: 'comfortable' | 'compact'
        dyslexiaFont: boolean
        reducedMotion: boolean
        highContrastMode: boolean
        colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
        /** Grow goal selected during onboarding. */
        growGoal: GrowGoal | null
        /** Default space size selected during onboarding. */
        defaultSpaceSize: 'small' | 'medium' | 'large' | null
        /** Default budget tier selected during onboarding. */
        defaultBudget: 'low' | 'mid' | 'high' | null
    }
    voiceControl: {
        enabled: boolean
        hotwordEnabled: boolean
        confirmationSound: boolean
        continuousListening: boolean
        wakeWordEngine: WakeWordEngine
        porcupineAccessKey: string | null
        porcupineKeyword: string
        voiceWorkerEnabled: boolean
        voiceAnalyticsEnabled: boolean
    }
    tts: TTSSettings
    strainsView: {
        defaultSortKey: SortKey
        defaultSortDirection: SortDirection
        defaultViewMode: 'list' | 'grid'
        strainsPerPage: number
        visibleColumns: string[]
        prioritizeUserStrains: boolean
        genealogyDefaultDepth: number
        genealogyDefaultLayout: 'horizontal' | 'vertical'
        aiTipsDefaultFocus: string
        aiTipsDefaultExperience: string
    }
    plantsView: {
        showArchived: boolean
        autoGenerateTasks: boolean
    }
    simulation: {
        autoJournaling: {
            logStageChanges: boolean
            logProblems: boolean
            logTasks: boolean
        }
        simulationProfile: 'beginner' | 'intermediate' | 'expert'
        pestPressure: number
        nutrientSensitivity: number
        environmentalStability: number
        leafTemperatureOffset: number
        lightExtinctionCoefficient: number
        nutrientConversionEfficiency: number
        stomataSensitivity: number
        /** Grow-room altitude above sea level (m). Used for barometric VPD correction. */
        altitudeM: number
    }
    notifications: {
        enabled: boolean
        stageChange: boolean
        problemDetected: boolean
        harvestReady: boolean
        newTask: boolean
        lowWaterWarning: boolean
        phDriftWarning: boolean
        quietHours: {
            enabled: boolean
            start: string
            end: string
        }
    }
    defaults: {
        growSetup: GrowSetup
        journalNotes: {
            watering: string
            feeding: string
        }
    }
    localAi: {
        forceWasm: boolean
        /** Feature flag: enable WebGPU acceleration for local AI inference. */
        enableWebGpu: boolean
        preferredTextModel: 'auto' | 'qwen2.5' | 'qwen3'
        /** Selected WebLLM model ID or 'auto' for GPU-tier-based auto-selection. */
        selectedLlmModelId: string
        enableSemanticRag: boolean
        enableSentimentAnalysis: boolean
        enableSummarization: boolean
        enableQueryClassification: boolean
        enablePersistentCache: boolean
        enableTelemetry: boolean
        maxInferenceCacheSize: number
        inferenceTimeoutMs: number
        /** Progressive quantization preference: 'auto' (VRAM-based), 'q4f16', 'q4', or 'none'. */
        quantizationLevel: 'auto' | 'q4f16' | 'q4' | 'none'
        /** Eco-mode: disables WebLLM + image gen, forces WASM backend and smallest model. */
        ecoMode: boolean
    }
    data: {
        autoBackup: 'off' | 'daily' | 'weekly'
        persistenceIntervalMs: 500 | 1500 | 5000
        cloudSync: {
            enabled: boolean
            provider: 'none' | 'gist'
            gistId: string | null
            lastSyncAt: number | null
            /** Base64-encoded AES-GCM key for E2EE of Gist backups. */
            encryptionKeyBase64: string | null
        }
    }
    privacy: {
        requirePinOnLaunch: boolean
        pin: string | null
        clearAiHistoryOnExit: boolean
        /** When true, blocks ALL outbound network requests (Sentry, cloud AI, Gist sync). */
        localOnlyMode: boolean
    }
}

// ---------------------------------------------------------------------------
// Voice & TTS types (UI-layer -- transient state)
// ---------------------------------------------------------------------------

/** Cloud TTS provider identifier (BYOK). */
export type CloudTtsProvider = 'elevenlabs' | 'azure' | 'google'

/** Wake-word detection engine. */
export type WakeWordEngine = 'regex' | 'porcupine'

export interface TTSSettings {
    enabled: boolean
    voiceName: string | null
    rate: number
    pitch: number
    volume: number
    highlightSpeakingText: boolean
    cloudTtsEnabled: boolean
    cloudTtsProvider: CloudTtsProvider
    cloudTtsApiKey: string | null
}

/** Event types tracked by voice telemetry (opt-in, anonymous, no PII). */
export type VoiceAnalyticsEventType =
    | 'commandMatched'
    | 'commandFailed'
    | 'ttsPlayed'
    | 'hotwordDetected'
    | 'errorOccurred'

/** Single anonymous voice analytics event. */
export interface VoiceAnalyticsEvent {
    eventType: VoiceAnalyticsEventType
    timestamp: number
    metadata: Record<string, string | number | boolean>
}

/** Aggregated voice telemetry snapshot. */
export interface VoiceTelemetrySnapshot {
    totalCommands: number
    successRate: number
    avgMatchLatencyMs: number
    ttsPlayCount: number
    hotwordDetections: number
    errorCount: number
    topCommands: Array<{ id: string; count: number }>
    lastUpdated: number
}

/** Voice orchestrator modes (finite state machine). */
export enum VoiceMode {
    IDLE = 'idle',
    LISTENING = 'listening',
    PROCESSING = 'processing',
    SPEAKING = 'speaking',
    CONFIRMATION = 'confirmation',
}

/** Pending confirmation waiting for user yes/no response. */
export interface VoiceConfirmation {
    commandId: string
    question: string
    onConfirm: () => void
    onCancel: () => void
}

/** Transient voice session state (managed by useVoiceStore). */
export interface VoiceSessionState {
    mode: VoiceMode
    transcriptHistory: string[]
    lastMatchedCommand: string | null
    confirmationPending: VoiceConfirmation | null
    continuousListeningEnabled: boolean
    error: string | null
}

/** Provider interface for text-to-speech engines. */
export interface ITTSProvider {
    readonly providerName: string
    isSupported(): boolean
    init(): void
    getVoices(lang: Language): SpeechSynthesisVoice[]
    speak(text: string, lang: Language, onEnd: () => void, settings: TTSSettings): void
    cancel(): void
    pause(): void
    resume(): void
}

// ---------------------------------------------------------------------------
// UI State types
// ---------------------------------------------------------------------------

export interface AdvancedFilterState {
    thcRange: [number, number]
    cbdRange: [number, number]
    floweringRange: [number, number]
    selectedDifficulties: DifficultyLevel[]
    selectedYields: YieldLevel[]
    selectedHeights: HeightLevel[]
    selectedAromas: string[]
    selectedTerpenes: string[]
}

export interface Notification {
    id: number
    message: string
    type: 'success' | 'error' | 'info'
}

export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
    prompt(): Promise<void>
}

// ---------------------------------------------------------------------------
// Command Palette types (UI-only)
// ---------------------------------------------------------------------------

export type CommandGroup =
    | 'Navigation'
    | 'Strains'
    | 'Plants'
    | 'Equipment'
    | 'Knowledge'
    | 'Appearance'
    | 'Accessibility'
    | 'AI'
    | 'General'

export interface Command {
    id: string
    title: string
    subtitle?: string | undefined
    group: CommandGroup | string
    icon: FC
    action: () => void
    keywords?: string | undefined
    shortcut?: string[] | undefined
    isHeader?: boolean | undefined
    /** Higher = shown first when no query (default 0) */
    priority?: number | undefined
}

export interface SpeechQueueItem {
    id: string
    text: string
}

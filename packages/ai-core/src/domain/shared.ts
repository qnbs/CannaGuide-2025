// ---------------------------------------------------------------------------
// @cannaguide/ai-core -- remaining shared domain types
// ---------------------------------------------------------------------------

import type { PluginCategory, TimeSeriesResolution } from './enums'
import type { PlantStage, GeneticTrendCategory } from './enums'
import type { Plant, PlantHistoryEntry } from './plant'
import type { ExperienceLevel, PlantCount, GrowPriority } from './enums'
import type { Recommendation, StructuredGrowTips, AIResponse } from '../types'

// ---------------------------------------------------------------------------
// Grow-tech trends
// ---------------------------------------------------------------------------

export type GrowTechCategory =
    | 'dynamicLighting'
    | 'sensorsIoT'
    | 'aiAutomation'
    | 'digitalTwin'
    | 'hydroAero'
    | 'tissueCulture'
    | 'smartGrowBoxes'
    | 'sustainability'

export interface TrendMatchScore {
    category: GeneticTrendCategory | GrowTechCategory
    score: number
    reason: string
}

export interface TrendFilterState {
    query: string
    showMatchedOnly: boolean
}

// ---------------------------------------------------------------------------
// Nutrient brand schedules
// ---------------------------------------------------------------------------

/** Nutrient product within a brand schedule */
export interface NutrientProduct {
    name: string
    dosageMlPerLiter: number
}

/** Weekly nutrient schedule entry */
export interface NutrientWeekSchedule {
    week: number
    stage: string
    products: NutrientProduct[]
    ecTarget?: number | undefined
    phTarget?: [number, number] | undefined
    notes?: string | undefined
}

/** Complete nutrient brand schedule definition */
export interface NutrientBrandSchedule {
    id: string
    brand: string
    scheduleName: string
    mediumTypes: Array<'Soil' | 'Coco' | 'Hydro'>
    weeks: NutrientWeekSchedule[]
    flushWeeks?: number[] | undefined
}

// ---------------------------------------------------------------------------
// Plugin architecture
// ---------------------------------------------------------------------------

export interface PluginManifest {
    id: string
    name: string
    version: string
    description: string
    author: string
    category: PluginCategory
    minAppVersion?: number | undefined
    icon?: string | undefined
    tags?: string[] | undefined
}

/** Queued offline action with idempotency key. */
export interface OfflineAction {
    idempotencyKey: string
    type: string
    payload?: unknown | undefined
}

// ---------------------------------------------------------------------------
// IoT time-series
// ---------------------------------------------------------------------------

export interface TimeSeriesEntry {
    id?: number | undefined
    deviceId: string
    timestamp: number
    resolution: TimeSeriesResolution
    temperatureC: number
    humidityPercent: number
    vpd: number | null
    ph: number | null
    sampleCount: number
}

// ---------------------------------------------------------------------------
// Stored image data
// ---------------------------------------------------------------------------

export interface StoredImageData {
    id: string
    data: string // base64 data URL
    createdAt: number
}

// ---------------------------------------------------------------------------
// Sandbox & experiments
// ---------------------------------------------------------------------------

export interface Scenario {
    id: string
    titleKey: string
    descriptionKey: string
    title?: string | undefined
    description?: string | undefined
    durationDays: number
    plantAModifier: { day: number; action: ScenarioAction }
    plantBModifier: { day: number; action: ScenarioAction }
}

export type ScenarioAction =
    | 'TOP'
    | 'LST'
    | 'NONE'
    | 'TEMP_PLUS_2'
    | 'TEMP_MINUS_2'
    | 'HUMIDITY_PLUS_10'
    | 'HUMIDITY_MINUS_10'
    | 'LIGHT_BOOST'
    | 'PH_DRIFT_ACIDIC'
    | 'EC_RAMP'
    | 'DEFOLIATE'

export interface ExperimentResult {
    originalHistory: PlantHistoryEntry[]
    modifiedHistory: PlantHistoryEntry[]
    originalFinalState: Plant
    modifiedFinalState: Plant
}

export interface SavedExperiment extends ExperimentResult {
    id: string
    scenarioId: string
    basePlantName: string
    createdAt: number
}

export type SandboxState = {
    currentExperiment: (ExperimentResult & { basePlantId?: string; scenarioId?: string }) | null
    status: 'idle' | 'running' | 'succeeded' | 'failed'
    savedExperiments: SavedExperiment[]
}

// ---------------------------------------------------------------------------
// Knowledge progress & saved items
// ---------------------------------------------------------------------------

export interface KnowledgeProgress {
    [sectionId: string]: string[]
}

/** Per-path completion: map of stepId -> completed */
export interface LearningPathProgress {
    [pathId: string]: string[]
}

// ---------------------------------------------------------------------------
// Archive & saved items
// ---------------------------------------------------------------------------

export interface ArchivedMentorResponse {
    id: string
    createdAt: number
    query: string
    title: string
    content: string
    feedback?: 'positive' | 'negative' | undefined
    uiHighlights?: { elementId: string; plantId?: string | undefined }[] | undefined
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string
    createdAt: number
    plantId: string
    plantStage: PlantStage
    query: string
    feedback?: 'positive' | 'negative' | undefined
}

export interface SavedStrainTip extends StructuredGrowTips {
    id: string
    createdAt: number
    strainId: string
    strainName: string
    title: string
    imageUrl?: string | undefined
}

export interface SavedSetup {
    id: string
    name: string
    createdAt: number
    recommendation: Recommendation
    totalCost: number
    sourceDetails: {
        plantCount: PlantCount
        experience: ExperienceLevel
        budget: number
        priorities: GrowPriority[]
        customNotes: string
        growSpace: { width: number; depth: number }
        floweringTypePreference: 'autoflower' | 'photoperiod' | 'any'
    }
}

export interface SavedExport {
    id: string
    name: string
    createdAt: number
    format: 'pdf' | 'txt' | 'csv' | 'json' | 'xml'
    strainIds: string[]
    sourceDescription: string
}

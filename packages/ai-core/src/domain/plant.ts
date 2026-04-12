// ---------------------------------------------------------------------------
// @cannaguide/ai-core -- plant & simulation domain types
// ---------------------------------------------------------------------------

import type {
    PlantStage,
    ProblemType,
    JournalEntryType,
    PhotoCategory,
    TaskPriority,
    LightType,
    VentilationPower,
    PotType,
    TrainingType,
    AmendmentType,
} from './enums'
import type { Strain, GeneticModifiers } from './strain'

// ---------------------------------------------------------------------------
// Simulation point (re-declared here to avoid circular import with web app)
// ---------------------------------------------------------------------------

/** A single VPD simulation data point. */
export interface SimulationPoint {
    timestamp: number
    vpd: number
    temperature: number
    humidity: number
}

// ---------------------------------------------------------------------------
// Equipment & environment
// ---------------------------------------------------------------------------

export interface GrowSetup {
    lightType: LightType
    lightWattage: number
    lightHours: number
    dynamicLighting: boolean
    ventilation: VentilationPower
    hasCirculationFan: boolean
    potSize: number
    potType: PotType
    medium: 'Soil' | 'Coco' | 'Hydro' | 'Aeroponics'
}

export interface PlantEnvironment {
    internalTemperature: number
    internalHumidity: number
    vpd: number
    co2Level: number
}

export interface PlantMedium {
    ph: number
    ec: number
    moisture: number
    microbeHealth: number
    substrateWater: number
    nutrientConcentration: { nitrogen: number; phosphorus: number; potassium: number }
}

export interface PlantNutrientPool {
    nitrogen: number
    phosphorus: number
    potassium: number
}

export interface PlantRootSystem {
    health: number
    rootMass: number
}

export interface PlantEquipment {
    light: { type: LightType; wattage: number; isOn: boolean; lightHours: number }
    exhaustFan: { power: VentilationPower; isOn: boolean }
    circulationFan: { isOn: boolean }
    potSize: number
    potType: PotType
}

export interface PlantStructuralModel {
    branches: number
    nodes: number
}

export interface PlantStressCounters {
    vpd: number
    ph: number
    ec: number
    moisture: number
}

export interface PlantSimulationClock {
    accumulatedDayMs: number
}

// ---------------------------------------------------------------------------
// Journal entry details (discriminated union)
// ---------------------------------------------------------------------------

export interface WateringDetails {
    amountMl?: number | undefined
    ph?: number | undefined
    ec?: number | undefined
}

export interface FeedingDetails extends WateringDetails {
    npk?: { n: number; p: number; k: number } | undefined
}

export interface TrainingDetails {
    type: TrainingType
}

export interface ObservationDetails {
    diagnosis?: string | undefined
}

export interface SystemDetails {
    from: PlantStage
    to: PlantStage
}

export interface PhotoDetails {
    imageId?: string | undefined
    imageUrl?: string | undefined
    photoCategory: PhotoCategory
    timelineLabel?: string | undefined
    capturedAt?: number | undefined
    exifCapturedAt?: number | undefined
}

export interface PestControlDetails {
    method: string
    product?: string | undefined
}

export interface EnvironmentDetails {
    temp?: number | undefined
    humidity?: number | undefined
    ec?: number | undefined
    ph?: number | undefined
    lightPpfd?: number | undefined
    waterVolumeMl?: number | undefined
    source?: 'manual' | 'iot_sensor'
}

export interface AmendmentDetails {
    type: AmendmentType
}

export interface HarvestDetails {
    wetWeight: number
}

export interface PostHarvestDetails {
    dryWeight: number
    quality: number
}

export type JournalEntryDetails =
    | WateringDetails
    | FeedingDetails
    | TrainingDetails
    | ObservationDetails
    | SystemDetails
    | PhotoDetails
    | PestControlDetails
    | EnvironmentDetails
    | AmendmentDetails
    | HarvestDetails
    | PostHarvestDetails

// ---------------------------------------------------------------------------
// Core plant types
// ---------------------------------------------------------------------------

export interface PlantProblem {
    type: ProblemType
    severity: number
    onsetDay: number
    status: 'active' | 'resolved'
}

export interface JournalEntry {
    id: string
    createdAt: number
    type: JournalEntryType
    notes: string
    details?: JournalEntryDetails | undefined
}

export interface Task {
    id: string
    title: string
    description: string
    isCompleted: boolean
    createdAt: number
    completedAt?: number | undefined
    priority: TaskPriority
}

export interface HarvestData {
    wetWeight: number
    dryWeight: number
    currentDryDay: number
    currentCureDay: number
    lastBurpDay: number
    jarHumidity: number
    chlorophyllPercent: number
    terpeneRetentionPercent: number
    moldRiskPercent: number
    finalQuality: number
    cannabinoidProfile: { thc: number; cbn: number }
    terpeneProfile: Record<string, number>
}

export interface PlantHistoryEntry {
    day: number
    health: number
    height: number
    stressLevel: number
    medium: { ph: number; ec: number; moisture: number }
}

/** Core plant domain object (simulation state per plant). */
export interface Plant {
    id: string
    /** ID of the grow this plant belongs to */
    growId: string
    name: string
    strain: Strain
    mediumType: GrowSetup['medium']
    createdAt: number
    lastUpdated: number
    age: number // in days
    stage: PlantStage
    health: number // 0-100
    stressLevel: number // 0-100
    height: number // in cm
    biomass: { total: number; stem: number; leaves: number; flowers: number }
    leafAreaIndex: number
    isTopped: boolean
    lstApplied: number
    environment: PlantEnvironment
    medium: PlantMedium
    nutrientPool: PlantNutrientPool
    rootSystem: PlantRootSystem
    equipment: PlantEquipment
    problems: PlantProblem[]
    journal: JournalEntry[]
    tasks: Task[]
    harvestData: HarvestData | null
    structuralModel: PlantStructuralModel
    // Per-individual phenotype expression; may diverge from strain defaults
    phenotypeModifiers?: GeneticModifiers | undefined
    history: PlantHistoryEntry[]
    // Real-time chemical synthesis tracking
    cannabinoidProfile: { thc: number; cbd: number; cbn: number }
    terpeneProfile: Record<string, number>
    stressCounters: PlantStressCounters
    simulationClock: PlantSimulationClock
}

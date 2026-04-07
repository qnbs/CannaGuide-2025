import { z } from 'zod'
import type { Plant, JournalEntry } from '@/types'
import { PlantStage, JournalEntryType } from '@/types'
import type { NutrientScheduleEntry, EcPhReading } from '@/stores/slices/nutrientPlannerSlice'
import { DEFAULT_GROW_ID } from '@/constants'

// ---------------------------------------------------------------------------
// Minimal Zod schemas for CRDT deserialization validation
// ---------------------------------------------------------------------------

const PlantCrdtSchema = z.object({
    id: z.string().min(1),
    growId: z.string().min(1).default(DEFAULT_GROW_ID),
    name: z.string(),
    strain: z.record(z.unknown()),
    mediumType: z.string(),
    createdAt: z.number(),
    lastUpdated: z.number(),
    age: z.number(),
    stage: z.nativeEnum(PlantStage),
    health: z.number(),
    stressLevel: z.number(),
    height: z.number(),
    biomass: z.object({
        total: z.number(),
        stem: z.number(),
        leaves: z.number(),
        flowers: z.number(),
    }),
    leafAreaIndex: z.number(),
    isTopped: z.boolean(),
    lstApplied: z.number(),
    environment: z.object({
        internalTemperature: z.number(),
        internalHumidity: z.number(),
        vpd: z.number(),
        co2Level: z.number(),
    }),
    medium: z.object({
        ph: z.number(),
        ec: z.number(),
        moisture: z.number(),
        microbeHealth: z.number(),
        substrateWater: z.number(),
        nutrientConcentration: z.object({
            nitrogen: z.number(),
            phosphorus: z.number(),
            potassium: z.number(),
        }),
    }),
    nutrientPool: z.object({
        nitrogen: z.number(),
        phosphorus: z.number(),
        potassium: z.number(),
    }),
    rootSystem: z.object({ health: z.number(), rootMass: z.number() }),
    equipment: z.object({
        light: z.object({
            type: z.string(),
            wattage: z.number(),
            isOn: z.boolean(),
            lightHours: z.number(),
        }),
        exhaustFan: z.object({ power: z.string(), isOn: z.boolean() }),
        circulationFan: z.object({ isOn: z.boolean() }),
        potSize: z.number(),
        potType: z.string(),
    }),
    structuralModel: z.object({ branches: z.number(), nodes: z.number() }),
    stressCounters: z.object({
        vpd: z.number(),
        ph: z.number(),
        ec: z.number(),
        moisture: z.number(),
    }),
    cannabinoidProfile: z.object({
        thc: z.number(),
        cbd: z.number(),
        cbn: z.number(),
    }),
})

const JournalEntryCrdtSchema = z.object({
    id: z.string().min(1),
    createdAt: z.number(),
    type: z.nativeEnum(JournalEntryType),
    notes: z.string(),
})

const NutrientScheduleEntryCrdtSchema = z.object({
    id: z.string().min(1),
    growId: z.string().min(1).default(DEFAULT_GROW_ID),
    stage: z.nativeEnum(PlantStage),
    targetEc: z.number(),
    targetPh: z.number(),
    npkRatio: z.object({ n: z.number(), p: z.number(), k: z.number() }),
    notes: z.string(),
})

const EcPhReadingCrdtSchema = z.object({
    id: z.string().min(1),
    plantId: z.string().nullable(),
    timestamp: z.number(),
    ec: z.number(),
    ph: z.number(),
    waterTempC: z.number().nullable(),
    readingType: z.enum(['input', 'runoff']),
    notes: z.string(),
})

// ---------------------------------------------------------------------------
// Plant adapters
// ---------------------------------------------------------------------------

/**
 * Serialize a Plant to a plain object suitable for Y.Map storage.
 *
 * Fields excluded from sync:
 * - `simulationClock` -- local simulation state, not user data
 * - `history` -- high-frequency append-only snapshots, regenerated locally
 *
 * Complex nested arrays (journal, tasks, problems) are stored as JSON strings
 * to avoid deep Yjs Map nesting in Session I. Session II may upgrade these
 * to Y.Array for per-entry CRDT merge.
 */
export const plantToYMap = (plant: Plant): Record<string, unknown> => ({
    id: plant.id,
    growId: plant.growId,
    name: plant.name,
    strain: JSON.stringify(plant.strain),
    mediumType: plant.mediumType,
    createdAt: plant.createdAt,
    lastUpdated: plant.lastUpdated,
    age: plant.age,
    stage: plant.stage,
    health: plant.health,
    stressLevel: plant.stressLevel,
    height: plant.height,
    biomass: JSON.stringify(plant.biomass),
    leafAreaIndex: plant.leafAreaIndex,
    isTopped: plant.isTopped,
    lstApplied: plant.lstApplied,
    environment: JSON.stringify(plant.environment),
    medium: JSON.stringify(plant.medium),
    nutrientPool: JSON.stringify(plant.nutrientPool),
    rootSystem: JSON.stringify(plant.rootSystem),
    equipment: JSON.stringify(plant.equipment),
    problems: JSON.stringify(plant.problems),
    journal: JSON.stringify(plant.journal),
    tasks: JSON.stringify(plant.tasks),
    harvestData: plant.harvestData !== null ? JSON.stringify(plant.harvestData) : null,
    structuralModel: JSON.stringify(plant.structuralModel),
    phenotypeModifiers:
        plant.phenotypeModifiers !== undefined
            ? JSON.stringify(plant.phenotypeModifiers)
            : undefined,
    cannabinoidProfile: JSON.stringify(plant.cannabinoidProfile),
    terpeneProfile: JSON.stringify(plant.terpeneProfile),
    stressCounters: JSON.stringify(plant.stressCounters),
})

/**
 * Deserialize a Y.Map record back into a Plant.
 * Returns null if required fields are missing or invalid.
 */
export const yMapToPlant = (data: Record<string, unknown>): Plant | null => {
    try {
        const parsed = {
            ...data,
            strain:
                typeof data['strain'] === 'string' ? JSON.parse(data['strain']) : data['strain'],
            biomass:
                typeof data['biomass'] === 'string' ? JSON.parse(data['biomass']) : data['biomass'],
            environment:
                typeof data['environment'] === 'string'
                    ? JSON.parse(data['environment'])
                    : data['environment'],
            medium:
                typeof data['medium'] === 'string' ? JSON.parse(data['medium']) : data['medium'],
            nutrientPool:
                typeof data['nutrientPool'] === 'string'
                    ? JSON.parse(data['nutrientPool'])
                    : data['nutrientPool'],
            rootSystem:
                typeof data['rootSystem'] === 'string'
                    ? JSON.parse(data['rootSystem'])
                    : data['rootSystem'],
            equipment:
                typeof data['equipment'] === 'string'
                    ? JSON.parse(data['equipment'])
                    : data['equipment'],
            problems:
                typeof data['problems'] === 'string'
                    ? JSON.parse(data['problems'])
                    : data['problems'],
            journal:
                typeof data['journal'] === 'string' ? JSON.parse(data['journal']) : data['journal'],
            tasks: typeof data['tasks'] === 'string' ? JSON.parse(data['tasks']) : data['tasks'],
            harvestData:
                typeof data['harvestData'] === 'string'
                    ? JSON.parse(data['harvestData'])
                    : (data['harvestData'] ?? null),
            structuralModel:
                typeof data['structuralModel'] === 'string'
                    ? JSON.parse(data['structuralModel'])
                    : data['structuralModel'],
            phenotypeModifiers:
                typeof data['phenotypeModifiers'] === 'string'
                    ? JSON.parse(data['phenotypeModifiers'])
                    : data['phenotypeModifiers'],
            cannabinoidProfile:
                typeof data['cannabinoidProfile'] === 'string'
                    ? JSON.parse(data['cannabinoidProfile'])
                    : data['cannabinoidProfile'],
            terpeneProfile:
                typeof data['terpeneProfile'] === 'string'
                    ? JSON.parse(data['terpeneProfile'])
                    : data['terpeneProfile'],
            stressCounters:
                typeof data['stressCounters'] === 'string'
                    ? JSON.parse(data['stressCounters'])
                    : data['stressCounters'],
        }

        // Validate required fields
        const result = PlantCrdtSchema.safeParse(parsed)
        if (!result.success) {
            return null
        }

        // Return the full reconstructed plant (passthrough fields beyond schema)
        return {
            ...parsed,
            // Ensure excluded fields have sensible defaults
            simulationClock: (data['simulationClock'] as Plant['simulationClock']) ?? {
                accumulatedDayMs: 0,
            },
            history: Array.isArray(data['history']) ? (data['history'] as Plant['history']) : [],
        } as Plant
    } catch {
        return null
    }
}

// ---------------------------------------------------------------------------
// JournalEntry adapters
// ---------------------------------------------------------------------------

/** Serialize a JournalEntry for Y.Map storage. */
export const journalEntryToYMap = (entry: JournalEntry): Record<string, unknown> => ({
    id: entry.id,
    createdAt: entry.createdAt,
    type: entry.type,
    notes: entry.notes,
    details: entry.details !== undefined ? JSON.stringify(entry.details) : undefined,
})

/** Deserialize a Y.Map record back into a JournalEntry. Returns null if invalid. */
export const yMapToJournalEntry = (data: Record<string, unknown>): JournalEntry | null => {
    try {
        const result = JournalEntryCrdtSchema.safeParse(data)
        if (!result.success) return null

        return {
            id: result.data.id,
            createdAt: result.data.createdAt,
            type: result.data.type,
            notes: result.data.notes,
            details:
                typeof data['details'] === 'string' ? JSON.parse(data['details']) : data['details'],
        } as JournalEntry
    } catch {
        return null
    }
}

// ---------------------------------------------------------------------------
// NutrientScheduleEntry adapters
// ---------------------------------------------------------------------------

/** Serialize a NutrientScheduleEntry for Y.Map storage. */
export const nutrientEntryToYMap = (entry: NutrientScheduleEntry): Record<string, unknown> => ({
    id: entry.id,
    growId: entry.growId,
    stage: entry.stage,
    targetEc: entry.targetEc,
    targetPh: entry.targetPh,
    npkRatio: JSON.stringify(entry.npkRatio),
    notes: entry.notes,
})

/** Deserialize a Y.Map record back into a NutrientScheduleEntry. Returns null if invalid. */
export const yMapToNutrientEntry = (
    data: Record<string, unknown>,
): NutrientScheduleEntry | null => {
    try {
        const parsed = {
            ...data,
            npkRatio:
                typeof data['npkRatio'] === 'string'
                    ? JSON.parse(data['npkRatio'])
                    : data['npkRatio'],
        }
        const result = NutrientScheduleEntryCrdtSchema.safeParse(parsed)
        if (!result.success) return null
        return result.data
    } catch {
        return null
    }
}

// ---------------------------------------------------------------------------
// EcPhReading adapters
// ---------------------------------------------------------------------------

/** Serialize an EcPhReading for Y.Map storage. */
export const ecPhReadingToYMap = (reading: EcPhReading): Record<string, unknown> => ({
    id: reading.id,
    plantId: reading.plantId,
    timestamp: reading.timestamp,
    ec: reading.ec,
    ph: reading.ph,
    waterTempC: reading.waterTempC,
    readingType: reading.readingType,
    notes: reading.notes,
})

/** Deserialize a Y.Map record back into an EcPhReading. Returns null if invalid. */
export const yMapToEcPhReading = (data: Record<string, unknown>): EcPhReading | null => {
    try {
        const result = EcPhReadingCrdtSchema.safeParse(data)
        if (!result.success) return null
        return result.data
    } catch {
        return null
    }
}

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PlantStage } from '@/types'
import type { NutrientWeek } from '@/services/pluginService'
import { DEFAULT_GROW_ID } from '@/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NutrientScheduleEntry {
    /** Unique identifier */
    id: string
    /** ID of the grow this schedule entry belongs to */
    growId: string
    /** Growth stage this entry applies to */
    stage: PlantStage
    /** Target EC (mS/cm) */
    targetEc: number
    /** Target pH */
    targetPh: number
    /** N-P-K ratio */
    npkRatio: { n: number; p: number; k: number }
    /** Optional notes */
    notes: string
}

export interface EcPhReading {
    /** Unique identifier */
    id: string
    /** Associated plant ID (null for general readings) */
    plantId: string | null
    /** Timestamp when reading was taken */
    timestamp: number
    /** Measured EC value (mS/cm) */
    ec: number
    /** Measured pH value */
    ph: number
    /** Water temperature in °C */
    waterTempC: number | null
    /** Whether this is input or runoff measurement */
    readingType: 'input' | 'runoff'
    /** Optional notes */
    notes: string
}

export interface NutrientAlert {
    id: string
    plantId: string | null
    type: 'ec_high' | 'ec_low' | 'ph_high' | 'ph_low'
    message: string
    timestamp: number
    dismissed: boolean
}

export interface NutrientPlannerState {
    /** Custom nutrient schedule per stage */
    schedule: NutrientScheduleEntry[]
    /** EC/pH reading history */
    readings: EcPhReading[]
    /** Active alerts */
    alerts: NutrientAlert[]
    /** Auto-adjustment enabled */
    autoAdjustEnabled: boolean
    /** Grow medium: determines optimal pH/EC ranges */
    medium: 'Soil' | 'Coco' | 'Hydro'
    /** Whether AI recommendation is loading */
    isAiLoading: boolean
    /** Last AI recommendation (raw text) */
    lastAiRecommendation: string | null
    /** ID of the currently applied nutrient-schedule plugin (null = manual) */
    activePluginId: string | null
    /** Auto-generated adjustment recommendation based on recent readings */
    autoAdjustRecommendation: string | null
}

// ---------------------------------------------------------------------------
// Optimal ranges per medium + stage (science-backed defaults)
// ---------------------------------------------------------------------------

export interface OptimalRange {
    ecMin: number
    ecMax: number
    phMin: number
    phMax: number
}

const OPTIMAL_RANGES: Record<string, Record<string, OptimalRange>> = {
    Soil: {
        [PlantStage.Seedling]: { ecMin: 0.4, ecMax: 0.8, phMin: 6.0, phMax: 6.5 },
        [PlantStage.Vegetative]: { ecMin: 0.8, ecMax: 1.4, phMin: 6.0, phMax: 6.8 },
        [PlantStage.Flowering]: { ecMin: 1.2, ecMax: 1.8, phMin: 6.0, phMax: 6.5 },
        default: { ecMin: 0.6, ecMax: 1.2, phMin: 6.0, phMax: 6.8 },
    },
    Coco: {
        [PlantStage.Seedling]: { ecMin: 0.4, ecMax: 0.8, phMin: 5.5, phMax: 6.2 },
        [PlantStage.Vegetative]: { ecMin: 0.8, ecMax: 1.6, phMin: 5.5, phMax: 6.3 },
        [PlantStage.Flowering]: { ecMin: 1.4, ecMax: 2.2, phMin: 5.5, phMax: 6.2 },
        default: { ecMin: 0.8, ecMax: 1.6, phMin: 5.5, phMax: 6.3 },
    },
    Hydro: {
        [PlantStage.Seedling]: { ecMin: 0.3, ecMax: 0.6, phMin: 5.5, phMax: 6.0 },
        [PlantStage.Vegetative]: { ecMin: 0.8, ecMax: 1.6, phMin: 5.5, phMax: 6.0 },
        [PlantStage.Flowering]: { ecMin: 1.4, ecMax: 2.4, phMin: 5.5, phMax: 6.0 },
        default: { ecMin: 0.8, ecMax: 1.6, phMin: 5.5, phMax: 6.0 },
    },
}

export const getOptimalRange = (medium: string, stage: PlantStage): OptimalRange => {
    const mediumRanges = OPTIMAL_RANGES[medium] ?? OPTIMAL_RANGES['Soil']
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- fallback always yields OptimalRange
    return (mediumRanges?.[stage] ?? mediumRanges?.['default']) as OptimalRange
}

// ---------------------------------------------------------------------------
// Default schedule (populated from optimal ranges)
// ---------------------------------------------------------------------------

const createDefaultSchedule = (): NutrientScheduleEntry[] => [
    {
        id: 'schedule-seedling',
        growId: DEFAULT_GROW_ID,
        stage: PlantStage.Seedling,
        targetEc: 0.6,
        targetPh: 6.2,
        npkRatio: { n: 2, p: 1, k: 1 },
        notes: '',
    },
    {
        id: 'schedule-vegetative',
        growId: DEFAULT_GROW_ID,
        stage: PlantStage.Vegetative,
        targetEc: 1.2,
        targetPh: 6.3,
        npkRatio: { n: 3, p: 1, k: 2 },
        notes: '',
    },
    {
        id: 'schedule-flowering',
        growId: DEFAULT_GROW_ID,
        stage: PlantStage.Flowering,
        targetEc: 1.6,
        targetPh: 6.1,
        npkRatio: { n: 1, p: 3, k: 3 },
        notes: '',
    },
]

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: NutrientPlannerState = {
    schedule: createDefaultSchedule(),
    readings: [],
    alerts: [],
    autoAdjustEnabled: false,
    medium: 'Soil',
    isAiLoading: false,
    lastAiRecommendation: null,
    activePluginId: null,
    autoAdjustRecommendation: null,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_READINGS = 500
const MAX_ALERTS = 50

/** Map plugin stage strings to PlantStage enum */
const mapPluginStage = (stage: string): PlantStage => {
    const lower = stage.toLowerCase()
    if (lower.includes('seed') || lower.includes('clone') || lower.includes('germ'))
        return PlantStage.Seedling
    if (lower.includes('veg')) return PlantStage.Vegetative
    if (lower.includes('flower') || lower.includes('bloom')) return PlantStage.Flowering
    return PlantStage.Vegetative
}

/** Number of recent readings to consider for auto-adjust */
const AUTO_ADJUST_WINDOW = 10

/** Generate auto-adjustment recommendation from recent readings */
const computeAutoAdjustment = (
    readings: EcPhReading[],
    medium: string,
    stage: PlantStage,
): string | null => {
    if (readings.length === 0) return null
    const recent = readings.slice(-AUTO_ADJUST_WINDOW)
    const avgEc = recent.reduce((s, r) => s + r.ec, 0) / recent.length
    const avgPh = recent.reduce((s, r) => s + r.ph, 0) / recent.length
    const optimal = getOptimalRange(medium, stage)
    const tips: string[] = []

    if (avgEc > optimal.ecMax) {
        tips.push(
            `Avg EC ${avgEc.toFixed(2)} is above optimal max ${optimal.ecMax.toFixed(2)} -- reduce nutrient concentration or flush.`,
        )
    } else if (avgEc < optimal.ecMin) {
        tips.push(
            `Avg EC ${avgEc.toFixed(2)} is below optimal min ${optimal.ecMin.toFixed(2)} -- increase nutrient concentration.`,
        )
    }

    if (avgPh > optimal.phMax) {
        tips.push(
            `Avg pH ${avgPh.toFixed(2)} is above optimal max ${optimal.phMax.toFixed(2)} -- use pH-down.`,
        )
    } else if (avgPh < optimal.phMin) {
        tips.push(
            `Avg pH ${avgPh.toFixed(2)} is below optimal min ${optimal.phMin.toFixed(2)} -- use pH-up.`,
        )
    }

    return tips.length > 0 ? tips.join(' ') : null
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const nutrientPlannerSlice = createSlice({
    name: 'nutrientPlanner',
    initialState,
    reducers: {
        setMedium(state, action: PayloadAction<'Soil' | 'Coco' | 'Hydro'>) {
            state.medium = action.payload
        },

        toggleAutoAdjust(state) {
            state.autoAdjustEnabled = !state.autoAdjustEnabled
        },

        // --- Schedule management ---
        updateScheduleEntry(
            state,
            action: PayloadAction<{
                id: string
                changes: Partial<Omit<NutrientScheduleEntry, 'id'>>
            }>,
        ) {
            const entry = state.schedule.find((e) => e.id === action.payload.id)
            if (entry) {
                Object.assign(entry, action.payload.changes)
            }
        },

        resetScheduleToDefaults(state) {
            state.schedule = createDefaultSchedule()
        },

        // --- EC/pH readings ---
        addReading(state, action: PayloadAction<Omit<EcPhReading, 'id' | 'timestamp'>>) {
            const reading: EcPhReading = {
                ...action.payload,
                id: `reading-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                timestamp: Date.now(),
            }
            state.readings.push(reading)

            // Cap readings (FIFO)
            if (state.readings.length > MAX_READINGS) {
                state.readings = state.readings.slice(-MAX_READINGS)
            }

            // Auto-alert generation
            const medium = state.medium
            const stage = PlantStage.Vegetative // Default check; real plants override via component logic
            const optimal = getOptimalRange(medium, stage)

            if (reading.ec > optimal.ecMax) {
                state.alerts.push({
                    id: `alert-${Date.now()}-ec-high`,
                    plantId: reading.plantId,
                    type: 'ec_high',
                    message: `EC ${reading.ec.toFixed(2)} exceeds optimal max ${optimal.ecMax.toFixed(2)}`,
                    timestamp: Date.now(),
                    dismissed: false,
                })
            } else if (reading.ec < optimal.ecMin) {
                state.alerts.push({
                    id: `alert-${Date.now()}-ec-low`,
                    plantId: reading.plantId,
                    type: 'ec_low',
                    message: `EC ${reading.ec.toFixed(2)} below optimal min ${optimal.ecMin.toFixed(2)}`,
                    timestamp: Date.now(),
                    dismissed: false,
                })
            }

            if (reading.ph > optimal.phMax) {
                state.alerts.push({
                    id: `alert-${Date.now()}-ph-high`,
                    plantId: reading.plantId,
                    type: 'ph_high',
                    message: `pH ${reading.ph.toFixed(2)} exceeds optimal max ${optimal.phMax.toFixed(2)}`,
                    timestamp: Date.now(),
                    dismissed: false,
                })
            } else if (reading.ph < optimal.phMin) {
                state.alerts.push({
                    id: `alert-${Date.now()}-ph-low`,
                    plantId: reading.plantId,
                    type: 'ph_low',
                    message: `pH ${reading.ph.toFixed(2)} below optimal min ${optimal.phMin.toFixed(2)}`,
                    timestamp: Date.now(),
                    dismissed: false,
                })
            }

            // Cap alerts
            if (state.alerts.length > MAX_ALERTS) {
                state.alerts = state.alerts.slice(-MAX_ALERTS)
            }

            // Auto-adjust recommendation
            if (state.autoAdjustEnabled) {
                state.autoAdjustRecommendation = computeAutoAdjustment(
                    state.readings,
                    state.medium,
                    stage,
                )
            }
        },

        removeReading(state, action: PayloadAction<string>) {
            state.readings = state.readings.filter((r) => r.id !== action.payload)
        },

        clearReadings(state) {
            state.readings = []
        },

        // --- Alerts ---
        dismissAlert(state, action: PayloadAction<string>) {
            const alert = state.alerts.find((a) => a.id === action.payload)
            if (alert) {
                alert.dismissed = true
            }
        },

        clearAlerts(state) {
            state.alerts = []
        },

        // --- AI ---
        setAiLoading(state, action: PayloadAction<boolean>) {
            state.isAiLoading = action.payload
        },

        setAiRecommendation(state, action: PayloadAction<string | null>) {
            state.lastAiRecommendation = action.payload
            state.isAiLoading = false
        },

        /** Apply a nutrient-schedule plugin, replacing the current schedule */
        applyPluginSchedule(
            state,
            action: PayloadAction<{
                pluginId: string
                weeks: NutrientWeek[]
            }>,
        ) {
            const { pluginId, weeks } = action.payload
            state.activePluginId = pluginId

            // Group weeks by mapped stage, take the last week per stage as representative
            const stageMap = new Map<PlantStage, NutrientWeek>()
            for (const week of weeks) {
                stageMap.set(mapPluginStage(week.stage), week)
            }

            state.schedule = Array.from(stageMap.entries()).map(([stage, week]) => ({
                id: `plugin-${pluginId}-${stage}`,
                growId: DEFAULT_GROW_ID,
                stage,
                targetEc: week.ecTarget ?? getOptimalRange(state.medium, stage).ecMin,
                targetPh: week.phTarget
                    ? (week.phTarget[0] + week.phTarget[1]) / 2
                    : getOptimalRange(state.medium, stage).phMin,
                npkRatio: { n: 1, p: 1, k: 1 },
                notes: week.products.map((p) => `${p.name} ${p.dosageMlPerLiter} ml/L`).join(', '),
            }))
        },

        /** Detach plugin and revert to default schedule */
        detachPlugin(state) {
            state.activePluginId = null
            state.schedule = createDefaultSchedule()
        },

        // --- CRDT sync actions (Session I) ---
        upsertScheduleEntry: {
            reducer(state, action: PayloadAction<NutrientScheduleEntry>) {
                const entry = action.payload
                const idx = state.schedule.findIndex((e) => e.id === entry.id)
                if (idx >= 0) {
                    state.schedule[idx] = entry
                } else {
                    state.schedule.push(entry)
                }
            },
            prepare(entry: NutrientScheduleEntry, meta?: { fromCrdt?: boolean | undefined }) {
                return { payload: entry, meta: { fromCrdt: meta?.fromCrdt } }
            },
        },
        removeScheduleEntry: {
            reducer(state, action: PayloadAction<string>) {
                state.schedule = state.schedule.filter((e) => e.id !== action.payload)
            },
            prepare(id: string, meta?: { fromCrdt?: boolean | undefined }) {
                return { payload: id, meta: { fromCrdt: meta?.fromCrdt } }
            },
        },
        upsertReading: {
            reducer(state, action: PayloadAction<EcPhReading>) {
                const reading = action.payload
                const idx = state.readings.findIndex((r) => r.id === reading.id)
                if (idx >= 0) {
                    state.readings[idx] = reading
                } else {
                    state.readings.push(reading)
                    if (state.readings.length > MAX_READINGS) {
                        state.readings = state.readings.slice(-MAX_READINGS)
                    }
                }
            },
            prepare(reading: EcPhReading, meta?: { fromCrdt?: boolean | undefined }) {
                return { payload: reading, meta: { fromCrdt: meta?.fromCrdt } }
            },
        },
    },
})

export const {
    setMedium,
    toggleAutoAdjust,
    updateScheduleEntry,
    resetScheduleToDefaults,
    addReading,
    removeReading,
    clearReadings,
    dismissAlert,
    clearAlerts,
    setAiLoading,
    setAiRecommendation,
    applyPluginSchedule,
    detachPlugin,
    upsertScheduleEntry,
    removeScheduleEntry,
    upsertReading,
} = nutrientPlannerSlice.actions

export default nutrientPlannerSlice.reducer

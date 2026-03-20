import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlantStage } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NutrientScheduleEntry {
    /** Unique identifier */
    id: string;
    /** Growth stage this entry applies to */
    stage: PlantStage;
    /** Target EC (mS/cm) */
    targetEc: number;
    /** Target pH */
    targetPh: number;
    /** N-P-K ratio */
    npkRatio: { n: number; p: number; k: number };
    /** Optional notes */
    notes: string;
}

export interface EcPhReading {
    /** Unique identifier */
    id: string;
    /** Associated plant ID (null for general readings) */
    plantId: string | null;
    /** Timestamp when reading was taken */
    timestamp: number;
    /** Measured EC value (mS/cm) */
    ec: number;
    /** Measured pH value */
    ph: number;
    /** Water temperature in °C */
    waterTempC: number | null;
    /** Whether this is input or runoff measurement */
    readingType: 'input' | 'runoff';
    /** Optional notes */
    notes: string;
}

export interface NutrientAlert {
    id: string;
    plantId: string | null;
    type: 'ec_high' | 'ec_low' | 'ph_high' | 'ph_low';
    message: string;
    timestamp: number;
    dismissed: boolean;
}

export interface NutrientPlannerState {
    /** Custom nutrient schedule per stage */
    schedule: NutrientScheduleEntry[];
    /** EC/pH reading history */
    readings: EcPhReading[];
    /** Active alerts */
    alerts: NutrientAlert[];
    /** Auto-adjustment enabled */
    autoAdjustEnabled: boolean;
    /** Grow medium: determines optimal pH/EC ranges */
    medium: 'Soil' | 'Coco' | 'Hydro';
    /** Whether AI recommendation is loading */
    isAiLoading: boolean;
    /** Last AI recommendation (raw text) */
    lastAiRecommendation: string | null;
}

// ---------------------------------------------------------------------------
// Optimal ranges per medium + stage (science-backed defaults)
// ---------------------------------------------------------------------------

export interface OptimalRange {
    ecMin: number;
    ecMax: number;
    phMin: number;
    phMax: number;
}

const OPTIMAL_RANGES: Record<string, Record<string, OptimalRange>> = {
    Soil: {
        [PlantStage.Seedling]:    { ecMin: 0.4, ecMax: 0.8, phMin: 6.0, phMax: 6.5 },
        [PlantStage.Vegetative]:  { ecMin: 0.8, ecMax: 1.4, phMin: 6.0, phMax: 6.8 },
        [PlantStage.Flowering]:   { ecMin: 1.2, ecMax: 1.8, phMin: 6.0, phMax: 6.5 },
        default:                  { ecMin: 0.6, ecMax: 1.2, phMin: 6.0, phMax: 6.8 },
    },
    Coco: {
        [PlantStage.Seedling]:    { ecMin: 0.4, ecMax: 0.8, phMin: 5.5, phMax: 6.2 },
        [PlantStage.Vegetative]:  { ecMin: 0.8, ecMax: 1.6, phMin: 5.5, phMax: 6.3 },
        [PlantStage.Flowering]:   { ecMin: 1.4, ecMax: 2.2, phMin: 5.5, phMax: 6.2 },
        default:                  { ecMin: 0.8, ecMax: 1.6, phMin: 5.5, phMax: 6.3 },
    },
    Hydro: {
        [PlantStage.Seedling]:    { ecMin: 0.3, ecMax: 0.6, phMin: 5.5, phMax: 6.0 },
        [PlantStage.Vegetative]:  { ecMin: 0.8, ecMax: 1.6, phMin: 5.5, phMax: 6.0 },
        [PlantStage.Flowering]:   { ecMin: 1.4, ecMax: 2.4, phMin: 5.5, phMax: 6.0 },
        default:                  { ecMin: 0.8, ecMax: 1.6, phMin: 5.5, phMax: 6.0 },
    },
};

export const getOptimalRange = (medium: string, stage: PlantStage): OptimalRange => {
    const mediumRanges = OPTIMAL_RANGES[medium] ?? OPTIMAL_RANGES['Soil'];
    return (mediumRanges?.[stage] ?? mediumRanges?.['default']) as OptimalRange;
};

// ---------------------------------------------------------------------------
// Default schedule (populated from optimal ranges)
// ---------------------------------------------------------------------------

const createDefaultSchedule = (): NutrientScheduleEntry[] => [
    {
        id: 'schedule-seedling',
        stage: PlantStage.Seedling,
        targetEc: 0.6,
        targetPh: 6.2,
        npkRatio: { n: 2, p: 1, k: 1 },
        notes: '',
    },
    {
        id: 'schedule-vegetative',
        stage: PlantStage.Vegetative,
        targetEc: 1.2,
        targetPh: 6.3,
        npkRatio: { n: 3, p: 1, k: 2 },
        notes: '',
    },
    {
        id: 'schedule-flowering',
        stage: PlantStage.Flowering,
        targetEc: 1.6,
        targetPh: 6.1,
        npkRatio: { n: 1, p: 3, k: 3 },
        notes: '',
    },
];

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
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_READINGS = 500;
const MAX_ALERTS = 50;

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const nutrientPlannerSlice = createSlice({
    name: 'nutrientPlanner',
    initialState,
    reducers: {
        setMedium(state, action: PayloadAction<'Soil' | 'Coco' | 'Hydro'>) {
            state.medium = action.payload;
        },

        toggleAutoAdjust(state) {
            state.autoAdjustEnabled = !state.autoAdjustEnabled;
        },

        // --- Schedule management ---
        updateScheduleEntry(state, action: PayloadAction<{ id: string; changes: Partial<Omit<NutrientScheduleEntry, 'id'>> }>) {
            const entry = state.schedule.find(e => e.id === action.payload.id);
            if (entry) {
                Object.assign(entry, action.payload.changes);
            }
        },

        resetScheduleToDefaults(state) {
            state.schedule = createDefaultSchedule();
        },

        // --- EC/pH readings ---
        addReading(state, action: PayloadAction<Omit<EcPhReading, 'id' | 'timestamp'>>) {
            const reading: EcPhReading = {
                ...action.payload,
                id: `reading-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                timestamp: Date.now(),
            };
            state.readings.push(reading);

            // Cap readings (FIFO)
            if (state.readings.length > MAX_READINGS) {
                state.readings = state.readings.slice(-MAX_READINGS);
            }

            // Auto-alert generation
            const medium = state.medium;
            const stage = PlantStage.Vegetative; // Default check; real plants override via component logic
            const optimal = getOptimalRange(medium, stage);

            if (reading.ec > optimal.ecMax) {
                state.alerts.push({
                    id: `alert-${Date.now()}-ec-high`,
                    plantId: reading.plantId,
                    type: 'ec_high',
                    message: `EC ${reading.ec.toFixed(2)} exceeds optimal max ${optimal.ecMax.toFixed(2)}`,
                    timestamp: Date.now(),
                    dismissed: false,
                });
            } else if (reading.ec < optimal.ecMin) {
                state.alerts.push({
                    id: `alert-${Date.now()}-ec-low`,
                    plantId: reading.plantId,
                    type: 'ec_low',
                    message: `EC ${reading.ec.toFixed(2)} below optimal min ${optimal.ecMin.toFixed(2)}`,
                    timestamp: Date.now(),
                    dismissed: false,
                });
            }

            if (reading.ph > optimal.phMax) {
                state.alerts.push({
                    id: `alert-${Date.now()}-ph-high`,
                    plantId: reading.plantId,
                    type: 'ph_high',
                    message: `pH ${reading.ph.toFixed(2)} exceeds optimal max ${optimal.phMax.toFixed(2)}`,
                    timestamp: Date.now(),
                    dismissed: false,
                });
            } else if (reading.ph < optimal.phMin) {
                state.alerts.push({
                    id: `alert-${Date.now()}-ph-low`,
                    plantId: reading.plantId,
                    type: 'ph_low',
                    message: `pH ${reading.ph.toFixed(2)} below optimal min ${optimal.phMin.toFixed(2)}`,
                    timestamp: Date.now(),
                    dismissed: false,
                });
            }

            // Cap alerts
            if (state.alerts.length > MAX_ALERTS) {
                state.alerts = state.alerts.slice(-MAX_ALERTS);
            }
        },

        removeReading(state, action: PayloadAction<string>) {
            state.readings = state.readings.filter(r => r.id !== action.payload);
        },

        clearReadings(state) {
            state.readings = [];
        },

        // --- Alerts ---
        dismissAlert(state, action: PayloadAction<string>) {
            const alert = state.alerts.find(a => a.id === action.payload);
            if (alert) {
                alert.dismissed = true;
            }
        },

        clearAlerts(state) {
            state.alerts = [];
        },

        // --- AI ---
        setAiLoading(state, action: PayloadAction<boolean>) {
            state.isAiLoading = action.payload;
        },

        setAiRecommendation(state, action: PayloadAction<string | null>) {
            state.lastAiRecommendation = action.payload;
            state.isAiLoading = false;
        },
    },
});

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
} = nutrientPlannerSlice.actions;

export default nutrientPlannerSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type {
    HydroState,
    HydroReading,
    HydroAlert,
    HydroSystemType,
    HydroThresholds,
    HydroAlertDirection,
} from '@/types'
import { secureRandom } from '@/utils/random'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_THRESHOLDS: HydroThresholds = {
    phMin: 5.5,
    phMax: 6.5,
    ecMin: 0.8,
    ecMax: 2.4,
    waterTempMin: 18,
    waterTempMax: 24,
}

/**
 * A reading id that no stored reading has. Two readings in the same millisecond
 * share the timestamp part, and the random part can collide too; with every
 * reading kept, a duplicate id would make removeReading delete both.
 */
export const uniqueReadingId = (
    readings: readonly HydroReading[],
    timestamp: number,
    random: () => number = secureRandom,
): string => {
    const base = `hr-${String(timestamp)}-${String(Math.floor(random() * 1e6))}`
    // The usual case has no collision: check without building a set of every id.
    if (!readings.some(({ id }) => id === base)) return base
    const taken = new Set(readings.map(({ id }) => id))
    let id = base
    for (let suffix = 1; taken.has(id); suffix += 1) id = `${base}-${String(suffix)}`
    return id
}

// ---------------------------------------------------------------------------
// Alert checker
// ---------------------------------------------------------------------------

function checkAlerts(reading: HydroReading, thresholds: HydroThresholds): HydroAlert[] {
    const alerts: HydroAlert[] = []
    const ts = Date.now()

    const check = (metric: HydroAlert['metric'], value: number, min: number, max: number): void => {
        if (value < min) {
            alerts.push({
                id: `${metric}-low-${ts}-${Math.floor(secureRandom() * 1e6)}`,
                metric,
                value,
                threshold: min,
                direction: 'low' as HydroAlertDirection,
                timestamp: ts,
                dismissed: false,
            })
        } else if (value > max) {
            alerts.push({
                id: `${metric}-high-${ts}-${Math.floor(secureRandom() * 1e6)}`,
                metric,
                value,
                threshold: max,
                direction: 'high' as HydroAlertDirection,
                timestamp: ts,
                dismissed: false,
            })
        }
    }

    check('ph', reading.ph, thresholds.phMin, thresholds.phMax)
    check('ec', reading.ec, thresholds.ecMin, thresholds.ecMax)
    check('waterTemp', reading.waterTemp, thresholds.waterTempMin, thresholds.waterTempMax)

    return alerts
}

/**
 * The restored entries, once per id and in their original order, ahead of the
 * entries added since the clear. The lists keep insertion order
 * (selectLatestReading reads the last entry), so nothing is re-sorted, and a
 * list with nothing to restore is returned as it is.
 */
const restoreAhead = <T extends { id: string }>(stored: T[], restored: readonly T[]): T[] => {
    const taken = new Set(stored.map(({ id }) => id))
    const back = restored.filter(({ id }) => {
        if (taken.has(id)) return false
        taken.add(id)
        return true
    })
    return back.length === 0 ? stored : [...back, ...stored]
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: HydroState = {
    readings: [],
    alerts: [],
    systemType: 'DWC',
    thresholds: DEFAULT_THRESHOLDS,
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const hydroSlice = createSlice({
    name: 'hydro',
    initialState,
    reducers: {
        addReading(state, action: PayloadAction<Omit<HydroReading, 'id'>>) {
            const reading: HydroReading = {
                ...action.payload,
                id: uniqueReadingId(state.readings, action.payload.timestamp),
            }
            // Every hydro reading is entered by hand (HydroReadingForm), so none is
            // removed to make room: they leave only through removeReading or
            // clearReadings, the grower's own actions (GH #686, owner decision).
            // The old count cap of 168 dropped the oldest manual measurement on
            // every 169th entry, however many months the history spanned.
            state.readings.push(reading)

            // Check thresholds and generate alerts
            const newAlerts = checkAlerts(reading, state.thresholds)
            state.alerts.push(...newAlerts)
        },

        removeReading(state, action: PayloadAction<string>) {
            state.readings = state.readings.filter((r) => r.id !== action.payload)
        },

        setSystemType(state, action: PayloadAction<HydroSystemType>) {
            state.systemType = action.payload
        },

        setThresholds(state, action: PayloadAction<Partial<HydroThresholds>>) {
            state.thresholds = { ...state.thresholds, ...action.payload }
        },

        dismissAlert(state, action: PayloadAction<string>) {
            const alert = state.alerts.find((a) => a.id === action.payload)
            if (alert) {
                alert.dismissed = true
            }
        },

        clearAlerts(state) {
            state.alerts = []
        },

        clearReadings(state) {
            state.readings = []
        },

        /**
         * Puts back readings and alerts that a clear removed (the undo of GH #685).
         * An id that is already stored, or repeated in the payload, is put back
         * once at most, so an undo never duplicates anything. The restored
         * entries go back in their original order before anything added since.
         */
        restoreHydroHistory(
            state,
            action: PayloadAction<{ readings: HydroReading[]; alerts: HydroAlert[] }>,
        ) {
            state.readings = restoreAhead(state.readings, action.payload.readings)
            state.alerts = restoreAhead(state.alerts, action.payload.alerts)
        },
    },
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const {
    addReading,
    removeReading,
    setSystemType,
    setThresholds,
    dismissAlert,
    clearAlerts,
    clearReadings,
    restoreHydroHistory,
} = hydroSlice.actions

export default hydroSlice.reducer

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectHydroReadings = (state: RootState): HydroReading[] => state.hydro.readings

export const selectHydroAlerts = (state: RootState): HydroAlert[] =>
    state.hydro.alerts.filter((a) => !a.dismissed)

export const selectHydroSystemType = (state: RootState): HydroSystemType => state.hydro.systemType

export const selectHydroThresholds = (state: RootState): HydroThresholds => state.hydro.thresholds

export const selectLatestReading = (state: RootState): HydroReading | undefined =>
    state.hydro.readings.length > 0
        ? state.hydro.readings[state.hydro.readings.length - 1]
        : undefined

export { DEFAULT_THRESHOLDS, checkAlerts }

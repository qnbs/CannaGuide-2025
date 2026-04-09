import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { MetricsState, MetricsReading } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_READINGS = 168 // 7 days of hourly readings per plant

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: MetricsState = {
    readings: [],
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const metricsSlice = createSlice({
    name: 'metrics',
    initialState,
    reducers: {
        addMetricsReading(state, action: PayloadAction<MetricsReading>) {
            state.readings.push(action.payload)
            // FIFO cap: keep latest MAX_READINGS per plant
            const byPlant = new Map<string, number>()
            for (const r of state.readings) {
                byPlant.set(r.plantId, (byPlant.get(r.plantId) ?? 0) + 1)
            }
            for (const [plantId, count] of byPlant) {
                if (count > MAX_READINGS) {
                    const excess = count - MAX_READINGS
                    let removed = 0
                    state.readings = state.readings.filter((r) => {
                        if (r.plantId === plantId && removed < excess) {
                            removed++
                            return false
                        }
                        return true
                    })
                }
            }
        },
        clearMetricsForPlant(state, action: PayloadAction<string>) {
            state.readings = state.readings.filter((r) => r.plantId !== action.payload)
        },
        clearAllMetrics(state) {
            state.readings = []
        },
    },
})

export const { addMetricsReading, clearMetricsForPlant, clearAllMetrics } = metricsSlice.actions

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectMetricsReadings = (state: RootState): MetricsReading[] => state.metrics.readings

export const selectMetricsForPlant =
    (plantId: string) =>
    (state: RootState): MetricsReading[] =>
        state.metrics.readings.filter((r) => r.plantId === plantId)

export const selectLatestMetrics =
    (plantId: string) =>
    (state: RootState): MetricsReading | undefined => {
        const plantReadings = state.metrics.readings.filter((r) => r.plantId === plantId)
        return plantReadings.length > 0 ? plantReadings[plantReadings.length - 1] : undefined
    }

export default metricsSlice.reducer

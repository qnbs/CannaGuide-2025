/**
 * WorkerMetricsSlice
 *
 * Exposes WorkerBus runtime telemetry to Redux DevTools so developers can
 * inspect per-worker dispatch counts, error rates, and latency without needing
 * a separate DevTools panel.
 *
 * This slice is RUNTIME-ONLY and intentionally excluded from the stateToSave
 * set in store.ts -- metrics reset on every page load.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { WorkerBusMetrics } from '../../services/workerBus'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface WorkerMetricsState {
    /** Snapshot of workerBus.getMetrics() -- keyed by worker name */
    metrics: Record<string, WorkerBusMetrics>
    /** Unix ms timestamp of the last metrics snapshot -- 0 if never set */
    lastUpdatedAt: number
}

const initialState: WorkerMetricsState = {
    metrics: {},
    lastUpdatedAt: 0,
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const workerMetricsSlice = createSlice({
    name: 'workerMetrics',
    initialState,
    reducers: {
        /**
         * Replace the full metrics snapshot.
         * Typically dispatched by workerTelemetryService on a 5-second debounce
         * or immediately after an error event.
         */
        updateWorkerMetrics: (state, action: PayloadAction<Record<string, WorkerBusMetrics>>) => {
            state.metrics = action.payload
            state.lastUpdatedAt = Date.now()
        },
    },
})

export const { updateWorkerMetrics } = workerMetricsSlice.actions
export default workerMetricsSlice.reducer

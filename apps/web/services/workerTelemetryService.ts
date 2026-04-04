/**
 * WorkerTelemetryService
 *
 * Connects WorkerBus dispatch-complete events to:
 *  1. Redux DevTools -- debounced 5-second metrics snapshots via workerMetricsSlice
 *  2. Sentry -- alerts when any worker's error rate exceeds 10 %
 *
 * Call `initWorkerTelemetry(dispatch)` once in index.tsx after store hydration.
 * The function is idempotent -- safe to call multiple times.
 */

import * as Sentry from '@sentry/browser'
import { workerBus, type DispatchCompleteEvent } from './workerBus'
import { updateWorkerMetrics } from '../stores/slices/workerMetricsSlice'
import type { AppDispatch } from '../stores/store'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 5_000
const ERROR_RATE_THRESHOLD = 0.1 // 10 %

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let initialised = false
let debounceTimer: ReturnType<typeof setTimeout> | undefined

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

const flushMetrics = (dispatch: AppDispatch): void => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        dispatch(updateWorkerMetrics(workerBus.getMetrics()))
        debounceTimer = undefined
    }, DEBOUNCE_MS)
}

const checkErrorRate = (workerName: string): void => {
    const snapshot = workerBus.getMetrics(workerName)
    const entry = snapshot[workerName]
    if (!entry) return

    const { totalDispatches, totalErrors } = entry
    if (totalDispatches < 5) return // too few samples to be meaningful

    const rate = totalErrors / totalDispatches
    if (rate > ERROR_RATE_THRESHOLD) {
        Sentry.captureMessage(
            `WorkerBus error rate ${(rate * 100).toFixed(1)}% for worker "${workerName}" (${totalErrors}/${totalDispatches})`,
            'warning',
        )
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Subscribe to WorkerBus dispatch-complete events for telemetry purposes.
 *
 * @param dispatch - AppDispatch from the hydrated Redux store
 */
export const initWorkerTelemetry = (dispatch: AppDispatch): void => {
    if (initialised) return
    initialised = true

    workerBus.onDispatchComplete((event: DispatchCompleteEvent) => {
        if (!event.success) {
            // Flush metrics immediately on every error for fast DevTools
            // visibility, then check whether the error rate crossed threshold.
            clearTimeout(debounceTimer)
            dispatch(updateWorkerMetrics(workerBus.getMetrics()))
            checkErrorRate(event.workerName)
            return
        }

        // Success -- debounced flush is sufficient
        flushMetrics(dispatch)
    })
}

/**
 * Reset the service -- for tests only.
 * Do not call in production code.
 */
export const resetWorkerTelemetry = (): void => {
    initialised = false
    clearTimeout(debounceTimer)
    debounceTimer = undefined
}

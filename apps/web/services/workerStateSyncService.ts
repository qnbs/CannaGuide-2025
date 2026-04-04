/**
 * WorkerStateSyncService
 *
 * Central handler-registry that connects WorkerBus dispatch results to
 * Redux and Zustand stores without requiring manual "await then dispatch"
 * patterns in every calling component or service.
 *
 * Pattern:
 *   // In index.tsx or a feature-init module:
 *   registerWorkerResultHandler('vpd-sim', 'SIMULATE', (data, ctx) => {
 *       reduxDispatch(updateSimulationResult(data))
 *   })
 *
 *   // The handler fires automatically after workerBus.dispatch() resolves --
 *   // no additional await/dispatch code needed at the call site.
 *
 * Key design decisions:
 * - NO Redux or Zustand imports here -- handlers are closures from the caller,
 *   keeping this service framework-agnostic and independently testable.
 * - Only fires on successful dispatches (success === true).
 * - Errors are NOT routed through here; use workerTelemetryService for error
 *   monitoring and alerting.
 * - Thread-safe Map-based registry (main-thread only).
 */

import { workerBus, type DispatchCompleteEvent } from './workerBus'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A handler called when a WorkerBus dispatch completes successfully.
 * The `data` type should match the TResponse of the corresponding dispatch call.
 */
export type WorkerResultHandler<T = unknown> = (
    data: T,
    ctx: { workerName: string; type: string; latencyMs: number },
) => void

// ---------------------------------------------------------------------------
// Internal registry
// ---------------------------------------------------------------------------

/** Key format: "workerName:messageType" */
const handlers = new Map<string, WorkerResultHandler[]>()

const makeKey = (workerName: string, type: string): string => `${workerName}:${type}`

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a handler for completed dispatches to a specific worker + type.
 *
 * @param workerName - Worker name as registered with workerBus.register()
 * @param type       - Message type string (e.g. 'SIMULATE', 'CLASSIFY')
 * @param handler    - Called with the resolved data on success
 * @returns Cleanup function -- call it to unsubscribe the handler
 */
export const registerWorkerResultHandler = <T = unknown>(
    workerName: string,
    type: string,
    handler: WorkerResultHandler<T>,
): (() => void) => {
    const key = makeKey(workerName, type)
    let list = handlers.get(key)
    if (!list) {
        list = []
        handlers.set(key, list)
    }
    // Cast: runtime type safety guaranteed by caller's TResponse annotation
    list.push(handler as WorkerResultHandler)

    return () => {
        const current = handlers.get(key)
        if (!current) return
        const idx = current.indexOf(handler as WorkerResultHandler)
        if (idx !== -1) current.splice(idx, 1)
        if (current.length === 0) handlers.delete(key)
    }
}

// ---------------------------------------------------------------------------
// Singleton init
// ---------------------------------------------------------------------------

let cleanup: (() => void) | undefined

/**
 * Subscribe to WorkerBus dispatch-complete events.
 * Safe to call multiple times -- only subscribes once.
 *
 * Call this after the WorkerBus singleton is ready (i.e. in index.tsx after
 * store hydration).
 */
export const initWorkerStateSync = (): void => {
    if (cleanup !== undefined) return // already initialised

    cleanup = workerBus.onDispatchComplete((event: DispatchCompleteEvent) => {
        if (!event.success) return // errors routed to workerTelemetryService

        const key = makeKey(event.workerName, event.type)
        const list = handlers.get(key)
        if (!list || list.length === 0) return

        const ctx = {
            workerName: event.workerName,
            type: event.type,
            latencyMs: event.latencyMs,
        }

        for (const handler of list) {
            try {
                handler(event.data, ctx)
            } catch (err) {
                console.debug('[WorkerStateSync] handler threw for', key, err)
            }
        }
    })
}

/**
 * Reset the service -- removes the WorkerBus subscription and all handlers.
 * Intended for tests; do not call in production code.
 */
export const resetWorkerStateSync = (): void => {
    cleanup?.()
    cleanup = undefined
    handlers.clear()
}

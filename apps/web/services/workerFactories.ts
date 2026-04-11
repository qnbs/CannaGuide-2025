/**
 * WorkerFactories -- Centralized worker factory registry (W-06).
 *
 * Single source of truth for all Worker instantiation in the app.
 * Each entry maps a worker name to its lazy factory + configuration.
 *
 * The WorkerPool calls these factories on demand via `getOrCreate()`.
 * Services no longer need their own `ensureWorkerRegistered()` boilerplate.
 *
 * NOTE: Genealogy workers use dynamic UUID-suffixed names (fire-and-forget
 * pattern) and are intentionally excluded from this registry.
 */

import { workerPool, type WorkerFactoryEntry } from './workerPool'

// ---------------------------------------------------------------------------
// Worker name constants (exported for use in service files)
// ---------------------------------------------------------------------------

export const WORKER_NAMES = {
    VPD: 'vpd',
    VOICE: 'voice',
    VISION_INFERENCE: 'visionInference',
    HYDRO_FORECAST: 'hydroForecast',
    IMAGE_GENERATION: 'imageGeneration',
    INFERENCE: 'inference',
    SCENARIO: 'scenario',
    CALCULATION: 'calculation',
    SIMULATION: 'simulation',
    TERPENE: 'terpene',
} as const

export type WorkerName = (typeof WORKER_NAMES)[keyof typeof WORKER_NAMES]

// ---------------------------------------------------------------------------
// Factory definitions
// ---------------------------------------------------------------------------

const FACTORIES: Record<string, WorkerFactoryEntry> = {
    [WORKER_NAMES.VPD]: {
        factory: () =>
            new Worker(new URL('../workers/vpdSimulation.worker.ts', import.meta.url), {
                type: 'module',
            }),
        hot: true,
    },
    [WORKER_NAMES.VOICE]: {
        factory: () =>
            new Worker(new URL('../workers/voiceWorker.ts', import.meta.url), {
                type: 'module',
            }),
        // SAB hot-path deferred until waveform streaming is implemented (W-07)
        hot: false,
    },
    [WORKER_NAMES.VISION_INFERENCE]: {
        factory: () =>
            new Worker(new URL('../workers/visionInferenceWorker.ts', import.meta.url), {
                type: 'module',
            }),
        hot: false,
    },
    [WORKER_NAMES.HYDRO_FORECAST]: {
        factory: () =>
            new Worker(new URL('../workers/hydroForecastWorker.ts', import.meta.url), {
                type: 'module',
            }),
        hot: false,
    },
    [WORKER_NAMES.IMAGE_GENERATION]: {
        factory: () =>
            new Worker(new URL('../workers/imageGeneration.worker.ts', import.meta.url), {
                type: 'module',
            }),
        hot: false,
    },
    [WORKER_NAMES.INFERENCE]: {
        factory: () =>
            new Worker(new URL('../workers/inference.worker.ts', import.meta.url), {
                type: 'module',
                name: 'cannaGuideInference',
            }),
        hot: false,
    },
    [WORKER_NAMES.SCENARIO]: {
        factory: () =>
            new Worker(new URL('../workers/scenario.worker.ts', import.meta.url), {
                type: 'module',
            }),
        hot: false,
    },
    [WORKER_NAMES.CALCULATION]: {
        factory: () =>
            new Worker(new URL('../workers/calculation.worker.ts', import.meta.url), {
                type: 'module',
            }),
        hot: false,
    },
    [WORKER_NAMES.SIMULATION]: {
        factory: () =>
            new Worker(new URL('../simulation.worker.ts', import.meta.url), {
                type: 'module',
            }),
        hot: false,
    },
    [WORKER_NAMES.TERPENE]: {
        factory: () =>
            new Worker(new URL('../workers/terpene.worker.ts', import.meta.url), {
                type: 'module',
            }),
        hot: false,
    },
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register all known worker factories with the pool.
 * Called once at app bootstrap (index.tsx) before any dispatches.
 */
export function registerAllWorkerFactories(): void {
    for (const [name, entry] of Object.entries(FACTORIES)) {
        workerPool.registerFactory(name, entry)
    }
}

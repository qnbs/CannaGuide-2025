/**
 * Device capability detection for adaptive WorkerBus concurrency (W-01.1).
 *
 * Determines optimal worker concurrency limits based on hardware capabilities
 * and battery status. Used by WorkerBus.register() to auto-configure
 * per-worker concurrency limits instead of using a static default.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum concurrency limit regardless of device capabilities. */
export const MIN_CONCURRENCY = 2

/** Maximum concurrency limit cap (even on high-end hardware). */
export const MAX_CONCURRENCY = 12

/** Fraction of logical CPUs to use for worker concurrency (60%). */
const CPU_UTILIZATION_FACTOR = 0.6

/** Battery level threshold below which concurrency is halved. */
const LOW_BATTERY_THRESHOLD = 0.2

/** Fallback core count when navigator.hardwareConcurrency is unavailable. */
const FALLBACK_CORES = 4

/** Minimum pool size regardless of device capabilities. */
const MIN_POOL_SIZE = 4

/** Maximum pool size cap (even on high-end hardware). */
const MAX_POOL_SIZE = 16

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the optimal per-worker concurrency limit based on
 * `navigator.hardwareConcurrency`.
 *
 * Formula: `Math.max(MIN_CONCURRENCY, Math.floor(cores * 0.6))`
 * Clamped to [MIN_CONCURRENCY, MAX_CONCURRENCY].
 *
 * This is a pure, synchronous function -- no side effects.
 */
export function getDeviceConcurrencyLimit(): number {
    const cores =
        typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
            ? navigator.hardwareConcurrency
            : FALLBACK_CORES

    const limit = Math.floor(cores * CPU_UTILIZATION_FACTOR)
    return Math.max(MIN_CONCURRENCY, Math.min(MAX_CONCURRENCY, limit))
}

/**
 * Async version that also factors in battery level.
 * When battery level is below 20%, the concurrency limit is halved
 * (but never below MIN_CONCURRENCY).
 *
 * Falls back to the synchronous version if the Battery API is unavailable.
 */
export async function getAdaptiveConcurrencyLimit(): Promise<number> {
    let limit = getDeviceConcurrencyLimit()

    try {
        if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
            /* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
            const nav = navigator as unknown as {
                getBattery: () => Promise<{ level: number; charging: boolean }>
            }
            /* eslint-enable @typescript-eslint/no-unsafe-type-assertion */
            const battery = await nav.getBattery()
            if (!battery.charging && battery.level < LOW_BATTERY_THRESHOLD) {
                limit = Math.max(MIN_CONCURRENCY, Math.floor(limit / 2))
            }
        }
    } catch {
        // Battery API unavailable or permission denied -- use base limit
    }

    return limit
}

/**
 * Maximum number of Worker instances the pool may keep alive.
 *
 * Based on `navigator.hardwareConcurrency` clamped to [MIN_POOL_SIZE, MAX_POOL_SIZE].
 * Synchronous -- no side effects.
 */
export function getMaxPoolSize(): number {
    const cores =
        typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
            ? navigator.hardwareConcurrency
            : FALLBACK_CORES

    return Math.max(MIN_POOL_SIZE, Math.min(MAX_POOL_SIZE, cores))
}

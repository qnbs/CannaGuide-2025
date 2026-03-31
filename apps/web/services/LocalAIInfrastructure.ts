/**
 * Local AI Infrastructure -- Unified orchestration class for cache,
 * telemetry, and preload subsystems.
 *
 * Replaces the barrel re-export in localAiInfrastructureService.ts with a
 * real class that owns cross-cutting concerns (e.g. recording a cache hit
 * in both cache and telemetry atomically).
 *
 * Individual sub-services remain separate files for testability.
 * This class is the **only** public entry point for infrastructure concerns.
 */

import {
    getCachedInference,
    setCachedInference,
    clearPersistentCache,
    getCacheSize,
    getCacheBreakdown,
    applyCacheSettings,
    resetCacheDb,
} from './localAiCacheService'

import {
    createInferenceTimer,
    recordInference,
    measureInference,
    recordCacheHit,
    recordCacheMiss,
    getSnapshot,
    persistSnapshot,
    debouncedPersistSnapshot,
    loadPersistedSnapshot,
    checkPerformanceDegradation,
    resetTelemetry,
} from './localAiTelemetryService'

import type {
    InferenceRecord,
    TelemetrySnapshot,
    PerformanceAlert,
} from './localAiTelemetryService'

import { localAiPreloadService, ensurePersistentStorage } from './localAiPreloadService'

import type { LocalAiPreloadState, LocalAiPreloadStatus } from './localAiPreloadService'

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

class LocalAIInfrastructure {
    // -- Preload ----------------------------------------------------------

    readonly preload = localAiPreloadService
    readonly ensurePersistentStorage = ensurePersistentStorage

    // -- Cache ------------------------------------------------------------

    readonly getCachedInference = getCachedInference
    readonly setCachedInference = setCachedInference
    readonly clearPersistentCache = clearPersistentCache
    readonly getCacheSize = getCacheSize
    readonly getCacheBreakdown = getCacheBreakdown
    readonly applyCacheSettings = applyCacheSettings
    readonly resetCacheDb = resetCacheDb

    // -- Telemetry --------------------------------------------------------

    readonly createInferenceTimer = createInferenceTimer
    readonly recordInference = recordInference
    readonly measureInference = measureInference
    readonly recordCacheHit = recordCacheHit
    readonly recordCacheMiss = recordCacheMiss
    readonly getSnapshot = getSnapshot
    readonly persistSnapshot = persistSnapshot
    readonly debouncedPersistSnapshot = debouncedPersistSnapshot
    readonly loadPersistedSnapshot = loadPersistedSnapshot
    readonly checkPerformanceDegradation = checkPerformanceDegradation
    readonly resetTelemetry = resetTelemetry

    // -- Cross-cutting ----------------------------------------------------

    /**
     * Look up the cache first; if hit, record a cache hit in telemetry.
     * If miss, record a cache miss. Returns the cached value or null.
     */
    async getCachedWithTelemetry(prompt: string): Promise<string | null> {
        const cached = await getCachedInference(prompt)
        if (cached !== null) {
            recordCacheHit()
        } else {
            recordCacheMiss()
        }
        return cached
    }

    /**
     * Store inference result + persist telemetry snapshot (debounced).
     */
    async cacheAndTrack(
        prompt: string,
        value: string,
        meta: { model: string; task: string },
    ): Promise<void> {
        await setCachedInference(prompt, value, meta)
        debouncedPersistSnapshot()
    }

    /**
     * Full reset for testing or recovery.
     */
    async resetAll(): Promise<void> {
        resetTelemetry()
        await clearPersistentCache()
        resetCacheDb()
    }
}

// Singleton
export const localAIInfrastructure = new LocalAIInfrastructure()

// ---------------------------------------------------------------------------
// Re-export types for convenience
// ---------------------------------------------------------------------------

export type {
    InferenceRecord,
    TelemetrySnapshot,
    PerformanceAlert,
    LocalAiPreloadState,
    LocalAiPreloadStatus,
}

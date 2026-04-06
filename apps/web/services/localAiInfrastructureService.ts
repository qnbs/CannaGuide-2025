/**
 * Local AI Infrastructure Service -- backward-compatible barrel.
 *
 * All real logic now lives in LocalAIInfrastructure.ts (class) and sub-
 * service files. This module re-exports everything so existing import
 * paths keep working.
 *
 * New consumers should import from './LocalAIInfrastructure' directly.
 */

export { localAIInfrastructure } from './LocalAIInfrastructure'

// -- Cache ---------------------------------------------------------------
export {
    getCachedInference,
    setCachedInference,
    clearPersistentCache,
    getCacheSize,
    getCacheBreakdown,
    applyCacheSettings,
    resetCacheDb,
} from './localAiCacheService'

// -- Telemetry -----------------------------------------------------------
export {
    createInferenceTimer,
    recordInference,
    measureInference,
    recordCacheHit,
    recordCacheMiss,
    recordFallbackEvent,
    getFallbackBreakdown,
    getSnapshot,
    persistSnapshot,
    debouncedPersistSnapshot,
    loadPersistedSnapshot,
    checkPerformanceDegradation,
    resetTelemetry,
} from './localAiTelemetryService'

export type {
    InferenceRecord,
    TelemetrySnapshot,
    PerformanceAlert,
    FallbackLayer,
} from './localAiTelemetryService'

// -- Preload -------------------------------------------------------------
export { localAiPreloadService, ensurePersistentStorage } from './localAiPreloadService'

export type { LocalAiPreloadState, LocalAiPreloadStatus } from './localAiPreloadService'

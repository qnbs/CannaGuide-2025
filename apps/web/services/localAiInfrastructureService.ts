/**
 * Local AI Infrastructure Service -- Facade
 *
 * Consolidates cache, telemetry, and preload services into a single import
 * point. Internal sub-services remain separate files for maintainability
 * but consumers should prefer importing from this barrel module.
 */

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
} from './localAiTelemetryService'

// -- Preload -------------------------------------------------------------
export { localAiPreloadService, ensurePersistentStorage } from './localAiPreloadService'

export type { LocalAiPreloadState, LocalAiPreloadStatus } from './localAiPreloadService'

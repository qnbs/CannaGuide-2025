/**
 * Local AI Stack -- Public Barrel
 *
 * Canonical import point for all Local AI capabilities.
 * External consumers should import from this file or from `aiFacade.ts`.
 *
 * @example
 * ```ts
 * import { localAiService, localAIInfrastructure } from '@/services/local-ai'
 * ```
 *
 * @module local-ai
 */

// ---------------------------------------------------------------------------
// Core (Facade + Infrastructure + Router)
// ---------------------------------------------------------------------------
export { localAiService, createLocalAiService, clearInferenceCache } from './core/localAI'
export type { LocalAiPreloadReport } from './models/preloadOrchestrator'
export { localAIInfrastructure } from './core/LocalAIInfrastructure'
export type {
    InferenceRecord,
    TelemetrySnapshot,
    PerformanceAlert,
    LocalAiPreloadState,
    LocalAiPreloadStatus,
} from './core/LocalAIInfrastructure'

// Also re-export infrastructure barrel for backward compat
export {
    createInferenceTimer,
    recordInference,
    measureInference,
    recordCacheHit,
    recordCacheMiss,
    getSnapshot,
    getCachedInference,
    setCachedInference,
    clearPersistentCache,
    getCacheSize,
    getCacheBreakdown,
    applyCacheSettings,
    localAiPreloadService,
    ensurePersistentStorage,
} from './core/infrastructureService'

// ---------------------------------------------------------------------------
// Inference Router
// ---------------------------------------------------------------------------
export { routeInference, getCached, setCached } from './core/inferenceRouter'
export type { InferenceRouterDeps } from './core/inferenceRouter'

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------
export { LocalAiModelManager } from './models/modelManager'
export {
    loadTransformersPipeline,
    clearPipelineCache,
    detectOnnxBackend,
    resolveModelProfile,
    getResolvedProfile,
    setForceWasm,
    setVramInsufficientOverride,
    setPreferredModelOverride,
    evictIdlePipelines,
} from './models/modelLoader'
export type { LocalAiPipeline, OnnxBackend, ModelProfile } from './models/modelLoader'

export {
    loadWebLlmEngine,
    generateWithWebLlm,
    disposeWebLlm,
    getWebLlmModelId,
    cancelWebLlmDownload,
    isWebLlmDownloading,
} from './models/webLlmService'
export type { LocalWebLlmEngine, WebLlmDeps } from './models/webLlmService'

export {
    getAllModels,
    getModelById,
    autoSelectModel,
    MODEL_CATALOG_VERSION,
} from './models/webLlmModelCatalog'
export type { WebLlmModel } from './models/webLlmModelCatalog'

export { preloadOfflineAssets } from './models/preloadOrchestrator'
export { diagnoseWebLlm, getDiagnosticI18nKey } from './models/webLlmDiagnosticsService'

// ---------------------------------------------------------------------------
// Inference Pipeline
// ---------------------------------------------------------------------------
export {
    enqueueInference,
    isWorkerAvailable,
    getQueueSize,
    getActiveCount,
    terminateInferenceWorker,
} from './inference/inferenceQueue'
export type { InferenceTask, InferencePriority } from './inference/inferenceQueue'

export { streamTextGeneration } from './inference/streamingService'
export type { StreamingDeps } from './inference/streamingService'

export {
    handleEquipmentRecommendation,
    handleNutrientRecommendation,
    handleMentorResponse,
    handlePlantAdvice,
    handleGardenStatusSummary,
    handleStrainTips,
    handleGrowLogRagAnswer,
    handleDeepDive,
    handleStrainImageGeneration,
} from './inference/promptHandlers'

// ---------------------------------------------------------------------------
// Vision
// ---------------------------------------------------------------------------
export {
    classifyPlantImage,
    buildDiagnosisContent,
    fallbackDiagnosis,
    enrichWithKnowledge,
    classifySeverity,
    classifyLeafImage,
    VISION_MODEL_ID,
    ZERO_SHOT_LABELS,
    mapIssueLabel,
} from './vision/diagnosisService'

export {
    compareImages,
    analyzeGrowthProgression,
    preloadImageSimilarityModel,
    extractImageFeatures,
    findSimilarImages,
} from './vision/imageSimilarityService'
export type {
    ImageFeatureVector,
    SimilarityResult,
    GrowthProgressionResult,
} from './vision/imageSimilarityService'

export {
    ensureWorkerRegistered,
    getModelStatus,
    isModelCached,
    downloadModel,
    plantDiseaseModelService,
} from './vision/plantDiseaseModelService'

// ---------------------------------------------------------------------------
// NLP
// ---------------------------------------------------------------------------
export {
    analyzeSentiment,
    summarizeText,
    classifyGrowTopic,
    analyzeJournalSentimentTrend,
    preloadNlpModels,
    resetNlpPipelines,
} from './nlp/nlpService'
export type {
    SentimentResult,
    SummarizationResult,
    TextClassificationResult,
} from './nlp/nlpService'

export {
    embedText,
    embedBatch,
    semanticRank,
    cosineSimilarity,
    isEmbeddingModelReady,
    preloadEmbeddingModel,
    EMBEDDING_DIM,
} from './nlp/embeddingService'

export {
    detectLanguage,
    detectLanguageHeuristic,
    preloadLanguageDetectionModel,
} from './nlp/languageDetection'
export type { DetectedLanguage, LanguageDetectionResult } from './nlp/languageDetection'

export {
    getOrComputeEmbedding,
    getCachedEmbedding,
    precomputeEmbeddings,
    startBackgroundPrecomputation,
    isPrecomputationComplete,
    isSemanticRankingAvailable,
    getStats,
    clearEmbeddingCache,
} from './nlp/ragEmbeddingCacheService'

// ---------------------------------------------------------------------------
// Device
// ---------------------------------------------------------------------------
export {
    acquireGpu,
    releaseGpu,
    getGpuLockState,
    isGpuHeldBy,
    setEvictWebLlmHook,
    setRehydrateWebLlmHook,
} from './device/gpuResourceManager'
export type { GpuConsumer, GpuPriority, GpuLockState } from './device/gpuResourceManager'

export {
    probeWebGpu,
    isWebGpuUsable,
    getGpuTier,
    getSharedDevice,
    destroySharedDevice,
} from './device/webGpuService'
export type { GpuTier, WebGpuCapabilities, WebGpuFeatures } from './device/webGpuService'

export {
    generateHealthReport,
    quickHealthCheck,
    classifyDevice,
    probeGpuVram,
    isVramInsufficient,
    getMemoryInfo,
    getCachedVramInfo,
    getStorageInfo,
    getModelRecommendation,
} from './device/healthService'
export type {
    DeviceClass,
    HealthReport,
    VramInfo,
    MemoryInfo,
    StorageInfo,
    ModelRecommendation,
} from './device/healthService'

export {
    isEcoMode,
    setEcoModeExplicit,
    registerModeAccessors,
    detectEcoCondition,
    applyAdaptiveMode,
} from './device/ecoModeService'

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------
export { resetCacheDb } from './cache/cacheService'

export {
    getWebLlmLoadingSnapshot,
    subscribeWebLlmLoading,
    reportWebLlmProgress,
    reportWebLlmReady,
    reportWebLlmError,
    resetWebLlmLoadingState,
} from './cache/progressEmitter'
export type { WebLlmLoadProgress, WebLlmLoadingState } from './cache/progressEmitter'

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------
export {
    recordFallbackEvent,
    getFallbackBreakdown,
    persistSnapshot,
    debouncedPersistSnapshot,
    loadPersistedSnapshot,
    checkPerformanceDegradation,
    resetTelemetry,
} from './telemetry/telemetryService'
export type { FallbackLayer } from './telemetry/telemetryService'

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------
export { localAiFallbackService, diagnosePlant } from './fallback/fallbackService'
export type { PlantDiagnostic } from './fallback/fallbackService'
export { buildEquipmentRecommendation } from './fallback/equipmentFallback'
export { buildNutrientRecommendation } from './fallback/nutrientFallback'
export { buildStrainImage } from './fallback/strainImageFallback'
export { localizeStr } from './fallback/localeHelpers'

// ---------------------------------------------------------------------------
// Interfaces (for DI / testing)
// ---------------------------------------------------------------------------
export type * from './interfaces'

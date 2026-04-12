/**
 * Local AI Stack -- Public Interface Contracts
 *
 * This file defines the canonical interfaces for all Local AI subsystems.
 * Consumers outside local-ai/ should depend on these interfaces rather than
 * concrete implementations to enable testability and future refactoring.
 *
 * @module local-ai/interfaces
 */

import type { AIResponse, PlantDiagnosisResponse, StructuredGrowTips } from '@cannaguide/ai-core'
import type { Language, Plant, Strain } from '@/types'
import type { ImageStyle } from '@/types/aiProvider'

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

/** Persistent inference cache backed by IndexedDB LRU. */
export interface ICacheService {
    getCachedInference(prompt: string): Promise<string | null>
    setCachedInference(prompt: string, value: string, meta?: { model?: string }): Promise<void>
    clearPersistentCache(): Promise<void>
    getCacheSize(): Promise<number>
    getCacheBreakdown(): Promise<Record<string, number>>
    applyCacheSettings(maxEntries: number): void
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

export type FallbackLayer = 'cache' | 'webllm' | 'transformers' | 'heuristic' | 'cloud'

export interface IInferenceRecord {
    model: string
    task: string
    latencyMs: number
    tokensPerSecond: number | null
    backend: string
    success: boolean
    cached: boolean
    fallbackLayer?: FallbackLayer | undefined
}

export interface ITelemetrySnapshot {
    totalInferences: number
    avgLatencyMs: number
    cacheHitRate: number
    modelBreakdown: Record<string, number>
    backendBreakdown: Record<string, number>
}

export interface ITelemetryService {
    recordInference(record: IInferenceRecord): void
    recordCacheHit(): void
    recordCacheMiss(): void
    recordFallbackEvent(layer: FallbackLayer, reason?: string): void
    getSnapshot(): ITelemetrySnapshot
    checkPerformanceDegradation(): { degraded: boolean; recommendation?: string }
    createInferenceTimer(): { stop(meta: Partial<IInferenceRecord>): IInferenceRecord }
}

// ---------------------------------------------------------------------------
// GPU Resource Manager
// ---------------------------------------------------------------------------

export type GpuConsumer = string
export type GpuPriority = 'high' | 'normal' | 'low'

export interface IGpuLockState {
    holder: string | null
    waiting: number
    autoReleaseActive: boolean
}

export interface IGpuResourceManager {
    acquireGpu(consumer: GpuConsumer, priority?: GpuPriority): Promise<void>
    releaseGpu(consumer: GpuConsumer): void
    getGpuLockState(): IGpuLockState
    getQueueState(): { current: string | null; queue: string[] }
    isGpuHeldBy(consumer: GpuConsumer): boolean
}

// ---------------------------------------------------------------------------
// Health Service
// ---------------------------------------------------------------------------

export type DeviceClass = 'high-end' | 'mid-range' | 'low-end' | 'unknown'

export interface IVramInfo {
    vramMB: number | null
    probed: boolean
    adapterDescription: string | null
}

export interface IHealthReport {
    deviceClass: DeviceClass
    memory: { usedHeapMB: number; heapLimitMB: number; usagePercent: number }
    storage: { usageMB: number; quotaMB: number; usagePercent: number }
    vram: IVramInfo
}

export interface IHealthService {
    generateHealthReport(): Promise<IHealthReport>
    quickHealthCheck(): { status: string; memoryPressure: boolean; modelsReady: boolean }
    classifyDevice(): DeviceClass
    probeGpuVram(): Promise<IVramInfo>
    isVramInsufficient(): boolean
    shouldForceHeuristics(): boolean
}

// ---------------------------------------------------------------------------
// Model Loader
// ---------------------------------------------------------------------------

export type OnnxBackend = 'webgpu' | 'wasm'

export interface IModelLoader {
    loadTransformersPipeline(task: string, modelId: string): Promise<unknown>
    detectOnnxBackend(): OnnxBackend
    clearPipelineCache(): void
    getLoadedPipelineCount(): number
}

// ---------------------------------------------------------------------------
// Model Manager
// ---------------------------------------------------------------------------

export interface IModelManager {
    loadTextPipeline(): Promise<unknown>
    loadVisionPipeline(): Promise<unknown>
    dispose(): void
    switchModel(modelId: string): Promise<void>
}

// ---------------------------------------------------------------------------
// WebLLM Service
// ---------------------------------------------------------------------------

export interface IWebLlmService {
    loadWebLlmEngine(): Promise<unknown | null>
    generateWithWebLlm(prompt: string, attempt?: number): Promise<string | null>
    disposeWebLlm(): void
    getWebLlmModelId(): string | null
    cancelWebLlmDownload(): void
    isWebLlmDownloading(): boolean
}

// ---------------------------------------------------------------------------
// Inference Router
// ---------------------------------------------------------------------------

export interface IInferenceRouter {
    routeInference(prompt: string, deps: unknown): Promise<string | null>
    getCached(prompt: string): string | null
    setCached(prompt: string, value: string): void
    clearInferenceCache(): void
}

// ---------------------------------------------------------------------------
// Preload Orchestrator
// ---------------------------------------------------------------------------

export interface IPreloadReport {
    textModelReady: boolean
    visionModelReady: boolean
    embeddingReady: boolean
    nlpReady: boolean
    webLlmReady: boolean
    errorCount: number
}

export interface IPreloadOrchestrator {
    preloadOfflineAssets(
        modelManager: IModelManager,
        includeWebLlm: boolean,
        onProgress?: (step: string, pct: number) => void,
        ecoOnly?: boolean,
    ): Promise<IPreloadReport>
}

// ---------------------------------------------------------------------------
// Fallback Service
// ---------------------------------------------------------------------------

export interface IFallbackService {
    diagnosePlant(plant: Plant, lang: Language): PlantDiagnosisResponse
    getMentorResponse(
        plant: Plant | undefined,
        query: string,
        ragContext: string | undefined,
        lang: Language,
    ): AIResponse
    getPlantAdvice(plant: Plant, lang: Language): AIResponse
    getGardenStatusSummary(plants: readonly Plant[], lang: Language): AIResponse
    getStrainTips(strain: Strain, lang: Language): StructuredGrowTips
    getEquipmentRecommendation(prompt: string, lang: Language): unknown
    getNutrientRecommendation(context: unknown, lang: Language): string
}

// ---------------------------------------------------------------------------
// NLP Services
// ---------------------------------------------------------------------------

export interface ISentimentResult {
    label: 'POSITIVE' | 'NEGATIVE'
    score: number
    normalized: number
}

export interface INlpService {
    analyzeSentiment(text: string): Promise<ISentimentResult>
    summarizeText(text: string, maxLength?: number): Promise<{ summary: string }>
    classifyGrowTopic(text: string): Promise<{ topLabel: string; topScore: number }>
}

// ---------------------------------------------------------------------------
// Embedding Service
// ---------------------------------------------------------------------------

export interface IEmbeddingService {
    embedText(text: string): Promise<Float32Array>
    cosineSimilarity(a: Float32Array, b: Float32Array): number
    isEmbeddingModelReady(): boolean
    preloadEmbeddingModel(): Promise<boolean>
}

// ---------------------------------------------------------------------------
// Language Detection
// ---------------------------------------------------------------------------

export type DetectedLanguage = 'en' | 'de' | 'unknown'

export interface ILanguageDetectionResult {
    language: DetectedLanguage
    confidence: number
    method: 'model' | 'heuristic'
}

export interface ILanguageDetectionService {
    detectLanguage(text: string): Promise<ILanguageDetectionResult>
    detectLanguageHeuristic(text: string): ILanguageDetectionResult
}

// ---------------------------------------------------------------------------
// Vision / Diagnosis
// ---------------------------------------------------------------------------

export interface IDiagnosisService {
    classifyPlantImage(
        base64: string,
        mimeType: string,
        loadVisionPipeline: () => Promise<unknown>,
        timeoutMs?: number,
    ): Promise<Array<{ label: string; score: number }>>
    buildDiagnosisContent(plant: Plant, lang: Language, labels: unknown): PlantDiagnosisResponse
    fallbackDiagnosis(plant: Plant, lang: Language): PlantDiagnosisResponse
    classifyLeafImage(imageData: ImageData): Promise<unknown>
}

// ---------------------------------------------------------------------------
// Image Similarity
// ---------------------------------------------------------------------------

export interface IImageSimilarityService {
    compareImages(imageA: string, imageB: string): Promise<number>
    analyzeGrowthProgression(
        photos: readonly string[],
    ): Promise<{ averageChange: number; trend: string }>
    preloadImageSimilarityModel(): Promise<boolean>
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

export interface IStreamingService {
    streamTextGeneration(
        prompt: string,
        onToken: (token: string) => void,
        deps: unknown,
    ): Promise<string | null>
}

// ---------------------------------------------------------------------------
// Eco Mode
// ---------------------------------------------------------------------------

export interface IEcoModeService {
    isEcoMode(): boolean
    isCriticalBattery(): boolean
    setEcoModeExplicit(active: boolean): void
    detectEcoCondition(): Promise<boolean>
    detectCriticalBattery(): Promise<boolean>
    applyAdaptiveMode(): Promise<void>
}

// ---------------------------------------------------------------------------
// Image Generation (Style type re-export for consumers)
// ---------------------------------------------------------------------------
export type { ImageStyle }

// ---------------------------------------------------------------------------
// Whisper STT (V-06 Offline Voice)
// ---------------------------------------------------------------------------

export interface IWhisperService {
    transcribe(
        audioData: Float32Array,
        language?: string,
    ): Promise<{
        text: string
        language: string
        latencyMs: number
        coldStart: boolean
    }>
    getStatus(): { ready: boolean; loading: boolean; available: boolean }
    dispose(): Promise<void>
    isAvailable(): boolean
}

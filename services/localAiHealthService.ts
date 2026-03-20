import {
    detectOnnxBackend,
    resolveModelProfile,
    invalidateModelProfile,
    evictIdlePipelines,
    type OnnxBackend,
    type QuantizationLevel,
    type ModelSizeTier,
} from './localAIModelLoader'
import { localAiPreloadService, type LocalAiPreloadStatus } from './localAiPreloadService'
import {
    getSnapshot,
    type TelemetrySnapshot,
    loadPersistedSnapshot,
} from './localAiTelemetryService'
import { getCacheSize } from './localAiCacheService'

/**
 * Local AI Health Service — monitors the health, performance, and resource
 * usage of the on-device ML stack. Provides diagnostics and adaptive
 * model selection based on device capabilities.
 *
 * Capabilities:
 * • Real-time health dashboard data
 * • Memory pressure detection (via Performance API)
 * • Adaptive model recommendation based on device class
 * • Comprehensive diagnostic report generation
 * • Storage quota monitoring
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type DeviceClass = 'high-end' | 'mid-range' | 'low-end' | 'unknown'
export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown'

export interface VramInfo {
    /** Detected VRAM in MB via WebGPU adapter (null if unavailable). */
    vramMB: number | null
    /** Whether the device was probed successfully. */
    probed: boolean
    /** GPU adapter description (if available). */
    adapterDescription: string | null
}

export interface MemoryInfo {
    /** Estimated JS heap size in MB (if available). */
    usedHeapMB: number | null
    /** Heap limit in MB (if available). */
    heapLimitMB: number | null
    /** Usage percentage (0-100). */
    usagePercent: number | null
    /** Whether memory pressure is detected. */
    pressureDetected: boolean
}

export interface StorageInfo {
    /** Estimated storage usage in MB. */
    usageMB: number | null
    /** Storage quota in MB. */
    quotaMB: number | null
    /** Usage percentage (0-100). */
    usagePercent: number | null
    /** Whether persistent storage is granted. */
    persistentGranted: boolean | null
}

export interface ModelRecommendation {
    /** Recommended text model based on device capabilities. */
    textModel: 'qwen2.5' | 'qwen3' | 'auto'
    /** Whether WebLLM should be enabled. */
    enableWebLlm: boolean
    /** Recommended ONNX backend. */
    preferredBackend: OnnxBackend
    /** Reason for the recommendation. */
    reason: string
    /** Active quantization level from progressive quantization. */
    quantLevel: QuantizationLevel
    /** Active model size tier from progressive quantization. */
    sizeTier: ModelSizeTier
    /** Estimated download + inference savings percentage. */
    estimatedSavingsPercent: number
}

export interface HealthReport {
    /** Overall health status. */
    status: HealthStatus
    /** Device classification for adaptive model selection. */
    deviceClass: DeviceClass
    /** Current preload status. */
    preloadStatus: LocalAiPreloadStatus
    /** Memory diagnostics. */
    memory: MemoryInfo
    /** GPU VRAM diagnostics. */
    vram: VramInfo
    /** Storage diagnostics. */
    storage: StorageInfo
    /** Performance snapshot (current session). */
    telemetry: TelemetrySnapshot | null
    /** Persisted performance snapshot (last session). */
    persistedTelemetry: TelemetrySnapshot | null
    /** ONNX backend in use. */
    onnxBackend: OnnxBackend
    /** WebGPU availability. */
    webGpuAvailable: boolean
    /** Number of cached inference results. */
    cacheEntries: number
    /** Model selection recommendation. */
    recommendation: ModelRecommendation
    /** Timestamp of the report. */
    generatedAt: number
    /** Detected issues/warnings. */
    warnings: string[]
}

// ─── Memory Detection ────────────────────────────────────────────────────────

/**
 * Get current JS heap memory information.
 * Only available in Chromium browsers with `performance.memory`.
 */
export const getMemoryInfo = (): MemoryInfo => {
    const perf = performance as unknown as {
        memory?: {
            usedJSHeapSize: number
            jsHeapSizeLimit: number
        }
    }

    if (perf.memory) {
        const usedMB = perf.memory.usedJSHeapSize / (1024 * 1024)
        const limitMB = perf.memory.jsHeapSizeLimit / (1024 * 1024)
        const percent = limitMB > 0 ? (usedMB / limitMB) * 100 : null
        return {
            usedHeapMB: Math.round(usedMB * 10) / 10,
            heapLimitMB: Math.round(limitMB * 10) / 10,
            usagePercent: percent !== null ? Math.round(percent * 10) / 10 : null,
            pressureDetected: percent !== null && percent > 80,
        }
    }

    return {
        usedHeapMB: null,
        heapLimitMB: null,
        usagePercent: null,
        pressureDetected: false,
    }
}

// ─── GPU VRAM Detection ──────────────────────────────────────────────────────

let cachedVramInfo: VramInfo | null = null

/** Minimum VRAM in MB to allow WebGPU model loading. Below this → force WASM/quantized. */
const MIN_VRAM_FOR_WEBGPU_MB = 4096

/**
 * Probe actual GPU VRAM via WebGPU adapter.
 * Caches the result after the first successful probe.
 * Falls back gracefully if WebGPU is unavailable or adapter request fails.
 */
export const probeGpuVram = async (): Promise<VramInfo> => {
    if (cachedVramInfo) return cachedVramInfo

    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
        cachedVramInfo = { vramMB: null, probed: false, adapterDescription: null }
        return cachedVramInfo
    }

    try {
        const gpu = navigator.gpu as GPU
        const adapter = await Promise.race([
            gpu.requestAdapter(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ])

        if (!adapter) {
            cachedVramInfo = { vramMB: null, probed: true, adapterDescription: null }
            return cachedVramInfo
        }

        // maxBufferSize is a reliable proxy for usable VRAM
        const maxBufferBytes = (adapter.limits as GPUSupportedLimits).maxBufferSize ?? 0
        const vramMB = maxBufferBytes > 0 ? Math.round(maxBufferBytes / (1024 * 1024)) : null
        const adapterDescription =
            (adapter as unknown as { info?: { description?: string } }).info?.description ?? null

        cachedVramInfo = { vramMB, probed: true, adapterDescription }
        console.debug(
            `[LocalAI] GPU probe: VRAM ≈ ${vramMB ?? 'unknown'}MB, adapter: ${adapterDescription ?? 'unknown'}`,
        )
        return cachedVramInfo
    } catch {
        cachedVramInfo = { vramMB: null, probed: true, adapterDescription: null }
        return cachedVramInfo
    }
}

/** Synchronous access to the last probed VRAM info (null if not yet probed). */
export const getCachedVramInfo = (): VramInfo | null => cachedVramInfo

/** Returns true if VRAM is known and below the safe threshold for WebGPU models. */
export const isVramInsufficient = (): boolean => {
    if (!cachedVramInfo?.probed || cachedVramInfo.vramMB === null) return false
    return cachedVramInfo.vramMB < MIN_VRAM_FOR_WEBGPU_MB
}

/** Reset the cached VRAM info (useful for tests). */
export const resetVramCache = (): void => {
    cachedVramInfo = null
}

// ─── Storage Monitoring ──────────────────────────────────────────────────────

/**
 * Get current storage usage and quota information.
 */
export const getStorageInfo = async (): Promise<StorageInfo> => {
    if (typeof navigator === 'undefined' || !('storage' in navigator)) {
        return { usageMB: null, quotaMB: null, usagePercent: null, persistentGranted: null }
    }

    try {
        const estimate = await Promise.race([
            navigator.storage.estimate(),
            new Promise<{ usage?: number; quota?: number }>((_, reject) =>
                setTimeout(() => reject(new Error('storage estimate timeout')), 5000),
            ),
        ])
        const usageMB = estimate.usage ? estimate.usage / (1024 * 1024) : null
        const quotaMB = estimate.quota ? estimate.quota / (1024 * 1024) : null
        const usagePercent =
            usageMB !== null && quotaMB !== null && quotaMB > 0 ? (usageMB / quotaMB) * 100 : null

        let persistentGranted: boolean | null = null
        if (navigator.storage.persisted) {
            persistentGranted = await navigator.storage.persisted()
        }

        return {
            usageMB: usageMB !== null ? Math.round(usageMB * 10) / 10 : null,
            quotaMB: quotaMB !== null ? Math.round(quotaMB * 10) / 10 : null,
            usagePercent: usagePercent !== null ? Math.round(usagePercent * 10) / 10 : null,
            persistentGranted,
        }
    } catch {
        return { usageMB: null, quotaMB: null, usagePercent: null, persistentGranted: null }
    }
}

// ─── Device Classification ───────────────────────────────────────────────────

/**
 * Classify the device based on available capabilities and hardware hints.
 */
export const classifyDevice = (): DeviceClass => {
    if (typeof navigator === 'undefined') return 'unknown'

    const hasWebGpu = 'gpu' in navigator
    const coreCount = navigator.hardwareConcurrency ?? 0
    const memoryGB = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 0
    const vram = cachedVramInfo

    // Downgrade if VRAM is probed and insufficient (<4GB)
    if (vram?.probed && vram.vramMB !== null && vram.vramMB < MIN_VRAM_FOR_WEBGPU_MB) {
        return coreCount >= 4 ? 'mid-range' : 'low-end'
    }

    // High-end: WebGPU + 8+ cores + 8+ GB RAM
    if (hasWebGpu && coreCount >= 8 && memoryGB >= 8) return 'high-end'

    // Mid-range: WebGPU or 4+ cores
    if (hasWebGpu || coreCount >= 4) return 'mid-range'

    // Low-end: everything else
    if (coreCount > 0 || memoryGB > 0) return 'low-end'

    return 'unknown'
}

// ─── Adaptive Model Selection ────────────────────────────────────────────────

/**
 * Recommend model configuration based on device capabilities and current state.
 * Integrates the progressive quantization profile for VRAM-aware model selection.
 */
export const getModelRecommendation = (): ModelRecommendation => {
    const deviceClass = classifyDevice()
    const memory = getMemoryInfo()
    const backend = detectOnnxBackend()
    const vram = cachedVramInfo

    // Resolve the progressive quantization profile with VRAM data
    const profile = resolveModelProfile(vram?.vramMB ?? null)

    if (memory.pressureDetected) {
        // Under memory pressure, invalidate so next call re-evaluates
        invalidateModelProfile()
        // Proactively evict cached pipelines to free memory
        evictIdlePipelines(1)
        return {
            textModel: 'qwen3',
            enableWebLlm: false,
            preferredBackend: 'wasm',
            reason: 'Memory pressure detected — using lightweight model and WASM backend.',
            quantLevel: 'q4',
            sizeTier: '0.5B',
            estimatedSavingsPercent: 70,
        }
    }

    // Force WASM + quantized model when VRAM is insufficient for WebGPU
    if (vram?.probed && vram.vramMB !== null && vram.vramMB < MIN_VRAM_FOR_WEBGPU_MB) {
        return {
            textModel: 'qwen3',
            enableWebLlm: false,
            preferredBackend: 'wasm',
            reason: `Low VRAM detected (${vram.vramMB}MB < ${MIN_VRAM_FOR_WEBGPU_MB}MB) — forcing quantized model and WASM backend to prevent GPU crash.`,
            quantLevel: profile.quantLevel,
            sizeTier: profile.sizeTier,
            estimatedSavingsPercent: profile.estimatedSavingsPercent,
        }
    }

    switch (deviceClass) {
        case 'high-end':
            return {
                textModel: profile.sizeTier === '1.5B' ? 'qwen2.5' : 'qwen3',
                enableWebLlm: profile.webLlmModelId !== null,
                preferredBackend: backend,
                reason: `High-end device — ${profile.reason}`,
                quantLevel: profile.quantLevel,
                sizeTier: profile.sizeTier,
                estimatedSavingsPercent: profile.estimatedSavingsPercent,
            }
        case 'mid-range':
            return {
                textModel: profile.sizeTier === '1.5B' ? 'auto' : 'qwen3',
                enableWebLlm: profile.webLlmModelId !== null,
                preferredBackend: backend,
                reason: `Mid-range device — ${profile.reason}`,
                quantLevel: profile.quantLevel,
                sizeTier: profile.sizeTier,
                estimatedSavingsPercent: profile.estimatedSavingsPercent,
            }
        case 'low-end':
            return {
                textModel: 'qwen3',
                enableWebLlm: false,
                preferredBackend: 'wasm',
                reason: `Low-end device — ${profile.reason}`,
                quantLevel: profile.quantLevel,
                sizeTier: profile.sizeTier,
                estimatedSavingsPercent: profile.estimatedSavingsPercent,
            }
        default:
            return {
                textModel: 'auto',
                enableWebLlm: false,
                preferredBackend: backend,
                reason: `Device class unknown — ${profile.reason}`,
                quantLevel: profile.quantLevel,
                sizeTier: profile.sizeTier,
                estimatedSavingsPercent: profile.estimatedSavingsPercent,
            }
    }
}

// ─── Health Assessment ───────────────────────────────────────────────────────

/**
 * Assess the overall health of the local AI stack.
 */
const assessHealth = (
    preloadStatus: LocalAiPreloadStatus,
    memory: MemoryInfo,
    telemetry: TelemetrySnapshot | null,
): { status: HealthStatus; warnings: string[] } => {
    const warnings: string[] = []

    // Critical: preload error state
    if (preloadStatus.state === 'error') {
        warnings.push('Model preload failed — local AI may be unavailable.')
        return { status: 'critical', warnings }
    }

    // Check memory pressure
    if (memory.pressureDetected) {
        warnings.push(
            `High memory usage detected (${memory.usagePercent?.toFixed(1) ?? '?'}%). Consider closing other tabs.`,
        )
    }

    // Check telemetry success rate
    if (telemetry && telemetry.totalInferences > 5 && telemetry.successRate < 0.7) {
        warnings.push(
            `Low inference success rate (${(telemetry.successRate * 100).toFixed(0)}%). Model may be unstable.`,
        )
    }

    // Check if core models are missing
    if (preloadStatus.state !== 'idle') {
        if (!preloadStatus.textModelReady) {
            warnings.push('Text model not loaded — text generation will use heuristic fallback.')
        }
        if (!preloadStatus.visionModelReady) {
            warnings.push('Vision model not loaded — plant photo diagnosis will be limited.')
        }
    }

    // High latency warning
    if (telemetry && telemetry.averageLatencyMs > 30_000) {
        warnings.push(
            `High average inference latency (${(telemetry.averageLatencyMs / 1000).toFixed(1)}s). Consider switching to a lighter model.`,
        )
    }

    if (warnings.length === 0 && preloadStatus.state === 'ready') {
        return { status: 'healthy', warnings }
    }

    if (memory.pressureDetected || (telemetry && telemetry.successRate < 0.7)) {
        return { status: 'degraded', warnings }
    }

    if (preloadStatus.state === 'idle') {
        return { status: 'unknown', warnings }
    }

    return { status: warnings.length > 0 ? 'degraded' : 'healthy', warnings }
}

// ─── Full Report ─────────────────────────────────────────────────────────────

/**
 * Generate a comprehensive health report for the local AI stack.
 */
export const generateHealthReport = async (): Promise<HealthReport> => {
    const preloadStatus = localAiPreloadService.getStatus()
    const memory = getMemoryInfo()
    const vram = await probeGpuVram()

    // Ensure progressive quantization profile is resolved with fresh VRAM data
    invalidateModelProfile()
    resolveModelProfile(vram.vramMB ?? null)

    const storage = await getStorageInfo()
    const telemetry = getSnapshot()
    const persistedTelemetry = loadPersistedSnapshot()
    const onnxBackend = detectOnnxBackend()
    const webGpuAvailable = typeof navigator !== 'undefined' && 'gpu' in navigator
    const recommendation = getModelRecommendation()
    const deviceClass = classifyDevice()

    let cacheEntries = 0
    try {
        cacheEntries = await getCacheSize()
    } catch {
        // Ignore
    }

    const { status, warnings } = assessHealth(preloadStatus, memory, telemetry)

    // Add VRAM warning if insufficient
    if (vram.probed && vram.vramMB !== null && vram.vramMB < MIN_VRAM_FOR_WEBGPU_MB) {
        warnings.push(
            `Low GPU VRAM detected (${vram.vramMB}MB). WebGPU disabled — using WASM backend with quantized models.`,
        )
    }

    return {
        status,
        deviceClass,
        preloadStatus,
        memory,
        vram,
        storage,
        telemetry: telemetry.totalInferences > 0 ? telemetry : null,
        persistedTelemetry,
        onnxBackend,
        webGpuAvailable,
        cacheEntries,
        recommendation,
        generatedAt: Date.now(),
        warnings,
    }
}

/**
 * Quick health check — lightweight version for frequent polling.
 */
export const quickHealthCheck = (): {
    status: HealthStatus
    memoryPressure: boolean
    modelsReady: boolean
} => {
    const preloadStatus = localAiPreloadService.getStatus()
    const memory = getMemoryInfo()
    const modelsReady =
        preloadStatus.state === 'ready' ||
        (preloadStatus.state === 'partial' && preloadStatus.textModelReady)

    let status: HealthStatus = 'unknown'
    if (preloadStatus.state === 'error') status = 'critical'
    else if (memory.pressureDetected) status = 'degraded'
    else if (modelsReady) status = 'healthy'

    return {
        status,
        memoryPressure: memory.pressureDetected,
        modelsReady,
    }
}

import { detectOnnxBackend, type OnnxBackend } from './localAIModelLoader'
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
 */
export const getModelRecommendation = (): ModelRecommendation => {
    const deviceClass = classifyDevice()
    const memory = getMemoryInfo()
    const backend = detectOnnxBackend()

    if (memory.pressureDetected) {
        return {
            textModel: 'qwen3',
            enableWebLlm: false,
            preferredBackend: 'wasm',
            reason: 'Memory pressure detected — using lightweight model and WASM backend.',
        }
    }

    switch (deviceClass) {
        case 'high-end':
            return {
                textModel: 'qwen2.5',
                enableWebLlm: true,
                preferredBackend: backend,
                reason: 'High-end device detected — full model suite with WebLLM enabled.',
            }
        case 'mid-range':
            return {
                textModel: 'auto',
                enableWebLlm: backend === 'webgpu',
                preferredBackend: backend,
                reason: 'Mid-range device — auto model selection, WebLLM if WebGPU available.',
            }
        case 'low-end':
            return {
                textModel: 'qwen3',
                enableWebLlm: false,
                preferredBackend: 'wasm',
                reason: 'Low-end device — lightweight model recommended, WebLLM disabled.',
            }
        default:
            return {
                textModel: 'auto',
                enableWebLlm: false,
                preferredBackend: backend,
                reason: 'Device class unknown — using safe defaults.',
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

    return {
        status,
        deviceClass,
        preloadStatus,
        memory,
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

/**
 * Local AI Telemetry — tracks inference performance metrics in-memory
 * to power the Settings dashboard and help users understand local AI
 * health and speed.
 *
 * No data leaves the device. All metrics are volatile (lost on reload)
 * unless explicitly persisted via `persistSnapshot()`.
 */

import { getRegistryModelVersion } from '@cannaguide/ai-core'

const TELEMETRY_STORAGE_KEY = 'cg.localai.telemetry'
const MAX_HISTORY = 100

// ─── Types ───────────────────────────────────────────────────────────────────

export type FallbackLayer = 'cache' | 'webllm' | 'transformers' | 'heuristic' | 'cloud'

export interface InferenceRecord {
    model: string
    modelVersion?: string | undefined
    task: string
    latencyMs: number
    tokensGenerated: number
    tokensPerSecond: number
    backend: 'webgpu' | 'wasm' | 'webllm'
    cached: boolean
    timestamp: number
    success: boolean
    fallbackLayer?: FallbackLayer | undefined
    fallbackReason?: string | undefined
}

export interface TelemetrySnapshot {
    totalInferences: number
    totalTokensGenerated: number
    averageLatencyMs: number
    /** Latency percentiles (milliseconds). */
    latencyP50Ms: number
    latencyP95Ms: number
    latencyP99Ms: number
    fallbackBreakdown: Record<FallbackLayer, number>
    averageTokensPerSecond: number
    cacheHitRate: number
    modelBreakdown: Record<
        string,
        { count: number; avgLatencyMs: number; avgTokPerSec: number; version: string | undefined }
    >
    backendBreakdown: Record<string, number>
    successRate: number
    peakTokensPerSecond: number
    lastUpdated: number
}

const fallbackCounts: Record<FallbackLayer, number> = {
    cache: 0,
    webllm: 0,
    transformers: 0,
    heuristic: 0,
    cloud: 0,
}
// ─── State ───────────────────────────────────────────────────────────────────

const records: InferenceRecord[] = []
let totalCacheHits = 0
let totalCacheMisses = 0

// ─── Tracking ────────────────────────────────────────────────────────────────

/**
 * Record a completed inference for telemetry tracking.
 * Auto-resolves modelVersion from the registry if not explicitly provided.
 */
export const recordInference = (record: InferenceRecord): void => {
    if (!record.modelVersion) {
        record.modelVersion = getRegistryModelVersion(record.model)
    }
    records.push(record)
    if (records.length > MAX_HISTORY) {
        records.shift()
    }
    if (record.cached) {
        totalCacheHits++
    } else {
        totalCacheMisses++
    }
}

/**
 * Convenience wrapper to measure inference timing.
 * Returns the result and automatically records the telemetry.
 */
export const measureInference = async <T>(
    fn: () => Promise<T>,
    meta: {
        model: string
        task: string
        backend: InferenceRecord['backend']
        estimateTokens?: (result: T) => number
    },
): Promise<T> => {
    const start = performance.now()
    try {
        const result = await fn()
        const latencyMs = performance.now() - start
        const tokens = meta.estimateTokens?.(result) ?? estimateTokenCount(result)
        const tokPerSec = latencyMs > 0 ? (tokens / latencyMs) * 1000 : 0
        recordInference({
            model: meta.model,
            task: meta.task,
            latencyMs,
            tokensGenerated: tokens,
            tokensPerSecond: tokPerSec,
            backend: meta.backend,
            cached: false,
            timestamp: Date.now(),
            success: true,
        })
        return result
    } catch (error) {
        const latencyMs = performance.now() - start
        recordInference({
            model: meta.model,
            task: meta.task,
            latencyMs,
            tokensGenerated: 0,
            tokensPerSecond: 0,
            backend: meta.backend,
            cached: false,
            timestamp: Date.now(),
            success: false,
        })
        throw error
    }
}

/** Record a cache hit (no inference needed). */
export const recordCacheHit = (): void => {
    totalCacheHits++
}

/** Record a cache miss (inference dispatched). */
export const recordCacheMiss = (): void => {
    totalCacheMisses++
}

// ─── Fallback Tracking ───────────────────────────────────────────────────────

/**
 * Record which fallback layer handled an inference and why.
 * Called at each transition point in the inference router.
 */
export const recordFallbackEvent = (layer: FallbackLayer, reason?: string | undefined): void => {
    fallbackCounts[layer]++
    if (records.length > 0) {
        const last = records[records.length - 1]
        if (last) {
            last.fallbackLayer = layer
            if (reason) last.fallbackReason = reason
        }
    }
}

/**
 * Get a breakdown of how often each fallback layer was used.
 */
export const getFallbackBreakdown = (): Record<FallbackLayer, number> => ({
    ...fallbackCounts,
})

// ─── Snapshot ────────────────────────────────────────────────────────────────

/** Rough token estimation from string output (~4 chars per token). */
const estimateTokenCount = (value: unknown): number => {
    if (typeof value === 'string') return Math.ceil(value.length / 4)
    if (typeof value === 'object' && value !== null) {
        try {
            return Math.ceil(JSON.stringify(value).length / 4)
        } catch {
            // Circular references or other serialization failures
            return 0
        }
    }
    return 0
}

/** Compute the p-th percentile from a sorted array. Returns 0 for empty arrays. */
const percentile = (sorted: number[], p: number): number => {
    if (sorted.length === 0) return 0
    const idx = (p / 100) * (sorted.length - 1)
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    if (lo === hi) return sorted[lo]!
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo)
}

/**
 * Build a telemetry snapshot from the in-memory records.
 */
export const getSnapshot = (): TelemetrySnapshot => {
    const successful = records.filter((r) => r.success)
    const totalInferences = records.length
    const totalTokensGenerated = successful.reduce((s, r) => s + r.tokensGenerated, 0)
    const averageLatencyMs =
        successful.length > 0
            ? successful.reduce((s, r) => s + r.latencyMs, 0) / successful.length
            : 0
    const averageTokensPerSecond =
        successful.length > 0
            ? successful.reduce((s, r) => s + r.tokensPerSecond, 0) / successful.length
            : 0
    const cacheTotal = totalCacheHits + totalCacheMisses
    const cacheHitRate = cacheTotal > 0 ? totalCacheHits / cacheTotal : 0
    const peakTokensPerSecond = successful.reduce((max, r) => Math.max(max, r.tokensPerSecond), 0)

    // Latency percentiles
    const sortedLatencies = successful.map((r) => r.latencyMs).sort((a, b) => a - b)
    const latencyP50Ms = percentile(sortedLatencies, 50)
    const latencyP95Ms = percentile(sortedLatencies, 95)
    const latencyP99Ms = percentile(sortedLatencies, 99)

    const modelBreakdown: TelemetrySnapshot['modelBreakdown'] = {}
    for (const r of successful) {
        const entry = modelBreakdown[r.model] ?? {
            count: 0,
            avgLatencyMs: 0,
            avgTokPerSec: 0,
            version: undefined,
        }
        entry.avgLatencyMs = (entry.avgLatencyMs * entry.count + r.latencyMs) / (entry.count + 1)
        entry.avgTokPerSec =
            (entry.avgTokPerSec * entry.count + r.tokensPerSecond) / (entry.count + 1)
        entry.count++
        entry.version = r.modelVersion
        modelBreakdown[r.model] = entry
    }

    const backendBreakdown: Record<string, number> = {}
    for (const r of records) {
        backendBreakdown[r.backend] = (backendBreakdown[r.backend] ?? 0) + 1
    }

    return {
        totalInferences,
        totalTokensGenerated,
        averageLatencyMs,
        latencyP50Ms,
        latencyP95Ms,
        latencyP99Ms,
        averageTokensPerSecond,
        cacheHitRate,
        modelBreakdown,
        backendBreakdown,
        fallbackBreakdown: { ...fallbackCounts },
        successRate: totalInferences > 0 ? successful.length / totalInferences : 1,
        peakTokensPerSecond,
        lastUpdated: Date.now(),
    }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

/**
 * Persist the current snapshot to localStorage.
 */
export const persistSnapshot = (): void => {
    try {
        const snapshot = getSnapshot()
        localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(snapshot))
    } catch {
        // Silently ignore quota errors
    }
}

let _persistTimer: ReturnType<typeof setTimeout> | null = null
/**
 * Debounced persistence — batches rapid inference calls into one write.
 */
export const debouncedPersistSnapshot = (delayMs = 5_000): void => {
    if (_persistTimer) clearTimeout(_persistTimer)
    _persistTimer = setTimeout(() => {
        persistSnapshot()
        _persistTimer = null
    }, delayMs)
}

/**
 * Load the most recent persisted snapshot.
 * Validates the shape to guard against corrupted localStorage data.
 */
export const loadPersistedSnapshot = (): TelemetrySnapshot | null => {
    try {
        const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY)
        if (!raw) return null
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const parsed = JSON.parse(raw) as Record<string, unknown>
        // Validate required shape — reject if critical fields are missing or wrong type
        if (
            typeof parsed.totalInferences !== 'number' ||
            typeof parsed.averageLatencyMs !== 'number' ||
            typeof parsed.successRate !== 'number' ||
            typeof parsed.lastUpdated !== 'number'
        ) {
            localStorage.removeItem(TELEMETRY_STORAGE_KEY)
            return null
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return parsed as unknown as TelemetrySnapshot
    } catch {
        localStorage.removeItem(TELEMETRY_STORAGE_KEY)
        return null
    }
}

// ─── Inference Timer Utility ─────────────────────────────────────────────────

/**
 * Simple timer for manual start/stop tracking.
 */
export const createInferenceTimer = (): {
    stop: (meta: {
        model: string
        task: string
        backend: InferenceRecord['backend']
        tokensGenerated?: number
        success?: boolean
        cached?: boolean
    }) => InferenceRecord
} => {
    const start = performance.now()
    return {
        stop(meta) {
            const latencyMs = performance.now() - start
            const tokens = meta.tokensGenerated ?? 0
            const tokPerSec = latencyMs > 0 ? (tokens / latencyMs) * 1000 : 0
            const record: InferenceRecord = {
                model: meta.model,
                task: meta.task,
                latencyMs,
                tokensGenerated: tokens,
                tokensPerSecond: tokPerSec,
                backend: meta.backend,
                cached: meta.cached ?? false,
                timestamp: Date.now(),
                success: meta.success ?? true,
            }
            recordInference(record)
            return record
        },
    }
}

// ─── Performance Degradation Detection ───────────────────────────────────────

/** Minimum tok/s before we consider it degraded (VRAM swapping to RAM). */
const DEGRADED_TOKENS_PER_SECOND = 2.0

/** Number of recent records to consider for degradation check. */
const DEGRADATION_WINDOW = 3

export interface PerformanceAlert {
    /** Whether performance is degraded. */
    degraded: boolean
    /** Current average tok/s over the last N inferences. */
    recentTokensPerSecond: number
    /** Recommended action. */
    recommendation: 'none' | 'downgrade-model' | 'close-tabs' | 'switch-wasm'
}

/**
 * Check if recent inference performance indicates VRAM pressure.
 * When tok/s drops below threshold, the browser is likely swapping
 * VRAM to system RAM, causing severe degradation.
 */
export const checkPerformanceDegradation = (): PerformanceAlert => {
    const recent = records
        .filter((r) => r.success && !r.cached && r.tokensPerSecond > 0)
        .slice(-DEGRADATION_WINDOW)

    if (recent.length < DEGRADATION_WINDOW) {
        return { degraded: false, recentTokensPerSecond: 0, recommendation: 'none' }
    }

    const avgTokPerSec = recent.reduce((sum, r) => sum + r.tokensPerSecond, 0) / recent.length

    if (avgTokPerSec < DEGRADED_TOKENS_PER_SECOND) {
        // Check if this is primarily a WebLLM issue (GPU swapping)
        const webllmRecords = recent.filter((r) => r.backend === 'webllm')
        const recommendation: PerformanceAlert['recommendation'] =
            webllmRecords.length > 0 ? 'downgrade-model' : 'close-tabs'

        return { degraded: true, recentTokensPerSecond: avgTokPerSec, recommendation }
    }

    return { degraded: false, recentTokensPerSecond: avgTokPerSec, recommendation: 'none' }
}

// ─── Reset (tests) ──────────────────────────────────────────────────────────

export const resetTelemetry = (): void => {
    records.length = 0
    totalCacheHits = 0
    totalCacheMisses = 0
    fallbackCounts.cache = 0
    fallbackCounts.webllm = 0
    fallbackCounts.transformers = 0
    fallbackCounts.heuristic = 0
    fallbackCounts.cloud = 0
}

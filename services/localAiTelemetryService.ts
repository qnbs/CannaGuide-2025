/**
 * Local AI Telemetry — tracks inference performance metrics in-memory
 * to power the Settings dashboard and help users understand local AI
 * health and speed.
 *
 * No data leaves the device. All metrics are volatile (lost on reload)
 * unless explicitly persisted via `persistSnapshot()`.
 */

const TELEMETRY_STORAGE_KEY = 'cg.localai.telemetry'
const MAX_HISTORY = 100

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InferenceRecord {
    model: string
    task: string
    latencyMs: number
    tokensGenerated: number
    tokensPerSecond: number
    backend: 'webgpu' | 'wasm' | 'webllm'
    cached: boolean
    timestamp: number
    success: boolean
}

export interface TelemetrySnapshot {
    totalInferences: number
    totalTokensGenerated: number
    averageLatencyMs: number
    averageTokensPerSecond: number
    cacheHitRate: number
    modelBreakdown: Record<string, { count: number; avgLatencyMs: number; avgTokPerSec: number }>
    backendBreakdown: Record<string, number>
    successRate: number
    peakTokensPerSecond: number
    lastUpdated: number
}

// ─── State ───────────────────────────────────────────────────────────────────

const records: InferenceRecord[] = []
let totalCacheHits = 0
let totalCacheMisses = 0

// ─── Tracking ────────────────────────────────────────────────────────────────

/**
 * Record a completed inference for telemetry tracking.
 */
export const recordInference = (record: InferenceRecord): void => {
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

// ─── Snapshot ────────────────────────────────────────────────────────────────

/** Rough token estimation from string output (~4 chars per token). */
const estimateTokenCount = (value: unknown): number => {
    if (typeof value === 'string') return Math.ceil(value.length / 4)
    if (typeof value === 'object' && value !== null) {
        return Math.ceil(JSON.stringify(value).length / 4)
    }
    return 0
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

    const modelBreakdown: TelemetrySnapshot['modelBreakdown'] = {}
    for (const r of successful) {
        const entry = modelBreakdown[r.model] ?? { count: 0, avgLatencyMs: 0, avgTokPerSec: 0 }
        entry.avgLatencyMs = (entry.avgLatencyMs * entry.count + r.latencyMs) / (entry.count + 1)
        entry.avgTokPerSec =
            (entry.avgTokPerSec * entry.count + r.tokensPerSecond) / (entry.count + 1)
        entry.count++
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
        averageTokensPerSecond,
        cacheHitRate,
        modelBreakdown,
        backendBreakdown,
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

/**
 * Load the most recent persisted snapshot.
 * Validates the shape to guard against corrupted localStorage data.
 */
export const loadPersistedSnapshot = (): TelemetrySnapshot | null => {
    try {
        const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY)
        if (!raw) return null
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

// ─── Reset (tests) ──────────────────────────────────────────────────────────

export const resetTelemetry = (): void => {
    records.length = 0
    totalCacheHits = 0
    totalCacheMisses = 0
}

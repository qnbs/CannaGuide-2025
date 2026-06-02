import type { WorkerPriority } from '@/utils/priorityQueue'
import type { PoolMetrics } from '@/services/workerPool'

/** Options for dispatch with retry support. */
export interface DispatchOptions {
    timeoutMs?: number
    retries?: number
    retryDelayMs?: number
    signal?: AbortSignal | undefined
    transferable?: Transferable[] | undefined
    priority?: WorkerPriority | undefined
}

export interface DispatchCompleteEvent {
    workerName: string
    type: string
    latencyMs: number
    success: boolean
    priority: WorkerPriority
    data?: unknown
    error?: string | undefined
}

export interface WorkerBusMetrics {
    totalDispatches: number
    totalErrors: number
    totalTimeouts: number
    pendingCount: number
    queuedCount: number
    averageLatencyMs: number
    preemptionCount: number
    cooperativePreemptions: number
    concurrencyLimit: number
}

export interface WorkerTelemetrySnapshot extends WorkerBusMetrics {
    peakLatencyMs: number
    errorRate: number
    lastSuccessAt: number | undefined
    lastErrorAt: number | undefined
}

export interface CrdtTelemetryMetrics {
    divergenceCount: number
    syncPayloadBytes: number
    conflictsResolved: number
    lastSyncMs: number
}

export interface WorkerBusTelemetryExport {
    timestamp: number
    workers: Record<string, WorkerTelemetrySnapshot>
    crdtMetrics?: CrdtTelemetryMetrics | undefined
    poolMetrics?: PoolMetrics | undefined
}

export interface PendingRequest<T = unknown> {
    resolve: (value: T) => void
    reject: (reason: unknown) => void
    timer: ReturnType<typeof setTimeout>
    startedAt: number
    workerName: string
    type: string
    priority: WorkerPriority
    abortCleanup?: (() => void) | undefined
    payload: unknown
    timeoutMs: number
    signal?: AbortSignal | undefined
    transferable?: Transferable[] | undefined
    preemptionCount: number
}

export interface QueuedDispatch {
    workerName: string
    type: string
    payload: unknown
    timeoutMs: number
    priority: WorkerPriority
    signal?: AbortSignal | undefined
    transferable?: Transferable[] | undefined
    resolve: (value: unknown) => void
    reject: (reason: unknown) => void
    preemptionCount: number
}

export interface RateLimitConfig {
    maxRequests: number
    windowMs: number
}

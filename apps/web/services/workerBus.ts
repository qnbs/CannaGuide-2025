/**
 * WorkerBus -- Centralized, promise-based Web Worker communication dispatcher.
 *
 * Provides type-safe, promise-based request/response communication with all
 * Web Workers. Every outgoing message is tagged with a unique messageId so
 * the corresponding response can be resolved or rejected.
 *
 * Features:
 * - Per-worker backpressure with configurable concurrency limits
 * - Built-in retry with exponential backoff for transient failures
 * - Telemetry hooks (latency, pending count, error tracking)
 * - Configurable default timeout
 * - Safe dispose with resource-leak prevention
 *
 * Usage:
 *   workerBus.register('genealogy', new Worker(...))
 *   const result = await workerBus.dispatch<LayoutResult>('genealogy', 'LAYOUT', payload)
 */

import type { WorkerRequest, WorkerResponse } from '@/types/workerBus.types'

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface PendingRequest<T = unknown> {
    resolve: (value: T) => void
    reject: (reason: unknown) => void
    timer: ReturnType<typeof setTimeout>
    startedAt: number
    workerName: string
}

interface QueuedDispatch {
    workerName: string
    type: string
    payload: unknown
    timeoutMs: number
    resolve: (value: unknown) => void
    reject: (reason: unknown) => void
}

/** Options for dispatch with retry support. */
export interface DispatchOptions {
    /** Override default timeout for this request (ms). */
    timeoutMs?: number
    /** Number of retry attempts on transient failure (default: 0). */
    retries?: number
    /** Base delay for exponential backoff in ms (default: 500). */
    retryDelayMs?: number
}

/** Telemetry snapshot for a single worker. */
export interface WorkerBusMetrics {
    totalDispatches: number
    totalErrors: number
    totalTimeouts: number
    pendingCount: number
    queuedCount: number
    averageLatencyMs: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_CONCURRENT = 8
const DEFAULT_MAX_QUEUE_SIZE = 64
const DEFAULT_RETRY_DELAY_MS = 500

// ---------------------------------------------------------------------------
// Telemetry tracking (per worker)
// ---------------------------------------------------------------------------

interface WorkerTelemetry {
    totalDispatches: number
    totalErrors: number
    totalTimeouts: number
    latencySum: number
    latencyCount: number
}

const telemetryMap = new Map<string, WorkerTelemetry>()

const getTelemetry = (name: string): WorkerTelemetry => {
    let t = telemetryMap.get(name)
    if (!t) {
        t = { totalDispatches: 0, totalErrors: 0, totalTimeouts: 0, latencySum: 0, latencyCount: 0 }
        telemetryMap.set(name, t)
    }
    return t
}

// ---------------------------------------------------------------------------
// WorkerBus
// ---------------------------------------------------------------------------

class WorkerBusImpl {
    private readonly workers = new Map<string, Worker>()
    private readonly pending = new Map<string, PendingRequest>()
    private readonly activeCount = new Map<string, number>()
    private readonly queues = new Map<string, QueuedDispatch[]>()
    private readonly concurrencyLimits = new Map<string, number>()
    private defaultTimeoutMs = DEFAULT_TIMEOUT_MS
    private disposed = false

    /**
     * Set the default timeout for all dispatches (can be overridden per-call).
     */
    setDefaultTimeout(ms: number): void {
        this.defaultTimeoutMs = Math.max(1000, ms)
    }

    /**
     * Get the current default timeout in ms.
     */
    getDefaultTimeout(): number {
        return this.defaultTimeoutMs
    }

    /**
     * Set the max concurrent dispatches for a specific worker.
     */
    setConcurrencyLimit(name: string, limit: number): void {
        this.concurrencyLimits.set(name, Math.max(1, limit))
    }

    /**
     * Register a named worker instance. If a worker with the same name already
     * exists, it is terminated and replaced.
     */
    register(name: string, worker: Worker): void {
        const existing = this.workers.get(name)
        if (existing) {
            existing.terminate()
        }
        this.workers.set(name, worker)
        this.activeCount.set(name, 0)

        worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
            this.handleMessage(event.data)
        })

        worker.addEventListener('error', (event: ErrorEvent) => {
            const tel = getTelemetry(name)
            // Reject ALL pending requests for this worker on unrecoverable error
            for (const [id, entry] of this.pending) {
                if (entry.workerName === name) {
                    clearTimeout(entry.timer)
                    tel.totalErrors++
                    entry.reject(new Error(`[WorkerBus] Worker "${name}" error: ${event.message}`))
                    this.pending.delete(id)
                }
            }
            this.activeCount.set(name, 0)
            this.drainQueue(name)
        })
    }

    /**
     * Unregister and terminate a worker by name.
     */
    unregister(name: string): void {
        const worker = this.workers.get(name)
        if (worker) {
            worker.terminate()
            this.workers.delete(name)
        }
        this.activeCount.delete(name)

        // Reject any pending requests
        for (const [id, entry] of this.pending) {
            if (entry.workerName === name) {
                clearTimeout(entry.timer)
                entry.reject(new Error(`[WorkerBus] Worker "${name}" unregistered`))
                this.pending.delete(id)
            }
        }

        // Reject queued items
        const queue = this.queues.get(name)
        if (queue) {
            for (const item of queue) {
                item.reject(new Error(`[WorkerBus] Worker "${name}" unregistered`))
            }
            this.queues.delete(name)
        }
    }

    /**
     * Dispatch a typed request to a named worker and return a Promise that
     * resolves with the worker's response data.
     *
     * Supports backpressure: if the worker has reached its concurrency limit,
     * the request is queued (up to DEFAULT_MAX_QUEUE_SIZE).
     */
    dispatch<TResponse = unknown>(
        workerName: string,
        type: string,
        payload?: unknown,
        timeoutOrOptions?: number | DispatchOptions,
    ): Promise<TResponse> {
        if (this.disposed) {
            return Promise.reject(new Error('[WorkerBus] Bus has been disposed'))
        }

        const opts =
            typeof timeoutOrOptions === 'number'
                ? { timeoutMs: timeoutOrOptions }
                : (timeoutOrOptions ?? {})

        const timeoutMs = opts.timeoutMs ?? this.defaultTimeoutMs
        const retries = opts.retries ?? 0
        const retryDelayMs = opts.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS

        if (retries > 0) {
            return this.dispatchWithRetry<TResponse>(
                workerName,
                type,
                payload,
                timeoutMs,
                retries,
                retryDelayMs,
            )
        }
        return this.dispatchOnce<TResponse>(workerName, type, payload, timeoutMs)
    }

    /**
     * Check whether a worker is registered.
     */
    has(name: string): boolean {
        return this.workers.has(name)
    }

    /**
     * Get the underlying Worker instance for direct event listeners (e.g. progress).
     * Throws if the worker is not registered.
     */
    getWorker(name: string): Worker {
        const w = this.workers.get(name)
        if (!w) {
            throw new Error(`[WorkerBus] No worker registered with name "${name}"`)
        }
        return w
    }

    /**
     * Get telemetry metrics for a specific worker or all workers.
     */
    getMetrics(name?: string): Record<string, WorkerBusMetrics> {
        const result: Record<string, WorkerBusMetrics> = {}

        const names = name ? [name] : [...this.workers.keys()]
        for (const n of names) {
            const tel = getTelemetry(n)
            const queue = this.queues.get(n)
            let pendingCount = 0
            for (const entry of this.pending.values()) {
                if (entry.workerName === n) pendingCount++
            }
            result[n] = {
                totalDispatches: tel.totalDispatches,
                totalErrors: tel.totalErrors,
                totalTimeouts: tel.totalTimeouts,
                pendingCount,
                queuedCount: queue?.length ?? 0,
                averageLatencyMs:
                    tel.latencyCount > 0 ? Math.round(tel.latencySum / tel.latencyCount) : 0,
            }
        }
        return result
    }

    /**
     * Number of currently pending (in-flight) requests for a worker.
     */
    getPendingCount(name: string): number {
        let count = 0
        for (const entry of this.pending.values()) {
            if (entry.workerName === name) count++
        }
        return count
    }

    /**
     * Terminate all workers and reject all pending requests.
     * Safe to call multiple times.
     */
    dispose(): void {
        this.disposed = true
        for (const name of [...this.workers.keys()]) {
            this.unregister(name)
        }
        telemetryMap.clear()
    }

    /**
     * Reset disposed state (for testing or recovery).
     */
    reset(): void {
        this.dispose()
        this.disposed = false
    }

    // -----------------------------------------------------------------------
    // Private
    // -----------------------------------------------------------------------

    private dispatchOnce<TResponse>(
        workerName: string,
        type: string,
        payload: unknown,
        timeoutMs: number,
    ): Promise<TResponse> {
        const worker = this.workers.get(workerName)
        if (!worker) {
            return Promise.reject(
                new Error(`[WorkerBus] No worker registered with name "${workerName}"`),
            )
        }

        const limit = this.concurrencyLimits.get(workerName) ?? DEFAULT_MAX_CONCURRENT
        const active = this.activeCount.get(workerName) ?? 0

        if (active >= limit) {
            // Queue the request (backpressure)
            return new Promise<TResponse>((resolve, reject) => {
                let queue = this.queues.get(workerName)
                if (!queue) {
                    queue = []
                    this.queues.set(workerName, queue)
                }
                if (queue.length >= DEFAULT_MAX_QUEUE_SIZE) {
                    reject(
                        new Error(
                            `[WorkerBus] Queue full for "${workerName}" (${DEFAULT_MAX_QUEUE_SIZE} pending)`,
                        ),
                    )
                    return
                }
                queue.push({
                    workerName,
                    type,
                    payload,
                    timeoutMs,
                    resolve: resolve as (v: unknown) => void,
                    reject,
                })
            })
        }

        return this.sendToWorker<TResponse>(worker, workerName, type, payload, timeoutMs)
    }

    private sendToWorker<TResponse>(
        worker: Worker,
        workerName: string,
        type: string,
        payload: unknown,
        timeoutMs: number,
    ): Promise<TResponse> {
        const messageId = `${workerName}:${crypto.randomUUID()}`
        const tel = getTelemetry(workerName)
        tel.totalDispatches++
        this.activeCount.set(workerName, (this.activeCount.get(workerName) ?? 0) + 1)

        return new Promise<TResponse>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(messageId)
                tel.totalTimeouts++
                this.decrementActive(workerName)
                reject(
                    new Error(
                        `[WorkerBus] Request to "${workerName}" timed out after ${timeoutMs}ms`,
                    ),
                )
            }, timeoutMs)

            this.pending.set(messageId, {
                resolve: resolve as (v: unknown) => void,
                reject,
                timer,
                startedAt: performance.now(),
                workerName,
            })

            const request: WorkerRequest = { messageId, type, payload }
            worker.postMessage(request)
        })
    }

    private decrementActive(workerName: string): void {
        const current = this.activeCount.get(workerName) ?? 0
        this.activeCount.set(workerName, Math.max(0, current - 1))
        this.drainQueue(workerName)
    }

    private drainQueue(workerName: string): void {
        const queue = this.queues.get(workerName)
        if (!queue || queue.length === 0) return

        const limit = this.concurrencyLimits.get(workerName) ?? DEFAULT_MAX_CONCURRENT

        while (queue.length > 0) {
            const currentActive = this.activeCount.get(workerName) ?? 0
            if (currentActive >= limit) break

            const item = queue.shift()
            if (!item) break

            const worker = this.workers.get(workerName)
            if (!worker) {
                item.reject(new Error(`[WorkerBus] No worker registered with name "${workerName}"`))
                continue
            }

            this.sendToWorker(worker, workerName, item.type, item.payload, item.timeoutMs)
                .then(item.resolve)
                .catch(item.reject)
        }
    }

    private async dispatchWithRetry<TResponse>(
        workerName: string,
        type: string,
        payload: unknown,
        timeoutMs: number,
        retries: number,
        retryDelayMs: number,
    ): Promise<TResponse> {
        let lastError: Error | undefined
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await this.dispatchOnce<TResponse>(workerName, type, payload, timeoutMs)
            } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err))
                // Do not retry if worker is missing or bus disposed
                if (
                    lastError.message.includes('No worker registered') ||
                    lastError.message.includes('disposed') ||
                    lastError.message.includes('unregistered')
                ) {
                    throw lastError
                }
                if (attempt < retries) {
                    const delay = retryDelayMs * Math.pow(2, attempt)
                    await new Promise<void>((r) => setTimeout(r, delay))
                }
            }
        }
        throw lastError
    }

    private handleMessage(data: WorkerResponse): void {
        if (!data || typeof data.messageId !== 'string') {
            // Not a WorkerBus-managed message -- ignore so legacy handlers
            // continue to work during incremental migration.
            return
        }
        const entry = this.pending.get(data.messageId)
        if (!entry) {
            return
        }
        this.pending.delete(data.messageId)
        clearTimeout(entry.timer)

        const tel = getTelemetry(entry.workerName)
        const latency = performance.now() - entry.startedAt
        tel.latencySum += latency
        tel.latencyCount++

        this.decrementActive(entry.workerName)

        if (data.error) {
            tel.totalErrors++
            entry.reject(new Error(data.error))
        } else {
            entry.resolve(data.data)
        }
    }
}

/** Singleton WorkerBus instance for the entire application. */
export const workerBus = new WorkerBusImpl()

export type { WorkerBusImpl }

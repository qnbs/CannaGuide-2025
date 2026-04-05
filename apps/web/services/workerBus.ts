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
 * - AbortController support (signal option) -- cancel in-flight requests
 * - Transferable Object support -- zero-copy ArrayBuffer/ImageBitmap transfers
 * - onDispatchComplete hook -- automatic Redux/Zustand state sync via workerStateSyncService
 * - Heap-based priority queue -- critical > high > normal > low dispatch ordering
 *
 * Priority Guide:
 *   critical -- VPD alerts, safety-critical plant monitoring (<100ms target)
 *   high     -- user-initiated simulation, interactive AI queries
 *   normal   -- standard operations (default)
 *   low      -- ML inference (WebLLM/ONNX), image generation, background tasks
 *
 * Design: No preemption. Critical jobs do not interrupt running workers.
 * They are guaranteed to be dispatched next once the current job completes.
 * True preemption would require Worker.terminate() + re-create, risking
 * race conditions and lost in-flight state.
 *
 * Usage:
 *   workerBus.register('genealogy', new Worker(...))
 *   const result = await workerBus.dispatch<LayoutResult>('genealogy', 'LAYOUT', payload)
 *   // With abort:
 *   const ctrl = new AbortController()
 *   await workerBus.dispatch('inference', 'CLASSIFY', data, { signal: ctrl.signal })
 */

import type { WorkerRequest, WorkerResponse } from '@/types/workerBus.types'
import { WorkerErrorCode, WorkerBusError } from '@/types/workerBus.types'
import { PriorityQueue, type WorkerPriority } from '@/utils/priorityQueue'

export type { WorkerPriority } from '@/utils/priorityQueue'

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface PendingRequest<T = unknown> {
    resolve: (value: T) => void
    reject: (reason: unknown) => void
    timer: ReturnType<typeof setTimeout>
    startedAt: number
    workerName: string
    /** Message type stored for hook events and telemetry. */
    type: string
    /** Dispatch priority for queue-state reporting. */
    priority: WorkerPriority
    /** Removes the AbortSignal listener when the request settles. */
    abortCleanup?: (() => void) | undefined
}

interface QueuedDispatch {
    workerName: string
    type: string
    payload: unknown
    timeoutMs: number
    priority: WorkerPriority
    signal?: AbortSignal | undefined
    transferable?: Transferable[] | undefined
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
    /**
     * AbortSignal to cancel the in-flight request before or during execution.
     * Rejects with WorkerErrorCode.CANCELLED when the signal fires.
     */
    signal?: AbortSignal | undefined
    /**
     * Transferable objects whose ownership is moved to the worker thread,
     * avoiding a structured-clone memory copy (e.g. ArrayBuffer, ImageBitmap).
     */
    transferable?: Transferable[] | undefined
    /**
     * Dispatch priority. Higher-priority jobs are dequeued before lower ones
     * when multiple jobs are waiting. Default: 'normal'.
     */
    priority?: WorkerPriority | undefined
}

/**
 * Event emitted after every WorkerBus dispatch settles (success or failure).
 * Subscribe via workerBus.onDispatchComplete() to wire results to Redux/Zustand
 * without manual "await then dispatch" patterns in calling code.
 */
export interface DispatchCompleteEvent {
    workerName: string
    type: string
    latencyMs: number
    success: boolean
    /** Dispatch priority that was assigned to this job. */
    priority: WorkerPriority
    /** Present on success -- the resolved data value. */
    data?: unknown
    /** Present on failure -- human-readable error description. */
    error?: string | undefined
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

// Non-retryable error markers (avoid brittle string matching)
const NON_RETRYABLE = ['No worker registered', 'disposed', 'unregistered', 'Queue full'] as const

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
    private readonly queues = new Map<string, PriorityQueue<QueuedDispatch>>()
    private readonly concurrencyLimits = new Map<string, number>()
    private readonly dispatchHooks: Array<(event: DispatchCompleteEvent) => void> = []
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
     * Subscribe to all dispatch completion events (success and failure).
     * Returns a cleanup function -- call it to unsubscribe.
     *
     * Used by workerStateSyncService and workerTelemetryService to automatically
     * route worker results to Redux/Zustand without manual dispatch-after-await.
     */
    onDispatchComplete(handler: (event: DispatchCompleteEvent) => void): () => void {
        this.dispatchHooks.push(handler)
        return () => {
            const idx = this.dispatchHooks.indexOf(handler)
            if (idx !== -1) this.dispatchHooks.splice(idx, 1)
        }
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
                    entry.abortCleanup?.()
                    tel.totalErrors++
                    const errMsg = `[WorkerBus] Worker "${name}" error: ${event.message}`
                    this.fireDispatchHooks({
                        workerName: name,
                        type: entry.type,
                        latencyMs: performance.now() - entry.startedAt,
                        success: false,
                        priority: entry.priority,
                        error: errMsg,
                    })
                    entry.reject(new Error(errMsg))
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
                entry.abortCleanup?.()
                entry.reject(new Error(`[WorkerBus] Worker "${name}" unregistered`))
                this.pending.delete(id)
            }
        }

        // Reject queued items
        const queue = this.queues.get(name)
        if (queue) {
            let item = queue.dequeue()
            while (item !== undefined) {
                item.reject(new Error(`[WorkerBus] Worker "${name}" unregistered`))
                item = queue.dequeue()
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
            return Promise.reject(
                new WorkerBusError('Bus has been disposed', WorkerErrorCode.DISPOSED, workerName),
            )
        }

        const opts =
            typeof timeoutOrOptions === 'number'
                ? { timeoutMs: timeoutOrOptions }
                : (timeoutOrOptions ?? {})

        const timeoutMs = opts.timeoutMs ?? this.defaultTimeoutMs
        const retries = opts.retries ?? 0
        const retryDelayMs = opts.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
        const signal = opts.signal
        const transferable = opts.transferable
        const priority: WorkerPriority = opts.priority ?? 'normal'

        if (retries > 0) {
            return this.dispatchWithRetry<TResponse>(
                workerName,
                type,
                payload,
                timeoutMs,
                retries,
                retryDelayMs,
                signal,
                transferable,
                priority,
            )
        }
        return this.dispatchOnce<TResponse>(
            workerName,
            type,
            payload,
            timeoutMs,
            signal,
            transferable,
            priority,
        )
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
                queuedCount: queue?.size ?? 0,
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
     * Snapshot of the current queue state across all workers.
     * Useful for debugging and monitoring priority distribution.
     */
    getQueueState(): {
        current: Array<{ workerName: string; type: string; priority: WorkerPriority }>
        queued: Array<{ workerName: string; type: string; priority: WorkerPriority }>
        byPriority: Record<WorkerPriority, number>
    } {
        const current: Array<{ workerName: string; type: string; priority: WorkerPriority }> = []
        for (const entry of this.pending.values()) {
            current.push({
                workerName: entry.workerName,
                type: entry.type,
                priority: entry.priority,
            })
        }

        const queued: Array<{ workerName: string; type: string; priority: WorkerPriority }> = []
        const byPriority: Record<WorkerPriority, number> = {
            critical: 0,
            high: 0,
            normal: 0,
            low: 0,
        }
        for (const queue of this.queues.values()) {
            for (const item of queue.toArray()) {
                queued.push({
                    workerName: item.workerName,
                    type: item.type,
                    priority: item.priority,
                })
                byPriority[item.priority]++
            }
        }

        return { current, queued, byPriority }
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
        this.dispatchHooks.splice(0)
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
        signal?: AbortSignal | undefined,
        transferable?: Transferable[] | undefined,
        priority: WorkerPriority = 'normal',
    ): Promise<TResponse> {
        // Pre-flight abort check -- reject immediately if already aborted
        if (signal?.aborted) {
            return Promise.reject(
                new WorkerBusError(
                    `Request to "${workerName}" was cancelled before dispatch`,
                    WorkerErrorCode.CANCELLED,
                    workerName,
                ),
            )
        }

        const worker = this.workers.get(workerName)
        if (!worker) {
            return Promise.reject(
                new WorkerBusError(
                    `No worker registered with name "${workerName}"`,
                    WorkerErrorCode.NOT_REGISTERED,
                    workerName,
                ),
            )
        }

        const limit = this.concurrencyLimits.get(workerName) ?? DEFAULT_MAX_CONCURRENT
        const active = this.activeCount.get(workerName) ?? 0

        if (active >= limit) {
            // Queue the request (backpressure) -- priority-ordered via heap
            return new Promise<TResponse>((resolve, reject) => {
                let queue = this.queues.get(workerName)
                if (!queue) {
                    queue = new PriorityQueue<QueuedDispatch>()
                    this.queues.set(workerName, queue)
                }
                if (queue.size >= DEFAULT_MAX_QUEUE_SIZE) {
                    reject(
                        new WorkerBusError(
                            `Queue full for "${workerName}" (${DEFAULT_MAX_QUEUE_SIZE} pending)`,
                            WorkerErrorCode.QUEUE_FULL,
                            workerName,
                        ),
                    )
                    return
                }
                queue.enqueue(
                    {
                        workerName,
                        type,
                        payload,
                        timeoutMs,
                        priority,
                        signal,
                        transferable,
                        resolve: resolve as (v: unknown) => void,
                        reject,
                    },
                    priority,
                )
            })
        }

        return this.sendToWorker<TResponse>(
            worker,
            workerName,
            type,
            payload,
            timeoutMs,
            signal,
            transferable,
            priority,
        )
    }

    private sendToWorker<TResponse>(
        worker: Worker,
        workerName: string,
        type: string,
        payload: unknown,
        timeoutMs: number,
        signal?: AbortSignal | undefined,
        transferable?: Transferable[] | undefined,
        priority: WorkerPriority = 'normal',
    ): Promise<TResponse> {
        const messageId = `${workerName}:${crypto.randomUUID()}`
        const tel = getTelemetry(workerName)
        tel.totalDispatches++
        this.activeCount.set(workerName, (this.activeCount.get(workerName) ?? 0) + 1)
        const startedAt = performance.now()

        return new Promise<TResponse>((resolve, reject) => {
            const settleReject = (err: unknown): void => {
                clearTimeout(timer)
                this.pending.delete(messageId)
                pendingEntry.abortCleanup?.()
                const errMsg = err instanceof Error ? err.message : String(err)
                this.fireDispatchHooks({
                    workerName,
                    type,
                    latencyMs: performance.now() - startedAt,
                    success: false,
                    priority,
                    error: errMsg,
                })
                this.decrementActive(workerName)
                reject(err)
            }

            const timer = setTimeout(() => {
                tel.totalTimeouts++
                settleReject(
                    new WorkerBusError(
                        `Request to "${workerName}" timed out after ${timeoutMs}ms`,
                        WorkerErrorCode.TIMEOUT,
                        workerName,
                    ),
                )
            }, timeoutMs)

            // AbortSignal handler -- cancel on abort
            let abortCleanup: (() => void) | undefined
            if (signal !== undefined) {
                const onAbort = (): void => {
                    settleReject(
                        new WorkerBusError(
                            `Request to "${workerName}" was cancelled`,
                            WorkerErrorCode.CANCELLED,
                            workerName,
                        ),
                    )
                }
                signal.addEventListener('abort', onAbort, { once: true })
                abortCleanup = () => signal.removeEventListener('abort', onAbort)
            }

            const pendingEntry: PendingRequest = {
                resolve: resolve as (v: unknown) => void,
                reject,
                timer,
                startedAt,
                workerName,
                type,
                priority,
                abortCleanup,
            }
            this.pending.set(messageId, pendingEntry)

            const request: WorkerRequest = { messageId, type, payload }
            if (transferable !== undefined && transferable.length > 0) {
                worker.postMessage(request, transferable)
            } else {
                worker.postMessage(request)
            }
        })
    }

    private decrementActive(workerName: string): void {
        const current = this.activeCount.get(workerName) ?? 0
        this.activeCount.set(workerName, Math.max(0, current - 1))
        this.drainQueue(workerName)
    }

    private drainQueue(workerName: string): void {
        const queue = this.queues.get(workerName)
        if (!queue || queue.size === 0) return

        const limit = this.concurrencyLimits.get(workerName) ?? DEFAULT_MAX_CONCURRENT

        while (queue.size > 0) {
            const currentActive = this.activeCount.get(workerName) ?? 0
            if (currentActive >= limit) break

            const item = queue.dequeue()
            if (!item) break

            // Pre-flight abort check for queued items
            if (item.signal?.aborted) {
                item.reject(
                    new WorkerBusError(
                        `Request to "${workerName}" was cancelled while queued`,
                        WorkerErrorCode.CANCELLED,
                        workerName,
                    ),
                )
                continue
            }

            const worker = this.workers.get(workerName)
            if (!worker) {
                item.reject(new Error(`[WorkerBus] No worker registered with name "${workerName}"`))
                continue
            }

            this.sendToWorker(
                worker,
                workerName,
                item.type,
                item.payload,
                item.timeoutMs,
                item.signal,
                item.transferable,
                item.priority,
            )
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
        signal?: AbortSignal | undefined,
        transferable?: Transferable[] | undefined,
        priority: WorkerPriority = 'normal',
    ): Promise<TResponse> {
        let lastError: Error | undefined
        for (let attempt = 0; attempt <= retries; attempt++) {
            // Abort check before each attempt
            if (signal?.aborted) {
                throw new WorkerBusError(
                    `Request to "${workerName}" was cancelled`,
                    WorkerErrorCode.CANCELLED,
                    workerName,
                )
            }
            try {
                return await this.dispatchOnce<TResponse>(
                    workerName,
                    type,
                    payload,
                    timeoutMs,
                    signal,
                    transferable,
                    priority,
                )
            } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err))
                // Do not retry if worker is missing, bus disposed, queue full, or cancelled
                if (lastError instanceof WorkerBusError) {
                    const nonRetryableCodes: WorkerErrorCode[] = [
                        WorkerErrorCode.NOT_REGISTERED,
                        WorkerErrorCode.DISPOSED,
                        WorkerErrorCode.QUEUE_FULL,
                        WorkerErrorCode.CANCELLED,
                    ]
                    if (nonRetryableCodes.includes(lastError.code)) {
                        throw lastError
                    }
                } else if (NON_RETRYABLE.some((marker) => lastError?.message.includes(marker))) {
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
        entry.abortCleanup?.()

        const tel = getTelemetry(entry.workerName)
        const latencyMs = performance.now() - entry.startedAt
        tel.latencySum += latencyMs
        tel.latencyCount++

        this.decrementActive(entry.workerName)

        if (data.error) {
            tel.totalErrors++
            this.fireDispatchHooks({
                workerName: entry.workerName,
                type: entry.type,
                latencyMs,
                success: false,
                priority: entry.priority,
                error: data.error,
            })
            entry.reject(
                new WorkerBusError(
                    data.error,
                    data.errorCode ?? WorkerErrorCode.EXECUTION_ERROR,
                    entry.workerName,
                ),
            )
        } else {
            this.fireDispatchHooks({
                workerName: entry.workerName,
                type: entry.type,
                latencyMs,
                success: true,
                priority: entry.priority,
                data: data.data,
            })
            entry.resolve(data.data)
        }
    }

    private fireDispatchHooks(event: DispatchCompleteEvent): void {
        for (const hook of this.dispatchHooks) {
            try {
                hook(event)
            } catch (err) {
                console.debug('[WorkerBus] onDispatchComplete hook threw:', err)
            }
        }
    }
}

/** Singleton WorkerBus instance for the entire application. */
export const workerBus = new WorkerBusImpl()

// Auto-dispose all workers on page unload to prevent resource leaks.
if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => {
        workerBus.dispose()
    })
}

export type { WorkerBusImpl }

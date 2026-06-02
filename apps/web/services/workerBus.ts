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
 * W-02 Priority Preemption:
 * When all worker slots are full and a higher-priority job arrives, the
 * lowest-priority running job is preempted (removed from the pending map,
 * its worker response silently ignored) and automatically re-queued.
 * Preemption is main-thread only -- AbortController-based, no
 * Worker.terminate(). Max 3 preemptions per job before final rejection.
 *
 * Usage:
 *   workerBus.register('genealogy', new Worker(...))
 *   const result = await workerBus.dispatch<LayoutResult>('genealogy', 'LAYOUT', payload)
 *   // With abort:
 *   const ctrl = new AbortController()
 *   await workerBus.dispatch('inference', 'CLASSIFY', data, { signal: ctrl.signal })
 */

import type {
    WorkerRequest,
    WorkerResponse,
    WorkerMessageMap,
    WorkerTypes,
    WorkerPayload,
    WorkerResponseData,
} from '@/types/workerBus.types'
import { WorkerErrorCode, WorkerBusError } from '@/types/workerBus.types'
import { PriorityQueue, PRIORITY_VALUES, type WorkerPriority } from '@/utils/priorityQueue'
import { getDeviceConcurrencyLimit } from '@/utils/deviceCapabilities'
import type { WorkerPool, PoolMetrics } from './workerPool'

export type { WorkerPriority } from '@/utils/priorityQueue'

export type {
    DispatchOptions,
    DispatchCompleteEvent,
    WorkerBusMetrics,
    WorkerTelemetrySnapshot,
    WorkerBusTelemetryExport,
    CrdtTelemetryMetrics,
} from '@/services/worker-bus/workerBusTypes'

import type {
    DispatchOptions,
    DispatchCompleteEvent,
    WorkerBusMetrics,
    WorkerTelemetrySnapshot,
    WorkerBusTelemetryExport,
    CrdtTelemetryMetrics,
    PendingRequest,
    QueuedDispatch,
    RateLimitConfig,
} from '@/services/worker-bus/workerBusTypes'

import {
    DEFAULT_TIMEOUT_MS,
    DEFAULT_MAX_CONCURRENT,
    DEFAULT_MAX_QUEUE_SIZE,
    DEFAULT_RETRY_DELAY_MS,
    MAX_PREEMPTION_RETRIES,
    CANCEL_TYPE,
    NON_RETRYABLE,
} from '@/services/worker-bus/workerBusConstants'

import {
    isRateLimitAllowed,
    setWorkerRateLimit,
    getWorkerRateLimit,
    clearWorkerRateLimits,
} from '@/services/worker-bus/workerBusRateLimit'

import {
    getWorkerTelemetry,
    buildWorkerBusMetrics,
    buildWorkerTelemetrySnapshot,
    clearWorkerTelemetry,
} from '@/services/worker-bus/workerBusTelemetry'

import { WorkerChannelRegistry } from '@/services/worker-bus/workerBusChannels'

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
    /** W-04: Active cross-worker MessageChannel instances. */
    private readonly channelRegistry = new WorkerChannelRegistry()
    /** CRDT telemetry metrics (fire-and-forget updates from crdtSyncBridge). */
    private crdtMetricsSnapshot: CrdtTelemetryMetrics | undefined
    private defaultTimeoutMs = DEFAULT_TIMEOUT_MS
    private disposed = false
    /** W-01.1: When true, register() auto-sets concurrency from device capabilities. */
    private dynamicConcurrency = true
    /** W-06: Optional WorkerPool for lazy spawning + idle management. */
    private pool: WorkerPool | undefined

    // -------------------------------------------------------------------
    // W-06: WorkerPool integration (lazy spawning + idle management)
    // -------------------------------------------------------------------

    /**
     * Attach a WorkerPool for lazy worker spawning.
     * When set, `dispatch()` to an unregistered worker will auto-spawn
     * via the pool's factory registry, then register transparently.
     */
    setWorkerPool(pool: WorkerPool): void {
        this.pool = pool
        // Wire the spawn hook so newly created workers auto-register
        pool.setOnSpawnHook((name: string, worker: Worker) => {
            this.register(name, worker)
        })
    }

    /**
     * Get pool-level metrics (active, idle, spawned, terminated counts).
     * Returns undefined when no pool is attached.
     */
    getPoolMetrics(): PoolMetrics | undefined {
        return this.pool?.getPoolMetrics()
    }

    /**
     * Notify the pool that a worker is idle (no pending dispatches).
     * Called after all pending requests for a worker have settled.
     */
    private notifyPoolIdle(workerName: string): void {
        if (!this.pool) return
        // Only release to pool if zero pending + zero queued
        let pending = 0
        for (const entry of this.pending.values()) {
            if (entry.workerName === workerName) pending++
        }
        const queue = this.queues.get(workerName)
        const queued = queue?.size ?? 0
        if (pending === 0 && queued === 0) {
            this.pool.release(workerName)
        }
    }

    // -------------------------------------------------------------------
    // CRDT Telemetry integration (fire-and-forget from bridge)
    // -------------------------------------------------------------------

    /**
     * Update the CRDT telemetry metrics snapshot.
     * Called by crdtSyncBridge after each sync operation.
     * Must not block the sync path -- fire-and-forget only.
     */
    setCrdtMetrics(metrics: CrdtTelemetryMetrics): void {
        this.crdtMetricsSnapshot = metrics
    }

    /**
     * Read the current CRDT telemetry snapshot (if available).
     */
    getCrdtMetrics(): CrdtTelemetryMetrics | undefined {
        return this.crdtMetricsSnapshot
    }

    // -------------------------------------------------------------------
    // W-01: Per-worker rate limiting
    // -------------------------------------------------------------------

    /**
     * Configure a sliding-window rate limit for a specific worker.
     * Example: `setRateLimit('inference', { maxRequests: 3, windowMs: 1000 })`
     * limits the inference worker to 3 dispatches per second.
     *
     * Pass `undefined` to remove the limit.
     */
    setRateLimit(workerName: string, config: RateLimitConfig | undefined): void {
        setWorkerRateLimit(workerName, config)
    }

    /**
     * Get the current rate-limit configuration for a worker (undefined if none).
     */
    getRateLimit(workerName: string): RateLimitConfig | undefined {
        return getWorkerRateLimit(workerName)
    }

    // -------------------------------------------------------------------
    // W-03: Telemetry export
    // -------------------------------------------------------------------

    /**
     * Export a JSON-serializable telemetry snapshot for all workers.
     * Includes extended metrics (peak latency, last success/error timestamps,
     * error rate, queue depth). Suitable for external dashboards or Sentry
     * custom context.
     */
    exportTelemetry(): WorkerBusTelemetryExport {
        const workers: Record<string, WorkerTelemetrySnapshot> = {}
        for (const name of this.workers.keys()) {
            const queue = this.queues.get(name)
            workers[name] = buildWorkerTelemetrySnapshot(
                name,
                this.countPending(name),
                queue?.size ?? 0,
                this.concurrencyLimits.get(name) ?? DEFAULT_MAX_CONCURRENT,
            )
        }
        return {
            timestamp: Date.now(),
            workers,
            crdtMetrics: this.crdtMetricsSnapshot,
            poolMetrics: this.pool?.getPoolMetrics(),
        }
    }

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
     * W-01.1: Enable or disable dynamic concurrency auto-detection.
     * When enabled, newly registered workers get concurrency limits
     * based on `navigator.hardwareConcurrency`.
     */
    setDynamicConcurrency(enabled: boolean): void {
        this.dynamicConcurrency = enabled
    }

    /**
     * W-01.1: Check if dynamic concurrency is enabled.
     */
    isDynamicConcurrencyEnabled(): boolean {
        return this.dynamicConcurrency
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

        // W-01.1: Auto-set concurrency limit from device capabilities
        if (this.dynamicConcurrency && !this.concurrencyLimits.has(name)) {
            this.concurrencyLimits.set(name, getDeviceConcurrencyLimit())
        }

        worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
            this.handleMessage(event.data)
        })

        worker.addEventListener('error', (event: ErrorEvent) => {
            const tel = getWorkerTelemetry(name)
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
                    entry.reject(new WorkerBusError(errMsg, WorkerErrorCode.EXECUTION_ERROR, name))
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
                entry.reject(
                    new WorkerBusError(
                        `[WorkerBus] Worker "${name}" unregistered`,
                        WorkerErrorCode.NOT_REGISTERED,
                        name,
                    ),
                )
                this.pending.delete(id)
            }
        }

        // Reject queued items
        const queue = this.queues.get(name)
        if (queue) {
            let item = queue.dequeue()
            while (item !== undefined) {
                item.reject(
                    new WorkerBusError(
                        `[WorkerBus] Worker "${name}" unregistered`,
                        WorkerErrorCode.NOT_REGISTERED,
                        name,
                    ),
                )
                item = queue.dequeue()
            }
            this.queues.delete(name)
        }

        this.channelRegistry.closeChannelsForWorker(name)
    }

    /**
     * Dispatch a typed request to a named worker and return a Promise that
     * resolves with the worker's response data.
     *
     * Supports backpressure: if the worker has reached its concurrency limit,
     * the request is queued (up to DEFAULT_MAX_QUEUE_SIZE).
     *
     * W-04: Typed overloads for workers declared in WorkerMessageMap provide
     * compile-time payload/response checks. Untyped workers fall through to
     * the generic signature.
     */
    dispatch<W extends keyof WorkerMessageMap, T extends WorkerTypes<W>>(
        workerName: W & string,
        type: T & string,
        payload: WorkerPayload<W, T>,
        timeoutOrOptions?: number | DispatchOptions,
    ): Promise<WorkerResponseData<W, T>>
    dispatch<TResponse = unknown>(
        workerName: string,
        type: string,
        payload?: unknown,
        timeoutOrOptions?: number | DispatchOptions,
    ): Promise<TResponse>
    dispatch(
        workerName: string,
        type: string,
        payload?: unknown,
        timeoutOrOptions?: number | DispatchOptions,
    ): Promise<unknown> {
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
            return this.dispatchWithRetry(
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
        return this.dispatchOnce(
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
            throw new WorkerBusError(
                `[WorkerBus] No worker registered with name "${name}"`,
                WorkerErrorCode.NOT_REGISTERED,
                name,
            )
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
            const queue = this.queues.get(n)
            result[n] = buildWorkerBusMetrics(
                n,
                this.countPending(n),
                queue?.size ?? 0,
                this.concurrencyLimits.get(n) ?? DEFAULT_MAX_CONCURRENT,
            )
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
        /** W-01.1: Effective concurrency limit per registered worker. */
        effectiveConcurrency: Record<string, number>
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

        // W-01.1: Include effective concurrency per worker
        const effectiveConcurrency: Record<string, number> = {}
        for (const name of this.workers.keys()) {
            effectiveConcurrency[name] = this.concurrencyLimits.get(name) ?? DEFAULT_MAX_CONCURRENT
        }

        return { current, queued, byPriority, effectiveConcurrency }
    }

    // -------------------------------------------------------------------
    // W-04: Cross-Worker Channels (MessageChannel)
    // -------------------------------------------------------------------

    /**
     * Create a direct MessageChannel between two registered workers.
     * Each worker receives a `MessagePort` via a `PORT_TRANSFER` message
     * with the peer's name attached so the worker can identify the sender.
     *
     * Throws if either worker is not registered, if a channel already exists,
     * or if both names are identical.
     */
    createChannel(workerA: string, workerB: string): void {
        const wA = this.workers.get(workerA)
        if (!wA) {
            throw new WorkerBusError(
                `No worker registered with name "${workerA}"`,
                WorkerErrorCode.NOT_REGISTERED,
                workerA,
            )
        }
        const wB = this.workers.get(workerB)
        if (!wB) {
            throw new WorkerBusError(
                `No worker registered with name "${workerB}"`,
                WorkerErrorCode.NOT_REGISTERED,
                workerB,
            )
        }
        this.channelRegistry.createChannel(workerA, workerB, wA, wB)
    }

    /**
     * Close an existing channel between two workers.
     * Does not throw if the channel does not exist.
     */
    closeChannel(workerA: string, workerB: string): void {
        this.channelRegistry.closeChannel(workerA, workerB)
    }

    /**
     * List all active cross-worker channels as sorted `[workerA, workerB]` pairs.
     */
    getChannels(): Array<[string, string]> {
        return this.channelRegistry.getChannels()
    }

    /**
     * Check whether a channel exists between two workers.
     */
    hasChannel(workerA: string, workerB: string): boolean {
        return this.channelRegistry.hasChannel(workerA, workerB)
    }

    /**
     * Terminate all workers and reject all pending requests.
     * Safe to call multiple times.
     */
    dispose(): void {
        this.disposed = true
        this.channelRegistry.dispose()
        for (const name of [...this.workers.keys()]) {
            this.unregister(name)
        }
        clearWorkerTelemetry()
        clearWorkerRateLimits()
        this.dispatchHooks.splice(0)
        // W-06: Cascade dispose to pool
        this.pool?.dispose()
    }

    /**
     * Reset disposed state (for testing or recovery).
     */
    reset(): void {
        this.dispose()
        this.disposed = false
    }

    // -----------------------------------------------------------------------
    // W-02: Priority preemption
    // -----------------------------------------------------------------------

    /**
     * Find the lowest-priority in-flight job for `workerName` that can be
     * preempted by a job with `incomingPriority`. Returns `undefined` when
     * no preemption candidate exists (all running jobs have equal or higher
     * priority).
     */
    private findPreemptionCandidate(
        workerName: string,
        incomingPriority: WorkerPriority,
    ): { messageId: string; entry: PendingRequest } | undefined {
        const incomingValue = PRIORITY_VALUES[incomingPriority]
        let worst: { messageId: string; entry: PendingRequest; value: number } | undefined

        for (const [messageId, entry] of this.pending) {
            if (entry.workerName !== workerName) continue
            const entryValue = PRIORITY_VALUES[entry.priority]
            // Strict greater -- only preempt if running job is strictly lower priority
            if (entryValue > incomingValue) {
                if (worst === undefined || entryValue > worst.value) {
                    worst = { messageId, entry, value: entryValue }
                }
            }
        }

        return worst ? { messageId: worst.messageId, entry: worst.entry } : undefined
    }

    /**
     * Preempt a running job and dispatch a higher-priority job in its place.
     * The preempted job is re-queued (up to MAX_PREEMPTION_RETRIES times).
     */
    private preempt<TResponse>(
        candidate: { messageId: string; entry: PendingRequest },
        worker: Worker,
        workerName: string,
        type: string,
        payload: unknown,
        timeoutMs: number,
        signal: AbortSignal | undefined,
        transferable: Transferable[] | undefined,
        priority: WorkerPriority,
    ): Promise<TResponse> {
        const { messageId, entry } = candidate

        // W-02.1: Send cooperative CANCEL signal to the worker so it can
        // abort long-running loops early instead of wasting CPU.
        try {
            worker.postMessage({ type: CANCEL_TYPE, messageId })
        } catch {
            // Worker may already be terminated -- safe to ignore.
        }

        // Remove preempted job from pending map -- its worker response will be
        // silently ignored when it eventually arrives (no matching messageId).
        this.pending.delete(messageId)
        clearTimeout(entry.timer)
        entry.abortCleanup?.()

        // Telemetry
        const tel = getWorkerTelemetry(workerName)
        tel.preemptionCount++

        this.fireDispatchHooks({
            workerName,
            type: entry.type,
            latencyMs: performance.now() - entry.startedAt,
            success: false,
            priority: entry.priority,
            error: 'Preempted by higher-priority job',
        })

        // Free the slot (sendToWorker will re-increment)
        const current = this.activeCount.get(workerName) ?? 0
        this.activeCount.set(workerName, Math.max(0, current - 1))

        // Re-queue the preempted job or reject if max retries exceeded
        const nextPreemptionCount = entry.preemptionCount + 1
        if (nextPreemptionCount > MAX_PREEMPTION_RETRIES) {
            entry.reject(
                new WorkerBusError(
                    `Job "${entry.type}" for "${workerName}" exceeded max preemption retries (${MAX_PREEMPTION_RETRIES})`,
                    WorkerErrorCode.PREEMPTED,
                    workerName,
                ),
            )
        } else {
            // Re-enqueue with preserved resolve/reject so the caller's promise
            // transparently resolves when the job eventually completes.
            let queue = this.queues.get(workerName)
            if (!queue) {
                queue = new PriorityQueue<QueuedDispatch>()
                this.queues.set(workerName, queue)
            }
            queue.enqueue(
                {
                    workerName,
                    type: entry.type,
                    payload: entry.payload,
                    timeoutMs: entry.timeoutMs,
                    priority: entry.priority,
                    signal: entry.signal,
                    transferable: entry.transferable,
                    resolve: entry.resolve,
                    reject: entry.reject,
                    preemptionCount: nextPreemptionCount,
                },
                entry.priority,
            )
        }

        // Dispatch the higher-priority job into the freed slot
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

    // -----------------------------------------------------------------------
    // Private
    // -----------------------------------------------------------------------

    private countPending(workerName: string): number {
        let count = 0
        for (const entry of this.pending.values()) {
            if (entry.workerName === workerName) count++
        }
        return count
    }

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
            // W-06: Auto-spawn via pool if available
            if (this.pool?.hasFactory(workerName)) {
                this.pool.getOrCreate(workerName)
                // getOrCreate fires onSpawnHook -> register(), so worker is now available
                const spawned = this.workers.get(workerName)
                if (spawned) {
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
            }
            return Promise.reject(
                new WorkerBusError(
                    `No worker registered with name "${workerName}"`,
                    WorkerErrorCode.NOT_REGISTERED,
                    workerName,
                ),
            )
        }

        // W-01: Per-worker sliding-window rate limit check
        if (!isRateLimitAllowed(workerName)) {
            return Promise.reject(
                new WorkerBusError(
                    `Rate limit exceeded for "${workerName}"`,
                    WorkerErrorCode.RATE_LIMITED,
                    workerName,
                ),
            )
        }

        const limit = this.concurrencyLimits.get(workerName) ?? DEFAULT_MAX_CONCURRENT
        const active = this.activeCount.get(workerName) ?? 0

        if (active >= limit) {
            // W-02: Attempt preemption before queuing
            const candidate = this.findPreemptionCandidate(workerName, priority)
            if (candidate) {
                return this.preempt<TResponse>(
                    candidate,

                    worker!,
                    workerName,
                    type,
                    payload,
                    timeoutMs,
                    signal,
                    transferable,
                    priority,
                )
            }

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
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        resolve: resolve as (v: unknown) => void,
                        reject,
                        preemptionCount: 0,
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
        preemptionCount = 0,
    ): Promise<TResponse> {
        const messageId = `${workerName}:${crypto.randomUUID()}`
        const tel = getWorkerTelemetry(workerName)
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                resolve: resolve as (v: unknown) => void,
                reject,
                timer,
                startedAt,
                workerName,
                type,
                priority,
                abortCleanup,
                payload,
                timeoutMs,
                signal,
                transferable,
                preemptionCount,
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
        // W-06: Notify pool when worker becomes fully idle
        this.notifyPoolIdle(workerName)
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
                item.reject(
                    new WorkerBusError(
                        `[WorkerBus] No worker registered with name "${workerName}"`,
                        WorkerErrorCode.NOT_REGISTERED,
                        workerName,
                    ),
                )
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
                item.preemptionCount,
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
                lastError =
                    err instanceof Error
                        ? err
                        : new WorkerBusError(String(err), WorkerErrorCode.UNKNOWN, workerName)
                // Do not retry if worker is missing, bus disposed, queue full, or cancelled
                if (lastError instanceof WorkerBusError) {
                    const nonRetryableCodes: WorkerErrorCode[] = [
                        WorkerErrorCode.NOT_REGISTERED,
                        WorkerErrorCode.DISPOSED,
                        WorkerErrorCode.QUEUE_FULL,
                        WorkerErrorCode.CANCELLED,
                        WorkerErrorCode.RATE_LIMITED,
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

        const tel = getWorkerTelemetry(entry.workerName)
        const latencyMs = performance.now() - entry.startedAt
        tel.latencySum += latencyMs
        tel.latencyCount++
        if (latencyMs > tel.peakLatencyMs) tel.peakLatencyMs = latencyMs

        this.decrementActive(entry.workerName)

        if (data.error) {
            // W-02.1: Detect cooperative cancellation from worker-side checkAborted()
            const isCancelled =
                data.error === 'CANCELLED' || data.errorCode === WorkerErrorCode.PREEMPTED
            if (isCancelled) {
                tel.cooperativePreemptions++
            } else {
                tel.totalErrors++
            }
            tel.lastErrorAt = Date.now()
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
            tel.lastSuccessAt = Date.now()
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

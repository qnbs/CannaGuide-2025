/**
 * WorkerBus -- Centralized, promise-based Web Worker communication dispatcher.
 *
 * Implementation split across `services/worker-bus/*`; this file owns the public API
 * and singleton lifecycle.
 */

import type {
    WorkerResponse,
    WorkerMessageMap,
    WorkerTypes,
    WorkerPayload,
    WorkerResponseData,
} from '@/types/workerBus.types'
import { WorkerErrorCode, WorkerBusError } from '@/types/workerBus.types'
import { type WorkerPriority } from '@/utils/priorityQueue'
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
    WorkerBusTelemetryExport,
    CrdtTelemetryMetrics,
    RateLimitConfig,
} from '@/services/worker-bus/workerBusTypes'

import {
    DEFAULT_MAX_CONCURRENT,
    DEFAULT_RETRY_DELAY_MS,
} from '@/services/worker-bus/workerBusConstants'

import {
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

import { WorkerBusRuntime } from '@/services/worker-bus/workerBusRuntime'
import {
    countPendingForWorker,
    decrementActive,
    dispatchOnce,
    dispatchWithRetry,
    drainQueue,
} from '@/services/worker-bus/workerBusDispatch'
import { handleWorkerResponse } from '@/services/worker-bus/workerBusResponseHandler'

class WorkerBusImpl {
    private readonly rt = new WorkerBusRuntime()

    setWorkerPool(pool: WorkerPool): void {
        this.rt.pool = pool
        pool.setOnSpawnHook((name: string, worker: Worker) => {
            this.register(name, worker)
        })
    }

    getPoolMetrics(): PoolMetrics | undefined {
        return this.rt.pool?.getPoolMetrics()
    }

    setCrdtMetrics(metrics: CrdtTelemetryMetrics): void {
        this.rt.crdtMetricsSnapshot = metrics
    }

    getCrdtMetrics(): CrdtTelemetryMetrics | undefined {
        return this.rt.crdtMetricsSnapshot
    }

    setRateLimit(workerName: string, config: RateLimitConfig | undefined): void {
        setWorkerRateLimit(workerName, config)
    }

    getRateLimit(workerName: string): RateLimitConfig | undefined {
        return getWorkerRateLimit(workerName)
    }

    exportTelemetry(): WorkerBusTelemetryExport {
        const workers: WorkerBusTelemetryExport['workers'] = {}
        for (const name of this.rt.workers.keys()) {
            const queue = this.rt.queues.get(name)
            workers[name] = buildWorkerTelemetrySnapshot(
                name,
                countPendingForWorker(this.rt.pending, name),
                queue?.size ?? 0,
                this.rt.concurrencyLimits.get(name) ?? DEFAULT_MAX_CONCURRENT,
            )
        }
        return {
            timestamp: Date.now(),
            workers,
            crdtMetrics: this.rt.crdtMetricsSnapshot,
            poolMetrics: this.rt.pool?.getPoolMetrics(),
        }
    }

    setDefaultTimeout(ms: number): void {
        this.rt.defaultTimeoutMs = Math.max(1000, ms)
    }

    getDefaultTimeout(): number {
        return this.rt.defaultTimeoutMs
    }

    setConcurrencyLimit(name: string, limit: number): void {
        this.rt.concurrencyLimits.set(name, Math.max(1, limit))
    }

    setDynamicConcurrency(enabled: boolean): void {
        this.rt.dynamicConcurrency = enabled
    }

    isDynamicConcurrencyEnabled(): boolean {
        return this.rt.dynamicConcurrency
    }

    onDispatchComplete(handler: (event: DispatchCompleteEvent) => void): () => void {
        this.rt.dispatchHooks.push(handler)
        return () => {
            const idx = this.rt.dispatchHooks.indexOf(handler)
            if (idx !== -1) this.rt.dispatchHooks.splice(idx, 1)
        }
    }

    register(name: string, worker: Worker): void {
        const existing = this.rt.workers.get(name)
        if (existing) {
            existing.terminate()
        }
        this.rt.workers.set(name, worker)
        this.rt.activeCount.set(name, 0)

        if (this.rt.dynamicConcurrency && !this.rt.concurrencyLimits.has(name)) {
            this.rt.concurrencyLimits.set(name, getDeviceConcurrencyLimit())
        }

        worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
            this.handleMessage(event.data)
        })

        worker.addEventListener('error', (event: ErrorEvent) => {
            const tel = getWorkerTelemetry(name)
            for (const [id, entry] of this.rt.pending) {
                if (entry.workerName === name) {
                    clearTimeout(entry.timer)
                    entry.abortCleanup?.()
                    tel.totalErrors++
                    const errMsg = `[WorkerBus] Worker "${name}" error: ${event.message}`
                    this.rt.dispatchHooks.forEach((hook) => {
                        try {
                            hook({
                                workerName: name,
                                type: entry.type,
                                latencyMs: performance.now() - entry.startedAt,
                                success: false,
                                priority: entry.priority,
                                error: errMsg,
                            })
                        } catch (err) {
                            console.debug('[WorkerBus] onDispatchComplete hook threw:', err)
                        }
                    })
                    entry.reject(new WorkerBusError(errMsg, WorkerErrorCode.EXECUTION_ERROR, name))
                    this.rt.pending.delete(id)
                }
            }
            this.rt.activeCount.set(name, 0)
            drainQueue(this.rt, name)
        })
    }

    unregister(name: string): void {
        const worker = this.rt.workers.get(name)
        if (worker) {
            worker.terminate()
            this.rt.workers.delete(name)
        }
        this.rt.activeCount.delete(name)

        for (const [id, entry] of this.rt.pending) {
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
                this.rt.pending.delete(id)
            }
        }

        const queue = this.rt.queues.get(name)
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
            this.rt.queues.delete(name)
        }

        this.rt.channelRegistry.closeChannelsForWorker(name)
    }

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
        if (this.rt.disposed) {
            return Promise.reject(
                new WorkerBusError('Bus has been disposed', WorkerErrorCode.DISPOSED, workerName),
            )
        }

        const opts =
            typeof timeoutOrOptions === 'number'
                ? { timeoutMs: timeoutOrOptions }
                : (timeoutOrOptions ?? {})

        const timeoutMs = opts.timeoutMs ?? this.rt.defaultTimeoutMs
        const retries = opts.retries ?? 0
        const retryDelayMs = opts.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
        const signal = opts.signal
        const transferable = opts.transferable
        const priority: WorkerPriority = opts.priority ?? 'normal'

        if (retries > 0) {
            return dispatchWithRetry(
                this.rt,
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
        return dispatchOnce(
            this.rt,
            workerName,
            type,
            payload,
            timeoutMs,
            signal,
            transferable,
            priority,
        )
    }

    has(name: string): boolean {
        return this.rt.workers.has(name)
    }

    getWorker(name: string): Worker {
        const w = this.rt.workers.get(name)
        if (!w) {
            throw new WorkerBusError(
                `[WorkerBus] No worker registered with name "${name}"`,
                WorkerErrorCode.NOT_REGISTERED,
                name,
            )
        }
        return w
    }

    getMetrics(name?: string): Record<string, WorkerBusMetrics> {
        const result: Record<string, WorkerBusMetrics> = {}
        const names = name ? [name] : [...this.rt.workers.keys()]
        for (const n of names) {
            const queue = this.rt.queues.get(n)
            result[n] = buildWorkerBusMetrics(
                n,
                countPendingForWorker(this.rt.pending, n),
                queue?.size ?? 0,
                this.rt.concurrencyLimits.get(n) ?? DEFAULT_MAX_CONCURRENT,
            )
        }
        return result
    }

    getPendingCount(name: string): number {
        return countPendingForWorker(this.rt.pending, name)
    }

    getQueueState(): {
        current: Array<{ workerName: string; type: string; priority: WorkerPriority }>
        queued: Array<{ workerName: string; type: string; priority: WorkerPriority }>
        byPriority: Record<WorkerPriority, number>
        effectiveConcurrency: Record<string, number>
    } {
        const current: Array<{ workerName: string; type: string; priority: WorkerPriority }> = []
        for (const entry of this.rt.pending.values()) {
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
        for (const queue of this.rt.queues.values()) {
            for (const item of queue.toArray()) {
                queued.push({
                    workerName: item.workerName,
                    type: item.type,
                    priority: item.priority,
                })
                byPriority[item.priority]++
            }
        }

        const effectiveConcurrency: Record<string, number> = {}
        for (const workerName of this.rt.workers.keys()) {
            effectiveConcurrency[workerName] =
                this.rt.concurrencyLimits.get(workerName) ?? DEFAULT_MAX_CONCURRENT
        }

        return { current, queued, byPriority, effectiveConcurrency }
    }

    createChannel(workerA: string, workerB: string): void {
        const wA = this.rt.workers.get(workerA)
        if (!wA) {
            throw new WorkerBusError(
                `No worker registered with name "${workerA}"`,
                WorkerErrorCode.NOT_REGISTERED,
                workerA,
            )
        }
        const wB = this.rt.workers.get(workerB)
        if (!wB) {
            throw new WorkerBusError(
                `No worker registered with name "${workerB}"`,
                WorkerErrorCode.NOT_REGISTERED,
                workerB,
            )
        }
        this.rt.channelRegistry.createChannel(workerA, workerB, wA, wB)
    }

    closeChannel(workerA: string, workerB: string): void {
        this.rt.channelRegistry.closeChannel(workerA, workerB)
    }

    getChannels(): Array<[string, string]> {
        return this.rt.channelRegistry.getChannels()
    }

    hasChannel(workerA: string, workerB: string): boolean {
        return this.rt.channelRegistry.hasChannel(workerA, workerB)
    }

    dispose(): void {
        this.rt.disposed = true
        this.rt.channelRegistry.dispose()
        for (const name of [...this.rt.workers.keys()]) {
            this.unregister(name)
        }
        clearWorkerTelemetry()
        clearWorkerRateLimits()
        this.rt.dispatchHooks.splice(0)
        this.rt.pool?.dispose()
    }

    reset(): void {
        this.dispose()
        this.rt.disposed = false
    }

    private handleMessage(data: WorkerResponse): void {
        handleWorkerResponse(this.rt, data, (workerName) => decrementActive(this.rt, workerName))
    }
}

export const workerBus = new WorkerBusImpl()

if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => {
        workerBus.dispose()
    })
}

export type { WorkerBusImpl }

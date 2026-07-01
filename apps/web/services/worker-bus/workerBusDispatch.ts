import type { WorkerRequest } from '@/types/workerBus.types'
import { WorkerErrorCode, WorkerBusError } from '@/types/workerBus.types'
import { PriorityQueue, type WorkerPriority } from '@/utils/priorityQueue'
import {
    DEFAULT_MAX_CONCURRENT,
    DEFAULT_MAX_QUEUE_SIZE,
    NON_RETRYABLE,
} from '@/services/worker-bus/workerBusConstants'
import { fireDispatchHooks } from '@/services/worker-bus/workerBusHooks'
import { isRateLimitAllowed } from '@/services/worker-bus/workerBusRateLimit'
import {
    findPreemptionCandidate,
    preemptJob,
} from '@/services/worker-bus/workerBusPreemption'
import { getWorkerTelemetry } from '@/services/worker-bus/workerBusTelemetry'
import type { PendingRequest, QueuedDispatch } from '@/services/worker-bus/workerBusTypes'
import type { WorkerBusRuntime } from '@/services/worker-bus/workerBusRuntime'

export function countPendingForWorker(
    pending: Map<string, PendingRequest>,
    workerName: string,
): number {
    let count = 0
    for (const entry of pending.values()) {
        if (entry.workerName === workerName) count++
    }
    return count
}

export function notifyPoolIdle(runtime: WorkerBusRuntime, workerName: string): void {
    if (!runtime.pool) return
    let pending = 0
    for (const entry of runtime.pending.values()) {
        if (entry.workerName === workerName) pending++
    }
    const queue = runtime.queues.get(workerName)
    const queued = queue?.size ?? 0
    if (pending === 0 && queued === 0) {
        runtime.pool.release(workerName)
    }
}

export function decrementActive(runtime: WorkerBusRuntime, workerName: string): void {
    const current = runtime.activeCount.get(workerName) ?? 0
    runtime.activeCount.set(workerName, Math.max(0, current - 1))
    drainQueue(runtime, workerName)
    notifyPoolIdle(runtime, workerName)
}

export function drainQueue(runtime: WorkerBusRuntime, workerName: string): void {
    const queue = runtime.queues.get(workerName)
    if (!queue || queue.size === 0) return

    const limit = runtime.concurrencyLimits.get(workerName) ?? DEFAULT_MAX_CONCURRENT

    while (queue.size > 0) {
        const currentActive = runtime.activeCount.get(workerName) ?? 0
        if (currentActive >= limit) break

        const item = queue.dequeue()
        if (!item) break

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

        const worker = runtime.workers.get(workerName)
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

        sendToWorker(runtime, worker, workerName, item.type, item.payload, item.timeoutMs, {
            signal: item.signal,
            transferable: item.transferable,
            priority: item.priority,
            preemptionCount: item.preemptionCount,
        })
            .then(item.resolve)
            .catch(item.reject)
    }
}

interface SendToWorkerOpts {
    signal?: AbortSignal | undefined
    transferable?: Transferable[] | undefined
    priority?: WorkerPriority | undefined
    preemptionCount?: number | undefined
}

export function sendToWorker<TResponse>(
    runtime: WorkerBusRuntime,
    worker: Worker,
    workerName: string,
    type: string,
    payload: unknown,
    timeoutMs: number,
    opts: SendToWorkerOpts = {},
): Promise<TResponse> {
    const {
        signal,
        transferable,
        priority = 'normal',
        preemptionCount = 0,
    } = opts
    const messageId = `${workerName}:${crypto.randomUUID()}`
    const tel = getWorkerTelemetry(workerName)
    tel.totalDispatches++
    runtime.activeCount.set(workerName, (runtime.activeCount.get(workerName) ?? 0) + 1)
    const startedAt = performance.now()

    return new Promise<TResponse>((resolve, reject) => {
        const settleReject = (err: unknown): void => {
            clearTimeout(timer)
            runtime.pending.delete(messageId)
            pendingEntry.abortCleanup?.()
            const errMsg = err instanceof Error ? err.message : String(err)
            fireDispatchHooks(runtime.dispatchHooks, {
                workerName,
                type,
                latencyMs: performance.now() - startedAt,
                success: false,
                priority,
                error: errMsg,
            })
            decrementActive(runtime, workerName)
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Promise<T> stored as unknown resolver
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
        runtime.pending.set(messageId, pendingEntry)

        const request: WorkerRequest = { messageId, type, payload }
        if (transferable !== undefined && transferable.length > 0) {
            worker.postMessage(request, transferable)
        } else {
            worker.postMessage(request)
        }
    })
}

export function dispatchOnce<TResponse>(
    runtime: WorkerBusRuntime,
    workerName: string,
    type: string,
    payload: unknown,
    timeoutMs: number,
    signal?: AbortSignal,
    transferable?: Transferable[],
    priority: WorkerPriority = 'normal',
): Promise<TResponse> {
    if (signal?.aborted) {
        return Promise.reject(
            new WorkerBusError(
                `Request to "${workerName}" was cancelled before dispatch`,
                WorkerErrorCode.CANCELLED,
                workerName,
            ),
        )
    }

    const worker = runtime.workers.get(workerName)
    if (!worker) {
        if (runtime.pool?.hasFactory(workerName)) {
            runtime.pool.getOrCreate(workerName)
            const spawned = runtime.workers.get(workerName)
            if (spawned) {
                return dispatchOnce<TResponse>(
                    runtime,
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

    if (!isRateLimitAllowed(workerName)) {
        return Promise.reject(
            new WorkerBusError(
                `Rate limit exceeded for "${workerName}"`,
                WorkerErrorCode.RATE_LIMITED,
                workerName,
            ),
        )
    }

    const limit = runtime.concurrencyLimits.get(workerName) ?? DEFAULT_MAX_CONCURRENT
    const active = runtime.activeCount.get(workerName) ?? 0

    if (active >= limit) {
        const candidate = findPreemptionCandidate(runtime.pending, workerName, priority)
        if (candidate) {
            return preemptJob(
                runtime,
                candidate,
                worker,
                workerName,
                type,
                payload,
                timeoutMs,
                signal,
                transferable,
                priority,
                (w, wn, t, p, tm, sig, tr, pri, pc) =>
                    sendToWorker<TResponse>(runtime, w, wn, t, p, tm, {
                        signal: sig,
                        transferable: tr,
                        priority: pri,
                        preemptionCount: pc,
                    }),
            )
        }

        return new Promise<TResponse>((resolve, reject) => {
            let queue = runtime.queues.get(workerName)
            if (!queue) {
                queue = new PriorityQueue<QueuedDispatch>()
                runtime.queues.set(workerName, queue)
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
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- queued Promise<T> resolver
                    resolve: resolve as (v: unknown) => void,
                    reject,
                    preemptionCount: 0,
                },
                priority,
            )
        })
    }

    return sendToWorker<TResponse>(runtime, worker, workerName, type, payload, timeoutMs, {
        signal,
        transferable,
        priority,
    })
}

export async function dispatchWithRetry<TResponse>(
    runtime: WorkerBusRuntime,
    workerName: string,
    type: string,
    payload: unknown,
    timeoutMs: number,
    retries: number,
    retryDelayMs: number,
    signal?: AbortSignal,
    transferable?: Transferable[],
    priority: WorkerPriority = 'normal',
): Promise<TResponse> {
    let lastError: Error | undefined
    for (let attempt = 0; attempt <= retries; attempt++) {
        if (signal?.aborted) {
            throw new WorkerBusError(
                `Request to "${workerName}" was cancelled`,
                WorkerErrorCode.CANCELLED,
                workerName,
            )
        }
        try {
            return await dispatchOnce<TResponse>(
                runtime,
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

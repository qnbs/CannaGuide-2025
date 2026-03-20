import type { InferenceWorkerRequest, InferenceWorkerResponse } from '@/workers/inference.worker'

/**
 * Inference Queue Service — dispatches ML inference tasks to a dedicated
 * Web Worker and manages a priority queue to prevent UI thread blocking.
 *
 * Features:
 * • Off-main-thread inference via dedicated Web Worker
 * • Priority queue with configurable concurrency (default: 1 concurrent task)
 * • Timeout per task with automatic rejection
 * • Graceful fallback to main-thread when Worker is unavailable
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type InferencePriority = 'high' | 'normal' | 'low'

export interface InferenceTask {
    task: string
    modelId: string
    input: unknown
    pipelineOptions?: Record<string, unknown>
    inferenceOptions?: Record<string, unknown>
    priority?: InferencePriority
    timeoutMs?: number
}

interface QueuedTask {
    request: InferenceWorkerRequest
    priority: InferencePriority
    timeoutMs: number
    resolve: (result: unknown) => void
    reject: (error: Error) => void
    enqueuedAt: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 60_000
const MAX_QUEUE_SIZE = 32
/** Reject tasks that have been queued longer than this before processing. */
const STALE_THRESHOLD_MS = 30_000
const PRIORITY_ORDER: Record<InferencePriority, number> = { high: 0, normal: 1, low: 2 }

// ─── State ───────────────────────────────────────────────────────────────────

let worker: Worker | null = null
let workerFailed = false
const pendingCallbacks = new Map<
    string,
    {
        resolve: (result: unknown) => void
        reject: (error: Error) => void
        timer: ReturnType<typeof setTimeout>
    }
>()
const queue: QueuedTask[] = []
let activeCount = 0
const MAX_CONCURRENT = 1

// ─── Worker Lifecycle ────────────────────────────────────────────────────────

const getWorker = (): Worker | null => {
    if (workerFailed) return null
    if (worker) return worker

    try {
        worker = new Worker(new URL('../workers/inference.worker.ts', import.meta.url), {
            type: 'module',
            name: 'cannaGuideInference',
        })
        worker.onmessage = (e: MessageEvent<InferenceWorkerResponse>) => {
            const { id, result, error } = e.data
            const pending = pendingCallbacks.get(id)
            if (!pending) return
            clearTimeout(pending.timer)
            pendingCallbacks.delete(id)
            activeCount--
            if (error) {
                pending.reject(new Error(error))
            } else {
                pending.resolve(result)
            }
            processQueue()
        }
        worker.onerror = (event) => {
            console.warn('[InferenceQueue] Worker error:', event.message)
            // Reject all pending tasks
            for (const [id, pending] of pendingCallbacks) {
                clearTimeout(pending.timer)
                pending.reject(new Error('Inference worker crashed'))
                pendingCallbacks.delete(id)
            }
            activeCount = 0
            workerFailed = true
            worker = null
            // Drain queue with rejections
            while (queue.length > 0) {
                const item = queue.shift()
                item?.reject(new Error('Inference worker unavailable'))
            }
        }
        return worker
    } catch {
        workerFailed = true
        return null
    }
}

// ─── Queue Processing ────────────────────────────────────────────────────────

const processQueue = (): void => {
    // Prune stale tasks that have waited too long in the queue
    const now = Date.now()
    for (let i = queue.length - 1; i >= 0; i--) {
        const item = queue[i]
        if (item && now - item.enqueuedAt > STALE_THRESHOLD_MS) {
            queue.splice(i, 1)
            item.reject(new Error('Inference task expired in queue'))
        }
    }

    while (activeCount < MAX_CONCURRENT && queue.length > 0) {
        const task = queue.shift()
        if (!task) break

        const w = getWorker()
        if (!w) {
            task.reject(new Error('Inference worker unavailable'))
            continue
        }

        activeCount++
        const timer = setTimeout(() => {
            const pending = pendingCallbacks.get(task.request.id)
            if (pending) {
                pendingCallbacks.delete(task.request.id)
                activeCount--
                pending.reject(new Error('Inference task timed out'))
                processQueue()
            }
        }, task.timeoutMs)

        pendingCallbacks.set(task.request.id, {
            resolve: task.resolve,
            reject: task.reject,
            timer,
        })
        w.postMessage(task.request)
    }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Enqueue an inference task to be executed in the Web Worker.
 * Tasks are processed in priority order (high > normal > low), FIFO within same priority.
 */
export const enqueueInference = (task: InferenceTask): Promise<unknown> => {
    return new Promise<unknown>((resolve, reject) => {
        if (queue.length >= MAX_QUEUE_SIZE) {
            reject(new Error(`Inference queue full (${MAX_QUEUE_SIZE} tasks pending)`))
            return
        }

        const id = crypto.randomUUID()
        const priority = task.priority ?? 'normal'
        const request: InferenceWorkerRequest = {
            id,
            task: task.task,
            modelId: task.modelId,
            input: task.input,
            pipelineOptions: task.pipelineOptions,
            inferenceOptions: task.inferenceOptions,
        }

        const queued: QueuedTask = {
            request,
            priority,
            timeoutMs: task.timeoutMs ?? DEFAULT_TIMEOUT_MS,
            resolve,
            reject,
            enqueuedAt: Date.now(),
        }

        // Insert in priority order
        const insertIdx = queue.findIndex(
            (item) => PRIORITY_ORDER[item.priority] > PRIORITY_ORDER[priority],
        )
        if (insertIdx === -1) {
            queue.push(queued)
        } else {
            queue.splice(insertIdx, 0, queued)
        }

        processQueue()
    })
}

/** Returns true if the inference worker is available. */
export const isWorkerAvailable = (): boolean => {
    if (workerFailed) return false
    return typeof Worker !== 'undefined'
}

/** Current number of tasks waiting in the queue. */
export const getQueueSize = (): number => queue.length

/** Current number of actively running inference tasks. */
export const getActiveCount = (): number => activeCount

/** Terminate the worker and clear queues. */
export const terminateInferenceWorker = (): void => {
    if (worker) {
        worker.terminate()
        worker = null
    }
    workerFailed = false
    for (const [, pending] of pendingCallbacks) {
        clearTimeout(pending.timer)
        pending.reject(new Error('Inference worker terminated'))
    }
    pendingCallbacks.clear()
    activeCount = 0
    while (queue.length > 0) {
        const item = queue.shift()
        item?.reject(new Error('Inference worker terminated'))
    }
}

/** Reset worker failure state so it can be retried. */
export const resetWorkerState = (): void => {
    workerFailed = false
}

import type { InferencePayload } from '@/workers/inference.worker'
import { workerBus } from '@/services/workerBus'

/**
 * Inference Queue Service -- dispatches ML inference tasks to a dedicated
 * Web Worker via WorkerBus and manages a priority queue to prevent UI
 * thread blocking.
 *
 * Features:
 * - Off-main-thread inference via WorkerBus-managed Web Worker
 * - Priority queue with configurable concurrency (default: 1 concurrent task)
 * - Timeout per task with automatic rejection
 * - Graceful fallback when Worker is unavailable
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type InferencePriority = 'high' | 'normal' | 'low'

export interface InferenceTask {
    task: string
    modelId: string
    input: unknown
    pipelineOptions?: Record<string, unknown> | undefined
    inferenceOptions?: Record<string, unknown> | undefined
    priority?: InferencePriority | undefined
    timeoutMs?: number | undefined
}

interface QueuedTask {
    payload: InferencePayload
    priority: InferencePriority
    timeoutMs: number
    resolve: (result: unknown) => void
    reject: (error: Error) => void
    enqueuedAt: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WORKER_NAME = 'inference'
const DEFAULT_TIMEOUT_MS = 60_000
const MAX_QUEUE_SIZE = 32
/** Reject tasks that have been queued longer than this before processing. */
const STALE_THRESHOLD_MS = 30_000
const PRIORITY_ORDER: Record<InferencePriority, number> = { high: 0, normal: 1, low: 2 }

// ─── State ───────────────────────────────────────────────────────────────────

const queue: QueuedTask[] = []
let activeCount = 0
const MAX_CONCURRENT = 1
let isProcessing = false

// ─── Worker Registration ─────────────────────────────────────────────────────

const ensureWorker = (): boolean => {
    if (typeof Worker === 'undefined') return false
    if (workerBus.has(WORKER_NAME)) return true
    try {
        workerBus.register(
            WORKER_NAME,
            new Worker(new URL('../workers/inference.worker.ts', import.meta.url), {
                type: 'module',
                name: 'cannaGuideInference',
            }),
        )
        return true
    } catch {
        return false
    }
}

// ─── Queue Processing ────────────────────────────────────────────────────────

const processQueue = (): void => {
    if (isProcessing) return
    isProcessing = true
    try {
        // Prune stale tasks
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

            if (!ensureWorker()) {
                task.reject(new Error('Inference worker unavailable'))
                continue
            }

            activeCount++
            workerBus
                .dispatch<unknown>(WORKER_NAME, 'INFER', task.payload, {
                    timeoutMs: task.timeoutMs,
                    priority: 'low',
                })
                .then((result) => {
                    task.resolve(result)
                })
                .catch((err: unknown) => {
                    task.reject(err instanceof Error ? err : new Error(String(err)))
                })
                .finally(() => {
                    activeCount = Math.max(0, activeCount - 1)
                    processQueue()
                })
        }
    } finally {
        isProcessing = false
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

        const priority = task.priority ?? 'normal'
        const payload: InferencePayload = {
            task: task.task,
            modelId: task.modelId,
            input: task.input,
            pipelineOptions: task.pipelineOptions,
            inferenceOptions: task.inferenceOptions,
        }

        const queued: QueuedTask = {
            payload,
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
    return typeof Worker !== 'undefined'
}

/** Current number of tasks waiting in the queue. */
export const getQueueSize = (): number => queue.length

/** Current number of actively running inference tasks. */
export const getActiveCount = (): number => activeCount

/** Terminate the worker and clear queues. */
export const terminateInferenceWorker = (): void => {
    if (workerBus.has(WORKER_NAME)) {
        workerBus.unregister(WORKER_NAME)
    }
    isProcessing = false
    activeCount = 0
    while (queue.length > 0) {
        const item = queue.shift()
        item?.reject(new Error('Inference worker terminated'))
    }
}

/** Reset worker failure state so it can be retried. */
export const resetWorkerState = (): void => {
    // With WorkerBus, unregister allows re-registration on next use
    if (workerBus.has(WORKER_NAME)) {
        workerBus.unregister(WORKER_NAME)
    }
}

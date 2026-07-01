import { WorkerErrorCode, WorkerBusError } from '@/types/workerBus.types'
import { PriorityQueue, PRIORITY_VALUES, type WorkerPriority } from '@/utils/priorityQueue'
import { CANCEL_TYPE, MAX_PREEMPTION_RETRIES } from '@/services/worker-bus/workerBusConstants'
import { fireDispatchHooks } from '@/services/worker-bus/workerBusHooks'
import { getWorkerTelemetry } from '@/services/worker-bus/workerBusTelemetry'
import type { PendingRequest, QueuedDispatch } from '@/services/worker-bus/workerBusTypes'
import type { WorkerBusRuntime } from '@/services/worker-bus/workerBusRuntime'

export function findPreemptionCandidate(
    pending: Map<string, PendingRequest>,
    workerName: string,
    incomingPriority: WorkerPriority,
): { messageId: string; entry: PendingRequest } | undefined {
    const incomingValue = PRIORITY_VALUES[incomingPriority]
    let worst: { messageId: string; entry: PendingRequest; value: number } | undefined

    for (const [messageId, entry] of pending) {
        if (entry.workerName !== workerName) continue
        const entryValue = PRIORITY_VALUES[entry.priority]
        if (entryValue > incomingValue) {
            if (worst === undefined || entryValue > worst.value) {
                worst = { messageId, entry, value: entryValue }
            }
        }
    }

    return worst ? { messageId: worst.messageId, entry: worst.entry } : undefined
}

export function preemptJob<TResponse>(
    runtime: WorkerBusRuntime,
    candidate: { messageId: string; entry: PendingRequest },
    worker: Worker,
    workerName: string,
    type: string,
    payload: unknown,
    timeoutMs: number,
    signal: AbortSignal | undefined,
    transferable: Transferable[] | undefined,
    priority: WorkerPriority,
    sendToWorker: (
        worker: Worker,
        workerName: string,
        type: string,
        payload: unknown,
        timeoutMs: number,
        signal?: AbortSignal,
        transferable?: Transferable[],
        priority?: WorkerPriority,
        preemptionCount?: number,
    ) => Promise<TResponse>,
): Promise<TResponse> {
    const { messageId, entry } = candidate

    try {
        worker.postMessage({ type: CANCEL_TYPE, messageId })
    } catch {
        // Worker may already be terminated.
    }

    runtime.pending.delete(messageId)
    clearTimeout(entry.timer)
    entry.abortCleanup?.()

    const tel = getWorkerTelemetry(workerName)
    tel.preemptionCount++

    fireDispatchHooks(runtime.dispatchHooks, {
        workerName,
        type: entry.type,
        latencyMs: performance.now() - entry.startedAt,
        success: false,
        priority: entry.priority,
        error: 'Preempted by higher-priority job',
    })

    const current = runtime.activeCount.get(workerName) ?? 0
    runtime.activeCount.set(workerName, Math.max(0, current - 1))

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
        let queue = runtime.queues.get(workerName)
        if (!queue) {
            queue = new PriorityQueue<QueuedDispatch>()
            runtime.queues.set(workerName, queue)
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

    return sendToWorker(
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

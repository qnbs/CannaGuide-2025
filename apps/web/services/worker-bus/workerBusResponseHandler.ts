import type { WorkerResponse } from '@/types/workerBus.types'
import { WorkerErrorCode, WorkerBusError } from '@/types/workerBus.types'
import { fireDispatchHooks } from '@/services/worker-bus/workerBusHooks'
import { getWorkerTelemetry } from '@/services/worker-bus/workerBusTelemetry'
import type { WorkerBusRuntime } from '@/services/worker-bus/workerBusRuntime'

export function handleWorkerResponse(
    runtime: WorkerBusRuntime,
    data: WorkerResponse,
    decrementActive: (workerName: string) => void,
): void {
    if (!data || typeof data.messageId !== 'string') {
        return
    }
    const entry = runtime.pending.get(data.messageId)
    if (!entry) {
        return
    }
    runtime.pending.delete(data.messageId)
    clearTimeout(entry.timer)
    entry.abortCleanup?.()

    const tel = getWorkerTelemetry(entry.workerName)
    const latencyMs = performance.now() - entry.startedAt
    tel.latencySum += latencyMs
    tel.latencyCount++
    if (latencyMs > tel.peakLatencyMs) tel.peakLatencyMs = latencyMs

    decrementActive(entry.workerName)

    if (data.error) {
        const isCancelled =
            data.error === 'CANCELLED' || data.errorCode === WorkerErrorCode.PREEMPTED
        if (isCancelled) {
            tel.cooperativePreemptions++
        } else {
            tel.totalErrors++
        }
        tel.lastErrorAt = Date.now()
        fireDispatchHooks(runtime.dispatchHooks, {
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
        fireDispatchHooks(runtime.dispatchHooks, {
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

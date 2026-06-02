import { DEFAULT_MAX_CONCURRENT } from '@/services/worker-bus/workerBusConstants'
import type {
    WorkerBusMetrics,
    WorkerTelemetrySnapshot,
} from '@/services/worker-bus/workerBusTypes'

interface WorkerTelemetry {
    totalDispatches: number
    totalErrors: number
    totalTimeouts: number
    latencySum: number
    latencyCount: number
    peakLatencyMs: number
    lastSuccessAt: number
    lastErrorAt: number
    preemptionCount: number
    cooperativePreemptions: number
}

const telemetryMap = new Map<string, WorkerTelemetry>()

export const getWorkerTelemetry = (name: string): WorkerTelemetry => {
    let t = telemetryMap.get(name)
    if (!t) {
        t = {
            totalDispatches: 0,
            totalErrors: 0,
            totalTimeouts: 0,
            latencySum: 0,
            latencyCount: 0,
            peakLatencyMs: 0,
            lastSuccessAt: 0,
            lastErrorAt: 0,
            preemptionCount: 0,
            cooperativePreemptions: 0,
        }
        telemetryMap.set(name, t)
    }
    return t
}

export const clearWorkerTelemetry = (): void => {
    telemetryMap.clear()
}

export const buildWorkerBusMetrics = (
    name: string,
    pendingCount: number,
    queuedCount: number,
    concurrencyLimit: number,
): WorkerBusMetrics => {
    const tel = getWorkerTelemetry(name)
    return {
        totalDispatches: tel.totalDispatches,
        totalErrors: tel.totalErrors,
        totalTimeouts: tel.totalTimeouts,
        pendingCount,
        queuedCount,
        averageLatencyMs:
            tel.latencyCount > 0 ? Math.round(tel.latencySum / tel.latencyCount) : 0,
        preemptionCount: tel.preemptionCount,
        cooperativePreemptions: tel.cooperativePreemptions,
        concurrencyLimit,
    }
}

export const buildWorkerTelemetrySnapshot = (
    name: string,
    pendingCount: number,
    queuedCount: number,
    concurrencyLimit: number,
): WorkerTelemetrySnapshot => {
    const tel = getWorkerTelemetry(name)
    return {
        ...buildWorkerBusMetrics(name, pendingCount, queuedCount, concurrencyLimit),
        peakLatencyMs: Math.round(tel.peakLatencyMs),
        errorRate:
            tel.totalDispatches > 0
                ? Math.round((tel.totalErrors / tel.totalDispatches) * 10000) / 10000
                : 0,
        lastSuccessAt: tel.lastSuccessAt > 0 ? tel.lastSuccessAt : undefined,
        lastErrorAt: tel.lastErrorAt > 0 ? tel.lastErrorAt : undefined,
    }
}

export const defaultConcurrencyLimit = (): number => DEFAULT_MAX_CONCURRENT

import type { WorkerPool } from '@/services/workerPool'
import { PriorityQueue } from '@/utils/priorityQueue'
import { DEFAULT_TIMEOUT_MS } from '@/services/worker-bus/workerBusConstants'
import { WorkerChannelRegistry } from '@/services/worker-bus/workerBusChannels'
import type {
    CrdtTelemetryMetrics,
    DispatchCompleteEvent,
    PendingRequest,
    QueuedDispatch,
} from '@/services/worker-bus/workerBusTypes'

/** Mutable internal state shared across WorkerBus modules. */
export class WorkerBusRuntime {
    readonly workers = new Map<string, Worker>()
    readonly pending = new Map<string, PendingRequest>()
    readonly activeCount = new Map<string, number>()
    readonly queues = new Map<string, PriorityQueue<QueuedDispatch>>()
    readonly concurrencyLimits = new Map<string, number>()
    readonly dispatchHooks: Array<(event: DispatchCompleteEvent) => void> = []
    readonly channelRegistry = new WorkerChannelRegistry()
    crdtMetricsSnapshot: CrdtTelemetryMetrics | undefined
    defaultTimeoutMs = DEFAULT_TIMEOUT_MS
    disposed = false
    dynamicConcurrency = true
    pool: WorkerPool | undefined
}

# WorkerBus API Reference

> Promise-based, type-safe Web Worker communication bus with backpressure,
> priority queuing, rate limiting, cross-worker channels, and telemetry.

**Source:** `apps/web/services/workerBus.ts`, `apps/web/types/workerBus.types.ts`

---

## Singleton

```typescript
import { workerBus } from '@/services/workerBus'
```

The `workerBus` singleton is created at module scope. It auto-disposes on
`pagehide` events.

---

## Core Methods

### `register(name, worker)`

```typescript
register(name: string, worker: Worker): void
```

Register a named Worker instance. If a worker with the same name
already exists it is terminated and replaced. Sets up `message` and
`error` event handlers internally.

### `unregister(name)`

```typescript
unregister(name: string): void
```

Terminate a worker and reject all its pending/queued requests.
Closes any cross-worker channels (W-04) involving this worker.

### `has(name)`

```typescript
has(name: string): boolean
```

Check whether a worker is registered.

### `getWorker(name)`

```typescript
getWorker(name: string): Worker
```

Get the underlying `Worker` instance (e.g. for direct `onmessage`
progress listeners). Throws `WorkerBusError(NOT_REGISTERED)` if the
worker is not registered.

---

## Dispatch

### `dispatch(workerName, type, payload?, timeoutOrOptions?)`

```typescript
// Typed overload (W-04) -- compile-time payload/response checks
dispatch<W extends keyof WorkerMessageMap, T extends WorkerTypes<W>>(
    workerName: W & string,
    type: T & string,
    payload: WorkerPayload<W, T>,
    timeoutOrOptions?: number | DispatchOptions,
): Promise<WorkerResponseData<W, T>>

// Generic overload -- any worker, untyped
dispatch<TResponse = unknown>(
    workerName: string,
    type: string,
    payload?: unknown,
    timeoutOrOptions?: number | DispatchOptions,
): Promise<TResponse>
```

Send a typed request to a worker and return a Promise that resolves
with the worker's response data.

**Behavior:**

- If the worker's concurrency slots are full the request is queued
  (up to `DEFAULT_MAX_QUEUE_SIZE = 100`).
- If `retries > 0`, failed dispatches are retried with exponential
  backoff (`retryDelayMs * 2^attempt`).
- Priority preemption (W-02): when all slots are full and a
  higher-priority job arrives, the lowest-priority running job is
  aborted and re-queued (max 3 re-queues per job).

**Throws:** `WorkerBusError` with one of the error codes listed below.

### `DispatchOptions`

```typescript
interface DispatchOptions {
    timeoutMs?: number // Override default timeout (ms)
    retries?: number // Retry attempts (default: 0)
    retryDelayMs?: number // Base backoff delay (default: 500)
    signal?: AbortSignal // Cancel via AbortController
    transferable?: Transferable[] // Zero-copy transfer (ArrayBuffer, etc.)
    priority?: WorkerPriority // 'critical' | 'high' | 'normal' | 'low'
}
```

### `onDispatchComplete(handler)`

```typescript
onDispatchComplete(
    handler: (event: DispatchCompleteEvent) => void,
): () => void
```

Subscribe to all dispatch completions (success and failure). Returns
an unsubscribe function. Used by `workerStateSyncService` and
`workerTelemetryService` for automatic Redux/Zustand wiring.

```typescript
interface DispatchCompleteEvent {
    workerName: string
    type: string
    latencyMs: number
    success: boolean
    priority: WorkerPriority
    data?: unknown // Present on success
    error?: string // Present on failure
}
```

---

## Configuration

### `setDefaultTimeout(ms)`

```typescript
setDefaultTimeout(ms: number): void
```

Set global default timeout. Minimum enforced: 1000 ms.

### `getDefaultTimeout()`

```typescript
getDefaultTimeout(): number
```

### `setConcurrencyLimit(name, limit)`

```typescript
setConcurrencyLimit(name: string, limit: number): void
```

Set max concurrent in-flight dispatches for a specific worker.
Minimum enforced: 1.

---

## Rate Limiting (W-01)

### `setRateLimit(workerName, config)`

```typescript
setRateLimit(
    workerName: string,
    config: RateLimitConfig | undefined,
): void

interface RateLimitConfig {
    maxRequests: number   // Max dispatches within window
    windowMs: number      // Sliding window duration (ms)
}
```

Configure per-worker sliding-window rate limiting. Pass `undefined`
to remove the limit.

### `getRateLimit(workerName)`

```typescript
getRateLimit(workerName: string): RateLimitConfig | undefined
```

---

## Cross-Worker Channels (W-04)

### `createChannel(workerA, workerB)`

```typescript
createChannel(workerA: string, workerB: string): void
```

Create a direct `MessageChannel` between two registered workers. Each
worker receives a `MessagePort` via a `__PORT_TRANSFER__` message with
the peer's name attached.

**Throws:**

- `INVALID_PAYLOAD` -- same name for both or channel already exists
- `NOT_REGISTERED` -- either worker is not registered

### `closeChannel(workerA, workerB)`

```typescript
closeChannel(workerA: string, workerB: string): void
```

Close an existing channel. No-op if channel does not exist.

### `hasChannel(workerA, workerB)`

```typescript
hasChannel(workerA: string, workerB: string): boolean
```

### `getChannels()`

```typescript
getChannels(): Array<[string, string]>
```

List all active channels as sorted `[workerA, workerB]` pairs.

---

## Telemetry (W-03)

### `getMetrics(name?)`

```typescript
getMetrics(name?: string): Record<string, WorkerBusMetrics>

interface WorkerBusMetrics {
    totalDispatches: number
    totalErrors: number
    totalTimeouts: number
    pendingCount: number
    queuedCount: number
    averageLatencyMs: number
    preemptionCount: number    // W-02
}
```

### `getQueueState()`

```typescript
getQueueState(): {
    current: Array<{ workerName: string; type: string; priority: WorkerPriority }>
    queued: Array<{ workerName: string; type: string; priority: WorkerPriority }>
    byPriority: Record<WorkerPriority, number>
}
```

Snapshot of the priority queue for debugging and monitoring.

### `exportTelemetry()`

```typescript
exportTelemetry(): WorkerBusTelemetryExport

interface WorkerBusTelemetryExport {
    timestamp: number
    workers: Record<string, WorkerTelemetrySnapshot>
    crdtMetrics?: CrdtTelemetryMetrics
}

interface WorkerTelemetrySnapshot extends WorkerBusMetrics {
    peakLatencyMs: number
    errorRate: number
    lastSuccessAt: number | undefined
    lastErrorAt: number | undefined
}
```

JSON-serializable telemetry export. Suitable for Sentry custom context
or external dashboards.

### CRDT Metrics

```typescript
setCrdtMetrics(metrics: CrdtTelemetryMetrics): void
getCrdtMetrics(): CrdtTelemetryMetrics | undefined

interface CrdtTelemetryMetrics {
    divergenceCount: number
    syncPayloadBytes: number
    conflictsResolved: number
    lastSyncMs: number
}
```

Updated fire-and-forget by `crdtSyncBridge` after each sync operation.

---

## Lifecycle

### `dispose()`

```typescript
dispose(): void
```

Terminate all workers, reject all pending requests, close all
MessageChannels. Auto-called on `pagehide`. Safe to call multiple times.

### `reset()`

```typescript
reset(): void
```

Dispose + reset disposed flag. Used in tests and recovery scenarios.

---

## Priority Levels

| Priority   | Value | Use Case                           |
| ---------- | ----- | ---------------------------------- |
| `critical` | 0     | VPD safety alerts                  |
| `high`     | 1     | User-initiated simulation          |
| `normal`   | 2     | Default for all dispatches         |
| `low`      | 3     | Background ML inference, image gen |

Higher-priority jobs dequeue before lower ones (min-heap). FIFO
tiebreaking within the same priority level.

---

## Error Codes

| Code                   | Description                                  |
| ---------------------- | -------------------------------------------- |
| `UNKNOWN`              | Generic/uncategorized failure                |
| `TIMEOUT`              | Request exceeded configured timeout          |
| `NOT_REGISTERED`       | Worker not registered with the bus           |
| `DISPOSED`             | Bus or worker has been disposed              |
| `QUEUE_FULL`           | Backpressure queue is full                   |
| `EXECUTION_ERROR`      | Worker threw during execution                |
| `INVALID_PAYLOAD`      | Invalid payload or message format            |
| `RESOURCE_UNAVAILABLE` | Model or resource not available              |
| `OUT_OF_MEMORY`        | Allocation failure                           |
| `CANCELLED`            | Cancelled via AbortController                |
| `RATE_LIMITED`         | Per-worker rate limit exceeded (W-01)        |
| `PREEMPTED`            | Preempted by higher-priority dispatch (W-02) |

Non-retryable codes (skipped by retry logic): `NOT_REGISTERED`,
`DISPOSED`, `QUEUE_FULL`, `CANCELLED`, `RATE_LIMITED`.

---

## Typed Worker Messages (W-04)

Workers declared in `WorkerMessageMap` get compile-time type safety:

```typescript
interface WorkerMessageMap {
    simulation: SimulationMessages
    visionInference: VisionInferenceMessages
    hydroForecast: HydroForecastMessages
}
```

Unlisted workers are still callable via the generic `dispatch` overload.

### Worker-Side Helpers

```typescript
import { workerOk, workerErr } from '@/types/workerBus.types'

// Success response
self.postMessage(workerOk(request.messageId, { results }))

// Error response
self.postMessage(workerErr(request.messageId, 'Failed', WorkerErrorCode.EXECUTION_ERROR))
```

---

## Wire Protocol

```
Main Thread                    Worker
    |                              |
    |-- WorkerRequest ------------>|
    |   { messageId, type,         |
    |     payload }                |
    |                              |
    |<-- WorkerResponse -----------|
    |   { messageId, success,      |
    |     data?, error?,           |
    |     errorCode? }             |
```

The `messageId` (crypto UUID) correlates request/response pairs.

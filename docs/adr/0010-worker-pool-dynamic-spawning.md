# ADR-0010: Worker Pool with Dynamic Spawning (W-06)

**Status:** Accepted
**Date:** 2025-07-10
**Deciders:** Project maintainers

## Context

CannaGuide 2025 manages 11 Web Workers through the centralized
WorkerBus. Before this change, worker lifecycle was scattered
across 6 service files (plantDiseaseModelService,
hydroForecastService, imageGenerationService, inferenceQueueService,
voiceOrchestratorService, plantSimulationService), each containing
its own `new Worker(new URL(...))` + `ensureWorkerRegistered()`
boilerplate. This caused:

1. **No idle cleanup:** Workers stayed alive indefinitely, consuming
   memory even when unused.
2. **No lazy spawning:** Some workers were created eagerly at module
   import time regardless of user intent.
3. **No centralized factory:** Adding a new worker required
   duplicating the spawn-and-register pattern.
4. **SAB hot-paths disconnected:** Existing SharedArrayBuffer
   utilities (AtomicsChannel, LockFreeRingBuffer) had no
   integration point with worker lifecycle.

## Decision

Introduce a `WorkerPool` class (`services/workerPool.ts`) and a
centralized factory registry (`services/workerFactories.ts`) that
manage the full worker lifecycle:

### WorkerPool

- **Lazy spawning:** Workers are created on first `getOrCreate()`
  call via a registered factory function.
- **Idle timeout:** Released workers start a 45-second idle timer.
  If no new dispatch arrives, the worker is terminated and removed.
- **Hot-worker exemption:** Safety-critical workers (VPD simulation,
  voice) are exempt from idle timeout via a `hotWorkers` set.
- **Device-aware sizing:** Maximum pool size adapts to hardware via
  `getMaxPoolSize()` from `deviceCapabilities.ts`.
- **On-spawn hook:** `setOnSpawnHook()` allows injecting SAB
  initialization when a hot worker is first created.
- **Pool metrics:** `getPoolMetrics()` reports active, idle, total
  spawned, and total terminated counts for telemetry.

### SAB Hot-Path Integration

When `canUseSharedArrayBuffer()` returns true, the pool creates
an AtomicsChannel and LockFreeRingBuffer for each hot worker at
spawn time. The VPD simulation worker writes simulation status
signals (VPD zone codes) and VPD values to the SAB channel and
ring buffer during its RUN_GROWTH loop. Other workers (voice,
calculation) receive SAB handles via `initSabHandler()` for
future streaming use.

### WorkerBus Integration

WorkerBus gains a `setWorkerPool(pool)` method. When a dispatch
targets an unregistered worker and a pool is available, the bus
auto-creates the worker via the pool. On `dispose()`, the pool
is cascaded.

## Consequences

### Positive

- **Memory savings:** Low-end devices only keep active workers
  alive. Idle workers (e.g., image generation, terpene analysis)
  are reclaimed after 45 seconds.
- **Single source of truth:** All 10 worker factories are
  registered in `workerFactories.ts`. Adding a new worker is a
  one-line registration.
- **SAB enablement:** Hot-path workers automatically receive
  SAB channels when cross-origin isolation is available.
- **Telemetry:** Pool metrics are flushed to Redux DevTools via
  workerMetricsSlice and to Sentry via workerTelemetryService.
- **Spawn overhead:** Worker creation takes <15ms on modern
  hardware, acceptable for lazy spawning.

### Negative

- **First-dispatch latency:** The initial dispatch to a cold
  worker incurs spawn overhead (~10-15ms). Mitigated by
  hot-worker pre-spawning for critical paths.
- **Complexity:** One more abstraction layer between services
  and raw Web Workers.

### Neutral

- Genealogy workers use ephemeral UUID-named instances and are
  excluded from the pool by design.
- GitHub Pages deployments cannot use SAB hot-paths (no custom
  headers). Standard postMessage behavior is preserved as
  fallback.

## References

- [ADR-0007](0007-workerbus-priority-preemption.md) -- Priority
  preemption design
- [ADR-0009](0009-sharedarraybuffer-progressive-enhancement.md)
  -- SAB progressive enhancement
- [worker-bus.md](../worker-bus.md) -- Full WorkerBus reference

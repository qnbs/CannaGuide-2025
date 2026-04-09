# ADR-0007: WorkerBus Priority Preemption

**Date:** 2026-04-09
**Status:** Accepted
**Deciders:** Core team

## Context

WorkerBus (W-02 in PRIORITY_ROADMAP) dispatches jobs to Web Workers with a
priority queue, but running workers were never interrupted. When all slots
for a worker were occupied by low-priority jobs (e.g. ML inference), a
safety-critical VPD alert had to wait until the current job finished --
potentially 10-30 seconds for ONNX inference.

The requirement: critical-priority jobs must start immediately, even when
all concurrency slots are full.

Two approaches were considered:

1. **Worker.terminate() + re-create:** True thread interruption. Risks
   race conditions, lost in-flight state, and requires re-initialising
   WASM/ONNX runtimes after each terminate.

2. **Main-thread preemption via AbortController:** Remove the preempted
   job from the pending map (its eventual response is silently ignored),
   free the slot, re-queue the preempted job, and dispatch the critical
   job. The worker thread finishes the old message naturally and then
   picks up the critical message from its internal queue.

## Decision

We chose **option 2: main-thread preemption** with automatic re-queue.

Implementation details:

- `findPreemptionCandidate(workerName, incomingPriority)` finds the
  lowest-priority in-flight job (strict greater numeric value in
  `PRIORITY_VALUES`). Equal priority never triggers preemption.
- The preempted job's `PendingRequest` is removed from the pending map,
  its timer cleared, and abort listener cleaned up.
- The preempted job is re-enqueued with `preemptionCount + 1` and its
  original `resolve`/`reject` preserved, so the caller's promise resolves
  transparently when the job eventually completes.
- `MAX_PREEMPTION_RETRIES = 3` prevents infinite preemption loops. After
  3 preemptions, the job is rejected with `WorkerErrorCode.PREEMPTED`.
- `PREEMPTED` is a non-retryable error code (added to the
  `dispatchWithRetry` guard).
- Telemetry: `preemptionCount` is tracked per-worker and included in
  `getMetrics()` and `exportTelemetry()`.

## Consequences

### Positive

- Safety-critical VPD dispatches start within one message cycle
- No Worker.terminate() -- avoids WASM/ONNX re-init overhead
- Transparent to callers -- preempted job's promise resolves normally
- Bounded re-queue depth (max 3 preemptions per job)
- Full telemetry visibility for preemption events

### Negative

- Worker thread still finishes the preempted message (wasted compute)
- Preempted job's response is silently discarded (minor memory churn)
- Not true real-time preemption -- critical job waits for current
  worker message to finish before execution begins

### Neutral

- SharedArrayBuffer was explicitly not adopted -- cross-thread signaling
  is unnecessary for the current request/response worker protocol
- The 3-retry limit is a conservative default; it can be made
  configurable per-worker if needed in the future

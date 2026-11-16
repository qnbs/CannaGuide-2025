# WorkerBus instructions

Applies to `apps/web/services/worker-bus/**`.

- BUS-01: Preserve the existing channel and message contracts; update typed channels and consumers together.
- BUS-02: Treat cancellation, timeout, preemption, rate limits and completion as competing state transitions. Prevent stale responses from committing after a newer request.
- BUS-03: Bound queued work and propagate backpressure. Do not silently drop work that callers believe was accepted.
- BUS-04: Clean up listeners, timers, workers and pending promises on success, failure, cancellation and teardown.
- BUS-05: Add deterministic interleaving tests for abort races, late replies, duplicate completion and teardown; do not test only the happy path.
- BUS-06: All heavy web work goes through WorkerBus; worker implementations under apps/web/workers are not invoked directly. Keep services/worker-bus as the promise-based dispatcher and preserve priority, backpressure, abort, retry and transferable zero-copy message contracts. Do not combine automatic retries with transferred buffers: the current dispatcher reuses payload/transfer lists after postMessage detaches them; that combination is unsupported until fresh payloads per attempt are implemented and tested.

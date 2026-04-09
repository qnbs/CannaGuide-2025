# ADR-0008: WorkerBus Cross-Worker Channels + Generic Typed Dispatch

**Date:** 2026-04-10
**Status:** Accepted
**Deciders:** Core team

## Context

WorkerBus (W-04 in PRIORITY_ROADMAP) manages 9 Web Workers, but workers
could only communicate via the main thread. For example, the vision
inference worker diagnosing a leaf image could not directly request VPD
context from the simulation worker without a main-thread round-trip.
This added latency and coupling to component code.

Additionally, the `dispatch()` API accepted untyped `string` worker
names and `unknown` payloads, offering no compile-time safety for
incorrect message types or payload shapes.

Two cross-worker approaches were considered:

1. **SharedArrayBuffer:** True shared memory. Requires COOP/COEP HTTP
   headers (`Cross-Origin-Opener-Policy: same-origin`,
   `Cross-Origin-Embedder-Policy: require-corp`). Incompatible with
   CDN-hosted AI model files and third-party scripts (Sentry, analytics).
   GitHub Pages does not support custom COOP/COEP headers.

2. **MessageChannel:** Standard API that creates paired MessagePorts.
   Each port is transferred to a worker via `postMessage(..., [port])`.
   Workers communicate directly through the channel without main-thread
   involvement. No special HTTP headers required. Supported in all
   target browsers.

## Decision

**Use MessageChannel for cross-worker communication and TypeScript
method overloads for generic typed dispatch.**

### Cross-Worker Channels

- `createChannel(workerA, workerB)` creates a `MessageChannel` and
  transfers one port to each worker via a `__PORT_TRANSFER__` message.
- Channel key is `[a,b].sort().join('::')` for order-independence.
- `closeChannel()` closes both ports and removes the entry.
- Channels are automatically cleaned up on `unregister()` and `dispose()`.
- No channel telemetry -- ports communicate off main-thread so message
  counts cannot be observed without worker-side instrumentation.

### Generic Typed Dispatch

- `WorkerMessageMap` interface maps worker names to per-message-type
  payload/response pairs.
- `dispatch()` has TypeScript overloads: typed workers get compile-time
  checks, untyped workers fall through to `unknown`.
- 3 workers typed initially: `simulation`, `visionInference`,
  `hydroForecast`. Adding more is a one-line interface addition.

## Consequences

### Positive

- Workers can communicate directly without main-thread latency.
- Type errors in dispatch calls are caught at compile time.
- No COOP/COEP header dependency -- works on GitHub Pages and Netlify.
- Channel cleanup is automatic on worker lifecycle events.

### Negative

- MessageChannel ports are one-time transfer -- cannot be re-transferred.
- Channel messages are not observable from the main thread (no telemetry).
- Workers must handle the `__PORT_TRANSFER__` message type to accept ports.

### Risks

- Worker code must be updated to listen for `__PORT_TRANSFER__` messages.
  Currently, no production worker implements this handler -- channels are
  infrastructure-ready for future use.

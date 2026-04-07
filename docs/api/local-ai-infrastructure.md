# Local AI Infrastructure API Reference

> Source: `apps/web/services/LocalAIInfrastructure.ts`

The `LocalAIInfrastructure` class is the unified entry point for cache, telemetry, and preload orchestration. Exported as a singleton via `aiFacade.ts`.

---

## Overview

```
localAIInfrastructure (singleton)
    |
    +-- preload    (localAiPreloadService)
    +-- cache      (localAiCacheService -- IndexedDB)
    +-- telemetry  (localAiTelemetryService)
    +-- cross-cutting methods
```

Individual sub-services remain separate files for testability. This class is the **only** public entry point for infrastructure concerns.

---

## Cache API

IndexedDB-backed inference cache. Prevents redundant local AI calls for identical prompts.

| Setting     | Value                              |
| ----------- | ---------------------------------- |
| Max entries | 256                                |
| TTL         | 7 days                             |
| Storage     | `CannaGuideLocalAiCache` IndexedDB |

| Method                 | Signature                                                               | Description                                  |
| ---------------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| `getCachedInference`   | `(prompt: string) => Promise<string \| null>`                           | Lookup by prompt hash. Returns null on miss. |
| `setCachedInference`   | `(prompt: string, value: string, meta: {model, task}) => Promise<void>` | Store inference result with metadata.        |
| `clearPersistentCache` | `() => Promise<void>`                                                   | Wipe all cached inferences.                  |
| `getCacheSize`         | `() => Promise<number>`                                                 | Current entry count.                         |
| `getCacheBreakdown`    | `() => Promise<Record<string, number>>`                                 | Entry count per task type.                   |
| `applyCacheSettings`   | `(settings: {maxEntries?, ttlMs?}) => void`                             | Override defaults at runtime.                |
| `resetCacheDb`         | `() => void`                                                            | Reset in-memory DB handle (for recovery).    |

---

## Telemetry API

Tracks inference latency, success/failure rates, and cache hit ratios for monitoring and adaptive model selection.

| Method                        | Signature                                    | Description                                                    |
| ----------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| `createInferenceTimer`        | `() => () => number`                         | Returns a stop function that yields elapsed ms.                |
| `recordInference`             | `(record: InferenceRecord) => void`          | Log a completed inference event.                               |
| `measureInference`            | `(fn: () => Promise<T>, meta) => Promise<T>` | Wrap an async call with automatic timing + recording.          |
| `recordCacheHit`              | `() => void`                                 | Increment cache hit counter.                                   |
| `recordCacheMiss`             | `() => void`                                 | Increment cache miss counter.                                  |
| `getSnapshot`                 | `() => TelemetrySnapshot`                    | Current aggregated stats (latency, success rate, cache ratio). |
| `persistSnapshot`             | `() => Promise<void>`                        | Save snapshot to localStorage.                                 |
| `debouncedPersistSnapshot`    | `() => void`                                 | Debounced (5s) variant of persistSnapshot.                     |
| `loadPersistedSnapshot`       | `() => TelemetrySnapshot \| null`            | Restore from localStorage on boot.                             |
| `checkPerformanceDegradation` | `() => PerformanceAlert[]`                   | Detect latency spikes or error rate increases.                 |
| `resetTelemetry`              | `() => void`                                 | Clear all telemetry data.                                      |

### Types

```typescript
interface InferenceRecord {
    model: string
    task: string
    latencyMs: number
    success: boolean
    cached: boolean
    timestamp: number
}

interface TelemetrySnapshot {
    totalInferences: number
    averageLatencyMs: number
    successRate: number
    cacheHitRate: number
    modelBreakdown: Record<string, { count: number; avgLatency: number }>
}

interface PerformanceAlert {
    type: 'latency_spike' | 'error_rate' | 'memory_pressure'
    message: string
    severity: 'warning' | 'critical'
    timestamp: number
}
```

---

## Preload API

Manages local AI model preload state. Persisted to localStorage so preload status survives page reloads.

| Method / Property         | Signature                    | Description                                                                               |
| ------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `preload.isReady`         | `() => boolean`              | True when all required models are loaded. Used by routing logic (`shouldRouteLocally()`). |
| `preload.getState`        | `() => LocalAiPreloadState`  | Full preload state including per-model status.                                            |
| `preload.getStatus`       | `() => LocalAiPreloadStatus` | Summary: `'idle' \| 'loading' \| 'ready' \| 'error'`                                      |
| `ensurePersistentStorage` | `() => Promise<boolean>`     | Request persistent storage quota via `navigator.storage.persist()`.                       |

---

## Cross-Cutting Methods

These methods coordinate across cache and telemetry atomically.

#### `getCachedWithTelemetry(prompt)`

```typescript
getCachedWithTelemetry(prompt: string): Promise<string | null>
```

Looks up the inference cache and records a cache hit or miss in telemetry. Used by `localAiInferenceRouter.ts` before attempting inference.

#### `cacheAndTrack(prompt, value, meta)`

```typescript
cacheAndTrack(
    prompt: string,
    value: string,
    meta: { model: string; task: string }
): Promise<void>
```

Stores inference result in cache + triggers debounced telemetry persist. Called after a successful local inference.

#### `resetAll()`

```typescript
resetAll(): Promise<void>
```

Full reset: clears telemetry, persistent cache, and resets DB handle. Used for testing and recovery.

---

## 3-Layer Fallback Architecture

The local AI stack uses a 3-layer fallback chain:

```
1. WebLLM (WebGPU)        -- Full LLM inference (Qwen2.5, Llama, Phi)
       |
       v (fails: no WebGPU, OOM, model not loaded)
2. Transformers.js (ONNX)  -- Specialized pipelines (NLP, embeddings, vision)
       |
       v (fails: model not available)
3. Heuristics              -- Rule-based responses via localAiFallbackService
```

**GPU Resource Management:** `gpuResourceManager.ts` provides a mutex with FIFO priority queue (high/normal/low) between WebLLM and image generation. Auto-releases after 30s timeout.

**Model Catalog:** `webLlmModelCatalog.ts` maintains 4 curated models auto-selected by GPU tier:

- Qwen2.5-0.5B (low-end / WASM)
- Qwen2.5-1.5B (mid-range)
- Llama-3.2-3B (high-end)
- Phi-3.5-mini (alternative high-end)

---

## Related

- [AI Facade](ai-facade.md) -- Public API surface
- [RAG Pipeline](rag-pipeline.md) -- Journal context retrieval
- [Local AI Developer Guide](../local-ai-developer-guide.md) -- Runtime selection, streaming, diagnostics
- [Worker Bus](../worker-bus.md) -- Off-main-thread inference dispatch

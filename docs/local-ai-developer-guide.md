# Local AI Developer Guide

CannaGuide ships with a three-layer local AI stack:

- `services/localAI.ts` orchestrates model selection and fallback paths.
- `services/localAiFallbackService.ts` provides deterministic heuristic advice when the online or local model runtime is unavailable.
- `services/localAIModelLoader.ts` lazy-loads Transformers.js pipelines with automatic backend detection (WebGPU → WASM).
- `services/localAiPreloadService.ts` persists preload status for the settings UI.

## Runtime Selection

The app attempts the following order:

1. WebLLM (Qwen2.5-1.5B-Instruct) on WebGPU-capable devices.
2. Transformers.js text and vision pipelines with hybrid ONNX backend routing (WebGPU → WASM).
3. Heuristic fallback service for diagnosis and grow advice.

This keeps the app functional in offline, quota-limited, or unsupported-browser scenarios.

## Model Configuration (2026)

| Constant            | Model                               | Purpose                                              |
| ------------------- | ----------------------------------- | ---------------------------------------------------- |
| `TEXT_MODEL_ID`     | `Xenova/Qwen2.5-1.5B-Instruct`      | Primary text generation (multilingual, strong DE)    |
| `ALT_TEXT_MODEL_ID` | `Xenova/Qwen3-0.5B`                 | Ultra-light fallback for weak devices                |
| `VISION_MODEL_ID`   | `Xenova/clip-vit-large-patch14`     | Zero-shot plant condition classification (33 labels) |
| `WEBLLM_MODEL_ID`   | `Qwen2.5-1.5B-Instruct-q4f16_1-MLC` | WebGPU-backed LLM runtime                            |

## ONNX Backend Routing

The model loader (`localAIModelLoader.ts`) automatically detects the best ONNX execution provider:

1. **WebGPU** – used when `navigator.gpu` is available (modern Chrome, Edge).
2. **WASM** – universal fallback for all browsers.

`onnxruntime-web` is installed as a direct dependency (v1.21+) for stable WebGPU and WASM support.

## Adding or Replacing Models

Model identifiers are defined in `services/localAI.ts`.

- `TEXT_MODEL_ID` is the primary text runtime.
- `ALT_TEXT_MODEL_ID` is the fallback text runtime.
- `VISION_MODEL_ID` powers local photo classification.
- `WEBLLM_MODEL_ID` is the WebGPU-backed runtime.

When replacing a model:

- Keep the return shape compatible with the existing Zod schemas in `types/schemas`.
- Verify the new runtime can run in the browser without breaking offline fallback.
- Update the settings copy if the model changes storage or hardware expectations.

## Fallback Contract

The fallback service should remain deterministic.

- Diagnosis must only depend on the plant state passed into the service.
- Output must remain localized through the `Language` parameter.
- Sanitization must stay in place because mentor responses can render as HTML.

## Central AI Routing (`aiService.ts`)

All AI calls originate from `aiService.ts`, which decides whether to route to the cloud (Gemini) or the local stack:

```ts
shouldRouteLocally() → isOffline() || localAiPreloadService.isReady()
```

- When the device is offline **or** local models have been pre-loaded, requests are handled entirely on-device.
- `generateStrainImage` and `getEquipmentRecommendation` always route to Gemini (require cloud capabilities).
- The Gemini service's `shouldUseLocalFallback()` additionally checks `isReady()` before attempting local inference on API errors.

## Inference Caching & Retry

`localAI.ts` includes an LRU inference cache and retry logic:

- **Cache**: Map with max 64 entries, keyed by the first 200 characters of the prompt. Identical prompts return cached results instantly.
- **Retry**: Up to 2 retries with 500 ms exponential backoff before falling back to heuristics.
- Successful results are cached; failed attempts do not pollute the cache.

## Pipeline Cache (`localAIModelLoader.ts`)

`loadTransformersPipeline` caches pipeline promises keyed by `task::modelId`:

- Subsequent calls for the same task + model return the existing promise immediately.
- On failure, the cache entry is evicted so the next call can retry.
- Use `clearPipelineCache()` in tests to reset state between runs.

## Preload Readiness

`localAiPreloadService.ts` exposes `isReady(): boolean`:

- Returns `true` when state is `'ready'` or state is `'partial'` with the text model loaded.
- Used by both `aiService.ts` (routing) and `geminiService.ts` (fallback guard).

The `preloadOfflineModels` method accepts an optional `onProgress` callback for real-time progress reporting in the Settings UI.

## Testing Guidance

The most important tests are:

- heuristic diagnosis for VPD, pH, EC, temperature, moisture, and root health
- mentor response sanitization
- preload state persistence
- WebLLM fallback behavior when WebGPU is unavailable
- inference cache hit/miss behavior
- retry logic on transient failures

If you add a new model or runtime branch, add a matching test before merging.

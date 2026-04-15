# Local AI Developer Guide

CannaGuide ships with a three-layer local AI stack plus GPU-accelerated image generation:

- `services/localAI.ts` orchestrates model selection, streaming, and fallback paths.
- `services/localAiFallbackService.ts` provides deterministic heuristic advice when the online or local model runtime is unavailable.
- `services/localAIModelLoader.ts` lazy-loads Transformers.js pipelines with automatic backend detection (WebGPU → WASM).
- `services/localAiPreloadService.ts` persists preload status for the settings UI.
- `services/webLlmDiagnosticsService.ts` determines exactly why WebLLM is active or inactive (6-step cascade).
- `services/gpuResourceManager.ts` provides an async mutex between WebLLM and image generation GPU workloads.
- `services/imageGenerationService.ts` orchestrates SD-Turbo image generation via a Web Worker.
- `services/localAiTelemetryService.ts` tracks inference metrics and detects performance degradation.

## Runtime Selection

The app attempts the following order:

1. WebLLM (Qwen2.5-1.5B-Instruct) on WebGPU-capable devices.
2. Transformers.js text and vision pipelines with hybrid ONNX backend routing (WebGPU → WASM).
3. Heuristic fallback service for diagnosis and grow advice.

This keeps the app functional in offline, quota-limited, or unsupported-browser scenarios.

## Token Streaming

The Mentor chat supports token-by-token streaming via WebLLM's async iterable API:

```
aiService.getMentorResponseStream(plant, query, lang, onToken)
  → localAI.generateTextStream(prompt, onToken)
    → WebLLM engine.chat.completions.create({ stream: true })
```

- `onToken(token, accumulated)` is called for each chunk.
- The MentorChatView uses `requestAnimationFrame` to debounce UI updates (30-60fps).
- If streaming fails, it falls back to the batch `getMentorResponse()` path.
- Only WebLLM supports streaming. Transformers.js and heuristic fallbacks use batch mode.

## WebLLM Diagnostics

`webLlmDiagnosticsService.ts` runs a 6-step cascade to determine WebLLM availability:

1. Force WASM override check (user setting)
2. Secure Context (HTTPS or localhost)
3. WebGPU API presence (`navigator.gpu`)
4. GPU Adapter acquisition (5s timeout, `powerPreference: 'high-performance'`)
5. VRAM evaluation (minimum 4096 MB)
6. Model profile availability

Each step returns a typed `WebLlmInactiveReason` and a human-readable message. i18n keys are available via `getDiagnosticI18nKey()`.

## GPU Resource Management

`gpuResourceManager.ts` implements an async mutex between WebLLM and image generation:

- `acquireGpu('webllm' | 'image-gen')` — Blocks until the GPU is available.
- `releaseGpu(consumer)` — Releases the lock.
- When image generation needs the GPU while WebLLM holds it, the eviction hook calls `engine.unload()` to free VRAM, then rehydrates WebLLM after image gen completes.

## Performance Monitoring

`localAiTelemetryService.ts` tracks inference metrics and detects degradation:

- `checkPerformanceDegradation()` checks the last 3 non-cached inferences.
- Alerts when average tok/s drops below 2.0 (indicates VRAM swapping to RAM).
- Recommends `'downgrade-model'` for WebLLM issues or `'close-tabs'` for general pressure.

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

`onnxruntime-web` is installed as a direct dependency (v1.20.0) for stable WebGPU and WASM support.

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

## Sentry Error Attribution

All local AI failures are reported via `captureLocalAiError()` in `services/sentryService.ts`. Structured tags enable filtering in the Sentry dashboard:

| Tag            | Values                                                 | Purpose                       |
| -------------- | ------------------------------------------------------ | ----------------------------- |
| `feature`      | `local-ai`                                             | Separate from cloud AI errors |
| `ai.stage`     | `preload`, `inference`, `vision`, `webllm`, `fallback` | Identify failure layer        |
| `ai.model`     | Model ID string                                        | Track per-model error rates   |
| `ai.backend`   | `webgpu`, `wasm`                                       | Correlate backend with issues |
| `retryAttempt` | `0`, `1`, `2`                                          | Track retry depth             |

## Settings UI Integration

The `LocalAiOfflineCard` component in `SettingsView.tsx` exposes:

- **Preload button**: Triggers `localAiPreloadService.preloadOfflineModels()` with `onProgress` callback for real-time progress bar.
- **Force WASM toggle**: Calls `setForceWasm()` from `localAIModelLoader.ts` and persists setting via `setSetting({ path: 'localAi.forceWasm', value })`.
- **Model selector**: Dropdown to switch `preferredTextModel` between `auto`, `qwen2.5`, and `qwen3`.
- **Status panel**: Displays ONNX backend, WebGPU support, WebLLM readiness, persistent storage grant, last preload time, and cache state.

## Bundle Strategy

Local AI runtimes are code-split into a dedicated `ai-runtime` chunk via Vite's `manualChunks` in `vite.config.ts`:

```
@xenova/transformers + onnxruntime-web + @mlc-ai/web-llm → ai-runtime.js
```

These packages are excluded from `optimizeDeps.include` and loaded lazily via dynamic `import()` only when local AI is invoked. This keeps the initial main bundle lean.

## Zero-Shot Label Dictionary

The vision model classifies against 33 cannabis-specific labels defined in `ZERO_SHOT_LABELS`. Each label maps through `mapIssueLabel()` to localized EN/DE diagnostic text. The label set covers:

- 10 nutrient deficiencies (N, P, K, Ca, Mg, Fe, Zn, S, Mn, B)
- 7 environmental stressors (heat, light, light burn, cold, wind, nutrient burn, lockout)
- 2 watering issues (over/under)
- 9 pest/disease conditions (powdery mildew, botrytis, spider mites, fungus gnats, aphids, thrips, whiteflies, fungal leaf spot, septoria)
- 5 other (root rot, pH imbalance, revegetation stress, TMV, healthy plant)

## Breeding Tips Schema

`BreedingTipsSchema` in `types/schemas.ts` validates AI-generated crossing advice:

```ts
z.object({
    crossName: z.string().min(1).max(200),
    rationale: z.string().min(1).max(2000),
    expectedTraits: z.array(z.string().max(300)).min(1).max(10),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
})
```

Used by both the cloud Gemini service and the local AI's `getBreedingTips()` method.

- inference cache hit/miss behavior
- retry logic on transient failures

If you add a new model or runtime branch, add a matching test before merging.

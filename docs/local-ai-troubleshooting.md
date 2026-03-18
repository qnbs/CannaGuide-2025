# Local AI Troubleshooting

## Offline model preload fails

- Retry on a stable connection.
- Make sure browser storage is not full.
- Confirm that persistent storage is granted in the settings card.
- Clear the preload status and run the preload again.

## WebLLM is not available

- WebLLM requires WebGPU support.
- If WebGPU is missing, CannaGuide falls back to Transformers.js automatically.
- This is expected on many mobile browsers and older desktop GPUs.

## Slow inference performance

- Try enabling **Force WASM** in Settings → Local AI if you suspect WebGPU driver issues.
- Switch to the lightweight `Qwen3-0.5B` model for faster inference on low-end devices.
- Inference caching (LRU-64) ensures repeat queries are answered instantly. The first query for a new prompt will always be slower.

## Models keep re-downloading

- Ensure **Persistent Storage** is granted (check the status in Settings → Local AI).
- Without persistent storage, the browser may evict cached model files during storage pressure.
- Some incognito/private browsing modes do not persist IndexedDB — use a regular browser session.

## Vision classification returns no results

- The CLIP model requires a clear plant photo with adequate lighting.
- Heavily cropped or blurry images may not match any of the 33 condition labels.
- If classification consistently fails, check the browser console for ONNX runtime errors.

## Force WASM toggle has no effect

- The toggle resets the cached backend detection. It takes effect on the next pipeline load.
- If models are already loaded, they continue using the backend they were initialized with.
- To force a full reset, reload the page after toggling.

## Sentry shows local AI errors

- Local AI errors are tagged with `feature: local-ai` in Sentry.
- Check `ai.stage` to identify which layer failed (preload, inference, vision, webllm).
- `retryAttempt` indicates whether the failure occurred after retries (0 = first attempt, 2 = final attempt before heuristic fallback).
## Local diagnosis looks too generic

- The local heuristic fallback is intentionally conservative.
- It uses the current plant state, so make sure the plant data is up to date.
- If the online provider is available, compare both outputs for the current plant.

## Storage pressure or quota errors

- Reduce cached assets by clearing old archives or unused local data.
- Use a browser profile with more available storage.
- Keep the device in persistent-storage mode where the browser supports it.

## Browser compatibility

- Use a modern Chromium-based browser for the best local AI experience.
- Safari and Firefox support may be limited depending on model runtime and WebGPU availability.

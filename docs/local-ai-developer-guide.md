# Local AI Developer Guide

CannaGuide ships with a two-layer local AI stack:

- `services/localAI.ts` orchestrates model selection and fallback paths.
- `services/localAiFallbackService.ts` provides deterministic heuristic advice when the online or local model runtime is unavailable.
- `services/localAIModelLoader.ts` lazy-loads Transformers.js pipelines.
- `services/localAiPreloadService.ts` persists preload status for the settings UI.

## Runtime Selection

The app attempts the following order:

1. WebLLM on WebGPU-capable devices.
2. Transformers.js text and vision pipelines.
3. Heuristic fallback service for diagnosis and grow advice.

This keeps the app functional in offline, quota-limited, or unsupported-browser scenarios.

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

## Testing Guidance

The most important tests are:

- heuristic diagnosis for VPD, pH, EC, temperature, moisture, and root health
- mentor response sanitization
- preload state persistence
- WebLLM fallback behavior when WebGPU is unavailable

If you add a new model or runtime branch, add a matching test before merging.

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

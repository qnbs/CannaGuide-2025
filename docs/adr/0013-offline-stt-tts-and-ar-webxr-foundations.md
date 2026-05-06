# ADR-0013: Offline ONNX STT/TTS + AR/WebXR Digital-Twin Foundations

**Date:** 2026-05-06
**Status:** Proposed
**Deciders:** CannaGuide Team

## Context

`ROADMAP.md` schedules two cornerstone v2.0 features for Q3 2026:

1. **V-06 — Offline Voice Stack:** Whisper-ONNX speech-to-text and
   Piper-ONNX text-to-speech that operate entirely on-device, removing the
   current dependency on the Web Speech API (which leaks audio to the OS
   vendor and is not available in privacy-first or air-gapped scenarios).
2. **V-07 — AR/WebXR Digital Twin:** an immersive view of the simulated
   grow tent, rendered with WebXR for compatible headsets and an AR
   fallback for handhelds.

Both features are large, infrastructure-heavy bets. Shipping them in v1.9.0
would inflate the bundle, risk regressions in unrelated subsystems, and
delay the security/perf hardening release that is already complete.

We need a minimal v1.9.0 footprint — code skeletons, feature-flagged entry
points, and contract types — that lets v2.0 work continue post-tag without
a force-merge of half-finished modules into release branches.

## Decision

### 1. STT — `apps/web/services/local-ai/voice/sttService.ts`

A new typed module exposes `transcribeAudio(audio: Blob | Float32Array,
opts?: SttOptions): Promise<SttResult>`. The skeleton:

- Lives behind the existing `voice` namespace in `local-ai/`.
- Loads the Whisper-ONNX backend lazily (`whisper-tiny.en.q8.onnx`,
  ~40 MB, fetched from HuggingFace and cached by the SW ML model cache
  introduced in P1.2).
- Is gated by a build flag `VITE_FEATURE_OFFLINE_STT` (default `false`).
- When the flag is `false`, every entry point throws a typed
  `FeatureDisabledError` and the existing Web Speech path remains in
  charge.
- When the flag is `true` but the model fails to load, the service falls
  back to the Web Speech API and surfaces a Sentry breadcrumb.

### 2. TTS — `apps/web/services/local-ai/voice/ttsOfflineService.ts`

Companion module exposing `synthesizeSpeech(text: string,
voice?: PiperVoice): Promise<Blob>`. Same lazy-load + feature-flag pattern
as STT (`VITE_FEATURE_OFFLINE_TTS`), backed by `piper-en-us-amy-low.onnx`
(~25 MB).

### 3. AR/WebXR Digital Twin — `apps/web/components/views/ar/`

Skeleton route registered behind `VITE_FEATURE_AR_DIGITAL_TWIN`. Three.js
scene reuses the existing `GrowRoom3D` mesh pipeline; AR-specific
controllers (`ar-button`, `xr-hit-test`) are dynamic-imported only when
the flag is on. No bundle impact when disabled (tree-shaking proves clean
in `pnpm run analyze:bundle`).

### 4. Compile-time gating

A single `apps/web/utils/featureFlags.ts` module reads `import.meta.env`
at build time and exposes typed booleans. CI sets all flags to `false`
for release builds; experimental builds may opt in via
`VITE_FEATURE_*=true` in `.env.local`.

```ts
export const FEATURES = {
    OFFLINE_STT: import.meta.env.VITE_FEATURE_OFFLINE_STT === 'true',
    OFFLINE_TTS: import.meta.env.VITE_FEATURE_OFFLINE_TTS === 'true',
    AR_DIGITAL_TWIN: import.meta.env.VITE_FEATURE_AR_DIGITAL_TWIN === 'true',
} as const
```

Call sites:

```ts
if (FEATURES.OFFLINE_STT) {
    const { transcribeAudio } = await import('@/services/local-ai/voice/sttService')
    return transcribeAudio(audio)
}
return webSpeechFallback(audio)
```

### 5. Test scope for v1.9.0

Skeletons ship with type-only contracts and Vitest tests that assert:

- `transcribeAudio` throws `FeatureDisabledError` when the flag is `false`.
- `synthesizeSpeech` throws `FeatureDisabledError` when the flag is `false`.
- `<ARDigitalTwinView />` renders `null` when the flag is `false`.

These tests guarantee no behavioural regression to the existing voice
stack and lock the public API for v2.0 implementers.

### 6. Bundle budget

Without flags, all three modules tree-shake out. The `check-bundle-budget`
script keeps its existing limits (`Main < 300 KB`, `Vendor < 500 KB`).
With flags on, the new chunks are exempt from the main-bundle budget
because they live under the lazy-loaded `ai-runtime` chunk group already
declared in `apps/web/vite.config.ts`.

## Consequences

### Positive

- v2.0 work can land incrementally on `main` without breaking releases.
- Public typed API surface gives external contributors a stable target.
- ML model caching (P1.2 SW work) is reused, no new infrastructure.
- Feature-flag pattern is self-documenting and easy to audit.

### Negative

- Two extra .onnx model entries to manage in the SW ML cache budget
  (16 entries currently). v2.0 may need to lift the cap to 24.
- Flag flooding -- four feature flags total once Voice/AR ship; ADR-0014
  should consolidate them into a typed registry if the count keeps
  growing.

### Neutral

- ROADMAP.md gains a "v1.9.0 foundations laid" footnote alongside V-06
  and V-07.
- Documentation deltas: this ADR + a new `docs/voice-stack.md` to follow
  in v2.0.

## References

- `docs/adr/0011-local-ai-stack-restructuring.md` (parent: local AI stack)
- `docs/adr/0009-sharedarraybuffer-progressive-enhancement.md` (W-03 prereq)
- `apps/web/vite.config.ts` -- `CHUNK_GROUPS.ai-runtime`
- `apps/web/public/sw.js` -- `ML_MODEL_CACHE_NAME`

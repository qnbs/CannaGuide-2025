// ---------------------------------------------------------------------------
// Feature flags (compile-time, ADR-0013)
//
// All flags default to `false`. Enable only via `.env.local` or CI matrix
// for experimental builds. The values are inlined by Vite at build time
// (because `import.meta.env.*` is a literal substitution), so unused
// branches tree-shake cleanly.
// ---------------------------------------------------------------------------

export const FEATURES = Object.freeze({
    /** Whisper-ONNX speech-to-text (V-06.1). */
    OFFLINE_STT: import.meta.env.VITE_FEATURE_OFFLINE_STT === 'true',
    /** Piper-ONNX text-to-speech (V-06.2). */
    OFFLINE_TTS: import.meta.env.VITE_FEATURE_OFFLINE_TTS === 'true',
    /** Three.js + WebXR AR digital twin view (V-07). */
    AR_DIGITAL_TWIN: import.meta.env.VITE_FEATURE_AR_DIGITAL_TWIN === 'true',
})

export class FeatureDisabledError extends Error {
    constructor(feature: keyof typeof FEATURES) {
        super(`Feature "${feature}" is disabled. Enable VITE_FEATURE_${feature} to use it.`)
        this.name = 'FeatureDisabledError'
    }
}

// ---------------------------------------------------------------------------
// Whisper-ONNX speech-to-text skeleton (V-06.1, ADR-0013)
//
// Public, typed API surface for the offline STT pipeline. The actual
// inference path lands in v2.0; v1.9.0 ships the contract + a hard guard
// that throws `FeatureDisabledError` when the build flag is off.
// ---------------------------------------------------------------------------

import { FEATURES, FeatureDisabledError } from '@/utils/featureFlags'

export interface SttOptions {
    /** ISO 639-1 language hint (e.g. `en`, `de`). Whisper auto-detects when undefined. */
    language?: string
    /** Soft deadline in ms; the engine returns the best partial result on timeout. */
    timeoutMs?: number
}

export interface SttSegment {
    start: number
    end: number
    text: string
}

export interface SttResult {
    text: string
    language: string | null
    segments: SttSegment[]
    /** Wall-clock duration of the inference in milliseconds. */
    durationMs: number
}

/**
 * Transcribe a clip of audio fully on-device using Whisper-ONNX.
 *
 * Runtime contract:
 *   - When the flag `VITE_FEATURE_OFFLINE_STT` is `false`, this function
 *     throws `FeatureDisabledError` synchronously (test-friendly).
 *   - When the flag is `true`, the actual inference path is implemented
 *     in v2.0. The current implementation throws "not yet implemented"
 *     so build-time activation surfaces missing wiring loudly instead
 *     of pretending to succeed.
 */
export async function transcribeAudio(
    _audio: Blob | Float32Array,
    _opts: SttOptions = {},
): Promise<SttResult> {
    if (!FEATURES.OFFLINE_STT) {
        throw new FeatureDisabledError('OFFLINE_STT')
    }
    throw new Error('[sttService] Whisper-ONNX backend not yet implemented (v2.0).')
}

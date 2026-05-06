// ---------------------------------------------------------------------------
// Piper-ONNX text-to-speech skeleton (V-06.2, ADR-0013)
//
// Companion to `sttService.ts`. Same feature-flag pattern: ships in v1.9.0
// as a typed contract; the actual inference path lands in v2.0.
// ---------------------------------------------------------------------------

import { FEATURES, FeatureDisabledError } from '@/utils/featureFlags'

export type PiperVoice = 'amy-low' | 'amy-medium' | 'lessac-medium' | 'thorsten-medium'

export interface TtsOptions {
    /** ISO 639-1 language hint (`en`, `de`, …). Default chooses the matching voice. */
    language?: string
    /** Speaking rate multiplier (1 = native, 0.75 = slower, 1.25 = faster). */
    rate?: number
    /** Voice pack to use. Defaults to `amy-low` for the smallest footprint. */
    voice?: PiperVoice
}

/**
 * Synthesise speech audio from text fully on-device using Piper-ONNX.
 *
 * Runtime contract mirrors {@link transcribeAudio}: feature-flag guard
 * first, "not implemented" hard error second. Returns a `Blob` so it can
 * be piped straight to `URL.createObjectURL` for `<audio>` playback.
 */
export async function synthesizeSpeech(
    _text: string,
    _opts: TtsOptions = {},
): Promise<Blob> {
    if (!FEATURES.OFFLINE_TTS) {
        throw new FeatureDisabledError('OFFLINE_TTS')
    }
    throw new Error('[ttsOfflineService] Piper-ONNX backend not yet implemented (v2.0).')
}

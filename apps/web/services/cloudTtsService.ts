// ---------------------------------------------------------------------------
// Cloud TTS Service -- ElevenLabs (v1.8 CannaVoice Pro)
// ---------------------------------------------------------------------------
// BYOK Cloud TTS provider implementing ITTSProvider. API key encrypted at rest
// via cryptoService, decrypted only in-memory for each request. Privacy-first:
// key never leaves the client. Rate-limited to 5 req/min.
// ---------------------------------------------------------------------------

import * as Sentry from '@sentry/browser'
import type { ITTSProvider, Language, TTSSettings } from '@/types'
import { CLOUD_TTS_MAX_CHARS, CLOUD_TTS_TIMEOUT_MS, CLOUD_TTS_RATE_LIMIT } from '@/constants'
import { decrypt } from '@/services/cryptoService'

/** Default ElevenLabs voice IDs per language. */
const DEFAULT_VOICE_IDS: Record<Language, string> = {
    en: '21m00Tcm4TlvDq8ikWAM', // Rachel
    de: '21m00Tcm4TlvDq8ikWAM',
    es: '21m00Tcm4TlvDq8ikWAM',
    fr: '21m00Tcm4TlvDq8ikWAM',
    nl: '21m00Tcm4TlvDq8ikWAM',
}

/** Sliding-window rate limiter timestamps. */
const requestTimestamps: number[] = []

function isRateLimited(): boolean {
    const now = Date.now()
    const windowMs = 60_000
    // Prune old entries
    while (requestTimestamps.length > 0 && (requestTimestamps[0] ?? 0) < now - windowMs) {
        requestTimestamps.shift()
    }
    return requestTimestamps.length >= CLOUD_TTS_RATE_LIMIT
}

function recordRequest(): void {
    requestTimestamps.push(Date.now())
}

/** Active AudioContext + source for cancellation. */
let activeAudioContext: AudioContext | null = null
let activeSource: AudioBufferSourceNode | null = null
let activeAbortController: AbortController | null = null

class CloudTtsService implements ITTSProvider {
    readonly providerName = 'elevenlabs'

    private encryptedApiKey: string | null = null
    private selectedVoiceId: string | null = null

    /** Configure the encrypted API key (from settings). */
    setEncryptedApiKey(key: string | null): void {
        this.encryptedApiKey = key
    }

    /** Set preferred voice ID. */
    setVoiceId(voiceId: string | null): void {
        this.selectedVoiceId = voiceId
    }

    isSupported(): boolean {
        return this.encryptedApiKey !== null && typeof AudioContext !== 'undefined'
    }

    init(): void {
        // No-op: cloud TTS needs no initialisation
    }

    getVoices(_lang: Language): SpeechSynthesisVoice[] {
        // Cloud TTS voices are fetched via API, not SpeechSynthesis
        return []
    }

    speak(text: string, lang: Language, onEnd: () => void, _settings: TTSSettings): void {
        void this.speakAsync(text, lang, onEnd)
    }

    cancel(): void {
        try {
            activeAbortController?.abort()
            activeAbortController = null
            activeSource?.stop()
            activeSource?.disconnect()
            activeSource = null
            void activeAudioContext?.close()
            activeAudioContext = null
        } catch {
            // Ignore cleanup errors
        }
    }

    pause(): void {
        void activeAudioContext?.suspend()
    }

    resume(): void {
        void activeAudioContext?.resume()
    }

    private async speakAsync(text: string, lang: Language, onEnd: () => void): Promise<void> {
        if (!this.encryptedApiKey) {
            onEnd()
            return
        }

        if (isRateLimited()) {
            console.debug('[CloudTTS] Rate limited, falling back to onEnd')
            onEnd()
            return
        }

        // Truncate to max chars
        const truncatedText =
            text.length > CLOUD_TTS_MAX_CHARS ? text.slice(0, CLOUD_TTS_MAX_CHARS) : text

        try {
            // Decrypt API key in-memory (never persisted in plain text)
            const apiKey = await decrypt(this.encryptedApiKey)
            if (!apiKey) {
                console.debug('[CloudTTS] Failed to decrypt API key')
                onEnd()
                return
            }

            const voiceId = this.selectedVoiceId ?? DEFAULT_VOICE_IDS[lang] ?? DEFAULT_VOICE_IDS.en

            // Setup abort controller with timeout
            activeAbortController = new AbortController()
            const timeoutId = setTimeout(() => activeAbortController?.abort(), CLOUD_TTS_TIMEOUT_MS)

            recordRequest()

            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'xi-api-key': apiKey,
                    },
                    body: JSON.stringify({
                        text: truncatedText,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                        },
                    }),
                    signal: activeAbortController.signal,
                },
            )

            clearTimeout(timeoutId)

            if (!response.ok) {
                console.debug(`[CloudTTS] API error: ${String(response.status)}`)
                onEnd()
                return
            }

            const arrayBuffer = await response.arrayBuffer()

            // Play audio via Web Audio API
            activeAudioContext = new AudioContext()
            const audioBuffer = await activeAudioContext.decodeAudioData(arrayBuffer)

            activeSource = activeAudioContext.createBufferSource()
            activeSource.buffer = audioBuffer
            activeSource.connect(activeAudioContext.destination)

            activeSource.onended = () => {
                activeSource = null
                void activeAudioContext?.close()
                activeAudioContext = null
                onEnd()
            }

            activeSource.start()
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                console.debug('[CloudTTS] Request aborted')
            } else {
                console.error('[CloudTTS] Speak error:', err instanceof Error ? err.message : err)
                Sentry.captureException(err, { tags: { service: 'cloudTts' } })
            }
            activeSource = null
            void activeAudioContext?.close()
            activeAudioContext = null
            onEnd()
        }
    }
}

/** Singleton Cloud TTS service. */
export const cloudTtsService = new CloudTtsService()

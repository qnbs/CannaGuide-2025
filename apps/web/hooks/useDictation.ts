/**
 * useDictation.ts
 *
 * React hook for on-demand speech-to-text dictation.
 * Starts/stops a SpeechRecognition session and accumulates the transcript.
 * Used by LogActionModal for hands-free note entry.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppSelector } from '@/stores/store'
import { selectLanguage } from '@/stores/selectors'

// Re-use the same Web Speech API types as VoiceControl.tsx
interface WDictationRecognitionResult {
    readonly isFinal: boolean
    readonly length: number
    [index: number]: { transcript: string; confidence: number }
}
interface WDictationRecognitionResultList {
    readonly length: number
    [index: number]: WDictationRecognitionResult
}
interface WDictationRecognitionEvent extends Event {
    readonly results: WDictationRecognitionResultList
}
interface WDictationRecognitionErrorEvent extends Event {
    readonly error: string
}
interface WDictationRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    addEventListener(type: 'result', listener: (event: WDictationRecognitionEvent) => void): void
    addEventListener(
        type: 'error',
        listener: (event: WDictationRecognitionErrorEvent) => void,
    ): void
    addEventListener(type: 'end', listener: () => void): void
    removeEventListener(type: 'result', listener: (event: WDictationRecognitionEvent) => void): void
    removeEventListener(
        type: 'error',
        listener: (event: WDictationRecognitionErrorEvent) => void,
    ): void
    removeEventListener(type: 'end', listener: () => void): void
    start(): void
    stop(): void
    abort(): void
}
type WDictationRecognitionCtor = { new (): WDictationRecognition }

const getSpeechRecognitionAPI = (): WDictationRecognitionCtor | undefined =>
    (window as Window & { SpeechRecognition?: WDictationRecognitionCtor }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: WDictationRecognitionCtor })
        .webkitSpeechRecognition

export const isDictationSupported =
    typeof (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition === 'function' ||
    typeof (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition ===
        'function'

export interface UseDictationReturn {
    /** Whether dictation is currently active. */
    isListening: boolean
    /** The interim + final transcript accumulated so far. */
    transcript: string
    /** Error message if dictation failed, null otherwise. */
    error: string | null
    /** Start dictation. Safe to call when already listening. */
    start: () => void
    /** Stop dictation and keep the transcript. */
    stop: () => void
    /** Reset transcript and error to empty state. */
    reset: () => void
}

export function useDictation(onTranscript?: (text: string) => void): UseDictationReturn {
    const lang = useAppSelector(selectLanguage)
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [error, setError] = useState<string | null>(null)
    const recognitionRef = useRef<WDictationRecognition | null>(null)
    const onTranscriptRef = useRef(onTranscript)

    // Keep callback ref current without re-creating recognition
    useEffect(() => {
        onTranscriptRef.current = onTranscript
    }, [onTranscript])

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
    }, [])

    const reset = useCallback(() => {
        setTranscript('')
        setError(null)
    }, [])

    const start = useCallback(() => {
        const SpeechRecognitionAPI = getSpeechRecognitionAPI()
        if (!SpeechRecognitionAPI) return
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort()
            } catch {
                // ignore
            }
        }

        const rec = new SpeechRecognitionAPI()
        rec.continuous = true
        rec.interimResults = true
        rec.lang = lang === 'de' ? 'de-DE' : 'en-US'

        rec.addEventListener('result', (event: WDictationRecognitionEvent) => {
            let full = ''
            for (let i = 0; i < event.results.length; i++) {
                const item = event.results[i]
                if (!item) continue
                const first = item[0]
                if (first) {
                    full += first.transcript
                }
            }
            setTranscript(full)
            // Call callback on final results only
            const latest = event.results[event.results.length - 1]
            if (latest?.isFinal) {
                onTranscriptRef.current?.(full)
            }
        })

        rec.addEventListener('error', (event: WDictationRecognitionErrorEvent) => {
            console.debug('[useDictation] error:', event.error)
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setError('notAllowed')
            } else if (event.error === 'no-speech') {
                setError('noSpeech')
            } else {
                setError('generic')
            }
            setIsListening(false)
        })

        rec.addEventListener('end', () => {
            setIsListening(false)
        })

        recognitionRef.current = rec
        setError(null)

        try {
            rec.start()
            setIsListening(true)
        } catch {
            console.debug('[useDictation] failed to start')
            setError('generic')
            setIsListening(false)
        }
    }, [lang])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
                recognitionRef.current = null
            }
        }
    }, [])

    return { isListening, transcript, error, start, stop, reset }
}

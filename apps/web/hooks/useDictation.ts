/**
 * useDictation.ts
 *
 * React hook for on-demand speech-to-text dictation.
 * Starts/stops a SpeechRecognition session and accumulates the transcript.
 * Used by LogActionModal for hands-free note entry.
 */
import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { useAppSelector } from '@/stores/store'
import { selectLanguage, selectLocalOnlyMode } from '@/stores/selectors'

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

/** The text of every result so far, in order (first alternative of each). */
function joinTranscript(results: WDictationRecognitionResultList): string {
    let full = ''
    for (let i = 0; i < results.length; i++) {
        full += results[i]?.[0]?.transcript ?? ''
    }
    return full
}

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
    // Browser speech recognition may process the audio online, so Local-Only
    // Mode keeps dictation off and stops a running one (GH #717).
    const localOnly = useAppSelector(selectLocalOnlyMode)
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

    const startRecognition = useCallback(() => {
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

        // A replaced or aborted recognizer can still fire (an async 'aborted'
        // error, a late 'end'); only the current one may change the state.
        const isCurrent = (): boolean => recognitionRef.current === rec

        rec.addEventListener('result', (event: WDictationRecognitionEvent) => {
            if (!isCurrent()) return
            const full = joinTranscript(event.results)
            setTranscript(full)
            // Call callback on final results only
            const latest = event.results[event.results.length - 1]
            if (latest?.isFinal) {
                onTranscriptRef.current?.(full)
            }
        })

        rec.addEventListener('error', (event: WDictationRecognitionErrorEvent) => {
            if (!isCurrent()) return
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
            if (isCurrent()) setIsListening(false)
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

    const start = useCallback(() => {
        if (localOnly) setError('localOnly')
        else startRecognition()
    }, [localOnly, startRecognition])

    // A layout effect, so the recognizer stops in the commit of the switch: a
    // passive effect would leave a gap in which it keeps listening and a queued
    // result still counts as current and overwrites the note.
    useLayoutEffect(() => {
        if (!localOnly || !recognitionRef.current) return
        recognitionRef.current.abort()
        recognitionRef.current = null
        setIsListening(false)
        setError('localOnly')
    }, [localOnly])

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

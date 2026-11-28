import { useEffect } from 'react'
import { voiceTelemetryService } from '@/services/voiceTelemetryService'
import {
    abortSpeechRecognition,
    HOTWORD_REGEX,
    recognitionLang,
    SpeechRecognitionAPI,
    wakeWordAllowed,
    type WSpeechRecognition,
    type WSpeechRecognitionErrorEvent,
    type WSpeechRecognitionEvent,
} from './voiceRecognition'

type Ref<T> = { current: T }

interface UseRegexHotwordOptions {
    wakeWordEngine: string
    isAvailable: boolean
    isListening: boolean
    hotwordEnabled: boolean
    speechBlocked: boolean
    speechConsentGranted: boolean
    lang: string
    activateFromHotword: () => void
    handleError: (event: WSpeechRecognitionErrorEvent) => void
    enqueuePorcupine: (step: () => Promise<unknown>) => void
    releasePorcupine: () => Promise<void>
    setVoiceListening: (listening: boolean) => void
    setVoiceStatusMessage: (message: string | null) => void
    translate: (key: string) => string
    speechBlockedRef: Ref<boolean>
    speechConsentRef: Ref<boolean>
    isListeningRef: Ref<boolean>
    porcupineWasScheduledRef: Ref<boolean>
    hotwordRecRef: Ref<WSpeechRecognition | null>
    hotwordCleanupRef: Ref<(() => void) | null>
}

/** Owns the browser hotword recognizer and its recoverable restart lifecycle. */
export const useRegexHotword = ({
    wakeWordEngine,
    isAvailable,
    isListening,
    hotwordEnabled,
    speechBlocked,
    speechConsentGranted,
    lang,
    activateFromHotword,
    handleError,
    enqueuePorcupine,
    releasePorcupine,
    setVoiceListening,
    setVoiceStatusMessage,
    translate,
    speechBlockedRef,
    speechConsentRef,
    isListeningRef,
    porcupineWasScheduledRef,
    hotwordRecRef,
    hotwordCleanupRef,
}: UseRegexHotwordOptions): void => {
    useEffect(() => {
        if (
            wakeWordEngine !== 'regex' ||
            !SpeechRecognitionAPI ||
            !wakeWordAllowed(
                hotwordEnabled,
                isAvailable,
                speechBlocked || !speechConsentGranted || isListening,
            )
        ) {
            const stopHotword = hotwordCleanupRef.current
            if (stopHotword) stopHotword()
            else {
                hotwordRecRef.current?.abort()
                hotwordRecRef.current = null
            }
            return
        }

        let stopped = false
        let restartDelayMs = 200
        let retryAfterError = false
        let restartTimer: ReturnType<typeof setTimeout> | null = null

        const startHotword = () => {
            if (
                stopped ||
                speechBlockedRef.current ||
                !speechConsentRef.current ||
                isListeningRef.current ||
                !SpeechRecognitionAPI
            )
                return
            const recognition = new SpeechRecognitionAPI()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = recognitionLang(lang)

            const onResult = (event: WSpeechRecognitionEvent) => {
                if (
                    stopped ||
                    speechBlockedRef.current ||
                    !speechConsentRef.current ||
                    isListeningRef.current
                )
                    return
                restartDelayMs = 200
                retryAfterError = false
                for (let i = 0; i < event.results.length; i++) {
                    const item = event.results[i]
                    const first = item?.[0]
                    if (first && HOTWORD_REGEX.test(first.transcript)) {
                        voiceTelemetryService.recordVoiceEvent('hotwordDetected', {
                            engine: 'regex',
                        })
                        activateFromHotword()
                        return
                    }
                }
            }

            const onEnd = () => {
                if (
                    stopped ||
                    speechBlockedRef.current ||
                    !speechConsentRef.current ||
                    isListeningRef.current
                )
                    return
                const delay = retryAfterError ? restartDelayMs : 200
                if (retryAfterError) restartDelayMs = Math.min(restartDelayMs * 2, 5_000)
                retryAfterError = false
                restartTimer = setTimeout(() => {
                    restartTimer = null
                    startHotword()
                }, delay)
            }

            let disposeRecognition = (): void => undefined
            const onError = (event: WSpeechRecognitionErrorEvent) => {
                if (stopped || speechBlockedRef.current || !speechConsentRef.current) return
                if (
                    event.error === 'not-allowed' ||
                    event.error === 'service-not-allowed' ||
                    event.error === 'audio-capture' ||
                    event.error === 'language-not-supported'
                ) {
                    disposeRecognition()
                } else {
                    retryAfterError = true
                }
                handleError(event)
            }

            disposeRecognition = () => {
                stopped = true
                if (restartTimer !== null) {
                    clearTimeout(restartTimer)
                    restartTimer = null
                }
                abortSpeechRecognition(recognition, onResult, onError, onEnd)
                if (hotwordRecRef.current === recognition) hotwordRecRef.current = null
                if (hotwordCleanupRef.current === disposeRecognition) {
                    hotwordCleanupRef.current = null
                }
            }

            recognition.addEventListener('result', onResult)
            recognition.addEventListener('error', onError)
            recognition.addEventListener('end', onEnd)
            hotwordCleanupRef.current = disposeRecognition

            try {
                recognition.start()
                if (!stopped) hotwordRecRef.current = recognition
            } catch {
                console.debug('[VoiceControl] Hotword recognizer failed to start')
                disposeRecognition()
                setVoiceStatusMessage(translate('common.voiceControl.errors.startFailed'))
                setVoiceListening(false)
            }
        }

        if (porcupineWasScheduledRef.current) {
            enqueuePorcupine(async () => {
                await releasePorcupine()
                startHotword()
            })
        } else {
            startHotword()
        }

        return () => {
            stopped = true
            const stopHotword = hotwordCleanupRef.current
            if (stopHotword) stopHotword()
            else {
                hotwordRecRef.current?.abort()
                hotwordRecRef.current = null
            }
        }
    }, [
        wakeWordEngine,
        isAvailable,
        isListening,
        hotwordEnabled,
        speechBlocked,
        speechConsentGranted,
        lang,
        activateFromHotword,
        handleError,
        enqueuePorcupine,
        releasePorcupine,
        setVoiceListening,
        setVoiceStatusMessage,
        translate,
        speechBlockedRef,
        speechConsentRef,
        isListeningRef,
        porcupineWasScheduledRef,
        hotwordRecRef,
        hotwordCleanupRef,
    ])
}

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { selectLanguage, selectSettings } from '@/stores/selectors'
import { useUIStore } from '@/stores/useUIStore'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from './Button'

// Web Speech API – not yet fully standardized in TypeScript's DOM lib
interface WSpeechRecognitionResult {
    readonly isFinal: boolean
    readonly length: number
    [index: number]: { transcript: string; confidence: number }
}
interface WSpeechRecognitionResultList {
    readonly length: number
    [index: number]: WSpeechRecognitionResult
}
interface WSpeechRecognitionEvent extends Event {
    readonly results: WSpeechRecognitionResultList
}
interface WSpeechRecognitionErrorEvent extends Event {
    readonly error: string
}
interface WSpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    addEventListener(type: 'result', listener: (event: WSpeechRecognitionEvent) => void): void
    addEventListener(type: 'error', listener: (event: WSpeechRecognitionErrorEvent) => void): void
    addEventListener(type: 'end', listener: () => void): void
    removeEventListener(type: 'result', listener: (event: WSpeechRecognitionEvent) => void): void
    removeEventListener(
        type: 'error',
        listener: (event: WSpeechRecognitionErrorEvent) => void,
    ): void
    removeEventListener(type: 'end', listener: () => void): void
    start(): void
    stop(): void
    abort(): void
}
type WSpeechRecognitionCtor = { new (): WSpeechRecognition }

const SpeechRecognitionAPI: WSpeechRecognitionCtor | undefined =
    (window as Window & { SpeechRecognition?: WSpeechRecognitionCtor }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: WSpeechRecognitionCtor })
        .webkitSpeechRecognition
const hasSpeechRecognitionSupport = typeof SpeechRecognitionAPI === 'function'

/** Regex that matches "hey canna" or "hey cannaguide" (case-insensitive). */
const HOTWORD_REGEX = /hey\s+canna(?:guide)?/i

/** Duration (ms) the command listener stays active after hotword detection. */
const HOTWORD_ACTIVATION_MS = 5_000

export const VoiceControl: React.FC = () => {
    const { t } = useTranslation()
    const lang = useAppSelector(selectLanguage)
    const settings = useAppSelector(selectSettings)
    const hotwordEnabled = settings.voiceControl.hotwordEnabled
    const isListening = useUIStore((s) => s.voiceControl.isListening)
    const isAvailable = useUIStore((s) => s.voiceControl.isAvailable)
    const statusMessage = useUIStore((s) => s.voiceControl.statusMessage)
    const setVoiceListening = useUIStore((s) => s.setVoiceListening)
    const setVoiceStatusMessage = useUIStore((s) => s.setVoiceStatusMessage)
    const processVoiceCommand = useUIStore((s) => s.processVoiceCommand)
    const recognitionRef = useRef<WSpeechRecognition | null>(null)

    // Hotword listener state
    const hotwordRecRef = useRef<WSpeechRecognition | null>(null)
    const hotwordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [hotwordActive, setHotwordActive] = useState(false)

    const handleResult = useCallback(
        (event: WSpeechRecognitionEvent) => {
            const latest = event.results[event.results.length - 1]
            if (!latest) return
            const firstResult = latest[0]
            if (!firstResult) return
            const transcript = firstResult.transcript.trim()
            if (latest && !latest.isFinal) {
                setVoiceStatusMessage(t('voiceControl.processing', { transcript }))
                return
            }
            if (transcript) {
                setVoiceStatusMessage(t('voiceControl.processing', { transcript }))
                processVoiceCommand(transcript)
            }
            // Stop listening after a command is processed
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        },
        [setVoiceStatusMessage, processVoiceCommand, t],
    )

    const handleError = useCallback(
        (event: WSpeechRecognitionErrorEvent) => {
            console.debug('Speech recognition error:', event.error)
            let errorMessageKey = 'voiceControl.errors.generic'
            if (event.error === 'no-speech') {
                errorMessageKey = 'voiceControl.errors.noSpeech'
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                errorMessageKey = 'voiceControl.errors.notAllowed'
            }
            setVoiceStatusMessage(t(errorMessageKey))
            setVoiceListening(false)
            setTimeout(() => setVoiceStatusMessage(null), 4000)
        },
        [setVoiceStatusMessage, setVoiceListening, t],
    )

    const handleEnd = useCallback(() => {
        setVoiceListening(false)
        setVoiceStatusMessage(null)
    }, [setVoiceListening, setVoiceStatusMessage])

    useEffect(() => {
        if (!isAvailable || !hasSpeechRecognitionSupport) return

        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = false
        recognition.interimResults = true

        recognition.addEventListener('result', handleResult)
        recognition.addEventListener('error', handleError)
        recognition.addEventListener('end', handleEnd)

        recognitionRef.current = recognition

        return () => {
            if (recognition) {
                recognition.removeEventListener('result', handleResult)
                recognition.removeEventListener('error', handleError)
                recognition.removeEventListener('end', handleEnd)
                recognition.abort()
                recognitionRef.current = null
            }
        }
    }, [isAvailable, handleResult, handleError, handleEnd])

    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = lang === 'de' ? 'de-DE' : 'en-US'
        }
    }, [lang])

    // ---------------------------------------------------------------------------
    // V-03: Hotword Wake Detection
    // Runs a second continuous SpeechRecognition instance that listens passively
    // for "hey canna(guide)?". When detected, the command listener activates for
    // HOTWORD_ACTIVATION_MS milliseconds then goes silent again.
    // ---------------------------------------------------------------------------
    const activateFromHotword = useCallback(() => {
        setHotwordActive(true)
        setVoiceStatusMessage(t('voiceControl.hotwordDetected'))
        if (hotwordTimerRef.current !== null) {
            clearTimeout(hotwordTimerRef.current)
        }
        hotwordTimerRef.current = setTimeout(() => {
            setHotwordActive(false)
            setVoiceStatusMessage(null)
        }, HOTWORD_ACTIVATION_MS)

        // Start main command listener
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start()
                setVoiceListening(true)
            } catch {
                // already started or unavailable -- ignore
            }
        }
    }, [t, isListening, setVoiceStatusMessage, setVoiceListening])

    useEffect(() => {
        if (!isAvailable || !hasSpeechRecognitionSupport || !hotwordEnabled) {
            if (hotwordRecRef.current) {
                hotwordRecRef.current.abort()
                hotwordRecRef.current = null
            }
            return
        }

        let stopped = false

        const startHotword = () => {
            if (stopped || !hasSpeechRecognitionSupport) return
            const hw = new SpeechRecognitionAPI()
            hw.continuous = true
            hw.interimResults = true
            hw.lang = lang === 'de' ? 'de-DE' : 'en-US'

            const onResult = (event: WSpeechRecognitionEvent) => {
                for (let i = 0; i < event.results.length; i++) {
                    const item = event.results[i]
                    if (!item) continue
                    const first = item[0]
                    if (!first) continue
                    if (HOTWORD_REGEX.test(first.transcript)) {
                        activateFromHotword()
                        return
                    }
                }
            }

            const onEnd = () => {
                // Auto-restart so the hotword listener stays alive
                if (!stopped) {
                    setTimeout(() => startHotword(), 200)
                }
            }

            hw.addEventListener('result', onResult)
            hw.addEventListener('end', onEnd)

            try {
                hw.start()
                hotwordRecRef.current = hw
            } catch {
                console.debug('[VoiceControl] Hotword recognizer failed to start')
            }
        }

        startHotword()

        return () => {
            stopped = true
            if (hotwordTimerRef.current !== null) {
                clearTimeout(hotwordTimerRef.current)
            }
            if (hotwordRecRef.current) {
                hotwordRecRef.current.abort()
                hotwordRecRef.current = null
            }
        }
    }, [isAvailable, hotwordEnabled, lang, activateFromHotword])

    const toggleListening = () => {
        if (!isAvailable || !hasSpeechRecognitionSupport || !recognitionRef.current) return

        if (isListening) {
            recognitionRef.current.stop()
        } else {
            try {
                recognitionRef.current.start()
                setVoiceListening(true)
                setVoiceStatusMessage(t('voiceControl.listening'))
            } catch (e) {
                console.debug('Error starting recognition:', e)
                // This can happen if recognition is already started, so we defensively stop it.
                try {
                    recognitionRef.current.stop()
                } catch {
                    // Ignore errors on stopping if it was already stopped.
                }
                setVoiceStatusMessage(t('voiceControl.errors.startFailed'))
                setVoiceListening(false)
            }
        }
    }

    if (!isAvailable || !hasSpeechRecognitionSupport) {
        return null
    }

    return (
        <div className="relative inline-flex items-center">
            <Button
                variant="ghost"
                className={`!p-2 rounded-full transition-colors duration-200 ${
                    isListening || hotwordActive
                        ? 'text-red-400 animate-pulse bg-red-500/20'
                        : 'text-slate-300 hover:text-slate-100'
                }`}
                onClick={toggleListening}
                title={t('voiceControl.toggle')}
                aria-label={t('voiceControl.toggle')}
                aria-pressed={isListening}
            >
                <PhosphorIcons.Microphone className="w-6 h-6" />
            </Button>
            {/* Screen-reader live region for voice status updates */}
            <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {statusMessage ?? ''}
            </span>
        </div>
    )
}

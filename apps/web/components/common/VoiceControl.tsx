import React, { useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { selectLanguage } from '@/stores/selectors'
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

export const VoiceControl: React.FC = () => {
    const { t } = useTranslation()
    const lang = useAppSelector(selectLanguage)
    const isListening = useUIStore((s) => s.voiceControl.isListening)
    const isAvailable = useUIStore((s) => s.voiceControl.isAvailable)
    const setVoiceListening = useUIStore((s) => s.setVoiceListening)
    const setVoiceStatusMessage = useUIStore((s) => s.setVoiceStatusMessage)
    const processVoiceCommand = useUIStore((s) => s.processVoiceCommand)
    const recognitionRef = useRef<WSpeechRecognition | null>(null)

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
        <Button
            variant="ghost"
            className={`!p-2 rounded-full transition-colors duration-200 ${
                isListening
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
    )
}

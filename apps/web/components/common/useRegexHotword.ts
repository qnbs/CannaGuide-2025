import { useEffect, useLayoutEffect, useRef } from 'react'
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
    recoveryRevision: number
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

type RegexHotwordSessionOptions = Pick<
    UseRegexHotwordOptions,
    | 'lang'
    | 'activateFromHotword'
    | 'handleError'
    | 'setVoiceListening'
    | 'setVoiceStatusMessage'
    | 'translate'
    | 'speechBlockedRef'
    | 'speechConsentRef'
    | 'isListeningRef'
    | 'hotwordRecRef'
    | 'hotwordCleanupRef'
>

type RegexHotwordGateOptions = Pick<
    UseRegexHotwordOptions,
    | 'wakeWordEngine'
    | 'isAvailable'
    | 'isListening'
    | 'hotwordEnabled'
    | 'speechBlocked'
    | 'speechConsentGranted'
>

type RegexHotwordStartOptions = RegexHotwordSessionOptions &
    Pick<
        UseRegexHotwordOptions,
        'enqueuePorcupine' | 'releasePorcupine' | 'porcupineWasScheduledRef'
    >

const terminalError = (error: string): boolean =>
    ['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'].includes(
        error,
    )

class RegexHotwordSession {
    private stopped = false
    private restartDelayMs = 200
    private retryAfterError = false
    private restartTimer: ReturnType<typeof setTimeout> | null = null
    private recognition: WSpeechRecognition | null = null
    private listeners: {
        result: (event: WSpeechRecognitionEvent) => void
        error: (event: WSpeechRecognitionErrorEvent) => void
        end: () => void
    } | null = null
    private cleanup: (() => void) | null = null

    constructor(private readonly options: RegexHotwordSessionOptions) {}

    setCleanup(cleanup: () => void): void {
        this.cleanup = cleanup
    }

    start(): void {
        if (!this.isAllowed() || !SpeechRecognitionAPI) return
        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = recognitionLang(this.options.lang)
        this.recognition = recognition
        this.listeners = {
            result: (event) => this.handleResult(event),
            error: (event) => this.handleError(event),
            end: () => this.handleEnd(),
        }
        recognition.addEventListener('result', this.listeners.result)
        recognition.addEventListener('error', this.listeners.error)
        recognition.addEventListener('end', this.listeners.end)
        this.options.hotwordRecRef.current = recognition

        try {
            recognition.start()
        } catch {
            console.debug('[VoiceControl] Hotword recognizer failed to start')
            this.stop()
            this.options.setVoiceStatusMessage(
                this.options.translate('common.voiceControl.errors.startFailed'),
            )
            this.options.setVoiceListening(false)
        }
    }

    stop(): void {
        this.stopped = true
        if (this.restartTimer !== null) clearTimeout(this.restartTimer)
        this.restartTimer = null
        this.detachRecognition(true)
        if (this.options.hotwordCleanupRef.current === this.cleanup) {
            this.options.hotwordCleanupRef.current = null
        }
    }

    private isAllowed(): boolean {
        const { speechBlockedRef, speechConsentRef, isListeningRef } = this.options
        return (
            !this.stopped &&
            !speechBlockedRef.current &&
            speechConsentRef.current &&
            !isListeningRef.current
        )
    }

    private handleResult(event: WSpeechRecognitionEvent): void {
        if (!this.isAllowed()) return
        this.restartDelayMs = 200
        this.retryAfterError = false
        for (const result of Array.from(
            { length: event.results.length },
            (_, index) => event.results[index],
        )) {
            const transcript = result?.[0]?.transcript
            if (!transcript || !HOTWORD_REGEX.test(transcript)) continue
            voiceTelemetryService.recordVoiceEvent('hotwordDetected', { engine: 'regex' })
            this.options.activateFromHotword()
            return
        }
    }

    private handleError(event: WSpeechRecognitionErrorEvent): void {
        if (!this.isAllowed()) return
        if (terminalError(event.error)) this.stop()
        else this.retryAfterError = true
        this.options.handleError(event)
    }

    private handleEnd(): void {
        if (!this.isAllowed()) {
            this.detachRecognition(false)
            return
        }
        const delay = this.retryAfterError ? this.restartDelayMs : 200
        if (this.retryAfterError) this.restartDelayMs = Math.min(this.restartDelayMs * 2, 5_000)
        this.retryAfterError = false
        this.detachRecognition(false)
        this.restartTimer = setTimeout(() => {
            this.restartTimer = null
            this.start()
        }, delay)
    }

    private detachRecognition(abort: boolean): void {
        const recognition = this.recognition
        const listeners = this.listeners
        this.recognition = null
        this.listeners = null
        if (!recognition || !listeners) return
        if (abort)
            abortSpeechRecognition(recognition, listeners.result, listeners.error, listeners.end)
        else {
            recognition.removeEventListener('result', listeners.result)
            recognition.removeEventListener('error', listeners.error)
            recognition.removeEventListener('end', listeners.end)
        }
        if (this.options.hotwordRecRef.current === recognition) {
            this.options.hotwordRecRef.current = null
        }
    }
}

const canRunRegexHotword = (options: RegexHotwordGateOptions): boolean =>
    options.wakeWordEngine === 'regex' &&
    Boolean(SpeechRecognitionAPI) &&
    wakeWordAllowed(
        options.hotwordEnabled,
        options.isAvailable,
        options.speechBlocked || !options.speechConsentGranted || options.isListening,
    )

const stopRegexHotword = (
    options: Pick<UseRegexHotwordOptions, 'hotwordCleanupRef' | 'hotwordRecRef'>,
): void => {
    const stopHotword = options.hotwordCleanupRef.current
    if (stopHotword) stopHotword()
    else {
        options.hotwordRecRef.current?.abort()
        options.hotwordRecRef.current = null
    }
}

const startRegexHotword = (options: RegexHotwordStartOptions): (() => void) => {
    const session = new RegexHotwordSession({
        lang: options.lang,
        activateFromHotword: options.activateFromHotword,
        handleError: options.handleError,
        setVoiceListening: options.setVoiceListening,
        setVoiceStatusMessage: options.setVoiceStatusMessage,
        translate: options.translate,
        speechBlockedRef: options.speechBlockedRef,
        speechConsentRef: options.speechConsentRef,
        isListeningRef: options.isListeningRef,
        hotwordRecRef: options.hotwordRecRef,
        hotwordCleanupRef: options.hotwordCleanupRef,
    })
    const stopHotword = () => session.stop()
    session.setCleanup(stopHotword)
    options.hotwordCleanupRef.current = stopHotword

    if (options.porcupineWasScheduledRef.current) {
        options.enqueuePorcupine(async () => {
            await options.releasePorcupine()
            session.start()
        })
    } else session.start()

    return stopHotword
}

/** Owns the browser hotword recognizer and its recoverable restart lifecycle. */
export const useRegexHotword = (options: UseRegexHotwordOptions): void => {
    const latestOptionsRef = useRef(options)
    useLayoutEffect(() => {
        latestOptionsRef.current = options
    }, [options])

    const lifecycleKey = JSON.stringify([
        options.wakeWordEngine,
        options.isAvailable,
        options.isListening,
        options.hotwordEnabled,
        options.speechBlocked,
        options.speechConsentGranted,
        options.recoveryRevision,
        options.lang,
    ])

    useEffect(() => {
        const current = latestOptionsRef.current
        if (!canRunRegexHotword(current)) {
            stopRegexHotword(current)
            return
        }

        return startRegexHotword({
            ...current,
            activateFromHotword: () => latestOptionsRef.current.activateFromHotword(),
            handleError: (event) => latestOptionsRef.current.handleError(event),
            enqueuePorcupine: (step) => latestOptionsRef.current.enqueuePorcupine(step),
            releasePorcupine: () => latestOptionsRef.current.releasePorcupine(),
            setVoiceListening: (listening) => latestOptionsRef.current.setVoiceListening(listening),
            setVoiceStatusMessage: (message) =>
                latestOptionsRef.current.setVoiceStatusMessage(message),
            translate: (key) => latestOptionsRef.current.translate(key),
        })
    }, [lifecycleKey])
}

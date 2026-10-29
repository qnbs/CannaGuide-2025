import React, { useEffect, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { selectLanguage, selectSettings } from '@/stores/selectors'
import { useUIStore } from '@/stores/useUIStore'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from './Button'
import { porcupineWakeWordService } from '@/services/porcupineWakeWordService'
import { porcupineKeyService } from '@/services/porcupineKeyService'
import { voiceTelemetryService } from '@/services/voiceTelemetryService'

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
    const continuousListening = settings.voiceControl.continuousListening
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
                setVoiceStatusMessage(t('common.voiceControl.processing', { transcript }))
                return
            }
            if (transcript) {
                setVoiceStatusMessage(t('common.voiceControl.processing', { transcript }))
                processVoiceCommand(transcript)
            }
            // In continuous mode, keep listening; otherwise stop after a command
            if (!continuousListening && recognitionRef.current) {
                recognitionRef.current.stop()
            }
        },
        [setVoiceStatusMessage, processVoiceCommand, t, continuousListening],
    )

    const handleError = useCallback(
        (event: WSpeechRecognitionErrorEvent) => {
            console.debug('Speech recognition error:', event.error)
            let errorMessageKey = 'common.voiceControl.errors.generic'
            if (event.error === 'no-speech') {
                errorMessageKey = 'common.voiceControl.errors.noSpeech'
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                errorMessageKey = 'common.voiceControl.errors.notAllowed'
            }
            setVoiceStatusMessage(t(errorMessageKey))
            setVoiceListening(false)
            setTimeout(() => setVoiceStatusMessage(null), 4000)
        },
        [setVoiceStatusMessage, setVoiceListening, t],
    )

    const handleEnd = useCallback(() => {
        // In continuous listening mode, auto-restart recognition
        if (continuousListening && isListening && recognitionRef.current) {
            try {
                recognitionRef.current.start()
                return
            } catch {
                // Recognition may already be running -- fall through to idle
            }
        }
        setVoiceListening(false)
        setVoiceStatusMessage(null)
    }, [continuousListening, isListening, setVoiceListening, setVoiceStatusMessage])

    useEffect(() => {
        if (!isAvailable || !hasSpeechRecognitionSupport) return

        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = continuousListening
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
    }, [isAvailable, continuousListening, handleResult, handleError, handleEnd])

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
        setVoiceStatusMessage(t('common.voiceControl.hotwordDetected'))
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
                        voiceTelemetryService.recordVoiceEvent('hotwordDetected', {
                            engine: 'regex',
                        })
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

    // ---------------------------------------------------------------------------
    // V-03b: Porcupine WASM Wake-Word Detection (optional upgrade)
    // When wakeWordEngine === 'porcupine' and an access key is set, use
    // Porcupine for low-CPU always-on keyword detection. Falls back to regex.
    // ---------------------------------------------------------------------------
    const porcupineInitRef = useRef(false)
    // Identifies the key and keyword the engine was created with. init() keeps
    // an existing engine, so a changed or removed key needs dispose() first
    // (#744 review). Holds no key, only what changed.
    const porcupineConfigRef = useRef<string | null>(null)
    // Runs setups and stops one at a time: a run started while the previous
    // one is still in init() would get that run's engine and key back, and a
    // stop finishing after the next dispose() would mark a released engine
    // ready again (#744 review).
    const porcupineRunRef = useRef<Promise<void>>(Promise.resolve())
    const enqueuePorcupine = useCallback((step: () => Promise<unknown>) => {
        porcupineRunRef.current = porcupineRunRef.current.then(step).then(
            () => undefined,
            () => undefined,
        )
    }, [])
    // The access key lives in its encrypted store, not in the settings (#709).
    // A legacy plaintext value whose migration failed keeps working until it
    // moves; a saved or removed key restarts the engine via the version.
    const legacyPorcupineKey = settings.voiceControl.porcupineAccessKey
    const [porcupineKeyVersion, setPorcupineKeyVersion] = useState(0)
    useEffect(
        () => porcupineKeyService.subscribe(() => setPorcupineKeyVersion((version) => version + 1)),
        [],
    )

    useEffect(() => {
        const usePorcupine =
            settings.voiceControl.wakeWordEngine === 'porcupine' && hotwordEnabled && isAvailable

        if (!usePorcupine) {
            if (porcupineInitRef.current) {
                enqueuePorcupine(() => porcupineWakeWordService.stop())
                porcupineInitRef.current = false
            }
            return
        }

        let disposed = false
        const configuration = [
            porcupineKeyVersion,
            settings.voiceControl.porcupineKeyword,
            legacyPorcupineKey === null ? 'store' : 'legacy',
        ].join('|')

        const initPorcupine = async () => {
            try {
                // An unreadable store must not hide a legacy key that still works.
                const storedKey = await porcupineKeyService.getApiKey().catch(() => null)
                const accessKey = storedKey ?? legacyPorcupineKey
                if (disposed) return
                if (
                    porcupineConfigRef.current !== null &&
                    porcupineConfigRef.current !== configuration
                ) {
                    await porcupineWakeWordService.dispose()
                    porcupineConfigRef.current = null
                }
                // No key, or the effect was torn down meanwhile: regex fallback.
                if (!accessKey || disposed) return
                await porcupineWakeWordService.init(
                    accessKey,
                    settings.voiceControl.porcupineKeyword,
                )
                porcupineConfigRef.current = configuration
                // Torn down during init(): the next run decides about this engine.
                if (disposed) return
                porcupineWakeWordService.setCallback(() => {
                    if (disposed) return
                    voiceTelemetryService.recordVoiceEvent('hotwordDetected', {
                        engine: 'porcupine',
                    })
                    activateFromHotword()
                })
                await porcupineWakeWordService.start()
                // A teardown during start() already queued its stop behind this run.
                if (!disposed) porcupineInitRef.current = true
            } catch {
                console.debug('[VoiceControl] Porcupine init failed -- regex fallback active')
            }
        }

        enqueuePorcupine(initPorcupine)

        return () => {
            disposed = true
            // Queued even while this run is still starting: it then stops the
            // engine that run is about to leave listening (#744 review).
            enqueuePorcupine(() => porcupineWakeWordService.stop())
            porcupineInitRef.current = false
        }
    }, [
        settings.voiceControl.wakeWordEngine,
        legacyPorcupineKey,
        porcupineKeyVersion,
        settings.voiceControl.porcupineKeyword,
        hotwordEnabled,
        isAvailable,
        activateFromHotword,
        enqueuePorcupine,
    ])

    const toggleListening = () => {
        if (!isAvailable || !hasSpeechRecognitionSupport || !recognitionRef.current) return

        if (isListening) {
            recognitionRef.current.stop()
        } else {
            try {
                recognitionRef.current.start()
                setVoiceListening(true)
                setVoiceStatusMessage(t('common.voiceControl.listening'))
            } catch (e) {
                console.debug('Error starting recognition:', e)
                // This can happen if recognition is already started, so we defensively stop it.
                try {
                    recognitionRef.current.stop()
                } catch {
                    // Ignore errors on stopping if it was already stopped.
                }
                setVoiceStatusMessage(t('common.voiceControl.errors.startFailed'))
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
                title={t('common.voiceControl.toggle')}
                aria-label={t('common.voiceControl.toggle')}
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

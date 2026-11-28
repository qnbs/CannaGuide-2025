import React, { useEffect, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectLanguage, selectLocalOnlyMode, selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { useUIStore } from '@/stores/useUIStore'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from './Button'
import { BrowserSpeechConsentDialog } from './BrowserSpeechConsentDialog'
import { useRegexHotword } from './useRegexHotword'
import { porcupineWakeWordService } from '@/services/porcupineWakeWordService'
import { porcupineKeyService } from '@/services/porcupineKeyService'
import { voiceTelemetryService } from '@/services/voiceTelemetryService'
import { WEB_SPEECH_CONSENT_VERSION } from '@/services/webSpeechConsent'
import {
    abortSpeechRecognition,
    HOTWORD_ACTIVATION_MS,
    hasSpeechRecognitionSupport,
    micTitleKey,
    recognitionLang,
    SpeechRecognitionAPI,
    wakeWordAllowed,
    type WSpeechRecognition,
    type WSpeechRecognitionErrorEvent,
    type WSpeechRecognitionEvent,
} from './voiceRecognition'

export const VoiceControl: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const lang = useAppSelector(selectLanguage)
    const settings = useAppSelector(selectSettings)
    // Browser speech recognition may send the audio to the browser vendor's
    // online service, which the app cannot see or stop, so Local-Only Mode
    // keeps every recognizer here off (GH #717). Porcupine stays off too: a
    // wake word would have no command listener to start.
    const speechBlocked = useAppSelector(selectLocalOnlyMode)
    // The live value for listeners created before a change (see the layout
    // effect below, which also aborts the recognizers at commit).
    const speechBlockedRef = useRef(speechBlocked)
    const speechConsentGranted =
        settings.privacy.webSpeechConsentVersion === WEB_SPEECH_CONSENT_VERSION
    const speechConsentRef = useRef(speechConsentGranted)
    const browserSpeechAllowed = speechConsentGranted && !speechBlocked
    const [speechConsentDialogOpen, setSpeechConsentDialogOpen] = useState(false)
    const [commandListenerRequested, setCommandListenerRequested] = useState(false)
    const [pendingManualStart, setPendingManualStart] = useState(false)
    const [hotwordRecoveryRevision, setHotwordRecoveryRevision] = useState(0)
    const pendingStartAfterConsentRef = useRef(false)
    const consentPromptedRef = useRef(false)
    const hotwordEnabled = settings.voiceControl.hotwordEnabled
    const wakeWordEngine = settings.voiceControl.wakeWordEngine
    const continuousListening = settings.voiceControl.continuousListening
    const isListening = useUIStore((s) => s.voiceControl.isListening)
    const isAvailable = useUIStore((s) => s.voiceControl.isAvailable)
    const statusMessage = useUIStore((s) => s.voiceControl.statusMessage)
    const setVoiceListening = useUIStore((s) => s.setVoiceListening)
    const setVoiceStatusMessage = useUIStore((s) => s.setVoiceStatusMessage)
    const processVoiceCommand = useUIStore((s) => s.processVoiceCommand)
    const recognitionRef = useRef<WSpeechRecognition | null>(null)
    // Read by the end and hotword handlers. As a dependency, isListening made
    // every start or stop of a session rebuild (and abort) the recognizers.
    const isListeningRef = useRef(isListening)
    const statusMessageRef = useRef(statusMessage)
    const wakeWordEngineRef = useRef(wakeWordEngine)
    useLayoutEffect(() => {
        isListeningRef.current = isListening
    }, [isListening])
    useLayoutEffect(() => {
        statusMessageRef.current = statusMessage
    }, [statusMessage])
    useLayoutEffect(() => {
        wakeWordEngineRef.current = wakeWordEngine
    }, [wakeWordEngine])

    // Hotword listener state
    const hotwordRecRef = useRef<WSpeechRecognition | null>(null)
    const hotwordCleanupRef = useRef<(() => void) | null>(null)
    const hotwordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [hotwordActive, setHotwordActive] = useState(false)

    useEffect(
        () => () => {
            if (hotwordTimerRef.current !== null) {
                clearTimeout(hotwordTimerRef.current)
                hotwordTimerRef.current = null
            }
        },
        [],
    )

    // Switching Local-Only Mode on stops recognition in the commit itself, not
    // in a later passive cleanup: between the two, a recognizer could keep
    // sending audio, deliver a queued result or restart itself on 'end'. The
    // listeners read the ref, so an event that still arrives does nothing.
    useLayoutEffect(() => {
        speechBlockedRef.current = speechBlocked
        speechConsentRef.current = speechConsentGranted
        if (!speechBlocked && speechConsentGranted) return
        pendingStartGenerationRef.current += 1
        if (hotwordTimerRef.current !== null) {
            clearTimeout(hotwordTimerRef.current)
            hotwordTimerRef.current = null
        }
        const wasListening = isListeningRef.current || isListening || hotwordActive
        const recognition = recognitionRef.current
        recognitionRef.current = null
        recognition?.abort()
        isListeningRef.current = false
        setCommandListenerRequested(false)
        setPendingManualStart(false)
        const stopHotword = hotwordCleanupRef.current
        if (stopHotword) stopHotword()
        else {
            const hotwordRecognition = hotwordRecRef.current
            hotwordRecRef.current = null
            hotwordRecognition?.abort()
        }
        setHotwordActive(false)
        setVoiceListening(false)
        if (speechBlocked && wasListening) {
            setVoiceStatusMessage(t('common.voiceControl.errors.localOnly'))
        } else if (!speechConsentGranted && wasListening) {
            setVoiceStatusMessage(t('common.voiceControl.errors.consentRequired'))
        }
    }, [
        speechBlocked,
        speechConsentGranted,
        isListening,
        hotwordActive,
        setVoiceListening,
        setVoiceStatusMessage,
        t,
    ])

    const handleResult = useCallback(
        (event: WSpeechRecognitionEvent) => {
            if (!speechConsentRef.current || speechBlockedRef.current) return
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
            isListeningRef.current = false
            setVoiceListening(false)
            setTimeout(() => setVoiceStatusMessage(null), 4000)
        },
        [setVoiceStatusMessage, setVoiceListening, t],
    )

    const handleEnd = useCallback(() => {
        // In continuous listening mode, auto-restart recognition
        if (
            speechConsentRef.current &&
            !speechBlockedRef.current &&
            continuousListening &&
            isListeningRef.current &&
            recognitionRef.current
        ) {
            try {
                recognitionRef.current.start()
                return
            } catch {
                // Recognition may already be running -- fall through to idle
            }
        }
        isListeningRef.current = false
        setCommandListenerRequested(false)
        setVoiceListening(false)
        setVoiceStatusMessage(null)
    }, [continuousListening, setCommandListenerRequested, setVoiceListening, setVoiceStatusMessage])

    useEffect(() => {
        if (
            (wakeWordEngine === 'porcupine' && !commandListenerRequested) ||
            !isAvailable ||
            !SpeechRecognitionAPI ||
            !browserSpeechAllowed
        ) {
            return
        }

        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = continuousListening
        recognition.interimResults = true
        // Set here, not only on a language change: a recognizer created later
        // (for example when Local-Only Mode is switched off) needs it too.
        recognition.lang = recognitionLang(lang)

        // A result already queued when Local-Only Mode was switched on must not
        // run a command; the cleanup below may not have run yet.
        const onResult = (event: WSpeechRecognitionEvent): void => {
            if (!speechBlockedRef.current && speechConsentRef.current) handleResult(event)
        }

        // Continuous mode restarts on 'end'; never after the switch.
        const onEnd = (): void => {
            if (!speechBlockedRef.current && speechConsentRef.current) handleEnd()
        }
        // The abort at the switch fires 'aborted'; it must not replace the reason.
        const onError = (event: WSpeechRecognitionErrorEvent): void => {
            if (!speechBlockedRef.current && speechConsentRef.current) handleError(event)
        }

        recognition.addEventListener('result', onResult)
        recognition.addEventListener('error', onError)
        recognition.addEventListener('end', onEnd)

        recognitionRef.current = recognition

        return () => {
            if (recognition) {
                abortSpeechRecognition(recognition, onResult, onError, onEnd)
                recognitionRef.current = null
            }
            if (wakeWordEngineRef.current !== wakeWordEngine && isListeningRef.current) {
                isListeningRef.current = false
                setCommandListenerRequested(false)
                setVoiceListening(false)
                if (statusMessageRef.current === t('common.voiceControl.listening')) {
                    setVoiceStatusMessage(null)
                }
            }
        }
    }, [
        isAvailable,
        wakeWordEngine,
        commandListenerRequested,
        browserSpeechAllowed,
        continuousListening,
        lang,
        handleResult,
        handleError,
        handleEnd,
        setCommandListenerRequested,
        setVoiceListening,
        setVoiceStatusMessage,
        t,
    ])

    useEffect(() => {
        if (!pendingManualStart || !browserSpeechAllowed || !recognitionRef.current) return
        setPendingManualStart(false)
        try {
            isListeningRef.current = true
            recognitionRef.current.start()
            setVoiceListening(true)
            setVoiceStatusMessage(t('common.voiceControl.listening'))
        } catch {
            isListeningRef.current = false
            setVoiceStatusMessage(t('common.voiceControl.errors.startFailed'))
            setVoiceListening(false)
            setHotwordRecoveryRevision((revision) => revision + 1)
        }
    }, [
        pendingManualStart,
        browserSpeechAllowed,
        setVoiceListening,
        setVoiceStatusMessage,
        setHotwordRecoveryRevision,
        t,
    ])

    useEffect(() => {
        if (speechBlocked || speechConsentGranted) {
            if (speechConsentGranted) consentPromptedRef.current = false
            return
        }
        if (hotwordEnabled && wakeWordEngine === 'regex' && !consentPromptedRef.current) {
            consentPromptedRef.current = true
            setSpeechConsentDialogOpen(true)
        }
    }, [hotwordEnabled, wakeWordEngine, speechBlocked, speechConsentGranted])

    // Switching Local-Only Mode on aborts the recognizers (the layout effect
    // above); the listening state and the live region must follow. A session
    // or a detected hotword that it ended gets the reason, not a stale status.
    useEffect(() => {
        if (!speechBlocked) return
        if (isListening || hotwordActive) {
            setVoiceListening(false)
            setVoiceStatusMessage(t('common.voiceControl.errors.localOnly'))
        }
        setHotwordActive(false)
    }, [speechBlocked, isListening, hotwordActive, setVoiceListening, setVoiceStatusMessage, t])

    // Switching it off clears that reason from the live region.
    useEffect(() => {
        if (!speechBlocked) setVoiceStatusMessage(null)
    }, [speechBlocked, setVoiceStatusMessage])

    // Serialize the retained Porcupine engine's setup, stop and release.
    const porcupineConfigRef = useRef<string | null>(null)
    const porcupineRunRef = useRef<Promise<void>>(Promise.resolve())
    const porcupineWasScheduledRef = useRef(false)
    const pendingStartGenerationRef = useRef(0)
    const releasePorcupine = useCallback(async () => {
        if (porcupineConfigRef.current === null) return
        await porcupineWakeWordService.dispose()
        porcupineConfigRef.current = null
    }, [])
    const enqueuePorcupine = useCallback((step: () => Promise<unknown>) => {
        porcupineRunRef.current = porcupineRunRef.current.then(step).then(
            () => undefined,
            () => undefined,
        )
    }, [])

    const requestCommandListening = useCallback(() => {
        if (speechBlockedRef.current || !speechConsentRef.current || isListeningRef.current) return
        const startGeneration = ++pendingStartGenerationRef.current
        isListeningRef.current = true
        const start = () => {
            if (
                startGeneration !== pendingStartGenerationRef.current ||
                speechBlockedRef.current ||
                !speechConsentRef.current
            ) {
                return
            }
            if (!recognitionRef.current) {
                setCommandListenerRequested(true)
                setPendingManualStart(true)
                return
            }
            try {
                recognitionRef.current.start()
                setVoiceListening(true)
                setVoiceStatusMessage(t('common.voiceControl.listening'))
            } catch {
                isListeningRef.current = false
                setVoiceStatusMessage(t('common.voiceControl.errors.startFailed'))
                setVoiceListening(false)
                setHotwordRecoveryRevision((revision) => revision + 1)
            }
        }

        const hotwordRecognition = hotwordRecRef.current
        const stopHotword = hotwordCleanupRef.current
        if (stopHotword) stopHotword()
        else {
            hotwordRecRef.current = null
            hotwordRecognition?.abort()
        }

        if (wakeWordEngine === 'porcupine' && porcupineWasScheduledRef.current) {
            enqueuePorcupine(async () => {
                await releasePorcupine()
                start()
            })
        } else {
            start()
        }
    }, [
        wakeWordEngine,
        enqueuePorcupine,
        releasePorcupine,
        setCommandListenerRequested,
        setPendingManualStart,
        setVoiceListening,
        setVoiceStatusMessage,
        setHotwordRecoveryRevision,
        t,
    ])

    // ---------------------------------------------------------------------------
    // V-03: Hotword Wake Detection
    // ---------------------------------------------------------------------------
    const startHotwordSession = useCallback(() => {
        if (speechBlockedRef.current || !speechConsentRef.current) return
        setHotwordActive(true)
        const hotwordMessage = t('common.voiceControl.hotwordDetected')
        setVoiceStatusMessage(hotwordMessage)
        if (hotwordTimerRef.current !== null) clearTimeout(hotwordTimerRef.current)
        hotwordTimerRef.current = setTimeout(() => {
            hotwordTimerRef.current = null
            setHotwordActive(false)
            if (statusMessageRef.current === hotwordMessage) setVoiceStatusMessage(null)
        }, HOTWORD_ACTIVATION_MS)
        requestCommandListening()
    }, [t, setVoiceStatusMessage, requestCommandListening])

    // A stale wake listener cannot start Web Speech after Local-Only is enabled.
    const activateFromHotword = useCallback(() => {
        if (speechBlockedRef.current) return
        if (!speechConsentRef.current) {
            pendingStartAfterConsentRef.current = true
            setSpeechConsentDialogOpen(true)
            return
        }
        startHotwordSession()
    }, [startHotwordSession])

    useRegexHotword({
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
        translate: t,
        recoveryRevision: hotwordRecoveryRevision,
        speechBlockedRef,
        speechConsentRef,
        isListeningRef,
        porcupineWasScheduledRef,
        hotwordRecRef,
        hotwordCleanupRef,
    })

    // ---------------------------------------------------------------------------
    // V-03b: Porcupine WASM Wake-Word Detection (optional upgrade)
    // When wakeWordEngine === 'porcupine' and an access key is set, use
    // Porcupine for low-CPU always-on keyword detection.
    // ---------------------------------------------------------------------------
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
            settings.voiceControl.wakeWordEngine === 'porcupine' &&
            wakeWordAllowed(hotwordEnabled, isAvailable, speechBlocked) &&
            !isListening

        if (!usePorcupine) {
            enqueuePorcupine(releasePorcupine)
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
                // No key or stale run: leave the selected engine stopped.
                if (!accessKey || disposed) return
                const initialized = await porcupineWakeWordService.init(
                    accessKey,
                    settings.voiceControl.porcupineKeyword,
                )
                porcupineConfigRef.current = configuration
                if (!initialized) {
                    await releasePorcupine()
                    return
                }
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
            } catch {
                console.debug('[VoiceControl] Porcupine init failed')
            }
        }

        porcupineWasScheduledRef.current = true
        enqueuePorcupine(initPorcupine)

        return () => {
            disposed = true
            // Queued even while this run is still starting: it then stops the
            // engine that run is about to leave listening (#744 review).
            // The next run releases it if Porcupine is no longer wanted.
            enqueuePorcupine(() => porcupineWakeWordService.stop())
        }
    }, [
        settings.voiceControl.wakeWordEngine,
        legacyPorcupineKey,
        porcupineKeyVersion,
        settings.voiceControl.porcupineKeyword,
        hotwordEnabled,
        isAvailable,
        isListening,
        speechBlocked,
        activateFromHotword,
        enqueuePorcupine,
        releasePorcupine,
    ])

    const addNotification = useUIStore((s) => s.addNotification)
    // Visible and announced: the mic does nothing while Local-Only Mode is on.
    const explainSpeechBlocked = () => {
        const reason = t('common.voiceControl.errors.localOnly')
        setVoiceStatusMessage(reason)
        addNotification({ message: reason, type: 'info' })
    }

    const toggleListening = () => {
        if (!isAvailable || !hasSpeechRecognitionSupport || !recognitionRef.current) return

        if (isListening) {
            // An explicit stop: continuous mode must not restart on the 'end'.
            isListeningRef.current = false
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

    const handleMicClick = (): void => {
        if (speechBlocked) explainSpeechBlocked()
        else if (!speechConsentGranted) {
            pendingStartAfterConsentRef.current = true
            setSpeechConsentDialogOpen(true)
        } else {
            if (isListening) toggleListening()
            else requestCommandListening()
        }
    }

    const allowBrowserSpeech = (): void => {
        // The explicit choice authorizes work in this event turn. React's
        // layout effect updates the shared ref only after the next commit.
        speechConsentRef.current = true
        dispatch(
            setSetting({
                path: 'privacy.webSpeechConsentVersion',
                value: WEB_SPEECH_CONSENT_VERSION,
            }),
        )
        setSpeechConsentDialogOpen(false)
        if (pendingStartAfterConsentRef.current) {
            pendingStartAfterConsentRef.current = false
            requestCommandListening()
        }
    }

    const dismissBrowserSpeechConsent = (): void => {
        pendingStartAfterConsentRef.current = false
        setSpeechConsentDialogOpen(false)
    }

    if (!isAvailable || !hasSpeechRecognitionSupport) {
        return null
    }

    return (
        <>
            <div className="relative inline-flex items-center">
                <Button
                    variant="ghost"
                    className={`!p-2 rounded-full transition-colors duration-200 ${
                        isListening || hotwordActive
                            ? 'text-red-400 animate-pulse bg-red-500/20'
                            : 'text-slate-300 hover:text-slate-100'
                    }`}
                    onClick={handleMicClick}
                    title={t(micTitleKey(speechBlocked))}
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
            <BrowserSpeechConsentDialog
                isOpen={speechConsentDialogOpen}
                onAllow={allowBrowserSpeech}
                onCancel={dismissBrowserSpeechConsent}
            />
        </>
    )
}

/**
 * voiceOrchestratorService.ts
 *
 * Central voice orchestrator (v1.7 Voice-First USP).
 * Finite state machine that coordinates STT, TTS, command matching,
 * confirmation loops, and error recovery. Composes existing services:
 * - ttsService (SpeechSynthesis)
 * - voiceCommandRegistry (command matching)
 * - useVoiceStore (transient Zustand state)
 * - useTtsStore (TTS queue)
 * - useUIStore (voice control flags)
 *
 * Initialised once from index.tsx after store hydration.
 */
import { getT } from '@/i18n'
import { VoiceMode } from '@/types'
import type { Language, AppSettings, VoiceConfirmation } from '@/types'
import type { AppStore, RootState } from '@/stores/store'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTtsStore } from '@/stores/useTtsStore'
import { getUISnapshot, useUIStore } from '@/stores/useUIStore'
import { ttsService } from '@/services/ttsService'
import { buildVoiceCommands, matchVoiceCommand } from '@/services/voiceCommandRegistry'
import type { VoiceCommandDef } from '@/services/voiceCommandRegistry'
import { workerBus } from '@/services/workerBus'
import { voiceTelemetryService } from '@/services/voiceTelemetryService'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum retries after "not understood" before going IDLE. */
const MAX_ERROR_RETRIES = 3

/** Confirmation answer patterns (yes/no in supported languages). */
const YES_PATTERNS = /^(yes|ja|si|oui|yeah|yep|jep|okay|ok|sure|klar|genau|richtig)$/i
const NO_PATTERNS = /^(no|nein|non|nee|nope|cancel|abbrechen|stop|stopp)$/i

/** Prefixes that route the transcript to the AI mentor assistant. */
const ASSISTANT_PREFIXES = [
    'gemini',
    'ask gemini',
    'assistant',
    'ki',
    'frage ki',
    'frage den mentor',
] as const

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let store: AppStore | null = null
let errorRetryCount = 0
let unsubscribe: (() => void) | null = null

// ---------------------------------------------------------------------------
// Voice worker (W-06: delegated to WorkerPool auto-spawn)
// ---------------------------------------------------------------------------

/** No-op -- W-06 WorkerPool auto-spawns on first dispatch. */
function ensureVoiceWorkerRegistered(): void {
    // Retained for call-site compatibility within this module.
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSettings(): AppSettings {
    if (!store) throw new Error('VoiceOrchestrator not initialized')
    return (store.getState() as RootState).settings.settings
}

function getLanguage(): Language {
    return getSettings().general.language
}

function playConfirmationSound(): void {
    try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc.connect(gain).connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
    } catch {
        // Audio context may be blocked -- ignore
    }
}

// ---------------------------------------------------------------------------
// Assistant query parsing
// ---------------------------------------------------------------------------

function parseAssistantQuery(transcript: string): string | null {
    for (const prefix of ASSISTANT_PREFIXES) {
        if (!transcript.startsWith(prefix)) continue
        const rawQuery = transcript.slice(prefix.length).trim()
        return rawQuery.length > 0 ? rawQuery : null
    }
    return null
}

async function handleAssistantQuery(query: string): Promise<void> {
    if (!store) return
    const t = getT()
    const state = store.getState() as RootState

    const selectedPlantId =
        state.simulation.selectedPlantId ??
        state.simulation.plantSlots.find((slot) => slot !== null) ??
        null
    const plant = selectedPlantId ? state.simulation.plants.entities[selectedPlantId] : null

    if (!plant) {
        getUISnapshot().setVoiceStatusMessage(t('voiceControl.errors.noPlantContext'))
        speakFeedback(t('voiceControl.errors.noPlantContext'))
        setTimeout(() => getUISnapshot().setVoiceStatusMessage(null), 4000)
        useVoiceStore.getState().setMode(VoiceMode.IDLE)
        return
    }

    getUISnapshot().setVoiceStatusMessage(t('voiceControl.assistantThinking'))
    useVoiceStore.getState().setMode(VoiceMode.PROCESSING)

    try {
        const language = state.settings.settings.general.language
        const { aiService } = await import('@/services/aiService')
        const response = await aiService.getMentorResponse(plant, query, language)
        const speechText = `${response.title}. ${response.content}`.slice(0, 320)

        getUISnapshot().addNotification({ message: response.title, type: 'info' })
        useVoiceStore.getState().setMode(VoiceMode.SPEAKING)
        ttsService.speak(
            speechText,
            language,
            () => {
                getUISnapshot().setVoiceStatusMessage(null)
                useVoiceStore.getState().setMode(VoiceMode.IDLE)
            },
            state.settings.settings.tts,
        )
        getUISnapshot().setVoiceStatusMessage(response.content)
    } catch (error) {
        console.debug('Voice assistant response failed:', error)
        getUISnapshot().setVoiceStatusMessage(t('voiceControl.errors.assistantFailed'))
        useVoiceStore.getState().setMode(VoiceMode.IDLE)
        setTimeout(() => getUISnapshot().setVoiceStatusMessage(null), 5000)
    }
}

// ---------------------------------------------------------------------------
// Core: Process transcript through the state machine
// ---------------------------------------------------------------------------

async function processTranscript(transcript: string): Promise<void> {
    const voiceStore = useVoiceStore.getState()
    const mode = voiceStore.mode
    const startTime = Date.now()

    // In confirmation mode, interpret as yes/no
    if (mode === VoiceMode.CONFIRMATION) {
        handleConfirmationAnswer(transcript)
        return
    }

    useVoiceStore.getState().setMode(VoiceMode.PROCESSING)
    useVoiceStore.getState().addTranscript(transcript)

    if (!store) return

    let lowered = transcript.toLowerCase().trim()
    const settings = getSettings()

    // Optional: off-main-thread transcript cleaning via voice worker
    if (settings.voiceControl.voiceWorkerEnabled) {
        try {
            ensureVoiceWorkerRegistered()
            const cleaned = await workerBus.dispatch<{
                cleaned: string
                detectedLang: string
            }>('voice', 'PROCESS_TRANSCRIPT', {
                transcript: lowered,
                lang: getLanguage(),
            })
            lowered = cleaned.cleaned
        } catch {
            // Worker unavailable -- proceed with main-thread processing
        }
    }

    // Check for assistant query first (e.g. "gemini what is VPD")
    const assistantQuery = parseAssistantQuery(lowered)
    if (assistantQuery) {
        await handleAssistantQuery(assistantQuery)
        return
    }

    const commands = buildVoiceCommands(store.dispatch)
    const matched = matchVoiceCommand(lowered, commands)
    const latencyMs = Date.now() - startTime

    if (!matched) {
        voiceTelemetryService.recordVoiceEvent('commandFailed', {
            latencyMs,
            transcript: lowered.slice(0, 50),
        })
        handleNotUnderstood()
        return
    }

    voiceTelemetryService.recordVoiceEvent('commandMatched', {
        commandId: matched.id,
        latencyMs,
        matchType: 'main-thread',
    })

    errorRetryCount = 0
    useVoiceStore.getState().setLastMatchedCommand(matched.id)
    useVoiceStore.getState().setError(null)

    if (matched.requiresConfirmation) {
        triggerConfirmation(matched, lowered)
        return
    }

    await executeCommand(matched, lowered)
}

function triggerConfirmation(command: VoiceCommandDef, transcript: string): void {
    const t = getT()
    const question = t('voiceControl.confirmation.question', { command: command.label })

    const confirmation: VoiceConfirmation = {
        commandId: command.id,
        question,
        onConfirm: () => {
            void executeCommand(command, transcript)
        },
        onCancel: () => {
            useVoiceStore.getState().clearConfirmation()
            speakFeedback(t('voiceControl.confirmation.cancelled'))
        },
    }

    useVoiceStore.getState().setConfirmation(confirmation)
    speakFeedback(question)
}

function handleConfirmationAnswer(transcript: string): void {
    const lowered = transcript.toLowerCase().trim()
    const pending = useVoiceStore.getState().confirmationPending

    if (!pending) {
        useVoiceStore.getState().clearConfirmation()
        return
    }

    if (YES_PATTERNS.test(lowered)) {
        useVoiceStore.getState().clearConfirmation()
        pending.onConfirm()
    } else if (NO_PATTERNS.test(lowered)) {
        pending.onCancel()
    } else {
        // Re-ask
        const t = getT()
        speakFeedback(t('voiceControl.confirmation.yesOrNo'))
    }
}

async function executeCommand(command: VoiceCommandDef, transcript: string): Promise<void> {
    useVoiceStore.getState().setMode(VoiceMode.SPEAKING)

    try {
        command.action(transcript)

        if (getSettings().voiceControl.confirmationSound) {
            playConfirmationSound()
        }

        getUISnapshot().setVoiceStatusMessage(command.label)
        setTimeout(() => getUISnapshot().setVoiceStatusMessage(null), 3000)
    } catch (err) {
        console.debug('[VoiceOrchestrator] Command execution error:', err)
        const t = getT()
        voiceTelemetryService.recordVoiceEvent('errorOccurred', {
            commandId: command.id,
            errorCode: 'executionError',
        })
        useVoiceStore.getState().setError(t('voiceControl.errors.generic'))
    } finally {
        useVoiceStore.getState().setMode(VoiceMode.IDLE)
    }
}

// ---------------------------------------------------------------------------
// Error recovery
// ---------------------------------------------------------------------------

function handleNotUnderstood(): void {
    const t = getT()
    errorRetryCount++

    if (errorRetryCount >= MAX_ERROR_RETRIES) {
        errorRetryCount = 0
        useVoiceStore.getState().setError(t('voiceControl.errors.maxRetries'))
        useVoiceStore.getState().setMode(VoiceMode.IDLE)
        speakFeedback(t('voiceControl.errors.maxRetries'))
        return
    }

    useVoiceStore.getState().setError(t('voiceControl.errors.notUnderstood'))
    useVoiceStore.getState().setMode(VoiceMode.LISTENING)
    speakFeedback(t('voiceControl.errors.notUnderstood'))
}

// ---------------------------------------------------------------------------
// TTS helper
// ---------------------------------------------------------------------------

function speakFeedback(text: string): void {
    const settings = getSettings()
    if (!settings.tts.enabled) return
    ttsService.speak(
        text,
        getLanguage(),
        () => {
            // After feedback, return to idle unless we are in confirmation
            if (useVoiceStore.getState().mode === VoiceMode.SPEAKING) {
                useVoiceStore.getState().setMode(VoiceMode.IDLE)
            }
        },
        settings.tts,
    )
}

/**
 * Read arbitrary content text via TTS (used by ReadAloudButton).
 * Enqueues into the TTS store queue for sequential playback.
 */
function readContent(text: string, contentId: string): void {
    useTtsStore.getState().addToTtsQueue({ id: contentId, text })
    const settings = getSettings()
    if (!useTtsStore.getState().isTtsSpeaking) {
        useTtsStore.getState().play(settings)
    }
}

// ---------------------------------------------------------------------------
// Voice auto-selection
// ---------------------------------------------------------------------------

/**
 * Select the best available TTS voice for the given language.
 * Priority: user-selected > Google > Microsoft > default > any match.
 */
function getBestVoice(lang: Language): SpeechSynthesisVoice | null {
    const settings = getSettings()
    const voices = ttsService.getVoices(lang)

    if (voices.length === 0) return null

    // 1. User-selected voice
    if (settings.tts.voiceName) {
        const userVoice = voices.find((v) => v.name === settings.tts.voiceName)
        if (userVoice) return userVoice
    }

    // 2. Google voice (high quality)
    const googleVoice = voices.find((v) => v.name.toLowerCase().includes('google'))
    if (googleVoice) return googleVoice

    // 3. Microsoft voice
    const msVoice = voices.find((v) => v.name.toLowerCase().includes('microsoft'))
    if (msVoice) return msVoice

    // 4. Default voice for this language
    const defaultVoice = voices.find((v) => v.default)
    if (defaultVoice) return defaultVoice

    // 5. Any voice matching the language
    return voices[0] ?? null
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the voice orchestrator. Call once after store hydration.
 * Subscribes to useUIStore.voiceControl.lastTranscript for incoming commands.
 */
function init(appStore: AppStore): void {
    if (unsubscribe) return
    store = appStore

    // Subscribe to incoming voice transcripts (routed from VoiceControl -> useUIStore)
    unsubscribe = useUIStore.subscribe(
        (s) => s.voiceControl.lastTranscript,
        (transcript) => {
            if (!transcript) return
            void processTranscript(transcript)
        },
    )
}

/** Clean up subscriptions (for testing). */
function dispose(): void {
    if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
    }
    if (workerBus.has('voice')) {
        workerBus.unregister('voice')
    }
    store = null
    errorRetryCount = 0
}

// ---------------------------------------------------------------------------
// Public API (module singleton)
// ---------------------------------------------------------------------------

export const voiceOrchestratorService = {
    init,
    dispose,
    processTranscript,
    readContent,
    getBestVoice,
    speakFeedback,
}

import { captureLocalAiError } from '@/services/sentryService'
import { ModelDownloadBlockedError, prepareTransformersLoad } from '@cannaguide/ai-core/ml'
// The main thread's one memoized transformers.js module: each loadTransformers()
// call resets allowLocalModels, which would undo the Local-Only policy under a
// load that is running (GH #700).
import {
    applyLocalOnlyPolicy,
    asDownloadBlocked,
    getTransformersModule,
} from '../models/modelLoader'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { acquireGpu, releaseGpu } from '../device/gpuResourceManager'

/**
 * Local AI Whisper STT Service (V-06) -- Offline speech-to-text via
 * Whisper-Tiny (openai/whisper-tiny) through @xenova/transformers.
 *
 * Provides an offline fallback for the Web Speech API when the device
 * is offline or the browser doesn't support SpeechRecognition natively.
 *
 * Architecture:
 * - Model: openai/whisper-tiny (~75 MB ONNX, WASM backend)
 * - Input: Float32Array PCM audio (16 kHz mono)
 * - Output: transcribed text string
 * - GPU mutex coordination via gpuResourceManager
 * - Lazy model loading on first transcription request
 *
 * Limitations (Whisper-Tiny):
 * - Batch-only (no streaming transcription)
 * - Best accuracy for EN/DE; acceptable for ES/FR/NL
 * - First transcription: 3-5s latency (model init)
 * - Memory: ~150 MB WASM heap
 *
 * Integration:
 * - voiceOrchestratorService.ts uses this as fallback when offline
 * - VoiceControl.tsx routes audio capture to this service when
 *   navigator.onLine === false
 *
 * @see docs/architecture/v06-offline-voice.md (planned)
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WHISPER_MODEL_ID = 'Xenova/whisper-tiny'
const WHISPER_TIMEOUT_MS = 30_000
const GPU_RESOURCE_KEY = 'whisper-stt'

/** Supported languages for Whisper-Tiny with good accuracy. */
export const WHISPER_SUPPORTED_LANGUAGES = ['en', 'de', 'es', 'fr', 'nl'] as const
export type WhisperLanguage = (typeof WHISPER_SUPPORTED_LANGUAGES)[number]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WhisperTranscriptionResult {
    /** Transcribed text output. */
    text: string
    /** Detected or forced language code. */
    language: WhisperLanguage
    /** Inference latency in milliseconds. */
    latencyMs: number
    /** Whether this was the first transcription (model just loaded). */
    coldStart: boolean
}

export interface WhisperServiceStatus {
    /** Whether the Whisper model is loaded and ready. */
    ready: boolean
    /** Whether the model is currently loading. */
    loading: boolean
    /** Whether the service is available (browser supports required APIs). */
    available: boolean
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Pipeline type: callable that takes PCM audio and returns transcriptions. */
type WhisperPipeline = (input: Float32Array, options?: Record<string, unknown>) => Promise<unknown>

let pipeline: WhisperPipeline | null = null
let loadingPromise: Promise<WhisperPipeline | null> | null = null

// ---------------------------------------------------------------------------
// Availability check
// ---------------------------------------------------------------------------

/** Check if the browser environment supports Whisper STT. */
export function isWhisperAvailable(): boolean {
    // Requires: WebAssembly (for ONNX runtime) + AudioContext (for PCM capture)
    return typeof WebAssembly !== 'undefined' && typeof AudioContext !== 'undefined'
}

// ---------------------------------------------------------------------------
// Model lifecycle
// ---------------------------------------------------------------------------

/** A load that failed; its cause was already captured where it happened. */
class WhisperLoadFailedError extends Error {
    constructor() {
        super('Whisper model failed to load')
        this.name = 'WhisperLoadFailedError'
    }
}

/**
 * Telemetry for a failure, once: a Local-Only refusal is a choice, not a
 * failure (GH #700), and a failed load was captured in the load itself.
 */
function captureUnlessBlocked(err: unknown): void {
    if (err instanceof ModelDownloadBlockedError || err instanceof WhisperLoadFailedError) return
    captureLocalAiError(err, { stage: 'inference' })
}

/** Why the last load failed: a Local-Only refusal is passed on with its type (GH #700). */
let lastLoadError: unknown = null

/** The loaded pipeline, or the reason it is missing. */
function loadedOrThrow(result: WhisperPipeline | null): WhisperPipeline {
    if (result) return result
    if (lastLoadError instanceof ModelDownloadBlockedError) throw lastLoadError
    throw new WhisperLoadFailedError()
}

/**
 * Waits for the load already under way. In Local-Only Mode the policy applies
 * to it first: it may still be fetching files (GH #700).
 */
async function awaitPendingLoad(
    pending: Promise<WhisperPipeline | null>,
): Promise<WhisperPipeline> {
    if (isLocalOnlyMode()) await applyLocalOnlyPolicy(WHISPER_MODEL_ID)
    return loadedOrThrow(await pending)
}

/**
 * Lazily load the Whisper-Tiny model. Returns the pipeline instance.
 * Coordinates GPU access via the gpu resource manager mutex.
 */
async function ensurePipeline(): Promise<WhisperPipeline> {
    if (pipeline) return pipeline

    if (loadingPromise) return awaitPendingLoad(loadingPromise)

    loadingPromise = (async (): Promise<WhisperPipeline | null> => {
        await acquireGpu(GPU_RESOURCE_KEY)
        try {
            const { pipeline: createPipeline, env } = await getTransformersModule()
            // Local-Only Mode: only a model already in the browser cache loads (GH #700).
            await prepareTransformersLoad(env, WHISPER_MODEL_ID, isLocalOnlyMode())
            const p = await createPipeline('automatic-speech-recognition', WHISPER_MODEL_ID, {
                quantized: true,
            })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            pipeline = p as unknown as WhisperPipeline
            return pipeline
        } catch (err) {
            lastLoadError = asDownloadBlocked(err, WHISPER_MODEL_ID)
            captureUnlessBlocked(lastLoadError)
            return null
        } finally {
            releaseGpu(GPU_RESOURCE_KEY)
            loadingPromise = null
        }
    })()

    return loadedOrThrow(await loadingPromise)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Transcribe PCM audio to text using Whisper-Tiny.
 *
 * @param audioData - Float32Array of PCM audio samples at 16 kHz, mono.
 * @param language - Force a specific language (default: auto-detect).
 * @returns Transcription result with text, language, and latency.
 */
export async function transcribe(
    audioData: Float32Array,
    language?: WhisperLanguage,
): Promise<WhisperTranscriptionResult> {
    if (!isWhisperAvailable()) {
        throw new Error('Whisper STT is not available in this browser environment')
    }

    if (audioData.length === 0) {
        return { text: '', language: language ?? 'en', latencyMs: 0, coldStart: false }
    }

    const wasCold = pipeline === null
    const t0 = performance.now()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), WHISPER_TIMEOUT_MS)

    try {
        const p = await ensurePipeline()

        const options: Record<string, unknown> = {
            return_timestamps: false,
            chunk_length_s: 30,
        }
        if (language) {
            options['language'] = language
            options['task'] = 'transcribe'
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const result = (await p(audioData, options)) as { text?: string }
        const text = (result?.text ?? '').trim()

        return {
            text,
            language: language ?? 'en',
            latencyMs: Math.round(performance.now() - t0),
            coldStart: wasCold,
        }
    } catch (err) {
        captureUnlessBlocked(err)
        throw err
    } finally {
        clearTimeout(timeout)
    }
}

/** Get the current status of the Whisper service. */
export function getStatus(): WhisperServiceStatus {
    return {
        ready: pipeline !== null,
        loading: loadingPromise !== null,
        available: isWhisperAvailable(),
    }
}

/** Dispose the Whisper pipeline and free memory. */
export async function dispose(): Promise<void> {
    if (pipeline) {
        try {
            // @xenova/transformers pipelines may have a dispose method
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const p = pipeline as unknown as { dispose?: () => Promise<void> }
            if (typeof p.dispose === 'function') {
                await p.dispose()
            }
        } catch {
            // Ignore disposal errors
        }
        pipeline = null
    }
    loadingPromise = null
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const whisperService = {
    transcribe,
    getStatus,
    dispose,
    isAvailable: isWhisperAvailable,
    SUPPORTED_LANGUAGES: WHISPER_SUPPORTED_LANGUAGES,
} as const

/**
 * WebLLM Engine Lifecycle Service.
 *
 * Extracted from localAI.ts -- owns loading, eviction, inference, and
 * GPU mutex coordination for the @mlc-ai/web-llm runtime.
 */

import { captureLocalAiError } from '@/services/sentryService'
import { getResolvedProfile } from './localAIModelLoader'
import { createInferenceTimer } from './localAiInfrastructureService'
import {
    setEvictWebLlmHook,
    setRehydrateWebLlmHook,
    acquireGpu,
    releaseGpu,
} from './gpuResourceManager'
import { reportWebLlmProgress, reportWebLlmReady, reportWebLlmError } from './webLlmProgressEmitter'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocalWebLlmEngine {
    chat: {
        completions: {
            create: (request: {
                messages: Array<{ role: 'user'; content: string }>
                temperature: number
                max_gen_len: number
                stream?: boolean
            }) => Promise<{
                choices?: Array<{
                    message?: { content?: string }
                }>
            }>
        }
    }
    /** Unload model weights from VRAM. Safe to call multiple times. */
    unload?: () => Promise<void>
}

/** Dependencies injected by the orchestrator (LocalAiService). */
export interface WebLlmDeps {
    /** Record an inference timer via the telemetry service. */
    createInferenceTimer: typeof createInferenceTimer
    /** Persist generated text to in-memory + IndexedDB caches. */
    persistGeneratedText: (prompt: string, content: string, model: string) => void
    /** Inference timeout in milliseconds. */
    timeoutMs: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the active WebLLM model ID via the progressive quantization profile. */
export const getWebLlmModelId = (): string | null => getResolvedProfile().webLlmModelId

const supportsWebGpu = (): boolean => typeof navigator !== 'undefined' && 'gpu' in navigator

/** Race a promise against a timeout. */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Inference timeout')), ms)
        promise.then(
            (value) => {
                clearTimeout(timer)
                resolve(value)
            },
            (error) => {
                clearTimeout(timer)
                reject(error)
            },
        )
    })

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

let enginePromise: Promise<LocalWebLlmEngine | null> | null = null
let evicted = false

const evictEngine = async (): Promise<void> => {
    console.debug('[WebLLM] Evicting engine to free VRAM')
    const engine = enginePromise ? await enginePromise : null
    if (engine?.unload) {
        try {
            await engine.unload()
        } catch (error) {
            captureLocalAiError(error, { stage: 'webllm-eviction' })
        }
    }
    enginePromise = null
    evicted = true
    releaseGpu('webllm')
}

/**
 * Load (or return cached) the WebLLM MLC engine.
 * Registers GPU mutex hooks on first call, retries up to 2x.
 */
export const loadWebLlmEngine = (): Promise<LocalWebLlmEngine | null> => {
    if (!supportsWebGpu()) return Promise.resolve(null)
    const webLlmId = getWebLlmModelId()
    if (!webLlmId) return Promise.resolve(null)

    if (!enginePromise) {
        setEvictWebLlmHook(() => evictEngine())
        setRehydrateWebLlmHook(() => {
            evicted = true
        })

        enginePromise = (async () => {
            await acquireGpu('webllm')
            const PRELOAD_RETRIES = 2
            const loadStartTime = performance.now()
            for (let attempt = 0; attempt <= PRELOAD_RETRIES; attempt++) {
                try {
                    const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
                    const engine = (await CreateMLCEngine(webLlmId, {
                        initProgressCallback: (report: {
                            progress?: number
                            text?: string
                            timeElapsed?: number
                        }) => {
                            const elapsed =
                                typeof report.timeElapsed === 'number'
                                    ? report.timeElapsed
                                    : (performance.now() - loadStartTime) / 1000
                            reportWebLlmProgress({
                                progress: typeof report.progress === 'number' ? report.progress : 0,
                                text: typeof report.text === 'string' ? report.text : '',
                                timeElapsed: elapsed,
                            })
                            console.debug('[WebLLM]', report)
                        },
                    })) as unknown as LocalWebLlmEngine
                    reportWebLlmReady()
                    return engine
                } catch (error) {
                    captureLocalAiError(error, {
                        model: webLlmId,
                        stage: 'webllm',
                        retryAttempt: attempt,
                    })
                    if (attempt < PRELOAD_RETRIES) {
                        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
                        continue
                    }
                    console.debug(
                        '[WebLLM] Unavailable after retries, falling back to Transformers.js.',
                        error,
                    )
                    reportWebLlmError('WebLLM failed to load after retries')
                    releaseGpu('webllm')
                    enginePromise = null
                    return null
                }
            }
            return null
        })()
    }
    return enginePromise
}

/** Whether the WebLLM engine was evicted by the GPU mutex (for re-init detection). */
export const isWebLlmEvicted = (): boolean => evicted

/** Generate text via WebLLM chat completions (single-shot, non-streaming). */
export const generateWithWebLlm = async (
    prompt: string,
    attempt: number,
    deps: WebLlmDeps,
): Promise<string | null> => {
    const engine = await loadWebLlmEngine()
    if (!engine) return null

    try {
        const timer = deps.createInferenceTimer()
        const response = await withTimeout(
            engine.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                max_gen_len: 512,
            }),
            deps.timeoutMs,
        )
        const content = response?.choices?.[0]?.message?.content
        if (typeof content !== 'string' || content.trim().length === 0) return null

        const activeId = getWebLlmModelId() ?? 'webllm-unknown'
        timer.stop({
            model: activeId,
            task: 'text-generation',
            backend: 'webllm',
            tokensGenerated: Math.ceil(content.length / 4),
        })
        deps.persistGeneratedText(prompt, content, activeId)
        return content
    } catch (error) {
        console.debug(`[WebLLM] Generation failed (attempt ${attempt + 1}), falling back.`, error)
        captureLocalAiError(error, {
            model: getWebLlmModelId() ?? 'webllm-unknown',
            stage: 'inference',
            retryAttempt: attempt,
        })
        return null
    }
}

/** Release the engine and reset state. Called from LocalAiService.dispose(). */
export const disposeWebLlm = (): void => {
    if (enginePromise) {
        releaseGpu('webllm')
    }
    enginePromise = null
    evicted = false
}

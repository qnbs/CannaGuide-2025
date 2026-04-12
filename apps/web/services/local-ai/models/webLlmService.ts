/**
 * WebLLM Engine Lifecycle Service.
 *
 * Extracted from localAI.ts -- owns loading, eviction, inference, and
 * GPU mutex coordination for the @mlc-ai/web-llm runtime.
 */

import { captureLocalAiError } from '@/services/sentryService'
import { getResolvedProfile } from './modelLoader'
import { createInferenceTimer } from '../core/infrastructureService'
import {
    setEvictWebLlmHook,
    setRehydrateWebLlmHook,
    acquireGpu,
    releaseGpu,
} from '../device/gpuResourceManager'
import { reportWebLlmProgress, reportWebLlmReady, reportWebLlmError } from '../cache/progressEmitter'
import { checkStorageQuota, isMobileDevice, getConnectionInfo } from '@/utils/browserApis'

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
let activeAbortController: AbortController | null = null

/** Cancel an in-progress WebLLM model download. */
export const cancelWebLlmDownload = (): void => {
    if (activeAbortController) {
        activeAbortController.abort()
        activeAbortController = null
    }
    if (enginePromise) {
        enginePromise = null
        releaseGpu('webllm')
    }
}

/** Whether a download is currently in progress. */
export const isWebLlmDownloading = (): boolean => activeAbortController !== null

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
            // Pre-flight: check storage quota before large download
            const quota = await checkStorageQuota(500) // WebLLM models are 500MB+
            if (!quota.ok) {
                const avail = quota.availableMB !== null ? `${quota.availableMB}` : 'unknown'
                const errorMsg = `Insufficient storage for WebLLM model (${avail} MB available, ~500 MB needed)`
                reportWebLlmError(errorMsg)
                captureLocalAiError(new Error(errorMsg), { stage: 'webllm-storage-check' })
                return null
            }

            // Pre-flight: warn about mobile data usage
            const conn = getConnectionInfo()
            if (conn.isCellular || conn.saveData) {
                console.debug('[WebLLM] Skipping auto-load on cellular/data-saver connection')
                return null
            }

            await acquireGpu('webllm')
            activeAbortController = new AbortController()
            const PRELOAD_RETRIES = isMobileDevice() ? 1 : 2
            const loadStartTime = performance.now()
            for (let attempt = 0; attempt <= PRELOAD_RETRIES; attempt++) {
                // Check if download was cancelled
                if (activeAbortController?.signal.aborted) {
                    console.debug('[WebLLM] Download cancelled by user')
                    activeAbortController = null
                    releaseGpu('webllm')
                    enginePromise = null
                    return null
                }
                try {
                    const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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
                        // Safe cast: CreateMLCEngine returns a compatible engine but
                        // @mlc-ai/web-llm types diverge from our LocalWebLlmEngine interface
                    })) as unknown as LocalWebLlmEngine
                    reportWebLlmReady()
                    activeAbortController = null
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
                    activeAbortController = null
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

/** Whether an error indicates the underlying GPU device was lost. */
const isDeviceLostError = (error: unknown): boolean =>
    error instanceof Error &&
    /device\s*lost|gpu.*lost|lost.*gpu|webgpu.*invalid|context\s*lost|out\s*of\s*memory|OOM|system\s*pressure|adapter.*lost|buffer.*exhausted/i.test(
        error.message,
    )

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
        // If the GPU device was lost, release the mutex immediately to prevent deadlock.
        // Without this, all subsequent acquireGpu('webllm') calls would queue forever
        // because releaseGpu is never invoked through the normal dispose/evict paths.
        if (isDeviceLostError(error)) {
            console.debug(
                '[WebLLM] GPU device lost during inference -- releasing mutex to prevent deadlock',
            )
            enginePromise = null
            releaseGpu('webllm')
        }
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

import {
    getCachedInference,
    setCachedInference,
    createInferenceTimer,
    recordCacheHit,
    recordCacheMiss,
    debouncedPersistSnapshot,
} from './localAiInfrastructureService'
import { recordFallbackEvent } from './localAiTelemetryService'
import { enqueueInference, isWorkerAvailable } from './inferenceQueueService'
import { generateWithWebLlm, type WebLlmDeps } from './localAiWebLlmService'
import { detectOnnxBackend, getResolvedProfile, type LocalAiPipeline } from './localAIModelLoader'
import { captureLocalAiError } from '@/services/sentryService'

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_RETRIES = 2
const WEBLLM_TIMEOUT_MS = 45_000
const TRANSFORMERS_TIMEOUT_MS = 15_000

/** Simple LRU-style inference cache keyed by truncated prompt hash. */
const INFERENCE_CACHE_MAX = 64
const inferenceCache = new Map<string, string>()

// ── Cache Helpers ────────────────────────────────────────────────────────────

const cacheKey = (prompt: string): string => {
    let djb2 = 5381
    let fnv = 0x811c9dc5
    for (let i = 0; i < prompt.length; i++) {
        const c = prompt.charCodeAt(i)
        djb2 = Math.trunc((djb2 << 5) + djb2 + c)
        fnv = Math.trunc((fnv ^ c) * 0x01000193)
    }
    return `${djb2}_${fnv}_${prompt.length}`
}

export const getCached = (prompt: string): string | null => {
    const key = cacheKey(prompt)
    const hit = inferenceCache.get(key)
    if (hit) {
        inferenceCache.delete(key)
        inferenceCache.set(key, hit)
    }
    return hit ?? null
}

export const setCached = (prompt: string, value: string): void => {
    const key = cacheKey(prompt)
    if (inferenceCache.size >= INFERENCE_CACHE_MAX) {
        const oldest = inferenceCache.keys().next().value
        if (oldest !== undefined) inferenceCache.delete(oldest)
    }
    inferenceCache.set(key, value)
}

export const clearInferenceCache = (): void => {
    inferenceCache.clear()
}

// ── Utilities ────────────────────────────────────────────────────────────────

/** Race a promise against a timeout. */
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
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

type GeneratedTextOutput = { generated_text?: string }

export const extractGeneratedText = (value: unknown): string | undefined => {
    if (Array.isArray(value)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const first = value[0] as GeneratedTextOutput | undefined
        return first?.generated_text
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return (value as GeneratedTextOutput | undefined)?.generated_text
}

// ── Dependencies (injected by LocalAiService) ───────────────────────────────

export interface InferenceRouterDeps {
    loadTextPipeline: () => Promise<LocalAiPipeline>
    webLlmDeps: WebLlmDeps
}

// ── Inference Router ─────────────────────────────────────────────────────────

function persistGeneratedText(prompt: string, content: string, model: string): void {
    setCached(prompt, content)
    void setCachedInference(prompt, content, {
        model,
        task: 'text-generation',
    }).catch((error) => captureLocalAiError(error, { stage: 'cache-persist' }))
    debouncedPersistSnapshot()
}

async function tryGenerateWithTransformers(
    prompt: string,
    attempt: number,
    deps: InferenceRouterDeps,
): Promise<string | null> {
    const activeProfile = getResolvedProfile()
    const activeTextId = activeProfile.transformersModelId

    try {
        const timer = createInferenceTimer()
        let generated: string | undefined

        if (isWorkerAvailable()) {
            try {
                const workerResult = await withTimeout(
                    enqueueInference({
                        task: 'text-generation',
                        modelId: activeTextId,
                        input: prompt,
                        pipelineOptions: { quantized: activeProfile.useQuantized },
                        inferenceOptions: {
                            max_new_tokens: 512,
                            do_sample: true,
                            temperature: 0.6,
                            return_full_text: false,
                        },
                        priority: 'normal',
                        timeoutMs: TRANSFORMERS_TIMEOUT_MS,
                    }),
                    TRANSFORMERS_TIMEOUT_MS,
                )
                generated = extractGeneratedText(workerResult)
            } catch (workerError) {
                console.debug(
                    '[LocalAI] Worker inference failed, falling back to main thread.',
                    workerError,
                )
            }
        }

        if (!generated) {
            const generator = await deps.loadTextPipeline()
            const output = await withTimeout(
                generator(prompt, {
                    max_new_tokens: 512,
                    do_sample: true,
                    temperature: 0.6,
                    return_full_text: false,
                }),
                TRANSFORMERS_TIMEOUT_MS,
            )
            generated = extractGeneratedText(output)
        }

        if (typeof generated !== 'string' || generated.trim().length === 0) {
            return null
        }

        timer.stop({
            model: activeTextId,
            task: 'text-generation',
            backend: detectOnnxBackend(),
            tokensGenerated: Math.ceil(generated.length / 4),
        })
        persistGeneratedText(prompt, generated, activeTextId)
        return generated
    } catch (error) {
        console.debug(
            `[LocalAI] Transformers.js text generation failed (attempt ${attempt + 1}).`,
            error,
        )
        captureLocalAiError(error, {
            model: activeTextId,
            stage: 'inference',
            retryAttempt: attempt,
        })
        return null
    }
}

/**
 * Core inference routing: In-memory cache -> IndexedDB cache -> WebLLM -> Transformers.js.
 * Retries up to MAX_RETRIES with exponential backoff.
 */
export async function routeInference(
    prompt: string,
    deps: InferenceRouterDeps,
): Promise<string | null> {
    // Check in-memory inference cache first
    const cached = getCached(prompt)
    if (cached) {
        recordCacheHit()
        recordFallbackEvent('cache', 'in-memory hit')
        return cached
    }

    // Check persistent IndexedDB cache
    const persisted = await getCachedInference(prompt)
    if (persisted) {
        setCached(prompt, persisted)
        recordCacheHit()
        recordFallbackEvent('cache', 'indexeddb hit')
        return persisted
    }

    recordCacheMiss()

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const webLlmResult = await generateWithWebLlm(prompt, attempt, deps.webLlmDeps)
        if (webLlmResult) {
            recordFallbackEvent('webllm')
            return webLlmResult
        }

        const transformersResult = await tryGenerateWithTransformers(prompt, attempt, deps)
        if (transformersResult) {
            recordFallbackEvent('transformers')
            return transformersResult
        }

        if (attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
        }
    }

    return null
}

export { WEBLLM_TIMEOUT_MS, TRANSFORMERS_TIMEOUT_MS }

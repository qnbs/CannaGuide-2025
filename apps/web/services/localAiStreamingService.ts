/**
 * Streaming text generation service.
 *
 * Extracted from localAI.ts -- handles token-by-token WebLLM streaming
 * with batch-mode fallback via Transformers.js.
 */

import { captureLocalAiError } from '@/services/sentryService'
import {
    getCachedInference,
    setCachedInference,
    createInferenceTimer,
    recordCacheHit,
    recordCacheMiss,
    debouncedPersistSnapshot,
} from './localAiInfrastructureService'
import { isMobileDevice } from '@/utils/browserApis'

// ---------------------------------------------------------------------------
// Types for dependency injection (keeps localAI private members private)
// ---------------------------------------------------------------------------

/** Minimal shape of the WebLLM engine needed for streaming. */
interface StreamableWebLlmEngine {
    chat: {
        completions: {
            create: (req: Record<string, unknown>) => Promise<
                AsyncIterable<{
                    choices?: Array<{ delta?: { content?: string } }>
                }>
            >
        }
    }
}

/** Runtime dependencies injected by the orchestrator (LocalAiService). */
export interface StreamingDeps {
    /** In-memory LRU cache read. */
    getCached: (prompt: string) => string | null
    /** In-memory LRU cache write. */
    setCached: (prompt: string, value: string) => void
    /** Resolve the loaded WebLLM engine (null if unavailable). */
    loadWebLlmEngine: () => Promise<StreamableWebLlmEngine | null>
    /** Resolve the active WebLLM model ID for telemetry. */
    getWebLlmModelId: () => string | null
    /** Batch-mode text generation fallback. */
    generateText: (prompt: string) => Promise<string | null>
    /** Inference timeout in milliseconds. */
    timeoutMs: number
}

// ---------------------------------------------------------------------------
// Timeout helper (mirrors the one in localAI.ts)
// ---------------------------------------------------------------------------

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
// Mobile-friendly token callback throttle
// ---------------------------------------------------------------------------

/**
 * Wrap an onToken callback so it fires at most once per animation frame
 * on mobile devices, preventing excessive UI re-renders during streaming.
 * On desktop the callback fires immediately for every token.
 */
const throttleOnToken = (
    onToken: (token: string, accumulated: string) => void,
): ((token: string, accumulated: string) => void) => {
    if (!isMobileDevice()) return onToken

    let rafPending = false
    let latestToken = ''
    let latestAccumulated = ''

    return (token: string, accumulated: string): void => {
        latestToken = token
        latestAccumulated = accumulated
        if (!rafPending) {
            rafPending = true
            requestAnimationFrame(() => {
                rafPending = false
                onToken(latestToken, latestAccumulated)
            })
        }
    }
}

// ---------------------------------------------------------------------------
// Core streaming function
// ---------------------------------------------------------------------------

/**
 * Stream text generation via WebLLM (token-by-token).
 * Falls back to batch `generateText` if WebLLM is unavailable.
 * The onToken callback fires for each generated token chunk.
 * Returns the full concatenated result.
 */
export async function streamTextGeneration(
    prompt: string,
    onToken: (token: string, accumulated: string) => void,
    deps: StreamingDeps,
): Promise<string | null> {
    const throttledOnToken = throttleOnToken(onToken)

    // -- Check in-memory cache --
    const cached = deps.getCached(prompt)
    if (cached) {
        recordCacheHit()
        throttledOnToken(cached, cached)
        return cached
    }

    // -- Check persistent IndexedDB cache --
    const persisted = await getCachedInference(prompt)
    if (persisted) {
        deps.setCached(prompt, persisted)
        recordCacheHit()
        throttledOnToken(persisted, persisted)
        return persisted
    }

    recordCacheMiss()

    // -- Try WebLLM streaming --
    const webLlm = await deps.loadWebLlmEngine()
    if (webLlm) {
        try {
            const timer = createInferenceTimer()

            const stream = await withTimeout(
                webLlm.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.5,
                    max_gen_len: 512,
                    stream: true,
                    stream_options: { include_usage: true },
                }),
                deps.timeoutMs,
            )

            let accumulated = ''
            let tokenCount = 0

            for await (const chunk of stream) {
                const delta = chunk.choices?.[0]?.delta?.content
                if (typeof delta === 'string' && delta.length > 0) {
                    accumulated += delta
                    tokenCount++
                    throttledOnToken(delta, accumulated)
                }
            }

            if (accumulated.trim().length > 0) {
                const activeWebLlmId = deps.getWebLlmModelId() ?? 'webllm-unknown'
                timer.stop({
                    model: activeWebLlmId,
                    task: 'text-generation',
                    backend: 'webllm',
                    tokensGenerated: tokenCount,
                })
                deps.setCached(prompt, accumulated)
                void setCachedInference(prompt, accumulated, {
                    model: activeWebLlmId,
                    task: 'text-generation',
                }).catch((e) => captureLocalAiError(e, { stage: 'cache-persist' }))
                debouncedPersistSnapshot()
                return accumulated
            }
        } catch (error) {
            captureLocalAiError(error, {
                model: deps.getWebLlmModelId() ?? 'webllm-unknown',
                stage: 'webllm-streaming',
            })
            console.debug('[LocalAI] WebLLM streaming failed, falling back to batch mode.')
        }
    }

    // -- Fall back to batch generateText --
    const result = await deps.generateText(prompt)
    if (result) {
        throttledOnToken(result, result)
    }
    return result
}

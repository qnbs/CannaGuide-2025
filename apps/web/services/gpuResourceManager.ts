/**
 * GPU Resource Manager v2 -- Mutual exclusion for GPU-bound workloads.
 *
 * Prevents VRAM collisions between WebLLM (chat inference), SD-Turbo
 * (image generation), and main-thread ONNX-WebGPU pipelines by serializing
 * GPU access through an async priority-queue mutex.
 *
 * Registered consumers:
 *   'webllm'      -- @mlc-ai/web-llm engine (CreateMLCEngine manages its own device)
 *   'image-gen'   -- SD-Turbo text-to-image (WebGPU compute)
 *   'onnx-webgpu' -- Transformers.js ONNX pipelines running on the WebGPU device
 *                    (localAIModelLoader wraps loadTransformersPipeline when backend='webgpu')
 *
 * v2 additions:
 *   - String-based consumer registry (GpuConsumer = string, GPU_CONSUMERS constants)
 *   - Priority queue: 'high' preempts 'normal'/'low' waiters
 *   - Auto-release timeout (AUTO_RELEASE_TIMEOUT_MS) with Sentry capture
 *   - getQueueState() for debugging and UI feedback
 *
 * Flow:
 *   1. Consumer calls acquireGpu(id, priority?) -- default priority 'normal'
 *   2. If another consumer holds the lock -> priority-ordered queue, wait for release
 *   3. If WebLLM holds the lock and image-gen requests it -> evict WebLLM first
 *   4. On release, highest-priority queued consumer is granted the lock
 *   5. If holder does not release within AUTO_RELEASE_TIMEOUT_MS -> auto-release + Sentry
 *
 * Note: CLIP (localAiImageSimilarityService) runs in inference.worker.ts with the
 * WASM backend and does NOT register here -- it never touches WebGPU.
 */

import { captureLocalAiError } from './sentryService'

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Identifier for a GPU consumer. Typed as string for extensibility.
 * Prefer GPU_CONSUMERS constants over raw string literals.
 */
export type GpuConsumer = string

/** Known GPU consumer identifiers. */
export const GPU_CONSUMERS = {
    WEBLLM: 'webllm',
    IMAGE_GEN: 'image-gen',
    ONNX_WEBGPU: 'onnx-webgpu',
} as const

/** Priority level for GPU lock acquisition. High-priority consumers skip normal/low waiters. */
export type GpuPriority = 'high' | 'normal' | 'low'

export interface GpuLockState {
    /** Whether the GPU lock is currently held. */
    locked: boolean
    /** Which consumer currently holds the lock (null if free). */
    holder: GpuConsumer | null
    /** Number of consumers waiting for the lock. */
    queueLength: number
}

interface QueueEntry {
    consumer: GpuConsumer
    priority: GpuPriority
    resolve: () => void
    reject: (reason: Error) => void
}

// ─── State ───────────────────────────────────────────────────────────────────

let currentHolder: GpuConsumer | null = null
const waitQueue: QueueEntry[] = []

/**
 * Hook: called before image generation acquires the GPU when WebLLM is loaded.
 * Set by localAI.ts to unload the WebLLM engine and free VRAM.
 */
let evictWebLlmHook: (() => Promise<void>) | null = null

/**
 * Hook: called after image generation releases the GPU.
 * Allows WebLLM to lazily re-initialize on next chat request.
 */
let rehydrateWebLlmHook: (() => void) | null = null

// ─── Auto-release timeout ─────────────────────────────────────────────────────

/** Exported for unit tests. Do not modify. */
export const AUTO_RELEASE_TIMEOUT_MS = 30_000

const PRIORITY_ORDER: Record<GpuPriority, number> = { high: 0, normal: 1, low: 2 }

let autoReleaseTimer: ReturnType<typeof setTimeout> | null = null

function startAutoReleaseTimer(consumer: GpuConsumer): void {
    clearAutoReleaseTimer()
    autoReleaseTimer = setTimeout(() => {
        if (currentHolder === consumer) {
            console.debug(
                `[GpuMutex] Auto-releasing GPU from '${consumer}' after ${AUTO_RELEASE_TIMEOUT_MS}ms (deadlock prevention)`,
            )
            captureLocalAiError(
                new Error(`GpuMutex: '${consumer}' held GPU for >${AUTO_RELEASE_TIMEOUT_MS}ms`),
                { stage: 'gpu-mutex-auto-release', consumer },
            )
            releaseGpu(consumer)
        }
    }, AUTO_RELEASE_TIMEOUT_MS)
}

function clearAutoReleaseTimer(): void {
    if (autoReleaseTimer !== null) {
        clearTimeout(autoReleaseTimer)
        autoReleaseTimer = null
    }
}

// ─── Queue helpers ────────────────────────────────────────────────────────────

function insertByPriority(entry: QueueEntry): void {
    const idx = waitQueue.findIndex(
        (e) => PRIORITY_ORDER[e.priority] > PRIORITY_ORDER[entry.priority],
    )
    if (idx === -1) {
        waitQueue.push(entry)
    } else {
        waitQueue.splice(idx, 0, entry)
    }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Register the WebLLM eviction callback.
 * Called once during LocalAiService initialization.
 */
export const setEvictWebLlmHook = (hook: () => Promise<void>): void => {
    evictWebLlmHook = hook
}

/**
 * Register the WebLLM rehydration callback.
 * Called once during LocalAiService initialization.
 */
export const setRehydrateWebLlmHook = (hook: () => void): void => {
    rehydrateWebLlmHook = hook
}

/**
 * Acquire exclusive GPU access for the given consumer.
 * If the GPU is held by another consumer, the caller awaits in a priority-ordered queue.
 *
 * Special rule: when `image-gen` requests the GPU while `webllm` holds it,
 * the eviction hook is called to free VRAM before granting the lock.
 *
 * @param consumer  Consumer identifier. Use GPU_CONSUMERS constants.
 * @param priority  Queue priority (default: 'normal'). High skips normal/low waiters.
 */
export const acquireGpu = async (
    consumer: GpuConsumer,
    priority: GpuPriority = 'normal',
): Promise<void> => {
    // Fast path: GPU is free
    if (currentHolder === null) {
        currentHolder = consumer
        startAutoReleaseTimer(consumer)
        console.debug(`[GpuMutex] Acquired by ${consumer}`)
        return
    }

    // Re-entrant: same consumer already holds it
    if (currentHolder === consumer) {
        return
    }

    // Image-gen needs the GPU but WebLLM holds it -> evict WebLLM
    if (consumer === 'image-gen' && currentHolder === 'webllm' && evictWebLlmHook) {
        console.debug('[GpuMutex] Evicting WebLLM to free VRAM for image generation')
        try {
            await evictWebLlmHook()
        } catch (error) {
            captureLocalAiError(error, { stage: 'gpu-mutex-eviction' })
            console.debug('[GpuMutex] WebLLM eviction failed, proceeding anyway', error)
        }
        clearAutoReleaseTimer()
        currentHolder = consumer
        startAutoReleaseTimer(consumer)
        console.debug(`[GpuMutex] Acquired by ${consumer} (after WebLLM eviction)`)
        return
    }

    // Otherwise: priority-ordered queue and wait
    return new Promise<void>((resolve, reject) => {
        insertByPriority({ consumer, priority, resolve, reject })
        console.debug(
            `[GpuMutex] ${consumer} queued at priority=${priority} (queue length: ${waitQueue.length}), held by ${currentHolder}`,
        )
    })
}

/**
 * Release the GPU lock.
 * If image-gen releases and WebLLM was previously evicted, triggers rehydration.
 * Grants the lock to the highest-priority queued consumer.
 */
export const releaseGpu = (consumer: GpuConsumer): void => {
    if (currentHolder !== consumer) {
        console.debug(`[GpuMutex] Release ignored -- ${consumer} does not hold the lock`)
        return
    }

    const wasImageGen = currentHolder === 'image-gen'
    currentHolder = null
    clearAutoReleaseTimer()
    console.debug(`[GpuMutex] Released by ${consumer}`)

    // After image-gen releases, signal WebLLM can lazy-reload on next request
    if (wasImageGen && rehydrateWebLlmHook) {
        try {
            rehydrateWebLlmHook()
        } catch (error) {
            captureLocalAiError(error, { stage: 'gpu-mutex-rehydrate' })
        }
    }

    // Grant lock to highest-priority waiter
    if (waitQueue.length > 0) {
        const next = waitQueue.shift()!
        currentHolder = next.consumer
        startAutoReleaseTimer(next.consumer)
        console.debug(`[GpuMutex] Granted to queued ${next.consumer} (priority=${next.priority})`)
        next.resolve()
    }
}

/** Get current GPU lock state (for UI display). */
export const getGpuLockState = (): GpuLockState => ({
    locked: currentHolder !== null,
    holder: currentHolder,
    queueLength: waitQueue.length,
})

/** Get queue state for debugging and UI feedback. */
export const getQueueState = (): { current: string | null; queue: string[] } => ({
    current: currentHolder,
    queue: waitQueue.map((e) => e.consumer),
})

/** Check if a specific consumer currently holds the GPU lock. */
export const isGpuHeldBy = (consumer: GpuConsumer): boolean => currentHolder === consumer

/** Reset all state (for tests). */
export const resetGpuMutex = (): void => {
    currentHolder = null
    waitQueue.length = 0
    evictWebLlmHook = null
    rehydrateWebLlmHook = null
    clearAutoReleaseTimer()
}

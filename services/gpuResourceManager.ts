/**
 * GPU Resource Manager — Mutual exclusion for GPU-bound workloads.
 *
 * Prevents VRAM collisions between WebLLM (chat inference) and SD-Turbo
 * (image generation) by serializing GPU access through an async mutex.
 *
 * Flow:
 *   1. Consumer calls `acquireGpu('webllm' | 'image-gen')`
 *   2. If another consumer holds the lock → queue, wait for release
 *   3. If WebLLM holds the lock and image-gen requests it → evict WebLLM first
 *   4. On release, next queued consumer is granted the lock
 */

import { captureLocalAiError } from './sentryService'

// ─── Types ───────────────────────────────────────────────────────────────────

export type GpuConsumer = 'webllm' | 'image-gen'

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
 * If the GPU is held by another consumer, the caller awaits in a FIFO queue.
 *
 * Special rule: when `image-gen` requests the GPU while `webllm` holds it,
 * the eviction hook is called to free VRAM before granting the lock.
 */
export const acquireGpu = async (consumer: GpuConsumer): Promise<void> => {
    // Fast path: GPU is free
    if (currentHolder === null) {
        currentHolder = consumer
        console.debug(`[GpuMutex] Acquired by ${consumer}`)
        return
    }

    // Re-entrant: same consumer already holds it
    if (currentHolder === consumer) {
        return
    }

    // Image-gen needs the GPU but WebLLM holds it → evict WebLLM
    if (consumer === 'image-gen' && currentHolder === 'webllm' && evictWebLlmHook) {
        console.debug('[GpuMutex] Evicting WebLLM to free VRAM for image generation')
        try {
            await evictWebLlmHook()
        } catch (error) {
            captureLocalAiError(error, { stage: 'gpu-mutex-eviction' })
            console.debug('[GpuMutex] WebLLM eviction failed, proceeding anyway', error)
        }
        currentHolder = consumer
        console.debug(`[GpuMutex] Acquired by ${consumer} (after WebLLM eviction)`)
        return
    }

    // Otherwise: queue and wait
    return new Promise<void>((resolve, reject) => {
        waitQueue.push({ consumer, resolve, reject })
        console.debug(
            `[GpuMutex] ${consumer} queued (queue length: ${waitQueue.length}), held by ${currentHolder}`,
        )
    })
}

/**
 * Release the GPU lock.
 * If image-gen releases and WebLLM was previously evicted, triggers rehydration.
 * Grants the lock to the next queued consumer.
 */
export const releaseGpu = (consumer: GpuConsumer): void => {
    if (currentHolder !== consumer) {
        console.debug(`[GpuMutex] Release ignored — ${consumer} does not hold the lock`)
        return
    }

    const wasImageGen = currentHolder === 'image-gen'
    currentHolder = null
    console.debug(`[GpuMutex] Released by ${consumer}`)

    // After image-gen releases, signal WebLLM can lazy-reload on next request
    if (wasImageGen && rehydrateWebLlmHook) {
        try {
            rehydrateWebLlmHook()
        } catch (error) {
            captureLocalAiError(error, { stage: 'gpu-mutex-rehydrate' })
        }
    }

    // Grant lock to next waiter
    if (waitQueue.length > 0) {
        const next = waitQueue.shift()!
        currentHolder = next.consumer
        console.debug(`[GpuMutex] Granted to queued ${next.consumer}`)
        next.resolve()
    }
}

/** Get current GPU lock state (for UI display). */
export const getGpuLockState = (): GpuLockState => ({
    locked: currentHolder !== null,
    holder: currentHolder,
    queueLength: waitQueue.length,
})

/** Check if a specific consumer currently holds the GPU lock. */
export const isGpuHeldBy = (consumer: GpuConsumer): boolean => currentHolder === consumer

/** Reset all state (for tests). */
export const resetGpuMutex = (): void => {
    currentHolder = null
    waitQueue.length = 0
    evictWebLlmHook = null
    rehydrateWebLlmHook = null
}

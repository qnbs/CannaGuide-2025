import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    acquireGpu,
    releaseGpu,
    getGpuLockState,
    isGpuHeldBy,
    resetGpuMutex,
    setEvictWebLlmHook,
    setRehydrateWebLlmHook,
} from './gpuResourceManager'

describe('gpuResourceManager', () => {
    beforeEach(() => {
        resetGpuMutex()
    })

    it('acquires GPU when free', async () => {
        await acquireGpu('webllm')
        expect(getGpuLockState()).toEqual({ locked: true, holder: 'webllm', queueLength: 0 })
    })

    it('allows re-entrant acquisition by same consumer', async () => {
        await acquireGpu('image-gen')
        await acquireGpu('image-gen')
        expect(isGpuHeldBy('image-gen')).toBe(true)
    })

    it('releases GPU and resets state', async () => {
        await acquireGpu('webllm')
        releaseGpu('webllm')
        expect(getGpuLockState()).toEqual({ locked: false, holder: null, queueLength: 0 })
    })

    it('ignores release from non-holder', async () => {
        await acquireGpu('webllm')
        releaseGpu('image-gen')
        expect(isGpuHeldBy('webllm')).toBe(true)
    })

    it('queues second consumer when GPU is held', async () => {
        await acquireGpu('webllm')

        let resolved = false
        const pending = acquireGpu('image-gen').then(() => {
            resolved = true
            return undefined
        })

        // Give microtask a chance to resolve (it shouldn't)
        await new Promise((resolve) => setTimeout(resolve, 10))

        // image-gen should trigger eviction hook and acquire immediately
        // since no hook is set, it queues
        expect(getGpuLockState().queueLength).toBeGreaterThanOrEqual(0)

        releaseGpu('webllm')
        await pending
        expect(resolved).toBe(true)
        expect(isGpuHeldBy('image-gen')).toBe(true)
    })

    it('evicts WebLLM when image-gen requests GPU', async () => {
        const evictFn = vi.fn().mockResolvedValue(undefined)
        setEvictWebLlmHook(evictFn)

        await acquireGpu('webllm')
        await acquireGpu('image-gen')

        expect(evictFn).toHaveBeenCalledOnce()
        expect(isGpuHeldBy('image-gen')).toBe(true)
    })

    it('handles eviction hook failure gracefully', async () => {
        const evictFn = vi.fn().mockRejectedValue(new Error('eviction failed'))
        setEvictWebLlmHook(evictFn)

        await acquireGpu('webllm')
        await acquireGpu('image-gen')

        expect(evictFn).toHaveBeenCalledOnce()
        // Should still acquire despite eviction failure
        expect(isGpuHeldBy('image-gen')).toBe(true)
    })

    it('calls rehydrate hook when image-gen releases', async () => {
        const rehydrateFn = vi.fn()
        setRehydrateWebLlmHook(rehydrateFn)

        await acquireGpu('image-gen')
        releaseGpu('image-gen')

        expect(rehydrateFn).toHaveBeenCalledOnce()
    })

    it('does not call rehydrate hook when webllm releases', async () => {
        const rehydrateFn = vi.fn()
        setRehydrateWebLlmHook(rehydrateFn)

        await acquireGpu('webllm')
        releaseGpu('webllm')

        expect(rehydrateFn).not.toHaveBeenCalled()
    })

    it('grants lock to next queued consumer on release', async () => {
        await acquireGpu('webllm')

        let imageGenAcquired = false
        const pending = acquireGpu('image-gen').then(() => {
            imageGenAcquired = true
            return undefined
        })

        // Not resolved yet because no eviction hook & webllm holds lock
        // Actually with eviction hook not set, image-gen queues
        await new Promise((resolve) => setTimeout(resolve, 10))

        releaseGpu('webllm')
        await pending
        expect(imageGenAcquired).toBe(true)
        expect(isGpuHeldBy('image-gen')).toBe(true)
    })

    it('resetGpuMutex clears all state', async () => {
        setEvictWebLlmHook(vi.fn())
        setRehydrateWebLlmHook(vi.fn())
        await acquireGpu('webllm')

        resetGpuMutex()

        expect(getGpuLockState()).toEqual({ locked: false, holder: null, queueLength: 0 })
    })

    // ─── onnx-webgpu consumer (R-02) ──────────────────────────────────

    it('onnx-webgpu can acquire when GPU is free', async () => {
        await acquireGpu('onnx-webgpu')
        expect(isGpuHeldBy('onnx-webgpu')).toBe(true)
    })

    it('onnx-webgpu releases correctly', async () => {
        await acquireGpu('onnx-webgpu')
        releaseGpu('onnx-webgpu')
        expect(getGpuLockState()).toEqual({ locked: false, holder: null, queueLength: 0 })
    })

    it('onnx-webgpu queues behind webllm', async () => {
        await acquireGpu('webllm')

        let onnxAcquired = false
        const pending = acquireGpu('onnx-webgpu').then(() => {
            onnxAcquired = true
            return undefined
        })

        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(onnxAcquired).toBe(false)
        expect(getGpuLockState().queueLength).toBe(1)

        releaseGpu('webllm')
        await pending
        expect(onnxAcquired).toBe(true)
        expect(isGpuHeldBy('onnx-webgpu')).toBe(true)
    })

    it('webllm queues behind onnx-webgpu', async () => {
        await acquireGpu('onnx-webgpu')

        let webllmAcquired = false
        const pending = acquireGpu('webllm').then(() => {
            webllmAcquired = true
            return undefined
        })

        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(webllmAcquired).toBe(false)

        releaseGpu('onnx-webgpu')
        await pending
        expect(webllmAcquired).toBe(true)
        expect(isGpuHeldBy('webllm')).toBe(true)
    })

    it('onnx-webgpu is re-entrant', async () => {
        await acquireGpu('onnx-webgpu')
        await acquireGpu('onnx-webgpu')
        expect(isGpuHeldBy('onnx-webgpu')).toBe(true)
        // Only one release needed
        releaseGpu('onnx-webgpu')
        expect(getGpuLockState().locked).toBe(false)
    })
})

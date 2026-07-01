import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const infraMocks = vi.hoisted(() => ({
    getCachedInference: vi.fn<(key: string) => Promise<string | null>>(async () => null),
    setCachedInference: vi.fn(async () => undefined),
    createInferenceTimer: vi.fn(() => ({ stop: vi.fn() })),
    recordCacheHit: vi.fn(),
    recordCacheMiss: vi.fn(),
    debouncedPersistSnapshot: vi.fn(),
}))

const queueMocks = vi.hoisted(() => ({
    enqueueInference: vi.fn(async () => [{ generated_text: 'worker result' }]),
    isWorkerAvailable: vi.fn(() => false),
}))

const webLlmMocks = vi.hoisted(() => ({
    generateWithWebLlm: vi.fn<() => Promise<string | null>>(async () => null),
}))

// Mock all external dependencies before importing the module under test
vi.mock('../core/infrastructureService', () => infraMocks)

vi.mock('../inference/inferenceQueue', () => queueMocks)

vi.mock('../models/webLlmService', () => webLlmMocks)

vi.mock('../models/modelLoader', () => ({
    detectOnnxBackend: vi.fn(() => 'wasm'),
    getResolvedProfile: vi.fn(() => ({
        transformersModelId: 'test-model',
        useQuantized: true,
        webLlmModelId: 'test-webllm',
    })),
}))

vi.mock('@/services/sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

import {
    routeInference,
    getCached,
    setCached,
    clearInferenceCache,
    extractGeneratedText,
    withTimeout,
    type InferenceRouterDeps,
} from './inferenceRouter'

const mockDeps: InferenceRouterDeps = {
    loadTextPipeline: vi.fn(async () => vi.fn(async () => [{ generated_text: 'pipeline result' }])),
    webLlmDeps: {
        createInferenceTimer: vi.fn(() => ({ stop: vi.fn() })),
        persistGeneratedText: vi.fn(),
        timeoutMs: 5000,
    },
}

describe('localAiInferenceRouter', () => {
    beforeEach(() => {
        clearInferenceCache()
        infraMocks.getCachedInference.mockReset()
        infraMocks.getCachedInference.mockResolvedValue(null)
        webLlmMocks.generateWithWebLlm.mockReset()
        webLlmMocks.generateWithWebLlm.mockResolvedValue(null)
        queueMocks.isWorkerAvailable.mockReset()
        queueMocks.isWorkerAvailable.mockReturnValue(false)
        queueMocks.enqueueInference.mockReset()
        queueMocks.enqueueInference.mockResolvedValue([{ generated_text: 'worker result' }])
    })

    afterEach(() => {
        clearInferenceCache()
    })

    // ── Cache helpers ────────────────────────────────────────────────────

    it('getCached returns null on miss', () => {
        expect(getCached('unknown-prompt')).toBeNull()
    })

    it('getCached returns value after setCached', () => {
        setCached('test-prompt', 'cached-value')
        expect(getCached('test-prompt')).toBe('cached-value')
    })

    it('clearInferenceCache empties the cache', () => {
        setCached('p1', 'v1')
        clearInferenceCache()
        expect(getCached('p1')).toBeNull()
    })

    // ── extractGeneratedText ─────────────────────────────────────────────

    it('extracts from array output', () => {
        expect(extractGeneratedText([{ generated_text: 'hello' }])).toBe('hello')
    })

    it('extracts from object output', () => {
        expect(extractGeneratedText({ generated_text: 'world' })).toBe('world')
    })

    it('returns undefined for empty array', () => {
        expect(extractGeneratedText([])).toBeUndefined()
    })

    // ── withTimeout ──────────────────────────────────────────────────────

    it('resolves before timeout', async () => {
        const result = await withTimeout(Promise.resolve('ok'), 5000)
        expect(result).toBe('ok')
    })

    it('rejects on timeout', async () => {
        const slow = new Promise(() => {
            // never resolves
        })
        await expect(withTimeout(slow, 10)).rejects.toThrow('Inference timeout')
    })

    // ── routeInference ───────────────────────────────────────────────────

    it('returns in-memory cached result', async () => {
        setCached('cached-prompt', 'from-memory')
        const result = await routeInference('cached-prompt', mockDeps)
        expect(result).toBe('from-memory')
    })

    it('returns IndexedDB cached result', async () => {
        const prompt = `idb-prompt-${Date.now()}`
        infraMocks.getCachedInference.mockImplementation(async (key: string) =>
            key === prompt ? 'from-idb' : null,
        )
        const result = await routeInference(prompt, mockDeps)
        expect(result).toBe('from-idb')
        // Backfilled into in-memory cache
        expect(getCached(prompt)).toBe('from-idb')
    })

    it('routes to WebLLM first', async () => {
        webLlmMocks.generateWithWebLlm.mockResolvedValueOnce('webllm-result')
        const result = await routeInference('webllm-prompt', mockDeps)
        expect(result).toBe('webllm-result')
    })

    it('falls back to Transformers.js when WebLLM fails', async () => {
        webLlmMocks.generateWithWebLlm.mockResolvedValue(null)
        const result = await routeInference('tf-prompt', mockDeps)
        expect(result).toBe('pipeline result')
    })

    it('uses worker when available', async () => {
        webLlmMocks.generateWithWebLlm.mockResolvedValue(null)
        queueMocks.isWorkerAvailable.mockReturnValue(true)
        queueMocks.enqueueInference.mockResolvedValue([{ generated_text: 'worker output' }])
        const result = await routeInference('worker-prompt', mockDeps)
        expect(result).toBe('worker output')
    })

    it('returns null after all retries exhausted', async () => {
        webLlmMocks.generateWithWebLlm.mockResolvedValue(null)
        queueMocks.isWorkerAvailable.mockReturnValue(false)
        const failDeps: InferenceRouterDeps = {
            ...mockDeps,
            loadTextPipeline: vi.fn(async () => vi.fn(async () => [{ generated_text: '' }])),
        }
        const result = await routeInference('fail-prompt', failDeps)
        expect(result).toBeNull()
    })
})

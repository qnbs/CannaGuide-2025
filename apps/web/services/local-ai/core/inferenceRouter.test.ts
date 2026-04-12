import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock all external dependencies before importing the module under test
vi.mock('../core/infrastructureService', () => ({
    getCachedInference: vi.fn(async () => null),
    setCachedInference: vi.fn(async () => undefined),
    createInferenceTimer: vi.fn(() => ({ stop: vi.fn() })),
    recordCacheHit: vi.fn(),
    recordCacheMiss: vi.fn(),
    debouncedPersistSnapshot: vi.fn(),
}))

vi.mock('../inference/inferenceQueue', () => ({
    enqueueInference: vi.fn(async () => [{ generated_text: 'worker result' }]),
    isWorkerAvailable: vi.fn(() => false),
}))

vi.mock('../models/webLlmService', () => ({
    generateWithWebLlm: vi.fn(async () => null),
}))

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
import { getCachedInference } from './infrastructureService'
import { generateWithWebLlm } from '../models/webLlmService'
import { isWorkerAvailable, enqueueInference } from '../inference/inferenceQueue'

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
        vi.clearAllMocks()
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
        vi.mocked(getCachedInference).mockResolvedValueOnce('from-idb')
        const result = await routeInference('idb-prompt', mockDeps)
        expect(result).toBe('from-idb')
        // Backfilled into in-memory cache
        expect(getCached('idb-prompt')).toBe('from-idb')
    })

    it('routes to WebLLM first', async () => {
        vi.mocked(generateWithWebLlm).mockResolvedValueOnce('webllm-result')
        const result = await routeInference('webllm-prompt', mockDeps)
        expect(result).toBe('webllm-result')
    })

    it('falls back to Transformers.js when WebLLM fails', async () => {
        vi.mocked(generateWithWebLlm).mockResolvedValue(null)
        const result = await routeInference('tf-prompt', mockDeps)
        expect(result).toBe('pipeline result')
    })

    it('uses worker when available', async () => {
        vi.mocked(generateWithWebLlm).mockResolvedValue(null)
        vi.mocked(isWorkerAvailable).mockReturnValue(true)
        vi.mocked(enqueueInference).mockResolvedValue([{ generated_text: 'worker output' }])
        const result = await routeInference('worker-prompt', mockDeps)
        expect(result).toBe('worker output')
    })

    it('returns null after all retries exhausted', async () => {
        vi.mocked(generateWithWebLlm).mockResolvedValue(null)
        vi.mocked(isWorkerAvailable).mockReturnValue(false)
        const failDeps: InferenceRouterDeps = {
            ...mockDeps,
            loadTextPipeline: vi.fn(async () => vi.fn(async () => [{ generated_text: '' }])),
        }
        const result = await routeInference('fail-prompt', failDeps)
        expect(result).toBeNull()
    })
})

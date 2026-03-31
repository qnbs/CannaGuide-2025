import { describe, expect, it, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/services/sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

const mockGetCachedInference = vi.fn()
const mockSetCachedInference = vi.fn()

vi.mock('./localAiCacheService', () => ({
    getCachedInference: (...args: unknown[]) => mockGetCachedInference(...args),
    setCachedInference: (...args: unknown[]) => mockSetCachedInference(...args),
    clearPersistentCache: vi.fn(),
    getCacheSize: vi.fn(() => Promise.resolve(0)),
    getCacheBreakdown: vi.fn(() => Promise.resolve({})),
    applyCacheSettings: vi.fn(),
    resetCacheDb: vi.fn(),
}))

const mockCreateInferenceTimer = vi.fn()
const mockRecordCacheHit = vi.fn()
const mockRecordCacheMiss = vi.fn()
const mockDebouncedPersistSnapshot = vi.fn()

vi.mock('./localAiTelemetryService', () => ({
    createInferenceTimer: () => mockCreateInferenceTimer(),
    recordCacheHit: () => mockRecordCacheHit(),
    recordCacheMiss: () => mockRecordCacheMiss(),
    debouncedPersistSnapshot: () => mockDebouncedPersistSnapshot(),
    recordInference: vi.fn(),
    measureInference: vi.fn(),
    getSnapshot: vi.fn(() => ({
        totalInferences: 0,
        totalTokensGenerated: 0,
        averageLatencyMs: 0,
        averageTokensPerSecond: 0,
        cacheHitRate: 0,
        modelBreakdown: {},
        backendBreakdown: {},
        successRate: 1,
        peakTokensPerSecond: 0,
        lastUpdated: 0,
    })),
    persistSnapshot: vi.fn(),
    loadPersistedSnapshot: vi.fn(),
    checkPerformanceDegradation: vi.fn(() => ({
        degraded: false,
        recentTokensPerSecond: 0,
        recommendation: 'none',
    })),
    resetTelemetry: vi.fn(),
}))

vi.mock('./localAiPreloadService', () => ({
    localAiPreloadService: {
        getStatus: vi.fn(() => ({ state: 'idle' })),
        isReady: vi.fn(() => false),
        preloadOfflineModels: vi.fn(),
    },
    ensurePersistentStorage: vi.fn(() => Promise.resolve(null)),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { streamTextGeneration, type StreamingDeps } from '@/services/localAiStreamingService'
import { captureLocalAiError } from '@/services/sentryService'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildDeps = (overrides?: Partial<StreamingDeps>): StreamingDeps => ({
    getCached: vi.fn(() => null),
    setCached: vi.fn(),
    loadWebLlmEngine: vi.fn(async () => null),
    getWebLlmModelId: vi.fn(() => 'test-model'),
    generateText: vi.fn(async () => null),
    timeoutMs: 60_000,
    ...overrides,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('localAiStreamingService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetCachedInference.mockResolvedValue(null)
        mockSetCachedInference.mockResolvedValue(undefined)
        mockCreateInferenceTimer.mockReturnValue({ stop: vi.fn() })
    })

    // ── In-memory cache hit ──────────────────────────────────────────

    describe('cache behavior', () => {
        it('returns in-memory cached result and fires onToken', async () => {
            const onToken = vi.fn()
            const deps = buildDeps({
                getCached: vi.fn(() => 'cached response'),
            })

            const result = await streamTextGeneration('test prompt', onToken, deps)

            expect(result).toBe('cached response')
            expect(onToken).toHaveBeenCalledWith('cached response', 'cached response')
            expect(mockRecordCacheHit).toHaveBeenCalled()
            expect(deps.loadWebLlmEngine).not.toHaveBeenCalled()
        })

        it('returns IndexedDB cached result when in-memory misses', async () => {
            const onToken = vi.fn()
            mockGetCachedInference.mockResolvedValue('persisted response')
            const deps = buildDeps()

            const result = await streamTextGeneration('test prompt', onToken, deps)

            expect(result).toBe('persisted response')
            expect(onToken).toHaveBeenCalledWith('persisted response', 'persisted response')
            expect(deps.setCached).toHaveBeenCalledWith('test prompt', 'persisted response')
            expect(mockRecordCacheHit).toHaveBeenCalled()
        })
    })

    // ── WebLLM streaming ─────────────────────────────────────────────

    describe('WebLLM streaming', () => {
        it('streams tokens from WebLLM engine and calls onToken for each chunk', async () => {
            const onToken = vi.fn()
            const timerStop = vi.fn()
            mockCreateInferenceTimer.mockReturnValue({ stop: timerStop })

            // Simulate async iterable stream
            const chunks = [
                { choices: [{ delta: { content: 'Hello' } }] },
                { choices: [{ delta: { content: ' World' } }] },
            ]

            const mockEngine = {
                chat: {
                    completions: {
                        create: vi.fn(async () => ({
                            [Symbol.asyncIterator]: async function* () {
                                for (const chunk of chunks) {
                                    yield chunk
                                }
                            },
                        })),
                    },
                },
            }

            const deps = buildDeps({
                loadWebLlmEngine: vi.fn(async () => mockEngine),
            })

            const result = await streamTextGeneration('test prompt', onToken, deps)

            expect(result).toBe('Hello World')
            expect(onToken).toHaveBeenCalledTimes(2)
            expect(onToken).toHaveBeenCalledWith('Hello', 'Hello')
            expect(onToken).toHaveBeenCalledWith(' World', 'Hello World')
            expect(deps.setCached).toHaveBeenCalledWith('test prompt', 'Hello World')
            expect(timerStop).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: 'test-model',
                    task: 'text-generation',
                    backend: 'webllm',
                    tokensGenerated: 2,
                }),
            )
            expect(mockRecordCacheMiss).toHaveBeenCalled()
        })

        it('falls back to batch generateText when WebLLM is unavailable', async () => {
            const onToken = vi.fn()
            const deps = buildDeps({
                loadWebLlmEngine: vi.fn(async () => null),
                generateText: vi.fn(async () => 'batch result'),
            })

            const result = await streamTextGeneration('test prompt', onToken, deps)

            expect(result).toBe('batch result')
            expect(onToken).toHaveBeenCalledWith('batch result', 'batch result')
        })

        it('falls back to batch when WebLLM streaming throws', async () => {
            const onToken = vi.fn()

            const mockEngine = {
                chat: {
                    completions: {
                        create: vi.fn(async () => {
                            throw new Error('WebLLM crash')
                        }),
                    },
                },
            }

            const deps = buildDeps({
                loadWebLlmEngine: vi.fn(async () => mockEngine),
                generateText: vi.fn(async () => 'fallback batch'),
            })

            const result = await streamTextGeneration('test prompt', onToken, deps)

            expect(result).toBe('fallback batch')
            expect(captureLocalAiError).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({ stage: 'webllm-streaming' }),
            )
        })

        it('returns null when both WebLLM and batch fail', async () => {
            const onToken = vi.fn()
            const deps = buildDeps({
                loadWebLlmEngine: vi.fn(async () => null),
                generateText: vi.fn(async () => null),
            })

            const result = await streamTextGeneration('test prompt', onToken, deps)

            expect(result).toBeNull()
            expect(onToken).not.toHaveBeenCalled()
        })
    })

    // ── WebLLM empty stream fallback ─────────────────────────────────

    describe('empty stream fallback', () => {
        it('falls back to batch when WebLLM stream produces empty content', async () => {
            const onToken = vi.fn()

            const chunks = [{ choices: [{ delta: { content: '' } }] }, { choices: [{ delta: {} }] }]

            const mockEngine = {
                chat: {
                    completions: {
                        create: vi.fn(async () => ({
                            [Symbol.asyncIterator]: async function* () {
                                for (const chunk of chunks) {
                                    yield chunk
                                }
                            },
                        })),
                    },
                },
            }

            const deps = buildDeps({
                loadWebLlmEngine: vi.fn(async () => mockEngine),
                generateText: vi.fn(async () => 'batch fallback after empty stream'),
            })

            const result = await streamTextGeneration('test prompt', onToken, deps)

            expect(result).toBe('batch fallback after empty stream')
        })
    })
})

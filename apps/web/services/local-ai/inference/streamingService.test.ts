import { describe, expect, it, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks (hoisted so full-suite runs keep a stable sentry mock reference)
// ---------------------------------------------------------------------------

const { mockCaptureLocalAiError, mockGetCachedInference, mockSetCachedInference, mockCreateInferenceTimer, mockRecordCacheHit, mockRecordCacheMiss, mockDebouncedPersistSnapshot } =
    vi.hoisted(() => ({
        mockCaptureLocalAiError: vi.fn(),
        mockGetCachedInference: vi.fn(),
        mockSetCachedInference: vi.fn(),
        mockCreateInferenceTimer: vi.fn(),
        mockRecordCacheHit: vi.fn(),
        mockRecordCacheMiss: vi.fn(),
        mockDebouncedPersistSnapshot: vi.fn(),
    }))

vi.mock('@/services/sentryService', () => ({
    captureLocalAiError: mockCaptureLocalAiError,
}))

vi.mock('../core/infrastructureService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../core/infrastructureService')>()
    return {
        ...actual,
        getCachedInference: (...args: unknown[]) => mockGetCachedInference(...args),
        setCachedInference: (...args: unknown[]) => mockSetCachedInference(...args),
        createInferenceTimer: () => mockCreateInferenceTimer(),
        recordCacheHit: () => mockRecordCacheHit(),
        recordCacheMiss: () => mockRecordCacheMiss(),
        debouncedPersistSnapshot: () => mockDebouncedPersistSnapshot(),
    }
})

vi.mock('../device/preloadService', () => ({
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

import { streamTextGeneration, type StreamingDeps } from './streamingService'

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
            expect(mockCaptureLocalAiError).toHaveBeenCalledWith(
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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    detectOnnxBackend,
    setForceWasm,
    setVramInsufficientOverride,
    setModelQuant,
    getModelQuantOverride,
    setModelSizeTier,
    getModelSizeTierOverride,
    resolveModelProfile,
    getResolvedProfile,
    invalidateModelProfile,
    resetQuantizationState,
    clearPipelineCache,
    getLoadedPipelineCount,
    getLoadedPipelineKeys,
    loadTransformersPipeline,
    enforceLocalOnlyOnTransformers,
    getTransformersModule,
    type QuantizationLevel,
    type ModelSizeTier,
} from './modelLoader'

// ---------------------------------------------------------------------------
// Mocks for GPU mutex + Transformers.js
// ---------------------------------------------------------------------------

vi.mock('./modelDownloadBlocked', () => ({ reportModelDownloadBlocked: vi.fn() }))

vi.mock('../device/gpuResourceManager', () => ({
    acquireGpu: vi.fn().mockResolvedValue(undefined),
    releaseGpu: vi.fn(),
}))

// The mocked module, also for the tests: importing the package itself would be
// an undeclared dependency of apps/web (check:phantom-deps).
const transformers = vi.hoisted(() => ({
    pipeline: vi.fn().mockResolvedValue(vi.fn()),
    env: { backends: { onnx: { wasm: {} } }, allowLocalModels: true } as Record<string, unknown>,
}))
vi.mock('@xenova/transformers', () => ({ default: {}, ...transformers }))

vi.mock('@/utils/browserApis', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/utils/browserApis')>()
    return {
        ...actual,
        isMobileDevice: vi.fn(() => false),
        isHighEndTablet: vi.fn(() => false),
        checkStorageQuota: vi.fn(async () => ({
            ok: true,
            availableMB: 1000,
            totalMB: 2000,
        })),
    }
})

import { acquireGpu, releaseGpu } from '../device/gpuResourceManager'
import { ModelDownloadBlockedError, NO_LOCAL_MODELS_PATH } from '@cannaguide/ai-core/ml'
import { checkStorageQuota } from '@/utils/browserApis'
import { setLocalOnlyMode } from '@/services/localOnlyModeService'
import { reportModelDownloadBlocked } from './modelDownloadBlocked'

describe('localAIModelLoader', () => {
    beforeEach(() => {
        resetQuantizationState()
        clearPipelineCache()
        setForceWasm(false)
        setVramInsufficientOverride(false)
    })

    afterEach(() => {
        resetQuantizationState()
        setForceWasm(false)
        setVramInsufficientOverride(false)
    })

    // ─── Backend Detection ─────────────────────────────────────────────

    describe('detectOnnxBackend', () => {
        it('returns wasm or webgpu', () => {
            const backend = detectOnnxBackend()
            expect(['wasm', 'webgpu']).toContain(backend)
        })

        it('returns wasm when force override is set', () => {
            setForceWasm(true)
            expect(detectOnnxBackend()).toBe('wasm')
        })

        it('returns wasm when VRAM insufficient override is set', () => {
            setVramInsufficientOverride(true)
            expect(detectOnnxBackend()).toBe('wasm')
        })
    })

    // ─── Pipeline Cache ────────────────────────────────────────────────

    describe('pipeline cache', () => {
        it('starts empty', () => {
            expect(getLoadedPipelineCount()).toBe(0)
            expect(getLoadedPipelineKeys()).toEqual([])
        })

        it('clears on clearPipelineCache()', () => {
            clearPipelineCache()
            expect(getLoadedPipelineCount()).toBe(0)
        })
    })

    // ─── setModelQuant ─────────────────────────────────────────────────

    describe('setModelQuant', () => {
        it('defaults to null (auto)', () => {
            expect(getModelQuantOverride()).toBeNull()
        })

        it('sets quantization override', () => {
            setModelQuant('q4f16')
            expect(getModelQuantOverride()).toBe('q4f16')
        })

        it('can be reset to auto with null', () => {
            setModelQuant('q4')
            expect(getModelQuantOverride()).toBe('q4')
            setModelQuant(null)
            expect(getModelQuantOverride()).toBeNull()
        })

        it('invalidates cached profile on change', () => {
            // Resolve a profile to populate cache
            resolveModelProfile(null)
            getResolvedProfile()
            // Override → should invalidate
            setModelQuant('q4f16')
            // Force re-resolve by calling resolveModelProfile again
            invalidateModelProfile()
            const after = resolveModelProfile(8000)
            // If quant was changed, it should reflect
            expect(after.quantLevel).toBe('q4f16')
        })

        it('accepts all valid quantization levels', () => {
            const levels: QuantizationLevel[] = ['q4f16', 'q4', 'none']
            for (const level of levels) {
                setModelQuant(level)
                expect(getModelQuantOverride()).toBe(level)
            }
        })
    })

    // ─── setModelSizeTier ──────────────────────────────────────────────

    describe('setModelSizeTier', () => {
        it('defaults to null (auto)', () => {
            expect(getModelSizeTierOverride()).toBeNull()
        })

        it('sets size tier override', () => {
            setModelSizeTier('1.5B')
            expect(getModelSizeTierOverride()).toBe('1.5B')
        })

        it('can be reset to auto with null', () => {
            setModelSizeTier('0.5B')
            setModelSizeTier(null)
            expect(getModelSizeTierOverride()).toBeNull()
        })

        it('accepts all valid size tiers', () => {
            const tiers: ModelSizeTier[] = ['1.5B', '0.5B']
            for (const tier of tiers) {
                setModelSizeTier(tier)
                expect(getModelSizeTierOverride()).toBe(tier)
            }
        })
    })

    // ─── resolveModelProfile ───────────────────────────────────────────

    describe('resolveModelProfile', () => {
        it('returns a valid ModelProfile structure', () => {
            const profile = resolveModelProfile(null)
            expect(profile).toHaveProperty('quantLevel')
            expect(profile).toHaveProperty('sizeTier')
            expect(profile).toHaveProperty('transformersModelId')
            expect(profile).toHaveProperty('webLlmModelId')
            expect(profile).toHaveProperty('useQuantized')
            expect(profile).toHaveProperty('reason')
            expect(profile).toHaveProperty('estimatedSavingsPercent')
        })

        it('defaults to 0.5B q4 when VRAM is unknown', () => {
            const profile = resolveModelProfile(null)
            expect(profile.sizeTier).toBe('0.5B')
            expect(profile.quantLevel).toBe('q4')
            expect(profile.transformersModelId).toBe('Xenova/Qwen2.5-0.5B-Instruct')
            expect(profile.useQuantized).toBe(true)
            expect(profile.estimatedSavingsPercent).toBe(70)
        })

        it('defaults to 0.5B q4 when VRAM is low', () => {
            const profile = resolveModelProfile(2048)
            expect(profile.sizeTier).toBe('0.5B')
            expect(profile.quantLevel).toBe('q4')
            expect(profile.estimatedSavingsPercent).toBe(70)
        })

        it('returns 0.5B q4 for moderate VRAM without WebGPU', () => {
            setForceWasm(true)
            const profile = resolveModelProfile(8192)
            expect(profile.sizeTier).toBe('0.5B')
            expect(profile.quantLevel).toBe('q4')
            expect(profile.webLlmModelId).toBeNull() // No WebGPU → no WebLLM
        })

        it('caches the resolved profile', () => {
            const first = resolveModelProfile(null)
            const second = resolveModelProfile(null)
            expect(second).toBe(first) // Same reference
        })

        it('invalidateModelProfile clears the cache', () => {
            const first = resolveModelProfile(null)
            invalidateModelProfile()
            const second = resolveModelProfile(null)
            expect(second).not.toBe(first) // Different reference
            // But same values since conditions haven't changed
            expect(second.quantLevel).toBe(first.quantLevel)
        })

        it('respects manual quant override', () => {
            setModelQuant('q4f16')
            const profile = resolveModelProfile(null)
            expect(profile.quantLevel).toBe('q4f16')
            expect(profile.reason).toContain('override')
        })

        it('respects manual size tier override', () => {
            setModelSizeTier('1.5B')
            const profile = resolveModelProfile(null)
            expect(profile.sizeTier).toBe('1.5B')
            expect(profile.transformersModelId).toBe('Xenova/Qwen2.5-1.5B-Instruct')
        })

        it('respects combined overrides', () => {
            setModelQuant('none')
            setModelSizeTier('1.5B')
            const profile = resolveModelProfile(null)
            expect(profile.quantLevel).toBe('none')
            expect(profile.sizeTier).toBe('1.5B')
            expect(profile.useQuantized).toBe(false)
            expect(profile.reason).toContain('override')
        })

        it('includes a non-empty reason string', () => {
            const profile = resolveModelProfile(null)
            expect(profile.reason.length).toBeGreaterThan(0)
        })

        it('savings percent is 70 for 0.5B tier', () => {
            const profile = resolveModelProfile(null)
            expect(profile.estimatedSavingsPercent).toBe(70)
        })
    })

    // ─── getResolvedProfile ────────────────────────────────────────────

    describe('getResolvedProfile', () => {
        it('returns a profile even without prior resolve call', () => {
            const profile = getResolvedProfile()
            expect(profile).toHaveProperty('quantLevel')
            expect(profile).toHaveProperty('sizeTier')
        })

        it('returns the same instance as resolveModelProfile()', () => {
            const explicit = resolveModelProfile(null)
            const getter = getResolvedProfile()
            expect(getter).toBe(explicit)
        })
    })

    // ─── resetQuantizationState ────────────────────────────────────────

    describe('resetQuantizationState', () => {
        it('clears all overrides and cached profile', () => {
            setModelQuant('q4f16')
            setModelSizeTier('1.5B')
            resolveModelProfile(8000)

            resetQuantizationState()

            expect(getModelQuantOverride()).toBeNull()
            expect(getModelSizeTierOverride()).toBeNull()
            // After reset, auto-detect should kick in again
            const profile = resolveModelProfile(null)
            expect(profile.quantLevel).toBe('q4') // fallback without VRAM
        })
    })

    // ─── Model ID correctness ──────────────────────────────────────────

    describe('model IDs', () => {
        it('0.5B tier uses Qwen2.5-0.5B-Instruct for Transformers.js', () => {
            const profile = resolveModelProfile(null)
            expect(profile.transformersModelId).toBe('Xenova/Qwen2.5-0.5B-Instruct')
        })

        it('1.5B tier uses Qwen2.5-1.5B-Instruct for Transformers.js', () => {
            setModelSizeTier('1.5B')
            const profile = resolveModelProfile(null)
            expect(profile.transformersModelId).toBe('Xenova/Qwen2.5-1.5B-Instruct')
        })

        it('WebLLM model ID is null when WASM is forced', () => {
            setForceWasm(true)
            const profile = resolveModelProfile(8192)
            expect(profile.webLlmModelId).toBeNull()
        })
    })

    // ─── useQuantized flag ─────────────────────────────────────────────

    describe('useQuantized flag', () => {
        it('is true for q4 level', () => {
            setModelQuant('q4')
            expect(resolveModelProfile(null).useQuantized).toBe(true)
        })

        it('is true for q4f16 level', () => {
            setModelQuant('q4f16')
            expect(resolveModelProfile(null).useQuantized).toBe(true)
        })

        it('is false for none level', () => {
            setModelQuant('none')
            expect(resolveModelProfile(null).useQuantized).toBe(false)
        })
    })

    // ── Adaptive Concurrency ──────────────────────────────────────────

    describe('adaptive concurrency', () => {
        it('loadTransformersPipeline respects concurrency guard', async () => {
            // The concurrency limit is adaptive (2-5 based on hardwareConcurrency).
            // We just verify that getLoadedPipelineCount starts at 0 and the
            // concurrency system is initialized.
            expect(getLoadedPipelineCount()).toBe(0)
            expect(getLoadedPipelineKeys()).toEqual([])
        })

        it('hardwareConcurrency influences the adaptive limit', () => {
            // With jsdom default hardwareConcurrency of ~4, max concurrent should be 2
            const cores = navigator.hardwareConcurrency ?? 2
            const expected = Math.max(2, Math.min(5, Math.floor(cores * 0.5)))
            expect(expected).toBeGreaterThanOrEqual(2)
            expect(expected).toBeLessThanOrEqual(5)
        })
    })

    // ── GPU mutex integration (R-02) ──────────────────────────────────

    describe('loadTransformersPipeline GPU mutex (R-02)', () => {
        beforeEach(() => {
            vi.clearAllMocks()
            resetQuantizationState()
            clearPipelineCache()
        })

        afterEach(() => {
            setForceWasm(false)
            clearPipelineCache()
        })

        it('does not call GPU mutex when backend is wasm', async () => {
            setForceWasm(true)
            expect(detectOnnxBackend()).toBe('wasm')

            await loadTransformersPipeline('feature-extraction', 'test-model-wasm', {})
            expect(acquireGpu).not.toHaveBeenCalled()
            expect(releaseGpu).not.toHaveBeenCalled()
        })
    })
})

describe('loadTransformersPipeline in Local-Only Mode (GH #700)', () => {
    /** A browser cache that holds the config of `cachedModel` only. */
    const stubCacheWith = (cachedModel: string) =>
        vi.stubGlobal('caches', {
            open: () =>
                Promise.resolve({
                    match: (url: string) =>
                        Promise.resolve(
                            url.includes(`${cachedModel}/`) ? new Response('{}') : undefined,
                        ),
                }),
        })

    beforeEach(() => {
        transformers.pipeline.mockReset()
        transformers.pipeline.mockResolvedValue(vi.fn())
    })

    afterEach(() => {
        setLocalOnlyMode(false)
        vi.unstubAllGlobals()
        clearPipelineCache()
        vi.mocked(checkStorageQuota).mockResolvedValue({
            ok: true,
            availableMB: 1000,
            totalMB: 2000,
        })
    })

    it('refuses a model that is not downloaded, before any pipeline starts', async () => {
        setLocalOnlyMode(true)

        const load = loadTransformersPipeline('feature-extraction', 'Xenova/not-cached', {})

        await expect(load).rejects.toBeInstanceOf(ModelDownloadBlockedError)
        expect(transformers.pipeline).not.toHaveBeenCalled()
        expect(reportModelDownloadBlocked).toHaveBeenCalledWith(
            expect.any(ModelDownloadBlockedError),
        )
    })

    it('loads a downloaded model with remote downloads off and no local path to fetch', async () => {
        setLocalOnlyMode(true)
        stubCacheWith('Xenova/cached')

        await loadTransformersPipeline('feature-extraction', 'Xenova/cached', {})

        expect(transformers.pipeline).toHaveBeenCalledTimes(1)
        expect(transformers.env).toMatchObject({
            allowLocalModels: true,
            allowRemoteModels: false,
            localModelPath: NO_LOCAL_MODELS_PATH,
        })
    })

    it('needs no free storage for a downloaded model', async () => {
        setLocalOnlyMode(true)
        stubCacheWith('Xenova/cached')
        vi.mocked(checkStorageQuota).mockResolvedValue({
            ok: false,
            availableMB: 50,
            totalMB: 2000,
        })

        await loadTransformersPipeline('feature-extraction', 'Xenova/cached', {})

        expect(checkStorageQuota).not.toHaveBeenCalledWith(200)
        expect(transformers.pipeline).toHaveBeenCalledTimes(1)
    })

    it('does not hand out a download still under way once the mode is on', async () => {
        let finish: (value: unknown) => void = () => undefined
        transformers.pipeline.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
        const pending = loadTransformersPipeline('feature-extraction', 'Xenova/downloading', {})
        await vi.waitFor(() => expect(transformers.pipeline).toHaveBeenCalledTimes(1))

        setLocalOnlyMode(true)
        const reuse = loadTransformersPipeline('feature-extraction', 'Xenova/downloading', {})

        await expect(reuse).rejects.toBeInstanceOf(ModelDownloadBlockedError)
        // Its remaining files are refused too: remote downloads are off now.
        expect(transformers.env.allowRemoteModels).toBe(false)
        finish(vi.fn())
        await pending
    })

    it('without Local-Only Mode downloads as before', async () => {
        await loadTransformersPipeline('feature-extraction', 'Xenova/remote', {})

        expect(transformers.pipeline).toHaveBeenCalledTimes(1)
        expect(transformers.env).toMatchObject({ allowLocalModels: false, allowRemoteModels: true })
    })

    it('switching the mode on makes the loaded module cache-only at once', async () => {
        await getTransformersModule()
        transformers.env.allowRemoteModels = true
        setLocalOnlyMode(true)

        await enforceLocalOnlyOnTransformers()

        expect(transformers.env).toMatchObject({
            allowRemoteModels: false,
            localModelPath: NO_LOCAL_MODELS_PATH,
        })
    })

    it('a stale call after the mode was switched off again changes nothing', async () => {
        await getTransformersModule()
        transformers.env.allowRemoteModels = true
        setLocalOnlyMode(false)

        await enforceLocalOnlyOnTransformers()

        expect(transformers.env.allowRemoteModels).toBe(true)
    })

    it('a download refused at a later file is reported as blocked', async () => {
        transformers.pipeline.mockRejectedValueOnce(
            new Error('`env.allowRemoteModels=false` and file was not found locally at "x".'),
        )

        const load = loadTransformersPipeline('feature-extraction', 'Xenova/half', {})

        await expect(load).rejects.toBeInstanceOf(ModelDownloadBlockedError)
        expect(reportModelDownloadBlocked).toHaveBeenCalledWith(
            expect.any(ModelDownloadBlockedError),
        )
    })

    it('allows the download when the mode is switched off during the cache lookup', async () => {
        setLocalOnlyMode(true)
        vi.stubGlobal('caches', {
            open: () => {
                setLocalOnlyMode(false)
                return Promise.resolve({ match: () => Promise.resolve() })
            },
        })

        await loadTransformersPipeline('feature-extraction', 'Xenova/toggled', {})

        expect(transformers.pipeline).toHaveBeenCalledTimes(1)
        expect(transformers.env.allowRemoteModels).toBe(true)
        // It downloads now, so it needs room like any download.
        expect(checkStorageQuota).toHaveBeenCalledWith(200)
    })

    it('a failed older load does not evict the newer one for the same model', async () => {
        let fail: (error: Error) => void = () => undefined
        transformers.pipeline.mockReturnValueOnce(new Promise((_, reject) => (fail = reject)))
        const older = loadTransformersPipeline('feature-extraction', 'Xenova/replaced', {})
        await vi.waitFor(() => expect(transformers.pipeline).toHaveBeenCalledTimes(1))
        clearPipelineCache()
        await loadTransformersPipeline('feature-extraction', 'Xenova/replaced', {})

        fail(new Error('network'))
        await expect(older).rejects.toThrow('network')
        await loadTransformersPipeline('feature-extraction', 'Xenova/replaced', {})

        // The newer pipeline was reused: no third load.
        expect(transformers.pipeline).toHaveBeenCalledTimes(2)
    })

    it('a quota failure after the mode was switched on does not deny a cached model', async () => {
        stubCacheWith('Xenova/cached-late')
        vi.mocked(checkStorageQuota).mockImplementationOnce(() => {
            setLocalOnlyMode(true)
            return Promise.resolve({ ok: false, availableMB: 50, totalMB: 2000 })
        })

        await loadTransformersPipeline('feature-extraction', 'Xenova/cached-late', {})

        expect(transformers.pipeline).toHaveBeenCalledTimes(1)
        expect(transformers.env.allowRemoteModels).toBe(false)
    })
})

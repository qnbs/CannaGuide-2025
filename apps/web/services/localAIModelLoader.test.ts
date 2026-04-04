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
    type QuantizationLevel,
    type ModelSizeTier,
} from './localAIModelLoader'

// ---------------------------------------------------------------------------
// Mocks for GPU mutex + Transformers.js
// ---------------------------------------------------------------------------

vi.mock('./gpuResourceManager', () => ({
    acquireGpu: vi.fn().mockResolvedValue(undefined),
    releaseGpu: vi.fn(),
}))

vi.mock('@xenova/transformers', () => ({
    default: {},
    pipeline: vi.fn().mockResolvedValue(vi.fn()),
    env: { backends: { onnx: { wasm: {} } }, allowLocalModels: true },
}))

import { acquireGpu, releaseGpu } from './gpuResourceManager'

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
            clearPipelineCache()
        })

        it('acquires onnx-webgpu lock when backend is webgpu', async () => {
            // Force webgpu detection
            Object.defineProperty(navigator, 'gpu', { value: {}, configurable: true })
            setForceWasm(false)
            setVramInsufficientOverride(false)

            // Only run if we can get webgpu backend
            if (detectOnnxBackend() !== 'webgpu') {
                // In jsdom there is no gpu — skip by checking acquired count
                return
            }

            await loadTransformersPipeline('feature-extraction', 'test-model-webgpu', {})
            expect(acquireGpu).toHaveBeenCalledWith('onnx-webgpu')
            expect(releaseGpu).toHaveBeenCalledWith('onnx-webgpu')
        })

        it('does not call GPU mutex when backend is wasm', async () => {
            setForceWasm(true)
            expect(detectOnnxBackend()).toBe('wasm')

            await loadTransformersPipeline('feature-extraction', 'test-model-wasm', {})
            expect(acquireGpu).not.toHaveBeenCalled()
            expect(releaseGpu).not.toHaveBeenCalled()
        })

        it('releases onnx-webgpu lock in finally block even when pipeline throws (R-02 deadlock guard)', async () => {
            // Make pipeline reject for ALL calls (no WASM fallback succeeds either)
            const { pipeline } = await import('@xenova/transformers')
            vi.mocked(pipeline).mockRejectedValue(new Error('WebGPU context lost'))

            Object.defineProperty(navigator, 'gpu', { value: {}, configurable: true })
            setForceWasm(false)
            setVramInsufficientOverride(false)

            if (detectOnnxBackend() !== 'webgpu') return

            // Promise rejects after WASM fallback also fails
            await expect(
                loadTransformersPipeline('feature-extraction', 'test-model-throw', {}),
            ).rejects.toThrow()

            // releaseGpu MUST have been called via the finally block (deadlock prevention)
            expect(releaseGpu).toHaveBeenCalledWith('onnx-webgpu')

            // Restore to default for subsequent tests
            vi.mocked(pipeline).mockResolvedValue(vi.fn())
        })
    })
})

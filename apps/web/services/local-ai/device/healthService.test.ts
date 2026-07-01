import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import {
    getMemoryInfo,
    classifyDevice,
    getModelRecommendation,
    quickHealthCheck,
    probeGpuVram,
    getCachedVramInfo,
    isVramInsufficient,
    resetVramCache,
    getStorageInfo,
    shouldForceHeuristics,
    generateHealthReport,
} from './healthService'
import type { LocalAiPreloadStatus } from '../device/preloadService'
import type { TelemetrySnapshot } from '../telemetry/telemetryService'

vi.mock('@/utils/browserApis', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/utils/browserApis')>()
    return {
        ...actual,
        getDeviceMemoryGB: vi.fn(() => 8),
        getPerformanceMemory: vi.fn(() => null),
        getGpuAdapterDescription: vi.fn(async () => 'test-gpu'),
    }
})

vi.mock('../core/infrastructureService', () => ({
    localAiPreloadService: {
        getStatus: vi.fn(() => ({
            state: 'idle',
            textModelReady: false,
            visionModelReady: false,
        })),
    },
    getSnapshot: vi.fn(() => ({
        totalInferences: 0,
        successRate: 1,
        averageLatencyMs: 0,
    })),
    loadPersistedSnapshot: vi.fn(() => null),
    getCacheSize: vi.fn(async () => 3),
}))

vi.mock('../models/modelLoader', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../models/modelLoader')>()
    return {
        ...actual,
        detectOnnxBackend: vi.fn(() => 'wasm' as const),
        evictIdlePipelines: vi.fn(),
        invalidateModelProfile: vi.fn(),
        resolveModelProfile: vi.fn(() => ({
            quantLevel: 'q4',
            sizeTier: '0.5B',
            estimatedSavingsPercent: 50,
            reason: 'test profile',
            webLlmModelId: null,
        })),
    }
})

describe('localAiHealthService', () => {
    beforeEach(() => {
        resetVramCache()
    })

    afterEach(() => {
        resetVramCache()
        vi.unstubAllGlobals()
    })

    describe('getMemoryInfo', () => {
        it('returns null values when performance.memory is unavailable', () => {
            const info = getMemoryInfo()
            // In test environment, performance.memory may not exist
            if (info.usedHeapMB === null) {
                expect(info.heapLimitMB).toBeNull()
                expect(info.usagePercent).toBeNull()
                expect(info.pressureDetected).toBe(false)
            } else {
                expect(info.usedHeapMB).toBeGreaterThanOrEqual(0)
                expect(info.heapLimitMB).toBeGreaterThan(0)
            }
        })
    })

    describe('classifyDevice', () => {
        it('returns a valid device class', () => {
            const result = classifyDevice()
            expect(['high-end', 'mid-range', 'low-end', 'unknown']).toContain(result)
        })
    })

    describe('getModelRecommendation', () => {
        it('returns a valid recommendation object', () => {
            const rec = getModelRecommendation()
            expect(['qwen2.5', 'qwen3', 'auto']).toContain(rec.textModel)
            expect(typeof rec.enableWebLlm).toBe('boolean')
            expect(['webgpu', 'wasm']).toContain(rec.preferredBackend)
            expect(rec.reason.length).toBeGreaterThan(0)
        })

        it('includes progressive quantization fields', () => {
            const rec = getModelRecommendation()
            expect(['q4f16', 'q4', 'none']).toContain(rec.quantLevel)
            expect(['1.5B', '0.5B']).toContain(rec.sizeTier)
            expect(typeof rec.estimatedSavingsPercent).toBe('number')
            expect(rec.estimatedSavingsPercent).toBeGreaterThanOrEqual(0)
            expect(rec.estimatedSavingsPercent).toBeLessThanOrEqual(100)
        })
    })

    describe('quickHealthCheck', () => {
        it('returns valid health check structure', () => {
            const check = quickHealthCheck()
            expect(['healthy', 'degraded', 'critical', 'unknown']).toContain(check.status)
            expect(typeof check.memoryPressure).toBe('boolean')
            expect(typeof check.modelsReady).toBe('boolean')
        })

        it('reports unknown status when no preload has run', () => {
            const check = quickHealthCheck()
            // Before any preload, status should be unknown
            expect(check.status).toBe('unknown')
            expect(check.modelsReady).toBe(false)
        })
    })

    describe('probeGpuVram', () => {
        it('returns a VramInfo object', async () => {
            const info = await probeGpuVram()
            expect(info).toHaveProperty('probed')
            expect(info).toHaveProperty('vramMB')
            expect(info).toHaveProperty('adapterDescription')
        })

        it('caches the result after first probe', async () => {
            const first = await probeGpuVram()
            const second = await probeGpuVram()
            expect(second).toBe(first)
        })

        it('getCachedVramInfo returns null before probe', () => {
            expect(getCachedVramInfo()).toBeNull()
        })

        it('getCachedVramInfo returns value after probe', async () => {
            await probeGpuVram()
            expect(getCachedVramInfo()).not.toBeNull()
        })

        it('isVramInsufficient returns false when not probed', () => {
            expect(isVramInsufficient()).toBe(false)
        })

        it('resetVramCache clears cached info', async () => {
            await probeGpuVram()
            resetVramCache()
            expect(getCachedVramInfo()).toBeNull()
        })
    })

    describe('getStorageInfo', () => {
        it('returns nulls when storage API is unavailable', async () => {
            const originalNavigator = globalThis.navigator
            Object.defineProperty(globalThis, 'navigator', {
                configurable: true,
                value: {},
            })
            await expect(getStorageInfo()).resolves.toEqual({
                usageMB: null,
                quotaMB: null,
                usagePercent: null,
                persistentGranted: null,
            })
            Object.defineProperty(globalThis, 'navigator', {
                configurable: true,
                value: originalNavigator,
            })
        })

        it('maps navigator.storage.estimate values', async () => {
            Object.defineProperty(navigator, 'storage', {
                configurable: true,
                value: {
                    estimate: vi.fn(async () => ({ usage: 50 * 1024 * 1024, quota: 500 * 1024 * 1024 })),
                    persisted: vi.fn(async () => true),
                },
            })

            const info = await getStorageInfo()
            expect(info.usageMB).toBeCloseTo(50, 0)
            expect(info.quotaMB).toBeCloseTo(500, 0)
            expect(info.usagePercent).toBeCloseTo(10, 0)
            expect(info.persistentGranted).toBe(true)
        })
    })

    describe('classifyDevice branches', () => {
        it('classifies high-end hardware with WebGPU', async () => {
            Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 12 })
            Object.defineProperty(navigator, 'gpu', {
                configurable: true,
                value: {
                    requestAdapter: async () => ({
                        limits: { maxBufferSize: 8 * 1024 * 1024 * 1024 },
                    }),
                },
            })
            const { getDeviceMemoryGB } = await import('@/utils/browserApis')
            vi.mocked(getDeviceMemoryGB).mockReturnValue(16)

            await probeGpuVram()
            expect(classifyDevice()).toBe('high-end')
            const rec = getModelRecommendation()
            expect(rec.enableImageGen).toBe(false) // no real webgpu backend in jsdom
        })

        it('downgrades device class when probed VRAM is low', async () => {
            Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 })
            Object.defineProperty(navigator, 'gpu', {
                configurable: true,
                value: {
                    requestAdapter: async () => ({
                        limits: { maxBufferSize: 1024 * 1024 * 1024 },
                    }),
                },
            })
            await probeGpuVram()
            expect(classifyDevice()).toBe('mid-range')
        })
    })

    describe('shouldForceHeuristics', () => {
        it('returns true on very low device memory', async () => {
            const { getDeviceMemoryGB } = await import('@/utils/browserApis')
            vi.mocked(getDeviceMemoryGB).mockReturnValueOnce(2)
            expect(shouldForceHeuristics()).toBe(true)
        })
    })

    describe('getModelRecommendation branches', () => {
        it('returns eco-mode recommendation', () => {
            const rec = getModelRecommendation({ ecoMode: true })
            expect(rec.textModel).toBe('qwen3')
            expect(rec.enableWebLlm).toBe(false)
            expect(rec.preferredBackend).toBe('wasm')
        })

        it('returns memory-pressure recommendation when heap usage is high', async () => {
            const { getPerformanceMemory } = await import('@/utils/browserApis')
            vi.mocked(getPerformanceMemory).mockReturnValueOnce({
                usedJSHeapSize: 900_000_000,
                jsHeapSizeLimit: 1_000_000_000,
                totalJSHeapSize: 950_000_000,
            })

            const rec = getModelRecommendation()
            expect(rec.preferredBackend).toBe('wasm')
            expect(rec.reason).toContain('Memory pressure')
        })

        it('returns low-vram recommendation after GPU probe', async () => {
            Object.defineProperty(navigator, 'gpu', {
                configurable: true,
                value: {
                    requestAdapter: async () => ({
                        limits: { maxBufferSize: 512 * 1024 * 1024 },
                    }),
                },
            })

            await probeGpuVram()
            const rec = getModelRecommendation()
            expect(rec.preferredBackend).toBe('wasm')
            expect(rec.reason).toContain('Low VRAM')
            expect(isVramInsufficient()).toBe(true)
        })

        it('returns low-end device recommendation', async () => {
            resetVramCache()
            Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 2 })
            Object.defineProperty(navigator, 'gpu', { configurable: true, value: undefined })
            const { getDeviceMemoryGB } = await import('@/utils/browserApis')
            vi.mocked(getDeviceMemoryGB).mockReturnValueOnce(3)

            const rec = getModelRecommendation()
            expect(rec.textModel).toBe('qwen3')
            expect(rec.enableWebLlm).toBe(false)
            expect(rec.preferredBackend).toBe('wasm')
        })
    })

    describe('generateHealthReport', () => {
        it('returns a structured health report', async () => {
            const report = await generateHealthReport()
            expect(report.deviceClass).toBeTruthy()
            expect(report.status).toBeTruthy()
            expect(Array.isArray(report.warnings)).toBe(true)
            expect(report.recommendation.textModel).toBeTruthy()
        })

        it('adds low-vram and preload warnings for degraded states', async () => {
            const infra = await import('../core/infrastructureService')
            vi.mocked(infra.localAiPreloadService.getStatus).mockReturnValueOnce({
                state: 'partial',
                textModelReady: false,
                visionModelReady: false,
            } as LocalAiPreloadStatus)
            vi.mocked(infra.getSnapshot).mockReturnValueOnce({
                totalInferences: 10,
                successRate: 0.5,
                averageLatencyMs: 35_000,
            } as TelemetrySnapshot)

            Object.defineProperty(navigator, 'gpu', {
                configurable: true,
                value: {
                    requestAdapter: async () => ({
                        limits: { maxBufferSize: 512 * 1024 * 1024 },
                    }),
                },
            })

            const report = await generateHealthReport()
            expect(report.warnings.some((w) => w.includes('Text model not loaded'))).toBe(true)
            expect(report.warnings.some((w) => w.includes('Low GPU VRAM'))).toBe(true)
            expect(report.status).toBe('degraded')
        })
    })

    describe('quickHealthCheck extended', () => {
        it('reports critical when preload failed', async () => {
            const infra = await import('../core/infrastructureService')
            vi.mocked(infra.localAiPreloadService.getStatus).mockReturnValueOnce({
                state: 'error',
                textModelReady: false,
                visionModelReady: false,
            } as LocalAiPreloadStatus)

            const check = quickHealthCheck()
            expect(check.status).toBe('critical')
        })

        it('reports healthy when partial preload has text model ready', async () => {
            const infra = await import('../core/infrastructureService')
            vi.mocked(infra.localAiPreloadService.getStatus).mockReturnValueOnce({
                state: 'partial',
                textModelReady: true,
                visionModelReady: false,
            } as LocalAiPreloadStatus)

            const check = quickHealthCheck()
            expect(check.status).toBe('healthy')
            expect(check.modelsReady).toBe(true)
        })
    })

    describe('shouldForceHeuristics extended', () => {
        it('returns true for low-end device class', async () => {
            resetVramCache()
            Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 2 })
            Object.defineProperty(navigator, 'gpu', { configurable: true, value: undefined })
            const { getDeviceMemoryGB } = await import('@/utils/browserApis')
            vi.mocked(getDeviceMemoryGB).mockReturnValueOnce(2)

            expect(shouldForceHeuristics()).toBe(true)
        })
    })

    describe('getMemoryInfo with performance.memory', () => {
        it('detects memory pressure above 85% usage', async () => {
            const { getPerformanceMemory } = await import('@/utils/browserApis')
            vi.mocked(getPerformanceMemory).mockReturnValueOnce({
                usedJSHeapSize: 900_000_000,
                jsHeapSizeLimit: 1_000_000_000,
                totalJSHeapSize: 950_000_000,
            })

            const info = getMemoryInfo()
            expect(info.pressureDetected).toBe(true)
            expect(info.usagePercent).toBeCloseTo(90, 0)
        })
    })
})

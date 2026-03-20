import { describe, it, expect, afterEach } from 'vitest'
import {
    getMemoryInfo,
    classifyDevice,
    getModelRecommendation,
    quickHealthCheck,
    probeGpuVram,
    getCachedVramInfo,
    isVramInsufficient,
    resetVramCache,
} from './localAiHealthService'

describe('localAiHealthService', () => {
    afterEach(() => {
        resetVramCache()
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
})

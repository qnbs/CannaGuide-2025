import { describe, it, expect } from 'vitest'
import {
    getMemoryInfo,
    classifyDevice,
    getModelRecommendation,
    quickHealthCheck,
} from './localAiHealthService'

describe('localAiHealthService', () => {
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
})

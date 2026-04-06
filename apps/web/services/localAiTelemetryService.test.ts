import { describe, expect, it, beforeEach } from 'vitest'
import {
    recordInference,
    recordCacheHit,
    recordCacheMiss,
    recordFallbackEvent,
    getFallbackBreakdown,
    getSnapshot,
    createInferenceTimer,
    resetTelemetry,
    persistSnapshot,
    loadPersistedSnapshot,
    checkPerformanceDegradation,
    type InferenceRecord,
} from '@/services/localAiTelemetryService'

describe('localAiTelemetryService', () => {
    beforeEach(() => {
        resetTelemetry()
        localStorage.clear()
    })

    it('records an inference and reflects it in the snapshot', () => {
        const record: InferenceRecord = {
            model: 'Xenova/Qwen2.5-1.5B-Instruct',
            task: 'text-generation',
            latencyMs: 1200,
            tokensGenerated: 120,
            tokensPerSecond: 100,
            backend: 'wasm',
            cached: false,
            timestamp: Date.now(),
            success: true,
        }
        recordInference(record)

        const snapshot = getSnapshot()
        expect(snapshot.totalInferences).toBe(1)
        expect(snapshot.totalTokensGenerated).toBe(120)
        expect(snapshot.averageLatencyMs).toBe(1200)
        expect(snapshot.averageTokensPerSecond).toBe(100)
        expect(snapshot.successRate).toBe(1)
    })

    it('tracks cache hit rate correctly', () => {
        recordCacheHit()
        recordCacheHit()
        recordCacheMiss()

        const snapshot = getSnapshot()
        expect(snapshot.cacheHitRate).toBeCloseTo(2 / 3, 2)
    })

    it('tracks failed inferences in success rate', () => {
        recordInference({
            model: 'test',
            task: 'text-generation',
            latencyMs: 100,
            tokensGenerated: 10,
            tokensPerSecond: 100,
            backend: 'wasm',
            cached: false,
            timestamp: Date.now(),
            success: true,
        })
        recordInference({
            model: 'test',
            task: 'text-generation',
            latencyMs: 200,
            tokensGenerated: 0,
            tokensPerSecond: 0,
            backend: 'wasm',
            cached: false,
            timestamp: Date.now(),
            success: false,
        })

        const snapshot = getSnapshot()
        expect(snapshot.totalInferences).toBe(2)
        expect(snapshot.successRate).toBe(0.5)
    })

    it('computes model breakdown correctly', () => {
        recordInference({
            model: 'modelA',
            task: 'text-generation',
            latencyMs: 100,
            tokensGenerated: 50,
            tokensPerSecond: 500,
            backend: 'wasm',
            cached: false,
            timestamp: Date.now(),
            success: true,
        })
        recordInference({
            model: 'modelB',
            task: 'vision',
            latencyMs: 200,
            tokensGenerated: 10,
            tokensPerSecond: 50,
            backend: 'webgpu',
            cached: false,
            timestamp: Date.now(),
            success: true,
        })

        const snapshot = getSnapshot()
        expect(snapshot.modelBreakdown).toHaveProperty('modelA')
        expect(snapshot.modelBreakdown).toHaveProperty('modelB')
        expect(snapshot.modelBreakdown['modelA']!.count).toBe(1)
        expect(snapshot.modelBreakdown['modelB']!.count).toBe(1)
    })

    it('computes backend breakdown correctly', () => {
        recordInference({
            model: 'test',
            task: 'test',
            latencyMs: 100,
            tokensGenerated: 10,
            tokensPerSecond: 100,
            backend: 'wasm',
            cached: false,
            timestamp: Date.now(),
            success: true,
        })
        recordInference({
            model: 'test',
            task: 'test',
            latencyMs: 100,
            tokensGenerated: 10,
            tokensPerSecond: 100,
            backend: 'webllm',
            cached: false,
            timestamp: Date.now(),
            success: true,
        })

        const snapshot = getSnapshot()
        expect(snapshot.backendBreakdown['wasm']).toBe(1)
        expect(snapshot.backendBreakdown['webllm']).toBe(1)
    })

    it('tracks peak tokens per second', () => {
        recordInference({
            model: 'test',
            task: 'test',
            latencyMs: 100,
            tokensGenerated: 10,
            tokensPerSecond: 50,
            backend: 'wasm',
            cached: false,
            timestamp: Date.now(),
            success: true,
        })
        recordInference({
            model: 'test',
            task: 'test',
            latencyMs: 50,
            tokensGenerated: 20,
            tokensPerSecond: 400,
            backend: 'wasm',
            cached: false,
            timestamp: Date.now(),
            success: true,
        })

        const snapshot = getSnapshot()
        expect(snapshot.peakTokensPerSecond).toBe(400)
    })

    it('createInferenceTimer records timing automatically', () => {
        const timer = createInferenceTimer()
        const record = timer.stop({
            model: 'timerTest',
            task: 'text-generation',
            backend: 'wasm',
            tokensGenerated: 50,
        })

        expect(record.model).toBe('timerTest')
        expect(record.latencyMs).toBeGreaterThanOrEqual(0)
        expect(record.tokensGenerated).toBe(50)
        expect(record.success).toBe(true)

        const snapshot = getSnapshot()
        expect(snapshot.totalInferences).toBe(1)
    })

    it('persists and loads snapshot from localStorage', () => {
        recordInference({
            model: 'test',
            task: 'test',
            latencyMs: 100,
            tokensGenerated: 10,
            tokensPerSecond: 100,
            backend: 'wasm',
            cached: false,
            timestamp: Date.now(),
            success: true,
        })

        persistSnapshot()
        const loaded = loadPersistedSnapshot()
        expect(loaded).toBeDefined()
        expect(loaded?.totalInferences).toBe(1)
    })

    it('returns null when no persisted snapshot exists', () => {
        const loaded = loadPersistedSnapshot()
        expect(loaded).toBeNull()
    })

    it('returns null and cleans up corrupted localStorage data', () => {
        localStorage.setItem('cg.localai.telemetry', '{"broken": true}')
        const loaded = loadPersistedSnapshot()
        expect(loaded).toBeNull()
        expect(localStorage.getItem('cg.localai.telemetry')).toBeNull()
    })

    it('returns null for invalid JSON in localStorage', () => {
        localStorage.setItem('cg.localai.telemetry', 'not-json-at-all')
        const loaded = loadPersistedSnapshot()
        expect(loaded).toBeNull()
    })

    it('empty snapshot returns sane defaults', () => {
        const snapshot = getSnapshot()
        expect(snapshot.totalInferences).toBe(0)
        expect(snapshot.averageLatencyMs).toBe(0)
        expect(snapshot.averageTokensPerSecond).toBe(0)
        expect(snapshot.cacheHitRate).toBe(0)
        expect(snapshot.successRate).toBe(1)
        expect(snapshot.peakTokensPerSecond).toBe(0)
    })

    describe('checkPerformanceDegradation', () => {
        const slowRecord = (backend: 'wasm' | 'webgpu' | 'webllm' = 'wasm'): void => {
            recordInference({
                model: 'test',
                task: 'text-generation',
                latencyMs: 5000,
                tokensGenerated: 5,
                tokensPerSecond: 1.0,
                backend,
                cached: false,
                timestamp: Date.now(),
                success: true,
            })
        }

        const fastRecord = (backend: 'wasm' | 'webgpu' | 'webllm' = 'wasm'): void => {
            recordInference({
                model: 'test',
                task: 'text-generation',
                latencyMs: 100,
                tokensGenerated: 50,
                tokensPerSecond: 500,
                backend,
                cached: false,
                timestamp: Date.now(),
                success: true,
            })
        }

        it('returns not-degraded when fewer than 3 records', () => {
            slowRecord()
            slowRecord()
            const alert = checkPerformanceDegradation()
            expect(alert.degraded).toBe(false)
            expect(alert.recommendation).toBe('none')
        })

        it('detects degradation when tok/s below threshold', () => {
            slowRecord()
            slowRecord()
            slowRecord()
            const alert = checkPerformanceDegradation()
            expect(alert.degraded).toBe(true)
            expect(alert.recentTokensPerSecond).toBeLessThan(2)
        })

        it('recommends downgrade-model for WebLLM degradation', () => {
            slowRecord('webllm')
            slowRecord('webllm')
            slowRecord('webllm')
            const alert = checkPerformanceDegradation()
            expect(alert.degraded).toBe(true)
            expect(alert.recommendation).toBe('downgrade-model')
        })

        it('recommends close-tabs for non-WebLLM degradation', () => {
            slowRecord('wasm')
            slowRecord('wasm')
            slowRecord('wasm')
            const alert = checkPerformanceDegradation()
            expect(alert.degraded).toBe(true)
            expect(alert.recommendation).toBe('close-tabs')
        })

        it('returns not-degraded when tok/s is healthy', () => {
            fastRecord()
            fastRecord()
            fastRecord()
            const alert = checkPerformanceDegradation()
            expect(alert.degraded).toBe(false)
            expect(alert.recentTokensPerSecond).toBeGreaterThan(2)
            expect(alert.recommendation).toBe('none')
        })

        it('ignores cached records for degradation check', () => {
            slowRecord()
            slowRecord()
            slowRecord()
            // Add cached record with high speed — should not affect the check
            recordInference({
                model: 'test',
                task: 'text-generation',
                latencyMs: 1,
                tokensGenerated: 100,
                tokensPerSecond: 10000,
                backend: 'wasm',
                cached: true,
                timestamp: Date.now(),
                success: true,
            })
            const alert = checkPerformanceDegradation()
            expect(alert.degraded).toBe(true)
        })
    })

    describe('fallback telemetry', () => {
        it('records fallback events and reports breakdown', () => {
            recordFallbackEvent('cache', 'in-memory hit')
            recordFallbackEvent('cache', 'indexeddb hit')
            recordFallbackEvent('webllm')
            recordFallbackEvent('heuristic', 'getMentorResponse')

            const breakdown = getFallbackBreakdown()
            expect(breakdown.cache).toBe(2)
            expect(breakdown.webllm).toBe(1)
            expect(breakdown.heuristic).toBe(1)
            expect(breakdown.transformers).toBe(0)
            expect(breakdown.cloud).toBe(0)
        })

        it('includes fallback breakdown in snapshot', () => {
            recordFallbackEvent('transformers')
            recordFallbackEvent('heuristic', 'getPlantAdvice')

            const snapshot = getSnapshot()
            expect(snapshot.fallbackBreakdown.transformers).toBe(1)
            expect(snapshot.fallbackBreakdown.heuristic).toBe(1)
        })

        it('annotates the last inference record with fallback info', () => {
            const record: InferenceRecord = {
                model: 'test',
                task: 'text-generation',
                latencyMs: 100,
                tokensGenerated: 10,
                tokensPerSecond: 100,
                backend: 'wasm',
                cached: false,
                timestamp: Date.now(),
                success: true,
            }
            recordInference(record)
            recordFallbackEvent('webllm', 'model loaded')

            const snapshot = getSnapshot()
            expect(snapshot.totalInferences).toBe(1)
            expect(getFallbackBreakdown().webllm).toBe(1)
        })

        it('resets fallback counts with resetTelemetry', () => {
            recordFallbackEvent('cache')
            recordFallbackEvent('heuristic')
            resetTelemetry()

            const breakdown = getFallbackBreakdown()
            expect(breakdown.cache).toBe(0)
            expect(breakdown.heuristic).toBe(0)
        })
    })
})

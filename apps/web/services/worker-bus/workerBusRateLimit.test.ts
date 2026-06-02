import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    clearWorkerRateLimits,
    getWorkerRateLimit,
    isRateLimitAllowed,
    setWorkerRateLimit,
} from '@/services/worker-bus/workerBusRateLimit'

describe('workerBusRateLimit', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        clearWorkerRateLimits()
    })

    afterEach(() => {
        clearWorkerRateLimits()
        vi.useRealTimers()
    })

    it('allows requests when no limit is configured', () => {
        expect(isRateLimitAllowed('strain-worker')).toBe(true)
    })

    it('blocks requests above maxRequests within the window', () => {
        setWorkerRateLimit('ai-worker', { maxRequests: 2, windowMs: 1000 })
        expect(isRateLimitAllowed('ai-worker')).toBe(true)
        expect(isRateLimitAllowed('ai-worker')).toBe(true)
        expect(isRateLimitAllowed('ai-worker')).toBe(false)
    })

    it('clamps invalid config and clears limits', () => {
        setWorkerRateLimit('x', { maxRequests: 0, windowMs: 1 })
        expect(getWorkerRateLimit('x')).toEqual({ maxRequests: 1, windowMs: 100 })
        setWorkerRateLimit('x', undefined)
        expect(getWorkerRateLimit('x')).toBeUndefined()
        expect(isRateLimitAllowed('x')).toBe(true)
    })

    it('expires old timestamps outside the window', () => {
        setWorkerRateLimit('y', { maxRequests: 1, windowMs: 500 })
        expect(isRateLimitAllowed('y')).toBe(true)
        expect(isRateLimitAllowed('y')).toBe(false)
        vi.advanceTimersByTime(600)
        expect(isRateLimitAllowed('y')).toBe(true)
    })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { aiRateLimiter } from '@/services/aiRateLimiter'

describe('aiRateLimiter', () => {
    beforeEach(() => {
        localStorage.clear()
        aiRateLimiter.clearAuditLog()
        aiRateLimiter.clearCostHistory()
        aiRateLimiter.resetForTests()
    })

    it('records audit log entries when acquiring a slot', () => {
        aiRateLimiter.acquireSlot('diagnosePlant')

        const entries = aiRateLimiter.getAuditLog()
        expect(entries).toHaveLength(1)
        expect(entries[0]!.endpoint).toBe('diagnosePlant')
        expect(entries[0]!.timestamp).toBeTypeOf('number')
    })

    it('clears the audit log', () => {
        aiRateLimiter.acquireSlot('getMentorResponse')
        aiRateLimiter.clearAuditLog()

        expect(aiRateLimiter.getAuditLog()).toHaveLength(0)
    })

    it('enforces the 10 request per minute limit', () => {
        for (let index = 0; index < 10; index += 1) {
            aiRateLimiter.acquireSlot(`endpoint-${index}`)
        }

        expect(() => aiRateLimiter.acquireSlot('endpoint-over-limit')).toThrow('ai.error.rateLimited')
    })
})

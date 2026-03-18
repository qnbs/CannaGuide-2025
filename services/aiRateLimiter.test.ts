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
        expect(entries[0].endpoint).toBe('diagnosePlant')
        expect(entries[0].timestamp).toBeTypeOf('number')
    })

    it('clears the audit log', () => {
        aiRateLimiter.acquireSlot('getMentorResponse')
        aiRateLimiter.clearAuditLog()

        expect(aiRateLimiter.getAuditLog()).toHaveLength(0)
    })
})

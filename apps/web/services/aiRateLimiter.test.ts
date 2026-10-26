import { afterEach, describe, it, expect, beforeEach, vi } from 'vitest'
import { aiRateLimiter } from '@/services/aiRateLimiter'

const localMonthKey = (date = new Date()): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

describe('aiRateLimiter', () => {
    beforeEach(() => {
        vi.useRealTimers()
        localStorage.clear()
        aiRateLimiter.clearAuditLog()
        aiRateLimiter.clearCostHistory()
        aiRateLimiter.resetForTests()
    })

    afterEach(() => {
        vi.useRealTimers()
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

        expect(() => aiRateLimiter.acquireSlot('endpoint-over-limit')).toThrow(
            'ai.error.rateLimited',
        )
    })

    it('rejects a reservation that would exceed the remaining monthly budget', () => {
        aiRateLimiter.setMonthlyBudgetLimit(2000)

        aiRateLimiter.acquireSlot('getStrainTips')
        expect(() => aiRateLimiter.acquireSlot('getStrainTips')).toThrow('ai.error.budgetExceeded')

        expect(aiRateLimiter.getMonthlyBudget()).toEqual({
            limit: 2000,
            month: localMonthKey(),
            spent: 1600,
        })
        expect(aiRateLimiter.getAuditLog()).toHaveLength(1)
    })

    it('allows reservations that land exactly on the monthly budget limit', () => {
        aiRateLimiter.setMonthlyBudgetLimit(3200)

        aiRateLimiter.acquireSlot('getStrainTips')
        aiRateLimiter.acquireSlot('getStrainTips')

        expect(aiRateLimiter.getMonthlyBudget()).toEqual({
            limit: 3200,
            month: localMonthKey(),
            spent: 3200,
        })
        expect(() => aiRateLimiter.acquireSlot('getStrainTips')).toThrow('ai.error.budgetExceeded')
    })

    it('falls back to an unlimited budget when persisted budget values are not finite numbers', () => {
        const month = localMonthKey()
        localStorage.setItem(
            'cg.ai.monthlyBudget',
            JSON.stringify({ limit: '5000', month, spent: '3200' }),
        )

        expect(aiRateLimiter.getMonthlyBudget()).toEqual({ limit: 0, month, spent: 0 })
        expect(aiRateLimiter.getBudgetUsagePercent()).toBeNull()
    })

    it('falls back to an unlimited budget for an impossible persisted month', () => {
        const month = localMonthKey()
        localStorage.setItem(
            'cg.ai.monthlyBudget',
            JSON.stringify({ limit: 5000, month: '2025-13', spent: 3200 }),
        )

        expect(aiRateLimiter.getMonthlyBudget()).toEqual({ limit: 0, month, spent: 0 })
        expect(aiRateLimiter.getBudgetUsagePercent()).toBeNull()
    })

    it('keeps the configured budget valid when a previous-month usage correction arrives late', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2025, 0, 31, 12))
        aiRateLimiter.setMonthlyBudgetLimit(2000)
        const januaryReservation = aiRateLimiter.acquireSlot('getStrainTips')

        vi.setSystemTime(new Date(2025, 1, 1, 12))
        expect(aiRateLimiter.getMonthlyBudget()).toEqual({
            limit: 2000,
            month: localMonthKey(),
            spent: 0,
        })
        const februaryReservation = aiRateLimiter.acquireSlot('getStrainTips')

        aiRateLimiter.reportActualUsage(
            'getStrainTips',
            {
                promptTokens: 40,
                completionTokens: 60,
                totalTokens: 100,
            },
            undefined,
            januaryReservation,
        )

        expect(aiRateLimiter.getMonthlyBudget()).toEqual({
            limit: 2000,
            month: localMonthKey(),
            spent: 1600,
        })
        expect(
            aiRateLimiter.getUsageHistory(30).find((entry) => entry.date === '2025-01-31')
                ?.totalTokens,
        ).toBe(100)

        aiRateLimiter.reportActualUsage(
            'getStrainTips',
            {
                promptTokens: 400,
                completionTokens: 600,
                totalTokens: 1000,
            },
            undefined,
            februaryReservation,
        )

        expect(aiRateLimiter.getMonthlyBudget()).toEqual({
            limit: 2000,
            month: localMonthKey(),
            spent: 1000,
        })
        expect(
            aiRateLimiter.getUsageHistory(30).find((entry) => entry.date === '2025-02-01')
                ?.totalTokens,
        ).toBe(1000)
    })
})

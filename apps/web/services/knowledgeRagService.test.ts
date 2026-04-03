import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { knowledgeRagService } from './knowledgeRagService'

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

vi.mock('@/services/aiFacade', () => ({
    aiService: {
        getGrowLogRagAnswer: vi.fn().mockResolvedValue({
            title: 'Calculator Explanation',
            content: 'VPD of 1.2 kPa is within the ideal range for vegetative growth.',
        }),
    },
}))

vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: vi.fn().mockReturnValue(false),
}))

vi.mock('@/services/growLogRagService', () => ({
    growLogRagService: {
        retrieveRelevantContext: vi.fn().mockReturnValue('No grow log entries found.'),
    },
}))

vi.mock('dompurify', () => ({
    default: {
        sanitize: (input: string, _opts?: unknown) => String(input),
    },
}))

import { aiService } from '@/services/aiFacade'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { growLogRagService } from '@/services/growLogRagService'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('knowledgeRagService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(isLocalOnlyMode).mockReturnValue(false)
        vi.mocked(aiService.getGrowLogRagAnswer).mockResolvedValue({
            title: 'Calculator Explanation',
            content: 'VPD of 1.2 kPa is within the ideal range for vegetative growth.',
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // -- Local-only mode guard -----------------------------------------------

    it('returns empty explanation in local-only mode', async () => {
        vi.mocked(isLocalOnlyMode).mockReturnValue(true)

        const result = await knowledgeRagService.explain('vpd', {
            vpd: 1.2,
            status: 'optimal',
            temp: 25,
            humidity: 60,
            leafOffset: 2,
        })

        expect(result.explanation).toBe('')
        expect(aiService.getGrowLogRagAnswer).not.toHaveBeenCalled()
    })

    // -- Learning path suggestions -------------------------------------------

    it('suggests environment-mastery for VPD calculator', async () => {
        // Reset rate-limiter by spoofing time
        const result = await knowledgeRagService.explain('vpd', {
            vpd: 1.2,
            status: 'optimal',
            temp: 25,
            humidity: 60,
            leafOffset: 2,
        })

        expect(result.suggestedPathId).toBe('environment-mastery')
    })

    it('suggests nutrient-mastery for EC/TDS calculator', async () => {
        const result = await knowledgeRagService.explain('ecTds', {
            ecMs: 1.8,
            tds500: 900,
            driftPerDay: 0.1,
            trend: 'stable',
        })

        expect(result.suggestedPathId).toBe('nutrient-mastery')
    })

    it('suggests advanced-training for terpene entourage calculator', async () => {
        const result = await knowledgeRagService.explain('terpeneEntourage', {
            score: 78,
            profile: 'balanced',
            dominant: 'myrcene',
            diversity: 0.85,
        })

        expect(result.suggestedPathId).toBe('advanced-training')
    })

    it('suggests advanced-training for cannabinoid ratio calculator', async () => {
        const result = await knowledgeRagService.explain('cannabinoidRatio', {
            thcPct: 20,
            cbdPct: 1,
            cbgPct: 0.5,
            profileType: 'THC-dominant',
            harmony: 65,
        })

        expect(result.suggestedPathId).toBe('advanced-training')
    })

    // -- Journal context detection -------------------------------------------

    it('sets hadJournalContext false when no grow logs available', async () => {
        vi.mocked(growLogRagService.retrieveRelevantContext).mockReturnValue(
            'No grow log entries found.',
        )

        const result = await knowledgeRagService.explain('vpd', {
            vpd: 1.0,
            status: 'low',
            temp: 22,
            humidity: 55,
            leafOffset: 2,
        })

        expect(result.hadJournalContext).toBe(false)
    })

    it('sets hadJournalContext true when journal entries are found', async () => {
        vi.mocked(growLogRagService.retrieveRelevantContext).mockReturnValue(
            'Day 10: VPD was high at 1.8 kPa. Increased humidity.',
        )

        // Pass a minimal plant so the plants.length > 0 branch is taken
        const mockPlant = { id: 'p1' } as unknown as import('@/types').Plant

        const result = await knowledgeRagService.explain(
            'transpiration',
            {
                leafRate: 5.2,
                canopyRate: 3.8,
                dailyWater: 400,
                status: 'normal',
            },
            [mockPlant],
        )

        expect(result.hadJournalContext).toBe(true)
    })

    // -- AI response handling ------------------------------------------------

    it('returns explanation from AI content', async () => {
        vi.mocked(aiService.getGrowLogRagAnswer).mockResolvedValue({
            title: 'Explanation',
            content: 'Your VPD is ideal — maintain humidity between 55 and 65 percent.',
        })

        // Use lightSpectrum (not yet rate-limited by earlier tests)
        const result = await knowledgeRagService.explain('lightSpectrum', {
            ppfd: 600,
            dli: 30,
            efficiency: 85,
            terpeneBoost: 12,
            status: 'optimal',
        })

        expect(result.explanation).toContain('VPD is ideal')
    })

    it('truncates explanation to 420 chars max', async () => {
        const longContent = 'A'.repeat(500)
        vi.mocked(aiService.getGrowLogRagAnswer).mockResolvedValue({
            title: 'E',
            content: longContent,
        })

        const result = await knowledgeRagService.explain('lightSpectrum', {
            ppfd: 600,
            dli: 30,
            efficiency: 85,
            terpeneBoost: 12,
            status: 'optimal',
        })

        expect(result.explanation.length).toBeLessThanOrEqual(420)
    })

    it('returns empty explanation on AI error', async () => {
        vi.mocked(aiService.getGrowLogRagAnswer).mockRejectedValue(new Error('network error'))

        const result = await knowledgeRagService.explain('ecTds', {
            ecMs: 2.4,
            tds500: 1200,
            driftPerDay: 0.3,
            trend: 'rising',
        })

        expect(result.explanation).toBe('')
    })
})

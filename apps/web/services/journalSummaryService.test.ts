import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateHeuristicSummary } from './journalSummaryService'
import type { JournalEntry } from '@/types'

// Mock i18n
vi.mock('@/i18n', () => ({
    getT: () => (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
}))

const makeEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
    id: 'j-1',
    type: 'WATERING' as JournalEntry['type'],
    notes: 'Watered the plant',
    createdAt: Date.now(),
    details: {},
    ...overrides,
})

describe('journalSummaryService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns a fallback message for empty entries', () => {
        const result = generateHeuristicSummary('Test Plant', [])
        expect(result).toContain('No journal entries to summarize.')
    })

    it('generates a summary with watering count', () => {
        const entries = [
            makeEntry({ id: 'j-1', type: 'WATERING' as JournalEntry['type'] }),
            makeEntry({ id: 'j-2', type: 'WATERING' as JournalEntry['type'] }),
            makeEntry({ id: 'j-3', type: 'FEEDING' as JournalEntry['type'] }),
        ]
        const result = generateHeuristicSummary('Green Dream', entries)
        expect(result).toContain('**Green Dream**')
        expect(result).toContain('Total entries')
        expect(result).toContain('3')
        expect(result).toContain('Watering')
        expect(result).toContain('2x')
        expect(result).toContain('Feeding')
        expect(result).toContain('1x')
    })

    it('includes pH and EC averages when available', () => {
        const entries = [
            makeEntry({
                id: 'j-1',
                type: 'WATERING' as JournalEntry['type'],
                details: { ph: 6.2, ec: 1.2 },
            }),
            makeEntry({
                id: 'j-2',
                type: 'WATERING' as JournalEntry['type'],
                details: { ph: 6.8, ec: 1.4 },
            }),
        ]
        const result = generateHeuristicSummary('Test Plant', entries)
        expect(result).toContain('Avg pH')
        expect(result).toContain('6.5')
        expect(result).toContain('Avg EC')
        expect(result).toContain('1.30')
    })

    it('includes observation issues', () => {
        const entries = [
            makeEntry({
                id: 'j-1',
                type: 'OBSERVATION' as JournalEntry['type'],
                notes: 'Noticed some yellowing on lower leaves that might indicate nitrogen deficiency',
            }),
        ]
        const result = generateHeuristicSummary('Test Plant', entries)
        expect(result).toContain('Issues noted')
        expect(result).toContain('yellowing')
    })

    it('limits issues to 5 entries', () => {
        const entries = Array.from({ length: 8 }, (_, i) =>
            makeEntry({
                id: `j-${i}`,
                type: 'OBSERVATION' as JournalEntry['type'],
                notes: `Observation issue number ${i} with enough detail to pass the length check`,
                createdAt: Date.now() + i,
            }),
        )
        const result = generateHeuristicSummary('Test Plant', entries)
        const issueLines = result.split('\n').filter((l) => l.startsWith('- Observation issue'))
        expect(issueLines.length).toBeLessThanOrEqual(5)
    })
})

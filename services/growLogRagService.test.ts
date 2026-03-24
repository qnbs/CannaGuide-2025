import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the embedding service before importing the module
vi.mock('@/services/localAiEmbeddingService', () => ({
    isEmbeddingModelReady: vi.fn(() => false),
    embedText: vi.fn(),
    embedBatch: vi.fn(),
    cosineSimilarity: vi.fn(),
}))

vi.mock('dompurify', () => ({
    default: {
        sanitize: (input: string, opts?: { ALLOWED_TAGS?: string[] }) => {
            if (opts?.ALLOWED_TAGS?.length === 0) {
                return input.replace(/<[^>]*>/g, '')
            }
            return input
        },
    },
}))

import { growLogRagService } from './growLogRagService'
import { JournalEntryType } from '@/types'
import type { Plant, JournalEntry } from '@/types'

function makePlant(id: string, name: string, journal: Partial<JournalEntry>[]): Plant {
    return {
        id,
        name,
        journal: journal.map((j) => ({
            id: `j-${id}-${Math.random().toString(36).slice(2, 6)}`,
            type: j.type ?? 'note',
            notes: j.notes ?? '',
            createdAt: j.createdAt ?? Date.now(),
            ...j,
        })),
    } as unknown as Plant
}

describe('growLogRagService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty message when no plants', () => {
        const result = growLogRagService.retrieveRelevantContext([], 'watering')
        expect(result).toBe('No grow log entries found.')
    })

    it('returns empty message when plants have no journal', () => {
        const plant = makePlant('p1', 'TestPlant', [])
        const result = growLogRagService.retrieveRelevantContext([plant], 'water')
        expect(result).toBe('No grow log entries found.')
    })

    it('returns keyword-matched context lines', () => {
        const plant = makePlant('p1', 'BlueHaze', [
            {
                type: JournalEntryType.Watering,
                notes: 'Gave 500ml of water',
                createdAt: Date.now() - 1000,
            },
            {
                type: JournalEntryType.Observation,
                notes: 'Looking healthy',
                createdAt: Date.now() - 2000,
            },
            {
                type: JournalEntryType.Feeding,
                notes: 'Added nutrients NPK',
                createdAt: Date.now() - 3000,
            },
        ])
        const result = growLogRagService.retrieveRelevantContext([plant], 'water')
        expect(result).toContain('BlueHaze')
        expect(result).toContain('water')
    })

    it('respects the limit parameter', () => {
        const entries = Array.from({ length: 10 }, (_, i) => ({
            type: JournalEntryType.Observation as const,
            notes: `Entry number ${i} about watering`,
            createdAt: Date.now() - i * 1000,
        }))
        const plant = makePlant('p2', 'TestStrain', entries)
        const result = growLogRagService.retrieveRelevantContext([plant], 'watering', 3)
        const lines = result.split('\n').filter(Boolean)
        expect(lines.length).toBeLessThanOrEqual(3)
    })

    it('handles multiple plants', () => {
        const p1 = makePlant('p1', 'PlantA', [
            { type: JournalEntryType.Observation, notes: 'Yellow leaves', createdAt: Date.now() },
        ])
        const p2 = makePlant('p2', 'PlantB', [
            {
                type: JournalEntryType.Observation,
                notes: 'Green and healthy',
                createdAt: Date.now(),
            },
        ])
        const result = growLogRagService.retrieveRelevantContext([p1, p2], 'leaves')
        expect(result).toContain('PlantA')
    })

    it('sanitizes HTML in journal entries', () => {
        const plant = makePlant('p1', 'SafePlant', [
            {
                type: JournalEntryType.Observation,
                notes: '<script>alert(1)</script> healthy',
                createdAt: Date.now(),
            },
        ])
        const result = growLogRagService.retrieveRelevantContext([plant], 'healthy')
        expect(result).not.toContain('<script>')
    })

    it('returns empty message via async path when no entries', async () => {
        const result = await growLogRagService.retrieveSemanticContext([], 'test')
        expect(result).toBe('No grow log entries found.')
    })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/knowledgeGraphService', () => ({
    knowledgeGraph: {
        initialize: vi.fn(),
        injectPlants: vi.fn(),
        getRelatedLinks: vi.fn().mockReturnValue([]),
    },
}))

import { contextBridge } from '@/services/contextBridgeService'
import { View, PlantStage, JournalEntryType, ProblemType } from '@/types'
import type { Plant, AppSettings } from '@/types'

const defaultSettings = {
    simulation: { simulationProfile: 'beginner' },
    general: { language: 'de' },
} as unknown as AppSettings

const makePlant = (overrides: Partial<Plant> = {}): Plant =>
    ({
        id: 'p-1',
        name: 'Test Plant',
        stage: PlantStage.Vegetative,
        health: 80,
        age: 14,
        strain: { name: 'OG Kush' },
        environment: { vpd: 1.1 },
        problems: [],
        journal: [],
        ...overrides,
    }) as unknown as Plant

describe('contextBridgeService', () => {
    beforeEach(() => {
        contextBridge.invalidate()
    })

    it('builds a snapshot with no plants', () => {
        const snap = contextBridge.buildSnapshot({
            currentView: View.Plants,
            activePlants: [],
            settings: defaultSettings,
        })
        expect(snap.currentView).toBe(View.Plants)
        expect(snap.activePlants).toHaveLength(0)
        expect(snap.userLevel).toBe('beginner')
        expect(snap.language).toBe('de')
        expect(snap.timestamp).toBeGreaterThan(0)
    })

    it('builds a snapshot with active plants', () => {
        const plant = makePlant()
        const snap = contextBridge.buildSnapshot({
            currentView: View.Plants,
            activePlants: [plant],
            selectedPlant: plant,
            settings: defaultSettings,
        })
        expect(snap.activePlants).toHaveLength(1)
        expect(snap.selectedPlant?.name).toBe('Test Plant')
        expect(snap.selectedPlant?.strain).toBe('OG Kush')
    })

    it('caches snapshot within TTL', () => {
        const params = {
            currentView: View.Plants,
            activePlants: [makePlant()],
            settings: defaultSettings,
        }
        const snap1 = contextBridge.buildSnapshot(params)
        const snap2 = contextBridge.buildSnapshot(params)
        expect(snap1).toBe(snap2)
    })

    it('invalidates the cached snapshot', () => {
        const params = {
            currentView: View.Plants,
            activePlants: [makePlant()],
            settings: defaultSettings,
        }
        const snap1 = contextBridge.buildSnapshot(params)
        contextBridge.invalidate()
        const snap2 = contextBridge.buildSnapshot(params)
        expect(snap1).not.toBe(snap2)
    })

    it('gathers recent journal entries', () => {
        const plant = makePlant({
            journal: [
                {
                    id: 'j-1',
                    type: JournalEntryType.Observation,
                    notes: 'Looks healthy',
                    createdAt: Date.now() - 3600_000,
                },
                {
                    id: 'j-2',
                    type: JournalEntryType.Watering,
                    notes: 'Watered 500ml',
                    createdAt: Date.now(),
                },
            ],
        } as Partial<Plant>)

        const snap = contextBridge.buildSnapshot({
            currentView: View.Plants,
            activePlants: [plant],
            settings: defaultSettings,
        })
        expect(snap.recentJournal.length).toBe(2)
        // Most recent first
        expect(snap.recentJournal[0]?.notes).toBe('Watered 500ml')
    })

    it('gathers active problems', () => {
        const plant = makePlant({
            problems: [{ type: ProblemType.Overwatering, severity: 6, onsetDay: 1, status: 'active' }],
        } as Partial<Plant>)

        const snap = contextBridge.buildSnapshot({
            currentView: View.Plants,
            activePlants: [plant],
            settings: defaultSettings,
        })
        expect(snap.activeProblems).toHaveLength(1)
        expect(snap.activeProblems[0]?.type).toBe('Overwatering')
    })

    describe('buildAiSystemContext', () => {
        it('returns context string with user level and language', () => {
            const snap = contextBridge.buildSnapshot({
                currentView: View.Knowledge,
                currentTab: 'lexikon',
                activePlants: [],
                settings: defaultSettings,
            })
            const ctx = contextBridge.buildAiSystemContext(snap)
            expect(ctx).toContain('User Level: beginner')
            expect(ctx).toContain('Language: de')
            expect(ctx).toContain('knowledge > lexikon')
        })

        it('includes selected plant info', () => {
            const plant = makePlant({ health: 95, age: 30 })
            const snap = contextBridge.buildSnapshot({
                currentView: View.Plants,
                activePlants: [plant],
                selectedPlant: plant,
                settings: defaultSettings,
            })
            const ctx = contextBridge.buildAiSystemContext(snap)
            expect(ctx).toContain('Test Plant')
            expect(ctx).toContain('OG Kush')
            expect(ctx).toContain('Health: 95/100')
        })

        it('includes active problems in context', () => {
            const plant = makePlant({
                problems: [{ type: ProblemType.NutrientDeficiency, severity: 8, onsetDay: 5, status: 'active' }],
            } as Partial<Plant>)
            const snap = contextBridge.buildSnapshot({
                currentView: View.Plants,
                activePlants: [plant],
                settings: defaultSettings,
            })
            const ctx = contextBridge.buildAiSystemContext(snap)
            expect(ctx).toContain('Active Problems:')
            expect(ctx).toContain('NitrogenDeficiency')
        })
    })

    describe('getSuggestions', () => {
        it('returns empty array for no problems and no knowledge', () => {
            const snap = contextBridge.buildSnapshot({
                currentView: View.Plants,
                activePlants: [],
                settings: defaultSettings,
            })
            const suggestions = contextBridge.getSuggestions(snap)
            expect(suggestions).toHaveLength(0)
        })

        it('suggests Disease Atlas for plants with problems', () => {
            const plant = makePlant({
                problems: [{ type: ProblemType.PestInfestation, severity: 9, onsetDay: 3, status: 'active' }],
            } as Partial<Plant>)
            const snap = contextBridge.buildSnapshot({
                currentView: View.Plants,
                activePlants: [plant],
                settings: defaultSettings,
            })
            const suggestions = contextBridge.getSuggestions(snap)
            expect(suggestions.length).toBeGreaterThanOrEqual(1)
            expect(suggestions[0]?.targetView).toBe(View.Knowledge)
            expect(suggestions[0]?.priority).toBe('high')
        })
    })
})

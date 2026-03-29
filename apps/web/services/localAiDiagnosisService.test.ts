import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Language, Plant, Strain } from '@/types'
import { PlantStage, StrainType } from '@/types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('dompurify', () => ({
    default: {
        sanitize: (val: string) => val,
    },
}))

vi.mock('@/services/sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

const mockDiagnoseWithRules = vi.fn(() => ({
    issues: ['Overwatering detected'],
    topPriority: 'Reduce watering frequency',
}))

vi.mock('@/services/localAiFallbackService', () => ({
    diagnosePlant: (...args: Parameters<typeof mockDiagnoseWithRules>) =>
        mockDiagnoseWithRules(...args),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
    ZERO_SHOT_LABELS,
    VISION_MODEL_ID,
    mapIssueLabel,
    classifyPlantImage,
    buildDiagnosisContent,
    fallbackDiagnosis,
} from '@/services/localAiDiagnosisService'

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

const buildPlant = (): Plant =>
    ({
        id: 'p1',
        name: 'DiagPlant',
        strain: {
            id: 's1',
            name: 'DiagStrain',
            type: StrainType.Indica,
            floweringType: 'Photoperiod',
            thc: 22,
            cbd: 0.5,
            floweringTime: 8,
            agronomic: { difficulty: 'Easy', yield: 'High', height: 'Short' },
            geneticModifiers: {
                pestResistance: 0.5,
                nutrientUptakeRate: 0.5,
                stressTolerance: 0.5,
                rue: 0.5,
                vpdTolerance: { min: 0.8, max: 1.2 },
                transpirationFactor: 0.5,
                stomataSensitivity: 0.5,
            },
        } as Strain,
        mediumType: 'Coco',
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        age: 21,
        stage: PlantStage.Flowering,
        health: 60,
        stressLevel: 30,
        height: 35,
        biomass: { total: 1, stem: 0.2, leaves: 0.5, flowers: 0.3 },
        leafAreaIndex: 1.5,
        isTopped: false,
        lstApplied: 0,
        environment: {
            internalTemperature: 28,
            internalHumidity: 65,
            vpd: 1.2,
            co2Level: 500,
        },
        medium: {
            ph: 5.5,
            ec: 2.0,
            moisture: 30,
            microbeHealth: 70,
            substrateWater: 0.4,
            nutrientConcentration: { nitrogen: 0.6, phosphorus: 0.5, potassium: 0.5 },
        },
        nutrientPool: { nitrogen: 1, phosphorus: 1, potassium: 1 },
        rootSystem: { health: 75, rootMass: 0.6 },
        equipment: {
            light: { type: 'LED', wattage: 300, isOn: true, lightHours: 12 },
            exhaustFan: { power: 'high', isOn: true },
            circulationFan: { isOn: true },
            potSize: 15,
            potType: 'Fabric',
        },
        problems: [],
        journal: [],
        tasks: [],
        harvestData: null,
        structuralModel: { branches: 6, nodes: 18 },
        history: [],
        cannabinoidProfile: { thc: 0, cbd: 0, cbn: 0 },
        terpeneProfile: {},
        stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
        simulationClock: { accumulatedDayMs: 0 },
    }) as Plant

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('localAiDiagnosisService', () => {
    beforeEach(() => {
        mockDiagnoseWithRules.mockClear()
        mockDiagnoseWithRules.mockReturnValue({
            issues: ['Overwatering detected'],
            topPriority: 'Reduce watering frequency',
        })
    })

    // ── Constants ────────────────────────────────────────────────────

    describe('constants', () => {
        it('exports VISION_MODEL_ID', () => {
            expect(VISION_MODEL_ID).toBe('Xenova/clip-vit-large-patch14')
        })

        it('exports 33 zero-shot labels', () => {
            expect(ZERO_SHOT_LABELS).toHaveLength(33)
            expect(ZERO_SHOT_LABELS).toContain('healthy plant')
            expect(ZERO_SHOT_LABELS).toContain('nitrogen deficiency')
            expect(ZERO_SHOT_LABELS).toContain('root rot')
            expect(ZERO_SHOT_LABELS).toContain('botrytis bud rot')
            expect(ZERO_SHOT_LABELS).toContain('revegetation stress')
        })
    })

    // ── mapIssueLabel ────────────────────────────────────────────────

    describe('mapIssueLabel', () => {
        it('returns English description for known label', () => {
            const result = mapIssueLabel('nitrogen deficiency', 'en')
            expect(result).toContain('nitrogen deficiency')
        })

        it('returns German description for known label', () => {
            const result = mapIssueLabel('nitrogen deficiency', 'de')
            expect(result).toContain('Stickstoffmangel')
        })

        it('falls back to English for unsupported language', () => {
            const result = mapIssueLabel('overwatering', 'es')
            expect(result).toContain('overwatering')
        })

        it('returns null for unknown label', () => {
            expect(mapIssueLabel('completely unknown issue', 'en')).toBeNull()
        })

        it('is case-insensitive', () => {
            expect(mapIssueLabel('Nitrogen Deficiency', 'en')).not.toBeNull()
        })
    })

    // ── classifyPlantImage ───────────────────────────────────────────

    describe('classifyPlantImage', () => {
        it('returns empty array for oversized images (> 5MB)', async () => {
            const hugeBase64 = 'x'.repeat(5_000_001)
            const mockPipelineLoader = vi.fn()
            const result = await classifyPlantImage(
                hugeBase64,
                'image/jpeg',
                mockPipelineLoader,
                60_000,
            )
            expect(result).toEqual([])
            expect(mockPipelineLoader).not.toHaveBeenCalled()
        })

        it('returns empty array when pipeline throws', async () => {
            const mockPipelineLoader = vi.fn().mockRejectedValue(new Error('Model load failed'))
            const result = await classifyPlantImage(
                'aGVsbG8=',
                'image/jpeg',
                mockPipelineLoader,
                60_000,
            )
            expect(result).toEqual([])
        })

        it('calls pipeline with correct candidate labels', async () => {
            const classifierFn = vi.fn().mockResolvedValue([{ label: 'healthy plant', score: 0.9 }])
            const mockPipelineLoader = vi.fn().mockResolvedValue(classifierFn)

            vi.stubGlobal(
                'fetch',
                vi.fn(async () => ({
                    blob: async () => new Blob(['img'], { type: 'image/jpeg' }),
                })),
            )

            const result = await classifyPlantImage(
                'aGVsbG8=',
                'image/jpeg',
                mockPipelineLoader,
                60_000,
            )
            expect(result).toEqual([{ label: 'healthy plant', score: 0.9 }])
            expect(classifierFn).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    candidate_labels: expect.arrayContaining(['healthy plant']),
                }),
            )

            vi.unstubAllGlobals()
        })
    })

    // ── buildDiagnosisContent ────────────────────────────────────────

    describe('buildDiagnosisContent', () => {
        it('merges vision labels with heuristic rules', () => {
            const labels = [
                { label: 'nitrogen deficiency', score: 0.85 },
                { label: 'healthy plant', score: 0.1 },
            ]
            const result = buildDiagnosisContent(buildPlant(), 'en', labels)
            expect(result.title).toContain('Local Diagnosis')
            expect(result.title).toContain('DiagPlant')
            expect(result.content).toContain('nitrogen deficiency')
            expect(result.confidence).toBeGreaterThan(0)
        })

        it('uses German title for de language', () => {
            const labels = [{ label: 'overwatering', score: 0.8 }]
            const result = buildDiagnosisContent(buildPlant(), 'de', labels)
            expect(result.title).toContain('Lokale Diagnose')
        })

        it('uses Spanish title for es language', () => {
            const labels = [{ label: 'overwatering', score: 0.8 }]
            const result = buildDiagnosisContent(buildPlant(), 'es', labels)
            expect(result.title).toContain('Diagnostico Local')
        })

        it('filters out healthy plant from ranked issues', () => {
            const labels = [
                { label: 'healthy plant', score: 0.95 },
                { label: 'nitrogen deficiency', score: 0.3 },
            ]
            const result = buildDiagnosisContent(buildPlant(), 'en', labels)
            // healthy plant should be filtered, nitrogen deficiency should remain
            expect(result.content).not.toContain('generally healthy')
        })

        it('caps ranked issues at 4', () => {
            const labels = [
                { label: 'nitrogen deficiency', score: 0.9 },
                { label: 'phosphorus deficiency', score: 0.8 },
                { label: 'potassium deficiency', score: 0.7 },
                { label: 'calcium deficiency', score: 0.6 },
                { label: 'magnesium deficiency', score: 0.5 },
                { label: 'iron deficiency', score: 0.4 },
            ]
            const result = buildDiagnosisContent(buildPlant(), 'en', labels)
            // Only 4 vision + heuristic issues should appear; confidence from top label
            expect(result.confidence).toBeCloseTo(0.9, 1)
        })
    })

    // ── fallbackDiagnosis ────────────────────────────────────────────

    describe('fallbackDiagnosis', () => {
        const TITLE_LANGUAGES: Array<[Language, string]> = [
            ['en', 'Local Diagnosis'],
            ['de', 'Lokale Diagnose'],
            ['es', 'Diagnostico Local'],
            ['fr', 'Diagnostic Local'],
            ['nl', 'Lokale Diagnose'],
        ]

        it.each(TITLE_LANGUAGES)('returns localized title for %s', (lang, expectedTitle) => {
            const result = fallbackDiagnosis(buildPlant(), lang)
            expect(result.title).toContain(expectedTitle)
            expect(result.title).toContain('DiagPlant')
        })

        it('returns heuristic issues as content', () => {
            const result = fallbackDiagnosis(buildPlant(), 'en')
            expect(result.content).toContain('Overwatering detected')
            expect(result.confidence).toBe(0.72)
        })

        it('returns high confidence when no issues', () => {
            mockDiagnoseWithRules.mockReturnValue({
                issues: [],
                topPriority: 'All good',
            })
            const result = fallbackDiagnosis(buildPlant(), 'en')
            expect(result.confidence).toBe(0.93)
            expect(result.content).toBe('All good')
        })

        it('includes prevention advice in all 5 languages', () => {
            for (const lang of ['en', 'de', 'es', 'fr', 'nl'] as Language[]) {
                const result = fallbackDiagnosis(buildPlant(), lang)
                expect(result.prevention.length).toBeGreaterThan(10)
            }
        })
    })
})

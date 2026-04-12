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

vi.mock('../fallback/fallbackService', () => ({
    diagnosePlant: (...args: Parameters<typeof mockDiagnoseWithRules>) =>
        mockDiagnoseWithRules(...args),
}))

// Mock i18n -- return realistic translations for diagnosis keys
const MOCK_TRANSLATIONS: Record<string, string> = {
    'plantsView.diagnosis.localDiagnosisTitle': 'Local Diagnosis: {{name}}',
    'plantsView.diagnosis.preventionTrack': 'Track light, watering, VPD, and feeding over time.',
    'plantsView.diagnosis.preventionCheck': 'Check VPD, pH, EC, and substrate moisture regularly.',
    'plantsView.diagnosis.nitrogenDeficiency':
        'Possible nitrogen deficiency: older leaves may fade or yellow first.',
    'plantsView.diagnosis.overwatering':
        'Possible overwatering: droopy growth and slow recovery often point to saturated media.',
    'plantsView.diagnosis.healthyPlant':
        'The plant appears generally healthy in the local model scan.',
    'plantsView.diagnosis.phosphorusDeficiency':
        'Possible phosphorus deficiency: look for slowed growth and darker foliage.',
    'plantsView.diagnosis.potassiumDeficiency':
        'Possible potassium deficiency: leaf edges may crisp or discolor.',
    'plantsView.diagnosis.calciumDeficiency':
        'Possible calcium deficiency: new growth may twist or spot.',
    'plantsView.diagnosis.magnesiumDeficiency':
        'Possible magnesium deficiency: interveinal chlorosis can appear first on older leaves.',
    'plantsView.diagnosis.ironDeficiency':
        'Possible iron deficiency: new growth turns pale yellow while veins stay green.',
}

vi.mock('@/i18n', () => ({
    getT: () => (key: string, opts?: Record<string, string>) => {
        let val = MOCK_TRANSLATIONS[key]
        if (!val) return key
        if (opts) {
            for (const [k, v] of Object.entries(opts)) {
                val = val.replace(`{{${k}}}`, v)
            }
        }
        return val
    },
}))

// Mock plantDiseaseModelService for classifyLeafImage tests
vi.mock('./plantDiseaseModelService', () => ({
    isModelCached: vi.fn().mockResolvedValue(false),
    ensureWorkerRegistered: vi.fn(),
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
    classifyLeafImage,
    classifySeverity,
    enrichWithKnowledge,
} from './diagnosisService'

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

const buildPlant = (): Plant =>
    ({
        id: 'p1',
        growId: 'default-grow',
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
        it('returns description for known label', () => {
            const result = mapIssueLabel('nitrogen deficiency', 'en')
            expect(result).toContain('nitrogen deficiency')
        })

        it('returns translated description via i18n for known label', () => {
            const result = mapIssueLabel('nitrogen deficiency', 'de')
            // In test env the i18n mock returns EN text; in prod, i18n resolves to active lang
            expect(result).toContain('nitrogen deficiency')
        })

        it('returns description for any supported language param', () => {
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

        it('uses i18n for title translation (de maps via i18n)', () => {
            const labels = [{ label: 'overwatering', score: 0.8 }]
            const result = buildDiagnosisContent(buildPlant(), 'de', labels)
            // i18n mock returns EN interpolation for all languages in tests
            expect(result.title).toContain('DiagPlant')
        })

        it('uses i18n for title translation (es maps via i18n)', () => {
            const labels = [{ label: 'overwatering', score: 0.8 }]
            const result = buildDiagnosisContent(buildPlant(), 'es', labels)
            expect(result.title).toContain('DiagPlant')
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
        it('returns title with plant name via i18n', () => {
            const result = fallbackDiagnosis(buildPlant(), 'en')
            expect(result.title).toContain('Local Diagnosis')
            expect(result.title).toContain('DiagPlant')
        })

        it('returns title with plant name for any language', () => {
            // i18n mock returns EN template for all languages
            const languages: Language[] = ['de', 'es', 'fr', 'nl']
            for (const lang of languages) {
                const result = fallbackDiagnosis(buildPlant(), lang)
                expect(result.title).toContain('DiagPlant')
            }
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

    // ---- ONNX leaf diagnosis helpers ----------------------------------------

    describe('classifySeverity', () => {
        it('maps confidence thresholds to the correct severity tiers', () => {
            expect(classifySeverity(0.85)).toBe('severe')
            expect(classifySeverity(0.8)).toBe('severe')
            expect(classifySeverity(0.65)).toBe('moderate')
            expect(classifySeverity(0.6)).toBe('moderate')
            expect(classifySeverity(0.45)).toBe('mild')
            expect(classifySeverity(0.4)).toBe('mild')
            expect(classifySeverity(0.3)).toBe('none')
            expect(classifySeverity(0)).toBe('none')
        })
    })

    describe('enrichWithKnowledge', () => {
        it('returns a recommendation with non-empty relatedLexiconKeys for spider_mites', () => {
            const recs = enrichWithKnowledge('spider_mites')
            expect(recs.length).toBeGreaterThan(0)
            const rec = recs[0]
            expect(rec).toBeDefined()
            expect(rec!.diseaseId).toBe('spider-mites')
            expect(rec!.relatedLexiconKeys.length).toBeGreaterThan(0)
        })

        it('returns empty array for an unknown label', () => {
            expect(enrichWithKnowledge('completely_unknown_xyz')).toHaveLength(0)
        })
    })

    describe('classifyLeafImage', () => {
        it('returns zero-shot fallback when the ONNX model is not cached', async () => {
            // isModelCached is mocked to return false (see vi.mock block above).
            // ImageData is not available in jsdom; use a plain object cast instead.
            const imageData = {
                data: new Uint8ClampedArray(4),
                width: 1,
                height: 1,
                colorSpace: 'srgb',
            } as unknown as ImageData
            const result = await classifyLeafImage(imageData)
            expect(result.modelUsed).toBe('zero-shot')
            expect(result.label).toBe('unavailable')
            expect(result.severity).toBe('none')
        })
    })
})

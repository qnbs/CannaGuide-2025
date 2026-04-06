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

vi.mock('@/services/localAiFallbackService', () => ({
    localAiFallbackService: {
        getEquipmentRecommendation: vi.fn(() => ({
            tent: { name: 'Fallback Tent', price: 100, rationale: 'basic' },
            light: { name: 'Fallback Light', price: 100, rationale: 'basic', watts: 150 },
            ventilation: { name: 'FB Fan', price: 50, rationale: 'r' },
            circulationFan: { name: 'FB Circ', price: 30, rationale: 'r' },
            pots: { name: 'FB Pots', price: 20, rationale: 'r' },
            soil: { name: 'FB Soil', price: 25, rationale: 'r' },
            nutrients: { name: 'FB Nutes', price: 40, rationale: 'r' },
            extra: { name: 'FB Extra', price: 10, rationale: 'r' },
            proTip: 'Fallback tip',
        })),
        getNutrientRecommendation: vi.fn(() => 'Fallback nutrient advice'),
        getMentorResponse: vi.fn(() => ({
            title: 'Fallback Mentor',
            content: 'Fallback content',
            uiHighlights: [],
        })),
        getPlantAdvice: vi.fn(() => ({
            title: 'Fallback Advice',
            content: 'Fallback advice content',
        })),
        getGardenStatusSummary: vi.fn(() => ({
            title: 'Fallback Garden',
            content: 'Fallback garden summary',
        })),
        getStrainTips: vi.fn(() => ({
            nutrientTip: 'Fallback nutrient',
            trainingTip: 'Fallback training',
            environmentalTip: 'Fallback env',
            proTip: 'Fallback pro',
        })),
        getGrowLogRagAnswer: vi.fn(() => ({
            title: 'Fallback RAG',
            content: 'Fallback RAG answer',
        })),
        generateStrainImage: vi.fn(() => 'data:image/svg+xml;base64,fallback'),
    },
}))

vi.mock('./imageGenerationService', () => ({
    checkImageGenCapability: vi.fn(() => ({ supported: false })),
    generateStrainImageLocal: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
    handleEquipmentRecommendation,
    handleNutrientRecommendation,
    handleMentorResponse,
    handlePlantAdvice,
    handleGardenStatusSummary,
    handleStrainTips,
    handleGrowLogRagAnswer,
    handleDeepDive,
    handleStrainImageGeneration,
} from '@/services/localAiPromptHandlers'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const buildPlant = (): Plant =>
    ({
        id: 'p1',
        name: 'TestPlant',
        strain: {
            id: 's1',
            name: 'TestStrain',
            type: StrainType.Hybrid,
            floweringType: 'Photoperiod',
            thc: 20,
            cbd: 1,
            floweringTime: 9,
            agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
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
        mediumType: 'Soil',
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        age: 30,
        stage: PlantStage.Vegetative,
        health: 80,
        stressLevel: 10,
        height: 40,
        biomass: { total: 1, stem: 0.2, leaves: 0.5, flowers: 0.3 },
        leafAreaIndex: 1.5,
        isTopped: false,
        lstApplied: 0,
        environment: {
            internalTemperature: 25,
            internalHumidity: 55,
            vpd: 1.0,
            co2Level: 600,
        },
        medium: {
            ph: 6.2,
            ec: 1.3,
            moisture: 50,
            microbeHealth: 80,
            substrateWater: 0.5,
            nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.4, potassium: 0.4 },
        },
        nutrientPool: { nitrogen: 1, phosphorus: 1, potassium: 1 },
        rootSystem: { health: 85, rootMass: 0.7 },
        equipment: {
            light: { type: 'LED', wattage: 240, isOn: true, lightHours: 18 },
            exhaustFan: { power: 'medium', isOn: true },
            circulationFan: { isOn: true },
            potSize: 11,
            potType: 'Fabric',
        },
        problems: [],
        journal: [],
        tasks: [],
        harvestData: null,
        structuralModel: { branches: 4, nodes: 12 },
        history: [],
        cannabinoidProfile: { thc: 0, cbd: 0, cbn: 0 },
        terpeneProfile: {},
        stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
        simulationClock: { accumulatedDayMs: 0 },
    }) as Plant

const ALL_LANGUAGES: Language[] = ['en', 'de', 'es', 'fr', 'nl']

const LANGUAGE_NAMES: Record<Language, string> = {
    en: 'English',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    nl: 'Dutch',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('localAiPromptHandlers', () => {
    const mockGenerate = vi.fn<(prompt: string) => Promise<string | null>>()

    beforeEach(() => {
        mockGenerate.mockReset()
    })

    // ── Language constraint injection ────────────────────────────────

    describe('languageConstraint injection across all 5 languages', () => {
        it.each(ALL_LANGUAGES)(
            'handleEquipmentRecommendation injects CRITICAL constraint for %s',
            async (lang) => {
                mockGenerate.mockResolvedValue(null)
                await handleEquipmentRecommendation('test prompt', lang, mockGenerate)
                const prompt = mockGenerate.mock.calls[0]?.[0] as string
                expect(prompt).toContain(
                    `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}`,
                )
            },
        )

        it.each(ALL_LANGUAGES)(
            'handleMentorResponse injects CRITICAL constraint for %s',
            async (lang) => {
                mockGenerate.mockResolvedValue(null)
                await handleMentorResponse(buildPlant(), 'test', lang, '', mockGenerate)
                const prompt = mockGenerate.mock.calls[0]?.[0] as string
                expect(prompt).toContain(
                    `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}`,
                )
            },
        )

        it.each(ALL_LANGUAGES)(
            'handlePlantAdvice injects CRITICAL constraint for %s',
            async (lang) => {
                mockGenerate.mockResolvedValue(null)
                await handlePlantAdvice(buildPlant(), lang, mockGenerate)
                const prompt = mockGenerate.mock.calls[0]?.[0] as string
                expect(prompt).toContain(
                    `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}`,
                )
            },
        )

        it.each(ALL_LANGUAGES)(
            'handleNutrientRecommendation injects CRITICAL constraint for %s',
            async (lang) => {
                mockGenerate.mockResolvedValue(null)
                const ctx = {
                    medium: 'Soil',
                    stage: 'veg',
                    currentEc: 1.2,
                    currentPh: 6.0,
                    optimalRange: { ecMin: 1.0, ecMax: 2.0, phMin: 5.5, phMax: 6.5 },
                    readings: [],
                }
                await handleNutrientRecommendation(ctx, lang, mockGenerate)
                const prompt = mockGenerate.mock.calls[0]?.[0] as string
                expect(prompt).toContain(
                    `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}`,
                )
            },
        )

        it.each(ALL_LANGUAGES)(
            'handleGardenStatusSummary injects CRITICAL constraint for %s',
            async (lang) => {
                mockGenerate.mockResolvedValue(null)
                await handleGardenStatusSummary([buildPlant()], lang, mockGenerate)
                const prompt = mockGenerate.mock.calls[0]?.[0] as string
                expect(prompt).toContain(
                    `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}`,
                )
            },
        )

        it.each(ALL_LANGUAGES)(
            'handleStrainTips injects CRITICAL constraint for %s',
            async (lang) => {
                mockGenerate.mockResolvedValue(null)
                await handleStrainTips(
                    buildPlant().strain,
                    { focus: 'overall', stage: 'veg', experienceLevel: 'beginner' },
                    lang,
                    mockGenerate,
                )
                const prompt = mockGenerate.mock.calls[0]?.[0] as string
                expect(prompt).toContain(
                    `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}`,
                )
            },
        )

        it.each(ALL_LANGUAGES)(
            'handleGrowLogRagAnswer injects CRITICAL constraint for %s',
            async (lang) => {
                mockGenerate.mockResolvedValue(null)
                await handleGrowLogRagAnswer(
                    [buildPlant()],
                    'How is my plant?',
                    lang,
                    undefined,
                    mockGenerate,
                )
                const prompt = mockGenerate.mock.calls[0]?.[0] as string
                expect(prompt).toContain(
                    `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}`,
                )
            },
        )

        it.each(ALL_LANGUAGES)(
            'handleDeepDive injects CRITICAL constraint for %s',
            async (lang) => {
                mockGenerate.mockResolvedValue(null)
                await handleDeepDive('VPD tuning', buildPlant(), lang, mockGenerate)
                const prompt = mockGenerate.mock.calls[0]?.[0] as string
                expect(prompt).toContain(
                    `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}`,
                )
            },
        )
    })

    // ── JSON format rules in prompts ─────────────────────────────────

    describe('JSON formatting rules in prompts', () => {
        it('handleEquipmentRecommendation requests JSON shape with tent/light/etc', async () => {
            mockGenerate.mockResolvedValue(null)
            await handleEquipmentRecommendation('test', 'en', mockGenerate)
            const prompt = mockGenerate.mock.calls[0]?.[0] as string
            expect(prompt).toContain('Return ONLY valid JSON')
            expect(prompt).toContain('"tent"')
            expect(prompt).toContain('"light"')
            expect(prompt).toContain('"proTip"')
        })

        it('handleMentorResponse requests JSON shape with title/content/uiHighlights', async () => {
            mockGenerate.mockResolvedValue(null)
            await handleMentorResponse(buildPlant(), 'q', 'en', '', mockGenerate)
            const prompt = mockGenerate.mock.calls[0]?.[0] as string
            expect(prompt).toContain('Return ONLY valid JSON')
            expect(prompt).toContain('"title"')
            expect(prompt).toContain('"content"')
            expect(prompt).toContain('"uiHighlights"')
        })
    })

    // ── Fallback behavior ────────────────────────────────────────────

    describe('fallback to localAiFallbackService when generateText returns null', () => {
        it('handleEquipmentRecommendation falls back', async () => {
            mockGenerate.mockResolvedValue(null)
            const result = await handleEquipmentRecommendation('test', 'en', mockGenerate)
            expect(result).toHaveProperty('tent')
            expect(result.tent.name).toBe('Fallback Tent')
        })

        it('handleNutrientRecommendation falls back', async () => {
            mockGenerate.mockResolvedValue(null)
            const result = await handleNutrientRecommendation(
                {
                    medium: 'Soil',
                    stage: 'veg',
                    currentEc: 1.2,
                    currentPh: 6.0,
                    optimalRange: { ecMin: 1.0, ecMax: 2.0, phMin: 5.5, phMax: 6.5 },
                    readings: [],
                },
                'en',
                mockGenerate,
            )
            expect(result).toBe('Fallback nutrient advice')
        })

        it('handleMentorResponse falls back', async () => {
            mockGenerate.mockResolvedValue(null)
            const result = await handleMentorResponse(buildPlant(), 'q', 'de', '', mockGenerate)
            expect(result.title).toBe('Fallback Mentor')
        })

        it('handlePlantAdvice falls back', async () => {
            mockGenerate.mockResolvedValue(null)
            const result = await handlePlantAdvice(buildPlant(), 'en', mockGenerate)
            expect(result.title).toBe('Fallback Advice')
        })

        it('handleGardenStatusSummary falls back', async () => {
            mockGenerate.mockResolvedValue(null)
            const result = await handleGardenStatusSummary([buildPlant()], 'en', mockGenerate)
            expect(result.title).toBe('Fallback Garden')
        })

        it('handleStrainTips falls back', async () => {
            mockGenerate.mockResolvedValue(null)
            const result = await handleStrainTips(
                buildPlant().strain,
                { focus: 'overall', stage: 'veg', experienceLevel: 'beginner' },
                'en',
                mockGenerate,
            )
            expect(result.nutrientTip).toBe('Fallback nutrient')
        })

        it('handleGrowLogRagAnswer falls back', async () => {
            mockGenerate.mockResolvedValue(null)
            const result = await handleGrowLogRagAnswer(
                [buildPlant()],
                'test',
                'en',
                undefined,
                mockGenerate,
            )
            expect(result.title).toBe('Fallback RAG')
        })
    })

    // ── Successful JSON parsing ──────────────────────────────────────

    describe('successful JSON parsing', () => {
        it('handleMentorResponse parses valid JSON', async () => {
            mockGenerate.mockResolvedValue(
                JSON.stringify({
                    title: 'Mentor Title',
                    content: 'Helpful advice',
                    uiHighlights: [{ elementId: 'watering' }],
                }),
            )
            const result = await handleMentorResponse(buildPlant(), 'q', 'en', '', mockGenerate)
            expect(result.title).toBe('Mentor Title')
            expect(result.content).toBe('Helpful advice')
        })

        it('handlePlantAdvice returns parsed AIResponse', async () => {
            mockGenerate.mockResolvedValue(
                JSON.stringify({ title: 'AI Title', content: 'AI Content' }),
            )
            const result = await handlePlantAdvice(buildPlant(), 'en', mockGenerate)
            expect(result.title).toBe('AI Title')
        })

        it('handlePlantAdvice wraps raw text when JSON parse fails', async () => {
            mockGenerate.mockResolvedValue('Just some raw text advice')
            const result = await handlePlantAdvice(buildPlant(), 'de', mockGenerate)
            expect(result.title).toContain('Lokale Beratung')
            expect(result.content).toBe('Just some raw text advice')
        })

        it('handleGardenStatusSummary wraps raw text', async () => {
            mockGenerate.mockResolvedValue('Garden looks great overall')
            const result = await handleGardenStatusSummary([buildPlant()], 'en', mockGenerate)
            expect(result.title).toBe('Local Garden Status')
            expect(result.content).toBe('Garden looks great overall')
        })

        it('handleNutrientRecommendation returns generated text', async () => {
            mockGenerate.mockResolvedValue('Increase EC to 1.5')
            const result = await handleNutrientRecommendation(
                {
                    medium: 'Coco',
                    stage: 'flower',
                    currentEc: 1.0,
                    currentPh: 5.8,
                    optimalRange: { ecMin: 1.2, ecMax: 2.0, phMin: 5.5, phMax: 6.5 },
                    readings: [],
                },
                'en',
                mockGenerate,
            )
            expect(result).toBe('Increase EC to 1.5')
        })
    })

    // ── Deep-dive fallback structure ─────────────────────────────────

    describe('handleDeepDive', () => {
        it('returns structured fallback when generateText returns null', async () => {
            mockGenerate.mockResolvedValue(null)
            const result = await handleDeepDive('VPD', buildPlant(), 'de', mockGenerate)
            expect(result).toHaveProperty('introduction')
            expect(result).toHaveProperty('stepByStep')
            expect(result).toHaveProperty('prosAndCons')
            expect(result).toHaveProperty('proTip')
        })

        it('parses valid deep-dive JSON', async () => {
            mockGenerate.mockResolvedValue(
                JSON.stringify({
                    introduction: 'VPD intro',
                    stepByStep: ['Step 1', 'Step 2'],
                    prosAndCons: { pros: ['Pro'], cons: ['Con'] },
                    proTip: 'Keep VPD at 1.0',
                }),
            )
            const result = await handleDeepDive('VPD', buildPlant(), 'en', mockGenerate)
            expect(result.introduction).toBe('VPD intro')
            expect(result.stepByStep).toHaveLength(2)
        })
    })

    // ── Strain image generation ──────────────────────────────────────

    describe('handleStrainImageGeneration', () => {
        it('falls back to SVG when image gen is unsupported', async () => {
            const result = await handleStrainImageGeneration(
                buildPlant().strain,
                'botanical',
                { focus: 'flower', composition: 'close-up', mood: 'warm' },
                'en',
            )
            expect(result).toContain('data:image/svg+xml')
        })
    })

    // ── A-01: Malformed AI response resilience ───────────────────────

    describe('malformed AI response resilience (A-01)', () => {
        it('returns fallback on invalid JSON from mentor', async () => {
            mockGenerate.mockResolvedValue('not valid json {{{')
            const result = await handleMentorResponse(buildPlant(), 'help', 'en', '', mockGenerate)
            expect(result.title).toBeTruthy()
            expect(result.content).toBeTruthy()
        })

        it('returns fallback on schema-invalid mentor JSON (missing content)', async () => {
            mockGenerate.mockResolvedValue(JSON.stringify({ title: 'Hi' }))
            const result = await handleMentorResponse(buildPlant(), 'help', 'en', '', mockGenerate)
            // Should still produce a valid response via fallback
            expect(result.title).toBeTruthy()
            expect(result.content).toBeTruthy()
        })

        it('returns fallback on invalid JSON from plant advice', async () => {
            mockGenerate.mockResolvedValue('broken response')
            const result = await handlePlantAdvice(buildPlant(), 'en', mockGenerate)
            expect(result.title).toBeTruthy()
            expect(result.content).toBeTruthy()
        })

        it('returns fallback on schema-invalid advice JSON (wrong types)', async () => {
            mockGenerate.mockResolvedValue(JSON.stringify({ title: 123, content: null }))
            const result = await handlePlantAdvice(buildPlant(), 'en', mockGenerate)
            expect(result.title).toBeTruthy()
            expect(result.content).toBeTruthy()
        })

        it('reports validation errors to Sentry on schema-invalid JSON', async () => {
            const { captureLocalAiError: mockCapture } = await import('@/services/sentryService')
            ;(mockCapture as ReturnType<typeof vi.fn>).mockClear()
            // Valid JSON but missing required field "content"
            mockGenerate.mockResolvedValue(JSON.stringify({ title: 'Only title' }))
            await handlePlantAdvice(buildPlant(), 'en', mockGenerate)
            expect(mockCapture).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('validation failed') }),
                expect.objectContaining({ stage: 'response-validation' }),
            )
        })

        it('returns fallback on schema-invalid grow tips JSON', async () => {
            mockGenerate.mockResolvedValue(JSON.stringify({ nutrientTip: 'only one field' }))
            const result = await handleStrainTips(
                buildPlant().strain,
                { focus: 'flower', stage: 'vegetative', experienceLevel: 'beginner' },
                'en',
                mockGenerate,
            )
            expect(result).toHaveProperty('nutrientTip')
            expect(result).toHaveProperty('trainingTip')
        })
    })
})

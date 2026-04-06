// ---------------------------------------------------------------------------
// T-05 -- AI Provider Contract Tests
//
// Validates that our Zod response schemas match the documented contract for
// each AI provider.  These tests run against synthetic fixtures that mirror
// real provider responses.  A weekly CI cron should run this suite to catch
// upstream API contract drift early.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import {
    AIResponseSchema,
    PlantDiagnosisResponseSchema,
    StructuredGrowTipsSchema,
    DeepDiveGuideSchema,
    RecommendationSchema,
} from '@cannaguide/ai-core'
import {
    PROVIDER_CONFIGS,
    isValidProviderKeyFormat,
    isKeyRotationDue,
    KEY_ROTATION_WINDOW_MS,
} from '@cannaguide/ai-core'
import type { AiProvider } from '@cannaguide/ai-core'

// ---------------------------------------------------------------------------
// Fixtures -- synthetic responses that mirror real provider output shapes
// ---------------------------------------------------------------------------

const VALID_AI_RESPONSE = {
    title: 'Watering Schedule Advice',
    content: 'Water your cannabis plants every 2-3 days during vegetative stage.',
    confidence: 0.92,
}

const VALID_AI_RESPONSE_NO_CONFIDENCE = {
    title: 'Basic Tip',
    content: 'Keep humidity between 40-60% during flowering.',
}

const VALID_DIAGNOSIS_RESPONSE = {
    title: 'Nitrogen Deficiency Detected',
    content: 'Lower leaves are yellowing from the tips inward.',
    confidence: 0.85,
    immediateActions: 'Increase nitrogen in next feeding by 20%.',
    longTermSolution: 'Switch to a veg-specific nutrient line with higher N ratio.',
    prevention: 'Monitor leaf color weekly and maintain pH between 6.0-6.5.',
    diagnosis: 'Classic nitrogen deficiency pattern starting from lower fan leaves.',
}

const VALID_GROW_TIPS = {
    nutrientTip: 'Increase CalMag during mid-flower for denser buds.',
    trainingTip: 'LST the main cola to expose lower bud sites to light.',
    environmentalTip: 'Drop night temps by 5F in late flower for purple expression.',
    proTip: 'Flush with plain pH water 10 days before harvest for cleaner taste.',
}

const VALID_DEEP_DIVE = {
    introduction: 'SCROG (Screen of Green) maximizes yield in limited vertical space.',
    stepByStep: [
        'Install a trellis net 20-30cm above the canopy.',
        'Train new growth horizontally through the net squares.',
        'Wait until 70% of squares are filled before flipping to 12/12.',
    ],
    prosAndCons: {
        pros: ['Maximizes light distribution', 'Higher yield per square meter'],
        cons: ['Requires more veg time', 'Difficult to move plants once netted'],
    },
    proTip: 'Use a net with 5cm squares for fine-grained canopy control.',
}

const VALID_RECOMMENDATION = {
    tent: {
        name: 'Mars Hydro 120x120',
        price: 189,
        rationale: 'Quality zippers and thick fabric.',
    },
    light: {
        name: 'Spider Farmer SF4000',
        price: 599,
        rationale: 'Samsung LM301H diodes.',
        watts: 450,
    },
    ventilation: { name: 'AC Infinity T6', price: 149, rationale: 'Quiet PWM controller.' },
    circulationFan: {
        name: 'Secret Jardin Monkey Fan',
        price: 29,
        rationale: 'Clip-on oscillating.',
    },
    pots: { name: 'AutoPot XL 25L', price: 42, rationale: 'Bottom-feed automation.' },
    soil: { name: 'BioBizz All-Mix', price: 24, rationale: 'Pre-amended organic soil.' },
    nutrients: {
        name: 'Advanced Nutrients pH Perfect',
        price: 89,
        rationale: 'Auto pH buffering.',
    },
    extra: { name: 'Inkbird ITC-308', price: 35, rationale: 'Temperature controller for exhaust.' },
    proTip: 'Invest in a quality pH pen -- it pays for itself in fewer nutrient lockouts.',
}

// ---------------------------------------------------------------------------
// Schema Contract Tests
// ---------------------------------------------------------------------------

describe('AI Response Schema Contracts', () => {
    describe('AIResponseSchema', () => {
        it('accepts a valid response with confidence', () => {
            const result = AIResponseSchema.safeParse(VALID_AI_RESPONSE)
            expect(result.success).toBe(true)
        })

        it('accepts a valid response without optional confidence', () => {
            const result = AIResponseSchema.safeParse(VALID_AI_RESPONSE_NO_CONFIDENCE)
            expect(result.success).toBe(true)
        })

        it('rejects empty title', () => {
            const result = AIResponseSchema.safeParse({ ...VALID_AI_RESPONSE, title: '' })
            expect(result.success).toBe(false)
        })

        it('rejects empty content', () => {
            const result = AIResponseSchema.safeParse({ ...VALID_AI_RESPONSE, content: '' })
            expect(result.success).toBe(false)
        })

        it('rejects confidence outside 0-1 range', () => {
            expect(
                AIResponseSchema.safeParse({ ...VALID_AI_RESPONSE, confidence: 1.5 }).success,
            ).toBe(false)
            expect(
                AIResponseSchema.safeParse({ ...VALID_AI_RESPONSE, confidence: -0.1 }).success,
            ).toBe(false)
        })

        it('rejects title exceeding 200 chars', () => {
            const result = AIResponseSchema.safeParse({
                ...VALID_AI_RESPONSE,
                title: 'x'.repeat(201),
            })
            expect(result.success).toBe(false)
        })

        it('rejects content exceeding 8000 chars', () => {
            const result = AIResponseSchema.safeParse({
                ...VALID_AI_RESPONSE,
                content: 'x'.repeat(8001),
            })
            expect(result.success).toBe(false)
        })

        it('rejects non-object input', () => {
            expect(AIResponseSchema.safeParse('string').success).toBe(false)
            expect(AIResponseSchema.safeParse(null).success).toBe(false)
            expect(AIResponseSchema.safeParse(42).success).toBe(false)
        })
    })

    describe('PlantDiagnosisResponseSchema', () => {
        it('accepts a valid diagnosis response', () => {
            const result = PlantDiagnosisResponseSchema.safeParse(VALID_DIAGNOSIS_RESPONSE)
            expect(result.success).toBe(true)
        })

        it('requires all diagnosis fields', () => {
            const incomplete = { title: 'Test', content: 'Test', confidence: 0.5 }
            const result = PlantDiagnosisResponseSchema.safeParse(incomplete)
            expect(result.success).toBe(false)
        })

        it('requires confidence (not optional)', () => {
            const { confidence: _, ...noConfidence } = VALID_DIAGNOSIS_RESPONSE
            const result = PlantDiagnosisResponseSchema.safeParse(noConfidence)
            expect(result.success).toBe(false)
        })

        it('rejects fields exceeding 2000 chars', () => {
            const long = 'x'.repeat(2001)
            expect(
                PlantDiagnosisResponseSchema.safeParse({
                    ...VALID_DIAGNOSIS_RESPONSE,
                    immediateActions: long,
                }).success,
            ).toBe(false)
        })
    })

    describe('StructuredGrowTipsSchema', () => {
        it('accepts valid grow tips', () => {
            const result = StructuredGrowTipsSchema.safeParse(VALID_GROW_TIPS)
            expect(result.success).toBe(true)
        })

        it('rejects missing tip fields', () => {
            const { proTip: _, ...partial } = VALID_GROW_TIPS
            expect(StructuredGrowTipsSchema.safeParse(partial).success).toBe(false)
        })

        it('rejects tip exceeding 1000 chars', () => {
            expect(
                StructuredGrowTipsSchema.safeParse({
                    ...VALID_GROW_TIPS,
                    nutrientTip: 'x'.repeat(1001),
                }).success,
            ).toBe(false)
        })
    })

    describe('DeepDiveGuideSchema', () => {
        it('accepts a valid deep dive guide', () => {
            const result = DeepDiveGuideSchema.safeParse(VALID_DEEP_DIVE)
            expect(result.success).toBe(true)
        })

        it('requires at least one step', () => {
            expect(
                DeepDiveGuideSchema.safeParse({
                    ...VALID_DEEP_DIVE,
                    stepByStep: [],
                }).success,
            ).toBe(false)
        })

        it('rejects more than 20 steps', () => {
            expect(
                DeepDiveGuideSchema.safeParse({
                    ...VALID_DEEP_DIVE,
                    stepByStep: Array.from({ length: 21 }, () => 'Step'),
                }).success,
            ).toBe(false)
        })

        it('rejects more than 10 pros or cons', () => {
            expect(
                DeepDiveGuideSchema.safeParse({
                    ...VALID_DEEP_DIVE,
                    prosAndCons: { pros: Array.from({ length: 11 }, () => 'Pro'), cons: [] },
                }).success,
            ).toBe(false)
        })
    })

    describe('RecommendationSchema', () => {
        it('accepts a valid recommendation', () => {
            const result = RecommendationSchema.safeParse(VALID_RECOMMENDATION)
            expect(result.success).toBe(true)
        })

        it('accepts recommendation items without optional watts', () => {
            const noWatts = {
                ...VALID_RECOMMENDATION,
                light: { name: 'TestLight', price: 100, rationale: 'Good' },
            }
            const result = RecommendationSchema.safeParse(noWatts)
            expect(result.success).toBe(true)
        })

        it('requires all 8 equipment categories', () => {
            const { tent: _, ...incomplete } = VALID_RECOMMENDATION
            expect(RecommendationSchema.safeParse(incomplete).success).toBe(false)
        })

        it('rejects negative prices', () => {
            expect(
                RecommendationSchema.safeParse({
                    ...VALID_RECOMMENDATION,
                    tent: { ...VALID_RECOMMENDATION.tent, price: -10 },
                }).success,
            ).toBe(false)
        })
    })
})

// ---------------------------------------------------------------------------
// Provider Configuration Contract Tests
// ---------------------------------------------------------------------------

describe('Provider Configuration Contracts', () => {
    const PROVIDERS: AiProvider[] = ['gemini', 'openai', 'xai', 'anthropic']

    describe.each(PROVIDERS)('%s provider config', (provider) => {
        const config = PROVIDER_CONFIGS[provider]

        it('has required config fields', () => {
            expect(config.id).toBe(provider)
            expect(config.label).toBeTruthy()
            expect(config.keyPattern).toBeInstanceOf(RegExp)
            expect(config.placeholder).toBeTruthy()
            expect(config.keyStorageKey).toBeTruthy()
            expect(config.getKeyUrl).toMatch(/^https:\/\//)
            expect(config.models.text).toBeTruthy()
            expect(config.models.json).toBeTruthy()
        })

        it('has a valid key pattern that matches placeholder prefix', () => {
            const prefix = config.placeholder.replace('...', '')
            expect(config.keyPattern.source).toContain(
                prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\\/g, ''),
            )
        })

        it('key storage key is unique', () => {
            const otherProviders = PROVIDERS.filter((p) => p !== provider)
            for (const other of otherProviders) {
                expect(config.keyStorageKey).not.toBe(PROVIDER_CONFIGS[other].keyStorageKey)
            }
        })
    })

    describe('key format validation', () => {
        it('validates Gemini key format', () => {
            expect(isValidProviderKeyFormat('gemini', 'AIzaSyA12345678901234567890')).toBe(true)
            expect(isValidProviderKeyFormat('gemini', 'sk-invalid')).toBe(false)
        })

        it('validates OpenAI key format', () => {
            expect(isValidProviderKeyFormat('openai', 'sk-abc123def456ghi789jkl012')).toBe(true)
            expect(isValidProviderKeyFormat('openai', 'AIza-invalid')).toBe(false)
        })

        it('validates xAI key format', () => {
            expect(isValidProviderKeyFormat('xai', 'xai-abc123def456ghi789jkl012')).toBe(true)
            expect(isValidProviderKeyFormat('xai', 'sk-invalid')).toBe(false)
        })

        it('validates Anthropic key format', () => {
            expect(isValidProviderKeyFormat('anthropic', 'sk-ant-abc123def456ghi789jkl012')).toBe(
                true,
            )
            expect(isValidProviderKeyFormat('anthropic', 'sk-wrong-format')).toBe(false)
        })

        it('rejects empty keys for all providers', () => {
            for (const provider of PROVIDERS) {
                expect(isValidProviderKeyFormat(provider, '')).toBe(false)
            }
        })

        it('rejects whitespace-padded keys after trim', () => {
            expect(isValidProviderKeyFormat('gemini', '  AIzaSyA12345678901234567890  ')).toBe(true)
        })
    })

    describe('key rotation', () => {
        it('returns false for null metadata', () => {
            expect(isKeyRotationDue(null)).toBe(false)
        })

        it('returns false for recent key', () => {
            expect(isKeyRotationDue({ updatedAt: Date.now() - 1000 })).toBe(false)
        })

        it('returns true for key older than 90 days', () => {
            expect(isKeyRotationDue({ updatedAt: Date.now() - KEY_ROTATION_WINDOW_MS - 1 })).toBe(
                true,
            )
        })

        it('returns true for key exactly at 90 days', () => {
            expect(isKeyRotationDue({ updatedAt: Date.now() - KEY_ROTATION_WINDOW_MS })).toBe(true)
        })
    })
})

// ---------------------------------------------------------------------------
// Cross-Provider Response Shape Conformance
// ---------------------------------------------------------------------------

describe('Cross-provider response conformance', () => {
    const MINIMAL_AI_RESPONSE = { title: 'T', content: 'C' }
    const MAXIMAL_AI_RESPONSE = {
        title: 'x'.repeat(200),
        content: 'x'.repeat(8000),
        confidence: 1.0,
    }

    it('accepts minimal response (boundary: min lengths)', () => {
        expect(AIResponseSchema.safeParse(MINIMAL_AI_RESPONSE).success).toBe(true)
    })

    it('accepts maximal response (boundary: max lengths)', () => {
        expect(AIResponseSchema.safeParse(MAXIMAL_AI_RESPONSE).success).toBe(true)
    })

    it('strips unknown fields via safeParse (providers may add extra fields)', () => {
        const withExtra = {
            ...VALID_AI_RESPONSE,
            provider: 'gemini',
            model: 'gemini-2.5-flash',
            usage: { tokens: 42 },
        }
        const result = AIResponseSchema.safeParse(withExtra)
        expect(result.success).toBe(true)
    })

    it('handles unicode content from all providers', () => {
        const unicode = {
            title: 'Pflanzentipp',
            content: 'Naehrstoffzufuhr erhoehen -- Kalzium und Magnesium.',
        }
        expect(AIResponseSchema.safeParse(unicode).success).toBe(true)
    })
})

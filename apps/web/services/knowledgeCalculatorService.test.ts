import { describe, it, expect } from 'vitest'
import {
    calculateTerpeneEntourage,
    calculateTranspiration,
    calculateEcTds,
    calculateLightSpectrum,
    calculateCannabinoidRatio,
    TerpeneEntourageInputSchema,
    TranspirationInputSchema,
    EcTdsInputSchema,
    LightSpectrumInputSchema,
    CannabinoidRatioInputSchema,
} from './knowledgeCalculatorService'

// ---------------------------------------------------------------------------
// 1. Terpene Entourage
// ---------------------------------------------------------------------------
describe('calculateTerpeneEntourage', () => {
    const base = {
        terpenes: [
            { name: 'Myrcene', percentage: 45 },
            { name: 'Limonene', percentage: 30 },
            { name: 'Linalool', percentage: 15 },
        ],
        thc: 22,
        cbd: 1,
        cbg: 0.5,
    }

    it('returns a score between 0 and 100', () => {
        const result = calculateTerpeneEntourage(base)
        expect(result.entourageScore).toBeGreaterThanOrEqual(0)
        expect(result.entourageScore).toBeLessThanOrEqual(100)
    })

    it('identifies Myrcene as dominant terpene', () => {
        const result = calculateTerpeneEntourage(base)
        expect(result.dominantTerpene).toBe('Myrcene')
    })

    it('classifies Myrcene-dominant as relaxing', () => {
        const result = calculateTerpeneEntourage(base)
        expect(result.profileType).toBe('relaxing')
    })

    it('classifies CBD-dominant as medicinal', () => {
        const result = calculateTerpeneEntourage({
            ...base,
            thc: 2,
            cbd: 20,
        })
        expect(result.profileType).toBe('medicinal')
    })

    it('classifies Limonene-dominant as energizing', () => {
        const result = calculateTerpeneEntourage({
            ...base,
            terpenes: [
                { name: 'Limonene', percentage: 60 },
                { name: 'Pinene', percentage: 20 },
            ],
        })
        expect(result.profileType).toBe('energizing')
    })

    it('diversity index is positive for multiple terpenes', () => {
        const result = calculateTerpeneEntourage(base)
        expect(result.diversityIndex).toBeGreaterThan(0)
    })

    it('returns synergy pairs', () => {
        const result = calculateTerpeneEntourage(base)
        expect(Array.isArray(result.synergyPairs)).toBe(true)
    })

    it('rejects empty terpene array', () => {
        expect(() => calculateTerpeneEntourage({ ...base, terpenes: [] })).toThrow()
    })

    it('rejects terpene percentage > 100', () => {
        expect(() =>
            calculateTerpeneEntourage({
                ...base,
                terpenes: [{ name: 'Myrcene', percentage: 101 }],
            }),
        ).toThrow()
    })
})

// ---------------------------------------------------------------------------
// 2. Transpiration Rate
// ---------------------------------------------------------------------------
describe('calculateTranspiration', () => {
    const base = { vpd: 1.0, gsmmol: 200, lai: 3, hoursPerDay: 18 as const }

    it('leaf rate matches formula: gs * vpd / 101.3', () => {
        const result = calculateTranspiration(base)
        const expected = (200 * 1.0) / 101.3
        expect(result.leafRate).toBeCloseTo(expected, 1)
    })

    it('canopy rate = leaf rate * LAI', () => {
        const result = calculateTranspiration(base)
        expect(result.canopyRate).toBeCloseTo(result.leafRate * 3, 1)
    })

    it('daily water use is positive for valid inputs', () => {
        const result = calculateTranspiration(base)
        expect(result.dailyWaterMlPerM2).toBeGreaterThan(0)
    })

    it('returns optimal status for moderate VPD', () => {
        const result = calculateTranspiration(base)
        expect(result.status).toBe('optimal')
    })

    it('returns low status for very low gs', () => {
        const result = calculateTranspiration({ vpd: 0.2, gsmmol: 10, lai: 1, hoursPerDay: 18 })
        expect(result.status).toBe('low')
    })

    it('returns high status for extreme inputs', () => {
        const result = calculateTranspiration({ vpd: 4, gsmmol: 900, lai: 8, hoursPerDay: 18 })
        expect(result.status).toBe('high')
    })

    it('uses default hoursPerDay of 18 when not specified', () => {
        const withDefault = calculateTranspiration(base)
        const withExplicit = calculateTranspiration({ ...base, hoursPerDay: 18 })
        expect(withDefault.dailyWaterMlPerM2).toBe(withExplicit.dailyWaterMlPerM2)
    })

    it('rejects VPD > 5', () => {
        expect(() =>
            calculateTranspiration({ vpd: 6, gsmmol: 200, lai: 3, hoursPerDay: 18 }),
        ).toThrow()
    })
})

// ---------------------------------------------------------------------------
// 3. EC / TDS Converter
// ---------------------------------------------------------------------------
describe('calculateEcTds', () => {
    it('converts EC to all TDS scales', () => {
        const result = calculateEcTds({ ecMs: 2.0 })
        expect(result.tds500).toBe(1000)
        expect(result.tds640).toBe(1280)
        expect(result.tds700).toBe(1400)
    })

    it('derives EC from TDS-500 input', () => {
        const result = calculateEcTds({ tds500: 1000 })
        expect(result.ecMs).toBeCloseTo(2.0, 2)
    })

    it('derives EC from TDS-640 input', () => {
        const result = calculateEcTds({ tds640: 1280 })
        expect(result.ecMs).toBeCloseTo(2.0, 2)
    })

    it('derives EC from TDS-700 input', () => {
        const result = calculateEcTds({ tds700: 1400 })
        expect(result.ecMs).toBeCloseTo(2.0, 2)
    })

    it('omits phDrift when fewer than 2 readings', () => {
        const result = calculateEcTds({ ecMs: 1.5, phReadings: [6.5] })
        expect(result.phDrift).toBeUndefined()
    })

    it('returns stable trend for flat pH readings', () => {
        const result = calculateEcTds({ ecMs: 1.5, phReadings: [6.5, 6.5, 6.5, 6.5] })
        expect(result.phDrift?.trend).toBe('stable')
    })

    it('returns rising trend for ascending pH', () => {
        const result = calculateEcTds({ ecMs: 1.5, phReadings: [5.5, 6.0, 6.5, 7.0] })
        expect(result.phDrift?.trend).toBe('rising')
    })

    it('returns falling trend for descending pH', () => {
        const result = calculateEcTds({ ecMs: 1.5, phReadings: [7.0, 6.5, 6.0, 5.5] })
        expect(result.phDrift?.trend).toBe('falling')
    })

    it('rejects input with no EC or TDS value', () => {
        expect(() =>
            calculateEcTds({ phReadings: [6.5, 6.6] } as Parameters<typeof calculateEcTds>[0]),
        ).toThrow()
    })

    it('rejects EC above 10', () => {
        expect(() => calculateEcTds({ ecMs: 11 })).toThrow()
    })
})

// ---------------------------------------------------------------------------
// 4. Light Spectrum
// ---------------------------------------------------------------------------
describe('calculateLightSpectrum', () => {
    const base = {
        ppfd: 600,
        redPercent: 70,
        bluePercent: 20,
        hoursPerDay: 18,
        stage: 'veg' as const,
    }

    it('computes DLI correctly', () => {
        const result = calculateLightSpectrum(base)
        const expectedDli = (600 * 18 * 3600) / 1_000_000
        expect(result.dli).toBeCloseTo(expectedDli, 1)
    })

    it('photosynthetic efficiency is 0-100', () => {
        const result = calculateLightSpectrum(base)
        expect(result.photosyntheticEfficiency).toBeGreaterThanOrEqual(0)
        expect(result.photosyntheticEfficiency).toBeLessThanOrEqual(100)
    })

    it('provides terpene boost when blue >= 30%', () => {
        const result = calculateLightSpectrum({ ...base, bluePercent: 35 })
        expect(result.terpeneBoostPercent).toBeGreaterThan(0)
    })

    it('provides no terpene boost when blue < 30%', () => {
        const result = calculateLightSpectrum({ ...base, bluePercent: 20 })
        expect(result.terpeneBoostPercent).toBe(0)
    })

    it('returns recommended ratio label for stage', () => {
        const result = calculateLightSpectrum(base)
        expect(result.recommendedRatio).toBe('3:1 Red:Blue')
    })

    it('returns optimal when red:blue matches stage optimum', () => {
        // veg optimal is 3:1 red:blue -> red=75%, blue=25%
        // use high PPFD (2000) so saturation factor is sufficient: 2000/(2000+500) = 0.8 -> 80%
        const result = calculateLightSpectrum({
            ppfd: 2000,
            redPercent: 75,
            bluePercent: 25,
            hoursPerDay: 18,
            stage: 'veg',
        })
        expect(result.status).toBe('optimal')
    })

    it('rejects PPFD > 2500', () => {
        expect(() => calculateLightSpectrum({ ...base, ppfd: 3000 })).toThrow()
    })
})

// ---------------------------------------------------------------------------
// 5. Cannabinoid Ratio
// ---------------------------------------------------------------------------
describe('calculateCannabinoidRatio', () => {
    it('classifies THC-dominant correctly', () => {
        const result = calculateCannabinoidRatio({ thc: 25, cbd: 1, cbg: 1 })
        expect(result.profileType).toBe('thcDominant')
    })

    it('classifies CBD-dominant correctly', () => {
        const result = calculateCannabinoidRatio({ thc: 1, cbd: 20, cbg: 0.5 })
        expect(result.profileType).toBe('cbdDominant')
    })

    it('classifies balanced correctly', () => {
        const result = calculateCannabinoidRatio({ thc: 10, cbd: 10, cbg: 1 })
        expect(result.profileType).toBe('balanced')
    })

    it('classifies cbgForward when CBG dominates', () => {
        const result = calculateCannabinoidRatio({ thc: 5, cbd: 5, cbg: 15 })
        expect(result.profileType).toBe('cbgForward')
    })

    it('produces ratio label mentioning all three cannabinoids', () => {
        const result = calculateCannabinoidRatio({ thc: 20, cbd: 1, cbg: 0.5 })
        expect(result.ratioLabel).toContain('THC:CBD:CBG')
    })

    it('percentages sum to 100', () => {
        const result = calculateCannabinoidRatio({ thc: 20, cbd: 5, cbg: 1 })
        const sum = result.thcPct + result.cbdPct + result.cbgPct
        expect(sum).toBeCloseTo(100, 0)
    })

    it('harmony score is 0-100', () => {
        const result = calculateCannabinoidRatio({ thc: 10, cbd: 10, cbg: 2 })
        expect(result.harmonyScore).toBeGreaterThanOrEqual(0)
        expect(result.harmonyScore).toBeLessThanOrEqual(100)
    })

    it('peak harmony at balanced 1:1 THC:CBD', () => {
        const balanced = calculateCannabinoidRatio({ thc: 10, cbd: 10, cbg: 1 })
        const dominant = calculateCannabinoidRatio({ thc: 25, cbd: 1, cbg: 1 })
        expect(balanced.harmonyScore).toBeGreaterThan(dominant.harmonyScore)
    })

    it('rejects THC > 40', () => {
        expect(() => calculateCannabinoidRatio({ thc: 45, cbd: 1, cbg: 0.5 })).toThrow()
    })

    it('rejects CBG > 20', () => {
        expect(() => calculateCannabinoidRatio({ thc: 10, cbd: 5, cbg: 25 })).toThrow()
    })
})

// ---------------------------------------------------------------------------
// Schema re-export smoke tests
// ---------------------------------------------------------------------------
describe('exported Zod schemas', () => {
    it('TerpeneEntourageInputSchema parses valid data', () => {
        expect(() =>
            TerpeneEntourageInputSchema.parse({
                terpenes: [{ name: 'Myrcene', percentage: 50 }],
                thc: 20,
                cbd: 2,
                cbg: 0.5,
            }),
        ).not.toThrow()
    })

    it('TranspirationInputSchema parses valid data', () => {
        expect(() =>
            TranspirationInputSchema.parse({ vpd: 1.2, gsmmol: 250, lai: 3, hoursPerDay: 18 }),
        ).not.toThrow()
    })

    it('EcTdsInputSchema parses valid EC data', () => {
        expect(() => EcTdsInputSchema.parse({ ecMs: 1.8 })).not.toThrow()
    })

    it('LightSpectrumInputSchema parses valid data', () => {
        expect(() =>
            LightSpectrumInputSchema.parse({
                ppfd: 800,
                redPercent: 70,
                bluePercent: 25,
                hoursPerDay: 18,
                stage: 'flower',
            }),
        ).not.toThrow()
    })

    it('CannabinoidRatioInputSchema parses valid data', () => {
        expect(() => CannabinoidRatioInputSchema.parse({ thc: 18, cbd: 4, cbg: 2 })).not.toThrow()
    })
})

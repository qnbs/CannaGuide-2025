// ---------------------------------------------------------------------------
// knowledgeCalculatorService.ts -- Knowledge Hub calculator formulas
//
// Pure functions with Zod input validation.
// Covers: Terpene Entourage, Transpiration Rate, EC/TDS Converter,
//         Light Spectrum, Cannabinoid Ratio.
//
// All formulas are unit-tested in knowledgeCalculatorService.test.ts.
// ---------------------------------------------------------------------------

import { z } from 'zod'

// ---------------------------------------------------------------------------
// 1. Terpene Entourage Calculator
// ---------------------------------------------------------------------------

const KNOWN_TERPENE_SYNERGIES: Record<string, { high: number; medium: number }> = {
    Myrcene: { high: 1, medium: 1 },
    Limonene: { high: 1, medium: 1 },
    Caryophyllene: { high: 1, medium: 1 },
    Linalool: { high: 2, medium: 0 },
    Pinene: { high: 0, medium: 2 },
    Terpinolene: { high: 0, medium: 1 },
    Humulene: { high: 0, medium: 2 },
    Ocimene: { high: 0, medium: 0 },
    Bisabolol: { high: 0, medium: 1 },
    Nerolidol: { high: 0, medium: 1 },
    Valencene: { high: 0, medium: 0 },
    Geraniol: { high: 0, medium: 1 },
}

const TERPENE_NAMES = [
    'Myrcene',
    'Limonene',
    'Caryophyllene',
    'Linalool',
    'Pinene',
    'Terpinolene',
    'Humulene',
    'Ocimene',
    'Bisabolol',
    'Nerolidol',
    'Valencene',
    'Geraniol',
] as const

export type KnownTerpeneName = (typeof TERPENE_NAMES)[number]

export const TerpeneEntourageInputSchema = z.object({
    terpenes: z
        .array(
            z.object({
                name: z.string().min(1).max(40),
                percentage: z.number().min(0).max(100),
            }),
        )
        .min(1)
        .max(12),
    thc: z.number().min(0).max(40),
    cbd: z.number().min(0).max(40),
    cbg: z.number().min(0).max(20),
})

export type TerpeneEntourageInput = z.infer<typeof TerpeneEntourageInputSchema>

export interface TerpeneSynergyPair {
    a: string
    b: string
    strength: 'low' | 'medium' | 'high'
}

export interface TerpeneEntourageResult {
    entourageScore: number
    dominantTerpene: string
    synergyPairs: TerpeneSynergyPair[]
    profileType: 'relaxing' | 'energizing' | 'balanced' | 'medicinal'
    diversityIndex: number
}

/** Shannon diversity index for a percentage-based terpene profile (0-len). */
function shannonDiversity(terpenes: Array<{ percentage: number }>): number {
    const total = terpenes.reduce((s, t) => s + t.percentage, 0)
    if (total === 0) return 0
    const h = terpenes.reduce((acc, t) => {
        const p = t.percentage / total
        return p > 0 ? acc - p * Math.log(p) : acc
    }, 0)
    return Math.round(h * 100) / 100
}

/** Compute per-terpene entourage score (0-10). */
function terpeneEntourageScore(name: string): number {
    const synergy = KNOWN_TERPENE_SYNERGIES[name]
    const inDb = name in KNOWN_TERPENE_SYNERGIES ? 2 : 0
    const highSynergies = synergy?.high ?? 0
    const medSynergies = synergy?.medium ?? 0
    return Math.min(10, 3 + inDb + highSynergies * 1.5 + medSynergies * 0.75)
}

export function calculateTerpeneEntourage(input: TerpeneEntourageInput): TerpeneEntourageResult {
    const validated = TerpeneEntourageInputSchema.parse(input)
    const { terpenes, thc, cbd } = validated

    // Per-terpene scores
    const scored = terpenes.map((t) => ({ ...t, score: terpeneEntourageScore(t.name) }))

    // Average terpene contribution (up to 50 pts)
    const terpeneSum = scored.reduce((a, t) => a + t.score, 0)
    const terpenePts = Math.min(50, (terpeneSum / Math.max(1, scored.length)) * 7)

    // Cannabinoid balance bonus (up to 20 pts)
    const totalCbx = thc + cbd
    const ratio = totalCbx > 0 ? Math.min(thc, cbd) / Math.max(thc, cbd) : 0
    const cannabinoidPts = ratio * 20

    // Diversity bonus (up to 10 pts)
    const diversityPts = Math.min(10, terpenes.length * 1.8)

    const entourageScore = Math.round(terpenePts + cannabinoidPts + diversityPts)

    // Dominant terpene (highest percentage)
    const sorted = [...scored].sort((a, b) => b.percentage - a.percentage)
    const dominantTerpene = sorted[0]?.name ?? ''

    // Synergy pairs from known data
    const synergyPairs: TerpeneSynergyPair[] = []
    for (let i = 0; i < scored.length; i++) {
        for (let j = i + 1; j < scored.length; j++) {
            const a = scored[i]
            const b = scored[j]
            if (!a || !b) continue
            const aScore = a.score
            const bScore = b.score
            const combined = aScore + bScore
            if (combined >= 12) {
                synergyPairs.push({ a: a.name, b: b.name, strength: 'high' })
            } else if (combined >= 8) {
                synergyPairs.push({ a: a.name, b: b.name, strength: 'medium' })
            } else if (combined >= 5) {
                synergyPairs.push({ a: a.name, b: b.name, strength: 'low' })
            }
        }
    }

    // Profile type classification
    const relaxingTerpenes = new Set(['Myrcene', 'Linalool', 'Nerolidol', 'Bisabolol'])
    const energizingTerpenes = new Set(['Limonene', 'Pinene', 'Terpinolene', 'Ocimene'])
    const dominantIsRelaxing = relaxingTerpenes.has(dominantTerpene)
    const dominantIsEnergizing = energizingTerpenes.has(dominantTerpene)
    const cbdHeavy = cbd > thc
    const profileType: TerpeneEntourageResult['profileType'] = cbdHeavy
        ? 'medicinal'
        : dominantIsRelaxing
          ? 'relaxing'
          : dominantIsEnergizing
            ? 'energizing'
            : 'balanced'

    return {
        entourageScore: Math.min(100, entourageScore),
        dominantTerpene,
        synergyPairs: synergyPairs.slice(0, 10),
        profileType,
        diversityIndex: shannonDiversity(terpenes),
    }
}

// ---------------------------------------------------------------------------
// 2. Transpiration Rate Calculator
// ---------------------------------------------------------------------------

export const TranspirationInputSchema = z.object({
    /** VPD in kPa (0-5) */
    vpd: z.number().min(0).max(5),
    /** Stomatal conductance in mmol H2O m^-2 s^-1 (0-1000) */
    gsmmol: z.number().min(0).max(1000),
    /** Leaf Area Index (dimensionless, 0.1-10) */
    lai: z.number().min(0.1).max(10),
    /** Photoperiod in hours/day (1-24, defaults to 18) */
    hoursPerDay: z.number().min(1).max(24).default(18),
})

export type TranspirationInput = z.infer<typeof TranspirationInputSchema>

export interface TranspirationResult {
    /** Leaf-level transpiration (mmol H2O m^-2 s^-1) */
    leafRate: number
    /** Canopy-level transpiration (mmol H2O m^-2 s^-1) */
    canopyRate: number
    /** Daily water use per m2 canopy surface (mL/m2/day) */
    dailyWaterMlPerM2: number
    status: 'low' | 'optimal' | 'high'
}

/**
 * Leaf transpiration via simplified Penman-Monteith approximation:
 *   E_leaf = gs * VPD / P_atm
 * where P_atm ~ 101.3 kPa. Result in mmol/m2/s.
 */
export function calculateTranspiration(input: TranspirationInput): TranspirationResult {
    const validated = TranspirationInputSchema.parse(input)
    const { vpd, gsmmol, lai, hoursPerDay } = validated

    const leafRate = Math.round(((gsmmol * vpd) / 101.3) * 100) / 100
    const canopyRate = Math.round(leafRate * lai * 100) / 100

    // Convert: mmol/m2/s * 18.015 g/mol / 1000 mmol/mol * 3600 s/h * hoursPerDay h/day
    // = mL per m2 per day (water density ~1 g/mL)
    const dailyWaterMlPerM2 = Math.round((canopyRate * 18.015 * 3.6 * hoursPerDay) / 1000)

    const status: TranspirationResult['status'] =
        canopyRate < 1.0 ? 'low' : canopyRate > 6.0 ? 'high' : 'optimal'

    return { leafRate, canopyRate, dailyWaterMlPerM2, status }
}

// ---------------------------------------------------------------------------
// 3. EC / TDS Converter + pH Drift Predictor
// ---------------------------------------------------------------------------

export const EcTdsInputSchema = z
    .object({
        /** EC in mS/cm (provide ecMs OR one of the tds values) */
        ecMs: z.number().min(0).max(10).optional(),
        /** TDS using 500 scale (ppm) */
        tds500: z.number().min(0).max(5000).optional(),
        /** TDS using 640 scale (ppm) */
        tds640: z.number().min(0).max(5000).optional(),
        /** TDS using 700 scale (ppm) */
        tds700: z.number().min(0).max(5000).optional(),
        /** Optional pH time-series for drift predictor (max 7 readings) */
        phReadings: z.array(z.number().min(0).max(14)).max(7).optional(),
    })
    .refine(
        (d) =>
            d.ecMs !== undefined ||
            d.tds500 !== undefined ||
            d.tds640 !== undefined ||
            d.tds700 !== undefined,
        { message: 'Provide at least one of ecMs, tds500, tds640, or tds700.' },
    )

export type EcTdsInput = z.infer<typeof EcTdsInputSchema>

export interface PhDriftResult {
    /** Best-fit slope: pH change per day */
    slopePerDay: number
    /** Projected pH at day 7 if trend continues */
    projectedDay7: number
    trend: 'rising' | 'stable' | 'falling'
}

export interface EcTdsResult {
    ecMs: number
    tds500: number
    tds640: number
    tds700: number
    phDrift?: PhDriftResult
}

/** Simple ordinary least-squares slope for evenly spaced readings. */
function oLsSlope(readings: number[]): number {
    const n = readings.length
    if (n < 2) return 0
    const meanX = (n - 1) / 2
    const meanY = readings.reduce((a, b) => a + b, 0) / n
    const num = readings.reduce((acc, y, x) => acc + (x - meanX) * (y - meanY), 0)
    const den = readings.reduce((acc, _y, x) => acc + (x - meanX) ** 2, 0)
    return den === 0 ? 0 : num / den
}

export function calculateEcTds(input: EcTdsInput): EcTdsResult {
    const validated = EcTdsInputSchema.parse(input)

    // Derive EC from whichever input was provided
    let ecMs: number
    if (validated.ecMs !== undefined) {
        ecMs = validated.ecMs
    } else if (validated.tds500 !== undefined) {
        ecMs = validated.tds500 / 500
    } else if (validated.tds640 !== undefined) {
        ecMs = validated.tds640 / 640
    } else {
        ecMs = (validated.tds700 as number) / 700
    }

    const tds500 = Math.round(ecMs * 500)
    const tds640 = Math.round(ecMs * 640)
    const tds700 = Math.round(ecMs * 700)

    let phDrift: PhDriftResult | undefined
    const phReadings = validated.phReadings
    if (phReadings && phReadings.length >= 2) {
        const slope = Math.round(oLsSlope(phReadings) * 1000) / 1000
        const lastPh = phReadings[phReadings.length - 1] ?? 7
        const daysLeft = 7 - (phReadings.length - 1)
        const projected = Math.round((lastPh + slope * daysLeft) * 100) / 100
        const trend: PhDriftResult['trend'] =
            slope > 0.05 ? 'rising' : slope < -0.05 ? 'falling' : 'stable'
        phDrift = { slopePerDay: slope, projectedDay7: projected, trend }
    }

    const base = { ecMs: Math.round(ecMs * 1000) / 1000, tds500, tds640, tds700 }
    return phDrift !== undefined ? { ...base, phDrift } : base
}

// ---------------------------------------------------------------------------
// 4. Light Spectrum Calculator
// ---------------------------------------------------------------------------

export const LightSpectrumInputSchema = z.object({
    /** Photosynthetic Photon Flux Density (umol/m2/s) */
    ppfd: z.number().min(0).max(2500),
    /** Percentage of red band (600-700 nm) in spectrum */
    redPercent: z.number().min(0).max(100),
    /** Percentage of blue band (400-500 nm) in spectrum */
    bluePercent: z.number().min(0).max(100),
    /** Photoperiod (hours/day) */
    hoursPerDay: z.number().min(1).max(24),
    /** Growth stage for optimal ratio comparison */
    stage: z.enum(['seedling', 'veg', 'flower', 'lateFlower']).default('veg'),
})

export type LightSpectrumInput = z.infer<typeof LightSpectrumInputSchema>

export interface LightSpectrumResult {
    /** Daily Light Integral (mol/m2/day) */
    dli: number
    /** Photosynthetic efficiency 0-100% */
    photosyntheticEfficiency: number
    /** Estimated terpene production boost % versus white-only reference */
    terpeneBoostPercent: number
    /** Recommended red:blue ratio for the given stage */
    recommendedRatio: string
    /** Gap between current and optimal (positive = more red needed, negative = more blue) */
    ratioGap: number
    status: 'suboptimal' | 'good' | 'optimal'
}

const OPTIMAL_RATIOS: Record<LightSpectrumInput['stage'], number> = {
    seedling: 2,
    veg: 3,
    flower: 6,
    lateFlower: 8,
}

const RECOMMENDED_RATIO_LABELS: Record<LightSpectrumInput['stage'], string> = {
    seedling: '2:1 Red:Blue',
    veg: '3:1 Red:Blue',
    flower: '6:1 Red:Blue',
    lateFlower: '8:1 Red:Blue',
}

export function calculateLightSpectrum(input: LightSpectrumInput): LightSpectrumResult {
    const validated = LightSpectrumInputSchema.parse(input)
    const { ppfd, redPercent, bluePercent, hoursPerDay, stage } = validated

    // DLI = ppfd * hoursPerDay * 3600 / 1_000_000 (mol/m2/day)
    const dli = Math.round(((ppfd * hoursPerDay * 3600) / 1_000_000) * 100) / 100

    // Current red:blue ratio
    const currentRatio = bluePercent > 0 ? redPercent / bluePercent : redPercent > 0 ? 99 : 1
    const optimalRatio = OPTIMAL_RATIOS[stage]

    // Photosynthetic efficiency: peaks at optimal ratio, falls off logarithmically
    const ratioFit = Math.max(0, 1 - Math.abs(Math.log(currentRatio / optimalRatio)) / 3)
    // Additional factor: PPFD saturation curve (approx. Michaelis-Menten, Km ~500)
    const ppfdFactor = ppfd / (ppfd + 500)
    const photosyntheticEfficiency = Math.round(ratioFit * ppfdFactor * 100)

    // Terpene boost: blue > 30% of spectrum stimulates terpene synthase expression ~15-25%
    const terpeneBoostPercent = bluePercent >= 30 ? Math.round(15 + (bluePercent - 30) * 0.4) : 0

    const ratioGap = Math.round((optimalRatio - currentRatio) * 10) / 10

    const status: LightSpectrumResult['status'] =
        photosyntheticEfficiency >= 75
            ? 'optimal'
            : photosyntheticEfficiency >= 50
              ? 'good'
              : 'suboptimal'

    return {
        dli,
        photosyntheticEfficiency,
        terpeneBoostPercent,
        recommendedRatio: RECOMMENDED_RATIO_LABELS[stage],
        ratioGap,
        status,
    }
}

// ---------------------------------------------------------------------------
// 5. Cannabinoid Ratio Calculator
// ---------------------------------------------------------------------------

export const CannabinoidRatioInputSchema = z.object({
    thc: z.number().min(0).max(40),
    cbd: z.number().min(0).max(40),
    cbg: z.number().min(0).max(20),
})

export type CannabinoidRatioInput = z.infer<typeof CannabinoidRatioInputSchema>

export interface CannabinoidRatioResult {
    /** Normalized ratio string, e.g. "20:1:0.5 (THC:CBD:CBG)" */
    ratioLabel: string
    profileType: 'thcDominant' | 'cbdDominant' | 'balanced' | 'cbgForward'
    entourageNote: string
    /** THC percentage in the cannabinoid total */
    thcPct: number
    /** CBD percentage in the cannabinoid total */
    cbdPct: number
    /** CBG percentage in the cannabinoid total */
    cbgPct: number
    /** Harmony score 0-100 (peaks at ~1:1:0.1 balanced) */
    harmonyScore: number
}

export function calculateCannabinoidRatio(input: CannabinoidRatioInput): CannabinoidRatioResult {
    const validated = CannabinoidRatioInputSchema.parse(input)
    const { thc, cbd, cbg } = validated

    const total = thc + cbd + cbg
    const thcPct = total > 0 ? Math.round((thc / total) * 1000) / 10 : 0
    const cbdPct = total > 0 ? Math.round((cbd / total) * 1000) / 10 : 0
    const cbgPct = total > 0 ? Math.round((cbg / total) * 1000) / 10 : 0

    // Normalize to lowest non-zero
    const base = Math.min(...[thc, cbd, cbg].filter((v) => v > 0))
    const normalize = (v: number): string =>
        base > 0 ? String(Math.round((v / base) * 10) / 10) : '0'
    const ratioLabel = `${normalize(thc)}:${normalize(cbd)}:${normalize(cbg)} (THC:CBD:CBG)`

    // Profile type
    let profileType: CannabinoidRatioResult['profileType']
    if (cbg > thc && cbg > cbd) {
        profileType = 'cbgForward'
    } else if (cbd > thc * 2) {
        profileType = 'cbdDominant'
    } else if (thc > cbd * 2) {
        profileType = 'thcDominant'
    } else {
        profileType = 'balanced'
    }

    // Entourage note
    const entourageNotes: Record<CannabinoidRatioResult['profileType'], string> = {
        thcDominant:
            'High THC drives euphoric effects. Low CBD reduces modulation. Suitable for experienced users.',
        cbdDominant:
            'CBD dominance provides anti-inflammatory and anxiolytic properties with minimal psychoactivity.',
        balanced:
            'Balanced THC:CBD ratio produces a moderated high with enhanced therapeutic potential (entourage effect).',
        cbgForward:
            'CBG-forward profile supports focus, anti-inflammatory activity, and potential neuroprotection.',
    }
    const entourageNote = entourageNotes[profileType]

    // Harmony score: peaks at balanced 1:1 THC:CBD with moderate CBG
    const balancePts = total > 0 ? Math.min(thc, cbd) / Math.max(1, Math.max(thc, cbd)) : 0
    const cbgBonus = Math.min(10, cbg * 1.5)
    const harmonyScore = Math.round(balancePts * 80 + cbgBonus + (total > 0 ? 10 : 0))

    return { ratioLabel, profileType, entourageNote, thcPct, cbdPct, cbgPct, harmonyScore }
}

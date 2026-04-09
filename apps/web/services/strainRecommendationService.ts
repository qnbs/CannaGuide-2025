/**
 * Strain Recommendation Service
 *
 * Computes a 0-100 personalised match score for a strain given an optional
 * grow context. Each sub-score is weighted and combined into a single overall
 * score that can be displayed as a badge in the strain library UI.
 *
 * Score breakdown (weights):
 *  - Cannabinoid profile match  : 35 %
 *  - Grow difficulty match      : 25 %
 *  - Flowering type match       : 15 %
 *  - Desired effect match       : 15 %
 *  - Data quality bonus         :  5 %
 *  - Low-effort bonus           :  5 % (easy + autoflower)
 */

import type { Strain, DifficultyLevel, FloweringType, EffectTag, TerpeneName } from '@/types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** User context used to personalise strain recommendations */
export interface RecommendationContext {
    /**
     * Preferred grow difficulty level. If omitted, the scoring becomes
     * difficulty-neutral (all levels score equally).
     */
    preferredDifficulty?: DifficultyLevel | undefined
    /** Preferred flowering type. If omitted, both types score equally. */
    preferredFloweringType?: FloweringType | undefined
    /**
     * Target THC range. Strains whose THC % falls inside the range receive a
     * full cannabinoid score; partial scores are given for near-matches.
     */
    targetThcRange?: { min: number; max: number } | undefined
    /** Minimum CBD target (%). Strains at or above receive full CBD sub-score. */
    targetCbdMin?: number | undefined
    /** Desired consumer/therapeutic effects used to match via terpene affinity. */
    desiredEffects?: EffectTag[] | undefined
}

/** Complete recommendation result for a single strain */
export interface StrainRecommendationResult {
    /** Strain identifier */
    strainId: string
    /** Strain display name */
    strainName: string
    /** Overall match score 0-100 */
    score: number
    /** Per-dimension breakdown */
    breakdown: {
        cannabinoid: number
        difficulty: number
        floweringType: number
        effects: number
        dataQuality: number
        bonus: number
    }
    /** Human-readable label derived from score */
    label: 'Excellent' | 'Good' | 'Fair' | 'Low'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIFFICULTY_SCORES: Record<DifficultyLevel, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
}

/**
 * Terpene-to-effect affinity map.
 * Maps each relevant EffectTag to the terpenes most associated with it.
 */
const EFFECT_TERPENE_AFFINITY: Partial<Record<EffectTag, TerpeneName[]>> = {
    Relaxing: ['Myrcene', 'Linalool', 'Humulene'],
    Sedating: ['Myrcene', 'Linalool', 'Nerolidol'],
    Uplifting: ['Limonene', 'Terpinolene', 'Ocimene'],
    Energizing: ['Limonene', 'Terpinolene', 'Pinene'],
    Focusing: ['Pinene', 'Terpinolene', 'Limonene'],
    Creative: ['Limonene', 'Terpinolene', 'Ocimene'],
    Euphoric: ['Limonene', 'Myrcene', 'Caryophyllene'],
    'Pain Relief': ['Myrcene', 'Caryophyllene', 'Humulene', 'Linalool'],
    'Anti-Anxiety': ['Linalool', 'Caryophyllene', 'Limonene'],
    'Anti-Inflammatory': ['Caryophyllene', 'Humulene', 'Myrcene', 'Bisabolol'],
    'Appetite Stimulating': ['Myrcene', 'Caryophyllene'],
    'Appetite Suppressing': ['Humulene', 'Terpinolene'],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clamp a number to [0, 1] */
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

/** Weighted sum helper -- reduces an array of [value, weight] pairs to 0-100 */
const weightedScore = (parts: Array<[number, number]>): number => {
    const totalWeight = parts.reduce((acc, [, w]) => acc + w, 0)
    if (totalWeight === 0) return 0
    const sum = parts.reduce((acc, [v, w]) => acc + v * w, 0)
    return Math.round(clamp01(sum / totalWeight) * 100)
}

// ---------------------------------------------------------------------------
// Sub-scorers
// ---------------------------------------------------------------------------

const scoreCannabinoid = (strain: Strain, ctx: RecommendationContext): number => {
    let thcScore = 0.8 // neutral if no preference
    let cbdScore = 0.8

    if (ctx.targetThcRange !== undefined) {
        const { min, max } = ctx.targetThcRange
        const thc = strain.thc
        if (thc >= min && thc <= max) {
            thcScore = 1.0
        } else {
            const dist = thc < min ? min - thc : thc - max
            // 5 % tolerance window before score drops to 0
            thcScore = clamp01(1 - dist / 5)
        }
    }

    if (ctx.targetCbdMin !== undefined) {
        const cbd = strain.cbd
        if (cbd >= ctx.targetCbdMin) {
            cbdScore = 1.0
        } else {
            cbdScore = clamp01(cbd / Math.max(ctx.targetCbdMin, 0.1))
        }
    }

    return thcScore * 0.7 + cbdScore * 0.3
}

const scoreDifficulty = (strain: Strain, ctx: RecommendationContext): number => {
    if (ctx.preferredDifficulty === undefined) return 0.8
    const preferred = DIFFICULTY_SCORES[ctx.preferredDifficulty] ?? 2
    const actual = DIFFICULTY_SCORES[strain.agronomic.difficulty] ?? 2
    const diff = Math.abs(preferred - actual)
    // 0 diff = 1.0, 1 diff = 0.6, 2 diff = 0.2
    return clamp01(1 - diff * 0.4)
}

const scoreFloweringType = (strain: Strain, ctx: RecommendationContext): number => {
    if (ctx.preferredFloweringType === undefined) return 0.8
    return strain.floweringType === ctx.preferredFloweringType ? 1.0 : 0.3
}

const scoreEffects = (strain: Strain, ctx: RecommendationContext): number => {
    const desired = ctx.desiredEffects
    if (!desired || desired.length === 0) return 0.8

    const strainTerpenes: Set<TerpeneName> = new Set(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        (strain.dominantTerpenes ?? []) as TerpeneName[],
    )

    // Bonus from quantitative terpeneProfile if available
    if (strain.terpeneProfile !== undefined) {
        const profile = strain.terpeneProfile
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        for (const key of Object.keys(profile) as TerpeneName[]) {
            const pct = profile[key]
            if (pct !== undefined && pct > 0.05) {
                strainTerpenes.add(key)
            }
        }
    }

    let hits = 0
    for (const effect of desired) {
        const affinity = EFFECT_TERPENE_AFFINITY[effect]
        if (!affinity) continue
        if (affinity.some((t) => strainTerpenes.has(t))) {
            hits++
        }
    }

    return clamp01(hits / desired.length)
}

const scoreDataQuality = (strain: Strain): number => {
    let score = 0.3 // base
    if (strain.description) score += 0.1
    if (strain.terpeneProfile !== undefined) score += 0.2
    if (strain.labResults && strain.labResults.length > 0) score += 0.2
    if (strain.dataProvenance && strain.dataProvenance.length > 0) {
        const labVerified = strain.dataProvenance.some((p) => p.labVerified)
        score += labVerified ? 0.2 : 0.1
    }
    if (strain.lineage) score += 0.1
    return clamp01(score)
}

const scoreBonus = (strain: Strain): number => {
    // Low-effort bonus: Easy + Autoflower is beginner-friendly
    if (strain.agronomic.difficulty === 'Easy' && strain.floweringType === 'Autoflower') {
        return 0.9
    }
    // Moderate bonus for easy strains
    if (strain.agronomic.difficulty === 'Easy') return 0.7
    return 0.5
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score a single strain against an optional grow context.
 *
 * Returns a StrainRecommendationResult with overall score (0-100) and a
 * per-dimension breakdown.
 */
export const scoreStrain = (
    strain: Strain,
    ctx: RecommendationContext = {},
): StrainRecommendationResult => {
    const cannabinoid = scoreCannabinoid(strain, ctx)
    const difficulty = scoreDifficulty(strain, ctx)
    const floweringType = scoreFloweringType(strain, ctx)
    const effects = scoreEffects(strain, ctx)
    const dataQuality = scoreDataQuality(strain)
    const bonus = scoreBonus(strain)

    const score = weightedScore([
        [cannabinoid, 35],
        [difficulty, 25],
        [floweringType, 15],
        [effects, 15],
        [dataQuality, 5],
        [bonus, 5],
    ])

    const label: StrainRecommendationResult['label'] =
        score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 45 ? 'Fair' : 'Low'

    return {
        strainId: strain.id,
        strainName: strain.name,
        score,
        breakdown: {
            cannabinoid: Math.round(cannabinoid * 100),
            difficulty: Math.round(difficulty * 100),
            floweringType: Math.round(floweringType * 100),
            effects: Math.round(effects * 100),
            dataQuality: Math.round(dataQuality * 100),
            bonus: Math.round(bonus * 100),
        },
        label,
    }
}

/**
 * Rank a list of strains by recommendation score (highest first).
 * Returns the top N results (default: all ranked).
 */
export const rankStrains = (
    strains: Strain[],
    ctx: RecommendationContext = {},
    topN?: number,
): StrainRecommendationResult[] => {
    const results = strains.map((s) => scoreStrain(s, ctx))
    results.sort((a, b) => b.score - a.score)
    return topN !== undefined ? results.slice(0, topN) : results
}

/**
 * Get the match score label colour class (Tailwind).
 * Useful for consistent badge rendering in the UI.
 */
export const getScoreBadgeClass = (score: number): string => {
    if (score >= 80) return 'bg-green-600/20 text-green-400 border border-green-700/40'
    if (score >= 65) return 'bg-primary-600/20 text-primary-300 border border-primary-700/40'
    if (score >= 45) return 'bg-yellow-600/20 text-yellow-400 border border-yellow-700/40'
    return 'bg-surface-600/20 text-text-muted border border-surface-700/40'
}

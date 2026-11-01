/** Terpene and chemovar analysis. Batch similarity search goes through the terpene worker. */

import type {
    TerpeneName,
    TerpeneProfile,
    DetailedTerpeneProfile,
    TerpeneProfileEntry,
    CannabinoidName,
    CannabinoidProfile,
    DetailedCannabinoidProfile,
    CannabinoidProfileEntry,
    ChemovarType,
    ChemovarProfile,
    EffectTag,
    TerpeneSimilarityResult,
    Strain,
} from '@/types'
import { ALL_TERPENE_NAMES, TERPENE_EFFECTS, CANNABINOID_DATABASE } from '@/data/terpeneDatabase'
import {
    PRESENCE_THRESHOLD,
    generateCannabinoidProfile,
    generateTerpeneProfile,
    resolveTerpeneName,
} from '@/services/terpeneGeneration'

export { generateCannabinoidProfile, generateTerpeneProfile, resolveTerpeneName }

// Allowlists for safe dynamic property access (prevents prototype pollution -- CodeQL js/remote-property-injection)
const VALID_TERPENE_NAMES: ReadonlySet<string> = new Set(ALL_TERPENE_NAMES)
const VALID_CANNABINOID_NAMES: ReadonlySet<string> = new Set(Object.keys(CANNABINOID_DATABASE))

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Variance thresholds for stability rating */
const VARIANCE_HIGH_THRESHOLD = 0.15
const VARIANCE_MEDIUM_THRESHOLD = 0.4

// ---------------------------------------------------------------------------
// Chemovar classification
// ---------------------------------------------------------------------------

/**
 * Classify a strain's chemovar type based on THC:CBD ratio.
 * Follows Hazekamp & Fischedick (2012) taxonomy.
 */
export const classifyChemovar = (thc: number, cbd: number, cbg?: number): ChemovarType => {
    // Type IV: CBG-dominant (CBG > 2% and > THC and > CBD)
    if (cbg !== undefined && cbg > 2 && cbg > thc && cbg > cbd) {
        return 'Type IV'
    }
    // Type V: Low cannabinoid (both THC and CBD < 1%)
    if (thc < 1 && cbd < 1) {
        return 'Type V'
    }
    // Avoid division by zero
    if (cbd <= 0) {
        return thc > 0 ? 'Type I' : 'Type V'
    }
    const ratio = thc / cbd
    if (ratio > 5) return 'Type I'
    if (ratio >= 1) return 'Type II'
    return 'Type III'
}

// ---------------------------------------------------------------------------
// Detailed profile builders (with variance / stability)
// ---------------------------------------------------------------------------

const stabilityFromVariance = (variance: number): 'high' | 'medium' | 'low' => {
    if (variance <= VARIANCE_HIGH_THRESHOLD) return 'high'
    if (variance <= VARIANCE_MEDIUM_THRESHOLD) return 'medium'
    return 'low'
}

/**
 * Convert a simple TerpeneProfile to a DetailedTerpeneProfile with estimated stats.
 * sampleCount = 0 indicates the values are estimated, not from real lab data.
 */
export const toDetailedTerpeneProfile = (
    profile: TerpeneProfile,
    sampleCount: number = 0,
): DetailedTerpeneProfile => {
    const detailed: DetailedTerpeneProfile = {}
    for (const [name, percent] of Object.entries(profile)) {
        if (percent === undefined) continue
        if (!VALID_TERPENE_NAMES.has(name)) continue
        const variance =
            sampleCount > 1
                ? percent * 0.15 // Estimated 15% CV from population data
                : percent * 0.25 // Higher uncertainty for estimated data
        const entry: TerpeneProfileEntry = {
            percent,
            variance: Math.round(variance * 1000) / 1000,
            stability: stabilityFromVariance(variance / Math.max(percent, 0.01)),
            sampleCount,
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        detailed[name as TerpeneName] = entry
    }
    return detailed
}

/**
 * Convert a CannabinoidProfile to DetailedCannabinoidProfile with estimated stats.
 */
export const toDetailedCannabinoidProfile = (
    profile: CannabinoidProfile,
    sampleCount: number = 0,
): DetailedCannabinoidProfile => {
    const detailed: DetailedCannabinoidProfile = {}
    for (const [name, percent] of Object.entries(profile)) {
        if (percent === undefined) continue
        if (!VALID_CANNABINOID_NAMES.has(name)) continue
        const variance = sampleCount > 1 ? percent * 0.1 : percent * 0.2
        const entry: CannabinoidProfileEntry = {
            percent,
            variance: Math.round(variance * 1000) / 1000,
            stability: stabilityFromVariance(variance / Math.max(percent, 0.01)),
            sampleCount,
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        detailed[name as CannabinoidName] = entry
    }
    return detailed
}

// ---------------------------------------------------------------------------
// Effect prediction (entourage effect analysis)
// ---------------------------------------------------------------------------

/** Score entourage effects from terpene and cannabinoid weights, highest confidence first. */
export const predictEffects = (
    terpeneProfile: TerpeneProfile,
    cannabinoidProfile?: CannabinoidProfile,
    maxEffects: number = 8,
): EffectTag[] => {
    const scores: Partial<Record<EffectTag, number>> = {}

    // Terpene contributions
    for (const [name, percent] of Object.entries(terpeneProfile)) {
        if (percent === undefined || percent < PRESENCE_THRESHOLD) continue
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const effects = TERPENE_EFFECTS[name as TerpeneName]
        if (!effects) continue
        for (const effect of effects) {
            scores[effect] = (scores[effect] ?? 0) + percent
        }
    }

    // Cannabinoid contributions
    if (cannabinoidProfile) {
        for (const [name, percent] of Object.entries(cannabinoidProfile)) {
            if (percent === undefined || percent <= 0) continue
            const ref = CANNABINOID_DATABASE[name]
            if (!ref) continue
            // Weight cannabinoids more heavily (they're in higher concentrations)
            for (const effect of ref.effects) {
                scores[effect] = (scores[effect] ?? 0) + percent * 0.5
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return (Object.entries(scores) as [EffectTag, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxEffects)
        .map(([effect]) => effect)
}

// ---------------------------------------------------------------------------
// Full chemovar profile builder
// ---------------------------------------------------------------------------

const finiteCannabinoid = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined

const cannabinoidRatio = (thc: number | undefined, cbd: number | undefined): number => {
    if (thc === undefined || cbd === undefined) return Number.NaN
    if (cbd > 0) return Math.round((thc / cbd) * 100) / 100
    return thc > 0 ? Number.POSITIVE_INFINITY : 0
}

const majorBelowCbg = (cbg: number, major: number | undefined): boolean =>
    major === undefined || cbg > major

export const isTypeIv = (
    thc: number | undefined,
    cbd: number | undefined,
    cbg: number | undefined,
): boolean => cbg !== undefined && cbg > 2 && majorBelowCbg(cbg, thc) && majorBelowCbg(cbg, cbd)

const classifiedType = (
    thc: number | undefined,
    cbd: number | undefined,
    profileCbg: number | undefined,
    topLevelCbg: unknown,
): ChemovarType | undefined => {
    const cbg = finiteCannabinoid(topLevelCbg) ?? profileCbg
    if (isTypeIv(thc, cbd, cbg)) return 'Type IV'
    if (thc === undefined || cbd === undefined) return undefined
    return classifyChemovar(thc, cbd, cbg)
}

const copyCannabinoids = (
    strain: Strain,
    thc: number | undefined,
    cbd: number | undefined,
): CannabinoidProfile => {
    const profile: CannabinoidProfile = { ...(strain.cannabinoidProfile ?? {}) }
    const reported = {
        THC: thc,
        CBD: cbd,
        CBG: finiteCannabinoid(strain.cbg),
        THCV: finiteCannabinoid(strain.thcv),
    }
    for (const key of ['THC', 'CBD', 'CBG', 'THCV'] as const) {
        const value = reported[key]
        if (profile[key] === undefined && value !== undefined) profile[key] = value
    }
    return profile
}
const measuredMajor = (direct: unknown, fromProfile: number | undefined): number | undefined =>
    finiteCannabinoid(direct) ?? fromProfile

const strainTypeText = (type: unknown): string => (typeof type === 'string' ? type : '')

const listedTerpenes = (names: string[] | undefined): string[] => names ?? []

const chemovarTerpenes = (strain: Strain, nameHash: number): TerpeneProfile => {
    if (strain.terpeneProfile) return strain.terpeneProfile
    return generateTerpeneProfile(
        listedTerpenes(strain.dominantTerpenes),
        nameHash,
        strainTypeText(strain.type),
    )
}

const roundedTotal = (values: Array<number | undefined>): number => {
    let total = 0
    for (const value of values) total += value ?? 0
    return Math.round(total * 1000) / 1000
}

const bothReported = (strain: Strain): boolean =>
    strain.terpeneProfile !== undefined && strain.cannabinoidProfile !== undefined

const eitherReported = (strain: Strain): boolean =>
    strain.terpeneProfile !== undefined || strain.cannabinoidProfile !== undefined

const hasDominantNames = (strain: Strain): boolean => (strain.dominantTerpenes?.length ?? 0) > 0

const qualityScore = (strain: Strain): number => {
    if (bothReported(strain)) return 0.9
    if (eitherReported(strain)) return 0.6
    if (hasDominantNames(strain)) return 0.4
    return 0.2
}

/** Type IV when reported CBG beats the majors. A missing major is not treated as zero. */
export const buildChemovarProfile = (strain: Strain): ChemovarProfile | undefined => {
    const nameHash = strain.name
        .split('')
        .reduce((acc, character) => acc + character.charCodeAt(0), 0)
    const measuredThc = measuredMajor(strain.thc, finiteCannabinoid(strain.cannabinoidProfile?.THC))
    const measuredCbd = measuredMajor(strain.cbd, finiteCannabinoid(strain.cannabinoidProfile?.CBD))
    const terpeneProfile = chemovarTerpenes(strain, nameHash)
    const cannabinoidProfile = copyCannabinoids(strain, measuredThc, measuredCbd)
    const chemovarType = classifiedType(
        measuredThc,
        measuredCbd,
        cannabinoidProfile.CBG,
        strain.cbg,
    )
    if (chemovarType === undefined) return undefined
    return {
        chemovarType,
        totalTerpenePercent: roundedTotal(Object.values(terpeneProfile)),
        totalCannabinoidPercent: roundedTotal(Object.values(cannabinoidProfile)),
        thcCbdRatio: cannabinoidRatio(measuredThc, measuredCbd),
        detailedTerpeneProfile: toDetailedTerpeneProfile(terpeneProfile, 0),
        detailedCannabinoidProfile: toDetailedCannabinoidProfile(cannabinoidProfile, 0),
        predictedEffects: predictEffects(terpeneProfile, cannabinoidProfile),
        dataQuality: qualityScore(strain),
        lastUpdated: new Date().toISOString(),
    }
}

// ---------------------------------------------------------------------------
// Similarity computation
// ---------------------------------------------------------------------------

/**
 * Convert a TerpeneProfile to a fixed-length numeric vector using ALL_TERPENE_NAMES
 * as the axis order. Missing terpenes are 0.
 */
export const profileToVector = (profile: TerpeneProfile): number[] => {
    return ALL_TERPENE_NAMES.map((name) => profile[name] ?? 0)
}

/** Dot product of two equal-length vectors. */
const dot = (a: number[], b: number[]): number => {
    let sum = 0
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] ?? 0) * (b[i] ?? 0)
    }
    return sum
}

/** L2 norm (magnitude) of a vector. */
const magnitude = (v: number[]): number => Math.sqrt(dot(v, v))

/**
 * Cosine similarity between two terpene profiles (0--1).
 * Returns 0 if either profile is empty.
 */
export const cosineSimilarity = (a: TerpeneProfile, b: TerpeneProfile): number => {
    const va = profileToVector(a)
    const vb = profileToVector(b)
    const magA = magnitude(va)
    const magB = magnitude(vb)
    if (magA === 0 || magB === 0) return 0
    return dot(va, vb) / (magA * magB)
}

/**
 * Euclidean distance between two terpene profiles.
 */
export const euclideanDistance = (a: TerpeneProfile, b: TerpeneProfile): number => {
    const va = profileToVector(a)
    const vb = profileToVector(b)
    let sum = 0
    for (let i = 0; i < va.length; i++) {
        const diff = (va[i] ?? 0) - (vb[i] ?? 0)
        sum += diff * diff
    }
    return Math.sqrt(sum)
}

/**
 * Count shared terpenes (both present above threshold) between two profiles.
 */
export const sharedTerpeneCount = (a: TerpeneProfile, b: TerpeneProfile): number => {
    let count = 0
    for (const name of ALL_TERPENE_NAMES) {
        if ((a[name] ?? 0) >= PRESENCE_THRESHOLD && (b[name] ?? 0) >= PRESENCE_THRESHOLD) {
            count++
        }
    }
    return count
}

/**
 * Find the most similar strains to a reference terpene profile.
 * This is the main entry point for similarity search -- designed to run
 * in a worker for large strain sets.
 */
export const findSimilarStrains = (
    referenceProfile: TerpeneProfile,
    strains: Array<{ id: string; name: string; terpeneProfile: TerpeneProfile }>,
    limit: number = 10,
    minSimilarity: number = 0.1,
): TerpeneSimilarityResult[] => {
    const results: TerpeneSimilarityResult[] = []

    for (const strain of strains) {
        const cos = cosineSimilarity(referenceProfile, strain.terpeneProfile)
        if (cos < minSimilarity) continue

        results.push({
            strainId: strain.id,
            strainName: strain.name,
            cosineSimilarity: Math.round(cos * 10000) / 10000,
            euclideanDistance:
                Math.round(euclideanDistance(referenceProfile, strain.terpeneProfile) * 10000) /
                10000,
            sharedTerpeneCount: sharedTerpeneCount(referenceProfile, strain.terpeneProfile),
        })
    }

    return results.sort((a, b) => b.cosineSimilarity - a.cosineSimilarity).slice(0, limit)
}

// ---------------------------------------------------------------------------
// Breeding terpene prediction
// ---------------------------------------------------------------------------

/**
 * Predict offspring terpene profile from two parent profiles.
 * Uses simple midpoint + genetic variance model.
 */
export const predictBreedingProfile = (
    parentA: TerpeneProfile,
    parentB: TerpeneProfile,
    nameHash: number = 0,
): TerpeneProfile => {
    const result: TerpeneProfile = {}

    const allTerpenes = new Set<TerpeneName>()
    for (const t of ALL_TERPENE_NAMES) {
        if ((parentA[t] ?? 0) > 0 || (parentB[t] ?? 0) > 0) {
            allTerpenes.add(t)
        }
    }

    for (const terp of allTerpenes) {
        const a = parentA[terp] ?? 0
        const b = parentB[terp] ?? 0
        // Midpoint with small deterministic genetic variance
        const midpoint = (a + b) / 2
        const variance = (((nameHash * (terp.charCodeAt(0) + 7)) % 20) - 10) / 100
        const predicted = Math.max(0, midpoint * (1 + variance))
        if (predicted >= PRESENCE_THRESHOLD) {
            result[terp] = Math.round(predicted * 1000) / 1000
        }
    }

    return result
}

// ---------------------------------------------------------------------------
// Effect-based strain search
// ---------------------------------------------------------------------------

/**
 * Score a strain's terpene profile against desired effects.
 * Higher score = better match for the desired effect combination.
 */
export const scoreStrainForEffects = (
    profile: TerpeneProfile,
    desiredEffects: EffectTag[],
): number => {
    let score = 0
    for (const [name, percent] of Object.entries(profile)) {
        if (percent === undefined || percent < PRESENCE_THRESHOLD) continue
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const effects = TERPENE_EFFECTS[name as TerpeneName]
        if (!effects) continue
        for (const effect of effects) {
            if (desiredEffects.includes(effect)) {
                score += percent
            }
        }
    }
    return Math.round(score * 1000) / 1000
}

// ---------------------------------------------------------------------------
// Entourage analysis summary
// ---------------------------------------------------------------------------

export interface EntourageAnalysis {
    dominantTerpenes: Array<{ name: TerpeneName; percent: number }>
    dominantCannabinoids: Array<{ name: CannabinoidName; percent: number }>
    synergies: string[]
    chemovarType: ChemovarType
    overallProfile: 'sedating' | 'balanced' | 'energizing'
}

/**
 * Perform an entourage effect analysis combining terpene + cannabinoid data.
 */
export const analyzeEntourage = (
    terpeneProfile: TerpeneProfile,
    cannabinoidProfile: CannabinoidProfile,
): EntourageAnalysis => {
    // Sort terpenes by concentration
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const sortedTerpenes = (Object.entries(terpeneProfile) as [TerpeneName, number][])
        .filter(([, v]) => v >= PRESENCE_THRESHOLD)
        .sort((a, b) => b[1] - a[1])

    // Sort cannabinoids by concentration
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const sortedCannabinoids = (Object.entries(cannabinoidProfile) as [CannabinoidName, number][])
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])

    // Detect synergies
    const synergies: string[] = []
    const has = (name: string, minPercent: number = PRESENCE_THRESHOLD): boolean =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        (terpeneProfile[name as TerpeneName] ?? 0) >= minPercent

    if (has('Myrcene', 0.5) && (cannabinoidProfile.THC ?? 0) > 15) {
        synergies.push('Myrcene + THC: Enhanced sedation and pain relief (couch-lock)')
    }
    if (has('Limonene') && has('Linalool')) {
        synergies.push('Limonene + Linalool: Enhanced anxiolytic effect')
    }
    if (has('Caryophyllene') && (cannabinoidProfile.CBD ?? 0) > 2) {
        synergies.push('Caryophyllene + CBD: Synergistic anti-inflammatory via CB2 + GPR55')
    }
    if (has('Pinene') && (cannabinoidProfile.THC ?? 0) > 15) {
        synergies.push(
            'Pinene + THC: Memory retention counteracts THC-induced short-term memory loss',
        )
    }
    if (has('Linalool') && has('Caryophyllene')) {
        synergies.push('Linalool + Caryophyllene: Additive analgesic and sedative properties')
    }
    if (has('Terpinolene') && has('Pinene')) {
        synergies.push('Terpinolene + Pinene: Uplifting + alert cerebral effect')
    }
    if (has('Humulene') && has('Caryophyllene')) {
        synergies.push('Humulene + Caryophyllene: Combined anti-inflammatory cascade')
    }
    if ((cannabinoidProfile.THC ?? 0) > 0 && (cannabinoidProfile.CBD ?? 0) > 0) {
        const ratio = (cannabinoidProfile.THC ?? 0) / Math.max(cannabinoidProfile.CBD ?? 0, 0.01)
        if (ratio >= 1 && ratio <= 5) {
            synergies.push('Balanced THC:CBD ratio: Reduced anxiety, enhanced therapeutic window')
        }
    }

    // Overall profile classification
    const sedatingScore =
        (terpeneProfile.Myrcene ?? 0) +
        (terpeneProfile.Linalool ?? 0) +
        (terpeneProfile.Bisabolol ?? 0) +
        (terpeneProfile.Nerolidol ?? 0)
    const energizingScore =
        (terpeneProfile.Limonene ?? 0) +
        (terpeneProfile.Pinene ?? 0) +
        (terpeneProfile.Terpinolene ?? 0) +
        (terpeneProfile.Ocimene ?? 0)

    const overallProfile: EntourageAnalysis['overallProfile'] =
        sedatingScore > energizingScore * 1.5
            ? 'sedating'
            : energizingScore > sedatingScore * 1.5
              ? 'energizing'
              : 'balanced'

    const thc = cannabinoidProfile.THC ?? 0
    const cbd = cannabinoidProfile.CBD ?? 0

    return {
        dominantTerpenes: sortedTerpenes.slice(0, 5).map(([name, percent]) => ({ name, percent })),
        dominantCannabinoids: sortedCannabinoids
            .slice(0, 5)
            .map(([name, percent]) => ({ name, percent })),
        synergies,
        chemovarType: classifyChemovar(thc, cbd, cannabinoidProfile.CBG),
        overallProfile,
    }
}

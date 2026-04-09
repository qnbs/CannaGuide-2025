/**
 * Terpene & Chemovar Analysis Service
 *
 * Provides classification, similarity computation, effect prediction,
 * and profile enrichment for cannabis strains. All computations are
 * pure functions suitable for main-thread or worker-thread execution.
 *
 * Heavy batch operations (similarity search across 700+ strains) should
 * be dispatched to the terpene worker via WorkerBus.
 */

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
import {
    TERPENE_DATABASE,
    ALL_TERPENE_NAMES,
    TERPENE_EFFECTS,
    CANNABINOID_DATABASE,
} from '@/data/terpeneDatabase'

// Allowlists for safe dynamic property access (prevents prototype pollution -- CodeQL js/remote-property-injection)
const VALID_TERPENE_NAMES: ReadonlySet<string> = new Set(ALL_TERPENE_NAMES)
const VALID_CANNABINOID_NAMES: ReadonlySet<string> = new Set(Object.keys(CANNABINOID_DATABASE))

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum percent threshold to consider a terpene "present" */
const PRESENCE_THRESHOLD = 0.01

/** Variance thresholds for stability rating */
const VARIANCE_HIGH_THRESHOLD = 0.15
const VARIANCE_MEDIUM_THRESHOLD = 0.4

/** Dominant terpene strings to TerpeneName mapping for fuzzy resolution */
const TERPENE_ALIASES: Record<string, TerpeneName> = {
    'beta-caryophyllene': 'Caryophyllene',
    'b-caryophyllene': 'Caryophyllene',
    'beta-pinene': 'Pinene',
    'alpha-pinene': 'Pinene',
    'a-pinene': 'Pinene',
    'beta-myrcene': 'Myrcene',
    'b-myrcene': 'Myrcene',
    'd-limonene': 'Limonene',
    'alpha-bisabolol': 'Bisabolol',
    'a-bisabolol': 'Bisabolol',
    'alpha-humulene': 'Humulene',
    'a-humulene': 'Humulene',
    'trans-nerolidol': 'Nerolidol',
    'beta-ocimene': 'Ocimene',
    'alpha-terpineol': 'Terpineol',
    '1,8-cineole': 'Eucalyptol',
    cineole: 'Eucalyptol',
    'delta-3-carene': 'Carene',
    'alpha-phellandrene': 'Phellandrene',
    'trans-farnesene': 'Farnesene',
    'beta-farnesene': 'Farnesene',
}

// ---------------------------------------------------------------------------
// Terpene name resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a terpene string (possibly aliased) to a canonical TerpeneName.
 * Returns undefined if unrecognised.
 */
export const resolveTerpeneName = (raw: string): TerpeneName | undefined => {
    if (!raw) return undefined
    const lower = raw.trim().toLowerCase()
    // Direct match (case-insensitive)
    const direct = ALL_TERPENE_NAMES.find((n) => n.toLowerCase() === lower)
    if (direct) return direct
    // Alias match
    return TERPENE_ALIASES[lower]
}

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
// Terpene profile generation from dominantTerpenes + strain metadata
// ---------------------------------------------------------------------------

/**
 * Generate a realistic terpene profile from dominant terpene names + strain type.
 * Uses deterministic hashing so the same strain always gets the same profile.
 */
export const generateTerpeneProfile = (
    dominantTerpenes: string[],
    nameHash: number,
    strainType: string,
): TerpeneProfile => {
    const profile: TerpeneProfile = {}

    // Resolve dominant terpenes
    const resolved = dominantTerpenes
        .map(resolveTerpeneName)
        .filter((n): n is TerpeneName => n !== undefined)

    // Assign primary terpenes (higher concentrations)
    for (let i = 0; i < resolved.length; i++) {
        const terpene = resolved[i]
        if (!terpene) continue
        const ref = TERPENE_DATABASE[terpene]
        const range = ref.typicalRange.max - ref.typicalRange.min
        // Deterministic position within range, decreasing by dominance order
        const factor = Math.max(0.3, 1 - i * 0.2)
        const hashVariation = ((nameHash * (i + 7) * 31) % 100) / 100
        const percent = ref.typicalRange.min + range * factor * (0.5 + hashVariation * 0.5)
        profile[terpene] = Math.round(percent * 1000) / 1000
    }

    // Add trace terpenes based on strain type
    const isIndica = strainType.toLowerCase().includes('indica')
    const isSativa = strainType.toLowerCase().includes('sativa')

    // Add 2-4 secondary terpenes at trace levels
    const secondaryCount = 2 + (nameHash % 3)
    let added = 0
    for (const terp of ALL_TERPENE_NAMES) {
        if (added >= secondaryCount) break
        if (profile[terp] !== undefined) continue

        // Indica bias: more Myrcene, Linalool, Caryophyllene
        // Sativa bias: more Limonene, Pinene, Terpinolene
        const indicaBias = ['Myrcene', 'Linalool', 'Caryophyllene', 'Humulene', 'Bisabolol']
        const sativaBias = ['Limonene', 'Pinene', 'Terpinolene', 'Ocimene', 'Guaiol']

        const preferredSet = isIndica ? indicaBias : isSativa ? sativaBias : ALL_TERPENE_NAMES
        if (!preferredSet.includes(terp) && added < 2) continue

        const ref = TERPENE_DATABASE[terp]
        const hashVal = ((nameHash * (added + 13) * 37) % 100) / 100
        const percent =
            ref.typicalRange.min + (ref.averagePercent - ref.typicalRange.min) * hashVal * 0.5
        if (percent >= PRESENCE_THRESHOLD) {
            profile[terp] = Math.round(percent * 1000) / 1000
            added++
        }
    }

    return profile
}

// ---------------------------------------------------------------------------
// Cannabinoid profile generation
// ---------------------------------------------------------------------------

/**
 * Generate a cannabinoid profile from THC/CBD base values.
 * Minor cannabinoids are estimated deterministically.
 */
export const generateCannabinoidProfile = (
    thc: number,
    cbd: number,
    cbg?: number,
    thcv?: number,
    nameHash?: number,
): CannabinoidProfile => {
    const hash = nameHash ?? 0
    const profile: CannabinoidProfile = {
        THC: thc,
        CBD: cbd,
    }

    if (cbg !== undefined && cbg > 0) {
        profile.CBG = cbg
    } else {
        // CBG typically 0.1-1.5% -- precursor, inversely related to THC+CBD maturity
        profile.CBG = Math.round((0.1 + ((hash * 7) % 140) / 100) * 100) / 100
    }

    if (thcv !== undefined && thcv > 0) {
        profile.THCV = thcv
    } else if (thc > 15) {
        // THCV more common in high-THC strains, typically 0.1-0.5%
        profile.THCV = Math.round((0.05 + ((hash * 11) % 45) / 100) * 100) / 100
    }

    // CBC: typically 0.05-0.3%, common across most strains
    profile.CBC = Math.round((0.05 + ((hash * 13) % 25) / 100) * 100) / 100

    // CBN: degradation product, typically trace
    if (thc > 10) {
        profile.CBN = Math.round((0.01 + ((hash * 17) % 15) / 100) * 100) / 100
    }

    // Acid forms (pre-decarboxylation) -- estimated from active forms
    profile.THCA = Math.round(thc * 1.122 * 100) / 100 // THCA:THC molar conversion
    profile.CBDA = Math.round(cbd * 1.142 * 100) / 100 // CBDA:CBD molar conversion

    return profile
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

/**
 * Predict therapeutic/consumer effects from terpene + cannabinoid profiles
 * using the entourage effect model.
 *
 * Scores each effect by summing weighted contributions from all compounds.
 * Returns effects sorted by confidence (highest first).
 */
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

/**
 * Build a complete ChemovarProfile for a strain.
 * Uses existing data where available, generates estimates where not.
 */
export const buildChemovarProfile = (strain: Strain): ChemovarProfile => {
    const nameHash = strain.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

    // Terpene profile: use existing or generate
    const terpeneProfile: TerpeneProfile =
        strain.terpeneProfile ??
        generateTerpeneProfile(strain.dominantTerpenes ?? [], nameHash, strain.type)

    // Cannabinoid profile: use existing or generate
    const cannabinoidProfile: CannabinoidProfile =
        strain.cannabinoidProfile ??
        generateCannabinoidProfile(strain.thc, strain.cbd, strain.cbg, strain.thcv, nameHash)

    // Sum totals
    const totalTerpenePercent =
        Math.round(Object.values(terpeneProfile).reduce((sum, v) => sum + (v ?? 0), 0) * 1000) /
        1000

    const totalCannabinoidPercent =
        Math.round(Object.values(cannabinoidProfile).reduce((sum, v) => sum + (v ?? 0), 0) * 1000) /
        1000

    const chemovarType = classifyChemovar(strain.thc, strain.cbd, cannabinoidProfile.CBG)

    const thcCbdRatio =
        strain.cbd > 0
            ? Math.round((strain.thc / strain.cbd) * 100) / 100
            : strain.thc > 0
              ? Infinity
              : 0

    const predictedEffects = predictEffects(terpeneProfile, cannabinoidProfile)

    // Data quality: 1.0 if we have real lab data, lower if estimated
    const hasRealTerpenes = strain.terpeneProfile !== undefined
    const hasRealCannabinoids = strain.cannabinoidProfile !== undefined
    const hasDominantTerpenes = (strain.dominantTerpenes?.length ?? 0) > 0
    const dataQuality =
        hasRealTerpenes && hasRealCannabinoids
            ? 0.9
            : hasRealTerpenes || hasRealCannabinoids
              ? 0.6
              : hasDominantTerpenes
                ? 0.4
                : 0.2

    return {
        chemovarType,
        totalTerpenePercent,
        totalCannabinoidPercent,
        thcCbdRatio,
        detailedTerpeneProfile: toDetailedTerpeneProfile(terpeneProfile, 0),
        detailedCannabinoidProfile: toDetailedCannabinoidProfile(cannabinoidProfile, 0),
        predictedEffects,
        dataQuality,
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

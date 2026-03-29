/**
 * Strain Curation Service
 *
 * Intelligent merge, deduplication, and quality assessment for strain data
 * arriving from multiple external sources. Implements a "best data wins"
 * strategy where lab-verified data takes precedence over community data,
 * and multiple confirming sources boost confidence scores.
 *
 * Key responsibilities:
 *  - Merge external data into existing Strain objects (non-destructive)
 *  - Deduplicate strains by name fuzzy matching
 *  - Compute data quality scores
 *  - Track data provenance across sources
 *  - Generate flavonoid profiles from terpene/cannabinoid signatures
 *  - Build lineage trees from parent data
 */

import type {
    Strain,
    StrainApiProvider,
    TerpeneProfile,
    CannabinoidProfile,
    FlavonoidProfile,
    DataQualityScore,
    FlavonoidName,
} from '@/types'
import type { ValidatedExternalStrainData } from '@/types/strainSchemas'
import type { StrainImportResult } from '@/types/strainSchemas'
import { resolveTerpeneName } from '@/services/terpeneService'
import { FLAVONOID_DATABASE } from '@/data/flavonoidDatabase'
import { buildProvenance, PROVIDER_CONFIGS } from '@/services/strainDataProviderRegistry'

// ---------------------------------------------------------------------------
// Fuzzy name matching
// ---------------------------------------------------------------------------

/** Normalize strain name for comparison (lowercase, strip common suffixes) */
const normalizeName = (name: string): string =>
    name
        .toLowerCase()
        .replace(/\s+(auto|feminized|fem|reg|regular|fast|f1|s1|bx|ibl)\s*$/i, '')
        .replace(/[^a-z0-9]/g, '')

/** Check if two strain names refer to the same strain */
export const isSameStrain = (a: string, b: string): boolean => {
    const na = normalizeName(a)
    const nb = normalizeName(b)
    if (na === nb) return true
    // One contains the other (e.g. "OG Kush" vs "OG Kush Auto")
    if (na.length > 3 && nb.length > 3) {
        if (na.includes(nb) || nb.includes(na)) return true
    }
    return false
}

// ---------------------------------------------------------------------------
// Data Quality Assessment
// ---------------------------------------------------------------------------

/** Compute a quality score for a strain's data completeness and reliability */
export const assessDataQuality = (strain: Strain): DataQualityScore => {
    let score = 0
    let maxScore = 0
    const hasLabData = (strain.labResults?.length ?? 0) > 0
    const hasRealTerpeneData =
        strain.terpeneProfile !== undefined &&
        Object.keys(strain.terpeneProfile).length > 0 &&
        (strain.dataProvenance?.some((p) => p.labVerified) ?? false)
    const hasLineageData = strain.lineage !== undefined && (strain.lineage.parents?.length ?? 0) > 0
    const hasFlavonoidData =
        strain.flavonoidProfile !== undefined && Object.keys(strain.flavonoidProfile).length > 0

    // Weighted scoring
    const checks: Array<[boolean, number]> = [
        [strain.name.length > 0, 5], // Has name
        [strain.thc > 0 || strain.cbd > 0, 10], // Has cannabinoid data
        [strain.description !== undefined && strain.description.length > 20, 5],
        [strain.genetics !== undefined, 8],
        [(strain.aromas?.length ?? 0) > 0, 5],
        [(strain.dominantTerpenes?.length ?? 0) > 0, 8],
        [strain.terpeneProfile !== undefined, 10],
        [strain.cannabinoidProfile !== undefined, 10],
        [hasFlavonoidData, 8],
        [strain.chemovarProfile !== undefined, 8],
        [hasLineageData, 12],
        [hasLabData, 15],
        [hasRealTerpeneData, 10],
        [(strain.dataProvenance?.length ?? 0) > 1, 8], // Multiple sources
        [strain.medicalInfo !== undefined, 5],
    ]

    for (const [check, weight] of checks) {
        maxScore += weight
        if (check) score += weight
    }

    const sourceCount = strain.dataProvenance?.length ?? 0

    return {
        overall: maxScore > 0 ? Math.round((score / maxScore) * 100) / 100 : 0,
        sourceCount,
        hasLabData,
        hasRealTerpeneData,
        hasLineageData,
        hasFlavonoidData,
        lastCurated: new Date().toISOString(),
    }
}

// ---------------------------------------------------------------------------
// Flavonoid Estimation
// ---------------------------------------------------------------------------

/**
 * Estimate a flavonoid profile based on terpene and cannabinoid data.
 * Uses correlations from literature:
 *  - High-THC strains tend to have more apigenin/luteolin
 *  - High-CBD strains correlate with higher quercetin/kaempferol
 *  - Cannflavins are present in all cannabis but vary by cultivar
 */
export const estimateFlavonoidProfile = (
    terpeneProfile?: TerpeneProfile,
    cannabinoidProfile?: CannabinoidProfile,
    nameHash?: number,
): FlavonoidProfile => {
    const hash = nameHash ?? 42
    const profile: FlavonoidProfile = {}

    // Base cannflavins (always present in cannabis)
    profile['Cannflavin A'] = 0.003 + (hash % 11) * 0.001
    profile['Cannflavin B'] = 0.002 + (hash % 8) * 0.001
    profile['Cannflavin C'] = 0.001 + (hash % 5) * 0.0005

    // Modulate by cannabinoid profile
    const thc = cannabinoidProfile?.THC ?? 0
    const cbd = cannabinoidProfile?.CBD ?? 0

    // High-THC correlates with apigenin
    if (thc > 20) {
        profile['Apigenin'] = 0.04 + (hash % 7) * 0.005
    } else {
        profile['Apigenin'] = 0.02 + (hash % 7) * 0.003
    }

    // High-CBD correlates with quercetin/kaempferol
    if (cbd > 5) {
        profile['Quercetin'] = 0.05 + (hash % 9) * 0.006
        profile['Kaempferol'] = 0.025 + (hash % 6) * 0.004
    } else {
        profile['Quercetin'] = 0.03 + (hash % 9) * 0.003
        profile['Kaempferol'] = 0.015 + (hash % 6) * 0.002
    }

    // Luteolin correlates with myrcene-dominant profiles
    const myrcene = terpeneProfile?.Myrcene ?? 0
    if (myrcene > 0.3) {
        profile['Luteolin'] = 0.03 + (hash % 5) * 0.004
    } else {
        profile['Luteolin'] = 0.015 + (hash % 5) * 0.002
    }

    // Vitexin and Isovitexin (trace amounts)
    profile['Vitexin'] = 0.005 + (hash % 4) * 0.002
    profile['Isovitexin'] = 0.003 + (hash % 3) * 0.002

    // Catechins (common in all plants)
    profile['Catechins'] = 0.01 + (hash % 6) * 0.003

    return profile
}

// ---------------------------------------------------------------------------
// Merge Strategy
// ---------------------------------------------------------------------------

/**
 * Merge external data into an existing strain (non-destructive).
 * Higher quality data overwrites lower quality data.
 * New fields are always added if missing.
 */
export const mergeExternalIntoStrain = (
    existing: Strain,
    external: ValidatedExternalStrainData,
): Strain => {
    const merged = { ...existing }
    const providerConfig = PROVIDER_CONFIGS[external.provider]
    const isHighQuality = providerConfig?.qualityTier === 1
    const provenance = buildProvenance(
        external.provider,
        external.externalId,
        external.labTested ?? false,
    )

    // Description: prefer longer, more detailed
    if (
        external.description &&
        (!merged.description || external.description.length > merged.description.length)
    ) {
        merged.description = external.description
    }

    // Genetics: prefer external if missing
    if (external.genetics && !merged.genetics) {
        merged.genetics = external.genetics
    }

    // THC/CBD: prefer lab-verified external data
    if (isHighQuality && external.thc !== undefined) {
        merged.thc = external.thc
    }
    if (isHighQuality && external.cbd !== undefined) {
        merged.cbd = external.cbd
    }
    if (external.cbg !== undefined && merged.cbg === undefined) {
        merged.cbg = external.cbg
    }
    if (external.thcv !== undefined && merged.thcv === undefined) {
        merged.thcv = external.thcv
    }

    // Aromas: union
    if (external.aromas?.length) {
        const existing_aromas = new Set(merged.aromas?.map((a) => a.toLowerCase()) ?? [])
        const newAromas = external.aromas.filter((a) => !existing_aromas.has(a.toLowerCase()))
        merged.aromas = [...(merged.aromas ?? []), ...newAromas]
    }

    // Dominant terpenes: prefer external if more complete
    if (
        external.dominantTerpenes?.length &&
        external.dominantTerpenes.length > (merged.dominantTerpenes?.length ?? 0)
    ) {
        merged.dominantTerpenes = external.dominantTerpenes
    }

    // Terpene profile: merge (higher quality wins per-terpene)
    if (external.terpeneProfile) {
        const mergedTerpenes: TerpeneProfile = { ...(merged.terpeneProfile ?? {}) }
        for (const [rawName, value] of Object.entries(external.terpeneProfile)) {
            const resolved = resolveTerpeneName(rawName)
            if (resolved && (isHighQuality || mergedTerpenes[resolved] === undefined)) {
                mergedTerpenes[resolved] = value
            }
        }
        merged.terpeneProfile = mergedTerpenes
    }

    // Cannabinoid profile: merge
    if (external.cannabinoidProfile) {
        merged.cannabinoidProfile = {
            ...(merged.cannabinoidProfile ?? {}),
            ...external.cannabinoidProfile,
        }
    }

    // Flavonoid profile: merge
    if (external.flavonoidProfile) {
        const mergedFlavonoids: FlavonoidProfile = { ...(merged.flavonoidProfile ?? {}) }
        for (const [name, value] of Object.entries(external.flavonoidProfile)) {
            if (name in FLAVONOID_DATABASE) {
                mergedFlavonoids[name as FlavonoidName] = value
            }
        }
        merged.flavonoidProfile = mergedFlavonoids
    }

    // Lineage
    if (external.lineage) {
        if (!merged.lineage) {
            merged.lineage = external.lineage
        } else {
            // Merge parents
            if (external.lineage.parents?.length) {
                const existingNames = new Set(
                    merged.lineage.parents?.map((p) => p.name.toLowerCase()) ?? [],
                )
                const newParents = external.lineage.parents.filter(
                    (p) => !existingNames.has(p.name.toLowerCase()),
                )
                merged.lineage = {
                    ...merged.lineage,
                    parents: [...(merged.lineage.parents ?? []), ...newParents],
                }
            }
            // Prefer external for missing fields
            if (external.lineage.breeder && !merged.lineage.breeder) {
                merged.lineage.breeder = external.lineage.breeder
            }
            if (external.lineage.yearReleased && !merged.lineage.yearReleased) {
                merged.lineage.yearReleased = external.lineage.yearReleased
            }
        }
    }

    // Lab results: append
    if (external.labResults?.length) {
        merged.labResults = [...(merged.labResults ?? []), ...external.labResults]
    }

    // Medical info
    if (external.medicalInfo) {
        merged.medicalInfo = { ...(merged.medicalInfo ?? {}), ...external.medicalInfo }
    }

    // Provenance: append
    merged.dataProvenance = [...(merged.dataProvenance ?? []), provenance]

    // Recompute data quality
    merged.dataQuality = assessDataQuality(merged)

    return merged
}

// ---------------------------------------------------------------------------
// Batch Import
// ---------------------------------------------------------------------------

/**
 * Import a batch of external strain data, merging with existing strains
 * where names match, and creating new entries for unknown strains.
 */
export const importStrainBatch = (
    existingStrains: Strain[],
    externalData: ValidatedExternalStrainData[],
    provider: StrainApiProvider,
): { updatedStrains: Strain[]; result: StrainImportResult } => {
    const result: StrainImportResult = {
        total: externalData.length,
        imported: 0,
        failed: 0,
        merged: 0,
        added: 0,
        errors: [],
        provider,
        importedAt: new Date().toISOString(),
    }

    // Build name index for fast lookup
    const nameIndex = new Map<string, number>()
    for (let i = 0; i < existingStrains.length; i++) {
        const s = existingStrains[i]
        if (s) nameIndex.set(normalizeName(s.name), i)
    }

    const updatedStrains = [...existingStrains]

    for (let i = 0; i < externalData.length; i++) {
        const ext = externalData[i]
        try {
            if (!ext) continue
            const normalizedName = normalizeName(ext.name)
            const existingIdx = nameIndex.get(normalizedName)

            if (existingIdx !== undefined) {
                const existing = updatedStrains[existingIdx]
                if (existing) {
                    updatedStrains[existingIdx] = mergeExternalIntoStrain(existing, ext)
                }
                result.merged++
            } else {
                // Would need to create a new strain via strainFactory
                // For now, just count -- actual creation is done by the caller
                result.added++
            }
            result.imported++
        } catch (err) {
            result.failed++
            result.errors.push({
                index: i,
                field: 'unknown',
                message: err instanceof Error ? err.message : String(err),
            })
        }
    }

    return { updatedStrains, result }
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Find duplicate strains in a collection by fuzzy name matching.
 * Returns groups of strain IDs that appear to be duplicates.
 */
export const findDuplicateStrains = (
    strains: Array<{ id: string; name: string }>,
): Array<{ primaryId: string; duplicateIds: string[] }> => {
    const groups: Array<{ primaryId: string; duplicateIds: string[] }> = []
    const processed = new Set<string>()

    for (let i = 0; i < strains.length; i++) {
        const strain = strains[i]
        if (!strain || processed.has(strain.id)) continue

        const duplicates: string[] = []
        for (let j = i + 1; j < strains.length; j++) {
            const candidate = strains[j]
            if (candidate && !processed.has(candidate.id) && isSameStrain(strain.name, candidate.name)) {
                duplicates.push(candidate.id)
                processed.add(candidate.id)
            }
        }

        if (duplicates.length > 0) {
            groups.push({ primaryId: strain.id, duplicateIds: duplicates })
        }
        processed.add(strain.id)
    }

    return groups
}

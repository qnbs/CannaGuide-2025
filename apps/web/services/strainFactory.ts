import {
    Strain,
    GeneticModifiers,
    StrainType,
    TerpeneProfile,
    CannabinoidProfile,
    FlavonoidProfile,
} from '@/types'
import {
    generateTerpeneProfile,
    generateCannabinoidProfile,
    buildChemovarProfile,
} from '@/services/terpeneService'

const inferFloweringType = (
    typeDetailsText: string,
    floweringTimeRangeText: string,
): Strain['floweringType'] | undefined => {
    const hasAutoMarker =
        typeDetailsText.toLowerCase().includes('autoflower') ||
        floweringTimeRangeText.toLowerCase().includes('lifecycle')
    return hasAutoMarker ? 'Autoflower' : undefined
}

const estimateFlavonoidProfile = (
    terpeneProfile?: TerpeneProfile,
    cannabinoidProfile?: CannabinoidProfile,
    nameHash?: number,
): FlavonoidProfile => {
    const hash = nameHash ?? 42
    const profile: FlavonoidProfile = {}

    profile['Cannflavin A'] = 0.003 + (hash % 11) * 0.001
    profile['Cannflavin B'] = 0.002 + (hash % 8) * 0.001
    profile['Cannflavin C'] = 0.001 + (hash % 5) * 0.0005

    const thc = cannabinoidProfile?.THC ?? 0
    const cbd = cannabinoidProfile?.CBD ?? 0

    profile['Apigenin'] = thc > 20 ? 0.04 + (hash % 7) * 0.005 : 0.02 + (hash % 7) * 0.003
    profile['Quercetin'] = cbd > 5 ? 0.05 + (hash % 9) * 0.006 : 0.03 + (hash % 9) * 0.003
    profile['Kaempferol'] = cbd > 5 ? 0.025 + (hash % 6) * 0.004 : 0.015 + (hash % 6) * 0.002

    const myrcene = terpeneProfile?.Myrcene ?? 0
    profile['Luteolin'] = myrcene > 0.3 ? 0.03 + (hash % 5) * 0.004 : 0.015 + (hash % 5) * 0.002

    profile['Vitexin'] = 0.005 + (hash % 4) * 0.002
    profile['Isovitexin'] = 0.003 + (hash % 3) * 0.002
    profile['Catechins'] = 0.01 + (hash % 6) * 0.003
    profile['Orientin'] = 0.002 + (hash % 4) * 0.001
    profile['Silymarin'] = 0.001 + (hash % 3) * 0.0005

    return profile
}

const ensureRequiredStrainFields = (
    safeData: Partial<Strain>,
    nameText: string,
    normalizedType: StrainType | undefined,
    fallbackId: string,
): void => {
    const missingRequired =
        !safeData.id ||
        !nameText ||
        !normalizedType ||
        safeData.thc === undefined ||
        safeData.cbd === undefined ||
        safeData.floweringTime === undefined

    if (!missingRequired) {
        return
    }

    console.debug(
        `[strainFactory] Strain is missing required fields (id, name, type, thc, cbd, floweringTime) for: ${nameText || 'Unknown'}. Applying safe defaults.`,
    )

    if (!safeData.id) safeData.id = fallbackId
    if (!nameText) safeData.name = 'Unknown Strain'
    if (!normalizedType) safeData.type = StrainType.Hybrid
    if (safeData.thc === undefined) safeData.thc = 0
    if (safeData.cbd === undefined) safeData.cbd = 0
    if (safeData.floweringTime === undefined) safeData.floweringTime = 9
}

// This factory ensures that every strain object has a consistent shape and default values.
export const createStrainObject = (data: Partial<Strain>): Strain => {
    const safeText = (value: unknown): string => (typeof value === 'string' ? value : '')
    const safeType = (value: unknown): StrainType | undefined => {
        return value === StrainType.Sativa ||
            value === StrainType.Indica ||
            value === StrainType.Hybrid
            ? value
            : undefined
    }

    const nameText = safeText(data.name)
    const typeDetailsText = safeText(data.typeDetails)
    const floweringTimeRangeText = safeText(data.floweringTimeRange)
    const nameHash = nameText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const fallbackId =
        typeof globalThis.crypto?.randomUUID === 'function'
            ? globalThis.crypto.randomUUID()
            : `unknown-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) =>
                  b.toString(36),
              )
                  .join('')
                  .slice(0, 8)}`

    // Default genetic modifiers, derived deterministically from the strain name for consistency
    const defaultGeneticModifiers: GeneticModifiers = {
        pestResistance: 0.8 + (nameHash % 40) / 100, // Range 0.8 to 1.2
        nutrientUptakeRate: 0.8 + ((nameHash * 3) % 40) / 100, // Range 0.8 to 1.2
        stressTolerance: 0.8 + ((nameHash * 7) % 40) / 100, // Range 0.8 to 1.2
        rue: 1.4 + ((nameHash * 5) % 20) / 100, // Radiation Use Efficiency (g biomass per MJ of PAR), typical range 1.4-1.6
        vpdTolerance: {
            min: 0.7 + ((nameHash * 2) % 30) / 100, // e.g., 0.7-1.0 kPa
            max: 1.3 + ((nameHash * 11) % 30) / 100, // e.g., 1.3-1.6 kPa
        },
        transpirationFactor: 0.9 + ((nameHash * 13) % 20) / 100, // 0.9 to 1.1
        stomataSensitivity: 0.9 + ((nameHash * 17) % 20) / 100, // Range 0.9 to 1.1
    }

    const defaults: Omit<Strain, 'id' | 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime'> = {
        floweringType: 'Photoperiod',
        agronomic: {
            difficulty: 'Medium',
            yield: 'Medium',
            height: 'Medium',
        },
        geneticModifiers: defaultGeneticModifiers,
    }

    const normalizedType = safeType(data.type)

    // Build safe overrides without mutating the input object
    const safeData: Partial<Strain> = { ...data }
    ensureRequiredStrainFields(safeData, nameText, normalizedType, fallbackId)

    if (!safeType(safeData.type)) {
        safeData.type = StrainType.Hybrid
    }

    const merged = {
        ...defaults,
        ...safeData,
        agronomic: { ...defaults.agronomic, ...(safeData.agronomic ?? {}) },
        geneticModifiers: { ...defaults.geneticModifiers, ...(safeData.geneticModifiers ?? {}) },
    } as Strain

    // Infer floweringType if not explicitly provided
    const inferredFloweringType = inferFloweringType(typeDetailsText, floweringTimeRangeText)
    if (!safeData.floweringType && inferredFloweringType) {
        merged.floweringType = inferredFloweringType
    }

    // --- Terpene / Cannabinoid / Chemovar enrichment ---
    // Generate terpene profile if not explicitly provided
    if (!merged.terpeneProfile && (merged.dominantTerpenes?.length ?? 0) > 0) {
        merged.terpeneProfile = generateTerpeneProfile(
            merged.dominantTerpenes ?? [],
            nameHash,
            merged.type,
        )
    }

    // Generate cannabinoid profile if not explicitly provided
    if (!merged.cannabinoidProfile) {
        merged.cannabinoidProfile = generateCannabinoidProfile(
            merged.thc,
            merged.cbd,
            merged.cbg,
            merged.thcv,
            nameHash,
        )
    }

    // Build chemovar profile if not explicitly provided
    if (!merged.chemovarProfile) {
        merged.chemovarProfile = buildChemovarProfile(merged)
    }

    // Generate flavonoid profile if not explicitly provided
    if (!merged.flavonoidProfile) {
        merged.flavonoidProfile = estimateFlavonoidProfile(
            merged.terpeneProfile,
            merged.cannabinoidProfile,
            nameHash,
        )
    }

    return merged
}

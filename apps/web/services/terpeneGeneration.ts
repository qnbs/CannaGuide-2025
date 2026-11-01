import type { CannabinoidProfile, TerpeneName, TerpeneProfile } from '@/types'
import { ALL_TERPENE_NAMES, TERPENE_DATABASE } from '@/data/terpeneDatabase'

/** Minimum percent threshold to consider a terpene present. */
export const PRESENCE_THRESHOLD = 0.01

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

const INDICA_BIAS: readonly TerpeneName[] = [
    'Myrcene',
    'Linalool',
    'Caryophyllene',
    'Humulene',
    'Bisabolol',
]

const SATIVA_BIAS: readonly TerpeneName[] = [
    'Limonene',
    'Pinene',
    'Terpinolene',
    'Ocimene',
    'Guaiol',
]

/**
 * Resolve a terpene string (possibly aliased) to a canonical TerpeneName.
 * Returns undefined if unrecognised.
 */
export const resolveTerpeneName = (raw: string): TerpeneName | undefined => {
    if (!raw) return undefined
    const lower = raw.trim().toLowerCase()
    const direct = ALL_TERPENE_NAMES.find((name) => name.toLowerCase() === lower)
    if (direct) return direct
    return TERPENE_ALIASES[lower]
}

const resolvedTerpenes = (names: string[]): TerpeneName[] =>
    names.map(resolveTerpeneName).filter((name): name is TerpeneName => name !== undefined)

const primaryPercent = (terpene: TerpeneName, index: number, nameHash: number): number => {
    const ref = TERPENE_DATABASE[terpene]
    const range = ref.typicalRange.max - ref.typicalRange.min
    const factor = Math.max(0.3, 1 - index * 0.2)
    const hashVariation = ((nameHash * (index + 7) * 31) % 100) / 100
    const percent = ref.typicalRange.min + range * factor * (0.5 + hashVariation * 0.5)
    return Math.round(percent * 1000) / 1000
}

const assignPrimaryTerpenes = (
    profile: TerpeneProfile,
    names: TerpeneName[],
    nameHash: number,
): void => {
    for (let index = 0; index < names.length; index++) {
        const terpene = names[index]
        if (!terpene) continue
        profile[terpene] = primaryPercent(terpene, index, nameHash)
    }
}

const typeTextOf = (strainType: unknown): string =>
    typeof strainType === 'string' ? strainType : ''

const typeBias = (strainType: string): readonly TerpeneName[] => {
    const lower = typeTextOf(strainType).toLowerCase()
    if (lower.includes('indica')) return INDICA_BIAS
    if (lower.includes('sativa')) return SATIVA_BIAS
    return ALL_TERPENE_NAMES
}

const tracePercent = (terpene: TerpeneName, added: number, nameHash: number): number => {
    const ref = TERPENE_DATABASE[terpene]
    const hashVal = ((nameHash * (added + 13) * 37) % 100) / 100
    return ref.typicalRange.min + (ref.averagePercent - ref.typicalRange.min) * hashVal * 0.5
}

const skipTrace = (
    profile: TerpeneProfile,
    terpene: TerpeneName,
    preferred: readonly TerpeneName[],
    added: number,
    secondaryCount: number,
): boolean => {
    if (added >= secondaryCount) return true
    if (profile[terpene] !== undefined) return true
    return !preferred.includes(terpene) && added < 2
}

const addTraceTerpenes = (profile: TerpeneProfile, strainType: string, nameHash: number): void => {
    const preferred = typeBias(strainType)
    const secondaryCount = 2 + (nameHash % 3)
    let added = 0
    for (const terpene of ALL_TERPENE_NAMES) {
        if (skipTrace(profile, terpene, preferred, added, secondaryCount)) continue
        const percent = tracePercent(terpene, added, nameHash)
        if (percent < PRESENCE_THRESHOLD) continue
        profile[terpene] = Math.round(percent * 1000) / 1000
        added += 1
    }
}

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
    assignPrimaryTerpenes(profile, resolvedTerpenes(dominantTerpenes), nameHash)
    addTraceTerpenes(profile, strainType, nameHash)
    return profile
}

const hashUnit = (hash: number, factor: number, modulus: number): number =>
    ((hash * factor) % modulus) / 100

const roundedHundredth = (value: number): number => Math.round(value * 100) / 100

const assignCbg = (profile: CannabinoidProfile, cbg: number | undefined, hash: number): void => {
    profile.CBG = cbg !== undefined ? cbg : roundedHundredth(0.1 + hashUnit(hash, 7, 140))
}

const assignThcv = (
    profile: CannabinoidProfile,
    thc: number,
    thcv: number | undefined,
    hash: number,
): void => {
    if (thcv !== undefined) {
        profile.THCV = thcv
        return
    }
    if (thc > 15) profile.THCV = roundedHundredth(0.05 + hashUnit(hash, 11, 45))
}

const assignCbn = (profile: CannabinoidProfile, thc: number, hash: number): void => {
    if (thc <= 10) return
    profile.CBN = roundedHundredth(0.01 + hashUnit(hash, 17, 15))
}

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
    const profile: CannabinoidProfile = { THC: thc, CBD: cbd }
    assignCbg(profile, cbg, hash)
    assignThcv(profile, thc, thcv, hash)
    profile.CBC = roundedHundredth(0.05 + hashUnit(hash, 13, 25))
    assignCbn(profile, thc, hash)
    profile.THCA = roundedHundredth(thc * 1.122)
    profile.CBDA = roundedHundredth(cbd * 1.142)
    return profile
}

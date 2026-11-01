import {
    CannabinoidProfile,
    ChemovarProfile,
    FlavonoidProfile,
    GeneticModifiers,
    Strain,
    StrainType,
    TerpeneProfile,
} from '@/types'
import {
    buildChemovarProfile,
    generateCannabinoidProfile,
    generateTerpeneProfile,
    isTypeIv,
} from '@/services/terpeneService'

export const SIMULATION_PROFILE_KIND = 'simulation' as const

export interface SimulatedStrainProfile {
    kind: typeof SIMULATION_PROFILE_KIND
    geneticModifiers: GeneticModifiers
    flavonoidProfile: FlavonoidProfile
    terpeneProfile: TerpeneProfile
    cannabinoidProfile: CannabinoidProfile
    chemovarProfile?: ChemovarProfile
}

const nameHashOf = (name: string): number =>
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

const readAmount = (value: number | undefined): number => value ?? 0

const apigeninAmount = (thc: number, nameHash: number): number =>
    thc > 20 ? 0.04 + (nameHash % 7) * 0.005 : 0.02 + (nameHash % 7) * 0.003

const quercetinAmount = (cbd: number, nameHash: number): number =>
    cbd > 5 ? 0.05 + (nameHash % 9) * 0.006 : 0.03 + (nameHash % 9) * 0.003

const kaempferolAmount = (cbd: number, nameHash: number): number =>
    cbd > 5 ? 0.025 + (nameHash % 6) * 0.004 : 0.015 + (nameHash % 6) * 0.002

const luteolinAmount = (myrcene: number, nameHash: number): number =>
    myrcene > 0.3 ? 0.03 + (nameHash % 5) * 0.004 : 0.015 + (nameHash % 5) * 0.002

const estimateFlavonoidProfile = (
    terpeneProfile: TerpeneProfile | undefined,
    cannabinoidProfile: CannabinoidProfile | undefined,
    nameHash: number,
): FlavonoidProfile => {
    const thc = readAmount(cannabinoidProfile?.THC)
    const cbd = readAmount(cannabinoidProfile?.CBD)
    const myrcene = readAmount(terpeneProfile?.Myrcene)
    return {
        'Cannflavin A': 0.003 + (nameHash % 11) * 0.001,
        'Cannflavin B': 0.002 + (nameHash % 8) * 0.001,
        'Cannflavin C': 0.001 + (nameHash % 5) * 0.0005,
        Apigenin: apigeninAmount(thc, nameHash),
        Quercetin: quercetinAmount(cbd, nameHash),
        Kaempferol: kaempferolAmount(cbd, nameHash),
        Luteolin: luteolinAmount(myrcene, nameHash),
        Vitexin: 0.005 + (nameHash % 4) * 0.002,
        Isovitexin: 0.003 + (nameHash % 3) * 0.002,
        Catechins: 0.01 + (nameHash % 6) * 0.003,
        Orientin: 0.002 + (nameHash % 4) * 0.001,
        Silymarin: 0.001 + (nameHash % 3) * 0.0005,
    }
}

const finiteMeasurement = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined

const zeroIfMissing = (value: number | undefined): number => value ?? 0

const reportedMinors = (data: Partial<Strain>): CannabinoidProfile => {
    const profile: CannabinoidProfile = {}
    const cbg = finiteMeasurement(data.cbg)
    const thcv = finiteMeasurement(data.thcv)
    if (cbg !== undefined) profile.CBG = cbg
    if (thcv !== undefined) profile.THCV = thcv
    return profile
}

const simulatedCannabinoids = (data: Partial<Strain>, nameHash: number): CannabinoidProfile => {
    if (data.cannabinoidProfile) return data.cannabinoidProfile
    const thc = finiteMeasurement(data.thc)
    const cbd = finiteMeasurement(data.cbd)
    if (thc !== undefined || cbd !== undefined) {
        return generateCannabinoidProfile(
            zeroIfMissing(thc),
            zeroIfMissing(cbd),
            finiteMeasurement(data.cbg),
            finiteMeasurement(data.thcv),
            nameHash,
        )
    }
    return reportedMinors(data)
}

const simulatedModifiers = (nameHash: number): GeneticModifiers => ({
    pestResistance: 0.8 + (nameHash % 40) / 100,
    nutrientUptakeRate: 0.8 + ((nameHash * 3) % 40) / 100,
    stressTolerance: 0.8 + ((nameHash * 7) % 40) / 100,
    rue: 1.4 + ((nameHash * 5) % 20) / 100,
    vpdTolerance: {
        min: 0.7 + ((nameHash * 2) % 30) / 100,
        max: 1.3 + ((nameHash * 11) % 30) / 100,
    },
    transpirationFactor: 0.9 + ((nameHash * 13) % 20) / 100,
    stomataSensitivity: 0.9 + ((nameHash * 17) % 20) / 100,
})

const simulationId = (id: string | undefined): string =>
    typeof id === 'string' && id.length > 0 ? id : 'simulation'

const textOr = <T extends string>(value: T | undefined, fallback: T): T => value ?? fallback

const numberOr = (value: number | undefined, fallback: number): number => value ?? fallback

const withTerpeneProfile = (profile: TerpeneProfile | undefined): Partial<Strain> =>
    profile ? { terpeneProfile: profile } : {}

const withCannabinoidProfile = (profile: CannabinoidProfile | undefined): Partial<Strain> =>
    profile ? { cannabinoidProfile: profile } : {}

const MEDIUM_AGRONOMY: Strain['agronomic'] = {
    difficulty: 'Medium',
    yield: 'Medium',
    height: 'Medium',
}

const simulationCarrier = (data: Partial<Strain>, name: string, nameHash: number): Strain => ({
    id: simulationId(data.id),
    name,
    type: textOr(data.type, StrainType.Hybrid),
    floweringType: textOr(data.floweringType, 'Photoperiod'),
    thc: numberOr(data.thc, 0),
    cbd: numberOr(data.cbd, 0),
    floweringTime: numberOr(data.floweringTime, 0),
    agronomic: data.agronomic ?? MEDIUM_AGRONOMY,
    geneticModifiers: data.geneticModifiers ?? simulatedModifiers(nameHash),
    ...withTerpeneProfile(data.terpeneProfile),
    ...withCannabinoidProfile(data.cannabinoidProfile),
})

const dropUnreportedMajor = (carrier: Strain, key: 'thc' | 'cbd', source: unknown): void => {
    if (finiteMeasurement(source) === undefined) Reflect.deleteProperty(carrier, key)
}

const copyMinor = (carrier: Strain, key: 'cbg' | 'thcv', source: unknown): void => {
    const amount = finiteMeasurement(source)
    if (amount !== undefined) carrier[key] = amount
}

const carrierForChemovar = (data: Partial<Strain>, name: string, nameHash: number): Strain => {
    const carrier = simulationCarrier(data, name, nameHash)
    dropUnreportedMajor(carrier, 'thc', data.thc)
    dropUnreportedMajor(carrier, 'cbd', data.cbd)
    copyMinor(carrier, 'cbg', data.cbg)
    copyMinor(carrier, 'thcv', data.thcv)
    if (data.dominantTerpenes) carrier.dominantTerpenes = data.dominantTerpenes
    return carrier
}

const reportedCbg = (data: Partial<Strain>): number | undefined => {
    const topLevel = finiteMeasurement(data.cbg)
    if (topLevel !== undefined) return topLevel
    return finiteMeasurement(data.cannabinoidProfile?.CBG)
}

const reportedThcOf = (data: Partial<Strain>): number | undefined =>
    finiteMeasurement(data.thc) ?? finiteMeasurement(data.cannabinoidProfile?.THC)

const reportedCbdOf = (data: Partial<Strain>): number | undefined =>
    finiteMeasurement(data.cbd) ?? finiteMeasurement(data.cannabinoidProfile?.CBD)

/** Both majors, including 0, or CBG above 2% that beats any reported major. */
export const hasReportedChemovarInput = (data: Partial<Strain>): boolean => {
    const thc = reportedThcOf(data)
    const cbd = reportedCbdOf(data)
    if (thc !== undefined && cbd !== undefined) return true
    return isTypeIv(thc, cbd, reportedCbg(data))
}

const simulatedChemovar = (
    data: Partial<Strain>,
    name: string,
    nameHash: number,
): ChemovarProfile | undefined => {
    if (data.chemovarProfile) return data.chemovarProfile
    if (!hasReportedChemovarInput(data)) return undefined
    return buildChemovarProfile(carrierForChemovar(data, name, nameHash))
}

/**
 * Name-hash chemistry and agronomic coefficients for the grow simulation.
 * This is not a measured cultivar fact and must not be written back onto
 * the catalog record.
 */
const profileName = (name: unknown): string => (typeof name === 'string' ? name : '')

const listedTerpenes = (data: Partial<Strain>): string[] => data.dominantTerpenes ?? []

const resolveTerpenes = (
    data: Partial<Strain>,
    nameHash: number,
    typeText: StrainType,
): TerpeneProfile =>
    data.terpeneProfile ?? generateTerpeneProfile(listedTerpenes(data), nameHash, typeText)

const resolveModifiers = (data: Partial<Strain>, nameHash: number): GeneticModifiers =>
    data.geneticModifiers ?? simulatedModifiers(nameHash)

const resolveFlavonoids = (
    data: Partial<Strain>,
    terpeneProfile: TerpeneProfile,
    cannabinoidProfile: CannabinoidProfile,
    nameHash: number,
): FlavonoidProfile =>
    data.flavonoidProfile ?? estimateFlavonoidProfile(terpeneProfile, cannabinoidProfile, nameHash)

const attachChemovar = (
    profile: Omit<SimulatedStrainProfile, 'chemovarProfile'>,
    chemovarProfile: ChemovarProfile | undefined,
): SimulatedStrainProfile => (chemovarProfile ? { ...profile, chemovarProfile } : profile)

export const simulateStrainProfile = (data: Partial<Strain>): SimulatedStrainProfile => {
    const name = profileName(data.name)
    const nameHash = nameHashOf(name)
    const typeText = textOr(data.type, StrainType.Hybrid)
    const terpeneProfile = resolveTerpenes(data, nameHash, typeText)
    const cannabinoidProfile = simulatedCannabinoids(data, nameHash)
    const geneticModifiers = resolveModifiers(data, nameHash)
    return attachChemovar(
        {
            kind: SIMULATION_PROFILE_KIND,
            geneticModifiers,
            flavonoidProfile: resolveFlavonoids(data, terpeneProfile, cannabinoidProfile, nameHash),
            terpeneProfile,
            cannabinoidProfile,
        },
        simulatedChemovar(data, name, nameHash),
    )
}

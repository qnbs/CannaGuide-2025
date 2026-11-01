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

const estimateFlavonoidProfile = (
    terpeneProfile: TerpeneProfile | undefined,
    cannabinoidProfile: CannabinoidProfile | undefined,
    nameHash: number,
): FlavonoidProfile => {
    const profile: FlavonoidProfile = {}
    profile['Cannflavin A'] = 0.003 + (nameHash % 11) * 0.001
    profile['Cannflavin B'] = 0.002 + (nameHash % 8) * 0.001
    profile['Cannflavin C'] = 0.001 + (nameHash % 5) * 0.0005

    const thc = cannabinoidProfile?.THC ?? 0
    const cbd = cannabinoidProfile?.CBD ?? 0
    profile['Apigenin'] = thc > 20 ? 0.04 + (nameHash % 7) * 0.005 : 0.02 + (nameHash % 7) * 0.003
    profile['Quercetin'] = cbd > 5 ? 0.05 + (nameHash % 9) * 0.006 : 0.03 + (nameHash % 9) * 0.003
    profile['Kaempferol'] =
        cbd > 5 ? 0.025 + (nameHash % 6) * 0.004 : 0.015 + (nameHash % 6) * 0.002

    const myrcene = terpeneProfile?.Myrcene ?? 0
    profile['Luteolin'] =
        myrcene > 0.3 ? 0.03 + (nameHash % 5) * 0.004 : 0.015 + (nameHash % 5) * 0.002
    profile['Vitexin'] = 0.005 + (nameHash % 4) * 0.002
    profile['Isovitexin'] = 0.003 + (nameHash % 3) * 0.002
    profile['Catechins'] = 0.01 + (nameHash % 6) * 0.003
    profile['Orientin'] = 0.002 + (nameHash % 4) * 0.001
    profile['Silymarin'] = 0.001 + (nameHash % 3) * 0.0005
    return profile
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

const simulationCarrier = (data: Partial<Strain>, name: string, nameHash: number): Strain => ({
    id: data.id && data.id.length > 0 ? data.id : 'simulation',
    name,
    type: data.type ?? StrainType.Hybrid,
    floweringType: data.floweringType ?? 'Photoperiod',
    thc: data.thc ?? 0,
    cbd: data.cbd ?? 0,
    floweringTime: data.floweringTime ?? 0,
    agronomic: data.agronomic ?? { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
    geneticModifiers: data.geneticModifiers ?? simulatedModifiers(nameHash),
    ...(data.terpeneProfile ? { terpeneProfile: data.terpeneProfile } : {}),
    ...(data.cannabinoidProfile ? { cannabinoidProfile: data.cannabinoidProfile } : {}),
})

const carrierForChemovar = (data: Partial<Strain>, name: string, nameHash: number): Strain => {
    const carrier = simulationCarrier(data, name, nameHash)
    const cbg = finiteMeasurement(data.cbg)
    const thcv = finiteMeasurement(data.thcv)
    if (cbg !== undefined) carrier.cbg = cbg
    if (thcv !== undefined) carrier.thcv = thcv
    if (data.dominantTerpenes) carrier.dominantTerpenes = data.dominantTerpenes
    return carrier
}

const reportedCbg = (data: Partial<Strain>): number | undefined => {
    const topLevel = finiteMeasurement(data.cbg)
    if (topLevel !== undefined) return topLevel
    return finiteMeasurement(data.cannabinoidProfile?.CBG)
}

/** Any finite THC or CBD counts, including 0. CBG counts only above 2%. */
export const hasReportedChemovarInput = (data: Partial<Strain>): boolean => {
    if (finiteMeasurement(data.thc) !== undefined) return true
    if (finiteMeasurement(data.cbd) !== undefined) return true
    const cbg = reportedCbg(data)
    return cbg !== undefined && cbg > 2
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
export const simulateStrainProfile = (data: Partial<Strain>): SimulatedStrainProfile => {
    const name = typeof data.name === 'string' ? data.name : ''
    const nameHash = nameHashOf(name)
    const typeText = data.type ?? StrainType.Hybrid
    const terpeneProfile =
        data.terpeneProfile ??
        generateTerpeneProfile(data.dominantTerpenes ?? [], nameHash, typeText)
    const cannabinoidProfile = simulatedCannabinoids(data, nameHash)
    const geneticModifiers = data.geneticModifiers ?? simulatedModifiers(nameHash)
    const chemovarProfile = simulatedChemovar(data, name, nameHash)
    return {
        kind: SIMULATION_PROFILE_KIND,
        geneticModifiers,
        flavonoidProfile:
            data.flavonoidProfile ??
            estimateFlavonoidProfile(terpeneProfile, cannabinoidProfile, nameHash),
        terpeneProfile,
        cannabinoidProfile,
        ...(chemovarProfile ? { chemovarProfile } : {}),
    }
}

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
    chemovarProfile: ChemovarProfile
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

/**
 * Name-hash chemistry and agronomic coefficients for the grow simulation.
 * This is not a measured cultivar fact and must not be written back onto
 * the catalog record.
 */
export const simulateStrainProfile = (data: Partial<Strain>): SimulatedStrainProfile => {
    const name = typeof data.name === 'string' ? data.name : ''
    const nameHash = nameHashOf(name)
    const terpeneProfile =
        data.terpeneProfile ??
        generateTerpeneProfile(data.dominantTerpenes ?? [], nameHash, data.type ?? '')
    const cannabinoidProfile =
        data.cannabinoidProfile ??
        generateCannabinoidProfile(data.thc ?? 0, data.cbd ?? 0, data.cbg, data.thcv, nameHash)
    const carrier: Strain = {
        id: data.id && data.id.length > 0 ? data.id : 'simulation',
        name,
        type: data.type ?? StrainType.Hybrid,
        floweringType: data.floweringType ?? 'Photoperiod',
        thc: data.thc ?? 0,
        cbd: data.cbd ?? 0,
        floweringTime: data.floweringTime ?? 0,
        agronomic: data.agronomic ?? { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
        geneticModifiers: data.geneticModifiers ?? simulatedModifiers(nameHash),
        terpeneProfile,
        cannabinoidProfile,
    }
    return {
        kind: SIMULATION_PROFILE_KIND,
        geneticModifiers: data.geneticModifiers ?? simulatedModifiers(nameHash),
        flavonoidProfile:
            data.flavonoidProfile ??
            estimateFlavonoidProfile(terpeneProfile, cannabinoidProfile, nameHash),
        terpeneProfile,
        cannabinoidProfile,
        chemovarProfile: data.chemovarProfile ?? buildChemovarProfile(carrier),
    }
}

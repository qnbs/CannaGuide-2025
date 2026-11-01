import { describe, expect, it } from 'vitest'
import { StrainType } from '@/types'
import { createStrainObject } from '@/services/strainFactory'
import { simulateStrainProfile } from '@/services/strainSimulationProfile'

describe('createStrainObject', () => {
    it('leaves unknown chemistry, type and flowering absent', () => {
        const strain = createStrainObject({
            name: '',
            aromas: ['citrus', 42 as unknown as string],
            dominantTerpenes: [null as unknown as string],
        })

        expect(strain.id).toBeTruthy()
        expect(strain.name).toBe('Unknown Strain')
        expect(strain.type).toBeUndefined()
        expect(strain.thc).toBeUndefined()
        expect(strain.cbd).toBeUndefined()
        expect(strain.floweringTime).toBeUndefined()
        expect(strain.floweringType).toBeUndefined()
        expect(strain.agronomic).toBeUndefined()
        expect(strain.geneticModifiers).toBeUndefined()
        expect(strain.terpeneProfile).toBeUndefined()
        expect(strain.cannabinoidProfile).toBeUndefined()
        expect(strain.flavonoidProfile).toBeUndefined()
        expect(strain.chemovarProfile).toBeUndefined()
    })

    it('keeps a reported zero, a reported 9 weeks and an explicit Hybrid', () => {
        const strain = createStrainObject({
            id: 'reported-zero',
            name: 'Reported Zero',
            type: StrainType.Hybrid,
            thc: 0,
            cbd: 0,
            floweringTime: 9,
            floweringType: 'Photoperiod',
        })

        expect(strain.type).toBe(StrainType.Hybrid)
        expect(strain.thc).toBe(0)
        expect(strain.cbd).toBe(0)
        expect(strain.floweringTime).toBe(9)
        expect(strain.floweringType).toBe('Photoperiod')
        expect(strain.flavonoidProfile).toBeUndefined()
        expect(strain.geneticModifiers).toBeUndefined()
    })

    it('preserves sourced fields and reads autoflower only from reported text', () => {
        const strain = createStrainObject({
            id: 'test-strain',
            name: 'Lemon Test',
            type: StrainType.Sativa,
            thc: 18.4,
            cbd: 0.7,
            floweringTime: 10,
            typeDetails: 'Compact Autoflower Hybrid',
        })

        expect(strain.id).toBe('test-strain')
        expect(strain.name).toBe('Lemon Test')
        expect(strain.type).toBe(StrainType.Sativa)
        expect(strain.thc).toBe(18.4)
        expect(strain.cbd).toBe(0.7)
        expect(strain.floweringTime).toBe(10)
        expect(strain.floweringType).toBe('Autoflower')
        expect(strain.cannabinoidProfile).toBeUndefined()
    })

    it('does not treat a name-hash simulation as a catalog fact', () => {
        const input = {
            id: 'hash-source',
            name: 'Hash Source',
            type: StrainType.Indica,
            thc: 22,
            cbd: 1,
            floweringTime: 8,
            dominantTerpenes: ['Myrcene'],
        }
        const strain = createStrainObject(input)
        const simulated = simulateStrainProfile(input)

        expect(strain.flavonoidProfile).toBeUndefined()
        expect(strain.geneticModifiers).toBeUndefined()
        expect(simulated.kind).toBe('simulation')
        expect(simulated.chemovarProfile?.dataQuality).toBeLessThan(0.9)
        expect(simulated.flavonoidProfile['Cannflavin A']).toEqual(expect.any(Number))
        expect(simulated.geneticModifiers.pestResistance).toEqual(expect.any(Number))
        expect(input).not.toHaveProperty('flavonoidProfile')
    })

    it('classifies reported CBG with the same dominant terpenes the profile returns', () => {
        const simulated = simulateStrainProfile({
            name: 'CBG Leaf',
            thc: 0.5,
            cbd: 0.5,
            cbg: 5,
            thcv: 0.4,
            dominantTerpenes: ['Myrcene'],
        })
        expect(simulated.chemovarProfile?.chemovarType).toBe('Type IV')
        expect(simulated.cannabinoidProfile.CBG).toBe(5)
        expect(simulated.cannabinoidProfile.THCV).toBe(0.4)
        expect(simulated.chemovarProfile?.detailedTerpeneProfile.Myrcene?.percent).toBe(
            simulated.terpeneProfile.Myrcene,
        )
    })

    it('keeps reported minor cannabinoids when THC and CBD were never reported', () => {
        const simulated = simulateStrainProfile({ name: 'Minor Only', cbg: 1.2, thcv: 0.4 })
        expect(simulated.cannabinoidProfile.THC).toBeUndefined()
        expect(simulated.cannabinoidProfile.CBD).toBeUndefined()
        expect(simulated.cannabinoidProfile.CBG).toBe(1.2)
        expect(simulated.cannabinoidProfile.THCV).toBe(0.4)
        expect(simulated.chemovarProfile).toBeUndefined()
    })

    it('keeps a reported zero CBG instead of an estimated one', () => {
        const simulated = simulateStrainProfile({ name: 'Zero CBG', thc: 20, cbg: 0, thcv: 0 })
        expect(simulated.cannabinoidProfile.CBG).toBe(0)
        expect(simulated.cannabinoidProfile.THCV).toBe(0)
    })

    it('classifies CBG carried only on the cannabinoid profile', () => {
        const simulated = simulateStrainProfile({
            name: 'Profile CBG',
            cannabinoidProfile: { CBG: 5 },
        })
        expect(simulated.chemovarProfile?.chemovarType).toBe('Type IV')
    })

    it('does not classify a lone reported THC as a chemovar', () => {
        const simulated = simulateStrainProfile({ name: 'THC Only', thc: 20 })
        expect(simulated.chemovarProfile).toBeUndefined()
    })

    it('classifies THC and CBD that live only on the cannabinoid profile', () => {
        const simulated = simulateStrainProfile({
            name: 'Profile Majors',
            cannabinoidProfile: { THC: 20, CBD: 1 },
        })
        expect(simulated.chemovarProfile?.chemovarType).toBe('Type I')
        expect(simulated.chemovarProfile?.thcCbdRatio).toBe(20)
    })

    it('does not invent a Type V chemovar when THC and CBD were never reported', () => {
        const simulated = simulateStrainProfile({ id: 'unknown-chem', name: 'Unknown Chem' })
        expect(simulated.kind).toBe('simulation')
        expect(simulated.cannabinoidProfile.THC).toBeUndefined()
        expect(simulated.cannabinoidProfile.CBD).toBeUndefined()
        expect(simulated.chemovarProfile).toBeUndefined()
        expect(simulated.geneticModifiers.pestResistance).toEqual(expect.any(Number))
    })
})

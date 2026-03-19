import { describe, expect, it } from 'vitest'
import { StrainType } from '@/types'
import { createStrainObject } from '@/services/strainFactory'

describe('createStrainObject', () => {
    it('fills in required fields for malformed strain data', () => {
        const strain = createStrainObject({
            name: '',
            type: undefined,
            thc: undefined,
            cbd: undefined,
            floweringTime: undefined,
            aromas: ['citrus', 42 as unknown as string],
            dominantTerpenes: [null as unknown as string],
        })

        expect(strain.id).toBeTruthy()
        expect(strain.name).toBe('Unknown Strain')
        expect(strain.type).toBe(StrainType.Hybrid)
        expect(strain.thc).toBe(0)
        expect(strain.cbd).toBe(0)
        expect(strain.floweringTime).toBe(9)
        expect(strain.floweringType).toBe('Photoperiod')
        expect(strain.agronomic).toEqual({ difficulty: 'Medium', yield: 'Medium', height: 'Medium' })
    })

    it('preserves valid fields while inferring missing optional shape', () => {
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
        expect(strain.floweringType).toBe('Autoflower')
    })
})
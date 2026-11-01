import { describe, expect, it } from 'vitest'
import type { Strain } from '@/types'
import { StrainType } from '@/types'
import { buildStrainDraft, strainToFormValues } from './addStrainDraft'

const editing = {
    id: 'kept',
    name: 'Kept',
    type: StrainType.Sativa,
    floweringType: 'Photoperiod',
    thc: 24,
    cbd: 1,
    floweringTime: 10,
    description: 'Kept note',
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1.4,
        vpdTolerance: { min: 0.8, max: 1.4 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
} as Strain

describe('buildStrainDraft', () => {
    it('keeps a reported indoor yield when the other growing levels are blank', () => {
        const values = strainToFormValues(editing)
        const saved = buildStrainDraft(
            {
                ...values,
                difficulty: 'Easy',
                yield: '',
                height: '',
                yieldIndoor: '400 g',
            },
            editing,
        )
        expect(saved.agronomic?.difficulty).toBe('Easy')
        expect(saved.agronomic?.yield).toBeUndefined()
        expect(saved.agronomic?.height).toBeUndefined()
        expect(saved.agronomic?.yieldDetails?.indoor).toBe('400 g')
        expect(saved.description).toBe('Kept note')
        expect(saved.geneticModifiers?.pestResistance).toBe(1)
    })

    it('saves a name without inventing chemistry, type, or agronomy', () => {
        const saved = buildStrainDraft({ ...strainToFormValues({}), name: 'Only Name' }, null)
        expect(saved.name).toBe('Only Name')
        expect(saved.type).toBeUndefined()
        expect(saved.thc).toBeUndefined()
        expect(saved.cbd).toBeUndefined()
        expect(saved.floweringTime).toBeUndefined()
        expect(saved.floweringType).toBeUndefined()
        expect(saved.agronomic).toBeUndefined()
    })

    it('omits a measurement the editor cleared', () => {
        const values = strainToFormValues(editing)
        const saved = buildStrainDraft({ ...values, thc: '' }, editing)
        expect(saved.thc).toBeUndefined()
        expect(saved.cbd).toBe(1)
    })

    it('omits cbd and flowering time the editor cleared', () => {
        const values = strainToFormValues(editing)
        const saved = buildStrainDraft({ ...values, cbd: '', floweringTime: '' }, editing)
        expect(saved.cbd).toBeUndefined()
        expect(saved.floweringTime).toBeUndefined()
        expect(saved.thc).toBe(24)
    })

    it('drops a cleared yield and height while keeping difficulty', () => {
        const withAgro = {
            ...editing,
            agronomic: {
                difficulty: 'Easy' as const,
                yield: 'High' as const,
                height: 'Tall' as const,
            },
        }
        const values = strainToFormValues(withAgro)
        const saved = buildStrainDraft({ ...values, yield: '', height: '' }, withAgro)
        expect(saved.agronomic?.difficulty).toBe('Easy')
        expect(saved.agronomic?.yield).toBeUndefined()
        expect(saved.agronomic?.height).toBeUndefined()
    })

    it('does not infer Autoflower when the form leaves flowering blank', () => {
        const values = strainToFormValues(editing)
        const saved = buildStrainDraft(
            { ...values, floweringType: '', typeDetails: 'a fast autoflower' },
            editing,
        )
        expect(saved.floweringType).toBeUndefined()
        expect(saved.typeDetails).toBe('a fast autoflower')
    })
})

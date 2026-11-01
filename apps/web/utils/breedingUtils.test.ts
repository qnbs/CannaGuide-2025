import { describe, expect, it } from 'vitest'
import { StrainType, type Strain } from '@/types'
import { crossStrains } from './breedingUtils'

const parent = (overrides: Partial<Strain>): Strain =>
    ({
        id: 'parent',
        name: 'Parent Plant',
        type: StrainType.Hybrid,
        floweringType: 'Photoperiod',
        genetics: '',
        description: '',
        aromas: [],
        dominantTerpenes: [],
        agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
        geneticModifiers: {
            pestResistance: 1,
            nutrientUptakeRate: 1,
            stressTolerance: 1,
            rue: 1,
            vpdTolerance: { min: 0.4, max: 1.6 },
            transpirationFactor: 1,
            stomataSensitivity: 1,
        },
        ...overrides,
    }) as Strain

describe('crossStrains', () => {
    it('leaves chemistry unknown when either parent did not report it', () => {
        const measured = parent({
            id: 'measured',
            name: 'Measured',
            thc: 20,
            cbd: 2,
            floweringTime: 9,
        })
        const blank = parent({ id: 'blank', name: 'Blank' })
        const offspring = crossStrains(measured, blank)
        expect(offspring.thc).toBeUndefined()
        expect(offspring.cbd).toBeUndefined()
        expect(offspring.floweringTime).toBeUndefined()
    })

    it('keeps the type unknown when both parents omit it', () => {
        const left = parent({ id: 'left', name: 'Left' })
        const right = parent({ id: 'right', name: 'Right' })
        Reflect.deleteProperty(left, 'type')
        Reflect.deleteProperty(right, 'type')
        expect(crossStrains(left, right).type).toBeUndefined()
    })

    it('uses Hybrid when the parents report different types', () => {
        const left = parent({ id: 'left', name: 'Left', type: StrainType.Sativa })
        const right = parent({ id: 'right', name: 'Right' })
        Reflect.deleteProperty(right, 'type')
        expect(crossStrains(left, right).type).toBe(StrainType.Hybrid)
    })

    it('keeps an explicit zero instead of treating it as missing', () => {
        const left = parent({ id: 'left', name: 'Left', thc: 0, cbd: 0 })
        const right = parent({ id: 'right', name: 'Right', thc: 0, cbd: 0 })
        const offspring = crossStrains(left, right)
        expect(offspring.thc).toBe(0)
        expect(offspring.cbd).toBe(0)
    })

    it('omits agronomy when neither parent reports it', () => {
        const left = parent({ id: 'left', name: 'Left' })
        const right = parent({ id: 'right', name: 'Right' })
        Reflect.deleteProperty(left, 'agronomic')
        Reflect.deleteProperty(right, 'agronomic')
        expect(crossStrains(left, right).agronomic).toBeUndefined()
    })

    it('keeps the reported agronomy when the other parent has none', () => {
        const left = parent({
            id: 'left',
            name: 'Left',
            agronomic: { difficulty: 'Easy', yield: 'Low', height: 'Short' },
        })
        const right = parent({ id: 'right', name: 'Right' })
        Reflect.deleteProperty(right, 'agronomic')
        const offspring = crossStrains(left, right)
        expect(offspring.agronomic?.difficulty).toBe('Easy')
        expect(offspring.agronomic?.yield).toBe('Low')
        expect(offspring.agronomic?.height).toBe('Short')
    })

    it('keeps each reported agronomic level when another level is missing', () => {
        const left = parent({
            id: 'left',
            name: 'Left',
            agronomic: { difficulty: 'Easy', yield: 'Low', height: 'Short' },
        })
        const right = parent({ id: 'right', name: 'Right' })
        Reflect.deleteProperty(left.agronomic, 'yield')
        Reflect.deleteProperty(right, 'agronomic')
        const offspring = crossStrains(left, right)
        expect(offspring.agronomic?.difficulty).toBe('Easy')
        expect(offspring.agronomic?.yield).toBeUndefined()
        expect(offspring.agronomic?.height).toBe('Short')
    })

    it('fills a missing agronomic level from the other parent', () => {
        const left = parent({
            id: 'left',
            name: 'Left',
            agronomic: { difficulty: 'Easy', yield: 'Low', height: 'Short' },
        })
        const right = parent({
            id: 'right',
            name: 'Right',
            agronomic: { difficulty: 'Hard', yield: 'High', height: 'Tall' },
        })
        Reflect.deleteProperty(left.agronomic, 'yield')
        const offspring = crossStrains(left, right)
        expect(offspring.agronomic?.yield).toBe('High')
        expect(['Easy', 'Hard']).toContain(offspring.agronomic?.difficulty)
        expect(['Short', 'Tall']).toContain(offspring.agronomic?.height)
    })

    it('averages chemistry only when both parents reported it', () => {
        const left = parent({ id: 'left', name: 'Left', thc: 20, cbd: 2, floweringTime: 8 })
        const right = parent({ id: 'right', name: 'Right', thc: 10, cbd: 4, floweringTime: 10 })
        const offspring = crossStrains(left, right)
        expect(offspring.thc).toBeGreaterThan(10)
        expect(offspring.thc).toBeLessThan(20)
        expect(offspring.cbd).toBe(3)
        expect(offspring.floweringTime).toBeGreaterThan(8)
        expect(offspring.floweringTime).toBeLessThan(10)
    })
})

import { describe, expect, it } from 'vitest'
import type { GrowSetup } from '@/types'
import {
    activeFloweringMode,
    equipmentWithPolicy,
    holdsLongDayFlowerTransition,
    isAutoflowerGrow,
    lightHoursForMode,
    reportedFloweringMode,
    setupForConfirm,
} from './floweringMode'

const setup = { lightHours: 24 } as GrowSetup

describe('flowering mode', () => {
    it('accepts only the two reported modes', () => {
        expect(reportedFloweringMode('Photoperiod')).toBe('Photoperiod')
        expect(reportedFloweringMode('Autoflower')).toBe('Autoflower')
        expect(reportedFloweringMode(undefined)).toBeUndefined()
        expect(reportedFloweringMode('')).toBeUndefined()
    })

    it('lets a reported mode win over the grow choice', () => {
        expect(isAutoflowerGrow('Autoflower', 'Photoperiod')).toBe(true)
        expect(isAutoflowerGrow('Photoperiod', 'Autoflower')).toBe(false)
    })

    it('treats a missing mode as autoflower only after an explicit choice', () => {
        expect(isAutoflowerGrow(undefined, undefined)).toBe(false)
        expect(isAutoflowerGrow(undefined, 'Photoperiod')).toBe(false)
        expect(isAutoflowerGrow(undefined, 'Autoflower')).toBe(true)
    })

    it('holds flowering on a long day unless the grow is autoflower', () => {
        expect(holdsLongDayFlowerTransition(undefined, undefined, true, 18)).toBe(true)
        expect(holdsLongDayFlowerTransition('Photoperiod', undefined, true, 18)).toBe(true)
        expect(holdsLongDayFlowerTransition(undefined, 'Autoflower', true, 18)).toBe(false)
        expect(holdsLongDayFlowerTransition('Autoflower', undefined, true, 18)).toBe(false)
        expect(holdsLongDayFlowerTransition(undefined, undefined, true, 12)).toBe(false)
        expect(holdsLongDayFlowerTransition(undefined, undefined, false, 18)).toBe(false)
    })

    it('uses the cultivar mode before the grower choice', () => {
        expect(activeFloweringMode('Photoperiod', 'Autoflower')).toBe('Photoperiod')
        expect(activeFloweringMode(undefined, 'Autoflower')).toBe('Autoflower')
        expect(activeFloweringMode(undefined, undefined)).toBeUndefined()
    })

    it('drops a 24-hour cycle unless the mode is autoflower', () => {
        expect(lightHoursForMode(24, 'Autoflower')).toBe(24)
        expect(lightHoursForMode(24, 'Photoperiod')).toBe(18)
        expect(lightHoursForMode(24, undefined)).toBe(18)
        expect(lightHoursForMode(12, 'Photoperiod')).toBe(12)
    })

    it('refuses to start a blank mode until the grower chooses one', () => {
        expect(setupForConfirm(setup, 'Photoperiod', undefined)).toBe(setup)
        expect(setupForConfirm(setup, undefined, undefined)).toBeUndefined()
        expect(setupForConfirm(setup, undefined, 'Autoflower')?.floweringPolicy).toBe('Autoflower')
    })

    it('copies a policy onto equipment and leaves a missing policy off', () => {
        expect(equipmentWithPolicy({ potSize: 11 }, 'Photoperiod').floweringPolicy).toBe(
            'Photoperiod',
        )
        expect(equipmentWithPolicy({ potSize: 11 }, undefined)).toEqual({ potSize: 11 })
    })
})

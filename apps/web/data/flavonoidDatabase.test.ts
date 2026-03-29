/**
 * Tests for flavonoidDatabase
 */

import { describe, it, expect } from 'vitest'
import {
    FLAVONOID_DATABASE,
    ALL_FLAVONOID_NAMES,
    CANNABIS_EXCLUSIVE_FLAVONOIDS,
    EFFECT_FLAVONOIDS,
} from '@/data/flavonoidDatabase'

describe('FLAVONOID_DATABASE', () => {
    it('contains 12 flavonoids', () => {
        expect(Object.keys(FLAVONOID_DATABASE)).toHaveLength(12)
    })

    it('all entries have required fields', () => {
        for (const [name, entry] of Object.entries(FLAVONOID_DATABASE)) {
            expect(entry.name).toBe(name)
            expect(entry.subclass).toBeTruthy()
            expect(entry.formula).toBeTruthy()
            expect(entry.molecularWeight).toBeGreaterThan(0)
            expect(entry.effects).toBeInstanceOf(Array)
            expect(entry.effects.length).toBeGreaterThan(0)
        }
    })

    it('cannflavins are marked as cannabis-exclusive', () => {
        expect(FLAVONOID_DATABASE['Cannflavin A'].cannabisExclusive).toBe(true)
        expect(FLAVONOID_DATABASE['Cannflavin B'].cannabisExclusive).toBe(true)
        expect(FLAVONOID_DATABASE['Cannflavin C'].cannabisExclusive).toBe(true)
    })

    it('common flavonoids are not cannabis-exclusive', () => {
        expect(FLAVONOID_DATABASE['Quercetin'].cannabisExclusive).toBe(false)
        expect(FLAVONOID_DATABASE['Kaempferol'].cannabisExclusive).toBe(false)
    })

    it('all have valid typical ranges', () => {
        for (const entry of Object.values(FLAVONOID_DATABASE)) {
            expect(entry.typicalRange.min).toBeLessThanOrEqual(entry.typicalRange.max)
            expect(entry.typicalRange.min).toBeGreaterThanOrEqual(0)
        }
    })
})

describe('ALL_FLAVONOID_NAMES', () => {
    it('matches FLAVONOID_DATABASE keys', () => {
        expect(ALL_FLAVONOID_NAMES).toEqual(Object.keys(FLAVONOID_DATABASE))
    })
})

describe('CANNABIS_EXCLUSIVE_FLAVONOIDS', () => {
    it('contains only cannabis-exclusive entries', () => {
        for (const name of CANNABIS_EXCLUSIVE_FLAVONOIDS) {
            expect(FLAVONOID_DATABASE[name].cannabisExclusive).toBe(true)
        }
    })

    it('contains all 3 cannflavins', () => {
        expect(CANNABIS_EXCLUSIVE_FLAVONOIDS).toHaveLength(3)
    })
})

describe('EFFECT_FLAVONOIDS', () => {
    it('maps effects to flavonoid names', () => {
        expect(Object.keys(EFFECT_FLAVONOIDS).length).toBeGreaterThan(0)
        for (const names of Object.values(EFFECT_FLAVONOIDS)) {
            expect(names.length).toBeGreaterThan(0)
            for (const name of names) {
                expect(FLAVONOID_DATABASE[name]).toBeDefined()
            }
        }
    })
})

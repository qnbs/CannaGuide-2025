import { describe, it, expect } from 'vitest'
import { calculateSVP, barometricPressure, altitudeCorrectionFactor, calculateVPD, calculateDewPoint } from '@/lib/vpd/calculator'

describe('VPD Calculator', () => {
    describe('calculateSVP', () => {
        it('returns correct SVP at 0°C (~0.611 kPa)', () => {
            const svp = calculateSVP(0)
            expect(svp).toBeCloseTo(0.611, 2)
        })

        it('returns correct SVP at 20°C (~2.338 kPa)', () => {
            const svp = calculateSVP(20)
            expect(svp).toBeCloseTo(2.338, 1)
        })

        it('returns correct SVP at 25°C (~3.167 kPa)', () => {
            const svp = calculateSVP(25)
            expect(svp).toBeCloseTo(3.167, 1)
        })

        it('returns correct SVP at 30°C (~4.243 kPa)', () => {
            const svp = calculateSVP(30)
            expect(svp).toBeCloseTo(4.243, 1)
        })

        it('increases monotonically with temperature', () => {
            const temps = [-10, 0, 10, 20, 30, 40]
            const svps = temps.map(calculateSVP)
            for (let i = 1; i < svps.length; i++) {
                expect(svps[i]!).toBeGreaterThan(svps[i - 1]!)
            }
        })
    })

    describe('barometricPressure', () => {
        it('returns standard 101.325 kPa at sea level', () => {
            expect(barometricPressure(0)).toBe(101.325)
        })

        it('returns 101.325 kPa for negative altitudes', () => {
            expect(barometricPressure(-100)).toBe(101.325)
        })

        it('returns ~89.87 kPa at 1000m', () => {
            const p = barometricPressure(1000)
            expect(p).toBeCloseTo(89.87, 0)
        })

        it('returns ~79.5 kPa at 2000m', () => {
            const p = barometricPressure(2000)
            expect(p).toBeCloseTo(79.5, 0)
        })

        it('decreases with increasing altitude', () => {
            const altitudes = [0, 500, 1000, 2000, 3000]
            const pressures = altitudes.map(barometricPressure)
            for (let i = 1; i < pressures.length; i++) {
                expect(pressures[i]!).toBeLessThan(pressures[i - 1]!)
            }
        })
    })

    describe('altitudeCorrectionFactor', () => {
        it('returns 1 at sea level', () => {
            expect(altitudeCorrectionFactor(0)).toBe(1)
        })

        it('returns 1 for negative altitudes', () => {
            expect(altitudeCorrectionFactor(-500)).toBe(1)
        })

        it('returns >1 at altitude (VPD has stronger effect)', () => {
            expect(altitudeCorrectionFactor(1000)).toBeGreaterThan(1)
            expect(altitudeCorrectionFactor(2000)).toBeGreaterThan(1)
        })

        it('returns ~1.27 at 2000m', () => {
            const factor = altitudeCorrectionFactor(2000)
            expect(factor).toBeCloseTo(1.27, 1)
        })
    })

    describe('calculateVPD', () => {
        it('returns 0 at 100% humidity', () => {
            const vpd = calculateVPD(25, 100)
            expect(vpd).toBeCloseTo(0, 5)
        })

        it('returns SVP at 0% humidity (no offset, sea level)', () => {
            const vpd = calculateVPD(25, 0)
            const svp = calculateSVP(25)
            expect(vpd).toBeCloseTo(svp, 5)
        })

        it('returns typical grow-room VPD at 25°C/60%RH', () => {
            const vpd = calculateVPD(25, 60)
            // Expected: SVP(25) * (1 - 0.6) ≈ 3.167 * 0.4 ≈ 1.27
            expect(vpd).toBeCloseTo(1.27, 1)
        })

        it('applies leaf temperature offset correctly', () => {
            const vpdNoOffset = calculateVPD(25, 60, 0)
            const vpdCoolerLeaf = calculateVPD(25, 60, -2)
            // Cooler leaf → lower SVP → lower VPD
            expect(vpdCoolerLeaf).toBeLessThan(vpdNoOffset)
        })

        it('applies altitude correction', () => {
            const vpdSeaLevel = calculateVPD(25, 60, 0, 0)
            const vpdHighAlt = calculateVPD(25, 60, 0, 2000)
            expect(vpdHighAlt).toBeGreaterThan(vpdSeaLevel)
        })

        it('clamps humidity to 0-100 range', () => {
            const vpdOverHundred = calculateVPD(25, 150)
            const vpdHundred = calculateVPD(25, 100)
            expect(vpdOverHundred).toBeCloseTo(vpdHundred, 5)

            const vpdNegative = calculateVPD(25, -50)
            const vpdZero = calculateVPD(25, 0)
            expect(vpdNegative).toBeCloseTo(vpdZero, 5)
        })
    })

    describe('calculateDewPoint', () => {
        it('returns air temp when RH is 100%', () => {
            const dp = calculateDewPoint(25, 100)
            expect(dp).toBeCloseTo(25, 0)
        })

        it('returns dew point below air temp for RH < 100%', () => {
            const dp = calculateDewPoint(25, 60)
            expect(dp).toBeLessThan(25)
            expect(dp).toBeCloseTo(16.7, 0)
        })

        it('returns lower dew point for lower humidity', () => {
            const dp60 = calculateDewPoint(25, 60)
            const dp40 = calculateDewPoint(25, 40)
            expect(dp40).toBeLessThan(dp60)
        })

        it('handles near-zero humidity without errors', () => {
            const dp = calculateDewPoint(25, 1)
            expect(dp).toBeLessThan(-20)
            expect(Number.isFinite(dp)).toBe(true)
        })
    })
})

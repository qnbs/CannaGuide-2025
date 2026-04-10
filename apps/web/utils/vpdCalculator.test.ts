import { describe, it, expect } from 'vitest'
import {
    calculateSVP,
    getDynamicLeafOffset,
    getTargetVPD,
    getVPDStatus,
    estimateTranspiration,
    calculateVPD,
    runDailySimulation,
} from './vpdCalculator'

describe('vpdCalculator', () => {
    describe('calculateSVP', () => {
        it('returns correct SVP for 25C', () => {
            const svp = calculateSVP(25)
            expect(svp).toBeCloseTo(3.167, 2)
        })

        it('returns correct SVP for 20C', () => {
            const svp = calculateSVP(20)
            expect(svp).toBeCloseTo(2.338, 2)
        })

        it('returns correct SVP for 30C', () => {
            const svp = calculateSVP(30)
            expect(svp).toBeCloseTo(4.243, 2)
        })

        it('returns positive value for reasonable temperatures', () => {
            for (let t = 10; t <= 40; t += 5) {
                expect(calculateSVP(t)).toBeGreaterThan(0)
            }
        })

        it('SVP increases with temperature', () => {
            const svp20 = calculateSVP(20)
            const svp25 = calculateSVP(25)
            const svp30 = calculateSVP(30)
            expect(svp25).toBeGreaterThan(svp20)
            expect(svp30).toBeGreaterThan(svp25)
        })
    })

    describe('getDynamicLeafOffset', () => {
        it('returns -1.0 when light is off', () => {
            expect(getDynamicLeafOffset(25, false)).toBe(-1.0)
        })

        it('returns 1.8 for hot temps (>28C) with light on', () => {
            expect(getDynamicLeafOffset(30, true)).toBe(1.8)
        })

        it('returns 3.0 for cool temps (<22C) with light on', () => {
            expect(getDynamicLeafOffset(20, true)).toBe(3.0)
        })

        it('returns 2.3 for moderate temps with light on', () => {
            expect(getDynamicLeafOffset(25, true)).toBe(2.3)
        })

        it('boundary at 22C returns moderate offset', () => {
            expect(getDynamicLeafOffset(22, true)).toBe(2.3)
        })

        it('boundary at 28C returns moderate offset', () => {
            expect(getDynamicLeafOffset(28, true)).toBe(2.3)
        })
    })

    describe('getTargetVPD', () => {
        it('returns 0.6 for seedling', () => {
            expect(getTargetVPD('seedling')).toBe(0.6)
        })

        it('returns 1.0 for vegetative', () => {
            expect(getTargetVPD('vegetative')).toBe(1.0)
        })

        it('returns 1.2 for earlyFlower', () => {
            expect(getTargetVPD('earlyFlower')).toBe(1.2)
        })

        it('returns 1.45 for lateFlower', () => {
            expect(getTargetVPD('lateFlower')).toBe(1.45)
        })
    })

    describe('getVPDStatus', () => {
        it('returns optimal when close to target', () => {
            expect(getVPDStatus(1.0, 1.0)).toBe('optimal')
            expect(getVPDStatus(1.1, 1.0)).toBe('optimal')
            expect(getVPDStatus(0.9, 1.0)).toBe('optimal')
        })

        it('returns danger when VPD too low (<0.4)', () => {
            expect(getVPDStatus(0.3, 1.0)).toBe('danger')
        })

        it('returns danger when VPD too high (>1.9)', () => {
            expect(getVPDStatus(2.0, 1.0)).toBe('danger')
        })

        it('returns low when below target', () => {
            expect(getVPDStatus(0.75, 1.0)).toBe('low')
        })

        it('returns high when above target', () => {
            expect(getVPDStatus(1.5, 1.0)).toBe('high')
        })

        it('returns danger when diff is large negative', () => {
            expect(getVPDStatus(0.4, 1.2)).toBe('danger')
        })
    })

    describe('estimateTranspiration', () => {
        it('returns positive value for positive VPD', () => {
            expect(estimateTranspiration(1.0, 'soil')).toBeGreaterThan(0)
        })

        it('hydro gives highest transpiration', () => {
            const hydro = estimateTranspiration(1.0, 'hydro')
            const coco = estimateTranspiration(1.0, 'coco')
            const soil = estimateTranspiration(1.0, 'soil')
            expect(hydro).toBeGreaterThan(coco)
            expect(coco).toBeGreaterThan(soil)
        })

        it('soil base is vpd * 0.18', () => {
            expect(estimateTranspiration(1.0, 'soil')).toBe(0.18)
        })

        it('returns 0 for zero VPD', () => {
            expect(estimateTranspiration(0, 'soil')).toBe(0)
        })
    })

    describe('calculateVPD', () => {
        it('returns a positive number for standard inputs', () => {
            const vpd = calculateVPD({
                airTemp: 25,
                rh: 60,
                phase: 'vegetative',
                medium: 'soil',
                airflow: 'medium',
                lightOn: true,
            })
            expect(vpd).toBeGreaterThan(0)
        })

        it('applies medium multiplier', () => {
            const base = {
                airTemp: 25,
                rh: 60,
                phase: 'vegetative' as const,
                airflow: 'medium' as const,
                lightOn: true,
            }
            const soil = calculateVPD({ ...base, medium: 'soil' })
            const hydro = calculateVPD({ ...base, medium: 'hydro' })
            expect(hydro).toBeGreaterThan(soil)
        })

        it('applies airflow multiplier', () => {
            const base = {
                airTemp: 25,
                rh: 60,
                phase: 'vegetative' as const,
                medium: 'soil' as const,
                lightOn: true,
            }
            const low = calculateVPD({ ...base, airflow: 'low' })
            const high = calculateVPD({ ...base, airflow: 'high' })
            expect(high).toBeGreaterThan(low)
        })

        it('uses custom leafTempOffset when provided', () => {
            const base = {
                airTemp: 25,
                rh: 60,
                phase: 'vegetative' as const,
                medium: 'soil' as const,
                airflow: 'medium' as const,
                lightOn: true,
            }
            const withOffset = calculateVPD({ ...base, leafTempOffset: 5 })
            const withoutOffset = calculateVPD(base)
            expect(withOffset).not.toBe(withoutOffset)
        })
    })

    describe('runDailySimulation', () => {
        const baseInput = {
            phase: 'vegetative' as const,
            medium: 'soil' as const,
            airflow: 'medium' as const,
        }
        const tempProfile = Array.from({ length: 24 }, () => 25)
        const rhProfile = Array.from({ length: 24 }, () => 60)

        it('returns 24 data points', () => {
            const result = runDailySimulation(baseInput, tempProfile, rhProfile)
            expect(result).toHaveLength(24)
        })

        it('each point has required fields', () => {
            const result = runDailySimulation(baseInput, tempProfile, rhProfile)
            for (const point of result) {
                expect(point.hour).toBeGreaterThanOrEqual(0)
                expect(point.hour).toBeLessThan(24)
                expect(point.airTemp).toBeDefined()
                expect(point.rh).toBeDefined()
                expect(point.leafTemp).toBeDefined()
                expect(point.vpd).toBeGreaterThan(0)
                expect(point.targetVPD).toBeGreaterThan(0)
                expect(point.status).toBeTruthy()
                expect(point.transpiration).toBeGreaterThanOrEqual(0)
            }
        })

        it('hours are sequential 0-23', () => {
            const result = runDailySimulation(baseInput, tempProfile, rhProfile)
            result.forEach((point, index) => {
                expect(point.hour).toBe(index)
            })
        })

        it('light is on from hour 6 to 17', () => {
            const result = runDailySimulation(baseInput, tempProfile, rhProfile)
            const lightOnPoints = result.filter((p) => p.hour >= 6 && p.hour < 18)
            const lightOffPoints = result.filter((p) => p.hour < 6 || p.hour >= 18)
            // Light-on leaf temps should be higher (positive offset)
            for (const on of lightOnPoints) {
                expect(on.leafTemp).toBeGreaterThan(25)
            }
            // Light-off leaf temps should be lower (negative offset)
            for (const off of lightOffPoints) {
                expect(off.leafTemp).toBeLessThan(25)
            }
        })

        it('uses default values for missing temp/rh profile entries', () => {
            const shortTemp = [20, 22]
            const shortRh = [50, 55]
            const result = runDailySimulation(baseInput, shortTemp, shortRh)
            expect(result).toHaveLength(24)
            // Hour 0 uses profile value
            expect(result[0]?.airTemp).toBe(20)
            // Hour 5 uses default 25
            expect(result[5]?.airTemp).toBe(25)
        })
    })
})

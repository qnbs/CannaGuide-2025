import { describe, it, expect } from 'vitest'
import {
    calculateCo2,
    calculateHumidityDeficit,
    calculateLightHanging,
    svpBuck,
    svpToAhSat,
    Co2InputSchema,
    HumidityDeficitInputSchema,
    LightHangingInputSchema,
    HD_OPTIMAL_RANGES,
    LIGHT_EFFICIENCY,
} from '@/services/equipmentCalculatorService'

// ---------------------------------------------------------------------------
// CO2 Calculator
// ---------------------------------------------------------------------------

describe('CO2 Calculator', () => {
    describe('Co2InputSchema', () => {
        it('accepts valid inputs', () => {
            const result = Co2InputSchema.safeParse({
                roomVolume: 4,
                currentPpm: 400,
                targetPpm: 1200,
                ach: 1,
            })
            expect(result.success).toBe(true)
        })

        it('rejects negative room volume', () => {
            const result = Co2InputSchema.safeParse({
                roomVolume: -1,
                currentPpm: 400,
                targetPpm: 1200,
                ach: 1,
            })
            expect(result.success).toBe(false)
        })

        it('rejects ppm below 300', () => {
            const result = Co2InputSchema.safeParse({
                roomVolume: 4,
                currentPpm: 100,
                targetPpm: 1200,
                ach: 1,
            })
            expect(result.success).toBe(false)
        })
    })

    describe('calculateCo2', () => {
        it('calculates correct initial boost for 1 m3 room, 400->1200 ppm', () => {
            const result = calculateCo2({
                roomVolume: 1,
                currentPpm: 400,
                targetPpm: 1200,
                ach: 0,
            })
            // (1200 - 400) * 1 * 0.001 = 0.8 L
            expect(result.initialBoostLiters).toBeCloseTo(0.8, 1)
        })

        it('maintenance rate is zero when ACH is zero', () => {
            const result = calculateCo2({
                roomVolume: 4,
                currentPpm: 400,
                targetPpm: 1200,
                ach: 0,
            })
            expect(result.maintenanceRatePerHour).toBe(0)
        })

        it('maintenance rate scales linearly with ACH', () => {
            const r1 = calculateCo2({ roomVolume: 1, currentPpm: 400, targetPpm: 1200, ach: 1 })
            const r2 = calculateCo2({ roomVolume: 1, currentPpm: 400, targetPpm: 1200, ach: 2 })
            expect(r2.maintenanceRatePerHour).toBeCloseTo(r1.maintenanceRatePerHour * 2, 1)
        })

        it('maintenance rate uses ambient 400 ppm as baseline, not current ppm', () => {
            // At 800 ppm target, ACH 1, 1 m3: (800-400)*1*0.001 = 0.4 L/h
            const result = calculateCo2({
                roomVolume: 1,
                currentPpm: 800,
                targetPpm: 800,
                ach: 1,
            })
            expect(result.maintenanceRatePerHour).toBeCloseTo(0.4, 1)
        })

        it('initial boost is zero when target equals current', () => {
            const result = calculateCo2({
                roomVolume: 4,
                currentPpm: 1200,
                targetPpm: 1200,
                ach: 1,
            })
            expect(result.initialBoostLiters).toBe(0)
        })

        it('CO2 weight ~1.96x liters at STP', () => {
            const result = calculateCo2({
                roomVolume: 1,
                currentPpm: 400,
                targetPpm: 1400,
                ach: 0,
            })
            // boost = 1.0 L, weight = 1.96 g
            expect(result.initialBoostGrams).toBeCloseTo(result.initialBoostLiters * 1.96, 0)
        })

        it('status is ambient when target is at ambient level', () => {
            const result = calculateCo2({
                roomVolume: 4,
                currentPpm: 400,
                targetPpm: 420,
                ach: 0,
            })
            expect(result.status).toBe('ambient')
        })

        it('status is enrichment for typical cultivation target', () => {
            const result = calculateCo2({
                roomVolume: 4,
                currentPpm: 400,
                targetPpm: 1200,
                ach: 1,
            })
            expect(result.status).toBe('enrichment')
        })

        it('status is excess above 2000 ppm', () => {
            const result = calculateCo2({
                roomVolume: 4,
                currentPpm: 400,
                targetPpm: 2500,
                ach: 1,
            })
            expect(result.status).toBe('excess')
        })

        it('boost scales linearly with room volume', () => {
            const r1 = calculateCo2({ roomVolume: 1, currentPpm: 400, targetPpm: 1000, ach: 0 })
            const r2 = calculateCo2({ roomVolume: 2, currentPpm: 400, targetPpm: 1000, ach: 0 })
            expect(r2.initialBoostLiters).toBeCloseTo(r1.initialBoostLiters * 2, 1)
        })
    })
})

// ---------------------------------------------------------------------------
// Humidity Deficit Calculator
// ---------------------------------------------------------------------------

describe('Humidity Deficit Calculator', () => {
    describe('svpBuck', () => {
        it('returns correct SVP at 0 degC (~0.611 kPa)', () => {
            expect(svpBuck(0)).toBeCloseTo(0.611, 2)
        })

        it('returns correct SVP at 25 degC (~3.167 kPa)', () => {
            expect(svpBuck(25)).toBeCloseTo(3.167, 1)
        })

        it('increases monotonically with temperature', () => {
            const svps = [0, 10, 20, 30].map(svpBuck)
            for (let i = 1; i < svps.length; i++) {
                expect(svps[i]!).toBeGreaterThan(svps[i - 1]!)
            }
        })
    })

    describe('svpToAhSat', () => {
        it('returns positive values for valid inputs', () => {
            const ah = svpToAhSat(3.167, 25)
            expect(ah).toBeGreaterThan(0)
        })

        it('AH saturation increases with temperature at constant SVP/T ratio', () => {
            // Higher temp -> close to ~17.3 g/m3 at 20degC
            const ah20 = svpToAhSat(svpBuck(20), 20)
            expect(ah20).toBeCloseTo(17.3, 0)
        })
    })

    describe('HumidityDeficitInputSchema', () => {
        it('accepts valid inputs', () => {
            const result = HumidityDeficitInputSchema.safeParse({ tempC: 25, rhPercent: 60 })
            expect(result.success).toBe(true)
        })

        it('rejects RH above 100', () => {
            const result = HumidityDeficitInputSchema.safeParse({ tempC: 25, rhPercent: 101 })
            expect(result.success).toBe(false)
        })

        it('rejects temp below -10', () => {
            const result = HumidityDeficitInputSchema.safeParse({ tempC: -15, rhPercent: 60 })
            expect(result.success).toBe(false)
        })
    })

    describe('calculateHumidityDeficit', () => {
        it('HD is zero at 100% RH', () => {
            const result = calculateHumidityDeficit({ tempC: 25, rhPercent: 100 })
            expect(result.hd).toBeCloseTo(0, 1)
        })

        it('HD equals AH saturation at 0% RH', () => {
            const result = calculateHumidityDeficit({ tempC: 25, rhPercent: 0 })
            // Zod clamps min RH to 1 but direct call allowed
            expect(result.hd).toBeCloseTo(result.ahSat, 0)
        })

        it('HD is positive for typical conditions (25degC, 60% RH)', () => {
            const result = calculateHumidityDeficit({ tempC: 25, rhPercent: 60 })
            expect(result.hd).toBeGreaterThan(0)
        })

        it('HD increases as RH decreases', () => {
            const r60 = calculateHumidityDeficit({ tempC: 25, rhPercent: 60 })
            const r40 = calculateHumidityDeficit({ tempC: 25, rhPercent: 40 })
            expect(r40.hd).toBeGreaterThan(r60.hd)
        })

        it('returns status optimal for typical veg conditions (25degC, 65% RH)', () => {
            const result = calculateHumidityDeficit({ tempC: 25, rhPercent: 65 }, 'vegetative')
            // HD ~~ 8 g/m3 at 25degC/65%RH, optimal range 5-10
            expect(result.status).toBe('optimal')
        })

        it('returns status low when HD is below range minimum', () => {
            // 25degC, 98% RH -> HD very low
            const result = calculateHumidityDeficit({ tempC: 25, rhPercent: 98 }, 'vegetative')
            expect(result.status).toBe('low')
        })

        it('optimal ranges are defined for all stages', () => {
            const stages = ['seedling', 'vegetative', 'earlyFlower', 'lateFlower'] as const
            stages.forEach((s) => {
                expect(HD_OPTIMAL_RANGES[s].min).toBeGreaterThan(0)
                expect(HD_OPTIMAL_RANGES[s].max).toBeGreaterThan(HD_OPTIMAL_RANGES[s].min)
            })
        })

        it('late flower has stricter (lower) optimal range than seedling', () => {
            expect(HD_OPTIMAL_RANGES.lateFlower.max).toBeLessThan(HD_OPTIMAL_RANGES.seedling.max)
        })
    })
})

// ---------------------------------------------------------------------------
// Light Hanging Height Calculator
// ---------------------------------------------------------------------------

describe('Light Hanging Height Calculator', () => {
    describe('LightHangingInputSchema', () => {
        it('accepts valid inputs', () => {
            const result = LightHangingInputSchema.safeParse({
                wattage: 400,
                lightType: 'led',
                targetPpfd: 600,
            })
            expect(result.success).toBe(true)
        })

        it('rejects negative wattage', () => {
            const result = LightHangingInputSchema.safeParse({
                wattage: -100,
                lightType: 'led',
                targetPpfd: 600,
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid light type', () => {
            const result = LightHangingInputSchema.safeParse({
                wattage: 400,
                lightType: 'oled',
                targetPpfd: 600,
            })
            expect(result.success).toBe(false)
        })
    })

    describe('LIGHT_EFFICIENCY', () => {
        it('LED has highest efficiency', () => {
            expect(LIGHT_EFFICIENCY.led).toBeGreaterThan(LIGHT_EFFICIENCY.hps)
            expect(LIGHT_EFFICIENCY.led).toBeGreaterThan(LIGHT_EFFICIENCY.cmh)
            expect(LIGHT_EFFICIENCY.led).toBeGreaterThan(LIGHT_EFFICIENCY.t5)
        })

        it('T5 has lowest efficiency', () => {
            expect(LIGHT_EFFICIENCY.t5).toBeLessThan(LIGHT_EFFICIENCY.hps)
        })
    })

    describe('calculateLightHanging', () => {
        it('returns positive heights for valid input', () => {
            const result = calculateLightHanging({
                wattage: 400,
                lightType: 'led',
                targetPpfd: 600,
            })
            expect(result.recommendedCm).toBeGreaterThan(0)
            expect(result.minCm).toBeGreaterThan(0)
            expect(result.maxCm).toBeGreaterThan(result.recommendedCm)
        })

        it('min height is always at least 15 cm', () => {
            const result = calculateLightHanging({
                wattage: 50,
                lightType: 't5',
                targetPpfd: 200,
            })
            expect(result.minCm).toBeGreaterThanOrEqual(15)
        })

        it('higher target PPFD requires closer hanging distance (lower recommended cm)', () => {
            const rLow = calculateLightHanging({ wattage: 400, lightType: 'led', targetPpfd: 300 })
            const rHigh = calculateLightHanging({ wattage: 400, lightType: 'led', targetPpfd: 900 })
            expect(rHigh.recommendedCm).toBeLessThan(rLow.recommendedCm)
        })

        it('higher wattage allows greater hanging distance at same PPFD', () => {
            const r400 = calculateLightHanging({ wattage: 400, lightType: 'led', targetPpfd: 600 })
            const r800 = calculateLightHanging({ wattage: 800, lightType: 'led', targetPpfd: 600 })
            expect(r800.recommendedCm).toBeGreaterThan(r400.recommendedCm)
        })

        it('DLI at 18h is positive', () => {
            const result = calculateLightHanging({
                wattage: 400,
                lightType: 'led',
                targetPpfd: 600,
            })
            expect(result.dli18h).toBeGreaterThan(0)
        })

        it('HPS recommended height is less than LED at same wattage/target (lower efficiency)', () => {
            const rLed = calculateLightHanging({ wattage: 400, lightType: 'led', targetPpfd: 600 })
            const rHps = calculateLightHanging({ wattage: 400, lightType: 'hps', targetPpfd: 600 })
            expect(rHps.recommendedCm).toBeLessThan(rLed.recommendedCm)
        })
    })
})

// ---------------------------------------------------------------------------
// Timer Schedule Calculator
// ---------------------------------------------------------------------------

import {
    calculateTimerSchedule,
    TimerScheduleInputSchema,
} from '@/services/equipmentCalculatorService'

describe('Timer Schedule Calculator', () => {
    describe('TimerScheduleInputSchema', () => {
        it('accepts valid seedling input', () => {
            expect(TimerScheduleInputSchema.safeParse({ growthStage: 'seedling' }).success).toBe(
                true,
            )
        })

        it('accepts DLI-driven input', () => {
            expect(
                TimerScheduleInputSchema.safeParse({
                    growthStage: 'veg',
                    targetDliMolPerM2: 30,
                    ppfd: 600,
                }).success,
            ).toBe(true)
        })

        it('rejects invalid growth stage', () => {
            expect(TimerScheduleInputSchema.safeParse({ growthStage: 'clone' }).success).toBe(false)
        })

        it('rejects targetDli above 80', () => {
            expect(
                TimerScheduleInputSchema.safeParse({
                    growthStage: 'veg',
                    targetDliMolPerM2: 90,
                }).success,
            ).toBe(false)
        })
    })

    describe('calculateTimerSchedule', () => {
        it('veg stage defaults to 18/6', () => {
            const result = calculateTimerSchedule({ growthStage: 'veg' })
            expect(result.onHours).toBe(18)
            expect(result.offHours).toBe(6)
        })

        it('flower stage defaults to 12/12', () => {
            const result = calculateTimerSchedule({ growthStage: 'flower' })
            expect(result.onHours).toBe(12)
            expect(result.offHours).toBe(12)
        })

        it('autoflower stage defaults to 20/4', () => {
            const result = calculateTimerSchedule({ growthStage: 'autoflower' })
            expect(result.onHours).toBe(20)
            expect(result.offHours).toBe(4)
        })

        it('seedling stage defaults to 18/6', () => {
            const result = calculateTimerSchedule({ growthStage: 'seedling' })
            expect(result.onHours).toBe(18)
            expect(result.offHours).toBe(6)
        })

        it('onHours + offHours always equals 24', () => {
            const stages: Array<'seedling' | 'veg' | 'flower' | 'autoflower'> = [
                'seedling',
                'veg',
                'flower',
                'autoflower',
            ]
            stages.forEach((stage) => {
                const result = calculateTimerSchedule({ growthStage: stage })
                expect(result.onHours + result.offHours).toBe(24)
            })
        })

        it('DLI is null when ppfd is not provided', () => {
            const result = calculateTimerSchedule({ growthStage: 'veg' })
            expect(result.dli).toBeNull()
            expect(result.dliStatus).toBe('unknown')
        })

        it('computes DLI correctly from ppfd and onHours', () => {
            // 600 umol/m2/s * 18h * 3600s / 1e6 = 38.88 mol/m2/day
            const result = calculateTimerSchedule({ growthStage: 'veg', ppfd: 600 })
            expect(result.dli).toBeCloseTo(38.88, 0)
        })

        it('dliStatus is optimal for veg stage at 600 PPFD / 18h', () => {
            const result = calculateTimerSchedule({ growthStage: 'veg', ppfd: 600 })
            // DLI ~38.88 is within veg optimal range 20-40
            expect(result.dliStatus).toBe('optimal')
        })

        it('dliStatus is low for low PPFD veg', () => {
            // 100 umol/m2/s * 18h * 3600s / 1e6 = 6.48 mol/m2/day < min 20
            const result = calculateTimerSchedule({ growthStage: 'veg', ppfd: 100 })
            expect(result.dliStatus).toBe('low')
        })

        it('DLI-driven mode: overrides default onHours', () => {
            // Target 30 mol/m2/day at 600 PPFD:
            // onHours = 30 * 1e6 / (600 * 3600) = 13.9 -> 14 hours
            const result = calculateTimerSchedule({
                growthStage: 'flower',
                targetDliMolPerM2: 30,
                ppfd: 600,
            })
            expect(result.onHours).toBe(14)
            expect(result.offHours).toBe(10)
        })

        it('DLI-driven mode: clamps onHours to [1, 24]', () => {
            // Extremely high target DLI
            const result = calculateTimerSchedule({
                growthStage: 'veg',
                targetDliMolPerM2: 80,
                ppfd: 100,
            })
            expect(result.onHours).toBeLessThanOrEqual(24)
            expect(result.onHours).toBeGreaterThanOrEqual(1)
        })

        it('schedule string includes on/off hours', () => {
            const result = calculateTimerSchedule({ growthStage: 'flower' })
            expect(result.schedule).toContain('12')
            expect(result.schedule).toMatch(/\d+h on/)
        })

        it('recommendedDliRange is provided for each stage', () => {
            const result = calculateTimerSchedule({ growthStage: 'flower' })
            expect(result.recommendedDliRange.min).toBeGreaterThan(0)
            expect(result.recommendedDliRange.max).toBeGreaterThan(result.recommendedDliRange.min)
        })
    })
})

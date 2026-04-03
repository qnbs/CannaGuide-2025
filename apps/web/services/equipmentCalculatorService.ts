/**
 * Equipment Calculator Service
 *
 * Pure formula functions for the Equipment Calculator Suite.
 * All functions are stateless, offline-first, and deterministic.
 *
 * Formulas:
 *   CO2:            Based on volumetric ppm enrichment + ACH steady-state model
 *   Humidity Deficit: Buck (1981) SVP formula + absolute humidity derivation
 *   Light Hanging Height: Inverse-square-law with light-type efficiency coefficients
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Zod input schemas
// ---------------------------------------------------------------------------

export const Co2InputSchema = z.object({
    roomVolume: z.number().positive().max(1000),
    currentPpm: z.number().min(300).max(5000),
    targetPpm: z.number().min(400).max(5000),
    ach: z.number().min(0).max(60),
})
export type Co2Input = z.infer<typeof Co2InputSchema>

export const HumidityDeficitInputSchema = z.object({
    tempC: z.number().min(-10).max(50),
    rhPercent: z.number().min(1).max(100),
})
export type HumidityDeficitInput = z.infer<typeof HumidityDeficitInputSchema>

export const LightHangingInputSchema = z.object({
    wattage: z.number().positive().max(10000),
    lightType: z.enum(['led', 'hps', 'cmh', 't5']),
    targetPpfd: z.number().min(50).max(2000),
})
export type LightHangingInput = z.infer<typeof LightHangingInputSchema>

// ---------------------------------------------------------------------------
// CO2 Calculator
// ---------------------------------------------------------------------------

export interface Co2Result {
    /** One-time volume (L) to boost room from current to target ppm */
    initialBoostLiters: number
    /** Volume (L/h) to maintain target ppm against ventilation losses */
    maintenanceRatePerHour: number
    /** Approximate weight (g) of CO2 for initial boost (density ~1.96 g/L at STP) */
    initialBoostGrams: number
    /** Status label */
    status: 'enrichment' | 'ambient' | 'excess'
}

/** Density of CO2 at STP (g/L) */
const CO2_DENSITY_G_PER_L = 1.96
/** Ambient CO2 level (ppm) */
const AMBIENT_CO2_PPM = 400

export function calculateCo2(input: Co2Input): Co2Result {
    const { roomVolume, currentPpm, targetPpm, ach } = input

    // 1 ppm by volume = 0.001 L of gas per m3 of air
    const initialBoostLiters = Math.max(0, (targetPpm - currentPpm) * roomVolume * 0.001)
    // Steady-state: ventilation continuously replaces room air with ambient air
    // Loss rate = room_volume * ACH * (target - ambient) * 0.001 L/h
    const maintenanceRatePerHour = Math.max(
        0,
        roomVolume * ach * (targetPpm - AMBIENT_CO2_PPM) * 0.001,
    )
    const initialBoostGrams = initialBoostLiters * CO2_DENSITY_G_PER_L

    let status: Co2Result['status']
    if (targetPpm <= AMBIENT_CO2_PPM + 50) {
        status = 'ambient'
    } else if (targetPpm > 2000) {
        status = 'excess'
    } else {
        status = 'enrichment'
    }

    return {
        initialBoostLiters: Math.round(initialBoostLiters * 10) / 10,
        maintenanceRatePerHour: Math.round(maintenanceRatePerHour * 10) / 10,
        initialBoostGrams: Math.round(initialBoostGrams),
        status,
    }
}

// ---------------------------------------------------------------------------
// Humidity Deficit Calculator
// ---------------------------------------------------------------------------

export type HdGrowthStage = 'seedling' | 'vegetative' | 'earlyFlower' | 'lateFlower'

export interface HdStageRange {
    min: number
    max: number
}

/** Optimal HD ranges (g/m3) per growth stage */
export const HD_OPTIMAL_RANGES: Record<HdGrowthStage, HdStageRange> = {
    seedling: { min: 5, max: 10 },
    vegetative: { min: 5, max: 10 },
    earlyFlower: { min: 4, max: 8 },
    lateFlower: { min: 3, max: 6 },
}

export interface HumidityDeficitResult {
    /** Absolute humidity at saturation (g/m3) */
    ahSat: number
    /** Actual absolute humidity (g/m3) */
    ahActual: number
    /** Humidity Deficit = ahSat - ahActual (g/m3) */
    hd: number
    /** Saturation vapor pressure (kPa) */
    svpKpa: number
    status: 'low' | 'optimal' | 'high'
    optimalRange: HdStageRange
}

/**
 * Saturation Vapor Pressure (kPa) using Buck (1981) enhanced formula.
 * Shared with lib/vpd/calculator.ts but kept local to avoid circular imports.
 */
export function svpBuck(tempC: number): number {
    return 0.61121 * Math.exp(((18.678 - tempC / 234.5) * tempC) / (257.14 + tempC))
}

/**
 * Convert SVP (kPa) to absolute humidity at saturation (g/m3).
 * Ideal gas law: AH = SVP_Pa * M_water / (R * T_K)
 */
export function svpToAhSat(svpKpa: number, tempC: number): number {
    const M_WATER = 18.015 // g/mol
    const R = 8.314 // J/(mol*K)
    const tK = tempC + 273.15
    return (svpKpa * 1000 * M_WATER) / (R * tK)
}

export function calculateHumidityDeficit(
    input: HumidityDeficitInput,
    stage: HdGrowthStage = 'vegetative',
): HumidityDeficitResult {
    const { tempC, rhPercent } = input
    const svpKpa = svpBuck(tempC)
    const ahSat = svpToAhSat(svpKpa, tempC)
    const ahActual = ahSat * (rhPercent / 100)
    const hd = ahSat - ahActual
    const range = HD_OPTIMAL_RANGES[stage]

    let status: HumidityDeficitResult['status']
    if (hd < range.min) {
        status = 'low'
    } else if (hd > range.max) {
        status = 'high'
    } else {
        status = 'optimal'
    }

    return {
        ahSat: Math.round(ahSat * 10) / 10,
        ahActual: Math.round(ahActual * 10) / 10,
        hd: Math.round(hd * 10) / 10,
        svpKpa: Math.round(svpKpa * 1000) / 1000,
        status,
        optimalRange: range,
    }
}

// ---------------------------------------------------------------------------
// Light Hanging Height Calculator
// ---------------------------------------------------------------------------

export type LightType = 'led' | 'hps' | 'cmh' | 't5'

/**
 * Effective PPFD efficiency coefficients (umol/s per W) at 60 cm reference distance.
 * Based on typical manufacturer data for modern grow lights.
 */
export const LIGHT_EFFICIENCY: Record<LightType, number> = {
    led: 2.8,
    hps: 1.4,
    cmh: 1.9,
    t5: 0.8,
}

export interface LightHangingResult {
    /** Recommended distance (cm) from canopy */
    recommendedCm: number
    /** Minimum safe distance (cm) -- 20% below recommended */
    minCm: number
    /** Maximum distance (cm) for target PPFD -- 30% above recommended */
    maxCm: number
    /** Actual PPFD (umol/m2/s) at recommended distance over 1 m2 */
    ppfdAtRecommended: number
    /** DLI (mol/m2/day) at recommended distance, assuming 18h photoperiod */
    dli18h: number
    status: 'close' | 'optimal' | 'far'
}

/**
 * Inverse-square-law model to derive optimal hanging height.
 * PPFD(d) ~ W * eff / d^2  (arbitrary area coefficient absorbed into eff)
 * d_opt = sqrt(W * eff / targetPPFD) * REF_FACTOR
 */
const REF_FACTOR = 0.18 // calibration constant so formula yields real-world cm values

export function calculateLightHanging(input: LightHangingInput): LightHangingResult {
    const { wattage, lightType, targetPpfd } = input
    const eff = LIGHT_EFFICIENCY[lightType]

    // d_opt in cm
    const recommendedCm = Math.round(Math.sqrt((wattage * eff) / targetPpfd) * REF_FACTOR * 100)
    const minCm = Math.max(15, Math.round(recommendedCm * 0.8))
    const maxCm = Math.round(recommendedCm * 1.3)

    // Reverse: actual PPFD at recommended distance
    const ppfdAtRecommended = Math.round(
        (wattage * eff) / Math.pow(recommendedCm / (REF_FACTOR * 100), 2),
    )

    // DLI = PPFD * photoperiod_hours * 3600 / 1e6
    const dli18h = Math.round(((ppfdAtRecommended * 18 * 3600) / 1e6) * 10) / 10

    let status: LightHangingResult['status']
    if (recommendedCm < 25) {
        status = 'close'
    } else if (recommendedCm > 80) {
        status = 'far'
    } else {
        status = 'optimal'
    }

    return { recommendedCm, minCm, maxCm, ppfdAtRecommended, dli18h, status }
}

// ---------------------------------------------------------------------------
// Timer Schedule Calculator
// ---------------------------------------------------------------------------

export type TimerGrowthStage = 'seedling' | 'veg' | 'flower' | 'autoflower'

export const TimerScheduleInputSchema = z.object({
    growthStage: z.enum(['seedling', 'veg', 'flower', 'autoflower']),
    /** Optional DLI target (mol/m2/day) -- when combined with ppfd, computes optimal on-hours */
    targetDliMolPerM2: z.number().min(1).max(80).optional(),
    /** PPFD at canopy (umol/m2/s) -- required for DLI-driven calculation */
    ppfd: z.number().min(50).max(2000).optional(),
})

export type TimerScheduleInput = z.infer<typeof TimerScheduleInputSchema>

/** Stage-default schedules (onHours, offHours, recommendedDliMin, recommendedDliMax) */
export const STAGE_DEFAULTS: Record<
    TimerGrowthStage,
    { onHours: number; offHours: number; dliMin: number; dliMax: number }
> = {
    seedling: { onHours: 18, offHours: 6, dliMin: 10, dliMax: 20 },
    veg: { onHours: 18, offHours: 6, dliMin: 20, dliMax: 40 },
    flower: { onHours: 12, offHours: 12, dliMin: 30, dliMax: 55 },
    autoflower: { onHours: 20, offHours: 4, dliMin: 25, dliMax: 45 },
}

export interface TimerScheduleResult {
    /** Light-on hours per day */
    onHours: number
    /** Dark hours per day */
    offHours: number
    /** Computed DLI at given PPFD, or null if PPFD not provided */
    dli: number | null
    /** Human-readable schedule string, e.g. "18/6 (18h on / 6h off)" */
    schedule: string
    /** Whether DLI falls within the stage-optimal range */
    dliStatus: 'low' | 'optimal' | 'high' | 'unknown'
    /** Recommended DLI range for the given growth stage */
    recommendedDliRange: { min: number; max: number }
}

export function calculateTimerSchedule(input: TimerScheduleInput): TimerScheduleResult {
    const validated = TimerScheduleInputSchema.parse(input)
    const { growthStage, targetDliMolPerM2, ppfd } = validated

    const stageDefaults = STAGE_DEFAULTS[growthStage]
    let onHours = stageDefaults.onHours
    let offHours = stageDefaults.offHours

    // DLI-driven override when both arguments are provided
    if (targetDliMolPerM2 !== undefined && ppfd !== undefined && ppfd > 0) {
        // Solve: DLI = PPFD * onHours * 3600 / 1_000_000
        //   =>  onHours = DLI * 1_000_000 / (PPFD * 3600)
        const computed = Math.round((targetDliMolPerM2 * 1_000_000) / (ppfd * 3600))
        onHours = Math.min(24, Math.max(1, computed))
        offHours = 24 - onHours
    }

    const dli =
        ppfd !== undefined ? Math.round(((ppfd * onHours * 3600) / 1_000_000) * 100) / 100 : null

    const schedule = `${onHours}/${offHours} (${onHours}h on / ${offHours}h off)`

    let dliStatus: TimerScheduleResult['dliStatus']
    if (dli === null) {
        dliStatus = 'unknown'
    } else if (dli < stageDefaults.dliMin) {
        dliStatus = 'low'
    } else if (dli > stageDefaults.dliMax) {
        dliStatus = 'high'
    } else {
        dliStatus = 'optimal'
    }

    return {
        onHours,
        offHours,
        dli,
        schedule,
        dliStatus,
        recommendedDliRange: { min: stageDefaults.dliMin, max: stageDefaults.dliMax },
    }
}

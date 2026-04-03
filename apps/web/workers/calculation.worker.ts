/// <reference lib="webworker" />
/**
 * Calculation Worker -- offloads 7-day simulation curves from the main thread.
 *
 * Protocol: WorkerBus (messageId-correlated request/response)
 *
 * Supported commands:
 *   SIMULATE_VPD          -- 7-day VPD curve from base temp + humidity + day/night offsets
 *   SIMULATE_TRANSPIRATION -- 7-day transpiration curve (Penman-Monteith) from VPD + gs + LAI
 *   SIMULATE_EC_DRIFT      -- 7-day EC and pH drift projection (OLS extrapolation)
 *   SIMULATE_LIGHT_SPECTRUM -- 7-day DLI curve from PPFD + photoperiod schedule
 */

import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'

// ---------------------------------------------------------------------------
// Security: trusted-origin guard
// ---------------------------------------------------------------------------

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean =>
    !event.origin || event.origin === self.location.origin

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

export interface SimulateVpdPayload {
    /** Base air temperature (Celsius) */
    baseTemp: number
    /** Base relative humidity (%) */
    baseHumidity: number
    /** Leaf temperature offset (Celsius, optional) */
    leafOffset?: number
    /** Temperature variation over 7 days (+/- per day, e.g. for seasonal trend) */
    tempDrift?: number
    /** Humidity variation over 7 days (+/- per day) */
    humidityDrift?: number
}

export interface SimulateTranspirationPayload {
    vpd: number
    gsmmol: number
    lai: number
    hoursPerDay: number
    /** Optional: VPD drift per day to simulate changing conditions */
    vpdDrift?: number
    /** Optional: gs drift per day */
    gsDrift?: number
}

export interface SimulateEcDriftPayload {
    /** Starting EC (mS/cm) */
    startEcMs: number
    /** Starting pH */
    startPh: number
    /** EC drift per day (e.g. -0.05 = slight nutrient uptake) */
    ecDriftPerDay?: number
    /** pH drift per day from OLS slope or user input */
    phDriftPerDay: number
    /** TDS scale for output (500 | 640 | 700) */
    tdsScale?: 500 | 640 | 700
}

export interface SimulateLightSpectrumPayload {
    ppfd: number
    redPercent: number
    bluePercent: number
    hoursPerDay: number
    /** PPFD drift per day (e.g. +20 = ramping up light) */
    ppfdDrift?: number
}

export interface DayPoint {
    day: number
    value: number
}

export interface VpdSimulationResult {
    vpdCurve: DayPoint[]
    statusCurve: Array<{ day: number; status: 'low' | 'ok' | 'high' }>
}

export interface TranspirationSimulationResult {
    leafCurve: DayPoint[]
    canopyCurve: DayPoint[]
    dailyWaterCurve: DayPoint[]
}

export interface EcDriftSimulationResult {
    ecCurve: DayPoint[]
    phCurve: DayPoint[]
    tdsCurve: DayPoint[]
}

export interface LightSpectrumSimulationResult {
    dliCurve: DayPoint[]
    efficiencyCurve: DayPoint[]
}

// ---------------------------------------------------------------------------
// Helper: saturated vapor pressure (Magnus formula)
// ---------------------------------------------------------------------------

function svp(tempC: number): number {
    return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3))
}

function computeVpd(tempC: number, rh: number, leafOffset: number): number {
    const leafTemp = tempC - leafOffset
    const vpd = svp(leafTemp) - (rh / 100) * svp(tempC)
    return Math.max(0, Math.round(vpd * 1000) / 1000)
}

function vpdStatus(vpd: number): 'low' | 'ok' | 'high' {
    if (vpd < 0.4) return 'low'
    if (vpd > 1.6) return 'high'
    return 'ok'
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function simulateVpd(payload: SimulateVpdPayload): VpdSimulationResult {
    const { baseTemp, baseHumidity, leafOffset = 2, tempDrift = 0, humidityDrift = 0 } = payload
    const vpdCurve: DayPoint[] = []
    const statusCurve: Array<{ day: number; status: 'low' | 'ok' | 'high' }> = []

    for (let day = 0; day < 7; day++) {
        const temp = Math.max(10, Math.min(45, baseTemp + tempDrift * day))
        const rh = Math.max(10, Math.min(99, baseHumidity + humidityDrift * day))
        const vpd = computeVpd(temp, rh, leafOffset)
        vpdCurve.push({ day, value: vpd })
        statusCurve.push({ day, status: vpdStatus(vpd) })
    }

    return { vpdCurve, statusCurve }
}

function simulateTranspiration(
    payload: SimulateTranspirationPayload,
): TranspirationSimulationResult {
    const { vpd, gsmmol, lai, hoursPerDay, vpdDrift = 0, gsDrift = 0 } = payload
    const leafCurve: DayPoint[] = []
    const canopyCurve: DayPoint[] = []
    const dailyWaterCurve: DayPoint[] = []

    for (let day = 0; day < 7; day++) {
        const dayVpd = Math.max(0, Math.min(5, vpd + vpdDrift * day))
        const dayGs = Math.max(0, Math.min(1000, gsmmol + gsDrift * day))
        const leafRate = Math.round(((dayGs * dayVpd) / 101.3) * 100) / 100
        const canopyRate = Math.round(leafRate * lai * 100) / 100
        const dailyWater = Math.round((canopyRate * 18.015 * 3.6 * hoursPerDay) / 1000)
        leafCurve.push({ day, value: leafRate })
        canopyCurve.push({ day, value: canopyRate })
        dailyWaterCurve.push({ day, value: dailyWater })
    }

    return { leafCurve, canopyCurve, dailyWaterCurve }
}

function simulateEcDrift(payload: SimulateEcDriftPayload): EcDriftSimulationResult {
    const { startEcMs, startPh, ecDriftPerDay = 0, phDriftPerDay, tdsScale = 500 } = payload
    const ecCurve: DayPoint[] = []
    const phCurve: DayPoint[] = []
    const tdsCurve: DayPoint[] = []

    for (let day = 0; day < 7; day++) {
        const ec = Math.max(0, Math.round((startEcMs + ecDriftPerDay * day) * 1000) / 1000)
        const ph = Math.max(
            0,
            Math.min(14, Math.round((startPh + phDriftPerDay * day) * 100) / 100),
        )
        const tds = Math.round(ec * tdsScale)
        ecCurve.push({ day, value: ec })
        phCurve.push({ day, value: ph })
        tdsCurve.push({ day, value: tds })
    }

    return { ecCurve, phCurve, tdsCurve }
}

function simulateLightSpectrum(
    payload: SimulateLightSpectrumPayload,
): LightSpectrumSimulationResult {
    const { ppfd, redPercent, bluePercent, hoursPerDay, ppfdDrift = 0 } = payload
    const dliCurve: DayPoint[] = []
    const efficiencyCurve: DayPoint[] = []

    // Veg optimal ratio = 3:1
    const optimalRatio = 3
    const currentRatio = bluePercent > 0 ? redPercent / bluePercent : 99
    const ratioFit = Math.max(0, 1 - Math.abs(Math.log(currentRatio / optimalRatio)) / 3)

    for (let day = 0; day < 7; day++) {
        const dayPpfd = Math.max(0, Math.min(2500, ppfd + ppfdDrift * day))
        const dli = Math.round(((dayPpfd * hoursPerDay * 3600) / 1_000_000) * 100) / 100
        const ppfdFactor = dayPpfd / (dayPpfd + 500)
        const efficiency = Math.round(ratioFit * ppfdFactor * 100)
        dliCurve.push({ day, value: dli })
        efficiencyCurve.push({ day, value: efficiency })
    }

    return { dliCurve, efficiencyCurve }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

self.onmessage = (
    e: MessageEvent<
        WorkerRequest<
            | SimulateVpdPayload
            | SimulateTranspirationPayload
            | SimulateEcDriftPayload
            | SimulateLightSpectrumPayload
        >
    >,
) => {
    if (!isTrustedWorkerMessage(e)) return

    const { messageId, type, payload } = e.data

    try {
        if (type === 'SIMULATE_VPD') {
            self.postMessage(workerOk(messageId, simulateVpd(payload as SimulateVpdPayload)))
            return
        }
        if (type === 'SIMULATE_TRANSPIRATION') {
            self.postMessage(
                workerOk(messageId, simulateTranspiration(payload as SimulateTranspirationPayload)),
            )
            return
        }
        if (type === 'SIMULATE_EC_DRIFT') {
            self.postMessage(
                workerOk(messageId, simulateEcDrift(payload as SimulateEcDriftPayload)),
            )
            return
        }
        if (type === 'SIMULATE_LIGHT_SPECTRUM') {
            self.postMessage(
                workerOk(messageId, simulateLightSpectrum(payload as SimulateLightSpectrumPayload)),
            )
            return
        }
        self.postMessage(workerErr(messageId, `Unknown command: ${type}`))
    } catch (error) {
        self.postMessage(
            workerErr(
                messageId,
                error instanceof Error ? error.message : 'Calculation worker error',
            ),
        )
    }
}

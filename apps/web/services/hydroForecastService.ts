/**
 * Hydro Forecast Service
 *
 * Provides next-hour pH/EC/Temp predictions using either:
 *   1. ONNX stub model (via hydroForecastWorker) -- when model is loaded
 *   2. Weighted moving average fallback           -- always available
 *
 * Public API:
 *   - forecastNextHour(readings)  -> Promise<HydroForecast>
 *   - initForecastModel()         -> Promise<void>
 *   - isModelReady()              -> boolean
 *
 * Security: Model URL is hardcoded. isLocalOnlyMode() guard on fetch.
 */

import type { HydroReading, HydroForecast, HydroForecastTrend } from '@/types'
import { workerBus } from '@/services/workerBus'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { captureLocalAiError } from '@/services/sentryService'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKER_NAME = 'hydroForecast'
const MODEL_PATH = '/models/hydro_forecast_stub.onnx'
const WINDOW = 24
const FEATURES = 3
const INPUT_SIZE = WINDOW * FEATURES
const MIN_READINGS = 3

// Cannabis hydroponic safe ranges
const SAFE_PH_MIN = 5.5
const SAFE_PH_MAX = 6.5
const SAFE_EC_MIN = 0.5
const SAFE_EC_MAX = 3.0
const SAFE_TEMP_MIN = 18
const SAFE_TEMP_MAX = 24

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _modelReady = false
let _initPromise: Promise<void> | null = null

// ---------------------------------------------------------------------------
// Worker registration (W-06: delegated to WorkerPool auto-spawn)
// ---------------------------------------------------------------------------

/** No-op -- W-06 WorkerPool auto-spawns on first dispatch. */
function ensureWorkerRegistered(): void {
    // Retained for call-site compatibility within this module.
}

// ---------------------------------------------------------------------------
// Model initialisation
// ---------------------------------------------------------------------------

/**
 * Fetch the ONNX stub model and send it to the worker.
 * Safe to call multiple times -- only the first call triggers download.
 */
export async function initForecastModel(): Promise<void> {
    if (_modelReady) return
    if (_initPromise) return _initPromise

    _initPromise = (async () => {
        if (isLocalOnlyMode()) {
            console.debug('[hydroForecast] Skipped model fetch -- local-only mode')
            return
        }

        try {
            ensureWorkerRegistered()

            const baseUrl = import.meta.env.BASE_URL || '/'
            const url = `${baseUrl}${MODEL_PATH.startsWith('/') ? MODEL_PATH.slice(1) : MODEL_PATH}`
            const res = await fetch(url)
            if (!res.ok) {
                throw new Error(`Model fetch failed: ${String(res.status)}`)
            }
            const buffer = await res.arrayBuffer()

            await workerBus.dispatch(
                WORKER_NAME,
                'INIT',
                { modelBuffer: buffer },
                {
                    timeoutMs: 30_000,
                },
            )

            _modelReady = true
            console.debug('[hydroForecast] ONNX model loaded successfully')
        } catch (err) {
            captureLocalAiError(err, {
                stage: 'hydro-forecast',
                backend: 'wasm',
                consumer: 'hydroForecastService.initForecastModel',
            })
            console.debug('[hydroForecast] Model init failed, using fallback')
            _initPromise = null
        }
    })()

    return _initPromise
}

/** Synchronous check whether the ONNX model is loaded and ready. */
export function isModelReady(): boolean {
    return _modelReady
}

// ---------------------------------------------------------------------------
// Readings -> Float32Array conversion
// ---------------------------------------------------------------------------

function readingsToInput(readings: HydroReading[]): Float32Array {
    // Take last WINDOW readings (or fewer), arrange as [t0_ph, t0_ec, t0_temp, ...]
    const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp)
    const slice = sorted.slice(-WINDOW)

    const input = new Float32Array(INPUT_SIZE)
    // Fill from the END so most-recent data is at the end of the array
    const offset = WINDOW - slice.length
    for (let i = 0; i < slice.length; i++) {
        const r = slice[i]
        if (r) {
            input[(offset + i) * FEATURES] = r.ph
            input[(offset + i) * FEATURES + 1] = r.ec
            input[(offset + i) * FEATURES + 2] = r.waterTemp
        }
    }

    return input
}

// ---------------------------------------------------------------------------
// Trend detection
// ---------------------------------------------------------------------------

function detectTrend(readings: HydroReading[]): HydroForecastTrend {
    if (readings.length < MIN_READINGS) return 'stable'

    const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp)
    const half = Math.floor(sorted.length / 2)

    const firstHalf = sorted.slice(0, half)
    const secondHalf = sorted.slice(half)

    const avg = (arr: HydroReading[], key: 'ph' | 'ec' | 'waterTemp'): number => {
        if (arr.length === 0) return 0
        return arr.reduce((sum, r) => sum + r[key], 0) / arr.length
    }

    const latest = sorted[sorted.length - 1]
    if (latest) {
        // Critical: pH or EC out of safe range
        if (
            latest.ph < SAFE_PH_MIN - 0.5 ||
            latest.ph > SAFE_PH_MAX + 0.5 ||
            latest.ec > SAFE_EC_MAX + 1.0 ||
            latest.waterTemp < SAFE_TEMP_MIN - 3 ||
            latest.waterTemp > SAFE_TEMP_MAX + 3
        ) {
            return 'critical'
        }
    }

    const phDelta = avg(secondHalf, 'ph') - avg(firstHalf, 'ph')
    const ecDelta = avg(secondHalf, 'ec') - avg(firstHalf, 'ec')
    const tempDelta = avg(secondHalf, 'waterTemp') - avg(firstHalf, 'waterTemp')

    // Significant change thresholds
    const PH_THRESHOLD = 0.15
    const EC_THRESHOLD = 0.2
    const TEMP_THRESHOLD = 1.0

    const risingCount =
        (phDelta > PH_THRESHOLD ? 1 : 0) +
        (ecDelta > EC_THRESHOLD ? 1 : 0) +
        (tempDelta > TEMP_THRESHOLD ? 1 : 0)

    const fallingCount =
        (phDelta < -PH_THRESHOLD ? 1 : 0) +
        (ecDelta < -EC_THRESHOLD ? 1 : 0) +
        (tempDelta < -TEMP_THRESHOLD ? 1 : 0)

    if (risingCount >= 2) return 'rising'
    if (fallingCount >= 2) return 'falling'
    if (risingCount >= 1 || fallingCount >= 1) {
        // Mixed or single metric change
        return Math.abs(phDelta) > PH_THRESHOLD ? (phDelta > 0 ? 'rising' : 'falling') : 'stable'
    }

    return 'stable'
}

// ---------------------------------------------------------------------------
// Alert generation
// ---------------------------------------------------------------------------

function generateAlerts(
    predicted: { ph: number; ec: number; temp: number },
    trend: HydroForecastTrend,
): string[] {
    const alerts: string[] = []

    if (predicted.ph < SAFE_PH_MIN) alerts.push('phFalling')
    if (predicted.ph > SAFE_PH_MAX) alerts.push('phRising')
    if (predicted.ec < SAFE_EC_MIN) alerts.push('ecFalling')
    if (predicted.ec > SAFE_EC_MAX) alerts.push('ecRising')
    if (predicted.temp < SAFE_TEMP_MIN) alerts.push('tempFalling')
    if (predicted.temp > SAFE_TEMP_MAX) alerts.push('tempRising')

    if (trend === 'critical' && alerts.length === 0) {
        alerts.push('critical')
    }

    return alerts
}

// ---------------------------------------------------------------------------
// Moving-average fallback (main-thread, no worker needed)
// ---------------------------------------------------------------------------

function movingAverageFallback(readings: HydroReading[]): { ph: number; ec: number; temp: number } {
    const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp)
    const slice = sorted.slice(-WINDOW)

    const alpha = 0.1
    let phSum = 0
    let ecSum = 0
    let tempSum = 0
    let weightSum = 0

    for (let t = 0; t < slice.length; t++) {
        const w = Math.exp(alpha * t)
        const r = slice[t]
        if (r) {
            phSum += r.ph * w
            ecSum += r.ec * w
            tempSum += r.waterTemp * w
            weightSum += w
        }
    }

    if (weightSum === 0) {
        return { ph: 6.0, ec: 1.6, temp: 21.0 }
    }

    return {
        ph: phSum / weightSum,
        ec: ecSum / weightSum,
        temp: tempSum / weightSum,
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Predict the next-hour pH, EC, and temperature values.
 *
 * Attempts ONNX inference via worker if model is loaded.
 * Falls back to weighted moving average otherwise.
 *
 * Requires at least MIN_READINGS readings for meaningful results.
 */
export async function forecastNextHour(readings: HydroReading[]): Promise<HydroForecast> {
    const trend = detectTrend(readings)

    if (readings.length < MIN_READINGS) {
        const defaults = { ph: 6.0, ec: 1.6, temp: 21.0 }
        return {
            nextHour: defaults,
            trend: 'stable',
            confidence: 0,
            alerts: [],
            modelBased: false,
        }
    }

    // Try worker-based forecast (ONNX or worker-side moving average)
    if (workerBus.has(WORKER_NAME)) {
        try {
            const input = readingsToInput(readings)
            const result = await workerBus.dispatch<{
                ph: number
                ec: number
                temp: number
                modelBased: boolean
            }>(WORKER_NAME, 'FORECAST', { input }, { timeoutMs: 10_000 })

            const nextHour = {
                ph: result.ph,
                ec: result.ec,
                temp: result.temp,
            }
            const alerts = generateAlerts(nextHour, trend)
            const confidence = result.modelBased ? 0.7 : 0.4

            return {
                nextHour,
                trend,
                confidence,
                alerts,
                modelBased: result.modelBased,
            }
        } catch (err) {
            captureLocalAiError(err, {
                stage: 'hydro-forecast',
                backend: 'wasm',
                consumer: 'hydroForecastService.forecastNextHour',
            })
            // Fall through to main-thread fallback
        }
    }

    // Main-thread moving average fallback
    const fallback = movingAverageFallback(readings)
    const alerts = generateAlerts(fallback, trend)

    return {
        nextHour: fallback,
        trend,
        confidence: 0.3,
        alerts,
        modelBased: false,
    }
}

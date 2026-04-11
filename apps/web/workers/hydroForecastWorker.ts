/// <reference lib="webworker" />

/**
 * Hydro Forecast Web Worker
 *
 * Runs lightweight ONNX inference for pH/EC/Temp next-hour prediction.
 * Falls back to weighted moving average when no model is loaded.
 *
 * Protocol: WorkerBus (messageId-correlated request/response)
 *
 * Messages:
 *   INIT      { modelBuffer: ArrayBuffer }  -- initialise InferenceSession
 *   FORECAST  { input: Float32Array }        -- predict from 24h history [72 floats]
 *   TERMINATE {}                             -- release session
 */

import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'
import { initAbortHandler } from '@/utils/workerAbort'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InitPayload {
    modelBuffer: ArrayBuffer
}

interface ForecastPayload {
    input: Float32Array
}

interface ForecastResult {
    ph: number
    ec: number
    temp: number
    modelBased: boolean
}

type OrtModule = typeof import('onnxruntime-web')
type InferenceSession = Awaited<ReturnType<OrtModule['InferenceSession']['create']>>

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WINDOW = 24
const FEATURES = 3
const INPUT_SIZE = WINDOW * FEATURES

// Safe ranges for cannabis hydroponics
const PH_MIN = 4.0
const PH_MAX = 9.0
const EC_MIN = 0.0
const EC_MAX = 6.0
const TEMP_MIN = 10.0
const TEMP_MAX = 35.0

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let session: InferenceSession | null = null

// ---------------------------------------------------------------------------
// Fallback: Weighted moving average
// ---------------------------------------------------------------------------

function weightedMovingAverage(input: Float32Array): ForecastResult {
    // input is [24 * 3] = 72 floats (t0_ph, t0_ec, t0_temp, t1_ph, ...)
    // Exponentially weight more recent readings higher
    const alpha = 0.1
    let phSum = 0
    let ecSum = 0
    let tempSum = 0
    let weightSum = 0

    const count = Math.min(Math.floor(input.length / FEATURES), WINDOW)
    for (let t = 0; t < count; t++) {
        const w = Math.exp(alpha * t)
        const ph = input[t * FEATURES] ?? 0
        const ec = input[t * FEATURES + 1] ?? 0
        const temp = input[t * FEATURES + 2] ?? 0
        phSum += ph * w
        ecSum += ec * w
        tempSum += temp * w
        weightSum += w
    }

    if (weightSum === 0) {
        return { ph: 6.0, ec: 1.6, temp: 21.0, modelBased: false }
    }

    return {
        ph: clamp(phSum / weightSum, PH_MIN, PH_MAX),
        ec: clamp(ecSum / weightSum, EC_MIN, EC_MAX),
        temp: clamp(tempSum / weightSum, TEMP_MIN, TEMP_MAX),
        modelBased: false,
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

// ---------------------------------------------------------------------------
// Origin guard (same as visionInferenceWorker)
// ---------------------------------------------------------------------------

const isTrustedWorkerMessage = (e: MessageEvent): boolean =>
    !e.origin || e.origin === self.location.origin

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
    if (!isTrustedWorkerMessage(e)) return

    const { messageId, type, payload } = e.data

    // ---- INIT ---------------------------------------------------------------
    if (type === 'INIT') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const p = payload as InitPayload | undefined
        if (!p?.modelBuffer || !(p.modelBuffer instanceof ArrayBuffer)) {
            self.postMessage(workerErr(messageId, 'INIT requires modelBuffer: ArrayBuffer'))
            return
        }
        try {
            const ort = await import('onnxruntime-web')
            ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/'
            session = await ort.InferenceSession.create(p.modelBuffer, {
                executionProviders: ['wasm'],
            })
            self.postMessage(workerOk(messageId, { status: 'ready' }))
        } catch (err) {
            session = null
            self.postMessage(
                workerErr(messageId, err instanceof Error ? err.message : 'INIT failed'),
            )
        }
        return
    }

    // ---- FORECAST -----------------------------------------------------------
    if (type === 'FORECAST') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const p = payload as ForecastPayload | undefined
        if (!p?.input) {
            // No input -- return sensible defaults via fallback
            self.postMessage(
                workerOk(messageId, { ph: 6.0, ec: 1.6, temp: 21.0, modelBased: false }),
            )
            return
        }

        // Pad or truncate to INPUT_SIZE
        let inputData: Float32Array
        if (p.input.length >= INPUT_SIZE) {
            inputData = p.input.slice(p.input.length - INPUT_SIZE)
        } else {
            inputData = new Float32Array(INPUT_SIZE)
            inputData.set(p.input, INPUT_SIZE - p.input.length)
        }

        // Try ONNX inference if session loaded
        if (session) {
            try {
                const ort = await import('onnxruntime-web')
                const t0 = performance.now()

                // Reshape flat [72] to [1, 24, 3]
                const tensor = new ort.Tensor('float32', inputData, [1, WINDOW, FEATURES])
                const feeds: Record<string, InstanceType<OrtModule['Tensor']>> = { input: tensor }
                const results = await session.run(feeds)

                const outputKey = Object.keys(results)[0]
                if (!outputKey) throw new Error('No output from session.run()')
                const output = results[outputKey]
                if (!output) throw new Error('Empty output from session.run()')

                let data: Float32Array
                if (output.data instanceof Float32Array) {
                    data = output.data
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    const raw = output.data as ArrayLike<number>
                    data = new Float32Array(raw.length)
                    for (let i = 0; i < raw.length; i++) {
                        data[i] = raw[i] ?? 0
                    }
                }

                const latencyMs = Math.round(performance.now() - t0)
                void latencyMs // Available for telemetry if needed

                const result: ForecastResult = {
                    ph: clamp(data[0] ?? 6.0, PH_MIN, PH_MAX),
                    ec: clamp(data[1] ?? 1.6, EC_MIN, EC_MAX),
                    temp: clamp(data[2] ?? 21.0, TEMP_MIN, TEMP_MAX),
                    modelBased: true,
                }
                self.postMessage(workerOk(messageId, result))
                return
            } catch {
                // Fall through to moving average
            }
        }

        // Fallback: weighted moving average
        self.postMessage(workerOk(messageId, weightedMovingAverage(inputData)))
        return
    }

    // ---- TERMINATE ----------------------------------------------------------
    if (type === 'TERMINATE') {
        if (session) {
            try {
                await session.release()
            } catch {
                // Ignore release errors
            }
            session = null
        }
        self.postMessage(workerOk(messageId, { status: 'terminated' }))
        return
    }

    self.postMessage(workerErr(messageId, `Unknown message type: ${String(type)}`))
}

// W-02.1: Install cooperative abort handler (must be after self.onmessage)
initAbortHandler()

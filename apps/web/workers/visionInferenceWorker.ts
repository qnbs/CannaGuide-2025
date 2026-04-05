/// <reference lib="webworker" />

/**
 * Vision Inference Web Worker
 *
 * Executes PlantVillage MobileNetV2 ONNX inference off the main thread.
 * The model is loaded from a pre-fetched ArrayBuffer (zero-copy Transferable).
 * WASM runtime files are served from jsDelivr CDN.
 *
 * Protocol: WorkerBus (messageId-correlated request/response)
 *
 * Messages:
 *   INIT     { modelBuffer: ArrayBuffer }  -- initialise InferenceSession
 *   CLASSIFY { imageData: { data: Uint8ClampedArray; width: number; height: number } }
 *   TERMINATE {}                           -- release session
 */

import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InitPayload {
    modelBuffer: ArrayBuffer
}

interface ImageDataLike {
    data: Uint8ClampedArray
    width: number
    height: number
}

interface ClassifyPayload {
    imageData: ImageDataLike
}

export interface VisionClassifyResult {
    label: string
    confidence: number
    top5: Array<{ label: string; confidence: number }>
    latencyMs: number
}

type OrtModule = typeof import('onnxruntime-web')
type InferenceSession = Awaited<ReturnType<OrtModule['InferenceSession']['create']>>

// ---------------------------------------------------------------------------
// PlantVillage class labels (38 classes)
// ---------------------------------------------------------------------------

const PLANT_VILLAGE_LABELS: readonly string[] = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Blueberry___healthy',
    'Cherry_(including_sour)___Powdery_mildew',
    'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight',
    'Corn_(maize)___healthy',
    'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot',
    'Peach___healthy',
    'Pepper__bell___Bacterial_spot',
    'Pepper__bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Raspberry___healthy',
    'Soybean___healthy',
    'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch',
    'Strawberry___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy',
]

// ---------------------------------------------------------------------------
// Cannabis mapping table
// Maps PlantVillage labels to cannabis-relevant terminology.
// Unmapped labels: strip class prefix ("Tomato___") and replace underscores.
// ---------------------------------------------------------------------------

const CANNABIS_MAP: Readonly<Record<string, string>> = {
    'Tomato___Spider_mites Two-spotted_spider_mite': 'spider_mites',
    Tomato___Tomato_mosaic_virus: 'mosaic_virus',
    Tomato___Leaf_Mold: 'leaf_mold',
    Tomato___Late_blight: 'late_blight',
    Tomato___Bacterial_spot: 'bacterial_spot',
    Tomato___Early_blight: 'early_blight',
    Tomato___Septoria_leaf_spot: 'septoria_leaf_spot',
    Tomato___Target_Spot: 'target_spot',
    Tomato___Tomato_Yellow_Leaf_Curl_Virus: 'leaf_curl_virus',
    Tomato___healthy: 'healthy',
    Pepper__bell___Bacterial_spot: 'bacterial_spot',
    Pepper__bell___healthy: 'healthy',
    Potato___Early_blight: 'early_blight',
    Potato___Late_blight: 'late_blight',
    Potato___healthy: 'healthy',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': 'leaf_blight',
    'Grape___Esca_(Black_Measles)': 'fungal_infection',
    Grape___Black_rot: 'fungal_infection',
    Grape___healthy: 'healthy',
    Apple___Apple_scab: 'fungal_infection',
    Apple___Black_rot: 'fungal_infection',
    Apple___Cedar_apple_rust: 'rusty_spots',
    Apple___healthy: 'healthy',
    'Corn_(maize)___Common_rust_': 'rusty_spots',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': 'fungal_leaf_spot',
    'Corn_(maize)___Northern_Leaf_Blight': 'leaf_blight',
    'Corn_(maize)___healthy': 'healthy',
    Squash___Powdery_mildew: 'powdery_mildew',
    'Cherry_(including_sour)___Powdery_mildew': 'powdery_mildew',
    'Cherry_(including_sour)___healthy': 'healthy',
    Strawberry___Leaf_scorch: 'leaf_scorch',
    Strawberry___healthy: 'healthy',
    Peach___Bacterial_spot: 'bacterial_spot',
    Peach___healthy: 'healthy',
    'Orange___Haunglongbing_(Citrus_greening)': 'nutrient_lockout',
    Blueberry___healthy: 'healthy',
    Raspberry___healthy: 'healthy',
    Soybean___healthy: 'healthy',
}

/** Map a PlantVillage label to a cannabis-relevant slug. */
export const mapToCannabisTerm = (label: string): string => {
    const mapped = CANNABIS_MAP[label]
    if (mapped !== undefined) return mapped
    // Fallback: strip species prefix (e.g. "Tomato___") and normalise
    const withoutPrefix = label.replace(/^[^_]+___/, '').replace(/\s+/g, '_')
    return withoutPrefix.toLowerCase()
}

// ---------------------------------------------------------------------------
// ImageNet normalisation constants
// ---------------------------------------------------------------------------

const IMAGENET_MEAN = [0.485, 0.456, 0.406] as const
const IMAGENET_STD = [0.229, 0.224, 0.225] as const
const MODEL_SIZE = 224

// ---------------------------------------------------------------------------
// Image preprocessing
// ---------------------------------------------------------------------------

/**
 * Resize imageData to 224x224 and apply ImageNet normalisation.
 * Output: Float32Array in CHW layout [1, 3, 224, 224].
 */
export const preprocessImage = (src: ImageDataLike): Float32Array => {
    // Resize using OffscreenCanvas
    const srcCanvas = new OffscreenCanvas(src.width, src.height)
    const srcCtx = srcCanvas.getContext('2d')
    if (!srcCtx) throw new Error('[VisionWorker] Could not get OffscreenCanvas 2D context.')
    // Put source pixels
    const srcImageData = new ImageData(src.data.slice(), src.width, src.height)
    srcCtx.putImageData(srcImageData, 0, 0)

    const dstCanvas = new OffscreenCanvas(MODEL_SIZE, MODEL_SIZE)
    const dstCtx = dstCanvas.getContext('2d')
    if (!dstCtx)
        throw new Error('[VisionWorker] Could not get destination OffscreenCanvas context.')
    dstCtx.drawImage(srcCanvas, 0, 0, MODEL_SIZE, MODEL_SIZE)
    const resized = dstCtx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE)

    // Build CHW Float32Array with ImageNet normalisation
    const pixelCount = MODEL_SIZE * MODEL_SIZE
    const tensor = new Float32Array(3 * pixelCount)

    for (let i = 0; i < pixelCount; i++) {
        const r = resized.data[i * 4] ?? 0
        const g = resized.data[i * 4 + 1] ?? 0
        const b = resized.data[i * 4 + 2] ?? 0

        tensor[i] = (r / 255 - IMAGENET_MEAN[0]) / IMAGENET_STD[0]
        tensor[pixelCount + i] = (g / 255 - IMAGENET_MEAN[1]) / IMAGENET_STD[1]
        tensor[pixelCount * 2 + i] = (b / 255 - IMAGENET_MEAN[2]) / IMAGENET_STD[2]
    }

    return tensor
}

// ---------------------------------------------------------------------------
// Softmax helper
// ---------------------------------------------------------------------------

const softmax = (logits: Float32Array): Float32Array => {
    let max = -Infinity
    for (let i = 0; i < logits.length; i++) {
        const v = logits[i]
        if (v !== undefined && v > max) max = v
    }
    const exps = new Float32Array(logits.length)
    let sum = 0
    for (let i = 0; i < logits.length; i++) {
        const v = logits[i]
        const e = Math.exp((v ?? 0) - max)
        exps[i] = e
        sum += e
    }
    for (let i = 0; i < exps.length; i++) {
        const v = exps[i]
        exps[i] = (v ?? 0) / sum
    }
    return exps
}

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

let session: InferenceSession | null = null

// ---------------------------------------------------------------------------
// Security: origin check
// ---------------------------------------------------------------------------

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean =>
    !event.origin || event.origin === self.location.origin

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
    if (!isTrustedWorkerMessage(e)) return

    const { messageId, type, payload } = e.data

    // ---- INIT ---------------------------------------------------------------
    if (type === 'INIT') {
        const p = payload as InitPayload | undefined
        if (!p?.modelBuffer || !(p.modelBuffer instanceof ArrayBuffer)) {
            self.postMessage(workerErr(messageId, 'INIT requires modelBuffer: ArrayBuffer'))
            return
        }
        try {
            const ort = await import('onnxruntime-web')
            // Point WASM runtime to jsDelivr CDN -- avoids bundling ~5 MB WASM
            ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/'
            session = await ort.InferenceSession.create(p.modelBuffer, {
                executionProviders: ['webgpu', 'wasm'],
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

    // ---- CLASSIFY -----------------------------------------------------------
    if (type === 'CLASSIFY') {
        if (!session) {
            self.postMessage(workerErr(messageId, 'Session not initialised. Call INIT first.'))
            return
        }
        const p = payload as ClassifyPayload | undefined
        if (!p?.imageData?.data || !p.imageData.width || !p.imageData.height) {
            self.postMessage(
                workerErr(messageId, 'CLASSIFY requires imageData with data/width/height'),
            )
            return
        }
        try {
            const ort = await import('onnxruntime-web')
            const t0 = performance.now()

            const inputTensor = preprocessImage(p.imageData)
            const tensor = new ort.Tensor('float32', inputTensor, [1, 3, MODEL_SIZE, MODEL_SIZE])

            const feeds: Record<string, InstanceType<OrtModule['Tensor']>> = { input: tensor }
            const results = await session.run(feeds)

            // Extract logits from first output (Float32Array)
            const outputKey = Object.keys(results)[0]
            if (!outputKey) throw new Error('No output from session.run()')
            const output = results[outputKey]
            if (!output) throw new Error('Empty output from session.run()')

            let logits: Float32Array
            if (output.data instanceof Float32Array) {
                logits = output.data
            } else {
                // Fallback: tolist() or typed array
                const raw = output.data as ArrayLike<number>
                logits = new Float32Array(raw.length)
                for (let i = 0; i < raw.length; i++) {
                    logits[i] = raw[i] ?? 0
                }
            }

            const probs = softmax(logits)

            // Build sorted top-5
            const indexed = Array.from(probs, (conf, idx) => ({ idx, conf }))
            indexed.sort((a, b) => b.conf - a.conf)
            const top5Raw = indexed.slice(0, 5)

            const top5 = top5Raw.map(({ idx, conf }) => ({
                label: mapToCannabisTerm(PLANT_VILLAGE_LABELS[idx] ?? String(idx)),
                confidence: conf,
            }))

            const topLabel = top5[0]?.label ?? 'unknown'
            const topConfidence = top5[0]?.confidence ?? 0
            const latencyMs = Math.round(performance.now() - t0)

            const result: VisionClassifyResult = {
                label: topLabel,
                confidence: topConfidence,
                top5,
                latencyMs,
            }

            self.postMessage(workerOk(messageId, result))
        } catch (err) {
            self.postMessage(
                workerErr(messageId, err instanceof Error ? err.message : 'CLASSIFY failed'),
            )
        }
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

/**
 * Plant Disease Model Service
 *
 * Downloads and caches the PlantVillage MobileNetV2 ONNX model in IndexedDB.
 * Used by visionInferenceWorker.ts for on-device leaf disease classification.
 *
 * Model: linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
 * URL:   https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
 *        /resolve/main/model.onnx
 *
 * Security: Model URL is hardcoded -- no user input accepted in fetch calls.
 * Offline:  isLocalOnlyMode() guard prevents all outbound requests.
 */

import type { ModelStatus } from '@/types'
import { captureLocalAiError } from '@/services/sentryService'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { workerBus } from '@/services/workerBus'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODEL_URL =
    'https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification/resolve/main/model.onnx'

const DB_NAME = 'plantDiseaseModel'
const DB_VERSION = 1
const STORE_NAME = 'modelCache'
const MODEL_KEY = 'modelBuffer'

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _status: ModelStatus = 'not-cached'
let _workerRegistered = false

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE_NAME)) {
                req.result.createObjectStore(STORE_NAME)
            }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })

const idbGet = async <T>(key: string): Promise<T | null> => {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).get(key)
        req.onsuccess = () => resolve((req.result as T | undefined) ?? null)
        req.onerror = () => reject(req.error)
        tx.oncomplete = () => db.close()
    })
}

const idbPut = async (key: string, value: ArrayBuffer): Promise<void> => {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const req = tx.objectStore(STORE_NAME).put(value, key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
        tx.oncomplete = () => db.close()
    })
}

const idbDelete = async (key: string): Promise<void> => {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const req = tx.objectStore(STORE_NAME).delete(key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
        tx.oncomplete = () => db.close()
    })
}

// ---------------------------------------------------------------------------
// Worker registration (lazy -- first classify call)
// ---------------------------------------------------------------------------

export const ensureWorkerRegistered = (): void => {
    if (_workerRegistered) return
    _workerRegistered = true
    workerBus.register(
        'visionInference',
        new Worker(new URL('../workers/visionInferenceWorker.ts', import.meta.url), {
            type: 'module',
        }),
    )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Current download/cache status of the ONNX model (synchronous). */
export const getModelStatus = (): ModelStatus => _status

/** Returns true if the model ArrayBuffer is present in IndexedDB. */
export const isModelCached = async (): Promise<boolean> => {
    try {
        const buf = await idbGet<ArrayBuffer>(MODEL_KEY)
        const cached = buf !== null && buf.byteLength > 0
        if (cached && _status === 'not-cached') _status = 'ready'
        return cached
    } catch (err) {
        captureLocalAiError(err, { consumer: 'plantDiseaseModelService', stage: 'cache-read' })
        return false
    }
}

/** Retrieves the cached ArrayBuffer, or null if not present. */
export const getModelBuffer = async (): Promise<ArrayBuffer | null> => {
    try {
        return await idbGet<ArrayBuffer>(MODEL_KEY)
    } catch (err) {
        captureLocalAiError(err, { consumer: 'plantDiseaseModelService', stage: 'cache-read' })
        return null
    }
}

/**
 * Downloads the ONNX model from HuggingFace and stores it in IndexedDB.
 * Reports download progress (0-100) via the optional callback.
 * Returns true on success, false on any error.
 */
export const downloadModel = async (onProgress?: (pct: number) => void): Promise<boolean> => {
    if (isLocalOnlyMode()) {
        console.debug('[PlantDiseaseModel] Download skipped: local-only mode active.')
        return false
    }

    if (_status === 'downloading') return false

    _status = 'downloading'
    onProgress?.(0)

    try {
        // HEAD check to detect network / availability issues
        const headRes = await fetch(MODEL_URL, { method: 'HEAD' })
        if (!headRes.ok) {
            console.debug('[PlantDiseaseModel] HEAD check failed:', headRes.status)
            _status = 'error'
            return false
        }

        const res = await fetch(MODEL_URL)
        if (!res.ok || !res.body) {
            _status = 'error'
            return false
        }

        const contentLength = res.headers.get('Content-Length')
        const total = contentLength ? parseInt(contentLength, 10) : 0

        const reader = res.body.getReader()
        const chunks: Uint8Array[] = []
        let received = 0

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) {
                chunks.push(value)
                received += value.byteLength
                if (total > 0) {
                    onProgress?.(Math.min(99, Math.round((received / total) * 100)))
                }
            }
        }

        // Assemble full buffer
        const buffer = new ArrayBuffer(received)
        const view = new Uint8Array(buffer)
        let offset = 0
        for (const chunk of chunks) {
            view.set(chunk, offset)
            offset += chunk.byteLength
        }

        await idbPut(MODEL_KEY, buffer)
        _status = 'ready'
        onProgress?.(100)
        return true
    } catch (err) {
        _status = 'error'
        captureLocalAiError(err, { consumer: 'plantDiseaseModelService', stage: 'inference' })
        return false
    }
}

/** Removes the cached model from IndexedDB and resets status. */
export const clearModel = async (): Promise<void> => {
    try {
        await idbDelete(MODEL_KEY)
        _status = 'not-cached'
    } catch (err) {
        captureLocalAiError(err, { consumer: 'plantDiseaseModelService', stage: 'cache-clear' })
    }
}

export const plantDiseaseModelService = {
    getModelStatus,
    isModelCached,
    getModelBuffer,
    downloadModel,
    clearModel,
    ensureWorkerRegistered,
} as const

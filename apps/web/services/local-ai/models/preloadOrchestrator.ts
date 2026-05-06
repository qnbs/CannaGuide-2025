import { loadWebLlmEngine } from './webLlmService'
import { captureLocalAiError } from '@/services/sentryService'
import type { LocalAiModelManager } from './modelManager'
import { isMobileDevice, getBatteryManager, checkStorageQuota } from '@/utils/browserApis'

/**
 * Smart-Preload Tier classification.
 *
 * - `critical`  -- text only (eco profile / battery <20% non-charging).
 * - `standard`  -- text + vision + lang-detect + image-similarity (default).
 * - `full`      -- standard + embeddings + NLP triple + WebLLM
 *                  (AC-power + WiFi + idle-time recommended).
 */
export type PreloadTier = 'critical' | 'standard' | 'full'

/**
 * Probe whether the device is currently in a network/power state where the
 * `full` tier is appropriate (AC-power OR battery >=80%, AND not on a
 * `slow-2g`/`2g`/`3g`/`metered` connection).
 *
 * Falls back to `false` whenever the relevant browser APIs are unavailable
 * so we never opportunistically download large WebLLM weights.
 */
const isFullTierAppropriate = async (): Promise<boolean> => {
    const battery = await getBatteryManager()
    const batteryOk = !battery || battery.charging || battery.level >= 0.8

    const conn =
        typeof navigator !== 'undefined'
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- narrow non-standard NetworkInformation API
              (navigator as unknown as {
                  connection?: { effectiveType?: string; saveData?: boolean }
              }).connection
            : undefined
    const slowTypes = new Set(['slow-2g', '2g', '3g'])
    const networkOk =
        !conn ||
        (!slowTypes.has(conn.effectiveType ?? '') && conn.saveData !== true)

    return batteryOk && networkOk
}

export interface LocalAiPreloadReport {
    textModelReady: boolean
    visionModelReady: boolean
    webLlmReady: boolean
    embeddingModelReady: boolean
    sentimentModelReady: boolean
    summarizationModelReady: boolean
    zeroShotTextModelReady: boolean
    languageDetectionReady: boolean
    imageSimilarityReady: boolean
    imageGenerationReady: boolean
    errorCount: number
}

type ProgressCallback = (loaded: number, total: number, label: string) => void

const supportsWebGpu = (): boolean => typeof navigator !== 'undefined' && 'gpu' in navigator

/** Stage-level timeout: shorter on mobile to avoid UI freezes. */
const getStageTimeoutMs = (): number => (isMobileDevice() ? 15_000 : 30_000)

/** Wrap a promise with a per-stage timeout. */
const withStageTimeout = <T>(promise: Promise<T>, label: string): Promise<T> => {
    const ms = getStageTimeoutMs()
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`Preload stage '${label}' timed out after ${ms}ms`)),
            ms,
        )
        promise.then(
            (v) => {
                clearTimeout(timer)
                resolve(v)
            },
            (e) => {
                clearTimeout(timer)
                reject(e)
            },
        )
    })
}

/** Check battery level -- if below 20% and not charging, force eco mode. */
const shouldForceBatteryEco = async (): Promise<boolean> => {
    const battery = await getBatteryManager()
    if (!battery) return false
    return !battery.charging && battery.level < 0.2
}

const calculatePreloadTotalSteps = (
    hasEmbeddings: boolean,
    hasNlp: boolean,
    hasWebLlm: boolean,
): number => {
    let total = 4 // text + vision + langDetect + imgSimilarity
    if (hasEmbeddings) total += 1
    if (hasNlp) total += 3
    if (hasWebLlm) total += 1
    return total
}

/**
 * Orchestrates preloading of all local AI model pipelines.
 * Progress is reported via an optional callback for loading-gate UIs.
 *
 * Tiering (see {@link PreloadTier}):
 *   - `tier: 'critical'`  forces the eco-only branch regardless of `ecoOnly`.
 *   - `tier: 'standard'`  loads text + vision + lang-detect + image-similarity.
 *   - `tier: 'full'`      additionally loads embeddings + NLP triple + WebLLM,
 *                          but only when {@link isFullTierAppropriate} agrees
 *                          (AC-power / fast network). Otherwise auto-degrades
 *                          to `standard`.
 */
export async function preloadOfflineAssets(
    modelManager: LocalAiModelManager,
    includeWebLlm = false,
    onProgress?: ProgressCallback,
    ecoOnly = false,
    tier: PreloadTier = 'standard',
): Promise<LocalAiPreloadReport> {
    // Battery gating: if battery < 20% and not charging, force eco mode
    const batteryEco = await shouldForceBatteryEco()
    const effectiveEcoOnly = ecoOnly || batteryEco || tier === 'critical'

    // Auto-degrade `full` to `standard` if power/network are unsuitable. This
    // protects users on metered connections from opportunistic 1-2 GB
    // WebLLM downloads.
    let resolvedIncludeWebLlm = includeWebLlm
    if (tier === 'full') {
        const ok = await isFullTierAppropriate()
        if (!ok) {
            tier = 'standard'
            resolvedIncludeWebLlm = false
        } else {
            resolvedIncludeWebLlm = true
        }
    }

    // -- Eco mode: only load the small 0.5B text model --
    if (effectiveEcoOnly) {
        const totalSteps = 1
        let loaded = 0
        onProgress?.(loaded, totalSteps, 'text-model-eco')
        const textResult = await Promise.allSettled([modelManager.loadTextPipeline()]).then(
            (r) => r[0],
        )
        onProgress?.(++loaded, totalSteps, 'text-model-eco')
        return {
            textModelReady: textResult.status === 'fulfilled',
            visionModelReady: false,
            webLlmReady: false,
            embeddingModelReady: false,
            sentimentModelReady: false,
            summarizationModelReady: false,
            zeroShotTextModelReady: false,
            languageDetectionReady: false,
            imageSimilarityReady: false,
            imageGenerationReady: false,
            errorCount: Number(textResult.status === 'rejected'),
        }
    }

    const hasEmbeddings = true
    const hasNlp = true
    const hasWebLlm = resolvedIncludeWebLlm && supportsWebGpu()
    const totalSteps = calculatePreloadTotalSteps(hasEmbeddings, hasNlp, hasWebLlm)
    let loaded = 0

    // Pre-flight: check storage quota before any downloads
    const quota = await checkStorageQuota(300) // ~300 MB baseline for all models
    if (!quota.ok) {
        const avail = quota.availableMB !== null ? `${quota.availableMB}` : 'unknown'
        captureLocalAiError(new Error(`Insufficient storage for preload (${avail} MB available)`), {
            stage: 'preload-storage-check',
        })
        // Continue with best effort -- individual loads will fail gracefully
    }

    onProgress?.(loaded, totalSteps, 'text-model')
    const textResult = await Promise.allSettled([
        withStageTimeout(modelManager.loadTextPipeline(), 'text-model'),
    ]).then((r) => r[0])
    onProgress?.(++loaded, totalSteps, 'vision-model')

    const visionResult = await Promise.allSettled([
        withStageTimeout(modelManager.loadVisionPipeline(), 'vision-model'),
    ]).then((r) => r[0])
    onProgress?.(++loaded, totalSteps, 'vision-model')

    // Embedding model
    let embeddingReady = false
    if (hasEmbeddings) {
        onProgress?.(loaded, totalSteps, 'embedding-model')
        try {
            const { preloadEmbeddingModel } = await import('../nlp/embeddingService')
            embeddingReady = await preloadEmbeddingModel()
        } catch (error) {
            embeddingReady = false
            captureLocalAiError(error, { stage: 'preload-embedding' })
        }
        onProgress?.(++loaded, totalSteps, 'embedding-model')
    }

    // NLP models (sentiment, summarization, zero-shot-classification)
    let nlpStatus = { sentimentReady: false, summarizationReady: false, zeroShotReady: false }
    if (hasNlp) {
        try {
            const { preloadNlpModels } = await import('../nlp/nlpService')
            nlpStatus = await preloadNlpModels((nlpLoaded, _total, label) => {
                onProgress?.(loaded + nlpLoaded, totalSteps, label)
            })
        } catch (error) {
            captureLocalAiError(error, { stage: 'preload-nlp' })
        }
        loaded += 3
        onProgress?.(loaded, totalSteps, 'nlp-complete')
    }

    // Language detection model
    let langDetectReady = false
    onProgress?.(loaded, totalSteps, 'lang-detection')
    try {
        const { preloadLanguageDetectionModel } = await import('../nlp/languageDetection')
        langDetectReady = await preloadLanguageDetectionModel()
    } catch {
        // Non-critical
    }
    onProgress?.(++loaded, totalSteps, 'lang-detection')

    // Image similarity model
    let imgSimilarityReady = false
    onProgress?.(loaded, totalSteps, 'image-similarity')
    try {
        const { preloadImageSimilarityModel } = await import('../vision/imageSimilarityService')
        imgSimilarityReady = await preloadImageSimilarityModel()
    } catch {
        // Non-critical
    }
    onProgress?.(++loaded, totalSteps, 'image-similarity')

    let webLlmResult: PromiseSettledResult<unknown> | null = null
    if (hasWebLlm) {
        onProgress?.(loaded, totalSteps, 'web-llm')
        webLlmResult = await Promise.allSettled([loadWebLlmEngine()]).then((r) => r[0])
        onProgress?.(++loaded, totalSteps, 'web-llm')
    }

    // Image generation capability check (no model preload)
    let imageGenReady = false
    try {
        const { checkImageGenCapability } = await import('../../imageGenerationService')
        imageGenReady = checkImageGenCapability().supported
    } catch {
        // Non-critical
    }

    return {
        textModelReady: textResult.status === 'fulfilled',
        visionModelReady: visionResult.status === 'fulfilled',
        webLlmReady: webLlmResult?.status === 'fulfilled' ? webLlmResult.value !== null : false,
        embeddingModelReady: embeddingReady,
        sentimentModelReady: nlpStatus.sentimentReady,
        summarizationModelReady: nlpStatus.summarizationReady,
        zeroShotTextModelReady: nlpStatus.zeroShotReady,
        languageDetectionReady: langDetectReady,
        imageSimilarityReady: imgSimilarityReady,
        imageGenerationReady: imageGenReady,
        errorCount:
            Number(textResult.status === 'rejected') +
            Number(visionResult.status === 'rejected') +
            Number(hasWebLlm && webLlmResult?.status === 'rejected'),
    }
}

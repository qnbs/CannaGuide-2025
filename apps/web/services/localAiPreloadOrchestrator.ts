import { loadWebLlmEngine } from './localAiWebLlmService'
import type { LocalAiModelManager } from './localAiModelManager'

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
 */
export async function preloadOfflineAssets(
    modelManager: LocalAiModelManager,
    includeWebLlm = false,
    onProgress?: ProgressCallback,
    ecoOnly = false,
): Promise<LocalAiPreloadReport> {
    // ── Eco mode: only load the small 0.5B text model ──
    if (ecoOnly) {
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
    const hasWebLlm = includeWebLlm && supportsWebGpu()
    const totalSteps = calculatePreloadTotalSteps(hasEmbeddings, hasNlp, hasWebLlm)
    let loaded = 0

    onProgress?.(loaded, totalSteps, 'text-model')
    const textResult = await Promise.allSettled([modelManager.loadTextPipeline()]).then((r) => r[0])
    onProgress?.(++loaded, totalSteps, 'vision-model')

    const visionResult = await Promise.allSettled([modelManager.loadVisionPipeline()]).then(
        (r) => r[0],
    )
    onProgress?.(++loaded, totalSteps, 'vision-model')

    // Embedding model
    let embeddingReady = false
    if (hasEmbeddings) {
        onProgress?.(loaded, totalSteps, 'embedding-model')
        try {
            const { preloadEmbeddingModel } = await import('./localAiEmbeddingService')
            embeddingReady = await preloadEmbeddingModel()
        } catch {
            embeddingReady = false
        }
        onProgress?.(++loaded, totalSteps, 'embedding-model')
    }

    // NLP models (sentiment, summarization, zero-shot-classification)
    let nlpStatus = { sentimentReady: false, summarizationReady: false, zeroShotReady: false }
    if (hasNlp) {
        try {
            const { preloadNlpModels } = await import('./localAiNlpService')
            nlpStatus = await preloadNlpModels((nlpLoaded, _total, label) => {
                onProgress?.(loaded + nlpLoaded, totalSteps, label)
            })
        } catch {
            // NLP preload failure is non-critical
        }
        loaded += 3
        onProgress?.(loaded, totalSteps, 'nlp-complete')
    }

    // Language detection model
    let langDetectReady = false
    onProgress?.(loaded, totalSteps, 'lang-detection')
    try {
        const { preloadLanguageDetectionModel } = await import('./localAiLanguageDetectionService')
        langDetectReady = await preloadLanguageDetectionModel()
    } catch {
        // Non-critical
    }
    onProgress?.(++loaded, totalSteps, 'lang-detection')

    // Image similarity model
    let imgSimilarityReady = false
    onProgress?.(loaded, totalSteps, 'image-similarity')
    try {
        const { preloadImageSimilarityModel } = await import('./localAiImageSimilarityService')
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
        const { checkImageGenCapability } = await import('./imageGenerationService')
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

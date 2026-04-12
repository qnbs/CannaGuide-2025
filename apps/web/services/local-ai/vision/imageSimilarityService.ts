import { enqueueInference, isWorkerAvailable } from '../inference/inferenceQueue'
import { captureLocalAiError } from '@/services/sentryService'
import { isMobileDevice } from '@/utils/browserApis'

/**
 * Local AI Image Similarity Service — uses CLIP vision features to compare
 * plant photos for visual similarity, anomaly detection, and growth tracking.
 *
 * All inference is off-loaded to the inference Web Worker via
 * inferenceQueueService to keep the UI thread responsive.
 */

const CLIP_MODEL_ID = 'Xenova/clip-vit-large-patch14'
const FEATURE_DIM = 768 // CLIP ViT-Large feature dimension
const IMAGE_SIMILARITY_TIMEOUT_MS = 30_000

const ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
])

/** Dispatch a feature-extraction task to the inference worker. */
const dispatchFeatureExtraction = async (
    input: unknown,
    inferenceOptions?: Record<string, unknown>,
): Promise<unknown> => {
    if (!isWorkerAvailable()) {
        throw new Error('Inference worker unavailable')
    }
    return enqueueInference({
        task: 'feature-extraction',
        modelId: CLIP_MODEL_ID,
        input,
        pipelineOptions: { quantized: true },
        inferenceOptions,
        priority: 'normal',
        timeoutMs: IMAGE_SIMILARITY_TIMEOUT_MS,
    })
}

const toDataUrl = (base64Image: string, mimeType: string): string => {
    if (base64Image.startsWith('data:')) return base64Image
    const safeMime = ALLOWED_IMAGE_MIME_TYPES.has(mimeType) ? mimeType : 'image/jpeg'
    return `data:${safeMime};base64,${base64Image}`
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ImageFeatureVector {
    /** Normalized feature vector from CLIP. */
    features: Float32Array
    /** Timestamp of extraction. */
    extractedAt: number
    /** Original image dimensions if available. */
    dimensions?: { width: number; height: number }
}

export interface SimilarityResult {
    /** Index of the compared image. */
    index: number
    /** Cosine similarity score (0–1). */
    score: number
}

export interface GrowthProgressionResult {
    /** Average visual change between consecutive photos. */
    averageChange: number
    /** Individual change scores between consecutive pairs. */
    changes: number[]
    /** Whether growth appears stable, accelerating, or decelerating. */
    trend: 'accelerating' | 'decelerating' | 'stable'
}

// ─── Vector Utilities ────────────────────────────────────────────────────────

/** Normalize a vector to unit length. */
const normalize = (vec: Float32Array): Float32Array => {
    let norm = 0
    for (let i = 0; i < vec.length; i++) norm += vec[i]! * vec[i]!
    norm = Math.sqrt(norm)
    if (norm > 0) {
        const result = new Float32Array(vec.length)
        for (let i = 0; i < vec.length; i++) result[i] = vec[i]! / norm
        return result
    }
    return vec
}

/** Cosine similarity between two equal-length vectors. */
export const cosineSimilarity = (a: Float32Array, b: Float32Array): number => {
    if (a.length !== b.length || a.length === 0) return 0
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
        dot += a[i]! * b[i]!
        normA += a[i]! * a[i]!
        normB += b[i]! * b[i]!
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB)
    return denom === 0 ? 0 : dot / denom
}

// ─── Feature Extraction ──────────────────────────────────────────────────────

/** Extract the feature embedding from the CLIP pipeline output. */
const extractFeatures = (raw: unknown): Float32Array => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const output = raw as {
        data?: Float32Array | number[]
        tolist?: () => number[][]
    }

    if (output.data instanceof Float32Array) {
        return normalize(new Float32Array(output.data.slice(0, FEATURE_DIM)))
    }
    if (Array.isArray(output.data)) {
        return normalize(new Float32Array(output.data.slice(0, FEATURE_DIM)))
    }
    if (typeof output.tolist === 'function') {
        const list = output.tolist()
        const first = Array.isArray(list[0]) ? list[0] : list
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return normalize(new Float32Array((first as number[]).slice(0, FEATURE_DIM)))
    }
    return new Float32Array(FEATURE_DIM)
}

/**
 * Extract CLIP feature vector from a plant photo.
 * Returns a normalized 768-dimensional Float32Array.
 */
export const extractImageFeatures = async (
    base64Image: string,
    mimeType: string,
): Promise<ImageFeatureVector> => {
    // Guard: reject images over 2 MB base64 to prevent memory spikes on mobile
    const MAX_BASE64_LENGTH = 2_800_000 // ~2 MB decoded
    if (base64Image.length > MAX_BASE64_LENGTH) {
        throw new Error(
            `Image too large for local feature extraction (${Math.round(base64Image.length / 1000)}KB base64)`,
        )
    }
    try {
        const imageBlob = await fetch(toDataUrl(base64Image, mimeType)).then((r) => r.blob())
        const result = await dispatchFeatureExtraction(imageBlob, {
            pooling: 'mean',
            normalize: true,
        })
        return {
            features: extractFeatures(result),
            extractedAt: Date.now(),
        }
    } catch (error) {
        captureLocalAiError(error, { model: CLIP_MODEL_ID, stage: 'inference' })
        throw error
    }
}

/**
 * Compare two plant photos for visual similarity.
 * Returns a score from 0 (completely different) to 1 (identical).
 */
export const compareImages = async (
    imageA: { base64: string; mimeType: string },
    imageB: { base64: string; mimeType: string },
): Promise<number> => {
    const [featA, featB] = await Promise.all([
        extractImageFeatures(imageA.base64, imageA.mimeType),
        extractImageFeatures(imageB.base64, imageB.mimeType),
    ])
    return cosineSimilarity(featA.features, featB.features)
}

/**
 * Find the most visually similar photos in a collection.
 * Returns indices sorted by descending similarity.
 */
export const findSimilarImages = async (
    queryImage: { base64: string; mimeType: string },
    candidates: Array<{ base64: string; mimeType: string }>,
    topK = 5,
): Promise<SimilarityResult[]> => {
    if (candidates.length === 0) return []

    // Cap candidates to prevent memory exhaustion (lower on mobile)
    const absoluteMax = isMobileDevice() ? 50 : 100
    const maxCandidates = Math.min(candidates.length, absoluteMax)
    const queryFeatures = await extractImageFeatures(queryImage.base64, queryImage.mimeType)

    // Process candidates sequentially to avoid memory pressure
    const results: SimilarityResult[] = []
    for (let i = 0; i < maxCandidates; i++) {
        const candidate = candidates[i]!
        try {
            const candidateFeatures = await extractImageFeatures(
                candidate.base64,
                candidate.mimeType,
            )
            results.push({
                index: i,
                score: cosineSimilarity(queryFeatures.features, candidateFeatures.features),
            })
        } catch (error) {
            captureLocalAiError(error, {
                model: CLIP_MODEL_ID,
                stage: 'similarity-candidate',
                candidateIndex: i,
            })
            results.push({ index: i, score: 0 })
        }
    }

    return results.toSorted((a, b) => b.score - a.score).slice(0, topK)
}

/**
 * Analyze visual growth progression from a series of chronological plant photos.
 * Measures how much the plant visually changes between consecutive photos.
 */
export const analyzeGrowthProgression = async (
    photos: Array<{ base64: string; mimeType: string; timestamp: number }>,
): Promise<GrowthProgressionResult> => {
    if (photos.length < 2) {
        return { averageChange: 0, changes: [], trend: 'stable' }
    }

    // Sort by timestamp
    const sorted = photos.toSorted((a, b) => a.timestamp - b.timestamp)

    // Extract features for all photos
    const features: Float32Array[] = []
    for (const photo of sorted) {
        try {
            const feat = await extractImageFeatures(photo.base64, photo.mimeType)
            features.push(feat.features)
        } catch (error) {
            captureLocalAiError(error, { model: CLIP_MODEL_ID, stage: 'growth-extraction' })
            features.push(new Float32Array(FEATURE_DIM))
        }
    }

    // Compute consecutive change scores (1 - similarity = change)
    const changes: number[] = []
    for (let i = 1; i < features.length; i++) {
        const similarity = cosineSimilarity(features[i - 1]!, features[i]!)
        changes.push(Math.max(0, 1 - similarity))
    }

    const averageChange =
        changes.length > 0 ? changes.reduce((sum, c) => sum + c, 0) / changes.length : 0

    // Determine trend from first half vs second half
    const mid = Math.floor(changes.length / 2)
    if (mid === 0) {
        return { averageChange, changes, trend: 'stable' }
    }

    const firstHalf = changes.slice(0, mid).reduce((s, c) => s + c, 0) / mid
    const secondHalf = changes.slice(mid).reduce((s, c) => s + c, 0) / (changes.length - mid)
    const diff = secondHalf - firstHalf

    let trend: GrowthProgressionResult['trend'] = 'stable'
    if (diff > 0.05) {
        trend = 'accelerating'
    } else if (diff < -0.05) {
        trend = 'decelerating'
    }

    return { averageChange, changes, trend }
}

/** Preload the CLIP feature extraction pipeline via a warm-up dispatch. */
export const preloadImageSimilarityModel = async (): Promise<boolean> => {
    try {
        // Dispatch a minimal warm-up to trigger model loading in the worker
        await dispatchFeatureExtraction('warmup', { pooling: 'mean', normalize: true })
        return true
    } catch {
        return false
    }
}

/** The feature vector dimension for consumers. */
export const IMAGE_FEATURE_DIM = FEATURE_DIM

/** Reset internal state (tests). */
export const resetImageSimilarityPipeline = (): void => {
    // Pipeline is managed inside the inference worker;
    // no local state to reset.
}

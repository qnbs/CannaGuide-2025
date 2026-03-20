import { loadTransformersPipeline, type LocalAiPipeline } from './localAIModelLoader'
import { captureLocalAiError } from './sentryService'

/**
 * Local AI Image Similarity Service — uses CLIP vision features to compare
 * plant photos for visual similarity, anomaly detection, and growth tracking.
 *
 * Capabilities:
 * • Extract CLIP feature vectors from plant photos
 * • Compare two plant photos for visual similarity (cosine)
 * • Find most similar photos in a collection
 * • Track visual changes over time (growth progression)
 *
 * Uses the same CLIP model as plant diagnosis but extracts feature vectors
 * instead of zero-shot classification labels.
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

/** Race a promise against a timeout. */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Image similarity timeout')), ms)
        promise.then(
            (value) => {
                clearTimeout(timer)
                resolve(value)
            },
            (error) => {
                clearTimeout(timer)
                reject(error)
            },
        )
    })

let featurePipeline: Promise<LocalAiPipeline> | null = null

const loadFeaturePipeline = (): Promise<LocalAiPipeline> => {
    if (!featurePipeline) {
        featurePipeline = loadTransformersPipeline('feature-extraction', CLIP_MODEL_ID, {
            quantized: true,
        }).catch((error: unknown) => {
            featurePipeline = null
            captureLocalAiError(error, { model: CLIP_MODEL_ID, stage: 'preload' })
            throw error
        })
    }
    return featurePipeline
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
    for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i]
    norm = Math.sqrt(norm)
    if (norm > 0) {
        const result = new Float32Array(vec.length)
        for (let i = 0; i < vec.length; i++) result[i] = vec[i] / norm
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
        dot += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB)
    return denom === 0 ? 0 : dot / denom
}

// ─── Feature Extraction ──────────────────────────────────────────────────────

/** Extract the feature embedding from the CLIP pipeline output. */
const extractFeatures = (raw: unknown): Float32Array => {
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
    try {
        const pipeline = await loadFeaturePipeline()
        const imageBlob = await fetch(toDataUrl(base64Image, mimeType)).then((r) => r.blob())
        const result = await withTimeout(
            pipeline(imageBlob, { pooling: 'mean', normalize: true }),
            IMAGE_SIMILARITY_TIMEOUT_MS,
        )
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

    // Cap candidates to prevent memory exhaustion on large collections
    const maxCandidates = Math.min(candidates.length, 100)
    const queryFeatures = await extractImageFeatures(queryImage.base64, queryImage.mimeType)

    // Process candidates sequentially to avoid memory pressure
    const results: SimilarityResult[] = []
    for (let i = 0; i < maxCandidates; i++) {
        try {
            const candidateFeatures = await extractImageFeatures(
                candidates[i].base64,
                candidates[i].mimeType,
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

    return results.sort((a, b) => b.score - a.score).slice(0, topK)
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
    const sorted = [...photos].sort((a, b) => a.timestamp - b.timestamp)

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
        const similarity = cosineSimilarity(features[i - 1], features[i])
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

    const trend: GrowthProgressionResult['trend'] =
        diff > 0.05 ? 'accelerating' : diff < -0.05 ? 'decelerating' : 'stable'

    return { averageChange, changes, trend }
}

/** Preload the CLIP feature extraction pipeline. */
export const preloadImageSimilarityModel = async (): Promise<boolean> => {
    try {
        await loadFeaturePipeline()
        return true
    } catch {
        return false
    }
}

/** The feature vector dimension for consumers. */
export const IMAGE_FEATURE_DIM = FEATURE_DIM

/** Reset internal state (tests). */
export const resetImageSimilarityPipeline = (): void => {
    featurePipeline = null
}

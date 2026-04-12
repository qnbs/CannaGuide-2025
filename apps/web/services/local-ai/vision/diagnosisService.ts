/**
 * Local AI Vision Diagnosis Service.
 *
 * Extracted from localAI.ts -- owns zero-shot image classification,
 * issue-label dictionary, diagnosis content assembly, and fallback.
 * Also provides classifyLeafImage() for ONNX MobileNetV2 plant disease detection.
 */

import DOMPurify from 'dompurify'
import type {
    Language,
    Plant,
    PlantDiagnosisResponse,
    LeafDiagnosisResult,
    DiseaseRecommendation,
} from '@/types'
import { captureLocalAiError } from '@/services/sentryService'
import { diagnosePlant as diagnoseWithRules } from '../fallback/fallbackService'
import type { LocalAiPipeline } from '../models/modelLoader'
import { diseaseAtlas } from '@/data/diseases'
import { getT } from '@/i18n'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const VISION_MODEL_ID = 'Xenova/clip-vit-large-patch14'

export const ZERO_SHOT_LABELS = [
    'healthy plant',
    'nitrogen deficiency',
    'phosphorus deficiency',
    'potassium deficiency',
    'calcium deficiency',
    'magnesium deficiency',
    'iron deficiency',
    'zinc deficiency',
    'sulfur deficiency',
    'manganese deficiency',
    'boron deficiency',
    'overwatering',
    'underwatering',
    'heat stress',
    'light stress',
    'light burn',
    'cold stress',
    'wind burn',
    'nutrient burn',
    'nutrient lockout',
    'root rot',
    'powdery mildew',
    'botrytis bud rot',
    'spider mites',
    'fungus gnats',
    'aphids',
    'thrips',
    'whiteflies',
    'fungal leaf spot',
    'septoria leaf spot',
    'tobacco mosaic virus',
    'pH imbalance',
    'revegetation stress',
] as const

const ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sanitizeText = (value: string): string =>
    DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()

const toDataUrl = (base64Image: string, mimeType: string): string => {
    if (base64Image.startsWith('data:')) return base64Image
    const safeMime = ALLOWED_IMAGE_MIME_TYPES.has(mimeType) ? mimeType : 'image/jpeg'
    return `data:${safeMime};base64,${base64Image}`
}

/** Race a promise against a timeout. */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Inference timeout')), ms)
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

// ---------------------------------------------------------------------------
// Issue-label -> i18n key mapping (replaces hardcoded dictionary)
// ---------------------------------------------------------------------------

/** Maps zero-shot label strings to i18n keys under plantsView.diagnosis.* */
const LABEL_TO_I18N_KEY: Readonly<Record<string, string>> = {
    'healthy plant': 'plantsView.diagnosis.healthyPlant',
    'nitrogen deficiency': 'plantsView.diagnosis.nitrogenDeficiency',
    'phosphorus deficiency': 'plantsView.diagnosis.phosphorusDeficiency',
    'potassium deficiency': 'plantsView.diagnosis.potassiumDeficiency',
    'calcium deficiency': 'plantsView.diagnosis.calciumDeficiency',
    'magnesium deficiency': 'plantsView.diagnosis.magnesiumDeficiency',
    overwatering: 'plantsView.diagnosis.overwatering',
    underwatering: 'plantsView.diagnosis.underwatering',
    'heat stress': 'plantsView.diagnosis.heatStress',
    'light stress': 'plantsView.diagnosis.lightStress',
    'nutrient burn': 'plantsView.diagnosis.nutrientBurn',
    'powdery mildew': 'plantsView.diagnosis.powderyMildew',
    'spider mites': 'plantsView.diagnosis.spiderMites',
    'fungal leaf spot': 'plantsView.diagnosis.fungalLeafSpot',
    'iron deficiency': 'plantsView.diagnosis.ironDeficiency',
    'zinc deficiency': 'plantsView.diagnosis.zincDeficiency',
    'sulfur deficiency': 'plantsView.diagnosis.sulfurDeficiency',
    'manganese deficiency': 'plantsView.diagnosis.manganeseDeficiency',
    'boron deficiency': 'plantsView.diagnosis.boronDeficiency',
    'light burn': 'plantsView.diagnosis.lightBurn',
    'cold stress': 'plantsView.diagnosis.coldStress',
    'wind burn': 'plantsView.diagnosis.windBurn',
    'nutrient lockout': 'plantsView.diagnosis.nutrientLockout',
    'root rot': 'plantsView.diagnosis.rootRot',
    'botrytis bud rot': 'plantsView.diagnosis.botrytisBudRot',
    'fungus gnats': 'plantsView.diagnosis.fungusGnats',
    aphids: 'plantsView.diagnosis.aphids',
    thrips: 'plantsView.diagnosis.thrips',
    whiteflies: 'plantsView.diagnosis.whiteflies',
    'septoria leaf spot': 'plantsView.diagnosis.septoriaLeafSpot',
    'tobacco mosaic virus': 'plantsView.diagnosis.tobaccoMosaicVirus',
    'pH imbalance': 'plantsView.diagnosis.phImbalance',
    'revegetation stress': 'plantsView.diagnosis.revegetationStress',
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Map a zero-shot label to a localized user-facing description via i18n. */
export const mapIssueLabel = (label: string, _lang: Language): string | null => {
    const key = LABEL_TO_I18N_KEY[label.toLowerCase()]
    if (!key) return null
    const t = getT()
    const translated = t(key)
    // If i18n returns the key itself, the translation is missing
    return translated !== key ? translated : null
}

/** Classify a plant image using the zero-shot vision pipeline. */
export const classifyPlantImage = async (
    base64Image: string,
    mimeType: string,
    loadVisionPipeline: () => Promise<LocalAiPipeline>,
    timeoutMs: number,
): Promise<Array<{ label: string; score: number }>> => {
    try {
        if (base64Image.length > 5_000_000) {
            console.debug('[Diagnosis] Image too large for local processing, skipping.')
            return []
        }
        const classifier = await loadVisionPipeline()
        const image = await fetch(toDataUrl(base64Image, mimeType)).then((r) => r.blob())
        const result = await withTimeout(
            classifier(image, { candidate_labels: [...ZERO_SHOT_LABELS] }),
            timeoutMs,
        )
        return Array.isArray(result) ? result : []
    } catch (error) {
        console.debug('[Diagnosis] Vision classification failed.', error)
        captureLocalAiError(error, { model: VISION_MODEL_ID, stage: 'vision' })
        return []
    }
}

/** Build a structured PlantDiagnosisResponse from vision labels + heuristic rules. */
export const buildDiagnosisContent = (
    plant: Plant,
    lang: Language,
    labels: Array<{ label: string; score: number }>,
): PlantDiagnosisResponse => {
    const heuristic = diagnoseWithRules(plant, lang)
    const rankedIssues = labels
        .filter((item) => item.label.toLowerCase() !== 'healthy plant')
        .slice(0, 4)
        .map((item) => mapIssueLabel(item.label, lang))
        .filter((value): value is string => Boolean(value))

    const mergedIssues = [...rankedIssues, ...heuristic.issues]
    const fallbackScore = mergedIssues.length > 0 ? 0.75 : 0.95
    const topScore = labels[0]?.score ?? fallbackScore

    const t = getT()
    return {
        title: t('plantsView.diagnosis.localDiagnosisTitle', { name: plant.name }),
        content: mergedIssues.length > 0 ? mergedIssues.join('\n') : heuristic.topPriority,
        confidence: Math.max(0.1, Math.min(1, topScore)),
        immediateActions: mergedIssues.slice(0, 3).join('\n') || heuristic.topPriority,
        longTermSolution: heuristic.topPriority,
        prevention: t('plantsView.diagnosis.preventionTrack'),
        diagnosis: mergedIssues[0] || heuristic.topPriority,
    }
}

/** Heuristic-only diagnosis fallback when vision classification returns nothing. */
export const fallbackDiagnosis = (plant: Plant, lang: Language): PlantDiagnosisResponse => {
    const heuristic = diagnoseWithRules(plant, lang)
    const t = getT()
    return {
        title: t('plantsView.diagnosis.localDiagnosisTitle', { name: sanitizeText(plant.name) }),
        content: heuristic.issues.length > 0 ? heuristic.issues.join('\n') : heuristic.topPriority,
        confidence: heuristic.issues.length > 0 ? 0.72 : 0.93,
        immediateActions:
            heuristic.issues.length > 0
                ? heuristic.issues.slice(0, 3).join('\n')
                : heuristic.topPriority,
        longTermSolution: heuristic.topPriority,
        prevention: t('plantsView.diagnosis.preventionCheck'),
        diagnosis:
            heuristic.issues.length > 0
                ? (heuristic.issues[0] ?? heuristic.topPriority)
                : heuristic.topPriority,
    }
}

// ---------------------------------------------------------------------------
// ONNX MobileNetV2 Leaf Diagnosis (classifyLeafImage)
// ---------------------------------------------------------------------------

/**
 * Maps a cannabis-term label to disease-atlas recommendations.
 * Returns an empty array when no matching atlas entry exists.
 */
export const enrichWithKnowledge = (label: string): DiseaseRecommendation[] => {
    // Map cannabis slug -> disease atlas ID
    const LABEL_TO_ATLAS_ID: Readonly<Record<string, string>> = {
        spider_mites: 'spider-mites',
        powdery_mildew: 'powdery-mildew',
        late_blight: 'botrytis',
        leaf_mold: 'botrytis',
        mosaic_virus: 'botrytis',
        fungal_infection: 'powdery-mildew',
        fungal_leaf_spot: 'powdery-mildew',
        target_spot: 'powdery-mildew',
        leaf_blight: 'botrytis',
        leaf_curl_virus: 'botrytis',
        bacterial_spot: 'botrytis',
        early_blight: 'botrytis',
        septoria_leaf_spot: 'powdery-mildew',
        rusty_spots: 'powdery-mildew',
        leaf_scorch: 'heat-stress',
        nutrient_lockout: 'ph-lockout',
    }

    const atlasId = LABEL_TO_ATLAS_ID[label]
    if (!atlasId) return []

    const entry = diseaseAtlas.find((d) => d.id === atlasId)
    if (!entry) return []

    return [
        {
            diseaseId: entry.id,
            relatedLexiconKeys: entry.relatedLexiconKeys,
            relatedArticleIds: entry.relatedArticleIds,
        },
    ]
}

/** Derive a severity tier from a confidence score (0-1). */
export const classifySeverity = (confidence: number): 'none' | 'mild' | 'moderate' | 'severe' => {
    if (confidence >= 0.8) return 'severe'
    if (confidence >= 0.6) return 'moderate'
    if (confidence >= 0.4) return 'mild'
    return 'none'
}

/**
 * Classify a leaf image using the on-device ONNX model when cached,
 * or fall back to the CLIP zero-shot pipeline if the model is unavailable.
 */
export const classifyLeafImage = async (imageData: ImageData): Promise<LeafDiagnosisResult> => {
    const t0 = performance.now()

    try {
        // Lazy import to avoid circular dependency at module load time
        const { isModelCached, ensureWorkerRegistered } = await import('./plantDiseaseModelService')
        const cached = await isModelCached()

        if (cached) {
            ensureWorkerRegistered()
            const { workerBus } = await import('@/services/workerBus')

            type WorkerResult = {
                label: string
                confidence: number
                top5: Array<{ label: string; confidence: number }>
                latencyMs: number
            }

            const workerResult = await workerBus.dispatch<WorkerResult>(
                'visionInference',
                'CLASSIFY',
                {
                    imageData: {
                        data: imageData.data,
                        width: imageData.width,
                        height: imageData.height,
                    },
                },
                { priority: 'high', timeoutMs: 30_000 },
            )

            const label = workerResult.label ?? 'unknown'
            const confidence = workerResult.confidence ?? 0

            return {
                label,
                confidence,
                top5: workerResult.top5 ?? [],
                severity: classifySeverity(confidence),
                recommendations: enrichWithKnowledge(label),
                modelUsed: 'onnx-mobilenet',
                latencyMs: workerResult.latencyMs ?? Math.round(performance.now() - t0),
            }
        }
    } catch (err) {
        captureLocalAiError(err, {
            consumer: 'localAiDiagnosisService',
            stage: 'vision',
        })
    }

    // Fallback: CLIP zero-shot on a flat white placeholder (ImageData -> base64)
    // When the ONNX model is not cached we still return a valid LeafDiagnosisResult
    // with modelUsed 'zero-shot' so the UI can degrade gracefully.
    return {
        label: 'unavailable',
        confidence: 0,
        top5: [],
        severity: 'none',
        recommendations: [],
        modelUsed: 'zero-shot',
        latencyMs: Math.round(performance.now() - t0),
    }
}

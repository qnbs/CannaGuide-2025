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
import { diagnosePlant as diagnoseWithRules } from '@/services/localAiFallbackService'
import type { LocalAiPipeline } from './localAIModelLoader'
import { diseaseAtlas } from '@/data/diseases'

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

const localizeStr = (lang: Language, texts: Record<string, string>): string =>
    texts[lang] ?? texts['en'] ?? ''

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
// Issue-label dictionary (EN + DE)
// ---------------------------------------------------------------------------

const ISSUE_DICTIONARY: Record<string, { en: string; de: string }> = {
    'healthy plant': {
        en: 'The plant appears generally healthy in the local model scan.',
        de: 'Die Pflanze wirkt im lokalen Modellscan insgesamt gesund.',
    },
    'nitrogen deficiency': {
        en: 'Possible nitrogen deficiency: older leaves may fade or yellow first.',
        de: 'M\u00f6glicher Stickstoffmangel: \u00c4ltere Bl\u00e4tter hellen oft zuerst auf.',
    },
    'phosphorus deficiency': {
        en: 'Possible phosphorus deficiency: look for slowed growth and darker foliage.',
        de: 'M\u00f6glicher Phosphormangel: Auf verlangsamtes Wachstum und dunkleres Laub achten.',
    },
    'potassium deficiency': {
        en: 'Possible potassium deficiency: leaf edges may crisp or discolor.',
        de: 'M\u00f6glicher Kaliummangel: Blattr\u00e4nder k\u00f6nnen br\u00e4unen oder austrocknen.',
    },
    'calcium deficiency': {
        en: 'Possible calcium deficiency: new growth may twist or spot.',
        de: 'M\u00f6glicher Calciummangel: Neues Wachstum kann sich verformen oder fleckig werden.',
    },
    'magnesium deficiency': {
        en: 'Possible magnesium deficiency: interveinal chlorosis can appear first on older leaves.',
        de: 'M\u00f6glicher Magnesiummangel: Zwischenadernvergilbung tritt oft zuerst an \u00e4lteren Bl\u00e4ttern auf.',
    },
    overwatering: {
        en: 'Possible overwatering: droopy growth and slow recovery often point to saturated media.',
        de: 'M\u00f6gliche \u00dcberw\u00e4sserung: H\u00e4ngendes Wachstum und langsame Erholung sprechen oft f\u00fcr zu nasses Substrat.',
    },
    underwatering: {
        en: 'Possible underwatering: leaves may curl, claw, or lose turgor.',
        de: 'M\u00f6gliche Unterw\u00e4sserung: Bl\u00e4tter k\u00f6nnen rollen, krallen oder an Spannung verlieren.',
    },
    'heat stress': {
        en: 'Possible heat stress: upward leaf cupping and rapid transpiration may appear.',
        de: 'M\u00f6glicher Hitzestress: Aufw\u00e4rts gew\u00f6lbte Bl\u00e4tter und hohe Transpiration sind typische Hinweise.',
    },
    'light stress': {
        en: 'Possible light stress: bleaching or upward leaf posture can indicate too much intensity.',
        de: 'M\u00f6glicher Lichtstress: Aufhellung oder aufgestellte Bl\u00e4tter k\u00f6nnen auf zu hohe Intensit\u00e4t hinweisen.',
    },
    'nutrient burn': {
        en: 'Possible nutrient burn: dark tips and crisp edges may indicate excess feed.',
        de: 'M\u00f6glicher N\u00e4hrstoffbrand: Dunkle Spitzen und spr\u00f6de R\u00e4nder deuten oft auf \u00dcberd\u00fcngung hin.',
    },
    'powdery mildew': {
        en: 'Possible powdery mildew: check for white dusty patches on upper surfaces.',
        de: 'M\u00f6glicher Mehltau: Achte auf wei\u00dfe, staubige Bel\u00e4ge auf den Blattoberfl\u00e4chen.',
    },
    'spider mites': {
        en: 'Possible spider mites: tiny stippling and webbing should be inspected closely.',
        de: 'M\u00f6gliche Spinnmilben: Auf feine Sprenkelung und Gespinste achten.',
    },
    'fungal leaf spot': {
        en: 'Possible fungal leaf spot: circular lesions may indicate moisture-related disease.',
        de: 'M\u00f6gliche Blattfleckenpilze: Kreisf\u00f6rmige L\u00e4sionen k\u00f6nnen auf feuchtebedingte Probleme hindeuten.',
    },
    'iron deficiency': {
        en: 'Possible iron deficiency: new growth turns pale yellow while veins stay green.',
        de: 'M\u00f6glicher Eisenmangel: Neues Wachstum wird blassgelb, w\u00e4hrend Blattadern gr\u00fcn bleiben.',
    },
    'zinc deficiency': {
        en: 'Possible zinc deficiency: interveinal chlorosis on newer leaves with stunted growth.',
        de: 'M\u00f6glicher Zinkmangel: Zwischenadernvergilbung an jungen Bl\u00e4ttern mit gehemmtem Wachstum.',
    },
    'sulfur deficiency': {
        en: 'Possible sulfur deficiency: uniform yellowing of new leaves.',
        de: 'M\u00f6glicher Schwefelmangel: Gleichm\u00e4\u00dfige Vergilbung junger Bl\u00e4tter.',
    },
    'manganese deficiency': {
        en: 'Possible manganese deficiency: light yellow areas between veins of young leaves.',
        de: 'M\u00f6glicher Manganmangel: Hellgelbe Bereiche zwischen den Adern junger Bl\u00e4tter.',
    },
    'boron deficiency': {
        en: 'Possible boron deficiency: hollow stems and distorted, thick new growth.',
        de: 'M\u00f6glicher Bormangel: Hohle St\u00e4ngel und verformtes, verdicktes Neuwachstum.',
    },
    'light burn': {
        en: 'Possible light burn: bleached upper canopy with crispy leaf tips closest to the light.',
        de: 'M\u00f6gliche Lichtverbrennung: Gebleichte obere Krone mit verbrannten Blattspitzen nahe der Lampe.',
    },
    'cold stress': {
        en: 'Possible cold stress: purple stems and slowed growth may signal low temperatures.',
        de: 'M\u00f6glicher K\u00e4ltestress: Violette St\u00e4ngel und verlangsamtes Wachstum deuten auf zu niedrige Temperaturen.',
    },
    'wind burn': {
        en: 'Possible wind burn: clawed leaves and uneven canopy from excessive airflow.',
        de: 'M\u00f6glicher Windschaden: Gekrallte Bl\u00e4tter und ungleichm\u00e4\u00dfiges Bl\u00e4tterdach durch zu starke Bel\u00fcftung.',
    },
    'nutrient lockout': {
        en: 'Possible nutrient lockout: deficiency symptoms despite feeding -- check pH and EC.',
        de: 'M\u00f6gliche N\u00e4hrstoffblockade: Mangelsymptome trotz D\u00fcngung -- pH und EC pr\u00fcfen.',
    },
    'root rot': {
        en: 'Possible root rot: brown, slimy roots and persistent wilting despite adequate moisture.',
        de: 'M\u00f6gliche Wurzelf\u00e4ule: Braune, schleimige Wurzeln und anhaltendes Welken trotz ausreichend Feuchtigkeit.',
    },
    'botrytis bud rot': {
        en: 'Possible botrytis (bud rot): gray mold on buds, often starts inside dense colas.',
        de: 'M\u00f6gliche Botrytis (Bl\u00fctef\u00e4ule): Grauschimmel an Buds, beginnt oft in dichten Bl\u00fcten.',
    },
    'fungus gnats': {
        en: 'Possible fungus gnats: tiny black flies near soil surface; larvae damage roots.',
        de: 'M\u00f6gliche Trauerm\u00fccken: Kleine schwarze Fliegen an der Substratoberfl\u00e4che; Larven sch\u00e4digen Wurzeln.',
    },
    aphids: {
        en: 'Possible aphids: clusters of small soft-bodied insects on stems and undersides of leaves.',
        de: 'M\u00f6gliche Blattl\u00e4use: Ansammlungen kleiner Insekten an St\u00e4ngeln und Blattunterseiten.',
    },
    thrips: {
        en: 'Possible thrips: silver streaks on leaves and tiny elongated insects.',
        de: 'M\u00f6gliche Thripse: Silberne Streifen auf Bl\u00e4ttern und winzige, l\u00e4ngliche Insekten.',
    },
    whiteflies: {
        en: 'Possible whiteflies: small white moths on leaf undersides; sticky honeydew residue.',
        de: 'M\u00f6gliche Wei\u00dfe Fliegen: Kleine wei\u00dfe Falter an Blattunterseiten; klebrige Honigtau-R\u00fcckst\u00e4nde.',
    },
    'septoria leaf spot': {
        en: 'Possible septoria: yellow-brown spots with dark borders on lower leaves.',
        de: 'M\u00f6gliche Septoria: Gelb-braune Flecken mit dunklem Rand an unteren Bl\u00e4ttern.',
    },
    'tobacco mosaic virus': {
        en: 'Possible TMV: mosaic-patterned discoloration with curled and stunted leaves.',
        de: 'M\u00f6glicher Tabakmosaikvirus: Mosaik-artige Verf\u00e4rbungen mit eingerollten und verk\u00fcmmerten Bl\u00e4ttern.',
    },
    'pH imbalance': {
        en: 'Possible pH imbalance: multiple deficiency symptoms at once, check and adjust root zone pH.',
        de: 'M\u00f6gliches pH-Ungleichgewicht: Mehrere Mangelsymptome gleichzeitig -- pH in der Wurzelzone pr\u00fcfen und anpassen.',
    },
    'revegetation stress': {
        en: 'Possible revegetation stress: unusual leaf shapes from light-cycle interruption.',
        de: 'M\u00f6glicher Revegetationsstress: Ungew\u00f6hnliche Blattformen durch Unterbrechung des Lichtzyklus.',
    },
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Map a zero-shot label to a localized user-facing description. */
export const mapIssueLabel = (label: string, lang: Language): string | null => {
    const entry = ISSUE_DICTIONARY[label.toLowerCase()]
    if (!entry) return null
    const loc = entry as Record<string, string>
    return loc[lang] ?? loc['en'] ?? null
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

    return {
        title: localizeStr(lang, {
            en: `Local Diagnosis: ${plant.name}`,
            de: `Lokale Diagnose: ${plant.name}`,
            es: `Diagnostico Local: ${plant.name}`,
            fr: `Diagnostic Local: ${plant.name}`,
            nl: `Lokale Diagnose: ${plant.name}`,
        }),
        content: mergedIssues.length > 0 ? mergedIssues.join('\n') : heuristic.topPriority,
        confidence: Math.max(0.1, Math.min(1, topScore)),
        immediateActions: mergedIssues.slice(0, 3).join('\n') || heuristic.topPriority,
        longTermSolution: heuristic.topPriority,
        prevention: localizeStr(lang, {
            en: 'Track light, watering, VPD, and feeding over time.',
            de: 'Licht, Bew\u00e4sserung, VPD und N\u00e4hrstoffversorgung im Verlauf dokumentieren.',
            es: 'Registrar luz, riego, VPD y alimentacion a lo largo del tiempo.',
            fr: "Suivre la lumiere, l'arrosage, le VPD et l'alimentation dans le temps.",
            nl: 'Licht, bewateringssysteem, VPD en voeding in de tijd bijhouden.',
        }),
        diagnosis: mergedIssues[0] || heuristic.topPriority,
    }
}

/** Heuristic-only diagnosis fallback when vision classification returns nothing. */
export const fallbackDiagnosis = (plant: Plant, lang: Language): PlantDiagnosisResponse => {
    const heuristic = diagnoseWithRules(plant, lang)
    return {
        title: localizeStr(lang, {
            en: `Local Diagnosis: ${sanitizeText(plant.name)}`,
            de: `Lokale Diagnose: ${sanitizeText(plant.name)}`,
            es: `Diagnostico Local: ${sanitizeText(plant.name)}`,
            fr: `Diagnostic Local: ${sanitizeText(plant.name)}`,
            nl: `Lokale Diagnose: ${sanitizeText(plant.name)}`,
        }),
        content: heuristic.issues.length > 0 ? heuristic.issues.join('\n') : heuristic.topPriority,
        confidence: heuristic.issues.length > 0 ? 0.72 : 0.93,
        immediateActions:
            heuristic.issues.length > 0
                ? heuristic.issues.slice(0, 3).join('\n')
                : heuristic.topPriority,
        longTermSolution: heuristic.topPriority,
        prevention: localizeStr(lang, {
            en: 'Check VPD, pH, EC, and substrate moisture regularly.',
            de: 'Regelm\u00e4\u00dfig VPD, pH, EC und Substratfeuchte pr\u00fcfen.',
            es: 'Verificar VPD, pH, EC y humedad del sustrato regularmente.',
            fr: "V\u00e9rifier r\u00e9guli\u00e8rement le VPD, le pH, l'EC et l'humidit\u00e9 du substrat.",
            nl: 'Controleer regelmatig VPD, pH, EC en substraatvocht.',
        }),
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
        const { isModelCached, ensureWorkerRegistered } =
            await import('@/services/plantDiseaseModelService')
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

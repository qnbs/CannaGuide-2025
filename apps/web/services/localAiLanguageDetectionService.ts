import { loadTransformersPipeline, type LocalAiPipeline } from './localAIModelLoader'
import { captureLocalAiError } from './sentryService'
import DOMPurify from 'dompurify'

/**
 * Local AI Language Detection Service — detects the language of user input
 * on-device using a lightweight zero-shot classification model.
 *
 * Used for:
 * • Automatic AI response language selection
 * • Bilingual query routing (EN/DE)
 * • Journal entry language tagging
 *
 * Falls back to simple heuristic detection when model is unavailable.
 */

const LANG_DETECT_TIMEOUT_MS = 15_000

/** Race a promise against a timeout. */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Language detection timeout')), ms)
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

// ─── Model ───────────────────────────────────────────────────────────────────
const LANG_MODEL_ID = 'Xenova/mobilebert-uncased-mnli'

let langPipeline: Promise<LocalAiPipeline> | null = null

const loadLangPipeline = (): Promise<LocalAiPipeline> => {
    if (!langPipeline) {
        langPipeline = loadTransformersPipeline('zero-shot-classification', LANG_MODEL_ID, {
            quantized: true,
        }).catch((error: unknown) => {
            langPipeline = null
            captureLocalAiError(error, { model: LANG_MODEL_ID, stage: 'preload' })
            throw error
        })
    }
    return langPipeline
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type DetectedLanguage = 'en' | 'de' | 'unknown'

export interface LanguageDetectionResult {
    language: DetectedLanguage
    confidence: number
    method: 'model' | 'heuristic'
}

// ─── German Indicator Words ──────────────────────────────────────────────────

const GERMAN_INDICATORS = new Set([
    'und',
    'der',
    'die',
    'das',
    'ist',
    'ein',
    'eine',
    'nicht',
    'ich',
    'sie',
    'es',
    'wir',
    'auf',
    'für',
    'mit',
    'den',
    'von',
    'zu',
    'dass',
    'werden',
    'wie',
    'oder',
    'aber',
    'wenn',
    'auch',
    'noch',
    'nach',
    'über',
    'nur',
    'kann',
    'haben',
    'hat',
    'wird',
    'bei',
    'pflanze',
    'blatt',
    'blätter',
    'wasser',
    'erde',
    'licht',
    'dünger',
    'ernte',
    'blüte',
    'wachstum',
    'nährstoff',
    'temperatur',
    'feuchtigkeit',
    'sorte',
    'samen',
    'topf',
])

const ENGLISH_INDICATORS = new Set([
    'the',
    'is',
    'are',
    'was',
    'were',
    'and',
    'but',
    'for',
    'not',
    'you',
    'all',
    'can',
    'her',
    'his',
    'one',
    'our',
    'out',
    'day',
    'had',
    'has',
    'how',
    'its',
    'may',
    'new',
    'now',
    'old',
    'see',
    'way',
    'who',
    'did',
    'get',
    'let',
    'say',
    'she',
    'too',
    'use',
    'plant',
    'leaf',
    'leaves',
    'water',
    'soil',
    'light',
    'nutrient',
    'harvest',
    'flower',
    'growth',
    'strain',
    'seed',
    'pot',
    'temperature',
    'humidity',
    'feed',
    'grow',
])

// ─── Heuristic Detection ─────────────────────────────────────────────────────

/**
 * Fast heuristic language detection using word frequency analysis.
 * Checks for German-specific characters (ä, ö, ü, ß) and indicator words.
 */
export const detectLanguageHeuristic = (text: string): LanguageDetectionResult => {
    const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
        .trim()
        .toLowerCase()

    if (sanitized.length === 0) {
        return { language: 'unknown', confidence: 0, method: 'heuristic' }
    }

    // Check for German-specific characters
    const germanCharScore = (sanitized.match(/[äöüß]/g)?.length ?? 0) * 3

    // Word-based analysis — limit to prevent DoS on large inputs
    const words = sanitized
        .slice(0, 5000)
        .split(/\s+/)
        .filter((w) => w.length > 1)
    let deScore = germanCharScore
    let enScore = 0

    for (const word of words) {
        const cleaned = word.replace(/[^a-zäöüß]/g, '')
        if (GERMAN_INDICATORS.has(cleaned)) deScore++
        if (ENGLISH_INDICATORS.has(cleaned)) enScore++
    }

    const total = deScore + enScore
    if (total === 0) {
        return { language: 'unknown', confidence: 0.3, method: 'heuristic' }
    }

    if (deScore > enScore) {
        return {
            language: 'de',
            confidence: Math.min(0.95, 0.5 + (deScore - enScore) / (total * 2)),
            method: 'heuristic',
        }
    }

    return {
        language: 'en',
        confidence: Math.min(0.95, 0.5 + (enScore - deScore) / (total * 2)),
        method: 'heuristic',
    }
}

// ─── Model-Based Detection ───────────────────────────────────────────────────

/**
 * Detect language using the zero-shot classification model.
 * Falls back to heuristic if the model is unavailable.
 */
export const detectLanguage = async (text: string): Promise<LanguageDetectionResult> => {
    const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
        .trim()
        .slice(0, 512)

    if (sanitized.length < 3) {
        return detectLanguageHeuristic(sanitized)
    }

    try {
        const pipeline = await loadLangPipeline()
        const result = await withTimeout(
            pipeline(sanitized, {
                candidate_labels: ['English text', 'German text (Deutsch)'],
                multi_label: false,
            }),
            LANG_DETECT_TIMEOUT_MS,
        )

        const output = result as { labels?: string[]; scores?: number[] }
        const topLabel = output.labels?.[0] ?? ''
        const topScore = output.scores?.[0] ?? 0.5

        const detectedLang: DetectedLanguage = topLabel.toLowerCase().includes('german')
            ? 'de'
            : topLabel.toLowerCase().includes('english')
              ? 'en'
              : 'unknown'

        return {
            language: detectedLang,
            confidence: topScore,
            method: 'model',
        }
    } catch (error) {
        captureLocalAiError(error, { model: LANG_MODEL_ID, stage: 'inference' })
        return detectLanguageHeuristic(sanitized)
    }
}

/** Preload the language detection model. */
export const preloadLanguageDetectionModel = async (): Promise<boolean> => {
    try {
        await loadLangPipeline()
        return true
    } catch {
        return false
    }
}

/** Reset internal state (tests). */
export const resetLanguageDetectionPipeline = (): void => {
    langPipeline = null
}

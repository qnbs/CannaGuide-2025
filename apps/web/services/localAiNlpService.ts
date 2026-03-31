import { enqueueInference, isWorkerAvailable } from './inferenceQueueService'
import { captureLocalAiError } from './sentryService'
import DOMPurify from 'dompurify'

/**
 * Local AI NLP Service — runs dedicated NLP pipelines on-device:
 *
 * - Sentiment analysis   (positive / negative / neutral)
 * - Text summarization   (condense long journal entries)
 * - Zero-shot text classification (categorize free-form queries)
 *
 * All inference is off-loaded to the inference Web Worker via
 * inferenceQueueService to keep the UI thread responsive.
 */

/** Timeout for NLP inference calls (45s -- summarization is heavier). */
const NLP_TIMEOUT_MS = 45_000

// ─── Models ──────────────────────────────────────────────────────────────────
const SENTIMENT_MODEL_ID = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
const SUMMARIZATION_MODEL_ID = 'Xenova/distilbart-cnn-6-6'
const ZERO_SHOT_TEXT_MODEL_ID = 'Xenova/mobilebert-uncased-mnli'

/** Dispatch an NLP task to the inference worker. */
const dispatchNlp = async (
    task: string,
    modelId: string,
    input: unknown,
    inferenceOptions?: Record<string, unknown>,
): Promise<unknown> => {
    if (!isWorkerAvailable()) {
        throw new Error('Inference worker unavailable')
    }
    return enqueueInference({
        task,
        modelId,
        input,
        pipelineOptions: { quantized: true },
        inferenceOptions,
        priority: 'normal',
        timeoutMs: NLP_TIMEOUT_MS,
    })
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SentimentResult {
    label: 'POSITIVE' | 'NEGATIVE'
    score: number
    normalized: 'positive' | 'negative' | 'neutral'
}

export interface SummarizationResult {
    summary: string
    inputLength: number
    outputLength: number
}

export interface TextClassificationResult {
    labels: string[]
    scores: number[]
    topLabel: string
    topScore: number
}

// ─── Sentiment Analysis ──────────────────────────────────────────────────────

/**
 * Analyze the sentiment of a text input.
 * Returns POSITIVE, NEGATIVE, or neutral (when confidence < 0.6).
 */
export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
    const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
    if (sanitized.length === 0) {
        return { label: 'POSITIVE', score: 0.5, normalized: 'neutral' }
    }
    try {
        const result = await dispatchNlp(
            'sentiment-analysis',
            SENTIMENT_MODEL_ID,
            sanitized.slice(0, 512),
        )
        const output = Array.isArray(result) ? result[0] : result
        const typed = output as { label?: string; score?: number }
        const label = (typed.label ?? 'POSITIVE') as 'POSITIVE' | 'NEGATIVE'
        const score = typeof typed.score === 'number' ? typed.score : 0.5
        let normalized: SentimentResult['normalized'] = 'neutral'
        if (score >= 0.6) {
            normalized = label === 'POSITIVE' ? 'positive' : 'negative'
        }
        return { label, score, normalized }
    } catch (error) {
        captureLocalAiError(error, { model: SENTIMENT_MODEL_ID, stage: 'inference' })
        return { label: 'POSITIVE', score: 0.5, normalized: 'neutral' }
    }
}

/**
 * Batch sentiment analysis for multiple texts.
 * Uses allSettled for resilience — individual failures return neutral.
 */
export const analyzeSentimentBatch = async (texts: string[]): Promise<SentimentResult[]> => {
    const results = await Promise.allSettled(texts.map((t) => analyzeSentiment(t)))
    return results.map((r) =>
        r.status === 'fulfilled'
            ? r.value
            : { label: 'POSITIVE' as const, score: 0.5, normalized: 'neutral' as const },
    )
}

// ─── Text Summarization ──────────────────────────────────────────────────────

/**
 * Summarize a long text into a concise paragraph.
 * Useful for condensing verbose grow log entries or mentor histories.
 */
export const summarizeText = async (
    text: string,
    maxLength = 130,
    minLength = 30,
): Promise<SummarizationResult> => {
    const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
    if (sanitized.length < minLength) {
        return { summary: sanitized, inputLength: sanitized.length, outputLength: sanitized.length }
    }
    try {
        // Truncate to 1024 tokens (roughly 4096 chars) to stay within model context
        const truncated = sanitized.slice(0, 4096)
        const result = await dispatchNlp('summarization', SUMMARIZATION_MODEL_ID, truncated, {
            max_length: maxLength,
            min_length: minLength,
            do_sample: false,
        })
        const output = Array.isArray(result) ? result[0] : result
        const summary =
            typeof (output as { summary_text?: string }).summary_text === 'string'
                ? (output as { summary_text: string }).summary_text
                : sanitized.slice(0, maxLength)
        return {
            summary: DOMPurify.sanitize(summary, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
            inputLength: sanitized.length,
            outputLength: summary.length,
        }
    } catch (error) {
        captureLocalAiError(error, { model: SUMMARIZATION_MODEL_ID, stage: 'inference' })
        return {
            summary: sanitized.slice(0, maxLength),
            inputLength: sanitized.length,
            outputLength: Math.min(sanitized.length, maxLength),
        }
    }
}

// ─── Zero-Shot Text Classification ──────────────────────────────────────────

/** Cannabis growing topic categories for query routing. */
export const GROW_TOPIC_LABELS = [
    'watering and irrigation',
    'nutrients and feeding',
    'lighting and photoperiod',
    'temperature and climate',
    'pest control',
    'disease and mold',
    'training and pruning',
    'harvest timing',
    'curing and drying',
    'strain selection',
    'equipment recommendation',
    'pH and EC',
    'VPD optimization',
    'germination',
    'general question',
] as const

export type GrowTopic = (typeof GROW_TOPIC_LABELS)[number]

/**
 * Classify a free-form text query into grow topic categories.
 * Returns ranked labels with confidence scores.
 */
export const classifyGrowTopic = async (
    text: string,
    candidateLabels: readonly string[] = GROW_TOPIC_LABELS,
    topK = 3,
): Promise<TextClassificationResult> => {
    const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
    if (sanitized.length === 0) {
        return {
            labels: ['general question'],
            scores: [1],
            topLabel: 'general question',
            topScore: 1,
        }
    }
    try {
        const result = await dispatchNlp(
            'zero-shot-classification',
            ZERO_SHOT_TEXT_MODEL_ID,
            sanitized.slice(0, 512),
            {
                candidate_labels: [...candidateLabels],
                multi_label: false,
            },
        )
        const output = result as {
            labels?: string[]
            scores?: number[]
        }
        const labels = output.labels?.slice(0, topK) ?? ['general question']
        const scores = output.scores?.slice(0, topK) ?? [1]
        return {
            labels,
            scores,
            topLabel: labels[0] ?? 'general question',
            topScore: scores[0] ?? 1,
        }
    } catch (error) {
        captureLocalAiError(error, { model: ZERO_SHOT_TEXT_MODEL_ID, stage: 'inference' })
        return {
            labels: ['general question'],
            scores: [1],
            topLabel: 'general question',
            topScore: 1,
        }
    }
}

// ─── Journal Sentiment Trend ─────────────────────────────────────────────────

export interface JournalSentimentTrend {
    overall: 'improving' | 'declining' | 'stable'
    recentAverage: number
    entryCount: number
}

/**
 * Analyze sentiment trend across journal entries.
 * Compares the average sentiment of the most recent entries vs. older ones.
 */
export const analyzeJournalSentimentTrend = async (
    entries: Array<{ notes: string; createdAt: number }>,
): Promise<JournalSentimentTrend> => {
    if (entries.length === 0) {
        return { overall: 'stable', recentAverage: 0.5, entryCount: 0 }
    }

    const sorted = entries.toSorted((a, b) => b.createdAt - a.createdAt)
    const recentSlice = sorted.slice(0, Math.min(5, sorted.length))
    const olderSlice = sorted.slice(5, Math.min(10, sorted.length))

    const recentSentiments = await analyzeSentimentBatch(recentSlice.map((e) => e.notes))
    const recentAvg =
        recentSentiments.reduce((sum, s) => sum + s.score, 0) / recentSentiments.length

    if (olderSlice.length === 0) {
        return { overall: 'stable', recentAverage: recentAvg, entryCount: recentSlice.length }
    }

    const olderSentiments = await analyzeSentimentBatch(olderSlice.map((e) => e.notes))
    const olderAvg = olderSentiments.reduce((sum, s) => sum + s.score, 0) / olderSentiments.length

    const delta = recentAvg - olderAvg
    let overall: JournalSentimentTrend['overall'] = 'stable'
    if (delta > 0.1) {
        overall = 'improving'
    } else if (delta < -0.1) {
        overall = 'declining'
    }

    return { overall, recentAverage: recentAvg, entryCount: entries.length }
}

// ─── Preloading ──────────────────────────────────────────────────────────────

export interface NlpPreloadStatus {
    sentimentReady: boolean
    summarizationReady: boolean
    zeroShotReady: boolean
}

/**
 * Preload all NLP pipelines in the background.
 * Returns which models loaded successfully.
 */
export const preloadNlpModels = async (
    onProgress?: (loaded: number, total: number, label: string) => void,
): Promise<NlpPreloadStatus> => {
    const total = 3
    let loaded = 0

    onProgress?.(loaded, total, 'sentiment-model')
    const sentimentResult = await Promise.allSettled([
        dispatchNlp('sentiment-analysis', SENTIMENT_MODEL_ID, 'warmup'),
    ]).then((r) => r[0])
    onProgress?.(++loaded, total, 'summarization-model')

    const summarizationResult = await Promise.allSettled([
        dispatchNlp('summarization', SUMMARIZATION_MODEL_ID, 'warmup', {
            max_length: 30,
            min_length: 5,
            do_sample: false,
        }),
    ]).then((r) => r[0])
    onProgress?.(++loaded, total, 'zero-shot-text-model')

    const zeroShotResult = await Promise.allSettled([
        dispatchNlp('zero-shot-classification', ZERO_SHOT_TEXT_MODEL_ID, 'warmup', {
            candidate_labels: ['test'],
            multi_label: false,
        }),
    ]).then((r) => r[0])
    onProgress?.(++loaded, total, 'nlp-complete')

    return {
        sentimentReady: sentimentResult.status === 'fulfilled',
        summarizationReady: summarizationResult.status === 'fulfilled',
        zeroShotReady: zeroShotResult.status === 'fulfilled',
    }
}

/** Reset all NLP pipeline caches (tests). */
export const resetNlpPipelines = (): void => {
    // Pipelines are managed inside the inference worker;
    // no local state to reset.
}

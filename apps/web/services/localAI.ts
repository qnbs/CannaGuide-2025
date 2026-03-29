import DOMPurify from 'dompurify'
import {
    AIResponse,
    DeepDiveGuide,
    Language,
    MentorMessage,
    Recommendation,
    Plant,
    PlantDiagnosisResponse,
    StructuredGrowTips,
    Strain,
} from '@/types'
import type { BaseAIProvider, ImageStyle } from '@/types/aiProvider'
import {
    AIResponseSchema,
    DeepDiveGuideSchema,
    MentorMessageContentSchema,
    RecommendationSchema,
    StructuredGrowTipsSchema,
} from '@/types/schemas'
import { localAiFallbackService } from '@/services/localAiFallbackService'
import { captureLocalAiError } from '@/services/sentryService'
import {
    loadTransformersPipeline,
    detectOnnxBackend,
    clearPipelineCache,
    evictIdlePipelines,
    getResolvedProfile,
    type LocalAiPipeline,
} from './localAIModelLoader'
import { getCachedInference, setCachedInference } from './localAiCacheService'
import {
    createInferenceTimer,
    recordCacheHit,
    recordCacheMiss,
    debouncedPersistSnapshot,
} from './localAiTelemetryService'
import { enqueueInference, isWorkerAvailable } from './inferenceQueueService'
import { streamTextGeneration } from './localAiStreamingService'
import {
    loadWebLlmEngine,
    generateWithWebLlm,
    getWebLlmModelId,
    disposeWebLlm,
    type WebLlmDeps,
} from './localAiWebLlmService'
import {
    classifyPlantImage,
    buildDiagnosisContent,
    fallbackDiagnosis,
    VISION_MODEL_ID,
} from './localAiDiagnosisService'
import { z } from 'zod'

/** Fallback text model ID (always the lightweight 0.5B). */
const ALT_TEXT_MODEL_ID = 'Xenova/Qwen2.5-0.5B-Instruct'

/** Simple LRU-style inference cache keyed by truncated prompt hash. */
const INFERENCE_CACHE_MAX = 64
const inferenceCache = new Map<string, string>()

const cacheKey = (prompt: string): string => {
    // Dual-hash (djb2 + FNV-1a) plus length for collision resistance
    let djb2 = 5381
    let fnv = 0x811c9dc5
    for (let i = 0; i < prompt.length; i++) {
        const c = prompt.charCodeAt(i)
        djb2 = Math.trunc((djb2 << 5) + djb2 + c)
        fnv = Math.trunc((fnv ^ c) * 0x01000193)
    }
    return `${djb2}_${fnv}_${prompt.length}`
}

const getCached = (prompt: string): string | null => {
    const key = cacheKey(prompt)
    const hit = inferenceCache.get(key)
    if (hit) {
        // Move to end (most recently used)
        inferenceCache.delete(key)
        inferenceCache.set(key, hit)
    }
    return hit ?? null
}

const setCached = (prompt: string, value: string): void => {
    const key = cacheKey(prompt)
    if (inferenceCache.size >= INFERENCE_CACHE_MAX) {
        // Evict oldest entry
        const oldest = inferenceCache.keys().next().value
        if (oldest !== undefined) inferenceCache.delete(oldest)
    }
    inferenceCache.set(key, value)
}

const MAX_RETRIES = 2
/** Timeout for any single inference call (60 seconds). */
const INFERENCE_TIMEOUT_MS = 60_000

/** Allow external callers (settings, tests) to flush the inference cache. */
export const clearInferenceCache = (): void => {
    inferenceCache.clear()
}

/** Race a promise against a timeout (cleans up timer to avoid unhandled rejections). */
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

type GeneratedTextOutput = { generated_text?: string }

const extractGeneratedText = (value: unknown): string | undefined => {
    if (Array.isArray(value)) {
        const first = value[0] as GeneratedTextOutput | undefined
        return first?.generated_text
    }

    return (value as GeneratedTextOutput | undefined)?.generated_text
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

const isGerman = (lang: Language) => lang === 'de'

const localized = (lang: Language, de: string, en: string): string => (isGerman(lang) ? de : en)

const sanitizeText = (value: string): string =>
    DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()

const supportsWebGpu = (): boolean => typeof navigator !== 'undefined' && 'gpu' in navigator

const summarizePlant = (plant: Plant): string =>
    `${sanitizeText(plant.name)} | ${sanitizeText(plant.strain.name)} | stage=${plant.stage} | health=${plant.health.toFixed(0)} | stress=${plant.stressLevel.toFixed(0)} | vpd=${plant.environment.vpd.toFixed(2)} | ph=${plant.medium.ph.toFixed(2)} | ec=${plant.medium.ec.toFixed(2)}`

const fallbackMentorMessage = (
    plant: Plant,
    query: string,
    ragContext: string,
    lang: Language,
): Omit<MentorMessage, 'role'> =>
    localAiFallbackService.getMentorResponse(plant, query, ragContext, lang)

const formatJsonPrompt = (sections: string[]): string => sections.join('\n\n')

const parseJsonSafely = <T>(schema: z.ZodType<T>, value: string): T | null => {
    try {
        const parsed = JSON.parse(value)
        return schema.parse(parsed)
    } catch {
        return null
    }
}

class LocalAiService implements BaseAIProvider {
    readonly id = 'local' as const

    private textPipelinePromise: Promise<LocalAiPipeline> | null = null
    private visionPipelinePromise: Promise<LocalAiPipeline> | null = null

    /** Shared deps for WebLLM inference (avoids re-creating on every call). */
    private readonly webLlmDeps: WebLlmDeps = {
        createInferenceTimer,
        persistGeneratedText: (prompt, content, model) =>
            this.persistGeneratedText(prompt, content, model),
        timeoutMs: INFERENCE_TIMEOUT_MS,
    }

    private async loadTextPipeline(): Promise<LocalAiPipeline> {
        if (!this.textPipelinePromise) {
            const profile = getResolvedProfile()
            const primaryId = profile.transformersModelId
            this.textPipelinePromise = loadTransformersPipeline('text-generation', primaryId, {
                quantized: profile.useQuantized,
            }).catch(async (primaryError: unknown) => {
                console.debug(
                    '[LocalAI] Primary text model failed, retrying with alternate model.',
                    primaryError,
                )
                captureLocalAiError(primaryError, { model: primaryId, stage: 'preload' })
                try {
                    return await loadTransformersPipeline('text-generation', ALT_TEXT_MODEL_ID, {
                        quantized: true,
                    })
                } catch (altError) {
                    // Reset so next call retries instead of returning the rejected promise
                    this.textPipelinePromise = null
                    captureLocalAiError(altError, { model: ALT_TEXT_MODEL_ID, stage: 'fallback' })
                    throw altError
                }
            })
        }
        return this.textPipelinePromise
    }

    private async loadVisionPipeline(): Promise<LocalAiPipeline> {
        if (!this.visionPipelinePromise) {
            this.visionPipelinePromise = loadTransformersPipeline(
                'zero-shot-image-classification',
                VISION_MODEL_ID,
                {
                    quantized: true,
                },
            ).catch((error: unknown) => {
                this.visionPipelinePromise = null
                captureLocalAiError(error, { model: VISION_MODEL_ID, stage: 'preload' })
                throw error
            })
        }
        return this.visionPipelinePromise
    }

    private persistGeneratedText(prompt: string, content: string, model: string): void {
        setCached(prompt, content)
        void setCachedInference(prompt, content, {
            model,
            task: 'text-generation',
        }).catch((error) => captureLocalAiError(error, { stage: 'cache-persist' }))
        debouncedPersistSnapshot()
    }

    private async tryGenerateWithTransformers(
        prompt: string,
        attempt: number,
    ): Promise<string | null> {
        const activeProfile = getResolvedProfile()
        const activeTextId = activeProfile.transformersModelId

        try {
            const timer = createInferenceTimer()
            let generated: string | undefined

            if (isWorkerAvailable()) {
                try {
                    const workerResult = await withTimeout(
                        enqueueInference({
                            task: 'text-generation',
                            modelId: activeTextId,
                            input: prompt,
                            pipelineOptions: { quantized: activeProfile.useQuantized },
                            inferenceOptions: {
                                max_new_tokens: 512,
                                do_sample: true,
                                temperature: 0.6,
                                return_full_text: false,
                            },
                            priority: 'normal',
                            timeoutMs: INFERENCE_TIMEOUT_MS,
                        }),
                        INFERENCE_TIMEOUT_MS,
                    )
                    generated = extractGeneratedText(workerResult)
                } catch (workerError) {
                    console.debug(
                        '[LocalAI] Worker inference failed, falling back to main thread.',
                        workerError,
                    )
                }
            }

            if (!generated) {
                const generator = await this.loadTextPipeline()
                const output = await withTimeout(
                    generator(prompt, {
                        max_new_tokens: 512,
                        do_sample: true,
                        temperature: 0.6,
                        return_full_text: false,
                    }),
                    INFERENCE_TIMEOUT_MS,
                )
                generated = extractGeneratedText(output)
            }

            if (typeof generated !== 'string' || generated.trim().length === 0) {
                return null
            }

            timer.stop({
                model: activeTextId,
                task: 'text-generation',
                backend: detectOnnxBackend(),
                tokensGenerated: Math.ceil(generated.length / 4),
            })
            this.persistGeneratedText(prompt, generated, activeTextId)
            return generated
        } catch (error) {
            console.debug(
                `[LocalAI] Transformers.js text generation failed (attempt ${attempt + 1}).`,
                error,
            )
            captureLocalAiError(error, {
                model: activeTextId,
                stage: 'inference',
                retryAttempt: attempt,
            })
            return null
        }
    }

    private async generateText(prompt: string): Promise<string | null> {
        // Check in-memory inference cache first
        const cached = getCached(prompt)
        if (cached) {
            recordCacheHit()
            return cached
        }

        // Check persistent IndexedDB cache
        const persisted = await getCachedInference(prompt)
        if (persisted) {
            setCached(prompt, persisted) // Backfill in-memory cache
            recordCacheHit()
            return persisted
        }

        recordCacheMiss()

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const webLlmResult = await generateWithWebLlm(prompt, attempt, this.webLlmDeps)
            if (webLlmResult) {
                return webLlmResult
            }

            const transformersResult = await this.tryGenerateWithTransformers(prompt, attempt)
            if (transformersResult) {
                return transformersResult
            }

            if (attempt < MAX_RETRIES) {
                // Brief delay before retry
                await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
            }
        }

        return null
    }

    /**
     * Stream text generation via WebLLM (token-by-token).
     * Falls back to batch `generateText` if WebLLM is unavailable.
     * The onToken callback fires for each generated token chunk.
     * Returns the full concatenated result.
     */
    async generateTextStream(
        prompt: string,
        onToken: (token: string, accumulated: string) => void,
    ): Promise<string | null> {
        return streamTextGeneration(prompt, onToken, {
            getCached,
            setCached,
            loadWebLlmEngine: () =>
                loadWebLlmEngine() as ReturnType<
                    import('./localAiStreamingService').StreamingDeps['loadWebLlmEngine']
                >,
            getWebLlmModelId,
            generateText: (p) => this.generateText(p),
            timeoutMs: INFERENCE_TIMEOUT_MS,
        })
    }

    /**
     * Get detailed diagnostics about WebLLM availability.
     * Delegates to the webLlmDiagnosticsService with current runtime state.
     */
    async getWebLlmDiagnostics(): Promise<
        import('./webLlmDiagnosticsService').WebLlmDiagnosticResult
    > {
        const { diagnoseWebLlm } = await import('./webLlmDiagnosticsService')
        const { getForceWasm } = await import('./localAIModelLoader')
        const profile = getResolvedProfile()
        return diagnoseWebLlm({
            forceWasm: getForceWasm(),
            modelProfileId: profile.webLlmModelId,
        })
    }

    async preloadOfflineAssets(
        includeWebLlm = false,
        onProgress?: (loaded: number, total: number, label: string) => void,
        ecoOnly = false,
    ): Promise<LocalAiPreloadReport> {
        // ── Eco mode: only load the small 0.5B text model ──
        if (ecoOnly) {
            const totalSteps = 1
            let loaded = 0
            onProgress?.(loaded, totalSteps, 'text-model-eco')
            const textResult = await Promise.allSettled([this.loadTextPipeline()]).then((r) => r[0])
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

        const hasEmbeddings = true // Always attempt embedding model
        const hasNlp = true // Always attempt NLP models
        const hasWebLlm = includeWebLlm && supportsWebGpu()
        // Base: text + vision + embedding + 3 NLP + langDetect + imgSimilarity + (optional WebLLM)
        const totalSteps = calculatePreloadTotalSteps(hasEmbeddings, hasNlp, hasWebLlm)
        let loaded = 0

        onProgress?.(loaded, totalSteps, 'text-model')
        const textResult = await Promise.allSettled([this.loadTextPipeline()]).then((r) => r[0])
        onProgress?.(++loaded, totalSteps, 'vision-model')

        const visionResult = await Promise.allSettled([this.loadVisionPipeline()]).then((r) => r[0])
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

        // Language detection model (reuses zero-shot pipeline)
        let langDetectReady = false
        onProgress?.(loaded, totalSteps, 'lang-detection')
        try {
            const { preloadLanguageDetectionModel } =
                await import('./localAiLanguageDetectionService')
            langDetectReady = await preloadLanguageDetectionModel()
        } catch {
            // Non-critical
        }
        onProgress?.(++loaded, totalSteps, 'lang-detection')

        // Image similarity model (reuses CLIP pipeline)
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

        // Image generation capability check (no model preload — SD-Turbo is loaded on-demand)
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
            // Only count core model failures (text + vision) and explicitly attempted optional models
            errorCount:
                Number(textResult.status === 'rejected') +
                Number(visionResult.status === 'rejected') +
                Number(hasWebLlm && webLlmResult?.status === 'rejected'),
        }
    }

    async diagnosePlant(
        base64Image: string,
        mimeType: string,
        plant: Plant,
        userNotes: string,
        lang: Language,
    ): Promise<PlantDiagnosisResponse> {
        const labels = await classifyPlantImage(
            base64Image,
            mimeType,
            () => this.loadVisionPipeline(),
            INFERENCE_TIMEOUT_MS,
        )
        const modelDiagnosis = buildDiagnosisContent(plant, lang, labels)
        const notes = sanitizeText(userNotes)

        if (labels.length === 0) {
            return fallbackDiagnosis(plant, lang)
        }

        const notesLabel = isGerman(lang) ? 'Notizen:' : 'Notes:'
        const contentWithNotes =
            notes.length > 0
                ? `${modelDiagnosis.content}\n\n${notesLabel} ${notes}`
                : modelDiagnosis.content

        return {
            ...modelDiagnosis,
            content: contentWithNotes,
        }
    }

    async getEquipmentRecommendation(prompt: string, lang: Language): Promise<Recommendation> {
        const sanitizedPrompt = sanitizeText(prompt)
        const instruction = localized(
            lang,
            'Erstelle eine strukturierte Ausrüstungsempfehlung auf Deutsch.',
            'Create a structured equipment recommendation in English.',
        )
        const generated = await this.generateText(
            `${instruction}
Prompt: ${sanitizedPrompt}
Return ONLY valid JSON with this exact shape: {"tent":{"name":"...","price":0,"rationale":"..."},"light":{"name":"...","price":0,"rationale":"...","watts":0},"ventilation":{"name":"...","price":0,"rationale":"..."},"circulationFan":{"name":"...","price":0,"rationale":"..."},"pots":{"name":"...","price":0,"rationale":"..."},"soil":{"name":"...","price":0,"rationale":"..."},"nutrients":{"name":"...","price":0,"rationale":"..."},"extra":{"name":"...","price":0,"rationale":"..."},"proTip":"..."}`,
        )

        if (!generated) {
            return localAiFallbackService.getEquipmentRecommendation(sanitizedPrompt, lang)
        }

        const parsed = parseJsonSafely(RecommendationSchema, generated)
        if (!parsed) {
            return localAiFallbackService.getEquipmentRecommendation(sanitizedPrompt, lang)
        }

        return parsed
    }

    async getNutrientRecommendation(
        context: {
            medium: string
            stage: string
            currentEc: number
            currentPh: number
            optimalRange: { ecMin: number; ecMax: number; phMin: number; phMax: number }
            readings: Array<{ ec: number; ph: number; readingType: string; timestamp: number }>
            plant?: {
                name: string
                strain: { name: string }
                stage: string
                age: number
                health: number
                medium: { ph: number; ec: number }
            }
        },
        lang: Language,
    ): Promise<string> {
        const instruction = localized(
            lang,
            'Erstelle eine kompakte Nährstoff-Empfehlung auf Deutsch.',
            'Create a compact nutrient recommendation in English.',
        )
        const generated = await this.generateText(
            `${instruction}
Context: ${sanitizeText(JSON.stringify(context))}
Return a concise plain-text answer with practical next steps, EC/pH guidance, and one medium-specific note. Do not use HTML.`,
        )

        if (generated && generated.trim().length > 0) {
            return sanitizeText(generated)
        }

        return localAiFallbackService.getNutrientRecommendation(context, lang)
    }

    async generateStrainImage(
        strain: Strain,
        style: ImageStyle,
        criteria: { focus: string; composition: string; mood: string },
        lang: Language = 'en',
    ): Promise<string> {
        // Attempt client-side SD-Turbo diffusion with GPU mutex, fall back to SVG heuristic
        try {
            const { checkImageGenCapability, generateStrainImageLocal } =
                await import('./imageGenerationService')
            const capability = checkImageGenCapability()
            if (capability.supported) {
                // GPU mutex is acquired/released inside generateStrainImageLocal
                const result = await generateStrainImageLocal({
                    id: `strain-${strain.id}-${Date.now()}`,
                    strain,
                    style,
                    criteria,
                    lang: lang === 'de' ? 'de' : 'en',
                })
                return result.dataUrl
            }
        } catch (error) {
            captureLocalAiError(error, { model: 'sd-turbo', stage: 'image-generation-local' })
            console.debug('[LocalAI] SD-Turbo image generation failed, falling back to SVG.')
        }
        return localAiFallbackService.generateStrainImage(strain, style, criteria, lang)
    }

    private buildMentorPrompt(
        plant: Plant,
        query: string,
        ragContext: string,
        lang: Language,
    ): string {
        const instruction = isGerman(lang)
            ? 'Antworte als CannaGuide AI auf Deutsch, sachlich, strukturiert und ohne HTML.'
            : 'Answer as CannaGuide AI in English, structured, factual, and without HTML.'

        return formatJsonPrompt([
            instruction,
            `Plant: ${summarizePlant(plant)}`,
            `Context: ${sanitizeText(ragContext)}`,
            `Question: ${sanitizeText(query)}`,
            'Return ONLY valid JSON with this exact shape:',
            '{"title":"...","content":"...","uiHighlights":[]}',
        ])
    }

    async getMentorResponse(
        plant: Plant,
        query: string,
        lang: Language,
        ragContext?: string,
    ): Promise<Omit<MentorMessage, 'role'>> {
        const prompt = this.buildMentorPrompt(plant, query, ragContext ?? '', lang)
        const generated = await this.generateText(prompt)
        if (!generated) {
            return fallbackMentorMessage(plant, query, ragContext ?? '', lang)
        }

        const parsed = parseJsonSafely(MentorMessageContentSchema, generated)
        if (!parsed) {
            return fallbackMentorMessage(plant, query, ragContext ?? '', lang)
        }

        return parsed
    }

    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        const instruction = localized(
            lang,
            'Fasse die Pflanzenlage knapp auf Deutsch zusammen.',
            'Summarize the plant status succinctly in English.',
        )
        const generated = await this.generateText(`${instruction}\n${summarizePlant(plant)}`)
        if (!generated) {
            return localAiFallbackService.getPlantAdvice(plant, lang)
        }
        const parsed = parseJsonSafely(AIResponseSchema, generated)
        if (!parsed) {
            return {
                title: isGerman(lang)
                    ? `Lokale Beratung: ${plant.name}`
                    : `Local Advice: ${plant.name}`,
                content: sanitizeText(generated),
            }
        }
        return parsed
    }

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        return this.getPlantAdvice(plant, lang)
    }

    async getGardenStatusSummary(plants: Plant[], lang: Language): Promise<AIResponse> {
        const summary = plants.map((plant) => summarizePlant(plant)).join('\n')
        const instruction = localized(
            lang,
            'Erstelle eine kurze Zusammenfassung für den gesamten Garten.',
            'Create a short summary for the full grow.',
        )
        const generated = await this.generateText(`${instruction}\n${summary}`)
        if (!generated) {
            return localAiFallbackService.getGardenStatusSummary(plants, lang)
        }
        return {
            title: isGerman(lang) ? 'Lokaler Gartenstatus' : 'Local Garden Status',
            content: sanitizeText(generated),
        }
    }

    async getStrainTips(
        strain: Strain,
        context: { focus: string; stage: string; experienceLevel: string },
        lang: Language,
    ): Promise<StructuredGrowTips> {
        const instruction = localized(
            lang,
            'Gib kompakte Anbautipps auf Deutsch.',
            'Give concise grow tips in English.',
        )
        const generated = await this.generateText(
            `${instruction}\nStrain: ${JSON.stringify(strain)}\nContext: ${JSON.stringify(context)}`,
        )
        if (!generated) {
            return localAiFallbackService.getStrainTips(strain, lang)
        }
        const parsed = parseJsonSafely(StructuredGrowTipsSchema, generated)
        if (!parsed) {
            return localAiFallbackService.getStrainTips(strain, lang)
        }
        return parsed
    }

    async getGrowLogRagAnswer(
        plants: Plant[],
        query: string,
        lang: Language,
        ragContext?: string,
    ): Promise<AIResponse> {
        const plantSummary = ragContext || plants.map((plant) => summarizePlant(plant)).join('\n')
        const instruction = localized(
            lang,
            'Beantworte die Frage anhand des Grow-Log-Kontexts.',
            'Answer the question using the grow-log context.',
        )
        const generated = await this.generateText(
            `${instruction}\nQuestion: ${sanitizeText(query)}\nContext:\n${plantSummary}`,
        )
        if (!generated) {
            return localAiFallbackService.getGrowLogRagAnswer(query, plantSummary, lang)
        }
        return {
            title: isGerman(lang) ? 'RAG-Analyse (lokal)' : 'RAG Analysis (local)',
            content: sanitizeText(generated),
        }
    }

    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        const instruction = localized(
            lang,
            'Erstelle eine tiefe Analyse auf Deutsch.',
            'Create a deep dive guide in English.',
        )
        const generated = await this.generateText(
            `${instruction}\nTopic: ${sanitizeText(topic)}\nPlant: ${summarizePlant(plant)}\nReturn JSON with keys introduction, stepByStep, prosAndCons, proTip.`,
        )
        if (!generated) {
            return {
                introduction: localAiFallbackService.getPlantAdvice(plant, lang).content,
                stepByStep: [
                    isGerman(lang)
                        ? 'Parameter prüfen und Notizen vergleichen.'
                        : 'Check parameters and compare notes.',
                ],
                prosAndCons: {
                    pros: [
                        isGerman(lang) ? 'Lokale Analyse verfügbar.' : 'Local analysis available.',
                    ],
                    cons: [
                        isGerman(lang)
                            ? 'LLM-Modell konnte nicht geladen werden.'
                            : 'LLM model could not be loaded.',
                    ],
                },
                proTip: isGerman(lang)
                    ? 'Einzelne Änderungen getrennt testen.'
                    : 'Test changes one at a time.',
            }
        }
        const parsed = parseJsonSafely(DeepDiveGuideSchema, generated)
        return (
            parsed ?? {
                introduction: sanitizeText(generated),
                stepByStep: [
                    isGerman(lang)
                        ? 'Nutze lokale Diagnosewerte als Ausgangspunkt.'
                        : 'Use the local diagnosis values as a starting point.',
                ],
                prosAndCons: {
                    pros: [
                        isGerman(lang)
                            ? 'Lokales Modell liefert sofortige Hilfe.'
                            : 'The local model provides immediate help.',
                    ],
                    cons: [
                        isGerman(lang)
                            ? 'Antwort ist eventuell knapper als ein Cloud-LLM.'
                            : 'The answer may be shorter than a cloud LLM response.',
                    ],
                },
                proTip: sanitizeText(topic),
            }
        )
    }

    /** Release all loaded model pipelines and WebLLM engine to free GPU/WASM memory. */
    dispose(): void {
        disposeWebLlm()
        this.textPipelinePromise = null
        this.visionPipelinePromise = null
        clearPipelineCache()
        clearInferenceCache()
    }
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

export const localAiService = new LocalAiService()

// ─── Idle Tab Cleanup ────────────────────────────────────────────────────────
// Evict rarely-used pipelines when the tab goes hidden to reduce memory.
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            evictIdlePipelines(2)
        }
    })
}

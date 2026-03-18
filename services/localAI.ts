import DOMPurify from 'dompurify'
import {
    AIResponse,
    DeepDiveGuide,
    Language,
    MentorMessage,
    Plant,
    PlantDiagnosisResponse,
    StructuredGrowTips,
    Strain,
} from '@/types'
import {
    AIResponseSchema,
    DeepDiveGuideSchema,
    MentorMessageContentSchema,
    StructuredGrowTipsSchema,
} from '@/types/schemas'
import { localAiFallbackService, diagnosePlant as diagnoseWithRules } from '@/services/localAiFallbackService'
import { captureLocalAiError } from '@/services/sentryService'
import { loadTransformersPipeline, type LocalAiPipeline } from './localAIModelLoader'
import { z } from 'zod'

const TEXT_MODEL_ID = 'Xenova/Qwen2.5-1.5B-Instruct'
const VISION_MODEL_ID = 'Xenova/clip-vit-large-patch14'
const ALT_TEXT_MODEL_ID = 'Xenova/Qwen3-0.5B'
const WEBLLM_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC'

/** Simple LRU-style inference cache keyed by truncated prompt hash. */
const INFERENCE_CACHE_MAX = 64
const inferenceCache = new Map<string, string>()

const cacheKey = (prompt: string): string => {
    // Use first 200 chars as key – cheap, collision-unlikely for distinct prompts
    return prompt.slice(0, 200)
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

const ZERO_SHOT_LABELS = [
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

const isGerman = (lang: Language) => lang === 'de'

const sanitizeText = (value: string): string => DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()

const supportsWebGpu = (): boolean => typeof navigator !== 'undefined' && 'gpu' in navigator

const toDataUrl = (base64Image: string, mimeType: string): string => {
    if (base64Image.startsWith('data:')) {
        return base64Image
    }
    return `data:${mimeType};base64,${base64Image}`
}

const summarizePlant = (plant: Plant): string =>
    `${plant.name} | ${plant.strain.name} | stage=${plant.stage} | health=${plant.health.toFixed(0)} | stress=${plant.stressLevel.toFixed(0)} | vpd=${plant.environment.vpd.toFixed(2)} | ph=${plant.medium.ph.toFixed(2)} | ec=${plant.medium.ec.toFixed(2)}`

const fallbackMentorMessage = (plant: Plant, query: string, ragContext: string, lang: Language): Omit<MentorMessage, 'role'> =>
    localAiFallbackService.getMentorResponse(plant, query, ragContext, lang)

const fallbackDiagnosis = (plant: Plant, lang: Language): PlantDiagnosisResponse => {
    const heuristic = diagnoseWithRules(plant, lang)
    return {
        title: isGerman(lang) ? `Lokale Diagnose: ${plant.name}` : `Local Diagnosis: ${plant.name}`,
        content: heuristic.issues.length > 0 ? heuristic.issues.join('\n') : heuristic.topPriority,
        confidence: heuristic.issues.length > 0 ? 0.72 : 0.93,
        immediateActions: heuristic.issues.length > 0 ? heuristic.issues.slice(0, 3).join('\n') : heuristic.topPriority,
        longTermSolution: heuristic.topPriority,
        prevention: isGerman(lang)
            ? 'Regelmäßig VPD, pH, EC und Substratfeuchte prüfen.'
            : 'Check VPD, pH, EC, and substrate moisture regularly.',
        diagnosis: heuristic.issues.length > 0 ? heuristic.issues[0] : heuristic.topPriority,
    }
}

const formatJsonPrompt = (sections: string[]): string => sections.join('\n\n')

const parseJsonSafely = <T>(schema: z.ZodType<T>, value: string): T | null => {
    try {
        const parsed = JSON.parse(value)
        return schema.parse(parsed)
    } catch {
        return null
    }
}

class LocalAiService {
    private textPipelinePromise: Promise<LocalAiPipeline> | null = null
    private visionPipelinePromise: Promise<LocalAiPipeline> | null = null
    private webLlmPromise: Promise<LocalWebLlmEngine | null> | null = null

    private async loadTextPipeline(): Promise<LocalAiPipeline> {
        if (!this.textPipelinePromise) {
            this.textPipelinePromise = loadTransformersPipeline('text-generation', TEXT_MODEL_ID, {
                quantized: true,
            }).catch(async (primaryError: unknown) => {
                console.warn('[LocalAI] Primary text model failed, retrying with alternate model.', primaryError)
                captureLocalAiError(primaryError, { model: TEXT_MODEL_ID, stage: 'preload' })
                return loadTransformersPipeline('text-generation', ALT_TEXT_MODEL_ID, {
                    quantized: true,
                })
            })
        }
        return this.textPipelinePromise
    }

    private async loadVisionPipeline(): Promise<LocalAiPipeline> {
        if (!this.visionPipelinePromise) {
            this.visionPipelinePromise = loadTransformersPipeline('zero-shot-image-classification', VISION_MODEL_ID, {
                quantized: true,
            })
        }
        return this.visionPipelinePromise
    }

    private async loadWebLlmEngine(): Promise<LocalWebLlmEngine | null> {
        if (!supportsWebGpu()) {
            return null
        }
        if (!this.webLlmPromise) {
            this.webLlmPromise = (async () => {
                try {
                    const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
                    return (await CreateMLCEngine(WEBLLM_MODEL_ID, {
                        initProgressCallback: (report: unknown) => console.debug('[LocalAI][WebLLM]', report),
                    })) as unknown as LocalWebLlmEngine
                } catch (error) {
                    console.warn('[LocalAI] WebLLM unavailable, falling back to Transformers.js.', error)
                    captureLocalAiError(error, { model: WEBLLM_MODEL_ID, stage: 'webllm' })
                    return null
                }
            })()
        }
        return this.webLlmPromise
    }

    private async generateText(prompt: string): Promise<string | null> {
        // Check inference cache first
        const cached = getCached(prompt)
        if (cached) return cached

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const webLlm = await this.loadWebLlmEngine()
            if (webLlm) {
                try {
                    const response = await webLlm.chat.completions.create({
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.5,
                        max_gen_len: 512,
                    })
                    const content = response?.choices?.[0]?.message?.content
                    if (typeof content === 'string' && content.trim().length > 0) {
                        setCached(prompt, content)
                        return content
                    }
                } catch (error) {
                    console.warn(`[LocalAI] WebLLM generation failed (attempt ${attempt + 1}), falling back to Transformers.js.`, error)
                    captureLocalAiError(error, { model: WEBLLM_MODEL_ID, stage: 'inference', retryAttempt: attempt })
                }
            }

            try {
                const generator = await this.loadTextPipeline()
                const output = await generator(prompt, {
                    max_new_tokens: 512,
                    do_sample: true,
                    temperature: 0.6,
                    return_full_text: false,
                })
                const generated = Array.isArray(output)
                    ? (output[0] as { generated_text?: string } | undefined)?.generated_text
                    : (output as { generated_text?: string } | undefined)?.generated_text
                if (typeof generated === 'string' && generated.trim().length > 0) {
                    setCached(prompt, generated)
                    return generated
                }
            } catch (error) {
                console.warn(`[LocalAI] Transformers.js text generation failed (attempt ${attempt + 1}).`, error)
                captureLocalAiError(error, { model: TEXT_MODEL_ID, stage: 'inference', retryAttempt: attempt })
                if (attempt < MAX_RETRIES) {
                    // Brief delay before retry
                    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
                }
            }
        }

        return null
    }

    async preloadOfflineAssets(
        includeWebLlm = false,
        onProgress?: (loaded: number, total: number, label: string) => void,
    ): Promise<LocalAiPreloadReport> {
        const totalSteps = includeWebLlm && supportsWebGpu() ? 3 : 2
        let loaded = 0

        onProgress?.(loaded, totalSteps, 'text-model')
        const textResult = await Promise.allSettled([this.loadTextPipeline()]).then((r) => r[0])
        onProgress?.(++loaded, totalSteps, 'vision-model')

        const visionResult = await Promise.allSettled([this.loadVisionPipeline()]).then((r) => r[0])
        onProgress?.(++loaded, totalSteps, 'vision-model')

        let webLlmResult: PromiseSettledResult<unknown> | null = null
        if (includeWebLlm && supportsWebGpu()) {
            onProgress?.(loaded, totalSteps, 'web-llm')
            webLlmResult = await Promise.allSettled([this.loadWebLlmEngine()]).then((r) => r[0])
            onProgress?.(++loaded, totalSteps, 'web-llm')
        }

        return {
            textModelReady: textResult.status === 'fulfilled',
            visionModelReady: visionResult.status === 'fulfilled',
            webLlmReady: webLlmResult?.status === 'fulfilled' ? webLlmResult.value !== null : false,
            errorCount:
                Number(textResult.status === 'rejected') +
                Number(visionResult.status === 'rejected') +
                Number(webLlmResult?.status === 'rejected'),
        }
    }

    private async classifyPlantImage(base64Image: string, mimeType: string): Promise<Array<{ label: string; score: number }>> {
        try {
            const classifier = await this.loadVisionPipeline()
            const image = await fetch(toDataUrl(base64Image, mimeType)).then((response) => response.blob())
            const result = await classifier(image, { candidate_labels: [...ZERO_SHOT_LABELS] })
            return Array.isArray(result) ? result : []
        } catch (error) {
            console.warn('[LocalAI] Vision classification failed.', error)
            captureLocalAiError(error, { model: VISION_MODEL_ID, stage: 'vision' })
            return []
        }
    }

    private mapIssueLabel(label: string, lang: Language): string | null {
        const labelKey = label.toLowerCase()
        const dictionary: Record<string, { en: string; de: string }> = {
            'healthy plant': {
                en: 'The plant appears generally healthy in the local model scan.',
                de: 'Die Pflanze wirkt im lokalen Modellscan insgesamt gesund.',
            },
            'nitrogen deficiency': {
                en: 'Possible nitrogen deficiency: older leaves may fade or yellow first.',
                de: 'Möglicher Stickstoffmangel: Ältere Blätter hellen oft zuerst auf.',
            },
            'phosphorus deficiency': {
                en: 'Possible phosphorus deficiency: look for slowed growth and darker foliage.',
                de: 'Möglicher Phosphormangel: Auf verlangsamtes Wachstum und dunkleres Laub achten.',
            },
            'potassium deficiency': {
                en: 'Possible potassium deficiency: leaf edges may crisp or discolor.',
                de: 'Möglicher Kaliummangel: Blattränder können bräunen oder austrocknen.',
            },
            'calcium deficiency': {
                en: 'Possible calcium deficiency: new growth may twist or spot.',
                de: 'Möglicher Calciummangel: Neues Wachstum kann sich verformen oder fleckig werden.',
            },
            'magnesium deficiency': {
                en: 'Possible magnesium deficiency: interveinal chlorosis can appear first on older leaves.',
                de: 'Möglicher Magnesiummangel: Zwischenadernvergilbung tritt oft zuerst an älteren Blättern auf.',
            },
            overwatering: {
                en: 'Possible overwatering: droopy growth and slow recovery often point to saturated media.',
                de: 'Mögliche Überwässerung: Hängendes Wachstum und langsame Erholung sprechen oft für zu nasses Substrat.',
            },
            underwatering: {
                en: 'Possible underwatering: leaves may curl, claw, or lose turgor.',
                de: 'Mögliche Unterwässerung: Blätter können rollen, krallen oder an Spannung verlieren.',
            },
            'heat stress': {
                en: 'Possible heat stress: upward leaf cupping and rapid transpiration may appear.',
                de: 'Möglicher Hitzestress: Aufwärts gewölbte Blätter und hohe Transpiration sind typische Hinweise.',
            },
            'light stress': {
                en: 'Possible light stress: bleaching or upward leaf posture can indicate too much intensity.',
                de: 'Möglicher Lichtstress: Aufhellung oder aufgestellte Blätter können auf zu hohe Intensität hinweisen.',
            },
            'nutrient burn': {
                en: 'Possible nutrient burn: dark tips and crisp edges may indicate excess feed.',
                de: 'Möglicher Nährstoffbrand: Dunkle Spitzen und spröde Ränder deuten oft auf Überdüngung hin.',
            },
            'powdery mildew': {
                en: 'Possible powdery mildew: check for white dusty patches on upper surfaces.',
                de: 'Möglicher Mehltau: Achte auf weiße, staubige Beläge auf den Blattoberflächen.',
            },
            'spider mites': {
                en: 'Possible spider mites: tiny stippling and webbing should be inspected closely.',
                de: 'Mögliche Spinnmilben: Auf feine Sprenkelung und Gespinste achten.',
            },
            'fungal leaf spot': {
                en: 'Possible fungal leaf spot: circular lesions may indicate moisture-related disease.',
                de: 'Mögliche Blattfleckenpilze: Kreisförmige Läsionen können auf feuchtebedingte Probleme hindeuten.',
            },
            'iron deficiency': {
                en: 'Possible iron deficiency: new growth turns pale yellow while veins stay green.',
                de: 'Möglicher Eisenmangel: Neues Wachstum wird blassgelb, während Blattadern grün bleiben.',
            },
            'zinc deficiency': {
                en: 'Possible zinc deficiency: interveinal chlorosis on newer leaves with stunted growth.',
                de: 'Möglicher Zinkmangel: Zwischenadernvergilbung an jungen Blättern mit gehemmtem Wachstum.',
            },
            'sulfur deficiency': {
                en: 'Possible sulfur deficiency: uniform yellowing of new leaves.',
                de: 'Möglicher Schwefelmangel: Gleichmäßige Vergilbung junger Blätter.',
            },
            'manganese deficiency': {
                en: 'Possible manganese deficiency: light yellow areas between veins of young leaves.',
                de: 'Möglicher Manganmangel: Hellgelbe Bereiche zwischen den Adern junger Blätter.',
            },
            'boron deficiency': {
                en: 'Possible boron deficiency: hollow stems and distorted, thick new growth.',
                de: 'Möglicher Bormangel: Hohle Stängel und verformtes, verdicktes Neuwachstum.',
            },
            'light burn': {
                en: 'Possible light burn: bleached upper canopy with crispy leaf tips closest to the light.',
                de: 'Mögliche Lichtverbrennung: Gebleichte obere Krone mit verbrannten Blattspitzen nahe der Lampe.',
            },
            'cold stress': {
                en: 'Possible cold stress: purple stems and slowed growth may signal low temperatures.',
                de: 'Möglicher Kältestress: Violette Stängel und verlangsamtes Wachstum deuten auf zu niedrige Temperaturen.',
            },
            'wind burn': {
                en: 'Possible wind burn: clawed leaves and uneven canopy from excessive airflow.',
                de: 'Möglicher Windschaden: Gekrallte Blätter und ungleichmäßiges Blätterdach durch zu starke Belüftung.',
            },
            'nutrient lockout': {
                en: 'Possible nutrient lockout: deficiency symptoms despite feeding – check pH and EC.',
                de: 'Mögliche Nährstoffblockade: Mangelsymptome trotz Düngung – pH und EC prüfen.',
            },
            'root rot': {
                en: 'Possible root rot: brown, slimy roots and persistent wilting despite adequate moisture.',
                de: 'Mögliche Wurzelfäule: Braune, schleimige Wurzeln und anhaltendes Welken trotz ausreichend Feuchtigkeit.',
            },
            'botrytis bud rot': {
                en: 'Possible botrytis (bud rot): gray mold on buds, often starts inside dense colas.',
                de: 'Mögliche Botrytis (Blütenfäule): Grauschimmel an Buds, beginnt oft in dichten Blüten.',
            },
            'fungus gnats': {
                en: 'Possible fungus gnats: tiny black flies near soil surface; larvae damage roots.',
                de: 'Mögliche Trauermücken: Kleine schwarze Fliegen an der Substratoberfläche; Larven schädigen Wurzeln.',
            },
            aphids: {
                en: 'Possible aphids: clusters of small soft-bodied insects on stems and undersides of leaves.',
                de: 'Mögliche Blattläuse: Ansammlungen kleiner Insekten an Stängeln und Blattunterseiten.',
            },
            thrips: {
                en: 'Possible thrips: silver streaks on leaves and tiny elongated insects.',
                de: 'Mögliche Thripse: Silberne Streifen auf Blättern und winzige, längliche Insekten.',
            },
            whiteflies: {
                en: 'Possible whiteflies: small white moths on leaf undersides; sticky honeydew residue.',
                de: 'Mögliche Weiße Fliegen: Kleine weiße Falter an Blattunterseiten; klebrige Honigtau-Rückstände.',
            },
            'septoria leaf spot': {
                en: 'Possible septoria: yellow-brown spots with dark borders on lower leaves.',
                de: 'Mögliche Septoria: Gelb-braune Flecken mit dunklem Rand an unteren Blättern.',
            },
            'tobacco mosaic virus': {
                en: 'Possible TMV: mosaic-patterned discoloration with curled and stunted leaves.',
                de: 'Möglicher Tabakmosaikvirus: Mosaik-artige Verfärbungen mit eingerollten und verkümmerten Blättern.',
            },
            'pH imbalance': {
                en: 'Possible pH imbalance: multiple deficiency symptoms at once, check and adjust root zone pH.',
                de: 'Mögliches pH-Ungleichgewicht: Mehrere Mangelsymptome gleichzeitig – pH in der Wurzelzone prüfen und anpassen.',
            },
            'revegetation stress': {
                en: 'Possible revegetation stress: unusual leaf shapes from light-cycle interruption.',
                de: 'Möglicher Revegetationsstress: Ungewöhnliche Blattformen durch Unterbrechung des Lichtzyklus.',
            },
        }

        const entry = dictionary[labelKey]
        return entry ? entry[lang] : null
    }

    private buildDiagnosisContent(plant: Plant, lang: Language, labels: Array<{ label: string; score: number }>): PlantDiagnosisResponse {
        const heuristic = diagnoseWithRules(plant, lang)
        const rankedIssues = labels
            .filter((item) => item.label.toLowerCase() !== 'healthy plant')
            .slice(0, 4)
            .map((item) => this.mapIssueLabel(item.label, lang))
            .filter((value): value is string => Boolean(value))

        const mergedIssues = [...rankedIssues, ...heuristic.issues]
        const topScore = labels[0]?.score ?? (mergedIssues.length > 0 ? 0.75 : 0.95)

        return {
            title: isGerman(lang) ? `Lokale Diagnose: ${plant.name}` : `Local Diagnosis: ${plant.name}`,
            content: mergedIssues.length > 0 ? mergedIssues.join('\n') : heuristic.topPriority,
            confidence: Math.max(0.1, Math.min(1, topScore)),
            immediateActions: mergedIssues.slice(0, 3).join('\n') || heuristic.topPriority,
            longTermSolution: heuristic.topPriority,
            prevention: isGerman(lang)
                ? 'Licht, Bewässerung, VPD und Nährstoffversorgung im Verlauf dokumentieren.'
                : 'Track light, watering, VPD, and feeding over time.',
            diagnosis: mergedIssues[0] || heuristic.topPriority,
        }
    }

    async diagnosePlant(base64Image: string, mimeType: string, plant: Plant, userNotes: string, lang: Language): Promise<PlantDiagnosisResponse> {
        const labels = await this.classifyPlantImage(base64Image, mimeType)
        const modelDiagnosis = this.buildDiagnosisContent(plant, lang, labels)
        const notes = sanitizeText(userNotes)

        if (labels.length === 0) {
            return fallbackDiagnosis(plant, lang)
        }

        return {
            ...modelDiagnosis,
            content: notes.length > 0 ? `${modelDiagnosis.content}\n\n${isGerman(lang) ? 'Notizen:' : 'Notes:'} ${notes}` : modelDiagnosis.content,
        }
    }

    private buildMentorPrompt(plant: Plant, query: string, ragContext: string, lang: Language): string {
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

    async getMentorResponse(plant: Plant, query: string, ragContext: string, lang: Language): Promise<Omit<MentorMessage, 'role'>> {
        const prompt = this.buildMentorPrompt(plant, query, ragContext, lang)
        const generated = await this.generateText(prompt)
        if (!generated) {
            return fallbackMentorMessage(plant, query, ragContext, lang)
        }

        const parsed = parseJsonSafely(MentorMessageContentSchema, generated)
        if (!parsed) {
            return fallbackMentorMessage(plant, query, ragContext, lang)
        }

        return parsed
    }

    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        const generated = await this.generateText(
            `${isGerman(lang) ? 'Fasse die Pflanzenlage knapp auf Deutsch zusammen.' : 'Summarize the plant status succinctly in English.'}\n${summarizePlant(plant)}`,
        )
        if (!generated) {
            return localAiFallbackService.getPlantAdvice(plant, lang)
        }
        const parsed = parseJsonSafely(AIResponseSchema, generated)
        if (!parsed) {
            return {
                title: isGerman(lang) ? `Lokale Beratung: ${plant.name}` : `Local Advice: ${plant.name}`,
                content: sanitizeText(generated),
            }
        }
        return parsed
    }

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        return this.getPlantAdvice(plant, lang)
    }

    async getGardenStatusSummary(plants: Plant[], lang: Language): Promise<AIResponse> {
        const summary = plants
            .map((plant) => summarizePlant(plant))
            .join('\n')
        const generated = await this.generateText(
            `${isGerman(lang) ? 'Erstelle eine kurze Zusammenfassung für den gesamten Garten.' : 'Create a short summary for the full grow.'}\n${summary}`,
        )
        if (!generated) {
            return localAiFallbackService.getGardenStatusSummary(plants, lang)
        }
        return {
            title: isGerman(lang) ? 'Lokaler Gartenstatus' : 'Local Garden Status',
            content: sanitizeText(generated),
        }
    }

    async getStrainTips(strain: Strain, context: { focus: string; stage: string; experienceLevel: string }, lang: Language): Promise<StructuredGrowTips> {
        const generated = await this.generateText(
            `${isGerman(lang) ? 'Gib kompakte Anbautipps auf Deutsch.' : 'Give concise grow tips in English.'}\nStrain: ${JSON.stringify(strain)}\nContext: ${JSON.stringify(context)}`,
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

    async getGrowLogRagAnswer(plants: Plant[], query: string, lang: Language): Promise<AIResponse> {
        const plantSummary = plants.map((plant) => summarizePlant(plant)).join('\n')
        const generated = await this.generateText(
            `${isGerman(lang) ? 'Beantworte die Frage anhand des Grow-Log-Kontexts.' : 'Answer the question using the grow-log context.'}\nQuestion: ${sanitizeText(query)}\nContext:\n${plantSummary}`,
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
        const generated = await this.generateText(
            `${isGerman(lang) ? 'Erstelle eine tiefe Analyse auf Deutsch.' : 'Create a deep dive guide in English.'}\nTopic: ${sanitizeText(topic)}\nPlant: ${summarizePlant(plant)}\nReturn JSON with keys introduction, stepByStep, prosAndCons, proTip.`,
        )
        if (!generated) {
            return {
                introduction: localAiFallbackService.getPlantAdvice(plant, lang).content,
                stepByStep: [
                    isGerman(lang) ? 'Parameter prüfen und Notizen vergleichen.' : 'Check parameters and compare notes.',
                ],
                prosAndCons: {
                    pros: [isGerman(lang) ? 'Lokale Analyse verfügbar.' : 'Local analysis available.'],
                    cons: [isGerman(lang) ? 'LLM-Modell konnte nicht geladen werden.' : 'LLM model could not be loaded.'],
                },
                proTip: isGerman(lang) ? 'Einzelne Änderungen getrennt testen.' : 'Test changes one at a time.',
            }
        }
        const parsed = parseJsonSafely(DeepDiveGuideSchema, generated)
        return parsed ?? {
            introduction: sanitizeText(generated),
            stepByStep: [isGerman(lang) ? 'Nutze lokale Diagnosewerte als Ausgangspunkt.' : 'Use the local diagnosis values as a starting point.'],
            prosAndCons: {
                pros: [isGerman(lang) ? 'Lokales Modell liefert sofortige Hilfe.' : 'The local model provides immediate help.'],
                cons: [isGerman(lang) ? 'Antwort ist eventuell knapper als ein Cloud-LLM.' : 'The answer may be shorter than a cloud LLM response.'],
            },
            proTip: sanitizeText(topic),
        }
    }
}

interface LocalWebLlmEngine {
    chat: {
        completions: {
            create: (request: {
                messages: Array<{ role: 'user'; content: string }>
                temperature: number
                max_gen_len: number
            }) => Promise<{
                choices?: Array<{
                    message?: { content?: string }
                }>
            }>
        }
    }
}

export interface LocalAiPreloadReport {
    textModelReady: boolean
    visionModelReady: boolean
    webLlmReady: boolean
    errorCount: number
}

export const localAiService = new LocalAiService()

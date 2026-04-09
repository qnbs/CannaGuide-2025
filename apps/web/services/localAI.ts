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
import { createInferenceTimer } from './localAiInfrastructureService'
import { streamTextGeneration } from './localAiStreamingService'
import { loadWebLlmEngine, getWebLlmModelId } from './localAiWebLlmService'
import {
    classifyPlantImage,
    buildDiagnosisContent,
    fallbackDiagnosis,
} from './localAiDiagnosisService'
import {
    handleEquipmentRecommendation,
    handleNutrientRecommendation,
    handleStrainImageGeneration,
    handleMentorResponse,
    handlePlantAdvice,
    handleGardenStatusSummary,
    handleStrainTips,
    handleGrowLogRagAnswer,
    handleDeepDive,
} from './localAiPromptHandlers'
import { getResolvedProfile } from './localAIModelLoader'
import {
    routeInference,
    getCached,
    setCached,
    WEBLLM_TIMEOUT_MS,
    type InferenceRouterDeps,
} from './localAiInferenceRouter'
import { LocalAiModelManager } from './localAiModelManager'
import { preloadOfflineAssets, type LocalAiPreloadReport } from './localAiPreloadOrchestrator'

export { clearInferenceCache } from './localAiInferenceRouter'
export type { LocalAiPreloadReport } from './localAiPreloadOrchestrator'

/** Legacy single timeout kept for non-layer-specific calls. */
const INFERENCE_TIMEOUT_MS = 30_000

const isGerman = (lang: Language): boolean => lang === 'de'

const sanitizeText = (value: string): string =>
    DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()

class LocalAiService implements BaseAIProvider {
    readonly id = 'local' as const

    private readonly modelManager: LocalAiModelManager
    private readonly routerDeps: InferenceRouterDeps

    constructor(modelManager?: LocalAiModelManager) {
        this.modelManager = modelManager ?? new LocalAiModelManager()
        this.routerDeps = {
            loadTextPipeline: () => this.modelManager.loadTextPipeline(),
            webLlmDeps: {
                createInferenceTimer,
                persistGeneratedText: (_prompt, _content, _model) => {
                    setCached(_prompt, _content)
                },
                timeoutMs: WEBLLM_TIMEOUT_MS,
            },
        }
    }

    private async generateText(prompt: string): Promise<string | null> {
        return routeInference(prompt, this.routerDeps)
    }

    async generateTextStream(
        prompt: string,
        onToken: (token: string, accumulated: string) => void,
    ): Promise<string | null> {
        return streamTextGeneration(prompt, onToken, {
            getCached,
            setCached,
            loadWebLlmEngine: () =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                loadWebLlmEngine() as ReturnType<
                    import('./localAiStreamingService').StreamingDeps['loadWebLlmEngine']
                >,
            getWebLlmModelId,
            generateText: (p) => this.generateText(p),
            timeoutMs: INFERENCE_TIMEOUT_MS,
        })
    }

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
        return preloadOfflineAssets(this.modelManager, includeWebLlm, onProgress, ecoOnly)
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
            () => this.modelManager.loadVisionPipeline(),
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
        return handleEquipmentRecommendation(prompt, lang, (p) => this.generateText(p))
    }

    async getNutrientRecommendation(
        context: {
            medium: string
            stage: string
            currentEc: number
            currentPh: number
            optimalRange: { ecMin: number; ecMax: number; phMin: number; phMax: number }
            readings: Array<{ ec: number; ph: number; readingType: string; timestamp: number }>
            plant?:
                | {
                      name: string
                      strain: { name: string }
                      stage: string
                      age: number
                      health: number
                      medium: { ph: number; ec: number }
                  }
                | undefined
        },
        lang: Language,
    ): Promise<string> {
        return handleNutrientRecommendation(context, lang, (p) => this.generateText(p))
    }

    async generateStrainImage(
        strain: Strain,
        style: ImageStyle,
        criteria: { focus: string; composition: string; mood: string },
        lang: Language = 'en',
    ): Promise<string> {
        return handleStrainImageGeneration(strain, style, criteria, lang)
    }

    async getMentorResponse(
        plant: Plant,
        query: string,
        lang: Language,
        ragContext?: string,
    ): Promise<Omit<MentorMessage, 'role'>> {
        return handleMentorResponse(plant, query, lang, ragContext ?? '', (p) =>
            this.generateText(p),
        )
    }

    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        return handlePlantAdvice(plant, lang, (p) => this.generateText(p))
    }

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        return this.getPlantAdvice(plant, lang)
    }

    async getGardenStatusSummary(plants: Plant[], lang: Language): Promise<AIResponse> {
        return handleGardenStatusSummary(plants, lang, (p) => this.generateText(p))
    }

    async getStrainTips(
        strain: Strain,
        context: { focus: string; stage: string; experienceLevel: string },
        lang: Language,
    ): Promise<StructuredGrowTips> {
        return handleStrainTips(strain, context, lang, (p) => this.generateText(p))
    }

    async getGrowLogRagAnswer(
        plants: Plant[],
        query: string,
        lang: Language,
        ragContext?: string,
    ): Promise<AIResponse> {
        return handleGrowLogRagAnswer(plants, query, lang, ragContext, (p) => this.generateText(p))
    }

    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        return handleDeepDive(topic, plant, lang, (p) => this.generateText(p))
    }

    dispose(): void {
        this.modelManager.dispose()
    }
}

/** Factory function for testability -- inject custom ModelManager. */
export function createLocalAiService(modelManager?: LocalAiModelManager): LocalAiService {
    return new LocalAiService(modelManager)
}

export const localAiService = new LocalAiService()

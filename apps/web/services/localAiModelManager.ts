import {
    loadTransformersPipeline,
    clearPipelineCache,
    evictIdlePipelines,
    getResolvedProfile,
    type LocalAiPipeline,
} from './localAIModelLoader'
import { disposeWebLlm } from './localAiWebLlmService'
import { VISION_MODEL_ID } from './localAiDiagnosisService'
import { captureLocalAiError } from '@/services/sentryService'
import { clearInferenceCache } from './localAiInferenceRouter'

/** Fallback text model ID (always the lightweight 0.5B). */
const ALT_TEXT_MODEL_ID = 'Xenova/Qwen2.5-0.5B-Instruct'

/**
 * Manages model pipeline lifecycle: loading, caching, fallback, disposal.
 * Pipeline promises are cached so repeated calls re-use loading promises.
 */
export class LocalAiModelManager {
    private textPipelinePromise: Promise<LocalAiPipeline> | null = null
    private visionPipelinePromise: Promise<LocalAiPipeline> | null = null

    loadTextPipeline(): Promise<LocalAiPipeline> {
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
                    this.textPipelinePromise = null
                    captureLocalAiError(altError, { model: ALT_TEXT_MODEL_ID, stage: 'fallback' })
                    throw altError
                }
            })
        }
        return this.textPipelinePromise
    }

    loadVisionPipeline(): Promise<LocalAiPipeline> {
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

    /** Release all loaded model pipelines and WebLLM engine to free GPU/WASM memory. */
    dispose(): void {
        disposeWebLlm()
        this.textPipelinePromise = null
        this.visionPipelinePromise = null
        clearPipelineCache()
        clearInferenceCache()
    }
}

// ── Idle Tab Cleanup ────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            evictIdlePipelines(2)
        }
    })
}

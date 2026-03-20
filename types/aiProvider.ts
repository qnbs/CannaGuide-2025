// ---------------------------------------------------------------------------
// BaseAIProvider — Strategy Pattern interface for AI provider abstraction
// ---------------------------------------------------------------------------
// All AI providers (Gemini, OpenAI/xAI, Local WebLLM, Heuristic Fallback)
// implement this interface. The aiService routes calls based on the active
// provider configuration and connectivity state.
// ---------------------------------------------------------------------------

import type {
    Plant,
    Strain,
    Language,
    Recommendation,
    PlantDiagnosisResponse,
    AIResponse,
    StructuredGrowTips,
    DeepDiveGuide,
    MentorMessage,
} from '@/types'

// Re-export ImageStyle from its canonical location so providers don't
// depend on geminiService directly.
export type ImageStyle = 'random' | 'fantasy' | 'botanical' | 'psychedelic' | 'macro' | 'cyberpunk'

/** Nutrient recommendation context shared across all providers. */
export interface NutrientContext {
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
}

/** Image generation criteria shared across providers. */
export interface ImageCriteria {
    focus: string
    composition: string
    mood: string
}

/** Strain tips context shared across providers. */
export interface StrainTipsContext {
    focus: string
    stage: string
    experienceLevel: string
}

// ---------------------------------------------------------------------------
// BaseAIProvider Interface (Strategy Pattern)
// ---------------------------------------------------------------------------

/**
 * Contract that every AI provider must satisfy.
 *
 * Methods return `Promise` for async providers (cloud APIs, WebLLM) while
 * synchronous heuristic providers wrap their results in `Promise.resolve()`.
 *
 * Not every provider supports every capability — optional methods are marked
 * with `?`. The router in `aiService.ts` handles fallback when a method is
 * unavailable.
 */
export interface BaseAIProvider {
    /** Unique identifier for this provider. */
    readonly id: string

    // ── Core Plant AI ──────────────────────────────────────────────────────

    /** Diagnose a plant from an image + context. */
    diagnosePlant(
        base64Image: string,
        mimeType: string,
        plant: Plant,
        userNotes: string,
        lang: Language,
    ): Promise<PlantDiagnosisResponse>

    /** Get cultivation advice for a specific plant. */
    getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse>

    /** Proactive diagnosis based on plant telemetry (no image). */
    getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse>

    /** Interactive mentor conversation about a plant. */
    getMentorResponse(
        plant: Plant,
        query: string,
        lang: Language,
        ragContext?: string,
    ): Promise<Omit<MentorMessage, 'role'>>

    // ── Equipment & Nutrients ──────────────────────────────────────────────

    /** Equipment recommendation based on a free-text prompt. */
    getEquipmentRecommendation(prompt: string, lang: Language): Promise<Recommendation>

    /** Nutrient schedule / correction recommendation. */
    getNutrientRecommendation(context: NutrientContext, lang: Language): Promise<string>

    // ── Strain Knowledge ───────────────────────────────────────────────────

    /** Grow tips for a specific strain. */
    getStrainTips(
        strain: Strain,
        context: StrainTipsContext,
        lang: Language,
    ): Promise<StructuredGrowTips>

    /** Generate a stylized strain image. */
    generateStrainImage?(
        strain: Strain,
        style: ImageStyle,
        criteria: ImageCriteria,
        lang: Language,
    ): Promise<string>

    // ── Garden / Journal ───────────────────────────────────────────────────

    /** Summarize the overall garden status. */
    getGardenStatusSummary(plants: Plant[], lang: Language): Promise<AIResponse>

    /** RAG-powered answer from grow log journal entries. */
    getGrowLogRagAnswer(
        plants: Plant[],
        query: string,
        lang: Language,
        ragContext?: string,
    ): Promise<AIResponse>

    /** Deep-dive guide generation on a cultivation topic. */
    generateDeepDive?(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide>
}

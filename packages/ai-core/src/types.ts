// ---------------------------------------------------------------------------
// Shared AI response types
// ---------------------------------------------------------------------------

/** Token usage metadata returned by AI provider APIs. */
export interface AiUsageMetadata {
    promptTokens: number
    completionTokens: number
    totalTokens: number
}

/** Generic AI text response. */
export interface AIResponse {
    title: string
    content: string
}

/** Structured plant diagnosis result from image analysis. */
export interface PlantDiagnosisResponse {
    title: string
    content: string
    confidence: number
    immediateActions: string
    longTermSolution: string
    prevention: string
    diagnosis: string
}

/** Structured grow tips grouped by category. */
export interface StructuredGrowTips {
    nutrientTip: string
    trainingTip: string
    environmentalTip: string
    proTip: string
}

/** Deep-dive research guide with step-by-step instructions. */
export interface DeepDiveGuide {
    introduction: string
    stepByStep: string[]
    prosAndCons: { pros: string[]; cons: string[] }
    proTip: string
}

/** A single message in the AI mentor conversation. */
export interface MentorMessage {
    id?: string
    role: 'user' | 'model'
    title: string
    content: string
    uiHighlights?: { elementId: string; plantId?: string }[]
}

/** Equipment recommendation item. */
export interface RecommendationItem {
    name: string
    price: number
    rationale: string
    watts?: number
}

/** Equipment category keys. */
export type RecommendationCategory =
    | 'tent'
    | 'light'
    | 'ventilation'
    | 'circulationFan'
    | 'pots'
    | 'soil'
    | 'nutrients'
    | 'extra'

/** Full equipment recommendation set with pro tip. */
export type Recommendation = Record<RecommendationCategory, RecommendationItem> & {
    proTip: string
}

/** Image generation style presets. */
export type ImageStyle = 'random' | 'fantasy' | 'botanical' | 'psychedelic' | 'macro' | 'cyberpunk'

/** AI routing mode — cloud, local (on-device), or hybrid. */
export type AiMode = 'cloud' | 'local' | 'hybrid' | 'eco'

// ---------------------------------------------------------------------------
// @cannaguide/ai-core -- diagnosis & predictive analytics domain types
// ---------------------------------------------------------------------------

import type { RiskLevel } from './enums'

export interface DiagnosisRecord {
    id: string
    plantId: string
    timestamp: number
    label: string
    confidence: number
    severity: 'none' | 'mild' | 'moderate' | 'severe'
    harvestScore: number
    imageId?: string | undefined
}

export interface DiagnosisHistoryState {
    records: DiagnosisRecord[]
}

/** Status of the cached plant disease ONNX model. */
export type ModelStatus = 'not-cached' | 'downloading' | 'ready' | 'error'

/** Knowledge-base recommendation linked to a detected disease label. */
export interface DiseaseRecommendation {
    diseaseId: string
    relatedLexiconKeys: string[]
    relatedArticleIds: string[]
}

/** Result of an on-device leaf image scan (ONNX or zero-shot fallback). */
export interface LeafDiagnosisResult {
    /** Mapped cannabis-term label (e.g. 'spider_mites'). */
    label: string
    /** Top-1 confidence score (0-1). */
    confidence: number
    /** Top-5 class predictions sorted by confidence. */
    top5: Array<{ label: string; confidence: number }>
    /** Severity tier derived from confidence. */
    severity: 'none' | 'mild' | 'moderate' | 'severe'
    /** Disease-atlas recommendations linked to the detected label. */
    recommendations: DiseaseRecommendation[]
    /** Which model produced the result. */
    modelUsed: 'onnx-mobilenet' | 'zero-shot' | 'unavailable'
    /** Inference wall-clock time in milliseconds. */
    latencyMs: number
}

export interface YieldPredictionResult {
    predictedDryWeight: number
    heuristicDryWeight: number
    confidence: number
    sampleCount: number
    usedTensorflowModel: boolean
    explanation: string
}

export interface BotrytisRiskAssessment {
    riskLevel: RiskLevel
    riskScore: number
    factors: string[]
    recommendation: string
}

export interface EnvironmentAlert {
    type: 'temperature' | 'humidity' | 'vpd' | 'ph'
    severity: RiskLevel
    message: string
    currentValue: number
    idealRange: [number, number]
}

export interface PredictiveInsight {
    botrytisRisk: BotrytisRiskAssessment
    environmentAlerts: EnvironmentAlert[]
    yieldImpact: { impactPercent: number; description: string; factors: string[] }
    analyzedSamples: number
    analysisTimestamp: number
}

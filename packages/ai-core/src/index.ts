// ---------------------------------------------------------------------------
// @cannaguide/ai-core — shared AI type definitions & provider abstractions
//
// This package defines the contract between the web app, desktop app, and any
// future consumer that needs to interact with AI services.
// ---------------------------------------------------------------------------

export type { AiProvider, AiProviderConfig, AiProviderKeyMetadata } from './providers'
export type {
    AIResponse,
    PlantDiagnosisResponse,
    StructuredGrowTips,
    DeepDiveGuide,
    MentorMessage,
    Recommendation,
    RecommendationCategory,
    RecommendationItem,
    ImageStyle,
    AiMode,
} from './types'
export {
    AIResponseSchema,
    PlantDiagnosisResponseSchema,
    StructuredGrowTipsSchema,
    DeepDiveGuideSchema,
    RecommendationItemSchema,
    RecommendationSchema,
} from './schemas'

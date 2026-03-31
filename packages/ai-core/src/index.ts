// ---------------------------------------------------------------------------
// @cannaguide/ai-core — shared AI type definitions & provider abstractions
//
// This package defines the contract between the web app, desktop app, and any
// future consumer that needs to interact with AI services.
// Heavy ML dependencies are available via '@cannaguide/ai-core/ml' sub-path.
// ---------------------------------------------------------------------------

export type { AiProvider, AiProviderConfig, AiProviderKeyMetadata } from './providers'
export {
    PROVIDER_CONFIGS,
    KEY_ROTATION_WINDOW_MS,
    isKeyRotationDue,
    isValidProviderKeyFormat,
} from './providers'
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

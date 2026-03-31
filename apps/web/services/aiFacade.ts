/**
 * AI Facade -- Single public entry point for ALL AI capabilities.
 *
 * Consumers should import from this module instead of reaching into
 * individual service files.  The facade exposes:
 *
 *   1. **aiService**       -- routed cloud/local AI methods (diagnose, chat, embed, ...)
 *   2. **aiProviderService** -- multi-provider BYOK key management
 *   3. **localAIInfrastructure** -- cache + telemetry + preload
 *   4. **setAiMode / getAiMode / isEcoMode** -- execution mode helpers
 *
 * The existing `services/aiService.ts` remains the implementation; this
 * file is the stable public API surface that other layers (RTK Query,
 * views, hooks) should target.
 */

// -- Core AI routing (cloud + local) ------------------------------------
export { aiService, setAiMode, getAiMode, isEcoMode } from './aiService'

// -- Multi-provider management ------------------------------------------
export { aiProviderService } from './aiProviderService'
export type { AiProvider, AiProviderConfig } from './aiProviderService'

// -- Infrastructure (cache, telemetry, preload) -------------------------
export { localAIInfrastructure } from './LocalAIInfrastructure'
export type {
    InferenceRecord,
    TelemetrySnapshot,
    PerformanceAlert,
    LocalAiPreloadState,
    LocalAiPreloadStatus,
} from './LocalAIInfrastructure'

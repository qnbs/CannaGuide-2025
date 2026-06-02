/**
 * AiOrchestrator — stable orchestration surface for AI routing and mode.
 *
 * Phase 2 (Master Audit Q2): thin facade over `localRoutingService` so consumers
 * can depend on one module instead of reaching into routing internals.
 *
 * Implementation remains in `localRoutingService.ts`; feature logic stays in
 * `aiService.ts` / `geminiService.ts`.
 */
export {
    setAiMode,
    getAiMode,
    isEcoMode,
    shouldRouteLocally,
    runRouted,
    withLocalFallback,
    withLocalService,
    getGeminiService,
    getLocalAiService,
    captureLocalAiError,
} from '@/services/localRoutingService'

export type { AiMode } from '@/types'

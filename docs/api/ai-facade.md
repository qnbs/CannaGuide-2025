# AI Facade API Reference

> Source: `apps/web/services/aiFacade.ts`
> Implementation: `apps/web/services/aiService.ts`

The AI Facade is the single public entry point for all AI capabilities. Components, hooks, and RTK Query endpoints must import from `aiFacade` -- never from individual service files.

---

## Exports

### 1. `aiService` -- Routed Cloud/Local AI Methods

All methods auto-route between cloud and local AI based on the current `AiMode`:

| Mode            | Routing                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `hybrid`        | Local when offline OR when local models are pre-loaded; cloud otherwise |
| `local`         | Always local AI                                                         |
| `eco`           | Always local AI (0.5B model + WASM only)                                |
| `cloud`         | Cloud AI; falls back to local only when offline                         |
| `localOnlyMode` | Always local AI (privacy mode -- zero outbound traffic)                 |

Every cloud call is wrapped in `withLocalFallback()` -- if the cloud request throws (network error, quota, invalid key), the local stack is used automatically.

#### Plant Diagnosis and Advice

| Method                       | Signature                                                                                  | Return                            | Routing                     |
| ---------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------- | --------------------------- |
| `getEquipmentRecommendation` | `(prompt: string, lang: Language)`                                                         | `Promise<Recommendation>`         | Cloud -> Local              |
| `getNutrientRecommendation`  | `(context: NutrientRecommendationInput, lang: Language)`                                   | `Promise<string>`                 | Cloud -> Local              |
| `diagnosePlant`              | `(base64Image: string, mimeType: string, plant: Plant, userNotes: string, lang: Language)` | `Promise<PlantDiagnosisResponse>` | Cloud -> Local              |
| `getPlantAdvice`             | `(plant: Plant, lang: Language)`                                                           | `Promise<AIResponse>`             | Cloud -> Heuristic fallback |
| `getProactiveDiagnosis`      | `(plant: Plant, lang: Language)`                                                           | `Promise<AIResponse>`             | Cloud -> Heuristic fallback |

#### Streaming Methods (Local AI Only)

Streaming methods yield tokens via `onToken` callback for real-time typing UX. When local AI is unavailable, they fall back to the batch equivalent.

| Method                        | Signature                                                                                              | Return                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `getMentorResponseStream`     | `(plant: Plant, query: string, lang: Language, onToken: (token: string, accumulated: string) => void)` | `Promise<Omit<MentorMessage, 'role'>>` |
| `getPlantAdviceStream`        | `(plant: Plant, lang: Language, onToken: ...)`                                                         | `Promise<AIResponse>`                  |
| `getProactiveDiagnosisStream` | `(plant: Plant, lang: Language, onToken: ...)`                                                         | `Promise<AIResponse>`                  |

#### Knowledge and Analysis

| Method                      | Signature                                                                                   | Return                                          | Routing                                   |
| --------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------- |
| `getMentorResponse`         | `(plant: Plant, query: string, lang: Language)`                                             | `Promise<Omit<MentorMessage, 'role'>>`          | Cloud -> Heuristic (includes RAG context) |
| `getStrainTips`             | `(strain: Strain, context: {focus, stage, experienceLevel}, lang: Language)`                | `Promise<StructuredGrowTips>`                   | Cloud -> Heuristic                        |
| `generateStrainImage`       | `(strain: Strain, style: ImageStyle, criteria: {focus, composition, mood}, lang: Language)` | `Promise<string>`                               | Cloud -> Local                            |
| `generateDeepDive`          | `(topic: string, plant: Plant, lang: Language)`                                             | `Promise<DeepDiveGuide>`                        | Cloud -> Local                            |
| `getGardenStatusSummary`    | `(plants: Plant[], lang: Language)`                                                         | `Promise<AIResponse>`                           | Cloud -> Heuristic                        |
| `getGrowLogRagAnswer`       | `(plants: Plant[], query: string, lang: Language)`                                          | `Promise<AIResponse>`                           | Cloud -> Heuristic (includes RAG context) |
| `analyzeJournalSentiment`   | `(entries: Array<{notes: string, createdAt: number}>)`                                      | `Promise<{overall, recentAverage, entryCount}>` | Local only (NLP)                          |
| `getGeneticTrendAnalysis`   | `(category: GeneticTrendCategory, lang: Language)`                                          | `Promise<AIResponse>`                           | Cloud only (with static fallback)         |
| `getGrowTechRecommendation` | `(setup: GrowSetup, lang: Language)`                                                        | `Promise<AIResponse>`                           | Cloud only (with static fallback)         |

#### NLP Services (Local Only)

| Method             | Signature                            | Return                                                                           |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------------------- |
| `summarizeText`    | `(text: string, maxLength?: number)` | `Promise<string>`                                                                |
| `classifyQuery`    | `(text: string)`                     | `Promise<{topLabel: string, topScore: number}>`                                  |
| `analyzeSentiment` | `(text: string)`                     | `Promise<{label: string, score: number, normalized: string}>`                    |
| `detectLanguage`   | `(text: string)`                     | `Promise<{language: 'en'\|'de'\|'unknown', confidence: number, method: string}>` |

#### Image Analysis (Local Only)

| Method                     | Signature                                                  | Return                                            |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| `compareImages`            | `(imageA: {base64, mimeType}, imageB: {base64, mimeType})` | `Promise<number>` (0-1 similarity)                |
| `analyzeGrowthProgression` | `(photos: Array<{base64, mimeType, timestamp}>)`           | `Promise<{averageChange: number, trend: string}>` |

#### Health and Telemetry

| Method                 | Signature | Return                                           |
| ---------------------- | --------- | ------------------------------------------------ |
| `getTelemetrySnapshot` | `()`      | `Promise<Record<string, unknown> \| null>`       |
| `getHealthReport`      | `()`      | `Promise<Record<string, unknown>>`               |
| `getQuickHealthCheck`  | `()`      | `Promise<{status, memoryPressure, modelsReady}>` |

---

### 2. `aiProviderService` -- Multi-Provider BYOK Management

> Source: `apps/web/services/aiProviderService.ts`
> Config: `packages/ai-core/src/providers.ts`

Manages API keys and provider configuration for cloud AI. Imports `PROVIDER_CONFIGS` and key validation from `@cannaguide/ai-core`.

**Exported types:**

```typescript
type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'xai'

interface AiProviderConfig {
    provider: AiProvider
    apiKey: string
    model?: string
    rotatedAt?: number
}
```

---

### 3. `localAIInfrastructure` -- Cache + Telemetry + Preload

> Source: `apps/web/services/LocalAIInfrastructure.ts`

Singleton class providing cross-cutting infrastructure for the local AI stack. See [local-ai-infrastructure.md](local-ai-infrastructure.md) for full API.

**Exported types:**

```typescript
type InferenceRecord    // Single inference event
type TelemetrySnapshot  // Aggregated latency/success stats
type PerformanceAlert   // Degradation warning
type LocalAiPreloadState  // Preload progress state
type LocalAiPreloadStatus // 'idle' | 'loading' | 'ready' | 'error'
```

---

### 4. Mode Helpers

| Export      | Signature                | Description                                                                     |
| ----------- | ------------------------ | ------------------------------------------------------------------------------- |
| `setAiMode` | `(mode: AiMode) => void` | Switch AI execution mode. Called from listener middleware on settings change.   |
| `getAiMode` | `() => AiMode`           | Get current mode (`'hybrid' \| 'local' \| 'cloud' \| 'eco' \| 'localOnlyMode'`) |
| `isEcoMode` | `() => boolean`          | Convenience check: true when mode is `'eco'`                                    |

---

## Routing Decision Tree

```
User request
    |
    v
shouldRouteLocally()?
    |
    +-- isLocalOnlyMode()    --> LOCAL
    +-- mode == 'local'      --> LOCAL
    +-- mode == 'eco'        --> LOCAL (0.5B + WASM only)
    +-- mode == 'cloud'      --> CLOUD (local fallback if offline)
    +-- mode == 'hybrid'     --> LOCAL if offline or models ready
    |                            CLOUD otherwise (local fallback on error)
    v
Cloud AI call
    |
    +-- success              --> return response
    +-- rate limited         --> show notification + fall back to local
    +-- error                --> fall back to local
```

## Error Handling

- All cloud call failures are caught by `withLocalFallback()` and routed to local AI
- Rate-limit errors (429) trigger a user notification via `useUIStore.addNotification()`
- Local AI failures are captured via `captureLocalAiError()` -> Sentry
- Streaming responses are Zod-validated; invalid JSON falls through to plain-text wrapping

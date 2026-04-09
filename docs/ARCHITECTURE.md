# CannaGuide 2025 -- Architecture Overview

> Standalone architecture reference extracted from the project README.
> For contribution guidelines see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## High-Level Stack

| Layer        | Technology                                                                               |
| ------------ | ---------------------------------------------------------------------------------------- |
| UI           | React 19, Tailwind CSS, Radix UI, 9 cannabis themes                                      |
| State        | Redux Toolkit 2.11 (18 slices), Zustand 5 (8 stores), RTK Query, memoized selectors      |
| AI (Cloud)   | Google Gemini (primary), OpenAI, xAI/Grok, Anthropic (BYOK)                              |
| AI (Local)   | @xenova/transformers (ONNX), @mlc-ai/web-llm (WebGPU), TensorFlow.js                     |
| Build        | Vite 7, vite-plugin-pwa (InjectManifest), React Compiler                                 |
| Persistence  | Dual IndexedDB, localStorage, Service Worker caches                                      |
| i18n         | i18next -- EN, DE, ES, FR, NL (12 namespaces)                                            |
| Workers      | WorkerBus (promise-based, 9 workers, heap-based priority queue, messageId, auto-timeout) |
| Testing      | Vitest 1884 unit tests, Playwright E2E + Component tests                                 |
| Distribution | GitHub Pages, Netlify (PR previews)                                                      |

---

## Directory Structure

The project is a **Turborepo monorepo** with pnpm workspaces. All web app source lives in `apps/web/`.

```
package.json              Workspace root (turbo, eslint, prettier -- NO app deps)
turbo.json                TurboRepo pipeline (build, dev, test, lint, typecheck)
tsconfig.json             References-only (apps/web, packages/*)

apps/web/                 Main PWA (@cannaguide/web)
  package.json            All frontend deps + @cannaguide/ai-core + @cannaguide/ui
  vite.config.ts          Vite build + optionalMlPlugin() for ML stub fallback
  tsconfig.json           strict, baseUrl ".", @/* path alias
  index.tsx               App bootstrap, SW registration, safe recovery
  constants.ts            App-wide constants
  types.ts                Core TypeScript types + AppSettings interface
  i18n.ts                 i18next initialization (5 languages)
  styles.css              Tailwind entry point
  simulation.worker.ts    VPD simulation Web Worker

  components/
    common/               Shared UI: Modal, Card, Toast, DialogWrapper
    icons/                Icon components (Phosphor, custom)
    navigation/           App navigation shell
    ui/                   Primitives: Button, Input, Select, Dialog (Radix)
    views/                Feature views: plants/, strains/, equipment/, settings/

  stores/
    store.ts              Redux store creation + IndexedDB hydration
    useUIStore.ts         Zustand store for transient UI state (modals, views, notifications)
    useTtsStore.ts        Zustand store for TTS queue and speaking state
    useFiltersStore.ts    Zustand store for filter/sort UI state
    useStrainsViewStore.ts Zustand store for strains view UI state
    useIotStore.ts        Zustand store for IoT device UI state
    sensorStore.ts        Zustand vanilla store for real-time sensor data
    useAlertsStore.ts     Zustand store for proactive smart coach alerts
    selectors.ts          Memoized selectors (map-based cache by ID)
    listenerMiddleware.ts Side effects: i18n sync, persistence triggers
    slices/               18 Redux slices (simulation, settings, strains, workerMetrics, hydro, grows, etc.)
    indexedDBStorage.ts   CannaGuideStateDB adapter

  services/
    aiFacade.ts           Public AI entry point (re-exports aiService, aiProviderService, localAIInfrastructure)
    geminiService.ts      Gemini API abstraction (responseSchema)
    aiProviderService.ts  Multi-provider AI routing (BYOK, imports configs from @cannaguide/ai-core)
    aiService.ts          Unified cloud + local AI entry point
    LocalAIInfrastructure.ts Unified cache + telemetry + preload class
    localAI.ts            Pure facade (delegates to router, manager, orchestrator)
    localAiInferenceRouter.ts  Cache -> WebLLM -> Transformers.js routing (retry + backoff)
    localAiModelManager.ts     Pipeline lifecycle (text + vision), primary/alt fallback
    localAiPreloadOrchestrator.ts  8-step preload sequence with progress callbacks
    localAIModelLoader.ts ONNX pipeline loader (WebGPU/WASM, semaphore)
    localAi*.ts           15 local AI service modules
    gpuResourceManager.ts GPU mutex (FIFO queue, WebLLM eviction)
    inferenceQueueService.ts  Priority queue for inference tasks
    crdtService.ts        Y.Doc lifecycle, differential encoding, divergence detection
    crdtSyncBridge.ts     Bidirectional Redux <-> Y.Doc bridge (batching, loop detection, telemetry)
    crdtAdapters.ts       Zod-validated type adapters (Plant, JournalEntry, NutrientSchedule, EcPhReading)
    syncService.ts        CRDT-aware Gist sync (push/pull/force), legacy JSON migration, E2EE
    proactiveCoachService.ts  Smart coach: threshold monitoring + AI advice + cooldown
    knowledgeCalculatorService.ts  Terpene entourage, transpiration, EC/TDS, light spectrum, cannabinoid ratio
    dbService.ts          CannaGuideDB (strains, images, search index)
    cryptoService.ts      AES-256-GCM key encryption at rest
    privacyService.ts     GDPR Art. 17/20 -- full erasure + data export
    pluginService.ts      Plugin architecture (nutrient, hardware, grow)
    sentryService.ts      Sentry error tracking
    consentService.ts     GDPR consent cookie management

  data/                   Static data: 776 strains, FAQ, lexicon (83 entries, 6 categories), guides, diseases (22 entries), learningPaths (5 paths)
  locales/                i18n translations: en/, de/, es/, fr/, nl/
  hooks/                  25 custom React hooks
  workers/                Web Workers: VPD sim, genealogy, scenarios, inference, image gen, hydro forecast, terpene, vision inference, calculation
  services/workerBus.ts   Centralized promise-based WorkerBus (9 workers, priority queue, timeout)
  utils/priorityQueue.ts  Generic min-heap PriorityQueue<T> with WorkerPriority type
  services/ragEmbeddingCacheService.ts  Persistent IndexedDB LRU embedding cache (MiniLM-L6, model versioning, telemetry)
  services/equipmentCalculatorService.ts  Pure-formula service: CO2, Humidity Deficit, Light Hanging Height (Zod-validated)
  utils/                  Shared utilities (secureRandom, etc.)
  types/                  Zod schemas for AI response validation
  lib/                    cn() utility, VPD calculation library
  public/                 Static assets, sw.js, manifest.json
  tests/                  E2E (tests/e2e/) + Component tests (tests/ct/)

packages/
  ai-core/                Shared AI types, provider configs, key validation, ML isolation
    src/
      index.ts            Re-exports types, configs, validation, Zod schemas
      providers.ts        PROVIDER_CONFIGS map, isKeyRotationDue, isValidProviderKeyFormat
      schemas.ts          Zod schemas for AI response validation
      types.ts            AI response types (AIResponse, PlantDiagnosisResponse, etc.)
      ml.ts               Lazy loaders: loadTransformers(), loadWebLlm(), loadGenAI()
  ui/                     Shared design system tokens + Tailwind preset
    src/
      theme.ts            Theme type + ThemeTokens interface
      tokens.css          9 cannabis theme CSS custom properties (478 lines)
      tailwind-preset.cjs Shared Tailwind preset (colors, keyframes, animations)
  iot-mocks/              ESP32 sensor mock server (port 3001)

scripts/                  Build, lint, merge, CI scripts
docker/                   IoT mock servers (ESP32 sensor simulator)
```

---

## State Management Paradigm

The app uses a **dual-store architecture** with clear separation of concerns:

**Redux Toolkit (18 slices, persisted in IndexedDB):**
Simulation, settings, userStrains, favorites, notes, archives, savedItems, knowledge, breeding, sandbox, genealogy, nutrientPlanner, grows, metrics, hydro, growPlanner, diagnosisHistory, workerMetrics (runtime-only). Plus RTK Query (`geminiApi`) for AI API caching with 9 endpoints.

**Zustand (8 stores, transient/never persisted):**
`useUIStore` (views, modals, notifications, onboarding, voice control), `useTtsStore` (TTS queue, speaking state), `useFiltersStore` (filter/sort UI), `useStrainsViewStore` (strains view), `useIotStore` (IoT devices -- localStorage persist for MQTT config), `sensorStore` (real-time sensor data), `useAlertsStore` (proactive smart coach alerts), `useCalculatorSessionStore` (shared room/light session across calculator suite).

**Rule:** New persisted state goes in Redux slices. New UI-only/runtime state goes in Zustand stores. No Zustand persist middleware -- persistence is exclusively Redux + IndexedDB.

## Multi-Grow Architecture

Plants are grouped into **grows** (max 3, enforced by German CanG). Each `Plant` carries a `growId` linking it to a `Grow` entity managed by `growsSlice` (EntityAdapter). A default grow (`default-grow`) is seeded on first boot and during migration v5->v6.

- **growsSlice** -- CRUD for grows with MAX_GROWS=3 hard cap
- **Grow-scoped selectors** -- `selectPlantsForGrow`, `selectNutrientScheduleForGrow` (Map-cached)
- **Grow environment actions** -- `setGrowEnvironment`, `copyGrowEnvironment` (simulationSlice)
- **Migration v5->v6** -- stamps `growId` on all existing plants/schedule entries
- **ADR-0005** documents the architecture decision

## AI Service Architecture

All AI capabilities are exposed through a single facade (`aiFacade.ts`):

- **`aiService`** -- routed cloud/local AI methods (diagnose, chat, embed, etc.)
- **`aiProviderService`** -- multi-provider BYOK key management (imports configs from `@cannaguide/ai-core`)
- **`localAIInfrastructure`** -- unified cache + telemetry + preload class (`LocalAIInfrastructure.ts`)
- **`setAiMode` / `getAiMode` / `isEcoMode`** -- execution mode helpers

Components and hooks must import from `aiFacade`, not from individual service files.

## Monorepo Package Responsibilities

- **`@cannaguide/ai-core`** -- Canonical source for AI provider types (`AiProvider`, `AiProviderConfig`), `PROVIDER_CONFIGS` map, key validation (`isKeyRotationDue`, `isValidProviderKeyFormat`), Zod schemas for AI response validation, and lazy ML loaders. ML dependencies are `optionalDependencies` to isolate heavy binaries.
- **`@cannaguide/ui`** -- Design system tokens: 9 cannabis theme CSS custom properties (`tokens.css`), shared Tailwind preset with colors, keyframes, animations, and shadows (`tailwind-preset.cjs`), theme TypeScript types.

## WorkerBus Architecture

The `workerBus.ts` singleton provides centralized, promise-based communication with all 9 Web Workers:

- **Priority Queue:** min-heap with 4 levels (`critical` > `high` > `normal` > `low`), FIFO tiebreaking
- **Backpressure:** max 3 concurrent dispatches per worker, queued beyond that
- **Priority Preemption (W-02):** when all slots are full and a higher-priority job arrives, the lowest-priority running job is preempted (AbortController-based, main-thread only) and automatically re-queued (max 3 retries before PREEMPTED rejection)
- **Per-Worker Rate Limiting (W-01):** sliding-window limiter (`setRateLimit`/`getRateLimit`), rejects with non-retryable `RATE_LIMITED` error
- **Telemetry Export (W-03):** `exportTelemetry()` returns JSON-serializable `WorkerBusTelemetryExport` with per-worker snapshots (peakLatencyMs, errorRate, timestamps, preemptionCount), integrated with Sentry context (60s interval)
- **Cross-Worker Channels (W-04):** `createChannel(workerA, workerB)` creates a MessageChannel and transfers ports to both workers via `__PORT_TRANSFER__` message; `closeChannel()` tears down; auto-cleanup on unregister/dispose. `WorkerMessageMap` in `workerBus.types.ts` maps worker names to per-message payload/response types; `dispatch()` overloads enforce compile-time type safety for typed workers
- **Abort Support:** AbortController per dispatch, automatic cleanup on cancel
- **Transferable Objects:** zero-copy transfers for ArrayBuffer/ImageBitmap payloads
- **State Sync:** `workerStateSyncService.ts` auto-wires dispatch results to Redux/Zustand via handler registry
- **Telemetry Service:** `workerTelemetryService.ts` connects to Sentry (10% error-rate alerts) and Redux DevTools (5s debounced `workerMetricsSlice`)

Workers: VPD simulation, genealogy, scenario, inference, image generation, hydro forecast, terpene, vision inference, calculation.

## Hydro Monitor Architecture

Real-time hydroponic monitoring with predictive capabilities:

- **`hydroSlice.ts`** -- Redux slice: pH/EC/Temp readings FIFO (168 cap), thresholds, alerts, system type
- **`HydroMonitorView.tsx`** -- Dashboard UI: gauge cards, Recharts pH/EC trend chart, manual input form, alerts, dosing reference panel
- **`hydroForecastService.ts`** -- ONNX worker dispatch with moving-average fallback, trend detection, alert generation
- **`hydroForecastWorker.ts`** -- Off-main-thread ONNX inference: pH/EC/Temp prediction, WASM backend, weighted moving average fallback

## Leaf Diagnosis Architecture

Vision AI plant disease detection pipeline:

- **`plantDiseaseModelService.ts`** -- PlantVillage MobileNetV2 ONNX model: IndexedDB caching, download with progress, HEAD check, `ensureWorkerRegistered()`
- **`visionInferenceWorker.ts`** -- Off-main-thread ONNX inference: 38-class PlantVillage labels, `CANNABIS_MAP`, `preprocessImage()` (ImageNet CHW), `mapToCannabisTerm()`, WorkerBus INIT/CLASSIFY/TERMINATE
- **`LeafDiagnosisPanel.tsx`** -- UI: model status bar, drag-zone upload, camera capture, analyze button, results card with severity badge and RAG-enriched recommendations
- **`localAiDiagnosisService.ts`** -- Orchestration: `classifyLeafImage`, `classifySeverity`, `enrichWithKnowledge`

---

## Data Flow

### Offline-First Persistence

All user data lives in IndexedDB. The Service Worker uses Network-First for navigation and Cache-First for assets. Background Sync queues offline actions.

**Dual IndexedDB Pattern:**

1. **CannaGuideStateDB** -- Redux state snapshot
    - Promise-locked hydration on boot
    - Debounced save (1s) via listener middleware
    - Force-save on `visibilitychange`
    - Corrupted state -> auto-clear + safe recovery (session flag prevents loops)

2. **CannaGuideDB** -- Domain data
    - Strains, images (auto-pruned), full-text search index
    - Offline actions queue
    - Exponential backoff retry on write failures (3 retries, 500/1000/2000ms)

Additional databases: `CannaGuideSecureDB` (crypto keys), `CannaGuideTimeSeriesDB` (IoT sensors), `CannaGuideLocalAiCache` (inference), `CannaGuideImageGenCache` (generated images), `CannaGuideReminderDB` (SW reminders).

### CRDT Sync Layer (Yjs)

Multi-device conflict resolution uses [Yjs](https://github.com/yjs/yjs) CRDTs with automatic merge. The `sync` Vite chunk (~80 KB) is lazy-loaded after Redux hydration.

**Y.Doc schema (`cannaguide-crdt-v1`):**

| Map name            | Key        | Value                   |
| ------------------- | ---------- | ----------------------- |
| `plants`            | plantId    | Y.Map of plant fields   |
| `nutrient-schedule` | scheduleId | Y.Map of schedule entry |
| `nutrient-readings` | readingId  | Y.Map of EC/pH reading  |
| `settings`          | settingKey | Primitive value         |

**Boot order:** IndexedDB hydration -> Redux ready -> `crdtService.initialize()` -> `initCrdtSyncBridge(store)` -> bridge attaches observers.

**Bidirectional bridge:**

- Redux -> CRDT: listener middleware intercepts plant/nutrient actions, enqueues writes via 100ms batch debounce, flushed as a single `doc.transact()` (skipped when `action.meta.fromCrdt === true`)
- CRDT -> Redux: Y.Map observers dispatch `upsertPlant`/`removePlant` with `{ meta: { fromCrdt: true } }` (skipped when transaction origin is `'redux-bridge'`)

**Differential encoding:** `encodeSyncPayload()` uses the stored remote state vector (captured after each pull) to produce delta-only updates. Falls back to full-state encoding when no remote state vector is available (first sync or after `forceLocalToGist`).

**CRDT telemetry:** `reportCrdtTelemetry()` accumulates divergence count, sync payload bytes, conflicts resolved, and last sync duration. Metrics are pushed fire-and-forget to WorkerBus W-03 via `setCrdtMetrics()` and included in `exportTelemetry()`.

**Failure isolation:** CRDT failure does not crash the app. All initialization and observation is `try/catch` wrapped. See [ADR-0004](adr/0004-crdt-yjs-offline-sync.md).

### AI Pipeline

```
User Input
    |
    v
aiFacade.ts  -->  aiService.ts  -->  Cloud available?  --yes-->  aiProviderService.ts
                      |                                               |
                      no                                         geminiService.ts / openai / xai / anthropic
                      |                                               |
                      v                                               v
                  localAI.ts  -->  WebLLM available?             Structured JSON (responseSchema)
                      |               |
                      no             yes --> gpuResourceManager.ts (mutex)
                      |               |
                      v               v
                  Transformers.js   @mlc-ai/web-llm (WebGPU)
                      |
                      no model?
                      |
                      v
                  localAiFallbackService.ts (heuristics)
```

**Concurrency Controls:**

- GPU Mutex (`gpuResourceManager.ts`): FIFO queue between `webllm` and `image-gen`
- Model Loader Semaphore: max 3 concurrent ONNX pipeline loads
- Inference Queue: max 1 concurrent inference task (priority-based)
- Rate Limiter: 15 req/min sliding window for cloud AI

**Eco-Mode:** When `settings.localAi.ecoMode` is true, `getModelRecommendation()` forces WASM backend, smallest model (0.5B q4), disables WebLLM and image generation.

> **API Reference:** See [docs/api/](api/) for detailed method signatures: [AI Facade](api/ai-facade.md), [AI Providers](api/ai-providers.md), [CRDT Sync](api/crdt-sync.md), [Equipment Calculators](api/equipment-calculators.md), [Local AI Infrastructure](api/local-ai-infrastructure.md), [Proactive Coach](api/proactive-coach.md), [RAG Pipeline](api/rag-pipeline.md), [WorkerBus](api/worker-bus.md).

### Plugin System

Declarative plugins stored in IndexedDB (no code execution):

- **Nutrient Schedule** -- brand schedules with weekly EC/pH targets
- **Hardware** -- MQTT/HTTP device commands (Shelly, Sonoff)
- **Grow Profile** -- pre-configured grow recipes

Nutrient plugins integrate with `nutrientPlannerSlice` via `applyPluginSchedule` action.

---

## Security Model

| Measure          | Implementation                                                       |
| ---------------- | -------------------------------------------------------------------- |
| XSS Prevention   | DOMPurify v3 on all `dangerouslySetInnerHTML`                        |
| External Links   | `rel="noopener noreferrer"` enforced                                 |
| API Key Storage  | AES-256-GCM encryption at rest (cryptoService.ts)                    |
| Image Privacy    | EXIF/GPS stripping before AI transmission                            |
| Prompt Injection | 30+ regex patterns block injection attempts                          |
| CSP              | Hardened across 3 paths (`'self' 'unsafe-inline' 'wasm-unsafe-eval') |
| Local-Only Mode  | All outbound services check `isLocalOnlyMode()`                      |
| Randomness       | `secureRandom()` via Web Crypto (no Math.random)                     |
| GDPR             | Full data export (Art. 20) + erasure (Art. 17) via privacyService.ts |
| CI Security      | Semgrep, Gitleaks, Grype, Trojan-source, pnpm audit, Snyk            |
| Fuzzing          | ClusterFuzzLite on PRs                                               |

---

## Build and Deployment

```bash
pnpm run dev              # Vite dev server (localhost:5173)
pnpm run build            # Production build (Vite 7 + PWA manifest injection)
pnpm test                 # Vitest unit/integration (1884 tests)
pnpm run test:e2e         # Playwright E2E
pnpm run test:ct          # Playwright Component tests
pnpm run lint:full        # ESLint entire project
pnpm exec tsc --noEmit         # Type check (strict, zero any)
pnpm run security:scan    # Full security scan suite
pnpm run pr:push          # Push via automated PR workflow
```

**Bundle Strategy:**

- Manual chunks via `CHUNK_GROUPS` in `vite.config.ts` (Three.js, AI runtime, etc.)
- All heavy components use `React.lazy()` + `Suspense`
- AI models loaded via dynamic import only when needed
- React Compiler (`babel-plugin-react-compiler`) auto-memoizes components

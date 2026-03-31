# CannaGuide 2025 -- Architecture Overview

> Standalone architecture reference extracted from the project README.
> For contribution guidelines see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## High-Level Stack

| Layer        | Technology                                                                          |
| ------------ | ----------------------------------------------------------------------------------- |
| UI           | React 19, Tailwind CSS, Radix UI, 9 cannabis themes                                 |
| State        | Redux Toolkit 2.11 (12 slices), Zustand 5 (6 stores), RTK Query, memoized selectors |
| AI (Cloud)   | Google Gemini (primary), OpenAI, xAI/Grok, Anthropic (BYOK)                         |
| AI (Local)   | @xenova/transformers (ONNX), @mlc-ai/web-llm (WebGPU), TensorFlow.js                |
| Build        | Vite 7, vite-plugin-pwa (InjectManifest), React Compiler                            |
| Persistence  | Dual IndexedDB, localStorage, Service Worker caches                                 |
| i18n         | i18next -- EN, DE, ES, FR, NL (13 namespaces)                                       |
| Workers      | WorkerBus (promise-based, 7 workers, messageId correlation, auto-timeout)           |
| Testing      | Vitest 960+ unit tests, Playwright E2E + Component tests                            |
| Distribution | GitHub Pages, Netlify (PR previews), Docker, Tauri v2, Capacitor                    |

---

## Directory Structure

The project is a **Turborepo monorepo** with npm workspaces. All web app source lives in `apps/web/`.

```
package.json              Workspace root (turbo, eslint, prettier -- NO app deps)
turbo.json                TurboRepo pipeline (build, dev, test, lint, typecheck)
tsconfig.json             References-only (apps/web, apps/desktop, packages/*)

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
    selectors.ts          Memoized selectors (map-based cache by ID)
    listenerMiddleware.ts Side effects: i18n sync, persistence triggers
    slices/               12 Redux slices (simulation, settings, strains, etc.)
    indexedDBStorage.ts   CannaGuideStateDB adapter

  services/
    aiFacade.ts           Public AI entry point (re-exports aiService, aiProviderService, localAIInfrastructure)
    geminiService.ts      Gemini API abstraction (responseSchema)
    aiProviderService.ts  Multi-provider AI routing (BYOK, imports configs from @cannaguide/ai-core)
    aiService.ts          Unified cloud + local AI entry point
    LocalAIInfrastructure.ts Unified cache + telemetry + preload class
    localAI.ts            Core local AI orchestration
    localAIModelLoader.ts ONNX pipeline loader (WebGPU/WASM, semaphore)
    localAi*.ts           15 local AI service modules
    gpuResourceManager.ts GPU mutex (FIFO queue, WebLLM eviction)
    inferenceQueueService.ts  Priority queue for inference tasks
    dbService.ts          CannaGuideDB (strains, images, search index)
    cryptoService.ts      AES-256-GCM key encryption at rest
    privacyService.ts     GDPR Art. 17/20 -- full erasure + data export
    pluginService.ts      Plugin architecture (nutrient, hardware, grow)
    sentryService.ts      Sentry error tracking
    consentService.ts     GDPR consent cookie management

  data/                   Static data: 700+ strains, FAQ, lexicon, guides
  locales/                i18n translations: en/, de/, es/, fr/, nl/
  hooks/                  17 custom React hooks
  workers/                Web Workers: VPD sim, genealogy, scenarios, inference, image gen, strain hydration, terpene
  services/workerBus.ts   Centralized promise-based WorkerBus (7 workers, timeout, messageId)
  utils/                  Shared utilities (secureRandom, etc.)
  types/                  Zod schemas for AI response validation
  lib/                    cn() utility, VPD calculation library
  public/                 Static assets, sw.js, manifest.json
  tests/                  E2E (tests/e2e/) + Component tests (tests/ct/)

apps/desktop/             Tauri v2 desktop wrapper (Rust IPC commands)

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

src-tauri/                Tauri v2 desktop config (Rust backend)
scripts/                  Build, lint, merge, CI scripts
docker/                   nginx config, esp32-mock, tauri-mock
```

---

## State Management Paradigm

The app uses a **dual-store architecture** with clear separation of concerns:

**Redux Toolkit (12 slices, persisted in IndexedDB):**
Simulation, settings, userStrains, favorites, notes, archives, savedItems, knowledge, breeding, sandbox, genealogy, nutrientPlanner. Plus RTK Query (`geminiApi`) for AI API caching with 9 endpoints.

**Zustand (6 stores, transient/never persisted):**
`useUIStore` (views, modals, notifications, onboarding, voice control), `useTtsStore` (TTS queue, speaking state), `useFiltersStore` (filter/sort UI), `useStrainsViewStore` (strains view), `useIotStore` (IoT devices), `sensorStore` (real-time sensor data).

**Rule:** New persisted state goes in Redux slices. New UI-only/runtime state goes in Zustand stores. No Zustand persist middleware -- persistence is exclusively Redux + IndexedDB.

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
| CSP              | Hardened across 4 delivery paths                                     |
| Local-Only Mode  | All outbound services check `isLocalOnlyMode()`                      |
| Randomness       | `secureRandom()` via Web Crypto (no Math.random)                     |
| GDPR             | Full data export (Art. 20) + erasure (Art. 17) via privacyService.ts |
| CI Security      | Semgrep, Gitleaks, Grype, Trojan-source, npm audit, Snyk             |
| Fuzzing          | ClusterFuzzLite on PRs                                               |

---

## Build and Deployment

```bash
npm run dev              # Vite dev server (localhost:5173)
npm run build            # Production build (Vite 7 + PWA manifest injection)
npm test                 # Vitest unit/integration (960+ tests)
npm run test:e2e         # Playwright E2E
npm run test:ct          # Playwright Component tests
npm run lint:full        # ESLint entire project
npx tsc --noEmit         # Type check (strict, zero any)
npm run security:scan    # Full security scan suite
npm run pr:push          # Push via automated PR workflow
```

**Bundle Strategy:**

- Manual chunks via `CHUNK_GROUPS` in `vite.config.ts` (Three.js, AI runtime, etc.)
- All heavy components use `React.lazy()` + `Suspense`
- AI models loaded via dynamic import only when needed
- React Compiler (`babel-plugin-react-compiler`) auto-memoizes components

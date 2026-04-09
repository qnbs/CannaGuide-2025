# Copilot Instructions for CannaGuide 2025

## Project Overview

CannaGuide 2025 is a production-grade, AI-powered Progressive Web App (PWA) for cannabis cultivation management. Built with React 19, TypeScript (strict), Redux Toolkit, and Google Gemini AI. The app is 100% offline-first with dual IndexedDB persistence.

**Live:** https://qnbs.github.io/CannaGuide-2025/
**Version:** 1.6.0

---

## Architecture

### Tech Stack

- **Frontend:** React 19 + TypeScript (strict mode, zero `any`)
- **State:** Redux Toolkit (persisted app-state) + Zustand (transient UI-state) + RTK Query (AI API caching)
- **AI:** Google Gemini (primary), OpenAI, xAI/Grok, Anthropic (multi-provider BYOK)
- **Local AI:** @xenova/transformers (ONNX: WebGPU/WASM), @mlc-ai/web-llm (WebGPU), TensorFlow.js, onnxruntime-web -- 22 services, 8 ML models, 3-layer fallback (WebLLM -> Transformers.js -> Heuristics)
- **Build:** Vite 7 + vite-plugin-pwa (InjectManifest)
- **Package Manager:** pnpm 10 via Corepack (shamefully-hoist, workspace:\* protocol)
- **Styling:** Tailwind CSS + Radix UI + 9 cannabis themes
- **Persistence:** Dual IndexedDB (`CannaGuideStateDB` + `CannaGuideDB`)
- **i18n:** i18next (EN + DE + ES + FR + NL, 12 source files per language, single aggregated namespace)
- **Testing:** Vitest (1884 tests) + Playwright E2E + Playwright Component Tests
- **Error Tracking:** Sentry (browser SDK)
- **Security Scanning:** Semgrep, Gitleaks, Grype, Trojan-source, npm audit, Snyk, GitGuardian, CodeAnt AI, Config Guard
- **Distribution:** GitHub Pages, Netlify (PR previews)

### Monorepo Layout

The project uses **pnpm workspaces + TurboRepo** with ML dependencies isolated in `@cannaguide/ai-core`.

```
package.json             # Workspace root (turbo, eslint, prettier -- NO app deps)
pnpm-workspace.yaml      # pnpm workspace definition (packages/*, apps/*)
.npmrc                   # pnpm config (shamefully-hoist, auto-install-peers)
turbo.json               # TurboRepo pipeline (build, dev, test, lint, typecheck)
tsconfig.json            # References-only (apps/web, packages/*)

apps/
  web/                   # Main PWA (React 19 + Vite 7)
    package.json         # @cannaguide/web -- all frontend deps
    vite.config.ts       # Vite build + optionalMlPlugin() for ML stub fallback
    tsconfig.json        # strict, baseUrl ".", @/* path alias
    index.html           # Entry HTML
    index.tsx            # App bootstrap, SW registration, safe recovery
    constants.ts         # App-wide constants
    types.ts             # Core TypeScript types
    i18n.ts              # i18next initialization
    styles.css           # Tailwind entry point
    simulation.worker.ts # VPD simulation Web Worker
    components/          # React components: common/, icons/, navigation/, ui/, views/
    stores/              # Redux: slices/, selectors/, middleware, store config
    services/            # Business logic: AI, simulation, database, crypto, IoT, Sentry
    hooks/               # Custom React hooks (25)
    data/                # Static data: 776 strains, FAQ, lexicon (83 entries), guides, diseases (22 entries), learningPaths (5 paths)
    locales/             # i18n: en/, de/, es/, fr/, nl/ (12 source files each)
    workers/             # Web Workers: VPD sim, genealogy, scenarios, inference, image gen, hydro forecast, terpene, vision inference, calculation
    utils/               # Shared utilities
    types/               # Zod schemas for AI response validation
    lib/                 # Utility library (cn(), VPD calculations)
    public/              # Static assets, SW, manifest
    tests/               # E2E (tests/e2e/) + Component tests (tests/ct/)

packages/
  ai-core/               # Shared AI types, provider configs, key validation, ML isolation
    package.json         # @cannaguide/ai-core -- ML libs as optionalDependencies
    src/
      index.ts           # Re-exports types, configs, validation, schemas
      providers.ts       # PROVIDER_CONFIGS, key validation (isKeyRotationDue, isValidProviderKeyFormat)
      schemas.ts         # Zod schemas for AI response validation
      types.ts           # AI response types (AIResponse, PlantDiagnosisResponse, etc.)
      ml.ts              # Lazy loaders: loadTransformers(), loadWebLlm(), loadGenAI()
  ui/                    # Shared design system tokens + Tailwind preset
    src/
      theme.ts           # Theme type + ThemeTokens interface
      tokens.css         # 9 cannabis theme CSS custom properties (478 lines)
      tailwind-preset.cjs # Shared Tailwind preset (colors, keyframes, animations, shadows)
  iot-mocks/             # ESP32 sensor mock server (port 3001)

scripts/                 # Build/lint/merge scripts
docker/                  # IoT mock servers (ESP32 sensor simulator)
docs/                    # Developer guides, roadmap
.github/                 # 21 CI/CD workflows, issue templates
.devcontainer/           # Codespaces DevContainer (Dockerfile-based, lite-mode)
```

### ML Isolation Strategy

Heavy ML dependencies (`@xenova/transformers`, `@mlc-ai/web-llm`, `onnxruntime-web`) are declared as `optionalDependencies` in `@cannaguide/ai-core`. The web app's `vite.config.ts` includes `optionalMlPlugin()` that stubs missing ML modules at build time, allowing the build to succeed even without ML binaries installed. DevContainer uses `pnpm install --frozen-lockfile` for deterministic lockfile-pinned installs (OSSF Scorecard compliant). ML models are loaded lazily at runtime in-browser.

### Key Patterns

1. **Offline-First:** All data stored in IndexedDB. Service Worker uses Network-First for navigation, Cache-First for assets. Background Sync queues offline actions.

2. **Dual IndexedDB:**
    - `CannaGuideStateDB`: Redux state with promise-locked hydration, debounce-save (1s), force-save on visibilitychange
    - `CannaGuideDB`: Strains, images (auto-pruned), full-text search index

3. **AI Service Facade:** `services/aiFacade.ts` is the single public entry point for all AI capabilities (cloud + local). It re-exports `aiService` (routed methods), `aiProviderService` (BYOK multi-provider), and `localAIInfrastructure` (cache + telemetry + preload as a unified class in `LocalAIInfrastructure.ts`). Structured JSON output via `responseSchema`. Local fallback via `localAiFallbackService.ts`. Dependency map: `docs/architecture/service-dependencies.md` (Mermaid, auto-generated via `scripts/generate-service-map.mjs`).

4. **Safe Recovery:** Boot wraps store creation in try/catch. Corrupted state → auto-clear + restart. Session flag prevents infinite recovery loops.

5. **Memoized Selectors:** Map-based cache keyed by ID. Nullish coalescing (`??`) over logical OR (`||`).

6. **Archive Capping:** Mentor: 100 entries, Advisor: 50/plant, FIFO culling.

7. **Local AI Stack:** 22 service modules orchestrate on-device ML:
    - `localAI.ts` -- Pure facade implementing BaseAIProvider (delegates to router, manager, orchestrator)
    - `localAiInferenceRouter.ts` -- Cache -> WebLLM -> Transformers.js routing with retry + backoff
    - `localAiModelManager.ts` -- Pipeline lifecycle (text + vision), primary/alt fallback, dispose, switchModel
    - `localAiPreloadOrchestrator.ts` -- 8-step preload sequence with progress callbacks
    - `localAIModelLoader.ts` -- ONNX backend detection, pipeline loading (max 3 concurrent), cache, catalog model override
    - `localAiNlpService.ts` -- Sentiment analysis, summarization, zero-shot classification
    - `localAiEmbeddingService.ts` -- MiniLM-L6 embeddings, semantic ranking, batch processing
    - `localAiFallbackService.ts` -- Heuristic fallback when models unavailable
    - `localAiLanguageDetectionService.ts` -- EN/DE detection (model + heuristic)
    - `localAiImageSimilarityService.ts` -- CLIP feature extraction, photo comparison, growth tracking
    - `localAiHealthService.ts` -- Device classification, memory monitoring, adaptive model selection
    - `localAiPreloadService.ts` -- Model preload state (localStorage persistence)
    - `localAiTelemetryService.ts` -- Inference latency/success tracking
    - `localAiCacheService.ts` -- IndexedDB inference cache (256 entries, 7d TTL)
    - `localAiStreamingService.ts` -- SSE-style streaming for local text generation
    - `localAiDiagnosisService.ts` -- Plant health diagnosis pipeline (+ ONNX classifyLeafImage, classifySeverity, enrichWithKnowledge)
    - `localAiPromptHandlers.ts` -- Prompt formatting for all AI features
    - `localAiWebLlmService.ts` -- WebLLM lifecycle, model loading, progress tracking
    - `webLlmModelCatalog.ts` -- Curated 4-model catalog (Qwen2.5-0.5B/1.5B, Llama-3.2-3B, Phi-3.5-mini), GPU-tier auto-selection, MODEL_CATALOG_VERSION
    - `LocalAIInfrastructure.ts` -- Unified cache + telemetry + preload class
    - `localAiInfrastructureService.ts` -- Backward-compatible barrel re-export for LocalAIInfrastructure
    - `localAiWebGpuService.ts` -- Centralized WebGPU adapter, shared device lifecycle, feature detection

8. **Worker Bus:** `workerBus.ts` provides promise-based, type-safe worker communication with backpressure, retry, telemetry, AbortController support, Transferable zero-copy transfers, heap-based priority queue, and pagehide teardown. All 9 workers (VPD simulation, genealogy, scenario, inference, image generation, hydro forecast, terpene, vision inference, calculation) use this bus. Priority levels: `critical` (VPD safety), `high` (user-initiated simulation), `normal` (default), `low` (ML inference, image gen). `PriorityQueue<T>` min-heap in `utils/priorityQueue.ts` with O(log n) enqueue/dequeue and FIFO tiebreaking. `getQueueState()` returns per-priority breakdown. W-02 Priority Preemption -- when all slots are full and a higher-priority job arrives, the lowest-priority running job is preempted (AbortController-based, main-thread only, max 3 re-queues) and the higher-priority job takes the slot. W-04 Cross-Worker Channels -- `createChannel(workerA, workerB)` creates a MessageChannel and transfers ports to both workers via `__PORT_TRANSFER__` message; `closeChannel()` tears down; auto-cleanup on unregister/dispose. W-04 Generic Typed Dispatch -- `WorkerMessageMap` in `workerBus.types.ts` maps worker names to per-message payload/response types; `dispatch()` overloads enforce compile-time type safety for typed workers (simulation, visionInference, hydroForecast); untyped workers fall through to `unknown`. `workerStateSyncService.ts` provides a framework-agnostic handler registry for automatic Redux/Zustand wiring from dispatch results. `workerTelemetryService.ts` connects to Sentry (10% error-rate alerts) and Redux DevTools (5s debounced `workerMetricsSlice`). See `docs/worker-bus.md`.

9. **Seedbank API:** `seedbankService.ts` provides deterministic mock seed pricing/availability. SeedFinder.eu API permanently removed (dead since mid-2024). 5 hardcoded seedbanks with hash-based availability. 5-min in-memory TTL cache. `isLocalOnlyMode()` guard.

10. **Proactive Smart Coach:** `proactiveCoachService.ts` subscribes to the Redux store and monitors plant environment values (temperature, humidity, VPD, pH, EC) against safe thresholds. When a metric breaches limits, the service requests plant-specific advice via `aiFacade.aiService.getPlantAdvice()` and pushes a `SmartAlert` into `useAlertsStore` (Zustand). 2-hour per-metric per-plant cooldown prevents alert spam. Initialised in `index.tsx` after store hydration. `ProactiveAlertBanner.tsx` renders active alerts in `DetailedPlantView`. Browser push notifications dispatched via `nativeBridgeService`.

11. **Notification Service:** `nativeBridgeService.ts` provides browser notification dispatch via the Web Notification API. Permissions requested at app bootstrap. Gracefully degrades to no-op when permissions are denied.

12. **State Management Split:**
    - **Redux Toolkit** (persisted in IndexedDB): simulation, settings, userStrains, favorites, notes, archives, savedItems, knowledge, breeding, genealogy, sandbox, nutrientPlanner, grows. RTK Query for AI API caching (9 endpoints). `workerMetrics` is a runtime-only slice (not persisted) for WorkerBus telemetry visibility in Redux DevTools.
    - **Zustand** (transient, never persisted): `useUIStore` (views, modals, notifications, onboarding, voice control), `useTtsStore` (TTS queue, speaking state), `useFiltersStore` (filter/sort UI), `useStrainsViewStore` (strains view UI), `useIotStore` (IoT device UI -- localStorage persist for MQTT config), `sensorStore` (real-time sensor data), `useAlertsStore` (proactive smart coach alerts), `useCalculatorSessionStore` (shared room/light session across calculator suite). All 8 stores have `devtools` middleware (`enabled: import.meta.env.DEV`). No Zustand IndexedDB persist -- persistence is exclusively Redux + IndexedDB.
    - **Redux <-> Zustand Bridge:** `services/uiStateBridge.ts` -- single init call `initUIStateBridgeFull(getState, dispatch, subscribe)` from `store.ts`; `getReduxSnapshot(selector)` for synchronous reads from Zustand actions; `subscribeToRedux(selector, handler)` for reactive subscriptions; `dispatchToRedux(action)` for dispatch from Zustand context.
    - **Rule:** New persisted state goes in Redux slices. New UI-only/runtime state goes in Zustand stores. Components must import AI services from `aiFacade`, not from individual service files.

---

## Coding Standards

### TypeScript

- Strict mode — zero `any`, zero `@ts-expect-error`
- `exactOptionalPropertyTypes: true` — optional props must be typed as `T | undefined`
- `noUncheckedIndexedAccess: true` — index signatures return `T | undefined`
- Named exports preferred over default exports
- Explicit return types on public functions
- `??` for nullish coalescing, never `||` for falsy-sensitive values
- **Known RTK TS2719**: Redux Toolkit 2.x `configureStore` middleware callback is incompatible with `exactOptionalPropertyTypes`. Filtered in CI via `scripts/typecheck-filter.mjs`

### React

- Functional components + hooks only (no class components)
- `React.memo()` for list items and expensive components (with `displayName`)
- React 19 Compiler (`babel-plugin-react-compiler`) auto-memoizes
- Lazy-loaded views with `React.lazy()` + `Suspense`

### Styling

- Tailwind CSS utility classes (no custom CSS unless absolutely necessary)
- `cn()` from `lib/utils.ts` for conditional classes (clsx + tailwind-merge)
- Theme via CSS custom properties (9 themes)

### Security (Critical)

- **ESLint hardened:** `@typescript-eslint/no-explicit-any: error`, `no-unsafe-type-assertion: warn`, `no-unnecessary-type-arguments: warn` with type-aware linting (`projectService: true`)
- **DOMPurify v3** on ALL `dangerouslySetInnerHTML` content
- **`rel="noopener noreferrer"`** on ALL external links
- **AES-256-GCM** encryption for API keys at rest (cryptoService.ts)
- **EXIF/GPS stripping** before image AI transmission
- **30+ regex patterns** block prompt injection in AI prompts
- **CSP hardened** across 3 delivery paths (`securityHeaders.ts`, `index.html`, `netlify.toml`) with `'self' 'unsafe-inline' 'wasm-unsafe-eval'` (static Vite PWA -- nonce plugin deferred to S-03)
- **Local-only mode guard**: All outbound network services must check `isLocalOnlyMode()` before fetch
- **No `console.log`** in production — use `console.debug` (stripped) or `console.warn`/`console.error`
- **No `console.warn`** for error detail logging — use `console.debug` to prevent info leaks
- **Sentry** captures runtime errors — use `Sentry.captureException()` for explicit reporting
- **Security scanners**: Semgrep, Gitleaks, Trojan-source all pass with 0 findings
- **`secureRandom()`** via `utils/random.ts` replaces `Math.random()` everywhere (Web Crypto)
- **OpenSSF Scorecard**: branch protection, signed commits, pinned deps, SAST, fuzzing, SLSA provenance
- **ClusterFuzzLite**: Continuous fuzzing via `cflite_pr.yml` on PRs
- **Config Guard**: CI workflow scans devcontainer/vscode config changes for RCE patterns

### Text Encoding (Mandatory -- Global Rule)

- **ASCII-only** in ALL source files (`.ts`, `.tsx`, `.mjs`, `.js`, `.sh`, `.yml`, `.json`)
- **No emojis, no Unicode symbols** in code, scripts, configs, or CI workflows
- Reason: non-ASCII characters trigger `anti-trojan-source` false positives and complicate diffs
- Use ASCII text markers in scripts/CI: `[OK]`, `[FAIL]`, `[WARN]`, `[INFO]`, `[PASS]`, `[SKIP]`
- Use `--` instead of em-dash, `->` instead of arrows, `(ok)` instead of checkmarks
- **Exceptions:** i18n translation files (`locales/`) and documentation (`*.md`, `docs/`) may use Unicode
- **Enforcement:** `anti-trojan-source` scanner runs in CI (`security:trojan-source`) and pre-commit (lint-staged)

### CI Gate Checklist (verify before every commit)

1. **Typecheck clean:** `node ./scripts/typecheck-filter.mjs` -- 0 errors (TS2719 filtered)
2. **Tests pass:** `pnpm --filter @cannaguide/web test:run` -- 0 failures
3. **Build succeeds:** `pnpm run build`
4. **Lint zero warnings:** `eslint --max-warnings 0` on staged files (enforced by lint-staged)
5. **Lint scopes pass:** `node ./scripts/lint-scopes.mjs` -- strict scopes enforced (hooks, components/common, services)
6. **i18n complete:** new user-facing strings present in all 5 languages (EN/DE/ES/FR/NL)
7. **E2E selectors stable:** use `data-testid`, `data-view-id`, or `data-tab-id` -- avoid hardcoded text selectors
8. **Pre-commit hook runs:** `.husky/pre-commit` executes typecheck + lint-staged automatically
9. **Pre-push hook runs:** `.husky/pre-push` executes `gate:push` (typecheck + tests + lint scopes + build) -- full CI mirror

### AI Integration

- All AI calls go through `services/aiFacade.ts` (public entry point), never through individual services directly
- Cloud AI routes through `aiProviderService.ts` (imports configs from `@cannaguide/ai-core`) and `geminiService.ts`
- Rate limiting: 15 req/min sliding window
- Use `responseSchema` for structured JSON output
- RAG via `growLogRagService.ts` for journal context
- Local AI fallback when API unreachable (3-layer: WebLLM → Transformers.js → Heuristics)
- All local AI services use `captureLocalAiError()` for Sentry error tracking
- Input validation: DOMPurify sanitization + length limits on all user-facing AI inputs
- Image inputs: MIME type allow-listing, size validation, EXIF stripping

### i18n

- All user-facing strings must be in `locales/en/` and `locales/de/`
- Use `useTranslation()` in components (single namespace, no argument needed)
- Use `getT()` from `i18n.ts` in services/middleware
- 12 source files per language: common, plants, knowledge, strains, equipment, settings, help, commandPalette, onboarding, seedbanks, strainsData, legal
- Aggregator pattern: `locales/{lang}.ts` barrel files import all 12 source files and merge into a single flat object registered as the default i18next namespace
- **New component rule:** Every new UI component must have 100% of user-facing strings in `locales/*.ts` across all 5 languages (EN/DE/ES/FR/NL). No hardcoded strings.

### Testing

- Vitest for unit/integration tests (files next to source: `*.test.ts(x)`)
- Playwright E2E tests in `tests/e2e/` (pattern: `*.e2e.ts`)
- Playwright Component tests in `tests/ct/` (pattern: `*.ct.tsx`)
- Mocks in `tests/mocks/` for Gemini, IndexedDB, etc.
- Baseline: 1884 tests, 0 failures
- **E2E critical-path coverage:** Plants (navigation, add-plant, empty state), Strains (search, tabs, list), AI/Knowledge (Mentor chat, settings, tab switching)
- **Playwright E2E browser strategy:** Chromium for all tests. Firefox enabled in CI with extended timeouts (120s) and `continue-on-error`. Firefox skips IoT/WebGPU tests (`test.skip` with `browserName` check). WebKit is local-only (Safari API gaps).
- **CI E2E timeout:** 30 minutes (step), 45 minutes (job)
- **Visual Regression:** `tests/e2e/visual-regression.e2e.ts` uses `expect(page).toHaveScreenshot()` for Plants, Strains, Knowledge views across themes. Snapshots stored in `tests/e2e/__screenshots__/`. Generate/update baselines: `pnpm exec playwright test --grep "Visual Regression" --update-snapshots`. CI runs visual regression with `--update-snapshots` (non-blocking); snapshots uploaded as artifacts for diff review.
- **Mutation Testing:** Stryker Mutator (`stryker.conf.json`) targets `apps/web/stores/slices/**/*.ts`. Run: `pnpm run test:mutate`. Break threshold: 50% mutation score. Reports in `reports/mutation/`.

### Git

- Conventional Commits: `<type>(<scope>): <description>`
- Types: feat, fix, docs, refactor, test, perf, chore, ci, build, revert, style, a11y, i18n
- Scopes: ai, plants, strains, equipment, knowledge, settings, help, genealogy, pwa, ci, security, ui, sentry
- **Commit message rules (enforced by commitlint):**
    - Subject (type, scope, description) **must be lowercase** -- e.g. `feat(ai): add embedding cache` not `Add Embedding Cache`
    - Body lines **max 100 characters** -- wrap longer lines
    - **Blank line required** between subject and body
    - Subject must not end with a period
- **Push workflow:** Direct `git push origin main` works (admin bypass). For CI-gated pushes use `pnpm run pr:push` (branch -> PR -> auto-merge).
- Branch protection: PRs required for non-admins (0 reviews, CI-gated), signed commits, linear history
- Codespaces signing: native `gh-gpgsign` from `/etc/gitconfig` (permanent `Verified` status)

### Dev Container

- **Dockerfile-based build** in `.devcontainer/Dockerfile` (Playwright noble base image)
- System deps (ripgrep, gh, jq) baked into image layer with apt cache cleanup
- `postCreateCommand` in `.devcontainer/setup.sh` -- deterministic lockfile-pinned install:
    ```
    corepack enable
    CI=1 pnpm install --frozen-lockfile
    ```
- `postStartCommand` in `.devcontainer/start.sh` (IoT mock servers health-checked)
- `.devcontainer/.dockerignore` excludes node_modules, .git, dist, coverage
- All `.devcontainer/` files under CODEOWNERS review
- `remoteUser: root` (solo-dev Codespaces -- container isolation sufficient)

---

## Commands

```bash
# Root (delegates to TurboRepo)
pnpm run dev              # turbo run dev (Vite dev server)
pnpm run build            # turbo run build (all workspaces)
pnpm test                 # turbo run test (Vitest, watch mode)
pnpm run test:run         # turbo run test:run (Vitest, single run, exits)
pnpm run lint             # turbo run lint
pnpm run typecheck        # turbo run typecheck
pnpm run format           # Prettier format
pnpm run security:scan    # Full security scan (semgrep, gitleaks, grype, etc.)
git push origin main     # Direct push (admin bypass)
node ./scripts/github/pr-push.mjs  # CI-gated push via automated PR workflow (optional)
pnpm run changelog        # Generate full CHANGELOG from conventional commits
pnpm run changelog:latest # Append latest release to CHANGELOG
pnpm run docs:ai-core     # Generate Typedoc API docs for ai-core package

# Web app (from apps/web/ or via workspace flag)
pnpm --filter @cannaguide/web dev       # Vite dev server (localhost:5173)
pnpm --filter @cannaguide/web build     # Production build
pnpm --filter @cannaguide/web test:run  # Vitest unit/integration (single run, exits when done)
pnpm --filter @cannaguide/web test:e2e  # Playwright E2E (requires build)
pnpm --filter @cannaguide/web test:ct   # Playwright Component tests
pnpm --filter @cannaguide/web typecheck # tsc --noEmit (TS2719 filtered)
pnpm exec stryker run                   # Stryker mutation testing (Redux slices)
```

---

## Error Tracking

Sentry is integrated for runtime error monitoring. Configuration is in `services/sentryService.ts`.

- Errors are auto-captured via `Sentry.init()` in the app bootstrap
- Use `Sentry.captureException(error)` for explicit error reporting
- Use `Sentry.captureMessage(msg)` for non-error events
- Performance traces are sampled at 10% in production
- Session replay captures 1% of sessions, 100% on error
- Source maps are uploaded during CI build for readable stack traces

---

## Deployment

| Target         | Method                                  | Trigger                         |
| -------------- | --------------------------------------- | ------------------------------- |
| GitHub Pages   | `.github/workflows/deploy.yml`          | Push to `main`                  |
| Netlify        | `netlify.toml`                          | Push + PR (preview deploys)     |
| GitHub Release | `.github/workflows/release-publish.yml` | Tag push `v*` (after gate pass) |

---

## Plan Execution Workflow (Plan Mode -> Agent Mode)

When Copilot receives a **plan-mode prompt** (typically a keyword-based plan structure sketch), execute the following strict 4-phase workflow:

### Phase 1 -- Plan Elaboration (Plan Mode)

1. **Parse the plan sketch:** Extract all features, changes, and goals from the keyword prompt.
2. **Elaborate the full execution plan** for the current session:
    - Scope: affected files, components, services, slices, types, i18n keys, tests, data files
    - Dependency order: which changes must happen first (types -> data -> slices -> services -> components -> tests)
    - Risk assessment: breaking changes, migration steps, fallback strategies
    - Acceptance criteria: what "done" looks like (tests pass, typecheck clean, build succeeds)
3. **Define follow-up executions** for subsequent prompts/sessions:
    - Number each follow-up as `Execution N+1`, `N+2`, etc.
    - Per follow-up: scope summary, prerequisites, estimated complexity
    - Mark dependencies between executions explicitly
4. **Present the complete plan** to the user for confirmation before proceeding.

### Phase 2 -- Implementation (Agent Mode)

Switch to Agent Mode and execute the approved plan:

1. **Create a todo list** (`manage_todo_list`) with all implementation steps.
2. **Implement changes** in dependency order, marking todos in-progress/completed as you go.
3. **Run validation** after each logical group of changes:
    - `pnpm --filter @cannaguide/web typecheck` (must be clean)
    - `pnpm --filter @cannaguide/web test:run` (must pass, 0 failures)
    - `pnpm --filter @cannaguide/web build` (must succeed)
4. **Fix any errors** immediately before proceeding to the next step.

### Phase 3 -- Documentation Update (Agent Mode)

After implementation is complete with all validations passing, update **all affected documentation** in a single pass:

| File                              | Update Scope                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `README.md`                       | Metrics (test count, service count), feature descriptions, badges if applicable         |
| `docs/next-session-handoff.md`    | New session entry at top: What Was Done, Verified Metrics, Next Steps                   |
| `docs/ARCHITECTURE.md`            | New services, slices, components, data files, workers if added                          |
| `.github/copilot-instructions.md` | Important Files table, Architecture section, Key Patterns, Coding Standards if affected |
| `CHANGELOG.md`                    | New entry following Conventional Commits format                                         |
| `docs/PRIORITY_ROADMAP.md`        | Mark completed items, update priorities                                                 |
| `docs/audit-roadmap-2026-q2.md`   | Mark completed audit items if applicable                                                |
| `ROADMAP.md`                      | Update feature status if applicable                                                     |

**Rules for documentation updates:**

- Keep updates **concise and factual** -- no filler prose
- Use verified metrics only (run tests/typecheck and count actual values)
- `next-session-handoff.md` must always list **Next Steps** for following sessions
- Future executions from Phase 1 must be written into `next-session-handoff.md` under a clear `### Planned Executions` heading

### Phase 4 -- Commit and Push (Agent Mode)

1. **Stage all changes:** `git add -A`
2. **Commit** with Conventional Commits format (all lowercase, body lines max 100 chars):

    ```
    <type>(<scope>): <lowercase description>

    - bullet summary of key changes (wrap at 100 chars)
    - updated docs: README, handoff, architecture,
      copilot-instructions
    - tests: <count> passing, 0 failures
    ```

    **Rules:** Subject must start lowercase. No period at end.
    Body lines must not exceed 100 characters -- wrap with
    continuation indent if needed.

3. **Push:** `git push origin main`

### Plan Mode Rules

- **Never skip Phase 1.** Even for small plans, write the full execution plan first.
- **Never skip Phase 3.** Every implementation must update all affected docs.
- **Atomic sessions:** Each plan execution must leave the repo in a clean, buildable, documented state.
- **Handoff continuity:** The `next-session-handoff.md` must always be current so any future session can resume without context loss.
- **Metrics must be verified:** Never copy old metrics -- always re-run `pnpm test`, `typecheck`, `build` and report actual counts.
- **Follow-up executions are binding:** Plans written into `next-session-handoff.md` define the scope for subsequent sessions. Deviations require a new plan-mode prompt.

---

## Important Files

| File                                                                            | Purpose                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/index.tsx`                                                            | App bootstrap, SW registration, safe recovery                                                                                                                              |
| `apps/web/vite.config.ts`                                                       | Build config + optionalMlPlugin() for ML stub fallback                                                                                                                     |
| `apps/web/stores/store.ts`                                                      | Redux store creation, IndexedDB hydration                                                                                                                                  |
| `apps/web/services/geminiService.ts`                                            | Gemini API abstraction (all AI features)                                                                                                                                   |
| `apps/web/services/aiProviderService.ts`                                        | Multi-provider AI routing                                                                                                                                                  |
| `apps/web/services/aiRateLimiter.ts`                                            | Rate limiter + cost tracker (reportActualUsage, monthly budget)                                                                                                            |
| `apps/web/services/aiFacade.ts`                                                 | Public AI facade (re-exports aiService + provider + infra)                                                                                                                 |
| `apps/web/services/aiService.ts`                                                | Unified AI service (cloud + local routing)                                                                                                                                 |
| `apps/web/services/LocalAIInfrastructure.ts`                                    | Unified cache + telemetry + preload class                                                                                                                                  |
| `apps/web/services/localAI.ts`                                                  | Pure facade implementing BaseAIProvider (delegates to router, manager, orchestrator)                                                                                       |
| `apps/web/services/localAiInferenceRouter.ts`                                   | Cache -> WebLLM -> Transformers.js inference routing with retry + backoff                                                                                                  |
| `apps/web/services/localAiModelManager.ts`                                      | Pipeline lifecycle (text + vision), primary/alt model fallback, dispose                                                                                                    |
| `apps/web/services/localAiPreloadOrchestrator.ts`                               | 8-step preload sequence with progress callbacks and error counting                                                                                                         |
| `apps/web/services/plantDiseaseModelService.ts`                                 | PlantVillage MobileNetV2 ONNX IndexedDB caching, download with progress, HEAD check, `ensureWorkerRegistered()`                                                            |
| `apps/web/workers/visionInferenceWorker.ts`                                     | Off-main-thread ONNX inference: 38-class PlantVillage labels, `CANNABIS_MAP`, `preprocessImage()` (ImageNet CHW), `mapToCannabisTerm()`, WorkerBus INIT/CLASSIFY/TERMINATE |
| `apps/web/components/views/plants/LeafDiagnosisPanel.tsx`                       | Leaf diagnosis UI: model status bar, drag-zone upload, camera capture, analyze button, results card with severity badge and RAG recommendations                            |
| `apps/web/services/localAIModelLoader.ts`                                       | ONNX pipeline loader (WebGPU/WASM, concurrency guard)                                                                                                                      |
| `apps/web/services/localAiNlpService.ts`                                        | NLP pipelines (sentiment, summarization, zero-shot)                                                                                                                        |
| `apps/web/services/localAiEmbeddingService.ts`                                  | MiniLM embeddings, semantic ranking                                                                                                                                        |
| `apps/web/services/ragEmbeddingCacheService.ts`                                 | Persistent IndexedDB LRU embedding cache (model versioning, telemetry, background precompute)                                                                              |
| `apps/web/services/localAiFallbackService.ts`                                   | Heuristic fallback for all AI features                                                                                                                                     |
| `apps/web/services/localAiLanguageDetectionService.ts`                          | On-device EN/DE language detection                                                                                                                                         |
| `apps/web/services/localAiImageSimilarityService.ts`                            | CLIP image comparison, growth tracking                                                                                                                                     |
| `apps/web/services/localAiHealthService.ts`                                     | Device classification, health monitoring                                                                                                                                   |
| `apps/web/services/equipmentCalculatorService.ts`                               | Pure-formula calculator service: CO2 enrichment, Humidity Deficit (Buck SVP), Light Hanging Height (Zod-validated)                                                         |
| `apps/web/services/sentryService.ts`                                            | Sentry error tracking initialization                                                                                                                                       |
| `apps/web/services/pluginService.ts`                                            | Plugin architecture (nutrient, hardware, grow)                                                                                                                             |
| `apps/web/services/seedbankService.ts`                                          | Deterministic mock seed pricing (SeedFinder removed)                                                                                                                       |
| `apps/web/services/crdtService.ts`                                              | Y.Doc lifecycle, sync transport (encode/apply/detectDivergence), state vectors                                                                                             |
| `apps/web/services/crdtSyncBridge.ts`                                           | Bidirectional Redux<->Y.Doc bridge (listener middleware + Y.Map observers)                                                                                                 |
| `apps/web/services/syncService.ts`                                              | CRDT-aware Gist sync (push/pull/forceLocal/forceRemote), legacy JSON migration, E2EE                                                                                       |
| `apps/web/services/offlineSyncQueueService.ts`                                  | Offline push retry queue (navigator.onLine, 3 retries, exponential backoff)                                                                                                |
| `apps/web/components/common/SyncConflictModal.tsx`                              | 3-way conflict resolution UI (Smart Merge/Keep Local/Use Cloud) with double-confirmation                                                                                   |
| `apps/web/services/nutrientDeficiencyService.ts`                                | Decision tree for visual nutrient deficiency diagnosis (8 nodes, 9 results: N/P/K/Mg/Ca/Fe/Mn/Mo/Cl)                                                                       |
| `apps/web/services/imageGenerationService.ts`                                   | SD-Turbo text-to-image (WebGPU, worker-offloaded)                                                                                                                          |
| `apps/web/services/dailyStrainsService.ts`                                      | 4:20 Daily Drop: seeded PRNG daily picks, AI search, resolveDiscoveredToStrain                                                                                             |
| `apps/web/services/workerBus.ts`                                                | Promise-based worker communication bus (9 workers), AbortController, Transferable, onDispatchComplete hook                                                                 |
| `apps/web/services/workerStateSyncService.ts`                                   | Framework-agnostic handler registry -- auto-wires WorkerBus results to Redux/Zustand                                                                                       |
| `apps/web/services/workerTelemetryService.ts`                                   | Sentry 10% error-rate alerts + 5s debounced Redux DevTools metrics flush                                                                                                   |
| `apps/web/services/proactiveCoachService.ts`                                    | Smart coach: threshold monitoring + AI advice + cooldown                                                                                                                   |
| `apps/web/services/nativeBridgeService.ts`                                      | Web Notification API dispatch (browser-only)                                                                                                                               |
| `apps/web/services/strainLookupService.ts`                                      | 5-source Strain Intelligence Lookup cascade + entourage effect science                                                                                                     |
| `apps/web/services/indexedDbMonitorService.ts`                                  | IndexedDB quota inspection, per-store entry counts, health warnings                                                                                                        |
| `apps/web/services/indexedDbPruneService.ts`                                    | Quota-aware IndexedDB store pruning (images 500 cap, search 5000 cap), cursor-based oldest-first deletion                                                                  |
| `apps/web/services/trendsEcosystemService.ts`                                   | Cross-hub match scores (genetic trends <-> grow tech), 5-min cache, static relationship maps                                                                               |
| `apps/web/services/localAiInfrastructureService.ts`                             | Backward-compatible barrel re-export for LocalAIInfrastructure                                                                                                             |
| `apps/web/services/localAiWebGpuService.ts`                                     | Centralized WebGPU adapter, device lifecycle, feature detection                                                                                                            |
| `apps/web/services/webLlmModelCatalog.ts`                                       | Curated WebLLM model catalog (4 models), version-pinned, auto-selection by GPU tier, MODEL_CATALOG_VERSION                                                                 |
| `apps/web/components/common/WebLlmPreloadBanner.tsx`                            | Global toast showing WebLLM model download progress during auto-preload (dismissible)                                                                                      |
| `apps/web/services/gpuResourceManager.ts`                                       | GPU mutex v2: string registry, GpuPriority queue (high/normal/low), auto-release 30s, getQueueState()                                                                      |
| `apps/web/services/uiStateBridge.ts`                                            | Central Redux<->Zustand bridge: `initUIStateBridgeFull`, `getReduxSnapshot`, `subscribeToRedux`, `dispatchToRedux`                                                         |
| `apps/web/stores/useAlertsStore.ts`                                             | Zustand store for transient smart coach alerts                                                                                                                             |
| `apps/web/stores/slices/workerMetricsSlice.ts`                                  | Runtime-only RTK slice for WorkerBus telemetry (DevTools visibility, not persisted to IndexedDB)                                                                           |
| `apps/web/stores/slices/growsSlice.ts`                                          | Grow lifecycle CRUD (EntityAdapter, MAX_GROWS=3 per CanG), default grow seeded, grow-scoped selectors                                                                      |
| `apps/web/stores/slices/hydroSlice.ts`                                          | Hydroponic monitoring Redux slice: readings FIFO (168 cap), thresholds, alerts, system type                                                                                |
| `apps/web/stores/slices/metricsSlice.ts`                                        | Plant metrics Redux slice: readings FIFO (168/plant), memoized selectors via createSelector                                                                                |
| `apps/web/stores/slices/growPlannerSlice.ts`                                    | Grow planner Redux slice: tasks FIFO (500), 9 action types, memoized selectors, plant-scoped clearCompletedTasks                                                           |
| `apps/web/stores/slices/diagnosisHistorySlice.ts`                               | Diagnosis history Redux slice: records FIFO (100/plant), memoized selectors, trend extraction                                                                              |
| `apps/web/components/views/plants/detailedPlantViewTabs/MetricsOverviewTab.tsx` | Plant metrics dashboard: VPD zone map, multi-metric Recharts, quick log form                                                                                               |
| `apps/web/components/views/plants/detailedPlantViewTabs/PhotoTimelineTab.tsx`   | Photo timeline with compare mode, type-guarded PhotoDetails extraction                                                                                                     |
| `apps/web/components/views/plants/PlantTagGenerator.tsx`                        | QR code plant tag generator with Print and PDF export, accessible QR wrapper                                                                                               |
| `apps/web/components/views/plants/GrowPlannerView.tsx`                          | Calendar-based grow planner UI: week/month views, overdue alerts, task CRUD                                                                                                |
| `apps/web/data/growScheduleTemplates.ts`                                        | 6 grow schedule templates with findBestTemplate() strain matching                                                                                                          |
| `apps/web/components/views/equipment/HydroMonitorView.tsx`                      | Hydro dashboard UI: gauge cards, Recharts pH/EC trend chart, manual input form, alerts, dosing reference, ONNX forecast panel                                              |
| `apps/web/services/hydroForecastService.ts`                                     | Hydro forecast API: ONNX worker dispatch, moving-average fallback, trend detection, alert generation                                                                       |
| `apps/web/workers/hydroForecastWorker.ts`                                       | Off-main-thread ONNX hydro inference: pH/EC/Temp prediction, WASM backend, weighted moving average fallback                                                                |
| `apps/web/components/views/settings/LlmModelSelector.tsx`                       | Card-based WebLLM model selector UI: auto/manual model selection, GPU tier awareness, download progress                                                                    |
| `apps/web/hooks/useStreamingResponse.ts`                                        | Shared RAF-debounced streaming hook used by MentorChatView, AiTab (advisor + diagnosis)                                                                                    |
| `apps/web/hooks/useStateHealthCheck.ts`                                         | Dev-only hook: detects Redux<->Zustand state inconsistencies; zero production overhead (tree-shaken)                                                                       |
| `apps/web/simulation.worker.ts`                                                 | VPD simulation Web Worker                                                                                                                                                  |
| `apps/web/data/diseases.ts`                                                     | 22 DiseaseEntry objects (deficiency/toxicity/environmental/pest/disease)                                                                                                   |
| `apps/web/data/learningPaths.ts`                                                | 5 LearningPath objects with step-by-step grow education programs                                                                                                           |
| `apps/web/data/lexicon.ts`                                                      | 83-entry grower glossary (6 categories: General/Cannabinoid/Terpene/Flavonoid/Nutrient/Disease)                                                                            |
| `apps/web/components/views/knowledge/LexikonView.tsx`                           | Searchable 83-term Knowledge glossary sub-view                                                                                                                             |
| `apps/web/components/views/knowledge/DiseaseAtlasView.tsx`                      | 22-entry plant disease diagnostic atlas sub-view                                                                                                                           |
| `apps/web/components/views/knowledge/CalculatorHubView.tsx`                     | VPD + Nutrient Ratio + pH/EC calculator hub sub-view                                                                                                                       |
| `apps/web/components/views/knowledge/LearningPathView.tsx`                      | 5-path grow education learning paths sub-view (Redux progress)                                                                                                             |
| `apps/web/utils/priorityQueue.ts`                                               | Generic min-heap PriorityQueue<T> with FIFO tiebreaking, WorkerPriority type, PRIORITY_VALUES                                                                              |
| `apps/web/utils/random.ts`                                                      | `secureRandom()` -- Web Crypto replacement for Math.random                                                                                                                 |
| `apps/web/utils/browserApis.ts`                                                 | Typed helpers for non-standard browser APIs (performance.memory, deviceMemory, battery, GPU adapter)                                                                       |
| `apps/web/constants.ts`                                                         | App-wide constants                                                                                                                                                         |
| `apps/web/types.ts`                                                             | Core TypeScript types                                                                                                                                                      |
| `apps/web/i18n.ts`                                                              | i18next initialization                                                                                                                                                     |
| `packages/ai-core/src/providers.ts`                                             | PROVIDER_CONFIGS map + key rotation/validation functions                                                                                                                   |
| `packages/ai-core/src/schemas.ts`                                               | Zod schemas for AI response validation                                                                                                                                     |
| `packages/ai-core/src/ml.ts`                                                    | Lazy ML loaders (transformers, web-llm, genai)                                                                                                                             |
| `packages/ai-core/package.json`                                                 | ML optionalDependencies isolation                                                                                                                                          |
| `packages/ui/src/tokens.css`                                                    | 9 cannabis theme CSS custom properties (RGB triplets)                                                                                                                      |
| `packages/ui/src/tailwind-preset.cjs`                                           | Shared Tailwind preset (colors, keyframes, animations)                                                                                                                     |
| `lighthouserc.json`                                                             | Lighthouse CI config + performance budget assertions                                                                                                                       |
| `pnpm-workspace.yaml`                                                           | pnpm workspace definition (packages/_, apps/_)                                                                                                                             |
| `.npmrc`                                                                        | pnpm config (shamefully-hoist, auto-install-peers, strict-peer-dependencies=false)                                                                                         |
| `stryker.conf.json`                                                             | Stryker mutation testing config (Redux slices, 50% break)                                                                                                                  |
| `scripts/typecheck-filter.mjs`                                                  | Typecheck with RTK TS2719 filter (known upstream bug)                                                                                                                      |
| `scripts/generate-service-map.mjs`                                              | AI service Mermaid dependency map generator                                                                                                                                |
| `scripts/github/pr-push.mjs`                                                    | Automated PR workflow (branch -> PR -> auto-merge -> cleanup)                                                                                                              |
| `.devcontainer/devcontainer.json`                                               | DevContainer config (Dockerfile build, ports, extensions)                                                                                                                  |
| `.devcontainer/Dockerfile`                                                      | Dev container image (Playwright + system deps)                                                                                                                             |
| `.devcontainer/setup.sh`                                                        | postCreateCommand (workspace-filtered install, no ML)                                                                                                                      |
| `.devcontainer/start.sh`                                                        | postStartCommand (IoT mock servers)                                                                                                                                        |
| `.github/workflows/config-guard.yml`                                            | CI scan for RCE patterns in config files                                                                                                                                   |
| `.github/workflows/release-publish.yml`                                         | Automated GitHub Release with SLSA provenance attestation (tag push v\*)                                                                                                   |
| `docs/ACCESSIBILITY.md`                                                         | WCAG 2.1 AA accessibility statement                                                                                                                                        |
| `docs/api/ai-facade.md`                                                         | AI Facade API reference (24 aiService methods, routing logic, mode helpers)                                                                                                |
| `docs/api/rag-pipeline.md`                                                      | RAG pipeline API (growLogRagService, ragEmbeddingCacheService)                                                                                                             |
| `docs/api/local-ai-infrastructure.md`                                           | Local AI infrastructure API (cache, telemetry, preload, 3-layer fallback)                                                                                                  |
| `docs/DEPENDENCY-GRAPH.md`                                                      | Monorepo package topology, ESLint enforcement, TurboRepo pipeline dependencies                                                                                             |
| `docs/ARCHITECTURE-MIGRATION-PLAN.md`                                           | Service classification (99 services) and future migration priorities                                                                                                       |
| `scripts/security/check-csp-consistency.mjs`                                    | CI: CSP consistency across securityHeaders/index.html/netlify                                                                                                              |
| `scripts/check-i18n-completeness.mjs`                                           | CI: i18n key coverage checker across all languages                                                                                                                         |

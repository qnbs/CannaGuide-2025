# Copilot Instructions for CannaGuide 2025

## Project Overview

CannaGuide 2025 is a production-grade, AI-powered Progressive Web App (PWA) for cannabis cultivation management. Built with React 19, TypeScript (strict), Redux Toolkit, and Google Gemini AI. The app is 100% offline-first with dual IndexedDB persistence.

**Live:** https://qnbs.github.io/CannaGuide-2025/
**Version:** 1.2.0-alpha

---

## Architecture

### Tech Stack

- **Frontend:** React 19 + TypeScript (strict mode, zero `any`)
- **State:** Redux Toolkit (persisted app-state) + Zustand (transient UI-state) + RTK Query (AI API caching)
- **AI:** Google Gemini (primary), OpenAI, xAI/Grok, Anthropic (multi-provider BYOK)
- **Local AI:** @xenova/transformers (ONNX: WebGPU/WASM), @mlc-ai/web-llm (WebGPU), TensorFlow.js, onnxruntime-web -- 15 services, 8 ML models, 3-layer fallback (WebLLM -> Transformers.js -> Heuristics)
- **Build:** Vite 7 + vite-plugin-pwa (InjectManifest)
- **Styling:** Tailwind CSS + Radix UI + 9 cannabis themes
- **Persistence:** Dual IndexedDB (`CannaGuideStateDB` + `CannaGuideDB`)
- **i18n:** i18next (EN + DE + ES + FR + NL, 13 namespaces)
- **Testing:** Vitest (951+ tests) + Playwright E2E + Playwright Component Tests
- **Error Tracking:** Sentry (browser SDK)
- **Security Scanning:** Semgrep, Gitleaks, Grype, Trojan-source, npm audit, Snyk, GitGuardian, CodeAnt AI, Config Guard
- **Distribution:** GitHub Pages, Netlify (PR previews), Docker, Tauri v2 (desktop), Capacitor (mobile)

### Monorepo Layout

The project uses **npm workspaces + TurboRepo** with ML dependencies isolated in `@cannaguide/ai-core`.

```
package.json             # Workspace root (turbo, eslint, prettier -- NO app deps)
turbo.json               # TurboRepo pipeline (build, dev, test, lint, typecheck)
tsconfig.json            # References-only (apps/web, apps/desktop, packages/*)

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
    hooks/               # Custom React hooks (17)
    data/                # Static data: 700+ strains, FAQ, lexicon, guides
    locales/             # i18n: en/, de/, es/, fr/, nl/ (13 namespaces each)
    workers/             # Web Workers: VPD sim, genealogy, scenarios, inference, image gen, strain hydration, terpene
    utils/               # Shared utilities
    types/               # Zod schemas for AI response validation
    lib/                 # Utility library (cn(), VPD calculations)
    public/              # Static assets, SW, manifest
    tests/               # E2E (tests/e2e/) + Component tests (tests/ct/)
  desktop/               # Tauri v2 desktop wrapper (Rust IPC commands)

packages/
  ai-core/               # Shared AI types + ML dependency isolation
    package.json         # @cannaguide/ai-core -- ML libs as optionalDependencies
    src/
      index.ts           # AI types, providers, schemas
      ml.ts              # Lazy loaders: loadTransformers(), loadWebLlm(), loadGenAI()
  ui/                    # Shared UI tokens + theme types
  iot-mocks/             # ESP32 sensor mock server (port 3001)

src-tauri/               # Tauri v2 desktop config (Rust backend + capabilities)
scripts/                 # Build/lint/merge scripts
docker/                  # nginx config, esp32-mock, tauri-mock
docs/                    # Developer guides, roadmap
.github/                 # 20 CI/CD workflows, issue templates
.devcontainer/           # Codespaces DevContainer (Dockerfile-based, lite-mode)
```

### ML Isolation Strategy

Heavy ML dependencies (`@xenova/transformers`, `@mlc-ai/web-llm`, `onnxruntime-web`) are declared as `optionalDependencies` in `@cannaguide/ai-core`. The web app's `vite.config.ts` includes `optionalMlPlugin()` that stubs missing ML modules at build time, allowing the build to succeed even without ML binaries installed. DevContainer uses `npm ci` for deterministic lockfile-pinned installs (OSSF Scorecard compliant). ML models are loaded lazily at runtime in-browser.

### Key Patterns

1. **Offline-First:** All data stored in IndexedDB. Service Worker uses Network-First for navigation, Cache-First for assets. Background Sync queues offline actions.

2. **Dual IndexedDB:**
    - `CannaGuideStateDB`: Redux state with promise-locked hydration, debounce-save (1s), force-save on visibilitychange
    - `CannaGuideDB`: Strains, images (auto-pruned), full-text search index

3. **AI Service Facade:** `services/aiFacade.ts` is the single public entry point for all AI capabilities (cloud + local). It re-exports `aiService` (routed methods), `aiProviderService` (BYOK multi-provider), and `localAIInfrastructure` (cache + telemetry + preload as a unified class in `LocalAIInfrastructure.ts`). Structured JSON output via `responseSchema`. Local fallback via `localAiFallbackService.ts`. Dependency map: `docs/architecture/service-dependencies.md` (Mermaid, auto-generated via `scripts/generate-service-map.mjs`).

4. **Safe Recovery:** Boot wraps store creation in try/catch. Corrupted state → auto-clear + restart. Session flag prevents infinite recovery loops.

5. **Memoized Selectors:** Map-based cache keyed by ID. Nullish coalescing (`??`) over logical OR (`||`).

6. **Archive Capping:** Mentor: 100 entries, Advisor: 50/plant, FIFO culling.

7. **Local AI Stack:** 15 service modules orchestrate on-device ML:
    - `localAI.ts` — Core orchestration (text gen, vision, diagnosis, preload)
    - `localAIModelLoader.ts` — ONNX backend detection, pipeline loading (max 3 concurrent), cache
    - `localAiNlpService.ts` — Sentiment analysis, summarization, zero-shot classification
    - `localAiEmbeddingService.ts` — MiniLM-L6 embeddings, semantic ranking, batch processing
    - `localAiFallbackService.ts` — Heuristic fallback when models unavailable
    - `localAiLanguageDetectionService.ts` — EN/DE detection (model + heuristic)
    - `localAiImageSimilarityService.ts` — CLIP feature extraction, photo comparison, growth tracking
    - `localAiHealthService.ts` — Device classification, memory monitoring, adaptive model selection
    - `localAiPreloadService.ts` — Model preload state (localStorage persistence)
    - `localAiTelemetryService.ts` — Inference latency/success tracking
    - `localAiCacheService.ts` — IndexedDB inference cache (256 entries, 7d TTL)
    - `localAiStreamingService.ts` — SSE-style streaming for local text generation
    - `localAiDiagnosisService.ts` — Plant health diagnosis pipeline
    - `localAiPromptHandlers.ts` — Prompt formatting for all AI features
    - `localAiWebLlmService.ts` — WebLLM lifecycle, model loading, progress tracking

8. **Worker Bus:** `workerBus.ts` provides promise-based, type-safe worker communication with backpressure, retry, telemetry, and pagehide teardown. All 7 workers (VPD simulation, genealogy, scenario, inference, image generation, strain hydration, terpene) use this bus. See `docs/worker-bus.md`.

9. **Seedbank API:** `seedbankService.ts` fetches from SeedFinder.eu via CORS proxy cascade (allorigins -> corsproxy.io). 5-min in-memory TTL cache. `isLocalOnlyMode()` guard. Deterministic mock fallback when API unavailable or `VITE_SEEDFINDER_API_KEY` not set.

10. **State Management Split:**
    - **Redux Toolkit** (persisted in IndexedDB): simulation, settings, userStrains, favorites, notes, archives, savedItems, knowledge, breeding, genealogy, sandbox, nutrientPlanner. RTK Query for AI API caching (9 endpoints).
    - **Zustand** (transient, never persisted): `useUIStore` (views, modals, notifications, onboarding, voice control), `useTtsStore` (TTS queue, speaking state). No Zustand persist middleware -- persistence is exclusively Redux + IndexedDB.
    - **Rule:** New persisted state goes in Redux slices. New UI-only/runtime state goes in Zustand stores.

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
- **CSP hardened** across 4 delivery paths (no `unsafe-inline` in script-src for Tauri)
- **Tauri v2 capabilities**: Minimal permission set in `src-tauri/capabilities/default.json`
- **Local-only mode guard**: All outbound network services must check `isLocalOnlyMode()` before fetch
- **No `console.log`** in production — use `console.debug` (stripped) or `console.warn`/`console.error`
- **No `console.warn`** for error detail logging — use `console.debug` to prevent info leaks
- **Sentry** captures runtime errors — use `Sentry.captureException()` for explicit reporting
- **Security scanners**: Semgrep, Gitleaks, Trojan-source all pass with 0 findings
- **`secureRandom()`** via `utils/random.ts` replaces `Math.random()` everywhere (Web Crypto)
- **OpenSSF Scorecard**: 8.5/10 — branch protection, signed commits, pinned deps, SAST, fuzzing
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

### AI Integration

- All cloud AI calls go through `services/geminiService.ts` or provider abstraction
- Rate limiting: 15 req/min sliding window
- Use `responseSchema` for structured JSON output
- RAG via `growLogRagService.ts` for journal context
- Local AI fallback when API unreachable (3-layer: WebLLM → Transformers.js → Heuristics)
- All local AI services use `captureLocalAiError()` for Sentry error tracking
- Input validation: DOMPurify sanitization + length limits on all user-facing AI inputs
- Image inputs: MIME type allow-listing, size validation, EXIF stripping

### i18n

- All user-facing strings must be in `locales/en/` and `locales/de/`
- Use `useTranslation('<namespace>')` in components
- Use `getT()` from `i18n.ts` in services/middleware
- 13 namespaces: common, plants, knowledge, strains, equipment, settings, help, commandPalette, onboarding, seedbanks, strainsData, legal

### Testing

- Vitest for unit/integration tests (files next to source: `*.test.ts(x)`)
- Playwright E2E tests in `tests/e2e/` (pattern: `*.e2e.ts`)
- Playwright Component tests in `tests/ct/` (pattern: `*.ct.tsx`)
- Mocks in `tests/mocks/` for Gemini, IndexedDB, etc.
- Baseline: 951+ tests, 0 failures
- **Playwright E2E browser strategy:** Chromium for all tests. Firefox skips IoT/WebGPU tests (`test.skip` with `browserName` check). WebKit uses extended timeouts (120s).
- **CI E2E timeout:** 25 minutes

### Git

- Conventional Commits: `<type>(<scope>): <description>`
- Types: feat, fix, docs, refactor, test, perf, chore, a11y, i18n
- Scopes: ai, plants, strains, equipment, knowledge, settings, help, genealogy, pwa, ci, security, ui, sentry
- **Push workflow:** Direct `git push origin main` works (admin bypass). For CI-gated pushes use `npm run pr:push` (branch -> PR -> auto-merge).
- Branch protection: PRs required for non-admins (0 reviews, CI-gated), signed commits, linear history
- Codespaces signing: native `gh-gpgsign` from `/etc/gitconfig` (permanent `Verified` status)

### Dev Container

- **Dockerfile-based build** in `.devcontainer/Dockerfile` (Playwright noble base image)
- System deps (ripgrep, gh, jq) baked into image layer with apt cache cleanup
- `postCreateCommand` in `.devcontainer/setup.sh` -- deterministic lockfile-pinned install:
    ```
    CI=1 npm ci --no-fund --no-audit --ignore-scripts
    ```
- `postStartCommand` in `.devcontainer/start.sh` (IoT mock servers health-checked)
- `.devcontainer/.dockerignore` excludes node_modules, .git, dist, coverage
- All `.devcontainer/` files under CODEOWNERS review
- `remoteUser: root` (solo-dev Codespaces -- container isolation sufficient)

---

## Commands

```bash
# Root (delegates to TurboRepo)
npm run dev              # turbo run dev (Vite dev server)
npm run build            # turbo run build (all workspaces)
npm test                 # turbo run test (Vitest)
npm run lint             # turbo run lint
npm run typecheck        # turbo run typecheck
npm run format           # Prettier format
npm run security:scan    # Full security scan (semgrep, gitleaks, grype, etc.)
git push origin main     # Direct push (admin bypass)
npm run pr:push          # CI-gated push via automated PR workflow (optional)

# Web app (from apps/web/ or via workspace flag)
npm run -w @cannaguide/web dev       # Vite dev server (localhost:5173)
npm run -w @cannaguide/web build     # Production build
npm run -w @cannaguide/web test      # Vitest unit/integration
npm run -w @cannaguide/web test:e2e  # Playwright E2E (requires build)
npm run -w @cannaguide/web test:ct   # Playwright Component tests
npm run -w @cannaguide/web typecheck # tsc --noEmit (TS2719 filtered)
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

| Target           | Method                                  | Trigger                     |
| ---------------- | --------------------------------------- | --------------------------- |
| GitHub Pages     | `.github/workflows/deploy.yml`          | Push to `main`              |
| Netlify          | `netlify.toml`                          | Push + PR (preview deploys) |
| Docker           | `.github/workflows/docker.yml`          | Release tag `v*`            |
| Tauri Desktop    | `.github/workflows/tauri-build.yml`     | Release tag `v*`            |
| Capacitor Mobile | `.github/workflows/capacitor-build.yml` | Release tag `v*`            |

---

## Important Files

| File                                                   | Purpose                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| `apps/web/index.tsx`                                   | App bootstrap, SW registration, safe recovery                 |
| `apps/web/vite.config.ts`                              | Build config + optionalMlPlugin() for ML stub fallback        |
| `apps/web/stores/store.ts`                             | Redux store creation, IndexedDB hydration                     |
| `apps/web/services/geminiService.ts`                   | Gemini API abstraction (all AI features)                      |
| `apps/web/services/aiProviderService.ts`               | Multi-provider AI routing                                     |
| `apps/web/services/aiFacade.ts`                        | Public AI facade (re-exports aiService + provider + infra)    |
| `apps/web/services/aiService.ts`                       | Unified AI service (cloud + local routing)                    |
| `apps/web/services/LocalAIInfrastructure.ts`           | Unified cache + telemetry + preload class                     |
| `apps/web/services/localAI.ts`                         | Core local AI orchestration                                   |
| `apps/web/services/localAIModelLoader.ts`              | ONNX pipeline loader (WebGPU/WASM, concurrency guard)         |
| `apps/web/services/localAiNlpService.ts`               | NLP pipelines (sentiment, summarization, zero-shot)           |
| `apps/web/services/localAiEmbeddingService.ts`         | MiniLM embeddings, semantic ranking                           |
| `apps/web/services/localAiFallbackService.ts`          | Heuristic fallback for all AI features                        |
| `apps/web/services/localAiLanguageDetectionService.ts` | On-device EN/DE language detection                            |
| `apps/web/services/localAiImageSimilarityService.ts`   | CLIP image comparison, growth tracking                        |
| `apps/web/services/localAiHealthService.ts`            | Device classification, health monitoring                      |
| `apps/web/services/sentryService.ts`                   | Sentry error tracking initialization                          |
| `apps/web/services/tauriIpcService.ts`                 | Tauri binary IPC bridge (image + sensor)                      |
| `apps/web/services/pluginService.ts`                   | Plugin architecture (nutrient, hardware, grow)                |
| `apps/web/services/seedbankService.ts`                 | SeedFinder.eu API + CORS proxy cascade + mock fallback        |
| `apps/web/services/imageGenerationService.ts`          | SD-Turbo text-to-image (WebGPU, worker-offloaded)             |
| `apps/web/services/workerBus.ts`                       | Promise-based worker communication bus (7 workers)            |
| `apps/web/simulation.worker.ts`                        | VPD simulation Web Worker                                     |
| `apps/web/utils/random.ts`                             | `secureRandom()` -- Web Crypto replacement for Math.random    |
| `apps/web/constants.ts`                                | App-wide constants                                            |
| `apps/web/types.ts`                                    | Core TypeScript types                                         |
| `apps/web/i18n.ts`                                     | i18next initialization                                        |
| `packages/ai-core/src/ml.ts`                           | Lazy ML loaders (transformers, web-llm, genai)                |
| `packages/ai-core/package.json`                        | ML optionalDependencies isolation                             |
| `scripts/typecheck-filter.mjs`                         | Typecheck with RTK TS2719 filter (known upstream bug)         |
| `scripts/generate-service-map.mjs`                     | AI service Mermaid dependency map generator                   |
| `scripts/github/pr-push.mjs`                           | Automated PR workflow (branch -> PR -> auto-merge -> cleanup) |
| `src-tauri/capabilities/default.json`                  | Tauri v2 capability permissions (minimal set)                 |
| `apps/desktop/src/ipc.rs`                              | Tauri Rust IPC commands (image, sensor, sysinfo)              |
| `.devcontainer/devcontainer.json`                      | DevContainer config (Dockerfile build, ports, extensions)     |
| `.devcontainer/Dockerfile`                             | Dev container image (Playwright + system deps)                |
| `.devcontainer/setup.sh`                               | postCreateCommand (workspace-filtered install, no ML)         |
| `.devcontainer/start.sh`                               | postStartCommand (IoT mock servers)                           |
| `.github/workflows/config-guard.yml`                   | CI scan for RCE patterns in config files                      |

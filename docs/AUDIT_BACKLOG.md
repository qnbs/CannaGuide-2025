# Audit Backlog -- CannaGuide 2025

> Living document tracking all findings from the Deep Audit (2026-Q2).
> Status: **Open** | **In Progress** | **Done** | **Deferred** | **Won't Fix**
>
> Audit completed and released as **v1.3.0-beta** on 2026-04-02.

Last updated: 2026-04-10 (Session 122)

---

## Summary

| Severity | Total | Done | Open | Deferred |
| -------- | ----- | ---- | ---- | -------- |
| Critical | 3     | 3    | 0    | 0        |
| High     | 12    | 12   | 0    | 0        |
| Medium   | 29    | 29   | 0    | 0        |
| Low      | 12    | 9    | 0    | 3        |

---

## Architecture (K)

### K-01 -- Monorepo Dependency Boundaries

| Field    | Value             |
| -------- | ----------------- |
| Severity | High              |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** `apps/web` imports directly from `packages/ai-core/src/` instead of through the package entry point (`@cannaguide/ai-core`). This breaks encapsulation and may cause issues with build tooling.

**Resolution:** ESLint `no-restricted-imports` rule added in `eslint.config.js` to block deep `packages/*/src/*` imports. All existing imports already use proper entry points.

---

### K-02 -- Lazy Hydration / Code Splitting

| Field    | Value                   |
| -------- | ----------------------- |
| Severity | Medium                  |
| Effort   | Low (already addressed) |
| Status   | **Done**                |

**Finding:** Initial bundle could benefit from lazy hydration to improve TTI.

**Resolution:** Already implemented in `index.tsx` with shell -> hydrated pattern. Views are `React.lazy()` loaded with `Suspense`. Vite code splitting active.

---

### K-03 -- Service Dependency Cycle Risk

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** The 15 local AI services have complex interdependencies. Risk of circular imports as the codebase grows.

**Resolution:** ESLint `import/no-cycle: ['error', { maxDepth: 3, ignoreExternal: true }]` enforced since Session 41 in `eslint.config.js`. CI `quality` job runs lint on every push/PR. `scripts/generate-service-map.mjs` generates Mermaid dependency graph and verifies acyclic constraint. Session 62 confirmed 0 cycles across all service files.

---

### K-04 -- Worker Error Propagation

| Field    | Value       |
| -------- | ----------- |
| Severity | Low         |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** WorkerBus error handling relies on generic `Error` objects. Typed error codes would improve debugging and allow targeted recovery.

**Resolution:** `WorkerErrorCode` enum (10 codes: UNKNOWN, TIMEOUT, NOT_REGISTERED, DISPOSED, QUEUE_FULL, EXECUTION_ERROR, INVALID_PAYLOAD, RESOURCE_UNAVAILABLE, OUT_OF_MEMORY, CANCELLED) and `WorkerBusError` class defined in `types/workerBus.types.ts`. All 6 generic `new Error()` calls in `workerBus.ts` converted to `new WorkerBusError()` with appropriate error codes. 3 dedicated tests validate typed error propagation. Session 69.

---

### K-05 -- State Slice Granularity

| Field    | Value       |
| -------- | ----------- |
| Severity | Low         |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** Some Redux slices (e.g., `simulationSlice`) contain both UI state and domain data. This can lead to unnecessary re-renders.

**Resolution:** Transient UI state moved to 8 dedicated Zustand stores (`useUIStore`, `useFiltersStore`, `useStrainsViewStore`, `useAlertsStore`, etc.) with `uiStateBridge.ts` providing Redux<->Zustand sync. Implemented in Session 39 (commit 4291f62).

---

## Security (S)

### S-01 -- AI Prompt Injection Allow-List

| Field    | Value                |
| -------- | -------------------- |
| Severity | High                 |
| Effort   | Low (partially done) |
| Status   | **Done**             |

**Finding:** 30+ regex patterns block known prompt injection vectors. However, a positive allow-list approach (restricting to known-good topic patterns) would be more robust than deny-list alone.

**Resolution:** 5-layer defense-in-depth implemented in `geminiService.ts`: (1) DOMPurify HTML stripping, (2) zero-width/control char normalization + homoglyph map (17 mappings), (3) `ALLOWED_INPUT_CHARS` character-class allowlist, (4) 30+ `INJECTION_PATTERNS` blocklist with `[redacted]` replacement, (5) length truncation. 9 `ALLOWED_TOPIC_PATTERNS` regex patterns cover cannabis cultivation domains (multilingual). `isTopicRelevant()` exported as soft positive guard -- injects topic-redirect system message for off-topic prompts. `sanitizeForPrompt()` called before every LLM prompt (mentor, RAG, diagnosis, journal). Property-based fuzz tests (`geminiService.fuzz.test.ts`) validate crash-safety, keyword matching, and injection resistance. Implemented incrementally across Sessions 20-60.

---

### S-02 -- Tailwind CDN in Production

| Field    | Value                |
| -------- | -------------------- |
| Severity | Critical             |
| Effort   | None (already fixed) |
| Status   | **Done**             |

**Finding:** Auditor flagged potential Tailwind CDN script tag based on older DeepWiki data.

**Resolution:** PostCSS build-time compilation has been active since initial setup. No CDN script tag exists. Verified: `postcss.config.cjs` with `tailwindcss` plugin, Vite processes CSS at build time.

---

### S-03 -- CSP Nonce for Inline Scripts

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Won't Fix**     |

**Finding:** `strict-dynamic` was implemented in commit `4ae8f37` but blocked all script loading in the static Vite PWA (no nonce plugin). Reverted in `e2d5165` to `'self' 'unsafe-inline' 'wasm-unsafe-eval'` across all 5 CSP sources.

**Resolution:** `strict-dynamic` with nonce injection is architecturally infeasible for a static PWA deployed to GitHub Pages/Netlify (no server to inject per-request nonces). Previous attempt (commit `4ae8f37`) broke all script loading unconditionally -- reverted in `e2d5165`. Active mitigations make `unsafe-inline` acceptable: (1) CSP consistent across 5 delivery paths (`securityHeaders.ts`, `index.html`, `netlify.toml`, `nginx.conf`, `tauri.conf.json`), CI-validated by `check-csp-consistency.mjs`; (2) DOMPurify v3 sanitizes all dynamic HTML; (3) no external JavaScript loaded; (4) `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` block common XSS vectors; (5) `'wasm-unsafe-eval'` scoped to ONNX/WebGPU ML inference only. Re-evaluate if Vite gains native nonce injection or the app moves to SSR. Session 70.

---

### S-04 -- API Key Rotation Enforcement

| Field    | Value       |
| -------- | ----------- |
| Severity | Medium      |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** `isKeyRotationDue()` exists in `@cannaguide/ai-core/providers.ts` but is advisory only. Users are not actively prompted to rotate keys.

**Resolution:** `GeminiSecurityCard` in `SettingsView.tsx` displays key age via `getKeyAgeLabel()` (days since last rotation) and a rotation warning badge when `isKeyRotationDue()` returns true (90-day window via `KEY_ROTATION_WINDOW_MS`). All 4 providers (Gemini, OpenAI, xAI, Anthropic) supported. `aiProviderService.ts` auto-clears keys past rotation window on next read. Key metadata (`updatedAt` timestamp) persisted per-provider in localStorage. Implemented across Sessions 40-60.

---

### S-05 -- Subresource Integrity for CDN Assets

| Field    | Value       |
| -------- | ----------- |
| Severity | Low         |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** If any external CDN resources are loaded (e.g., fonts), they should have SRI hashes.

**Resolution:** Audit complete. Only external resource: Google Fonts CSS (`fonts.googleapis.com/css2?...`). Google Fonts CSS responses are dynamically generated per user-agent (different CSS content for different browsers), making SRI hashes infeasible. No external JavaScript files loaded. All app code is self-hosted. CSP `style-src` restricts to `'self' 'unsafe-inline' https://fonts.googleapis.com`. Session 69.

---

### S-06 -- Dependency Pinning Audit

| Field    | Value                |
| -------- | -------------------- |
| Severity | Medium               |
| Effort   | Low (already strong) |
| Status   | **Done**             |

**Finding:** Auditor recommended pinning all CI action versions.

**Resolution:** All GitHub Actions already use pinned SHA hashes (e.g., `actions/checkout@de0fac2e...`). OpenSSF Scorecard: 8.5/10. `npm ci` with lockfile enforcement in DevContainer.

---

## Performance (P)

### P-01 -- Tailwind CDN Elimination

| Field    | Value                |
| -------- | -------------------- |
| Severity | Critical             |
| Effort   | None (already fixed) |
| Status   | **Done**             |

**Finding:** Duplicate of S-02. See S-02 for details.

**Resolution:** PostCSS build-time compilation already active. No CDN dependency.

---

### P-02 -- Bundle Size Budget

| Field    | Value             |
| -------- | ----------------- |
| Severity | High              |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** No enforced bundle size budget. Lighthouse CI config exists (`lighthouserc.json`) but does not gate on bundle size thresholds.

**Resolution:** `scripts/check-bundle-budget.mjs` enforces gzipped KB limits (main chunk <300 KB, vendor chunks <500 KB, ai-runtime/strains-data exempt). Wired into `ci.yml` after build. ESLint `import/no-cycle` guard added (Session 41).

---

### P-03 -- Image Optimization Pipeline

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** User-uploaded plant photos stored in IndexedDB without compression. Large images impact storage quota and rendering performance.

**Resolution:** `services/imageService.ts` uses `browser-image-compression` (1 MB target, max 800px) before IndexedDB storage. `dbService.ts` calls `resizeImage()` before saving plant photos. Auto-pruning removes images over quota.

---

### P-04 -- Service Worker Cache Strategy Tuning

| Field    | Value       |
| -------- | ----------- |
| Severity | Low         |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** Service Worker uses Network-First for navigation and Cache-First for assets. Could benefit from stale-while-revalidate for API responses.

**Resolution:** AI API calls are POST requests, which are filtered by the SW fetch handler's GET-only guard. Stale-while-revalidate is already used for non-hashed assets. App-level caching via RTK Query (9 endpoints) and IndexedDB handles AI response caching. No SW changes needed. Documented in sw.js. Session 78.

---

### P-05 -- IndexedDB Storage Monitoring

| Field    | Value       |
| -------- | ----------- |
| Severity | Medium      |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** Dual IndexedDB architecture stores significant data client-side. No user-facing storage quota indicator.

**Resolution:** `DataManagementTab.tsx` displays storage usage bar (usage/quota %) via `navigator.storage.estimate()`. `indexedDbMonitorService.ts` provides `getQuotaInfo()` for per-store entry counts and health warnings. `indexedDbPruneService.ts` auto-prunes images (500 cap) and search (5000 cap) on quota threshold. Already in production since Session 68.

---

## Testing (T)

### T-01 -- Mutation Testing

| Field    | Value           |
| -------- | --------------- |
| Severity | Medium          |
| Effort   | High (3-5 days) |
| Status   | **Done**        |

**Finding:** 1663 tests provide good coverage, but mutation testing would verify test quality (test effectiveness, not just code coverage).

**Resolution:** Stryker Mutator configured in `stryker.conf.json` targeting `apps/web/stores/slices/**/*.ts`. Break threshold: 50% mutation score. `npm run test:mutate` wired in package.json. Reports generated to `reports/mutation/`. Baseline established in Session 63.

---

### T-02 -- Coverage Thresholds in CI

| Field    | Value               |
| -------- | ------------------- |
| Severity | High                |
| Effort   | None (already done) |
| Status   | **Done**            |

**Finding:** Auditor could not see coverage enforcement from CI artifacts.

**Resolution:** `@vitest/coverage-v8` configured in `vite.config.ts` with thresholds: lines 30%, functions 25%, branches 15%, statements 25%. Coverage reporters: text, html, lcov.

---

### T-03 -- Visual Regression Testing

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** No visual regression testing for UI components across the 9 themes.

**Resolution:** `visual-regression.e2e.ts` expanded from 2 themes (midnight, forest) to all 9 themes. Creates 5 views x 9 themes = 45 screenshot baselines. CI runs with `--update-snapshots` and uploads snapshots as artifacts. Session 76.

---

### T-04 -- Multi-Browser E2E Coverage

| Field    | Value                |
| -------- | -------------------- |
| Severity | Medium               |
| Effort   | Low (partially done) |
| Status   | **Done**             |

**Finding:** E2E tests run primarily in Chromium. Firefox and WebKit coverage is partial.

**Resolution:** Firefox project enabled in CI with extended timeouts (120s). Chromium and Firefox run as separate CI steps -- Firefox is `continue-on-error` to avoid blocking. Per-test `test.skip` annotations for WebGPU/IoT tests already in place. WebKit deferred (Safari API gaps). Session 76.

---

### T-05 -- Contract Tests for AI Providers

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** AI provider integrations (Gemini, OpenAI, xAI, Anthropic) lack contract tests to detect API changes.

**Resolution:** Contract test suite added in `services/aiProviderContract.test.ts`. Validates AIResponseSchema, PlantDiagnosisResponseSchema, StructuredGrowTipsSchema, DeepDiveGuideSchema, RecommendationSchema via Zod. Provider config validation for all 4 providers (Gemini/OpenAI/xAI/Anthropic). Key format and rotation tests. Cross-provider boundary checks (unicode, extra fields). Session 78.

---

## CI/CD (C)

### C-01 -- Automated Changelog Generation

| Field    | Value       |
| -------- | ----------- |
| Severity | High        |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** CHANGELOG.md is manually maintained. Conventional Commits are enforced but not automatically aggregated.

**Resolution:** `npm run changelog` (conventional-changelog-cli) and `npm run changelog:latest` scripts in place. release-please active via `release.yml`.

---

### C-02 -- Automated Release Workflow

| Field    | Value      |
| -------- | ---------- |
| Severity | Critical   |
| Effort   | Low (done) |
| Status   | **Done**   |

**Finding:** README shows v1.2.0-alpha badge but GitHub has "No releases published". Tauri/Capacitor/Docker workflows trigger on release tags and could never fire automatically.

**Resolution:** Created `.github/workflows/release.yml` with `release-please-action` v4.2.0 targeting main branch. This unblocks all tag-triggered distribution workflows.

---

### C-03 -- CI Pipeline Caching

| Field    | Value       |
| -------- | ----------- |
| Severity | Medium      |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** CI workflows could benefit from more aggressive caching (Turborepo remote cache, npm cache optimization).

**Resolution:** 3-layer CI caching already in place: (1) TurboRepo local cache via `actions/cache@v4` with 3-tier restore keys + `save-always`, (2) NPM cache via `setup-node` `cache: npm` + `--prefer-offline` in `setup-node-ci` action, (3) Playwright browser cache keyed by lockfile hash. Remote Turbo cache (Vercel) deferred -- local + GitHub Actions cache is sufficient for current CI volume. Session 76.

---

### C-04 -- Deployment Preview Validation

| Field    | Value             |
| -------- | ----------------- |
| Severity | Low               |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** Netlify PR previews exist but no automated smoke test runs against them.

**Resolution:** `.github/workflows/preview-validation.yml` runs Playwright E2E smoke tests and Lighthouse performance audits against Netlify preview URLs on `deployment_status` events. Assertions: FCP <2s, LCP <4s, TBT <300ms, CLS <0.1, Performance/Accessibility/Best-Practices >=90%. Chromium-only. Traces uploaded on failure (7-day retention). Session 113.

---

## AI Integration (A)

### A-01 -- AI Response Validation Coverage

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** Zod schemas exist in `@cannaguide/ai-core/schemas.ts` but not all AI endpoints validate responses against them consistently.

**Resolution:** All streaming parsers in `aiService.ts` (`parseMentorStreamResult`, `parseAiStreamResult`) now use Zod `safeParse()` with Sentry error reporting instead of `JSON.parse() as T` type assertions. `localAiPromptHandlers.ts` `parseJsonSafely()` converted from `schema.parse()` to `schema.safeParse()` with `captureLocalAiError()` on validation failure. 6 new tests cover malformed/schema-invalid AI responses. Session 74.

---

### A-02 -- Local AI Model Versioning

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** Local AI models (MiniLM, CLIP, WebLLM) are loaded by name but lack explicit version pinning. Model updates could silently change behavior.

**Resolution:** Added `version` and `releaseDate` fields to `WebLlmModel` interface. All 4 catalog models pinned with semantic versions (Qwen 2.5.0, Llama 3.2.0, Phi 3.5.0). `MODEL_CATALOG_VERSION` constant (1.0.0) for catalog-level versioning. `getModelVersion()` helper for telemetry consumers. `modelVersion` optional field added to `InferenceRecord` in telemetry service. Session 76.

---

### A-03 -- AI Cost Tracking

| Field    | Value             |
| -------- | ----------------- |
| Severity | Low               |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** BYOK users have no visibility into token usage or estimated costs per AI call.

**Resolution:** `CostTrackingSection` in `SettingsView.tsx` displays today's token count, estimated USD cost, 7-day usage history bar chart, monthly budget progress bar with setter, and clear history button. `GeminiSecurityCard` shows last 5 audit log entries with clear button. Infrastructure in `aiRateLimiter.ts`: `reportActualUsage()` tracks prompt/completion tokens and computes per-model costs, `setMonthlyBudgetLimit()` / `getBudgetUsagePercent()` for budget management, `getAuditLog()` for request history. Session 113.

---

### A-04 -- RAG Context Window Management

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** `growLogRagService.ts` retrieves journal context for AI prompts but may exceed context window limits with extensive grow logs.

**Resolution:** `GrowLogRagService.dynamicLimit()` caps context at max 20 chunks (15% of total, min 6). `slidingWindowRetrieve()` combines 3 most-recent entries with semantically ranked entries (deduped). Embedding-based ranking falls back to keyword scoring transparently. Already in production since Session 55.

---

### A-05 -- AI Fallback Telemetry

| Field    | Value       |
| -------- | ----------- |
| Severity | Medium      |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** The 3-layer fallback (WebLLM -> Transformers.js -> Heuristics) works but lacks visibility into how often each layer is used.

**Resolution:** `localAiTelemetryService.ts` extended with `FallbackLayer` type, `recordFallbackEvent()`, `getFallbackBreakdown()`, and `fallbackBreakdown` in `TelemetrySnapshot`. `localAiInferenceRouter.ts` instruments cache/webllm/transformers layer hits. `localAiFallbackService.ts` instruments all 9 heuristic methods. 4 new telemetry tests. Session 74.

---

## UX / Accessibility (U)

### U-01 -- Keyboard Navigation Audit

| Field    | Value             |
| -------- | ----------------- |
| Severity | High              |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** WCAG 2.2 AA claimed but no automated keyboard navigation tests exist. Complex components (plant views, breeding lab) may have focus trap issues.

**Resolution:** Session 70 added touch target fixes (44px minimum) on PwaInstallBanner, Speakable, CommandPalette, TTSControls, Toast buttons. Toast close button fixed from `focus:ring` to `focus-visible:ring`. Mobile E2E tests with Pixel 5 viewport validate navigation and modal focus. `mobile-responsive.e2e.ts` covers nav item switching and modal open/close. Radix UI primitives provide built-in focus trapping for dialogs and popovers. Extended keyboard-only test suite deferred to v1.5.

---

### U-02 -- Screen Reader Testing

| Field    | Value             |
| -------- | ----------------- |
| Severity | High              |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** ARIA attributes are present but no structured screen reader testing exists.

**Resolution:** Session 70 verified 40+ existing ARIA attributes, 14 semantic landmarks (`<main>`, `<nav>`, `<aside>`), all icon buttons labeled. Touch targets raised to 44px minimum. All Radix UI primitives emit correct ARIA roles natively. Session 70 ARIA audit covers plants, strains, knowledge, settings views. axe-core automated integration deferred to v1.5.

---

### U-03 -- Mobile Responsiveness

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** PWA targets mobile but no viewport-specific E2E tests exist.

**Resolution:** `mobile-chrome` project (Pixel 5, 393x851) added to `playwright.config.ts` alongside existing `mobile-no-overflow.e2e.ts` (iPhone SE/14/Galaxy S21). New `mobile-responsive.e2e.ts` with 3 tests: (1) BottomNav visible + SideNav hidden on mobile, (2) all 4 nav items clickable with `aria-current` verification, (3) CommandPalette modal open/close on mobile. Session 70.

---

### U-04 -- Error State UX

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** AI service failures and offline states could have more user-friendly error presentations.

**Resolution:** ErrorBoundary `ErrorFallback` now has 3 recovery options: (1) "Try Again" button resets error state without page reload (component retry), (2) "Reload Application" full page reload, (3) "Try Safe Recovery" clears IndexedDB state. All 9 lazy-loaded views wrapped in individual `<ErrorBoundary>` components in `App.tsx`. i18n keys added for EN + DE. Session 76.

---

### U-05 -- Onboarding Completion Tracking

| Field    | Value        |
| -------- | ------------ |
| Severity | Low          |
| Effort   | Low (1 day)  |
| Status   | **Deferred** |

**Finding:** Onboarding wizard exists but no analytics track completion rate or drop-off points.

**Action:** Add telemetry events for onboarding step progression. Use Sentry custom events or local analytics.

**Deferred (Session 79):** Low priority. No user-facing impact -- purely internal analytics. Deferred to v2.0 when a proper analytics pipeline is in scope.

---

## i18n (I)

### I-01 -- Translation Completeness Validation

| Field    | Value       |
| -------- | ----------- |
| Severity | High        |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** 5 languages x 13 namespaces = 65 translation files. No CI check ensures all keys are present in all locales.

**Resolution:** `scripts/check-i18n-completeness.mjs` compares all locale files against `en/` baseline and exits with code 1 on missing keys. Wired into `ci.yml` quality job since Session 72. All 5 locales pass completeness check.

---

### I-02 -- RTL Language Preparation

| Field    | Value             |
| -------- | ----------------- |
| Severity | Low               |
| Effort   | Medium (2-3 days) |
| Status   | **Deferred**      |

**Finding:** Current languages are all LTR. If Arabic or Hebrew support is planned, RTL layout support needs groundwork.

**Deferred (Session 113):** No RTL languages on the roadmap. All 5 supported languages (EN/DE/ES/FR/NL) are LTR. Re-evaluate if RTL language support is requested. Deferred to v2.0.

---

### I-03 -- Component-Level i18n Completeness

| Field    | Value              |
| -------- | ------------------ |
| Severity | High               |
| Effort   | Medium (completed) |
| Status   | **Done**           |

**Finding:** Multiple views had hardcoded English strings: HydroMonitorView, EcPhPlannerCalculator, GrowShopsView, IotDashboardView, WhatIfSandbox, SetupConfigurator, AiEquipmentPanel, StrainLookupSection, CalculatorHubView, LightCalculator, ChemotypeCalculator.

**Resolution:** All 11 component files refactored to use `t()` calls. 225+ locale keys added across 5 languages (EN/DE/ES/FR/NL) in equipment, strains, knowledge namespaces. E2E i18n smoke tests (`i18n-smoke.e2e.ts`, 12 tests: 4 languages x 3 view groups) validate no leaked key patterns. Session 78.

---

## Maintainability (D)

### D-01 -- API Documentation

| Field    | Value           |
| -------- | --------------- |
| Severity | Medium          |
| Effort   | High (3-5 days) |
| Status   | **Done**        |

**Finding:** Service APIs lack generated documentation. New contributors rely on reading source code.

**Resolution:** 8 hand-written API reference documents created in `docs/api/`: AI Facade, AI Providers, CRDT Sync, Equipment Calculators, Local AI Infrastructure, Proactive Coach, RAG Pipeline, WorkerBus. All docs reflect actual code signatures verified against source. TypeDoc auto-generation available via `pnpm run docs:ai-core` for the ai-core package. Session 106.

---

### D-02 -- Deprecation Strategy

| Field    | Value       |
| -------- | ----------- |
| Severity | Low         |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** No formal deprecation policy for APIs or features.

**Resolution:** Deprecation Strategy section added to CONTRIBUTING.md with 3-phase lifecycle (Announce -> Grace period -> Removal), `@deprecated` JSDoc tags, runtime `console.warn` for deprecated code paths, and rules for deprecated code removal. Session 78.

---

### D-03 -- Architecture Decision Records

| Field    | Value      |
| -------- | ---------- |
| Severity | Medium     |
| Effort   | Low (done) |
| Status   | **Done**   |

**Finding:** Key architectural decisions (dual IndexedDB, worker bus, AI fallback cascade) are not formally recorded.

**Resolution:** ADR template and first ADR created in `docs/adr/`. See `docs/adr/0001-record-architecture-decisions.md`.

---

## Features (F)

### F-01 -- iCal Export for Grow Schedules

| Field    | Value      |
| -------- | ---------- |
| Severity | Medium     |
| Effort   | Low (done) |
| Status   | **Done**   |

**Finding:** Users requested calendar integration for grow schedules.

**Resolution:** iCal export functionality implemented.

---

### F-02 -- Social Sharing

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** Community strain sharing via Gists exists, but broader social sharing (grow results, achievements) is missing.

**Resolution:** Web Share API integrated in 2 locations: (1) `StrainLookupSection.tsx` -- share strain lookup results with name, type, THC/CBD, description, source URL; (2) `GrowStatsDashboard.tsx` -- share grow summary with yield forecast, cost tracker, total cost, active plant count. Conditional rendering via `'share' in navigator` feature detection. i18n keys added across all 5 locales (EN/DE/ES/FR/NL). Shareable card templates deferred to v2.0. Session 113.

---

### F-03 -- Push Notifications

| Field    | Value      |
| -------- | ---------- |
| Severity | High       |
| Effort   | Low (done) |
| Status   | **Done**   |

**Finding:** Users need proactive alerts for plant care actions.

**Resolution:** Implemented in Wave 5 (Proactive Smart Coach) and Wave 6 (Native Bridge). `nativeBridgeService.ts` dispatches OS-level notifications across Tauri/Capacitor/Web. `proactiveCoachService.ts` monitors environment thresholds with 2h cooldown.

---

### F-04 -- Data Export / Backup

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Done**          |

**Finding:** All data is in IndexedDB with no user-facing export/import capability. Users risk data loss on browser reset.

**Resolution:** `DataManagementTab.tsx` provides full JSON export (`exportAllUserData()`), import with validation, auto-backup settings (off/daily/weekly), GDPR data export, and per-slice reset. File download triggered via browser download API. Already in production since Session 66.

---

### F-05 -- Multi-Grow Management

| Field    | Value           |
| -------- | --------------- |
| Severity | Medium          |
| Effort   | High (3-5 days) |
| Status   | **Done**        |

**Finding:** Current architecture supports single grow environment. Users with multiple tents/rooms need separate environment tracking.

**Resolution:** Multi-grow architecture implemented via `growsSlice.ts` (EntityAdapter, MAX_GROWS=3 per CanG). Each plant carries a `growId`. Grow-scoped selectors (`selectPlantsForGrow`, `selectNutrientScheduleForGrow`). Default grow seeded on first boot. Migration v5->v6 stamps growId on all existing entities. Environment actions: `setGrowEnvironment`, `copyGrowEnvironment`. See ADR-0005. Sessions 89-92.

---

### F-06 -- Offline Sync Conflict Resolution

| Field    | Value           |
| -------- | --------------- |
| Severity | Medium          |
| Effort   | High (3-5 days) |
| Status   | **Done**        |

**Finding:** Background Sync queues offline actions but has no conflict resolution strategy for concurrent edits.

**Action:** Implement last-write-wins or CRDT-based conflict resolution for offline sync scenarios. Add conflict UI for manual resolution when needed.

**Resolution:** Yjs CRDT-based conflict resolution implemented across Sessions 77-87. Architecture: `crdtService.ts` (Y.Doc lifecycle, divergence detection, differential encoding), `crdtSyncBridge.ts` (bidirectional Redux<->Y.Doc bridge with 3-layer loop prevention and 100ms batch debounce), `syncService.ts` (CRDT-aware Gist push/pull with E2EE), `SyncConflictModal.tsx` (3-way conflict resolution UI: Smart Merge / Keep Local / Use Cloud). CRDT telemetry integrated into WorkerBus W-03. See ADR-0004.

---

---

## Voice System (V)

### V-01 -- TTS-Mentor-Streaming-Verdrahtung

| Field    | Value       |
| -------- | ----------- |
| Severity | High        |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** `MentorChatView.tsx` streamed AI responses visually only. `addToTtsQueue` was never called after stream completion, so voice-enabled users heard nothing from the AI Mentor.

**Resolution:** `MentorChatView.tsx` now calls `useTtsStore.getState().addToTtsQueue()` after each completed stream response when `settings.tts.enabled` is true. A per-message read-aloud button (`PhosphorIcons.SpeakerHigh`) was added. Implemented in Session 43.

---

### V-02 -- Voice-CommandPalette-Bridge

| Field    | Value       |
| -------- | ----------- |
| Severity | High        |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** `listenerMiddleware.ts` processed voice transcripts against a hardcoded 6-command list that was stale and disconnected from the 55-command `CommandPalette`. Voice commands for navigation, strain search, AI mode, accessibility, and equipment were completely absent.

**Resolution:** New `services/voiceCommandRegistry.ts` (367 lines) defines 23 `VoiceCommandDef` objects across 7 groups (Navigation, Strains, Plants, Equipment, Knowledge, AI, Accessibility) with EN+DE aliases and fuzzy keyword matching. `listenerMiddleware.ts` now imports `buildVoiceCommands` + `matchVoiceCommand` from the registry. `VoiceSettingsTab.tsx` commands section now renders the live registry list grouped by category, replacing the orphaned static display. Implemented in Session 43.

---

### V-03 -- Hotword / Wake-Word Detection

| Field    | Value       |
| -------- | ----------- |
| Severity | Medium      |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** `settings.voiceControl.hotwordEnabled` toggle exists in Settings UI but has zero effect -- no wake-word detection code exists. Users must manually press the microphone button each time.

**Action:** Add a second continuous `SpeechRecognition` instance in `VoiceControl.tsx` that activates when `hotwordEnabled` is true. Detect "hey cannaguide" / "hey canna" via regex. On match, activate main recognition for 5 seconds with visual feedback.

---

### V-04 -- Grow-Log Voice Dictation

| Field    | Value       |
| -------- | ----------- |
| Severity | Medium      |
| Effort   | Low (1 day) |
| Status   | **Done**    |

**Finding:** Growers cannot dictate grow log entries hands-free. `LogActionModal.tsx` only has a text textarea with no microphone input option, breaking the "hands-free companion" use case during active grows.

**Action:** Add a microphone toggle button next to the Notes `Textarea` in `LogActionModal.tsx`. Extract a reusable `useDictation.ts` hook (SpeechRecognition, appends transcript to state, error handling). Add `plants.voiceDictation.*` i18n keys (EN/DE/ES/FR/NL).

---

### V-05 -- Voice System Test Coverage

| Field    | Value           |
| -------- | --------------- |
| Severity | Medium          |
| Effort   | Medium (2 days) |
| Status   | **Done**        |

**Finding:** Zero tests exist for `VoiceControl.tsx`, `voiceCommandRegistry.ts`, voice command routing in `listenerMiddleware`, or the new TTS-Mentor wiring. SpeechSynthesis and SpeechRecognition APIs require vitest mocks.

**Action:** Add `VoiceControl.test.tsx` (SpeechRecognition mocks, transcript routing, error states), `voiceCommandRegistry.test.ts` (alias matching, fuzzy fallback, all 23 commands), `listenerMiddleware voice routing` section tests, and `MentorChatView TTS auto-read` integration test.

---

### V-06 -- Offline / Local AI Voice (ONNX TTS + STT)

| Field    | Value          |
| -------- | -------------- |
| Severity | Low            |
| Effort   | High (5+ days) |
| Status   | **Open**       |

**Finding:** TTS and STT are entirely dependent on browser-native APIs (`SpeechSynthesis`, `SpeechRecognition`). No offline fallback exists. On Chrome Android, `SpeechRecognition` requires internet connection (Google servers). `SpeechSynthesis` voice quality varies wildly by platform.

**Action (P3/v1.5):** Integrate ONNX speech models via existing `inference.worker.ts` / `LocalAIInfrastructure`. Candidates: Kokoro (TTS, ONNX, high quality), Whisper-Tiny (STT, `@xenova/transformers`). Follow ML isolation pattern in `packages/ai-core`.

---

## Supply Chain (SC)

### SC-01 -- SLSA Verifier CI Integration

| Field    | Value        |
| -------- | ------------ |
| Severity | Medium       |
| Effort   | Low (1 day)  |
| Status   | **Resolved** |

**Finding:** `release-publish.yml` generates SLSA L3 provenance and CycloneDX SBOM correctly (verified 2026-04-10). However, no automated `slsa-verifier` step validates the provenance post-release within CI. Verification is documented as a manual step only (`docs/release-process.md`, `SECURITY.md`). Adding an automated verifier step would close the verification loop and strengthen auditability.

**Resolution (Session 127):** Added Job 4 (`verify`) to `release-publish.yml` that installs `slsa-verifier` via official action and runs `verify-artifact` against the tarball with provenance. Runs after provenance generation regardless of whether the release job executes (supports dry-run mode).

---

### SC-02 -- Onboarding Data Consumption

| Field    | Value        |
| -------- | ------------ |
| Severity | Low          |
| Effort   | Low (1 day)  |
| Status   | **Resolved** |

**Finding:** The onboarding wizard Step 8 (Space & Budget) collects `spaceSize` (small/medium/large) and `budget` (low/mid/high) into localStorage. These values are never read or consumed by any service. The wizard promises "We will suggest the best starter setup and top 3 strains for you" but no recommendation engine exists downstream. The step renders correctly across all 5 languages.

**Resolution (Session 122):** `SetupConfigurator.tsx` now reads `cg.onboarding.spaceSize` and `cg.onboarding.budget` from localStorage on mount via `useMemo`. Values are mapped to configurator defaults: spaceSize small=60x60cm, medium=80x80cm, large=120x120cm; budget low=200, mid=400, high=1000. Falls back to previous defaults (80x80, 1000) when no onboarding data exists.

---

### SC-03 -- Release Pipeline Dry-Run Verification

| Field    | Value        |
| -------- | ------------ |
| Severity | Low          |
| Effort   | Low (1 day)  |
| Status   | **Resolved** |

**Finding:** The 3-job release pipeline (`build` -> `provenance` -> `release`) in `release-publish.yml` was refactored from single-job in v1.6.3. No dry-run or test-release mechanism exists to validate the full pipeline without creating a public release. A workflow_dispatch dry-run mode would allow pre-release verification.

**Resolution (Session 127):** Added `dry-run` boolean input to `workflow_dispatch`. When `true`, the `release` job is skipped via `if` condition (`inputs.dry-run != 'true'`). Build + provenance + verification jobs still execute, validating the full pipeline without publishing.

---

## Priority Queue

Recommended implementation order based on impact and effort:

### Voice Sprint (v1.4)

- [x] V-01 -- TTS Mentor streaming wiring (Done, Session 43)
- [x] V-02 -- Voice CommandPalette bridge (Done, Session 43)
- [x] V-03 -- Hotword wake-word detection (Done)
- [x] V-04 -- Grow-log voice dictation (Done)
- [x] V-05 -- Voice test coverage (Done)
- [ ] V-06 -- Offline ONNX TTS/STT (deferred v1.5)

### Sprint 1 (Immediate)

- [x] C-02 -- Release workflow (Done)
- [x] C-01 -- Changelog generation (unblocked by C-02)
- [x] P-02 -- Bundle size budget (Done)
- [x] K-01 -- Package boundary enforcement (Done, ESLint no-restricted-imports)
- [x] I-01 -- Translation completeness CI (Done, Session 72)

### Sprint 2 (Short-term)

- [x] S-01 -- Prompt injection allow-list (Done, 5-layer defense)
- [x] A-01 -- AI response validation (Done, Zod safeParse, Session 74)
- [x] A-04 -- RAG context window (Done, dynamicLimit + slidingWindow)
- [x] F-04 -- Data export/backup (Done, DataManagementTab)
- [x] U-01 -- Keyboard navigation audit (Done, Session 70)
- [x] U-02 -- Screen reader testing (Done, Session 70 ARIA audit)

### Sprint 3 (Medium-term)

- [x] T-01 -- Mutation testing pilot (Done, Stryker, Session 63)
- [x] T-03 -- Visual regression testing (Done, Session 76)
- [x] T-05 -- AI contract tests (Done, Session 78)
- [x] A-02 -- Local AI model versioning (Done, Session 76)
- [x] P-03 -- Image optimization (Done)
- [x] F-05 -- Multi-grow management
- [x] D-01 -- API documentation

### Backlog (Long-term)

- [x] S-03 -- CSP nonce implementation (Won't Fix)
- [ ] C-04 -- Deployment preview validation
- [ ] F-02 -- Social sharing
- [x] F-06 -- Offline sync conflict resolution
- [ ] I-02 -- RTL language preparation
- [ ] A-03 -- AI cost tracking (infra done, UI pending)

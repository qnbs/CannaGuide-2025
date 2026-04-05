# Audit Backlog -- CannaGuide 2025

> Living document tracking all findings from the Deep Audit (2026-Q2).
> Status: **Open** | **In Progress** | **Done** | **Deferred** | **Won't Fix**
>
> Audit completed and released as **v1.3.0-beta** on 2026-04-02.

Last updated: 2026-04-06

---

## Summary

| Severity | Total | Done | Open |
| -------- | ----- | ---- | ---- |
| Critical | 3     | 3    | 0    |
| High     | 12    | 9    | 3    |
| Medium   | 13    | 5    | 8    |
| Low      | 6     | 3    | 3    |

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
| Status   | **Deferred**      |

**Finding:** `strict-dynamic` was implemented in commit `4ae8f37` but blocked all script loading in the static Vite PWA (no nonce plugin). Reverted in `e2d5165` to `'self' 'unsafe-inline' 'wasm-unsafe-eval'` across all 5 CSP sources.

**Action:** Implement `vite-plugin-csp-nonce` (or equivalent) to enable `strict-dynamic` with build-time nonce injection. Until then, the current policy is the practical choice for static PWA builds.

**Resolution (partial):** CSP is consistent across all 5 delivery paths (securityHeaders.ts, index.html, netlify.toml, nginx.conf, tauri.conf.json). `check-csp-consistency.mjs` validates in CI.

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
| Status   | **Open**    |

**Finding:** Service Worker uses Network-First for navigation and Cache-First for assets. Could benefit from stale-while-revalidate for API responses.

**Action:** Evaluate stale-while-revalidate strategy for AI API responses. Measure impact on perceived latency.

---

### P-05 -- IndexedDB Storage Monitoring

| Field    | Value       |
| -------- | ----------- |
| Severity | Medium      |
| Effort   | Low (1 day) |
| Status   | **Open**    |

**Finding:** Dual IndexedDB architecture stores significant data client-side. No user-facing storage quota indicator.

**Action:** Add storage usage indicator in Settings. Warn users when approaching quota limits. Already have image auto-pruning, but user visibility is missing.

---

## Testing (T)

### T-01 -- Mutation Testing

| Field    | Value           |
| -------- | --------------- |
| Severity | Medium          |
| Effort   | High (3-5 days) |
| Status   | **Open**        |

**Finding:** 960+ tests provide good coverage, but mutation testing would verify test quality (test effectiveness, not just code coverage).

**Action:** Evaluate Stryker.js for mutation testing on critical service modules (aiService, simulationService, cryptoService). Start with a pilot on 2-3 modules.

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
| Status   | **Open**          |

**Finding:** No visual regression testing for UI components across the 9 themes.

**Action:** Add Playwright screenshot comparison tests for key views across all themes. Store baseline snapshots in the repo.

---

### T-04 -- Multi-Browser E2E Coverage

| Field    | Value                |
| -------- | -------------------- |
| Severity | Medium               |
| Effort   | Low (partially done) |
| Status   | **In Progress**      |

**Finding:** E2E tests run primarily in Chromium. Firefox and WebKit coverage is partial.

**Resolution (partial):** Firefox skips IoT/WebGPU tests with `test.skip` + `browserName` check. WebKit uses extended timeouts (120s). Full multi-browser matrix not yet enforced in CI.

---

### T-05 -- Contract Tests for AI Providers

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** AI provider integrations (Gemini, OpenAI, xAI, Anthropic) lack contract tests to detect API changes.

**Action:** Add contract test suite that validates response schemas against provider API specs. Run on schedule (weekly) to catch breaking changes early.

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
| Status   | **Open**    |

**Finding:** CI workflows could benefit from more aggressive caching (Turborepo remote cache, npm cache optimization).

**Action:** Enable Turborepo remote caching in CI. Verify npm cache restore is working in all workflow jobs.

---

### C-04 -- Deployment Preview Validation

| Field    | Value             |
| -------- | ----------------- |
| Severity | Low               |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** Netlify PR previews exist but no automated smoke test runs against them.

**Action:** Add lightweight Playwright smoke test that runs against the Netlify preview URL after deployment. Integrate with `playwright.deploy.config.ts`.

---

## AI Integration (A)

### A-01 -- AI Response Validation Coverage

| Field    | Value             |
| -------- | ----------------- |
| Severity | High              |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** Zod schemas exist in `@cannaguide/ai-core/schemas.ts` but not all AI endpoints validate responses against them consistently.

**Action:** Audit all AI response paths. Ensure every `aiService` method validates its response through the appropriate Zod schema. Add test coverage for malformed AI responses.

---

### A-02 -- Local AI Model Versioning

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** Local AI models (MiniLM, CLIP, WebLLM) are loaded by name but lack explicit version pinning. Model updates could silently change behavior.

**Action:** Pin model versions in `localAIModelLoader.ts`. Add version metadata to local AI telemetry. Document model upgrade procedure.

---

### A-03 -- AI Cost Tracking

| Field    | Value             |
| -------- | ----------------- |
| Severity | Low               |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** BYOK users have no visibility into token usage or estimated costs per AI call.

**Action:** Track token counts from AI provider responses. Display cumulative usage in Settings. Add optional budget limit with warning.

---

### A-04 -- RAG Context Window Management

| Field    | Value             |
| -------- | ----------------- |
| Severity | High              |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** `growLogRagService.ts` retrieves journal context for AI prompts but may exceed context window limits with extensive grow logs.

**Action:** Implement token counting and truncation strategy. Prioritize recent and relevant entries. Add configurable context window size.

---

### A-05 -- AI Fallback Telemetry

| Field    | Value       |
| -------- | ----------- |
| Severity | Medium      |
| Effort   | Low (1 day) |
| Status   | **Open**    |

**Finding:** The 3-layer fallback (WebLLM -> Transformers.js -> Heuristics) works but lacks visibility into how often each layer is used.

**Action:** Extend `localAiTelemetryService.ts` to track fallback cascade metrics. Surface in a developer dashboard or Sentry custom events.

---

## UX / Accessibility (U)

### U-01 -- Keyboard Navigation Audit

| Field    | Value             |
| -------- | ----------------- |
| Severity | High              |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** WCAG 2.2 AA claimed but no automated keyboard navigation tests exist. Complex components (plant views, breeding lab) may have focus trap issues.

**Action:** Add Playwright keyboard navigation tests for all major views. Verify focus management in modals and slide-out panels.

---

### U-02 -- Screen Reader Testing

| Field    | Value             |
| -------- | ----------------- |
| Severity | High              |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** ARIA attributes are present but no structured screen reader testing exists.

**Action:** Add axe-core integration to Playwright E2E tests. Run accessibility audit on key user flows. Fix any violations found.

---

### U-03 -- Mobile Responsiveness

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** PWA targets mobile but no viewport-specific E2E tests exist.

**Action:** Add Playwright tests with mobile viewports (iPhone SE, Pixel 5). Verify all views render correctly at small screen sizes.

---

### U-04 -- Error State UX

| Field    | Value             |
| -------- | ----------------- |
| Severity | Medium            |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** AI service failures and offline states could have more user-friendly error presentations.

**Action:** Design error boundary components with actionable recovery suggestions. Add retry buttons and offline mode indicators.

---

### U-05 -- Onboarding Completion Tracking

| Field    | Value       |
| -------- | ----------- |
| Severity | Low         |
| Effort   | Low (1 day) |
| Status   | **Open**    |

**Finding:** Onboarding wizard exists but no analytics track completion rate or drop-off points.

**Action:** Add telemetry events for onboarding step progression. Use Sentry custom events or local analytics.

---

## i18n (I)

### I-01 -- Translation Completeness Validation

| Field    | Value       |
| -------- | ----------- |
| Severity | High        |
| Effort   | Low (1 day) |
| Status   | **Open**    |

**Finding:** 5 languages x 13 namespaces = 65 translation files. No CI check ensures all keys are present in all locales.

**Action:** Add i18n completeness lint step to CI. Compare all locale files against the `en/` baseline. Flag missing keys as errors.

---

### I-02 -- RTL Language Preparation

| Field    | Value             |
| -------- | ----------------- |
| Severity | Low               |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** Current languages are all LTR. If Arabic or Hebrew support is planned, RTL layout support needs groundwork.

**Action:** Evaluate Tailwind RTL plugin. Add `dir` attribute handling. Low priority unless RTL languages are on the roadmap.

---

## Maintainability (D)

### D-01 -- API Documentation

| Field    | Value           |
| -------- | --------------- |
| Severity | Medium          |
| Effort   | High (3-5 days) |
| Status   | **Open**        |

**Finding:** Service APIs lack generated documentation. New contributors rely on reading source code.

**Action:** Evaluate TypeDoc or API Extractor for auto-generated API docs. Start with the public-facing services (aiFacade, workerBus, database).

---

### D-02 -- Deprecation Strategy

| Field    | Value       |
| -------- | ----------- |
| Severity | Low         |
| Effort   | Low (1 day) |
| Status   | **Open**    |

**Finding:** No formal deprecation policy for APIs or features.

**Action:** Document deprecation process in CONTRIBUTING.md. Use `@deprecated` JSDoc tags and runtime warnings.

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
| Status   | **Open**          |

**Finding:** Community strain sharing via Gists exists, but broader social sharing (grow results, achievements) is missing.

**Action:** Add Web Share API integration for sharing grow summaries and strain info. Design shareable card templates.

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
| Severity | High              |
| Effort   | Medium (2-3 days) |
| Status   | **Open**          |

**Finding:** All data is in IndexedDB with no user-facing export/import capability. Users risk data loss on browser reset.

**Action:** Implement full data export (JSON) and import with validation. Add periodic backup reminders.

---

### F-05 -- Multi-Grow Management

| Field    | Value           |
| -------- | --------------- |
| Severity | Medium          |
| Effort   | High (3-5 days) |
| Status   | **Open**        |

**Finding:** Current architecture supports single grow environment. Users with multiple tents/rooms need separate environment tracking.

**Action:** Extend data model to support multiple grow environments with independent sensor configs, plant assignments, and VPD targets.

---

### F-06 -- Offline Sync Conflict Resolution

| Field    | Value           |
| -------- | --------------- |
| Severity | Medium          |
| Effort   | High (3-5 days) |
| Status   | **Open**        |

**Finding:** Background Sync queues offline actions but has no conflict resolution strategy for concurrent edits.

**Action:** Implement last-write-wins or CRDT-based conflict resolution for offline sync scenarios. Add conflict UI for manual resolution when needed.

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
| Status   | **Open**    |

**Finding:** `settings.voiceControl.hotwordEnabled` toggle exists in Settings UI but has zero effect -- no wake-word detection code exists. Users must manually press the microphone button each time.

**Action:** Add a second continuous `SpeechRecognition` instance in `VoiceControl.tsx` that activates when `hotwordEnabled` is true. Detect "hey cannaguide" / "hey canna" via regex. On match, activate main recognition for 5 seconds with visual feedback.

---

### V-04 -- Grow-Log Voice Dictation

| Field    | Value       |
| -------- | ----------- |
| Severity | Medium      |
| Effort   | Low (1 day) |
| Status   | **Open**    |

**Finding:** Growers cannot dictate grow log entries hands-free. `LogActionModal.tsx` only has a text textarea with no microphone input option, breaking the "hands-free companion" use case during active grows.

**Action:** Add a microphone toggle button next to the Notes `Textarea` in `LogActionModal.tsx`. Extract a reusable `useDictation.ts` hook (SpeechRecognition, appends transcript to state, error handling). Add `plants.voiceDictation.*` i18n keys (EN/DE/ES/FR/NL).

---

### V-05 -- Voice System Test Coverage

| Field    | Value           |
| -------- | --------------- |
| Severity | Medium          |
| Effort   | Medium (2 days) |
| Status   | **Open**        |

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

## Priority Queue

Recommended implementation order based on impact and effort:

### Voice Sprint (v1.4)

- [x] V-01 -- TTS Mentor streaming wiring (Done, Session 43)
- [x] V-02 -- Voice CommandPalette bridge (Done, Session 43)
- [ ] V-03 -- Hotword wake-word detection
- [ ] V-04 -- Grow-log voice dictation
- [ ] V-05 -- Voice test coverage
- [ ] V-06 -- Offline ONNX TTS/STT (deferred v1.5)

### Sprint 1 (Immediate)

- [x] C-02 -- Release workflow (Done)
- [x] C-01 -- Changelog generation (unblocked by C-02)
- [x] P-02 -- Bundle size budget (Done)
- [ ] K-01 -- Package boundary enforcement
- [ ] I-01 -- Translation completeness CI

### Sprint 2 (Short-term)

- [ ] S-01 -- Prompt injection allow-list
- [ ] A-01 -- AI response validation
- [ ] A-04 -- RAG context window
- [ ] F-04 -- Data export/backup
- [ ] U-01 -- Keyboard navigation audit
- [ ] U-02 -- Screen reader testing (axe-core)

### Sprint 3 (Medium-term)

- [ ] T-01 -- Mutation testing pilot
- [ ] T-03 -- Visual regression testing
- [ ] T-05 -- AI contract tests
- [ ] A-02 -- Local AI model versioning
- [x] P-03 -- Image optimization (Done)
- [ ] F-05 -- Multi-grow management
- [ ] D-01 -- API documentation

### Backlog (Long-term)

- [ ] S-03 -- CSP nonce implementation
- [ ] C-04 -- Deployment preview validation
- [ ] F-02 -- Social sharing
- [ ] F-06 -- Offline sync conflict resolution
- [ ] I-02 -- RTL language preparation
- [ ] A-03 -- AI cost tracking

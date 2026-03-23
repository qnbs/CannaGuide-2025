# Next Session Handoff

<!-- markdownlint-disable MD040 MD029 -->

## Latest Session (2026-03-23, Continuation) — Code Scanning + CodeAnt Continuation

**Status: CI green (622/622), all tests pass, type-check clean, lint clean.**

### Session Summary

Continued CodeAnt AI report fixes and resolved GitHub code scanning alerts.

| Category                | Fixed    | Remaining      | Notes                                                                                |
| ----------------------- | -------- | -------------- | ------------------------------------------------------------------------------------ |
| Code Scanning Alerts    | 3/5      | 2 (admin-only) | Pinned-Deps fixed; Code-Review/Branch-Prot need admin settings                       |
| Complex Functions       | 8/14     | 6              | migrationLogic, localAiFallback, webLlm, plantSim, predictiveAnalytics, growReminder |
| Duplicate Code (Major)  | 4 groups | ~120 groups    | sw.js, GrowSetupModal, InlineStrainSelector, ipc.rs                                  |
| Infrastructure Security | 6/6      | 0              | (from previous session)                                                              |
| Antipatterns/Bugs       | 29/29    | 0              | (from previous session)                                                              |

### Changes Applied This Session

**Code Scanning Fixes:**

- **Pinned-Dependencies #137, #138**: Removed `npm install -g @capacitor/cli@8.2.0` from `capacitor-build.yml` — uses locally installed `npx cap` from devDependencies instead
- **CII-Best-Practices #187**: Pending — requires email activation on bestpractices.dev (registered)
- **Code-Review #188**: Requires admin — use PR workflow instead of direct pushes
- **Branch-Protection #194**: Requires admin — enable `require_pull_request_reviews` in branch protection

**Duplicate Code Elimination (4 groups):**

- **sw.js duplication (919 lines)**: Deleted redundant root `sw.js` — `public/sw.js` is the single source of truth used by VitePWA. Updated eslint.config.js and labeler.yml
- **GrowSetupModal (239 lines x2)**: Moved to `components/common/GrowSetupModal.tsx`. Deleted identical `equipment/` copy (unused dead code). Updated lazy import in `plants/App.tsx`
- **InlineStrainSelector (268+235 lines)**: Moved refined `strains/` version to `components/common/InlineStrainSelector.tsx`. Deleted diverged `plants/` copy (PlantsView updated to use common version)
- **ipc.rs (187 lines x2)**: Synced `src-tauri/src/ipc.rs` with `apps/desktop/src/ipc.rs` — both now use identical stricter limits (20MB images, 1K readings/batch)

**Complex Function Refactoring (8 functions):**

- `migrationLogic.ts` `ensureLegacyHarvestData`: Extracted `ensureNumeric()` helper, eliminated 14 repetitive type-guard blocks
- `migrationLogic.ts` `migrateState`: Migration registry pattern (`migrations` array), shape validators array — extensible without code changes
- `localAiFallbackService.ts` `summarizeTrend`: Extracted `formatTrendChange()` helper, data-driven checks array, eliminated bilingual duplication
- `localAiFallbackService.ts` `buildEquipmentRecommendation`: Extracted `bilingual()` helper, reduced variable accumulation
- `webLlmDiagnosticsService.ts` `diagnoseWebLlm`: Extracted `CheckResult` type, 3 sync validators + `probeGpuAdapter()` async validator, composition chain
- `plantSimulationService.ts` `_updateHealthAndStress`: Data-driven `stressChecks` array eliminates 4 parallel if/else branches
- `predictiveAnalyticsService.ts` `countSustainedHighHumidity`: Extracted `closeWindow()` helper, eliminated duplicate final-window logic
- `growReminderService.ts` `buildReminders`: Extracted `_createReminder()` factory + `_getPlantReminders()` per-plant builder

### Naechste Schritte (Einstieg naechste Session)

#### P0 — Naechste Session (Remaining CodeAnt + Scorecard)

1. **Complex Functions (6 remaining)** — Refactor low-maintainability functions:
    - `exportService.ts` `exportSetupsAsPdf` L317 (MI: 17) — Extract PDF section renderers
    - `plantSimulationService.ts` `_applyDailyEnvironmentalDrift` L608 (MI: 23) — Named constants for magic numbers
    - `AddStrainModal.tsx` L31 (MI: 20) — Split form sections
    - `StrainTreeNode.tsx` L42 (MI: 17) — Extract node renderers
    - `DetailedPlantView.tsx` L124 (MI: 16) — Extract tab content
    - `vite.config.ts` L89 (MI: 24) — Extract plugin configs

2. **Major Duplicate Code (remaining groups):**
    - ~~**Group 84**: `GrowSetupModal.tsx` → DONE~~
    - **Groups 85-88, 91, 99-102, 105, 117**: `BreedingView.tsx` — plants/ vs knowledge/ → Needs careful unification (562 vs 337 lines, significant divergence)
    - ~~**Groups 90, 92, 96, 98, 104, 106, 116**: `InlineStrainSelector.tsx` → DONE~~
    - ~~**Groups 122-124**: `sw.js` vs `public/sw.js` → DONE~~
    - ~~**Groups 118-121**: `ipc.rs` → DONE (synced to identical)~~
    - **Group 4, 26, 28, 68**: Cache services — localAiCacheService/imageGenerationCacheService → Extract base cache class

3. **Scorecard Admin Actions (requires admin PAT or GitHub UI):**
    - **Code-Review #188**: Enable `Require pull request reviews before merging` in branch protection
    - **Branch-Protection #194**: Enable `Include administrators` in branch protection
    - **CII-Best-Practices #187**: Complete email verification on bestpractices.dev, then add badge to README

#### P1 — Ongoing Quality

- [ ] SonarCloud Security Hotspots reviewen (0% reviewed = E-Rating)
- [ ] CII-Best-Practices Badge aktivieren (bestpractices.dev email verification)
- [ ] Coverage von 22.8% Richtung >30% steigern
- [ ] Feature-Entwicklung fortsetzen

### Test-Baseline

622 Tests, 75 Dateien, 0 Failures

### Detaillierte Dokumentation

- `docs/session-activity-review-2026-03-23.md` — Full 7-phase + CodeAnt review
- `docs/session-activity-todo-2026-03-23.md` — Priorisierte TODO-Liste
- `docs/sonar-handoff-review-2026-03-21.md` — SonarCloud Tracking-Log

> **Last updated:** 2026-03-23 — Code Scanning + CodeAnt Continuation Session
> **Author:** Copilot session
> **Test baseline:** 622 Tests, 75 Dateien, 0 Failures
> **Build:** CI green, Scorecard 8.5/10

---

## Session Summary (2026-03-21)

This session completed a 4-phase sprint across two Codespaces sessions:

| Phase | Commit    | Description                                                          |
| ----- | --------- | -------------------------------------------------------------------- |
| 1     | `e944bd8` | Fix DevConsole errors (CSP, model 404/401, chart dimensions, WebGPU) |
| 2     | `2d2ad92` | Client-side image generation via SD-Turbo + ONNX Runtime Web         |
| 3     | `46d22a4` | GPU mutex, VRAM management, WebLLM eviction/rehydration              |
| 4     | `c1a3b5f` | WebLLM diagnostics, token streaming, performance monitoring          |

All 4 phases are **committed and pushed** to `origin/main`.

---

## What Was Built (Phase 1–4)

### Phase 1: DevConsole Error Fixes (`e944bd8`)

- CSP `frame-ancestors` directive added
- Gated model replacement: Qwen3 → Qwen2.5 for ONNX compatibility
- `env.allowLocalModels` flag for Transformers.js
- CDN-LFS CSP `connect-src` allowlisting
- `ResponsiveContainer` debounce fix for 0-dimension renders
- WebGPU → WASM automatic fallback on context loss

### Phase 2: Image Generation (`2d2ad92`)

- **New:** `services/imageGenerationService.ts` — SD-Turbo single-step adversarial diffusion
- **New:** `workers/imageGeneration.worker.ts` — Off-thread ONNX inference
- **New:** `services/imageGenerationCacheService.ts` — IndexedDB cache (CannaGuideImageGenCache)
- **New:** `components/views/strains/StrainImageGenerator.tsx` — Generation UI
- **New:** `components/views/strains/StrainImageGalleryTab.tsx` — Gallery display
- Updated `localAI.ts` with image generation orchestration
- i18n (EN+DE) for all image generation strings

### Phase 3: GPU Resource Management (`46d22a4`)

- **New:** `services/gpuResourceManager.ts` — Async mutex between WebLLM and image gen
- `acquireGpu()` / `releaseGpu()` with typed consumers (`'webllm' | 'image-gen'`)
- WebLLM eviction and rehydration hooks
- VRAM threshold checks (< 4GB auto-disables WebGPU)
- UI busy indicators when GPU is locked
- 11 unit tests for GPU mutex

### Phase 4: WebLLM Diagnostics & Streaming (`c1a3b5f`)

- **New:** `services/webLlmDiagnosticsService.ts` — 6-step diagnostic cascade:
    1. Force WASM override → 2. Secure Context → 3. WebGPU API → 4. GPU Adapter (5s timeout) → 5. VRAM (4GB min) → 6. Model Profile
- **New:** `generateTextStream()` in `localAI.ts` — Token-by-token streaming via WebLLM async iterable
- **New:** `getMentorResponseStream()` in `aiService.ts` — Streaming with RAG context + JSON parse + batch fallback
- **New:** `checkPerformanceDegradation()` in `localAiTelemetryService.ts` — Detects < 2 tok/s over sliding window
- **New:** `getForceWasm()` in `localAIModelLoader.ts` — Read-only getter
- **Updated:** `MentorChatView.tsx` — Streaming-first with RAF-debounced typing effect
- **Updated:** `sentryService.ts` — Stages: `webllm-diagnostics`, `webllm-streaming`
- **Updated:** i18n (EN+DE) — 10 diagnostic reason codes + 3 performance alert strings
- 8 tests (diagnostics) + 6 tests (performance degradation)

---

## Architecture Snapshot

```
574 tests / 62 files / 55 services / 160 components / 16 hooks / 16 Redux slices / 5 workers
```

### AI Stack (3-Layer + Image Gen)

```
Cloud AI (Gemini/OpenAI/xAI/Anthropic)
  ↓ offline or local-preferred
WebLLM (Qwen2.5-1.5B, WebGPU) ← NEW: streaming, diagnostics, perf monitoring
  ↓ no WebGPU or VRAM < 4GB
Transformers.js (ONNX: WebGPU/WASM) ← inference.worker.ts
  ↓ no models loaded
Heuristic Fallback (localAiFallbackService.ts)

SD-Turbo (imageGeneration.worker.ts) ← GPU mutex with WebLLM
```

### Key Service Dependency Graph

```
aiService.ts ─── geminiService.ts (cloud)
     │
     └─── localAI.ts (local orchestration)
              ├── localAIModelLoader.ts (ONNX pipelines)
              ├── localAiFallbackService.ts (heuristics)
              ├── localAiNlpService.ts (sentiment, summarization, zero-shot)
              ├── localAiEmbeddingService.ts (MiniLM-L6, semantic RAG)
              ├── localAiHealthService.ts (device classification)
              ├── localAiTelemetryService.ts (inference metrics + perf alerts)
              ├── localAiCacheService.ts (IndexedDB inference cache)
              ├── webLlmDiagnosticsService.ts (WebGPU availability cascade)
              ├── gpuResourceManager.ts (async GPU mutex)
              └── imageGenerationService.ts (SD-Turbo)
```

---

## Known Issues & Technical Debt

### Immediate Attention

1. **No E2E tests for streaming** — The MentorChatView streaming path is only covered by manual testing. Consider a Playwright component test mocking `aiService.getMentorResponseStream()`.
2. **RTK Query bypass for streaming** — `MentorChatView` imports `aiService` directly for streaming instead of going through the RTK Query mutation. This works but means streaming responses don't appear in Redux DevTools or the RTK cache.
3. **WebLLM model size** — Qwen2.5-1.5B at q4f16 is ~900MB download. No progress indicator exists for the initial WebLLM model fetch (only the Transformers.js preload has a progress bar in Settings).

### Medium Priority

4. **`localAI.ts` is 1,273 lines** — Consider extracting `generateTextStream()` and `getWebLlmDiagnostics()` into dedicated modules (e.g., `localAiStreamingService.ts`).
5. **GPU mutex only handles 2 consumers** — If a 3rd GPU workload is added (e.g., CLIP-based image search), the mutex needs to be generalized.
6. **Diagnostic i18n key pattern** — The `settingsView.localAiDiag.reasons.*` keys are defined but not yet consumed in the Settings UI. They're ready for a "WebLLM Status Detail" panel.
7. **SD-Turbo ONNX model** — Requires `schmuell/sd-turbo-onnx-web` from HuggingFace. No offline preload path exists; it downloads on first use.

### Low Priority / Future

8. **Token streaming for Advisor/Diagnosis** — Only the Mentor chat supports streaming. Advisor and Diagnosis responses still use batch.
9. **Performance alert UI** — `checkPerformanceDegradation()` exists but no UI component consumes it yet. A toast or banner in MentorChatView would be ideal.
10. **`webLlmDiagnosticsService.ts` adapter timeout** — 5s hardcoded. Some low-end GPUs may need longer. Consider making it configurable via Settings.

---

## Validation Checkmarks (2026-03-21)

- [x] `npx tsc --noEmit` — 0 errors
- [x] `npx vitest run` — 574 tests, 62 files, 0 failures
- [x] `npm run build` — successful, 116 precache entries
- [x] `git push origin main` — pushed as `c1a3b5f`

---

## Quick Start for Next Session

```bash
# 1. Open Codespaces or clone
gh codespace create -r qnbs/CannaGuide-2025

# 2. Verify baseline
npm install          # should be instant (cached in devcontainer)
npx tsc --noEmit     # expect 0 errors
npx vitest run       # expect 574+ tests passing
npm run build        # expect clean build

# 3. Dev server
npm run dev          # localhost:5173

# 4. If IoT mocks needed
docker compose up -d esp32-mock  # port 3001
```

---

## Suggested Next Tasks (Priority Order)

See `ROADMAP.md` for the full picture. Recommended immediate work:

1. **Performance alert UI** — Wire `checkPerformanceDegradation()` into MentorChatView as a dismissible warning banner.
2. **WebLLM diagnostics panel** — Add a "WebLLM Status" expandable section in Settings → Local AI using the `localAiDiag.reasons.*` i18n keys.
3. **Streaming for Advisor** — Extend `getMentorResponseStream()` pattern to `getAdvisorResponse()`.
4. **Playwright component test for MentorChatView streaming** — Mock `aiService` to verify typing effect and fallback behavior.
5. **Extract streaming service** — Move `generateTextStream()` from `localAI.ts` into `localAiStreamingService.ts` to reduce file size.
6. **v1.2 roadmap items** — Spanish/French i18n, nutrient scheduling, strain marketplace.

---

## File Index (Changed in This Sprint)

| File                                                 | Lines | Status            | Purpose                                  |
| ---------------------------------------------------- | ----- | ----------------- | ---------------------------------------- |
| `services/webLlmDiagnosticsService.ts`               | 195   | **NEW**           | 6-step WebLLM availability cascade       |
| `services/webLlmDiagnosticsService.test.ts`          | 180   | **NEW**           | 8 tests for diagnostic cascade           |
| `services/gpuResourceManager.ts`                     | 166   | **NEW** (Phase 3) | Async GPU mutex                          |
| `services/gpuResourceManager.test.ts`                | ~90   | **NEW** (Phase 3) | 11 GPU mutex tests                       |
| `services/imageGenerationService.ts`                 | ~280  | **NEW** (Phase 2) | SD-Turbo orchestration                   |
| `services/imageGenerationService.test.ts`            | ~200  | **NEW** (Phase 2) | 17 image gen tests                       |
| `services/imageGenerationCacheService.ts`            | ~120  | **NEW** (Phase 2) | IndexedDB image cache                    |
| `workers/imageGeneration.worker.ts`                  | ~90   | **NEW** (Phase 2) | SD-Turbo Web Worker                      |
| `services/localAI.ts`                                | 1,273 | Modified          | +streaming, +diagnostics, +evict cleanup |
| `services/aiService.ts`                              | 484   | Modified          | +getMentorResponseStream                 |
| `services/localAiTelemetryService.ts`                | ~340  | Modified          | +checkPerformanceDegradation             |
| `services/localAIModelLoader.ts`                     | ~200  | Modified          | +getForceWasm getter                     |
| `services/sentryService.ts`                          | ~120  | Modified          | +2 Sentry stages                         |
| `components/views/knowledge/MentorChatView.tsx`      | 265   | Modified          | Streaming-first chat UI                  |
| `components/views/strains/StrainImageGenerator.tsx`  | ~180  | **NEW** (Phase 2) | Image gen UI                             |
| `components/views/strains/StrainImageGalleryTab.tsx` | ~120  | **NEW** (Phase 2) | Image gallery                            |
| `locales/en/settings.ts`                             | —     | Modified          | +diagnostics & perf alert i18n           |
| `locales/de/settings.ts`                             | —     | Modified          | +diagnostics & perf alert i18n           |

<!-- markdownlint-enable MD040 MD029 -->

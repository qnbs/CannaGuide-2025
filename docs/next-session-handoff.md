# Next Session Handoff

<!-- markdownlint-disable MD040 MD029 -->

## Latest Session (2026-03-23, Late) — CodeAnt AI Report Fixes

**Status: CI green (622/622), all Infrastructure Security + Antipattern/Bug fixes applied.**

### Session Summary

Fixed all actionable issues from the CodeAnt AI static analysis report (March 23, 2026).

| Category                | Fixed  | Remaining         | Notes                                      |
| ----------------------- | ------ | ----------------- | ------------------------------------------ |
| Infrastructure Security | 6/6    | 0                 | HEALTHCHECK + USER in all Dockerfiles      |
| Antipatterns/Bugs       | 29/29  | 0                 | sw.js, public/sw.js, test, securityHeaders |
| Complex Functions       | 0/14   | 14                | Deferred — requires careful refactoring    |
| Docstrings Absent       | 0/609  | 609               | Low priority, cosmetic                     |
| Duplicate Code          | 0/5726 | 5726 (124 groups) | Needs multi-session strategy               |

### Changes Applied

**Infrastructure Security (6 fixes):**

- `Dockerfile`: Added HEALTHCHECK (`nginx -t`)
- `Dockerfile.dev`: Added `USER node` + HEALTHCHECK (Node fetch)
- `docker/esp32-mock/Dockerfile`: Added HEALTHCHECK (Node fetch :3001)
- `packages/iot-mocks/Dockerfile`: Added HEALTHCHECK (Node fetch :3001)
- `docker/tauri-mock/Dockerfile`: Added HEALTHCHECK (Node fetch :3002)

**Antipatterns/Bugs (29 fixes across 4 files):**

_sw.js + public/sw.js (22 fixes — 11 each):_

- **BLOCKER BUG**: `map()` in activate handler returned undefined — fixed with `filter().map()`
- **CRITICAL**: `await` inside loops in `notifyDueReminders()` + `syncData()` — replaced with `Promise.all`
- **CRITICAL**: Deep nesting (>4 levels) — flattened IndexedDB functions via `async/await`
- **MAJOR**: Nested promises in navigate handler — refactored to async IIFE
- **MAJOR**: Missing catch in nested promise chains — added `.catch(() => {})`
- **MINOR**: `i++` → `i += 1` in hash computation loop

_services/gpuResourceManager.test.ts (6 fixes):_

- `.then()` callbacks now return explicit values
- Promise constructor parameter `r` → `resolve`

_securityHeaders.ts (1 fix):_

- String concatenation `.join('; ') + ';'` → template literal

### Naechste Schritte (Einstieg naechste Session)

#### P0 — CodeAnt Report Continuation

1. **Complex Functions (14)** — Refactor low-maintainability functions:
    - `exportService.ts` L317 (MI: 17)
    - `plantSimulationService.ts` L608, L1448 (MI: 23, 17)
    - `webLlmDiagnosticsService.ts` L88 (MI: 17)
    - `migrationLogic.ts` L98, L920 (MI: 36, 16)
    - `predictiveAnalyticsService.ts` L436 (MI: 17)
    - `growReminderService.ts` L172 (MI: 16)
    - `localAiFallbackService.ts` L217, L561 (MI: 18, 20)
    - `AddStrainModal.tsx` L31 (MI: 20)
    - `StrainTreeNode.tsx` L42 (MI: 17)
    - `DetailedPlantView.tsx` L124 (MI: 16)
    - `vite.config.ts` L89 (MI: 24)

2. **Major Duplicate Code (20 groups, highest impact):**
    - **Group 84**: `GrowSetupModal.tsx` — 452 duplicate lines between equipment/ and plants/ → Extract shared component
    - **Groups 85-88, 91, 99-102, 105, 117**: `BreedingView.tsx` — plants/ vs knowledge/ → Unify into shared component
    - **Groups 90, 92, 96, 98, 104, 106, 116**: `InlineStrainSelector.tsx` — strains/ vs plants/ → Extract shared
    - **Groups 122-124**: `sw.js` vs `public/sw.js` — 919 duplicate lines → Single source of truth
    - **Groups 118-121**: `ipc.rs` — src-tauri/ vs apps/desktop/ → Share via workspace module
    - **Group 4, 26, 28, 68**: Cache services — localAiCacheService/imageGenerationCacheService → Extract base

3. **Minor Duplicate Code (104 groups):**
    - Primarily strain data files (similar terpene/cannabinoid profiles) — structural, not actionable
    - Locale duplicates (en/de index files) — structural i18n pattern
    - Service interface duplicates (aiProvider types in 4 files) → Consolidate to single source

#### P1 — Ongoing Quality

- [ ] SonarCloud Security Hotspots reviewen (0% reviewed = E-Rating)
- [ ] CII-Best-Practices Badge aktivieren
- [ ] Coverage von 22.8% Richtung >30% steigern
- [ ] Feature-Entwicklung fortsetzen

### Test-Baseline

622 Tests, 75 Dateien, 0 Failures

### Detaillierte Dokumentation

- `docs/session-activity-review-2026-03-23.md` — Full 7-phase + CodeAnt review
- `docs/session-activity-todo-2026-03-23.md` — Priorisierte TODO-Liste
- `docs/sonar-handoff-review-2026-03-21.md` — SonarCloud Tracking-Log

1. verbleibende ungetestete Service-Cluster priorisieren (`aiProviderService`, `aiService`, `exportService`, `strainService`, `commandService`).
2. nur low-risk, mockbare Pfade zuerst; dann Sonar-Restscan neu clustern.

Workflow fuer automatische Aktualisierung:

- `.github/workflows/security-alerts-handoff.yml` (daily + manual)

> **Last updated:** 2026-03-23 — Session Close (7-Phase Security + Admin Hardening Marathon)
> **Author:** Copilot session
> **Test baseline:** 622 Tests, 75 Dateien, 0 Failures
> **Build:** CI green, Scorecard 8.5/10, all admin settings persistent

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

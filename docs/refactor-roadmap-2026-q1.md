# Refactor Roadmap (2026)

> **Last updated:** 2026-03-21 — After Phase 4 AI infrastructure sprint

## Goal

Improve runtime performance, maintainability, accessibility, and AI reliability without destabilizing the current production app.

## Status Summary

| #      | Initiative                           | Status     | Notes                                                                             |
| ------ | ------------------------------------ | ---------- | --------------------------------------------------------------------------------- |
| 1      | Tailwind build pipeline              | ✅ Done    | PostCSS + shadcn/ui + Radix primitives in place                                   |
| 2      | Virtualization                       | ✅ Done    | `@tanstack/react-virtual` for strain list + genealogy panels                      |
| 3      | AI token-window + structured outputs | 🔄 Partial | Structured JSON via `responseSchema` works; function-calling mode not yet adopted |
| 4      | Worker architecture consolidation    | 🔄 Partial | 5 workers exist but no unified command dispatcher                                 |
| 5      | Redux scope reduction                | 📋 Planned | Still using Redux for ephemeral UI state                                          |
| 6      | Charts & analytics surfaces          | ✅ Done    | Recharts integrated with ResponsiveContainer                                      |
| 7      | Command palette upgrade              | ✅ Done    | cmdk integrated                                                                   |
| 8      | Strain data merge automation         | ✅ Done    | Daily CI + duplicate check                                                        |
| **9**  | **Local AI service extraction**      | **📋 NEW** | `localAI.ts` at 1,273 lines needs decomposition                                   |
| **10** | **Streaming generalization**         | **📋 NEW** | Only Mentor has streaming; extend to Advisor/Diagnosis                            |
| **11** | **GPU resource management v2**       | **📋 NEW** | Mutex handles 2 consumers; needs generalization for 3+                            |
| **12** | **WebLLM model preload UX**          | **📋 NEW** | ~900MB download has no progress indicator                                         |

## Priority Order (Updated)

1. ~~Tailwind build pipeline + design system foundation~~ ✅
2. ~~Virtualization for strain list and genealogy-heavy views~~ ✅
3. AI token-window + structured/function outputs consistency.
4. Worker architecture consolidation.
5. State-management split (UI state out of Redux).
6. ~~Charts and analytics surfaces~~ ✅
7. ~~Command palette upgrade~~ ✅
8. ~~Strain static data merge/migration automation hardening~~ ✅
9. **Local AI service extraction** (decompose `localAI.ts` 1,273 → multiple modules).
10. **Streaming generalization** (extend token streaming to Advisor/Diagnosis endpoints).
11. **GPU resource manager v2** (generalize mutex for N consumers).
12. **WebLLM model preload UX** (progress bar for ~900MB initial download).

---

## 1) Tailwind CDN -> Tailwind + PostCSS + shadcn/ui

### Why

- Current CDN setup prevents proper purge/tree-shaking and hurts build/runtime efficiency.
- Inline mega-style in `index.html` is hard to maintain and blocks design system evolution.

### Scope

- Add `tailwind.config.ts`, `postcss.config.cjs`, and `src/styles/globals.css`.
- Move theme tokens from `index.html` to CSS variables in app styles.
- Keep existing utility classes functional while gradually replacing custom widgets with shadcn/ui primitives.
- Introduce class strategy for dark mode (`class`), map existing themes to CSS variables.

### Acceptance Criteria

- No `https://cdn.tailwindcss.com` in `index.html`.
- CSS bundle shrinks due to content-based generation.
- Existing views render visually equivalent (+/- minor spacing differences).
- Lighthouse accessibility score does not regress.

### PR Split

- PR-1A: Tailwind/PostCSS scaffold + remove CDN.
- PR-1B: Move inline theme styles to `src/styles` and wire dark mode class.
- PR-1C: Introduce shadcn/ui base primitives (`button`, `input`, `dialog`, `popover`, `select`) and migrate top-traffic components.

---

## 2) Redux Scope Reduction (Zustand/Jotai for UI state)

### Why

- Redux is currently used for both domain/persistence and ephemeral UI controls.
- UI-only state updates trigger broader rerenders than necessary.

### Scope

- Keep Redux for persistent domain data: simulation, strains, saved entities, archives.
- Move ephemeral UI state to Zustand store(s): modal open states, command palette query, local filters not persisted, temporary selection state.

### Acceptance Criteria

- Redux slice size decreases for UI concerns.
- Fewer UI rerenders in React Profiler for interaction-heavy views.
- No persistence regressions.

### PR Split

- PR-2A: create `stores/uiTransientStore.ts` and migrate command palette + modal toggles.
- PR-2B: migrate non-persistent list filters/sort controls.

---

## 3) Virtualization: Strain List + Genealogy

### Why

- Large strain catalog + graph rendering cause layout/repaint pressure.

### Scope

- Add `@tanstack/react-virtual`.
- Virtualize strain list and any dense table/list rendering.
- For genealogy, virtualize side-panels/lists first; keep graph rendering optimized via memoized node layout and progressive depth rendering.

### Acceptance Criteria

- Scrolling in strain list remains smooth on low-end devices.
- Initial render time in Strains view decreases measurably.

### PR Split

- PR-3A: strain list virtualization.
- PR-3B: virtualization for result drawers/panels in genealogy tools.

---

## 4) Charts Introduction (VPD, Yield, Terpene)

### Why

- Existing metrics exist in data model but are not surfaced visually.

### Scope

- Add `recharts` (simpler React integration) or `chart.js` (more control).
- Introduce:
    - VPD timeline chart (from plant history)
    - Yield projection chart (based on simulation + stage)
    - Terpene profile chart (flowering stage)

### Acceptance Criteria

- Charts are accessible (labels, tooltips, keyboard focus where applicable).
- Charts do not block UI thread under normal use.

### PR Split

- PR-4A: VPD chart.
- PR-4B: Yield projection + terpene chart.

---

## 5) Command Palette Upgrade (cmdk/kbar)

### Why

- Current palette works but can be improved for UX, fuzzy search quality, keyboard flows, and nested navigation.

### Scope

- Integrate `cmdk` for composable command dialog and better keyboard semantics.
- Keep existing command model from `commandService`.
- Add command groups, recently-used commands, and richer result metadata.

### Acceptance Criteria

- Cmd/Ctrl+K latency remains low.
- Better discoverability of commands and shortcuts.

### PR Split

- PR-5A: drop-in cmdk shell with current command source.
- PR-5B: recent commands + ranking improvements.

---

## 6) Gemini Service Hardening (Structured + Function Calling)

### Why

- Structured schemas are already used in parts of the service, but function-calling/tool mode should be standardized for consistency and lower parse failures.

### Scope

- Keep JSON schema outputs for deterministic responses.
- Introduce function-calling patterns where model should choose actions/tools (diagnosis workflow, equipment recommendation post-processing, breeding assistant).
- Standardize `maxOutputTokens`, safety settings, and context window policy across all calls.

### Acceptance Criteria

- Parsing failure rate decreases.
- All AI endpoints have explicit output bounds and prompt truncation policy.

### PR Split

- PR-6A: function-calling wrapper + shared generation config.
- PR-6B: migrate diagnosis/equipment/breeding endpoints.

---

## 7) Worker Consolidation + Offscreen Rendering Strategy

### Why

- Simulation logic is spread across `simulation.worker.ts` and `scenario.worker.ts` plus service calls.

### Scope

- Consolidate simulation execution pipeline under one worker entry point with message-based commands (`simulateDelta`, `runScenario`, `batchForecast`).
- Keep `plantSimulationService` as pure logic module imported by worker.
- OffscreenCanvas only for custom canvas-rendered charts (if adopted); if using Recharts SVG, OffscreenCanvas is not applicable.

### Acceptance Criteria

- Worker API is unified and typed.
- No regression in simulation correctness or throughput.

### PR Split

- PR-7A: command-dispatch worker consolidation.
- PR-7B: optional OffscreenCanvas renderer for custom graph layer.

---

## 8) Static Strain Data Migration + Merge Automation

### Why

- Full replacement on data updates can cause migration pain and contributor conflicts.

### Scope

- Keep merge-on-update behavior in `strainService`.
- Keep CI check that reports duplicate IDs and fails only on newly introduced/worsened duplicates.
- Add optional strict mode for release branches.

### Acceptance Criteria

- Update process remains deterministic.
- Existing duplicate baseline does not block unrelated PRs.

---

## Suggested Execution Cadence

- Sprint 1: 9 (local AI extraction) + 10 (streaming generalization)
- Sprint 2: 3 (structured outputs) + 11 (GPU manager v2)
- Sprint 3: 4 (worker consolidation) + 5 (Redux scope)
- Sprint 4: 12 (WebLLM preload UX) + polish
- Continuous: Testing, accessibility audits

## Measurement Checklist

- Build time before/after.
- JS/CSS bundle size before/after.
- FPS / interaction latency in Strains and Plants views.
- AI endpoint parse error rate and timeout rate.
- Memory and worker execution time for long scenario runs.
- Streaming tok/s vs batch tok/s comparison.
- GPU mutex contention rate (how often eviction is triggered).

---

## 9) Local AI Service Extraction

### Why

- `localAI.ts` has grown to 1,273 lines and is the single largest service file. It mixes orchestration, WebLLM management, streaming, caching, diagnostics delegation, and image gen coordination.

### Scope

- Extract `generateTextStream()` + related state into `localAiStreamingService.ts`.
- Extract WebLLM lifecycle (`loadWebLlmEngine`, `evictWebLlm`, `getWebLlmDiagnostics`) into `localAiWebLlmService.ts`.
- Keep `localAI.ts` as a thin orchestrator that delegates to sub-services.
- Maintain the same public API surface (no breaking changes to consumers).

### Acceptance Criteria

- `localAI.ts` under 600 lines.
- No new exports; existing imports continue to work.
- All 574+ tests pass without modification.

### PR Split

- PR-9A: Extract streaming into `localAiStreamingService.ts`.
- PR-9B: Extract WebLLM lifecycle into `localAiWebLlmService.ts`.

---

## 10) Streaming Generalization

### Why

- Only the Mentor chat (`MentorChatView`) supports token streaming. The Advisor (`AdvisorView`) and Diagnosis features still use batch responses. Users of those features miss the typing effect and perceived-speed improvement.

### Scope

- Add `getAdvisorResponseStream()` and `getDiagnosisResponseStream()` to `aiService.ts`, following the same pattern as `getMentorResponseStream()`.
- Update `AdvisorView.tsx` and diagnosis components with the same RAF-debounced streaming pattern.
- Shared streaming hook: `useStreamingResponse()` custom hook to reduce duplication across views.

### Acceptance Criteria

- All three AI chat surfaces support streaming when WebLLM is active.
- Batch fallback works transparently when streaming is unavailable.
- No additional bundle size beyond the shared hook (~50 lines).

### PR Split

- PR-10A: `useStreamingResponse()` hook + Advisor streaming.
- PR-10B: Diagnosis streaming.

---

## 11) GPU Resource Manager v2

### Why

- The current `gpuResourceManager.ts` handles exactly 2 consumers (`'webllm' | 'image-gen'`). Adding CLIP-based image similarity search or future GPU workloads requires a more general approach.

### Scope

- Generalize the consumer type from a union to a string-based registry.
- Add priority levels (e.g., `'high' | 'normal' | 'low'`) so interactive workloads preempt background tasks.
- Add a `getQueueState()` API for debugging and UI feedback.
- Consider timeout-based auto-release to prevent deadlocks.

### Acceptance Criteria

- Existing 2-consumer tests pass with zero changes.
- New consumer can register without modifying the type union.
- Priority queue correctly preempts lower-priority holders.

### PR Split

- PR-11A: Generalize consumer registry + priority.
- PR-11B: Timeout-based auto-release + queue state API.

---

## 12) WebLLM Model Preload UX

### Why

- Qwen2.5-1.5B at q4f16 is ~900MB. Currently downloaded silently on first WebLLM use. Users on slow connections see a multi-minute hang with no feedback.

### Scope

- Hook into WebLLM's `InitProgressCallback` to report download progress.
- Add a progress bar to the Settings → Local AI panel (alongside the existing Transformers.js preload).
- Persist download state to localStorage so interrupted downloads can resume.
- Show estimated remaining time based on throughput.

### Acceptance Criteria

- Users see download progress % and estimated time.
- Interrupted downloads resume from the last cached chunk.
- Settings UI clearly distinguishes between Transformers.js preload and WebLLM preload.

### PR Split

- PR-12A: WebLLM preload progress integration in Settings.
- PR-12B: Resume logic + ETA display.

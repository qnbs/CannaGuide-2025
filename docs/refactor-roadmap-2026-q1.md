# Refactor Roadmap (Q1 2026)

## Goal
Improve runtime performance, maintainability, accessibility, and AI reliability without destabilizing the current production app.

## Priority Order
1. Tailwind build pipeline + design system foundation (highest ROI).
2. Virtualization for strain list and genealogy-heavy views.
3. AI token-window + structured/function outputs consistency.
4. Worker architecture consolidation.
5. State-management split (UI state out of Redux).
6. Charts and analytics surfaces.
7. Command palette upgrade.
8. Strain static data merge/migration automation hardening.

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
- Sprint 1: 1 + 3
- Sprint 2: 6 + 7
- Sprint 3: 2 + 5 + 4
- Continuous: 8

## Measurement Checklist
- Build time before/after.
- JS/CSS bundle size before/after.
- FPS / interaction latency in Strains and Plants views.
- AI endpoint parse error rate and timeout rate.
- Memory and worker execution time for long scenario runs.

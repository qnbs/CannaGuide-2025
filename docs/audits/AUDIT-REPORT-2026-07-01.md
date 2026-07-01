# CannaGuide 2025 — v1.9 Re-Audit Report

**Date:** 2026-07-01  
**Version audited:** v1.9.0 (`main`)  
**Auditor:** Cursor Cloud Agent  
**Scope:** Post–June 29 hardening, PR #362/#364 merges, migration stack validation, release readiness  
**Prior baseline:** [`AUDIT-REPORT-2026-06-29.md`](./AUDIT-REPORT-2026-06-29.md), [`PRIORITIZED-BACKLOG-2026-06-30.md`](./PRIORITIZED-BACKLOG-2026-06-30.md)

---

## Executive Summary

v1.9.0 closes the **June 29 P0 security gaps**, completes **Settings god-file refactor** (#362), unifies **AI disclaimers** and **Privacy Policy reachability** (#364), and splits **five view-layer god-files** under the 700 LOC budget. The post-migration stack (Tailwind v4, Vite 8, React Compiler 1.0, Workbox 7.4.1) is integrated on `main` with passing local gates (`typecheck`, `lint:changed`, `check:file-budget`, targeted Vitest).

| Severity | Open | Resolved in v1.9 cycle |
| -------- | ---- | ---------------------- |
| P0       | 0    | 3 (S-08 prompt sanitization, June 29) |
| P1       | 4    | 6 (Settings split, 5 view god-files, AI disclaimers, Privacy Policy) |
| P2       | 10   | 2 (AGENTS.md DX, Vitest isolation documented) |
| P3       | 4    | 0 |

**Local gates (2026-07-01):** `typecheck` ✅ · `lint:changed` ✅ · `check:file-budget` ✅ (0 failures) · targeted Vitest 77/77 ✅

---

## 1. Repository & Process Health

| Check | Status | Evidence |
| ----- | ------ | -------- |
| Version | `1.9.0` | `package.json`, `apps/web/package.json` |
| Open PRs merged | #364, #363 (docs), #361 superseded by #360 | Local merge + `gh pr list` |
| CI workflows | 25+ | `.github/workflows/README.md` |
| Conventional commits | ✅ | Branch history `feat(web)`, `refactor(web)`, `docs(audit)` |
| Node 24 (Cloud) | ✅ | `scripts/cursor-cloud-update.sh` uses `nvm which 24` |

---

## 2. God-Files & File Budget

### Resolved (≤700 LOC)

| File | Before | After |
| ---- | ------ | ----- |
| `SettingsView.tsx` | 2570 | 348 (#362) |
| `DataManagementTab` | 1246 | 110 (#362) |
| `BreedingLab.tsx` | 1198 | 94 (#364) |
| `GenealogyView.tsx` | 1074 | 644 (#364) |
| `StrainDetailView.tsx` | 1056 | 196 (#364) |
| `CalculatorHubView.tsx` | 1511 | 124 (#364) |
| `StrainLookupSection.tsx` | 1211 | 401 (#364) |
| `pdfReportService.ts` | 923 | 9 (barrel; `services/pdf/*`) |
| `GrowRoom3D.tsx` | 848 | 571 (`growRoom3d/*`) |
| `simulationSlice.ts` | 834 | 361 (`simulation/*`) |

### Remaining over budget (P1)

| File | LOC | Notes |
| ---- | --- | ----- |
| `services/workerBus.ts` | 1193 | Grandfathered |
| `services/dbService.ts` | 927 | P1 — split by domain (plants, strains, settings) |
| `services/pdfReportService.ts` | 923 | P1 — extract section renderers |
| `components/views/plants/GrowRoom3D.tsx` | 848 | P1 — Three.js scene vs. controls |
| `stores/slices/simulationSlice.ts` | 834 | P1 — extract reducers/thunks |
| `services/local-ai/fallback/strainImageFallback.ts` | 812 | P2 |
| `components/views/strains/StrainsView.tsx` | 800 | P2 |

---

## 3. Post-Migration Stack (Tailwind v4 · Vite 8 · React Compiler)

| Item | Status | Notes |
| ---- | ------ | ----- |
| Tailwind v4 | ✅ Integrated | `@tailwindcss/vite`; theme tokens in CSS |
| Vite 8 | ✅ | `apps/web/vite.config.ts`; build via `pnpm run build` (CI) |
| React Compiler 1.0 | ✅ | `babel-plugin-react-compiler` (#359) |
| React 19.2.7 | ✅ | Aligned in lockfile |
| Workbox 7.4.1 | ✅ | ML artefact caching (`.onnx`, `.safetensors`, etc.) |

**Risk:** Low for release; visual regression across 9 themes recommended as advisory E2E/visual pass.

---

## 4. Compliance & AI Security

| Item | Status |
| ---- | ------ |
| Unified `AiDisclaimer` on AI surfaces | ✅ #364 |
| Privacy Policy from Settings → About | ✅ #364 |
| Prompt sanitization (`sanitizeForPrompt`) | ✅ #362 / S-08 |
| BYOK AES-256-GCM | ✅ (unchanged; prior audit) |
| Per-provider AI consent UI | ❌ P2 backlog |

---

## 5. Testing

| Area | Status |
| ---- | ------ |
| Unit tests | ~2799 (incl. `AiDisclaimer.test.tsx`) |
| Full `test:run` | Known isolation flakiness in `aiResponseValidation.test.ts`, `growLogRagService.test.ts` — documented in `AGENTS.md` |
| Coverage thresholds | lines 42 % / functions 39 % / branches 25 % |
| E2E (Playwright) | Advisory in CI; run before major UI releases |

**P1 backlog:** Coverage sprint on `safetyPipeline`, `syncEncryptionService`, `plantSimulationService`, `diagnosisService`, `aiFacade` (target ≥80 % branches).

---

## 6. State Management (Hybrid Redux + Zustand)

No structural change in v1.9. **Recommendation (P2):** ADR for slice/store boundaries; consolidate MQTT/sensor paths; integration tests for `uiStateBridge` hydration.

---

## 7. Prioritized Remaining Backlog (v1.9.1+)

1. **P1** — Split `workerBus.ts`, `dbService.ts`, `pdfReportService.ts`, `GrowRoom3D.tsx`, `simulationSlice.ts`
2. **P1** — Critical-path coverage ≥80 %
3. **P2** — Vitest mock isolation fix (replace doc-only workaround)
4. **P2** — CRDT conflict-resolution UI
5. **P2** — Per-provider AI consent enforcement
6. **P2** — Local-AI mobile/battery UX (Eco-Mode status chip)
7. **P3** — Strain data strategy ADR; v2.0 AR/digital-twin foundations

See [`PRIORITIZED-BACKLOG-2026-06-30.md`](./PRIORITIZED-BACKLOG-2026-06-30.md) for issue templates and test plans.

---

## 8. Release Readiness — v1.9.0

| Gate | Ready |
| ---- | ----- |
| Version bump + CHANGELOG | ✅ |
| Security (June hardening) | ✅ |
| Compliance (disclaimers + privacy) | ✅ |
| File budget (changed scope) | ✅ |
| Typecheck / lint | ✅ |
| Tag `v1.9.0` | Pending push + CI green |

**Verdict:** **Release-ready** for v1.9.0 with documented P1/P2 follow-ups for v1.9.1.

# Master Audit 2026-Q2 — Execution Plan

> Living document for the full-repository audit (v1.8.2 → v1.9.x / v2.0).
> **Approved:** 2026-06-01 — Phase 0 merged via PR #290 (`ebbc1d8b`).

## Decisions (Owner)

| Topic                | Decision                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Critical path / 3 MB | **Relaxed / advisory** — `measure-critical-path.mjs` reports metrics; no strict CI fail (budget brotli 1500 KB warn-only) |
| E2E CI               | **Advisory** (warn in `ci-status`); Chromium `--retries=2`; Firefox/WebKit/visual regression advisory                     |
| CI merge gate        | **Quality + Security only**; advisory job for critical-path, file-budget, localStorage                                    |
| V-06 Offline Voice   | **v2.0 only** (Deferred in `AUDIT_BACKLOG.md`)                                                                            |
| Phase 0              | **Merged** PR #290 → `main`                                                                                               |
| Phase 1 branch       | `cursor/phase-1-gemini-prompt-utils-671a` (P1-01)                                                                         |

## Phase 0 — Merged (PR #290)

| Item                   | Artifact                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| AI safety extraction   | `apps/web/services/ai/safetyPipeline.ts` + tests                                     |
| Critical path metrics  | `scripts/measure-critical-path.mjs` → `artifacts/critical-path-latest.json`          |
| File budget gate       | `scripts/check-file-budget.mjs` (grandfathered god-files)                            |
| localStorage allowlist | `scripts/security/check-localstorage-usage.mjs`                                      |
| CI advisory job        | `.github/workflows/ci.yml` — critical-path, file-budget, localStorage (non-blocking) |
| CI merge gate          | Quality + Security required; E2E advisory                                            |
| E2E stability          | Chromium `--retries=2`                                                               |
| Docs-only CI           | `.github/workflows/ci-docs.yml`                                                      |
| V-06 deferred          | `docs/AUDIT_BACKLOG.md`                                                              |

## Phase 1 — In progress

| Task  | Status | Notes |
| ----- | ------ | ----- |
| P1-01 | 🔄     | `geminiPromptUtils.ts` extracted from `geminiService` (~140 LOC); service ~1420 LOC (further splits: client, harm settings) |
| P1-02 | ⏳     | `plantSimulationService.ts` |
| P1-03 | ⏳     | `workerBus.ts` |
| P1-04 | ⏳     | `migrationLogic.ts` |

## Phases (backlog)

- **Phase 1 (rest):** DDD `useCases/`, RTK entity adapters after god-file splits
- **Phase 2:** Bundle/locale lazy-load, `AiOrchestrator`, PWA offline-queue UI, coverage Stufe B/C
- **Phase 3 (v2.0):** Digital Twin, WebXR, V-06 ONNX voice, Tauri E2E

## KPI targets (relaxed critical path)

| KPI                  | Target                  | Tool                             |
| -------------------- | ----------------------- | -------------------------------- |
| Critical path brotli | < 1500 KB (advisory)    | `pnpm run measure:critical-path` |
| Main chunk gzip      | < 300 KB (enforced)     | `check-bundle-budget.mjs`        |
| E2E Chromium         | Advisory (warn)         | `ci.yml`                         |
| God-files            | 0 new >700 LOC          | `check:file-budget`              |
| Coverage             | Stufe B → C (later PRs) | `vitest` thresholds              |

See also: `docs/PRIORITY_ROADMAP.md`, `docs/audit-roadmap-2026-q2.md`, `docs/SESSION-177-ROADMAP.md`.

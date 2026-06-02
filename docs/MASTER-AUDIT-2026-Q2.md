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
| Phase 1 (god-files)  | **Merged** → `main` (P1-01–P1-06; direkt merge, kein PR-API)                                                              |
| Cloud Agent Git      | Direkt `main` + Push; PR-API optional; Merge-Gate = Quality + Security                                                    |

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

## Phase 1 — Merged (god-file splits)

| Task  | Status     | Notes                                                                                                                                         |
| ----- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 | ✅         | `geminiService` ~702 LOC — `geminiPromptUtils`, `geminiRuntime`, `geminiResponseSchemas`, `geminiContextBuilders`, `geminiStrainImagePrompts` |
| P1-02 | ✅ (Teil)  | `plantSimulationService` ~780 LOC — `simulation/*` (normalize, env helpers, post-harvest, math)                                               |
| P1-07 | ✅ (Start) | `useCases/simulation/advancePlantSimulationTimeUseCase` — DDD entry for time delta                                                            |
| P1-03 | ✅         | `workerBus.ts` ~1193 LOC — `worker-bus/*` (constants, types, rate-limit, telemetry, channels)                                                 |
| P1-04 | ✅         | `migrationLogic.ts` ~12 LOC facade — `migration/*` (shape guards, version migrations)                                                         |
| P1-05 | ✅         | `strainLookupService.ts` ~80 LOC — `strain-lookup/*` (enrichment, cache, external APIs)                                                       |
| P1-06 | ✅         | Simulation-Kern: `simulationMath`, `simulationDiagnosticsTypes`, `postHarvestSimulation`, `getSimulationProfileCurve`                         |
| P1-08 | ✅         | `dailySimulationLoop.ts` — Tages-Schleife aus `plantSimulationService` (~371 LOC)                                                             |
| P1-02 | ✅ (cont.) | `geminiProviderRouting.ts`, `geminiStructuredHandlers.ts` — `geminiService` ~353 LOC                                                          |
| P1-09 | ✅         | RTK Entity Adapters: `problemTrackerSlice`, `diagnosisHistorySlice` + Persist-Migration                                                       |
| S-07  | ✅         | `pnpm.overrides` inkl. `ws>=8.20.1`; `pnpm audit` clean (protobufjs CVE dokumentiert ignoriert)                                               |

## Phases (backlog)

- **Phase 1 (rest):** Weitere `useCases/` nach Bedarf; `plantSimulationService` ggf. weiter unter 700 LOC halten
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

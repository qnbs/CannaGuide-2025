# Master Audit 2026-Q2 — Execution Plan

> Living document for the full-repository audit (v1.8.2 → v1.9.x / v2.0).
> **Approved:** 2026-06-01 — Phase 0 implementation branch `cursor/master-audit-phase-0-671a`.

## Decisions (Owner)

| Topic | Decision |
| ----- | -------- |
| Critical path / 3 MB | **Relaxed / advisory** — `measure-critical-path.mjs` reports metrics; no strict CI fail (budget brotli 1500 KB warn-only) |
| E2E CI | **Chromium + mobile-chrome hard-fail**; Firefox/WebKit/visual regression advisory |
| V-06 Offline Voice | **v2.0 only** (Deferred in `AUDIT_BACKLOG.md`) |
| Phase 0 branch | `cursor/master-audit-phase-0-671a` |

## Phase 0 — Delivered in this PR

| Item | Artifact |
| ---- | -------- |
| AI safety extraction | `apps/web/services/ai/safetyPipeline.ts` + tests |
| Critical path metrics | `scripts/measure-critical-path.mjs` → `artifacts/critical-path-latest.json` |
| File budget gate | `scripts/check-file-budget.mjs` (grandfathered god-files) |
| localStorage allowlist | `scripts/security/check-localstorage-usage.mjs` |
| CI E2E hard-fail | `.github/workflows/ci.yml` `ci-status` |
| E2E stability | Chromium `--retries=2` |
| Docs-only CI | `.github/workflows/ci-docs.yml` |
| V-06 deferred | `docs/AUDIT_BACKLOG.md` |

## Phases (backlog)

- **Phase 1:** God-file splits (`geminiService`, `plantSimulationService`, `workerBus`, `migrationLogic`), DDD `useCases/`, RTK entity adapters
- **Phase 2:** Bundle/locale lazy-load, `AiOrchestrator`, PWA offline-queue UI, coverage Stufe B/C
- **Phase 3 (v2.0):** Digital Twin, WebXR, V-06 ONNX voice, Tauri E2E

## KPI targets (relaxed critical path)

| KPI | Target | Tool |
| --- | ------ | ---- |
| Critical path brotli | < 1500 KB (advisory) | `pnpm run measure:critical-path` |
| Main chunk gzip | < 300 KB (enforced) | `check-bundle-budget.mjs` |
| E2E Chromium | Required pass | `ci.yml` |
| God-files | 0 new >700 LOC | `check:file-budget` |
| Coverage | Stufe B → C (later PRs) | `vitest` thresholds |

See also: `docs/PRIORITY_ROADMAP.md`, `docs/audit-roadmap-2026-q2.md`, `docs/SESSION-177-ROADMAP.md`.

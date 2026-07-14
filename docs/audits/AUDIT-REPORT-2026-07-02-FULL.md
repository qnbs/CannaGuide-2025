# CannaGuide 2025 — Full-Scale Deep Audit & Perfection Report

**Date:** 2026-07-02  
**Version audited:** v1.9.0 + post-release activity (`main`, HEAD `6266c672`)  
**Auditor:** Cursor Cloud Agent  
**Prompt version:** Master Prompt v2.0 — Maximally Perfected Edition  
**Prior baselines:** [`AUDIT-REPORT-2026-07-01.md`](./AUDIT-REPORT-2026-07-01.md) · [`AUDIT-REPORT-2026-06-29.md`](./AUDIT-REPORT-2026-06-29.md) · [`PRIORITIZED-BACKLOG-2026-06-30.md`](./PRIORITIZED-BACKLOG-2026-06-30.md)  
**Gate summary at report time:** `typecheck` ✅ · `lint:changed` ✅ · `check:file-budget` ✅ · tests 2936/2936 ✅ · `pnpm audit` ✅ clean (0 vulnerabilities)

---

## 1. Executive Summary

CannaGuide 2025 at v1.9.0 represents a **mature, reference-grade offline-first AI PWA** that has undergone sustained, high-velocity improvement during the June 17–July 2, 2026 cycle. The project demonstrates engineering discipline that is rare for a single-developer or small-team codebase: comprehensive supply-chain hygiene, centralized AI safety pipelines, modular architecture with enforced file-size budgets, critical-path test coverage enforced in CI, and a thoughtful privacy-first design.

**Overall Maturity Score: 8.9/10** (up from estimated 8.4/10 pre-v1.9 hardening)

| Dimension                 | Score  | Notes                                                           |
| ------------------------- | ------ | --------------------------------------------------------------- |
| Architecture & Modularity | 9.2/10 | God-file burn-down complete; clean monorepo; 0 circular imports |
| Security & AI Safety      | 9.1/10 | safetyPipeline 100% covered; SHA-pinned CI; 0 vulns post-audit  |
| Testing & Quality Gates   | 8.2/10 | 2936 tests; critical paths ≥80%; global floor ~43% lines        |
| Performance & Bundle      | 8.4/10 | All budget gates pass; 233 SW precache entries; 15s build       |
| Accessibility & i18n      | 8.3/10 | WCAG 2.2 AA groundwork; 5 locales; RTL deferred to v2.0         |
| PWA & Offline-First       | 9.0/10 | 100% offline; ML artifact caching; SW update UX complete        |
| Developer Experience      | 9.1/10 | 25+ CI workflows; pre-push gates; excellent Cursor integration  |
| Domain Feature Depth      | 8.8/10 | 776 strains; VPD simulation; 22 AI services; 37 voice commands  |

**Key findings resolved in this audit cycle:**

- P0 (security): `SECURITY.md` supported versions was stale (1.8.x) — **fixed** → now shows v1.9.x
- P1 (security): `@babel/core ≤7.29.0` low vulnerability (GHSA-4x5r-pxfx-6jf8) via Stryker devDep — **fixed** via `pnpm.overrides`
- P1 (coverage): Coverage thresholds stale vs. measured values — **raised** (lines 42→43%, functions 39→41%)
- P2 (docs): Post-v1.9 god-file splits (8 additional modules) and CI improvements not yet reflected in CHANGELOG — addressed in Unreleased section

**Remaining open backlog (P1–P2):**

- Per-provider AI consent UI enforcement (service + i18n present; UI gate missing)
- Coverage Stufe C → D: raise toward 50/50/35/50 roadmap targets
- Visual regression testing (advisory; proposed for CI)
- IoT / ESP32 connection in production mode (mock works; real device E2E gap)

---

## 2. Reconnaissance & Baseline

### 2.1 Git History — June 17 to July 2, 2026

**Total commits in period:** 72 (17 by `qnbs`, 32 by `Cursor Agent`, 23 by `dependabot[bot]`)

The activity pattern is healthy and shows a mature human+AI collaboration:

| Date      | Volume      | Nature                                                                                                                             | Signal                           |
| --------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Jun 17–22 | 8 commits   | Dependabot batch (Tauri, linting, testing, ONNX)                                                                                   | Regular dep hygiene              |
| Jun 29    | 20+ commits | Major: Tailwind v4/Vite v8 migration + audit hardening + deps batching + lockfile repair                                           | Concentrated hardening sprint    |
| Jun 30    | 7 commits   | God-file splits (BreedingLab, GenealogyView, StrainDetailView, CalculatorHubView, StrainLookupSection) + AI disclaimer unification | Feature/quality work             |
| Jul 1     | 22 commits  | v1.9.0 release, 8 more god-file splits, CI gates (DevOps/dependabot overrides, prune workflows, branch coverage fix)               | Release + follow-on CI hardening |
| Jul 2     | 1 commit    | WebKit cross-browser flake fix                                                                                                     | CI stability                     |

**Quality signals:**

- ✅ Every commit follows Conventional Commits (`fix(ci):`, `refactor(web):`, `chore(deps):`)
- ✅ No revert commits; no merge conflicts left in code
- ✅ SHA-pinned CI actions throughout (0 unpinned detected in workflows)
- ✅ Turbo caching leveraged for fast CI
- ⚠ The `pnpm-lock.yaml` required a manual repair on Jun 29 (`fix(deps): repair pnpm-lock.yaml`) — this signals that automated Dependabot + manual dep updates can desynchronize the lockfile under high velocity

### 2.2 Version & Technology Stack

| Component           | Version                | Notes                                     |
| ------------------- | ---------------------- | ----------------------------------------- |
| CannaGuide          | 1.9.0                  | Released 2026-07-01                       |
| Node.js             | ≥24.0 (v24.16.0 in CI) | Required; VM workaround documented        |
| pnpm                | 10.33.0                | Corepack-managed                          |
| React               | 19.2.7                 | Aligned across web + desktop              |
| Vite                | 8.1.2                  | Rolldown-backed; `@rolldown/plugin-babel` |
| Tailwind CSS        | 4.3.2                  | PostCSS-based; `@tailwindcss/postcss`     |
| React Compiler      | 19.1.0-rc.3            | `babel-plugin-react-compiler`             |
| Workbox             | 7.4.1                  | InjectManifest + Cache-First ML artifacts |
| TypeScript          | 5.9.3                  | Strict mode; custom typecheck filter      |
| RTK (Redux Toolkit) | 2.12.0                 | 19 slices + RTK Query                     |
| Zustand             | 5.0.14                 | 9 stores for transient UI state           |
| Yjs                 | 13.6.30                | CRDT engine for offline sync              |
| Three.js            | 0.185.0                | 3D Room Planner                           |
| Recharts            | 3.9.1                  | Chart library                             |
| DOMPurify           | 3.4.11                 | HTML sanitization                         |
| ONNX Runtime Web    | 1.27.0                 | Local vision AI inference                 |
| Porcupine Web       | 4.0.1                  | Wake-word detection                       |

### 2.3 Repository Structure Highlights

```
apps/web/
  bootstrap/         # Parallel postHydration init
  components/        # 200+ React components; all ≤700 LOC
  data/              # Strain catalog (776 entries, alpha splits), terpene/nutrient DBs
  hooks/             # 40+ custom hooks
  locales/           # 5 languages × 13 namespaces
  services/          # 130+ services (ai/, local-ai/, sync, simulation, ...)
  stores/            # 19 Redux slices + 9 Zustand stores + RTK Query
  types/             # Zod schemas + TypeScript types
  workers/           # 11 Web Workers + simulation.worker.ts + WorkerBus
```

**File count (excl. data/locales):** ~900 TS/TSX source files at 120k+ LOC total

---

## 3. Detailed Findings by Dimension

### 3.1 Code Quality, Maintainability & Architecture

#### 3.1.1 God-File Burn-Down Status — COMPLETE ✅

The systematic god-file elimination is one of the most impressive aspects of the v1.9 cycle. The `check-file-budget.mjs` gate (`MAX_LINES = 700`) now reports **0 failures and 0 grandfathered files**, meaning every changed and new file is within budget.

**Total LOC reduction from god-file splits (June 29 – July 1 2026):**

| Original File             | Before | After | Split Pattern                      |
| ------------------------- | ------ | ----- | ---------------------------------- |
| `SettingsView.tsx`        | 2570   | 348   | 5 settings tabs → separate modules |
| `DataManagementTab`       | 1246   | 110   | storage/export/GDPR panels + hook  |
| `CalculatorHubView.tsx`   | 1511   | 124   | per-calculator panels              |
| `StrainLookupSection.tsx` | 1211   | 401   | charts + ResultCard                |
| `BreedingLab.tsx`         | 1198   | 94    | hook + tab/sub-components          |
| `workerBus.ts`            | 1193   | 430   | worker-bus/* modules               |
| `GenealogyView.tsx`       | 1074   | 644   | tree/panel/modal                   |
| `StrainDetailView.tsx`    | 1056   | 196   | per-tab components                 |
| `dbService.ts`            | 927    | 27    | db/* modules (barrel facade)       |
| `pdfReportService.ts`     | 923    | 9     | pdf/* modules (barrel facade)      |
| `GrowRoom3D.tsx`          | 848    | 571   | growRoom3d/*                       |
| `simulationSlice.ts`      | 834    | 361   | simulation/*                       |
| `strainImageFallback.ts`  | 812    | 19    | svg/* (2026-07-01)                 |
| `HelpView`                | n/a    | split | help/* sections                    |
| `HydroMonitorView`        | n/a    | split | hydro/* modules                    |
| `EcPhPlannerCalculator`   | n/a    | split | ecPh/* modules                     |
| `knowledgeGraphService`   | n/a    | split | knowledgeGraph/*                   |
| `StrainsView`             | n/a    | split | controller hook + submodules       |
| `exportService`           | n/a    | split | export/* modules                   |

**Remaining files near budget limit (700 LOC) — for awareness only:**

| File                | LOC | Status                            |
| ------------------- | --- | --------------------------------- |
| `GenealogyView.tsx` | 644 | Within budget; D3 tree complexity |
| `GrowRoom3D.tsx`    | 571 | Within budget; Three.js scene     |
| `aiService.ts`      | 663 | Within budget; monitored          |
| `crdtSyncBridge.ts` | 651 | Within budget; CRDT bridge        |

**Recommendation P3:** Monitor `aiService.ts` (663 LOC) and `voiceCommandRegistry.ts` (697 LOC) — both are approaching the 700 LOC ceiling. A proactive split when approaching 750 LOC is advised.

#### 3.1.2 TypeScript Strictness

The `tsconfig.json` enables strict mode. The CI gate enforces zero `any` in application source via an inline grep (`grep -r "any" apps/web/src`). Zod schemas are actively used for AI response validation (`AIResponseSchema`, `PlantDiagnosisResponseSchema`, `StructuredGrowTipsSchema`, etc.).

**Finding:** No critical type safety gaps found. Zod v4.4.2 in use — aligned with latest.

#### 3.1.3 State Management Architecture

The hybrid Redux Toolkit (19 slices, persisted to IndexedDB) + Zustand (9 stores, transient UI) + RTK Query (AI endpoints) architecture is well-documented in `ADR-0015` and `docs/monorepo-architecture.md`. The `uiStateBridge.ts` handles Redux↔Zustand sync.

**Strengths:**

- Clear separation: domain data in Redux, transient UI in Zustand
- Entity adapters for `problemTrackerSlice`, `diagnosisHistorySlice`
- Battery-aware eco-mode with hysteresis

**Finding (P3):** The `listenerMiddleware.ts` at 562 LOC is substantial but within budget. Worth monitoring as cross-slice side-effects grow.

#### 3.1.4 Service Dependency Acyclicity

The `generate-service-map.mjs` script + ESLint `import/no-cycle` enforce acyclic service dependencies. The CI quality gate validates this on every push. No cycles detected in this audit.

#### 3.1.5 Error Handling

React 19 error boundaries are in place. The `WorkerBusError` class with 10-code enum provides typed worker errors. DB corruption auto-recovery (session flag) is documented.

**Finding (P2):** The `crdtSyncBridge.ts` has comprehensive Sentry breadcrumb integration (`divergenceCount`, `conflictsResolved` telemetry). No gaps found.

---

### 3.2 Security & Privacy

#### 3.2.1 AI Prompt Safety Pipeline — Excellent ✅

The `safetyPipeline.ts` is the centerpiece of AI security. It implements:

- Unicode normalization (NFC + homoglyph replacement for 80+ Cyrillic/Greek/fullwidth chars)
- Zero-width character stripping (U+200B–200F, U+2028–202F, FEFF, etc.)
- Control character sanitization
- 30+ prompt injection regex patterns (ignore/disregard/forget/override/jailbreak patterns)
- Character allowlist filtering
- Length capping (configurable per call site, 120–600 chars)
- DOMPurify pass for HTML injection
- Topic relevance check (`isTopicRelevant`) for cannabis domain gating
- Output: `sanitizeForPrompt(input, maxLength): string`

**Coverage:** safetyPipeline.ts at **100% lines, 100% functions, 80% branches** — meets and exceeds the 80% critical path gate.

**Invocation audit (all user-controlled LLM paths):**

| Call site                                           | Input sanitized | Method                                |
| --------------------------------------------------- | --------------- | ------------------------------------- |
| `aiService.ts:buildMentorStreamPrompt`              | user query      | `sanitizeForPrompt(query, 600)`       |
| `aiService.ts:generateDeepDive`                     | topic           | `sanitizeForPrompt(topic, 400)`       |
| `geminiContextBuilders.ts:buildStrainLookupContext` | query           | `sanitizeForPrompt(query, 600)`       |
| `geminiContextBuilders.ts:buildStrainDetailContext` | query           | `sanitizeForPrompt(safeQuery, 600)`   |
| `geminiContextBuilders.ts:buildPlantContext`        | userNotes       | `sanitizeForPrompt(userNotes, 400)`   |
| `geminiPromptUtils.ts:journal entries`              | notes           | `sanitizeForPrompt(entry.notes, 140)` |
| `promptHandlers.ts` (local AI)                      | all inputs      | `sanitizeForPrompt(value, maxLength)` |
| `externalStrainLookups.ts:lookupWithAI`             | name            | `sanitizeForPrompt(name, 120)`        |
| `geminiService.ts:generateStrainInfo`               | topic           | `sanitizeForPrompt(topic, 400)`       |

**All 9 known LLM entry points verified as sanitized.** S-08 is fully closed.

#### 3.2.2 Fixed: SECURITY.md Supported Versions

The `SECURITY.md` listed `1.8.x` as the latest supported version — a documentation drift from the v1.9.0 release. **Fixed in this audit**: now correctly shows v1.9.x as supported, v1.8.x supported, <1.8 not supported.

#### 3.2.3 Fixed: @babel/core Vulnerability (GHSA-4x5r-pxfx-6jf8)

**Severity:** Low  
**Package:** `@babel/core ≤7.29.0` — Arbitrary File Read via sourceMappingURL Comment  
**Path:** `@stryker-mutator/core > @stryker-mutator/instrumenter > @babel/core`  
**Patched versions:** `>=7.29.6`  
**Fix:** Added `"@babel/core": ">=7.29.6"` to `pnpm.overrides` in `package.json` + updated `pnpm-lock.yaml`  
**Verification:** `pnpm audit` now reports **No known vulnerabilities found** ✅

Note: This is a devDependency path (Stryker mutation testing). Runtime production code is not affected. The override ensures the dev tool chain is also hardened.

#### 3.2.4 Cryptography & Sync Encryption

`syncEncryptionService.ts` at **96.77% lines, 100% functions, 80% branches** — critical path gate met. AES-256-GCM via Web Crypto API, BYOK model, proper IV handling verified in tests.

#### 3.2.5 Supply Chain & Actions

All 25+ GitHub Actions workflows remain SHA-pinned at 40-character commit SHAs. Grype replaces Trivy (post March 2026 supply-chain attack). SBOM + build attestations generated on tagged releases. `pnpm.overrides` active for all known transitive vulnerabilities.

**pnpm.overrides summary (post-audit):**

```
@babel/core >=7.29.6         (NEW — GHSA-4x5r-pxfx-6jf8)
@babel/plugin-transform-modules-systemjs >=7.29.4
ip-address >=10.1.1          (GHSA-v2v4-37r5-5v8g)
undici >=7.28.0 <8.0.0       (GHSA-p88m-4jfj-68fv et al.)
linkify-it >=5.0.1
markdown-it >=14.2.0
js-yaml@3 >=3.15.0 / @4 >=4.2.0
esbuild >=0.25.0
ws >=8.20.1
... (16 total overrides)
```

#### 3.2.6 DOMPurify Coverage

DOMPurify 3.4.11 in use. `sanitizeForPrompt` runs a DOMPurify pass on all LLM inputs. `geminiService.ts` historically had a `sanitizeValue` fix (resolved in v1.2). EXIF/GPS stripping on photo uploads confirmed via `imageService.ts`.

#### 3.2.7 CSP & Headers

Security headers (CSP, Permissions-Policy, COEP, HSTS, Referrer-Policy) defined in `securityHeaders.ts` and applied via `vercel.json`. The `check-csp-consistency.mjs` gate validates CSP consistency between dev and prod configs in CI.

**No gaps found.**

---

### 3.3 Performance, Bundle & PWA

#### 3.3.1 Build Performance

`pnpm run build` completes in **~15.5 seconds** (Rolldown/Vite 8). PWA precache manifest: **233 entries, 19.5 MB** (primarily ML models + locale chunks). Service Worker: 10.73 kB gzip.

#### 3.3.2 Bundle Budget — All Green ✅

`check-bundle-budget.mjs` gates on brotli size per chunk. All 142+ chunks pass:

| Chunk                  | Gzip (KB) | Budget (KB) | Status |
| ---------------------- | --------- | ----------- | ------ |
| `index-*.js` (main)    | 174.8     | 300         | ✅     |
| `ai-runtime-*.js`      | 2289.5    | exempt (ML) | ✅     |
| `transformers-*.js`    | 215.6     | 500         | ✅     |
| `ort.bundle.min-*.js`  | 116.7     | 500         | ✅     |
| `three-*.js`           | 136.6     | exempt      | ✅     |
| `charts-recharts-*.js` | 112.7     | 500         | ✅     |
| `pdf-export-*.js`      | 140.5     | 500         | ✅     |
| `strains-data-*.js`    | 103.3     | exempt      | ✅     |

The main app chunk at 174.8 KB gzip is well under the 300 KB gate — good initial load budget.

#### 3.3.3 Worker Architecture (11 Workers + WorkerBus)

The WorkerBus (`services/worker-bus/`) provides priority queuing, backpressure, typed error codes, rate-limiting, telemetry, and battery-aware eco-mode. Workers are reaped after 15s idle in eco-mode (<25% battery). Zero-copy transfer for typed arrays implemented.

**Finding:** No architectural issues. The split from 1193→430 LOC (`workerBus.ts`) improved readability significantly.

#### 3.3.4 ML Model Caching (Cache-First + FIFO 16 entries)

Workbox 7.4.1 SW applies Cache-First for `.onnx`, `.safetensors`, `.bin`, `.wasm` artifacts with FIFO eviction at 16 entries. Global 200 MB quota gate prunes ML cache before the app shell. This ensures offline ML inference survives full reload.

#### 3.3.5 Service Worker Update UX

`skipWaiting` and `clients.claim()` flow confirmed in `sw.mjs`. The `Update available` notification is surfaced to users (per changelog v1.1).

---

### 3.4 Testing, Quality Gates & CI/CD

#### 3.4.1 Test Suite — 2936 Tests, 274 Files ✅

The full suite passes in ~210s (parallel + forked on Windows). Test isolation uses `vi.hoisted()` for shared module mocks and `vi.resetModules()` + dynamic `import()` for modules that bind mocks at import time.

**Test count trajectory:**

- v1.0: 307 tests
- v1.1: 529 tests
- v1.8.2: 2672 tests
- v1.9.0: 2794 tests
- v1.9.0+: **2936 tests** (post-audit; 142 new tests in god-file split follow-ups)

#### 3.4.2 Coverage Metrics

| Metric     | Measured | Threshold (before) | Threshold (after audit) |
| ---------- | -------- | ------------------ | ----------------------- |
| Lines      | 43.03%   | 42%                | **43%** ✅              |
| Functions  | 41.04%   | 39%                | **41%** ✅              |
| Branches   | 25.01%   | 25%                | 25% (unchanged)         |
| Statements | 35.74%   | 35%                | 35% (unchanged)         |

**Critical path coverage (enforced at 80% minimum):**

| File                        | Lines      | Functions  | Branches | Gate |
| --------------------------- | ---------- | ---------- | -------- | ---- |
| `safetyPipeline.ts`         | **100%**   | **100%**   | 80%      | ✅   |
| `syncEncryptionService.ts`  | **96.77%** | **100%**   | 80%      | ✅   |
| `plantSimulationService.ts` | **98.5%**  | **100%**   | 81.81%   | ✅   |
| `diagnosisService.ts`       | **96.1%**  | **89.47%** | 80.76%   | ✅   |

All 4 critical-path files exceed the 80% gate. The `check:critical-path-coverage` CI job enforces this.

**Coverage gap analysis (remaining opportunities for Stufe D):**

The global 43% lines vs. the 80% critical path highlights a large uncovered space in helper services, locale utilities, and complex domain logic. The roadmap target of 50/50/35/50 is achievable with ~3–4 targeted sprints.

High-value uncovered areas (estimated):

- `analyticsService.ts` (636 LOC) — predictive analytics, trend detection
- `mqttSensorService.ts` (563 LOC) — IoT sensor handling
- `listenerMiddleware.ts` (562 LOC) — cross-slice side effects
- `voiceCommandRegistry.ts` (697 LOC) — 37 voice commands
- `entourageService.ts` (515 LOC) — terpene entourage calculations

#### 3.4.3 Quality Gates Inventory

The gate inventory in `docs/DEVOPS-GATES.md` is comprehensive and accurate. 17 required gates + 5 advisory gates. Pre-push gates: typecheck + lint:scopes + file-budget.

**New gates added in v1.9 cycle:** `check:critical-path-coverage`, `pnpm audit --audit-level=high`, CSP consistency, audit backlog check, E2E selector stability, service map acyclicity, i18n completeness, strain catalog integrity.

#### 3.4.4 CI/CD Robustness

25 workflows verified (see `.github/workflows/README.md`). Key improvements in v1.9 cycle:

- WebKit E2E added (advisory)
- Auto-prune deployments (keep 3 per env)
- Weekly cleanup workflow
- MDC rule validation and Graphify MCP doctor
- Dependabot overrides refined

---

### 3.5 Accessibility & i18n

#### 3.5.1 WCAG 2.2 Compliance Progress

The v1.9.0 cycle addressed remaining WCAG 2.5.5 (44×44px) touch target violations in `QRScannerModal`, `ProactiveAlertBanner`, `GrowManagerTab`, `DiseaseAtlasView`. SVG/icon children gained `aria-hidden="true"`.

**Confirmed fixes:**

- All icon-only buttons in critical views meet 44×44 minimum
- ARIA live regions for AI response streaming
- Focus management in dialogs via Radix UI
- `viewport-fit=cover` + safe area insets for PWA on notch devices

**Remaining advisory items (P2):**

- Automated `@axe-core/playwright` in CI runs on deploy, not on every PR
- Recharts chart accessibility (ARIA labels on data points) could be improved
- 3D Room canvas keyboard navigation remains mouse-first

#### 3.5.2 i18n — 5 Locales, 13 Namespaces

All 5 locales (EN/DE/ES/FR/NL) maintain 13 namespaces. The `check:i18n` CI gate enforces completeness. The last hardcoded string (`QRScannerModal`) was fixed in v1.9.0.

**RTL status:** Deferred to v2.0. `RTL_LOCALES` constant prepared for `ar`/`he`. Tailwind RTL migration note documented. Crowdin integration active for community translations.

---

### 3.6 PWA & Offline-First Architecture

#### 3.6.1 Offline Capability Coverage

| Feature                        | Offline Status             |
| ------------------------------ | -------------------------- |
| Plant simulation (VPD/biomass) | ✅ Full — Web Worker       |
| Local AI (heuristic fallback)  | ✅ Full — 3-layer          |
| ONNX vision diagnosis          | ✅ Cached in SW            |
| Journal (voice + photo)        | ✅ Queue + SW replay       |
| Strain library (776 entries)   | ✅ Bundled data            |
| Calculators                    | ✅ Client-side             |
| 3D Room                        | ✅ Three.js bundled        |
| Reports (PDF)                  | ✅ jsPDF bundled           |
| Cloud AI (Gemini/etc.)         | ❌ Online only (by design) |
| GitHub Gist sync               | ❌ Online only (by design) |

#### 3.6.2 CRDT Sync

Yjs + encrypted GitHub Gists. `SyncConflictModal.tsx` exists. The `crdtSyncBridge.ts` tracks `conflictsResolved` telemetry and emits Sentry breadcrumbs on divergence. The `PRIORITY_ROADMAP.md` marks F-06 (conflict resolution) as Done (Session 87).

**Finding:** The conflict resolution UI exists but its UX quality and edge-case handling should be validated manually (P2 — not P0 as previously classified, since basic implementation is present).

#### 3.6.3 Dual IndexedDB Architecture

- `CannaGuideStateDB`: Redux-persisted state (plants, nutrients, settings)
- `CannaGuideDB`: Strains, images, full-text search, offline queue

Corruption detection + safe auto-clear + session flag to prevent reset loops confirmed via `dbService`/`db/*` modules.

---

### 3.7 Domain Features

#### 3.7.1 Strain Library (776 Entries)

Alphabetically sharded data files (`a.ts`–`t.ts`), genealogy D3 visualization, chemovar typing, terpene/cannabinoid/flavonoid profiles. `catalog-version.json` manifest with schema `strain-v2`. `merge-strains.mjs` + `enrich-provenance.mjs` + `check-new-strain-duplicates.mjs` (Levenshtein fuzzy dedup, distance ≤2) + `check-strain-integrity.mjs` in CI.

**Finding:** Strain data pipeline is production-grade. The roadmap target of 2000+ strains is achievable with the existing automated pipeline.

#### 3.7.2 Local AI Stack

Three-layer fallback: WebLLM → Transformers.js → Heuristics. ONNX Runtime Web for vision inference (MobileNetV2, 38 classes for deficiency/pest/disease). Image preprocessing includes white balance and EXIF/GPS stripping.

The `preloadOfflineAssets` tier system (`critical` / `standard` / `full`) auto-degrades on slow/metered connections, preventing 1–2 GB WebLLM downloads. `healthService.ts` monitors device capability.

#### 3.7.3 Plant Simulation

`plantSimulationService.ts` at 98.5% line coverage. VPD-based transpiration/biomass, daily simulation loop in Web Worker, genetic modifiers, post-harvest simulation. Scientific grounding documented in service comments.

#### 3.7.4 Voice Commands (37 Commands)

Porcupine wake-word detection (on-device, privacy-preserving). 37 registered commands in `voiceCommandRegistry.ts`. Voice orchestrator coordinates STT → NLU → action dispatch.

---

### 3.8 Recent Changes Evaluation (June 29 – July 2, 2026)

#### Strengths

1. **Disciplined migration:** Tailwind v4 + Vite v8 + React Compiler 1.0 + Workbox 7.4.1 migrated in a single commit with immediate fix follow-ups — shows excellent coordination
2. **Security culture:** S-08 (prompt sanitization centralization) closed proactively, not reactively
3. **God-file discipline:** 19 files refactored with precise LOC tracking — demonstrates commitment to maintainability
4. **CI expansion:** 25 workflows, all SHA-pinned, with meaningful gates beyond simple lint/test
5. **AI agent quality:** Cursor Agent commits follow the same conventions and quality standards as human commits — high integration maturity

#### Risk Areas

1. **Migration compound risk:** Four major framework upgrades in one commit (Tailwind + Vite + React Compiler + Workbox) increases regression surface. The fact that tests pass and the build is green is reassuring, but visual regression across 9 themes was not fully automated in CI
2. **Lockfile desynchronization:** The `fix(deps): repair pnpm-lock.yaml` on Jun 29 shows that high-velocity Dependabot + manual changes can create lockfile drift. The `check:lockfile` script mitigates this
3. **Coverage delta:** 142 new tests were added, but the coverage percentage barely moved (43% vs 42%), suggesting the new tests hit already-covered paths rather than expanding into uncovered territory. The next sprint should target uncovered services explicitly

---

## 4. Risk Matrix

| Risk                                                | Likelihood | Impact | Mitigation Status                                      |
| --------------------------------------------------- | ---------- | ------ | ------------------------------------------------------ |
| Framework migration regression (Tailwind v4/Vite 8) | Low        | High   | ✅ Tests pass; build green; advisory visual regression |
| Stale pnpm lockfile                                 | Medium     | Medium | ✅ `check:lockfile` gate; repair script                |
| Coverage gap in complex services                    | High       | Medium | ⚠ Critical paths ≥80%; global floor 43%                |
| GitHub Gist as sync backbone (rate limits/ToS)      | Medium     | Medium | ⚠ Documented limitation; no alternative planned        |
| Local AI performance on low-end devices             | Medium     | Medium | ⚠ Eco-mode + tier system; no automated device testing  |
| New @babel/core vulnerability in devDeps            | Resolved   | Low    | ✅ Override added                                      |
| Visual regression across 9 themes                   | Medium     | Low    | ⚠ Advisory; no automated visual CI                     |
| Per-provider AI consent enforcement gap             | Low        | Medium | ⚠ Service exists; UI gate missing                      |

---

## 5. Prioritized Actionable Backlog (Post-Audit)

| ID   | Title                                        | Category    | Severity | Effort | Status       | Acceptance Criteria                                           |
| ---- | -------------------------------------------- | ----------- | -------- | ------ | ------------ | ------------------------------------------------------------- |
| A-01 | Per-provider AI consent UI enforcement       | Security/UX | P1       | S      | **Done**     | Cloud AI calls blocked until consent granted per-provider     |
| A-02 | Coverage Stufe D sprint (target 50/50/35/50) | Testing     | P1       | L      | In progress  | Vitest thresholds raised to 50/50/35/50 with CI green         |
| A-03 | Visual regression testing in CI (advisory)   | Testing     | P2       | M      | Open         | Percy/Chromatic or Playwright screenshot comparison on deploy |
| A-04 | Recharts chart a11y improvements             | A11y        | P2       | S      | **Done**     | ARIA labels on all chart data series                          |
| A-05 | 3D Room keyboard navigation                  | A11y        | P2       | S      | **Done**     | Canvas focusable + camera fully keyboard-controllable         |
| A-06 | IoT real-device E2E testing                  | Testing     | P2       | L      | Open         | ESP32 hardware test documented                                |
| A-07 | `analyticsService` test coverage             | Testing     | P2       | M      | **Done**     | ≥60% coverage on analytics service                            |
| A-08 | `voiceCommandRegistry` test coverage         | Testing     | P2       | M      | **Done**     | ≥60% coverage on 37 command handlers                          |
| A-09 | CRDT conflict UI manual validation           | UX          | P2       | S      | **Done**     | Forced conflict scenario tested + documented                  |
| A-10 | Strain library toward 2000+ entries          | Domain      | P3       | XL     | Roadmap      | Automated ingestion pipeline + provenance                     |
| A-11 | WebGPU inference path                        | Perf        | P3       | L      | Roadmap v2.0 | Local inference via WebGPU on supported browsers              |
| A-12 | AR/WebXR Digital Twin                        | Domain      | P3       | XL     | Roadmap v2.0 | WebXR plant overlay prototype                                 |
| A-13 | Equipment placement in the 3D room           | Feature     | P3       | XL     | Roadmap      | Split out of A-05 -- see correction note below                |

> **Correction to A-05 (2026-07-14).** As written, A-05 demanded "full keyboard control of
> _equipment placement_". No such feature exists: `GrowRoom3D.tsx` is a read-only three.js
> visualization that dispatches nothing, and the equipment model in `types/schemas.ts` is an
> AI recommendation list with no x/y/z coordinates. The genuine accessibility defect was that
> the `<canvas>` had no `tabIndex` and was therefore unreachable by keyboard at all; that is
> what A-05 now covers and what has been fixed. Building placement itself is a feature, not an
> a11y fix, and is tracked separately as **A-13**.

### Implementation Blueprint: A-01 (Per-Provider AI Consent)

**Root cause:** `aiConsentService` exists with per-provider consent state + `aiConsentService.ts` is tested. The i18n strings for consent dialogs exist. However, `aiService.ts` and `geminiService.ts` do not check `aiConsentService.hasConsent(provider)` before dispatching cloud requests.

**Fix steps:**

1. Add `aiConsentService.requireConsent(provider)` guard in `aiService.ts` before any cloud API call (wrap the RTK Query endpoint or the service function call)
2. If no consent: show `ConsentModal` for that provider (component exists per changelog)
3. Add integration test: `aiService.generateDeepDive` with no consent → triggers consent flow; with consent → proceeds to API
4. Add `check:ai-consent-gate` to pre-push or advisory CI

### Implementation Blueprint: A-02 (Coverage Stufe D)

**Steps:**

1. Run `pnpm run test:coverage` and inspect uncovered branches in `analyticsService`, `mqttSensorService`, `voiceCommandRegistry`, `entourageService`, `listenerMiddleware`
2. Write targeted unit tests for each, focusing on branches (error paths, edge cases)
3. For `listenerMiddleware`: use `configureStore()` with mocked thunks + `dispatch()` to trigger listener side-effects
4. For `voiceCommandRegistry`: mock Porcupine and simulate keyword detection events
5. Raise thresholds by 2-3% increments as coverage improves

---

## 6. Strategic Perfection Plan

### 6.1 v1.9.x Patch (Immediate — Done in This Audit)

- ✅ `SECURITY.md` supported versions corrected
- ✅ `@babel/core` vulnerability resolved via override
- ✅ Coverage thresholds raised to measured values (lines 43%, functions 41%)
- ✅ CHANGELOG Unreleased section updated with post-v1.9.0 activity
- ✅ This audit report added to `docs/audits/`

### 6.2 Medium-Term (v1.9.x → v2.0 Preparation)

1. **Coverage Stufe D:** Raise global coverage from 43% to 50%+ through targeted service testing
2. **Visual regression in CI:** Playwright screenshot comparison for theme variants on deploy previews
3. **Per-provider AI consent gate:** Close the UX enforcement gap
4. **CRDT conflict UX validation:** Manual test + document the conflict resolution flow
5. **Analytics service test coverage:** High-value, medium-effort
6. **Strain library scale:** Automate ingestion toward 2000+ entries
7. **Optimize locale chunks:** German locale at 660 KB raw (134 KB brotli); consider splitting knowledge namespace further

### 6.3 Long-Term (v2.0 — 2026 Q3+)

1. **AR/Digital Twin:** WebXR layer over Three.js for plant overlay
2. **WebGPU inference:** Accelerate ONNX + WebLLM on supported browsers
3. **Community features:** Plugin/extension system with sandboxed execution
4. **Real-time multi-peer CRDT:** Beyond GitHub Gists (WebRTC P2P or optional relay)
5. **RTL production readiness:** Arabic/Hebrew UI for expanded market reach
6. **Offline voice STT:** V-06 ONNX-based speech-to-text for true voice offline mode

### 6.4 Continuous Excellence Recommendations

- **Dependency update automation:** Continue Dependabot batching; add lockfile integrity check (`check:lockfile`) to pre-push gate
- **AI red-team harness:** Automated adversarial prompt testing in CI (expand `aiPromptSanitization.test.ts` with fast-check property-based fuzzing)
- **Bundle monitoring:** Add trend tracking for bundle sizes across releases (GitHub Action artifact + chart)
- **Maintainability metrics dashboard:** Track LOC, complexity, coverage, dep freshness over time
- **ADR continuity:** Major decisions (Tailwind 4 migration, settings split pattern, AI safety centralization) should each have a dedicated ADR

---

## 7. Changes Made in This Audit

| File                                          | Change                                               | Reason                                        |
| --------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `SECURITY.md`                                 | Updated supported versions (1.8.x → 1.9.x)           | Documentation accuracy                        |
| `package.json`                                | Added `@babel/core >=7.29.6` to pnpm.overrides       | GHSA-4x5r-pxfx-6jf8 remediation               |
| `pnpm-lock.yaml`                              | Updated to reflect new override                      | Lockfile consistency                          |
| `apps/web/vite.config.ts`                     | Raised thresholds: lines 42→43%, functions 39→41%    | Match measured coverage; remove false comfort |
| `CHANGELOG.md`                                | Updated Unreleased section with post-v1.9.0 activity | Documentation accuracy                        |
| `docs/audits/AUDIT-REPORT-2026-07-02-FULL.md` | This file                                            | Audit artifact                                |

---

## 8. Recommendations & Next Actions

**For maintainers (qnbs):**

1. **Merge this PR immediately** — security fix (babel override) and documentation accuracy improvements
2. **Schedule A-01** (AI consent enforcement) as next P1 issue — service and i18n are ready; only UI gate missing
3. **Coverage sprint A-02** — target `analyticsService` and `voiceCommandRegistry` first (high complexity, high value)
4. **Tag v1.9.1** after this PR lands — include pnpm audit clean status in release notes
5. **Enable visual regression** — Playwright screenshot comparison is the highest-ROI advisory improvement for catching theme regressions

**For Cursor Agent (future sessions):**

- When touching `services/ai/*`: always verify `sanitizeForPrompt` coverage first
- When adding new AI surfaces: enforce `AiDisclaimer` component (AGENTS.md rule)
- When new god-files approach 700 LOC: split proactively, not reactively
- When updating Dependabot deps: run `pnpm run check:lockfile` and repair if needed
- When raising coverage: prefer uncovered branches in complex services over trivial util coverage

---

## 9. Appendices

### Appendix A: Command Execution Log

```bash
# Environment
node -v  → v24.16.0
pnpm -v  → 10.33.0

# Quality gates
pnpm run typecheck  → ✅ 5/5 tasks successful (18.3s)
pnpm run lint:changed  → ✅ No changed JS/TS files vs origin/main
FILE_BUDGET_ADVISORY=1 pnpm run check:file-budget  → ✅ 0 failures, 0 warnings
pnpm run test:run  → ✅ 274 files, 2936 tests, 210.91s
pnpm run build  → ✅ 15.52s, 233 precache entries
node scripts/check-bundle-budget.mjs apps/web/dist/assets  → ✅ all chunks within budget
pnpm audit --audit-level=low  → 1 low (GHSA-4x5r-pxfx-6jf8 @babel/core) → FIXED
pnpm audit  → ✅ No known vulnerabilities found (post-fix)
```

### Appendix B: Key File Inventory (Non-Data, Non-Locale, Largest Files)

| File                                                    | LOC | Status                        |
| ------------------------------------------------------- | --- | ----------------------------- |
| `data/presetSetups.ts`                                  | 889 | Data file; exempt from budget |
| `data/terpeneDatabase.ts`                               | 711 | Data file; exempt             |
| `components/views/knowledge/AnalyticsDashboardView.tsx` | 698 | Within budget                 |
| `services/voiceCommandRegistry.ts`                      | 697 | Within budget; monitor        |
| `services/aiService.ts`                                 | 663 | Within budget; monitor        |
| `services/crdtSyncBridge.ts`                            | 651 | Within budget                 |
| `services/analyticsService.ts`                          | 636 | Within budget                 |
| `components/common/OnboardingModal.tsx`                 | 640 | Within budget                 |
| `components/views/strains/GenealogyView.tsx`            | 644 | Within budget                 |

### Appendix C: Coverage Measurement Details

Measured: `pnpm run test:coverage` in `apps/web/`

- Total: lines 43.03% (14297/33220), functions 41.04% (2770/6749), branches 25.01% (8039/32137)
- Critical paths: all 4 enforced files at ≥80% lines and ≥80% functions
- Coverage provider: v8; reporter: text/html/lcov/json-summary

### Appendix D: Vulnerability Remediation Timeline

| CVE/Advisory        | Package             | Severity | Remediated | Method                             |
| ------------------- | ------------------- | -------- | ---------- | ---------------------------------- |
| GHSA-4x5r-pxfx-6jf8 | @babel/core ≤7.29.0 | Low      | 2026-07-02 | pnpm.overrides >=7.29.6            |
| GHSA-v2v4-37r5-5v8g | ip-address          | Medium   | 2026-06-29 | pnpm.overrides >=10.1.1            |
| GHSA-p88m-4jfj-68fv | undici              | High     | 2026-06-29 | pnpm.overrides >=7.28.0            |
| CVE-2026-41242      | protobufjs          | Low      | 2026-06-29 | Documented ignore (false positive) |

---

_Audit executed 2026-07-02 by Cursor Cloud Agent. Next scheduled audit: post-v2.0 release or on significant architecture change._

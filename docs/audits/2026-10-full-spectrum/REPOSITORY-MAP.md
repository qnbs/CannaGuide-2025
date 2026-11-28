# Repository and Application Map

**Counted from:** exact-head source snapshot of `3d8b706d` (file and LOC counts, workflows); versions
updated to `c49560d9` (v1.10.0). Counts are not README badges. Refresh when `main` moves.

## 1. Topology

| Top-level       | Files | KB    | Role                                                                                        |
| --------------- | ----- | ----- | ------------------------------------------------------------------------------------------- |
| `apps/`         | 1354  | 18974 | `apps/web` PWA (the runnable app), `apps/desktop` Tauri v2 shell                            |
| `scripts/`      | 84    | 561   | gate and hook tooling (80 script files: 77 `.mjs`, 1 `.py`, 1 `.sh`, 1 `.ps1`)              |
| `docs/`         | 66    | 1014  | architecture, release process, DevOps gates, settings guide, audits                         |
| `.github/`      | 49    | 308   | 29 workflows, labeler, dependabot, templates                                                |
| `packages/`     | 28    | 95    | `@cannaguide/ai-core`, `@cannaguide/ui`                                                     |
| `graphify-out/` | 9     | 22994 | committed knowledge-graph output (largest by size)                                          |
| other           | --    | --    | `.devcontainer`, `.clusterfuzzlite`, `.husky`, `.vscode`, `docker`, `firmware`, `artifacts` |

Absent from `main`: `.cursor/`, `.claude/`, `.github/instructions/`, `.github/prompts/`. `.ai-context/`
is git-ignored by design.

Workspace packages: `@cannaguide/web` and the repository root at 1.10.0 (37 dependencies / 34 dev / 5
optional for web), `@cannaguide/desktop` 0.1.0, `@cannaguide/ai-core` 0.3.0, `@cannaguide/ui` 0.2.0.

### `apps/web` by area (files / LOC of ts, tsx, js, css)

| Area          | Files | LOC   |
| ------------- | ----- | ----- |
| `services`    | 384   | 72836 |
| `components`  | 340   | 60375 |
| `locales`     | 125   | 42164 |
| `data`        | 52    | 21817 |
| `stores`      | 64    | 11835 |
| `hooks`       | 43    | 4785  |
| `tests` (app) | 139   | 4367  |
| `utils`       | 35    | 3861  |
| `workers`     | 13    | 2641  |
| web root      | 18    | 2328  |
| `types`       | 11    | 1527  |
| `bootstrap`   | 16    | 1480  |
| `public`      | 24    | 705   |
| `lib`         | 5     | 319   |

Tests: 415 test files under `apps/web` plus 12 under `scripts/`.

## 2. Runtime inventory (`apps/web`)

- **Views** (`components/views/*`, files): strains 66, settings 54, plants 51, equipment 47, knowledge
  29, help 8.
- **Redux persisted slices (19):** archives, breeding, diagnosisHistory, favorites, genealogy,
  growPlanner, grows, hydro, knowledge, metrics, notes, nutrientPlanner, problemTracker, sandbox,
  savedItems, settings, simulation, userStrains, workerMetrics.
- **Zustand transient stores (9):** sensorStore, useAlertsStore, useCalculatorSessionStore,
  useFiltersStore, useIotStore, useStrainsViewStore, useTtsStore, useUIStore, useVoiceStore.
- **Web Workers (10 under `workers/`):** calculation, genealogy, hydroForecast, imageGeneration,
  inference, scenario, terpene, visionInference, voice, vpdSimulation; plus the root
  `simulation.worker.ts`.
- **Service sub-directories (files):** local-ai 84, migration 18, simulation 16, ai 14, db 11,
  worker-bus 11, strain-lookup 10, pdf 7, export 6, knowledgeGraph 6.
- **Locales:** `de`, `en`, `es`, `fr`, `nl`.
- **Legal hard limit:** `MAX_GROWS` and `MAX_PLANTS_CANG` are 3 (global across grows). Nothing in
  this audit touches it.

## 3. Persistence map

| Store         | Name                                                                                                                 | Owner                                                     | In erase registry on `main`? |
| ------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------- |
| IndexedDB     | `CannaGuideStateDB`                                                                                                  | Redux state (debounced, force-save on `visibilitychange`) | yes                          |
| IndexedDB     | `CannaGuideDB`                                                                                                       | strains, images, full-text index (`services/db/*`)        | yes                          |
| IndexedDB     | `CannaGuideSecureDB`                                                                                                 | encrypted key material and secrets                        | yes                          |
| IndexedDB     | `CannaGuideTimeSeriesDB`                                                                                             | sensor and metric series                                  | yes                          |
| IndexedDB     | `CannaGuideLocalAiCache`                                                                                             | local-AI inference cache                                  | yes                          |
| IndexedDB     | `CannaGuideImageGenCache`                                                                                            | generated images                                          | yes                          |
| IndexedDB     | `CannaGuideReminderDB`                                                                                               | reminders (also opened by `public/sw.js`)                 | yes                          |
| IndexedDB     | `cannaguide-crdt-v1`                                                                                                 | Yjs document (CRDT bridge)                                | **no** (fixed in PR #550)    |
| IndexedDB     | `CannaGuideRagEmbeddingCache`                                                                                        | RAG embedding cache                                       | **no** (fixed in PR #550)    |
| IndexedDB     | `plantDiseaseModel`                                                                                                  | downloaded vision-model bytes                             | **no** (fixed in PR #550)    |
| Cache Storage | service-worker caches                                                                                                | `public/sw.js`                                            | not verified                 |
| localStorage  | small non-secret flags; IoT connection config in `useIotStore` (documented exception; password stored as ciphertext) | --                                                        | n/a                          |

`deleteDatabase` resolved on `onblocked`, so an erase could report success while an open connection
kept the database alive (part of the PR #550 acceptance).

## 4. Delivery hosts and security headers

| Host                            | Mechanism                                                | Headers                                                                |
| ------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Vercel (`canna-guide-2025-web`) | git deploy, `vercel.json`                                | COOP / COEP, CSP from `securityHeaders.ts`; `crossOriginIsolated` true |
| Cloudflare Pages                | `deploy-cloudflare.yml` (direct upload through wrangler) | `_headers`, equal to the contract                                      |
| GitHub Pages                    | `deploy.yml` (`workflow_run`)                            | no custom response headers possible; not cross-origin isolated         |

Production `connect-src`: `'self'`, the Gemini, OpenAI, xAI and Anthropic API hosts, Hugging Face
(and its CDN hosts), `cdn.jsdelivr.net`, `api.elevenlabs.io`. Hosts fetched by source but absent:
`api.github.com` (Community Share), `api.otreeba.com`, `cannlytics.com`, the Cansativa gateway, two
public CORS proxies (CSP-001).

## 5. Workflow inventory (29)

Triggers: pr = `pull_request`, push, wr = `workflow_run`, wd = `workflow_dispatch`, cron, tag.
Permissions: `{}` = none at top level. Secrets listed by purpose only.

| Workflow              | Triggers              | Perms | Secret use                                |
| --------------------- | --------------------- | ----- | ----------------------------------------- |
| benchmark             | wd, cron              | set   | --                                        |
| cflite_pr             | wd, cron              | set   | --                                        |
| ci-docs               | pr, push              | set   | --                                        |
| ci                    | pr, push, wd          | set   | --                                        |
| cleanup-branches      | wd, cron              | {}    | --                                        |
| cleanup-deployments   | wr, wd, cron          | {}    | Cloudflare and Vercel API credentials     |
| codeql                | pr, push, wd, cron    | set   | --                                        |
| config-guard          | pr                    | set   | --                                        |
| dependabot-auto-merge | pr                    | set   | alerts token                              |
| dependency-health     | wd, cron              | set   | --                                        |
| deploy-cloudflare     | pr, wr                | set   | Cloudflare deploy credentials             |
| deploy (GitHub Pages) | wr                    | set   | --                                        |
| desktop-build         | push (tags), wd       | set   | Tauri, Apple and Windows signing material |
| e2e-integration       | pr, push, wd          | set   | --                                        |
| fuzzing               | pr, push, wd, cron    | set   | --                                        |
| graphify-update       | wd, cron              | set   | --                                        |
| labeler               | `pull_request_target` | set   | --                                        |
| mutation-testing      | wd, cron              | set   | --                                        |
| preview-validation    | wd                    | set   | --                                        |
| quarantine-provenance | wd, cron              | set   | --                                        |
| release-gate          | push (tags), wd       | set   | --                                        |
| release-publish       | push (tags), wd       | set   | release token                             |
| scorecard             | push, wd, cron        | set   | --                                        |
| security-full         | wd                    | set   | --                                        |
| security-scan         | wd                    | set   | Snyk token                                |
| snyk                  | wd, cron              | set   | Snyk token                                |
| stale                 | wd, cron              | {}    | --                                        |
| strains-daily-update  | wd                    | set   | --                                        |
| strains-merge         | pr, wd                | set   | --                                        |

All 29 pin actions by commit SHA. See CI-001 in wave 1 for the design-level credential scoping
finding.

## 6. Service-worker lifecycle (summary)

`bootstrap/serviceWorker.ts` registers `sw.js` with `updateViaCache: 'none'`; `sw.js` `install`
calls `self.skipWaiting()` unconditionally; `controllerchange` reloads the page; a `swUpdate` event
also drives an in-app update prompt (PWA-001).

## 7. Known unknowns

- import graph and cycle detection, fan-in hot spots (needs the git-ignored codegraph; regenerate
  read-only with `node scripts/codegraph.mjs` in a scratch clone)
- Cache Storage contents and eviction policy
- per-locale untranslated-value census
- local-AI throughput per host

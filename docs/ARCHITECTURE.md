# CannaGuide 2025 -- Architecture Overview

> Standalone architecture reference extracted from the project README.
> For contribution guidelines see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## High-Level Stack

| Layer        | Technology                                                                                |
| ------------ | ----------------------------------------------------------------------------------------- |
| UI           | React 19, Tailwind CSS, Radix UI, 9 cannabis themes                                       |
| State        | Redux Toolkit 2.11 (19 slices), Zustand 5 (9 stores), RTK Query, memoized selectors       |
| AI (Cloud)   | Google Gemini (primary), OpenAI, xAI/Grok, Anthropic (BYOK)                               |
| AI (Local)   | @xenova/transformers (ONNX), @mlc-ai/web-llm (WebGPU), TensorFlow.js                      |
| Build        | Vite 7, vite-plugin-pwa (InjectManifest), React Compiler                                  |
| Persistence  | Dual IndexedDB, localStorage, Service Worker caches                                       |
| i18n         | i18next -- EN, DE, ES, FR, NL (12 namespaces)                                             |
| Workers      | WorkerBus (promise-based, 11 workers, heap-based priority queue, messageId, auto-timeout) |
| Testing      | Vitest 2812 unit tests (267 files), Playwright E2E + Component tests                      |
| Distribution | GitHub Pages, Vercel, Cloudflare Pages, Tauri v2 Desktop (Netlify paused until v2.0)      |

---

## Graphify and MCP

Repository intelligence is backed by Graphify artifacts in `graphify-out/`:

- `GRAPH_REPORT.md` for architecture hubs and inferred-edge checks
- `graph.json` as MCP query source
- `graph.html` for visual graph exploration

For architecture investigations, use a query-first flow:

1. Read `graphify-out/GRAPH_REPORT.md`.
2. Run `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"`.
3. Validate inferred edges before high-impact refactors.

Claude Code CLI reads root `.mcp.json`, which registers Graphify through `scripts/graphify-mcp-launcher.mjs` (requires `uv` on PATH). codegraph is the CLI `scripts/codegraph.mjs`. Cursor does not run either tool and has no project MCP file for them.
Legacy fallbacks: `scripts/graphify-mcp-stdio.sh` (Linux/macOS), `scripts/graphify-mcp-stdio-windows.cmd`.
GitKraken MCP: `{ "command": "gk", "args": ["mcp"] }` — run `gk auth login` first. Diagnose: `pnpm run mcp:doctor`.

---

## Directory Structure

The project is a **Turborepo monorepo** with pnpm workspaces. All web app source lives in `apps/web/`.

```
package.json              Workspace root (turbo, eslint, prettier -- NO app deps)
turbo.json                TurboRepo pipeline (build, dev, test, lint, typecheck)
tsconfig.json             References-only (apps/web, packages/*)

apps/web/                 Main PWA (@cannaguide/web)
  package.json            All frontend deps + @cannaguide/ai-core + @cannaguide/ui
  vite.config.ts          Vite build + optionalMlPlugin() for ML stub fallback
  tsconfig.json           strict, baseUrl ".", @/* path alias
  index.tsx               Thin entry (styles + `bootstrap/index.ts`)
  bootstrap/              App bootstrap (index, sentry, recovery, serviceWorker, store, workers, render, …)
  constants.ts            App-wide constants
  types.ts                Core TypeScript types + AppSettings interface
  i18n.ts                 i18next initialization (5 languages)
  styles.css              Tailwind entry point
  simulation.worker.ts    VPD simulation Web Worker

  components/
    common/               Shared UI: Modal, Card, Toast, DialogWrapper
    icons/                Icon components (Phosphor, custom)
    navigation/           App navigation shell
    ui/                   Primitives: Button, Input, Select, Dialog (Radix)
    views/                Feature views: plants/, strains/, equipment/, settings/
                          settings/ modularized (ADR closure 2026-06-29): SettingsView shell +
                          lazy tabs + dataManagement/ panels — see docs/api/settings-modules.md

  stores/
    store.ts              Redux store creation + IndexedDB hydration
    useUIStore.ts         Zustand store for transient UI state (modals, views, notifications)
    useTtsStore.ts        Zustand store for TTS queue and speaking state
    useFiltersStore.ts    Zustand store for filter/sort UI state
    useStrainsViewStore.ts Zustand store for strains view UI state
    useIotStore.ts        Zustand store for IoT device UI state
    sensorStore.ts        Zustand vanilla store for real-time sensor data
    useAlertsStore.ts     Zustand store for proactive smart coach alerts
    selectors.ts          Memoized selectors (map-based cache by ID)
    listenerMiddleware.ts Side effects: i18n sync, persistence triggers
    slices/               19 Redux slices (simulation, settings, strains, workerMetrics, hydro, grows, problemTracker, etc.)
    indexedDBStorage.ts   CannaGuideStateDB adapter

  services/
    aiFacade.ts           Public AI entry point (re-exports aiService, aiProviderService, localAIInfrastructure)
    geminiService.ts      Gemini API abstraction (responseSchema)
    aiProviderService.ts  Multi-provider AI routing (BYOK, imports configs from @cannaguide/ai-core)
    aiService.ts          Unified cloud + local AI entry point
    local-ai/             Layered Local AI stack (ADR-0011)
      index.ts            Public barrel re-export
      interfaces.ts       TypeScript interface contracts (20+)
      core/               Facade, infrastructure singleton, inference router
      models/             Model lifecycle, loaders, WebLLM, preload orchestrator
      inference/          Inference queue, streaming, prompt handlers
      vision/             Diagnosis, image similarity, plant disease model
      nlp/                NLP pipelines, embeddings, language detection, RAG cache
      device/             GPU manager, WebGPU, health, eco mode, preload service
      cache/              IndexedDB inference cache, progress emitter
      telemetry/          Inference telemetry, fallback tracking
      fallback/           Heuristic fallback service (~1600 LOC)
    gpuResourceManager.ts (stub -> local-ai/device/)
    crdtService.ts        Y.Doc lifecycle, differential encoding, divergence detection
    crdtSyncBridge.ts     Bidirectional Redux <-> Y.Doc bridge (batching, loop detection, telemetry)
    uiStateBridge.ts      Redux ↔ Zustand bridge for services/Zustand actions (ADR-0015)
    crdtAdapters.ts       Zod-validated type adapters (Plant, JournalEntry, NutrientSchedule, EcPhReading)
    syncService.ts        CRDT-aware Gist sync (push/pull/force), legacy JSON migration, E2EE
    proactiveCoachService.ts  Smart coach: threshold monitoring + AI advice + cooldown
    knowledgeCalculatorService.ts  Terpene entourage, transpiration, EC/TDS, light spectrum, cannabinoid ratio
    dbService.ts          CannaGuideDB (strains, images, search index)
    cryptoService.ts      AES-256-GCM key encryption at rest
    privacyService.ts     GDPR Art. 17/20 -- full erasure + data export
    pluginService.ts      Plugin architecture (nutrient, hardware, grow)
    sentryService.ts      Sentry error tracking
    consentService.ts     GDPR consent cookie management

  data/                   Static data: 776 strains, FAQ, lexicon (91 entries, 6 categories), guides, diseases (22 entries), learningPaths (5 paths)
  locales/                i18n translations: en/, de/, es/, fr/, nl/
  hooks/                  28 custom React hooks
  workers/                Web Workers: VPD sim, genealogy, scenarios, inference, image gen, hydro forecast, terpene, vision inference, calculation, voice
  services/workerBus.ts   Centralized promise-based WorkerBus (11 workers, priority queue, timeout)
  utils/priorityQueue.ts  Generic min-heap PriorityQueue<T> with WorkerPriority type
  services/ragEmbeddingCacheService.ts  Persistent IndexedDB LRU embedding cache (MiniLM-L6, model versioning, telemetry)
  services/equipmentCalculatorService.ts  Pure-formula service: CO2, Humidity Deficit, Light Hanging Height (Zod-validated)
  utils/                  Shared utilities (secureRandom, etc.)
  types/                  Zod schemas for AI response validation
  lib/                    cn() utility, VPD calculation library
  public/                 Static assets, sw.js, manifest.json
  tests/                  E2E (tests/e2e/) + Component tests (tests/ct/)

packages/
  ai-core/                Shared AI types, provider configs, key validation, ML isolation
    src/
      index.ts            Re-exports types, configs, validation, Zod schemas
      providers.ts        PROVIDER_CONFIGS map, isKeyRotationDue, isValidProviderKeyFormat
      schemas.ts          Zod schemas for AI response validation
      types.ts            AI response types (AIResponse, PlantDiagnosisResponse, etc.)
      ml.ts               Lazy loaders: loadTransformers(), loadWebLlm(), loadGenAI()
  ui/                     Shared design system tokens + Tailwind preset
    src/
      theme.ts            Theme type + ThemeTokens interface
      tokens.css          9 cannabis theme CSS custom properties (478 lines)
      tailwind-preset.cjs Shared Tailwind preset (colors, keyframes, animations)
  iot-mocks/              ESP32 sensor mock server (port 3001)

scripts/                  Build, lint, merge, CI scripts
docker/                   IoT mock servers (ESP32 sensor simulator)
```

---

## State Management Paradigm

The app uses a **dual-store architecture** with clear separation of concerns. Do **not** introduce a third state library. Long-term consolidation may migrate slices to a single system; until then, follow the matrix below.

**Redux Toolkit (19 slices, persisted in IndexedDB):**
Simulation, settings, userStrains, favorites, notes, archives, savedItems, knowledge, breeding, sandbox, genealogy, nutrientPlanner, grows, problemTracker, metrics, hydro, growPlanner, diagnosisHistory, workerMetrics (runtime-only). Plus RTK Query (`geminiApi`) for AI API caching with 9 endpoints.

**Zustand (9 stores, transient/never persisted):**
`useUIStore` (views, modals, notifications, onboarding, voice control), `useTtsStore` (TTS queue, speaking state), `useVoiceStore` (voice session state, mode, transcriptHistory, confirmationPending, error), `useFiltersStore` (filter/sort UI), `useStrainsViewStore` (strains view), `useIotStore` (IoT devices -- localStorage persist for MQTT config), `sensorStore` (real-time sensor data), `useAlertsStore` (proactive smart coach alerts), `useCalculatorSessionStore` (shared room/light session across calculator suite).

**Rules:**

- New **domain / persisted** state → Redux slice (+ migration if shape changes).
- New **UI-only / ephemeral** state → Zustand store.
- No Zustand `persist` middleware — persistence is Redux + IndexedDB only.
- **No cross-imports:** Zustand stores must not import Redux selectors/actions; Redux must not read Zustand except via explicit bridge hooks at the UI layer (e.g. `getUISnapshot()` when persisting minimal UI fields into the Redux persist blob).

**Redux ↔ Zustand bridge (ADR-0015):** `uiStateBridge.ts` provides `getReduxSnapshot`, `dispatchToRedux`, and `subscribeToRedux` for Zustand actions and plain services. Initialized from `store.ts` via `initUIStateBridgeFull`. Do not import the Redux store from Zustand store modules.

### State ownership decision matrix

| Question                                                        | If yes →                                         | If no → |
| --------------------------------------------------------------- | ------------------------------------------------ | ------- |
| Must survive reload / sync to cloud?                            | Redux                                            | Zustand |
| Represents plants, grows, simulation, settings, equipment data? | Redux                                            | Zustand |
| Modal open, tab, toast, voice HUD, filter chips?                | Zustand                                          | Redux   |
| Shared across views but only for current session?               | Zustand                                          | Redux   |
| Needed by Web Workers without React?                            | Redux or service layer                           | Zustand |
| MQTT password / device UI config?                               | `useIotStore` (Zustand + encrypted side channel) | —       |

**Safe recovery:** Corrupted Redux persist triggers `bootstrap/recovery.ts` (`triggerSafeRecovery`) and clears `REDUX_STATE_KEY` in IndexedDB. Zustand stores reinitialize empty on reload; they are not cleared separately by design.

**Known overlap audit (2026-05):** No Zustand store should duplicate entities already in `simulationSlice` / `growsSlice`. `useUIStore.lastActiveView` is intentionally mirrored into the Redux persist payload for boot continuity only.

## Multi-Grow Architecture

Plants are grouped into **grows** (max 3, enforced by German CanG). Each `Plant` carries a `growId` linking it to a `Grow` entity managed by `growsSlice` (EntityAdapter). A default grow (`default-grow`) is seeded on first boot and during migration v5->v6.

- **growsSlice** -- CRUD for grows with MAX_GROWS=3 hard cap
- **Grow-scoped selectors** -- `selectPlantsForGrow`, `selectNutrientScheduleForGrow` (Map-cached)
- **Grow environment actions** -- `setGrowEnvironment`, `copyGrowEnvironment` (simulationSlice)
- **Migration v5->v6** -- stamps `growId` on all existing plants/schedule entries
- **ADR-0005** documents the architecture decision

## AI Service Architecture

All AI capabilities are exposed through a single facade (`aiFacade.ts`):

- **`aiService`** -- routed cloud/local AI methods (diagnose, chat, embed, etc.)
- **`aiProviderService`** -- multi-provider BYOK key management (imports configs from `@cannaguide/ai-core`)
- **`localAIInfrastructure`** -- unified cache + telemetry + preload class (`LocalAIInfrastructure.ts`)
- **`setAiMode` / `getAiMode` / `isEcoMode`** -- execution mode helpers

Components and hooks must import from `aiFacade`, not from individual service files.

## Voice Architecture (v1.8 CannaVoice Pro)

Voice interaction is a layered system with 5 subsystems:

- **Wake-Word Detection:** dual engine -- regex hotword (`HOTWORD_REGEX` in `VoiceControl.tsx`) or Porcupine WASM (`porcupineWakeWordService.ts`). Porcupine runs 100% on-device with no data leaving the client. Requires BYOK AccessKey.
- **Speech Recognition:** Web Speech API (`SpeechRecognition`), with mic stream routed through `VoiceControl.tsx`. Transcript cleaning via `voiceWorker.ts` (filler removal, normalization).
- **Voice Orchestrator:** `voiceOrchestratorService.ts` -- finite state machine (IDLE/LISTENING/PROCESSING/SPEAKING/CONFIRMATION). Matches commands via `voiceCommandRegistry`, executes actions, and handles confirmation flows.
- **TTS Pipeline:** `ttsService.ts` routes through `speakNatural()` for text normalization (abbreviation expansion, markdown stripping, unit conversion), then dispatches to WebSpeech or `cloudTtsService.ts` (ElevenLabs BYOK, AES-256-GCM encrypted key).
- **Telemetry:** `voiceTelemetryService.ts` -- opt-in anonymous analytics (no PII/transcripts). Ring buffer (500 events), localStorage persistence, per-metric snapshots.
- **Voice Worker:** `voiceWorker.ts` -- off-main-thread transcript processing (filler removal, command matching via Levenshtein + keyword scoring, waveform computation).
- **VoiceHUD:** `VoiceHUD.tsx` -- dynamic waveform visualization via `AnalyserNode` when voice worker is enabled, CSS animation fallback otherwise.

## Monorepo Package Responsibilities

- **`@cannaguide/ai-core`** -- Canonical source for AI provider types (`AiProvider`, `AiProviderConfig`), `PROVIDER_CONFIGS` map, key validation (`isKeyRotationDue`, `isValidProviderKeyFormat`), Zod schemas for AI response validation, lazy ML loaders, and the **Model Registry** (canonical local AI model catalog with version tracking, GPU-tier selection, and deprecation flags). ML dependencies are `optionalDependencies` to isolate heavy binaries.
- **`@cannaguide/ui`** -- Design system tokens: 9 cannabis theme CSS custom properties (`tokens.css`), shared Tailwind preset with colors, keyframes, animations, and shadows (`tailwind-preset.cjs`), theme TypeScript types.

### Type Bridge Pattern

Domain types (120+ types: Plant, Strain, Grow, HydroReading, DiagnosisRecord, etc.) are defined canonically in `@cannaguide/ai-core/src/domain/` (10 files + barrel). The web app's `apps/web/types.ts` (583 lines) re-exports all domain types from `@cannaguide/ai-core` and adds UI-only types that belong exclusively to the web layer:

- **In ai-core (domain):** All data model types (Plant, Strain, Grow, JournalEntry, enums, etc.)
- **In web/types.ts (UI-only):** View/Tab enums, AppSettings, SimulationState, VoiceSessionState, Command palette, filter/sort types

Components import from `@/types` -- the bridge ensures a single import path with zero duplication.

### Model Registry

`packages/ai-core/src/modelRegistry.ts` provides the canonical catalog of all supported local AI models with metadata: version, size, GPU tier requirements, checksums, deprecation flags. The web app's `webLlmModelCatalog.ts` derives its `WEB_LLM_MODELS` array from the registry via backward-compatible mapping. Telemetry auto-resolves `modelVersion` from the registry for every inference record.

### Bundle Budget Enforcement

`scripts/check-bundle-budget.mjs` enforces gzip **and** brotli size limits on all JS chunks:

- Main chunk: < 300 KB gzip / < 280 KB brotli
- Vendor chunks: < 500 KB gzip / < 450 KB brotli
- Exempt: ai-runtime, strains-data, three, locale-\* (lazy-loaded)

On violation, the script suggests running `pnpm build:analyze` for treemap inspection.

## WorkerBus Architecture

The `workerBus.ts` singleton provides centralized, promise-based communication with all 11 Web Workers:

- **Priority Queue:** min-heap with 4 levels (`critical` > `high` > `normal` > `low`), FIFO tiebreaking
- **Backpressure:** max 3 concurrent dispatches per worker, queued beyond that
- **Dynamic Concurrency (W-01.1):** auto-scales concurrency per device hardware via `deviceCapabilities.ts` (`hardwareConcurrency * 0.6`, clamped [2, 12]). Battery-aware halving below 20%. Toggle: `setDynamicConcurrency()`
- **Priority Preemption (W-02):** when all slots are full and a higher-priority job arrives, the lowest-priority running job is preempted (AbortController-based, main-thread only) and automatically re-queued (max 3 retries before PREEMPTED rejection)
- **Cooperative Preemption (W-02.1):** `__CANCEL__` message sent to worker on preemption. `workerAbort.ts` intercepts in worker, `checkAborted(messageId)` throws in loops for early termination. All 11 workers updated.
- **Per-Worker Rate Limiting (W-01):** sliding-window limiter (`setRateLimit`/`getRateLimit`), rejects with non-retryable `RATE_LIMITED` error
- **Telemetry Export (W-03):** `exportTelemetry()` returns JSON-serializable `WorkerBusTelemetryExport` with per-worker snapshots (peakLatencyMs, errorRate, timestamps, preemptionCount, cooperativePreemptions, concurrencyLimit), integrated with Sentry context (60s interval)
- **Cross-Worker Channels (W-04):** `createChannel(workerA, workerB)` creates a MessageChannel and transfers ports to both workers via `__PORT_TRANSFER__` message; `closeChannel()` tears down; auto-cleanup on unregister/dispose. `WorkerMessageMap` in `workerBus.types.ts` maps worker names to per-message payload/response types; `dispatch()` overloads enforce compile-time type safety for typed workers
- **SharedArrayBuffer (W-03 COEP):** Progressive enhancement via COEP `credentialless` (ADR-0009). `crossOriginIsolation.ts` detects, `sharedBufferPool.ts` acquires/releases SAB or ArrayBuffer fallback
- **AtomicsChannel (W-04.1):** Lock-free main-worker signaling via SAB + Int32Array + Atomics (8 slots: 2 signal + 6 data). Falls back to null when SAB unavailable
- **Lock-Free Ring Buffer (W-05):** SPSC ring buffer on SAB for high-frequency data streaming. Power-of-2 capacity, bitmask arithmetic, batch push/pop, blocking `waitForData()`
- **Worker Pool (W-06):** `workerPool.ts` provides centralized lifecycle management -- lazy spawning via `getOrCreate()`, 45s idle timeout with `release()`, hot-worker exemption (VPD, voice), device-aware pool sizing via `getMaxPoolSize()`. Factory registry in `workerFactories.ts` with 10 entries. SAB hot-path auto-init on spawn for hot workers (AtomicsChannel + LockFreeRingBuffer). Pool metrics (active/idle/spawned/terminated) flushed to Redux DevTools + Sentry. See ADR-0010.
- **Abort Support:** AbortController per dispatch, automatic cleanup on cancel
- **Transferable Objects:** zero-copy transfers for ArrayBuffer/ImageBitmap payloads
- **State Sync:** `workerStateSyncService.ts` auto-wires dispatch results to Redux/Zustand via handler registry
- **Telemetry Service:** `workerTelemetryService.ts` connects to Sentry (10% error-rate alerts) and Redux DevTools (5s debounced `workerMetricsSlice`)

Workers: VPD simulation, genealogy, scenario, inference, image generation, hydro forecast, terpene, vision inference, calculation, voice, simulation.

## Hydro Monitor Architecture

Real-time hydroponic monitoring with predictive capabilities:

- **`hydroSlice.ts`** -- Redux slice: pH/EC/Temp readings FIFO (168 cap), thresholds, alerts, system type
- **`HydroMonitorView.tsx`** -- Dashboard UI: gauge cards, Recharts pH/EC trend chart, manual input form, alerts, dosing reference panel
- **`hydroForecastService.ts`** -- ONNX worker dispatch with moving-average fallback, trend detection, alert generation
- **`hydroForecastWorker.ts`** -- Off-main-thread ONNX inference: pH/EC/Temp prediction, WASM backend, weighted moving average fallback

## Leaf Diagnosis Architecture

Vision AI plant disease detection pipeline:

- **`plantDiseaseModelService.ts`** -- PlantVillage MobileNetV2 ONNX model: IndexedDB caching, download with progress, HEAD check, `ensureWorkerRegistered()`
- **`visionInferenceWorker.ts`** -- Off-main-thread ONNX inference: 38-class PlantVillage labels, `CANNABIS_MAP`, `preprocessImage()` (ImageNet CHW), `mapToCannabisTerm()`, WorkerBus INIT/CLASSIFY/TERMINATE
- **`LeafDiagnosisPanel.tsx`** -- UI: model status bar, drag-zone upload, camera capture, analyze button, results card with severity badge and RAG-enriched recommendations
- **`localAiDiagnosisService.ts`** -- Orchestration: `classifyLeafImage`, `classifySeverity`, `enrichWithKnowledge`

---

## Data Flow

### Offline-First Persistence

All user data lives in IndexedDB. The Service Worker uses Network-First for navigation and Cache-First for assets. Background Sync queues offline actions.

**Dual IndexedDB Pattern:**

1. **CannaGuideStateDB** -- Redux state snapshot
    - Promise-locked hydration on boot
    - Debounced save (1s) via listener middleware
    - Force-save on `visibilitychange`
    - Corrupted state -> auto-clear + safe recovery (session flag prevents loops)

2. **CannaGuideDB** -- Domain data
    - Strains, images (auto-pruned), full-text search index
    - Offline actions queue
    - Exponential backoff retry on write failures (3 retries, 500/1000/2000ms)

**Persisted-state version contract** (`services/migration/migrateStateOrchestrator.ts`, GH #666):

- Every start copies the stored snapshot to the `-backup` key before migration. The copy is replaced on the next start, so it is a one-start safety net, not an archive.
- A snapshot carries `_sliceVersions`. A slice stored under a version other than `SLICE_SCHEMA_VERSIONS` (older or newer) is **kept**, not deleted. Only the transient `ui` slice may be dropped.
- A kept slice goes through the same shape guards as a current one and is restamped with the current version on the next save (`bootstrap/persistence.ts`). There is no per-slice transform: the guards normalise the stored shape (fill missing fields, patch legacy plant fields) but do not convert between schema versions.
- A kept slice that held data and holds none after the guards fails hydration (`TypeError`). `createAppStore` then tries the backup and, if that fails too, writes the original bytes once to the `-quarantine` key (credentials redacted, never replaced by a later snapshot) before it removes the primary; if that write fails, or the primary no longer holds the snapshot that failed (another tab saved since), the primary stays. Quarantine, comparison and removal run in one exclusive cross-tab section where Web Locks and the recovery epoch are available (without Web Locks they run on the shared write path every persistence write uses, which has no cross-tab exclusion either), image pruning treats the quarantined text as a reference source, and Reset all data removes the key. Recovering from the quarantine key is manual; there is no UI for it yet.
- Not covered: a guard that drops only part of a slice, and an entity inside a kept slice that lacks a field its consumers read (for example a user strain without `name`). The only slice-version bump in the history is `simulation` 2 -> 3 (`e90756bc`, 2026-04-07).

**One writer tab** (`bootstrap/writerOwnership.ts`, `bootstrap/mountHydratedApp.ts`, GH #669): every tab holds its own Redux store and saves the whole snapshot under one key, so two tabs would overwrite each other's edits, and an idle tab too, because its simulation keeps dispatching. Before it starts the store, the recovery handler or any save, a tab asks the Web Lock `cannaguide.persisted-state.writer`. The first tab gets it and keeps it until the page is gone. A tab that does not get it within 1.5 s (long enough that a reload is not locked out by the page it replaces) is a reader: it renders a notice, starts no store, no recovery handler and no save, and reloads itself once the lock is free. A tab whose own start fails stops saving and then gives the role up before it shows the error, so it neither keeps the others behind the notice nor overwrites the next writer. A writer page that is restored from the back/forward cache (WebKit drops its lock then) stops saving and reloads, so it claims the role again; a write that was already frozen in flight at that moment is not covered. Not covered by the lock alone: browsers without Web Locks (the role is `unsupported`; the revision check below is their protection), a writer that stays open but hidden still blocks the others, and the lock cannot hold a page open: the save started on `pagehide` is best effort (it may not finish before the page is destroyed, as before this change), so the next writer can hydrate a snapshot that misses the last edits made just before the tab closed. There is no "take over" action yet.

**Stale-snapshot check** (`stores/snapshotRevision.ts`, `stores/indexedDBStorage.ts` `setItemIfRevision`, GH #669): next to the snapshot, the key `cannaguide-redux-storage-revision` holds a random token that changes with every revision-aware save. A page reads it before it reads the snapshot (so a save in between makes it stale, never the reverse) and remembers it; a page that finds none stores one of its own at once, so "no token" is never what a save expects; every revision-aware save is one IndexedDB readwrite transaction that reads the token, compares it with the remembered one, and only then writes the snapshot and a new token. IndexedDB serializes such transactions across tabs, so of two overlapping saves exactly one is applied, with or without Web Locks. A refused save writes nothing; the page stops saving, gives the writer role up and shows a notice asking for a reload (`common.staleTab`), and the edits that page had not saved are discarded by that reload. A full erase of the database removes the token too, so a tab that was open during it (and expects the token it stored) is refused instead of writing its old state back. A page refused during start, before the post-hydration services begin, starts none of them except the local-only privacy step; a refused page also switches Sentry off in every case, because the settings it holds may be older than another tab's (local-only mode may have been switched on there); one refused later keeps the services it already started (they do not save) until the reload. Deliberate replacements of the snapshot (import, restore and repair in `services/persistedStateService.ts`, safe recovery in `bootstrap/recovery.ts`, Reset all data) go through `replaceSnapshot`, which does not check the token but stores a new one in the same transaction, so every other tab is refused at its next save, and so is the replacing page itself (its `pagehide` save during the reload must not undo the replacement), except for the repair at start and the rollback of a failed safe recovery, which keep running (the page follows the new token only if it was up to date; an already stale page does not). The repair at start (`repairSnapshot`) is conditional as well: if another tab saved since the page read the revision, it writes nothing and throws `StaleSnapshotError`, so the page starts without the repair and its first save is refused instead of replacing the newer save with the backup. Reset all data also stops this page's saves before it reloads. The narrow slice reset (`updatePrimaryPersistedSnapshot`) is a read-modify-write through `updateSnapshot`: it reads the token before the snapshot and writes only while that token is still stored, so a save by another tab in between makes it fail with `StaleSnapshotError` instead of being overwritten, and the page handles that like a refused save (`setStaleSnapshotHandler`: stop saving, give the role up, show the reload notice). The startup quarantine in `services/snapshotQuarantine.ts` removes an unreadable primary through `removeSnapshotIfCurrent`, which is conditional like the repair: if another tab saved since the page read the revision, the primary stays. A page that started without the check (its revision could not be read or stored) may write only while it holds the writer lock (`setUncheckedWritePermit(holdsWriterRole)`, registered by `bootstrap/mountHydratedApp.ts`; the permit is closed until then): with the lock, the repair and the removal are unconditional and the page starts checking from there; without it, neither writes anything, and the start stops right after hydration, before the first edit, with a `common.unverifiedTab` notice and a reload (same stop as a refused save: no saving, role released, Sentry off). Any unchecked save that still reaches `writeSnapshot` without the lock throws `UnverifiedSnapshotError` (a `StaleSnapshotError`) and writes nothing. A page that started without the check (its revision could not be read) is armed by a replacement or an update with a token that never matches, so its `pagehide` save is refused too. Not covered: a page without the check that holds the writer lock saves unchecked until its first replacement or update (the lock is then the only guard, with the limits listed under One writer tab); a save that was committed but whose completion the page never saw is refused on the next try (a false alarm, never a lost write); and the refused page's own unsaved edits are not kept anywhere.

Additional databases: `CannaGuideSecureDB` (crypto keys), `CannaGuideTimeSeriesDB` (IoT sensors), `CannaGuideLocalAiCache` (inference), `CannaGuideImageGenCache` (generated images), `CannaGuideReminderDB` (SW reminders).

### CRDT Sync Layer (Yjs)

Multi-device conflict resolution uses [Yjs](https://github.com/yjs/yjs) CRDTs with automatic merge. The `sync` Vite chunk (~80 KB) is lazy-loaded after Redux hydration.

**Y.Doc schema (`cannaguide-crdt-v1`):**

| Map name            | Key        | Value                   |
| ------------------- | ---------- | ----------------------- |
| `plants`            | plantId    | Y.Map of plant fields   |
| `nutrient-schedule` | scheduleId | Y.Map of schedule entry |
| `nutrient-readings` | readingId  | Y.Map of EC/pH reading  |
| `settings`          | settingKey | Primitive value         |

**Boot order:** IndexedDB hydration -> Redux ready -> `crdtService.initialize()` -> `initCrdtSyncBridge(store)` -> bridge attaches observers.

**Bidirectional bridge:**

- Redux -> CRDT: listener middleware intercepts plant/nutrient actions, enqueues writes via 100ms batch debounce, flushed as a single `doc.transact()` (skipped when `action.meta.fromCrdt === true`)
- CRDT -> Redux: Y.Map observers dispatch `upsertPlant`/`removePlant` with `{ meta: { fromCrdt: true } }` (skipped when transaction origin is `'redux-bridge'`)

**Differential encoding:** `encodeSyncPayload()` uses the stored remote state vector (captured after each pull) to produce delta-only updates. Falls back to full-state encoding when no remote state vector is available (first sync or after `forceLocalToGist`).

**CRDT telemetry:** `reportCrdtTelemetry()` accumulates divergence count, sync payload bytes, conflicts resolved, and last sync duration. Metrics are pushed fire-and-forget to WorkerBus W-03 via `setCrdtMetrics()` and included in `exportTelemetry()`.

**Failure isolation:** CRDT failure does not crash the app. All initialization and observation is `try/catch` wrapped. See [ADR-0004](adr/0004-crdt-yjs-offline-sync.md).

### AI Pipeline

```
User Input
    |
    v
aiFacade.ts  -->  aiService.ts  -->  Cloud available?  --yes-->  aiProviderService.ts
                      |                                               |
                      no                                         geminiService.ts / openai / xai / anthropic
                      |                                               |
                      v                                               v
                  localAI.ts  -->  WebLLM available?             Structured JSON (responseSchema)
                      |               |
                      no             yes --> gpuResourceManager.ts (mutex)
                      |               |
                      v               v
                  Transformers.js   @mlc-ai/web-llm (WebGPU)
                      |
                      no model?
                      |
                      v
                  localAiFallbackService.ts (heuristics)
```

**Concurrency Controls:**

- GPU Mutex (`gpuResourceManager.ts`): FIFO queue between `webllm` and `image-gen`
- Model Loader Semaphore: max 3 concurrent ONNX pipeline loads
- Inference Queue: max 1 concurrent inference task (priority-based)
- Rate Limiter: 15 req/min sliding window for cloud AI

**Eco-Mode:** When `settings.localAi.ecoMode` is true, `getModelRecommendation()` forces WASM backend, smallest model (0.5B q4), disables WebLLM and image generation.

> **API Reference:** See [docs/api/](api/) for detailed method signatures: [AI Facade](api/ai-facade.md), [AI Providers](api/ai-providers.md), [CRDT Sync](api/crdt-sync.md), [Equipment Calculators](api/equipment-calculators.md), [Local AI Infrastructure](api/local-ai-infrastructure.md), [Proactive Coach](api/proactive-coach.md), [RAG Pipeline](api/rag-pipeline.md), [WorkerBus](api/worker-bus.md).

### Plugin System

Declarative plugins stored in IndexedDB (no code execution):

- **Nutrient Schedule** -- brand schedules with weekly EC/pH targets
- **Hardware** -- MQTT/HTTP device commands (Shelly, Sonoff)
- **Grow Profile** -- pre-configured grow recipes

Nutrient plugins integrate with `nutrientPlannerSlice` via `applyPluginSchedule` action.

---

## Security Model

| Measure          | Implementation                                                       |
| ---------------- | -------------------------------------------------------------------- |
| XSS Prevention   | DOMPurify v3 on all `dangerouslySetInnerHTML`                        |
| External Links   | `rel="noopener noreferrer"` enforced                                 |
| API Key Storage  | AES-256-GCM encryption at rest (cryptoService.ts)                    |
| Image Privacy    | EXIF/GPS stripping before AI transmission                            |
| Prompt Injection | 30+ regex patterns block injection attempts                          |
| CSP              | Hardened across 3 paths (`'self' 'unsafe-inline' 'wasm-unsafe-eval') |
| Local-Only Mode  | All outbound services check `isLocalOnlyMode()`                      |
| Randomness       | `secureRandom()` via Web Crypto (no Math.random)                     |
| GDPR             | Full data export (Art. 20) + erasure (Art. 17) via privacyService.ts |
| CI Security      | Semgrep, Gitleaks, Grype, Trojan-source, pnpm audit, Snyk            |
| Fuzzing          | ClusterFuzzLite on PRs                                               |

---

## Supply-Chain Security

| Measure            | Implementation                                                          |
| ------------------ | ----------------------------------------------------------------------- |
| SLSA Provenance    | Level 1 via GitHub-native `attest-build-provenance` + `attest-sbom`     |
| CycloneDX SBOM     | Generated by `anchore/sbom-action` (Syft), signed via `attest-sbom`     |
| Dependency Pinning | SHA-pinned GitHub Actions (`actions/checkout@<sha>`, etc.)              |
| Release Pipeline   | 2-job isolation: build+SBOM -> release (attestation + provenance)       |
| Verification (L1)  | `gh attestation verify cannaguide-*.tar.gz --repo qnbs/CannaGuide-2025` |
| Release Assets     | Tarball + SBOM + GitHub build attestation                               |

---

## ADR: CSP strict-dynamic for SSR / Edge (v2.0)

**Status:** Proposed (Session 177)  
**Context:** Static PWA uses `unsafe-inline` in CSP (S-03 Won't Fix for v1.x). v2.0 Digital Twin platform may add Cloudflare Workers or Vercel Edge SSR.

**Decision (pending v2.0):**

1. Serve HTML from edge with per-request nonce: `script-src 'nonce-{random}' 'strict-dynamic'`.
2. Evaluate `vite-plugin-csp` or `@edge-csrf` during SSR migration.
3. Add SRI hashes for all emitted chunks via `vite-plugin-sri` on production builds.
4. Remove `unsafe-inline` only after nonce pipeline is verified in staging.

**Consequences:** Requires build-time nonce injection and edge middleware; PWA offline shell may need hybrid static + edge routes.

---

## Build and Deployment

```bash
pnpm run dev              # Vite dev server (localhost:5173)
pnpm run build            # Production build (Vite 7 + PWA manifest injection)
pnpm test                 # Vitest unit/integration (2812 tests)
pnpm run test:e2e         # Playwright E2E
pnpm run test:ct          # Playwright Component tests
pnpm run lint:full        # ESLint entire project
pnpm exec tsc --noEmit         # Type check (strict, zero any)
pnpm run security:scan    # Full security scan suite
pnpm run pr:push          # Push via automated PR workflow
```

**Bundle Strategy:**

- Manual chunks via `CHUNK_GROUPS` in `vite.config.ts` (Three.js, AI runtime, etc.)
- All heavy components use `React.lazy()` + `Suspense`
- AI models loaded via dynamic import only when needed
- React Compiler (`babel-plugin-react-compiler`) auto-memoizes components

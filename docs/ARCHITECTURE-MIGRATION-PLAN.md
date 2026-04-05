# Architecture Migration Plan

<!-- Audited: Session 62 (2026-04-05) -->

## Context

The monorepo has 99 non-test service files in `apps/web/services/`. This document
assesses which services could theoretically be moved to shared packages and
establishes that the current architecture is correct for the project's needs.

## Decision: No Service Migrations Required

After thorough analysis (Session 62), the current placement is **architecturally
correct**. The package boundary between `apps/web` and `packages/ai-core` is clean:

- `@cannaguide/ai-core` contains **shared contracts** (types, schemas, provider
  configs, lazy ML loaders) -- platform-independent, zero browser dependencies.
- `apps/web/services/` contains **implementations** that depend on browser APIs,
  IndexedDB, Web Workers, Redux, Zustand, Sentry, and other runtime infrastructure.

Moving implementations into `ai-core` would create browser dependency coupling in
a package designed to be platform-independent.

## Service Classification

### NOT MOVABLE (95 services)

These depend on one or more browser/framework APIs:

| Dependency    | Services Using It                                                      | Example                           |
| ------------- | ---------------------------------------------------------------------- | --------------------------------- |
| IndexedDB     | localAiCacheService, ragEmbeddingCacheService, indexedDbMonitorService | Persistent inference cache        |
| localStorage  | localAiTelemetryService, localAiPreloadService                         | Telemetry snapshots               |
| Browser APIs  | localAiHealthService, localAiWebGpuService                             | navigator.gpu, performance.memory |
| Web Workers   | workerBus, inferenceQueueService, all 8 workers                        | Worker communication              |
| Sentry        | 20+ services via captureLocalAiError                                   | Error tracking                    |
| Redux/Zustand | proactiveCoachService, uiStateBridge, all slices                       | State management                  |
| DOM/React     | All component-facing services                                          | UI integration                    |

### PARTIALLY MOVABLE (3 services)

Pure inference logic exists but is tightly coupled to worker infrastructure:

| Service                         | Movable Logic         | Blocker                                      |
| ------------------------------- | --------------------- | -------------------------------------------- |
| localAiEmbeddingService         | Embedding computation | Depends on inferenceQueueService (worker)    |
| localAiNlpService               | NLP pipeline logic    | Depends on inferenceQueueService + DOMPurify |
| localAiLanguageDetectionService | Detection heuristics  | Depends on inferenceQueueService             |

**Effort to move:** Extract pure logic into ai-core utility functions, keep worker
orchestration in apps/web. Requires interface abstraction layer. Estimated: 2-3
sessions of work for marginal architectural benefit.

### MOVABLE (1 service)

| Service                | Current Location   | Why Movable                                     |
| ---------------------- | ------------------ | ----------------------------------------------- |
| localAiFallbackService | apps/web/services/ | Pure heuristic logic, no browser/framework deps |

**Blocker for migration:** Imports 15+ types from `apps/web/types.ts` (Plant,
Strain, Recommendation, GrowTip, etc.). Moving the service requires either:

1. Relocating all consumed types to `@cannaguide/ai-core/types` (massive scope)
2. Creating a parallel type definition in ai-core (duplication risk)

**Cost/benefit:** High effort, low reward. The service works correctly in its
current location. Boundary is already ESLint-enforced.

## Future Work (If Needed)

If the project adds a second consumer (e.g., a CLI tool, mobile-native app, or
server-side rendering), these migrations become worthwhile:

### Priority 1: Type Consolidation

- Move core domain types (Plant, Strain, GrowPhase) to `@cannaguide/ai-core`
- Keep UI-specific types (View, Theme, Modal) in `apps/web`
- Estimated: 1-2 sessions

### Priority 2: Heuristic Service Extraction

- Move `localAiFallbackService` to `@cannaguide/ai-core`
- Requires Priority 1 completion
- Estimated: 1 session

### Priority 3: Inference Interface Abstraction

- Define `InferenceRunner` interface in ai-core
- Implement browser-specific runner in apps/web
- Move embedding/NLP pure logic to ai-core
- Estimated: 2-3 sessions

## Package Export Health

| Package             | Exports Configured                                                 | Status  |
| ------------------- | ------------------------------------------------------------------ | ------- |
| @cannaguide/ai-core | `.` (types+providers+schemas), `./ml` (lazy loaders)               | Correct |
| @cannaguide/ui      | `.` (theme types), `./tailwind-preset` (CJS), `./tokens.css` (CSS) | Correct |
| @cannaguide/desktop | N/A (Tauri wrapper, no TS exports)                                 | Correct |

# ADR-0011: Local AI Stack Restructuring

- **Status:** Accepted
- **Date:** 2025-06-10
- **Decision Makers:** @qnbs

## Context

The Local AI stack grew to 29 source files (approx. 5,000 LOC) in a flat
`apps/web/services/` directory. All files shared the `localAi*` prefix
convention, but there was no structural boundary between infrastructure,
models, inference, vision, NLP, caching, telemetry, and device layers.
Discoverability, testability, and onboarding cost were impacted.

## Decision

Restructure the Local AI services into a layered directory tree under
`apps/web/services/local-ai/` with nine sub-directories:

| Layer        | Purpose                                                |
| ------------ | ------------------------------------------------------ |
| `core/`      | Facade, infrastructure singleton, inference router     |
| `models/`    | Model lifecycle, loaders, WebLLM, preload orchestrator |
| `inference/` | Inference queue, streaming, prompt handlers            |
| `vision/`    | Diagnosis, image similarity, plant disease model       |
| `nlp/`       | NLP pipelines, embeddings, language detection, RAG     |
| `device/`    | GPU manager, WebGPU, health, eco mode, preload service |
| `cache/`     | IndexedDB inference cache, progress emitter            |
| `telemetry/` | Inference telemetry, fallback tracking                 |
| `fallback/`  | Heuristic fallback service                             |

Additions:

- `interfaces.ts` -- canonical TypeScript interface contracts (20+)
- `index.ts` -- public barrel re-export for external consumers

All 29 original files retain backward-compatible re-export stubs at their
old paths so that external consumers (`aiService.ts`, `aiFacade.ts`,
components, hooks, workers) continue to resolve without changes. Stubs
are scheduled for removal in Phase 3 (v2.0).

## Consequences

### Positive

- Clear architectural layers with single-responsibility directories
- Test files co-located next to source (26 test files moved)
- `interfaces.ts` enables DI-based testing and future service swaps
- `index.ts` barrel provides a single canonical import point
- Zero breaking changes -- all 2253 tests pass, typecheck clean, build OK

### Negative

- 29 backward-compat stubs are temporary tech debt (Phase 3 removal)
- ESLint `no-restricted-imports` rules needed to enforce boundaries
- Developers must learn new directory layout

### Neutral

- Services remain in `apps/web/services/local-ai/` (not `packages/ai-core`)
  because 15+ services import app-level types (Plant, Strain, workerBus)

## Alternatives Considered

1. **Move to `packages/ai-core/`**: Rejected -- circular dependencies with
   app-level types. Would require extracting 50+ types first.
2. **Feature-based grouping** (per AI feature): Rejected -- most services are
   shared infra, not feature-specific.
3. **No refactoring**: Rejected -- flat directory with 50+ files is
   unsustainable.

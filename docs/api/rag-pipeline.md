# RAG Pipeline API Reference

> Sources:
>
> - `apps/web/services/growLogRagService.ts` -- Retrieval logic
> - `apps/web/services/ragEmbeddingCacheService.ts` -- Persistent embedding cache

The RAG (Retrieval-Augmented Generation) pipeline enriches AI responses with context from the user's grow journals. It is invoked automatically by `aiService.getMentorResponse()` and `aiService.getGrowLogRagAnswer()`.

---

## Architecture

```
User Query
    |
    v
aiService.getMentorResponse()
    |
    v
resolveRagContext(plants, query)
    |
    +-- try: growLogRagService.retrieveSemanticContext()
    |       (hybrid: 60% cosine + 30% token + 10% recency)
    +-- catch: growLogRagService.retrieveRelevantContext()
    |       (token-only fallback)
    v
Context string appended to AI prompt
    |
    v
Cloud or Local AI generates response
```

---

## `growLogRagService`

Singleton class. Converts plant journal entries into ranked text chunks for prompt injection.

### Public Methods

#### `retrieveSemanticContext(plants, query, limit?)`

```typescript
retrieveSemanticContext(
    plants: Plant[],
    query: string,
    limit?: number
): Promise<string>
```

Primary retrieval path. Uses sliding-window retrieval combining:

- **Recency window** (3 most recent entries, always included)
- **Semantic + token hybrid ranking** for remaining slots

Scoring weights when embeddings are available:

- 60% cosine similarity (MiniLM-L6 embeddings)
- 30% token overlap score (normalized to [0, 1])
- 10% recency boost (30-day decay)

When embeddings are unavailable, falls back to 85% token + 15% recency.

**Dynamic top-K:** Scales from 6 to ~15% of total chunks, capped at 20.

#### `retrieveRelevantContext(plants, query, limit?)`

```typescript
retrieveRelevantContext(
    plants: Plant[],
    query: string,
    limit?: number
): Promise<string>
```

Token-only fallback. Scores chunks by keyword overlap + recency boost (no embeddings required).

#### `isSemanticRankingAvailable()`

```typescript
isSemanticRankingAvailable(): boolean
```

Returns `true` when the MiniLM-L6 embedding model is loaded and ready for semantic ranking.

### Internal Pipeline

1. **`buildChunks(plants)`** -- Flattens journal entries across all plants into `LogChunk[]`. Each chunk contains `plantId`, `plantName`, `text` (DOMPurify-sanitized), `createdAt`. Capped at 500 chunks to prevent OOM.

2. **`scoreChunk(chunk, queryTokens)`** -- Token overlap scoring. +2 per token match, plus recency boost (30-day linear decay from 1.0 to 0.0).

3. **`semanticRetrieve(chunks, query, limit)`** -- Hybrid ranking with persistent embedding cache. Computes embeddings for uncached chunks via `embedBatch()`, stores results in IndexedDB via `ragEmbeddingCacheService`.

4. **`slidingWindowRetrieve(chunks, query, limit)`** -- Combines 3 most-recent entries (continuity) with semantically ranked entries (relevance), deduplicated by `plantId:createdAt`.

5. **`formatContextLine(chunk, score?)`** -- Formats each chunk as: `- PlantName @ DateTime [85%]: First 240 chars of text`

---

## `ragEmbeddingCacheService`

Persistent IndexedDB LRU cache for pre-computed embeddings. Avoids recomputing MiniLM-L6 vectors on every query.

### Configuration

| Setting               | Value                                   |
| --------------------- | --------------------------------------- |
| Model                 | `Xenova/all-MiniLM-L6-v2-q` (quantized) |
| Max entries           | 2048                                    |
| TTL                   | 90 days                                 |
| Precompute batch size | 10                                      |

### Public Functions

#### Cache Operations

| Function                | Signature                                                   | Description                                                 |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `getCachedEmbedding`    | `(cacheKey: string) => Promise<Float32Array \| null>`       | Lookup by key. Returns null on miss.                        |
| `getOrComputeEmbedding` | `(text: string, cacheKey: string) => Promise<Float32Array>` | Cache-through: returns cached or computes + stores.         |
| `clearEmbeddingCache`   | `() => Promise<void>`                                       | Wipe all cached embeddings.                                 |
| `resetCacheState`       | `() => void`                                                | Reset in-memory state (hit/miss counters, precompute flag). |

#### Background Precomputation

| Function                        | Signature                                                  | Description                                                                    |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `precomputeEmbeddings`          | `(entries: ReadonlyArray<{text, key}>) => Promise<number>` | Batch-compute and cache embeddings. Returns count of newly cached entries.     |
| `startBackgroundPrecomputation` | `(plants: ReadonlyArray<Plant>) => void`                   | Fire-and-forget: precomputes embeddings for all journal entries across plants. |
| `isPrecomputationComplete`      | `() => boolean`                                            | True when background precomputation has finished.                              |

#### Introspection

| Function                     | Signature                                                  | Description                          |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| `isSemanticRankingAvailable` | `() => boolean`                                            | True when embedding model is loaded. |
| `getStats`                   | `() => Promise<{total, hits, misses, precomputeComplete}>` | Cache performance statistics.        |

### Model Versioning

The cache key includes the model version (`Xenova/all-MiniLM-L6-v2-q`). When the model changes, stale entries are automatically evicted. No manual cache invalidation required.

---

## Integration Points

- **`aiService.getMentorResponse()`** -- Calls `resolveRagContext()` which attempts semantic retrieval first, token fallback on error.
- **`aiService.getGrowLogRagAnswer()`** -- Same RAG path for direct journal Q&A.
- **`aiService.getMentorResponseStream()`** -- Streaming variant, same RAG context injection.
- **`localAiPreloadOrchestrator`** -- Step 7 of the 8-step preload sequence triggers `startBackgroundPrecomputation()` for warm cache.

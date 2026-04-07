# ADR-0004: Yjs CRDT for Offline Sync Conflict Resolution

**Date:** 2026-04-07
**Status:** Accepted
**Deciders:** Core maintainer

## Context

CannaGuide syncs user data (plants, journal entries, nutrient schedules) via
GitHub Gist using a JSON blob with implicit Last-Write-Wins (LWW). Two devices
editing the same Gist silently overwrite each other -- there is no conflict
detection, no merge strategy, and no version vector. This is audit finding F-06
(Medium severity, High effort).

CRDTs (Conflict-free Replicated Data Types) provide automatic, deterministic
merge of concurrent edits without a central server. Two libraries were
evaluated:

| Criteria          | Yjs                                | Automerge       |
| ----------------- | ---------------------------------- | --------------- |
| Bundle size       | ~70 KB gzipped                     | ~250 KB gzipped |
| Ecosystem         | y-indexeddb, y-websocket, y-webrtc | automerge-repo  |
| Adoption          | Notion, Figma                      | Ink & Switch    |
| Data model        | Y.Map, Y.Array                     | JSON CRDT       |
| IndexedDB persist | y-indexeddb                        | Custom required |

## Decision

Use **Yjs** as the CRDT engine for offline sync conflict resolution.

### Architecture

1. **Lazy loading** -- Yjs is dynamically imported after Redux hydration,
   isolated in a `sync` Vite chunk (~80 KB). Never in the initial bundle.

2. **Y.Doc schema** -- Each domain gets a named Y.Map:
    - `plants` -- `Map<plantId, Y.Map<PlantFields>>`
    - `nutrient-schedule` -- `Map<scheduleId, Y.Map<ScheduleFields>>`
    - `nutrient-readings` -- `Map<readingId, Y.Map<ReadingFields>>`
    - `settings` -- `Map<key, value>` (reserved, not wired yet)

3. **Local persistence** -- `y-indexeddb` persists the Y.Doc in
   `cannaguide-crdt-v1` (separate from CannaGuideStateDB).

4. **Bidirectional Redux bridge** -- `crdtSyncBridge.ts` listens to Redux
   actions and writes to Y.Doc; observes Y.Doc changes and dispatches to
   Redux. Infinite loops prevented by:
    - `meta.fromCrdt` flag on CRDT-originated Redux actions
    - `BRIDGE_ORIGIN` transaction tag on bridge-originated Y.Doc writes

5. **Boot order** -- IndexedDB hydration (Redux ready) -> CRDT initializes
   -> bridge attaches -> initial seed from Redux if Y.Doc is empty.

6. **Failure isolation** -- All CRDT code is `try/catch` wrapped. If Yjs
   fails to initialize, the app continues without CRDT sync.

### Session Roadmap

- **Session I (this):** Yjs integration, CRDT adapters, Redux bridge, tests
- **Session II:** Replace Gist JSON with Y.Doc state vector exchange.
  Add `y-websocket` or custom transport. Multi-tab BroadcastChannel.
- **Session III:** Conflict UI for semantic conflicts. E2E multi-client
  tests. Settings map wiring.

## Consequences

### Positive

- Deterministic merge of concurrent edits across devices
- No data loss from multi-device sync (replaces LWW)
- Foundation for real-time collaboration (Session II+)
- Yjs handles CRDT complexity; domain code uses simple map operations
- Lazy-loaded -- zero impact on initial bundle and FCP

### Negative

- Additional IndexedDB database (`cannaguide-crdt-v1`)
- ~80 KB added to total bundle (lazy chunk)
- Journal entries stored as JSON strings in Session I (limits per-entry
  CRDT merge until Session II migrates to Y.Array)
- Y.Doc schema version migration must be handled manually (doc name
  includes version: `cannaguide-crdt-v1`)

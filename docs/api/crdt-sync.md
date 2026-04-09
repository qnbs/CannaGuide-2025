# CRDT Sync API Reference

> Yjs-based Conflict-free Replicated Data Type layer for offline-first
> multi-device sync with E2EE Gist transport.

**Source files:**

| Module        | Path                                           |
| ------------- | ---------------------------------------------- |
| Core CRDT     | `apps/web/services/crdtService.ts`             |
| Redux Bridge  | `apps/web/services/crdtSyncBridge.ts`          |
| Adapters      | `apps/web/services/crdtAdapters.ts`            |
| Gist Sync     | `apps/web/services/syncService.ts`             |
| Offline Queue | `apps/web/services/offlineSyncQueueService.ts` |

---

## crdtService

Singleton managing a `Y.Doc` with named shared types for plants,
nutrient schedules, nutrient readings, and settings.

### Lifecycle

```typescript
await crdtService.initialize(): Promise<void>
crdtService.isInitialized(): boolean
crdtService.isFallbackMode(): boolean
await crdtService.destroy(): Promise<void>
```

`initialize()` creates the Y.Doc and opens the IndexedDB persistence
provider (`y-indexeddb`). If IndexedDB fails, the service enters
fallback mode (in-memory only, `isFallbackMode() === true`).

### Shared Types

```typescript
crdtService.getDoc(): Y.Doc
crdtService.getPlantsMap(): Y.Map<Y.Map<unknown>>
crdtService.getNutrientScheduleMap(): Y.Map<Y.Map<unknown>>
crdtService.getNutrientReadingsMap(): Y.Map<Y.Map<unknown>>
crdtService.getSettingsMap(): Y.Map<unknown>
```

### State Encoding

```typescript
// Binary state vector for differential sync
crdtService.getStateVector(): Uint8Array
crdtService.encodeStateAsUpdate(stateVector?: Uint8Array): Uint8Array
crdtService.applyUpdate(update: Uint8Array): void

// Base64 transport payloads
crdtService.encodeSyncPayload(): string      // Differential (uses remote state vector)
crdtService.encodeFullSyncPayload(): string  // Full state (initial sync / force-push)
crdtService.applySyncPayload(base64: string): void
```

`encodeSyncPayload()` uses the stored remote state vector (from
`setRemoteStateVector()`) to produce a minimal differential update.
Falls back to full state if no remote vector is available.

### Remote State Vector

```typescript
crdtService.setRemoteStateVector(sv: Uint8Array | null): void
crdtService.getRemoteStateVector(): Uint8Array | null
```

Set after a successful pull to enable differential sync on the
next push.

### Divergence Detection

```typescript
crdtService.detectDivergence(remoteUpdate: Uint8Array): DivergenceInfo

interface DivergenceInfo {
    localOnlyChanges: number
    remoteOnlyChanges: number
    conflictingKeys: string[]
}
```

Applies the remote update to a temporary Y.Doc fork and compares
shared maps to detect conflicting keys.

### Observation

```typescript
crdtService.onUpdate(
    callback: (update: Uint8Array, origin: unknown) => void,
): () => void
```

Subscribe to Y.Doc update events. Returns an unsubscribe function.
The `origin` parameter distinguishes bridge-originated updates
(`'redux-bridge'`) from remote/local edits.

### Diagnostics

```typescript
crdtService.getDocSizeBytes(): number
crdtService.benchmarkSync(): BenchmarkResult
await crdtService.getStorageUsage(): Promise<StorageUsage>
await crdtService.pruneOldHistory(keepDays?: number): Promise<void>

interface BenchmarkResult {
    encodeMs: number
    applyMs: number
    docSizeBytes: number
}

interface StorageUsage {
    crdtBytes: number
    quota: number
    percent: number
}
```

`benchmarkSync()` performs a full encode/apply round-trip on a
throwaway doc and returns timing. `getDocSizeBytes()` warns to
console when exceeding `DOC_SIZE_WARNING_BYTES` (1 MB).

### Error Handling

```typescript
enum CrdtErrorCode {
    INIT_FAILED           = 'CRDT_INIT_FAILED'
    SYNC_ENCODE_FAILED    = 'CRDT_SYNC_ENCODE_FAILED'
    SYNC_APPLY_FAILED     = 'CRDT_SYNC_APPLY_FAILED'
    STORAGE_QUOTA_EXCEEDED = 'CRDT_STORAGE_QUOTA_EXCEEDED'
    BRIDGE_LOOP_DETECTED  = 'CRDT_BRIDGE_LOOP_DETECTED'
}

class CrdtError extends Error {
    code: CrdtErrorCode
    docSizeBytes?: number
    pendingOps?: number
}
```

### Helpers

```typescript
uint8ArrayToBase64(bytes: Uint8Array): string
base64ToUint8Array(base64: string): Uint8Array
```

---

## crdtSyncBridge

Bidirectional bridge between Redux state and the Y.Doc.

### Initialization

```typescript
initCrdtSyncBridge(store: AppStore): void
registerCrdtListeners(startAppListening: AppStartListening): void
```

`initCrdtSyncBridge()` calls `crdtService.initialize()`, populates
the Y.Doc from current Redux state, registers Redux listeners via
`registerCrdtListeners()`, and subscribes to Y.Doc updates.

### Bridge Batching

Redux dispatches within 100 ms (`BATCH_DEBOUNCE_MS`) are batched
into a single Y.Doc transaction to reduce merge overhead.

### Loop Detection

A sliding-window counter (`LOOP_THRESHOLD = 50` dispatches within
`LOOP_WINDOW_MS = 100 ms`) detects infinite bridge loops. When
triggered, the bridge is temporarily disabled for
`LOOP_COOLDOWN_MS = 5000 ms`.

### Telemetry

```typescript
reportCrdtTelemetry(update: Partial<CrdtTelemetryState>): void

interface CrdtTelemetryState {
    divergenceCount: number
    syncPayloadBytes: number
    conflictsResolved: number
    lastSyncMs: number
}
```

Telemetry is forwarded to `workerBus.setCrdtMetrics()` for inclusion
in the exported telemetry snapshot.

### Test Helpers

```typescript
_getCrdtTelemetryState(): CrdtTelemetryState
_resetCrdtTelemetry(): void
_getLoopDetectorState(): { recentDispatchCount: number; bridgeDisabled: boolean }
_resetLoopDetector(): void
_flushBridgeBatch(): void
_getBatchQueueLength(): number
```

Prefixed with `_` -- intended for test use only.

---

## crdtAdapters

Type-safe serialization between Redux types and Y.Map records.
Each adapter pair validates with Zod schemas.

### Plant Adapters

```typescript
plantToYMap(plant: Plant): Record<string, unknown>
yMapToPlant(data: Record<string, unknown>): Plant | null
```

### Journal Entry Adapters

```typescript
journalEntryToYMap(entry: JournalEntry): Record<string, unknown>
yMapToJournalEntry(data: Record<string, unknown>): JournalEntry | null
```

### Nutrient Schedule Adapters

```typescript
nutrientEntryToYMap(entry: NutrientScheduleEntry): Record<string, unknown>
yMapToNutrientEntry(data: Record<string, unknown>): NutrientScheduleEntry | null
```

### EC/pH Reading Adapters

```typescript
ecPhReadingToYMap(reading: EcPhReading): Record<string, unknown>
yMapToEcPhReading(data: Record<string, unknown>): EcPhReading | null
```

### Zod Schemas

```typescript
PlantCrdtSchema // Validates Plant shape
JournalEntryCrdtSchema // Validates JournalEntry shape
NutrientScheduleEntryCrdtSchema
EcPhReadingCrdtSchema
```

All `yMapTo*` functions return `null` on validation failure (logged
to `console.debug`).

---

## syncService

Gist-based transport layer with E2EE (AES-256-GCM via `cryptoService`).

### Sync Result

```typescript
type CrdtSyncResult =
    | { status: 'merged' }
    | { status: 'conflict'; info: DivergenceInfo }
    | { status: 'no-change' }
    | { status: 'migrated' }
    | { status: 'error'; error: string }
```

### Push

```typescript
await syncService.pushToGist(
    existingGistId: string | null,
    encryptionKeyBase64?: string | null,
    reduxStateJson?: string,
): Promise<{ gistId: string; url: string; syncedAt: number }>
```

Uses `crdtService.encodeSyncPayload()` for differential encoding.
Falls back to `encodeFullSyncPayload()` on first push. Wraps payload
in `CrdtGistPayload` format (`version: 'crdt-v1'`). Optional
`reduxStateJson` enables legacy JSON fallback when CRDT is unavailable.

### Pull

```typescript
await syncService.pullFromGist(
    gistUrlOrId: string,
    encryptionKeyBase64?: string | null,
): Promise<{
    result: CrdtSyncResult
    syncedAt: number
    divergenceInfo?: DivergenceInfo
    legacyState?: string
}>
```

Detects format: if `version === 'crdt-v1'`, applies as CRDT update
and runs divergence detection. Otherwise falls back to legacy
last-write-wins merge. `legacyState` is populated only for legacy
payloads.

### Force Operations

```typescript
await syncService.forceLocalToGist(
    existingGistId: string,
    encryptionKeyBase64?: string | null,
): Promise<{ syncedAt: number }>

await syncService.forceRemoteToLocal(
    remoteBase64: string,
): Promise<void>
```

`forceLocalToGist` uses `encodeFullSyncPayload()` (always full state).
`forceRemoteToLocal` replaces the entire local Y.Doc state.

### Conflict Resolution UI

`SyncConflictModal.tsx` presents three options when `status === 'conflict'`:

1. **Smart Merge** -- accept the CRDT merge (default)
2. **Keep Local** -- `forceLocalToGist()`
3. **Use Cloud** -- `forceRemoteToLocal()`

Double-confirmation required for force operations.

---

## Sync Protocol Flow

```
Device A                    GitHub Gist                   Device B
   |                            |                            |
   |-- pushToGist() ----------->|                            |
   |   (differential payload)   |                            |
   |                            |<--------- pullFromGist() --|
   |                            |   (detect divergence)      |
   |                            |                            |
   |                            |<--------- pushToGist() ----|
   |                            |   (differential payload)   |
   |<---------- pullFromGist() -|                            |
   |   (CRDT auto-merge)        |                            |
```

Each pull stores the remote state vector via
`crdtService.setRemoteStateVector()`, enabling the next push to send
only the delta since the last sync.

---

## Constants

| Constant                 | Value                    | Description                  |
| ------------------------ | ------------------------ | ---------------------------- |
| `DOC_NAME`               | `'cannaguide-crdt-v1'`   | Y.Doc name / IndexedDB key   |
| `DOC_SIZE_WARNING_BYTES` | 1,048,576                | Console warning threshold    |
| `ENCODE_WARN_MS`         | 200                      | Slow encoding warning        |
| `BRIDGE_ORIGIN`          | `'redux-bridge'`         | Y.Doc transaction origin tag |
| `BATCH_DEBOUNCE_MS`      | 100                      | Bridge batching window       |
| `LOOP_THRESHOLD`         | 50                       | Dispatches per window limit  |
| `LOOP_WINDOW_MS`         | 100                      | Loop detection window        |
| `LOOP_COOLDOWN_MS`       | 5000                     | Bridge pause on loop         |
| `SYNC_FILE_NAME`         | `'cannaguide-sync.json'` | Gist filename                |
| `CRDT_FORMAT_VERSION`    | `'crdt-v1'`              | Payload format identifier    |

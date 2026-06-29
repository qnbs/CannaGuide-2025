# ADR-0015: UI State Bridge (Redux ↔ Zustand)

**Date:** 2026-06-29  
**Status:** Accepted  
**Deciders:** Engineering / Audit 2026-06-29

## Context

CannaGuide uses Redux Toolkit for persisted domain state and Zustand for transient UI state (modals, notifications, view routing). Services and Zustand actions sometimes need to read Redux state or dispatch actions without importing the store singleton directly — which would create circular dependencies and complicate testing.

`useUIStore.initUIStoreReduxBridge` was extracted into `uiStateBridge.ts` (Session 177). The audit (A-02) flagged bridge complexity and missing formal contracts.

## Decision

1. **Single bridge module:** `apps/web/services/uiStateBridge.ts` is the only supported path for Zustand → Redux reads/dispatches outside React components.
2. **Init once from `store.ts`:** `initUIStateBridgeFull(getState, dispatch, subscribe)` runs after `createAppStore()`.
3. **Public API:**
    - `getReduxSnapshot(selector)` — synchronous read
    - `dispatchToRedux(action)` — dispatch from services/Zustand
    - `subscribeToRedux(selector, handler)` — reactive subscription with auto-cleanup on re-init
4. **Tests:** `uiStateBridge.test.ts` covers init, snapshot, dispatch, subscribe/unsubscribe, and re-init cleanup.
5. **Do not** import `@/stores/store` from Zustand store files except at UI composition boundaries.

## Consequences

### Positive

- Breaks circular import risk between Zustand and Redux
- Testable bridge with mocked `getState` / `dispatch`
- Re-init cleans subscriptions (HMR-safe)

### Negative

- Additional indirection for new contributors
- `subscribeToRedux` requires `initUIStateBridgeFull` (not plain `initUIStateBridge`) for reactive updates

### Neutral

- CRDT sync remains in `crdtSyncBridge.ts` — separate concern from UI bridge
- Future consolidation to one store is not blocked; bridge can be removed if architecture simplifies

## References

- `apps/web/services/uiStateBridge.ts`
- `apps/web/stores/store.ts`
- Audit finding A-02 in `docs/audits/AUDIT-REPORT-2026-06-29.md`

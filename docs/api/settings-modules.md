# Settings View Modules

Developer reference for the modularized Settings UI (`apps/web/components/views/settings/`).

## Overview

`SettingsView.tsx` (**348 LOC**) lazy-loads category tabs. Each tab is a self-contained module. Data management is further split into `dataManagement/`.

```
settings/
  SettingsView.tsx          Shell: sub-nav, lazy tab routing
  SettingsShared.tsx        Shared row/select primitives
  settingsConstants.ts      Theme swatches, shared constants
  AiSettingsTab.tsx         AI mode, local AI, cost tracking, security
  GeneralSettingsTab.tsx      Theme, PWA install, colorblind, locale
  PlantsSettingsTab.tsx       Default grow setup, plant defaults
  NotificationsSettingsTab.tsx
  DefaultsSettingsTab.tsx
  PrivacySettingsTab.tsx
  DataManagementTab.tsx     Composition shell (110 LOC)
  dataManagement/
    useDataManagementActions.ts   State + handlers hook
    DataManagementDialogs.tsx     Confirm/erase/reset dialogs
    PersistenceSettingsPanel.tsx
    BackupRestorePanel.tsx
    ZipBackupPanel.tsx
    CsvExportPanel.tsx
    GrowExportPanel.tsx
    StorageInsightsPanel.tsx      + DbStoreBreakdown, StorageInfo, etc.
    SliceResetPanel.tsx
    DangerZonePanel.tsx
    GdprPrivacyPanel.tsx
    formatBytes.ts
  AiModeCard.tsx            Extracted AI settings cards
  LocalAiOfflineCard.tsx
  LocalAiFeaturesCard.tsx
  CostTrackingSection.tsx
  GeminiSecurityCard.tsx
  CloudSyncPanel.tsx        Lazy (sync)
  OfflineActionQueuePanel.tsx
  CommunitySharePanel.tsx
```

## Import rules

- Tabs import from `@/stores/*`, `@/services/*` — not from sibling tabs unless shared via `SettingsShared.tsx`.
- New data-management UI → add panel under `dataManagement/`; keep `DataManagementTab.tsx` as composition only.
- AI settings cards stay co-located with `AiSettingsTab.tsx` unless reused elsewhere.

## Testing

- `SettingsView.test.tsx` — navigation smoke (tabs mocked)
- `dataManagement/formatBytes.test.ts` — utility unit tests
- E2E: `webllm-inference.e2e.ts` targets `LocalAiOfflineCard` via `data-testid`

## Related

- [ai-facade.md](ai-facade.md) — AI provider and cost tracking services
- [crdt-sync.md](crdt-sync.md) — Cloud sync panel behavior
- ADR-0014 — Strain catalog (data tab integrity)
- Audit closure: `docs/audits/AUDIT-CLOSURE-2026-06-29.md`

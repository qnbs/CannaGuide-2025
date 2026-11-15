# IndexedDB and durable-data instructions

Applies to `apps/web/services/db/**`. Root safety and privacy rules remain binding.

- DB-01: Treat IndexedDB records as durable user data. Preserve existing records and schema compatibility; never replace or erase a store as a shortcut.
- DB-02: Keep read-modify-write sequences that must not lose concurrent updates inside one appropriate IndexedDB transaction. Do not split a transaction across awaited work that can make it inactive.
- DB-03: Inspect all readers, writers, migrations, export/import, recovery, deletion and cross-tab paths before changing a persisted schema or lifecycle.
- DB-04: Make migrations and archival operations idempotent and abort-safe. Do not report success before transaction completion; surface aborts without silently retrying non-idempotent writes.
- DB-05: Add deterministic tests for concurrent tabs/transactions, aborts, reload/restart and corrupt or older snapshots where relevant. Assert both preserved data and absence of duplicates.
- DB-06: Preserve privacy erasure and recovery semantics. Never log user payloads or copy production data into fixtures.
- DB-07: CannaGuideStateDB stores Redux state through the IndexedDB adapter; CannaGuideDB stores domain data such as strains, images and the full-text index.
- DB-08: IndexedDB is the default persistence layer. localStorage is for small non-secret flags only, except the sanctioned IoT MQTT connection config.
- DB-09: Yjs/GitHub Gist sync remains behind CLOUD_SYNC_DISABLED and is not an available backup path; preserve erase, export/import and recovery semantics.

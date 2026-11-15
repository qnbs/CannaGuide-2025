# Durable-data instructions for Codex

Applies to this directory and is additive to root `AGENTS.md` and `apps/web/AGENTS.md`.

- DB-CODEX-01: Treat every IndexedDB write as user-data integrity work. Inspect all writers, transaction boundaries, migrations and recovery readers before editing.
- DB-CODEX-02: Put atomic read/merge/write work inside one transaction; test concurrent writers and transaction aborts deterministically.
- DB-CODEX-03: Preserve migration, export/import, deletion and restore compatibility. Tests must prove retained records and no duplicate archive/import result.
- DB-CODEX-04: Use the narrow relevant test files first, serially on this host; report exact commands and exit codes. Do not run broad suites locally.
- DB-CODEX-05: Keep Redux persistence in CannaGuideStateDB and domain records in CannaGuideDB; do not merge or replace stores as a shortcut.
- DB-CODEX-06: localStorage remains limited to small non-secret flags, with the sanctioned IoT MQTT exception. CLOUD_SYNC_DISABLED means Gist sync is not a backup path.

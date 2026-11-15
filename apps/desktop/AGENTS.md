# Desktop application instructions for Codex

Applies to `apps/desktop/**`; adds desktop-specific constraints to the root `AGENTS.md`.

- DESKTOP-CODEX-01: Treat Rust `#[tauri::command]` entrypoints and `src-tauri/capabilities/*.json` as security boundaries. Keep permissions least-privilege and update tests/configuration when commands or capabilities change.
- DESKTOP-CODEX-02: Verify host prerequisites, supported targets and CI packaging before documenting or claiming platform support.
- DESKTOP-CODEX-03: Desktop development requires Rust and Tauri v2; `pnpm run dev:desktop` is the root command. The workspace package exposes `tauri dev` as its `dev` script.
- DESKTOP-CODEX-04: Signing, updater feeds, publishing and releases remain subject to root owner gates and release policy; this file does not authorize them.

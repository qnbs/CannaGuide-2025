# Script instructions for Codex

Applies to `scripts/**` and is additive to root `AGENTS.md`.

- SCRIPT-CODEX-01: Use dry-run/read-only mode first for cleanup, retention, provider or repository-setting scripts. Never broaden deletion scope after an anomaly.
- SCRIPT-CODEX-02: Preserve child exit codes and signals; add regression tests for nonzero exit, signal termination, abort and partial API failure.
- SCRIPT-CODEX-03: Do not install dependencies or run lifecycle scripts from verification hooks. Use repository-local resolvers and current dependency-fingerprint gates.

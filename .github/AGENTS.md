# GitHub workflow instructions for Codex

Applies to `.github/**` and is additive to root `AGENTS.md`.

- GHA-CODEX-01: Review the exact event, fork trust boundary, permissions and all untrusted data flows before changing a workflow.
- GHA-CODEX-02: Preserve immutable action pins, required checks, signatures and branch protections. Never weaken a gate to make CI green.
- GHA-CODEX-03: Test workflow policy with focused fixtures and inspect the exact-head run; skipped and external-service failures remain explicit limitations.
- GHA-CODEX-04: No production deployment, release, secret change or destructive retention is authorized by a scoped instruction file.

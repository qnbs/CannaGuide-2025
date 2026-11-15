# ADR 0016: Scoped agent instructions with traceable destinations

- **Status:** Accepted for the #842 implementation, subject to exact-head review and CI.
- **Date:** 2026-11-15
- **Baseline:** `4d4703eb1478230f352d2f0da91c7be91cd38503`

## Context

The root `AGENTS.md` and `CLAUDE.md` combine universal legal, privacy, data-integrity, operator, hook, signing, CI, release, accessibility, and retention safeguards with web, desktop, AI, persistence, and workflow detail. Claude Code and Codex discover instructions differently. A path split is useful only when the intended agent loads the relevant file and the source requirements remain traceable to their destinations.

## Decision

- Keep universal safeguards and concise navigation in both root files. Scoped files add detail and cannot waive root or repository policy.
- Use nested `CLAUDE.md` files at verified web, persistence, local-AI, WorkerBus, strain-data, desktop, AI-core, scripts, and GitHub workflow boundaries.
- Use nested `AGENTS.md` selectively for web, database, desktop, scripts, and GitHub workflows. These files contain Codex-specific guidance for verified scopes; they do not mirror every Claude path.
- Defer `.claude/rules` and skills. The current CLI probes show the required nested `CLAUDE.md` files load in their directory scope. Normative safeguards must not depend on optional skills or Claude-only settings.
- Do not move a normative requirement without recording immutable source position, priority, scope, destination, and exact or anchored destination evidence. Fail closed on missing source mapping, missing destination content, unsafe paths, missing loader evidence, or an explicit contradiction.
- Keep the root global legal cap, privacy/no-egress boundary, data safety, single-writer lease, signing, hook, CI, accessibility, PR-budget, release, and SAFE-only retention requirements visible to both agents.

## Empirical loader evidence

The current branch has ten sanitized Codex CLI 0.169.0 prompt-input probes and ten Claude Code CLI 2.1.323 local-mock probes. Both confirm the expected root/scoped files and ancestor-first order across root, web, database, local AI, WorkerBus, strains, desktop, AI-core, scripts, and GitHub contexts. Codex loads only the relevant `AGENTS.md` chain; Claude loads the corresponding `CLAUDE.md` chain and did not load complete `AGENTS.md` contents. Claude probes used a local SSE mock in an unshared network namespace, with zero routes, external `ENETUNREACH`, no tools, and session persistence disabled. The evidence manifests are hash-bound to the current instruction files.

These probes establish file inclusion and ordering, not semantic obedience to every rule or behavior of future CLI versions. The rule/claim gate and negative tests separately check source coverage, destination evidence, missing files, non-loaded scope, and contradictory scoped instructions.

## Consequences

Relevant implementation context is available near the owned code without making legal, privacy, operator, release, or retention safety depend on nested loading. The traceability sidecar and checker become the maintenance gate for future root reductions and scope changes. Changes to instruction files or agent versions require fresh loader evidence.

## Rollback

If a scope probe or traceability check fails, restore the affected requirement to both root files, keep scoped guidance additive, update the evidence, and rerun the gate. Do not remove root safeguards based only on a passing marker-inclusion test.

# ADR-0001: Record Architecture Decisions

**Date:** 2026-Q2
**Status:** Accepted
**Deciders:** Core team

## Context

CannaGuide 2025 has grown to a complex monorepo with 15 AI services, dual IndexedDB persistence, a 3-layer ML fallback cascade, 7 Web Workers, and native bridge abstractions. Key architectural decisions (why dual IndexedDB, why WorkerBus over direct postMessage, why AI facade pattern) are embedded in code and copilot-instructions but not formally captured in a discoverable, auditable format.

An external Deep Audit (2026-Q2) identified this gap as finding D-03 and recommended adopting lightweight Architecture Decision Records.

## Decision

We will use Architecture Decision Records (ADRs) as described by Michael Nygard in the format stored in `docs/adr/`. Each ADR is a short Markdown file with Context, Decision, and Consequences sections. ADRs are numbered sequentially (`0001`, `0002`, ...) and tracked in version control alongside the code they describe.

New ADRs are created when:

- A new architectural pattern is introduced (e.g., new persistence layer, new worker type)
- An existing pattern is significantly changed
- A technology choice is made that has long-term implications
- A decision is reversed or superseded

ADRs are immutable once accepted. To change a decision, create a new ADR that supersedes the previous one and update the old ADR's status to "Superseded by ADR-XXXX".

## Consequences

### Positive

- New contributors can understand why the architecture is shaped the way it is
- Audit findings have a formal home for resolution documentation
- Decision rationale survives team turnover
- Lightweight process -- one Markdown file per decision

### Negative

- Small maintenance overhead for writing ADRs
- Risk of ADRs becoming stale if not referenced during code reviews

### Neutral

- Does not replace inline code comments or copilot-instructions -- complements them

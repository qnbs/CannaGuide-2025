# ADR-0006: Equipment Grow Scoping Deferred to Session D

**Date:** 2025-07-14
**Status:** Proposed
**Deciders:** Core team

## Context

Session C introduced Multi-Grow UI (GrowSwitcher, GrowManagerTab, per-grow
PlantsView context). Equipment (lights, tents, sensors) currently has no
`growId` association. Scoping equipment per grow requires schema changes
to equipment entities, migration logic for existing data, and UI updates
across 7 Equipment view tabs.

## Decision

Defer equipment-to-grow scoping to Session D. Session C focuses on core
grow navigation, CRUD, and plant-level grow context. Equipment continues
to be shared across all grows.

## Consequences

### Positive

- Session C ships a complete, testable grow management UI without
  coupling to equipment schema migration
- Users can immediately benefit from grow switching and plant filtering

### Negative

- Equipment settings are global until Session D -- a user with 2 grows
  sees the same equipment in both

### Neutral

- No data migration required in Session C
- Equipment growId field can be added non-breaking (optional field)

# ADR-0005: Multi-Grow Architecture

## Status

Accepted

## Date

2026-04-07

## Context

German cannabis law (CanG) permits up to 3 concurrent personal grows.
Users need to organize plants, environment settings, and nutrient
schedules per grow (room, tent, cycle). The existing state model is
flat -- all plants live in a single simulation slice without any
grouping concept.

## Decision

Introduce a `Grow` entity and a `growsSlice` (RTK EntityAdapter)
alongside a `growId` foreign key on `Plant` and
`NutrientScheduleEntry`.

Key constraints:

- **MAX_GROWS = 3** (hard-coded legal limit)
- **DEFAULT_GROW_ID** assigned to all pre-existing data via
  migration v5->v6
- **Existing selectors preserved** -- new grow-scoped selectors
  added alongside (no breaking changes)
- **plantSlots remain global** -- per-grow slots deferred to
  Session C (UI layer)
- **Archives unaffected** -- mentor is global, advisor is per-plant
  (plant->grow linkage sufficient)

State migration (APP_VERSION 5->6):

1. Creates `grows` slice with one default grow
2. Stamps `growId` on every plant
3. Stamps `growId` on every nutrient schedule entry
4. Shape validator `ensureGrowsShape` runs every boot

## Consequences

- Zero data loss for existing users (migration is additive)
- Workers receive `Plant` objects with `growId` -- no protocol
  change needed
- CRDT adapters updated to sync `growId` field
- UI changes deferred to Session C (grow switcher, per-grow views)

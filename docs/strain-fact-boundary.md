# Strain factual boundary v1

Phase A of #751 adds `strainFactSchema` in `@cannaguide/ai-core` as an additive
contract. Existing `Strain` fields, catalog generation, factory behavior, and
runtime readers are unchanged. No research records are imported.

The discriminant separates unknown and legacy-unverified values (both have a
null point), product nominal labels, batch lab points, strict/inclusive upper
bounds, and product specification intervals. Simulation values are rejected.
A measured zero requires the same evidence and exact batch scope as other lab
points. Units are preserved as `%`, `ppm`, or `\u00b5g/kg` (the latter notation
represents the microgram symbol in source string escapes); no conversion is
performed. Analytes distinguish THC, THCA, total THC, CBD, CBDA, total CBD, aflatoxin B1, and arsenic.
All six date fields are independently optional/nullable ISO calendar dates. A report
date never supplies a missing test date.

`factMatchesScope` compares the complete identity, including the parent product
for batches. It must be used when selecting a fact for a target entity; names
are not identifiers. Evidence IDs are references, not proof of a source's
contents. This contract does not resolve an evidence repository, independently
verify a laboratory, or grant rights. `isFactReleaseEligible` checks schema,
known state and explicit `production_permitted` metadata only; it does not
import or publish anything. Unknown, restricted, and schema-only rights fail
this gate. Later ingestion must establish the evidence and rights before
setting that metadata.

`adaptLegacyStrainFacts` returns a new sidecar and preserves the original record
ID. Missing values become unknown; every present legacy number, including
zero, becomes legacy-unverified with no numeric point. The legacy source value
is left untouched. The sidecar uses an explicit legacy reference unless a caller supplies an identity scope rather than
claiming an existing ID represents a certified cultivar, product or batch.
It is not connected to persistence or factory runtime in this phase.

## Validation evidence

Synthetic fixtures only: the W003 archive is unavailable on this workstation,
so no research validator or archive hash was independently rerun.

- RED: the targeted Vitest file failed because the new fact module did not
  exist (`Test Files 1 failed (1)`).
- GREEN: the same targeted file passes 40 tests, including missing versus zero,
  strict versus inclusive bounds, nominal versus batch, exact target scope,
  intervals, rights, invalid numbers/units/states/dates and private legacy IDs.
- The scoped ai-core TypeScript check passes.
- Canonical `apps/web/data/strains/strains.json` SHA-256 remains
  `90d9f688452094db0d0b3bbdb044e7c19271e12ffef04ed6723daea7abef6e27`.

The installed repo-local executables were used for verification. The pnpm
wrapper attempted an automatic dependency-status install and failed to open
its sandboxed SQLite store before running tests. No explicit installation was
requested, and the shared lockfile, modules metadata and successful-install
stamp retained their original timestamps. This is not a failing test result.

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
performed. Trace contaminants support ppm and micrograms per kilogram; the
contract does not assign regulatory safety thresholds. Analytes distinguish THC, THCA, total THC, CBD, CBDA, total CBD, aflatoxin B1, and arsenic.
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
is left untouched. The default scope is `legacy`; it does not certify an
existing ID as a cultivar, product, or batch. A caller-supplied identity scope
replaces this default.
It is not connected to persistence or factory runtime in this phase.

The consumer contract tests remain under `apps/web/types` and import the public
`@cannaguide/ai-core` entry point. This is an explicit workspace exception to
source colocation: ai-core currently has no Vitest script or configuration,
while the web test harness runs in CI. Moving the file alone would remove it
from the configured test run.

## Validation evidence

App tests use synthetic fixtures. On 1 November 2026, the original W004 ZIP
was separately verified outside the repository: SHA-256 and CRC match, all 14
archive validation checks pass, and 52/53 rebuilt outputs are byte-identical.
Only the SQLite crosswalk differs in bytes; both integrity checks pass and both
SQL dumps hash to `8b7a6d0b258328c42ed2e69b9245f025a00738b6f916247f42e010cdce38db8e`.
Byte reproducibility remains unresolved and no research data is imported.

- RED: the targeted Vitest file failed because the new fact module did not
  exist (`Test Files 1 failed (1)`).
- GREEN: the same targeted file passes 54 tests, including missing versus zero,
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

Review regression: without the analyte/unit rule, the targeted file reports
4 failures (50 passing). The explicit matrix restores 54 passing tests.
Dedicated unknown/legacy fixtures first accept a null control, then reject
a numeric zero with only a value-path error and valid claim status.

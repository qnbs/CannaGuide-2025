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
for batches. A laboratory-result fact also matches its explicitly declared batch
only when both batch and product IDs match; it never matches the product alone
or changes the stored laboratory-result scope. It must be used when selecting a fact for a target entity; names
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

App contract validation uses synthetic fixtures only. Research archive checks
are tracked separately in the PR and execution issue; they do not establish
application integration.
The external research archive is not stored in this repository. Its SQLite
byte reproducibility remains unresolved; matching logical contents do not
establish byte-identical rebuilding. No research data is imported by this API.

- RED: the targeted Vitest file failed because the new fact module did not
  exist (`Test Files 1 failed (1)`).
- GREEN: the same targeted file passes 58 tests, including missing versus zero,
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

The adapter scope-alias regression failed with one failing / 54 passing cases
before giving each sidecar its own scope copy; all 55 cases pass afterward.

Laboratory-result association regression: RED 1 failed / 55 passed before
matching the declared exact batch; GREEN 56/56 afterward, including other-batch,
other-product, product-level and reverse-association rejection.

Laboratory claim status is reserved for measured laboratory points and bounds;
nominal labels and product specifications require source attribution. RED:
2 failed / 56 passed for otherwise-valid production-permitted product reports
with laboratory claim status. GREEN: 58/58, including release-gate rejection.

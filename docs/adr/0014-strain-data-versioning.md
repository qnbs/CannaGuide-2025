# ADR-0014: Strain Catalog Versioning & Enrichment Cadence

**Date:** 2026-06-29
**Status:** Accepted
**Deciders:** CannaGuide Team

## Context

The strain encyclopedia ships **776 curated entries** as TypeScript modules under
`apps/web/data/strains/`, bundled at build time. There is no runtime API for the
canonical catalog — offline-first is a core product constraint.

Existing tooling (`merge-strains.mjs`, `enrich-provenance.mjs`,
`check-strain-integrity.mjs`, `check-new-strain-duplicates.mjs`) supports
deduplication, provenance scoring, and Levenshtein fuzzy-duplicate detection, but
lacked a documented **versioning and refresh strategy**. The 2026-06-29 audit
flagged this as P1 (finding F-01).

Goals:

1. Reproducible catalog builds with an auditable version stamp.
2. Safe community contributions via PR workflow.
3. Quarterly enrichment without breaking stable strain IDs.
4. Clear separation between bundled catalog and user-contributed strains (Redux `userStrains`).

## Decision

### 1. Catalog version manifest

Add `apps/web/data/strains/catalog-version.json`:

```json
{
    "version": "1.8.2",
    "strainCount": 776,
    "generatedAt": "2026-06-29T00:00:00.000Z",
    "schema": "strain-v2"
}
```

- `version` mirrors the app release that last regenerated the catalog (or a patch bump for data-only releases).
- CI runs `pnpm run strains:check-integrity` and fails if `strainCount` in the manifest disagrees with the merged catalog.
- `strainService` exposes `getCatalogVersion()` for About/Settings diagnostics.

### 2. Stable strain IDs

- Strain `id` fields are **immutable** once released. Renames update `name` only; never recycle IDs.
- New strains receive kebab-case IDs derived from normalized name; `check-new-strain-duplicates.mjs` blocks collisions.
- Deprecated strains are marked `deprecated: true` in metadata, not deleted, to preserve genealogy links.

### 3. Enrichment cadence

| Cadence   | Action                                                                                                  | Owner                    |
| --------- | ------------------------------------------------------------------------------------------------------- | ------------------------ |
| Per PR    | `strains:check-integrity`, `strains:check-new-duplicates` in CI when `apps/web/data/strains/**` changes | CI                       |
| Monthly   | `strains:enrich-provenance --report --min-confidence=0.7` (advisory artifact)                           | Maintainer cron / manual |
| Quarterly | Merge enrichment PR; bump `catalog-version.json`; release note in CHANGELOG                             | Release manager          |
| Ad hoc    | Community PRs adding strains with breeder/source citation                                               | Contributors             |

`enrich-provenance.mjs --dry-run` is the default for exploratory runs; `--report` gates CI only on scheduled jobs.

### 4. Community contribution workflow

Document in `CONTRIBUTING.md` (strain section):

1. Add `.ts` file under `apps/web/data/strains/` following existing schema.
2. Run `pnpm run strains:sync` if migrating from external JSON.
3. Include `provenance: { source, confidence, discoveredAt }` when available.
4. PR must pass integrity + duplicate checks; no AI-generated entries without human review flag.

### 5. User strains vs bundled catalog

| Store           | Location                             | Mutable by user           |
| --------------- | ------------------------------------ | ------------------------- |
| Bundled catalog | `apps/web/data/strains/`             | No (read-only at runtime) |
| User strains    | Redux `userStrainsSlice` + IndexedDB | Yes                       |
| Community share | GitHub Gists (optional)              | Yes                       |

External API lookups (`strain-lookup/externalStrainLookups.ts`) may propose enrichments but never overwrite bundled entries without explicit user import.

## Consequences

### Positive

- Auditable catalog lineage for compliance and debugging.
- Contributors have a clear, test-gated path.
- Enrichment can proceed without app code changes.
- Stable IDs protect genealogy and grow-history references.

### Negative

- Manifest must be updated on every catalog size change (automatable in `merge-strains.mjs`).
- Quarterly enrichment requires maintainer bandwidth.

### Neutral

- Does not introduce a runtime strain CDN; offline-first unchanged.
- Target 2,000+ strains (ROADMAP v1.4) remains incremental via PRs, not a big-bang import.

## Implementation checklist

- [x] ADR accepted (this document)
- [ ] `catalog-version.json` + `getCatalogVersion()` (follow-up PR)
- [ ] CI integrity check against manifest count
- [ ] CONTRIBUTING.md strain section
- [ ] Scheduled enrichment workflow (advisory)

## References

- `docs/audits/AUDIT-REPORT-2026-06-29.md` — F-01
- `scripts/merge-strains.mjs`, `scripts/enrich-provenance.mjs`
- `ROADMAP.md` — v1.4 strain growth program

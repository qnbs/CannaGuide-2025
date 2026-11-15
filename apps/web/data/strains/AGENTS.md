# Strain data instructions for Codex

Applies to `apps/web/data/strains/**`.

- STRAIN-01: Preserve canonical strain IDs and referential integrity across catalog chunks, indexes and pending records.
- STRAIN-02: Do not invent provenance, lineage, effects, medical claims or field values. Preserve field-level source evidence where available.
- STRAIN-03: Keep unverified imports quarantined under the existing pending flow; do not promote them into the canonical catalog without the repository's validation and review process.
- STRAIN-04: Run the existing duplicate, schema and catalog-integrity checks after changes. Avoid bulk rewrites that obscure record-level provenance.

# Release Process

CannaGuide 2025 uses **manual releases** with Conventional Commits.

---

## Pre-Release Checklist

1. **Typecheck clean:** `node ./scripts/typecheck-filter.mjs` (0 errors, TS2719 filtered)
2. **Tests pass:** `pnpm --filter @cannaguide/web test:run` (0 failures)
3. **Lint clean:** `node ./scripts/lint-scopes.mjs` (0 violations)
4. **Build succeeds:** `pnpm run build`
5. **Strain integrity:** `node scripts/check-strain-integrity.mjs`
6. **i18n complete:** `node scripts/check-i18n-completeness.mjs` (all 5 languages)

## Release Steps

```bash
# 1. Update CHANGELOG.md
#    Move [Unreleased] content to [X.Y.Z] - YYYY-MM-DD

# 2. Version bump (both package.json files must match)
sed -i 's/"version": ".*"/"version": "X.Y.Z"/' package.json
sed -i 's/"version": ".*"/"version": "X.Y.Z"/' apps/web/package.json

# 3. Commit
git add -A
git commit -m "chore(release): vX.Y.Z"

# 4. Tag (annotated)
git tag -a vX.Y.Z -m "vX.Y.Z: <theme>"

# 5. Push (commit + tag together)
git push origin main --tags

# 6. Create GitHub Release
gh release create vX.Y.Z \
  --title "vX.Y.Z -- <Theme>" \
  --latest \
  --notes "<release notes>"
```

## Versioning (SemVer)

| Bump  | When                                            | Example        |
| ----- | ----------------------------------------------- | -------------- |
| PATCH | Bug fixes, docs, CI, lint                       | 1.5.0 -> 1.5.1 |
| MINOR | New features, new slices, new services          | 1.5.1 -> 1.6.0 |
| MAJOR | Breaking changes (API, data format, migrations) | 1.6.0 -> 2.0.0 |

## Version Locations

Both files **must** have the same version:

- `package.json` (root workspace)
- `apps/web/package.json`

## Supply-Chain Verification

Every release produces three assets:

| Asset                                | Description            |
| ------------------------------------ | ---------------------- |
| `cannaguide-vX.Y.Z-dist.tar.gz`      | Production PWA tarball |
| `cannaguide-sbom.cyclonedx.json`     | CycloneDX SBOM (Syft)  |
| `cannaguide-provenance.intoto.jsonl` | SLSA L3 provenance     |

### Verify SLSA L3 Provenance

```bash
# Install slsa-verifier (requires Go)
go install github.com/slsa-framework/slsa-verifier/v2/cli/slsa-verifier@latest

# Download release assets
gh release download vX.Y.Z --repo qnbs/CannaGuide-2025

# Verify L3 provenance
slsa-verifier verify-artifact cannaguide-vX.Y.Z-dist.tar.gz \
  --provenance-path cannaguide-provenance.intoto.jsonl \
  --source-uri github.com/qnbs/CannaGuide-2025
```

### Verify GitHub Attestation (L1)

```bash
gh attestation verify cannaguide-vX.Y.Z-dist.tar.gz --repo qnbs/CannaGuide-2025
```

### Inspect SBOM

```bash
# View SBOM summary (requires jq)
jq '.metadata.component.name, (.components | length)' cannaguide-sbom.cyclonedx.json
```

## No Automation

This project does **not** use release-please, semantic-release, or similar tools.
Manual releases ensure full control over CHANGELOG quality and release timing.

**History:** release-please was active from v1.3.0-alpha to v1.4.0-alpha.
It was removed in v1.6.0 due to conflicts with the established manual release
workflow (PR #122 accidentally downgraded the version from 1.6.0 to 1.5.0).

## Release History

| Version | Date       | Theme                                     |
| ------- | ---------- | ----------------------------------------- |
| v1.6.0  | 2026-04-10 | WorkerBus W-02/W-04, CRDT Sync, API Docs  |
| v1.5.1  | 2026-04-09 | Quality & Polish                          |
| v1.5.0  | 2026-04-08 | Multi-Grow, CRDT Sync, Dead Infra Cleanup |
| v1.4.1  | 2026-04-06 | Patch release                             |
| v1.4.0  | 2026-04-06 | Stable release                            |
| v1.3.0  | 2026-04-01 | Beta (alpha -> beta transition)           |

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

Every release produces two assets (via `release-publish.yml`):

| Asset                            | Description            |
| -------------------------------- | ---------------------- |
| `cannaguide-vX.Y.Z-dist.tar.gz`  | Production PWA tarball |
| `cannaguide-sbom.cyclonedx.json` | CycloneDX SBOM (Syft)  |

Both artifacts receive **GitHub Attestations** (build provenance +
SBOM attestation) via `actions/attest-build-provenance` and
`actions/attest-sbom`. These are verifiable via the `gh` CLI.

> **Note:** `slsa-framework/slsa-github-generator` (SLSA L3) was
> removed in April 2026 due to Go build failures on ubuntu-24.04
> runners. GitHub-native attestations provide equivalent build
> provenance that is verifiable via `gh attestation verify`.

### Verify Build Provenance

```bash
# Download release assets
gh release download vX.Y.Z --repo qnbs/CannaGuide-2025

# Verify build provenance attestation
gh attestation verify cannaguide-vX.Y.Z-dist.tar.gz --repo qnbs/CannaGuide-2025
```

### Inspect SBOM

```bash
# View SBOM summary (requires jq)
jq '.metadata.component.name, (.components | length)' cannaguide-sbom.cyclonedx.json

# Verify SBOM attestation
gh attestation verify cannaguide-vX.Y.Z-dist.tar.gz \
  --repo qnbs/CannaGuide-2025 \
  --predicate-type https://cyclonedx.org/bom
```

## Release Publish Workflow

The `release-publish.yml` workflow runs automatically after
`release-gate.yml` succeeds (via `workflow_run` trigger) or can be
triggered manually:

```bash
# Manual trigger (if workflow_run chain fails)
# GitHub Actions UI -> "Release Publish" -> Run workflow
#   Input: tag = vX.Y.Z
#   Input: dry-run = false (default)
```

**Dry-run mode:** Set `dry-run: true` to build + generate SBOM +
verify attestations without publishing the release.

**Workflow chain:**

1. `git push --tags` triggers `release-gate.yml` (tag `v*`)
2. Release Gate runs pre-flight + tests + build verify
3. On success, `release-publish.yml` auto-triggers (workflow_run)
4. Build job creates tarball + CycloneDX SBOM
5. Release job generates attestations + publishes GitHub Release

If the `workflow_run` chain fails (startup_failure), use the manual
`workflow_dispatch` trigger in the GitHub Actions UI.

## No Automation

This project does **not** use release-please, semantic-release, or similar tools.
Manual releases ensure full control over CHANGELOG quality and release timing.

**History:** release-please was active from v1.3.0-alpha to v1.4.0-alpha.
It was removed in v1.6.0 due to conflicts with the established manual release
workflow (PR #122 accidentally downgraded the version from 1.6.0 to 1.5.0).

## Release History

| Version | Date       | Theme                                     |
| ------- | ---------- | ----------------------------------------- |
| v1.7.0  | 2026-04-11 | Voice-First Edition                       |
| v1.6.3  | 2026-04-10 | Build Attestation + CycloneDX + Lint Ph5  |
| v1.6.2  | 2026-04-10 | Release pipeline fix + SLSA L1 provenance |
| v1.6.0  | 2026-04-10 | WorkerBus W-02/W-04, CRDT Sync, API Docs  |
| v1.5.1  | 2026-04-09 | Quality & Polish                          |
| v1.5.0  | 2026-04-08 | Multi-Grow, CRDT Sync, Dead Infra Cleanup |
| v1.4.1  | 2026-04-06 | Patch release                             |
| v1.4.0  | 2026-04-06 | Stable release                            |
| v1.3.0  | 2026-04-01 | Beta (alpha -> beta transition)           |

# Release Process

CannaGuide 2025 uses **manual releases** with Conventional Commits.

Release publication is a separate maintainer decision. Dependency maintenance does not
authorize a new tag. Prepare changes through a signed, reviewed PR; never push release
changes directly to main, bypass rulesets or move a published tag. Historical release
examples in other documents do not override this procedure.

---

## Pre-Release Checklist

1. **Local prerequisites:** repository-pinned pnpm, Node matching `engines`, frozen install,
   approved signing identity and hooks enabled. Follow [AGENTS.md](../AGENTS.md) for resources.
2. **Affordable local verification:** `pnpm verify`, `pnpm verify:lint` and relevant individual
   test specs. Inspect the selected scope: root manifest/lockfile changes select all workspaces.
3. **Current-head qualification:** required **✅ CI Status**, including build, unit/coverage,
   verify, security, Chromium E2E and Rust when desktop changed; inspect current CodeQL and
   reviewer results as well. Resolve valid review findings before merge.
4. **Resulting main:** verify CI and CodeQL on the actual merged SHA before selecting it for release.
5. **Release-specific evidence:** confirm version agreement, changelog, strain/i18n gates,
   artifact source SHA, SBOM and attestation behavior. Browser and heavy coverage checks belong
   in CI, not on the low-memory maintainer machine.
6. **Separate platform evidence:** a passing web build does not qualify native desktop bundles,
   updater signatures or production identity. Record those limits explicitly.

## Release Steps

1. On a named branch from freshly verified `origin/main`, prepare the chosen version in root
   and web manifests and move the relevant Unreleased changelog entries to the dated release.
   Update the lockfile through pnpm if required; review the exact manifest/lockfile pair.
2. Commit with the approved signing identity, run the normal hooks, push the branch and open
   a Ready for Review PR. Qualify and merge through the unchanged repository gates.
3. Read the resulting main SHA and its checks. An earlier green PR head is not a substitute.
4. After the concrete release decision, use the existing protected Release Publish path
   described below. A missing permission, secret or tag-protection authorization is a blocker;
   do not alter rulesets or credentials as an automatic fallback.
5. Verify the published assets and attestations against the selected commit, then inspect
   actual deployed `version.json` bytes and platform-specific evidence. Do not rewrite
   existing release assets or tags to repair a failed publication.

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
> runners. The replacement GitHub-native attestations are verifiable via
> `gh attestation verify`; their presence alone is not a SLSA-level qualification.

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

## GitHub Settings (Rulesets, PAT, Agent limits)

If tag push fails with `GH013: Cannot create ref due to creations being restricted`,
see the full manual setup guide:

**[`docs/GITHUB-SETTINGS-GUIDE.md`](./GITHUB-SETTINGS-GUIDE.md)**

Covers Tag Protection ruleset `14231365`, `RELEASE_PAT` secret, `workflow_dispatch`
release path, branch protection, Actions permissions, and Cursor Cloud Agent workarounds.

## Release Publish Workflow

The `release-publish.yml` workflow triggers directly on tag push
(`v*`) -- the same event that triggers `release-gate.yml`. Both
workflows run **in parallel**. Release Gate is informational
(quality checks); Release Publish is the release path. It can also
be triggered manually via `workflow_dispatch`:

```bash
# Manual trigger (fallback)
# GitHub Actions UI -> "Release Publish" -> Run workflow
#   Input: tag = vX.Y.Z
#   Input: dry-run = false (default)
```

**Manual dispatch without a pre-pushed tag:** Checkout uses the job
token (`github.token`) only and does not persist it. When `dry-run` is false and the tag is
missing, the "Ensure tag exists" step creates the annotated tag and
pushes it with `RELEASE_PAT`. That secret is not used for checkout or
for `gh release create`.

`RELEASE_PAT` needs Contents read and write. The step checks
`permissions.push` before creating the tag. A missing secret, a token
GitHub rejects, a read-only token, and a `GH013` ruleset refusal are
separate failures. A ruleset refusal still needs an actor who is
allowed to bypass Tag Protection; widening the token does not replace
that. See [`docs/GITHUB-SETTINGS-GUIDE.md`](./GITHUB-SETTINGS-GUIDE.md).

**Dry-run mode:** `dry-run: true` builds, generates the SBOM, and
verifies attestations. It does not publish. If the tag does not
already exist, the run fails and creates nothing. A rehearsal needs a
tag that is already on the remote.

**Workflow flow:**

1. `git push --tags` triggers both `release-gate.yml` and
   `release-publish.yml` in parallel (tag `v*`)
2. Release Gate runs pre-flight + tests + build verify
   (informational -- does not block publish)
3. Release Publish build job creates tarball + CycloneDX SBOM
4. Release Publish release job generates attestations + publishes
   GitHub Release

**CI Status Guard:** The build job queries the GitHub Checks API and
requires the CI Status check on the resolved tag commit to be
`success`, including a manual `workflow_dispatch`. A missing or
unsuccessful check aborts the release.

> **History:** Prior to April 2026, `release-publish.yml` used a
> `workflow_run` trigger chained to Release Gate. This was replaced
> with a direct `push: tags` trigger because `workflow_run` caused
> persistent `startup_failure` errors (timing issues, exact name
> matching, permission inheritance).

## No Automation

This project does **not** use release-please, semantic-release, or similar tools.
Manual releases ensure full control over CHANGELOG quality and release timing.

**History:** release-please was active from v1.3.0-alpha to v1.4.0-alpha.
It was removed in v1.6.0 due to conflicts with the established manual release
workflow (PR #122 accidentally downgraded the version from 1.6.0 to 1.5.0).

## Release History

| Version | Date       | Theme                                                               |
| ------- | ---------- | ------------------------------------------------------------------- |
| v1.9.0  | 2026-07-01 | God-file splits, dbService refactor, AI disclaimers, Privacy Policy |
| v1.7.0  | 2026-04-11 | Voice & Accessibility Edition                                       |
| v1.6.3  | 2026-04-10 | Build Attestation + CycloneDX + Lint Ph5                            |
| v1.6.2  | 2026-04-10 | Release pipeline fix + SLSA L1 provenance                           |
| v1.6.0  | 2026-04-10 | WorkerBus W-02/W-04, CRDT Sync, API Docs                            |
| v1.5.1  | 2026-04-09 | Quality & Polish                                                    |
| v1.5.0  | 2026-04-08 | Multi-Grow, CRDT Sync, Dead Infra Cleanup                           |
| v1.4.1  | 2026-04-06 | Patch release                                                       |
| v1.4.0  | 2026-04-06 | Stable release                                                      |
| v1.3.0  | 2026-04-01 | Beta (alpha -> beta transition)                                     |

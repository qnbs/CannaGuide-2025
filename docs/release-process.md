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
5. Release Publish creates a **draft** release only. Review the draft (asset list,
   `SHA256SUMS`, `latest.json` URLs, attestations) and publish it by hand; nothing is public
   before that, and the desktop updater does not see a draft (its endpoint is
   `releases/latest/download/latest.json`).
6. Verify the published assets and attestations against the selected commit, then inspect
   actual deployed `version.json` bytes and platform-specific evidence. Do not rewrite
   existing release assets or tags to repair a failed publication.

## Versioning (SemVer)

| Bump  | When                                            | Example        |
| ----- | ----------------------------------------------- | -------------- |
| PATCH | Bug fixes, docs, CI, lint                       | 1.5.0 -> 1.5.1 |
| MINOR | New features, new slices, new services          | 1.5.1 -> 1.6.0 |
| MAJOR | Breaking changes (API, data format, migrations) | 1.6.0 -> 2.0.0 |

## Version Locations

All of these **must** carry the same version. `node scripts/release/check-desktop-version.mjs`
checks the desktop files in CI and, with `--tag`, again in Release Publish:

- `package.json` (root workspace)
- `apps/web/package.json`
- `apps/desktop/package.json`
- `apps/desktop/src-tauri/tauri.conf.json` (`version`: installer and updater version)
- `apps/desktop/src-tauri/Cargo.toml` and its `cannaguide-desktop` entry in `Cargo.lock`

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

1. `git push --tags` triggers `release-gate.yml` and `release-publish.yml`
   (tag `v*`). `desktop-build.yml` no longer runs on its own for a tag; Release
   Publish calls it, so the two cannot race.
2. Release Gate runs pre-flight + tests + build verify; the build job waits for it
   and for CI Status on the resolved tag commit.
3. Release Publish `build` refuses a tag whose commit is not on `main`: only merged,
   reviewed code is built with the updater signing key or released. It checks the tag
   against every version location, then
   creates the tarball + CycloneDX SBOM.
4. `desktop` calls `desktop-build.yml` for the resolved commit: Windows (MSI, NSIS),
   Linux (AppImage, deb) and macOS (dmg, Apple silicon and Intel), with
   minisign-signed updater bundles. `createUpdaterArtifacts` is turned on only here,
   through `src-tauri/tauri.updater.conf.json` (`--config`); the base `tauri.conf.json`
   leaves it off, so a local `tauri build` needs no signing key. Its `verify` job runs
   `scripts/release/desktop-release-manifest.mjs`, which **fails closed** when a target,
   installer or updater bundle is missing, an updater signature is missing or does not
   verify against the `tauri.conf.json` pubkey, or an installer carries another
   version. It writes normalized asset names, `latest.json` and `SHA256SUMS`.
5. `release` first checks that the run's own commit is the release commit: the
   attestation actions sign the run's commit (the OIDC `sha` claim), so a manual run
   from `main` for an older tag would attest a commit that did not build the assets.
   It stops instead; publish from the tag's own run, or dispatch from `main` only
   while `main`'s HEAD is the tag commit. It then attests the tarball and the desktop
   assets and creates a **draft**
   release with all of them. An existing release for the tag (published or draft)
   stops the run; nothing is overwritten (`--clobber` is gone). A stale draft from a
   failed run is deleted by hand before a re-run.

**Prefer pushing the tag.** A manual run that creates a missing tag pushes it with
`RELEASE_PAT` (so Release Gate runs), which also starts the tag's own Release Publish
run. That run queues behind the manual one, rebuilds, and stops at the
existing-release check before any attestation -- correct, but a wasted build.

**Desktop qualification without a release:** run Desktop Build manually on `main`.
It builds all four targets and runs the same verification, uploading
`desktop-release` (installers, updater bundles, signatures, `latest.json`,
`SHA256SUMS`) as an Actions artifact. A Release Publish dry-run does the same for an
existing tag's commit.

**Updater key:** installed apps verify every update against the minisign public key
in `tauri.conf.json` (key ID `F1B0337766BB36BD`, generated 2026-11-17). Its private
key and password are the `TAURI_SIGNING_PRIVATE_KEY` and
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD` repository secrets; the owner keeps an offline
backup. Without that key no update can be signed for installed apps, so losing it
strands every installation on its version. A rotation ships the new public key in an
update signed with the old key. `minisign.test.mjs` pins the key ID, so a swap is a
deliberate change.

**Platform signing:** the updater signature (`TAURI_SIGNING_PRIVATE_KEY`) is
required. Windows Authenticode and macOS Developer ID / notarization run only where
the certificates are provisioned; unsigned installers trigger OS warnings and are
documented as such in the release notes.

**Update channels:** the updater reads `releases/latest/download/latest.json`.
GitHub's `latest` is the newest published release that is neither a draft nor a
prerelease, and Release Publish marks every tag with a semver pre-release part
(`v1.12.0-rc.1`, `v1.12.0-1`, ...) as a prerelease. So a stable install is offered
only stable releases, and no installed app is ever offered a prerelease; testers
install one by hand (the manifest step prints a `[WARN]` for it). A prerelease install
moves to the next stable release once that is strictly newer: the app registers
`tauri-plugin-updater` without a custom comparator, and the default offers only a
higher semver (`1.12.0` replaces `1.12.0-rc.1`), so an older release is never offered
as a downgrade. Limitation: the Windows MSI ProductVersion is numeric
(`major.minor.patch.build`, Tauri `bundle.windows.wix.version`), so a non-numeric
pre-release such as `-rc.1` cannot be expressed and the MSI bundling step stops the
desktop build unless that field is set. Desktop prereleases are not supported yet;
stable releases are.

**In-app updates (desktop):** Settings > About shows an update card in the desktop
app only. The app checks once per launch, 15 seconds after start. Local-Only mode and
being offline block every check and download, automatic or manual, because both contact
github.com. Turning Local-Only mode on stops a running download, and `update.rs` mirrors
the mode and refuses as well. Every step is a click: check, download (with Cancel),
install. `tauri-plugin-updater` verifies the download against the updater key before any
byte is kept. A finished download survives leaving the About tab and a later check of
the same version. Checks time out after 30 seconds and downloads after 20 minutes.
Install first saves the latest changes, repeating while changes keep arriving (up to five
rounds). It stops if that save fails, reports "not saved", or the state never settles: an
edit made after the last save would be lost by the restart, so the install is refused and
the user retries. Right before the process then ends -- the restart on macOS and Linux, the installer taking over on Windows (the plugin's `on_before_exit` hook) -- `update.rs` emits `cannaguide://save-before-restart` and waits up to 10 seconds for `confirm_final_save`, so an edit made while the install ran is saved too. The card only shows the updater's shared state, so reopening About
during a download, or a newer release found by the startup check, updates it at once. On Windows the installer ends the process from
inside the install command, so there is no later chance to save.

The webview has no permission for the updater plugin's own commands (they would skip
both the question and the save). The app's update commands in `src-tauri/src/update.rs`
are callable by code in the webview, like every app command in Tauri v2, so they are no
security boundary against code running there. That boundary is the webview's content:
the bundled app under its CSP.

**Quit handshake (desktop):** the tray Quit, the close button and Cmd+Q all ask the web
app to save first (`tauri://before-quit`). The app exits when the save has finished
(`confirm_quit`), or after 10 seconds if the web app never answers. A save still running at that point is cut off, so the guarantee is "waits for the save, up to 10 seconds". The listener is
registered before the slower startup work. Before, the tray quit exited after a fixed
250 ms and the close button did not wait at all.

**Manual acceptance of a real update** (CI cannot install and relaunch a desktop app;
deferred by the owner, not yet done). 1.12.0 is the first version with a working
updater, so the first qualification needs two updater-capable builds:

1. Install the published 1.12.0 (the baseline) on each platform and create some data.
2. Publish the next release (1.12.1 or later) through this process, or, without
   publishing, build a test bundle with a higher version and serve its `latest.json`
   from a local server that a test build of the baseline points to
   (`plugins.updater.endpoints` through an extra `--config` overlay).
3. In the installed app use Settings > About: check, download, install. The app must
   restart into the new version with all grows, plants and settings intact.
4. Check that a bundle with a tampered signature is refused, that Local-Only mode shows
   the blocked notice instead of contacting the server, and that tray Quit, the close
   button and Cmd+Q keep a change made just before quitting.

Later releases repeat steps 1 and 3 from the previous release.

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

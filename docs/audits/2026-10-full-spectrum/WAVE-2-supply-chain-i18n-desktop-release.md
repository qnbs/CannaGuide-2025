# Wave 2 -- Supply Chain, i18n Gate Truth, Desktop / Tauri, Release v1.10.0 Verification

**Date:** 2026-10-08
**Audited heads:** `3d8b706d` for lockfile, locale and Tauri source reads; `c49560d9` (v1.10.0) for the
live release checks. The only difference between the two heads is the release commit (CHANGELOG,
README badges, root and `apps/web` `package.json`); no wave-1 or wave-2 finding is affected.
**Method:** see [`README.md`](./README.md). `pnpm audit` was run once, on the snapshot lockfile in a
scratch directory (it contacts the registry advisory endpoint; nothing was installed).

## 1. Dependency advisories (DEP-001, S3, CONFIRMED)

The scan covered 1688 dependencies (261 production, 1369 development, 198 optional) and returned
**11 advisories, all severity moderate**. The tool's summary object additionally states `high: 3`,
but the advisory list contains none with severity high; this was not reconciled. The CI gate
(`pnpm audit --audit-level=high` in `ci.yml` and `dependency-health.yml`) is the authority and its
latest run should be consulted before relying on either number.

| Package (resolved)               | Advisories                                                                         | Patched in         | Reaches via                                                            | Class                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `fflate` 0.8.2                   | GHSA-px8p-9vwx-vf98                                                                | >= 0.8.3           | `apps/web` -> `jspdf`, `jspdf-autotable` (runtime dependencies)        | runtime                                                |
| `ip-address` 10.4.0              | GHSA-rpw4-54j3-4h4q, GHSA-2vr4-cq9g-pvrc, GHSA-j6r3-76f7-8jcv, GHSA-h3mg-xc3c-68pw | >= 10.5.1 / 10.7.1 | `apps/web` -> `mqtt` (runtime dependency) -> `socks`; also dev tooling | runtime path; browser bundling of this code unverified |
| `qs` 6.15.2                      | GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g                                           | >= 6.15.4 / 6.16.0 | `@lhci/cli`, `@stryker-mutator/*`                                      | dev tooling                                            |
| `markdown-it` 14.3.0             | GHSA-253c-mchw-3w2r                                                                | >= 14.3.1          | `typedoc`                                                              | dev tooling                                            |
| `@humanfs/node` 0.16.7           | GHSA-p498-v437-472g                                                                | >= 0.16.8          | `eslint`                                                               | dev tooling                                            |
| `sprintf-js` 1.0.3               | GHSA-hp3w-g68c-fv3c                                                                | >= 1.1.4           | `@lhci/cli`, `depcheck` via `argparse` / `js-yaml@3`                   | dev tooling                                            |
| `postcss-selector-parser` 6.0.10 | GHSA-rj75-hqrm-r3gf                                                                | >= 7.1.6           | `@tailwindcss/typography`                                              | build tooling                                          |

Not assessed: exploitability (needs per-advisory reading of attacker-controlled input paths). The
table is reachability by dependency edge only.

### Why the repository's own override machinery does not catch this

- `pnpm-workspace.yaml` pins `qs: '>=6.15.2'` and `markdown-it: '>=14.2.0'` -- floors **below** the
  patched versions -- and `.github/dependabot.yml` **ignores** both packages (the documented
  override / ignore pair). The lockfile therefore sits on the vulnerable `qs@6.15.2` and
  `markdown-it@14.3.0`, and neither the override nor Dependabot will move them. Both are on the
  `LEGACY_UNBOUNDED` allow-list of `scripts/security/check-override-floors.mjs`, a ratchet that only
  prevents new unbounded floors.
- `ip-address: '>=10.3.1 <11'` is bounded but its floor is also below the patched versions; the
  lockfile resolves 10.4.0 (not Dependabot-ignored, so a bump is possible).
- `fflate` appears twice in the lockfile (0.8.2 and 0.8.3); `jspdf` stays on the vulnerable copy.
- The CI threshold is `high`, so moderate advisories never fail a gate.
- This is `CLAUDE.md` trap 4 with a concrete instance: an override floor that stops at the
  vulnerable version is a pin on the vulnerability.

Remediation: draft D8.

## 2. i18n gate truth (I18N-001, S3, CONFIRMED)

- `check:i18n` (`scripts/check-i18n-completeness.mjs`) is wired into `ci.yml` and `release-gate.yml`.
  `REQUIRED_LANGS = {'de'}`: **es, fr and nl are warn-only**.
- `check:i18n-usage` and `lint:i18n` are defined in `package.json` but referenced by no workflow and
  no hook; `lint:i18n` also exits 0 unless `CHECK_I18N_STRICT=1`.
- `CLAUDE.md` describes all three as gates that "gate locale parity" and as part of "done"; that is
  true only for `check:i18n`, and only for `de`.
- The real gap is already recorded in `docs/i18n-parity-backlog.md` (help about 217 keys, strains
  about 150, plants about 32 keys for fr only; no `strains/` catalog directory for es / fr / nl;
  `common` is structurally complete through an `...enCommon` spread). No tracker issue mirrored it.
- An AST-based key diff without spread resolution gives lower bounds consistent with that document
  (es / fr / nl: help 144 and strains 103 keys missing as literal keys; 27 `strains/*.ts` files
  absent). The `common` numbers of such a diff are an artifact of the spread and must not be quoted.
- `fallbackLng: 'en'` means gaps render English, never raw keys, so smoke tests stay green.
- Positive: `de` has every `en` key (0 missing).

Remediation: draft D7.

## 3. Desktop / Tauri review (DESKTOP-001 extension, DESKTOP-002)

Scope: `apps/desktop/src-tauri` -- `src/lib.rs` (174 lines, the only Rust file besides a 6-line
`main.rs`), `tauri.conf.json`, nine capability files.

**Positive.** Four narrow commands only (`get_app_version`, `get_native_capabilities`,
`open_log_dir`, `clear_native_cache`); no arbitrary-path or shell command is exposed from Rust;
`withGlobalTauri: false`; `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`; the connect
allow-list equals the web allow-list; the updater has a real minisign public key; the window-state,
store, notification and dialog capabilities are minimal; the fs write permission has a deny list
for `$HOME/*`, `$DESKTOP/*`, `$EXE/*`, `$RESOURCE/*`.

**Findings.**

1. **Distribution chain is broken end to end (DESKTOP-002, S3).** The `Desktop Build (Tauri v2)`
   workflow has exactly three runs in its history, all `push` on tags (v1.8.2, v1.9.0, v1.10.0), all
   `startup_failure` with zero jobs; there has never been a `workflow_dispatch` run. CI has never
   produced a desktop artifact. The repository's GitHub Actions policy is `allowed_actions:
selected` and `desktop-build.yml` is the only workflow using `pnpm/action-setup` (added in the
   scaffold commit), for which no allow-list pattern exists; every other workflow sets up pnpm via
   a Corepack composite action. That is the most probable cause (PLAUSIBLE): GitHub gives no log for
   startup failures, the run page annotation shows the reason. Additionally `tauri.conf.json` has no
   `bundle.createUpdaterArtifacts`, the `tauri-action` step has no `tagName` / `releaseId`, nothing
   publishes `latest.json`, and the configured updater endpoint
   `https://github.com/qnbs/CannaGuide-2025/releases/latest/download/latest.json` returns HTTP 404
   (probed 2026-10-08). `docs/distribution.md` and ADR 0012 document the endpoint as if it worked.
   Impact today is low (no desktop installers are published), but the signing-secret wiring, the
   updater key and the documentation describe a pipeline that has never run. Draft D9.
2. **`get_native_capabilities` returns hard-coded `true`** for fs, dialog, notification, tray,
   shortcut, updater, window_state and store although its comment says it mirrors the capability
   files. The frontend uses it to feature-flag UI. Low.
3. **`open_log_dir` only returns the path**, it does not open anything; the name promises an action.
   Low.
4. **`clear_native_cache` adds directory entry sizes, not content sizes,** to `bytes_freed`, so the
   displayed number is wrong for non-empty sub-directories. Low.
5. **CSP:** `script-src 'unsafe-inline'` and `img-src ... https:` (any HTTPS host) are broader than
   needed; combined with the fs scope of DESKTOP-001, script injection reaches readable JSON under
   Documents. Covered by draft D6.
6. **Plugin hygiene:** `tauri_plugin_process` is registered without a capability, and
   `tauri_plugin_shell` is registered only for `shell:allow-open`, the deprecated route in Tauri v2
   (the opener plugin replaces it). Covered by drafts D6 / D9.

Not reviewed: `Cargo.lock` dependency audit (`cargo audit` not run), signing and notarization
(never executed), packaging behaviour on Windows and macOS.

## 4. Release v1.10.0 verification (read-only, 2026-10-08)

| Check               | Result                                                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tag `v1.10.0`       | exists, annotated, tagger `github-actions[bot]` (2026-10-07T23:44:20Z), target `c49560d9d3d36c9a84f71e3095a8e3a3eea3534a` -- the intended SHA; the tag object is unsigned (rulesets require signed commits, not signed tags; informational) |
| GitHub Release      | published 2026-10-07T23:51:03Z, not draft, not prerelease; assets: `cannaguide-v1.10.0-dist.tar.gz`, `cannaguide-sbom.cyclonedx.json` (attestation presence not checked)                                                                    |
| Runs on the tag     | `Release Publish` (push) success; `Release Gate` (push) success; an earlier `Release Publish` (dispatch) run shows `cancelled`; `Desktop Build` (push) `startup_failure` (see finding 1)                                                    |
| Host identity       | Vercel, Cloudflare Pages and GitHub Pages all report `1.10.0+c49560d9d3`                                                                                                                                                                    |
| Main                | `c49560d9`, 0 open PRs at the time of the check; compared with `3d8b706d`: 1 commit, 4 files                                                                                                                                                |
| Not verifiable here | Cloudflare anchors and rollbacks (no credential)                                                                                                                                                                                            |

## 5. Corrections and open items

- A statement made earlier in the audit that the release version still needed confirmation was
  stale; the version had already been confirmed and shipped.
- Open after wave 2: exploitability review per advisory, `cargo audit`, license review, hostile
  import / restore exercise, screen-reader evidence (wave 3 closes the app-shell items).

# Finding Ledger -- Index, Schema and Reconciliation

Canonical, version-controlled record of the 2026-10 audit findings. Evidence lives here; the private tracker keeps only the compact control plane (owner, priority, sequencing, gates). **No finding is filed as a tracker issue by default**; findings map to existing owners or are marked `UNASSIGNED` with `PENDING_AUTHORIZATION` for escalation (decision CG-DEC-001).

Authority at the time of writing: `main` = `c49560d9d3d36c9a84f71e3095a8e3a3eea3534a` (v1.10.0), open PRs #550 (privacy, Cursor lane) and #551 (this documentation). Code-level findings were revalidated against `origin/main` on 2026-10-08; the revalidation line in each block states the result.

## Files

- [`LEDGER-A-product-privacy-pwa-ux-perf.md`](./LEDGER-A-product-privacy-pwa-ux-perf.md) and [`LEDGER-B-ci-release-supply-chain-desktop-docs.md`](./LEDGER-B-ci-release-supply-chain-desktop-docs.md): the finding blocks.
- [`COVERAGE-AND-POSITIVES.md`](./COVERAGE-AND-POSITIVES.md): coverage per domain, verified positives, unknowns.
- [`DECISIONS.md`](./DECISIONS.md): durable decisions. [`WORKSTREAMS.md`](./WORKSTREAMS.md): clustering and sequencing. [`IMPLEMENTATION-BRIEFS.md`](./IMPLEMENTATION-BRIEFS.md): implementation-ready briefs. Wave reports (`WAVE-1`..`WAVE-3`) and `REPOSITORY-MAP.md` are the narrative provenance.

## Finding schema

Every block carries: ID, title, wave and authority snapshot (date, main), domain, severity, confidence, status, affected surface, observed and expected behaviour, evidence, diagnosis, risk / production / release relevance, GitHub owner, Linear owner, active PR, required correction, acceptance criteria, verification method, disposition, implementation status, dependencies, user gate, provider gate, follow-up, whether Linear escalation is required (YES / NO / PENDING_AUTHORIZATION), and the live-main revalidation result. No secrets, tokens, credentials or personal data are stored.

## Vocabulary

- **Status:** OPEN, INVESTIGATING, CONFIRMED, OWNED_BY_ACTIVE_PR, QUEUED_EXISTING_OWNER, VALID_AND_FIXED, VALID_AND_DEFERRED_WITH_ACCEPTANCE_CRITERION, INVALID_WITH_EVIDENCE, DUPLICATE, NO_SIGNAL, BLOCKED_BY_USER_GATE, BLOCKED_BY_PROVIDER, TERMINAL. A missing or rate-limited reviewer is NO_SIGNAL, never PASS.
- **Severity:** S0 catastrophic or immediate data-loss / privacy / security / production-integrity emergency; S1 release-blocking correctness / security / privacy defect; S2 important verified defect or major quality failure; S3 bounded defect or quality / test / UX gap; S4 low-risk improvement or observation. Severity is evidence-based and not inflated.
- **Confidence:** CONFIRMED, HIGH, MEDIUM, LOW, UNKNOWN_NEEDS_EVIDENCE. Observation, inference and confirmation are kept apart in the evidence text.
- **Supersession:** later waves never delete earlier evidence; corrections are recorded as DUPLICATE / INVALID_WITH_EVIDENCE rows below and in the README correction list.

## Finding index

| ID  | Title                                                                                                                    | Wave | Sev | Conf.     | Status                | Linear owner                                    | Workstream           | Ledger |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ---- | --- | --------- | --------------------- | ----------------------------------------------- | -------------------- | ------ |
| 001 | windows-doctor accepts Node 25 and 26 as "matches engines"                                                               | 0    | S3  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-263                                         | WS-TOOLCHAIN         | B      |
| 002 | Node version is declared in several places instead of one source                                                         | 0    | S4  | HIGH      | QUEUED_EXISTING_OWNER | QNB-264                                         | WS-TOOLCHAIN         | B      |
| 003 | Node 26 admission has no CI proof lane                                                                                   | 0    | S4  | HIGH      | QUEUED_EXISTING_OWNER | QNB-251, QNB-265                                | WS-TOOLCHAIN         | B      |
| 004 | Documentation drift inventory (nine rows) against live platform state                                                    | 0    | S3  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-266                                         | WS-DOCS-TRUTH        | B      |
| 005 | Cloudflare Pages control plane cannot be verified without a read-only credential                                         | 0    | S3  | CONFIRMED | BLOCKED_BY_USER_GATE  | QNB-267                                         | WS-RETENTION-OPS     | B      |
| 006 | The three-host production parity probe is not codified                                                                   | 0    | S4  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-268                                         | WS-RELEASE-OPS       | B      |
| 007 | Retention classifier leaves provably superseded unaliased Cloudflare previews as UNKNOWN                                 | 0    | S3  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-270                                         | WS-RETENTION-OPS     | B      |
| 008 | Merged-PR preview residue on Cloudflare stays UNKNOWN; deleted hostnames can keep serving                                | 0    | S3  | HIGH      | QUEUED_EXISTING_OWNER | QNB-272                                         | WS-RETENTION-OPS     | B      |
| 009 | Release Publish "dry-run" dispatch creates and pushes a missing release tag                                              | 0    | S2  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-271                                         | WS-RELEASE-OPS       | B      |
| 010 | Release credential coupling: checkout uses the release token with github.token as fallback only when it is empty         | 0    | S2  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-271                                         | WS-RELEASE-OPS       | B      |
| 011 | Labeler workflow uses the pull_request_target trigger                                                                    | 0    | S3  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-252                                         | WS-CI-GOVERNANCE     | B      |
| 012 | Vercel project Node setting was 22.x while the repository requires Node 24                                               | 0    | S3  | CONFIRMED | VALID_AND_FIXED       | QNB-242 (Done)                                  | WS-RETENTION-OPS     | B      |
| 013 | Twenty generated Vercel aliases survived after their deployments were deleted                                            | 0    | S3  | CONFIRMED | VALID_AND_FIXED       | QNB-245 (Done)                                  | WS-RETENTION-OPS     | B      |
| 014 | Native Vercel retention is dashboard-only, so drift is invisible                                                         | 0    | S4  | HIGH      | QUEUED_EXISTING_OWNER | QNB-249                                         | WS-RETENTION-OPS     | B      |
| 015 | The Vercel half of the retention workflow is fail-closed because no deployment token exists                              | 0    | S3  | CONFIRMED | BLOCKED_BY_USER_GATE  | QNB-229, QNB-233                                | WS-RETENTION-OPS     | B      |
| 016 | Retention workflow guards contradicted their classifier and provider nullability (historical)                            | 0    | S2  | CONFIRMED | VALID_AND_FIXED       | QNB-228, QNB-244 (Done)                         | WS-RETENTION-OPS     | B      |
| 017 | In-app privacy statement lists connections that do not exist and omits processors that can be contacted                  | 1    | S2  | CONFIRMED | OWNED_BY_ACTIVE_PR    | QNB-273                                         | WS-PRIVACY           | A      |
| 018 | "Erase all data" leaves databases behind and can report success while a delete is blocked                                | 1    | S2  | CONFIRMED | OWNED_BY_ACTIVE_PR    | QNB-273                                         | WS-PRIVACY           | A      |
| 019 | Onboarding promises cross-device sync that does not exist                                                                | 1    | S3  | CONFIRMED | OWNED_BY_ACTIVE_PR    | QNB-273 (slice C)                               | WS-PRIVACY           | A      |
| 020 | Outdated legal reference (section 5 TMG) and unreviewed imprint rationale                                                | 1    | S3  | CONFIRMED | BLOCKED_BY_USER_GATE  | QNB-273                                         | WS-PRIVACY           | A      |
| 021 | Strain lookups fall back to third-party CORS proxies                                                                     | 1    | S3  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-274                                         | WS-CSP-NETWORK       | A      |
| 022 | Community Share, strain lookups and the Cansativa call hosts the production CSP blocks                                   | 1    | S2  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-274                                         | WS-CSP-NETWORK       | A      |
| 023 | Cloud sync is only a stopgap flag; the product path is undecided                                                         | 1    | S2  | CONFIRMED | BLOCKED_BY_USER_GATE  | QNB-275                                         | WS-SYNC-DECISION     | A      |
| 024 | Service worker auto-activates and the page reloads while the UI also shows an update prompt                              | 1    | S3  | HIGH      | QUEUED_EXISTING_OWNER | QNB-237                                         | WS-PWA-OFFLINE       | A      |
| 025 | 14 contrast pairs below WCAG AA and strict accessibility gates are off                                                   | 1    | S2  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-238                                         | WS-UX-A11Y           | A      |
| 026 | First run requires 10 mandatory screens with no skip, no close and a double language choice                              | 1    | S2  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-238                                         | WS-UX-A11Y           | A      |
| 027 | Deploy, signing and release credentials are not isolated behind approval or ref rules (design level)                     | 1    | S2  | HIGH      | OPEN                  | UNASSIGNED                                      | WS-CI-GOVERNANCE     | B      |
| 028 | Live ruleset state differs from the repository's expected state and from CLAUDE.md claims (design level)                 | 1    | S3  | CONFIRMED | OPEN                  | UNASSIGNED                                      | WS-CI-GOVERNANCE     | B      |
| 029 | Persisted and network JSON is cast with `as T` at 34 trust-boundary sites                                                | 1    | S3  | CONFIRMED | OPEN                  | UNASSIGNED (related QNB-256)                    | WS-TEST-QUALITY      | B      |
| 030 | Tauri filesystem scope allows any `$DOCUMENT/**/*.json` and the webview CSP keeps unsafe-inline                          | 1    | S2  | HIGH      | OPEN                  | UNASSIGNED                                      | WS-DESKTOP           | B      |
| 031 | Critical-path coverage gate covers 4 files; persistence adapter and core provider services lack tests                    | 1    | S3  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-256, QNB-235                                | WS-TEST-QUALITY      | B      |
| 032 | Dangling `.cursor/rules` pointer and CLAUDE.md claims that differ from reality                                           | 1    | S4  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-266                                         | WS-DOCS-TRUTH        | B      |
| 033 | Override floors for qs and markdown-it sit below the patched versions and Dependabot ignores both                        | 2    | S3  | CONFIRMED | OPEN                  | UNASSIGNED                                      | WS-DEPS-SUPPLY-CHAIN | B      |
| 034 | extract-zip has two high advisories and no patched version (development tooling)                                         | 2    | S3  | CONFIRMED | OPEN                  | UNASSIGNED                                      | WS-DEPS-SUPPLY-CHAIN | B      |
| 035 | Rust glib 0.18.5 advisory in the desktop lockfile and no cargo audit step                                                | 2    | S3  | CONFIRMED | OPEN                  | UNASSIGNED                                      | WS-DESKTOP           | B      |
| 036 | fflate (via jspdf) and ip-address (via mqtt) advisories lie on runtime dependency paths                                  | 2    | S3  | MEDIUM    | OPEN                  | UNASSIGNED                                      | WS-DEPS-SUPPLY-CHAIN | B      |
| 037 | Only check:i18n is wired and only for German; check:i18n-usage and lint:i18n run nowhere                                 | 2    | S3  | CONFIRMED | OPEN                  | UNASSIGNED (related QNB-266)                    | WS-I18N              | B      |
| 038 | Desktop Build fails at startup on every tag push and the updater endpoint returns 404                                    | 2    | S3  | CONFIRMED | OPEN                  | QNB-254 (sequencing); implementation UNASSIGNED | WS-RELEASE-OPS       | B      |
| 039 | Small Tauri command defects: hard-coded capability flags, misnamed open_log_dir, wrong cache byte count                  | 2    | S4  | CONFIRMED | OPEN                  | UNASSIGNED                                      | WS-DESKTOP           | B      |
| 040 | The v1.10.0 tag object is unsigned (informational)                                                                       | 2    | S4  | CONFIRMED | TERMINAL              | none                                            | WS-RELEASE-OPS       | B      |
| 041 | Settings has critical axe violations in 10 of 12 sub-tabs with one shared root cause                                     | 3    | S2  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-238                                         | WS-UX-A11Y           | A      |
| 042 | Strains view has 21 interactive targets below 24x24 CSS pixels                                                           | 3    | S4  | CONFIRMED | OPEN                  | QNB-238 (note)                                  | WS-UX-A11Y           | A      |
| 043 | Two eval CSP reports per load come from Zod 4's JIT capability probe                                                     | 3    | S4  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-274 (acceptance item 4)                     | WS-CSP-NETWORK       | A      |
| 044 | The entry preloads 50 assets (about 679 KB brotli) and 58% is feature-specific code; the repository metric cannot see it | 3    | S3  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-236                                         | WS-PERFORMANCE       | A      |
| 045 | ONNX Runtime WASM (about 25.6 MiB) is loaded from a public CDN at runtime without an integrity check                     | 3    | S3  | CONFIRMED | OPEN                  | UNASSIGNED                                      | WS-DEPS-SUPPLY-CHAIN | A      |
| 046 | Sentry session replay has masking explicitly disabled (inert today)                                                      | 3    | S3  | CONFIRMED | OPEN                  | UNASSIGNED (related QNB-273)                    | WS-PRIVACY           | A      |
| 047 | GitHub Pages is not cross-origin isolated, so SharedArrayBuffer is unavailable there                                     | 3    | S4  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-261, QNB-237                                | WS-PWA-OFFLINE       | A      |
| 048 | PR 550 review note: the registry scanner test is closed-world                                                            | 3    | S3  | CONFIRMED | OWNED_BY_ACTIVE_PR    | QNB-273                                         | WS-PRIVACY           | A      |
| 049 | PR 550 review note: data export opens databases without an existence check and creates missing ones                      | 3    | S3  | CONFIRMED | OWNED_BY_ACTIVE_PR    | QNB-273                                         | WS-PRIVACY           | A      |
| 050 | PR 550 review note: the export dumps the whole localStorage and the secure database                                      | 3    | S4  | CONFIRMED | OWNED_BY_ACTIVE_PR    | QNB-273                                         | WS-PRIVACY           | A      |
| 051 | PR 550 review note: unverified absence can be reported as confirmed erasure                                              | 3    | S3  | CONFIRMED | OWNED_BY_ACTIVE_PR    | QNB-273                                         | WS-PRIVACY           | A      |
| 052 | Vercel reports "Deployment rate limited - retry in 24 hours" on a docs-only PR                                           | 3    | S4  | CONFIRMED | QUEUED_EXISTING_OWNER | QNB-249                                         | WS-RETENTION-OPS     | B      |

(IDs are `CG-AUD-20261008-` plus the three digits.)

## Legacy names used in the wave reports

The wave reports were written before the stable IDs existed and keep their working names as provenance.

| Legacy name         | Stable ID(s) (last three digits) |
| ------------------- | -------------------------------- |
| PRIV-001 (F1-F5)    | 017, 018, 019, 020, 021          |
| CSP-001             | 022                              |
| SYNC-001            | 023                              |
| PWA-001             | 024                              |
| A11Y-001            | 025, 041                         |
| UX-001              | 026                              |
| CI-001              | 027                              |
| GOV-001             | 028                              |
| TYPE-001            | 029                              |
| DESKTOP-001         | 030                              |
| TEST-001            | 031                              |
| DOC-001             | 032, 004                         |
| DEP-001             | 033, 034, 035, 036               |
| I18N-001            | 037                              |
| DESKTOP-002         | 038                              |
| PERF-001            | 044                              |
| EVAL-001            | 043                              |
| SENTRY-001          | 046                              |
| AI-001              | 045                              |
| PARITY-001          | 047                              |
| PR 550 review notes | 048, 049, 050, 051               |

## Counters and reconciliation

| Counter                                   | Value                |
| ----------------------------------------- | -------------------- |
| RAW_OBSERVATIONS                          | 100                  |
| STABLE_FINDINGS                           | 52                   |
| CONFIRMED (confidence)                    | 44                   |
| DUPLICATES (merged observations)          | 8                    |
| INVALID_WITH_EVIDENCE                     | 5                    |
| UNKNOWN_NEEDS_EVIDENCE (coverage gaps)    | 13                   |
| VERIFIED_POSITIVES                        | 22                   |
| OWNED_BY_EXISTING_LINEAR                  | 39                   |
| UNASSIGNED                                | 12                   |
| VALID_AND_FIXED                           | 3                    |
| TERMINAL                                  | 1                    |
| NEW_LINEAR_ISSUES_CREATED (this campaign) | 0                    |
| Severity S0 / S1 / S2 / S3 / S4           | 0 / 0 / 12 / 28 / 12 |

**Reconciliation:** RAW_OBSERVATIONS (100) = STABLE_FINDINGS (52) + DUPLICATES (8) + INVALID_WITH_EVIDENCE (5) + VERIFIED_POSITIVES (22) + UNKNOWN_NEEDS_EVIDENCE (13). Nothing is dropped silently. `OWNED_BY_EXISTING_LINEAR` + `UNASSIGNED` + findings without a tracker owner (1) = 52.

| Status                | Findings |
| --------------------- | -------- |
| OPEN                  | 14       |
| OWNED_BY_ACTIVE_PR    | 7        |
| QUEUED_EXISTING_OWNER | 23       |
| VALID_AND_FIXED       | 3        |
| BLOCKED_BY_USER_GATE  | 4        |
| TERMINAL              | 1        |

## Wave checkpoints

| Wave | Scope                                                            | Date       | Authority (main)     | Findings | Severity mix       |
| ---- | ---------------------------------------------------------------- | ---------- | -------------------- | -------- | ------------------ |
| 0    | Wave 0 (imported infrastructure and release-readiness audit)     | 2026-10-07 | 3500cefb -> 3d8b706d | 16       | 3 S2 / 9 S3 / 4 S4 |
| 1    | Wave 1 (security, privacy, data, PWA, UX)                        | 2026-10-07 | 3d8b706d             | 16       | 8 S2 / 7 S3 / 1 S4 |
| 2    | Wave 2 (supply chain, i18n gates, desktop, release verification) | 2026-10-08 | 3d8b706d / c49560d9  | 8        | 0 S2 / 6 S3 / 2 S4 |
| 3    | Wave 3 (app shell, runtime, performance, review notes)           | 2026-10-08 | c49560d9             | 12       | 1 S2 / 6 S3 / 5 S4 |

Active implementation collision: **NO** (this PR is documentation-only under `docs/audits/`; PR #550 touches locales, services and stores). Mutation lease: Cursor holds the source lane (QNB-273 / #550); this documentation lane operates under the owner's explicit instruction recorded in QNB-259.

## Duplicates and merged observations

| Row    | Observation                                                                                  | Merged into                                | Note                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| DUP-01 | First Settings count "9 of 12 tabs" (Strain View not yet reached)                            | CG-AUD-20261008-041                        | Corrected to 10 of 12 within the same finding                                                                    |
| DUP-02 | "76 unlabeled controls" framing of the static lint ceiling                                   | CG-AUD-20261008-041                        | Same defect measured statically; the runtime finding supersedes the framing; ceiling kept in CG-AUD-20261008-025 |
| DUP-03 | First performance datum (73 requests, about 1.1 MB JS transferred, cold)                     | CG-AUD-20261008-044                        | Superseded by the preload-set measurement; kept as the timing baseline inside the finding                        |
| DUP-04 | First observation of the two eval CSP reports (source unknown)                               | CG-AUD-20261008-043                        | Source later confirmed (Zod 4 JIT probe)                                                                         |
| DUP-05 | First dependency summary "11 advisories, all moderate"                                       | CG-AUD-20261008-033 to CG-AUD-20261008-036 | Superseded by the union with Dependabot (2 high, 9 moderate)                                                     |
| DUP-06 | Desktop Build startup_failure recorded separately in the recurring-miss ledger and in wave 2 | CG-AUD-20261008-038                        | One root-cause finding                                                                                           |
| DUP-07 | Tauri fs scope (wave 1) and the CSP / plugin items found in the Rust review (wave 2)         | CG-AUD-20261008-030                        | One design finding; small code defects split into CG-AUD-20261008-039                                            |
| DUP-08 | Rows 2 to 9 of the nine-row documentation drift inventory (row 1 is the finding itself)      | CG-AUD-20261008-004                        | One finding with a row table                                                                                     |

## Invalid with evidence

| Row    | Claim                                                                | Evidence                                                                                                | Status                |
| ------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------- |
| INV-01 | i18n gaps in the `common` namespace reported by a first AST key diff | The diff did not resolve the `...enCommon` spread; docs/i18n-parity-backlog.md independently refutes it | INVALID_WITH_EVIDENCE |
| INV-02 | Literal localStorage key "api-key" suggested a plaintext key store   | No non-test source references the literal; the grep hit came from a test pattern                        | INVALID_WITH_EVIDENCE |
| INV-03 | "The release version still needs owner confirmation"                 | Stale: the version was already confirmed, merged and released (tag, Release, three hosts)               | INVALID_WITH_EVIDENCE |
| INV-04 | "A dependency is the source of the eval CSP reports"                 | Attribution had no evidence; the chunk shows Zod 4's own probe (CG-AUD-20261008-043)                    | INVALID_WITH_EVIDENCE |
| INV-05 | "Sentry replay would run with default masking"                       | Source sets maskAllText and blockAllMedia to false explicitly (CG-AUD-20261008-046)                     | INVALID_WITH_EVIDENCE |

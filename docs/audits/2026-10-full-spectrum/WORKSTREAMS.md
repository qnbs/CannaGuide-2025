# Workstreams

Replaces issue-per-finding growth: 52 findings are clustered into 15 bounded workstreams, each mapped to an existing tracker owner wherever one exists. Priority and sequencing reflect the state at 2026-10-08 and must be re-fetched before use.

| Workstream           | Existing Linear owner                                 | Priority                           | Owner state        | User / provider gates                                      | Sequencing                                                                                                                   |
| -------------------- | ----------------------------------------------------- | ---------------------------------- | ------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| WS-PRIVACY           | QNB-273 (PR #550)                                     | High                               | Active source lane | Legal review; PR #550 merge and resulting-main proof       | Run first (already active). Findings 046 (Sentry) is outside the PR scope and queues after it.                               |
| WS-CSP-NETWORK       | QNB-274                                               | High                               | Todo               | Product decision for any allow-list                        | After WS-PRIVACY: gate dishonest features, remove the proxy fallback, set Zod jitless.                                       |
| WS-SYNC-DECISION     | QNB-275                                               | Low                                | Backlog            | Owner product decision                                     | Decision only; no engineering until decided.                                                                                 |
| WS-PWA-OFFLINE       | QNB-237, QNB-261                                      | Medium                             | Todo / In Progress | Two deployments needed to observe the update lifecycle     | With the deployed-lifecycle qualification.                                                                                   |
| WS-UX-A11Y           | QNB-238                                               | High (Settings fix), Medium (rest) | Todo               | Owner decisions on required gate steps (first-use UX)      | Settings naming fix first (largest effect, single root cause), then contrast, then onboarding.                               |
| WS-PERFORMANCE       | QNB-236                                               | Medium                             | Backlog            | none                                                       | After the privacy and CSP slices; metric first, then import-graph fixes.                                                     |
| WS-CI-GOVERNANCE     | QNB-252 (labeler); UNASSIGNED (credentials, rulesets) | Medium                             | Todo / unassigned  | Owner/admin settings                                       | After the release lane is quiet and the source lease is free; settings-level items need the owner.                           |
| WS-RELEASE-OPS       | QNB-271, QNB-268, QNB-254 (desktop sequencing)        | High (dry-run), Medium (rest)      | Todo / Backlog     | Run annotation read by the owner (desktop)                 | Before the next release cycle: dry-run side effect and credential scoping; desktop build diagnosis before any source change. |
| WS-RETENTION-OPS     | QNB-232, 233, 249, 267, 270, 272, 229                 | Medium                             | Mixed              | Vercel token; Cloudflare read access; force=true decision  | Continue under the existing retention owners; observation window ends 2026-10-08.                                            |
| WS-TOOLCHAIN         | QNB-263, 264, 251, 265                                | Medium / Low                       | Backlog            | Vercel Node 26 support                                     | After the lease frees; never move the baseline because a newer version exists.                                               |
| WS-DEPS-SUPPLY-CHAIN | UNASSIGNED (related QNB-266)                          | Medium (runtime pair), Low (dev)   | unassigned         | none                                                       | After the source lease; lockfile changes need frozen-lockfile CI.                                                            |
| WS-DESKTOP           | UNASSIGNED (QNB-254 sequencing)                       | Medium                             | unassigned         | Upstream Tauri (glib); lease forbids desktop edits for now | After WS-RELEASE-OPS diagnosis.                                                                                              |
| WS-TEST-QUALITY      | QNB-256, QNB-235                                      | Medium                             | Backlog            | none                                                       | Continuous; trust-boundary validation unassigned.                                                                            |
| WS-DOCS-TRUTH        | QNB-266                                               | Low                                | Backlog            | none                                                       | One batched docs PR after the next merge window.                                                                             |
| WS-I18N              | UNASSIGNED (related QNB-266)                          | Low                                | unassigned         | none                                                       | Gate wiring first; backfill per docs/i18n-parity-backlog.md.                                                                 |

## Findings per workstream

- **WS-PRIVACY:** 017, 018, 019, 020, 046, 048, 049, 050, 051 (9)
- **WS-CSP-NETWORK:** 021, 022, 043 (3)
- **WS-SYNC-DECISION:** 023 (1)
- **WS-PWA-OFFLINE:** 024, 047 (2)
- **WS-UX-A11Y:** 025, 026, 041, 042 (4)
- **WS-PERFORMANCE:** 044 (1)
- **WS-CI-GOVERNANCE:** 011, 027, 028 (3)
- **WS-RELEASE-OPS:** 006, 009, 010, 038, 040 (5)
- **WS-RETENTION-OPS:** 005, 007, 008, 012, 013, 014, 015, 016, 052 (9)
- **WS-TOOLCHAIN:** 001, 002, 003 (3)
- **WS-DEPS-SUPPLY-CHAIN:** 033, 034, 036, 045 (4)
- **WS-DESKTOP:** 030, 035, 039 (3)
- **WS-TEST-QUALITY:** 029, 031 (2)
- **WS-DOCS-TRUTH:** 004, 032 (2)
- **WS-I18N:** 037 (1)

## Unassigned set (escalation pending authorization)

- CG-AUD-20261008-027 (S2) Deploy, signing and release credentials are not isolated behind approval or ref rules (design level) -- WS-CI-GOVERNANCE
- CG-AUD-20261008-028 (S3) Live ruleset state differs from the repository's expected state and from CLAUDE.md claims (design level) -- WS-CI-GOVERNANCE
- CG-AUD-20261008-029 (S3) Persisted and network JSON is cast with `as T` at 34 trust-boundary sites -- WS-TEST-QUALITY
- CG-AUD-20261008-030 (S2) Tauri filesystem scope allows any `$DOCUMENT/**/*.json` and the webview CSP keeps unsafe-inline -- WS-DESKTOP
- CG-AUD-20261008-033 (S3) Override floors for qs and markdown-it sit below the patched versions and Dependabot ignores both -- WS-DEPS-SUPPLY-CHAIN
- CG-AUD-20261008-034 (S3) extract-zip has two high advisories and no patched version (development tooling) -- WS-DEPS-SUPPLY-CHAIN
- CG-AUD-20261008-035 (S3) Rust glib 0.18.5 advisory in the desktop lockfile and no cargo audit step -- WS-DESKTOP
- CG-AUD-20261008-036 (S3) fflate (via jspdf) and ip-address (via mqtt) advisories lie on runtime dependency paths -- WS-DEPS-SUPPLY-CHAIN
- CG-AUD-20261008-037 (S3) Only check:i18n is wired and only for German; check:i18n-usage and lint:i18n run nowhere -- WS-I18N
- CG-AUD-20261008-039 (S4) Small Tauri command defects: hard-coded capability flags, misnamed open_log_dir, wrong cache byte count -- WS-DESKTOP
- CG-AUD-20261008-045 (S3) ONNX Runtime WASM (about 25.6 MiB) is loaded from a public CDN at runtime without an integrity check -- WS-DEPS-SUPPLY-CHAIN
- CG-AUD-20261008-046 (S3) Sentry session replay has masking explicitly disabled (inert today) -- WS-PRIVACY

These 12 findings have briefs in [`IMPLEMENTATION-BRIEFS.md`](./IMPLEMENTATION-BRIEFS.md). If the owner authorizes issue creation, the proposal is **one issue per workstream** (6 workstreams hold unassigned findings), not one per finding.

## Hard sequencing rules

1. The source lane (QNB-273 / #550) is the only active source writer; nothing here edits its files.
2. No workflow, release-script, dependency or desktop edit starts before the lease is released and the resulting main is proved.
3. Nothing in this audit moves the release candidate; v1.10.0 is already published.
4. Each workstream starts only from a re-fetched authority (main SHA, open PRs, owner state).

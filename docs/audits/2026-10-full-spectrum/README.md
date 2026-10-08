# Full-Spectrum Audit 2026-10 -- Index

**Period:** 2026-10-07 to 2026-10-08
**Audited heads:** `3d8b706d` (waves 1-2 source reads), `c49560d9` (v1.10.0, live checks and wave 3)
**Auditor:** Claude Code audit lane (read-only observation lane; owner: `qnbs`)
**Status:** Findings are open unless a section says otherwise. This directory is documentation only;
no source, workflow, or configuration file is changed by the pull request that carries it.

## Why this directory exists

The audit produced more implementation-ready findings than the private issue tracker could hold
(the tracker's free-plan issue limit was reached). To avoid losing evidence, every wave is written
here with its evidence, its root causes, and a full issue draft for each actionable finding. When
tracker capacity is available the drafts in [`ISSUE-DRAFTS.md`](./ISSUE-DRAFTS.md) are converted to
issues in one pass and this directory stays as the durable evidence record.

Items that the tracker already owns are cross-referenced by their tracker identifiers (`QNB-nnn`).
Credential- and ruleset-related details are intentionally kept at design level in these public
files; the full details stay in the private tracker.

## Contents

| File                                                                                           | Scope                                                                                                                                           |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [`WAVE-1-security-privacy-data-pwa-ux.md`](./WAVE-1-security-privacy-data-pwa-ux.md)           | Authority re-fetch, policy ingestion, repository census, security / privacy / data / PWA / testing / governance / first-run UX, coverage ledger |
| [`WAVE-2-supply-chain-i18n-desktop-release.md`](./WAVE-2-supply-chain-i18n-desktop-release.md) | Dependency advisories and override floors, i18n gate truth, Tauri / desktop review, post-release (v1.10.0) verification                         |
| [`WAVE-3-shell-a11y-runtime-performance.md`](./WAVE-3-shell-a11y-runtime-performance.md)       | App-shell accessibility walk, `eval` CSP source, critical-path bundle, local-AI network lifecycle, Sentry, three-host parity, review of PR 550  |
| [`REPOSITORY-MAP.md`](./REPOSITORY-MAP.md)                                                     | Topology, runtime inventory, persistence map, delivery hosts, workflow inventory                                                                |
| [`ISSUE-DRAFTS.md`](./ISSUE-DRAFTS.md)                                                         | Full implementation-ready drafts D1-D11, conversion table                                                                                       |

## Method (what "evidence" means here)

- **Authority first.** Every wave re-fetched the live `main` head and open PRs before reading code.
  Counts come from the exact-head source tree, not from README badges.
- **Source reads** were done on an extracted snapshot of the audited head in a scratch directory
  outside the repository; nothing was installed or built in the working tree.
- **Browser evidence** used headless Chromium (Playwright 1.62.1 from the repository's own dev
  dependencies) and axe-core 4.12 (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, best-practice) against
  the **public** production origins with a fresh temporary profile and no credentials. Onboarding was
  passed programmatically. Data created stayed inside the temporary profile.
- **Registry and platform reads** used GET-only calls (GitHub REST for rulesets, Actions policy,
  runs, tags, releases; public `version.json` per host; `pnpm audit` against the registry advisory
  endpoint on the snapshot lockfile).
- **No secret value was read, printed, or stored.** Findings about credentials come from workflow
  text and metadata only.
- **Confidence labels:** `CONFIRMED` (reproduced or read in source at the exact head), `HIGH`
  (strong circumstantial evidence), `PLAUSIBLE` (consistent with evidence, not provable from public
  data), `UNKNOWN_NEEDS_EVIDENCE`.
- **Severity:** S0 release-blocking incident, S1 high-impact defect, S2 meaningful defect or
  risk, S3 hygiene or latent risk.

## Finding index (all waves)

| ID          | Wave | Area               | One-line finding                                                                                                                                                                            | Sev | Conf.                                  | Draft / owner     |
| ----------- | ---- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | -------------------------------------- | ----------------- |
| PRIV-001    | 1    | Privacy / data     | Privacy copy, onboarding sync claim and erase-all do not match runtime; CRDT and RAG databases survive erase                                                                                | S2  | CONFIRMED                              | QNB-273 (PR #550) |
| CSP-001     | 1    | Product / security | Community Share, strain lookups and Cansativa call hosts the production CSP blocks                                                                                                          | S2  | CONFIRMED                              | QNB-274           |
| SYNC-001    | 1    | Product            | Cloud sync is only a stopgap flag; path undecided                                                                                                                                           | S2  | CONFIRMED                              | QNB-275           |
| A11Y-001    | 1, 3 | Accessibility      | 14 AA contrast failures (static) and critical axe violations in 10 of 12 Settings tabs (runtime)                                                                                            | S2  | CONFIRMED                              | D1                |
| UX-001      | 1, 3 | First-run UX       | 10 mandatory screens, no skip / close, double language choice, ASCII-transliterated labels                                                                                                  | S2  | CONFIRMED                              | D2                |
| PWA-001     | 1    | PWA                | Service worker calls `skipWaiting()` unconditionally and the page reloads on `controllerchange`                                                                                             | S2  | HIGH                                   | QNB-237           |
| CI-001      | 1    | CI / CD            | Credential scoping for deploy, signing and release workflows (design level)                                                                                                                 | S2  | HIGH                                   | D3                |
| GOV-001     | 1    | Governance         | Live ruleset check not green; CLAUDE.md claims differ from live state (design level)                                                                                                        | S3  | CONFIRMED                              | D4                |
| TYPE-001    | 1    | Type safety        | 34 `JSON.parse(...) as T` sites at persistence / network boundaries                                                                                                                         | S2  | CONFIRMED                              | D5                |
| DESKTOP-001 | 1, 2 | Desktop            | Tauri `fs` scope covers any `$DOCUMENT/**/*.json`; CSP keeps `unsafe-inline`                                                                                                                | S2  | HIGH                                   | D6                |
| TEST-001    | 1    | Testing            | Critical-path coverage gate lists 4 files; persistence adapter has no test                                                                                                                  | S3  | CONFIRMED                              | QNB-256           |
| DOC-001     | 1, 2 | Docs truth         | Dangling `.cursor/rules` pointer; CLAUDE.md i18n and ruleset claims differ from reality                                                                                                     | S3  | CONFIRMED                              | QNB-266, D7       |
| DEP-001     | 2    | Supply chain       | 11 `pnpm audit` advisories (moderate) plus 2 high Dependabot alerts (dev-only `extract-zip`, no fix) and a Rust `glib` alert; override floors below patched versions and Dependabot-ignored | S3  | CONFIRMED                              | D8                |
| I18N-001    | 2    | i18n               | Only `check:i18n` is wired, only for `de`; usage and hardcoded checks run nowhere                                                                                                           | S3  | CONFIRMED                              | D7                |
| DESKTOP-002 | 2    | Desktop / CI       | Desktop Build never starts (`startup_failure` on every tag); updater `latest.json` returns 404                                                                                              | S3  | CONFIRMED (effect) / PLAUSIBLE (cause) | D9                |
| PERF-001    | 1, 3 | Performance        | Entry preloads 50 assets (~679 KB brotli); 58% is feature-specific code; repo metric is blind to it                                                                                         | S3  | CONFIRMED                              | D10, QNB-236      |
| EVAL-001    | 3    | Runtime / CSP      | Two `eval` CSP reports per load come from Zod 4's JIT probe; fix is `jitless`                                                                                                               | S3  | CONFIRMED                              | QNB-274           |
| SENTRY-001  | 3    | Privacy (latent)   | Sentry replay masking explicitly disabled (inert today: no DSN, CSP)                                                                                                                        | S3  | CONFIRMED                              | D11               |
| AI-001      | 3    | Supply chain       | ONNX Runtime WASM loaded from a CDN at runtime without an integrity check                                                                                                                   | S3  | CONFIRMED                              | note in wave 3    |
| PARITY-001  | 3    | Delivery           | GitHub Pages is not cross-origin isolated (no `SharedArrayBuffer`); local-AI impact unmeasured                                                                                              | S3  | CONFIRMED (fact)                       | note in wave 3    |

## Corrections made during the audit

Recorded for transparency; the wave documents contain the corrected statements only.

1. The `eval` CSP source was first described as "a dependency" without evidence, then confirmed as
   Zod 4's JIT probe (wave 3).
2. The Settings finding was first reported as 9 of 12 tabs; the Strain View tab had not been reached.
   The correct number is 10 of 12 (wave 3).
3. A first i18n key diff reported gaps in `common` that were an artifact of `...enCommon` spreads;
   discarded (wave 2).
4. A first statement that the release version still needed confirmation was stale; the version had
   already been confirmed and released (wave 2).
5. A first statement about Sentry replay masking was wrong in direction (masking is explicitly
   disabled, not defaulted) (wave 3).
6. The dependency scan was first summarised as "all moderate". The push to this branch surfaced
   GitHub's Dependabot view (2 high, 9 moderate), which differs from `pnpm audit`; the union is now
   recorded in wave 2, including the dev-only `extract-zip` pair (high, no fix) and a Rust `glib`
   alert.

## Conversion procedure for the issue drafts

1. Create each draft in [`ISSUE-DRAFTS.md`](./ISSUE-DRAFTS.md) as a tracker issue with the listed
   parent, labels, milestone and relations.
2. Replace the draft identifier in the conversion table with the issue identifier.
3. Keep this directory unchanged; later waves add new files (`WAVE-4-...`) rather than editing
   historical evidence, except for corrections, which are appended to the list above.

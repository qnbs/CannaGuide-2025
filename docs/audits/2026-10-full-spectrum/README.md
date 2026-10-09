# Full-Spectrum Audit 2026-10 -- Index

**Period:** 2026-10-07 to 2026-10-08
**Audited heads:** `3d8b706d` (waves 0-2 source reads), `c49560d9` (v1.10.0; live checks, wave 3, revalidation)
**Auditor:** Claude Code audit lane (read-only observation lane; owner: `qnbs`)
**Status:** Findings are open unless a ledger block says otherwise. This directory is documentation
only; the pull request that carries it changes no source, workflow, configuration, dependency or
lockfile file.

## Operating model

```text
REPOSITORY / GIT  = complete audit evidence (findings, diagnosis, positives, decisions, briefs)
TRACKER (Linear)  = compact control plane (owner, priority, sequencing, gates, release impact)
```

- Every material finding has a stable ID (`CG-AUD-20261008-NNN`), a full evidence block and an
  ownership mapping. No finding is lost and **no finding automatically becomes a tracker issue**
  (decision `CG-DEC-001`). Findings map to existing owners; the rest are `UNASSIGNED` with escalation
  `PENDING_AUTHORIZATION`.
- One consolidated documentation PR carries all waves as bounded commits. It does not compete with
  product work: the active source lane (privacy, PR #550) is never touched.
- Credential- and ruleset-related findings are written at design level in these public files; the
  specifics stay in the private tracker (`CG-DEC-006`).

## Contents

| File                                                                                                                                                                                | Purpose                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`LEDGER.md`](./LEDGER.md)                                                                                                                                                          | Entry point: schema, vocabulary, finding index, legacy-name crosswalk, counters, reconciliation, wave checkpoints, duplicates and invalid claims |
| [`LEDGER-A-product-privacy-pwa-ux-perf.md`](./LEDGER-A-product-privacy-pwa-ux-perf.md)                                                                                              | Finding blocks: product, privacy, PWA, UX, performance, local AI                                                                                 |
| [`LEDGER-B-ci-release-supply-chain-desktop-docs.md`](./LEDGER-B-ci-release-supply-chain-desktop-docs.md)                                                                            | Finding blocks: CI, release, retention, supply chain, desktop, toolchain, docs (includes the imported wave 0)                                    |
| [`COVERAGE-AND-POSITIVES.md`](./COVERAGE-AND-POSITIVES.md)                                                                                                                          | Coverage per domain, verified positives, unknowns                                                                                                |
| [`DECISIONS.md`](./DECISIONS.md)                                                                                                                                                    | Durable decisions with alternatives and revisit conditions                                                                                       |
| [`WORKSTREAMS.md`](./WORKSTREAMS.md)                                                                                                                                                | Findings clustered into workstreams, owner mapping, sequencing                                                                                   |
| [`IMPLEMENTATION-BRIEFS.md`](./IMPLEMENTATION-BRIEFS.md)                                                                                                                            | Briefs D1-D12 for findings without an existing owner                                                                                             |
| [`WAVE-1-...`](./WAVE-1-security-privacy-data-pwa-ux.md), [`WAVE-2-...`](./WAVE-2-supply-chain-i18n-desktop-release.md), [`WAVE-3-...`](./WAVE-3-shell-a11y-runtime-performance.md) | Narrative wave reports (provenance); they keep their working names, mapped in the crosswalk in `LEDGER.md`                                       |
| [`REPOSITORY-MAP.md`](./REPOSITORY-MAP.md)                                                                                                                                          | Topology, runtime inventory, persistence, hosts, workflows                                                                                       |

## Where things stand

52 stable findings (S0 0, S1 0, S2 12, S3 28, S4 12): 39 owned by existing tracker work (7 by the
active privacy PR), 12 unassigned, 1 informational; 3 already fixed. Reconciliation: 100 raw
observations = 52 findings + 8 merged duplicates + 5 invalid-with-evidence + 22 verified positives +
13 unknowns (details and the live counters are in `LEDGER.md`).

Highest-leverage items, in suggested order (see `WORKSTREAMS.md` for gates):

1. Privacy and erase truth (active lane, PR #550): `017`-`020`, review notes `048`-`051`.
2. CSP-blocked features gated before any allow-list (`021`, `022`), plus the one-line Zod `jitless`
   fix (`043`).
3. Settings accessibility: one shared root cause, 10 of 12 tabs (`041`), then contrast (`025`) and the
   first-run path (`026`).
4. Release hardening before the next cycle: dry-run side effect (`009`), credential coupling (`010`),
   desktop build that never starts (`038`).
5. Supply chain: override floors below patched versions (`033`-`036`), runtime WASM integrity (`045`).
6. Entry-graph weight and a metric that can see it (`044`).

## Method (what "evidence" means here)

- **Authority first.** Every wave re-fetched the live `main` head and open PRs before reading code.
  Counts come from the exact-head source tree, not from README badges. Code-level findings were
  revalidated against `origin/main` (`c49560d9`) on 2026-10-08; each block records the result.
- **Source reads** were done on an extracted snapshot of the audited head in a scratch directory
  outside the repository; nothing was built in the working tree.
- **Browser evidence** used headless Chromium (Playwright 1.62.1 from the repository's dev
  dependencies) and axe-core 4.12 (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, best-practice) against
  the **public** production origins with a fresh temporary profile and no credentials. Onboarding was
  passed programmatically; data created stayed inside the temporary profile.
- **Platform reads** were GET-only (GitHub REST for rulesets, Actions policy, runs, tags, releases and
  Dependabot alerts; public `version.json` per host; `pnpm audit` against the registry advisory
  endpoint on the snapshot lockfile).
- **No secret value was read, printed, or stored.** Findings about credentials come from workflow
  text and metadata only.
- Observation, inference and confirmation are kept apart in the evidence text; confidence labels
  are `CONFIRMED`, `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN_NEEDS_EVIDENCE`.

## Corrections made during the audit

Recorded for transparency; the ledger holds the corrected statements.

1. The `eval` CSP source was first described as "a dependency" without evidence, then confirmed as
   Zod 4's JIT probe (`INV-04`, finding `043`).
2. The Settings finding was first reported as 9 of 12 tabs; the Strain View tab had not been reached.
   The correct number is 10 of 12 (`DUP-01`, finding `041`).
3. A first i18n key diff reported gaps in `common` that were an artifact of `...enCommon` spreads
   (`INV-01`).
4. A first statement that the release version still needed confirmation was stale; the version had
   already been confirmed and released (`INV-03`).
5. A first statement about Sentry replay masking was wrong in direction: masking is explicitly
   disabled, not defaulted (`INV-05`, finding `046`).
6. The dependency scan was first summarised as "all moderate". GitHub's Dependabot view (2 high, 9
   moderate) differs from `pnpm audit`; the union is recorded (`DUP-05`, findings `033`-`036`).
7. The service-worker finding was downgraded from a defect to a design risk after revalidation showed
   the install-time `skipWaiting()` is documented intent (finding `024`).

## How later waves extend this

Add a new `WAVE-4-...` report only if a narrative is useful; always append findings to the ledger with
the next free ID, add duplicates and verified positives to their tables, update the counters
(the counters and the reconciliation line in `LEDGER.md` must still sum), and record new decisions
in `DECISIONS.md`. Never delete earlier evidence; use explicit supersession.

# Decision Ledger

Durable decisions of the audit campaign, separate from factual findings. Each decision states its evidence, the alternatives, the chosen option, the reason, and a revisit condition. Decisions are never rewritten; a later decision names what it supersedes.

## CG-DEC-001

- **Date:** 2026-10-08
- **Decision:** Evidence lives in Git; the tracker is a compact control plane. No finding automatically becomes a tracker issue; no GitHub issue per finding.
- **Why:** The tracker's free-plan issue limit blocked filing; one issue per finding would be a representation problem, not an information problem.
- **Evidence:** Owner instruction of 2026-10-08.
- **Alternatives considered:** One tracker issue per finding; GitHub issues per finding; raw findings in tracker comments.
- **Chosen option:** Repository ledger with stable IDs, mapped to existing owners; escalate only on explicit authorization.
- **Supersedes:** none
- **Affected findings:** all
- **Revisit condition:** Tracker capacity returns AND the owner authorizes conversion of the unassigned workstreams.

## CG-DEC-002

- **Date:** 2026-10-08
- **Decision:** One consolidated documentation PR (#551) carries all waves as bounded commits and stays documentation-only.
- **Why:** Avoids PR-per-finding churn, keeps the review surface small and keeps product PRs clean.
- **Evidence:** Owner instruction; QNB-259 lease boundary.
- **Alternatives considered:** PR per wave; findings in implementation PRs.
- **Chosen option:** Single audit-evidence PR; no source, workflow, config or dependency change.
- **Supersedes:** none
- **Affected findings:** all
- **Revisit condition:** The PR exceeds the repository review-size limit (stop and report).

## CG-DEC-003

- **Date:** 2026-10-08
- **Decision:** Extend the existing `docs/audits/` tree instead of creating a parallel `docs/audit/` tree.
- **Why:** Prior audits already live there; a second authority tree would split provenance.
- **Evidence:** Directory listing of docs/.
- **Alternatives considered:** New top-level audit directory.
- **Chosen option:** Directory `docs/audits/2026-10-full-spectrum/`.
- **Supersedes:** none
- **Affected findings:** all
- **Revisit condition:** The repository adopts a different audit layout.

## CG-DEC-004

- **Date:** 2026-10-08
- **Decision:** For a CSP-blocked or unreachable external feature, gate or remove the feature before broadening any network permission.
- **Why:** Widening connect-src to make dishonest UI work trades privacy and attack surface for convenience.
- **Evidence:** CSP probes; QNB-274 bias.
- **Alternatives considered:** Allow-list the hosts (Community Share, lookups, proxies).
- **Chosen option:** Gate first; allow-list only with a product decision, exact hosts, response validation, redirect refusal and delivery-path parity.
- **Supersedes:** none
- **Affected findings:** 021, 022
- **Revisit condition:** Owner product decision to keep a feature.

## CG-DEC-005

- **Date:** 2026-10-08
- **Decision:** A missing, rate-limited or stale-head reviewer signal is NO_SIGNAL, never PASS.
- **Why:** Provider status is meaningful only when bound to the exact current head.
- **Evidence:** Recurring-miss ledger (QNB-260).
- **Alternatives considered:** Treat silence as approval.
- **Chosen option:** NO_SIGNAL status; exact-head evidence only.
- **Supersedes:** none
- **Affected findings:** all
- **Revisit condition:** none

## CG-DEC-006

- **Date:** 2026-10-08
- **Decision:** Credential-scoping and ruleset findings stay at design level in public files; specifics stay in the private tracker.
- **Why:** The branch is public; exploit-informative detail adds risk without adding review value.
- **Evidence:** Public repository.
- **Alternatives considered:** Full detail in the repository.
- **Chosen option:** Design-level description, remediation options and acceptance criteria only.
- **Supersedes:** none
- **Affected findings:** 027, 028
- **Revisit condition:** Findings are remediated.

## CG-DEC-007

- **Date:** 2026-10-08
- **Decision:** Prefer an existing owner over a new work item; mark the rest `LINEAR_OWNER = UNASSIGNED` with escalation `PENDING_AUTHORIZATION`.
- **Why:** Keeps the control plane compact and avoids duplicate ownership.
- **Evidence:** Owner instruction.
- **Alternatives considered:** Create issues for unassigned findings.
- **Chosen option:** Unassigned findings are grouped into workstreams and carry briefs.
- **Supersedes:** none
- **Affected findings:** see WORKSTREAMS
- **Revisit condition:** Owner authorizes issue creation.

## CG-DEC-008

- **Date:** 2026-10-08
- **Decision:** Cloud sync stays disabled until the product decision (QNB-275); onboarding and privacy copy must not promise it.
- **Why:** Code and copy diverge otherwise.
- **Evidence:** constants.ts; CSP probes.
- **Alternatives considered:** Re-enable the stopgap flag.
- **Chosen option:** Keep CLOUD_SYNC_DISABLED = true; correct the copy (PR #550 slice C).
- **Supersedes:** none
- **Affected findings:** 019, 023
- **Revisit condition:** Sync path decided.

## CG-DEC-009

- **Date:** 2026-10-08
- **Decision:** Production parity means identical version identity on all three hosts after the expected deploy skew (about 15-20 minutes for Cloudflare and GitHub Pages); GitHub Pages isolation is a platform difference, not drift.
- **Why:** Prevents false drift calls.
- **Evidence:** Probes on 2026-10-07 and 2026-10-08.
- **Alternatives considered:** Compare at a fixed instant.
- **Chosen option:** Deploy-wait semantics in the probe.
- **Supersedes:** none
- **Affected findings:** 006, 047
- **Revisit condition:** Platform capability change.

## CG-DEC-010

- **Date:** 2026-10-08
- **Decision:** Dependency severity is the union of `pnpm audit` and Dependabot; the CI gate (`--audit-level=high`) is the authority for failing builds, and scope labels from either tool are hints.
- **Why:** The two sources disagree on severity and scope.
- **Evidence:** Dependabot alerts vs audit output.
- **Alternatives considered:** Trust one source.
- **Chosen option:** Record both; reconcile per advisory.
- **Supersedes:** none
- **Affected findings:** 033-036
- **Revisit condition:** A single source becomes authoritative.

## CG-DEC-011

- **Date:** 2026-10-08
- **Decision:** Follow-up edits to an already pushed documentation commit are new signed commits, not amend plus force-push.
- **Why:** Force-pushing is excluded by the working rules even on a private branch of one author.
- **Evidence:** Working rules.
- **Alternatives considered:** Amend and force-push.
- **Chosen option:** Second commit.
- **Supersedes:** none
- **Affected findings:** all
- **Revisit condition:** none

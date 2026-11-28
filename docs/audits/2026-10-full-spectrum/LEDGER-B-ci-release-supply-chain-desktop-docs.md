# Finding Ledger B -- CI, Release, Retention, Supply Chain, Desktop, Toolchain, Docs

Findings whose primary surface is the pipeline, the delivery platforms, dependencies, the desktop shell, the toolchain, or documentation truth. Includes the wave-0 findings imported from the earlier infrastructure and release-readiness audit.

Stable IDs have the form `CG-AUD-20261008-NNN`. Schema, status vocabulary, severity model and counters are in [`LEDGER.md`](./LEDGER.md). Do not renumber; later waves append.

### CG-AUD-20261008-001 -- windows-doctor accepts Node 25 and 26 as "matches engines"

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Node / Windows parity | severity S3 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** scripts/windows-doctor.mjs, scripts/setup-windows.ps1
- **Observed:** windows-doctor checks only `major >= 24`; the real contract is `engines.node = ">=24.15.0 <25"`. agent-doctor already implements the bounded check (`nodeSatisfiesDeclaredEngines`), so the two doctors disagree. On 2026-10-07 the Windows dev machine silently moved to Node v26.10.0 and windows-doctor would have printed OK.
- **Expected:** Both doctors enforce the declared engines range and print expected vs detected version.
- **Evidence:** `scripts/windows-doctor.mjs` line 49 `if (major >= 24)`; root `package.json` engines; `scripts/agent-doctor.mjs` function `nodeSatisfiesDeclaredEngines`.
- **Diagnosis:** Duplicated, weaker range logic in a second doctor script.
- **Impact:** Toolchain drift is reported as healthy on Windows. Production relevance: None (local tooling). Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-263 | active PR: none | workstream: WS-TOOLCHAIN | Linear escalation required: NO
- **Required correction:** Reuse the shared range check in windows-doctor; align the wording in setup-windows.ps1. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Node 25.x and 26.x fail with the expected range; 24.15.0 passes; 24.14.x fails; one shared implementation; unit tests cover the matrix. Verification: Scoped unit test (single-spec run without `--`), `pnpm verify`, `pnpm verify:lint`.
- **Disposition / implementation:** Queued behind the active privacy lane; not release-relevant. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: None. | user/provider gate: none | follow-up: Do not admit Node 26 here (see 003).
- **Live-main revalidation:** Still present on c49560d9 on 2026-10-08 (windows-doctor line 49 major >= 24; setup-windows.ps1 line 21 "Install Node 24+").

### CG-AUD-20261008-002 -- Node version is declared in several places instead of one source

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Node / pnpm / toolchain | severity S4 | confidence HIGH | status QUEUED_EXISTING_OWNER
- **Affected surface:** package.json engines, .github workflows (`node-version`), setup scripts, docs
- **Observed:** The Node baseline is repeated in engines, workflow inputs, scripts and docs; any baseline move needs a coordinated edit.
- **Expected:** A single source (`.node-version` or equivalent) consumed by CI and tooling.
- **Evidence:** Owner issue QNB-264 records the preparation item; desktop-build.yml hard-codes `node-version: 24`.
- **Diagnosis:** Organic growth.
- **Impact:** Silent drift between CI, Vercel and local. Production relevance: Vercel project Node setting was once out of sync (see 012). Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-264 | active PR: none | workstream: WS-TOOLCHAIN | Linear escalation required: NO
- **Required correction:** Introduce one version source and read it from setup-node and the doctors. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Changing the baseline requires one edit; a check fails on divergence. Verification: Workflow lint plus a drift test.
- **Disposition / implementation:** Preparation work before any Node 26 move. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 001 (shared range logic). | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Not re-run (structural observation); desktop-build.yml still pins node-version 24 on c49560d9 on 2026-10-08.

### CG-AUD-20261008-003 -- Node 26 admission has no CI proof lane

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Node / pnpm / toolchain | severity S4 | confidence HIGH | status QUEUED_EXISTING_OWNER
- **Affected surface:** CI matrix, docs/toolchain-update.md
- **Observed:** Package `engines` declarations are only LIKELY_SUPPORT evidence for Node 26 (jsdom 30.1.2 is the only tool naming it). Vercel builds still run 24.x. A stale note in docs/toolchain-update.md refers to Node 26.5.0 while 26.11.0 was current on 2026-10-07.
- **Expected:** A non-blocking Node 24 + 26 compatibility lane proves Node 26 before the baseline moves.
- **Evidence:** Owner issues QNB-251 (adoption verdict) and QNB-265 (compat lane); toolchain-update.md line 168.
- **Diagnosis:** No automated proof path exists yet.
- **Impact:** Premature or ad-hoc baseline moves. Production relevance: None. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-251, QNB-265 | active PR: none | workstream: WS-TOOLCHAIN | Linear escalation required: NO
- **Required correction:** Add the compat lane; refresh the doc note. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Compat lane green for Node 26 on a pinned version before admission. Verification: CI run URL.
- **Disposition / implementation:** Queued; do not move the baseline because a newer version exists. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 002. | user/provider gate: Vercel GA support for Node 26 | follow-up: Re-check on Node 26 LTS transition.
- **Live-main revalidation:** docs/toolchain-update.md line 168 still says "Node 26.5.0" on c49560d9 on 2026-10-08.

### CG-AUD-20261008-004 -- Documentation drift inventory (nine rows) against live platform state

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Documentation truth | severity S3 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** README.md, .github/copilot-instructions.md, docs/distribution.md, docs/DEVOPS-GATES.md, docs/toolchain-update.md, docs/release-process.md, scripts/setup-windows.ps1, scripts/check-doc-metrics.mjs
- **Observed:** (1) README badge and (2) copilot-instructions call Cloudflare Pages paused/a stub, but it is an active production host; (3) no description of native Vercel retention; (4) no VERCEL_TOKEN contract; (5) stale Node 26 note; (6) "Install Node 24+" unbounded; (7) release-process.md still says `git push origin main --tags`; (8) check-doc-metrics validates only the first lower-case release badge so the DE badge can go stale; (9) release-process.md describes dry-run as build + verify only.
- **Expected:** Docs describe the live control plane and the real release mechanics.
- **Evidence:** QNB-266 row table with live evidence; revalidated on origin/main (see below).
- **Diagnosis:** Docs written before the platform and ruleset changes; no gate for platform-state claims.
- **Impact:** Operators follow stale procedures (direct push to a protected branch, wrong pause assumption). Production relevance: None. Release relevance: Row 7 and 9 matter for the next release cycle.
- **Ownership:** GitHub: none | Linear: QNB-266 | active PR: none | workstream: WS-DOCS-TRUTH | Linear escalation required: NO
- **Required correction:** One small docs PR that re-verifies each claim on the day. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** No document calls Cloudflare paused while deployed; retention and token contracts documented once; Node references bounded; both README release badges guarded. Verification: `check:doc-metrics`, prettier over `git status --porcelain`.
- **Disposition / implementation:** Queued; every merge to main re-anchors release evidence, so batch it. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 009 (row 9 wording). | user/provider gate: none | follow-up: Row 8: validate every release badge match case-insensitively.
- **Live-main revalidation:** Rows 1, 2, 5, 6, 7, 8, 9 re-confirmed present on c49560d9 on 2026-10-08; the README release badges now read v1.10.0 (lines 10 and 466) after the release commit but the DE badge remains unguarded.

### CG-AUD-20261008-005 -- Cloudflare Pages control plane cannot be verified without a read-only credential

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Cloudflare Pages / production parity | severity S3 | confidence CONFIRMED | status BLOCKED_BY_USER_GATE
- **Affected surface:** Cloudflare Pages project `cannaguide-2025`
- **Observed:** Only the public side is verifiable (same commit on canonical and per-deployment host). Project configuration, bindings, branch settings and deployment inventory are unverified by the audit lane.
- **Expected:** A read-only audit path makes control-plane drift verifiable.
- **Evidence:** QNB-267; no wrangler, no credential, connector unauthenticated in the audit lane.
- **Diagnosis:** No credential granted to the observation lane.
- **Impact:** Undetected drift. Production relevance: Production is served correctly (public probes). Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-267 | active PR: none | workstream: WS-RETENTION-OPS | Linear escalation required: NO
- **Required correction:** Owner provisions a read-only token or equivalent connector access. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** The lane can list deployments and project settings read-only. Verification: Read-only inventory run.
- **Disposition / implementation:** Waiting for the owner. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: Owner decision and credential | follow-up: none
- **Live-main revalidation:** Not re-run (credential-gated).

### CG-AUD-20261008-006 -- The three-host production parity probe is not codified

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Production parity | severity S4 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** Release qualification procedure
- **Observed:** Host identity, headers, manifest and service-worker checks were done with a hand-built probe; the same checks recur for every release and retention proof. After each merge Vercel is about 15-20 minutes ahead of Cloudflare and GitHub Pages (expected skew).
- **Expected:** A read-only probe script with deploy-wait semantics is part of the repository.
- **Evidence:** QNB-268 reference implementation; wave 2 and wave 3 reuse it.
- **Diagnosis:** Ad-hoc tooling.
- **Impact:** Premature "drift" calls during the expected skew window. Production relevance: No defect. Release relevance: Used for every release qualification.
- **Ownership:** GitHub: none | Linear: QNB-268 | active PR: none | workstream: WS-RELEASE-OPS | Linear escalation required: NO
- **Required correction:** Commit the probe with deploy-wait logic. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Probe reports EXACT_MAIN or EXPECTED_SKEW with timestamps. Verification: Run against current production.
- **Disposition / implementation:** Queued. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: Add the GitHub Pages isolation row (see 047).
- **Live-main revalidation:** Probe re-run on 2026-10-08: all three hosts report 1.10.0+c49560d9.

### CG-AUD-20261008-007 -- Retention classifier leaves provably superseded unaliased Cloudflare previews as UNKNOWN

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Deployment retention | severity S3 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** .github retention classifier (scripts/deployment-retention)
- **Observed:** After the authoritative retention run, 12 older unaliased preview generations stayed UNKNOWN because the classifier demanded branch/PR lifecycle proof even where a newer same-branch alias-bearing preview proved supersession. They were later removed once by exact-ID, force=false deletes under a user-authorized lease.
- **Expected:** The classifier uses the strongest positive authority (newer successful same-branch preview with a stable alias) to prune superseded previews.
- **Evidence:** QNB-270; QNB-260 ledger entry; retention run 37689580110.
- **Diagnosis:** Classifier requires weaker proof than is available.
- **Impact:** Deployment history accumulates; manual cleanup needed. Production relevance: Production and both rollback anchors untouched throughout. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-270 | active PR: none | workstream: WS-RETENTION-OPS | Linear escalation required: NO
- **Required correction:** Add a SAFE_DELETE_SUPERSEDED_PREVIEW proof class with fail-closed identity checks. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** A new retention run prunes superseded previews without manual deletes; negative tests for every authorization predicate. Verification: Unit tests through the final network guard; resulting-main retention proof.
- **Disposition / implementation:** Queued. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 008. | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Not re-run (provider state).

### CG-AUD-20261008-008 -- Merged-PR preview residue on Cloudflare stays UNKNOWN; deleted hostnames can keep serving

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Deployment retention | severity S3 | confidence HIGH | status QUEUED_EXISTING_OWNER
- **Affected surface:** Retention classifier, Cloudflare Pages previews
- **Observed:** Twelve intermediate PR-head previews remain UNKNOWN because a unique normalized-branch join is not implemented. Separately, 5 of 9 deployment hostnames deleted through the API still served content 18 minutes later (eventual consistency, unexplained).
- **Expected:** A unique-branch join classifies merged-PR residue; delete effects are proven with raw-field evidence.
- **Evidence:** QNB-272 and its promotion record; QNB-260.
- **Diagnosis:** Missing join key and no delete-effect proof.
- **Impact:** Residue and unverifiable deletes. Production relevance: No production impact. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-272 | active PR: none | workstream: WS-RETENTION-OPS | Linear escalation required: NO
- **Required correction:** Implement the join and a delete-effect assertion. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Residue classified; delete effect measured after propagation. Verification: Retention run plus post-delete probe.
- **Disposition / implementation:** Queued; a force=true decision is gated. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 007. | user/provider gate: Owner decision on force=true | follow-up: Re-measure the five hostnames.
- **Live-main revalidation:** Not re-run (provider state).

### CG-AUD-20261008-009 -- Release Publish "dry-run" dispatch creates and pushes a missing release tag

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Release workflows | severity S2 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** .github/workflows/release-publish.yml (step "Ensure tag exists")
- **Observed:** The step is guarded only by `github.event_name == workflow_dispatch`, not by `dry-run`. For a non-existing tag it creates an annotated tag and pushes it with the release credential; the tag push (`push: tags v*`) then starts a real Release Publish and Release Gate. The publish step alone honours dry-run.
- **Expected:** A dry-run has zero external side effects.
- **Evidence:** QNB-271 analysis of release-publish.yml; during the real v1.10.0 publication a dispatch run ended `cancelled` while the tag push started the real run.
- **Diagnosis:** Dry-run guard applied at the last step only.
- **Impact:** Accidental real release by an operator who believes dry-run is safe; tags are the least reversible artifact. Production relevance: Latent. Release relevance: Operator rule: never use dry-run=true as a rehearsal for a new tag.
- **Ownership:** GitHub: none | Linear: QNB-271 | active PR: none | workstream: WS-RELEASE-OPS | Linear escalation required: NO
- **Required correction:** Guard the tag step with dry-run; assert no ref was created (`git ls-remote`); update docs/release-process.md. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Dry-run with a missing tag creates no tag and publishes nothing; dry-run=false unchanged; push-tag path unchanged. Verification: actionlint plus a documented dispatch against a throw-away repository; invariant "dry-run has zero side effects" recorded in the proof matrix.
- **Disposition / implementation:** Post-release hardening slice; elevated to High by the owner after the release. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 010 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Step "Ensure tag exists" present at release-publish.yml line 89 on c49560d9 on 2026-10-08.

### CG-AUD-20261008-010 -- Release credential coupling: checkout uses the release token with github.token as fallback only when it is empty

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Release workflows / credentials | severity S2 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** .github/workflows/release-publish.yml (checkout token expression, tag push)
- **Observed:** Checkout uses `secrets.RELEASE_PAT || github.token`. During the real v1.10.0 publication a non-empty but unusable credential failed the run at checkout; a replacement credential could read but its tag push returned 403. The failure surfaced at the wrong boundary.
- **Expected:** Checkout uses github.token; the release credential is scoped to the tag-push step with an explicit preflight and distinct messages for authentication, write-permission and ruleset (GH013) failures.
- **Evidence:** QNB-271 additional evidence, run 37702655997 (two attempts).
- **Diagnosis:** Privileged credential used for read-only access.
- **Impact:** Release outages caused by credential state; broader credential exposure than needed. Production relevance: Release v1.10.0 was completed after the credential was corrected. Release relevance: Resolved operationally for v1.10.0; hardening pending.
- **Ownership:** GitHub: none | Linear: QNB-271 | active PR: none | workstream: WS-RELEASE-OPS | Linear escalation required: NO
- **Required correction:** Checkout with github.token; preflight and scope the release token to the tag step; document minimal permission. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Missing or invalid release credential fails at the explicit tag boundary with a precise message; workflow-policy test covers it. Verification: Workflow lint and policy test.
- **Disposition / implementation:** Post-release hardening; shares the owner issue with 009. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 009, 027 (credential scoping design). | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Checkout token expression RELEASE_PAT or github.token (line 58) still present on c49560d9 on 2026-10-08.

### CG-AUD-20261008-011 -- Labeler workflow uses the pull_request_target trigger

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: GitHub Actions security | severity S3 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** .github/workflows/labeler.yml
- **Observed:** The privileged trigger is used by the labeler. It does not check out PR code and has top-level permissions set, so no active exploit was established, but the trigger class is forbidden by operator policy and is a future footgun.
- **Expected:** No pull_request_target workflow; governance check validates trigger classes.
- **Evidence:** QNB-252; workflow line 4.
- **Diagnosis:** Convenience trigger for label writes on fork PRs.
- **Impact:** Latent privilege escalation if the workflow is ever extended. Production relevance: None today. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-252 | active PR: none | workstream: WS-CI-GOVERNANCE | Linear escalation required: NO
- **Required correction:** Replace with a pull_request + workflow_run pattern or remove; add a trigger-class gate. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** No pull_request_target in .github/workflows; gate fails on its reintroduction. Verification: Workflow lint; governance check.
- **Disposition / implementation:** Queued; workflow edits wait for the active lease. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: Lease on source lane (QNB-259). | user/provider gate: none | follow-up: none
- **Live-main revalidation:** labeler.yml line 4 pull_request_target present on c49560d9 on 2026-10-08.

### CG-AUD-20261008-012 -- Vercel project Node setting was 22.x while the repository requires Node 24

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Vercel | severity S3 | confidence CONFIRMED | status VALID_AND_FIXED
- **Affected surface:** Vercel project `canna-guide-2025-web` (dashboard setting)
- **Observed:** Builds succeeded only because repository metadata overrode the dashboard value.
- **Expected:** Dashboard equals the repository contract.
- **Evidence:** QNB-242 closing evidence: build log and deployment metadata show Node 24.x.
- **Diagnosis:** Control-plane drift masked by successful builds.
- **Impact:** Silent toolchain drift. Production relevance: Fixed. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-242 (Done) | active PR: none | workstream: WS-RETENTION-OPS | Linear escalation required: NO
- **Required correction:** Set the project Node version to 24.x. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Project Node 24.x. Verification: Metadata read-only check.
- **Disposition / implementation:** Terminal. Implementation status: DONE (platform setting).
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: Periodic repo-vs-platform comparison (see 014).
- **Live-main revalidation:** Verified 24.x on 2026-10-07; not re-run.

### CG-AUD-20261008-013 -- Twenty generated Vercel aliases survived after their deployments were deleted

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Vercel | severity S3 | confidence CONFIRMED | status VALID_AND_FIXED
- **Affected surface:** Vercel project aliases
- **Observed:** Deployment retention and alias lifecycle are separate resources; deleting deployments did not remove aliases.
- **Expected:** No dangling aliases.
- **Evidence:** QNB-245: alias list 27 -> 8; production and anchors unchanged.
- **Diagnosis:** No alias reconciliation step.
- **Impact:** Dangling hostnames. Production relevance: Fixed. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-245 (Done) | active PR: none | workstream: WS-RETENTION-OPS | Linear escalation required: NO
- **Required correction:** One-time exact alias removal with owner authorization. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Aliases reconciled. Verification: Alias listing.
- **Disposition / implementation:** Terminal. Implementation status: DONE (platform cleanup).
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: Classifier alias ownership (see 014).
- **Live-main revalidation:** Verified on 2026-10-07; not re-run.

### CG-AUD-20261008-014 -- Native Vercel retention is dashboard-only, so drift is invisible

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Vercel / retention drift | severity S4 | confidence HIGH | status QUEUED_EXISTING_OWNER
- **Affected surface:** Vercel retention setting (1d for canceled/errored/preview/production, keep 10)
- **Observed:** The setting is applied (QNB-248) but cannot be written through the API and nothing reads it back.
- **Expected:** A read-only drift check compares the setting with the documented value.
- **Evidence:** QNB-249 recommendations; QNB-248 closing evidence.
- **Diagnosis:** No read-back check.
- **Impact:** Undetected policy drift. Production relevance: Setting is correct today. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-249 | active PR: none | workstream: WS-RETENTION-OPS | Linear escalation required: NO
- **Required correction:** Add a scheduled read-only check using the dedicated token once provisioned. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Drift produces a visible failing check. Verification: Check run.
- **Disposition / implementation:** Queued; depends on 015. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 015 | user/provider gate: Dedicated token | follow-up: none
- **Live-main revalidation:** Not re-run.

### CG-AUD-20261008-015 -- The Vercel half of the retention workflow is fail-closed because no deployment token exists

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Vercel / secrets | severity S3 | confidence CONFIRMED | status BLOCKED_BY_USER_GATE
- **Affected surface:** GitHub Actions secret `VERCEL_TOKEN` (absent)
- **Observed:** Trusted cleanup runs log "SKIP Vercel inventory"; no Vercel deletion has run through automation.
- **Expected:** A dedicated project-scoped token with documented rotation.
- **Evidence:** QNB-229 runbook; QNB-233 end-to-end proof requirement.
- **Diagnosis:** Credential never provisioned.
- **Impact:** Retention relies on native Vercel policy only. Production relevance: Native retention covers the gap. Release relevance: Does not block the release.
- **Ownership:** GitHub: none | Linear: QNB-229, QNB-233 | active PR: none | workstream: WS-RETENTION-OPS | Linear escalation required: NO
- **Required correction:** Owner provisions the token; then prove the path end to end. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** A trusted run inventories Vercel and deletes only proven rows. Verification: Retention run log.
- **Disposition / implementation:** Owner gate. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: Owner (token) | follow-up: none
- **Live-main revalidation:** Not re-run (credential-gated).

### CG-AUD-20261008-016 -- Retention workflow guards contradicted their classifier and provider nullability (historical)

- **Meta:** Wave 0 (imported infrastructure and release-readiness audit); snapshot 2026-10-07, main 3500cefb -> 3d8b706d | domain: Deployment retention | severity S2 | confidence CONFIRMED | status VALID_AND_FIXED
- **Affected surface:** Retention workflow and classifier (PRs 544, 545, 547, 548)
- **Observed:** A trusted workflow_run existed but the destructive guard rejected that event; the classifier admitted production history the guard denied; Cloudflare lawfully returns `aliases=null` and the first correction normalised null to empty; cleanup could start before Cloudflare production caught up.
- **Expected:** Trigger topology, classifier and guard are one tested contract; missing provider fields stay fail-closed.
- **Evidence:** QNB-228, QNB-244, QNB-260 seed ledger; retention proof run 37689580110.
- **Diagnosis:** Independent review of workflow topology, classifier and network guard.
- **Impact:** Wrong deletes or no deletes. Production relevance: Authoritative run deleted 9 old production generations with force=false; production and both rollback anchors untouched. Release relevance: Closed before the release.
- **Ownership:** GitHub: none | Linear: QNB-228, QNB-244 (Done) | active PR: Merged PRs 544, 545, 547, 548 | workstream: WS-RETENTION-OPS | Linear escalation required: NO
- **Required correction:** Fixed by the merged PRs. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Met (negative-path coverage for each authorization predicate). Verification: Resulting-main retention proof.
- **Disposition / implementation:** Terminal; lessons kept in the recurring-miss ledger. Implementation status: DONE.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Terminal; not re-run.

### CG-AUD-20261008-027 -- Deploy, signing and release credentials are not isolated behind approval or ref rules (design level)

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: CI/CD credential scoping | severity S2 | confidence HIGH | status OPEN
- **Affected surface:** .github/workflows (deploy, signing, release, cleanup), docs/GITHUB-SETTINGS-GUIDE.md
- **Observed:** Secret-bearing workflows rely on repository-wide secrets without Environments that require reviewers or restrict refs, some are dispatchable from any branch, and the documentation prescribes a broad personal-access-token for the release workflow. The egress firewall step runs in audit mode in most jobs. Details are kept in the private tracker.
- **Expected:** Least privilege per purpose with human approval for sensitive jobs.
- **Evidence:** Workflow inventory (see REPOSITORY-MAP); real v1.10.0 publication exposed credential coupling (see 010).
- **Diagnosis:** Grown incrementally.
- **Impact:** A compromised or mistaken branch could reach a deploy or release credential. Production relevance: Latent. Release relevance: Do not alter mid-release.
- **Ownership:** GitHub: none | Linear: UNASSIGNED | active PR: none | workstream: WS-CI-GOVERNANCE | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D3: Environments with reviewers and ref rules, narrower tokens or a GitHub App, trusted workflow_run for previews, block mode with allow-lists. Implementation brief: D3 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** No secret-bearing job starts from an arbitrary branch without approval. Verification: Workflow policy tests; settings review by the owner.
- **Disposition / implementation:** Unassigned; owner/admin settings involved. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 010 | user/provider gate: Owner/admin settings | follow-up: none
- **Live-main revalidation:** Not re-run (settings-level); workflow files unchanged on c49560d9 on 2026-10-08.

### CG-AUD-20261008-028 -- Live ruleset state differs from the repository's expected state and from CLAUDE.md claims (design level)

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Repository governance | severity S3 | confidence CONFIRMED | status OPEN
- **Affected surface:** GitHub rulesets, scripts/check-repository-governance.mjs, CLAUDE.md
- **Observed:** The live governance check is not green and CLAUDE.md states ruleset properties (thread resolution) that the live ruleset does not enforce. Specifics are owner/admin settings kept in the private tracker.
- **Expected:** The live check is green or each accepted exception is recorded; CLAUDE.md matches live.
- **Evidence:** `check-repository-governance.mjs --live` (GET only).
- **Diagnosis:** Settings changed outside the repository.
- **Impact:** Wrong assumptions in process (for example strict status checks). Production relevance: None. Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED | active PR: none | workstream: WS-CI-GOVERNANCE | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D4. Implementation brief: D4 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** Live check green or exceptions recorded; claims corrected. Verification: Live check output.
- **Disposition / implementation:** Unassigned; owner/admin. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: Owner/admin settings | follow-up: none
- **Live-main revalidation:** Not re-run (settings-level).

### CG-AUD-20261008-029 -- Persisted and network JSON is cast with `as T` at 34 trust-boundary sites

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Type safety / data schemas | severity S3 | confidence CONFIRMED | status OPEN
- **Affected surface:** apps/web/services (aiProviderService, aiRateLimiter, apiKeyService, geminiRuntime and others)
- **Observed:** 34 non-test sites parse JSON with `JSON.parse(...) as T` or `(await r.json()) as T`; 355 of the repository's eslint-disable comments suppress no-unsafe-type-assertion. A corrupted budget record can silently disable cost-cap logic.
- **Expected:** Schema validation with safe defaults at every boundary.
- **Evidence:** Source scan on the snapshot.
- **Diagnosis:** Convenience typing.
- **Impact:** Silent misbehaviour on corrupt or tampered state. Production relevance: Latent. Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED (related QNB-256) | active PR: none | workstream: WS-TEST-QUALITY | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D5. Implementation brief: D5 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** No cast for persisted state; negative-path tests; lower suppression count. Verification: Ratchet on the count.
- **Disposition / implementation:** Unassigned. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Count taken on 3d8b706d; services unchanged on c49560d9.

### CG-AUD-20261008-030 -- Tauri filesystem scope allows any `$DOCUMENT/**/*.json` and the webview CSP keeps unsafe-inline

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Desktop / Tauri security | severity S2 | confidence HIGH | status OPEN
- **Affected surface:** apps/desktop/src-tauri/capabilities/fs.json, tauri.conf.json
- **Observed:** Read and write of text files under `$DOCUMENT/**/*.json` and `*.cannaguide` is allowed (plus app data); the CSP keeps `script-src 'unsafe-inline'` and `img-src ... https:`. Script execution in the webview could read or overwrite arbitrary JSON under Documents. Unused plugins are registered (process without capability; shell only for the deprecated open route).
- **Expected:** Access only to app data and user-selected paths.
- **Evidence:** fs.json; tauri.conf.json; lib.rs plugin list.
- **Diagnosis:** Broad scope chosen for import/export.
- **Impact:** Data exposure after any webview script injection. Production relevance: No desktop installers are published (see 038). Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED | active PR: none | workstream: WS-DESKTOP | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D6: drop the wildcard, use dialog-granted paths, tighten the CSP, remove unused plugins. Implementation brief: D6 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** No wildcard allow outside app data; import/export works through dialogs; a test asserts it. Verification: Capability file test.
- **Disposition / implementation:** Unassigned; the lease forbids desktop edits for now. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 038 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** fs.json unchanged on c49560d9 on 2026-10-08.

### CG-AUD-20261008-031 -- Critical-path coverage gate covers 4 files; persistence adapter and core provider services lack tests

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Unit/integration coverage | severity S3 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** vitest config, stores/indexedDBStorage.ts, services/db/connection.ts, aiProviderService, aiService, mqttClientService
- **Observed:** Global floors are low (43/41/25/35); the critical-path list has 4 files; the persistence adapter and DB connection have no test file; three core services have no sibling tests; tests mock fetch and hide production failures (see 022).
- **Expected:** Meaningful critical-path list and negative-path tests for persistence.
- **Evidence:** Config and file census on the snapshot.
- **Diagnosis:** Gate list never extended.
- **Impact:** Regressions in persistence reach production. Production relevance: Latent. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-256, QNB-235 | active PR: none | workstream: WS-TEST-QUALITY | Linear escalation required: NO
- **Required correction:** Extend the list; add debounce, force-save, quota and blocked-path tests; runtime half of the erase invariant. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** New files in the gate; negative-path tests present. Verification: Coverage run in CI.
- **Disposition / implementation:** Queued. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: Mutation quality tracked in QNB-235.
- **Live-main revalidation:** No test file for indexedDBStorage.ts or db/connection.ts on c49560d9 on 2026-10-08.

### CG-AUD-20261008-032 -- Dangling `.cursor/rules` pointer and CLAUDE.md claims that differ from reality

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Documentation truth | severity S4 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** apps/web/public/sw.js header, CLAUDE.md
- **Observed:** sw.js points to `.cursor/rules/204-pwa-cache-and-sw.mdc`, but the `.cursor` directory does not exist on main. CLAUDE.md says the ruleset requires thread resolution (see 028) and names three i18n gates that gate locale parity (see 037).
- **Expected:** References resolve and claims match.
- **Evidence:** git ls-tree of origin/main: 0 files under `.cursor/`.
- **Diagnosis:** Rules moved or removed.
- **Impact:** Misleading guidance. Production relevance: None. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-266 | active PR: none | workstream: WS-DOCS-TRUTH | Linear escalation required: NO
- **Required correction:** Fix the pointer; add a link checker for `.cursor/rules/*` and `docs/*` references. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** All referenced paths exist. Verification: Link-check test.
- **Disposition / implementation:** Queued with 004. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 004 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** sw.js line 5 still references the missing rule on c49560d9 on 2026-10-08.

### CG-AUD-20261008-033 -- Override floors for qs and markdown-it sit below the patched versions and Dependabot ignores both

- **Meta:** Wave 2 (supply chain, i18n gates, desktop, release verification); snapshot 2026-10-08, main 3d8b706d / c49560d9 | domain: Dependency floors | severity S3 | confidence CONFIRMED | status OPEN
- **Affected surface:** pnpm-workspace.yaml overrides, .github/dependabot.yml ignore list, scripts/security/check-override-floors.mjs
- **Observed:** `qs >=6.15.2` and `markdown-it >=14.2.0` pin the lockfile to vulnerable 6.15.2 and 14.3.0 (patched >=6.16.0 / 14.3.1); both are on the LEGACY_UNBOUNDED allow-list and Dependabot-ignored, so neither tool will move them. `ip-address >=10.3.1 <11` is bounded but its floor is also below the patched 10.7.1. CI audits at level high only.
- **Expected:** Floors at or above patched versions; a gate fails when an override pins a vulnerable resolution.
- **Evidence:** pnpm-workspace.yaml lines 91, 95, 102; dependabot.yml ignore entries; pnpm audit advisories.
- **Diagnosis:** The override/ignore pair has no vulnerability check (trap 4 in CLAUDE.md).
- **Impact:** Known-vulnerable dev tooling pinned in place. Production relevance: Dev tooling only for qs/markdown-it. Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED | active PR: none | workstream: WS-DEPS-SUPPLY-CHAIN | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D8: bounded floors at or above patched versions; shrink LEGACY_UNBOUNDED; add a resolved-version gate. Implementation brief: D8 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** pnpm audit count drops; ratchet shrinks. Verification: Frozen-lockfile CI run; read-only `pnpm audit`.
- **Disposition / implementation:** Unassigned; do not touch the lockfile mid-lease. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: Source lease | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Overrides unchanged on c49560d9 on 2026-10-08.

### CG-AUD-20261008-034 -- extract-zip has two high advisories and no patched version (development tooling)

- **Meta:** Wave 2 (supply chain, i18n gates, desktop, release verification); snapshot 2026-10-08, main 3d8b706d / c49560d9 | domain: Dependency advisories | severity S3 | confidence CONFIRMED | status OPEN
- **Affected surface:** pnpm-lock.yaml: extract-zip 2.0.1 via @puppeteer/browsers (Lighthouse CI chain)
- **Observed:** Dependabot lists GHSA-7pqw-9j4j-h8q3 and GHSA-jmr9-qjv8-65gv (high); pnpm audit's advisory list omitted them while its summary counted high.
- **Expected:** Chain removed, replaced, or a documented time-boxed exception.
- **Evidence:** Dependabot alerts (GET) and lockfile parents.
- **Diagnosis:** Unmaintained transitive dependency.
- **Impact:** Dev machines/CI only; no runtime bundle. Production relevance: None. Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED | active PR: none | workstream: WS-DEPS-SUPPLY-CHAIN | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D8: drop the chain, override to a maintained fork, or record an audit exception. Implementation brief: D8 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** Alert resolved or dismissed with a recorded reason. Verification: Alert state.
- **Disposition / implementation:** Unassigned. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 033 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Alerts read on 2026-10-08.

### CG-AUD-20261008-035 -- Rust glib 0.18.5 advisory in the desktop lockfile and no cargo audit step

- **Meta:** Wave 2 (supply chain, i18n gates, desktop, release verification); snapshot 2026-10-08, main 3d8b706d / c49560d9 | domain: Dependency advisories (Rust) | severity S3 | confidence CONFIRMED | status OPEN
- **Affected surface:** apps/desktop/src-tauri/Cargo.lock
- **Observed:** Dependabot alert GHSA-wrw7-89jp-8q8g (fixed in 0.20.0); the GTK3 bindings come in through the Tauri / wry stack on Linux, so the fix depends on upstream. No workflow audits the Rust lockfile.
- **Expected:** Rust lockfile has independent audit coverage.
- **Evidence:** Cargo.lock; Dependabot alert.
- **Diagnosis:** Upstream pin.
- **Impact:** Linux desktop builds. Production relevance: No desktop distribution. Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED | active PR: none | workstream: WS-DESKTOP | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D8: track upstream; add a cargo-audit step to dependency-health. Implementation brief: D8 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** Rust lockfile covered by CI. Verification: Workflow run.
- **Disposition / implementation:** Unassigned. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: Upstream Tauri | follow-up: none
- **Live-main revalidation:** Cargo.lock version unchanged on c49560d9.

### CG-AUD-20261008-036 -- fflate (via jspdf) and ip-address (via mqtt) advisories lie on runtime dependency paths

- **Meta:** Wave 2 (supply chain, i18n gates, desktop, release verification); snapshot 2026-10-08, main 3d8b706d / c49560d9 | domain: Dependency advisories (runtime path) | severity S3 | confidence MEDIUM | status OPEN
- **Affected surface:** apps/web dependencies jspdf, mqtt
- **Observed:** fflate 0.8.2 (patched 0.8.3; a 0.8.3 copy also exists in the lockfile) and ip-address 10.4.0 (patched 10.7.1) sit under runtime dependencies. Whether the ip-address code reaches the browser bundle is unverified; Dependabot scope labels disagree with the dependency paths.
- **Expected:** Runtime paths patched or shown unreachable.
- **Evidence:** pnpm audit paths; Dependabot alerts; lockfile.
- **Diagnosis:** Lockfile resolution and override floor.
- **Impact:** Depends on reachability (not assessed). Production relevance: Possible. Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED | active PR: none | workstream: WS-DEPS-SUPPLY-CHAIN | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D8: dedupe fflate; raise the ip-address floor; verify bundle reachability. Implementation brief: D8 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** Patched or proven unreachable. Verification: Bundle analysis plus audit.
- **Disposition / implementation:** Unassigned. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 033 | user/provider gate: none | follow-up: Exploitability not assessed.
- **Live-main revalidation:** Audit run 2026-10-08; lockfile unchanged on c49560d9.

### CG-AUD-20261008-037 -- Only check:i18n is wired and only for German; check:i18n-usage and lint:i18n run nowhere

- **Meta:** Wave 2 (supply chain, i18n gates, desktop, release verification); snapshot 2026-10-08, main 3d8b706d / c49560d9 | domain: i18n gates | severity S3 | confidence CONFIRMED | status OPEN
- **Affected surface:** scripts/check-i18n-*.mjs, ci.yml, release-gate.yml, CLAUDE.md, docs/i18n-parity-backlog.md
- **Observed:** `REQUIRED_LANGS = {de}` so es/fr/nl are warn-only; the usage and hardcoded-string checks are in no workflow or hook and lint:i18n exits 0 unless strict is set; CLAUDE.md calls all three gates. The real gap (help about 217 keys, strains about 150, plants about 32 for fr; no strains catalog for es/fr/nl) is documented in docs/i18n-parity-backlog.md but had no tracker owner.
- **Expected:** Every gate named in CLAUDE.md is enforced or removed from the claim.
- **Evidence:** Workflow grep; script header.
- **Diagnosis:** Gates added incrementally.
- **Impact:** Missing translations ship green (English fallback). Production relevance: Live. Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED (related QNB-266) | active PR: none | workstream: WS-I18N | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D7. Implementation brief: D7 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** Gates enforced or claim corrected; locale tier explicit. Verification: CI wiring.
- **Disposition / implementation:** Unassigned. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Wiring re-checked on c49560d9 on 2026-10-08: only ci.yml and release-gate.yml call check:i18n.

### CG-AUD-20261008-038 -- Desktop Build fails at startup on every tag push and the updater endpoint returns 404

- **Meta:** Wave 2 (supply chain, i18n gates, desktop, release verification); snapshot 2026-10-08, main 3d8b706d / c49560d9 | domain: Desktop release pipeline | severity S3 | confidence CONFIRMED | status OPEN
- **Affected surface:** .github/workflows/desktop-build.yml, apps/desktop/src-tauri/tauri.conf.json, docs/distribution.md, ADR 0012
- **Observed:** The workflow has three runs (v1.8.2, v1.9.0, v1.10.0), all `startup_failure` with zero jobs and never a dispatch run, so CI has never built a desktop artifact. Most probable cause (PLAUSIBLE): the Actions policy is `selected` and this is the only workflow using `pnpm/action-setup`, for which no allow-list pattern exists. The updater has no `bundle.createUpdaterArtifacts`, the tauri-action step has no tagName, nothing publishes `latest.json`, and the configured endpoint returns HTTP 404. Docs describe the endpoint as working.
- **Expected:** Either a pipeline that starts, builds four targets and publishes updater artifacts, or an honest "development shell" state.
- **Evidence:** Run 37703950695 and history; Actions policy API; endpoint probe.
- **Diagnosis:** Unknown pending the run annotation; PLAUSIBLE: allow-list.
- **Impact:** Silent: releases carry no desktop artifacts, signing wiring never exercised. Production relevance: No desktop distribution exists. Release relevance: Web release unaffected (independent workflows).
- **Ownership:** GitHub: none | Linear: QNB-254 (sequencing); implementation UNASSIGNED | active PR: none | workstream: WS-RELEASE-OPS | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D9: read the annotation; drop or allow pnpm/action-setup; prove with a dispatch run; add a release-gate check; decide on artifacts and latest.json. Implementation brief: D9 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** Dispatch run completes or fails for a real build reason; next tag does not startup_fail; docs match. Verification: Run URL.
- **Disposition / implementation:** Rule from the ledger: zero-job startup_failure needs control-plane diagnosis before source mutation; no retrigger commits. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: Lease forbids desktop-build.yml edits until QNB-273 completes. | user/provider gate: Owner reads the run annotation | follow-up: none
- **Live-main revalidation:** desktop-build.yml still uses pnpm/action-setup and the endpoint still returns 404 (probed 2026-10-08).

### CG-AUD-20261008-039 -- Small Tauri command defects: hard-coded capability flags, misnamed open_log_dir, wrong cache byte count

- **Meta:** Wave 2 (supply chain, i18n gates, desktop, release verification); snapshot 2026-10-08, main 3d8b706d / c49560d9 | domain: Desktop / Tauri code | severity S4 | confidence CONFIRMED | status OPEN
- **Affected surface:** apps/desktop/src-tauri/src/lib.rs
- **Observed:** `get_native_capabilities` returns hard-coded true for eight capabilities although its comment says it mirrors the capability files; `open_log_dir` only returns the path; `clear_native_cache` adds directory entry sizes instead of content sizes.
- **Expected:** Values and names match behaviour.
- **Evidence:** lib.rs.
- **Diagnosis:** Scaffold shortcuts.
- **Impact:** UI feature-flags and a displayed number are wrong. Production relevance: No desktop distribution. Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED | active PR: none | workstream: WS-DESKTOP | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Fold into D6/D9 work. Implementation brief: D6/D9 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** Flags derived from real state; names/values correct. Verification: Rust unit tests.
- **Disposition / implementation:** Unassigned. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 030, 038 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** lib.rs unchanged on c49560d9 on 2026-10-08.

### CG-AUD-20261008-040 -- The v1.10.0 tag object is unsigned (informational)

- **Meta:** Wave 2 (supply chain, i18n gates, desktop, release verification); snapshot 2026-10-08, main 3d8b706d / c49560d9 | domain: Release provenance | severity S4 | confidence CONFIRMED | status TERMINAL
- **Affected surface:** Tag v1.10.0
- **Observed:** The annotated tag created by the release workflow is unsigned; rulesets require signed commits, not signed tags.
- **Expected:** Policy decides whether tags must be signed.
- **Evidence:** Git tag object verification fields.
- **Diagnosis:** Workflow-created tag.
- **Impact:** Low. Production relevance: None. Release relevance: Release otherwise verified (tag at the intended SHA, release published, hosts identical).
- **Ownership:** GitHub: none | Linear: none | active PR: none | workstream: WS-RELEASE-OPS | Linear escalation required: NO
- **Required correction:** Optional: sign release tags if provenance policy requires it.
- **Acceptance / verification:** Policy decision recorded. Verification: n/a
- **Disposition / implementation:** Informational; terminal. Implementation status: n/a.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Read on 2026-10-08.

### CG-AUD-20261008-052 -- Vercel reports "Deployment rate limited - retry in 24 hours" on a docs-only PR

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: Vercel quota | severity S4 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** Vercel project plan quota
- **Observed:** The Vercel check failed on the audit docs PR (platform build-rate limit). Required checks passed (`CI Status`), so merges are not blocked, but a merge to main may not produce a Vercel production deployment while the limit is active, which would look like host lag in the parity probe.
- **Expected:** Docs PRs do not consume deployments; parity checks account for quota.
- **Evidence:** PR check output with the provider message.
- **Diagnosis:** Many preview and production deployments in one day.
- **Impact:** False drift signals; delayed Vercel production. Production relevance: Possible delay. Release relevance: Check before the next release.
- **Ownership:** GitHub: none | Linear: QNB-249 | active PR: none | workstream: WS-RETENTION-OPS | Linear escalation required: NO
- **Required correction:** Owner setting: skip previews for docs-only changes; check quota before releases. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Docs PRs do not trigger deployments. Verification: Dashboard.
- **Disposition / implementation:** Noted in the owner issue. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: Owner (Vercel settings) | follow-up: none
- **Live-main revalidation:** Observed 2026-10-08.

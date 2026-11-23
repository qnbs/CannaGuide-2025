# PR Review Correction Loop — Runbook

Standing procedure for every pull request in this repository. It applies to findings from CodeRabbit, CodeAnt, Codex, Sourcery, DeepSource, Socket Security, GitGuardian, CodeQL, and humans. It is a review procedure, not a GitHub required check or an independent enforcement boundary.

**Review coverage:** Prefer two independent qualified reviews from CodeRabbit, CodeAnt, Codex, and Sourcery on the exact current head. Low-risk fallback is limited to one qualified review after one request and the documented wait; high-risk changes and uncertainty require two, with no fallback. No third review is required once two qualified reviews cover the current head.

Review evidence must bind to the full 40-character current head SHA and an allowlisted identity. Each provider counts once. A review receipt is accepted only in the two explicitly supported, structured formats below (the Codex receipt and the CodeRabbit coverage marker, which names the exact head unless a base-only merge is proven); a free-form comment, status check, bot receipt without a full SHA, or user-authored copy does not count. All findings and relevant threads must still be dispositioned, and required GitHub checks remain mandatory.

The policy change in PR #857 is transitional: evaluate that PR under the pre-change policy until it is merged. For #857, only two non-dismissed, completed GitHub pull-request review objects from CodeRabbit, CodeAnt, or Codex on the exact current head satisfy the old internal review requirement. Do not use this change to approve itself.

---

## 0. Reviewers active on this repo

| Reviewer                                                              | Surface                                                                                                       | Where findings appear                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **CodeRabbit** (`coderabbitai[bot]`)                                  | correctness, security, style; posts **outside-diff-range** comments that reference code your PR did not touch | inline review threads + one summary issue-comment  |
| **CodeAnt** (`codeant-ai[bot]`)                                       | correctness and maintainability                                                                               | inline review threads                              |
| **Codex** (`chatgpt-codex-connector[bot]`)                            | correctness                                                                                                   | review on the pull or supported structured receipt |
| **Sourcery** (`sourcery-ai[bot]`)                                     | correctness and maintainability                                                                               | completed review object; opportunistic             |
| **DeepSource**                                                        | JS/TS, Docker, Go, Rust, CSS analyzers; grades the PR                                                         | check run + issue-comment                          |
| **Socket Security**                                                   | dependency supply-chain alerts                                                                                | check run + PR alerts comment                      |
| **GitGuardian**                                                       | secret scanning                                                                                               | check run                                          |
| **CodeQL** (`Analyze (actions\|javascript-typescript\|python\|rust)`) | static analysis, incl. **workflow files**                                                                     | check runs                                         |
| **Vercel / Cloudflare**                                               | preview deploys                                                                                               | check runs                                         |

`gh pr checks <N>` does **not** show inline review threads. You must query them (step 2).

---

## 1. Before pushing: keep the PR reviewable

- **Under ~100 changed files.** Review bots silently skip inline comments on larger PRs, so the loop never starts. Count this pull against its remote base, not a stale local `main`. Do not cascade tiny pushes while the current head is still being reviewed or tested:

    ```bash
    # Stacked pull: count this pull against its parent, then the whole stack against main.
    PARENT_BRANCH=feature/previous
    PARENT_REF="origin/${PARENT_BRANCH}"
    git rev-list --count "$(git merge-base "$PARENT_REF" HEAD)"..HEAD
    git diff --name-only "$(git merge-base "$PARENT_REF" HEAD)"...HEAD | wc -l
    # Against origin/main. For a stacked pull this is the whole stack.
    git rev-list --count "$(git merge-base origin/main HEAD)"..HEAD
    git diff --name-only "$(git merge-base origin/main HEAD)"...HEAD | wc -l
    ```

    The parent count is this pull. The `origin/main` count is the whole stack. Warn when either count crosses the budget. A pull that is not stacked uses only the `origin/main` pair.

- **Commit and file budget.** Warn around 8 commits or 50 files. Stop adding new scope around 12 commits or 75 files. Open a successor before 15 commits or about 100 files. Pull request #757 is a recorded exception: 26 commits and 89 files at `6b57be331c9841545c5de2a0dfcbfe9d1e77552b`. Do not rewrite that history to look smaller.
- i18n fans out hard (5 locales × N namespace files). A single copy change can cross the limit — split into stacked PRs (PR2's base = PR1's branch; GitHub retargets it automatically when PR1 merges).
- One concern per PR. A mixed PR gets mixed findings and cannot be reverted cleanly.
- **Lint every changed file to the hook's bar before committing:** `pnpm lint:changed` lints all changed and new (untracked) JS/TS files with `--max-warnings 0`, the same bar as the pre-commit `lint-staged` step. It fails (exit 2) instead of passing when it cannot resolve a base or merge base, so a missing `origin/main` never means "nothing to lint". `lint-scopes --changed` covers only the strict scopes (hooks, `components/common`, services, stores), so a warning in `components/views/...` passes it and then fails the commit.
- **DeepSource preflight (partial coverage, GH #804):** `node ./scripts/deepsource-preflight.mjs` lints each changed and untracked file (renames resolved to their old path) at the merge base and as it is now, and reports the mirrored rules whose findings rose -- for complexity, a function that got more complex counts, as it does for DeepSource. Mirrored: JS-R1005 complexity, JS-0105 `class-methods-use-this`, JS-0116 `require-await`, JS-0045 `consistent-return`, JS-0047 `default-case`, JS-0051 `guard-for-in`, JS-R1004 template literal without interpolation, JS-W1042 trailing `undefined`, JS-0339 non-null assertion. Not mirrored: rules that need types or plugins (for example JS-0357, JS-0437), DeepSource's metrics, and the owner-retired JS-0067 / JS-T1001 (GH #808). Differential check on PR 802: head 649592d1 -- DeepSource 1 introduced (JS-R1005, `GrowPlannerView.tsx:150`), preflight the same finding; head 536d8442 -- 0 and 0. A clean run is a good sign; the exact-head `DeepSource: JavaScript` status stays the gate. `--all` lists every finding in the changed files.

---

## 2. Fetch every open thread (including outside-diff-range)

**Paginate.** A single page is not the work-list: a busy PR exceeds 100 threads, and an unpaginated query reports "0 unresolved" while hiding real findings. `--paginate` requires `$endCursor` in the query and `pageInfo` on the connection.

```bash
gh api graphql --paginate -f query='
query($owner:String!,$repo:String!,$num:Int!,$endCursor:String){
 repository(owner:$owner,name:$repo){ pullRequest(number:$num){
  reviewThreads(first:100, after:$endCursor){
    pageInfo{ hasNextPage endCursor }
    nodes{
      id isResolved isOutdated path line
      comments(first:10){ nodes{ id author{login} body } } } }
 }}}' -F owner=qnbs -F repo=CannaGuide-2025 -F num=<N> \
 --jq '.data.repository.pullRequest.reviewThreads.nodes[]
   | select(.isResolved | not)
   | "THREAD=\(.id)\n\(.path):\(.line)\n\(.comments.nodes[0].author.login): \(.comments.nodes[0].body)\n---"'
```

Issue comments are part of the completion check. CodeRabbit, DeepSource, and Socket put findings in summary issue comments that never become review threads. Paginate them and disposition every finding before the loop can end:

```bash
gh api --paginate repos/qnbs/CannaGuide-2025/issues/<N>/comments \
  --jq '.[] | {id, user:.user.login, body:.body}'
```

`isResolved == false` is the only work-list that counts. `isOutdated` threads still count — the anchor moved, the finding may not have.

---

## 3. Triage each thread — validate before you trust it

Review-bot anchors go stale, and bots are wrong often enough that "the bot said so" is never a reason. For each finding, decide **against the current code**:

1. **Still valid → fix at the root.** Not the symptom the bot pointed at — the cause. Ship everything that belongs to the fix: code **+ test + i18n (all 5 locales) + docs + CHANGELOG**.
2. **Already fixed** by a later commit → reply with the commit SHA, resolve.
3. **False positive** → reply with the _evidence_ (the code path, the config, the reason the bot's assumption doesn't hold). Never "won't fix" with no argument.

**Outside-diff-range comments are in scope.** CodeRabbit routinely flags a real defect in code your PR merely sits next to. If it is real, fix it — or, when it is genuinely a separate concern, open a tracked issue and link it in the reply. Never silently ignore it.

**Never suppress to silence a finding.** No new `eslint-disable`, no `biome-ignore`, no widened ignore lists. Refactor until the rule passes honestly. (The a11y ratchet and file-budget gates count suppressions; adding one fails CI anyway.)

---

## 4. Reply and resolve — every thread, no exceptions

```bash
# reply in-thread
gh api graphql -f query='mutation($t:ID!,$b:String!){
  addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$t, body:$b}){ comment{ id } } }' \
  -F t='<THREAD_ID>' -F b='Fixed in <sha> — <one line on what changed and why>.'

# resolve
gh api graphql -f query='mutation($t:ID!){
  resolveReviewThread(input:{threadId:$t}){ thread{ isResolved } } }' -F t='<THREAD_ID>'
```

Cite the resolving commit SHA in every reply that ships a fix. A refutation that changes no code cites the current head SHA. A resolved thread with no explanation is not resolved, it is buried.

---

## 5. Exact-head evidence, risk, and bounded review requests

Keep one stable head while reviews and checks run. Request only the missing review coverage; each provider is requested at most once for that head. A code change invalidates prior-head evidence. Re-read the head and evidence immediately before merge. Do not retry a skipped, rate-limited, timed-out, quota-limited, expired, or silent bot indefinitely.

One stable-head correction: collect findings, group them by root cause, and ship one signed corrective commit after relevant checks and reviews finish. Fetch every open thread and paginated finding, fix or refute it with evidence, and resolve only after disposition. A false positive refuted with evidence and resolved without a code change does not require another fresh review. A finding that lives only in a paginated issue comment counts the same way as an inline finding.

### Evidence accepted by the operator coverage evaluator

- A **GitHub pull-request review object** counts only when GitHub's API identifies one of the exact allowlisted bot logins (`coderabbitai[bot]`, `codeant-ai[bot]`, `chatgpt-codex-connector[bot]`, `sourcery-ai[bot]`), its GitHub API author type must be Bot, `commit_id` is the full exact current SHA, and the latest review for that provider on that head is submitted in `COMMENTED`, `APPROVED`, or `CHANGES_REQUESTED` state. `PENDING`, `DISMISSED`, unknown states, older heads, and unknown identities do not count. A dismissed latest review invalidates that provider's coverage.
- The only supported issue-comment receipts are these two:
    - The codex-review-state:v1 marker emitted by the authenticated Codex bot account (`chatgpt-codex-connector[bot]`): `<!-- codex-pull-request-review-summary -->` followed by exactly one `<!-- codex-review-state:v1 {JSON} -->` marker. Its `code_review.commit_sha` must be a full 40-character lowercase SHA equal to the current head; `status` must equal `completed`; and both `has_any_findings` and `has_unresolved_findings` must be booleans. GitHub API author identity is verified and its author type must be Bot. The latest marked Codex receipt is used. A current-head dismissed Codex review cannot be overridden by a receipt.
    - The CodeRabbit coverage marker in the summary comment of the authenticated CodeRabbit bot account (`coderabbitai[bot]`, author type Bot): the summary marker `<!-- This is an auto-generated comment: summarize by coderabbit.ai -->` and exactly one `<!-- final_review_risk_coverage:{JSON} -->` marker whose `sourceCommitId` and `coveredCommitId` both equal the full current head SHA and whose `kind` is `reviewed`. A CodeRabbit review that finds nothing creates no review object, so without this receipt a clean exact-head pass could not count (PR #866). CodeRabbit edits the summary in place; the latest summary edit is used, and when it has no valid exact-head marker (for example a rate-limited or skipped summary), CodeRabbit does not count. A formal CodeRabbit review on the head takes precedence, and a dismissed one cannot be overridden by the marker.
        - **Base-only merge (PR #868).** CodeRabbit reviews incrementally and skips a head that only merges the base branch ("No files to review"), so its marker stays on the earlier reviewed head. That marker counts for the current head only with a `headEquivalence` proof from `node scripts/security/review-head-equivalence.mjs --prior <reviewed head> --head <current head>` (fetch `origin/main` first; exit 0 means proven). The proof requires four things. The reviewed head is an ancestor of the current head. Every first-parent commit after it is a two-parent merge of a commit already on `origin/main`. Each such merge is git's clean automatic merge of its parents: `git merge-tree --write-tree` reports no conflict and yields exactly the merge commit's tree, so every byte (binary files and the location of each edit included) comes from the two parents. The pull's changed lines have the same SHA-256 on both heads: each head is diffed with `git diff -U0 --binary` against its own merge base, without hunk headers and `index` lines. The evaluator accepts only a proof against `origin/main`. Any of these fails closed: a conflict resolved by hand, a merge that changes anything beyond the automatic merge, any extra commit (even an empty one), a merge of another branch, or a missing or inconsistent proof. A dismissed CodeRabbit review on the reviewed head blocks it. Only the CodeRabbit marker is carried. Every other provider still needs the exact current head.
- No other issue comment is a review receipt. In particular, free-form `LGTM`, partial-SHA summaries, copied/user-authored receipts, CodeAnt prose, CodeRabbit prose without the exact-head marker, status checks, reactions, and review-start notifications do not count. Findings reported by any source still require disposition regardless of whether the source counts toward coverage.

Collect API evidence and pass it to the local evaluator. Its result is an operator aid, **not a required CI check** and not a substitute for GitHub rulesets, branch protection, exact-head checks, or review-thread disposition:

```bash
HEAD_SHA=$(gh pr view "$PR_NUMBER" --repo qnbs/CannaGuide-2025 --json headRefOid --jq .headRefOid)
node scripts/security/collect-review-evidence.mjs "$PR_NUMBER" --expect-head "$HEAD_SHA"
```

When CodeRabbit's marker names an earlier head after a base-only merge, refresh `origin/main` and set `REVIEWED_HEAD` to the full SHA from that marker. Pass the verified proof to the collector:

```bash
PROOF_DIR=$(mktemp -d) &&
  node scripts/security/review-head-equivalence.mjs --prior "$REVIEWED_HEAD" --head "$HEAD_SHA" > "$PROOF_DIR/head-equivalence.json" &&
  jq '{headEquivalence: .}' "$PROOF_DIR/head-equivalence.json" > "$PROOF_DIR/evidence-extra.json" &&
  node scripts/security/collect-review-evidence.mjs "$PR_NUMBER" --expect-head "$HEAD_SHA" --supplement "$PROOF_DIR/evidence-extra.json"
```

If the collector cannot get a complete comparison, fetch the exact pull base and head into this clone first. Then run the manual collection from the repository root with `PR_NUMBER` set:

```bash
(
  set -euo pipefail
  [[ "$PR_NUMBER" =~ ^[1-9][0-9]*$ ]]
  repo=repos/qnbs/CannaGuide-2025
  pull="$repo/pulls/$PR_NUMBER"
  refs() { gh api "$pull" --jq '[.base.sha, .head.sha] | join(" ")'; }
  before=$(refs)
  read -r base head <<< "$before"
  [[ "$base" =~ ^[0-9a-f]{40}$ && "$head" =~ ^[0-9a-f]{40}$ ]]
  merge_base=$(git merge-base --all "$base" "$head")
  [[ "$merge_base" =~ ^[0-9a-f]{40}$ ]]

  evidence_dir=$(mktemp -d)
  trap 'rm -f -- "$evidence_dir"/{files,reviews.json,comments.json,evidence.json}; rmdir -- "$evidence_dir"' EXIT
  git diff --name-only --no-renames -z "$merge_base" "$head" > "$evidence_dir/files"
  gh api "$pull/reviews" --paginate --slurp > "$evidence_dir/reviews.json"
  gh api "$repo/issues/$PR_NUMBER/comments" --paginate --slurp > "$evidence_dir/comments.json"
  after=$(refs)
  [[ "$before" == "$after" ]]
  read -r _ rechecked_head <<< "$after"

  jq -n --argjson pullNumber "$PR_NUMBER" --arg headSha "$head" \
    --arg recheckedHeadSha "$rechecked_head" --arg now "$(date -u +%FT%TZ)" \
    --rawfile files "$evidence_dir/files" --slurpfile reviews "$evidence_dir/reviews.json" \
    --slurpfile comments "$evidence_dir/comments.json" \
    '{$pullNumber, $headSha, $recheckedHeadSha, $now,
      changedFiles: ($files | split("\u0000") | map(select(length > 0))),
      reviews: ($reviews[0] | add // []), issueComments: ($comments[0] | add // [])}' \
    > "$evidence_dir/evidence.json"
  node scripts/security/review-coverage-policy.mjs < "$evidence_dir/evidence.json"
)
```

The input object contains `pullNumber`, `headSha`, `recheckedHeadSha`, `changedFiles`, `reviews`, `issueComments`, and an ISO `now`; each review must come from that PR's `pull_request_url` and each receipt from that PR's `issue_url`. A low-risk fallback also supplies `secondReviewRequest` with `provider`, `pullNumber` (must equal the top-level `pullNumber`), `headSha`, `requestCount`, `requestedAt`, `observedAt`, `result`, and a nonempty `reference`. After a base-only merge, `headEquivalence` holds the unmodified JSON printed by `scripts/security/review-head-equivalence.mjs`. Use the complete API arrays, not summaries. The collector must read the PR head before fetching evidence and re-read it afterward. If either SHA differs, discard the snapshot and repeat once the head is stable. Use `git diff --name-only --no-renames <merge-base> <head>` so the source and destination of a rename both enter `changedFiles`. The evaluator defaults uncertain files to high risk.

### Risk tiers and review count

- **High risk:** credentials, auth, secrets, persistence, multi-tab consistency, storage/recovery, migrations, privacy erasure, CI or review trust boundaries, branch/ruleset/release/signing security, dependencies, security policy, and any uncertain scope. Require two independent qualified exact-head reviews; there is no one-review fallback. For PR #857, apply the pre-change transition rule above.
- **Low risk:** only ordinary documentation or non-security tests, with every changed path explicitly classified low by the evaluator. Two independent reviews remain preferred.
- **Low-risk fallback:** after one regular request to one missing reviewer for the exact head, one qualified review may suffice only if the second provider is demonstrably unavailable and the bounded wait has elapsed. An explicit rate-limit, timeout, or skip requires at least 30 minutes from the single recorded request; silence requires 24 hours. Record the request reference, provider, exact SHA, timestamps, and outcome. The evaluator rejects repeated requests, wrong-head requests, absent references, or early silence. Zero qualified reviews never satisfies the fallback.
- Sourcery is opportunistic. A completed Sourcery review counts once when available; its absence, skip, or rate limit never creates another wait. Sourcery quota skips and CodeRabbit skips on a non-default base are recorded availability limits, not completed review evidence. Once two qualified reviews exist, request no third review, including Codex.

### Provider limitations, receipt gaps, and availability (GH #906)

CodeRabbit documents an **incremental** review model (`@coderabbitai review`) that re-analyzes only commits since the last review, and a separate **full** re-review (`@coderabbitai full review`) that disregards prior inline comments ([Manage code reviews](https://docs.coderabbit.ai/guides/commands)). Configuration controls when automatic incremental reviews run (`reviews.auto_review.auto_incremental_review`, `auto_pause_after_reviewed_commits`) but **does not define** a machine-readable exact-head attestation API.

In this repository, the only CodeRabbit attestation accepted locally is either a formal GitHub pull request review on the exact head, or the authenticated `final_review_risk_coverage` marker in the summary issue comment naming that head (see above). Observed failure mode (PR #903, GH #906): after new feature commits, CodeRabbit can edit the summary prose to describe the commit range up to the current head while leaving `sourceCommitId` / `coveredCommitId` on an **earlier** reviewed commit. Incremental analysis in prose is **not** a receipt. The evaluator correctly stays fail-closed; base-only merge carry-forward applies only with a proven `review-head-equivalence.mjs` result, not feature commits on a stack branch.

**Do not** fabricate or edit markers, relax high-risk two-review rules, or invent head equivalence. **Do not** loop `@coderabbitai review` on the same head when the bot replies that incremental mode will not re-review already reviewed commits.

**Recovery without lowering quality:**

1. Keep one stable head; ship one correction wave, then wait for checks and reviews on that SHA.
2. Obtain **exact-head** qualified evidence from **CodeAnt** or **Codex** (formal review or structured Codex receipt). Two independent providers from the {CodeRabbit, CodeAnt, Codex, Sourcery} pool remain required for high risk; Sourcery is opportunistic for scheduling only, but a completed Sourcery review still counts once when present on the exact head.
3. When CodeRabbit coverage is required on a **final** stable head and incremental mode is exhausted, the provider-supported option is a single `@coderabbitai full review` on that head (not repeated incremental pings). If even a full review leaves the marker stale, treat it as a provider limitation and cover the head with the other allowlisted reviewers.
4. Run the collector with the expected head as shown above immediately before merge. It reads the changed files from an immutable base/head comparison and checks the count against the pull request metadata. The comparison endpoint returns at most 300 files. A larger, missing or incomplete list aborts collection. For such a pull, assemble evidence manually from the exact Git merge base and head. The collector reads reviews and comments across all API pages and rejects a snapshot if the pull head or base changes during collection.

**Systemic availability:** the qualified pool is {CodeRabbit, CodeAnt, Codex, Sourcery}. Any two independent qualified reviews on the exact head satisfy high-risk coverage, including a completed Sourcery review paired with any other allowlisted provider. A receipt gap from one vendor is an integration or quota limit, not permission to merge with one reviewer or human prose. Record skips in the PR thread; use the bounded low-risk fallback only when the evaluator classifies low risk and the wait rules are met.

### Findings and final readback

A completed review may still contain findings. Fix or refute every actionable finding with evidence, reply to each thread, and resolve it only after disposition. Paginated summary comments from CodeRabbit, DeepSource, Socket, or other tools are included in the finding inventory but do not become review evidence unless they meet the supported receipt format. Re-read all review objects, receipts, threads, issue comments, exact-head checks, mergeability, and ruleset state before merge. A former green check cannot replace a current-head readback.

## 6. Drive CI green — and read the right signal

```bash
until [ "$(gh pr checks <N> --json state --jq '[.[] | select(.state=="PENDING")] | length')" = "0" ]; do sleep 30; done
gh pr checks <N> | grep -viE '\tpass\t|skipping'
gh run view --job <JOB_ID> --log-failed | tail -40
```

Two traps this repo has already hit:

- **A red `main` can hide.** A historical Graphify updater pushed with `[skip ci]`, allowing a broken artifact to reach `main` and fail every PR while `main` showed no failing run. The updater now publishes a validated, complete review artifact and never writes to the repository; a human promotes it through a PR. **If a failure is unrelated to your diff, still check `main` before assuming it is yours:** `gh run list --workflow=ci.yml --branch=main --limit 5`.
- **What `✅ CI Status` requires depends on the diff.** On a code change it requires `build`, `test`, `verify`, `security` and `e2e` (Chromium, blocking); `rust` when `apps/desktop/**` changed and `policy` when agent instructions or gate docs changed. On a docs-only change those code jobs are skipped. Cross-browser E2E and the advisory job never block -- a green check mark is not evidence that they passed.

- **The PR head can lag the push.** In a GitHub outage the branch ref moved while the PR kept its old head and no checks ran (PR 802, 8f86f388). Before reading any poll as clean, compare `gh pr view <N> --json headRefOid` with the SHA you pushed. To re-sync, push a new commit (the next fix, or an empty `chore: re-sync PR head` commit; the squash merge folds it away). No force push is needed.
- **CodeAnt edits its top-level comments in place.** "CodeAnt Nitpicks" and "CodeAnt PR Risk" keep their `created_at` and change `updated_at` and the `Assessed commit`. They hold findings that are not review threads, so "0 unresolved threads" does not cover them: read them for the current head.

Every "green" claim in a PR description cites a **CI run URL + artifact**, never a local run.

---

## 7. Definition of done (binary)

- [ ] 0 unresolved review threads from reviewers that attached findings; every finding in paginated issue comments is fixed or refuted.
- [ ] Risk is classified from the actual changed paths; exact-head evidence is re-read immediately before merge.
- [ ] Two independent qualified reviewers cover high-risk changes; no fallback is allowed. Low-risk fallback, if used, meets the single-request evidence and wait rules in section 5.
- [ ] A supported structured Codex receipt has a verified bot author, full exact SHA, completed status, and findings booleans; unsupported comments do not count.
- [ ] A CodeRabbit coverage-marker receipt comes from `coderabbitai[bot]` (type Bot), has exactly one `final_review_risk_coverage` marker, names the full exact head SHA as source and covered commit, and has kind `reviewed`. A marker on an earlier head counts only with a proven base-only merge (`review-head-equivalence.mjs`).
- [ ] Sourcery is optional; no third reviewer is requested once two qualified reviewers cover the head.
- [ ] PR #857 itself is evaluated under the pre-change rule until merged.
- [ ] Every finding is fixed at the root, with a reply citing the resolving commit, or refuted with evidence in-thread; a no-code refutation cites the current head SHA.
- [ ] No new lint/type suppressions anywhere in the diff.
- [ ] `✅ CI Status` is green for this diff, evidenced by run URL. It includes the `policy` job when agent instructions or gate docs change. Block on a failing CodeQL, Socket, GitGuardian, or DeepSource check when it ran. For a pull targeting `main`, CodeQL must be successful; on code changes unit tests and both Chromium E2E shards remain part of `✅ CI Status`. Signatures and privacy gates stay enabled.
- [ ] `CHANGELOG.md` `[Unreleased]` updated.

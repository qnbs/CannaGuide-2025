# PR Review Correction Loop — Runbook

Standing procedure for every pull request in this repository. It applies to **all** reviewers — CodeRabbit, DeepSource, Socket Security, GitGuardian, CodeQL, and humans — and it runs **proactively**: nobody has to ask for it.

The loop is not "read the comments and reply". It ends when two of CodeRabbit, CodeAnt, and Codex have covered the **current head**, that coverage left no undispositioned finding, and **zero unresolved threads** remain from any reviewer that attached a finding. A reviewer that is expired, skipped, or silent does not add a thread or a block once those two are covered. A false positive that is refuted with evidence and resolved, with no code change, is dispositioned and does not require another fresh review. Do not request that full review after every intermediate fix. Section 5 says when one is due.

---

## 0. Reviewers active on this repo

| Reviewer                                                              | Surface                                                                                                       | Where findings appear                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **CodeRabbit** (`coderabbitai[bot]`)                                  | correctness, security, style; posts **outside-diff-range** comments that reference code your PR did not touch | inline review threads + one summary issue-comment |
| **CodeAnt** (`codeant-ai[bot]`)                                       | correctness and maintainability                                                                               | inline review threads                             |
| **Codex** (`chatgpt-codex-connector[bot]`)                            | correctness                                                                                                   | review on the pull                                |
| **DeepSource**                                                        | JS/TS, Docker, Go, Rust, CSS analyzers; grades the PR                                                         | check run + issue-comment                         |
| **Socket Security**                                                   | dependency supply-chain alerts                                                                                | check run + PR alerts comment                     |
| **GitGuardian**                                                       | secret scanning                                                                                               | check run                                         |
| **CodeQL** (`Analyze (actions\|javascript-typescript\|python\|rust)`) | static analysis, incl. **workflow files**                                                                     | check runs                                        |
| **Vercel / Cloudflare**                                               | preview deploys                                                                                               | check runs                                        |

`gh pr checks <N>` does **not** show inline review threads. You must query them (step 2).

---

## 1. Before pushing: keep the PR reviewable

- **Under ~100 changed files.** Review bots silently skip inline comments on larger PRs, so the loop never starts. Count this pull against its remote base, not a stale local `main`:

    ```bash
    # Stacked pull: this pull, counted against its parent.
    git rev-list --count "$(git merge-base origin/<parent> HEAD)"..HEAD
    git diff --name-only "$(git merge-base origin/<parent> HEAD)"...HEAD | wc -l
    # Against origin/main. For a stacked pull this is the whole stack.
    git rev-list --count "$(git merge-base origin/main HEAD)"..HEAD
    git diff --name-only "$(git merge-base origin/main HEAD)"...HEAD | wc -l
    ```

    The parent count is this pull. The `origin/main` count is the whole stack. Warn when either count crosses the budget. A pull that is not stacked uses only the `origin/main` pair.

- **Commit and file budget.** Warn around 8 commits or 50 files. Stop adding new scope around 12 commits or 75 files. Open a successor before 15 commits or about 100 files. Pull request #757 is a recorded exception: 26 commits and 89 files at `6b57be331c9841545c5de2a0dfcbfe9d1e77552b`. Do not rewrite that history to look smaller.
- i18n fans out hard (5 locales × N namespace files). A single copy change can cross the limit — split into stacked PRs (PR2's base = PR1's branch; GitHub retargets it automatically when PR1 merges).
- One concern per PR. A mixed PR gets mixed findings and cannot be reverted cleanly.

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

## 5. One fresh review of a stable head

Do not request a full bot review after every intermediate fix.

1. Let the reviewers that start on their own finish on one stable head. Do not push while that head is still being reviewed or tested.
2. Collect every finding on that head, including nitpicks and outside-diff-range comments. Group them by root cause.
3. Ship one fail-before / green-after fix for that group, in one signed commit. Do not cascade a push per comment.
4. Request one fresh review of that final head:

    ```bash
    gh pr comment <N> --body "@coderabbitai full review"
    ```

5. Another full review only when the code changes again. A reply, a resolved thread, or a note that does not change the reviewed code does not need a new full review.

`REVIEW_UNAVAILABLE` means a reviewer is skipped, paused, rate limited, quota skipped, on an expired trial, or a full-review request never attaches a review object to the current head. It is not a green check. It is not, by itself, a merge block.

CodeRabbit, CodeAnt, and Codex are the major reviewers. A review counts only when its `commit_id` is the current head, its author is `coderabbitai[bot]`, `codeant-ai[bot]`, or `chatgpt-codex-connector[bot]`, and its state is not `DISMISSED`. Count each login once, keeping that login's newest review. `unique_by` would keep the oldest. `gh api --paginate` cannot combine `--slurp` with `--jq`, so slurp the pages with `jq -s`:

```bash
gh api repos/qnbs/CannaGuide-2025/pulls/<N>/reviews --paginate \
  | jq -s '[.[][] | select(.commit_id=="<HEAD>" and (.user.login|IN("coderabbitai[bot]","codeant-ai[bot]","chatgpt-codex-connector[bot]")) and .state!="DISMISSED")] | group_by(.user.login) | map(last) | .[] | {user:.user.login, state}'
```

Codex does not always attach a review to a new head. When `chatgpt-codex-connector[bot]` has no non-dismissed review on that head, comment `@codex review` once on the pull. Two other reviewers do not replace that request. A `DISMISSED` review does not count. Do not send a second `@codex review` while that request has not attached a review on that head. A review of an older commit does not cover the head. That comment is not a CodeRabbit full review.

When two of those three are reviewing that head, or have attached such a review, do not block on another reviewer that is expired, skipped, paused, rate limited, quota skipped, or silent, and do not send another full-review request for that gap. Do not send a second full-review request while the same request is still unanswered and that check stays paused or rate limited. Do not merge a head that none of the three has reviewed.

When a major review returns an actionable finding, go back to **Section 2**, group the findings, and ship one fix. That code change is what makes the next full review due. A finding that is refuted with evidence and resolved, with no code change, is dispositioned. It does not demand another full review. The loop ends when, on the current head, two of the three have covered it, every finding any reviewer attached is fixed or refuted, and 0 threads are unresolved. A finding that lives only in a paginated issue comment counts the same way: read Section 2 before calling the head complete. A notice that a trial ended, or that a reviewer has no comments, is not a thread and not a new finding.

---

## 6. Drive CI green — and read the right signal

```bash
until [ "$(gh pr checks <N> --json state --jq '[.[] | select(.state=="PENDING")] | length')" = "0" ]; do sleep 30; done
gh pr checks <N> | grep -viE '\tpass\t|skipping'
gh run view --job <JOB_ID> --log-failed | tail -40
```

Two traps this repo has already hit:

- **A red `main` can hide.** A historical Graphify updater pushed with `[skip ci]`, allowing a broken artifact to reach `main` and fail every PR while `main` showed no failing run. The updater now publishes a validated, complete review artifact and never writes to the repository; a human promotes it through a PR. **If a failure is unrelated to your diff, still check `main` before assuming it is yours:** `gh run list --workflow=ci.yml --branch=main --limit 5`.
- **What `✅ CI Status` requires depends on the diff.** On a code change it requires `build`, `test`, `verify`, `security` and `e2e` (Chromium, blocking); `rust` when `apps/desktop/**` changed and `policy` when agent instructions or gate docs changed. On a docs-only change those code jobs are skipped. Cross-browser E2E and the advisory job never block -- a green check mark is not evidence that they passed.

Every "green" claim in a PR description cites a **CI run URL + artifact**, never a local run.

---

## 7. Definition of done (binary)

- [ ] 0 unresolved review threads from reviewers that attached findings (verified by the Section 2 thread query, not by eyeballing the UI), and every finding in the paginated issue comments is fixed or refuted. A review that only says the trial ended, or that never comments, adds no thread to clear.
- [ ] Two of CodeRabbit, CodeAnt, and Codex have covered the current head, and that coverage left no undispositioned finding. A false positive that is refuted with evidence and resolved, with no code change, counts as dispositioned and does not require another full review.
- [ ] `REVIEW_UNAVAILABLE` (paused, skipped, rate limited, quota, expired trial, or a request with no review object) is not a green check and is not a merge block once those two major reviewers have covered the head. Do not merge a head that none of the three has reviewed.
- [ ] Every finding is either fixed at the root, with the reply citing the resolving commit, or refuted with evidence in-thread. A refutation that changes no code cites the current head SHA.
- [ ] No new lint/type suppressions anywhere in the diff.
- [ ] `✅ CI Status` is green for this diff, evidenced by run URL. That is the ruleset check. When `AGENTS.md`, `CLAUDE.md`, or `docs/PR-REVIEW-LOOP.md` change, that check includes the `policy` job. Still block the merge when CodeQL, Socket, GitGuardian, or DeepSource fails on a head where that check ran. When the pull targets `main`, CodeQL must be success for that head. A stacked pull does not invent a CodeQL result; that obligation applies when the pull targets `main`. On a code change, unit tests and both Chromium E2E shards stay part of `✅ CI Status`. Signatures and privacy gates stay. Do not disable an analyzer or drop a test to finish the pull.
- [ ] `CHANGELOG.md` `[Unreleased]` updated.

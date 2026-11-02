# PR Review Correction Loop — Runbook

Standing procedure for every pull request in this repository. It applies to **all** reviewers — CodeRabbit, DeepSource, Socket Security, GitGuardian, CodeQL, and humans — and it runs **proactively**: nobody has to ask for it.

The loop is not "read the comments and reply". It ends only when a **fresh** review of the **current head** produces **zero new comments** _and_ **zero unresolved threads**. Do not request that full review after every intermediate fix. Section 5 says when one is due.

---

## 0. Reviewers active on this repo

| Reviewer                                                              | Surface                                                                                                       | Where findings appear                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **CodeRabbit**                                                        | correctness, security, style; posts **outside-diff-range** comments that reference code your PR did not touch | inline review threads + one summary issue-comment |
| **DeepSource**                                                        | JS/TS, Docker, Go, Rust, CSS analyzers; grades the PR                                                         | check run + issue-comment                         |
| **Socket Security**                                                   | dependency supply-chain alerts                                                                                | check run + PR alerts comment                     |
| **GitGuardian**                                                       | secret scanning                                                                                               | check run                                         |
| **CodeQL** (`Analyze (actions\|javascript-typescript\|python\|rust)`) | static analysis, incl. **workflow files**                                                                     | check runs                                        |
| **Vercel / Cloudflare**                                               | preview deploys                                                                                               | check runs                                        |

`gh pr checks <N>` does **not** show inline review threads. You must query them (step 2).

---

## 1. Before pushing: keep the PR reviewable

- **Under ~100 changed files.** Review bots silently skip inline comments on larger PRs, so the loop never starts. Check with `git diff --name-only "$(git merge-base origin/main HEAD)"...HEAD | wc -l`.
- **Commit and file budget.** Count commits and the file command above against the merge-base with `origin/main`. Warn around 8 commits or 50 files. Stop adding new scope around 12 commits or 75 files. Open a successor before 15 commits or about 100 files. Pull request #757 is a recorded exception: 26 commits and 89 files at `6b57be331c9841545c5de2a0dfcbfe9d1e77552b`. Do not rewrite that history to look smaller.
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

Issue-comments (the bots' summary posts) paginate separately — query `comments(first:100, after:$endCursor)` the same way when you need them.

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

Cite the resolving commit SHA in every reply. A resolved thread with no explanation is not resolved, it is buried.

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

An unavailable reviewer is `REVIEW_UNAVAILABLE`. It stays blocking. It is not a green check and not a timeout waiver. A skipped check, a paused review, a quota skip, an expired trial, or a full-review request that never attaches a review object to the current head is `REVIEW_UNAVAILABLE`. Do not merge that head. Do not send a second full-review request while the same request is still unanswered and the check stays paused.

Go back to **step 2** only when that fresh review returns new findings. The loop ends when a fresh review of the current head yields **0 new comments** and **0 unresolved threads**. Never declare a PR done while comments are still arriving.

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

- [ ] 0 unresolved review threads (verified by the step-2 query, not by eyeballing the UI).
- [ ] A fresh review of the current head produced 0 new comments.
- [ ] That review is attached to the current head. `REVIEW_UNAVAILABLE` (paused, skipped, quota, expired trial, or a request with no review object) blocks the merge. It is not a green check and not a timeout waiver.
- [ ] Every finding either fixed at the root or refuted with evidence, in-thread, citing a commit.
- [ ] No new lint/type suppressions anywhere in the diff.
- [ ] All required checks green, evidenced by run URL. On a code change this still includes CodeQL, Socket, GitGuardian, DeepSource, unit tests, and both Chromium E2E shards. Signatures and privacy gates stay. Do not disable an analyzer or drop a test to finish the pull.
- [ ] `CHANGELOG.md` `[Unreleased]` updated.

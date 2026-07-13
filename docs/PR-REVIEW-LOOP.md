# PR Review Correction Loop — Runbook

Standing procedure for every pull request in this repository. It applies to **all** reviewers — CodeRabbit, DeepSource, Socket Security, GitGuardian, CodeQL, and humans — and it runs **proactively**: nobody has to ask for it.

The loop is not "read the comments and reply". It ends only when a **fresh** review produces **zero new comments** *and* **zero unresolved threads**.

---

## 0. Reviewers active on this repo

| Reviewer | Surface | Where findings appear |
|---|---|---|
| **CodeRabbit** | correctness, security, style; posts **outside-diff-range** comments that reference code your PR did not touch | inline review threads + one summary issue-comment |
| **DeepSource** | JS/TS, Docker, Go, Rust, CSS analyzers; grades the PR | check run + issue-comment |
| **Socket Security** | dependency supply-chain alerts | check run + PR alerts comment |
| **GitGuardian** | secret scanning | check run |
| **CodeQL** (`Analyze (actions|javascript-typescript|python|rust)`) | static analysis, incl. **workflow files** | check runs |
| **Vercel / Cloudflare** | preview deploys | check runs |

`gh pr checks <N>` does **not** show inline review threads. You must query them (step 2).

---

## 1. Before pushing: keep the PR reviewable

- **Under ~100 changed files.** Review bots silently skip inline comments on larger PRs, so the loop never starts. Check with `git diff --name-only main...HEAD | wc -l`.
- i18n fans out hard (5 locales × N namespace files). A single copy change can cross the limit — split into stacked PRs (PR2's base = PR1's branch; GitHub retargets it automatically when PR1 merges).
- One concern per PR. A mixed PR gets mixed findings and cannot be reverted cleanly.

---

## 2. Fetch every open thread (including outside-diff-range)

```bash
gh api graphql -f query='
query($owner:String!,$repo:String!,$num:Int!){
 repository(owner:$owner,name:$repo){ pullRequest(number:$num){
  reviewThreads(first:100){ nodes{
    id isResolved isOutdated path line
    comments(first:10){ nodes{ id author{login} body } } } }
  comments(first:50){ nodes{ author{login} body } }
 }}}' -F owner=qnbs -F repo=CannaGuide-2025 -F num=<N> \
 --jq '.data.repository.pullRequest.reviewThreads.nodes[]
   | select(.isResolved | not)
   | "THREAD=\(.id)\n\(.path):\(.line)\n\(.comments.nodes[0].author.login): \(.comments.nodes[0].body)\n---"'
```

`isResolved == false` is the only work-list that counts. `isOutdated` threads still count — the anchor moved, the finding may not have.

---

## 3. Triage each thread — validate before you trust it

Review-bot anchors go stale, and bots are wrong often enough that "the bot said so" is never a reason. For each finding, decide **against the current code**:

1. **Still valid → fix at the root.** Not the symptom the bot pointed at — the cause. Ship everything that belongs to the fix: code **+ test + i18n (all 5 locales) + docs + CHANGELOG**.
2. **Already fixed** by a later commit → reply with the commit SHA, resolve.
3. **False positive** → reply with the *evidence* (the code path, the config, the reason the bot's assumption doesn't hold). Never "won't fix" with no argument.

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

## 5. Re-trigger — the loop does not stop after one pass

A fresh review routinely raises **new** findings caused by your own fixes (a "wave"). After each push:

```bash
gh pr comment <N> --body "@coderabbitai full review"
```

Then go back to **step 2**. Repeat until **both**:

- a fresh review yields **0 new comments**, and
- **0 threads** are unresolved.

Never declare a PR done while comments are still arriving.

---

## 6. Drive CI green — and read the right signal

```bash
until [ "$(gh pr checks <N> --json state --jq '[.[] | select(.state=="PENDING")] | length')" = "0" ]; do sleep 30; done
gh pr checks <N> | grep -viE '\tpass\t|skipping'
gh run view --job <JOB_ID> --log-failed | tail -40
```

Two traps this repo has already hit:

- **A red `main` can hide.** `graphify-update.yml` pushes to `main` with `[skip ci]`, and `ci.yml` has `paths-ignore: graphify-out/**` — so a broken artifact reached `main` and failed **every** PR's `quality` job while `main` itself showed no failing run for twelve days. **If a failure is unrelated to your diff, check `main` before assuming it is yours:** `gh run list --workflow=ci.yml --branch=main --limit 5`.
- **`✅ CI Status` only requires `quality` + `security`.** E2E, cross-browser, and the advisory job do **not** block. A green check mark does not mean the E2E suite passed.

Every "green" claim in a PR description cites a **CI run URL + artifact**, never a local run.

---

## 7. Definition of done (binary)

- [ ] 0 unresolved review threads (verified by the step-2 query, not by eyeballing the UI).
- [ ] A fresh review pass produced 0 new comments.
- [ ] Every finding either fixed at the root or refuted with evidence, in-thread, citing a commit.
- [ ] No new lint/type suppressions anywhere in the diff.
- [ ] All required checks green, evidenced by run URL.
- [ ] `CHANGELOG.md` `[Unreleased]` updated.

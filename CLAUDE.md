# CannaGuide -- working rules

## Verify commands (BINDING, low-end hardware: dual-core / ~4 GB)

**Never** run a bare `turbo run <task>`, and **never** run `pnpm typecheck` / `test` /
`lint` without `--filter`. A full `turbo run typecheck` builds five tasks and takes **6-9
minutes** with a real OOM risk. Verify through:

```bash
pnpm verify        # scoped typecheck (default)
pnpm verify:test   # scoped test:run
pnpm verify:lint   # scoped lint
```

These derive the affected workspaces from the git diff against the merge-base and run with
`--concurrency=1`. Calling `turbo run` directly, or an unfiltered pnpm task, is a rule
violation and must be caught **before** it is executed.

**What a typecheck actually costs here** (measured, `apps/web`, TS 6.0.3 -- see
`docs/toolchain-update.md` for the method):

| run                                 | wall time | max RSS     |
| ----------------------------------- | --------- | ----------- |
| `tsc --noEmit`, no `incremental`    | 321-341 s | **1.54 GB** |
| `tsc --noEmit`, `incremental`, warm | **91 s**  | **0.85 GB** |

`apps/web` now sets `incremental` (it never did; `packages/ui` and `ai-core` always had a
cache). The memory drop is the point: at a 1.5 GB peak with ~1.5 GB free, every typecheck was
an OOM candidate. Do **not** claim "~40 s" -- that figure was in this file, was never
reproducible, and is what made a slow hook look affordable on paper.

Work each PR on a **named local branch** (`git switch -c ...`), never in a detached HEAD --
otherwise every switch invalidates the turbo hash and the cache never hits.

## The three traps that have actually bitten us

These look like the safe command. They are not. Each one has cost a session.

1. **`--` before a vitest spec swallows the filter.**
   `pnpm --filter @cannaguide/web test:run -- Foo` becomes `vitest run -- Foo`, and vitest
   runs the **whole suite** (>6 min, 635 MB RSS, straight into the OOM). Omit the `--`:

    ```bash
    pnpm --filter @cannaguide/web test:run Foo    # 1 file, ~20 s
    ```

    A run is only scoped if the summary says `Test Files 1 passed (1)`.

2. **A bare `pnpm install` re-resolves carets and trips `minimumReleaseAge`.**
   CI then fails in the install step on any package published less than 24 h ago. Install
   only when `pnpm-lock.yaml` actually changed, and use `--frozen-lockfile`.

3. **`prettier` over `git diff --name-only` misses new files.**
   Untracked files are not in the diff, so a brand-new doc or component sails past the
   formatter and fails the docs gate in CI. Use `git status --porcelain` when formatting.

## Do not reach for tsgo

Measured 2026-07-14 on `apps/web`: `tsgo` (`@typescript/native-preview`) is **1.5x faster
than tsc but uses more memory** (1.72 GB vs 1.56 GB), and it reports a `TS2430` that tsc does
not. RAM is our constraint, not CPU, so it makes the problem worse, and a gate that goes red
on something nobody can fix is a gate that gets switched off. The scoped incremental
typecheck (~40 s) beats both. See `docs/toolchain-update.md`.

## Git hooks: run them, do not bypass them

The hooks are now cheap enough to run, so `--no-verify` is **banned** -- for commit and for
push. It was the bypass that let a formatting failure and a file-budget failure reach CI.

- `pre-commit`: commit-identity check + `lint-staged` (seconds).
- `pre-push`: scoped typecheck + `lint-scopes --changed` + file budget.

Both slow steps used to ignore the diff: typecheck ran a bare `turbo run` (6-9 min), and
`lint-scopes` linted every file under the strict scopes -- **measured at 7 min 34 s for a
branch that touched only docs**. Both are now scoped to what the branch actually changed;
a push that touches nothing in a strict scope skips that step in 0.2 s. CI still runs the
full matrix and the full strict-scope lint, so nothing is lost.

If you ever must bypass in an emergency, run **exactly what the hook runs** -- the scoped
commands, not the expensive ones this repo exists to avoid -- and say so in the commit body:

```bash
node ./scripts/scoped-verify.mjs typecheck     # every touched workspace, not just web
node ./scripts/lint-scopes.mjs --changed
pnpm run check:file-budget
npx prettier --check $(git status --porcelain | awk '{print $2}') --ignore-unknown
pnpm run check:i18n
```

## Pull requests

- **Keep every PR under ~100 changed files.** CodeRabbit and similar bots silently skip
  inline review on larger PRs, so the review loop never starts. Count against the
  merge-base with the **remote** branch -- a local `main` can be stale or divergent, which
  is the same trap the verify scripts already avoid:

    ```bash
    git diff --name-only "$(git merge-base origin/main HEAD)"...HEAD | wc -l
    ```

- **Work the review loop until it is quiescent:** fetch unresolved threads, fix or refute
  each with evidence, reply citing the commit, resolve, push, re-trigger the bot. Repeat
  until a fresh review yields **0 new comments and 0 unresolved threads**. A fix routinely
  raises the next wave -- treat nitpicks and "outside diff range" comments as in scope.
- **Never silence a finding with a new `biome-ignore` / `eslint-disable`.** Refactor so the
  rule passes honestly; the suppression ratchet gates CI.

## Language

Everything that lands in this repo or on GitHub is **English**: commit messages, PR titles
and bodies, review replies, code comments, script output, docs. Conversation with the
maintainer may be in German; that does not carry over into the repo.

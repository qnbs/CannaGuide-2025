# CannaGuide — working rules

## Verify commands (BINDING · low-end hardware, dual-core / ~4 GB)

**Never** run a bare `turbo run <task>`, and **never** run `pnpm typecheck` / `test` /
`lint` without `--filter`. Measured on this machine: global run **6–9 min**, scoped run
**~40 s**. Verify exclusively through:

```bash
pnpm verify        # scoped typecheck (default)
pnpm verify:test   # scoped test:run
pnpm verify:lint   # scoped lint
```

These derive the affected workspaces from the git diff against the merge-base and run with
`--concurrency=1`. Calling `turbo run` directly, or an unfiltered pnpm task, is a rule
violation and must be caught **before** it is executed.

Work each PR on a **named local branch** (`git switch -c …`), never in a detached HEAD —
otherwise every switch invalidates the turbo hash and the cache never hits.

## Language

Everything that lands in this repo or on GitHub is **English**: commit messages, PR titles
and bodies, review replies, code comments, script output, docs. Conversation with the
maintainer may be in German; that does not carry over into the repo.

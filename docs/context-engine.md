# Context engine — two layers for fast, correct orientation

CannaGuide 2025 is a large codebase on a low-end box. To place a change correctly without
paging huge amounts of source into a session, use a **two-layer context engine**: a slow-moving
**macro** map (Graphify, committed) and a fast **micro** map (Codegraph, local). Read the macro
first for structure, drop to the micro for the exact modules, then open the specific files.

## The two layers

| Layer                                                                            | Tool                                | Output                                                                                                             | Committed?                                 | Refresh                                     |
| -------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------- |
| **Macro** — god nodes, communities, cross-module structure                       | Graphify                            | `graphify-out/GRAPH_REPORT.md`, `graph.json`, `manifest.json`                                                      | **Yes** (team policy — shared via git)     | `graphify update .` (AST-only, no API cost) |
| **Micro** — repo-wide import graph, module index, redux-slice map for `apps/web` | Codegraph (`scripts/codegraph.mjs`) | `.ai-context/codegraph/` (`import-graph.json`, `module-index.md`, `redux-slice-map.md`, `stats.json`, `README.md`) | **No** (git-ignored — regenerated locally) | `node ./scripts/codegraph.mjs`              |

Why the split: the macro view changes rarely and is worth sharing, so it is committed (matching
the Graphify team policy in the home `CLAUDE.md`). The micro view changes on every edit, so
committing it would churn diffs and invite a needless drift gate — it stays local and is cheap
to regenerate.

Codegraph is **not** a CI gate and enforces nothing. It is AST-only (parses with
`@typescript-eslint/parser`, no type-checking, one file at a time), the same OOM-safe posture as
`scripts/check-a11y-ratchet.mjs`, so it is safe to run on the dual-core / ~4 GB machine and never
triggers a `tsc` / `turbo` build. It also does **not** replace `scripts/generate-service-map.mjs`
— that one is a narrow, AI-services-only Mermaid diagram plus the acyclicity CI gate, and is
untouched.

## Commands

```bash
node ./scripts/codegraph.mjs                        # regenerate the micro layer (.ai-context/codegraph/)
node ./scripts/codegraph.mjs --json                 # + print a summary to stdout
node ./scripts/codegraph.mjs --check                # regenerate and assert the outputs exist (exit 1 on failure)
graphify update . && node ./scripts/codegraph.mjs   # macro (graphify) + micro in one step
graphify update .                                   # macro only (may produce committable graphify-out/ changes)
```

The same commands are exposed as VS Code tasks in `.vscode/tasks.json` (`Context: …`). Codegraph
is intentionally **not** a root `package.json` script: root `package.json` is a shared input to
`scripts/scoped-verify.mjs`, so adding a script there would widen the pre-push typecheck to **every**
workspace (a cold `apps/web` typecheck is ~1.5 GB — the full run this repo exists to avoid). Invoke
it directly with `node` instead.

## Loading order for a session

1. **Macro** — read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure before
   any broad "how does X relate to Y" question. For cross-module traversal prefer
   `graphify query "<question>"` / `graphify path "<A>" "<B>"` / `graphify explain "<concept>"`
   over grep (they walk extracted + inferred edges).
2. **Micro** — for a concrete change, open `.ai-context/codegraph/module-index.md` (modules by
   area, highest fan-in first — the load-bearing files to read first), `import-graph.json` (exact
   `imports` / `importedBy` for a module), and `redux-slice-map.md` (the persisted slices). If the
   directory is stale or absent, run `node ./scripts/codegraph.mjs` first (it is git-ignored).
3. **Targeted reads** — then open the specific files the two maps pointed you to.

## Piping errors back for a fix — scoped only

You can pipe a failing run's output straight back into Claude Code, **but keep it scoped** — an
unfiltered suite is a >6-minute, OOM-prone run (see the "three traps" in `CLAUDE.md`):

```bash
pnpm verify 2>&1 | claude                                  # scoped typecheck of changed workspaces
pnpm --filter @cannaguide/web test:run <NamePart> 2>&1 | claude   # ONE spec — note: no `--` before the name
```

Never pipe a bare `turbo run`, an unfiltered `pnpm typecheck` / `test` / `lint`, or `pnpm run
build`. The `--` trap: `test:run -- <spec>` drops the filter and runs the whole suite; a scoped
run reports `Test Files 1 passed (1)`.

## Related

- `graphify-out/GRAPH_REPORT.md` — the macro report.
- `docs/ARCHITECTURE.md` — deep architecture.
- `CLAUDE.md` → _Architecture at a glance → Context loading order_ — the short in-repo pointer.

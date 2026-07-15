# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

CannaGuide 2025 is an offline-first React 19 + Vite PWA in a pnpm/Turbo monorepo. There is
**no backend** -- all state, AI inference, and persistence run client-side in the browser. The
only runnable app is `@cannaguide/web` (`apps/web/`); `@cannaguide/desktop` is a Tauri shell
that needs the Rust toolchain and is excluded from the default build. For the full feature map
see `README.md` (note: some of its metric badges lag the codebase -- prefer counting from the
tree), for the Node-24 environment setup and an extended command table see `AGENTS.md`, and for
deep architecture see `docs/ARCHITECTURE.md`.
**[Architecture at a glance](#architecture-at-a-glance)** at the end of this file orients a
fresh session across the parts that span multiple files.

The rules below are **binding**. They exist because this repo is developed on a dual-core /
~4 GB machine where memory -- not wall time -- is what OOM-kills the editor. Read them before
running any build, test, typecheck, or lint.

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

Measured 2026-07-14 on `apps/web`: `tsgo` (`@typescript/native-preview`) runs in **171 s at a
1.72 GB peak** -- **slower and heavier** than the incremental `tsc` we actually run (91 s /
0.85 GB), so it loses on both axes. It also reports a `TS2430` that tsc does not, and a gate
that goes red on something nobody can fix is a gate that gets switched off. See
`docs/toolchain-update.md` for the method.

## Git hooks: run them, do not bypass them

The hooks are now cheap enough to run, so `--no-verify` is **banned** -- for commit and for
push. It was the bypass that let a formatting failure and a file-budget failure reach CI.

- `pre-commit`: commit-identity check + `lint-staged` (seconds).
- `pre-push`: scoped typecheck + `lint-scopes --changed` + file budget + `check:doc-metrics`
  (README badges vs source).

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
node ./scripts/check-doc-metrics.mjs
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
- **`main` is guarded by a GitHub _ruleset_ (not classic branch protection),** so
  `gh api .../branches/main/protection` 404s -- read it via `gh api .../rules/branches/main`.
  It requires **signed commits**, **squash-only** merges, **thread resolution**, and the
  `✅ CI Status` check. A PR with **any unsigned commit** is `mergeStateStatus: BLOCKED` even
  when green (this stranded a third-party PR whose original commits were unsigned; my own
  SSH-signed commits merged fine). Fix by re-committing signed, or the owner admin-merges
  (`gh pr merge <n> --squash --admin`) -- GitHub signs the squash result either way.

## Language

Everything that lands in this repo or on GitHub is **English**: commit messages, PR titles
and bodies, review replies, code comments, script output, docs. Conversation with the
maintainer may be in German; that does not carry over into the repo.

# Architecture at a glance

Big-picture structure that spans multiple files -- the parts you cannot infer from a single
directory listing. Feature-level detail is in `README.md`; this is the map a fresh session
needs to place a change correctly.

## Context loading order

Two maps orient a session before you open individual files (full detail:
`docs/context-engine.md`):

1. **Macro** -- read `graphify-out/GRAPH_REPORT.md` (committed) for god nodes and community
   structure before any broad "how does X relate to Y" question; prefer `graphify query` /
   `graphify path` / `graphify explain` over grep for cross-module traversal.
2. **Micro** -- for a concrete change, consult `.ai-context/codegraph/` (`module-index.md` by
   area with fan-in/fan-out, `import-graph.json`, `redux-slice-map.md`). It is **git-ignored**;
   regenerate with `node ./scripts/codegraph.mjs` if stale (AST-only, OOM-safe -- no `tsc`/`turbo`
   build; it is deliberately _not_ a root `package.json` script, so a push never widens the scoped
   typecheck). `graphify update . && node ./scripts/codegraph.mjs` refreshes both layers.
3. **Targeted reads** -- then open the specific files the maps pointed to.

## Monorepo layout

- `apps/web/` -- the PWA (`@cannaguide/web`). Feature code lives at the workspace root, **not**
  under `src/`: `components/` (`common/ icons/ navigation/ ui/ views/`), `stores/`,
  `services/`, `hooks/`, `workers/`, `data/`, `locales/`, `utils/`, `useCases/`.
- `packages/ai-core/` -- shared AI types and provider configs. Heavy ML deps are
  `optionalDependencies` here so the web app installs without the ML stack.
- `packages/ui/` -- design tokens (9 themes) + the Tailwind preset.
- `apps/desktop/` -- Tauri v2 wrapper (needs Rust; not in the default build).
- `scripts/` -- the Node/`.mjs` tooling the gates and hooks call (`scoped-verify.mjs`,
  `lint-scopes.mjs`, `typecheck-filter.mjs`, `check-file-budget.mjs`, the strain pipeline).

## State: two stores joined by one bridge

- **Redux Toolkit** (`stores/store.ts`, `stores/slices/*`) owns the 19 **persisted** domain
  slices (simulation, grows, strains, breeding, genealogy, metrics, diagnosis, hydro, ...),
  saved to IndexedDB via `stores/indexedDBStorage.ts` (debounced, force-saved on
  `visibilitychange`).
- **Zustand** (`stores/use*Store.ts`, `sensorStore.ts`) owns the 9 **transient** UI stores
  (UI, voice, TTS, filters, IoT, alerts, calculator session) -- never persisted.
- `services/uiStateBridge.ts` is the sanctioned seam between them (`getReduxSnapshot`,
  `subscribeToRedux`, `dispatchToRedux`). Cross the two systems through it, not directly.
  IndexedDB-first: `localStorage` is only for small non-secret flags.

## AI: one facade, cloud and local behind it

- **Cloud (BYOK, 4 providers).** Every call funnels `services/aiFacade.ts` ->
  `services/aiService.ts` -> `services/aiProviderService.ts` (Gemini / OpenAI / Claude /
  Grok), rate-limited, with Zod-validated structured output. Orchestration and prompt safety
  live in `services/ai/` (`aiOrchestrator.ts`, `safetyPipeline.ts`).
- **Local (offline).** `services/local-ai/` runs a 3-layer fallback (WebLLM ->
  Transformers.js -> heuristics), with inference cached in IndexedDB.
- Any UI that renders AI output must use `components/common/AiDisclaimer.tsx` (`medical` prop
  for health/diagnosis surfaces) -- do not inline a bespoke disclaimer string.

## Workers: everything heavy goes through the WorkerBus

`apps/web/workers/` holds 10 Web Workers (VPD simulation, genealogy, scenario, inference,
vision, terpene, hydro forecast, image gen, calculation, voice), plus the root
`simulation.worker.ts`. They are **not** invoked directly -- `services/worker-bus/` is a
promise-based dispatcher with a priority queue, backpressure, retry, `AbortController`, and
Transferable zero-copy. See `docs/worker-bus.md`.

## Persistence: dual IndexedDB, offline-first

- `CannaGuideStateDB` -- Redux state (via the storage adapter above).
- `CannaGuideDB` -- domain data: strains, images, full-text search index (`services/db/*`).
- Prefer IndexedDB; `localStorage` is only for small non-secret flags (the one sanctioned
  exception is `useIotStore`'s MQTT connection config). Optional CRDT cloud sync (Yjs +
  encrypted GitHub Gists) runs through `services/crdtSyncBridge.ts`.

## i18n: five locales, no hardcoded strings

`i18n.ts` + `locales/{en,de,es,fr,nl}/`, one file per namespace (~13 per locale). User-visible
text goes through `t('...')` in React or `getT()` outside it -- never a literal. `check:i18n` /
`check:i18n-usage` / `lint:i18n` gate locale parity and are part of "done" for any new text
surface. (`fallbackLng: 'en'` means a missing key renders English, not a raw key -- so a
gap can pass a smoke test while es/fr/nl silently fall back; trust the gates, not the screen.)

## Drift gates: docs-truth and a11y ratchet

Two gates fail on _inconsistency_, not on broken code, so they surprise you if you don't expect
them (`docs/DEVOPS-GATES.md` is the full inventory):

- **`check:doc-metrics`** (in the `quality` CI gate _and_ pre-push): every README metric badge
  -- release version, TypeScript, Vite, coverage, and the **CI-workflow count** -- must match
  source (`package.json`, `apps/web/vite.config.ts`, the `.github/workflows/*.yml` count). So
  **adding a workflow means bumping the count in ~6 README spots** (EN + DE badges, header,
  both stat lines, the table) or CI goes red on a change that looks unrelated.
- **`check:a11y-ratchet`** (CI `quality` only -- runs its own AST-only ESLint, so it is light):
  jsx-a11y warnings may not exceed `.a11y-baseline.json` (currently 83). Fixing warnings lets
  you _lower_ it with `node scripts/check-a11y-ratchet.mjs --update` in the same PR; never raise
  it. Rules stay `warn` -- this is a count ceiling, not a flip-to-error.

## Everyday commands not covered above

Typecheck / test / lint are governed by the **binding** verify section at the top of this file
-- use `pnpm verify*`, never the bare or `turbo run` forms. The rest:

| Task                     | Command                                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev server (web only)    | `cd apps/web && pnpm run dev` -- root `pnpm run dev` runs Turbo across all packages incl. desktop and fails without Rust. Vite `base` is `/CannaGuide-2025/`, port 5173 |
| Production build         | `pnpm run build` (excludes desktop)                                                                                                                                     |
| One test file (scoped)   | `pnpm --filter @cannaguide/web test:run SPEC_NAME` -- no `--`; a scoped run reports `Test Files 1 passed (1)` (trap #1)                                                 |
| i18n integrity           | `pnpm run check:i18n` / `check:i18n-usage` / `lint:i18n`                                                                                                                |
| File-size budget         | `pnpm run check:file-budget` (new/changed files target 200-700 LOC)                                                                                                     |
| Strain data pipeline     | `pnpm run strains:sync` (extract JSON + regenerate files)                                                                                                               |
| Full local pre-push gate | `pnpm run gate:push` (heavy; CI runs the full matrix regardless)                                                                                                        |

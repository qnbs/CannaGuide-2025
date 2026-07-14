# AGENTS.md

## Cursor Cloud specific instructions

### Product

CannaGuide 2025 is an offline-first React/Vite PWA (pnpm monorepo). The primary runnable app is `@cannaguide/web`. There is no backend server; persistence is IndexedDB in the browser.

### Node.js version (required)

The repo requires **Node.js ≥24** (`package.json` `engines`). The VM ships `/exec-daemon/node` at **v22**, which takes precedence over `nvm` unless you fix `PATH`.

In every shell session, before `pnpm` commands:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/v24.16.0/bin:$PATH"   # or: nvm use 24 && export PATH="$(dirname "$(which node)"):$PATH"
node -v   # must show v24.x
```

`~/.bashrc` in this environment is preconfigured with the above.

### VM update script (Cursor Cloud startup)

The environment **update_script** must be a **single command** (each line runs in a separate shell, so `export` / `nvm use` do not persist across lines):

```bash
bash scripts/cursor-cloud-update.sh
```

That script installs nvm/Node 24 when needed, prepends the correct Node to `PATH` (over `/exec-daemon/node` v22), and runs `pnpm install --frozen-lockfile`.

**Cold VM first run:** If the script exits with `Node.js >= 24 required (got v22...)`, nvm may have just finished installing while `/exec-daemon/node` is still first on `PATH`—**run the script again**; the second invocation is idempotent and succeeds once Node 24 is on disk.

### Install (manual)

```bash
bash scripts/cursor-cloud-update.sh
```

Or see [README.md](README.md) for the canonical command list.

### Run the web app (dev)

`pnpm run dev` at the repo root runs **turbo** for all packages, including `@cannaguide/desktop`, which fails without the Rust/Tauri toolchain. For web-only development:

```bash
cd apps/web && pnpm run dev -- --host 0.0.0.0
```

- **URL:** `http://localhost:5173/CannaGuide-2025/` (Vite `base` is `/CannaGuide-2025/`)
- **Preview (production build):** `pnpm run build` then `pnpm run preview` → port **4173**

### Lint / test / build

| Task                 | Command                      | Notes                                                    |
| -------------------- | ---------------------------- | -------------------------------------------------------- |
| Lint (changed files) | `pnpm run lint:changed`      | No-op if nothing changed vs `origin/main`                |
| Lint (full)          | `pnpm run lint:full`         | Heavy; CI uses this                                      |
| Typecheck            | `pnpm run typecheck`         | Turbo; web uses `scripts/typecheck-filter.mjs`           |
| Unit tests           | `pnpm run test:run`          | Full suite is large (~3+ min); see React note below      |
| Coverage + gates     | `pnpm run test:coverage`     | Then `check:critical-path-coverage`, `check:file-budget` |
| Pre-push gate        | `pnpm run gate:push`         | Full local gate before push                              |
| Build                | `pnpm run build`             | Excludes desktop by default                              |
| Doc metrics          | `pnpm run docs:sync-metrics` | Sync Vitest counts in README / ARCHITECTURE              |
| Gate inventory       | `docs/DEVOPS-GATES.md`       | CI merge gate vs advisory jobs                           |

### Local verification on low-end hardware (BINDING)

The maintainer's machine is dual-core with ~4 GB RAM. Measured there, against `apps/web`:
`tsc --noEmit` takes **263 s / 1.5 GB RSS**, and an unfiltered `turbo run typecheck` builds
five tasks and takes **6-9 minutes** with a real OOM risk. The scoped path takes **~40 s**.

- **Never** run a bare `turbo run <task>`, and never run `pnpm typecheck` / `test` / `lint`
  without `--filter`. Use `pnpm verify` / `verify:test` / `verify:lint`
  (`scripts/scoped-verify.mjs`), which derive the affected workspaces from the git diff and
  run with `--concurrency=1`.
- **Do not run E2E, Playwright, Stryker or Lighthouse locally.** That is CI's job.
- **One heavy task at a time.** Check `free -m` first; below ~500 MB available, stop rather
  than run into the OOM.

#### Three traps that look like the safe command

1. **`--` before a vitest spec swallows the filter.** `test:run -- Foo` becomes
   `vitest run -- Foo`, which runs the **entire suite** (>6 min, 635 MB RSS). Omit the `--`:
   `pnpm --filter @cannaguide/web test:run Foo`. A run is only scoped if the summary reads
   `Test Files 1 passed (1)`.
2. **A bare `pnpm install` re-resolves carets and trips `minimumReleaseAge`,** failing CI in
   the install step on any package published under 24 h ago. Install only when
   `pnpm-lock.yaml` actually changed, with `--frozen-lockfile`.
3. **`prettier` over `git diff --name-only` misses untracked files,** so a brand-new file
   skips the formatter and fails the docs gate. Format from `git status --porcelain`.

#### tsgo: measured and rejected

`@typescript/native-preview` is **1.5x faster than tsc but uses more memory** (1.72 GB vs
1.56 GB) and reports a `TS2430` tsc does not. RAM is the constraint here, so it makes things
worse, and a gate that goes red on an unfixable error gets switched off. Do not adopt it.
See [`docs/toolchain-update.md`](docs/toolchain-update.md).

**React versions:** `apps/web` pins `react@^19.2.7` and `react-dom@^19.2.7` (aligned in lockfile).

**Vitest mock isolation:** Suites that mock shared modules (`@/services/sentryService`, `@/services/local-ai`, etc.) should use `vi.hoisted()` for stable mock references and `vi.resetModules()` + dynamic `import()` in `beforeEach` when the module under test binds mocks at import time. Reference implementations: `services/aiResponseValidation.test.ts`, `services/growLogRagService.test.ts`. Residual sporadic full-suite noise in unrelated modules may still occur — run affected files in isolation to confirm regressions.

### Optional services

- **IoT mock:** `node docker/iot-mocks/src/server.mjs` (port **3001**)
- **Desktop:** `pnpm run dev:desktop` needs Rust + Tauri v2
- **Playwright E2E:** `pnpm run build` then `pnpm run test:e2e` (starts preview on **4173**)

### Secrets

Cloud AI, GitHub Gist sync, Sentry, etc. are **BYOK** in app Settings or via local `.env` (not required for core offline flows).

### Code guidelines

- **AI disclaimers:** Every UI surface that renders AI-generated output (cloud or local: advice, diagnosis, vision/leaf scan, image generation, equipment/breeding recommendations, chat) MUST show the shared `AiDisclaimer` component (`apps/web/components/common/AiDisclaimer.tsx`). Use the `medical` prop for health/diagnosis-style surfaces. Do not inline a bespoke `t('ai.disclaimer')` string in new code — reuse the component so the notice stays consistent across all five locales.
- **File-size budget:** Keep new/heavily-changed files within **200–700 LOC** (`pnpm run check:file-budget`). Split god-files into sub-components + hooks (views) or thematic modules (services) before merge.

### Git hooks: run them, never bypass

The hooks are staged so each step is affordable, and `--no-verify` is therefore **banned** for
both commit and push. Bypassing is what let a formatting failure and a file-budget failure
reach CI unnoticed.

- `pre-commit`: commit-identity check + `lint-staged` (seconds).
- `pre-push`: **scoped** typecheck + `lint-scopes --changed` + file budget.

Both slow steps used to ignore the diff. `pre-push` deliberately does **not** call
`turbo run typecheck` (6-9 min unfiltered) — it goes through `scripts/scoped-verify.mjs`.
And `lint-scopes` used to lint every file under the strict scopes on every push: **measured
at 7 min 34 s for a branch that touched only docs**. With `--changed` it lints only the files
the branch touched and skips in 0.2 s when none fall in a strict scope. CI keeps the full
strict-scope lint, so coverage is unchanged. A hook nobody can afford to run is a hook
everybody bypasses.

### PR / review comments (Cloud Agent)

When a PR has open review threads (CodeAnt, CodeRabbit, human, or bot): **resolve them in the
same iteration** — fix the code, push, and re-run the relevant gates before summarizing. Do
not leave valid review items for a follow-up unless the user explicitly defers them.

**Loop until quiescent.** One pass is not enough: a fix routinely raises the next wave. After
each push, re-trigger the bot, fetch unresolved threads again, and repeat until a fresh review
yields **0 new comments and 0 unresolved threads**. Nitpicks and "outside diff range" comments
are in scope. Never silence a finding with a new `biome-ignore` / `eslint-disable` — refactor
so the rule passes honestly.

**Keep every PR under ~100 changed files.** Review bots silently skip inline comments on
larger PRs, so the loop never starts. Count against the merge-base with the **remote** branch
— a local `main` may be stale or divergent, the same trap the verify scripts already avoid:

```bash
git diff --name-only "$(git merge-base origin/main HEAD)"...HEAD | wc -l
```

### Git workflow (Cloud Agent)

- **Merge target:** `main` directly is fine when local gates pass (`lint:changed`, `lint:scopes`, `typecheck`, relevant `vitest`).
- **Branches:** `cursor/<descriptive-name>-671a` off `main`; push triggers CI on `cursor/**` (see `.github/workflows/ci.yml`).
- **Pull requests:** `gh pr create` / ManagePullRequest may fail with `Resource not accessible by integration` — no blocker; merge locally and `git push origin main` after Quality + Security are green.
- **Merge gate (CI):** **Quality + Security** required; E2E and deploy workflows are advisory unless explicitly requested.
- **Housekeeping:** After merge to `main`, watch [Actions](https://github.com/qnbs/CannaGuide-2025/actions) on `main` until **CI Status** passes; fix regressions on `main` or a follow-up `cursor/*` branch.

### Releases & Git tags (Cloud Agent)

- **Tag push blocked:** Repository ruleset **Tag Protection** (`refs/tags/v*`) rejects tag creation by the Cloud Agent token (`GH013`). The agent cannot push `vX.Y.Z` tags.
- **Workaround (maintainer):** Set repository secret **`RELEASE_PAT`** (classic PAT, `repo` scope), then run **Release Publish** via `workflow_dispatch` with `tag: vX.Y.Z`. Or push the tag manually as repo owner if your account has ruleset bypass.
- **Full guide:** [`docs/GITHUB-SETTINGS-GUIDE.md`](docs/GITHUB-SETTINGS-GUIDE.md) — rulesets, secrets, branch protection, PR limits.
- **Process:** [`docs/release-process.md`](docs/release-process.md) — CHANGELOG, version bump, supply-chain verification.

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

| Task                 | Command                      | Notes                                               |
| -------------------- | ---------------------------- | --------------------------------------------------- |
| Lint (changed files) | `pnpm run lint:changed`      | No-op if nothing changed vs `origin/main`           |
| Lint (full)          | `pnpm run lint:full`         | Heavy; CI uses this                                 |
| Typecheck            | `pnpm run typecheck`         | Turbo; web uses `scripts/typecheck-filter.mjs`      |
| Unit tests           | `pnpm run test:run`          | Full suite is large (~3+ min); see React note below |
| Build                | `pnpm run build`             | Excludes desktop by default                         |
| Doc metrics          | `pnpm run docs:sync-metrics` | Sync Vitest counts in README / ARCHITECTURE         |

**React versions:** `apps/web` pins `react@^19.2.7` and `react-dom@^19.2.7` (aligned in lockfile).

### Optional services

- **IoT mock:** `node docker/iot-mocks/src/server.mjs` (port **3001**)
- **Desktop:** `pnpm run dev:desktop` needs Rust + Tauri v2
- **Playwright E2E:** `pnpm run build` then `pnpm run test:e2e` (starts preview on **4173**)

### Secrets

Cloud AI, GitHub Gist sync, Sentry, etc. are **BYOK** in app Settings or via local `.env` (not required for core offline flows).

### Code guidelines

- **AI disclaimers:** Every UI surface that renders AI-generated output (cloud or local: advice, diagnosis, vision/leaf scan, image generation, equipment/breeding recommendations, chat) MUST show the shared `AiDisclaimer` component (`apps/web/components/common/AiDisclaimer.tsx`). Use the `medical` prop for health/diagnosis-style surfaces. Do not inline a bespoke `t('ai.disclaimer')` string in new code — reuse the component so the notice stays consistent across all five locales.
- **File-size budget:** Keep new/heavily-changed files within **200–700 LOC** (`pnpm run check:file-budget`). Split god-files into sub-components + hooks (views) or thematic modules (services) before merge.

### PR / review comments (Cloud Agent)

When a PR has open review threads (CodeAnt, human, or bot): **resolve them in the same iteration** — fix the code, push, and re-run the relevant gates before summarizing. Do not leave valid review items for a follow-up unless the user explicitly defers them.

### Git workflow (Cloud Agent)

- **Merge target:** `main` directly is fine when local gates pass (`lint:changed`, `lint:scopes`, `typecheck`, relevant `vitest`).
- **Branches:** `cursor/<descriptive-name>-671a` off `main`; push triggers CI on `cursor/**` (see `.github/workflows/ci.yml`).
- **Pull requests:** `gh pr create` / ManagePullRequest may fail with `Resource not accessible by integration` — no blocker; merge locally and `git push origin main` after Quality + Security are green.
- **Merge gate (CI):** **Quality + Security** required; E2E and deploy workflows are advisory unless explicitly requested.
- **Housekeeping:** After merge to `main`, watch [Actions](https://github.com/qnbs/CannaGuide-2025/actions) on `main` until **CI Status** passes; fix regressions on `main` or a follow-up `cursor/*` branch.

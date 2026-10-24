# Distribution Targets

This project is web-first with multiple web distribution targets; **automated** production deploys use **GitHub Pages**, **Vercel** (dashboard-connected), and optionally **Cloudflare Pages** (when `CLOUDFLARE_*` secrets are set). Netlify **GitHub Actions** deploys are **paused** (see [Paused CI workflows — reactivation](#paused-ci-workflows--reactivation)). Tauri v2 desktop is built separately.

## Active vs paused (canonical)

| Target               | Automated deploy                              | Preview / PR                                                                                                                                             | Primary workflow / config                                                                                                               |
| -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **GitHub Pages**     | Yes (`main` after successful CI)              | N/A (production URL only)                                                                                                                                | [.github/workflows/deploy.yml](https://github.com/qnbs/CannaGuide-2025/blob/main/.github/workflows/deploy.yml)                          |
| **Vercel**           | Yes (when repo is linked in Vercel dashboard) | Yes — Vercel Deploy Previews per PR                                                                                                                      | [vercel.json](../vercel.json)                                                                                                           |
| **Netlify**          | Paused (dashboard / bandwidth)                | Paused — [.github/workflows/preview-validation.yml](https://github.com/qnbs/CannaGuide-2025/blob/main/.github/workflows/preview-validation.yml) disabled | [netlify.toml](../netlify.toml)                                                                                                         |
| **Cloudflare Pages** | Yes (after CI on `main`, if secrets set)      | Yes — PR preview via wrangler (`<branch>.cannaguide-2025.pages.dev`)                                                                                     | [.github/workflows/deploy-cloudflare.yml](../.github/workflows/deploy-cloudflare.yml) — skips gracefully without `CLOUDFLARE_*` secrets |

**PR previews:** Use **Vercel** once the project is connected; do not rely on Netlify until that workflow is re-enabled. The old Netlify-based Playwright + Lighthouse gate in `preview-validation.yml` should only be restored when Netlify deploy previews work again (see checklist below).

## Read-only production parity check

After the deploy workflows for a resulting `main` commit have had time to finish, compare
the public hosts against the live remote `main` SHA:

```bash
CANNAGUIDE_EXPECTED_MAIN_SHA="$(git ls-remote origin refs/heads/main | cut -f1)"
node scripts/production-parity.mjs --expected-sha "$CANNAGUIDE_EXPECTED_MAIN_SHA" --json
```

The probe sends unauthenticated `GET`/`HEAD` requests and waits up to 30 minutes for all
three `version.json` files to report that SHA. It then checks configured security and cache
headers, the manifest and icon targets, the service worker and its entry registration, and
known platform-specific routes and redirects. `DRIFT` exits 1; unavailable or invalid
evidence exits 2. Use `--wait-seconds 0` for an immediate observation without a deployment
wait. Each response body inspected by the probe is capped at 4 MiB; an oversized or
unreadable body is reported as unknown. The probe counts modulepreload links but does not
fetch those assets, model files, or WASM runtimes. A matching `version.json` is deployment
metadata, not proof that every served asset byte or offline interaction is identical.

This read-only check does not publish a release, change provider settings, or qualify
desktop installers.

## GitHub Pages (primary)

Production builds are deployed automatically via `.github/workflows/deploy.yml` when CI passes on `main`.

**Housekeeping:** On `workflow_run` (post-CI), the deploy workflow trusts the successful CI run for the exact `main` SHA and only runs `build:gh` + Pages upload. To request a full manual validation, dispatch the **CI** workflow on `main`; the deploy workflow itself has no manual production bypass.

Stale GitHub **deployment** records are pruned automatically:

- **After every deploy:** `deploy.yml` and `deploy-cloudflare.yml` run [`.github/actions/prune-deployments`](../.github/actions/prune-deployments) (keeps the newest **3 per environment**; deactivates active deployments before delete).
- **Nightly safety net:** [`.github/workflows/cleanup-deployments.yml`](../.github/workflows/cleanup-deployments.yml) (45 min timeout; re-run `workflow_dispatch` if backlog is large).
- **Local / maintainer:** `node scripts/github/prune-deployments.mjs --keep=3` (requires `gh auth` with `repo` scope).

The same workflow also retains **Vercel** and **Cloudflare Pages** deployments. That path is separate from the GitHub Deployments API: it runs on the nightly schedule, on a manual dispatch from `main`, and after CI succeeds for a push to `main`. Pull requests do not run it. It classifies from live pull-request state and deletes individual deployment ids. It keeps the active production deployment and the two previous known-good production deployments. Cloudflare's latest deployment for a branch is left in place. `CLOUDFLARE_API_TOKEN` and `VERCEL_TOKEN` are not passed to the classification step, and the delete path does not use Wrangler `--force`. A missing host token skips that host and deletes nothing. Dry-run: dispatch the workflow with `dry_run` set.

**Branches:** Fully merged and squash/rebase-merged PR branches are pruned post-deploy and weekly via [`.github/workflows/cleanup-branches.yml`](../.github/workflows/cleanup-branches.yml). Closed but unmerged branches are preserved.

**Build:** `BUILD_BASE_PATH=/CannaGuide-2025/` (subpath hosting).

URL: <https://qnbs.github.io/CannaGuide-2025/>

## Netlify (PAUSED until v2.0)

> **Status:** Project disabled on Netlify dashboard (bandwidth limit 50% reached). Build command in `netlify.toml` intentionally fails. Re-enable on Netlify dashboard + uncomment build config when ready.

Previously, every pull request got a deploy preview via `netlify.toml`. Build settings and security headers remain configured there for re-enablement.

## Vercel

Vercel deployment is configured via `vercel.json` in the repository root. Connect the repo via the Vercel Dashboard for automatic deployments on push to `main`.

**Setup (5 minutes):**

1. Go to [vercel.com](https://vercel.com) -> "New Project" -> connect `qnbs/CannaGuide-2025`
2. Framework Preset: **Other** (do NOT select "Vite" -- the monorepo build is controlled via `vercel.json`)
3. Root Directory: `.` (dot -- entire repo root, required for pnpm workspaces)
4. Build Command: **leave empty** (taken from `vercel.json`)
5. Output Directory: **leave empty** (taken from `vercel.json`)
6. Install Command: **leave empty** (taken from `vercel.json`)
7. Environment Variables: `BUILD_BASE_PATH=/`, `NODE_VERSION=24`
8. Deploy

**Important:** Do NOT set Framework Preset to "Vite". Vercel's Vite builder overrides `outputDirectory` and looks for `dist/` at the repo root instead of `apps/web/dist/`. Setting "Other" lets Vercel respect the explicit `vercel.json` config.

**Key config in `vercel.json`:**

- Build: `turbo run build --filter=@cannaguide/web` with `BUILD_BASE_PATH=/`
- Output: `apps/web/dist` (Vite build output for the web workspace)
- SPA rewrite: all routes -> `/index.html`
- Security headers: CSP, Permissions-Policy, COOP, X-Frame-Options (synced with `securityHeaders.ts`)
- Asset caching: `/assets/*` immutable (1 year), `/sw.js` no-cache, `/manifest.json` 1h

**Advantages:** Native Turbo Remote Cache, instant preview deployments, Speed Insights, Edge Functions for future AI proxy.

## Cloudflare Pages (secondary mirror)

Automated wrangler deploys run from `.github/workflows/deploy-cloudflare.yml` when repository secrets are configured. The repo pins **`wrangler`** as a root devDependency so CI can run `pnpm exec wrangler` in the pnpm monorepo (avoids failed auto-install at workspace root).

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

**Triggers:** successful CI on `main` (production) and pull requests to `main` (preview + PR comment). The deployment workflow has no direct production dispatch.

**Build:** `BUILD_BASE_PATH=/` (root-hosted SPA at `https://cannaguide-2025.pages.dev`).

If secrets are missing, the workflow exits with a notice and does not fail the pipeline.

**First deploy:** CI runs `wrangler pages project create cannaguide-2025` when the Pages project is missing (fixes API error `8000007` / “Project not found”). The API token needs **Account → Cloudflare Pages → Edit** (or equivalent Pages write scope).

### Cloudflare Workers Builds vs Pages (PR check)

Some PRs show a failing check **Workers Builds: cannaguide-2025** from the Cloudflare dashboard Git integration. That is a **Workers** service build, not the GitHub Actions **Pages** deploy in `deploy-cloudflare.yml`.

| Integration                                  | Purpose                                   | Repo automation                     |
| -------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| **GitHub Actions** (`deploy-cloudflare.yml`) | Upload `apps/web/dist` via wrangler Pages | Preferred — uses CI Node 24 + pnpm  |
| **Cloudflare Workers Builds** (dashboard)    | Legacy/auto Worker build from repo root   | Often fails without `wrangler.toml` |

**Recommended:** In Cloudflare dashboard → Workers & Pages → `cannaguide-2025` → Settings → disconnect **GitHub build** for Workers, or delete the unused Worker and rely on Pages + this workflow. The failing check is informational unless marked required in branch protection.

**Action (P0-03):** Disconnect Worker Git integration in dashboard when ready — removes the spurious PR check. GitHub Actions Pages deploy (`deploy-cloudflare.yml`) remains the canonical path.

`_headers` and `_redirects` in `apps/web/public/` stay aligned with [apps/web/securityHeaders.ts](../apps/web/securityHeaders.ts).

**Previous dashboard setup (reference):**

1. [pages.cloudflare.com](https://pages.cloudflare.com) -> Connect repo `qnbs/CannaGuide-2025`
2. Framework Preset: **Vite**, Root: `.`, Output: `apps/web/dist`, build via pnpm workspace

**Advantages when active:** edge PoPs, Workers; headers stay aligned with `securityHeaders.ts` when builds run.

## Tauri v2 Desktop

Desktop is a separate Tauri v2 wrapper around the shared web frontend. Platform-specific code uses `platformService.ts` (`isTauri`, `isPwa`, `isBrowser`) and native plugins. Source availability and a configured build matrix do not establish current installer availability or platform qualification.

**Delivery evidence checked 2026-10-24:**

| Release                                                                                                                                           | Observed GitHub Release assets                                         | Qualification boundary                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [v1.4.1](https://github.com/qnbs/CannaGuide-2025/releases/tag/v1.4.1)                                                                             | Seven historical Linux/macOS assets; no Windows installer in that list | API digests exist; these old binaries were not downloaded, executed or independently signature-verified in this review |
| [v1.6.0](https://github.com/qnbs/CannaGuide-2025/releases/tag/v1.6.0)                                                                             | No assets in the current API response                                  | The historical source/reintroduction claim is not installer proof                                                      |
| [v1.9.0](https://github.com/qnbs/CannaGuide-2025/releases/tag/v1.9.0) and [v1.10.0](https://github.com/qnbs/CannaGuide-2025/releases/tag/v1.10.0) | Web distribution tarball and CycloneDX SBOM                            | No current desktop installer or updater manifest is published in these releases                                        |

The v1.10.0 [desktop run 37703950695](https://github.com/qnbs/CannaGuide-2025/actions/runs/37703950695) ended with `startup_failure`, zero jobs and zero artifacts. Its source was `c49560d9d3d36c9a84f71e3095a8e3a3eea3534a`. Both that workflow and the current workflow pass local `actionlint`; the observed metadata does not identify the startup rejection. No Rust/compiler/packager failure was observed. GitHub admission/annotation evidence is still needed before choosing a startup fix. The Web Release Publish workflow is separate from this desktop workflow.

**Source:** `apps/desktop/` (package `@cannaguide/desktop`)
**CI:** `.github/workflows/desktop-build.yml` -- matrix build for Linux / macOS / Windows, triggered on tag push `v*`
**Config:** `apps/desktop/src-tauri/tauri.conf.json` -- `frontendDist: ../../web/dist`, resolved from `src-tauri`, embeds `apps/web/dist`.
**IPC commands:** `get_app_version`, `export_data`, `import_data`

The Tauri hooks call `apps/desktop/scripts/frontend.mjs` for development and bundling. It sets `BUILD_BASE_PATH=/` only for the child web process, preserving the default GitHub Pages subpath for ordinary web builds. The build hook builds once, then verifies that `index.html` has a module entry and its referenced script, stylesheet, modulepreload, manifest and icon files are local, nonempty and inside the embedded directory. This cheap check covers generated entry references, not every dynamic import, worker or native startup path. A check-only invocation from `apps/desktop` is `node scripts/frontend.mjs check`; it requires an existing desktop-target frontend build and never creates one.

`desktop-build.yml` uploads `desktop-${target}` Actions artifacts with a **14-day TTL**, and fails if all upload globs are empty. It does not publish GitHub Release assets. Per-target installer completeness, native startup, OS signing/notarization, updater signatures and installation smoke tests remain separate gates; a nonempty upload is not proof of any of them. The current `0.1.0` desktop manifest/config versions have not been aligned to the Web `1.10.0` version: channel/version policy needs an explicit owner decision.

### Modular Capabilities (ADR-0012)

Capabilities are organized into 10 separate JSON files in `apps/desktop/src-tauri/capabilities/`:

| File                | Purpose                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `core.json`         | Window/event management                                          |
| `desktop.json`      | Tray, shell, process                                             |
| `fs.json`           | File system with scopes (restricted to `$APPDATA/cannaguide/**`) |
| `dialog.json`       | Native file dialogs                                              |
| `notification.json` | Native notifications                                             |
| `tray.json`         | System tray menu                                                 |
| `shortcut.json`     | Global keyboard shortcuts                                        |
| `updater.json`      | Auto-updates                                                     |
| `window-state.json` | Window size/position persistence                                 |
| `store.json`        | Desktop-specific settings (theme, AI model)                      |

### Plugins (9 total)

| Plugin                         | Version | Purpose                           |
| ------------------------------ | ------- | --------------------------------- |
| `tauri-plugin-dialog`          | 2.x     | Native file dialogs               |
| `tauri-plugin-fs`              | 2.x     | Scoped file system access         |
| `tauri-plugin-notification`    | 2.x     | Native notifications              |
| `tauri-plugin-global-shortcut` | 2.x     | Global keyboard shortcuts         |
| `tauri-plugin-updater`         | 2.x     | Auto-updates from GitHub Releases |
| `tauri-plugin-shell`           | 2.x     | Open URLs externally              |
| `tauri-plugin-process`         | 2.x     | Process management                |
| `tauri-plugin-window-state`    | 2.x     | Persist window size/position      |
| `tauri-plugin-store`           | 2.x     | Desktop-specific settings         |

### Auto-Updater Setup

The updater plugin is configured to require signature verification. A working published update channel has **not** been qualified. On 2026-10-24, the configured `releases/latest/download/latest.json` URL redirected to v1.10.0 and returned HTTP 404. Do not treat this as an available update or disable signature verification to bypass it.

**Future updater signing gates (no key creation or rotation is authorized by this document):**

- `TAURI_SIGNING_PRIVATE_KEY`: Base64-encoded private key
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Key password

**Endpoints:** `https://github.com/qnbs/CannaGuide-2025/releases/latest/download/latest.json`

Before publishing desktop updates, agree the version/channel and stable bundle identity, qualify each intended OS/architecture, verify signed artifacts against the configured public key, validate the manifest/platform URLs, and prove installation/startup and recovery. Native OS code signing and Tauri updater signing are distinct. See the [Tauri configuration reference](https://v2.tauri.app/reference/config/#frontenddist) and [updater contract](https://v2.tauri.app/plugin/updater/). Historical assets must not be offered as newly qualified builds.

### Code Signing (Future)

**macOS:**

- Requires Apple Developer Program membership ($99/year)
- `signingIdentity`: Developer ID Application certificate
- `entitlements`: Custom entitlements file (hardened runtime)
- `providerShortName`: Team ID

**Windows:**

- Requires EV code signing certificate (~$300-500/year)
- `certificateThumbprint`: Certificate SHA-1 thumbprint
- `timestampUrl`: `http://timestamp.digicert.com`

## Paused CI workflows — reactivation

Use this checklist when bringing **Netlify** automation back.

### Netlify + PR preview validation (`preview-validation.yml`)

1. Re-enable the Netlify project (dashboard) and resolve bandwidth / billing limits.
2. Restore `netlify.toml` build sections if they were commented for intentional failure.
3. Reinstate workflow triggers from git history: previously `deployment_status` for deploy-preview success.
4. Confirm Playwright + Lighthouse jobs receive a valid preview URL env var.
5. Run the workflow manually once (`workflow_dispatch`) before relying on it as a required check.

### Cloudflare Pages secrets (first-time setup)

1. Create API token with **Cloudflare Pages — Edit** (and account read) scope.
2. Add repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
3. Dispatch the **CI** workflow on `main` (or merge a validated PR); the successful exact-SHA CI run triggers the first production deploy and creates the Pages project when necessary.
4. Keep `_headers` / `_redirects` under `apps/web/public/` aligned with [apps/web/securityHeaders.ts](../apps/web/securityHeaders.ts).

---

## Removed Targets

The following distribution targets were removed due to persistent CI failures and maintenance overhead:

- **Docker** (self-hosted) -- Dockerfile, docker-compose.yml, nginx.conf, CI workflow deleted
- **Capacitor** (mobile wrapper) -- capacitor.config.ts, CI workflow deleted

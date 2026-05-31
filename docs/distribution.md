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

## GitHub Pages (primary)

Production builds are deployed automatically via `.github/workflows/deploy.yml` when CI passes on `main`.

**Housekeeping:** On `workflow_run` (post-CI), the deploy workflow trusts CI and only runs `build:gh` + Pages upload — it does not re-run lint, typecheck, or unit tests. Use `workflow_dispatch` for a full pre-deploy gate locally in Actions.

Stale GitHub **deployment** records are pruned weekly by [`.github/workflows/cleanup-deployments.yml`](../.github/workflows/cleanup-deployments.yml) (keeps the newest 3 per environment; use `workflow_dispatch` with `dry_run: true` to preview).

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

**Triggers:** successful CI on `main` (production), pull requests to `main` (preview + PR comment), and `workflow_dispatch`.

**Build:** `BUILD_BASE_PATH=/` (root-hosted SPA at `https://cannaguide-2025.pages.dev`).

If secrets are missing, the workflow exits with a notice and does not fail the pipeline.

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

Re-added in v1.6. 99% code sharing with the PWA. Platform-specific code uses `platformService.ts` (`isTauri`, `isPwa`, `isBrowser`). Native features via Tauri plugins (notification, dialog, fs, shell, window-state, store).

**Source:** `apps/desktop/` (package `@cannaguide/desktop`)
**CI:** `.github/workflows/desktop-build.yml` -- matrix build for Linux / macOS / Windows, triggered on tag push `v*`
**Config:** `apps/desktop/src-tauri/tauri.conf.json` -- `frontendDist` points to `../web/dist`
**IPC commands:** `get_app_version`, `export_data`, `import_data`

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

| Plugin | Version | Purpose |
|--------|---------|---------||
| `tauri-plugin-dialog` | 2.x | Native file dialogs |
| `tauri-plugin-fs` | 2.x | Scoped file system access |
| `tauri-plugin-notification` | 2.x | Native notifications |
| `tauri-plugin-global-shortcut` | 2.x | Global keyboard shortcuts |
| `tauri-plugin-updater` | 2.x | Auto-updates from GitHub Releases |
| `tauri-plugin-shell` | 2.x | Open URLs externally |
| `tauri-plugin-process` | 2.x | Process management |
| `tauri-plugin-window-state` | 2.x | Persist window size/position |
| `tauri-plugin-store` | 2.x | Desktop-specific settings |

### Auto-Updater Setup

Updates are signed and distributed via GitHub Releases.

**CI Secrets required:**

- `TAURI_SIGNING_PRIVATE_KEY`: Base64-encoded private key
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Key password

**Endpoints:** `https://github.com/qnbs/CannaGuide-2025/releases/latest/download/latest.json`

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
3. Run **Deploy to Cloudflare Pages** via `workflow_dispatch` once; production deploys follow successful CI on `main`.
4. Keep `_headers` / `_redirects` under `apps/web/public/` aligned with [apps/web/securityHeaders.ts](../apps/web/securityHeaders.ts).

---

## Removed Targets

The following distribution targets were removed due to persistent CI failures and maintenance overhead:

- **Docker** (self-hosted) -- Dockerfile, docker-compose.yml, nginx.conf, CI workflow deleted
- **Capacitor** (mobile wrapper) -- capacitor.config.ts, CI workflow deleted

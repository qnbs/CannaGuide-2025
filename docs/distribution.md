# Distribution Targets

This project is web-first with multiple web distribution targets; **automated** production deploys use **GitHub Pages** and **Vercel** (dashboard-connected). Netlify and Cloudflare Pages **GitHub Actions** deploys are **paused** (see [Paused CI workflows — reactivation](#paused-ci-workflows--reactivation)). Tauri v2 desktop is built separately.

## Active vs paused (canonical)

| Target               | Automated deploy                              | Preview / PR                                                                                                                                             | Primary workflow / config                                                                                                                                                     |
| -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GitHub Pages**     | Yes (`main` after successful CI)              | N/A (production URL only)                                                                                                                                | [.github/workflows/deploy.yml](https://github.com/qnbs/CannaGuide-2025/blob/main/.github/workflows/deploy.yml)                                                                |
| **Vercel**           | Yes (when repo is linked in Vercel dashboard) | Yes — Vercel Deploy Previews per PR                                                                                                                      | [vercel.json](../vercel.json)                                                                                                                                                 |
| **Netlify**          | Paused (dashboard / bandwidth)                | Paused — [.github/workflows/preview-validation.yml](https://github.com/qnbs/CannaGuide-2025/blob/main/.github/workflows/preview-validation.yml) disabled | [netlify.toml](../netlify.toml)                                                                                                                                               |
| **Cloudflare Pages** | Paused — CI wrangler deploy off               | N/A                                                                                                                                                      | [.github/workflows/deploy-cloudflare.yml](https://github.com/qnbs/CannaGuide-2025/blob/main/.github/workflows/deploy-cloudflare.yml) (placeholder / `workflow_dispatch` only) |

**PR previews:** Use **Vercel** once the project is connected; do not rely on Netlify until that workflow is re-enabled. The old Netlify-based Playwright + Lighthouse gate in `preview-validation.yml` should only be restored when Netlify deploy previews work again (see checklist below).

## GitHub Pages (primary)

Production builds are deployed automatically via `.github/workflows/deploy.yml` when CI passes on `main`.

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
7. Environment Variables: `BUILD_BASE_PATH=/`, `NODE_VERSION=20`
8. Deploy

**Important:** Do NOT set Framework Preset to "Vite". Vercel's Vite builder overrides `outputDirectory` and looks for `dist/` at the repo root instead of `apps/web/dist/`. Setting "Other" lets Vercel respect the explicit `vercel.json` config.

**Key config in `vercel.json`:**

- Build: `turbo run build --filter=@cannaguide/web` with `BUILD_BASE_PATH=/`
- Output: `apps/web/dist` (Vite build output for the web workspace)
- SPA rewrite: all routes -> `/index.html`
- Security headers: CSP, Permissions-Policy, COOP, X-Frame-Options (synced with `securityHeaders.ts`)
- Asset caching: `/assets/*` immutable (1 year), `/sw.js` no-cache, `/manifest.json` 1h

**Advantages:** Native Turbo Remote Cache, instant preview deployments, Speed Insights, Edge Functions for future AI proxy.

## Cloudflare Pages (PAUSED — CI deploy)

> **Status:** `.github/workflows/deploy-cloudflare.yml` no longer runs automated wrangler deploys (manual `workflow_dispatch` only — placeholder job). Use GitHub Pages + Vercel until Cloudflare is re-enabled.

`_headers` and `_redirects` in `apps/web/public/` remain valid if you reconnect Cloudflare Git builds or restore the workflow from git history.

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

Use this checklist when bringing **Netlify** or **Cloudflare Pages** automation back; keep GitHub Pages + Vercel as the documented primary pair until then.

### Netlify + PR preview validation (`preview-validation.yml`)

1. Re-enable the Netlify project (dashboard) and resolve bandwidth / billing limits.
2. Restore `netlify.toml` build sections if they were commented for intentional failure.
3. Reinstate workflow triggers from git history: previously `deployment_status` for deploy-preview success.
4. Confirm Playwright + Lighthouse jobs receive a valid preview URL env var.
5. Run the workflow manually once (`workflow_dispatch`) before relying on it as a required check.

### Cloudflare Pages (`deploy-cloudflare.yml`)

1. Restore `on.push` / `workflow_run` / `pull_request` triggers from git history (see workflow header comments).
2. Configure Cloudflare Pages Git integration or wire **wrangler** with API token secrets as before.
3. Keep `_headers` / `_redirects` under `apps/web/public/` aligned with [apps/web/securityHeaders.ts](../apps/web/securityHeaders.ts).

---

## Removed Targets

The following distribution targets were removed due to persistent CI failures and maintenance overhead:

- **Docker** (self-hosted) -- Dockerfile, docker-compose.yml, nginx.conf, CI workflow deleted
- **Capacitor** (mobile wrapper) -- capacitor.config.ts, CI workflow deleted

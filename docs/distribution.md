# Distribution Targets

This project is web-first with four active web distribution targets plus a Tauri v2 desktop build.

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

## Cloudflare Pages

Cloudflare Pages deployment uses `_headers` and `_redirects` files in `apps/web/public/` (copied to `dist/` during build).

**Setup (5 minutes):**

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com) -> "Connect to Git" -> select `qnbs/CannaGuide-2025`
2. Framework Preset: **Vite**
3. Root Directory: `.` (dot -- entire repo root, required for pnpm workspaces)
4. Build Command: `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
5. Output Directory: `apps/web/dist`
6. Deploy

**Key config:**

- `_redirects`: SPA routing (`/* /index.html 200`)
- `_headers`: Security headers + caching (synced with `securityHeaders.ts`)

**Advantages:** 330+ global edge PoPs, unlimited bandwidth (free tier), fastest TTFB for static assets, Workers for future Edge Functions.

## Tauri v2 Desktop

Re-added in v1.6. 99% code sharing with the PWA. Platform-specific code uses `platformService.ts` (`isTauri`, `isPwa`, `isBrowser`). Native features via Tauri plugins (notification, dialog, fs, shell).

**Source:** `apps/desktop/` (package `@cannaguide/desktop`)
**CI:** `.github/workflows/desktop-build.yml` -- matrix build for Linux / macOS / Windows, triggered on tag push `v*`
**Config:** `apps/desktop/src-tauri/tauri.conf.json` -- `frontendDist` points to `../web/dist`
**Capabilities:** `apps/desktop/src-tauri/capabilities/default.json` (minimal per-command permissions)
**IPC commands:** `get_app_version`, `export_data`, `import_data`

## Removed Targets

The following distribution targets were removed due to persistent CI failures and maintenance overhead:

- **Docker** (self-hosted) -- Dockerfile, docker-compose.yml, nginx.conf, CI workflow deleted
- **Capacitor** (mobile wrapper) -- capacitor.config.ts, CI workflow deleted

# Distribution Targets

This project is web-first with four active distribution targets.

## GitHub Pages (primary)

Production builds are deployed automatically via `.github/workflows/deploy.yml` when CI passes on `main`.

URL: <https://qnbs.github.io/CannaGuide-2025/>

## Netlify (PR previews)

Every pull request gets a deploy preview via `netlify.toml`. Build settings and security headers are configured there.

## Vercel

Vercel deployment is configured via `vercel.json` in the repository root. Connect the repo via the Vercel Dashboard for automatic deployments on push to `main`.

**Setup (5 minutes):**

1. Go to [vercel.com](https://vercel.com) -> "New Project" -> connect `qnbs/CannaGuide-2025`
2. Framework Preset: **Vite** (auto-detected)
3. Build Command: `pnpm run build`
4. Output Directory: `apps/web/dist`
5. Environment Variables: `BUILD_BASE_PATH=/`, `NODE_VERSION=20`
6. Deploy

**Key config in `vercel.json`:**

- SPA rewrite: all routes -> `/index.html`
- Security headers: CSP, Permissions-Policy, COOP, X-Frame-Options (synced with `securityHeaders.ts`)
- Asset caching: `/assets/*` immutable (1 year), `/sw.js` no-cache, `/manifest.json` 1h

**Advantages:** Native Turbo Remote Cache, instant preview deployments, Speed Insights, Edge Functions for future AI proxy.

## Cloudflare Pages

Cloudflare Pages deployment uses `_headers` and `_redirects` files in `apps/web/public/` (copied to `dist/` during build).

**Setup (5 minutes):**

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com) -> "Connect to Git" -> select `qnbs/CannaGuide-2025`
2. Framework Preset: **Vite**
3. Build Command: `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
4. Output Directory: `apps/web/dist`
5. Deploy

**Key config:**

- `_redirects`: SPA routing (`/* /index.html 200`)
- `_headers`: Security headers + caching (synced with `securityHeaders.ts`)

**Advantages:** 330+ global edge PoPs, unlimited bandwidth (free tier), fastest TTFB for static assets, Workers for future Edge Functions.

## Removed Targets

The following distribution targets were removed due to persistent CI failures and maintenance overhead:

- **Docker** (self-hosted) -- Dockerfile, docker-compose.yml, nginx.conf, CI workflow deleted
- **Tauri** (desktop wrapper) -- src-tauri/, apps/desktop/, CI workflow deleted
- **Capacitor** (mobile wrapper) -- capacitor.config.ts, CI workflow deleted

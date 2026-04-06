# Distribution Targets

This project is web-first with two active distribution targets.

## GitHub Pages (primary)

Production builds are deployed automatically via `.github/workflows/deploy.yml` when CI passes on `main`.

URL: <https://qnbs.github.io/CannaGuide-2025/>

## Netlify (PR previews)

Every pull request gets a deploy preview via `netlify.toml`. Build settings and security headers are configured there.

## Removed Targets

The following distribution targets were removed due to persistent CI failures and maintenance overhead:

- **Docker** (self-hosted) -- Dockerfile, docker-compose.yml, nginx.conf, CI workflow deleted
- **Tauri** (desktop wrapper) -- src-tauri/, apps/desktop/, CI workflow deleted
- **Capacitor** (mobile wrapper) -- capacitor.config.ts, CI workflow deleted

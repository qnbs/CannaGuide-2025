# Distribution Targets

This project remains web-first, but includes starter scaffolding for desktop, mobile, and self-hosted deployment.

## GitHub Pages (primary)

Production builds are deployed automatically via `.github/workflows/deploy.yml` when CI passes on `main`.

URL: <https://qnbs.github.io/CannaGuide-2025/>

## Netlify (PR previews)

Every pull request gets a deploy preview via `netlify.toml`. Build settings and security headers are configured there.

## Docker (self-hosted)

Build and run with Docker Compose:

```bash
docker compose up --build
```

App URL: `http://localhost:8080`

Files:

- `Dockerfile`
- `docker/nginx.conf`
- `docker-compose.yml`

CI workflow: `.github/workflows/docker.yml` (triggers on `v*` tags).

## Tauri (desktop wrapper)

Tauri v2 desktop config lives in `src-tauri/` (Rust backend config + capabilities). The Tauri desktop wrapper with IPC commands is in `apps/desktop/`.

Local development:

```bash
npm run tauri:dev
npm run tauri:build
```

CI workflow: `.github/workflows/tauri-build.yml` (triggers on `v*` tags, matrix builds for Linux/Windows/macOS).

Notes:

- The wrapper uses the existing Vite build output from `dist/`.
- Add icons before production packaging (see `src-tauri/icons/`).
- Capabilities are defined in `src-tauri/capabilities/default.json` (minimal permission set).

## Capacitor (mobile wrapper)

Starter config is available in `capacitor.config.ts`.

Setup (native directories are not committed yet):

```bash
npm run build
npx cap add android
npx cap add ios
npm run cap:sync
```

CI workflow: `.github/workflows/capacitor-build.yml` (triggers on `v*` tags, currently disabled).

Notes:

- For store release, handle app signing, privacy declarations, and permission rationale text.
- Validate offline behavior and background sync constraints on each platform.

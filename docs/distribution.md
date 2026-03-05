# Distribution Targets

This project remains web-first, but includes starter scaffolding for desktop, mobile, and self-hosted deployment.

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

## Tauri (desktop wrapper)

Starter files are available under `src-tauri/`.

Typical setup steps:

```bash
npm install -D @tauri-apps/cli
npm install @tauri-apps/api
npx tauri dev
npx tauri build
```

Notes:
- The wrapper uses the existing Vite app (`npm run dev` / `npm run build`).
- Add icons before production packaging.

## Capacitor (mobile wrapper)

Starter config is available in `capacitor.config.ts`.

Typical setup steps:

```bash
npm install -D @capacitor/cli
npm install @capacitor/core
npx cap init "CannaGuide 2025" com.cannaguide.app
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

Notes:
- For store release, handle app signing, privacy declarations, and permission rationale text.
- Validate offline behavior and background sync constraints on each platform.

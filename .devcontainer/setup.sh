#!/usr/bin/env bash
# Entschärft: Kein 'set -e', damit der Container-Start bei kleinen Fehlern nicht stirbt!
set -uo pipefail

echo "[setup] Installing npm dependencies..."
# npm install statt npm ci, falls die lockfile fehlt oder spinnt
npm install

echo "[setup] Configuring git signing..."
# Checken ob die Datei überhaupt existiert, bevor node ausgeführt wird
if [ -f "./scripts/devcontainer/bootstrap-git-signing.mjs" ]; then
    node ./scripts/devcontainer/bootstrap-git-signing.mjs || echo "[setup] Git signing script failed, continuing anyway..."
else
    echo "[setup] WARN: bootstrap-git-signing.mjs not found, skipping."
fi

echo "[setup] Installing Playwright browsers..."
npx playwright install --with-deps chromium || echo "[setup] Playwright install failed, continuing anyway..."

echo "[setup] DevContainer setup complete"

#!/usr/bin/env bash
# Entschärft: Kein 'set -e', damit der Container-Start bei kleinen Fehlern nicht stirbt!
set -uo pipefail

echo "[setup] Installing npm dependencies..."
# CI=1 stoppt interaktive Prompts.
# --no-fund und --no-audit sparen bei der riesigen Menge an Paketen enorm Zeit.
# --ignore-scripts verhindert, dass 'husky' beim Setup dazwischengrätscht.
CI=1 npm install --no-fund --no-audit --ignore-scripts

# Husky danach manuell und sicher initialisieren
echo "[setup] Initializing git hooks (husky)..."
npx husky || echo "[setup] WARN: Husky setup failed, continuing..."

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

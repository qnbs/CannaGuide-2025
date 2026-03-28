#!/usr/bin/env bash
# DevContainer postCreateCommand (Lite Mode)
# Entschärft: Kein 'set -e', damit der Container-Start bei kleinen Fehlern nicht stirbt!
set -uo pipefail

echo "[setup] Installing npm dependencies (Lite Mode)..."
# CI=1 stoppt interaktive Prompts. 
# --no-fund und --no-audit sparen Zeit. --ignore-scripts blockt Husky vorerst.
CI=1 npm install --no-fund --no-audit --ignore-scripts

echo "[setup] Initializing git hooks (husky)..."
npx husky || echo "[setup] WARN: Husky setup failed, continuing anyway..."

echo "[setup] Configuring git signing..."
if [ -f "./scripts/devcontainer/bootstrap-git-signing.mjs" ]; then
    node ./scripts/devcontainer/bootstrap-git-signing.mjs || echo "[setup] Git signing script failed, continuing anyway..."
else
    echo "[setup] WARN: bootstrap-git-signing.mjs not found, skipping."
fi

echo "[setup] Installing Playwright browsers (TEMPORÄR DEAKTIVIERT FÜR SCHNELLEN START)..."
# npx playwright install --with-deps chromium || echo "[setup] Playwright install failed, continuing anyway..."

echo "[setup] DevContainer setup complete"

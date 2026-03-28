#!/usr/bin/env bash
# DevContainer postCreateCommand (Lite Mode)
# Installs ONLY the UI frontend and IoT mocks — heavy AI/ML modules are skipped.
# Full install (incl. ai-core) happens in CI via plain `npm install`.
set -uo pipefail

echo "[setup] Installing UI and IoT dependencies ONLY (skipping heavy AI modules)..."
# NPM workspace filter: install apps/web + packages/iot-mocks + root dev tools.
# --no-optional skips the heavy ML binaries in @cannaguide/ai-core's optionalDependencies.
CI=1 npm install -w @cannaguide/web -w @cannaguide/iot-mocks --include-workspace-root --no-optional --no-fund --no-audit --ignore-scripts

echo "[setup] Initializing git hooks (husky)..."
npx husky || echo "[setup] WARN: Husky setup failed, continuing..."

echo "[setup] Configuring git signing..."
if [ -f "./scripts/devcontainer/bootstrap-git-signing.mjs" ]; then
    node ./scripts/devcontainer/bootstrap-git-signing.mjs || echo "[setup] Git signing script failed, continuing anyway..."
else
    echo "[setup] WARN: bootstrap-git-signing.mjs not found, skipping."
fi

echo "[setup] DevContainer setup complete"

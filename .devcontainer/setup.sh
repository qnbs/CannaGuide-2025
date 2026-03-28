#!/usr/bin/env bash
# DevContainer postCreateCommand (Lite Mode)
# Deterministic install via npm ci (lockfile-pinned, OSSF Scorecard compliant).
# ML models are browser-side only -- no heavy binaries downloaded at install time.
set -uo pipefail

echo "[setup] Installing dependencies (deterministic lockfile-pinned install)..."
# npm ci uses package-lock.json for deterministic, hash-pinned installs (OSSF Scorecard compliant).
# --ignore-scripts prevents postinstall scripts from running during container build.
# ML models are loaded lazily at runtime in-browser, not at install time.
CI=1 npm ci --no-fund --no-audit --ignore-scripts

echo "[setup] Initializing git hooks (husky)..."
npx husky || echo "[setup] WARN: Husky setup failed, continuing..."

echo "[setup] Configuring git signing..."
if [ -f "./scripts/devcontainer/bootstrap-git-signing.mjs" ]; then
    node ./scripts/devcontainer/bootstrap-git-signing.mjs || echo "[setup] Git signing script failed, continuing anyway..."
else
    echo "[setup] WARN: bootstrap-git-signing.mjs not found, skipping."
fi

echo "[setup] DevContainer setup complete"

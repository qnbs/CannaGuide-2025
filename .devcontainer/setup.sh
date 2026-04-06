#!/usr/bin/env bash
# DevContainer postCreateCommand (Lite Mode)
# Deterministic install via pnpm (lockfile-pinned, OSSF Scorecard compliant).
# ML models are browser-side only -- no heavy binaries downloaded at install time.
set -uo pipefail

echo "[setup] Enabling Corepack for pnpm..."
corepack enable

echo "[setup] Installing dependencies (deterministic lockfile-pinned install)..."
# pnpm install --frozen-lockfile uses pnpm-lock.yaml for deterministic installs (OSSF Scorecard compliant).
# ML models are loaded lazily at runtime in-browser, not at install time.
CI=1 pnpm install --frozen-lockfile

echo "[setup] Initializing git hooks (husky)..."
pnpm exec husky || echo "[setup] WARN: Husky setup failed, continuing..."

echo "[setup] Configuring git signing..."
if [ -f "./scripts/devcontainer/bootstrap-git-signing.mjs" ]; then
    node ./scripts/devcontainer/bootstrap-git-signing.mjs || echo "[setup] Git signing script failed, continuing anyway..."
else
    echo "[setup] WARN: bootstrap-git-signing.mjs not found, skipping."
fi

echo "[setup] DevContainer setup complete"

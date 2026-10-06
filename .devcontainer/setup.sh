#!/usr/bin/env bash
# DevContainer postCreateCommand (Lite Mode)
# A failed frozen install must fail container creation.
set -euo pipefail

echo "[setup] Enabling Corepack for pnpm..."
corepack enable

echo "[setup] Installing dependencies (deterministic lockfile-pinned install)..."
CI=1 pnpm install --frozen-lockfile

if ! pnpm exec husky; then
    echo "[setup] WARN: Husky setup failed. Git hooks are not installed in this container."
fi

echo "[setup] Configuring git signing..."
if [ -f "./scripts/devcontainer/bootstrap-git-signing.mjs" ]; then
    if ! node ./scripts/devcontainer/bootstrap-git-signing.mjs; then
        echo "[setup] WARN: Git signing bootstrap failed. Commits from this container may be unsigned."
    fi
else
    echo "[setup] WARN: bootstrap-git-signing.mjs not found, skipping."
fi

echo "[setup] DevContainer setup complete"

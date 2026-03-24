#!/usr/bin/env bash
# DevContainer postCreateCommand -- runs once after container creation.
# This file is under CODEOWNERS review. Any changes require PR review.
set -euo pipefail

echo "[setup] Installing npm dependencies..."
npm ci

echo "[setup] Configuring git signing..."
node ./scripts/devcontainer/bootstrap-git-signing.mjs

echo "[setup] Installing Playwright browsers..."
npx playwright install --with-deps chromium

echo "[setup] DevContainer setup complete"

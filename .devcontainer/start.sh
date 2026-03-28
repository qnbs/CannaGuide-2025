#!/usr/bin/env bash
# DevContainer postStartCommand -- runs on every container start.
# This file is under CODEOWNERS review. Any changes require PR review.
set -euo pipefail

# Mocks are optional by default. If you want to skip starting them entirely, set:
#   CANNAGUIDE_START_MOCKS=0
# If you want Codespaces to fail when mocks are not healthy, set:
#   CANNAGUIDE_MOCKS_REQUIRED=1
START_MOCKS="${CANNAGUIDE_START_MOCKS:-1}"
MOCKS_REQUIRED="${CANNAGUIDE_MOCKS_REQUIRED:-0}"
MOCKS_TIMEOUT_SECONDS="${CANNAGUIDE_MOCKS_TIMEOUT_SECONDS:-30}"

if [ "$START_MOCKS" = "0" ]; then
  echo "[start] Skipping IoT mocks (CANNAGUIDE_START_MOCKS=0)"
  exit 0
fi

# Stop any leftover mock servers from previous sessions
pkill -f 'packages/iot-mocks/src/server.mjs' >/dev/null 2>&1 || true
pkill -f 'docker/tauri-mock/server.mjs' >/dev/null 2>&1 || true

# Start IoT mock servers in background (only if files exist)
STARTED_ANY=0

if [ -f "packages/iot-mocks/src/server.mjs" ]; then
  node packages/iot-mocks/src/server.mjs >/tmp/iot-mocks-3001.log 2>&1 & disown
  STARTED_ANY=1
else
  echo "[start] WARN: packages/iot-mocks/src/server.mjs not found; skipping ESP32 mock"
fi

if [ -f "docker/tauri-mock/server.mjs" ]; then
  node docker/tauri-mock/server.mjs >/tmp/iot-mocks-3002.log 2>&1 & disown
  STARTED_ANY=1
else
  echo "[start] WARN: docker/tauri-mock/server.mjs not found; skipping Tauri mock"
fi

if [ "$STARTED_ANY" -ne 1 ]; then
  echo "[start] WARN: No mock servers were started (missing files)."
  if [ "$MOCKS_REQUIRED" = "1" ]; then
    echo "[start] ERROR: Mocks are required (CANNAGUIDE_MOCKS_REQUIRED=1)."
    exit 1
  fi
  exit 0
fi

# Health-check loop (default max 30s, configurable)
HEALTHY=0
for i in $(seq 1 "$MOCKS_TIMEOUT_SECONDS"); do
  if curl -sf http://localhost:3001/health >/dev/null 2>&1 \
    && curl -sf http://localhost:3002/health >/dev/null 2>&1; then
    echo "[start] IoT mocks healthy"
    HEALTHY=1
    break
  fi
  echo "[start] Waiting for IoT mocks... ($i/$MOCKS_TIMEOUT_SECONDS)"
  sleep 1
done

if [ "$HEALTHY" -ne 1 ]; then
  echo "[start] WARN: IoT mocks did not become healthy within ${MOCKS_TIMEOUT_SECONDS}s"
  echo "[start]      ESP32 log: /tmp/iot-mocks-3001.log"
  echo "[start]      Tauri log: /tmp/iot-mocks-3002.log"
  if [ "$MOCKS_REQUIRED" = "1" ]; then
    echo "[start] ERROR: Mocks are required (CANNAGUIDE_MOCKS_REQUIRED=1)."
    exit 1
  fi
  exit 0
fi

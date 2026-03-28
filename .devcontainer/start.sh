#!/usr/bin/env bash
# DevContainer postStartCommand
# Entschärft: Kein 'set -e'
set -uo pipefail

START_MOCKS="${CANNAGUIDE_START_MOCKS:-1}"
MOCKS_REQUIRED="${CANNAGUIDE_MOCKS_REQUIRED:-0}"

if [ "$START_MOCKS" = "0" ]; then
  echo "[start] Skipping IoT mocks"
  exit 0
fi

# Stop any leftover mock servers from previous sessions
pkill -f 'server.mjs' >/dev/null 2>&1 || true

STARTED_3001=0
STARTED_3002=0

if [ -f "packages/iot-mocks/src/server.mjs" ]; then
  node packages/iot-mocks/src/server.mjs >/tmp/iot-mocks-3001.log 2>&1 & disown
  STARTED_3001=1
fi

if [ -f "docker/tauri-mock/server.mjs" ]; then
  node docker/tauri-mock/server.mjs >/tmp/iot-mocks-3002.log 2>&1 & disown
  STARTED_3002=1
fi

if [ "$STARTED_3001" -eq 1 ]; then
    echo "[start] Waiting for ESP32 Mock..."
    for i in {1..15}; do curl -sf http://localhost:3001/health >/dev/null && break || sleep 1; done
fi

if [ "$STARTED_3002" -eq 1 ]; then
    echo "[start] Waiting for Tauri Mock..."
    for i in {1..15}; do curl -sf http://localhost:3002/health >/dev/null && break || sleep 1; done
fi

echo "[start] Background tasks triggered successfully."
exit 0

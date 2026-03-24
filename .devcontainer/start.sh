#!/usr/bin/env bash
# DevContainer postStartCommand -- runs on every container start.
# This file is under CODEOWNERS review. Any changes require PR review.
set -euo pipefail

# Stop any leftover mock servers from previous sessions
pkill -f 'packages/iot-mocks/src/server.mjs' >/dev/null 2>&1 || true
pkill -f 'docker/tauri-mock/server.mjs' >/dev/null 2>&1 || true

# Start IoT mock servers in background
node packages/iot-mocks/src/server.mjs &disown
node docker/tauri-mock/server.mjs &disown

# Health-check loop (max 30s)
HEALTHY=0
for i in $(seq 1 30); do
    if curl -sf http://localhost:3001/health >/dev/null 2>&1 \
        && curl -sf http://localhost:3002/health >/dev/null 2>&1; then
        echo "[start] IoT mocks healthy"
        HEALTHY=1
        break
    fi
    echo "[start] Waiting for IoT mocks... ($i/30)"
    sleep 1
done

if [ "$HEALTHY" -ne 1 ]; then
    echo "[start] ERROR: IoT mocks failed to start within 30s"
    exit 1
fi

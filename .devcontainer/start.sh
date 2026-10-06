#!/usr/bin/env bash
# DevContainer postStartCommand.
# CANNAGUIDE_MOCKS_REQUIRED=1 fails the start when the IoT mock is not healthy.
# The script only signals the pid it started. It does not pattern-kill processes.
set -euo pipefail

START_MOCKS="${CANNAGUIDE_START_MOCKS:-1}"
MOCKS_REQUIRED="${CANNAGUIDE_MOCKS_REQUIRED:-0}"
PID_FILE="${CANNAGUIDE_MOCK_PID_FILE:-/tmp/cannaguide-iot-mock.pid}"
HEALTH_URL="${CANNAGUIDE_MOCK_HEALTH_URL:-http://localhost:3001/health}"
TIMEOUT_SECONDS="${CANNAGUIDE_MOCK_HEALTH_TIMEOUT:-15}"

stop_owned_pid() {
    if [ ! -f "$PID_FILE" ]; then
        return 0
    fi
    local old_pid
    old_pid="$(tr -cd '0-9' <"$PID_FILE" || true)"
    if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
        kill "$old_pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
}

if [ "$START_MOCKS" = "0" ]; then
    echo "[start] Skipping IoT mocks"
    exit 0
fi

if [ ! -f "docker/iot-mocks/src/server.mjs" ]; then
    echo "[start] IoT mock script is missing"
    if [ "$MOCKS_REQUIRED" = "1" ]; then
        exit 1
    fi
    echo "[start] WARN: mocks are optional; continuing without them"
    exit 0
fi

stop_owned_pid
node docker/iot-mocks/src/server.mjs >/tmp/iot-mocks-3001.log 2>&1 &
echo $! >"$PID_FILE"

healthy=0
for _ in $(seq 1 "$TIMEOUT_SECONDS"); do
    if curl -sf "$HEALTH_URL" >/dev/null; then
        healthy=1
        break
    fi
    sleep 1
done

if [ "$healthy" -ne 1 ]; then
    echo "[start] IoT mock did not become healthy at ${HEALTH_URL}"
    if [ "$MOCKS_REQUIRED" = "1" ]; then
        exit 1
    fi
    echo "[start] WARN: mocks are optional; continuing without a healthy mock"
    exit 0
fi

echo "[start] IoT mock is healthy (pid $(cat "$PID_FILE"))"

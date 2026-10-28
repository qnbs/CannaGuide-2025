#!/usr/bin/env bash
# MCP stdio fallback launcher (bash). It delegates to graphify-mcp-launcher.mjs
# so the graphify/mcp versions are pinned in exactly one place
# (scripts/graphify-pins.mjs); that launcher also checks uv and graph.json.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
exec node "$ROOT/scripts/graphify-mcp-launcher.mjs"

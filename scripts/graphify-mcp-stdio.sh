#!/usr/bin/env bash
# MCP-stdio Launcher für Cursor: graphify «serve» über uv (graphifyy + Paket «mcp»).
# Repo-Root liegt zwei Ebenen über diesem Script (scripts/).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRAPH_JSON="$ROOT/graphify-out/graph.json"
cd "$ROOT"
exec uv run --with graphifyy --with mcp python -m graphify.serve "$GRAPH_JSON"

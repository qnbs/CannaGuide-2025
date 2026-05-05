#!/usr/bin/env bash
# MCP-stdio Launcher für Cursor: graphify «serve» über uv (graphifyy + Paket «mcp»).
# Repo-Root liegt eine Ebene über diesem Script (scripts/).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRAPH_JSON="$ROOT/graphify-out/graph.json"
cd "$ROOT"

if ! command -v uv >/dev/null 2>&1; then
    echo "graphify-mcp: uv nicht im PATH. Install: https://docs.astral.sh/uv/getting-started/installation/" >&2
    exit 127
fi

if [[ ! -f "$GRAPH_JSON" ]]; then
    echo "graphify-mcp: fehlt $GRAPH_JSON — im Repo-Root ausführen: graphify update ." >&2
    exit 2
fi

exec uv run --with graphifyy --with mcp python -m graphify.serve "$GRAPH_JSON"

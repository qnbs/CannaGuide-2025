@echo off
setlocal enabledelayedexpansion

set ROOT=%~dp0..
set GRAPH_JSON=%ROOT%\graphify-out\graph.json

where uv >nul 2>nul
if errorlevel 1 (
    echo graphify-mcp: uv nicht im PATH. Install: https://docs.astral.sh/uv/getting-started/installation/ 1>&2
    exit /b 127
)

if not exist "%GRAPH_JSON%" (
    echo graphify-mcp: fehlt %GRAPH_JSON% - im Repo-Root ausfuehren: graphify update . 1>&2
    exit /b 2
)

cd /d "%ROOT%"
uv run --with graphifyy --with mcp python -m graphify.serve "%GRAPH_JSON%"
exit /b %errorlevel%

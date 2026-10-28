@echo off
rem MCP stdio fallback launcher (Windows). It delegates to
rem graphify-mcp-launcher.mjs so the graphify/mcp versions are pinned in exactly
rem one place (scripts\graphify-pins.mjs); that launcher also checks uv and graph.json.
cd /d "%~dp0.."
node "%~dp0graphify-mcp-launcher.mjs"
exit /b %errorlevel%

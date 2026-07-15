# Graphify/MCP Strategic Blueprint

> **Note (archived / historical):** This blueprint planned MDC-based extensions around
> `.cursor/rules/*.mdc` (MDC-to-graph bridge, rules explorer, MDC starter templates). With the move
> to Claude Code CLI, `.cursor/` and all `mdc:*` scripts (including `export-mdc-metadata`,
> `mdc:validate`) were removed; **the whole document is therefore obsolete** and is kept only as
> historical context. The MCP servers are now configured in `.mcp.json`.

## Scope

Dieses Dokument bereitet drei strategische Erweiterungen vor:

1. MDC -> Graph Bridge
2. Dev-Mode Rules Explorer
3. Starter-Templates fuer neue Repositories

## 1) MDC -> Graph Bridge (Vorbereitung)

### Ziel

Jede Regel aus `.cursor/rules/*.mdc` wird als Knoten `mdc:<id>` modelliert und mit betroffenen Modulen verknuepft.

### Minimaler Datenvertrag

- `rule_id`: Dateiname ohne `.mdc` (z. B. `850-mcp-and-prd`)
- `rule_mode`: always/auto/agent/manual
- `reviewed_at`: Datum aus `Last Reviewed`
- `target_globs`: optionale Globs
- `links`: abgeleitete Datei-/Modulbeziehungen

### Pilot-Schritte

- Script `scripts/export-mdc-metadata.mjs` (future work) erzeugt JSON.
- Import in Graphify als zusaetzliche Knoten/Kanten.
- Query-Pattern: "Welche Regel steuert Modul X?".

## 2) Dev-Mode Rules Explorer (Vorbereitung)

### Ziel

Maintainer sehen in einem Developer-Tab:

- aktive Regeldateien
- Rule-Hits pro geoeffneter Datei
- eingebettetes `graphify-out/graph.html`

### MVP-Backlog

- Read-only View fuer Rule-Liste + Metadaten
- Filter nach Bucket (`000-099`, `100-199`, ...)
- Link von Regel zu betroffenen Modulen

## 3) Template-Repos (Vorbereitung)

### Ziel

Zwei Starter-Repositories fuer Wiederverwendung:

- `cannaguide-mdc-starter`
- `cannaguide-graphify-mcp-starter`

### Mindestinhalt

- `.cursor/index.mdc` + Beispielregeln
- `.cursor/mcp.json` (Linux + Windows Fallback)
- `scripts/graphify-mcp-doctor.mjs`
- `docs/cursor-mdc-governance.md` als Startpunkt

## Delivery Guardrails

- Keine Secrets in Templates.
- Alle Beispielregeln mit valid/invalid example.
- CI muss `pnpm run mdc:validate` und `pnpm run graphify:mcp:doctor` enthalten.

# Graphify/MCP Strategic Blueprint

> **Hinweis (archiviert / historisch):** Dieses Blueprint plante MDC-basierte Erweiterungen rund um
> `.cursor/rules/*.mdc` (MDC-Graph-Bridge, Rules-Explorer, MDC-Starter-Templates). Mit der Umstellung
> auf Claude Code CLI wurden `.cursor/` und alle `mdc:*`-Skripte (inkl. `export-mdc-metadata`,
> `mdc:validate`) entfernt; **das gesamte Dokument ist damit hinfaellig** und dient nur noch als
> historischer Kontext. Aktuell sind die MCP-Server in `.mcp.json` konfiguriert.

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

# Cursor MDC Governance

Diese Richtlinie beschreibt die modulare Regel-Architektur in diesem Repository und wie sie token-effizient betrieben wird.

## Ziele

- Kontextsensitivität: Regeln nur dann laden, wenn sie relevant sind.
- Determinismus: klare, wiederholbare Agenten-Entscheidungen.
- Token-Effizienz: minimales Always-Apply-Set, domänenspezifische Auto-Attach-Regeln.

## Verzeichnisstruktur

- Manifest: `.cursor/index.mdc`
- Regeln: `.cursor/rules/*.mdc`
- Consciousness-Stream: `.notes/meeting_notes.md` (lokal, via `.gitignore` ausgeschlossen)

## Aktivierungsmodi

| Modus           | Frontmatter                         | Einsatz                              |
| --------------- | ----------------------------------- | ------------------------------------ |
| Always Apply    | `alwaysApply: true`                 | Nur globale Axiome, sehr kurz halten |
| Auto Attached   | `globs: ...` + `alwaysApply: false` | Datei-/Framework-spezifische Regeln  |
| Agent Requested | `description: ...` ohne `globs`     | Tiefe Spezialregeln bei Bedarf       |
| Manual          | ohne `description` und ohne `globs` | Nur per explizitem `@rule`           |

## Namensschema

- `001-099`: Core/Security
- `100-199`: Integrationen/APIs
- `200-299`: Architektur/Patterns
- `300-399`: UI/Styling
- `800-899`: Workflows/Testing

## Validierungs-Checkliste

- `description` im ATO-Stil, unter 120 Zeichen.
- `globs` ohne Leerzeichen nach Kommas, ohne Quotes.
- Jede Regel enthält `<example>` und `<example type="invalid">`.
- Regel bleibt unter 200 Zeilen.
- Jede Regel enthält `Last Reviewed: YYYY-MM-DD (Autor/Kontext)`.
- Automatisierte Prüfung: `pnpm run mdc:validate`.
- Kontext-E2E (CI-tauglich, ohne Cursor-CLI): `pnpm run mdc:e2e` — prüft Manifest/Index-Dateien und ruft `mdc:validate` ein.

## Projekt-spezifische Module (Auszug)

- `201-crdt-sync.mdc`: Yjs/CRDT Sync-Invarianten.
- `202-workerbus-concurrency.mdc`: WorkerBus/Concurrency-Verträge.
- `203-state-persistence.mdc`: IndexedDB/localStorage/Hydration.
- `204-pwa-cache-and-sw.mdc`: Service Worker und Cache-Update-Strategie.
- `110-i18n-integration.mdc`: i18n Key-Disziplin und Locale-Parität.
- `811-ci-first-local-workflow.mdc`: Low-End lokal, schwere Tests primär in GitHub CI.
- `870-mdc-engine-optimization.mdc`: Moduswahl (Always / Auto / Agent / Manual) und Token-Budget.

## MCP und Graphify

Vollständiger Leitfaden (Nachbau, MCP-Tools, Agenten-Playbook): [`docs/GRAPHIFY-COMPLETE-GUIDE.md`](./GRAPHIFY-COMPLETE-GUIDE.md).

- **Cursor IDE:** projektweit `/.cursor/mcp.json`. Graphify MCP ist **kein** Binär auf dem PATH namens `graphify-mcp`: Cursor startet **`bash scripts/graphify-mcp-stdio.sh`** mit **`cwd: ${workspaceFolder}`**. Das Script führt **`uv run --with graphifyy --with mcp python -m graphify.serve graphify-out/graph.json`** aus — **`uv`** muss installiert sein (z. B. über [uv installieren](https://docs.astral.sh/uv/getting-started/installation)); beim ersten Start lädt `uv` die Abhängigkeiten (einmalig Netzwerk).
- **Ohne Bash (Windows o. Ä.):** in `mcp.json` `"command": "uv"`, `"args": ["run","--with","graphifyy","--with","mcp","python","-m","graphify.serve","graphify-out/graph.json"]`, `"cwd": "${workspaceFolder}"` (wie im Shell-Script).
- **Referenz/Template:** `cursor_settings.json` im Repo-Root (zusätzliche Hinweise `projectContext` für Menschen/Agents; nicht jede Cursor-Version merged das automatisch).
- Graph-Refresh: `graphify update .`
- Arbeitskopie: `graphify-out/graph.json`, `graph.html`, `GRAPH_REPORT.md` versionieren; **`graphify-out/cache/` ist ignoriert** (siehe `.gitignore`).
- **Self-check (CLI):** `pnpm run graphify:mcp:doctor` — prüft Launcher, `graph.json`, `uv`, Import von `graphify` + `mcp`.
- Architekturfragen bevorzugt über:
    - `graphify query "<frage>"`
    - `graphify path "<A>" "<B>"`
    - `graphify explain "<konzept>"`

## MDC Versioning und Migration

Regelsets werden semantisch versioniert:

- **Major:** Breaking Rule Changes (aktiviertes Verhalten, Moduswechsel, entfernte Pflichtabschnitte).
- **Minor:** neue Regeln, neue Pflichtbeispiele, neue Guardrails ohne Bruch bestehender Flows.
- **Patch:** Formulierungs- oder Dokument-Verbesserungen ohne Verhaltensaenderung.

Migrationsablauf:

1. Version-Bump und Aenderungsgrund in PR beschreiben.
2. `pnpm run mdc:validate` und `pnpm run graphify:mcp:doctor` als Pflichtchecks.
3. Betroffene Regeln mit `Last Reviewed` aktualisieren.
4. Bei Major-Changes einen kurzen Migrationshinweis in `docs/next-session-handoff.md` ergaenzen.

## MCP Tool Usage Policy

- Vor Architekturantworten immer zuerst `graphify-out/GRAPH_REPORT.md` lesen.
- Danach query-first arbeiten (`query`/`path`/`explain`) und inferred edges bei kritischen Entscheidungen querpruefen.
- Windows-Fallback nutzen, wenn `bash` nicht verfuegbar ist (`scripts/graphify-mcp-stdio-windows.cmd`).
- Kein Commit von Secrets oder lokalen Zugangsdaten in `.cursor/mcp.json`.

## CI-nahe Qualitätsbefehle

- `pnpm run lint:full`
- `pnpm run typecheck`
- `pnpm run test:run`
- `pnpm run gate:push`

Hinweis: `gate:push` ist der beste lokale Preflight für grüne CI, kann aber je nach Umgebung länger laufen.

## Branch-Policy (Empfehlung)

- Inhaltliche Änderungen idealerweise über **`pnpm run pr:push`** (PR + CI-Gate), nicht per direktem Push auf `main`, sofern keine Admin-Ausnahme nötig ist.

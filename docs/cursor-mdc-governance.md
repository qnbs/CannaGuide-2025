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

| Modus | Frontmatter | Einsatz |
| --- | --- | --- |
| Always Apply | `alwaysApply: true` | Nur globale Axiome, sehr kurz halten |
| Auto Attached | `globs: ...` + `alwaysApply: false` | Datei-/Framework-spezifische Regeln |
| Agent Requested | `description: ...` ohne `globs` | Tiefe Spezialregeln bei Bedarf |
| Manual | ohne `description` und ohne `globs` | Nur per explizitem `@rule` |

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

## Projekt-spezifische Module (Auszug)

- `201-crdt-sync.mdc`: Yjs/CRDT Sync-Invarianten.
- `202-workerbus-concurrency.mdc`: WorkerBus/Concurrency-Verträge.
- `203-state-persistence.mdc`: IndexedDB/localStorage/Hydration.
- `204-pwa-cache-and-sw.mdc`: Service Worker und Cache-Update-Strategie.
- `110-i18n-integration.mdc`: i18n Key-Disziplin und Locale-Parität.

## MCP und Graphify

- MCP-Preparation: `cursor_settings.json`.
- Graph-Refresh: `graphify update .`
- Architekturfragen bevorzugt über:
  - `graphify query "<frage>"`
  - `graphify path "<A>" "<B>"`
  - `graphify explain "<konzept>"`

## CI-nahe Qualitätsbefehle

- `pnpm run lint:full`
- `pnpm run typecheck`
- `pnpm run test:run`
- `pnpm run gate:push`

Hinweis: `gate:push` ist der beste lokale Preflight für grüne CI, kann aber je nach Umgebung länger laufen.

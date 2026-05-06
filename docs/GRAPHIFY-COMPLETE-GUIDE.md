# Graphify: vollständiger Setup-Leitfaden (Repo, MCP, Agenten, Nachbau)

**Zielgruppe:** Menschen und **KI-Agenten**, die dieses Repository verstehen, Graphify betreiben oder **dieselbe Integrationsform in anderen Apps/Repositories** nachbauen wollen.

**Lesereihenfolge für Agenten (empfohlen):**

1. Abschnitt [Konzept](#1-konzept-und-grenzen) und [Artefakte](#3-artefakte-spezifikation).
2. Für **dieses Repo**: [CannaGuide-Konkretisierung](#5-kannaguide-2025-konkret).
3. Vor Architekturarbeit: [Agenten-Playbook](#9-agenten-playbook).
4. Für **Portierung**: [Nachbau-Checkliste](#11-nachbau-in-einem-anderen-repository-checkliste).

---

## Inhaltsverzeichnis

1. [Konzept und Grenzen](#1-konzept-und-grenzen)
2. [Komponenten im Überblick](#2-komponenten-im-überblick)
3. [Artefakte (Spezifikation)](#3-artefakte-spezifikation)
4. [Installation und Abhängigkeiten](#4-installation-und-abhängigkeiten)
5. [CannaGuide-2025 (konkret)](#5-kannaguide-2025-konkret)
6. [CLI-Workflow](#6-cli-workflow)
7. [Cursor und MCP (stdio-Server)](#7-cursor-und-mcp-stdio-server)
8. [Git-, Team- und Omni-Archive-Politik](#8-git--team--und-omni-archive-politik)
9. [Agenten-Playbook](#9-agenten-playbook)
10. [MCP-Tool-Referenz (graphify.serve)](#10-mcp-tool-referenz-graphifyserve)
11. [Nachbau in einem anderen Repository (Checkliste)](#11-nachbau-in-einem-anderen-repository-checkliste)
12. [Templates zum Kopieren](#12-templates-zum-kopieren)
13. [Troubleshooting](#13-troubleshooting)
14. [Verwandte Dokumentation im Repo](#14-verwandte-dokumentation-im-repo)

---

## 1. Konzept und Grenzen

**Graphify** baut aus dem **Quellcode** (primär AST-Analyse) einen **Wissensgraphen**: Knoten (Symbole, Dateien, Konzepte), Kanten (z. B. Aufrufe, Imports; teils als EXTRACTED, teils als INFERRED mit Confidence).

**Typischer Nutzen:**

- Architekturfragen („wie hängt Modul A mit B zusammen?“) ohne vollständiges Repo-Grep.
- Orientierung über **Communities** (Cluster) und **God Nodes** (hochgradige Knoten).
- Über **CLI** (`graphify query`, `path`, `explain`) oder **MCP** in der IDE strukturierte Antworten.

**Explizite Grenzen:**

- Der Graph ist ein **Modell**, keine Laufzeit-Wahrheit: dynamische Aufrufe, Reflection, Build-Zwischenprodukte können fehlen oder unscharf sein.
- **INFERRED**-Kanten können falsch positiv sein (im Report oft mit Confidence); immer mit Code-Lesung abgleichen.
- Graphify ist hier **Entwicklungs- und Agenten-Infrastruktur**, keine Pflicht zur **Laufzeit der Endnutzer-App** (kein Bundle-Zwang für die PWA).

---

## 2. Komponenten im Überblick

| Komponente                         | Rolle                                                                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **`graphify` CLI**                 | Auf der Maschine installiertes Kommandozeilenwerkzeug: `graphify update`, `query`, `path`, `explain`, ggf. `cursor install` für Regeln. |
| **`graphify-out/`**                | Ausgabeverzeichnis für **versionierte** Graph-Artefakte + optional **ignorierte** Cache-Daten.                                          |
| **`graph.json`**                   | NetworkX-kompatibles JSON (node-link), Eingabe für HTML-Visualisierung und MCP-Server.                                                  |
| **`GRAPH_REPORT.md`**              | Menschen- und agentenlesbarer Überblick (Communities, God Nodes, Statistik).                                                            |
| **`graph.html`**                   | Interaktive Visualisierung (lokal im Browser öffnen).                                                                                   |
| **`graphify-out/cache/`**          | AST-/Zwischencache — **nicht** versionieren (Repo-Bloat).                                                                               |
| **PyPI `graphifyy`**               | Python-Paket; enthält u. a. `python -m graphify.serve` für MCP.                                                                         |
| **PyPI `mcp`**                     | Python MCP SDK — wird für den stdio-Server **zusätzlich** zu `graphifyy` benötigt (`ImportError`, falls fehlend).                       |
| **`uv`**                           | Empfohlener Paket-/Runtime-Runner: isolierte Umgebung ohne globales `pip`-Gemisch.                                                      |
| **Cursor `.cursor/mcp.json`**      | Startet den MCP-Server-Prozess (stdio) für die IDE.                                                                                     |
| **Launcher-Shellscript**           | Einheitlicher Eintragspunkt: prüft `uv` und `graph.json`, ruft `uv run … graphify.serve` auf.                                           |
| **`pnpm run graphify:mcp:doctor`** | Projektscript: validiert Pfade, `uv`, Imports — **ohne** dass Cursor laufen muss.                                                       |

---

## 3. Artefakte (Spezifikation)

### 3.1 Verzeichnis `graphify-out/`

| Pfad                                   | Versionieren?                                | Zweck                                                                                   |
| -------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| `graphify-out/graph.json`              | **Ja**                                       | Kanonische Graph-Datei für Tools und MCP.                                               |
| `graphify-out/GRAPH_REPORT.md`         | **Ja**                                       | Kuratierte Lesespur für Agenten (God Nodes, Communities).                               |
| `graphify-out/graph.html`              | **Ja**                                       | Exploration per Browser.                                                                |
| `graphify-out/wiki/` (falls vorhanden) | **Ja**, falls vom Tool erzeugt und gewünscht | Alternative Navigation; Regel: wenn `wiki/index.md` existiert, dort zuerst orientieren. |
| `graphify-out/cache/`                  | **Nein**                                     | Regenerierbar; in `.gitignore` ausgeschlossen.                                          |

### 3.2 Semantik von `graph.json`

- Format: **node-link**-Graph (NetworkX `json_graph`), mit Kantenliste typischerweise unter dem Schlüssel `links` (Kompatibilitätsschicht im Server kann alternative Feldnamen tolerieren).
- Validierung: Datei muss **gültiges JSON** sein; bei Korruption meldet `graphify.serve` einen klaren Fehler auf stderr.

### 3.3 `GRAPH_REPORT.md`

Enthält typischerweise:

- Corpus-Größe und Kurzfazit „lohnt sich Struktur?“
- Knoten-/Kanten-/Community-Zahlen, Anteil EXTRACTED vs INFERRED
- **God Nodes** (high centrality / connectivity)
- **Communities** als Navigationshilfe
- ggf. „surprising connections“ (mit Vorsicht interpretieren)

Agenten:** Zuerst Report lesen**, dann gezielt CLI/MCP, dann Quellcode.

---

## 4. Installation und Abhängigkeiten

### 4.1 CLI `graphify` (global / PATH)

Installation je nach Upstream-Dokumentation von Graphify (z. B. über `uv tool install`, Pipx oder bereitgestelltes Install-Skript). Voraussetzung: Kommando `graphify` ist im Terminal verfügbar.

### 4.2 `uv` (empfohlen)

- Installationshinweis: [uv — Installation](https://docs.astral.sh/uv/getting-started/installation/)
- Wird für **MCP** genutzt als:  
  `uv run --with graphifyy --with mcp python -m graphify.serve <pfad/zu/graph.json>`

**Warum zwei `--with`?** Das Paket **`graphifyy`** bringt den Code für `graphify.serve`; das Paket **`mcp`** ist die MCP-Referenzimplementierung in Python und ist in der Tool-Umgebung oft **nicht** transitiv mitinstalliert — ohne `mcp` schlägt `import mcp` fehl.

### 4.3 Erste Graph-Erzeugung

Im **Repository-Root**:

```bash
graphify update .
```

Erzeugt/aktualisiert die Ausgaben unter `graphify-out/` (ohne LLM-Kosten für reinen AST-Update-Modus laut üblicher Graphify-Semantik).

---

## 5. CannaGuide-2025 (konkret)

Monorepo mit u. a. `apps/web`, `packages/*`. Graphify umfasst den gesamten Corpus unter dem gewählten Pfad (hier `.`).

**Relevante Dateien und Skripte:**

| Pfad                                   | Zweck                                            |
| -------------------------------------- | ------------------------------------------------ |
| `graphify-out/graph.json`              | Graph für MCP und Visualisierung                 |
| `graphify-out/GRAPH_REPORT.md`         | Agenten-Einstieg                                 |
| `graphify-out/graph.html`              | Graph-Exploration                                |
| `.gitignore` → `graphify-out/cache/`   | Cache ausschließen                               |
| `.cursor/mcp.json`                     | MCP-Server `graphify` für Cursor                 |
| `cursor_settings.json`                 | Gleicher MCP-Block + `projectContext` (Referenz) |
| `scripts/graphify-mcp-stdio.sh`        | MCP-Launcher (Preflight + `uv run … serve`)      |
| `scripts/graphify-mcp-doctor.mjs`      | Diagnose                                         |
| `package.json` → `graphify:mcp:doctor` | `pnpm run graphify:mcp:doctor`                   |

**Cursor-Regeln (Auszug):**

- `.cursor/index.mdc` — Kurzverweis MCP + Doctor
- `.cursor/rules/850-mcp-and-prd.mdc` — Graphify-Prozedur + Doctor
- `.cursor/rules/860-architecture-query-mode.mdc` — bei Bedarf `graphify update` vor Pfadanalyse

**Globale Teamregel (CLAUDE.md / Workspace):** Nach Session mit Codeänderungen **`graphify update .`** ausführen, um den Graph aktuell zu halten.

---

## 6. CLI-Workflow

```bash
# Graph neu extrahieren / aktualisieren (Repo-Root)
graphify update .

# Semantische / strukturelle Abfragen (Beispiele)
graphify query "<natürliche Frage oder Suchbegriffe>"
graphify path "<Konzept oder Symbol A>" "<Konzept oder Symbol B>"
graphify explain "<Begriff>"
```

**Wann ausführen?**

- Nach größeren Refactors, Umbenennungen, neuen Modulen.
- Wenn MCP/Report „leer“ oder veraltet wirkt.
- Vor aufwendigen Architektur-Antworten, wenn der Report älter als die letzten relevanten Commits ist.

---

## 7. Cursor und MCP (stdio-Server)

### 7.1 Funktionsweise

Cursor startet einen **Unterprozess**, der MCP über **stdin/stdout** spricht. Der Graphify-Server lädt **`graph.json`** beim Start und exponiert **Tools** (siehe [§10](#10-mcp-tool-referenz-graphifyserve)).

### 7.2 Workspace-Anforderung

In `.cursor/mcp.json` wird `"cwd": "${workspaceFolder}"` gesetzt. Der geöffnete Workspace-Ordner **muss das Repository-Root** sein (damit `scripts/graphify-mcp-stdio.sh` und `graphify-out/graph.json` relative Pfade korrekt auflösen).

### 7.3 Konfiguration in diesem Repo

Der Server-Key heißt **`graphify`**. Start über **`bash`** und Repo-Script — nicht über ein nicht existentes Binary `graphify-mcp` auf dem PATH.

Siehe projektnahe Kopien in:

- `.cursor/mcp.json`
- `cursor_settings.json`

### 7.4 IDE-Anzeige („bestmöglich“)

- In **Settings → MCP** den Eintrag **`graphify`** aktivieren.
- Nach Änderungen an `mcp.json`: MCP-Server **neu laden** oder Cursor **neu starten**.
- Wenn „rot“ / Fehler: zuerst **`pnpm run graphify:mcp:doctor`**, dann MCP-Log in Cursor lesen (häufig: `uv` fehlt, `graph.json` fehlt, erstes `uv run` ohne Netzwerk).

### 7.5 Windows / ohne Bash

Alternative: `"command": "uv"` mit `"args": ["run","--with","graphifyy","--with","mcp","python","-m","graphify.serve","graphify-out/graph.json"]` und gleichem `"cwd": "${workspaceFolder}"`.  
Git-Bash oder WSL können stattdessen das Bash-Script nutzen.

---

## 8. Git-, Team- und Omni-Archive-Politik

**Versionieren (Final Outputs):**

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.html`
- ggf. weiterer unter `graphify-out/` erzeugter **Report-/Wiki-Content**, der als „final“ gilt

**Nicht versionieren:**

- `graphify-out/cache/` — nur lokaler Beschleuniger; Regeneration mit `graphify update .`

**Rational:** Gleicher Graph für alle Maintainer; kein Cache-Bloat im Remote.

---

## 9. Agenten-Playbook

**Vor großen Architekturantworten:**

1. **`graphify-out/GRAPH_REPORT.md`** öffnen — God Nodes und Communities erfassen.
2. Falls `graphify-out/wiki/index.md` existiert — dort zuerst navigieren.
3. Für Konkordanz „X zu Y“: **`graphify path`** oder MCP **`shortest_path`** / **`query_graph`** bevorzugen gegenüber blindem Voll-Repo-Grep.
4. Nach **eigenen Codeänderungen in derselben Session:** `graphify update .` ausführen (Teamregel).

**Reihenfolge bei Widersprüchen:** Quellcode > Tests > Graph (INFERRED mit Vorsicht).

---

## 10. MCP-Tool-Referenz (`graphify.serve`)

Der Server registriert u. a. folgende Tools (Namen stabil aus der Graphify-Implementierung):

| Tool            | Zweck                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| `query_graph`   | BFS/DFS-Kontext ab gestarteten Knoten (Keywords aus `question`); Parameter: `mode`, `depth`, `token_budget`. |
| `get_node`      | Detail zu einem Knoten per Label oder ID.                                                                    |
| `get_neighbors` | Direkte Nachbarn inkl. Kanteninfos; optional `relation_filter`.                                              |
| `get_community` | Alle Knoten einer Community-ID.                                                                              |
| `god_nodes`     | Top-N hochvernetzte Knoten (Kernabstraktionen).                                                              |
| `graph_stats`   | Summenstatistik zu Knoten, Kanten, Communities, Confidence.                                                  |
| `shortest_path` | Kürzester Pfad zwischen zwei Begriffen; Parameter `max_hops`.                                                |

**Input-Schemas** sind im Server als JSON Schema aufgebaut; die IDE zeigt sie beim Tool-Aufruf an.

---

## 11. Nachbau in einem anderen Repository (Checkliste)

Allgemein auf **beliebige** Codebasen anwendbar (Sprachen gemäß Graphify-Unterstützung / Konfiguration):

1. **Graphify CLI installieren** und im Zielrepo `graphify update .` erfolgreich ausführen.
2. **`graphify-out/`** anlegen lassen; sicherstellen, dass **`graph.json`** und **`GRAPH_REPORT.md`** produziert werden.
3. **`.gitignore`** um `graphify-out/cache/` ergänzen (oder äquivalenten Cache-Pfad laut Tool-Output).
4. **Entscheidung versionieren:** `graph.json`, `GRAPH_REPORT.md`, `graph.html` committen (Teamstandard).
5. **`uv`** auf Entwicklermaschinen bereitstellen (Doku-Link ins README/CONTRIBUTING).
6. **Launcher-Script** kopieren/anpassen (Pfad zu `graph.json`, Repo-Root-Logik).
7. **Cursor** `.cursor/mcp.json` mit `cwd: ${workspaceFolder}` und Server-Key (z. B. `graphify`) ergänzen.
8. **Diagnose-Script** (optional Node) und **`package.json`-Script** für `graphify:mcp:doctor` übernehmen oder vereinfachen.
9. **Agentenregeln** ergänzen: „Report zuerst“, „nach Codeänderungen update“, „MCP/Tools bevorzugen“.
10. **Onboarding-Zeile** im README: `pnpm run graphify:mcp:doctor` / `npm run …`.

---

## 12. Templates zum Kopieren

### 12.1 `.cursor/mcp.json` (Linux/macOS mit Bash)

```json
{
    "mcpServers": {
        "graphify": {
            "command": "bash",
            "args": ["scripts/graphify-mcp-stdio.sh"],
            "cwd": "${workspaceFolder}"
        }
    }
}
```

### 12.2 Variante ohne Bash (`uv` direkt)

```json
{
    "mcpServers": {
        "graphify": {
            "command": "uv",
            "args": [
                "run",
                "--with",
                "graphifyy",
                "--with",
                "mcp",
                "python",
                "-m",
                "graphify.serve",
                "graphify-out/graph.json"
            ],
            "cwd": "${workspaceFolder}"
        }
    }
}
```

### 12.3 Minimal-Launcher (Shell) — Logikspezifikation

- `ROOT` = Parent des Verzeichnisses `scripts/` (ein Segment über `dirname`).
- `GRAPH_JSON` = `$ROOT/graphify-out/graph.json`
- Vor `exec`:
    - wenn `uv` nicht im PATH → Exit `127` mit Installationshinweis
    - wenn `GRAPH_JSON` fehlt → Exit `2` mit Hinweis `graphify update .`
- `exec uv run --with graphifyy --with mcp python -m graphify.serve "$GRAPH_JSON"`

(Eine Referenzimplementierung liegt in diesem Repo unter `scripts/graphify-mcp-stdio.sh`.)

### 12.4 `package.json` (Ausschnitt)

```json
{
    "scripts": {
        "graphify:mcp:doctor": "node ./scripts/graphify-mcp-doctor.mjs",
        "mdc:validate": "node ./scripts/validate-mdc-rules.mjs",
        "mdc:e2e": "node ./scripts/mdc-context-e2e.mjs",
        "mdc:export-metadata": "node ./scripts/export-mdc-metadata.mjs"
    }
}
```

### 12.5 CI-Automatisierung (dieses Repo)

| Komponente                              | Zweck                                                                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`              | Installiert `uv` (fuer Doctor), dann `pnpm run mdc:e2e` und `pnpm run graphify:mcp:doctor` vor Typecheck/Tests.                                            |
| `.github/workflows/graphify-update.yml` | Auf `main` (Push, woechentlich, manuell): `uv run --with graphifyy python -m graphify update .`, committet Aenderungen unter `graphify-out/` (ohne Cache). |
| `scripts/graphify-mcp-doctor.mjs`       | Prueft u. a. JSON-Schema-Aehnlichkeit (`nodes` + `links`/`edges`), Inferred-Confidence-Schwelle, Graph-Freshness vs. letzter Git-Commit.                   |

**Hinweis:** Schwere E2E- und Playwright-Laeufe sind bewusst **CI-first**; lokal reichen `mdc:e2e`, `graphify:mcp:doctor` und Zieltests.

---

## 13. Troubleshooting

| Symptom                         | Häufige Ursache                                  | Maßnahme                             |
| ------------------------------- | ------------------------------------------------ | ------------------------------------ |
| MCP rot / Server startet nicht  | `uv` fehlt                                       | `uv` installieren; PATH prüfen       |
| Fehler zu `mcp` Modul           | Paket nicht im `uv run`                          | `--with mcp` nicht vergessen         |
| Graph nicht gefunden            | Workspace nicht Repo-Root oder kein `graph.json` | Ordner öffnen; `graphify update .`   |
| Sehr langsamer erster Start     | `uv` lädt Wheel-Cache                            | Normal; einmalig; Netzwerk erlauben  |
| Leere / seltsame Tool-Antworten | Graph veraltet                                   | `graphify update .`                  |
| Zu viele falsche Kanten         | INFERRED-Überinterpretation                      | Mit EXTRACTED und Source vergleichen |
| `commitlint` / Hooks            | nicht Graphify-spezifisch                        | Separates CI-Thema                   |

**Sanity-Check (dieses Repo):**

```bash
pnpm run graphify:mcp:doctor
```

Erwartung: nur Zeilen mit Präfix `ok   ` (keine `fail`-Zeilen).

---

## 14. Verwandte Dokumentation im Repo

- `docs/cursor-mdc-governance.md` — MCP-Kurzblock im Kontext Cursor-Regeln
- `CONTRIBUTING.md` — MCP-Hinweis für Mitwirkende
- `.cursor/index.mdc`, `.cursor/rules/index.mdc`, `.cursor/rules/850-mcp-and-prd.mdc`, `.cursor/rules/851-mcp-windows-fallback.mdc`, `.cursor/rules/860-architecture-query-mode.mdc`, `.cursor/rules/880-graphify-query-best-practices.mdc`
- `docs/graphify-mcp-strategic-blueprint.md` — Vorbereitung Bridge/UI/Starter-Templates
- Workspace-/Teamhinweis `CLAUDE.md` (graphify-out Politik)

---

**Versionshinweis:** Dieses Dokument beschreibt die zum Erstellungszeitpunkt im Repository vorliegende Integrationsform (Graphify + `uv` + Cursor MCP). CLI-Flags und Paketnamen können sich mit Upstream-Versionen ändern — bei Upgrades zuerst die offizielle Graphify-Dokumentation und die Fehlermeldungen von `graphify.serve` konsultieren.

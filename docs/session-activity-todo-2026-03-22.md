# Session Activity TODO (Next Iteration Anchor, 2026-03-22)

## Zielbild

Die naechsten Sitzungen sollen den Sonar-Restbacklog in stabilen, testbaren Clustern abbauen, ohne UI-Regressionsrisiko in Strains/Plants/Settings.

## Priorisierte Arbeitscluster

1. GenealogyView Sonar-Fixes

- offene readability/a11y/maintainability-smells identifizieren und beheben
- Interaktionspfade (node focus/select/toggle) mit Regressionstests absichern

1. Plants UI-Smells Cluster

- detail tabs (interaction/readability) weiter bereinigen
- potentielle keyboard/focus regressions aktiv gegenpruefen

1. db/crypto Reliability Cluster

- error-normalization und recovery guards konsolidieren
- stringification-/fallback-smells (unknown errors) auf sichere Pattern bringen

1. Weitere Sonar-Restcluster

- verbleibende Issues nur nach aktuellem Sonar-Run priorisieren
- low-risk Konventionswellen (nur wenn ohne Risiko) gesammelt abarbeiten

1. Security-Warteschlange (Dependabot + CodeQL)

- abgeschlossen: offene Dependabot-Alerts = 0
- abgeschlossen: offene Code-Scanning-Alerts = 0
- fortlaufend: taeglichen Snapshot in `docs/security-alerts-status.md` ueberwachen

1. Security-Automation Betrieb

- Workflow-Lauf `security-alerts-handoff.yml` regelmaessig pruefen (Run-Status + Commit-Output)
- bei Alert-Anstieg sofort neue Remediation-Welle starten und im Handoff dokumentieren
- manuelle Trigger als Release-Gate vor groesseren Merge-Wellen nutzen

## Qualitaets-Gates pro Welle (verbindlich)

- `node scripts/lint-changed.mjs`
- `npx tsc --noEmit`
- `npx prettier --check <geaenderte Dateien>`
- fokussierte Vitest-Suites fuer betroffene Views/Flows

## Liefer- und Dokumentationsregeln

- in groesseren Batches arbeiten, dann commit+push
- Sonar-Handoff-Review/TODO nur bei echten Meilenstein-Batches aktualisieren
- bei UI-Interaktionsaenderungen immer mindestens einen zielgerichteten Regressionstest ergaenzen

## Definition of Done pro Cluster

- Sonar-Befunde des Clusters geschlossen oder klar als Restpunkt dokumentiert
- keine neuen Type-/Lint-/Formatfehler
- relevante Regressionstests gruen
- Doku-Deltas im Handoff nachvollziehbar

## Security-Delta (umgesetzt 2026-03-22)

- `sw.js` + `public/sw.js`: URL-Protokollpruefung auf strikte Allowlist (`http:`/`https:`) gehaertet.
- `services/migrationLogic.ts`: `deepMergeSettings` gegen Prototype-Pollution gehaertet.
- `vite-plugin-imagemin` entfernt (vulnerable Transitivkette eliminiert).
- `package.json` Overrides gesetzt: `serialize-javascript=7.0.4`, `tmp=0.2.5`.
- `npm audit --json` aktuell: 0 vulnerabilities.

## Delta-Update: Service-Reliability/Testausbau (heute fortgesetzt)

Abgeschlossen:

- `services/cryptoService.test.ts` neu erstellt und stabil im Gate verankert.
- `services/dbService.test.ts` neu erstellt und in mehreren Wellen erweitert.
- Error-/Guard-Pfade fuer `dbService.searchIndex`, `optimizeSimulationForPersistence`, `getArchivedPlantLogs`, `addImage` (Warnschwelle/Compression-Fallback) abgedeckt.
- `services/cryptoService.ts` BufferSource-Typisierung gehaertet.
- `services/dbService.ts` unsafe casts in Search-/Entity-Pfaden reduziert.

Aktueller Fokus (naechste Welle):

1. Weitere Service-Reliability-Cluster ausserhalb `dbService` priorisieren (insb. klar reproduzierbare Fallback-/Error-Pfade).
1. Sonar-Restscan gegen aktuellen Stand erneut clustern (nach den neuen Tests).

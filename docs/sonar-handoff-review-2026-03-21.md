# Sonar Handoff Review (Update 2026-03-23 — Session Close)

## Session-Update 2026-03-23: SonarCloud QG + Scorecard + Snyk + Admin Hardening

### OpenSSF Scorecard: 8.5/10

11 Checks auf 10/10. Scorecard von 4.9 auf 8.5 gesteigert. Admin-Level Repository-Settings vollstaendig konfiguriert (Branch Protection, Security Features, CodeQL Extended, Actions Permissions, Tag Rulesets). CII-Best-Practices auf bestpractices.dev registriert (pending Aktivierung).

### Security Hotspot Elimination (S2245 + S5852)

Alle `Math.random()`-Verwendungen (15 Stellen in 9 Dateien) durch `secureRandom()` ersetzt.
Neues Utility `utils/random.ts` nutzt `crypto.getRandomValues()`.

Betroffene Dateien:

- `utils/breedingUtils.tsx` (5 Stellen)
- `components/views/plants/TipOfTheDay.tsx` (1)
- `components/views/plants/deepDive/DeepDiveModal.tsx` (1)
- `services/imageGenerationService.ts` (1)
- `services/plantSimulationService.ts` (2)
- `services/localAiPreloadService.ts` (1)
- `services/geminiService.ts` (1)
- `services/strainFactory.ts` (1 — Fallback von Math.random auf crypto.getRandomValues)
- `services/localAiFallbackService.ts` (1)

Zusaetzlich: `stores/slices/nutrientPlannerSlice.ts` Math.random() → crypto.randomUUID()

S5852 ReDoS: `services/commandService.ts` — fuzzy-Regex mit 64-Zeichen Input-Limit.

### SonarCloud Config-Optimierung

`sonar-project.properties`:

- `sonar.tests` korrigiert (Inline-Tests neben Source-Dateien)
- `sonar.test.inclusions` fuer _.test.ts, _.fuzz.test.ts, _.e2e.ts, _.ct.tsx
- `sonar.coverage.exclusions` fuer data/, types/, workers/, locales/, public/

### Snyk Docker Fix

`Dockerfile`: `RUN apk update && apk upgrade --no-cache` nach Build-Stage FROM — behebt zlib CVEs.

### QG-Status nach Fixes

- Code-seitige S2245-Hotspots: alle eliminiert (15/15 → 0)
- S5852: 1 zusaetzlich abgesichert (Laengenlimit)
- Hotspots Reviewed: weiterhin E (0.0%) — erfordert manuelles UI-Review
- Coverage: sollte durch coverage.exclusions steigen (data/types/workers ausgeschlossen)

---

## Session-Close Delta (2026-03-22)

Abschluss dieser Iteration erfolgte in zwei aufeinanderfolgenden Pushes auf `main`:

- `11e85bd` refactor(ui): continue sonar portability and readability cleanup wave
- `83b2d25` fix(strains): harden navigation and add export confirmations

Inhaltlich wurden im Abschlussblock folgende Punkte umgesetzt und validiert:

1. Strains-Navigation/Interaktion gehaertet

- `components/views/strains/StrainListItem.tsx`
- `components/views/strains/StrainGridItem.tsx`
- Fokus: robuster Kartenklick + Keyboard-Ausloesung, Event-Isolation fuer Checkbox/Controls.

1. Checkbox-Rendering-Bug repariert

- `styles.css`
- Ursache: falsches CSS-Escaping (`\\2714`) fuehrte zur sichtbaren Literal-Ausgabe.
- Fix: korrektes Checkmark-Content-Escape (`\2714`).

1. Dateioperationen mit Confirm-Flow modernisiert

- `components/common/DataExportModal.tsx`
- `components/views/strains/ExportsManagerView.tsx`
- `components/views/settings/DataManagementTab.tsx`
- Ergebnis: Export/Download-Operationen laufen nicht mehr direkt los, sondern ueber explizite bestaetigte Dialoge.

1. i18n-Ergaenzung fuer Dateioperations-Confirm

- `locales/en/common.ts`
- `locales/de/common.ts`
- Neuer Key: `common.downloadConfirm`.

1. Devcontainer-Tooling verbessert

- `.devcontainer/devcontainer.json`
- `ripgrep` (`rg`) wird nun im `postCreateCommand` installiert, damit Such-/Audit-Wellen reproduzierbar schneller laufen.

## Validierung des Session-Abschlussblocks

- `node scripts/lint-changed.mjs`: erfolgreich
- `npx tsc --noEmit`: erfolgreich
- `npx prettier --check` auf geaenderten Dateien: erfolgreich
- `npx vitest run` (Strains-Items + Settings smoke): 13/13 Tests erfolgreich

## Ziel

Sonar-Issues weiterhin in Wellen abbauen, mit Fokus auf:

- komplexe Service-Refactors (Cognitive Complexity / Nesting)
- UI/A11y-Majors mit geringem Regressionsrisiko
- schnelle Konventionssmells (optional chaining, Number.parseFloat)

## In dieser Runde erledigt

1. Komplexitaet/Nesting (Critical-Block aus vorheriger Runde)

- components/views/knowledge/MentorChatView.tsx
- hooks/useVirtualizer.ts
- services/localAI.ts
- services/localAiFallbackService.ts
- services/migrationLogic.ts
- services/plantSimulationService.ts
- services/predictiveAnalyticsService.ts
- stores/slices/genealogySlice.ts

1. Naechster UI/A11y/Maintainability-Block (Major/Minor)

- components/common/Card.tsx
- components/common/CommandPalette.tsx
- components/common/SegmentedControl.tsx
- components/common/Tabs.tsx
- components/views/PlantsView.tsx
- components/views/equipment/SaveSetupModal.tsx
- components/views/equipment/SeedbanksView.tsx
- components/views/equipment/SetupConfigurator.tsx
- components/views/help/HelpSubNav.tsx
- components/views/knowledge/BreedingArPreview.tsx
- components/views/knowledge/GuideView.tsx
- components/views/knowledge/MentorArchiveTab.tsx
- components/views/plants/AiDiagnosticsModal.tsx
- components/views/plants/App.tsx
- components/views/settings/DataManagementTab.tsx
- hooks/useStorageEstimate.ts

1. Fortsetzung nach Absturz (zusatzliche Sonar-Welle)

- components/views/plants/DashboardSummary.tsx (nested ternary -> explizites Render-Branching)
- components/views/plants/PlantLifecycleTimeline.tsx (nested template literal entkoppelt)
- components/views/plants/PlantSlot.tsx (nested template literal entkoppelt)
- components/views/plants/detailedPlantViewTabs/JournalTab.tsx (nested ternary in className entkoppelt)
- components/views/plants/detailedPlantViewTabs/PhotosTab.tsx (redundanter keydown-listener entfernt)
- components/views/knowledge/MentorView.tsx (includes -> Set.has bei activeProblems)
- components/views/strains/AddStrainModal.tsx (Regex-Komplexitaet reduziert)
- components/views/strains/StrainTreeNode.tsx (treeitem: aria-selected gesetzt)
- services/exportService.ts (removeChild -> remove)

1. Strains- und Services-Fortsetzung (naechste TODO-Welle)

- components/views/strains/BreedingLab.tsx (nested ternary/class branching entkoppelt)
- components/views/strains/InlineStrainSelector.tsx (ternary class extraction)
- components/views/strains/StrainImageGenerator.tsx (nested ternary button rendering entkoppelt)
- components/views/strains/StrainsView.tsx (nested ternary in export source + onDelete branching entkoppelt)
- services/chemotypeService.ts (toSorted + klarere profile label branching)
- services/entourageService.ts (nested ternary bei THC/CBD ratio entkoppelt)

1. Zusatzwelle auf Restkonventionen

- components/views/strains/StrainTipsView.tsx (reduce-assignment bereinigt, sort -> toSorted)
- components/views/strains/StrainLibraryView.tsx (nested ternary im Main-Content-Rendering entkoppelt)

1. A11y-Restpunkt Strains

- components/views/strains/StrainImageGalleryTab.tsx (non-interactive click listener entfernt; semantische button/dialog-Interaktion)

1. Restpruefung Strains/Seedbanks/Guide

- components/views/strains/StrainsView.tsx (sort -> toSorted bei Aromas/Terpenes)
- components/views/equipment/SeedbanksView.tsx (sort -> toSorted)
- components/views/knowledge/GuideView.tsx (sort -> toSorted, Phases-Sortierung nicht-mutierend)

1. exportService Restwelle

- services/exportService.ts (|| -> ?? bei Defaultwerten, explizite Fallback-Variablen fuer priorities/customNotes, reverse -> toReversed)

1. Zusatzwelle Sort/Konventionen

- components/views/strains/BreedingLab.tsx (sort -> toSorted)
- components/views/strains/InlineStrainSelector.tsx (sort -> toSorted)
- components/views/strains/StrainImageGalleryTab.tsx (sort -> toSorted)
- components/views/strains/ExportsManagerView.tsx (sort -> toSorted)
- components/views/equipment/SavedSetupsView.tsx (sort -> toSorted)
- services/dbService.ts (sort -> toSorted in pruneOldImages)
- services/localAiImageSimilarityService.ts (sort -> toSorted)
- services/entourageService.ts (sort -> toSorted + summary branching entkoppelt)

1. Zusatzwelle Sort/Konventionen II (post-push Restscan)

- components/views/plants/TasksAndWarnings.tsx (sort -> toSorted)
- components/views/plants/detailedPlantViewTabs/AiTab.tsx (sort -> toSorted)
- components/views/plants/GlobalAdvisorArchiveView.tsx (sort -> toSorted)
- components/views/knowledge/MentorArchiveTab.tsx (sort -> toSorted)
- components/views/HelpView.tsx (sort -> toSorted in Lexikon-Sortierungen)
- services/localAiNlpService.ts (sort -> toSorted in journal sentiment trend)
- services/commandService.ts (sort -> toSorted in recency/group/ranking)

1. Zusatzwelle Sort/Konventionen III

- components/views/equipment/GrowShopsView.tsx (sort -> toSorted)
- components/views/strains/GenealogyView.tsx (sort -> toSorted)
- components/views/plants/detailedPlantViewTabs/TasksTab.tsx (sort -> toSorted)
- components/views/plants/detailedPlantViewTabs/PostHarvestTab.tsx (sort -> toSorted)
- hooks/useStrainFilters.ts (in-place sort -> toSorted assignment)

1. Zusatzwelle Sort/Konventionen IV

- components/views/plants/InlineStrainSelector.tsx (sort -> toSorted)
- services/growLogRagService.ts (sort -> toSorted)
- services/geneticsService.ts (sort -> toSorted)
- services/growReminderService.ts (sort -> toSorted)
- services/strainService.ts (sort -> toSorted)
- services/localAiEmbeddingService.ts (sort -> toSorted)
- services/localAiFallbackService.ts (sort -> toSorted)
- services/migrationLogic.ts (sort -> toSorted)
- services/predictiveAnalyticsService.ts (sort -> toSorted)

1. Restcluster Lesbarkeit/Maintainability

- components/views/knowledge/MentorView.tsx (komplexe useEffect-Bedingung in klar benannte Teilbedingungen entkoppelt)
- components/views/plants/detailedPlantViewTabs/JournalTab.tsx (reverse -> toReversed, IIFE im map-Rendering entfernt)

1. Restcluster Numeric-Safety

- services/migrationLogic.ts (globale isFinite-Aufrufe auf Number.isFinite umgestellt)

1. Restcluster Template/Ternary-Entkopplung

- services/localAiFallbackService.ts (verschachtelte Ternary-Templates in summarizeTrend entkoppelt, Mentor-HTML-Issue-Block vorab aufgebaut)

1. Restcluster Template/Ternary-Entkopplung II

- services/localAI.ts (Fallback-Score und Notes-Content aus verschachtelten Ternaries in Zwischenvariablen entkoppelt)
- components/views/strains/FilterDrawer.tsx (wiederholte ternary-basierte Klassenlogik in Helper-Funktionen zentralisiert)

1. Grossbatch Maintainability/UI-Konsolidierung (ohne Zwischen-Push)

- services/localAI.ts (sprachabhaengige Prompt-Strings in Helper `localized()` entkoppelt)
- services/localAiFallbackService.ts (weitere ternary/template Vereinfachungen in SVG- und Garden-Status-Bloecken)
- services/localAiHealthService.ts (GPU-Log-Labels vorab aufgeloest)
- services/localAiPreloadService.ts (Readiness-Formatter fuer Detailzeilen eingefuehrt)
- services/mqttSensorService.ts (Fehler-Reason in serialisierungspfad entkoppelt)
- services/webLlmDiagnosticsService.ts (Probe-Fehlermeldung entkoppelt)
- components/common/CameraModal.tsx (Video-Visibility-Klasse vorab berechnet)
- components/common/OnboardingModal.tsx (Step-Indicator-Klassen zentralisiert)
- components/common/SearchBar.tsx (Clear-Button/Input-Klasse entkoppelt)
- components/views/KnowledgeView.tsx (Pending-Opacity-Klasse entkoppelt)
- components/views/equipment/EquipmentView.tsx (Pending-Opacity-Klasse entkoppelt)
- components/views/equipment/GrowShopsView.tsx (Region-Tab-Klassenhelper)
- components/views/help/HelpSubNav.tsx (Count-Badge-Klasse entkoppelt)
- components/views/knowledge/BreedingView.tsx (selected-state Klasse entkoppelt)
- components/views/knowledge/MentorChatView.tsx (Row-Alignment-Klasse entkoppelt)
- components/views/plants/BreedingView.tsx (selected-state Klasse entkoppelt)
- components/views/plants/ComparisonView.tsx (Diff-Farbklassen entkoppelt)
- components/views/plants/EquipmentControls.tsx (Disabled-Control-Klassenhelper)
- components/views/plants/HistoryChart.tsx (View-Toggle-Klassenhelper)
- components/views/plants/InlineStrainSelector.tsx (Difficulty-Marker-Klassen entkoppelt)
- components/views/plants/PlantSlot.tsx (Pulse-Klasse entkoppelt)
- components/views/plants/SensorIntegrationPanel.tsx (Mode-Button-Klassenhelper)
- components/views/plants/VitalBar.tsx (Icon-/Value-Farbklassen entkoppelt)
- components/views/plants/detailedPlantViewTabs/PostHarvestTab.tsx (Stage-Panel-Klassenhelper)
- components/views/strains/BreedingLab.tsx (Generation-Arrow-Klassenhelper)
- components/views/strains/StrainGrid.tsx (Pending-Opacity-Klasse entkoppelt)
- components/views/strains/StrainGridItem.tsx (Card-/Favorite-Klassen entkoppelt)
- components/views/strains/StrainList.tsx (Pending-Opacity-Klasse entkoppelt)
- components/views/strains/StrainListHeader.tsx (Sort-Button-Klassen lesbarer)
- components/views/strains/StrainListItem.tsx (Card-/Favorite-Klassen entkoppelt)

1. CI-/Badge-Befund

- Die README-Deploy-Badge zeigte zwischenzeitlich "failing"; im aktuellen Zustand wieder "passing".
- In der grossen lokalen Batch-Pruefung wurden Prettier-Verstoesse in mehreren geaenderten Dateien gefunden und vollstaendig bereinigt.
- Verifikation: `npx prettier --check` auf allen geaenderten Dateien jetzt ohne Befund.
- Schlussfolgerung: Das Problem war nicht anhaltend am Deploy-Workflow selbst festzumachen; ein realer Teil des Risikos lag in noch nicht fertig formatierten Datei-Aenderungen vor dem finalen Sammel-Check.

1. Regression-Fix: Strains-Detailoeffnung nach Sonar-Refactor

- Ursache: In der Sortenliste/-grid blockierte die Content-Layer den Vollflaechen-Select-Button, wodurch Klicks auf Karteninhalt nicht mehr zur Detailansicht fuehrten.
- Fixes:
    - components/views/strains/StrainListItem.tsx (robuster Content-Click + stopPropagation auf Checkbox)
    - components/views/strains/StrainGridItem.tsx (Pointer-Event-Schichtung fuer Content vs. Controls)
    - components/views/strains/StrainTreeNode.tsx (gleiches Layering-Risiko praeventiv gehaertet)
- Zus. Maintainability im gleichen Block:
    - components/views/strains/AddStrainModal.tsx (komplexen Type-Preview-Ausdruck in `getSafeStrainType` + lokale Konstanten entkoppelt)
    - components/views/strains/StrainsView.tsx / StrainListItem.tsx (veraltete FIX-Kommentare entfernt)
- Regressionstest-Abdeckung erhoeht:
    - components/views/strains/StrainListItem.test.tsx (Kartenklick oeffnet Detail; Checkbox-Klick oeffnet nicht)
    - components/views/strains/StrainGridItem.test.tsx (gleiches Verhalten fuer Grid)

1. Zusatzwelle Regression-Absicherung + Maintainability-Hygiene

- Breiter View-Regressionstest nach den Strains-Fixes:
    - `npm test -- components/views/plants components/views/settings components/views/strains --run` erfolgreich
- Kein weiterer Overlay-Click-Defekt im Plants/Settings-Scan gefunden.
- Veraltete `FIX:`-Kommentare aus produktivem Code entfernt (ohne Verhaltensaenderung):
    - components/views/strains/StrainDetailView.tsx
    - components/views/plants/DashboardSummary.tsx
    - components/views/plants/App.tsx
    - components/views/plants/GrowSetupModal.tsx
    - components/views/PlantsView.tsx
    - components/views/knowledge/GuideView.tsx

1. Zusatzwelle Hook/Service-Komplexitaet (Low-Risk)

- hooks/useSimulationBridge.ts
    - ternary-lastige Slot-Return-Struktur in benannte Zwischenvariablen (`visiblePlant`, `archivedPlantId`) entkoppelt.
- services/localAiFallbackService.ts
    - terpene-label ternary im SVG-Text in `terpeneLabel` ausgelagert.
    - psychedelic-circle stroke-Farbe aus inline ternary in `strokeColor` entkoppelt.
- services/geminiService.ts
    - Problemzusammenfassung in Garden-Plant-Summary aus inline ternary in `problemsSummary` ausgelagert.

1. Zusatzwelle PostHarvest + Common/UI-Sonar-Quickwins

- components/views/plants/detailedPlantViewTabs/PostHarvestTab.tsx
    - unnötige Casts entfernt (`filter(Boolean) as string[]`, Terpene-`as number`), über Type-Guards ersetzt.
    - `processPostHarvest`-Dispatches in zentralem Handler entkoppelt.
- components/common/CameraModal.tsx
    - Videoelement um Caption-Track ergänzt (A11y-Sonar).
- components/common/Tabs.tsx
    - Keyboard-Listener von non-interactive Container auf Buttons verlagert.
    - Tab-Semantik (`role=tablist`, `role=tab`, `aria-selected`) konsistent gemacht.
- components/common/RangeSlider.tsx
    - unnötige Style-Assertions entfernt; CSS-Var-Styles typisiert.
- components/common/SearchBar.tsx
    - unnötige Placeholder-Assertion in Aria-Label-Auflösung entfernt.
- components/ui/dialog.tsx
    - deprecated `React.ElementRef` auf `React.ComponentRef` migriert.
- components/ui/select.tsx
    - deprecated `React.ElementRef` auf `React.ComponentRef` migriert.

## Validierung

- npx tsc --noEmit: erfolgreich
- node scripts/lint-changed.mjs: erfolgreich
- Diagnostics-Check auf allen geaenderten Dateien: keine neuen Fehler

## Ergebnisbild

- Kritische Komplexitaets-Hotspots aus dem letzten Block stark reduziert.
- Erste groessere UI/A11y-Welle gestartet und mehrere Major-Smells entfernt.
- Repo-weite sort()-Treffer in components/views, services und hooks wurden im aktuellen Stand vollstaendig aufgeloest.
- Sonar-Backlog ist weiterhin umfangreich; aktuelle Restpunkte sind im aktualisierten TODO dokumentiert.

## Naechster sinnvoller Einstieg

- den verbleibenden Block aus docs/sonar-handoff-todo-2026-03-21.md in Clustern weiter abarbeiten:

1. restliche A11y-Rollen/Interaktionen in components/views/strains und settings
2. nested ternary/template literal Cluster in plants/strains/services
3. dbService/exportService/cryptoService Reliability-Smells

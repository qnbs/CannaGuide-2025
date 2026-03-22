# Sonar Handoff TODO (Update 2026-03-22)

Basis: neue Sonar-Liste aus dem letzten Nutzerblock (100 von 172 angezeigt).
Prioritaet: Major/Critical zuerst, dann Minor-Konventionen.

## A. In dieser Runde bereits erledigt (aus TODO entfernt)

- components/common/Card.tsx
- components/common/CommandPalette.tsx
- components/common/SegmentedControl.tsx
- components/common/Tabs.tsx
- components/views/PlantsView.tsx (Ternary/Key-Refactor gestartet)
- components/views/equipment/SaveSetupModal.tsx
- components/views/equipment/SeedbanksView.tsx
- components/views/equipment/SetupConfigurator.tsx
- components/views/help/HelpSubNav.tsx
- components/views/knowledge/BreedingArPreview.tsx
- components/views/knowledge/GuideView.tsx (Teilfix)
- components/views/knowledge/MentorArchiveTab.tsx
- components/views/plants/AiDiagnosticsModal.tsx
- components/views/plants/App.tsx
- components/views/settings/DataManagementTab.tsx
- hooks/useStorageEstimate.ts

## B. Neu aufgenommener Rest-Backlog aus letzter Nutzerliste

1. Common / Accessibility / Lesbarkeit

- components/views/equipment/SeedbanksView.tsx: Restpruefung nach Teilfix
- components/views/settings/SettingsSubNav.tsx: erledigt (tabIndex auf tablist)
- components/views/strains/StrainToolbar.tsx: erledigt (native select/option)

1. Plants-Views Cluster

- components/views/plants/DashboardSummary.tsx: erledigt
- components/views/plants/HistoryChart.tsx: erledigt (Set.has)
- components/views/plants/PlantLifecycleTimeline.tsx: erledigt
- components/views/plants/PlantSlot.tsx: erledigt
- components/views/plants/SensorIntegrationPanel.tsx: erledigt
- components/views/plants/detailedPlantViewTabs/JournalTab.tsx: teilweise erledigt (Filter-Classname-Block)
- components/views/plants/detailedPlantViewTabs/PhotosTab.tsx: erledigt
- components/views/plants/detailedPlantViewTabs/SimulationDebugTab.tsx: erledigt

1. Knowledge / Help Cluster

- components/views/knowledge/GuideView.tsx: optional chaining/nested template literal Reststellen
- components/views/knowledge/MentorView.tsx: teilweise erledigt (Set.has umgesetzt)
- components/views/knowledge/BreedingArPreview.tsx: Restcheck

1. Strains Cluster (groesserer Block)

- components/views/strains/AddStrainModal.tsx: erledigt (Regex entkoppelt)
- components/views/strains/BreedingLab.tsx: erledigt (nested ternary/class branching)
- components/views/strains/GenealogyView.tsx: erledigt (Number.isFinite + branch guard)
- components/views/strains/InlineStrainSelector.tsx: erledigt (ternary class extraction)
- components/views/strains/StrainImageGalleryTab.tsx: erledigt (A11y interactive/non-interactive)
- components/views/strains/StrainImageGenerator.tsx: erledigt (button branching)
- components/views/strains/StrainLibraryView.tsx: erledigt (main content branching)
- components/views/strains/StrainTipsView.tsx: erledigt (reduce-assignment + toSorted)
- components/views/strains/StrainTreeNode.tsx: erledigt (aria-selected)
- components/views/strains/StrainsView.tsx: nested ternary (2x)
- components/views/strains/StrainsView.tsx: erledigt (export source + onDelete branching)

1. Hooks / Services Cluster

- hooks/useDocumentEffects.ts: nested ternary
- hooks/useFocusTrap.ts: else-if Normalisierung
- services/chemotypeService.ts: erledigt (toSorted)
- services/cryptoService.ts: erledigt (Error-Objekte bei rejection)
- services/dbService.ts: erledigt (Error-Objekte + reduce initial value)
- services/entourageService.ts: erledigt (THC/CBD ratio branching)
- services/exportService.ts: teilweise erledigt (removeChild -> remove), nested template literals offen

## C. Nächste Welle (konkret)

1. JournalTab Reststellen (remaining nested-template-literal Hinweise) und MentorView nested-template-literal: teilweise erledigt (Maintainability/Lesbarkeit bereinigt, Rest nur nach neuem Sonar-Run validieren)
1. Strains-Cluster Rest: aktuell kein konkreter offener Punkt aus den priorisierten Dateien
1. Klick-Regression Strains-Detailansicht: erledigt (List/Grid-Selektionspfad repariert, TreeNode-Layering gehaertet, zwei Regressionstests hinzugefuegt)
1. Zusatz-Regressionstestlauf Plants/Settings/Strains: erledigt (20/20 Tests gruen, keine neuen Overlay-Click-Risiken im Scan)
1. Zusatzblock Hook/Service-Komplexitaet: erledigt (useSimulationBridge, localAiFallbackService, geminiService)
1. services/exportService nested-template-literal Block komplettieren: erledigt
1. SeedbanksView Restpruefung und GuideView Reststellen: erledigt

## F. Aktueller Restfokus

1. Sonar neu laufen lassen und verbleibende Issues gegen den aktuellen Branchstand neu clustern
1. Danach nur noch echte Rest-Issues in neuen, kleinen Wellen abarbeiten
1. Optional: weitere repo-weite sort->toSorted Reststellen in nicht-priorisierten Views/Services sammeln und als Low-Risk-Konventionswelle schließen (aktuell erledigt: kein verbleibender sort()-Treffer in components/views, services, hooks)
1. Optional: globale isFinite-Aufrufe bereinigen (aktuell erledigt: kein verbleibender Treffer in components/views, services, hooks)
1. Echte Restpunkte nun auf Template-/Ternary-Komplexität fokussieren (aktuelle Teilwellen: localAiFallback + localAI + FilterDrawer + Grossbatch-UI/Service-Entkopplung)
1. Vor jedem Push verbindlich: `npx prettier --check` auf dem geänderten Stapel, damit Badge-/CI-Schwankungen durch unformatierte Dateien ausgeschlossen werden.

## G. Strategischer Plan fuer neue Sonar-Liste (432 Issues, Stand 2026-03-22)

1. Phase 0: Baseline + Safety-Net

- vorhandene lokale Regressionstests als Gate beibehalten (plants/settings/strains)
- pro Cluster: lint + tsc + betroffene Test-Suite + prettier-check

1. Phase 1: High-Value Low-Risk (Common/UI-Foundation)

- `globalThis`/`globalThis.window` Portability-SmelIs in common/plants/settings beseitigen
- deprecated APIs in UI-Primitives: `ElementRef` (dialog/select) ersetzen
- deprecated DOM API `document.execCommand` in EditResponseModal ersetzen (Clipboard API + Fallback)
- offensichtliche redundant assertions und negated-condition readability in common/help/plants aufloesen

Status Phase 1 (aktueller Stand):

- erledigt in diesem Batch:
    - `ElementRef` -> `ComponentRef` in `components/ui/dialog.tsx` und `components/ui/select.tsx`
    - redundante Assertions in `components/common/RangeSlider.tsx`, `components/common/SearchBar.tsx`, `components/views/plants/detailedPlantViewTabs/PostHarvestTab.tsx`
- offen naechst:
    - `globalThis`-Reststellen in `App.tsx`, `GrowReminderPanel.tsx`, `CloudSyncPanel.tsx`, `BreedingArPreview.tsx`, `GrowRoom3D.tsx`
    - `document.execCommand`-Ablösung in `components/common/EditResponseModal.tsx`

1. Phase 2: Accessibility- und Reliability-Majors zuerst

- `components/common/Tabs.tsx`: non-interactive event listener -> semantisch interaktiv
- `components/common/CameraModal.tsx`: `<video>` caption-track-Anforderung sauber adressieren

Status Phase 2 (aktueller Stand):

- erledigt in diesem Batch:
    - `components/common/Tabs.tsx` A11y-Interaktion korrigiert
    - `components/common/CameraModal.tsx` Caption-Track ergänzt

1. Phase 3: Equipment-/Knowledge-Cluster

- regex `.match` -> `RegExp.exec`, `replace` -> `replaceAll`, duplizierte imports konsolidieren
- stringification-Risiken bei Error-Messages durch sichere Normalisierung beheben

1. Phase 4: Plants-Deep-Cluster

- `window`-Nutzung, deprecated Optionen (`includeMargin`) und `.at(...)` Empfehlungen
- verbleibende minor readability/type issues in detailed tabs

1. Phase 5: Abschluss + Push-Batch

- nur bei commit/push: Handoff-Review + TODO mit finalem Delta aktualisieren
- finaler Gate: changed-lint + tsc + relevante Tests + prettier-check + git diff review

## D. Validierung je Welle

- npx tsc --noEmit
- node scripts/lint-changed.mjs
- Diagnostics-Check der geaenderten Dateien

## E. Abschlusskriterien

- Sonar-Issues der jeweiligen Welle auf erledigt gesetzt
- keine neuen Type- oder Lint-Fehler
- keine regressiven Keyboard-/Fokusprobleme in UI-A11y-Fixes

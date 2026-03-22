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
1. services/exportService nested-template-literal Block komplettieren: erledigt
1. SeedbanksView Restpruefung und GuideView Reststellen: erledigt

## F. Aktueller Restfokus

1. Sonar neu laufen lassen und verbleibende Issues gegen den aktuellen Branchstand neu clustern
1. Danach nur noch echte Rest-Issues in neuen, kleinen Wellen abarbeiten
1. Optional: weitere repo-weite sort->toSorted Reststellen in nicht-priorisierten Views/Services sammeln und als Low-Risk-Konventionswelle schließen (aktuell erledigt: kein verbleibender sort()-Treffer in components/views, services, hooks)
1. Optional: globale isFinite-Aufrufe bereinigen (aktuell erledigt: kein verbleibender Treffer in components/views, services, hooks)

## D. Validierung je Welle

- npx tsc --noEmit
- node scripts/lint-changed.mjs
- Diagnostics-Check der geaenderten Dateien

## E. Abschlusskriterien

- Sonar-Issues der jeweiligen Welle auf erledigt gesetzt
- keine neuen Type- oder Lint-Fehler
- keine regressiven Keyboard-/Fokusprobleme in UI-A11y-Fixes

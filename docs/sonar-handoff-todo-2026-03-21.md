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
- components/views/settings/SettingsSubNav.tsx: tablist muss focusable sein
- components/views/strains/StrainToolbar.tsx: listbox/option auf native select/option umstellen

2. Plants-Views Cluster

- components/views/plants/DashboardSummary.tsx: nested ternary (2x)
- components/views/plants/HistoryChart.tsx: Array includes -> Set.has
- components/views/plants/PlantLifecycleTimeline.tsx: nested template literal
- components/views/plants/PlantSlot.tsx: nested template literal
- components/views/plants/SensorIntegrationPanel.tsx: nested ternary
- components/views/plants/detailedPlantViewTabs/JournalTab.tsx: nested template literal (3x)
- components/views/plants/detailedPlantViewTabs/PhotosTab.tsx: non-interactive listener
- components/views/plants/detailedPlantViewTabs/SimulationDebugTab.tsx: nested ternary (4x)

3. Knowledge / Help Cluster

- components/views/knowledge/GuideView.tsx: optional chaining/nested template literal Reststellen
- components/views/knowledge/MentorView.tsx: Set.has + nested template literal
- components/views/knowledge/BreedingArPreview.tsx: Restcheck

4. Strains Cluster (groesserer Block)

- components/views/strains/AddStrainModal.tsx: Regex-Komplexitaet reduzieren
- components/views/strains/BreedingLab.tsx: nested ternary
- components/views/strains/GenealogyView.tsx: isFinite -> Number.isFinite (mehrfach) + suspicious branch
- components/views/strains/InlineStrainSelector.tsx: nested ternary
- components/views/strains/StrainImageGalleryTab.tsx: A11y interactive/non-interactive
- components/views/strains/StrainImageGenerator.tsx: nested ternary
- components/views/strains/StrainLibraryView.tsx: nested ternary
- components/views/strains/StrainTipsView.tsx: reduce-assignment extrahieren, sort separieren/toSorted, nested ternary
- components/views/strains/StrainTreeNode.tsx: treeitem aria-selected Pflichtattribut
- components/views/strains/StrainsView.tsx: nested ternary (2x)

5. Hooks / Services Cluster

- hooks/useDocumentEffects.ts: nested ternary
- hooks/useFocusTrap.ts: else-if Normalisierung
- services/chemotypeService.ts: sort in separate statement/toSorted
- services/cryptoService.ts: Promise rejection reason als Error + optional chaining
- services/dbService.ts: Promise rejection reason als Error (mehrfach) + reduce initial value
- services/entourageService.ts: nested ternary
- services/exportService.ts: removeChild -> remove + nested template literals (groesserer Block)

## C. Nächste Welle (konkret)

1. GenealogyView-Konventionsblock komplett (Number.isFinite + duplicate branch)
2. DashboardSummary/HistoryChart/SensorIntegrationPanel/SimulationDebugTab (schnelle UI-smells)
3. dbService/cryptoService (Reliability)
4. exportService und AddStrainModal als eigene fokussierte Wellen

## D. Validierung je Welle

- npx tsc --noEmit
- node scripts/lint-changed.mjs
- Diagnostics-Check der geaenderten Dateien

## E. Abschlusskriterien

- Sonar-Issues der jeweiligen Welle auf erledigt gesetzt
- keine neuen Type- oder Lint-Fehler
- keine regressiven Keyboard-/Fokusprobleme in UI-A11y-Fixes

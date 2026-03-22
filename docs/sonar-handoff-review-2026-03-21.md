# Sonar Handoff Review (Update 2026-03-22)

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

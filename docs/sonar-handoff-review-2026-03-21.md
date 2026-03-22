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

2. Naechster UI/A11y/Maintainability-Block (Major/Minor)

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

## Validierung

- npx tsc --noEmit: erfolgreich
- Diagnostics-Check auf allen geaenderten Dateien: keine neuen Fehler

## Ergebnisbild

- Kritische Komplexitaets-Hotspots aus dem letzten Block stark reduziert.
- Erste groessere UI/A11y-Welle gestartet und mehrere Major-Smells entfernt.
- Sonar-Backlog ist weiterhin umfangreich; aktuelle Restpunkte sind im aktualisierten TODO dokumentiert.

## Naechster sinnvoller Einstieg

- den verbleibenden Block aus docs/sonar-handoff-todo-2026-03-21.md in Clustern weiter abarbeiten:

1. restliche A11y-Rollen/Interaktionen in components/views/strains und settings
2. nested ternary/template literal Cluster in plants/strains/services
3. dbService/exportService/cryptoService Reliability-Smells

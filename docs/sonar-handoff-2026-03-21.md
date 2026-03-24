# Sonar Handoff (Consolidated 2026-03-21 -- 2026-03-23)

<!-- markdownlint-disable MD007 MD040 -->

> Consolidated from `sonar-handoff-review-2026-03-21.md` and `sonar-handoff-todo-2026-03-21.md`.
> All completed items are archived below. Remaining action items are tracked in `session-activity-todo-2026-03-24.md` and `audit-roadmap-2026-q2.md`.

---

## Completed (Reference)

### Security Hotspot Elimination (S2245 + S5852) -- 2026-03-23

- **S2245 (Weak PRNG):** All 15 `Math.random()` usages replaced with `secureRandom()` (crypto.getRandomValues). New utility: `utils/random.ts`.
- **S2245 (IDs):** `nutrientPlannerSlice.ts` Math.random() -> crypto.randomUUID()
- **S5852 (ReDoS):** `commandService.ts` fuzzy-Regex with 64-char input limit
- **sonar-project.properties:** Test inclusions + coverage exclusions configured
- **Dockerfile:** `apk upgrade` for zlib-CVE fix

Files affected: breedingUtils.tsx, TipOfTheDay.tsx, DeepDiveModal.tsx, imageGenerationService.ts, plantSimulationService.ts, localAiPreloadService.ts, geminiService.ts, strainFactory.ts, localAiFallbackService.ts, nutrientPlannerSlice.ts, commandService.ts.

### UI/A11y/Maintainability Cleanup -- 2026-03-21/22

All Critical/Major complexity (nesting, cognitive complexity) resolved:

- MentorChatView, useVirtualizer, localAI, localAiFallbackService, migrationLogic, plantSimulationService, predictiveAnalyticsService, genealogySlice

All Major UI/A11y items resolved:

- Card, CommandPalette, SegmentedControl, Tabs, PlantsView, SaveSetupModal, SeedbanksView, SetupConfigurator, HelpSubNav, BreedingArPreview, GuideView (partial), MentorArchiveTab, AiDiagnosticsModal, App.tsx, DataManagementTab, useStorageEstimate, ttsService, growReminderService, plantSimulationService (nullish-fallbacks), SettingsSubNav, StrainToolbar, DashboardSummary, HistoryChart, PlantLifecycleTimeline, PlantSlot, SensorIntegrationPanel, JournalTab, PhotosTab, SimulationDebugTab, AddStrainModal, BreedingLab, GenealogyView, InlineStrainSelector, StrainImageGalleryTab, StrainImageGenerator, StrainLibraryView, StrainTipsView, StrainTreeNode, StrainsView, StrainListItem, StrainGridItem

Service/Hook cluster: useDocumentEffects, useFocusTrap, chemotypeService, cryptoService (hardened + tests), dbService (hardened + tests), entourageService, exportService, aiLoadingMessages, consentService, ttsService, syncService, communityShareService, imageService, sentryService, growLogRagService, useSimulationBridge, localAiFallbackService, geminiService

### Strains Interaction Hardening -- 2026-03-22

- StrainListItem + StrainGridItem: robuste Kartenklick + Keyboard-Ausloesung
- styles.css: Checkbox-Checkmark-Rendering-Fix
- DataExportModal, ExportsManagerView, DataManagementTab: Confirm-Flow
- i18n downloadConfirm key (EN + DE)

### Security Regex Remediation -- 2026-03-22

- AddStrainModal: CSV-Parsing ohne regex-Split
- geneticsService: deterministische String-Parsing
- listenerMiddleware: prefix-basiertes Parsing statt Regex
- GrowRoom3D: WebCrypto statt Math.random

---

## Remaining (Tracked Elsewhere)

All remaining items are tracked in:

- **`docs/audit-roadmap-2026-q2.md`** -- full roadmap with sprints
- **`docs/session-activity-todo-2026-03-24.md`** -- immediate next tasks

Key remaining items:

1. SonarCloud Security Hotspots UI review (0% reviewed = E-Rating)
2. SonarCloud Reliability B (49 issues) -- dashboard inspection
3. Test coverage increase from ~22-28% to >30%
4. Complex function refactoring (14 functions, MI < 25)
5. Duplicate code elimination (20 groups)

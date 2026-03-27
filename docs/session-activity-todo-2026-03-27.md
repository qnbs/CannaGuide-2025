# Session Activity TODO -- 2026-03-27

<!-- markdownlint-disable MD040 MD029 -->

**Source:** Full Audit Plan Implementation (12 phases, all completed this session)

**Current Status:** 694 tests (84 files), tsc clean, all 12 audit phases implemented.

---

## Completed This Session (2026-03-27)

- [x] Phase 0: Export-Dialog Bug Fix (DataExportModal inline confirmation)
- [x] Phase 1.1: Nested-Overlay Focus-Return (LogActionModal cameraButtonRef)
- [x] Phase 1.2: Touch Targets 44x44px + ARIA Labels (6 components)
- [x] Phase 1.3: IndexedDB Retry with Exponential Backoff (dbService.ts)
- [x] Phase 2.1: Bundle Code-Splitting (Three.js chunk separation)
- [x] Phase 2.2: Zod Validation Review (already complete, no changes needed)
- [x] Phase 3.1: i18n ES/FR/NL (infrastructure + common namespace, 11 new files)
- [x] Phase 3.2: Nutrient-Scheduling Extension (plugin integration + auto-adjust)
- [x] Phase 3.3: DSGVO Right-to-be-Forgotten (privacyService.ts + UI)
- [x] Phase 4.1: AI Eco-Mode (settings + health service integration)
- [x] Phase 4.2: ARCHITECTURE.md (standalone architecture document)
- [x] Phase 4.3: Lighthouse Font Optimization (non-render-blocking Google Fonts)
- [x] Session documentation (review, todo, handoff, audit roadmap update)

---

## Remaining / Follow-Up Tasks

### i18n Completion (ES/FR/NL)

- [ ] Translate remaining 12 namespaces for each language (currently only `common` translated, others fall back to English)
- [ ] Add language selector options in Settings UI (currently EN/DE only in picker)
- [ ] Community translation review via GitHub Discussions
- [ ] Update `imageGenerationService.ts:61` and `localAiLanguageDetectionService.ts:55` if AI prompt support expands beyond EN/DE

### Nutrient Planner UI

- [ ] Expose plugin apply/detach buttons in `EcPhPlannerCalculator.tsx`
- [ ] Display `autoAdjustRecommendation` in the planner UI
- [ ] Add eco-mode toggle to Local AI settings panel

### DSGVO Extensions

- [ ] Add i18n keys for DSGVO section (`settingsView.data.gdpr*`) in EN/DE/ES/FR/NL
- [ ] Add Sentry event on successful full erasure (before reload)
- [ ] Consider adding individual database deletion options

### Testing

- [ ] Unit tests for `privacyService.ts` (mock IndexedDB + localStorage)
- [ ] Unit tests for nutrient planner plugin integration (applyPluginSchedule, detachPlugin)
- [ ] Unit tests for eco-mode path in localAiHealthService
- [ ] Playwright E2E: export dialog flow, DSGVO erase confirmation
- [ ] Mobile E2E: verify 44x44 touch targets are not clipped

### Performance

- [ ] Run Lighthouse CI after deployment to measure FCP improvement from font optimization
- [ ] Measure Three.js chunk impact on initial load (before/after comparison)
- [ ] Consider preloading critical CSS chunk (`<link rel="modulepreload">`)

### Existing Backlog (from previous sessions)

- [ ] SonarCloud Security Hotspots manual review (0% reviewed = E-Rating)
- [ ] CII-Best-Practices badge email verification
- [ ] Rebuild Codespace to test Dockerfile-based build
- [ ] Additional test coverage: aiProviderService, aiService, geminiService

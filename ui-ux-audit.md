# UI/UX Audit - Mobile-First Overhaul (Step 1-4)

Date: 2026-03-05
Scope: CannaGuide-2025 PWA (React 19 + TS + Vite + Redux + Tailwind + shadcn/ui + Radix)

## Summary

- Replaced fragmented overlay behavior with a centralized Radix-based wrapper.
- Enforced mobile-safe viewport behavior (`100dvh`, safe-area paddings, sticky actions, scroll containment).
- Raised interaction quality in critical flows (Photo Diagnosis, Grow Log, Strain Detail, Breeding, Camera, Command Palette).
- Improved mobile navigation touch targets and chart touch interaction.
- Added PWA polish via `viewport-fit=cover` and dynamic `theme-color` updates.

## Audit Findings (Prioritized)

1. Legacy modal/drawer overlays used hard `vh` limits and inconsistent scroll/background locking.
2. Several controls were below recommended 44x44 touch target size.
3. Command Palette and dialog primitives were desktop-centered on small screens.
4. Form modal actions were not consistently sticky/reachable with keyboard open.
5. Some chart interactions depended on mouse events only.
6. PWA viewport and theme-color integration was incomplete on iOS-like environments.

## Implemented Changes

### Global Overlay System

- Added `components/common/DialogWrapper.tsx`.
- Switched `components/common/Modal.tsx` to `DialogWrapper`.
- Switched `components/common/Drawer.tsx` to `DialogWrapper` with swipe-down-to-close.
- Added `dialog-open` scroll lock rules in `styles.css`.

Why: A single Radix-powered overlay primitive eliminates inconsistent behavior and hardens mobile accessibility.

### Mobile Viewport + Safe Areas

- Overlay layout now uses fixed full-viewport strategy with `100dvh` and safe-area insets.
- Sticky action bars now include bottom safe-area padding.
- Updated `index.html` viewport meta to include `viewport-fit=cover`.

Why: Prevent clipped controls and ensure full-screen PWAs behave correctly on notch/home-indicator devices.

### Critical Flow Fixes

- `components/views/plants/AiDiagnosticsModal.tsx`
    - Improved upload area keyboard accessibility and touch sizing.
    - Increased action button minimum heights.
    - Added stronger mobile sizing and error alert semantics.
- `components/views/plants/LogActionModal.tsx`
    - Increased footer button size and photo action touch targets.
    - Improved responsive photo action layout.
    - Added larger notes field and safer remove-image control.
- `components/views/strains/StrainDetailView.tsx`
    - Enlarged undo/redo/favorite touch controls.
    - Improved header action wrapping on small devices.
    - Enhanced notes textarea focus treatment and minimum size.
- `components/views/plants/BreedingView.tsx`
    - Increased card/button touch targets.
    - Replaced rigid heights with mobile-friendlier minimum sizing.
    - Improved scroll bounds in seed list.
- `components/common/CameraModal.tsx`
    - Larger action buttons.
    - Media constrained with `max-h-[60dvh]` + `object-contain`.
- `components/views/plants/deepDive/DeepDiveModal.tsx`
    - Better mobile typography density and spacing for long-form content.

Why: These views are frequent high-friction mobile surfaces and must stay legible and tappable under constrained viewport height.

### Navigation, Dialog, and Input Surfaces

- `components/common/CommandPalette.tsx`
    - Mobile full-height behavior with safe-area support.
    - Responsive fallback to desktop centered palette.
- `components/ui/dialog.tsx`
    - Shadcn/Radix dialog primitive now supports mobile near-full-height layout.
- `components/navigation/BottomNav.tsx`
    - Increased icon size, vertical padding, and minimum hit area.

Why: Navigation and command entry must be comfortable on 360-430px devices without precision tapping.

### Accessibility and PWA Polish

- `components/views/plants/VPDGauge.tsx`
    - Added `role="img"` and descriptive `aria-label`.
    - Responsive gauge text sizing.
- `components/views/plants/HistoryChart.tsx`
    - Replaced mouse handlers with pointer handlers for touch compatibility.
- `hooks/useDocumentEffects.ts`
    - Added dynamic update of `meta[name="theme-color"]` from active theme CSS token.

Why: Improves assistive output quality, touch interaction parity, and installable-app visual integration.

## Validation

- `npm run lint` passed.
- `npm run build` passed.
- TypeScript warning from `@typescript-eslint/typescript-estree` support range remains informational and non-blocking.

## Next Recommended Pass (Remaining Scope)

1. ~~Keep form primitives consolidated in `components/ui/form.tsx` and avoid reintroducing `ThemePrimitives`.~~ (evaluated Session 79 -- already consolidated)
2. ~~Standardize all icon-only destructive actions to guaranteed 44x44 hit areas app-wide.~~ (Done, Session 79)
3. ~~Add explicit screen-reader labels to all chart toggles and data-mode switches.~~ (Done, Session 79)
4. ~~Add mobile E2E assertions for no-clipping/no-overflow in key dialogs.~~ (Done, Session 79)
5. ~~Add focus-return tests for nested overlays (e.g., camera inside diagnostics).~~ (Verified, Session 79 -- Radix auto-focus-return)

---

## Session 79 -- UI/UX Audit Next Pass + i18n Fix + Local AI Error Handling

### i18n Fix (LlmModelSelector)

- Fixed 13 `t()` calls in `LlmModelSelector.tsx`: `settingsView.modelSelector.*` corrected to `settingsView.offlineAi.modelSelector.*` (missing path segment caused raw keys to display)
- Added `webGpu` i18n key to all 5 locale files (en/de/es/fr/nl)
- Updated all test assertions in `LlmModelSelector.test.tsx`

### 44x44 Touch Targets (Destructive Icon Buttons)

- Changed `size="sm"` to `size="icon"` (h-11 w-11 = 44x44px) on icon-only destructive buttons in:
    - AiTab.tsx (edit + delete advice buttons)
    - StrainTipsView.tsx (edit + delete tip buttons)
    - BulkActionsBar.tsx (bulk delete button)
    - MentorArchiveTab.tsx (delete archive entry button)
    - GenealogyView.tsx (reset cache button + aria-label)
    - LeafDiagnosisPanel.tsx (camera capture button + aria-label)

### Screen-Reader Labels (Chart Toggles)

- GrowPlannerView.tsx: added `aria-label`, `aria-pressed`, `min-h-[44px]` to week/month toggle
- HydroMonitorView.tsx: added `aria-label`, `aria-pressed`, `min-h-[44px] min-w-[44px]`, increased padding on time range buttons
- Added `toggleViewMode` and `selectTimeRange` i18n keys (en/de common)

### Mobile E2E Dialog Clipping

- Added 2 new Playwright E2E tests to `mobile-no-overflow.e2e.ts`:
    - Command palette dialog clipping check
    - Settings modal content overflow check

### Focus Return (Nested Overlays)

- Verified Radix Dialog `onCloseAutoFocus` handles focus return automatically
- No custom focus management needed for nested camera-inside-diagnostics flow

### Local AI Error Handling

- Added `captureLocalAiError()` Sentry reporting to 3 silent catch blocks:
    - `localAiPreloadOrchestrator.ts` (embedding + NLP preload failures)
    - `localAiInferenceRouter.ts` (worker-queue fallthrough errors)
    - `localAiHealthService.ts` (storage estimate failures)
- SettingsView.tsx: health check now sets `healthStatus('unknown')` on error

### AUDIT_BACKLOG Updates

- U-05 (Onboarding Telemetry): marked Deferred (v2.0)
- A-03 (AI Cost Tracking): added partial progress note (infrastructure done, UI pending)
- Fixed 5 stale priority queue checkboxes (V-03/V-04/V-05, T-03, A-02, S-03)
- Updated summary table with Deferred column

### Verification

- Typecheck: clean (0 errors, TS2719 filtered)
- Tests: 1884 passed, 0 failures (163 test files)
- Build: successful (3/3 tasks)

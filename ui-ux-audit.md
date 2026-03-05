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
1. Keep form primitives consolidated in `components/ui/form.tsx` and avoid reintroducing `ThemePrimitives`.
2. Standardize all icon-only destructive actions to guaranteed 44x44 hit areas app-wide.
3. Add explicit screen-reader labels to all chart toggles and data-mode switches.
4. Add mobile E2E assertions for no-clipping/no-overflow in key dialogs.
5. Add focus-return tests for nested overlays (e.g., camera inside diagnostics).

# Release Notes – 2026-03-01 (Audit Follow-up)

## DE

### Highlights
- Sicherheits-Follow-up abgeschlossen: verbleibende `npm audit`-Warnungen bereinigt.
- Performance verbessert: AI- und Export-Domäne werden stärker on-demand geladen.
- UI/UX-Fix für Mobile: zusätzliche Safe-Area-/Bottom-Offsets gegen Überdeckung durch Bottom-Navigation.
- a11y-Automation erweitert: Axe-Scan und Keyboard-Flow im Deploy-E2E-Check.

### Änderungen
- Toolchain-Upgrades für Security:
  - `vitest` auf `4.0.18`
  - `vite` auf `7.3.1`
  - `@vitejs/plugin-react` auf aktuelle Hauptversion
- AI Lazy-Loading:
  - `stores/api.ts` lädt `geminiService` dynamisch pro Query-Funktion.
  - Neue leichte Utility `services/aiLoadingMessages.ts` für Loading-Texte ohne schwere AI-Imports.
- Export Lazy-Loading:
  - `stores/slices/savedItemsSlice.ts` lädt `exportService` dynamisch in Export-Thunks.
  - `components/views/strains/ExportsManagerView.tsx` lädt Export-Service erst beim Download.
- Layout-/Overlap-Korrekturen:
  - `components/views/plants/App.tsx` mit größerem mobilem `pb` + `scroll-pb` inkl. `safe-area`.
  - `components/common/TTSControls.tsx` und `components/views/strains/BulkActionsBar.tsx` über Bottom-Nav angehoben.
- A11y-Tests:
  - `tests/e2e/accessibility.spec.ts` (Axe serious/critical auf `header` + `main`).
  - `tests/e2e/deploy-smoke.spec.ts` um Keyboard-Navigation ergänzt.

### Verifikation
- Unit Tests: `22/22` grün.
- E2E Deploy + a11y: `2/2` grün.
- Build: erfolgreich.
- Security: `npm audit` = `0` Findings.

---

## EN

### Highlights
- Security follow-up completed: all remaining `npm audit` warnings resolved.
- Performance improved: AI and export domains now load more on-demand.
- Mobile UI/UX fixed: additional safe-area/bottom offsets prevent bottom-nav overlap.
- a11y automation expanded: Axe scan and keyboard-flow checks added to deploy E2E.

### Changes
- Security toolchain upgrades:
  - `vitest` to `4.0.18`
  - `vite` to `7.3.1`
  - `@vitejs/plugin-react` to latest major
- AI lazy loading:
  - `stores/api.ts` dynamically imports `geminiService` inside query functions.
  - New lightweight helper `services/aiLoadingMessages.ts` for loading text generation.
- Export lazy loading:
  - `stores/slices/savedItemsSlice.ts` dynamically loads `exportService` in export thunks.
  - `components/views/strains/ExportsManagerView.tsx` loads export service only on download.
- Layout/overlap fixes:
  - `components/views/plants/App.tsx` increased mobile bottom/scroll padding with safe-area support.
  - `components/common/TTSControls.tsx` and `components/views/strains/BulkActionsBar.tsx` moved above bottom nav.
- a11y tests:
  - `tests/e2e/accessibility.spec.ts` (Axe serious/critical on `header` + `main`).
  - `tests/e2e/deploy-smoke.spec.ts` extended with keyboard navigation coverage.

### Verification
- Unit tests: `22/22` passing.
- Deploy + a11y E2E: `2/2` passing.
- Build: successful.
- Security: `npm audit` = `0` findings.

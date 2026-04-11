# Accessibility Statement -- CannaGuide 2025

## Commitment

CannaGuide 2025 is committed to ensuring digital accessibility for people with disabilities.
We continually improve the user experience for everyone and apply relevant accessibility standards.

## Standards

We aim to conform to **WCAG 2.1 Level AA** where applicable, specifically:

- **Perceivable**: Text alternatives, sufficient color contrast (9 themes with light/dark support), responsive layouts.
- **Operable**: Full keyboard navigation, focus indicators, no time-dependent interactions required.
- **Understandable**: Consistent navigation, clear labels, internationalization (EN, DE + 3 additional languages).
- **Robust**: Semantic HTML, ARIA attributes on interactive elements, tested with axe-core automated scanning.

## Current State

| Feature                 | Status                                                      |
| ----------------------- | ----------------------------------------------------------- |
| Keyboard navigation     | Supported across all views                                  |
| Screen reader support   | Semantic HTML + ARIA labels on controls                     |
| Color contrast          | Tested against WCAG AA (theme-dependent)                    |
| Reduced motion          | Respects `prefers-reduced-motion` media query               |
| Color vision deficiency | SVG filters for protanopia, deuteranopia, tritanopia        |
| axe-core CI scan        | Automated in Playwright E2E (`accessibility.deploy.e2e.ts`) |
| Focus management        | Visible focus rings on interactive elements                 |

## Testing

- **Automated**: axe-core via `@axe-core/playwright` in E2E tests
- **ESLint**: `eslint-plugin-jsx-a11y` (recommended rules as warn-level, opt-in via `LINT_A11Y=1`)
- **Manual**: Periodic testing with VoiceOver (macOS) and NVDA (Windows)
- **CI**: Lighthouse accessibility audits in `lighthouserc.json`

### ESLint jsx-a11y Baseline (2026-04-11)

- **169 warnings** across the codebase (0 errors)
- Rules: all `eslint-plugin-jsx-a11y` recommended rules at `warn` level
- Activation: `pnpm run lint:a11y` (or `LINT_A11Y=1 eslint .`)
- Not included in lint-staged or CI gate (to avoid blocking commits)
- Top violation categories: `label-has-for`, `click-events-have-key-events`,
  `no-static-element-interactions`, `control-has-associated-label`

### Form Accessibility (Phase B2, 2026-04-11)

- Shared `Input` and `Textarea` components support `error`/`errorId` props
- `aria-invalid="true"` set automatically when `error` prop is provided
- `aria-describedby` points to error element with matching `id`
- Error messages rendered with `role="alert"` for screen reader announcement
- `FormInput` wrapper auto-generates `errorId` via `useId()`
- Migrated: AddStrainModal (5 fields), SettingsView API key, GrowCreateModal,
  GrowEditModal

## Known Limitations

- Some dynamically generated AI content may lack semantic structure until processed
- Complex data visualizations (3D grow room, genealogy tree) have limited screen reader support
- Voice control features depend on Web Speech API browser support

## RTL (Right-to-Left) Readiness

| Aspect                           | Status   | Notes                                                                                                      |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `dir` attribute on `<html>`      | Done     | Set to `ltr` by default, updated dynamically on language switch via `i18n.ts`                              |
| `getTextDirection()` helper      | Done     | Exported from `i18n.ts`, maps locale to `ltr` or `rtl`                                                     |
| `RTL_LOCALES` constant           | Done     | Empty set, prepared for `ar`, `he` when translations land                                                  |
| Tailwind `rtl:` modifier         | Built-in | Tailwind v3 supports `rtl:` / `ltr:` natively -- no plugin required                                        |
| E2E smoke test                   | Done     | `rtl-smoke.e2e.ts` verifies app renders without crash under `dir="rtl"`                                    |
| CSS logical properties migration | Planned  | 15+ components use physical `ml-`/`mr-`/`text-left` classes that need `ms-`/`me-`/`text-start` equivalents |
| Dynamic indicator positioning    | Planned  | `BottomNav.tsx` and `Tabs.tsx` use `offsetLeft` -- needs `inset-inline-start` or conditional logic         |

## Feedback

If you encounter accessibility barriers, please open an issue on
[GitHub Issues](https://github.com/qnbs/CannaGuide-2025/issues) with the label `a11y`.

We aim to respond to accessibility feedback within 5 business days.

---

_Last updated: 2026-04-11_

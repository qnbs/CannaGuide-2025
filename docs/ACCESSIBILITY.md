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
- **Manual**: Periodic testing with VoiceOver (macOS) and NVDA (Windows)
- **CI**: Lighthouse accessibility audits in `lighthouserc.json`

## Known Limitations

- Some dynamically generated AI content may lack semantic structure until processed
- Complex data visualizations (3D grow room, genealogy tree) have limited screen reader support
- Voice control features depend on Web Speech API browser support

## Feedback

If you encounter accessibility barriers, please open an issue on
[GitHub Issues](https://github.com/qnbs/CannaGuide-2025/issues) with the label `a11y`.

We aim to respond to accessibility feedback within 5 business days.

---

_Last updated: 2026-04-01_

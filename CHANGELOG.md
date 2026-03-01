# Changelog

## 2026-03-01

### Added
- Settings tab-by-tab smoke test in [components/views/settings/SettingsView.test.tsx](components/views/settings/SettingsView.test.tsx).
- Deploy E2E accessibility test in [tests/e2e/accessibility.spec.ts](tests/e2e/accessibility.spec.ts).
- Release notes document in [docs/release-notes/2026-03-01-audit-followup.md](docs/release-notes/2026-03-01-audit-followup.md).
- Complete BYOK (Gemini API key) flow in settings and AI feature paths, including validation, masked display, and localized API error mapping.
- README EN/DE guidance for BYOK setup, Gemini AI Studio key acquisition, and live deployment URL.

### Changed
- Security toolchain upgraded (`vite`, `vitest`, `@vitejs/plugin-react`) with zero remaining `npm audit` findings.
- AI and export code paths shifted further to on-demand loading.
- Mobile layout spacing adjusted to avoid bottom-nav overlap across app views.
- Deploy smoke tests expanded with keyboard-flow assertions and Axe checks.
- Lint/quality baseline tightened and normalized (`lint:strict`, ESLint/Prettier alignment, removal of stale rule suppressions).
- Deploy smoke/a11y specs refactored for deterministic onboarding handling and stable navigation readiness checks.

### Fixed
- Persisting mobile bottom overlap where UI elements could be obscured by bottom navigation.
- Premature loading of heavy AI/export service modules in non-critical render paths.
- Startup crash on browsers without Web Speech API support (`Cannot set properties of undefined`) by adding defensive guards in TTS startup and voice settings paths.
- Startup failure in SpeechRecognition edge cases by hardening capability detection and adding explicit no-support regression coverage.

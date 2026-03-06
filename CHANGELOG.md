# Changelog

All notable changes to CannaGuide 2025 are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [1.0.0] — 2026-07-07

### 🔒 Security & DSGVO/GDPR
- **Age Gate (18+)**: Full-screen modal blocks content until user confirms 18+ (KCanG §1).
- **DSGVO/GDPR consent banner**: Explicit approval required before localStorage/IndexedDB storage.
- **Privacy Policy (Datenschutzerklärung)**: 8-section modal with data storage, AI services, image processing, cookies, third-party services, user rights (DSGVO), and contact.
- **Impressum**: Legal notice (TMG) integrated in privacy modal.
- **Geo-Legal Banner**: One-time jurisdiction reminder.
- **CSP hardened** across 4 delivery paths (Vite, index.html, Netlify `_headers`, Docker nginx) — `connect-src` restricted to specific AI API domains.
- **AES-256-GCM encryption** for all API keys at rest (consolidated `cryptoService.ts`).
- **AI disclaimers** on every AI response (Mentor, DeepDive, StrainTips, Diagnostics).
- **EXIF/GPS stripping** before AI image transmission with revocable consent.
- **Injection defense**: 30+ regex patterns prevent prompt injection.
- **Rate limiter**: Sliding-window (15 req/min) with per-day token cost tracking.
- **DOMPurify v3** sanitization on all `dangerouslySetInnerHTML` content.

### 🤖 AI Layer Hardening
- **Multi-Provider BYOK**: Gemini (default), OpenAI, xAI/Grok, Anthropic — all encrypted at rest.
- **Rate limiter**: 15 req/min sliding window with daily token cost tracking.
- **Injection defense**: 30+ regex patterns block prompt injection attempts.
- **Image consent**: Provider-agnostic with explicit opt-in and revoke button.
- **Local AI fallback**: Heuristic plant advice when API is unreachable.

### 🏗️ DevOps & Distribution
- **PWA auto-update**: Proactive service worker checks on load, focus, visibility, and 5-min interval.
- **Docker hardening**: Multi-stage build with nginx and security headers.
- **Tauri builds**: Desktop distribution via `src-tauri/` config.
- **Lighthouse CI**: Automated performance/a11y audits in CI.
- **GitHub Actions**: ci.yml, codeql.yml, deploy.yml, docker.yml, strains-merge.yml, tauri-build.yml.

### ♿ Accessibility
- **WCAG 2.2 AA compliance**: Full keyboard navigation, ARIA landmarks, focus management.
- **Skip-to-content link**, focus traps for modals, roving tabindex for tab lists.
- **Reduced motion** support via `prefers-reduced-motion`.
- **Screen reader** announcements for all interactive elements.

### 🧪 Testing
- **258 tests** across 27 files — unit, integration, and E2E.
- **Vitest** for unit/integration with JSDOM and custom mocks.
- **Playwright** for E2E smoke tests and accessibility checks.
- Coverage: simulation engine, AI services, state management, strain service, UI components.

### ⚡ Performance
- **Code splitting**: Lazy-loaded views with Suspense boundaries.
- **Web Worker**: Plant simulation runs off main thread.
- **Virtualized rendering**: 700+ strain list with `useVirtualizer` at 60fps.
- **esbuild minification**: `console.debug` stripped in production builds.
- **Bundle analysis**: Optimized chunk strategy for fast initial load.

### 🏛️ Architecture
- **State Migration V4**: Per-slice versioning with auto-reset and transient state stripping.
- **Dual IndexedDB**: `CannaGuideStateDB` (Redux) + `CannaGuideDB` (strains, images, search).
- **Promise-lock hydration**: Race condition prevention for concurrent IndexedDB reads.
- **Safe Recovery**: Automatic corrupt state detection and repair.
- **Archive capping**: 100 mentor + 50 advisor responses per plant (FIFO).

### 🌐 Internationalization
- **Complete EN/DE localization**: 11 namespaces across all views.
- **`getT()` helper**: i18n access in non-component contexts (middleware, services).
- **Lazy namespace loading**: Translations loaded on demand per view.

### 🌿 Core Features
- **700+ strain encyclopedia** with genealogy tracking (d3 tree visualization).
- **VPD simulation engine**: Altitude-corrected saturation pressure (Buck equation), biomass-scaled resources, structural growth model.
- **Breeding Lab**: Punnett Square genetics with phenotype prediction.
- **Entourage calculator**: Terpene/cannabinoid interaction scoring.
- **ESP32 sensors**: WebBluetooth GATT Environmental Sensing integration.
- **Grow reminders**: Push notifications with 4-hour cooldown and snooze tracking.
- **Post-harvest simulation**: Drying & curing with terpene retention and CBN conversion.
- **What-if scenarios**: Clone-based comparison experiments.
- **RAG-powered journal search**: Token-based relevance ranking with recency boosting.
- **Community sharing**: Anonymous GitHub Gists for strain collections.
- **Photo diagnosis**: Auto-compressed images with AI-powered plant problem identification.
- **Equipment planner**: AI-generated setup recommendations.
- **Command Palette**: `Cmd/Ctrl+K` for instant navigation and actions.
- **3 cannabis themes** + onboarding wizard.
- **TTS/STT support**: Text-to-speech and speech recognition for hands-free use.
- **Markdown + KaTeX export**: JSON, Markdown, CSV, XML export formats.

### 🔧 Code Quality
- **0 TypeScript errors**, 0 ESLint warnings.
- **ESLint 9 flat config** with React Compiler plugin.
- **Zod schemas** for AI response validation, imports, and community shares.
- **d3 crash-proofing**: Bulletproof mount/unmount with ErrorBoundary fallbacks.

---

## [0.1.0] — 2026-03-01

### Added
- Settings tab-by-tab smoke test.
- Deploy E2E accessibility test.
- Complete BYOK (Gemini API key) flow with validation, masked display, and localized error mapping.
- README EN/DE guidance for BYOK setup and live deployment URL.

### Changed
- Security toolchain upgraded (`vite`, `vitest`, `@vitejs/plugin-react`) with zero `npm audit` findings.
- AI and export code paths shifted to on-demand loading.
- Mobile layout spacing adjusted to avoid bottom-nav overlap.
- Lint/quality baseline tightened (`lint:strict`, ESLint/Prettier alignment).

### Fixed
- Mobile bottom-nav overlap obscuring UI elements.
- Premature loading of heavy AI/export modules in non-critical paths.
- Startup crash on browsers without Web Speech API support.
- SpeechRecognition edge case failures.

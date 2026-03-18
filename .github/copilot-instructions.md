# Copilot Instructions for CannaGuide 2025

## Project Overview

CannaGuide 2025 is a production-grade, AI-powered Progressive Web App (PWA) for cannabis cultivation management. Built with React 19, TypeScript (strict), Redux Toolkit, and Google Gemini AI. The app is 100% offline-first with dual IndexedDB persistence.

**Live:** https://qnbs.github.io/CannaGuide-2025/  
**Version:** 1.1.0

---

## Architecture

### Tech Stack
- **Frontend:** React 19 + TypeScript (strict mode, zero `any`)
- **State:** Redux Toolkit + RTK Query (memoized selectors, listener middleware)
- **AI:** Google Gemini (primary), OpenAI, xAI/Grok, Anthropic (multi-provider BYOK)
- **Local AI:** @xenova/transformers, @mlc-ai/web-llm, TensorFlow.js
- **Build:** Vite 7 + vite-plugin-pwa (InjectManifest)
- **Styling:** Tailwind CSS + Radix UI + 9 cannabis themes
- **Persistence:** Dual IndexedDB (`CannaGuideStateDB` + `CannaGuideDB`)
- **i18n:** i18next (EN + DE, 13 namespaces)
- **Testing:** Vitest (258+ tests) + Playwright E2E + Playwright Component Tests + Stryker mutation
- **Error Tracking:** Sentry (browser SDK)
- **Distribution:** GitHub Pages, Netlify (PR previews), Docker, Tauri (desktop), Capacitor (mobile)

### Project Structure
```
components/          # React components: common/, icons/, navigation/, ui/, views/
stores/              # Redux: slices/, selectors/, middleware, store config
services/            # Business logic: AI, simulation, database, crypto, IoT, Sentry
hooks/               # Custom React hooks (14+)
data/                # Static data: 700+ strains, FAQ, lexicon, guides
locales/             # i18n: en/, de/ (13 namespaces each)
workers/             # Web Workers: VPD sim, genealogy, scenarios
utils/               # Shared utilities
types/               # TypeScript types + Zod schemas
tests/               # E2E (tests/e2e/) + Component tests (tests/ct/)
lib/                 # Utility library (cn(), VPD calculations)
public/              # Static assets, SW, manifest
src-tauri/           # Tauri desktop config (Rust backend)
scripts/             # Build/lint/merge scripts
docker/              # nginx config
docs/                # Developer guides, roadmap
.github/             # 15 CI/CD workflows, issue templates
```

### Key Patterns

1. **Offline-First:** All data stored in IndexedDB. Service Worker uses Network-First for navigation, Cache-First for assets. Background Sync queues offline actions.

2. **Dual IndexedDB:**
   - `CannaGuideStateDB`: Redux state with promise-locked hydration, debounce-save (1s), force-save on visibilitychange
   - `CannaGuideDB`: Strains, images (auto-pruned), full-text search index

3. **AI Service Abstraction:** All AI calls route through `services/aiProviderService.ts` → provider-specific services. Structured JSON output via `responseSchema`. Local fallback via `localAiFallbackService.ts`.

4. **Safe Recovery:** Boot wraps store creation in try/catch. Corrupted state → auto-clear + restart. Session flag prevents infinite recovery loops.

5. **Memoized Selectors:** Map-based cache keyed by ID. Nullish coalescing (`??`) over logical OR (`||`).

6. **Archive Capping:** Mentor: 100 entries, Advisor: 50/plant, FIFO culling.

---

## Coding Standards

### TypeScript
- Strict mode — zero `any`, zero `@ts-expect-error`
- Named exports preferred over default exports
- Explicit return types on public functions
- `??` for nullish coalescing, never `||` for falsy-sensitive values

### React
- Functional components + hooks only (no class components)
- `React.memo()` for list items and expensive components (with `displayName`)
- React 19 Compiler (`babel-plugin-react-compiler`) auto-memoizes
- Lazy-loaded views with `React.lazy()` + `Suspense`

### Styling
- Tailwind CSS utility classes (no custom CSS unless absolutely necessary)
- `cn()` from `lib/utils.ts` for conditional classes (clsx + tailwind-merge)
- Theme via CSS custom properties (9 themes)

### Security (Critical)
- **DOMPurify v3** on ALL `dangerouslySetInnerHTML` content
- **`rel="noopener noreferrer"`** on ALL external links
- **AES-256-GCM** encryption for API keys at rest (cryptoService.ts)
- **EXIF/GPS stripping** before image AI transmission
- **30+ regex patterns** block prompt injection in AI prompts
- **CSP hardened** across 4 delivery paths
- **No `console.log`** in production — use `console.debug` (stripped) or `console.warn`/`console.error`
- **Sentry** captures runtime errors — use `Sentry.captureException()` for explicit reporting

### AI Integration
- All AI calls go through `services/geminiService.ts` or provider abstraction
- Rate limiting: 15 req/min sliding window
- Use `responseSchema` for structured JSON output
- RAG via `growLogRagService.ts` for journal context
- local AI fallback when API unreachable

### i18n
- All user-facing strings must be in `locales/en/` and `locales/de/`
- Use `useTranslation('<namespace>')` in components
- Use `getT()` from `i18n.ts` in services/middleware
- 13 namespaces: common, plants, knowledge, strains, equipment, settings, help, commandPalette, onboarding, seedbanks, strainsData, legal

### Testing
- Vitest for unit/integration tests (files next to source: `*.test.ts(x)`)
- Playwright E2E tests in `tests/e2e/` (pattern: `*.e2e.ts`)
- Playwright Component tests in `tests/ct/` (pattern: `*.ct.tsx`)
- Mocks in `tests/mocks/` for Gemini, IndexedDB, etc.
- Baseline: 258+ tests, 0 failures

### Git
- Conventional Commits: `<type>(<scope>): <description>`
- Types: feat, fix, docs, refactor, test, perf, chore, a11y, i18n
- Scopes: ai, plants, strains, equipment, knowledge, settings, help, genealogy, pwa, ci, security, ui, sentry

---

## Commands

```bash
npm run dev              # Vite dev server (localhost:5173)
npm run build            # Production build
npm test                 # Vitest unit/integration
npm run test:e2e         # Playwright E2E (requires build)
npm run lint             # ESLint changed files
npm run lint:full        # ESLint entire project
npx tsc --noEmit         # Type check
npm run format           # Prettier format
npm run lighthouse:ci    # Lighthouse audit
npm run test:mutation    # Stryker mutation testing
```

---

## Error Tracking

Sentry is integrated for runtime error monitoring. Configuration is in `services/sentryService.ts`.

- Errors are auto-captured via `Sentry.init()` in the app bootstrap
- Use `Sentry.captureException(error)` for explicit error reporting
- Use `Sentry.captureMessage(msg)` for non-error events
- Performance traces are sampled at 10% in production
- Session replay captures 1% of sessions, 100% on error
- Source maps are uploaded during CI build for readable stack traces

---

## Deployment

| Target | Method | Trigger |
|--------|--------|---------|
| GitHub Pages | `.github/workflows/deploy.yml` | Push to `main` |
| Netlify | `netlify.toml` | Push + PR (preview deploys) |
| Docker | `.github/workflows/docker.yml` | Release tag `v*` |
| Tauri Desktop | `.github/workflows/tauri-build.yml` | Release tag `v*` |
| Capacitor Mobile | `.github/workflows/capacitor-build.yml` | Release tag `v*` |

---

## Important Files

| File | Purpose |
|------|---------|
| `index.tsx` | App bootstrap, SW registration, safe recovery |
| `stores/store.ts` | Redux store creation, IndexedDB hydration |
| `services/geminiService.ts` | Gemini API abstraction (all AI features) |
| `services/aiProviderService.ts` | Multi-provider AI routing |
| `services/sentryService.ts` | Sentry error tracking initialization |
| `simulation.worker.ts` | VPD simulation Web Worker |
| `sw.js` | Service Worker (precache + runtime caching) |
| `constants.ts` | App-wide constants |
| `types.ts` | Core TypeScript types |
| `i18n.ts` | i18next initialization |
| `vite.config.ts` | Build configuration |

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/qnbs/CannaGuide-2025)

# 🌿 CannaGuide 2025

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/badge/release-v1.1.0-brightgreen)](https://github.com/qnbs/CannaGuide-2025/releases)
[![CI](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)
[![CodeQL](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml)
[![Deploy](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml)
[![Security Alerts Handoff](https://github.com/qnbs/CannaGuide-2025/actions/workflows/security-alerts-handoff.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/security-alerts-handoff.yml)
[![Dependabot Alerts](https://img.shields.io/github/dependabot-alerts/qnbs/CannaGuide-2025)](https://github.com/qnbs/CannaGuide-2025/security/dependabot)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/qnbs/CannaGuide-2025/badge)](https://securityscorecards.dev/viewer/?uri=github.com/qnbs/CannaGuide-2025)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline-blueviolet)]()
[![i18n](https://img.shields.io/badge/i18n-EN%20|%20DE-orange)]()
[![WCAG 2.2 AA](https://img.shields.io/badge/a11y-WCAG%202.2%20AA-green)]()

**Live:** [qnbs.github.io/CannaGuide-2025](https://qnbs.github.io/CannaGuide-2025/) · **Docs:** [DeepWiki](https://deepwiki.com/qnbs/CannaGuide-2025)

AI-powered, offline-first Progressive Web App for cannabis cultivation management. Simulates the full lifecycle from seed selection through harvest using VPD-based environmental modeling, 700+ strain library with genealogy tracking, multi-provider AI diagnostics, and comprehensive equipment planning — all running 100% client-side with no backend.

---

<!-- English version first, Deutsche Version folgt unten -->

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Feature Modules](#feature-modules)
- [AI Integration](#ai-integration)
- [Data Persistence](#data-persistence)
- [Security & Privacy](#security--privacy)
- [Internationalization](#internationalization)
- [Development](#development)
- [CI/CD Pipeline](#cicd-pipeline)
- [Distribution](#distribution)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [Disclaimer](#disclaimer)
- [Deutsche Version](#-cannaguide-2025-deutsch)

---

## Overview

CannaGuide 2025 is a production-grade PWA that operates entirely client-side. All data persists locally in IndexedDB, and the service worker provides full offline functionality. AI capabilities integrate with multiple providers (Gemini, OpenAI, Claude, Grok) via BYOK (Bring Your Own Key), with an 11-service local AI fallback stack for fully offline inference.

**Key numbers:** 700+ strains · 529+ tests · 51 services · 17 Redux slices · 16 custom hooks · 13 i18n namespaces · 9 themes · 18 CI workflows

---

## Architecture

Three-tier client-side architecture with offline-first design:

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer                                     │
│  React 19 · Radix UI · Tailwind CSS · 9 Themes         │
│  6 Views: Plants│Strains│Equipment│Knowledge│Settings│Help│
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                   │
│  51 Services · 16 Hooks · Web Workers                   │
│  VPD Simulation · AI Providers · Genetics · RAG         │
├─────────────────────────────────────────────────────────┤
│  State & Persistence Layer                              │
│  Redux Toolkit · 17 Slices · RTK Query                  │
│  Dual IndexedDB · Service Worker · Background Sync      │
└─────────────────────────────────────────────────────────┘
```

### Application Bootstrap

`index.html` → `index.tsx` (i18n init, Redux store hydration from IndexedDB, SW registration) → `App.tsx` (security gates: age verification, PIN lock, DSGVO consent) → lazy-loaded views via `React.Suspense`.

### Key Architectural Patterns

- **Offline-First:** Service Worker with Network-First navigation, Cache-First assets, Background Sync for offline action queuing
- **Dual IndexedDB:** `CannaGuideStateDB` (Redux state, debounce-save 1s, force-save on `visibilitychange`) + `CannaGuideDB` (strains, images, full-text search index)
- **Web Workers:** VPD simulation runs off main thread via `simulation.worker.ts`
- **Memoized Selectors:** Map-based cache keyed by entity ID, `??` over `||` for nullish safety
- **Safe Recovery:** Corrupted state → auto-clear + restart with session flag to prevent loops

---

## Technology Stack

| Category           | Technology                           | Purpose                                     |
| ------------------ | ------------------------------------ | ------------------------------------------- |
| **Runtime**        | React 19.2 + TypeScript (strict)     | Component UI with zero `any`                |
| **Build**          | Vite 7.3 + vite-plugin-pwa           | Fast HMR, InjectManifest SW                 |
| **State**          | Redux Toolkit 2.11 + RTK Query       | Centralized state, AI API caching           |
| **AI (Cloud)**     | Gemini, OpenAI, Claude, Grok         | Multi-provider BYOK abstraction             |
| **AI (Local)**     | Transformers.js, WebLLM, TF.js, ONNX | 11 services, 8 ML models, 3-layer fallback  |
| **Styling**        | Tailwind CSS 3.4 + Radix UI          | 9 cannabis themes via CSS custom properties |
| **Visualization**  | D3.js 7, Recharts                    | Genealogy trees, VPD charts                 |
| **Validation**     | Zod 3.25                             | Runtime schema validation for AI + imports  |
| **Persistence**    | IndexedDB (native)                   | Dual-database, no backend                   |
| **i18n**           | i18next 25                           | EN/DE, 13 namespaces                        |
| **Security**       | DOMPurify 3, Web Crypto AES-256-GCM  | XSS prevention, encrypted API keys          |
| **Testing**        | Vitest 4.1, Playwright 1.58, Stryker | 529+ unit, E2E, mutation tests              |
| **Error Tracking** | Sentry                               | Runtime errors, session replay              |
| **Desktop**        | Tauri v2 (Rust)                      | Native desktop wrapper                      |
| **Mobile**         | Capacitor                            | iOS/Android wrapper                         |

---

## Feature Modules

### Plants

Grow simulation from seed to harvest. VPD-based transpiration modeling, biomass growth curves, environmental monitoring. Multi-step new grow wizard, plant dashboard with lifecycle stages, journal system with photo timeline, AI diagnostics with image analysis, post-harvest drying/curing tracker. Yield prediction via ML regression.

### Strains

700+ strain library with full-text search, filtering by type/effects/THC/CBD/terpenes. D3.js genealogy explorer for parent-child lineage visualization. AI-powered growing tips. Breeding lab for cross predictions. Community strain sharing via anonymous GitHub Gists. Daily automated strain updates.

### Equipment

AI equipment configurator recommending optimal setups based on grow parameters. Calculator suite: ventilation (CFM), lighting (PPFD/DLI), nutrient mixing, pot sizing. Shopping list generation.

### Knowledge

AI Mentor chat with RAG (retrieval-augmented generation) pulling context from the user's grow journals. What-if sandbox for breeding simulations. Visual guides and interactive tutorials.

### Settings

9 visual themes, colorblind modes (deuteranopia, protanopia, tritanopia), WCAG 2.2 AA accessibility. BYOK API key management with AES-256-GCM encryption at rest. Data export/import (JSON). Cloud sync via encrypted GitHub Gists. Local-only mode toggle. TTS (text-to-speech) for AI responses.

### Help

Searchable FAQ, grower's lexicon (200+ terms), visual growing guides, user manual, legal information. All bilingual EN/DE.

---

## AI Integration

### Cloud AI (Multi-Provider BYOK)

All calls route through `aiProviderService.ts` → provider-specific services. Rate-limited (15 req/min sliding window). Structured JSON output via `responseSchema` with Zod validation.

| Provider      | Service               | Models           |
| ------------- | --------------------- | ---------------- |
| Google Gemini | `geminiService.ts`    | Primary provider |
| OpenAI        | `openaiService.ts`    | GPT series       |
| Anthropic     | `anthropicService.ts` | Claude series    |
| xAI           | `xaiService.ts`       | Grok series      |

### Local AI Stack (11 Services)

Fully offline inference with 3-layer fallback: WebLLM → Transformers.js → Heuristics.

| Service                              | Purpose                                                     |
| ------------------------------------ | ----------------------------------------------------------- |
| `localAI.ts`                         | Core orchestration (text gen, vision, diagnosis)            |
| `localAIModelLoader.ts`              | ONNX backend detection, pipeline loading (max 3 concurrent) |
| `localAiNlpService.ts`               | Sentiment, summarization, zero-shot classification          |
| `localAiEmbeddingService.ts`         | MiniLM-L6 embeddings, semantic ranking                      |
| `localAiFallbackService.ts`          | Heuristic fallback when models unavailable                  |
| `localAiLanguageDetectionService.ts` | EN/DE detection (model + heuristic)                         |
| `localAiImageSimilarityService.ts`   | CLIP feature extraction, growth tracking                    |
| `localAiHealthService.ts`            | Device classification, adaptive model selection             |
| `localAiPreloadService.ts`           | Model preload state (localStorage)                          |
| `localAiTelemetryService.ts`         | Inference latency/success tracking                          |
| `localAiCacheService.ts`             | IndexedDB inference cache (256 entries, 7d TTL)             |

### Prompt Engineering & RAG

- `createLocalizedPrompt`: Auto-prepends language-specific instructions
- `sanitizeForPrompt`: 30+ regex patterns block injection (SQL, XSS, command, jailbreak)
- `growLogRagService`: Token-based journal search with recency boosting (top 5 entries)
- `formatPlantContextForPrompt`: Structures plant vitals for consistent AI context
- EXIF/GPS stripping before image transmission

---

## Data Persistence

### Dual IndexedDB Architecture

| Database            | Purpose                       | Key Mechanisms                                                                            |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| `CannaGuideStateDB` | Redux state                   | Promise-locked hydration, debounce-save (1s), force-save on `visibilitychange`/`pagehide` |
| `CannaGuideDB`      | Strains, images, search index | Auto-pruned images, full-text search via key ranges on `nameIndex`                        |

### Offline Action Queue

When offline, user actions queue to `offline_actions` store in IndexedDB. Service worker detects connectivity via `sync` event and posts messages to replay actions in all open tabs — no backend required.

---

## Security & Privacy

Defense-in-depth across multiple layers:

| Layer                       | Implementation                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| **Input Sanitization**      | DOMPurify v3 on all `dangerouslySetInnerHTML`, ALLOWED_TAGS/ATTR config                         |
| **Prompt Injection**        | 30+ regex patterns in `sanitizeForPrompt` blocking SQL, XSS, command, path traversal, jailbreak |
| **API Key Encryption**      | AES-256-GCM via Web Crypto API with random 96-bit IV (`cryptoService.ts`)                       |
| **Content Security Policy** | Hardened CSP across 4 delivery paths (Vite, index.html, Netlify, Tauri)                         |
| **EXIF Stripping**          | Canvas re-encode removes GPS/metadata before AI transmission                                    |
| **Access Gates**            | Age verification (KCanG §1), optional PIN lock, DSGVO consent                                   |
| **SAST**                    | CodeQL (security-and-quality), Trivy filesystem scan, trojan-source scanner                     |
| **Secret Scanning**         | Gitleaks, Semgrep                                                                               |
| **External Links**          | `rel="noopener noreferrer"` on all external anchors                                             |
| **Local-Only Mode**         | All outbound services check `isLocalOnlyMode()` before fetch                                    |
| **Error Tracking**          | Sentry with `console.debug` only (no `console.log`/`console.warn` in production)                |

---

## Internationalization

i18next with 13 namespaces, EN + DE:

`common` · `plants` · `strains` · `strainsData` · `equipment` · `knowledge` · `settings` · `help` · `commandPalette` · `onboarding` · `seedbanks` · `legal`

**In components:** `const { t } = useTranslation('namespace')`
**In services:** `import { getT } from '@/i18n'`
**AI prompts:** Auto-localized via `createLocalizedPrompt`

---

## Development

### Prerequisites

Node.js 20+, npm 10+

### Commands

```bash
npm run dev              # Vite dev server (localhost:5173)
npm run build            # Production build
npm test                 # Vitest unit/integration (529+ tests)
npm run test:e2e         # Playwright E2E
npm run test:ct          # Playwright component tests
npm run test:mutation    # Stryker mutation testing
npm run lint             # ESLint changed files
npm run lint:full        # ESLint entire project
npx tsc --noEmit         # Type check
npm run format           # Prettier
npm run security:scan    # Full security scan
```

### Project Structure

```
├── components/          React components (common/, icons/, navigation/, ui/, views/)
├── stores/              Redux: 17 slices, selectors, middleware
├── services/            51 service modules (AI, simulation, DB, crypto, IoT)
├── hooks/               16 custom hooks
├── data/                Static data: 700+ strains, FAQ, lexicon, guides
├── locales/             i18n: en/, de/ (13 namespaces each)
├── workers/             Web Workers: VPD simulation, genealogy, scenarios
├── utils/               Shared utilities
├── types/               TypeScript types + Zod schemas
├── tests/               E2E (tests/e2e/), component tests (tests/ct/)
├── lib/                 Utility library (cn(), VPD calculations)
├── public/              Static assets, SW, manifest
├── src-tauri/           Tauri v2 desktop (Rust backend + capabilities)
├── apps/desktop/        Tauri desktop wrapper (Rust IPC commands)
├── packages/            Monorepo packages (ai-core, iot-mocks, ui)
├── scripts/             Build/lint/security scripts
├── docker/              nginx config, ESP32-mock, Tauri-mock
└── .github/             18 CI/CD workflows, issue templates
```

---

## CI/CD Pipeline

### Main CI Workflow (`ci.yml`)

6 jobs, zero `continue-on-error`, gate job requires all to pass:

| Job                     | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| 🔍 Quality Gates        | Lint, typecheck (root + workspaces via Turbo), 529+ tests, production build |
| 🛡 Security             | npm audit (critical), trojan-source scan, Trivy filesystem scan             |
| 🎭 E2E Tests            | Playwright Chromium (needs quality artifact)                                |
| 🐳 Docker Compose + IoT | ESP32-mock + Tauri-mock healthcheck, sensor endpoint validation             |
| 🖥 Tauri Build Check    | `cargo check` on ubuntu-22.04 with Linux deps                               |
| ✅ CI Status            | Gate job — all 5 must pass                                                  |

### Additional Workflows

| Workflow                | Trigger          | Purpose                                             |
| ----------------------- | ---------------- | --------------------------------------------------- |
| CodeQL                  | push, PR, weekly | SAST analysis (JavaScript/TypeScript)               |
| Security Alerts Handoff | daily, manual    | Auto-report open Dependabot + CodeQL alerts to docs |
| Deploy                  | push to main     | GitHub Pages deployment + Lighthouse                |
| E2E & Integration       | push, PR         | Standalone E2E suite                                |
| Tauri Build             | release tags     | Cross-platform desktop builds                       |
| Capacitor Build         | release tags     | iOS/Android builds                                  |
| Docker                  | release tags     | Container image                                     |
| Mutation Tests          | push to main     | Stryker mutation testing                            |
| Strains Daily Update    | cron             | Automated strain data refresh                       |
| Renovate                | bot              | Dependency updates                                  |

---

## Distribution

| Target               | Method                | Trigger            |
| -------------------- | --------------------- | ------------------ |
| **GitHub Pages**     | `deploy.yml`          | Push to `main`     |
| **Netlify**          | `netlify.toml`        | PR preview deploys |
| **Docker**           | `docker.yml`          | Release tag `v*`   |
| **Tauri Desktop**    | `tauri-build.yml`     | Release tag `v*`   |
| **Capacitor Mobile** | `capacitor-build.yml` | Release tag `v*`   |

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. [Open an issue](https://github.com/qnbs/CannaGuide-2025/issues) to discuss
2. Fork → branch (`git checkout -b feature/my-feature`) → commit → push → PR
3. Follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>`

---

## Roadmap

> Full details: [ROADMAP.md](ROADMAP.md)

| Version  | Status      | Highlights                                                                                                                                                 |
| -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1.0** | ✅ Released | 700+ strains, VPD simulation, multi-provider AI, DSGVO/WCAG, ESP32, breeding lab, EN/DE                                                                    |
| **v1.1** | ✅ Released | Local AI stack (WebLLM + Transformers.js + CLIP), ONNX routing, inference cache, Sentry, cloud sync, 529+ tests, Tauri v2, Docker IoT mocks, CodeQL, Trivy |
| **v1.2** | 🔄 Planned  | Additional languages (ES, FR, NL), nutrient automation, community marketplace, PDF reports                                                                 |
| **v1.3** | 📋 Planned  | Additional IoT sensors, timelapse journal, strain comparison, 3D visualizations                                                                            |
| **v1.4** | 📋 Planned  | Strain-scale program (2,000+ mid-term), infinite discovery feed (news, HD galleries), expanded practical guides and extraction education                   |
| **v1.5** | 📋 Planned  | Curated DE/EN video hub, scholarly lexicon expansion (endocannabinoid system, pharmacology, botany, genetics), source transparency layer                   |
| **v2.0** | 📋 Planned  | AR/VR plant overlay, digital twin architecture for user plants, next-gen What-if Sandbox and BreedingLab                                                   |

### Strategic Expansion Focus (2026-2028)

- **Strain Library at Scale:** Expand from 700+ to 2,000+ curated strains mid-term, then to multi-ten-thousand catalog entries long-term with provenance, duplicate detection, and quality scoring.
- **Infinite Discovery Surfaces:** Build an endless-scroll discovery page with category streams for cannabis news, official HD plant image collections, and educational media blocks.
- **Knowledge System Upgrade:** Extend guides, manuals, and lexicon into a multimedia learning layer, including modern extraction topics (e.g., static hash workflows and process safety).
- **Video Knowledge Curation:** Introduce a bilingual (EN/DE) curated video compilation page for high-signal grow/vlogger content with topic tagging and quality gates.
- **Scholarly Lexicon Program:** Grow Help lexicon toward a comprehensive encyclopedia (cannabinoids, ECS, entourage, botany, biology, chemistry, genetics, pharmacology, medicine, evolution) with academically traceable references.
- **AR/VR and Digital Twins:** Implement camera-assisted AR/VR plant overlays and progressively enrich simulation models into practical digital twins for user plants.
- **Sandbox and BreedingLab Evolution:** Expand scenario depth, trait simulation, and what-if experimentation to support advanced planning, phenotype strategy, and reproducible breeding workflows.

---

## Disclaimer

> All information in this app is for educational and entertainment purposes only. Cannabis cultivation is subject to strict regulations. Please check the laws in your region and always act responsibly and legally. This app does not provide legal or medical advice.

---

---

# 🌿 CannaGuide 2025 (Deutsch)

[![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/badge/Release-v1.1.0-brightgreen)](https://github.com/qnbs/CannaGuide-2025/releases)
[![CI](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)
[![CodeQL](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml)
[![Deploy](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml)
[![Security Alerts Handoff](https://github.com/qnbs/CannaGuide-2025/actions/workflows/security-alerts-handoff.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/security-alerts-handoff.yml)
[![Dependabot Alerts](https://img.shields.io/github/dependabot-alerts/qnbs/CannaGuide-2025)](https://github.com/qnbs/CannaGuide-2025/security/dependabot)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/qnbs/CannaGuide-2025/badge)](https://securityscorecards.dev/viewer/?uri=github.com/qnbs/CannaGuide-2025)

**Live:** [qnbs.github.io/CannaGuide-2025](https://qnbs.github.io/CannaGuide-2025/) · **Doku:** [DeepWiki](https://deepwiki.com/qnbs/CannaGuide-2025)

KI-gestützte, offline-first Progressive Web App für Cannabis-Anbau-Management. Simuliert den kompletten Lebenszyklus von der Sortenauswahl bis zur Ernte mit VPD-basierter Umgebungsmodellierung, 700+ Sorten-Bibliothek mit Genealogie-Tracking, Multi-Provider KI-Diagnostik und umfassender Ausrüstungsplanung — alles 100% clientseitig ohne Backend.

---

## Inhaltsverzeichnis

- [Überblick](#überblick)
- [Architektur](#architektur)
- [Technologie-Stack](#technologie-stack)
- [Feature-Module](#feature-module)
- [KI-Integration](#ki-integration)
- [Datenpersistenz](#datenpersistenz)
- [Sicherheit & Datenschutz](#sicherheit--datenschutz)
- [Internationalisierung](#internationalisierung)
- [Entwicklung](#entwicklung)
- [CI/CD-Pipeline](#cicd-pipeline)
- [Distribution](#distribution-1)
- [Mitwirken](#mitwirken)
- [Roadmap](#roadmap-1)
- [Haftungsausschluss](#haftungsausschluss)

---

## Überblick

CannaGuide 2025 ist eine produktionsreife PWA, die vollständig clientseitig arbeitet. Alle Daten werden lokal in IndexedDB gespeichert, der Service Worker bietet volle Offline-Funktionalität. KI-Funktionen integrieren mehrere Anbieter (Gemini, OpenAI, Claude, Grok) via BYOK (Bring Your Own Key), mit einem 11-Service lokalen KI-Fallback-Stack für vollständig offline Inferenz.

**Kennzahlen:** 700+ Sorten · 529+ Tests · 51 Services · 17 Redux Slices · 16 Custom Hooks · 13 i18n-Namensräume · 9 Themes · 18 CI-Workflows

---

## Architektur

Dreischichtige clientseitige Architektur mit Offline-First-Design:

```
┌─────────────────────────────────────────────────────────┐
│  Präsentationsschicht                                   │
│  React 19 · Radix UI · Tailwind CSS · 9 Themes         │
│  6 Views: Pflanzen│Sorten│Ausrüstung│Wissen│Settings│Hilfe│
├─────────────────────────────────────────────────────────┤
│  Business-Logik-Schicht                                 │
│  51 Services · 16 Hooks · Web Workers                   │
│  VPD-Simulation · KI-Provider · Genetik · RAG           │
├─────────────────────────────────────────────────────────┤
│  State- & Persistenzschicht                             │
│  Redux Toolkit · 17 Slices · RTK Query                  │
│  Dual IndexedDB · Service Worker · Background Sync      │
└─────────────────────────────────────────────────────────┘
```

### Anwendungsstart

`index.html` → `index.tsx` (i18n-Init, Redux-Store-Hydration aus IndexedDB, SW-Registrierung) → `App.tsx` (Sicherheits-Gates: Altersverifikation, PIN-Sperre, DSGVO-Einwilligung) → Lazy-geladene Views via `React.Suspense`.

### Zentrale Architekturmuster

- **Offline-First:** Service Worker mit Network-First Navigation, Cache-First Assets, Background Sync für Offline-Action-Queuing
- **Dual IndexedDB:** `CannaGuideStateDB` (Redux State, Debounce-Save 1s, Force-Save bei `visibilitychange`) + `CannaGuideDB` (Sorten, Bilder, Volltextsuche-Index)
- **Web Workers:** VPD-Simulation läuft off-thread via `simulation.worker.ts`
- **Memoisierte Selektoren:** Map-basierter Cache mit Entity-ID-Key, `??` statt `||` für Nullish-Sicherheit
- **Safe Recovery:** Korrupter State → Auto-Clear + Neustart mit Session-Flag gegen Endlos-Schleifen

---

## Technologie-Stack

| Kategorie          | Technologie                          | Zweck                                         |
| ------------------ | ------------------------------------ | --------------------------------------------- |
| **Runtime**        | React 19.2 + TypeScript (strict)     | Komponenten-UI mit null `any`                 |
| **Build**          | Vite 7.3 + vite-plugin-pwa           | Schnelles HMR, InjectManifest SW              |
| **State**          | Redux Toolkit 2.11 + RTK Query       | Zentraler State, KI-API-Caching               |
| **KI (Cloud)**     | Gemini, OpenAI, Claude, Grok         | Multi-Provider BYOK-Abstraktion               |
| **KI (Lokal)**     | Transformers.js, WebLLM, TF.js, ONNX | 11 Services, 8 ML-Modelle, 3-Schicht-Fallback |
| **Styling**        | Tailwind CSS 3.4 + Radix UI          | 9 Cannabis-Themes via CSS Custom Properties   |
| **Visualisierung** | D3.js 7, Recharts                    | Stammbaum-Bäume, VPD-Diagramme                |
| **Validierung**    | Zod 3.25                             | Runtime-Schema-Validierung für KI + Imports   |
| **Persistenz**     | IndexedDB (nativ)                    | Dual-Datenbank, kein Backend                  |
| **i18n**           | i18next 25                           | EN/DE, 13 Namensräume                         |
| **Sicherheit**     | DOMPurify 3, Web Crypto AES-256-GCM  | XSS-Prävention, verschlüsselte API-Keys       |
| **Testing**        | Vitest 4.1, Playwright 1.58, Stryker | 529+ Unit-, E2E-, Mutations-Tests             |
| **Fehlertracking** | Sentry                               | Runtime-Fehler, Session Replay                |
| **Desktop**        | Tauri v2 (Rust)                      | Nativer Desktop-Wrapper                       |
| **Mobil**          | Capacitor                            | iOS/Android-Wrapper                           |

---

## Feature-Module

### Pflanzen

Grow-Simulation von Samen bis Ernte. VPD-basierte Transpirationsmodellierung, Biomasse-Wachstumskurven, Umweltüberwachung. Mehrstufiger Grow-Wizard, Pflanzen-Dashboard mit Lebenszyklus-Phasen, Journal-System mit Foto-Timeline, KI-Diagnostik mit Bildanalyse, Post-Harvest Trocknung/Curing-Tracker. Ertragsprognose via ML-Regression.

### Sorten

700+ Sorten-Bibliothek mit Volltextsuche, Filterung nach Typ/Effekte/THC/CBD/Terpene. D3.js Genealogie-Explorer für Eltern-Kind-Abstammungsvisualisierung. KI-gestützte Anbautipps. Zuchtlabor für Kreuzungsvorhersagen. Community-Sorten-Sharing via anonyme GitHub Gists. Tägliche automatisierte Sorten-Updates.

### Ausrüstung

KI-Ausrüstungskonfigurator mit optimalen Setup-Empfehlungen basierend auf Grow-Parametern. Rechner-Suite: Belüftung (CFM), Beleuchtung (PPFD/DLI), Nährstoffmischung, Topfgröße. Einkaufslisten-Generierung.

### Wissen

KI-Mentor-Chat mit RAG (Retrieval-Augmented Generation) zieht Kontext aus den Grow-Journals des Nutzers. What-If-Sandbox für Zucht-Simulationen. Visuelle Guides und interaktive Tutorials.

### Einstellungen

9 visuelle Themes, Farbenblind-Modi (Deuteranopie, Protanopie, Tritanopie), WCAG 2.2 AA Barrierefreiheit. BYOK API-Key-Verwaltung mit AES-256-GCM-Verschlüsselung at rest. Datenexport/-import (JSON). Cloud-Sync via verschlüsselte GitHub Gists. Nur-Lokal-Modus. TTS (Text-to-Speech) für KI-Antworten.

### Hilfe

Durchsuchbare FAQ, Grower-Lexikon (200+ Begriffe), visuelle Anbauguides, Benutzerhandbuch, Rechtsinformationen. Alles bilingual EN/DE.

---

## KI-Integration

### Cloud-KI (Multi-Provider BYOK)

Alle Aufrufe routen über `aiProviderService.ts` → Provider-spezifische Services. Rate-limitiert (15 Req/Min Sliding Window). Strukturierte JSON-Ausgabe via `responseSchema` mit Zod-Validierung.

| Anbieter      | Service               | Modelle           |
| ------------- | --------------------- | ----------------- |
| Google Gemini | `geminiService.ts`    | Primärer Provider |
| OpenAI        | `openaiService.ts`    | GPT-Serie         |
| Anthropic     | `anthropicService.ts` | Claude-Serie      |
| xAI           | `xaiService.ts`       | Grok-Serie        |

### Lokaler KI-Stack (11 Services)

Vollständig offline Inferenz mit 3-Schicht-Fallback: WebLLM → Transformers.js → Heuristiken.

| Service                              | Zweck                                                   |
| ------------------------------------ | ------------------------------------------------------- |
| `localAI.ts`                         | Kernorchestrierung (Textgen, Vision, Diagnose)          |
| `localAIModelLoader.ts`              | ONNX-Backend-Erkennung, Pipeline-Laden (max 3 parallel) |
| `localAiNlpService.ts`               | Sentiment, Zusammenfassung, Zero-Shot-Klassifikation    |
| `localAiEmbeddingService.ts`         | MiniLM-L6 Embeddings, semantisches Ranking              |
| `localAiFallbackService.ts`          | Heuristik-Fallback wenn Modelle nicht verfügbar         |
| `localAiLanguageDetectionService.ts` | EN/DE-Erkennung (Modell + Heuristik)                    |
| `localAiImageSimilarityService.ts`   | CLIP-Feature-Extraktion, Wachstumstracking              |
| `localAiHealthService.ts`            | Geräteklassifikation, adaptive Modellauswahl            |
| `localAiPreloadService.ts`           | Modell-Preload-State (localStorage)                     |
| `localAiTelemetryService.ts`         | Inferenz-Latenz/Erfolgs-Tracking                        |
| `localAiCacheService.ts`             | IndexedDB-Inferenz-Cache (256 Einträge, 7d TTL)         |

### Prompt Engineering & RAG

- `createLocalizedPrompt`: Auto-Prepend sprachspezifischer Anweisungen
- `sanitizeForPrompt`: 30+ Regex-Patterns blocken Injection (SQL, XSS, Command, Jailbreak)
- `growLogRagService`: Token-basierte Journal-Suche mit Aktualitäts-Boosting (Top 5)
- `formatPlantContextForPrompt`: Strukturiert Pflanzenvitaldaten für konsistenten KI-Kontext
- EXIF/GPS-Stripping vor Bildübertragung

---

## Datenpersistenz

### Dual-IndexedDB-Architektur

| Datenbank           | Zweck                     | Mechanismen                                                                                |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| `CannaGuideStateDB` | Redux State               | Promise-locked Hydration, Debounce-Save (1s), Force-Save bei `visibilitychange`/`pagehide` |
| `CannaGuideDB`      | Sorten, Bilder, Suchindex | Auto-bereinigte Bilder, Volltextsuche via Key-Ranges auf `nameIndex`                       |

### Offline-Action-Queue

Bei Offline werden Aktionen in `offline_actions` in IndexedDB gespeichert. Service Worker erkennt Konnektivität via `sync`-Event und sendet Nachrichten zum Replay in allen offenen Tabs — kein Backend nötig.

---

## Sicherheit & Datenschutz

Defense-in-Depth über mehrere Schichten:

| Schicht                     | Implementierung                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| **Eingabe-Sanitisierung**   | DOMPurify v3 auf allen `dangerouslySetInnerHTML`, ALLOWED_TAGS/ATTR-Konfig                     |
| **Prompt-Injection**        | 30+ Regex-Patterns in `sanitizeForPrompt` blocken SQL, XSS, Command, Pfad-Traversal, Jailbreak |
| **API-Key-Verschlüsselung** | AES-256-GCM via Web Crypto API mit zufälligem 96-Bit IV (`cryptoService.ts`)                   |
| **Content Security Policy** | Gehärtete CSP über 4 Delivery-Pfade (Vite, index.html, Netlify, Tauri)                         |
| **EXIF-Stripping**          | Canvas-Re-Encode entfernt GPS/Metadaten vor KI-Übertragung                                     |
| **Zugangs-Gates**           | Altersverifikation (KCanG §1), optionale PIN-Sperre, DSGVO-Einwilligung                        |
| **SAST**                    | CodeQL (Security-and-Quality), Trivy-Filesystem-Scan, Trojan-Source-Scanner                    |
| **Secret-Scanning**         | Gitleaks, Semgrep                                                                              |
| **Externe Links**           | `rel="noopener noreferrer"` auf allen externen Anchors                                         |
| **Nur-Lokal-Modus**         | Alle ausgehenden Services prüfen `isLocalOnlyMode()` vor Fetch                                 |
| **Fehlertracking**          | Sentry mit nur `console.debug` (kein `console.log`/`console.warn` in Produktion)               |

---

## Internationalisierung

i18next mit 13 Namensräumen, EN + DE:

`common` · `plants` · `strains` · `strainsData` · `equipment` · `knowledge` · `settings` · `help` · `commandPalette` · `onboarding` · `seedbanks` · `legal`

**In Komponenten:** `const { t } = useTranslation('namespace')`
**In Services:** `import { getT } from '@/i18n'`
**KI-Prompts:** Auto-lokalisiert via `createLocalizedPrompt`

---

## Entwicklung

### Voraussetzungen

Node.js 20+, npm 10+

### Befehle

```bash
npm run dev              # Vite Dev-Server (localhost:5173)
npm run build            # Produktions-Build
npm test                 # Vitest Unit/Integration (529+ Tests)
npm run test:e2e         # Playwright E2E
npm run test:ct          # Playwright Komponenten-Tests
npm run test:mutation    # Stryker Mutations-Tests
npm run lint             # ESLint geänderte Dateien
npm run lint:full        # ESLint gesamtes Projekt
npx tsc --noEmit         # Type-Check
npm run format           # Prettier
npm run security:scan    # Vollständiger Sicherheits-Scan
```

### Projektstruktur

```
├── components/          React-Komponenten (common/, icons/, navigation/, ui/, views/)
├── stores/              Redux: 17 Slices, Selektoren, Middleware
├── services/            51 Service-Module (KI, Simulation, DB, Krypto, IoT)
├── hooks/               16 Custom Hooks
├── data/                Statische Daten: 700+ Sorten, FAQ, Lexikon, Guides
├── locales/             i18n: en/, de/ (je 13 Namensräume)
├── workers/             Web Workers: VPD-Simulation, Genealogie, Szenarien
├── types/               TypeScript-Typen + Zod-Schemas
├── tests/               E2E (tests/e2e/), Komponenten-Tests (tests/ct/)
├── src-tauri/           Tauri v2 Desktop (Rust-Backend + Capabilities)
├── packages/            Monorepo-Pakete (ai-core, iot-mocks, ui)
├── docker/              nginx-Konfig, ESP32-Mock, Tauri-Mock
└── .github/             16 CI/CD-Workflows, Issue-Templates
```

---

## CI/CD-Pipeline

### Haupt-CI-Workflow (`ci.yml`)

6 Jobs, null `continue-on-error`, Gate-Job erfordert alle:

| Job                     | Beschreibung                                                                 |
| ----------------------- | ---------------------------------------------------------------------------- |
| 🔍 Quality Gates        | Lint, Typecheck (Root + Workspaces via Turbo), 529+ Tests, Produktions-Build |
| 🛡 Security             | npm audit (critical), Trojan-Source-Scan, Trivy-Filesystem-Scan              |
| 🎭 E2E Tests            | Playwright Chromium (benötigt Quality-Artefakt)                              |
| 🐳 Docker Compose + IoT | ESP32-Mock + Tauri-Mock Healthcheck, Sensor-Endpunkt-Validierung             |
| 🖥 Tauri Build Check    | `cargo check` auf ubuntu-22.04 mit Linux-Deps                                |
| ✅ CI Status            | Gate-Job — alle 5 müssen bestehen                                            |

### Weitere Workflows

| Workflow             | Trigger               | Zweck                                    |
| -------------------- | --------------------- | ---------------------------------------- |
| CodeQL               | Push, PR, wöchentlich | SAST-Analyse (JavaScript/TypeScript)     |
| Deploy               | Push auf main         | GitHub Pages Deployment + Lighthouse     |
| E2E & Integration    | Push, PR              | Eigenständige E2E-Suite                  |
| Tauri Build          | Release-Tags          | Cross-Platform Desktop-Builds            |
| Capacitor Build      | Release-Tags          | iOS/Android-Builds                       |
| Docker               | Release-Tags          | Container-Image                          |
| Mutation Tests       | Push auf main         | Stryker Mutations-Tests                  |
| Strains Daily Update | Cron                  | Automatische Sorten-Daten-Aktualisierung |
| Renovate             | Bot                   | Dependency-Updates                       |

---

## Distribution

| Ziel                | Methode               | Trigger            |
| ------------------- | --------------------- | ------------------ |
| **GitHub Pages**    | `deploy.yml`          | Push auf `main`    |
| **Netlify**         | `netlify.toml`        | PR-Preview-Deploys |
| **Docker**          | `docker.yml`          | Release-Tag `v*`   |
| **Tauri Desktop**   | `tauri-build.yml`     | Release-Tag `v*`   |
| **Capacitor Mobil** | `capacitor-build.yml` | Release-Tag `v*`   |

---

## Mitwirken

Beiträge willkommen! Siehe [CONTRIBUTING.md](CONTRIBUTING.md) für Richtlinien.

1. [Issue eröffnen](https://github.com/qnbs/CannaGuide-2025/issues) zur Diskussion
2. Fork → Branch (`git checkout -b feature/mein-feature`) → Commit → Push → PR
3. [Conventional Commits](https://www.conventionalcommits.org/) einhalten: `<type>(<scope>): <beschreibung>`

---

## Roadmap

> Vollständige Details: [ROADMAP.md](ROADMAP.md)

| Version  | Status            | Highlights                                                                                                                                                  |
| -------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1.0** | ✅ Veröffentlicht | 700+ Sorten, VPD-Simulation, Multi-Provider KI, DSGVO/WCAG, ESP32, Zuchtlabor, EN/DE                                                                        |
| **v1.1** | ✅ Veröffentlicht | Lokaler KI-Stack (WebLLM + Transformers.js + CLIP), ONNX-Routing, Inferenz-Cache, Sentry, Cloud-Sync, 529+ Tests, Tauri v2, Docker IoT-Mocks, CodeQL, Trivy |
| **v1.2** | 🔄 Geplant        | Weitere Sprachen (ES, FR, NL), Nährstoff-Automatisierung, Community-Marktplatz, PDF-Berichte                                                                |
| **v1.3** | 📋 Geplant        | Weitere IoT-Sensoren, Zeitraffer-Journal, Sorten-Vergleich, 3D-Visualisierungen                                                                             |
| **v1.4** | 📋 Geplant        | Sorten-Skalierungsprogramm (mittelfristig 2.000+), endloser Discovery-Feed (News, HD-Galerien), Ausbau praxisnaher Anleitungen und Extraktionswissen        |
| **v1.5** | 📋 Geplant        | Kuratierter DE/EN-Video-Hub, akademische Lexikon-Erweiterung (Endocannabinoid-System, Pharmakologie, Botanik, Genetik), Quellen-Transparenz                 |
| **v2.0** | 📋 Geplant        | AR/VR-Pflanzenoverlay, Digital-Twin-Architektur für Nutzerpflanzen, nächste Ausbaustufe für What-if-Sandbox und BreedingLab                                 |

### Strategische Ausbau-Schwerpunkte (2026-2028)

- **Sortenbibliothek in großem Maßstab:** Ausbau von 700+ auf mittelfristig 2.000+ kuratierte Sorten und langfristig mehrere zehntausend Einträge mit Herkunft, Dubletten-Erkennung und Qualitäts-Scoring.
- **Unendliche Discovery-Flächen:** Einführung einer Endlos-Scrolling-Seite mit Kategorien für Cannabis-News, offizielle HD-Pflanzenbild-Sammlungen und kuratierte Wissensströme.
- **Wissenssystem-Upgrade:** Ausbau von Anleitungen, Handbüchern und Lexika zu einer multimedialen Lernschicht inklusive moderner Extraktionsverfahren (z. B. Static Hash und Prozesssicherheit).
- **Video-Wissenskuratierung:** Aufbau einer zweisprachigen (DE/EN) Video-Kompilationsseite für hochwertige Grow-/Vlogger-Inhalte mit Themen-Tags und Qualitätskriterien.
- **Scholarly-Lexikon-Programm:** Entwicklung des Hilfe-Lexikons zur umfassenden Enzyklopädie (Cannabinoide, ECS, Entourage, Botanik, Biologie, Chemie, Genetik, Pharmakologie, Medizin, Evolution) mit akademisch nachvollziehbaren Quellen.
- **AR/VR und digitale Zwillinge:** Einführung kameragestützter AR/VR-Overlays und schrittweise Weiterentwicklung der Simulation zu praxisnahen digitalen Zwillingen der Nutzerpflanzen.
- **What-if- und BreedingLab-Weiterentwicklung:** Mehr Szenariotiefe, Merkmals-Simulation und reproduzierbare Zucht-Workflows für strategische Planung und Phänotyp-Entscheidungen.

---

## Haftungsausschluss

> Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und im Einklang mit dem Gesetz. Diese App bietet keine Rechts- oder Medizinberatung.

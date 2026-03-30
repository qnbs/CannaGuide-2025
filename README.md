# 🌿 CannaGuide 2025

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/qnbs/CannaGuide-2025)

<!-- markdownlint-disable MD060 -->

<!-- Status & Quality -->

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/badge/release-v1.2.0--alpha-brightgreen)](https://github.com/qnbs/CannaGuide-2025/releases)
[![CI](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)
[![CodeQL](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml)
[![Deploy](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml)
[![Tests](https://img.shields.io/badge/tests-928%2B%20passed-brightgreen)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)

<!-- AI Development Stack -->

[![Prototyped in AI Studio](https://img.shields.io/badge/Prototyped%20in-Google%20AI%20Studio-4285F4)](https://aistudio.google.com)
[![Evaluated by Grok](https://img.shields.io/badge/Evaluated%20by-xAI%20Grok-000000)](https://x.ai)
[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20Opus%204.6-cc785c)](https://claude.ai)
[![GitHub Codespaces](https://img.shields.io/badge/Dev%20in-GitHub%20Codespaces-24292e)](https://github.com/codespaces)
[![Consulting: Gemini](https://img.shields.io/badge/Consulting-Gemini%203.1%20Pro-4285F4)](https://deepmind.google/technologies/gemini/)

<!-- App Capabilities -->

[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline-blueviolet)](https://qnbs.github.io/CannaGuide-2025/)
[![i18n](https://img.shields.io/badge/i18n-EN%20|%20DE%20|%20ES%20|%20FR%20|%20NL-orange)](https://qnbs.github.io/CannaGuide-2025/)
[![WCAG 2.2 AA](https://img.shields.io/badge/a11y-WCAG%202.2%20AA-green)](https://qnbs.github.io/CannaGuide-2025/)

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
- [Development Journey](#development-journey)
- [Disclaimer](#disclaimer)
- [Deutsche Version](#-cannaguide-2025-deutsch)

---

## Overview

CannaGuide 2025 is a production-grade PWA that operates entirely client-side. All data persists locally in IndexedDB, and the service worker provides full offline functionality. AI capabilities integrate with multiple providers (Gemini, OpenAI, Claude, Grok) via BYOK (Bring Your Own Key), with an 15-service local AI fallback stack for fully offline inference.

**Key numbers:** 700+ strains · 928+ tests · 51 services · 15 Redux slices + 3 Zustand stores · 16 custom hooks · 13 i18n namespaces · 9 themes · 20 CI workflows

---

## Architecture

Three-tier client-side architecture with offline-first design:

```text
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
│  Redux Toolkit (15 Slices) · Zustand (UI) · RTK Query   │
│  Dual IndexedDB · Service Worker · Background Sync      │
└─────────────────────────────────────────────────────────┘
```

### Application Bootstrap

`index.html` → `index.tsx` (i18n init, Redux store hydration from IndexedDB, Zustand UI state hydration, SW registration) → `App.tsx` (security gates: age verification, PIN lock, DSGVO consent) → lazy-loaded views via `React.Suspense`.

### Key Architectural Patterns

- **Offline-First:** Service Worker with Network-First navigation, Cache-First assets, Background Sync for offline action queuing
- **Dual IndexedDB:** `CannaGuideStateDB` (Redux state, debounce-save 1s, force-save on `visibilitychange`) + `CannaGuideDB` (strains, images, full-text search index)
- **WorkerBus:** Centralized promise-based Web Worker dispatcher (`workerBus.ts`) manages 6 workers (VPD simulation, genealogy, scenarios, inference, image generation, VPD chart) with automatic timeout, messageId correlation, backpressure queue, retry with exponential backoff, telemetry, and safe teardown on pagehide ([docs](docs/worker-bus.md))
- **AI Streaming UX:** All AI views (Mentor, Advisor, Diagnosis) use character-by-character streaming with typing indicators for responsive feedback
- **Structured AI Output:** Zod-validated `responseSchema` for all AI function-calling responses
- **Memoized Selectors:** Map-based cache keyed by entity ID, `??` over `||` for nullish safety
- **Safe Recovery:** Corrupted state → auto-clear + restart with session flag to prevent loops

---

## Technology Stack

| Category           | Technology                           | Purpose                                     |
| ------------------ | ------------------------------------ | ------------------------------------------- |
| **Runtime**        | React 19.2 + TypeScript (strict)     | Component UI with zero `any`                |
| **Build**          | Vite 7.3 + vite-plugin-pwa           | Fast HMR, InjectManifest SW                 |
| **State**          | Redux Toolkit 2.11 + Zustand 5       | Redux for domain data, Zustand for UI state |
| **API Cache**      | RTK Query                            | AI API caching                              |
| **AI (Cloud)**     | Gemini, OpenAI, Claude, Grok         | Multi-provider BYOK abstraction             |
| **AI (Local)**     | Transformers.js, WebLLM, TF.js, ONNX | 15 services, 8 ML models, 3-layer fallback  |
| **Styling**        | Tailwind CSS 3.4 + Radix UI          | 9 cannabis themes via CSS custom properties |
| **Visualization**  | D3.js 7, Recharts                    | Genealogy trees, VPD charts                 |
| **Validation**     | Zod 3.25                             | Runtime schema validation for AI + imports  |
| **Persistence**    | IndexedDB (native)                   | Dual-database, no backend                   |
| **i18n**           | i18next 25                           | EN/DE/ES/FR/NL, 13 namespaces               |
| **Security**       | DOMPurify 3, Web Crypto AES-256-GCM  | XSS prevention, encrypted API keys          |
| **Testing**        | Vitest 4.1, Playwright 1.58          | 928+ unit, E2E, component tests             |
| **Error Tracking** | Sentry                               | Runtime errors, session replay              |
| **Desktop**        | Tauri v2 (Rust)                      | Native desktop wrapper                      |
| **Mobile**         | Capacitor                            | iOS/Android wrapper                         |

---

## Feature Modules

### Plants

Grow simulation from seed to harvest. VPD-based transpiration modeling, biomass growth curves, environmental monitoring. Multi-step new grow wizard, plant dashboard with lifecycle stages, journal system with photo timeline, AI diagnostics with image analysis, post-harvest drying/curing tracker. Yield prediction via ML regression.

### Strains

700+ strain library with full-text search, filtering by type/effects/THC/CBD/terpenes. D3.js genealogy explorer for parent-child lineage visualization. AI-powered growing tips. Breeding lab for cross predictions. Community strain sharing via anonymous GitHub Gists. Daily automated strain updates. Comprehensive terpene profiles (27 terpenes), cannabinoid profiles (11 cannabinoids), chemovar classification (Type I-V), and flavonoid profiles (12 flavonoids with scientific references). Multi-source data integration from 9 external providers (SeedFinder, Otreeba, Cannlytics, The Strain API, CannSeek, OpenTHC, Cansativa, Kushy, Community) with Zod-validated import, data quality scoring, and provenance tracking. Seedbank availability with real-time pricing via SeedFinder API. Lineage/breeder data enrichment. **Genetics 2026 Trends** hub covering terpene diversity, ultra-high potency, balanced hybrids, autoflowering revolution, polyploidy/advanced breeding, and landrace revival.

### Equipment

AI equipment configurator recommending optimal setups based on grow parameters. Calculator suite: ventilation (CFM), lighting (PPFD/DLI), nutrient mixing, pot sizing. Shopping list generation.

### Knowledge

AI Mentor chat with RAG (retrieval-augmented generation) pulling context from the user's grow journals. What-if sandbox for breeding simulations. Visual guides and interactive tutorials. **Grow Tech 2026** hub covering dynamic LED lighting, sensor/IoT/VPD automation, AI digital twins, aeroponics, tissue culture, smart grow boxes, and sustainability/post-harvest innovations.

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
| **SAST**                    | CodeQL (security-and-quality), Grype vulnerability scan, trojan-source scanner                  |
| **Secret Scanning**         | Gitleaks, Semgrep                                                                               |
| **External Links**          | `rel="noopener noreferrer"` on all external anchors                                             |
| **Local-Only Mode**         | All outbound services check `isLocalOnlyMode()` before fetch                                    |
| **Error Tracking**          | Sentry with `console.debug` only (no `console.log`/`console.warn` in production)                |

---

## Internationalization

i18next with 13 namespaces, EN + DE + ES + FR + NL:

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
# Root (TurboRepo -- runs across all workspaces)
npm run dev              # turbo run dev (Vite dev server on localhost:5173)
npm run build            # turbo run build (all workspaces)
npm test                 # turbo run test (Vitest, 928+ tests)
npm run lint             # turbo run lint
npm run typecheck        # turbo run typecheck
npm run format           # Prettier
npm run security:scan    # Full security scan

# Web app (workspace-scoped)
npm run -w @cannaguide/web dev       # Vite dev server
npm run -w @cannaguide/web build     # Production build
npm run -w @cannaguide/web test      # Vitest unit/integration
npm run -w @cannaguide/web test:e2e  # Playwright E2E (requires build)
npm run -w @cannaguide/web test:ct   # Playwright component tests
npm run -w @cannaguide/web typecheck # tsc --noEmit
```

### Monorepo Structure

```text
package.json               Workspace root (turbo, eslint, prettier -- NO app deps)
turbo.json                 TurboRepo pipeline (build, dev, test, lint, typecheck)
tsconfig.json              References-only (apps/web, apps/desktop, packages/*)

apps/
  web/                     Main PWA (@cannaguide/web)
    components/             React components (common/, icons/, navigation/, ui/, views/)
    stores/                 Redux (15 slices) + Zustand (useUIStore), selectors, middleware
    services/               51 service modules (AI, simulation, DB, crypto, IoT)
    hooks/                  16 custom hooks
    data/                   Static data: 700+ strains, FAQ, lexicon, guides
    locales/                i18n: en/, de/, es/, fr/, nl/ (13 namespaces each)
    workers/                Web Workers: VPD simulation, genealogy, scenarios
    utils/                  Shared utilities
    types/                  Zod schemas for AI response validation
    tests/                  E2E (tests/e2e/), component tests (tests/ct/)
    lib/                    Utility library (cn(), VPD calculations)
    public/                 Static assets, SW, manifest
  desktop/                  Tauri v2 desktop wrapper (Rust IPC commands)

packages/
  ai-core/                  Shared AI types + ML dependency isolation
  ui/                       Shared UI tokens & theme types
  iot-mocks/                ESP32 sensor mock server (port 3001)

src-tauri/                  Tauri v2 desktop config (Rust backend + capabilities)
scripts/                    Build/lint/security scripts
docker/                     nginx config, ESP32-mock, Tauri-mock
.github/                    20 CI/CD workflows, issue templates
```

---

## CI/CD Pipeline

### Main CI Workflow (`ci.yml`)

6 jobs, zero `continue-on-error`, gate job requires all to pass:

| Job                     | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| 🔍 Quality Gates        | Lint, typecheck (root + workspaces via Turbo), 928+ tests, production build |
| 🛡 Security             | npm audit (critical), trojan-source scan, Gitleaks secret scan              |
| 🎭 E2E Tests            | Playwright Chromium (needs quality artifact)                                |
| 🐳 Docker Compose + IoT | ESP32-mock + Tauri-mock healthcheck, sensor endpoint validation             |
| 🖥 Tauri Build Check    | `cargo check` on ubuntu-22.04 with Linux deps                               |
| ✅ CI Status            | Gate job — all 5 must pass                                                  |

### Additional Workflows

| Workflow             | Trigger          | Purpose                               |
| -------------------- | ---------------- | ------------------------------------- |
| CodeQL               | push, PR, weekly | SAST analysis (JavaScript/TypeScript) |
| Deploy               | push to main     | GitHub Pages deployment + Lighthouse  |
| E2E & Integration    | push, PR         | Standalone E2E suite                  |
| Tauri Build          | release tags     | Cross-platform desktop builds         |
| Capacitor Build      | release tags     | iOS/Android builds                    |
| Docker               | release tags     | Container image                       |
| Strains Daily Update | cron             | Automated strain data refresh         |
| Renovate             | bot              | Dependency updates                    |

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

| Version  | Status         | Highlights                                                                                                                                                                                                                               |
| -------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1.0** | ✅ Released    | 700+ strains, VPD simulation, multi-provider AI, DSGVO/WCAG, ESP32, breeding lab, EN/DE                                                                                                                                                  |
| **v1.1** | ✅ Released    | Local AI stack (WebLLM + Transformers.js + CLIP), ONNX routing, inference cache, Sentry, cloud sync, 928+ tests, Tauri v2, Docker IoT mocks, CodeQL, Grype                                                                               |
| **v1.2** | 🔄 In Progress | Terpene profiles (27), chemovar classification, flavonoid database (12), multi-source data integration (9 providers), strain curation service, data hydration worker, ES/FR/NL locales, WorkerBus audit (backpressure, retry, telemetry) |
| **v1.3** | 📋 Planned     | Additional IoT sensors, timelapse journal, strain comparison, 3D visualizations                                                                                                                                                          |
| **v1.4** | 📋 Planned     | Strain-scale program (2,000+ mid-term), infinite discovery feed (news, HD galleries), expanded practical guides and extraction education                                                                                                 |
| **v1.5** | 📋 Planned     | Curated DE/EN video hub, scholarly lexicon expansion (endocannabinoid system, pharmacology, botany, genetics), source transparency layer                                                                                                 |
| **v2.0** | 📋 Planned     | AR/VR plant overlay, digital twin architecture for user plants, next-gen What-if Sandbox and BreedingLab                                                                                                                                 |

### Strategic Expansion Focus (2026-2028)

- **Strain Library at Scale:** Expand from 700+ to 2,000+ curated strains mid-term, then to multi-ten-thousand catalog entries long-term with provenance, duplicate detection, and quality scoring.
- **Infinite Discovery Surfaces:** Build an endless-scroll discovery page with category streams for cannabis news, official HD plant image collections, and educational media blocks.
- **Knowledge System Upgrade:** Extend guides, manuals, and lexicon into a multimedia learning layer, including modern extraction topics (e.g., static hash workflows and process safety).
- **Video Knowledge Curation:** Introduce a bilingual (EN/DE) curated video compilation page for high-signal grow/vlogger content with topic tagging and quality gates.
- **Scholarly Lexicon Program:** Grow Help lexicon toward a comprehensive encyclopedia (cannabinoids, ECS, entourage, botany, biology, chemistry, genetics, pharmacology, medicine, evolution) with academically traceable references.
- **AR/VR and Digital Twins:** Implement camera-assisted AR/VR plant overlays and progressively enrich simulation models into practical digital twins for user plants.
- **Sandbox and BreedingLab Evolution:** Expand scenario depth, trait simulation, and what-if experimentation to support advanced planning, phenotype strategy, and reproducible breeding workflows.

---

## Development Journey

CannaGuide 2025 was built iteratively through an AI-assisted development process spanning four distinct phases:

| Phase                            | Tools                                                 | Role                                                                                                                         | Period       |
| -------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **1. Prototyping**               | Google AI Studio (Gemini 2.5 Pro & 3.1 Pro)           | App scaffolding, initial feature set, rapid prototyping via natural language — exported to GitHub                            | v0.1 → v1.0  |
| **2. Evaluation & Advisory**     | xAI Grok 4.20                                         | Continuous architecture evaluation, security consulting, quality audit advisory, and strategic guidance                      | Throughout   |
| **3. Core Development**          | GitHub Codespaces + VS Code Copilot (Claude Opus 4.6) | Primary iteration engine — feature refinement, security hardening, 928+ tests, CI/CD pipeline, local AI stack, documentation | v1.0 → v1.1+ |
| **4. Deployment & Distribution** | GitHub Pages, Netlify, Docker, Tauri v2, Capacitor    | Production deployment, PR previews, desktop/mobile distribution, OpenSSF compliance                                          | Continuous   |

> **Secondary contributions:** GPT-4 Mini and GPT-5.3 Codex provided minimal supplementary assistance during Phase 3.

This transparent documentation of the development process reflects the project's commitment to openness and reproducibility — every line of code was written through human-AI collaboration in the open.

---

## Acknowledgments

CannaGuide 2025 relies on many excellent open-source projects and external services:

**AI & ML:** Google Gemini API, OpenAI API, Anthropic API, xAI/Grok API, Hugging Face Transformers.js, MLC WebLLM, TensorFlow.js, ONNX Runtime Web

**Data Sources:** SeedFinder.eu (strain/breeder/pricing API), Otreeba (strain catalog), Cannlytics (lab analytics), The Strain API, CannSeek, OpenTHC, Cansativa, Kushy, Community datasets (GitHub/Kaggle)

**Frontend:** React, Vite, Tailwind CSS, Radix UI, Recharts, D3.js, i18next, Zod, Redux Toolkit, Zustand

**Security:** DOMPurify, Sentry, Semgrep, Gitleaks, Grype, Snyk, CodeQL, ClusterFuzzLite, OpenSSF Scorecard

**Infrastructure:** GitHub Pages, Netlify, Docker, Tauri (Rust), Capacitor, TurboRepo

**Icons:** Phosphor Icons -- thank you for the beautiful icon set

**CORS Proxies:** allorigins.win, corsproxy.io -- enabling client-side API access

---

## Disclaimer

> All information in this app is for educational and entertainment purposes only. Cannabis cultivation is subject to strict regulations. Please check the laws in your region and always act responsibly and legally. This app does not provide legal or medical advice.

---

---

## 🌿 CannaGuide 2025 (Deutsch)

<!-- Status & Qualität -->

[![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/badge/Release-v1.2.0--alpha-brightgreen)](https://github.com/qnbs/CannaGuide-2025/releases)
[![CI](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)
[![CodeQL](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml)
[![Deploy](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml)
[![Tests](https://img.shields.io/badge/Tests-928%2B%20bestanden-brightgreen)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)

<!-- KI-Entwicklungs-Stack -->

[![Prototyped in AI Studio](https://img.shields.io/badge/Prototyp%20in-Google%20AI%20Studio-4285F4)](https://aistudio.google.com)
[![Evaluated by Grok](https://img.shields.io/badge/Evaluiert%20von-xAI%20Grok-000000)](https://x.ai)
[![Gebaut mit Claude](https://img.shields.io/badge/Gebaut%20mit-Claude%20Opus%204.6-cc785c)](https://claude.ai)
[![GitHub Codespaces](https://img.shields.io/badge/Entwickelt%20in-GitHub%20Codespaces-24292e)](https://github.com/codespaces)
[![Consulting: Gemini](https://img.shields.io/badge/Consulting-Gemini%203.1%20Pro-4285F4)](https://deepmind.google/technologies/gemini/)

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
- [Distribution](#distribution-de)
- [Mitwirken](#mitwirken)
- [Roadmap](#roadmap-de)
- [Entwicklungsweg](#entwicklungsweg)
- [Haftungsausschluss](#haftungsausschluss)

---

## Überblick

CannaGuide 2025 ist eine produktionsreife PWA, die vollständig clientseitig arbeitet. Alle Daten werden lokal in IndexedDB gespeichert, der Service Worker bietet volle Offline-Funktionalität. KI-Funktionen integrieren mehrere Anbieter (Gemini, OpenAI, Claude, Grok) via BYOK (Bring Your Own Key), mit einem 15-Service lokalen KI-Fallback-Stack für vollständig offline Inferenz.

**Kennzahlen:** 700+ Sorten · 928+ Tests · 51 Services · 15 Redux Slices + 3 Zustand Stores · 16 Custom Hooks · 13 i18n-Namensräume · 9 Themes · 20 CI-Workflows

---

## Architektur

Dreischichtige clientseitige Architektur mit Offline-First-Design:

```text
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
- **WorkerBus:** Zentraler promise-basierter Web Worker Dispatcher (`workerBus.ts`) verwaltet 6 Worker (VPD-Sim, Genealogie, Szenarien, Inferenz, Bildgenerierung, VPD-Chart) mit Timeout, messageId-Korrelation, Backpressure-Queue, Retry mit exponentiellem Backoff, Telemetrie und sicherem Teardown bei pagehide ([Doku](docs/worker-bus.md))
- **AI Streaming UX:** Alle KI-Views (Mentor, Advisor, Diagnose) nutzen Zeichen-fuer-Zeichen-Streaming mit Tipp-Indikatoren
- **Strukturierte KI-Ausgabe:** Zod-validiertes `responseSchema` fuer alle AI Function-Calling-Antworten
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
| **Testing**        | Vitest 4.1, Playwright 1.58          | 928+ Unit-, E2E-, Komponenten-Tests           |
| **Fehlertracking** | Sentry                               | Runtime-Fehler, Session Replay                |
| **Desktop**        | Tauri v2 (Rust)                      | Nativer Desktop-Wrapper                       |
| **Mobil**          | Capacitor                            | iOS/Android-Wrapper                           |

---

## Feature-Module

### Pflanzen

Grow-Simulation von Samen bis Ernte. VPD-basierte Transpirationsmodellierung, Biomasse-Wachstumskurven, Umweltüberwachung. Mehrstufiger Grow-Wizard, Pflanzen-Dashboard mit Lebenszyklus-Phasen, Journal-System mit Foto-Timeline, KI-Diagnostik mit Bildanalyse, Post-Harvest Trocknung/Curing-Tracker. Ertragsprognose via ML-Regression.

### Sorten

700+ Sorten-Bibliothek mit Volltextsuche, Filterung nach Typ/Effekte/THC/CBD/Terpene. D3.js Genealogie-Explorer fuer Eltern-Kind-Abstammungsvisualisierung. KI-gestuetzte Anbautipps. Zuchtlabor fuer Kreuzungsvorhersagen. Community-Sorten-Sharing via anonyme GitHub Gists. Taegliche automatisierte Sorten-Updates. Umfassende Terpen-Profile (27 Terpene), Cannabinoid-Profile (11 Cannabinoide), Chemovar-Klassifizierung (Typ I-V) und Flavonoid-Profile (12 Flavonoide mit wissenschaftlichen Referenzen). Multi-Source-Datenintegration von 9 externen Anbietern (SeedFinder, Otreeba, Cannlytics, The Strain API, CannSeek, OpenTHC, Cansativa, Kushy, Community) mit Zod-validiertem Import, Datenqualitaets-Scoring und Provenienz-Tracking. Seedbank-Verfuegbarkeit mit Echtzeit-Preisen via SeedFinder API. Abstammungs-/Zuechter-Datenanreicherung. **Genetik 2026 Trends** Hub mit Terpen-Diversitaet, Ultra-Potenz, ausgewogenen Hybriden, Autoflowering-Revolution, Polyploidie/Advanced Breeding und Landrace Revival.

### Ausrüstung

KI-Ausrüstungskonfigurator mit optimalen Setup-Empfehlungen basierend auf Grow-Parametern. Rechner-Suite: Belüftung (CFM), Beleuchtung (PPFD/DLI), Nährstoffmischung, Topfgröße. Einkaufslisten-Generierung.

### Wissen

KI-Mentor-Chat mit RAG (Retrieval-Augmented Generation) zieht Kontext aus den Grow-Journals des Nutzers. What-If-Sandbox für Zucht-Simulationen. Visuelle Guides und interaktive Tutorials. **Grow Tech 2026** Hub mit dynamischer LED-Beleuchtung, Sensor/IoT/VPD-Automatisierung, KI-Digital-Twins, Aeroponik, Gewebekultur, Smart Grow Boxes und Nachhaltigkeit/Post-Harvest-Innovationen.

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

### Prompt Engineering & RAG (DE)

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
| **SAST**                    | CodeQL (Security-and-Quality), Grype-Vulnerability-Scan, Trojan-Source-Scanner                 |
| **Secret-Scanning**         | Gitleaks, Semgrep                                                                              |
| **Externe Links**           | `rel="noopener noreferrer"` auf allen externen Anchors                                         |
| **Nur-Lokal-Modus**         | Alle ausgehenden Services prüfen `isLocalOnlyMode()` vor Fetch                                 |
| **Fehlertracking**          | Sentry mit nur `console.debug` (kein `console.log`/`console.warn` in Produktion)               |

---

## Internationalisierung

i18next mit 13 Namensräumen, EN + DE + ES + FR + NL:

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
# Root (TurboRepo -- laeuft ueber alle Workspaces)
npm run dev              # turbo run dev (Vite Dev-Server auf localhost:5173)
npm run build            # turbo run build (alle Workspaces)
npm test                 # turbo run test (Vitest, 928+ Tests)
npm run lint             # turbo run lint
npm run typecheck        # turbo run typecheck
npm run format           # Prettier
npm run security:scan    # Vollstaendiger Sicherheits-Scan

# Web-App (Workspace-spezifisch)
npm run -w @cannaguide/web dev       # Vite Dev-Server
npm run -w @cannaguide/web build     # Produktions-Build
npm run -w @cannaguide/web test      # Vitest Unit/Integration
npm run -w @cannaguide/web test:e2e  # Playwright E2E (erfordert Build)
npm run -w @cannaguide/web test:ct   # Playwright Komponenten-Tests
npm run -w @cannaguide/web typecheck # tsc --noEmit
```

### Monorepo-Struktur

```text
package.json               Workspace-Root (turbo, eslint, prettier -- KEINE App-Deps)
turbo.json                 TurboRepo-Pipeline (build, dev, test, lint, typecheck)
tsconfig.json              Nur Referenzen (apps/web, apps/desktop, packages/*)

apps/
  web/                     Haupt-PWA (@cannaguide/web)
    components/             React-Komponenten (common/, icons/, navigation/, ui/, views/)
    stores/                 Redux: 17 Slices, Selektoren, Middleware
    services/               51 Service-Module (KI, Simulation, DB, Krypto, IoT)
    hooks/                  16 Custom Hooks
    data/                   Statische Daten: 700+ Sorten, FAQ, Lexikon, Guides
    locales/                i18n: en/, de/ (je 13 Namensraeume)
    workers/                Web Workers: VPD-Simulation, Genealogie, Szenarien
    utils/                  Gemeinsame Hilfsfunktionen
    types/                  Zod-Schemas fuer KI-Validierung
    tests/                  E2E (tests/e2e/), Komponenten-Tests (tests/ct/)
    lib/                    Hilfsbibliothek (cn(), VPD-Berechnungen)
    public/                 Statische Assets, SW, Manifest
  desktop/                  Tauri v2 Desktop-Wrapper (Rust IPC-Commands)

packages/
  ai-core/                  Gemeinsame KI-Typen + ML-Dependency-Isolation
  ui/                       Gemeinsame UI-Tokens & Theme-Typen
  iot-mocks/                ESP32-Sensor-Mock-Server (Port 3001)

src-tauri/                  Tauri v2 Desktop-Konfig (Rust-Backend + Capabilities)
scripts/                    Build-/Lint-/Sicherheits-Skripte
docker/                     nginx-Konfig, ESP32-Mock, Tauri-Mock
.github/                    20 CI/CD-Workflows, Issue-Templates
```

---

## CI/CD-Pipeline

### Haupt-CI-Workflow (`ci.yml`)

6 Jobs, null `continue-on-error`, Gate-Job erfordert alle:

| Job                     | Beschreibung                                                                 |
| ----------------------- | ---------------------------------------------------------------------------- |
| 🔍 Quality Gates        | Lint, Typecheck (Root + Workspaces via Turbo), 928+ Tests, Produktions-Build |
| 🛡 Security             | npm audit (critical), Trojan-Source-Scan, Gitleaks-Secret-Scan               |
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
| Strains Daily Update | Cron                  | Automatische Sorten-Daten-Aktualisierung |
| Renovate             | Bot                   | Dependency-Updates                       |

---

## Distribution (DE)

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

## Roadmap (DE)

> Vollständige Details: [ROADMAP.md](ROADMAP.md)

| Version  | Status            | Highlights                                                                                                                                                                                                                                        |
| -------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1.0** | ✅ Veröffentlicht | 700+ Sorten, VPD-Simulation, Multi-Provider KI, DSGVO/WCAG, ESP32, Zuchtlabor, EN/DE                                                                                                                                                              |
| **v1.1** | ✅ Veröffentlicht | Lokaler KI-Stack (WebLLM + Transformers.js + CLIP), ONNX-Routing, Inferenz-Cache, Sentry, Cloud-Sync, 928+ Tests, Tauri v2, Docker IoT-Mocks, CodeQL, Grype                                                                                       |
| **v1.2** | 🔄 In Arbeit      | Terpen-Profile (27), Chemovar-Klassifizierung, Flavonoid-Datenbank (12), Multi-Source-Datenintegration (9 Anbieter), Sorten-Kurations-Service, Daten-Hydrations-Worker, ES/FR/NL-Lokalisierung, WorkerBus-Audit (Backpressure, Retry, Telemetrie) |
| **v1.3** | 📋 Geplant        | Weitere IoT-Sensoren, Zeitraffer-Journal, Sorten-Vergleich, 3D-Visualisierungen                                                                                                                                                                   |
| **v1.4** | 📋 Geplant        | Sorten-Skalierungsprogramm (mittelfristig 2.000+), endloser Discovery-Feed (News, HD-Galerien), Ausbau praxisnaher Anleitungen und Extraktionswissen                                                                                              |
| **v1.5** | 📋 Geplant        | Kuratierter DE/EN-Video-Hub, akademische Lexikon-Erweiterung (Endocannabinoid-System, Pharmakologie, Botanik, Genetik), Quellen-Transparenz                                                                                                       |
| **v2.0** | 📋 Geplant        | AR/VR-Pflanzenoverlay, Digital-Twin-Architektur für Nutzerpflanzen, nächste Ausbaustufe für What-if-Sandbox und BreedingLab                                                                                                                       |

### Strategische Ausbau-Schwerpunkte (2026-2028)

- **Sortenbibliothek in großem Maßstab:** Ausbau von 700+ auf mittelfristig 2.000+ kuratierte Sorten und langfristig mehrere zehntausend Einträge mit Herkunft, Dubletten-Erkennung und Qualitäts-Scoring.
- **Unendliche Discovery-Flächen:** Einführung einer Endlos-Scrolling-Seite mit Kategorien für Cannabis-News, offizielle HD-Pflanzenbild-Sammlungen und kuratierte Wissensströme.
- **Wissenssystem-Upgrade:** Ausbau von Anleitungen, Handbüchern und Lexika zu einer multimedialen Lernschicht inklusive moderner Extraktionsverfahren (z. B. Static Hash und Prozesssicherheit).
- **Video-Wissenskuratierung:** Aufbau einer zweisprachigen (DE/EN) Video-Kompilationsseite für hochwertige Grow-/Vlogger-Inhalte mit Themen-Tags und Qualitätskriterien.
- **Scholarly-Lexikon-Programm:** Entwicklung des Hilfe-Lexikons zur umfassenden Enzyklopädie (Cannabinoide, ECS, Entourage, Botanik, Biologie, Chemie, Genetik, Pharmakologie, Medizin, Evolution) mit akademisch nachvollziehbaren Quellen.
- **AR/VR und digitale Zwillinge:** Einführung kameragestützter AR/VR-Overlays und schrittweise Weiterentwicklung der Simulation zu praxisnahen digitalen Zwillingen der Nutzerpflanzen.
- **What-if- und BreedingLab-Weiterentwicklung:** Mehr Szenariotiefe, Merkmals-Simulation und reproduzierbare Zucht-Workflows für strategische Planung und Phänotyp-Entscheidungen.

---

## Entwicklungsweg

CannaGuide 2025 wurde iterativ in einem KI-gestützten Entwicklungsprozess über vier Phasen aufgebaut:

| Phase                            | Werkzeuge                                             | Rolle                                                                                                                             | Zeitraum       |
| -------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **1. Prototyping**               | Google AI Studio (Gemini 2.5 Pro & 3.1 Pro)           | App-Grundgerüst, initiales Feature-Set, Rapid Prototyping via natürlicher Sprache — Export nach GitHub                            | v0.1 → v1.0    |
| **2. Evaluation & Beratung**     | xAI Grok 4.20                                         | Kontinuierliche Architektur-Evaluation, Sicherheitsberatung, Qualitäts-Audit-Beratung und strategische Führung                    | Durchgehend    |
| **3. Kernentwicklung**           | GitHub Codespaces + VS Code Copilot (Claude Opus 4.6) | Primäre Iterations-Engine — Feature-Verfeinerung, Security-Hardening, 928+ Tests, CI/CD-Pipeline, lokaler KI-Stack, Dokumentation | v1.0 → v1.1+   |
| **4. Deployment & Distribution** | GitHub Pages, Netlify, Docker, Tauri v2, Capacitor    | Produktions-Deployment, PR-Previews, Desktop-/Mobil-Distribution, OpenSSF-Compliance                                              | Kontinuierlich |

> **Sekundäre Beiträge:** GPT-4 Mini und GPT-5.3 Codex leisteten minimale ergänzende Unterstützung in Phase 3.

Diese transparente Dokumentation des Entwicklungsprozesses spiegelt das Engagement des Projekts für Offenheit und Reproduzierbarkeit wider — jede Zeile Code wurde durch Mensch-KI-Kollaboration im Offenen geschrieben.

---

## Danksagungen

CannaGuide 2025 basiert auf vielen hervorragenden Open-Source-Projekten und externen Diensten:

**KI & ML:** Google Gemini API, OpenAI API, Anthropic API, xAI/Grok API, Hugging Face Transformers.js, MLC WebLLM, TensorFlow.js, ONNX Runtime Web

**Datenquellen:** SeedFinder.eu (Sorten-/Zuechter-/Preis-API), Otreeba (Sortenkatalog), Cannlytics (Labor-Analytik), The Strain API, CannSeek, OpenTHC, Cansativa, Kushy, Community-Datensaetze (GitHub/Kaggle)

**Frontend:** React, Vite, Tailwind CSS, Radix UI, Recharts, D3.js, i18next, Zod, Redux Toolkit, Zustand

**Sicherheit:** DOMPurify, Sentry, Semgrep, Gitleaks, Grype, Snyk, CodeQL, ClusterFuzzLite, OpenSSF Scorecard

**Infrastruktur:** GitHub Pages, Netlify, Docker, Tauri (Rust), Capacitor, TurboRepo

**Icons:** Phosphor Icons -- Danke fuer das wunderschoene Icon-Set

**CORS-Proxies:** allorigins.win, corsproxy.io -- ermoeglichen clientseitigen API-Zugriff

---

## Haftungsausschluss

> Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und im Einklang mit dem Gesetz. Diese App bietet keine Rechts- oder Medizinberatung.

<!-- markdownlint-enable MD060 -->

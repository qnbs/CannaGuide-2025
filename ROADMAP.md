# 🗺 CannaGuide 2025 — Roadmap

> This roadmap outlines the planned evolution of CannaGuide 2025. Items are organized by release version and priority. Track progress via [GitHub Projects](https://github.com/qnbs/CannaGuide-2025/projects) and linked issues.

---

## Release Overview

| Version  | Target     | Status      | Theme                                                                             |
| -------- | ---------- | ----------- | --------------------------------------------------------------------------------- |
| **v1.0** | 2026-07-07 | ✅ Released | Foundation — Full-featured cultivation PWA                                        |
| **v1.1** | 2026-Q1    | ✅ Released | DevOps & Quality — Error tracking, testing, deployment                            |
| **v1.2** | 2026-Q2    | ✅ Released | Community & Automation -- Languages, scheduling, marketplace                      |
| **v1.3** | 2026-Q3    | ✅ Released | Analytics & Visualization -- IoT, 3D, dashboards                                  |
| **v1.4** | 2026-Q4    | ✅ Released | Discovery & Knowledge Scale -- Feeds, media, expanded corpus                      |
| **v1.5** | 2026-Q4    | ✅ Released | Sync & Multi-Grow — CRDT offline sync, multi-grow, AI cost tracking, CI hardening |
| **v1.6** | 2027-Q1    | 📋 Planned  | Scholarly Expansion -- Encyclopedia, curation, source graph                       |
| **v2.0** | 2027-Q2    | 📋 Planned  | Digital Twin Platform -- AR/VR overlays + advanced sandbox                        |

---

## v1.0 — Foundation ✅

Released: **2026-07-07**

| Feature                                                        | Category     | Status |
| -------------------------------------------------------------- | ------------ | ------ |
| 776-strain encyclopedia with genealogy tracking                | Core         | ✅     |
| VPD-based plant simulation engine (Web Worker)                 | Core         | ✅     |
| Multi-provider AI integration (Gemini, OpenAI, xAI, Anthropic) | AI           | ✅     |
| RAG-powered grow log journal search                            | AI           | ✅     |
| Local AI fallback (heuristic-based)                            | AI           | ✅     |
| Photo diagnosis with EXIF/GPS stripping                        | AI           | ✅     |
| Full DSGVO/GDPR compliance (Age Gate, Consent, Privacy Policy) | Legal        | ✅     |
| WCAG 2.2 AA accessibility                                      | A11y         | ✅     |
| 307 tests (Vitest + Playwright E2E)                            | Quality      | ✅     |
| PWA with 100% offline capability                               | PWA          | ✅     |
| ESP32 sensor integration via WebBluetooth                      | IoT          | ✅     |
| Breeding Lab with Punnett Square genetics                      | Core         | ✅     |
| EN/DE internationalization (13 namespaces)                     | i18n         | ✅     |
| Dual IndexedDB architecture                                    | Architecture | ✅     |
| Command Palette (40+ commands)                                 | UX           | ✅     |
| 9 cannabis themes + onboarding wizard                          | UX           | ✅     |
| Community strain sharing via GitHub Gists                      | Community    | ✅     |
| GitHub Pages CI/CD deployment                                  | DevOps       | ✅     |
| 13 GitHub Actions workflows                                    | DevOps       | ✅     |
| OpenSSF Scorecard + CodeQL + Snyk + Grype scanning             | Security     | ✅     |

---

## v1.1 — DevOps & Quality ✅

Released: **2026-Q1**

| Feature                                                  | Category      | Status | Issue   |
| -------------------------------------------------------- | ------------- | ------ | ------- |
| Sentry error tracking integration                        | Observability | ✅     | —       |
| Playwright Component Tests infrastructure                | Testing       | ✅     | —       |
| Netlify deployment with automatic PR previews            | Deployment    | ✅     | —       |
| Capacitor mobile build CI workflow                       | CI/CD         | ❌     | Removed |
| PWA auto-update notification with changelog              | PWA           | ✅     | —       |
| Docker-Compose ESP32-Mock sensor simulation              | DevOps        | ❌     | Removed |
| Enhanced CONTRIBUTING.md with issue templates            | Docs          | ✅     | —       |
| ROADMAP.md with GitHub Projects integration              | Docs          | ✅     | —       |
| Updated copilot-instructions.md                          | Docs          | ✅     | —       |
| Tauri v2 binary IPC (image + sensor processing)          | Desktop       | ❌     | Removed |
| Tauri capability-based security (minimal permissions)    | Security      | ❌     | Removed |
| CSP hardening: remove `unsafe-inline` from script-src    | Security      | ✅     | —       |
| Local-only mode guard on all network services            | Security      | ✅     | —       |
| Security audit: semgrep (0 findings), gitleaks (0 leaks) | Security      | ✅     | —       |
| 529 tests across 58 files (Vitest)                       | Testing       | ✅     | —       |
| DevContainer with IoT mock auto-start + health-check     | DevOps        | ✅     | —       |
| Docker-Compose validation in E2E CI                      | CI/CD         | ❌     | Removed |
| Turbo monorepo with `packages/iot-mocks`                 | Architecture  | ✅     | —       |
| AI Eco mode with adaptive routing for mobile/low-end     | AI            | ✅     | —       |
| Time-series storage + predictive analytics               | AI            | ✅     | —       |
| Plugin architecture for nutrient/hardware/grow profiles  | Architecture  | ✅     | —       |
| Bluetooth sensor value clamping (plausibility checks)    | IoT           | ✅     | —       |
| Client-side image generation (SD-Turbo + ONNX)           | AI            | ✅     | —       |
| GPU resource mutex (WebLLM ↔ image gen)                  | Architecture  | ✅     | —       |
| WebLLM diagnostics cascade (6-step availability check)   | AI            | ✅     | —       |
| Token streaming for Mentor chat (typing effect)          | AI            | ✅     | —       |
| Performance degradation detection (tok/s monitoring)     | AI            | ✅     | —       |
| 574 tests across 62 files (Vitest)                       | Testing       | ✅     | —       |

---

## Short-Term Refactoring Phase (completed 2026-03-29)

| Feature                                                    | Category     | Status |
| ---------------------------------------------------------- | ------------ | ------ |
| WorkerBus: Centralized promise-based Web Worker dispatcher | Architecture | done   |
| Worker Migration: All 6 workers on WorkerBus protocol      | Architecture | done   |
| Redux/Zustand Hybrid: 15 Redux slices + Zustand UI store   | Architecture | done   |
| AI Streaming UX for Mentor, Advisor, Diagnosis views       | AI/UX        | done   |
| Structured responseSchema (Zod) for AI Function Calling    | AI           | done   |
| DOMPurify audit: sanitizeValue fix in geminiService        | Security     | done   |
| GDPR state-leak fix in privacy service                     | Security     | done   |
| Offline queue race condition fix                           | PWA          | done   |
| Seedbank integration with real API + CORS proxy cascade    | Core         | done   |
| Environment Control Panel (Digital Twin)                   | Core         | done   |
| VPD alert badge in plant header                            | UX           | done   |

---

## v1.2 -- Community & Automation

Released: **2026-Q2**

### Completed (v1.2.0-alpha)

| Feature                                                      | Category     | Status | Issue |
| ------------------------------------------------------------ | ------------ | ------ | ----- |
| Spanish (ES) language support (13 namespaces)                | i18n         | done   | --    |
| French (FR) language support (13 namespaces)                 | i18n         | done   | --    |
| Dutch (NL) language support (13 namespaces)                  | i18n         | done   | --    |
| Terpene profiles (27 terpenes, aroma/flavor/effect metadata) | Strains/Data | done   | --    |
| Cannabinoid profiles (11 cannabinoids, typed ranges)         | Strains/Data | done   | --    |
| Chemovar classification (Type I-V + ratios)                  | Strains/Data | done   | --    |
| Flavonoid database (12 compounds, bioavailability data)      | Strains/Data | done   | --    |
| Multi-source strain data integration (9 providers)           | Architecture | done   | --    |
| Provider registry + quality scoring + provenance tracking    | Architecture | done   | --    |
| Zod validation schemas for all strain data                   | Quality      | done   | --    |
| Data hydration worker (background enrichment)                | Architecture | done   | --    |
| WorkerBus audit + migration (all 6 workers)                  | Architecture | done   | --    |
| Biome toolchain removal (ESLint + Prettier only)             | DevOps       | done   | --    |
| 912+ tests across 94 files                                   | Testing      | done   | --    |

### v1.2 Recently Added (2026-04-01/02)

| Feature                                           | Category      | Status | Issue |
| ------------------------------------------------- | ------------- | ------ | ----- |
| Daily Strains 4:20 Daily Drop (seeded PRNG picks) | Core          | done   | --    |
| Equipment shoppification with vendor links        | UX            | done   | --    |
| Navigation reorder (Plants first)                 | UX            | done   | --    |
| IoT MQTT reconnect with exponential backoff       | IoT           | done   | --    |
| IoT Zod schema validation for sensor data         | Quality       | done   | --    |
| IoT telemetry metrics                             | Observability | done   | --    |
| 1016 tests across 103 files                       | Testing       | done   | --    |

### Remaining

| Feature                                            | Category  | Priority | Issue |
| -------------------------------------------------- | --------- | -------- | ----- |
| Advanced nutrient scheduling with EC/pH automation | Core      | High     | --    |
| Community strain marketplace                       | Community | High     | --    |
| Auto-generated grow reports (PDF)                  | Export    | Medium   | --    |
| Strain comparison side-by-side tool                | Core      | Medium   | --    |
| Equipment cost tracking & analytics                | Core      | Low      | --    |

---

## v1.3 -- Analytics & Visualization

Released: **2026-Q3**

### Completed (v1.3.0-alpha)

| Feature                                                                   | Category      | Status | Issue |
| ------------------------------------------------------------------------- | ------------- | ------ | ----- |
| IoT real-time dashboard (sparklines, gauges, telemetry)                   | IoT           | done   | —     |
| Three.js 3D OrbitControls with auto-orbit camera                          | Visualization | done   | —     |
| IoT live sensor badge in 3D view                                          | IoT           | done   | —     |
| Daily Strains recommendation scoring (match % badge)                      | AI/UX         | done   | —     |
| E2E test debloat (visibility assertions, no hard waits)                   | Testing       | done   | —     |
| Lodash security fix (4.17.23 -> 4.18.1 via override)                      | Security      | done   | —     |
| CSP fix: strict-dynamic reverted to workable static-PWA                   | Security      | done   | —     |
| Multi-source strain lookup (5 APIs, entourage science, flavonoid charts)  | Strains       | done   | —     |
| AES-256-GCM IoT credential encryption + IndexedDB monitor service         | Security      | done   | —     |
| Entourage score SVG ring, FlavonoidBar chart, TerpeneDetailList           | Strains/UI    | done   | —     |
| Knowledge Lexikon 2.0 (83-term searchable glossary, 6 categories)         | Knowledge     | done   | —     |
| Knowledge Disease Atlas (22 entries, urgency filter, detail modal)        | Knowledge     | done   | —     |
| Knowledge Calculator Hub (VPD + Nutrient Ratio + pH/EC sub-tabs)          | Knowledge     | done   | —     |
| Knowledge Learning Paths (5 paths, Redux progress tracking)               | Knowledge     | done   | —     |
| GuideView: search, read-progress, GrowTech 2026 + Genetics article groups | Knowledge     | done   | —     |
| data/diseases.ts (22 DiseaseEntry); data/learningPaths.ts (5 paths)       | Data          | done   | —     |
| i18n EN+DE: full coverage for all new Knowledge + Help lexicon keys       | i18n          | done   | —     |
| 1049 tests across 104 files                                               | Testing       | done   | —     |

### Remaining

| Feature                                                 | Category  | Priority | Issue |
| ------------------------------------------------------- | --------- | -------- | ----- |
| Advanced analytics dashboard                            | Analytics | High     | —     |
| Time-lapse photo journal                                | Core      | Medium   | —     |
| Integration with additional IoT sensors (BME680, SCD40) | IoT       | Medium   | —     |
| Historical VPD/environment trend charts                 | Analytics | Medium   | —     |
| Cost-per-gram analysis                                  | Analytics | Low      | —     |

---

## v2.0 — Platform 📋

Target: **2027-Q2**

| Feature                                                       | Category      | Priority | Issue |
| ------------------------------------------------------------- | ------------- | -------- | ----- |
| Real-time multi-device sync (CRDTs)                           | Sync          | High     | —     |
| Plugin/extension system                                       | Architecture  | Medium   | —     |
| Grow community forums & profiles                              | Community     | Medium   | —     |
| Voice assistant deep integration (ONNX TTS/STT offline, V-06) | UX            | Medium   | —     |
| AR plant overlay (WebXR)                                      | Visualization | Low      | —     |

---

## v1.4 -- Discovery & Knowledge Scale

Target: **2026-Q4** | Status: **In Progress**

| Feature                                                             | Category   | Priority | Issue |
| ------------------------------------------------------------------- | ---------- | -------- | ----- |
| Strain database growth program (776 → 2,000+ curated entries)       | Strains    | High     | —     |
| Strain ingestion pipeline with dedupe/provenance/quality scoring    | Data       | High     | —     |
| Voice Sprint: Hotword wake-word detection (V-03)                    | Voice/UX   | High     | —     |
| Voice Sprint: Grow-log voice dictation (V-04)                       | Voice/UX   | High     | —     |
| Voice Sprint: Voice system test coverage (V-05)                     | Testing    | High     | —     |
| Infinite discovery feed (news, HD galleries, educational snippets)  | UX         | High     | —     |
| Content taxonomy and moderation rules for feed categories           | Governance | High     | —     |
| Practical extraction knowledge pack (static hash, workflow safety)  | Knowledge  | High     | —     |
| Guide visualizations (step cards, diagrams, process timelines)      | UX         | Medium   | —     |
| Seedbank and grower official media showcase (rights-aware sourcing) | Content    | Medium   | —     |

### v1.4 Exit Criteria

- Strain library reaches at least **2,000** validated entries.
- Feed supports infinite-scroll with offline cache windows and category filters.
- New extraction guides ship with source attribution and bilingual EN/DE coverage.

---

## v1.5 — Sync, Multi-Grow & CI Hardening ✅

Released: **2026-04-08**

| Feature                                                                         | Category | Priority | Issue |
| ------------------------------------------------------------------------------- | -------- | -------- | ----- |
| CRDT offline sync protocol + conflict UI (Y.js, 3-way merge)                    | Sync     | High     | —     |
| Multi-Grow state layer + UI (EntityAdapter, MAX_GROWS=3 per CanG)               | Grows    | High     | —     |
| Multi-Grow AI integration + per-grow data export/import                         | AI/Grows | High     | —     |
| AI cost tracking for BYOK users (token usage, 7-day chart, monthly budget)      | AI       | High     | —     |
| Netlify preview validation workflow (Playwright + Lighthouse on previews)       | CI       | Medium   | —     |
| RTL language infrastructure (dir/lang attributes, smoke E2E)                    | i18n     | Medium   | —     |
| Permanent CI hardening pass (lint-staged strict, E2E selectors, typecheck gate) | CI       | High     | —     |
| Complete pnpm migration sweep (all npm references replaced)                     | Build    | Medium   | —     |
| @types/three replaces custom stubs (full Three.js type safety)                  | Types    | Low      | —     |

### v1.5 Exit Criteria

- CRDT sync is operational with conflict resolution UI.
- Multi-Grow lifecycle supports 3 grows per CanG with scoped AI context.
- All npm references replaced with pnpm across the entire repo.
- 1760 tests pass, build succeeds, typecheck clean.

---

## v1.6 — Scholarly Knowledge & Media Curation 📋

Target: **2027-Q1**

| Feature                                                                             | Category     | Priority | Issue |
| ----------------------------------------------------------------------------------- | ------------ | -------- | ----- |
| Scholarly lexicon expansion into encyclopedia-grade knowledge graph                 | Knowledge    | High     | —     |
| Domain coverage: cannabinoids, ECS, entourage, botany, biology, chemistry, genetics | Knowledge    | High     | —     |
| Domain coverage: pharmacology, medicine, evolution, cultivar history                | Knowledge    | High     | —     |
| Citation layer with evidence quality tags and source metadata                       | Research     | High     | —     |
| Curated DE/EN video hub for growers, educators, and vloggers                        | Media        | High     | —     |
| Ranking model for educational signal quality (novice/intermediate/advanced)         | AI/Knowledge | Medium   | —     |
| Community recommendation loop for article/video quality feedback                    | Community    | Medium   | —     |

### v1.6 Exit Criteria

- Lexicon reaches encyclopedia baseline with transparent citation metadata.
- Video hub supports language filter (DE/EN), topic tags, and quality labels.
- Evidence pages provide reference list, confidence level, and last-review date.

---

## Strategic Program Tracks (Cross-Version)

## Delivery Separation Model (App Tech vs. Content)

To keep roadmap execution scalable, CannaGuide now separates delivery into two explicit tracks plus one overlap track.

| Track                         | Scope                                                                      | Primary Outputs                                                       | Main Owners                      | Success Metrics                                                    |
| ----------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| App Technology & Architecture | Runtime, performance, security, CI/CD, storage, workers, platform wrappers | Architecture changes, reliability upgrades, automation, tests         | Engineering                      | Build stability, defect rate, performance budgets, release cadence |
| Content & Knowledge Program   | Strains, guides, lexicon, media curation, educational quality              | Curated datasets, bilingual content, provenance metadata              | Domain/content curation          | Content coverage, freshness, source quality, user findability      |
| Overlap: Feature Delivery     | Features requiring both code and curated domain knowledge                  | End-to-end feature increments with tech + content acceptance criteria | Product + engineering + curation | User outcomes, adoption, quality gates passed                      |

### Technology-Architecture Delivery Rules

- Every architecture item ships with measurable non-functional targets (latency, memory, bundle, or reliability).
- Security-impacting changes must include scanner coverage and rollback strategy.
- CI/CD, workflows, and developer tooling are treated as product-critical and versioned with release notes.

### Content-Program Delivery Rules

- Every content wave includes source provenance, confidence notes, and bilingual parity targets.
- Data growth programs require quality gates (dedupe, taxonomy fit, validation sample checks).
- Educational expansions must include structure templates for consistency across EN/DE.

### Overlap Execution Rules

- Feature work with content coupling uses a two-lane definition of done:
    - technical readiness (tests, performance, security)
    - content readiness (coverage, quality, provenance)
- Examples: strain marketplace, discovery feed, extraction guide expansions, scholarly lexicon views.

### 1) Strain Scale Program (2026-2028)

- **Mid-term target:** 2,000+ curated strains.
- **Long-term target:** several ten-thousand catalog entries.
- **System requirements:** automated duplicate detection, alias normalization, provenance tracking, incremental QA checks.
- **KPI examples:** unique validated strains, duplicate ratio, metadata completeness, search relevance quality.

### 2) Infinite Discovery Program

- Build a continuous feed architecture with category channels:
    - Cannabis news
    - Official HD plant images (seedbanks/growers)
    - Educational micro-guides and lexicon snippets
    - Research highlights
- **Engineering focus:** indexed pagination, client caching strategy, source freshness scoring, offline fallback cards.

### 3) Knowledge, Guides, and Extraction Education

- Expand practical guides, lexica, and manuals with visual explainers.
- Include modern extraction domains (e.g., static hash) with safety and process context.
- Build progressive learning paths (starter → advanced), with bilingual EN/DE delivery.

### 4) Scholarly Lexicon & Encyclopedia Program

- Establish a scholarly editorial model for scientific cannabis topics.
- Add source graph metadata for traceability and periodic reviews.
- Introduce confidence scoring and update cadence to keep references current.

### 5) AR/VR Overlay + Digital Twin Program

- AR-assisted plant overlay for user captures and growth stage comparison.
- Extend simulation into digital twin profiles for user-specific plants.
- Add calibration loops for environment, phenotype, and intervention responses.

### 6) What-if Sandbox & BreedingLab Evolution

- Expand scenario planner depth (environment, stress, nutrition, timeline pivots).
- Add breeding strategy workbench: phenotype goals, trait weighting, repeatability scores.
- Integrate outcome explainability with confidence and model provenance.

---

## Program Governance & Delivery Model

| Area                | Delivery Principle                                                                |
| ------------------- | --------------------------------------------------------------------------------- |
| Product Scope       | Phase-by-phase, measurable increments with hard exit criteria                     |
| Data Quality        | Source provenance, dedupe checks, confidence levels, reproducible transformations |
| Safety & Compliance | Age-gate/legal alignment, content moderation standards, external link safeguards  |
| Performance         | Offline-first preserved for all critical surfaces                                 |
| Localization        | EN/DE parity first, additional languages in staged rollouts                       |
| Quality Gates       | Typecheck + lint + test coverage + release notes before each milestone            |

---

## Refactoring & Technical Debt

Tracked separately in [`docs/refactor-roadmap-2026-q1.md`](docs/refactor-roadmap-2026-q1.md):

| Initiative                                   | Status     |
| -------------------------------------------- | ---------- |
| Tailwind CDN → PostCSS + shadcn/ui           | 📋 Planned |
| Redux scope reduction (Zustand for UI state) | ✅ Done    |
| Virtualization improvements                  | 📋 Planned |
| Worker architecture consolidation            | 📋 Planned |
| Charts & analytics surfaces                  | 📋 Planned |
| Command palette upgrade                      | 📋 Planned |

---

## How to Contribute

1. Check the roadmap for items you'd like to work on.
2. Look for issues labeled [`good first issue`](https://github.com/qnbs/CannaGuide-2025/labels/good%20first%20issue) or [`help wanted`](https://github.com/qnbs/CannaGuide-2025/labels/help%20wanted).
3. Comment on an issue to express interest before starting work.
4. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

---

## Legend

| Symbol | Meaning              |
| ------ | -------------------- |
| ✅     | Completed            |
| 🔄     | In Progress          |
| 📋     | Planned              |
| ❌     | Cancelled / Deferred |

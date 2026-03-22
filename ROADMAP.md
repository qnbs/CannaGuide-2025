# 🗺 CannaGuide 2025 — Roadmap

> This roadmap outlines the planned evolution of CannaGuide 2025. Items are organized by release version and priority. Track progress via [GitHub Projects](https://github.com/qnbs/CannaGuide-2025/projects) and linked issues.

---

## Release Overview

| Version  | Target     | Status         | Theme                                                       |
| -------- | ---------- | -------------- | ----------------------------------------------------------- |
| **v1.0** | 2026-07-07 | ✅ Released    | Foundation — Full-featured cultivation PWA                  |
| **v1.1** | 2026-Q1    | ✅ Released    | DevOps & Quality — Error tracking, testing, deployment      |
| **v1.2** | 2026-Q2    | 🔄 In Progress | Community & Automation — Languages, scheduling, marketplace |
| **v1.3** | 2026-Q3    | 📋 Planned     | Analytics & Visualization — IoT, 3D, dashboards             |
| **v1.4** | 2026-Q4    | 📋 Planned     | Discovery & Knowledge Scale — Feeds, media, expanded corpus |
| **v1.5** | 2027-Q1    | 📋 Planned     | Scholarly Expansion — Encyclopedia, curation, source graph  |
| **v2.0** | 2027-Q2    | 📋 Planned     | Digital Twin Platform — AR/VR overlays + advanced sandbox   |

---

## v1.0 — Foundation ✅

Released: **2026-07-07**

| Feature                                                        | Category     | Status |
| -------------------------------------------------------------- | ------------ | ------ |
| 700+ strain encyclopedia with genealogy tracking               | Core         | ✅     |
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
| Docker + Chainguard nginx deployment                           | DevOps       | ✅     |
| GitHub Pages CI/CD deployment                                  | DevOps       | ✅     |
| 13 GitHub Actions workflows                                    | DevOps       | ✅     |
| OpenSSF Scorecard + CodeQL + Snyk + Trivy scanning             | Security     | ✅     |

---

## v1.1 — DevOps & Quality ✅

Released: **2026-Q1**

| Feature                                                   | Category      | Status | Issue |
| --------------------------------------------------------- | ------------- | ------ | ----- |
| Sentry error tracking integration                         | Observability | ✅     | —     |
| Playwright Component Tests infrastructure                 | Testing       | ✅     | —     |
| Netlify deployment with automatic PR previews             | Deployment    | ✅     | —     |
| Capacitor mobile build CI workflow                        | CI/CD         | ✅     | —     |
| PWA auto-update notification with changelog               | PWA           | ✅     | —     |
| Docker-Compose ESP32-Mock sensor simulation               | DevOps        | ✅     | —     |
| Enhanced CONTRIBUTING.md with issue templates             | Docs          | ✅     | —     |
| ROADMAP.md with GitHub Projects integration               | Docs          | ✅     | —     |
| Updated copilot-instructions.md                           | Docs          | ✅     | —     |
| Tauri v2 binary IPC (image + sensor processing)           | Desktop       | ✅     | —     |
| Tauri capability-based security (minimal permissions)     | Security      | ✅     | —     |
| CSP hardening: remove `unsafe-inline` from script-src     | Security      | ✅     | —     |
| Local-only mode guard on all network services             | Security      | ✅     | —     |
| Security audit: semgrep (0 findings), gitleaks (0 leaks)  | Security      | ✅     | —     |
| 529 tests across 58 files (Vitest)                        | Testing       | ✅     | —     |
| DevContainer with IoT mock auto-start + health-check      | DevOps        | ✅     | —     |
| Docker-Compose validation in E2E CI                       | CI/CD         | ✅     | —     |
| Turbo monorepo with `packages/iot-mocks` + `apps/desktop` | Architecture  | ✅     | —     |
| AI Eco mode with adaptive routing for mobile/low-end      | AI            | ✅     | —     |
| Time-series storage + predictive analytics                | AI            | ✅     | —     |
| Plugin architecture for nutrient/hardware/grow profiles   | Architecture  | ✅     | —     |
| Bluetooth sensor value clamping (plausibility checks)     | IoT           | ✅     | —     |
| Client-side image generation (SD-Turbo + ONNX)            | AI            | ✅     | —     |
| GPU resource mutex (WebLLM ↔ image gen)                   | Architecture  | ✅     | —     |
| WebLLM diagnostics cascade (6-step availability check)    | AI            | ✅     | —     |
| Token streaming for Mentor chat (typing effect)           | AI            | ✅     | —     |
| Performance degradation detection (tok/s monitoring)      | AI            | ✅     | —     |
| 574 tests across 62 files (Vitest)                        | Testing       | ✅     | —     |

---

## v1.2 — Community & Automation 🔄

Target: **2026-Q2**

| Feature                                            | Category  | Priority | Issue |
| -------------------------------------------------- | --------- | -------- | ----- |
| Spanish (ES) language support                      | i18n      | High     | —     |
| French (FR) language support                       | i18n      | High     | —     |
| Dutch (NL) language support                        | i18n      | Medium   | —     |
| Advanced nutrient scheduling with EC/pH automation | Core      | High     | —     |
| Community strain marketplace                       | Community | High     | —     |
| Auto-generated grow reports (PDF)                  | Export    | Medium   | —     |
| Strain comparison side-by-side tool                | Core      | Medium   | —     |
| Equipment cost tracking & analytics                | Core      | Low      | —     |

---

## v1.3 — Analytics & Visualization 📋

Target: **2026-Q3**

| Feature                                                 | Category      | Priority | Issue |
| ------------------------------------------------------- | ------------- | -------- | ----- |
| Three.js 3D plant visualization                         | Visualization | High     | —     |
| Advanced analytics dashboard                            | Analytics     | High     | —     |
| Time-lapse photo journal                                | Core          | Medium   | —     |
| Real-time ESP32 sensor dashboard (WebSocket)            | IoT           | High     | —     |
| Integration with additional IoT sensors (BME680, SCD40) | IoT           | Medium   | —     |
| Historical VPD/environment trend charts                 | Analytics     | Medium   | —     |
| Cost-per-gram analysis                                  | Analytics     | Low      | —     |

---

## v2.0 — Platform 📋

Target: **2027-Q2**

| Feature                                         | Category      | Priority | Issue |
| ----------------------------------------------- | ------------- | -------- | ----- |
| Mobile-native experience (Capacitor production) | Platform      | High     | —     |
| Tauri desktop production release                | Platform      | High     | —     |
| Real-time multi-device sync (CRDTs)             | Sync          | High     | —     |
| Plugin/extension system                         | Architecture  | Medium   | —     |
| Grow community forums & profiles                | Community     | Medium   | —     |
| Voice assistant deep integration                | UX            | Low      | —     |
| AR plant overlay (WebXR)                        | Visualization | Low      | —     |

---

## v1.4 — Discovery & Knowledge Scale 📋

Target: **2026-Q4**

| Feature                                                             | Category   | Priority | Issue |
| ------------------------------------------------------------------- | ---------- | -------- | ----- |
| Strain database growth program (700+ → 2,000+ curated entries)      | Strains    | High     | —     |
| Strain ingestion pipeline with dedupe/provenance/quality scoring    | Data       | High     | —     |
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

## v1.5 — Scholarly Knowledge & Media Curation 📋

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

### v1.5 Exit Criteria

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
| Redux scope reduction (Zustand for UI state) | 📋 Planned |
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

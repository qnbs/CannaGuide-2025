# 🗺 CannaGuide 2025 — Roadmap

> This roadmap outlines the planned evolution of CannaGuide 2025. Items are organized by release version and priority. Track progress via [GitHub Projects](https://github.com/qnbs/CannaGuide-2025/projects) and linked issues.

---

## Release Overview

| Version | Target | Status | Theme |
|---------|--------|--------|-------|
| **v1.0** | 2026-07-07 | ✅ Released | Foundation — Full-featured cultivation PWA |
| **v1.1** | 2026-Q1 | ✅ Released | DevOps & Quality — Error tracking, testing, deployment |
| **v1.2** | 2026-Q2 | 🔄 In Progress | Community & Automation — Languages, scheduling, marketplace |
| **v1.3** | 2026-Q3 | 📋 Planned | Analytics & Visualization — IoT, 3D, dashboards |
| **v2.0** | 2026-Q4 | 📋 Planned | Platform — Mobile-native, real-time collaboration |

---

## v1.0 — Foundation ✅

Released: **2026-07-07**

| Feature | Category | Status |
|---------|----------|--------|
| 700+ strain encyclopedia with genealogy tracking | Core | ✅ |
| VPD-based plant simulation engine (Web Worker) | Core | ✅ |
| Multi-provider AI integration (Gemini, OpenAI, xAI, Anthropic) | AI | ✅ |
| RAG-powered grow log journal search | AI | ✅ |
| Local AI fallback (heuristic-based) | AI | ✅ |
| Photo diagnosis with EXIF/GPS stripping | AI | ✅ |
| Full DSGVO/GDPR compliance (Age Gate, Consent, Privacy Policy) | Legal | ✅ |
| WCAG 2.2 AA accessibility | A11y | ✅ |
| 258 tests (Vitest + Playwright E2E) | Quality | ✅ |
| PWA with 100% offline capability | PWA | ✅ |
| ESP32 sensor integration via WebBluetooth | IoT | ✅ |
| Breeding Lab with Punnett Square genetics | Core | ✅ |
| EN/DE internationalization (13 namespaces) | i18n | ✅ |
| Dual IndexedDB architecture | Architecture | ✅ |
| Command Palette (40+ commands) | UX | ✅ |
| 9 cannabis themes + onboarding wizard | UX | ✅ |
| Community strain sharing via GitHub Gists | Community | ✅ |
| Docker + Chainguard nginx deployment | DevOps | ✅ |
| GitHub Pages CI/CD deployment | DevOps | ✅ |
| 13 GitHub Actions workflows | DevOps | ✅ |
| OpenSSF Scorecard + CodeQL + Snyk + Trivy scanning | Security | ✅ |

---

## v1.1 — DevOps & Quality ✅

Released: **2026-Q1**

| Feature | Category | Status | Issue |
|---------|----------|--------|-------|
| Sentry error tracking integration | Observability | ✅ | — |
| Playwright Component Tests infrastructure | Testing | ✅ | — |
| Netlify deployment with automatic PR previews | Deployment | ✅ | — |
| Capacitor mobile build CI workflow | CI/CD | ✅ | — |
| PWA auto-update notification with changelog | PWA | ✅ | — |
| Docker-Compose ESP32-Mock sensor simulation | DevOps | ✅ | — |
| Enhanced CONTRIBUTING.md with issue templates | Docs | ✅ | — |
| ROADMAP.md with GitHub Projects integration | Docs | ✅ | — |
| Updated copilot-instructions.md | Docs | ✅ | — |

---

## v1.2 — Community & Automation 🔄

Target: **2026-Q2**

| Feature | Category | Priority | Issue |
|---------|----------|----------|-------|
| Spanish (ES) language support | i18n | High | — |
| French (FR) language support | i18n | High | — |
| Dutch (NL) language support | i18n | Medium | — |
| Advanced nutrient scheduling with EC/pH automation | Core | High | — |
| Community strain marketplace | Community | High | — |
| Auto-generated grow reports (PDF) | Export | Medium | — |
| Strain comparison side-by-side tool | Core | Medium | — |
| Equipment cost tracking & analytics | Core | Low | — |

---

## v1.3 — Analytics & Visualization 📋

Target: **2026-Q3**

| Feature | Category | Priority | Issue |
|---------|----------|----------|-------|
| Three.js 3D plant visualization | Visualization | High | — |
| Advanced analytics dashboard | Analytics | High | — |
| Time-lapse photo journal | Core | Medium | — |
| Real-time ESP32 sensor dashboard (WebSocket) | IoT | High | — |
| Integration with additional IoT sensors (BME680, SCD40) | IoT | Medium | — |
| Historical VPD/environment trend charts | Analytics | Medium | — |
| Cost-per-gram analysis | Analytics | Low | — |

---

## v2.0 — Platform 📋

Target: **2026-Q4**

| Feature | Category | Priority | Issue |
|---------|----------|----------|-------|
| Mobile-native experience (Capacitor production) | Platform | High | — |
| Tauri desktop production release | Platform | High | — |
| Real-time multi-device sync (CRDTs) | Sync | High | — |
| Plugin/extension system | Architecture | Medium | — |
| Grow community forums & profiles | Community | Medium | — |
| Voice assistant deep integration | UX | Low | — |
| AR plant overlay (WebXR) | Visualization | Low | — |

---

## Refactoring & Technical Debt

Tracked separately in [`docs/refactor-roadmap-2026-q1.md`](docs/refactor-roadmap-2026-q1.md):

| Initiative | Status |
|-----------|--------|
| Tailwind CDN → PostCSS + shadcn/ui | 📋 Planned |
| Redux scope reduction (Zustand for UI state) | 📋 Planned |
| Virtualization improvements | 📋 Planned |
| Worker architecture consolidation | 📋 Planned |
| Charts & analytics surfaces | 📋 Planned |
| Command palette upgrade | 📋 Planned |

---

## How to Contribute

1. Check the roadmap for items you'd like to work on.
2. Look for issues labeled [`good first issue`](https://github.com/qnbs/CannaGuide-2025/labels/good%20first%20issue) or [`help wanted`](https://github.com/qnbs/CannaGuide-2025/labels/help%20wanted).
3. Comment on an issue to express interest before starting work.
4. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Completed |
| 🔄 | In Progress |
| 📋 | Planned |
| ❌ | Cancelled / Deferred |

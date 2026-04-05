# Audit-Driven Priority Roadmap

> Prioritized action plan derived from the Deep Audit (2026-Q2).
> For version-based feature roadmap, see [ROADMAP.md](../ROADMAP.md).
> For full finding details, see [AUDIT_BACKLOG.md](AUDIT_BACKLOG.md).

---

## Immediate (Sprint 1)

| ID   | Finding                      | Effort | Status |
| ---- | ---------------------------- | ------ | ------ |
| C-02 | Automated release workflow   | Low    | Done   |
| C-01 | Changelog generation         | Low    | Done   |
| P-02 | Bundle size budget           | Medium | Open   |
| K-01 | Package boundary enforcement | Medium | Done   |
| I-01 | Translation completeness CI  | Low    | Open   |

## Short-term (Sprint 2)

| ID   | Finding                       | Effort | Status |
| ---- | ----------------------------- | ------ | ------ |
| S-01 | Prompt injection allow-list   | Low    | Done   |
| A-01 | AI response validation        | Medium | Open   |
| A-04 | RAG context window management | Medium | Open   |
| S-04 | Key rotation warning UI       | Low    | Done   |
| F-04 | Data export/backup            | Medium | Open   |
| U-01 | Keyboard navigation audit     | Medium | Open   |
| U-02 | Screen reader testing         | Medium | Open   |

## Medium-term (Sprint 3)

| ID   | Finding                               | Effort | Status |
| ---- | ------------------------------------- | ------ | ------ |
| T-01 | Mutation testing pilot                | High   | Done   |
| T-03 | Visual regression testing             | Medium | Open   |
| T-05 | AI contract tests                     | Medium | Open   |
| A-02 | Local AI model versioning             | Medium | Open   |
| P-03 | Image optimization pipeline           | Medium | Open   |
| F-05 | Multi-grow management                 | High   | Open   |
| D-01 | API documentation                     | High   | Open   |
| R-01 | Streaming generalization              | Medium | Done   |
| R-02 | GPU resource manager v2 (N consumers) | Medium | Done   |
| R-03 | WebLLM preload UX (progress bar)      | Low    | Open   |

## Long-term (Backlog)

| ID   | Finding                          | Effort | Status                                     |
| ---- | -------------------------------- | ------ | ------------------------------------------ |
| S-03 | CSP nonce implementation         | Medium | Deferred (strict-dynamic reverted e2d5165) |
| C-04 | Deployment preview validation    | Medium | Open                                       |
| F-02 | Social sharing                   | Medium | Open                                       |
| F-06 | Offline sync conflict resolution | High   | Open                                       |
| I-02 | RTL language preparation         | Medium | Open                                       |
| A-03 | AI cost tracking                 | Medium | Open                                       |

## Already Resolved

| ID    | Finding                           | Resolution                                        |
| ----- | --------------------------------- | ------------------------------------------------- |
| S-01  | Prompt injection allow-list       | 5-layer sanitization pipeline in geminiService    |
| S-04  | Key rotation warning UI           | GeminiSecurityCard w/ age label + badge (S69)     |
| S-05  | SRI for CDN assets                | N/A -- no external CDN scripts (S69)              |
| K-03  | Service dependency cycles         | import/no-cycle ESLint error + CI (S41/S62)       |
| K-04  | Worker error propagation          | WorkerBusError class + 10-code enum (S69)         |
| T-01  | Mutation testing pilot            | Stryker baseline + 2 new slice tests (Session 63) |
| R-01  | Streaming generalization          | useStreamingResponse.ts hook (Session 47)         |
| R-02  | GPU resource manager v2           | gpuResourceManager.ts with priority queue (S48)   |
| S-02  | Tailwind CDN                      | PostCSS build-time compilation already active     |
| P-01  | Tailwind CDN (duplicate)          | Same as S-02                                      |
| T-02  | Coverage thresholds               | v8 provider + thresholds in vite.config.ts        |
| C-02  | Release workflow                  | release-please in release.yml                     |
| K-02  | Lazy hydration                    | React.lazy + Suspense + shell pattern             |
| S-06  | Dependency pinning                | All CI actions use pinned SHA hashes              |
| D-03  | Architecture Decision Records     | ADR template + ADR-0001 in docs/adr/              |
| F-01  | iCal export                       | Implemented                                       |
| F-03  | Push notifications                | Wave 5/6: proactiveCoach + nativeBridge           |
| R-04  | Local AI service extraction       | Decomposed into 15 service modules                |
| R-05  | Redux scope reduction             | Zustand stores for all transient UI state         |
| R-06  | Worker architecture consolidation | workerBus with 8 typed workers                    |
| IoT-1 | IoT real-time dashboard           | IotDashboardView with sparklines/gauges/telemetry |
| V-01  | 3D interactive OrbitControls      | GrowRoom3D with auto-orbit + IoT badge            |
| AI-R1 | Strain recommendation scoring     | Daily Strains match % badge (0-100 relevance)     |

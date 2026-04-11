# Full-Scale Audit Roadmap — CannaGuide 2025

<!-- markdownlint-disable MD040 MD029 MD033 -->

> Dedizierte Roadmap zur Umsetzung aller Maßnahmen aus dem **Full-Scale Deep Audit, Critical Evaluation & Action-Plan** (Stand: 23. März 2026, Commit `473044d`).
> Dieses Dokument ist der zentrale Übergabe- und Anknüpfungspunkt für alle zukünftigen Sessions.

**Letzte Aktualisierung:** 2026-04-11
**Baseline:** v1.1.0 | 719 Tests (86 Dateien) | OpenSSF 8.5/10 | CI gruen | 0 Security Alerts
**Aktuell:** v1.7.0 | 2063 Tests (177 Dateien) | SLSA L3 Provenance | 22 CI Workflows gruen | 0 Security Alerts

---

## Inhaltsverzeichnis

- [Gesamtübersicht & Zielzustand](#gesamtübersicht--zielzustand)
- [Status-Dashboard](#status-dashboard)
- [Sprint 1 — P0: Admin-Blocker & Quick Wins](#sprint-1--p0-admin-blocker--quick-wins)
- [Sprint 2 — P1: Qualität & Optimierung](#sprint-2--p1-qualität--optimierung)
- [Sprint 3 — P2: Stabilität, UX & Compliance](#sprint-3--p2-stabilität-ux--compliance)
- [Sprint 4 — P3: Perfektion & v1.2-Readiness](#sprint-4--p3-perfektion--v12-readiness)
- [Sprint 5 — v1.2+ Feature Delivery](#sprint-5--v12-feature-delivery)
- [Sprint 6 — v1.3–v2.0 Vision](#sprint-6--v13v20-vision)
- [Bereits Erledigt (Referenz)](#bereits-erledigt-referenz)
- [Abhängigkeiten & Blockermatrix](#abhängigkeiten--blockermatrix)
- [Quality Gates](#quality-gates)
- [Definition of Done](#definition-of-done)
- [Session-Protokoll](#session-protokoll)

---

## Gesamtübersicht & Zielzustand

### Ist-Zustand (2026-04-09)

| Metrik            | Wert                     | Bewertung              |
| ----------------- | ------------------------ | ---------------------- |
| App-Version       | v1.6.3                   | ✅ Stabil              |
| Tests             | 1884/1884 (163 Dateien)  | ✅ Gruen               |
| OpenSSF Scorecard | SLSA L3 + CycloneDX SBOM | ✅ release-publish     |
| Test-Coverage     | ~33.66 %                 | ✅ Ziel >30 % erreicht |
| Duplicate Code    | ~115 Major-Bloecke       | ⚠ Technische Schuld    |
| Security Alerts   | 0                        | ✅                     |
| CI Workflows      | 22 (alle gruen)          | ✅                     |
| Stryker Mutation  | Baseline erstellt        | ✅ Neu (Session 63)    |

### Soll-Zustand (nach vollständiger Roadmap)

| Metrik                   | Zielwert             | Sprint  |
| ------------------------ | -------------------- | ------- |
| OpenSSF Scorecard        | **10/10**            | S1 + S4 |
| Test-Coverage            | **>30 %**            | S2      |
| Tests                    | **700+**             | S2      |
| Duplicate Code           | **<80 Major-Blöcke** | S2 + S3 |
| WCAG 2.2 AA              | **100 % compliant**  | S3      |
| Lighthouse Performance   | **≥0.80**            | S3      |
| Lighthouse Accessibility | **≥0.90**            | S3      |
| v1.2 Feature-Readiness   | **Complete**         | S5      |

---

## Status-Dashboard

> Aktualisiere diesen Block am Anfang jeder Session.

```
Letzte Session:     2026-04-07 (CI Typecheck Fix + Vitest Hang Fix + Doc Audit)
App-Version:        v1.4.1
Tests:              1663/1663 (149 files)
Naechste Prioritaet:  Test Coverage >30%, F-05 Multi-grow, D-01 API Docs
Sprint-Fortschritt: S1 [0/3] | S2 [1/4] | S3 [3/5] | S4 [0/2] | S5 [6/8] | S6 [0/7]
Gesamtfortschritt:  ██████████░░░░░░░░░░ 10/29 Tasks (~34%)
Blocker:            CII Badge (Email)
```

                        createCachedPipelineLoader-Dedup (4 Services, ~75 LOC)

Erledigt (2026-03-27): Export-Bug, Focus-Return, Touch-Targets, IndexedDB-Retry,
Three.js-Splitting, i18n ES/FR/NL, Nutrient-Plugin, DSGVO,
Eco-Mode, ARCHITECTURE.md, Lighthouse-Fonts

```

---

## Sprint 1 — P0: Admin-Blocker & Quick Wins

**Ziel:** Alle blockierenden Admin-Aktionen erledigen.
**Geschaetzter Aufwand:** ~1 Stunde (+ Wartezeit CII Badge)
**Voraussetzung:** Admin-PAT / Browser-Zugang zu GitHub + bestpractices.dev

> **Hinweis:** SonarCloud wurde im April 2026 vollstaendig entfernt (Projekt geloescht).
> S1.1 (Sonar Hotspot Review) entfaellt ersatzlos.

### S1.1 -- ENTFAELLT (SonarCloud entfernt)

> SonarCloud-Projekt wurde im April 2026 geloescht. Alle Sonar-Referenzen aus dem Repository entfernt.
> **Status:** Erledigt (entfaellt ersatzlos)

### S1.2 — CII Best Practices Badge aktivieren

| Feld             | Detail                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Was**          | Email-Verifizierung auf bestpractices.dev abschließen, Badge in README einbauen                                      |
| **Warum**        | Scorecard-Check #187 blockiert 10/10                                                                                 |
| **Wie**          | 1. Email verifizieren auf bestpractices.dev → 2. Badge-URL kopieren → 3. In README.md Badge-Block einfügen (EN + DE) |
| **Referenz**     | `docs/next-session-handoff.md`, Session-Review 2026-03-23                                                            |
| **Impact**       | OpenSSF Scorecard → Richtung 10/10                                                                                   |
| **Aufwand**      | 5 min + 1 Tag Wartezeit                                                                                              |
| **Status**       | ⬜ Registriert, Email-Verifikation ausstehend                                                                        |
| **Abhängigkeit** | Zugang zum bestpractices.dev-Account                                                                                 |

### S1.3 — Branch Protection für Admins erzwingen

| Feld             | Detail                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Was**          | "Include administrators" + "Require pull request reviews before merging" für `main` aktivieren |
| **Warum**        | Scorecard-Checks #188 (Code-Review), #194 (Branch-Protection)                                  |
| **Wie**          | GitHub → Settings → Branches → `main` → Protection Rules anpassen                              |
| **Referenz**     | `docs/session-activity-todo-2026-03-24.md` P0                                                  |
| **Impact**       | Keine Direct-Pushes mehr möglich, höhere Review-Qualität, Scorecard ↑                          |
| **Aufwand**      | 2 min (Admin-PAT erforderlich)                                                                 |
| **Status**       | ⬜ Nicht gestartet                                                                             |
| **Abhängigkeit** | Admin-PAT                                                                                      |
| **⚠ Hinweis**    | Nach Aktivierung muss **jeder** Commit über PR laufen — auch Hotfixes. Workflow anpassen!      |

### Sprint 1 — Erfolgskriterien

- [x] ~~SonarCloud Security Hotspots~~ — ENTFAELLT (Projekt geloescht)
- [ ] CII Badge in README sichtbar (oder Email-Verifikation gestartet)
- [ ] Branch Protection enforce_admins aktiv
- [ ] Scorecard >=9.0

---

## Sprint 2 — P1: Qualität & Optimierung

**Ziel:** Test-Coverage >30 %, Fuzzing-Abdeckung erweitern, Dokumentation konsolidieren.
**Geschätzter Aufwand:** 2–3 Tage
**Voraussetzung:** Sprint 1 abgeschlossen (Branch Protection = PR-Workflow)

### S2.1 — Property-Based Fuzzing erweitern

| Feld              | Detail                                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Was**           | fast-check Fuzzing auf `commandService` + parser-heavy Services erweitern                                                                                            |
| **Warum**         | commandService (Regex-basiert, User-Input-Parsing) ist Hotspot für ReDoS/Crashes                                                                                     |
| **Wie**           | 1. `services/commandService.test.fuzz.ts` erstellen → 2. fast-check Arbitraries für Command-Strings → 3. Seeds in CI-Artifacts → 4. ClusterFuzzLite-Corpus erweitern |
| **Ziel-Services** | `commandService`, `aiPromptSanitizer`, `growLogParser`                                                                                                               |
| **Referenz**      | Commit `08f8d02` (Fuzzing-Pipeline), ClusterFuzzLite `cflite_pr.yml`                                                                                                 |
| **Impact**        | Zero-Day-Resistenz bei AI-Prompts/Commands, CI-Regression-Guard                                                                                                      |
| **Aufwand**       | 2–4 Stunden                                                                                                                                                          |
| **Status**        | ⬜ Nicht gestartet                                                                                                                                                   |

### S2.2 — Test-Coverage auf >30 % steigern

| Feld                    | Detail                                                    |
| ----------------------- | --------------------------------------------------------- |
| **Was**                 | Gezielte Tests für unterabgedeckte Services schreiben     |
| **Warum**               | Aktuell ~22–28 %; solide Basis für Quality Gates benötigt |
| **Wie**                 | Vitest Unit-Tests + Playwright-CT für kritische Services  |
| **Prioritäts-Services** |                                                           |

| Service             | Geschätzte Coverage | Ziel | Aufwand |
| ------------------- | ------------------- | ---- | ------- |
| `aiProviderService` | ~15 %               | 40 % | 3–4 h   |
| `aiService`         | ~20 %               | 40 % | 2–3 h   |
| `exportService`     | ~10 %               | 35 % | 2–3 h   |
| `strainService`     | ~25 %               | 45 % | 2 h     |
| `commandService`    | ~20 %               | 40 % | 2 h     |
| `geminiService`     | ~30 %               | 45 % | 1–2 h   |

| **Aufwand** | 1–2 Tage |
| **Status** | ⬜ Nicht gestartet |
| **Metriken** | Coverage vor → nach in Vitest-Report dokumentieren |

### S2.3 -- ENTFAELLT (SonarCloud entfernt)

> Sonar-Handoff-Dokumente existieren nicht mehr. SonarCloud-Projekt geloescht.
> **Status:** Erledigt (entfaellt ersatzlos)

### S2.4 — Duplicate Code reduzieren (erste Welle)

| Feld                      | Detail                                         |
| ------------------------- | ---------------------------------------------- |
| **Was**                   | ~115 Major-Duplicate-Blöcke auf <80 reduzieren |
| **Warum**                 | Wartbarkeit, technische Schuld                 |
| **Prioritäts-Kandidaten** |                                                |

| Datei/Bereich                                                                | Duplikat-Typ           | Lösungsansatz                      |
| ---------------------------------------------------------------------------- | ---------------------- | ---------------------------------- |
| `sw.js` / `public/sw.js`                                                     | Vollständiges Duplikat | Konsolidierung zu einer Quelle     |
| Cache-Services (`localAiCacheService`, `imageGenCache`, `indexedDbLruCache`) | Ähnliche Patterns      | Shared Factory/Utility extrahieren |
| Modal-Komponenten (`GrowSetupModal`, `BreedingView`)                         | Ähnliche UI-Patterns   | Shared Modal-Base-Komponente       |
| `InlineStrainSelector` Varianten                                             | Partial Duplicates     | Parametrisierte Shared-Komponente  |
| `ipc.rs` Patterns                                                            | Ähnliche IPC-Handler   | Macro/Generics Abstraktion         |

| **Aufwand** | 1 Tag |
| **Status** | ⬜ Nicht gestartet |

### Sprint 2 — Erfolgskriterien

- [ ] Test-Coverage ≥30 % (Vitest `--coverage` Report)
- [ ] Tests ≥680 (Ziel: +40 neue Tests)
- [ ] `commandService.test.fuzz.ts` existiert und laeuft in CI
- [x] ~~Sonar-Handoff-Docs konsolidieren~~ -- ENTFAELLT (Projekt geloescht)
- [ ] Duplicate-Code-Bloecke <90

---

## Sprint 3 — P2: Stabilität, UX & Compliance

**Ziel:** WCAG 2.2 AA 100 %, Lighthouse-Schwellenwerte, Security-Scanning ausbau, Maintainability A.
**Geschätzter Aufwand:** 2–3 Tage
**Voraussetzung:** Sprint 2 Coverage-Basis vorhanden

### S3.1 — Lighthouse-Schwellenwerte aktivieren

| Feld         | Detail                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Was**      | `lighthouserc.json` Assertions: Performance ≥0.80, Accessibility ≥0.90, Best Practices ≥0.90, SEO ≥0.90                       |
| **Warum**    | PWA Mobile-First muss iOS/Android perfekt funktionieren                                                                       |
| **Wie**      | 1. `lighthouserc.json` → `assertions` Block erweitern → 2. CI-Job mit `--preset=performance` → 3. Baseline-Run → Fix → Commit |
| **Referenz** | `ui-ux-audit.md` (Next Pass #4)                                                                                               |
| **Aufwand**  | 1 Stunde                                                                                                                      |
| **Status**   | ⬜ Nicht gestartet                                                                                                            |

### S3.2 — `security-full.yml` aktivieren

| Feld             | Detail                                                                             |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Was**          | Vollständigen täglichen Security-Scan-Workflow aktivieren                          |
| **Warum**        | Automatische Alerts für neue CVEs/Dependencies                                     |
| **Wie**          | GitHub → Settings → Code Scanning → Enable → Workflow-Trigger auf `schedule: cron` |
| **Aufwand**      | 10 min                                                                             |
| **Status**       | ⬜ Nicht gestartet                                                                 |
| **Abhängigkeit** | Repo Settings Zugang                                                               |

### S3.3 -- Code-Qualitaet verbessern (ESLint-getrieben)

> Ersetzt fruehere SonarCloud Maintainability-Metrik. Qualitaetsmessung erfolgt nun
> ausschliesslich via ESLint strict scopes (`npm run lint:scopes`) und Vitest Coverage.

| Feld        | Detail                                                       |
| ----------- | ------------------------------------------------------------ |
| **Was**     | Cognitive Complexity, Duplikate, lange Funktionen reduzieren |
| **Warum**   | Langfristige Wartbarkeit, sauberes Codebase                  |
| **Wie**     | ESLint strict scopes + lint-burndown Strategie               |
| **Aufwand** | 1--2 Tage                                                    |
| **Status**  | Ongoing                                                      |

### S3.4 — UI/UX Accessibility Block (`ui-ux-audit.md`)

| Feld                | Detail                                                      |
| ------------------- | ----------------------------------------------------------- |
| **Was**             | Alle verbleibenden A11y-Issues aus `ui-ux-audit.md` beheben |
| **Einzelmaßnahmen** |                                                             |

| #   | Maßnahme                                   | Dateien                                   | Aufwand |
| --- | ------------------------------------------ | ----------------------------------------- | ------- |
| 1   | Icon-only destruktive Actions auf 44×44 px | `components/ui/Button.tsx`, diverse Views | 2 h     |
| 2   | Screen-Reader-Labels für Chart-Toggles     | `components/views/SimulationChart.tsx`    | 1 h     |
| 3   | Mobile E2E Assertions gegen Clipping       | `tests/e2e/mobile-*.e2e.ts` (neu)         | 2–3 h   |
| 4   | Focus-Return-Tests für nested Overlays     | `tests/ct/modal-focus-*.ct.tsx` (neu)     | 2 h     |
| 5   | Notch-Safe-Area Padding-Audit (iOS)        | `styles.css`, Layout-Komponenten          | 1 h     |

| **Referenz** | `ui-ux-audit.md` (Next Pass #1–#4) |
| **Impact** | WCAG 2.2 AA 100 %, mobile UX perfekt |
| **Aufwand** | 1–2 Tage |
| **Status** | ⬜ Nicht gestartet |

### S3.5 — Duplicate Code reduzieren (zweite Welle)

| Feld        | Detail                                                        |
| ----------- | ------------------------------------------------------------- |
| **Was**     | Verbleibende Duplikate <80 Major-Blöcke → Ziel <60            |
| **Wie**     | Shared Hooks, Base-Komponenten, Service-Utilities extrahieren |
| **Aufwand** | 1 Tag                                                         |
| **Status**  | ⬜ Nicht gestartet                                            |

### Sprint 3 — Erfolgskriterien

- [ ] Lighthouse: Performance ≥0.80, A11y ≥0.90 in CI
- [ ] `security-full.yml` aktiv und erster Run erfolgreich
- [ ] ESLint strict scopes: 0 warnings
- [ ] Alle 5 A11y-Massnahmen aus ui-ux-audit umgesetzt
- [ ] Duplicate-Code <70 Major-Bloecke

---

## Sprint 4 — P3: Perfektion & v1.2-Readiness

**Ziel:** OpenSSF 10/10, signierte Releases, Supply-Chain-Security komplett.
**Geschätzter Aufwand:** 4–6 Stunden
**Voraussetzung:** Sprint 1 (Branch Protection), Sprint 2 (Coverage)

### S4.1 — Signierte Releases + PR-basierte Pipelines

| Feld         | Detail                                                                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Was**      | GitHub Releases mit GPG/SSH-Signierung, Tag-basierte CI-Pipelines über PRs                                                                                             |
| **Warum**    | Scorecard 10/10 + CII Best Practices + Supply-Chain-Integrität                                                                                                         |
| **Wie**      | 1. GPG-Key generieren + GitHub hinterlegen → 2. Release-Workflow anpassen (`deploy.yml`, `docker.yml`) → 3. Tag-Push-Trigger → 4. Provenance-Attestation (SLSA) prüfen |
| **Referenz** | ROADMAP v1.2, Session-Todo P3                                                                                                                                          |
| **Impact**   | Vollständige Supply-Chain-Security, professionelles Signal                                                                                                             |
| **Aufwand**  | 4 Stunden                                                                                                                                                              |
| **Status**   | ⬜ Nicht gestartet                                                                                                                                                     |

### S4.2 — Scorecard 10/10 Feintuning

| Feld                 | Detail                                         |
| -------------------- | ---------------------------------------------- |
| **Was**              | Verbleibende Scorecard-Checks auf Pass bringen |
| **Erwartete Checks** |                                                |

| Check               | Aktuell | Ziel | Aktion                |
| ------------------- | ------- | ---- | --------------------- |
| Code-Review         | ⚠       | ✅   | PR-Workflow (S1.3)    |
| Branch-Protection   | ⚠       | ✅   | enforce_admins (S1.3) |
| CII-Best-Practices  | ⚠       | ✅   | Badge (S1.2)          |
| Signed-Releases     | ⚠       | ✅   | GPG (S4.1)            |
| Pinned-Dependencies | ✅      | ✅   | Bereits erledigt      |
| Token-Permissions   | ✅      | ✅   | Bereits erledigt      |
| Binary-Artifacts    | ✅      | ✅   | Bereits erledigt      |

| **Aufwand** | 2 Stunden (Validierung + Fixes) |
| **Status** | ⬜ Nicht gestartet |

### Sprint 4 — Erfolgskriterien

- [ ] OpenSSF Scorecard = 10/10
- [ ] Mindestens 1 signierter Release (v1.1.1 oder v1.2.0-beta)
- [ ] CII Best Practices Badge: "Passing"
- [ ] Alle Scorecard-Checks = Pass

---

## Sprint 5 — v1.2+ Feature Delivery

**Ziel:** Community & Automation Features aus ROADMAP v1.2.
**Geschätzter Aufwand:** 1–2 Wochen pro Feature
**Voraussetzung:** Sprint 1–4 (Quality Infrastructure)

| #    | Feature                                | Kategorie | Prio   | Aufwand    | Status                              |
| ---- | -------------------------------------- | --------- | ------ | ---------- | ----------------------------------- |
| S5.1 | Spanisch (ES) Sprachsupport            | i18n      | High   | 3–4 Tage   | ⬜                                  |
| S5.2 | Französisch (FR) Sprachsupport         | i18n      | High   | 3–4 Tage   | ⬜                                  |
| S5.3 | Niederländisch (NL) Sprachsupport      | i18n      | Medium | 3–4 Tage   | ⬜                                  |
| S5.4 | Nutrient Scheduling + EC/pH Automation | Core      | High   | 1–2 Wochen | 🔄 Plugin-UI done, Auto-Adjust done |
| S5.5 | Community Strain Marketplace           | Community | High   | 1–2 Wochen | ⬜                                  |
| S5.6 | Auto-PDF Grow Reports                  | Export    | Medium | 1 Woche    | ⬜                                  |
| S5.7 | Strain Comparison Tool (Side-by-Side)  | Core      | Medium | 3–5 Tage   | ⬜                                  |
| S5.8 | Equipment Cost Tracking & Analytics    | Core      | Low    | 3–5 Tage   | ⬜                                  |

### i18n-Expansion Checkliste (pro Sprache)

- [ ] `locales/<lang>/` Verzeichnis mit allen 13 Namespaces
- [ ] `locales/<lang>.ts` Barrel-Export
- [ ] `i18n.ts` Registrierung
- [ ] `data/strains/` lokalisierte Beschreibungen (optional)
- [ ] E2E-Test: Sprachauswahl + kritische Pfade
- [ ] README-Sektion für neue Sprache

### Sprint 5 — Erfolgskriterien

- [ ] Mindestens ES + FR vollständig
- [ ] Nutrient Scheduling MVP mit Unit-Tests
- [ ] Strain Comparison in Produktion
- [ ] Alle neuen Features mit Tests + i18n (EN/DE + neue Sprachen)

---

## Sprint 6 — v1.3–v2.0 Vision

**Ziel:** Langfristige Plattform-Evolution.
**Voraussetzung:** v1.2 stabil

| #    | Feature                                          | Version | Kategorie     | Prio |
| ---- | ------------------------------------------------ | ------- | ------------- | ---- |
| S6.1 | Three.js 3D Plant Visualization                  | v1.3    | Visualization | High |
| S6.2 | Real-time ESP32 Dashboard + WebSocket            | v1.3    | IoT           | High |
| S6.3 | Advanced Analytics Dashboard                     | v1.3    | Analytics     | High |
| S6.4 | Strain DB 800+ → 2.000+ (Ingestion Pipeline)     | v1.4    | Data          | High |
| S6.5 | Discovery Feed (infinite scroll + offline cache) | v1.4    | UX            | High |
| S6.6 | Scholarly Knowledge Graph + Citation Layer       | v1.5    | Knowledge     | High |
| S6.7 | AR/VR Overlays (WebXR) + Digital Twin            | v2.0    | Platform      | Low  |

> Details und Exit-Kriterien pro Version: siehe [ROADMAP.md](../ROADMAP.md)

---

## Bereits Erledigt (Referenz)

> Aus dem Audit als "bereits erledigt" markierte Maßnahmen — hier als Nachweis und Kontext für zukünftige Sessions.

| Maßnahme                                                   | Commit/Session     | Datum      |
| ---------------------------------------------------------- | ------------------ | ---------- |
| `Math.random()` → `secureRandom()` (15 Stellen, 9 Dateien) | Security Sprint    | 2026-03-22 |
| ReDoS-Schutz commandService (64-Zeichen-Limit)             | Security Sprint    | 2026-03-22 |
| Docker zlib-CVE + HEALTHCHECK (5 Dockerfiles)              | Security Sprint    | 2026-03-22 |
| Cache-Deduplizierung (`indexedDbLruCache` Factory)         | Session #3         | 2026-03-23 |
| `sw.js` + `public/sw.js` Konsolidierung                    | Session #2         | 2026-03-23 |
| 18 Dependabot-PRs geschlossen + Branches gelöscht          | Session #2         | 2026-03-23 |
| Crypto Polyfill + jsdom Fixes (643 Tests grün)             | Session #3         | 2026-03-23 |
| ClusterFuzzLite Pipeline (`cflite_pr.yml`)                 | Commit `08f8d02`   | 2026-03-22 |
| SHA-Pinning aller CI Actions                               | Security Sprint    | 2026-03-22 |
| CSP Hardening (kein `unsafe-inline` in script-src)         | v1.1.0             | 2026-03-20 |
| Development Journey Transparency (README, AboutTab, i18n)  | Session 2026-03-24 | 2026-03-24 |

---

## Abhängigkeiten & Blockermatrix

```

S1.3 (Branch Protection) -> S2._ (alle PRs ueber PR-Workflow)
S1.2 (CII Badge) -> S4.2 (Scorecard 10/10)
S2.2 (Coverage >30%) -> S3.3 (Code-Qualitaet)
S2.4 (Duplicates Welle 1) -> S3.5 (Duplicates Welle 2)
S1-S4 (Quality Infra) -> S5._ (Feature Delivery)
S5._ (v1.2 Features) -> S6._ (v1.3+ Vision)

````

```mermaid
graph TD
    S1.3[S1.3 Branch Protection] --> S2[Sprint 2]
    S1.2[S1.2 CII Badge] --> S4.2[S4.2 Scorecard 10/10]
    S2.2[S2.2 Coverage >30%] --> S3.3[S3.3 Code-Qualitaet]
    S2.4[S2.4 Duplicates W1] --> S3.5[S3.5 Duplicates W2]
    S1[Sprint 1] --> S2
    S2 --> S3[Sprint 3]
    S3 --> S4[Sprint 4]
    S4.1[S4.1 Signed Releases] --> S4.2
    S4 --> S5[Sprint 5: v1.2]
    S5 --> S6[Sprint 6: v1.3-v2.0]
````

---

## Quality Gates

> Vor jedem Commit und nach jedem Sprint ausführen:

```bash
# Pflicht-Checks (müssen alle grün sein)
npx tsc --noEmit                     # TypeScript Kompilierung
npx vitest run                       # Alle Tests (643+ müssen bestehen)
node scripts/lint-changed.mjs        # Lint geänderter Dateien
npx prettier --check "**/*.{ts,tsx}" # Format-Check

# Erweiterte Checks (pro Sprint)
npx vitest run --coverage            # Coverage-Report (Ziel >30%)
npm run lighthouse:ci                 # Lighthouse Audit
npm run security:scan                 # Security-Scan (Semgrep, Gitleaks, etc.)
```

---

## Definition of Done

### Pro Task

- [ ] Keine neuen TypeScript-Fehler (`tsc --noEmit`)
- [ ] Keine neuen Lint-/Format-Fehler
- [ ] Relevante Regressionstests grün
- [ ] Neue Funktionalität mit Tests abgedeckt
- [ ] i18n: Beide Sprachen (EN + DE) aktualisiert
- [ ] Handoff-Delta in `docs/next-session-handoff.md` dokumentiert

### Pro Sprint

- [ ] Alle Sprint-Erfolgskriterien erfüllt
- [ ] Status-Dashboard aktualisiert
- [ ] Session-Review-Dokument erstellt (`docs/session-activity-review-YYYY-MM-DD.md`)
- [ ] Session-Todo aktualisiert (`docs/session-activity-todo-YYYY-MM-DD.md`)
- [ ] `next-session-handoff.md` mit aktueller Session als "Latest" aktualisiert
- [ ] Git Commit mit Conventional Commit Message

---

## Session-Protokoll

> Chronologische Liste aller Sessions, die an dieser Roadmap arbeiten. Neue Einträge am Anfang.

| Datum      | Session-Fokus                    | Sprint       | Fortschritt                                            | Review-Doc                                      |
| ---------- | -------------------------------- | ------------ | ------------------------------------------------------ | ----------------------------------------------- |
| 2026-04-05 | P0/P1 Audit: Stryker + Tests     | S2 + S3      | 29 neue Tests, Stryker Baseline, Retry-After Parsing   | Session 63                                      |
| 2026-03-28 | Deep Cleanup + 5-Feature Batch   | S3 + S5      | 18 files, eco-mode sync, plugin UI, DSGVO, i18n, dedup | [review](session-activity-review-2026-03-28.md) |
| 2026-03-27 | Full Audit Plan (12 Phases)      | S3 + S5      | 24 files modified, 11 new, 12/12 phases done           | [review](session-activity-review-2026-03-27.md) |
| 2026-03-24 | Development Journey Transparency | Vorbereitung | Roadmap erstellt, README + AboutTab + i18n + Handoff   | [review](session-activity-review-2026-03-24.md) |
| 2026-03-23 | Cache Tests + Coverage Boost     | Vorbereitung | 643 Tests, IndexedDB-Cache-Tests                       | [review](session-activity-review-2026-03-23.md) |
| 2026-03-23 | CodeAnt Cleanup + PR Purge       | Vorbereitung | 18 PRs geschlossen, CodeAnt vollständig                | [review](session-activity-review-2026-03-23.md) |
| 2026-03-22 | 7-Phasen Security Sprint         | Vorbereitung | secureRandom, ReDoS, Docker, Fuzzing, Scorecard        | [review](session-activity-review-2026-03-22.md) |

---

## Hinweise für zukünftige Sessions

1. **Dieses Dokument ist der Einstiegspunkt.** Lies zuerst das Status-Dashboard und die Blockermatrix.
2. **Aktualisiere das Status-Dashboard** am Anfang und Ende jeder Session.
3. **Sprints sind sequentiell priorisiert**, aber unabhängige Tasks innerhalb eines Sprints können parallel bearbeitet werden.
4. **P0-Blocker (Sprint 1) erfordern Admin-Zugang** — ohne Admin-PAT/Browser keine Fortschritte bei S1.1–S1.3.
5. **Quality Gates sind nicht optional** — jeder Commit muss `tsc + test + lint` bestehen.
6. **Verweise auf existierende Docs:**
    - Produkt-Roadmap: [`ROADMAP.md`](../ROADMAP.md)
    - UI/UX Audit: [`ui-ux-audit.md`](../ui-ux-audit.md)
    - Security Status: [`docs/security-alerts-status.md`](security-alerts-status.md)
    - Session Todo: [`docs/session-activity-todo-2026-03-28.md`](session-activity-todo-2026-03-28.md)
7. **Conventional Commit Format:** `<type>(<scope>): <description>` — Typen: feat, fix, docs, refactor, test, perf, chore, a11y, i18n, security

---

_Erstellt: 2026-03-24 | Quelle: Full-Scale Deep Audit & Action-Plan (Commit 473044d)_
_Maintainer: [@qnbs](https://github.com/qnbs)_

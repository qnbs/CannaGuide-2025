# Session Activity TODO — 2026-03-24

<!-- markdownlint-disable MD040 MD029 -->

**Source:** Full-Scale Deep Audit, Critical Evaluation & Action-Plan (2026-03-23 session-close, Commit 473044d)

**Current Status:** CI green (643/643 tests, 76 files), OpenSSF 8.5/10, SonarCloud Security A, Reliability B, Maintainability A, Hotspots E (0% reviewed), Coverage 22.8%.

---

## Completed This Session (2026-03-24)

- ✅ README badges restructured (grouped: Status & Quality, AI Development Stack, App Capabilities)
- ✅ New badges: Tests (643+), Prototyped in AI Studio, Evaluated by Grok, Built with Claude, GitHub Codespaces
- ✅ README Development Journey section added (EN + DE) with 4-phase table
- ✅ AboutTab.tsx: New Development Journey card in About the App
- ✅ i18n: `settingsView.about.devJourney.*` keys added (EN + DE, 10 keys each)
- ✅ i18n: `readmeContent.aiStudioTitle/Content` updated to reflect 4-phase process (EN + DE)
- ✅ Session handoff docs created (review + todo + next-session-handoff update)

---

## P0 — Next Session (Admin-Only / Blocker)

### SonarCloud Security Hotspots — Manual UI Review

- **What:** All Security Hotspots in SonarCloud need manual review/dismissal via the SonarCloud web UI
- **Why:** 0% reviewed = E-Rating, blocks Quality Gate A
- **How:** SonarCloud UI → Security Hotspots → Review each → Dismiss with comment
- **Impact:** Quality Gate A/B achievement
- **Effort:** 15–30 min
- **Status:** ⬜ Requires browser access to SonarCloud dashboard

### CII-Best-Practices Badge Activation

- **What:** Verify email on bestpractices.dev to activate the badge
- **Why:** Scorecard check #187 blocks 10/10
- **How:** Verify email → Add badge to README + docs
- **Impact:** OpenSSF 10/10 compliance
- **Effort:** 5 min + waiting period
- **Status:** ⬜ Registered, pending email verification

### Branch Protection — Enforce for Admins

- **What:** Enable "Include administrators" in branch protection rules
- **Why:** Scorecard checks #188/#194 (Code-Review, Branch-Protection)
- **How:** GitHub Settings → Branches → main → "Require pull request reviews" + "Include administrators"
- **Impact:** No more direct-push, higher review quality
- **Effort:** 2 min (requires Admin-PAT)
- **Status:** ⬜ Admin-only action

---

## P1 — Short-Term (Quality & Optimization)

### Property-Based Fuzzing Extension

- **What:** Extend fast-check fuzzing to `commandService` + parser-heavy services
- **Why:** commandService (Regex, Parsing) is hotspot for ReDoS/crashes
- **How:** New `commandService.test.fuzz.ts` + seeds in CI artifacts
- **Impact:** Zero-day resistance for AI prompts/commands
- **Effort:** 2–4 hours
- **Status:** ⬜ Not started

### Test Coverage >30%

- **What:** Increase coverage from 22.8% to >30%
- **Target services:** aiProviderService, aiService, exportService, strainService, commandService
- **How:** Vitest + Playwright-CT for services/
- **Impact:** Mutation testing (Stryker) stability, fewer regression risks
- **Effort:** 1–2 days
- **Status:** ⬜ Not started

### Sonar Handoff Docs Consolidation

- **What:** Merge `sonar-handoff-review-2026-03-21.md` and `sonar-handoff-todo-2026-03-21.md` into two sections: Completed / Remaining
- **Why:** Documentation hygiene
- **How:** Merge → delete old files
- **Effort:** 30 min
- **Status:** ⬜ Not started

---

## P2 — Medium-Term (Stability & UX)

### Lighthouse Thresholds

- **What:** Set performance ≥0.80, accessibility ≥0.90 in `lighthouserc.json`
- **Why:** PWA mobile-first must be perfect on iOS/Android
- **How:** CI job with `--preset=performance`
- **Effort:** 1 hour
- **Status:** ⬜ Not started

### security-full.yml Activation

- **What:** Enable full daily security scans
- **Why:** Complete automated security coverage
- **How:** Repo Settings → Code Scanning → Enable
- **Effort:** 10 min
- **Status:** ⬜ Not started

### SonarCloud Maintainability A (354 Code Smells)

- **What:** Reduce code smells, improve maintainability
- **Effort:** 1–2 days
- **Status:** ⬜ Ongoing (was ~450, now 354)

### UI/UX A11y from ui-ux-audit.md

- **What:**
    - All icon-only destructive actions to 44×44 px
    - Screen-reader labels for chart toggles
    - Mobile E2E assertions against clipping
    - Focus-return tests for nested overlays (Camera inside Diagnostics)
- **Why:** WCAG 2.2 AA 100%, mobile UX perfection
- **How:** components/ui/\* + Playwright-CT
- **Effort:** 1–2 days
- **Status:** ⬜ Not started

---

## P3 — Later / Perfection (v1.2+ & v2.0)

### Signed Releases + PR-Based CI

- **What:** GitHub Releases with GPG/SSH signing + PR workflow
- **Why:** Scorecard 10/10 + CII-Best-Practices
- **Effort:** 4 hours
- **Status:** ⬜ Not started

### ROADMAP v1.2 Features (In Progress)

- ⬜ ES/FR/NL i18n
- ⬜ Advanced Nutrient Scheduling + EC/pH Automation
- ⬜ Community Strain Marketplace
- ⬜ Auto-PDF Grow Reports
- ⬜ Strain Comparison Tool

### Further ROADMAP (v1.3–v2.0)

- ⬜ Three.js 3D Plant Visualization
- ⬜ Real-time ESP32 Dashboard + WebSocket
- ⬜ AR/VR Overlays (WebXR) + Digital Twin
- ⬜ 2,000+ Strains + Discovery Feed

---

## Quality Gates (Per Change Wave)

```bash
npx tsc --noEmit              # Type check
npm test                      # 643+ tests must pass
node scripts/lint-changed.mjs # Lint changed files
npx prettier --check <files>  # Format check
```

---

## Definition of Done per Task

- ✅ Sonar findings closed or documented as remaining
- ✅ No new type/lint/format errors
- ✅ Relevant regression tests green
- ✅ Handoff deltas documented

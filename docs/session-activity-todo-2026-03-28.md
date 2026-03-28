# Session Activity TODO -- 2026-03-28

<!-- markdownlint-disable MD040 MD029 -->

**Source:** Deep Cleanup + 5-Feature Batch Implementation
**Current Status:** 719 tests (86 files), tsc clean (ML baseline only), all 5 batch tasks + cleanup implemented.

---

## Completed This Session (2026-03-28)

- [x] Phase 1: README.md EN+DE monorepo commands + structure update
- [x] Phase 1: Metadata verification (index.html, manifest.json, package.json)
- [x] Phase 1: capacitor.config.ts webDir fix (apps/web/dist)
- [x] Phase 1: CI/CD fixes (fuzzing.yml, deploy.yml, new scripts)
- [x] Aufgabe 1: Eco-Mode Redux sync via listener middleware
- [x] Aufgabe 2: autoAdjustRecommendation display + plugin schedule buttons
- [x] Aufgabe 3: DSGVO individual database deletion UI + Sentry tracking
- [x] Aufgabe 4: seedbanks namespace wired into all 5 locales
- [x] Aufgabe 5: createCachedPipelineLoader factory (4 services refactored, ~75 LOC saved)

---

## Remaining / Follow-Up Tasks

### i18n Completion (ES/FR/NL)

- [ ] Translate remaining namespaces for ES/FR/NL (most only have common + seedbanks fully done)
- [ ] Add ES/FR/NL language selector options in Settings UI (currently EN/DE only)
- [ ] Community translation review via GitHub Discussions

### Testing

- [ ] Unit tests for individual DB deletion (eraseSingleDatabase in DataManagementTab)
- [ ] Unit tests for eco-mode listener middleware sync
- [ ] Unit tests for createCachedPipelineLoader factory
- [ ] Unit tests for nutrient planner plugin apply/detach UI
- [ ] Playwright E2E: export dialog, DSGVO erase, nutrient plugin workflow

### Code Quality

- [ ] SonarCloud Security Hotspots manual review (0% reviewed = E-Rating)
- [ ] CII-Best-Practices badge email verification
- [ ] Further code deduplication opportunities (Pattern 2-5 from audit)
- [ ] Coverage target >30% (currently below)

### Performance

- [ ] Run Lighthouse CI after deployment to measure metrics
- [ ] Measure Three.js chunk impact on initial load
- [ ] Eco-mode runtime validation (verify 70% resource savings claim)

### Infrastructure

- [ ] Update Dockerfile / Dockerfile.dev COPY paths for monorepo
- [ ] Update netlify.toml build/publish paths
- [ ] Verify GitHub Pages deploy workflow with new apps/web/dist
- [ ] CODEOWNERS path pattern review
- [ ] Full Playwright E2E against new build output

# Session Activity TODO (2026-03-23)

## Completed This Session

- [x] CI badge fixed (crypto.subtle polyfill + cryptoService cross-realm fix)
- [x] Scorecard badge fixed (YAML repair + permissions + codeql-action hash)
- [x] Deploy auto-triggered on CI green
- [x] `ossf/scorecard-action` SHA-pinned in all workflows
- [x] Timeouts added to all workflow jobs (docker, benchmark, tauri-build)
- [x] `package.json` engines field added (`node >=20`)
- [x] `distribution.md` updated (GitHub Pages, Netlify, Tauri path, Capacitor)
- [x] Test counts updated across CONTRIBUTING.md and copilot-instructions.md (622+)
- [x] Commit identity enforcement hardened (pre-commit + pre-push)
- [x] DevContainer bootstrap: gh CLI, jq, signing, doctor script
- [x] Property-based fuzzing pipeline added (fast-check + workflow)
- [x] Full 20-workflow audit completed
- [x] Full config file audit completed
- [x] Full documentation audit completed
- [x] OpenSSF Scorecard optimized: Token-Permissions, Pinned-Dependencies, Fuzzing (ClusterFuzzLite), Security-Policy
- [x] 11 Workflows auf Job-Level write-Permissions migriert
- [x] ClusterFuzzLite-Config angelegt (`.clusterfuzzlite/` + `cflite_pr.yml`)
- [x] SECURITY.md erweitert (Supported Versions, Disclosure Timeline)
- [x] S2245: Alle Math.random() durch secureRandom() (crypto.getRandomValues) ersetzt — 15 Stellen, 9 Dateien
- [x] S5852: ReDoS-Schutz in commandService.ts (64-Zeichen-Limit)
- [x] nutrientPlannerSlice.ts: Math.random() → crypto.randomUUID()
- [x] sonar-project.properties: Test-Sources, Coverage-Exclusions korrekt konfiguriert
- [x] Dockerfile: apk upgrade fuer zlib-CVE-Fix (CVSS 7.8 + 5.5)
- [x] utils/random.ts: Neues Utility fuer crypto-basierte Zufallszahlen
- [x] Dangerous-Workflow (#175): deploy.yml untrusted head_sha Checkout entfernt
- [x] Pinned-Dependencies (#192, #193): ClusterFuzzLite Dockerfile SHA-gepinnt + build.sh npm ci
- [x] Pinned-Dependencies (#178, #177, #136): Alle Mock-Dockerfiles SHA-gepinnt
- [x] Pinned-Dependencies (#138, #137): capacitor-build.yml @capacitor/cli@8.2.0 gepinnt

## P0 — Next Session

- [ ] Code-Review (#188): Branch Protection mit Required Reviews aktivieren (Admin-PAT noetig)
- [ ] CII-Best-Practices (#187): Projekt auf https://www.bestpractices.dev/ registrieren
- [ ] SonarCloud Security Hotspots im UI reviewen/dismissend (aktuell 0.0% reviewed = E-Rating)
- [ ] SonarCloud Reliability B (49 issues) im Dashboard inspizieren und priorisiert abarbeiten

## P1 — Short-Term

- [ ] Extend property-based fuzzing to `commandService` ranking and parser-heavy services
- [ ] Add fuzz seed replay (persist failing seeds in CI artifacts)
- [ ] Consolidate `sonar-handoff-review-2026-03-21.md` and `sonar-handoff-todo-2026-03-21.md` into clean two-section format (Completed / Remaining)
- [ ] Continue untested service coverage: `aiProviderService`, `aiService`, `exportService`, `strainService`, `commandService`
- [ ] Evaluate adding Firefox/WebKit to Playwright E2E config
- [ ] SonarCloud Coverage von 22.8% auf >30% steigern (neue Tests fuer services/)

## P2 — Medium-Term

- [ ] Add Lighthouse score thresholds to `lighthouserc.json` (performance >= 0.80, accessibility >= 0.90)
- [ ] Enable `security-full.yml` once Code Scanning is enabled in repo settings
- [ ] Add quarterly signing-key rotation drill to runbook
- [ ] Consider pre-building Playwright browser into devcontainer image (saves 2-3 min cold start)
- [ ] Regenerate `scorecard.json` from fresh analysis (current file is stale from 2026-03-18)
- [ ] SonarCloud Maintainability A (354 code smells) schrittweise reduzieren

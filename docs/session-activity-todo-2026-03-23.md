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
- [x] Branch Protection konfiguriert (Reviews, Signed Commits, Linear History, Conversations)
- [x] Security Features aktiviert (Secret Scanning, Push Protection, Vuln Alerts, CodeQL Extended)
- [x] Actions Workflow Permissions auf read-only + no PR approval
- [x] Tag Protection Ruleset fuer v\* Tags
- [x] Copilot Environment Branch Policy auf protected branches
- [x] GitHub Pages HTTPS enforcement
- [x] 14 Repository Topics gesetzt
- [x] Dependabot Docker-Ecosystem fuer alle 4 Dockerfiles ergaenzt
- [x] Repo-Notifications auf ignored gesetzt (Dependabot-E-Mails deaktiviert)
- [x] CII-Best-Practices auf bestpractices.dev registriert (pending Aktivierung)
- [x] Admin-PAT kann widerrufen werden — alle Settings persistent

## OpenSSF Scorecard: 8.5/10

11 Checks auf 10/10. Verbleibende Checks sind strukturell bedingt:

## P0 — Naechste Session (Feature-Entwicklung)

- [ ] SonarCloud Security Hotspots im UI reviewen/dismissend (aktuell 0.0% reviewed = E-Rating)
- [ ] SonarCloud Reliability B (49 issues) im Dashboard inspizieren und priorisiert abarbeiten
- [ ] CII-Best-Practices Badge aktivieren sobald E-Mail-Verifikation abgeschlossen
- [ ] Weiter mit Feature-Entwicklung / App-Iteration

## P1 — Short-Term (Qualitaet)

- [ ] Extend property-based fuzzing to `commandService` ranking and parser-heavy services
- [ ] Add fuzz seed replay (persist failing seeds in CI artifacts)
- [ ] Continue untested service coverage: `aiProviderService`, `aiService`, `exportService`, `strainService`, `commandService`
- [ ] SonarCloud Coverage von 22.8% auf >30% steigern (neue Tests fuer services/)
- [ ] Evaluate adding Firefox/WebKit to Playwright E2E config
- [ ] Consolidate `sonar-handoff-*-2026-03-21.md` into clean two-section format (Completed / Remaining)

## P2 — Medium-Term (wenn App stabiler)

- [ ] Add Lighthouse score thresholds to `lighthouserc.json` (performance >= 0.80, accessibility >= 0.90)
- [ ] Enable `security-full.yml` once Code Scanning is enabled in repo settings
- [ ] SonarCloud Maintainability A (354 code smells) schrittweise reduzieren
- [ ] Consider pre-building Playwright browser into devcontainer image
- [ ] Regenerate `scorecard.json` from fresh analysis

## P3 — Spaeter (App fertigerer Zustand)

- [ ] Branch Protection auf enforce_admins umstellen (PR-Workflow fuer alle)
- [ ] Code-Review Scorecard-Check verbessern (PRs statt Direct-Push)
- [ ] Signed Releases erstellen (GitHub Releases mit gpg/ssh-signiertem Tag)
- [ ] CI-Tests Check aufbauen (PR-basierte CI-Pipelines)
- [ ] Quarterly signing-key rotation drill einrichten

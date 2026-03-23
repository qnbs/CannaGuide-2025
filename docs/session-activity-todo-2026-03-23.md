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

## P0 — Next Session

- Enable branch protection on `main` with required status checks (requires admin PAT)
    - Required checks: `quality`, `ci-status`, `fuzzing`
    - Enforce signed commits
- Monitor Deploy workflow for first green run and verify live site at `qnbs.github.io/CannaGuide-2025/`

## P1 — Short-Term

- Extend property-based fuzzing to `commandService` ranking and parser-heavy services
- Add fuzz seed replay (persist failing seeds in CI artifacts)
- Consolidate `sonar-handoff-review-2026-03-21.md` and `sonar-handoff-todo-2026-03-21.md` into clean two-section format (Completed / Remaining)
- Continue untested service coverage: `aiProviderService`, `aiService`, `exportService`, `strainService`, `commandService`
- Evaluate adding Firefox/WebKit to Playwright E2E config

## P2 — Medium-Term

- Add Lighthouse score thresholds to `lighthouserc.json` (performance ≥ 0.80, accessibility ≥ 0.90)
- Enable `security-full.yml` once Code Scanning is enabled in repo settings
- Add quarterly signing-key rotation drill to runbook
- Consider pre-building Playwright browser into devcontainer image (saves 2-3 min cold start)
- Regenerate `scorecard.json` from fresh analysis (current file is stale from 2026-03-18)

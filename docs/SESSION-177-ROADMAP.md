# Session 177 Roadmap — Master Audit Execution

Last updated: 2026-05-31

## Completed (this PR)

| ID             | Task                                                | Status |
| -------------- | --------------------------------------------------- | ------ |
| P0-01          | Dependabot security (#256 merged)                   | Done   |
| P1-01          | `postHydration.ts` parallel imports + tests         | Done   |
| P1-02          | `aiResponseValidation` Sentry dedup                 | Done   |
| P1-03          | `View.Help` route preload                           | Done   |
| P1-04          | Coverage thresholds Stufe A (40/40/30/40)           | Done   |
| P1-05          | `diagnosisFallback` branch tests                    | Done   |
| P1-06          | `203-state-persistence` localStorage exception      | Done   |
| FEINSCHLIFF-01 | AUDIT_BACKLOG S-07 (CVE-2026-41242)                 | Done   |
| FEINSCHLIFF-05 | CRDT divergence Sentry breadcrumbs                  | Done   |
| P2-02          | Onboarding `onboardingCompletedAt` + breadcrumb     | Done   |
| P2-05          | WebKit E2E in CI (advisory)                         | Done   |
| DX             | Windows MCP launchers, `.vscode/`, `windows:doctor` | Done   |

## Manual (owner)

| ID    | Action                                                       |
| ----- | ------------------------------------------------------------ |
| P0-02 | GitHub Secrets → `SNYK_TOKEN`                                |
| P0-03 | Cloudflare Dashboard → disconnect Workers Git build          |
| DX    | `pnpm run setup:windows` + `gh auth login` + `gk auth login` |
| DX    | Upgrade local Node to **24.x** (CI parity)                   |

## Next sprint (Session 178+)

| Priority | Task                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| P1       | Full `pnpm run test:coverage` on CI — verify Stufe A gates green                |
| P1       | `graphify update .` + commit refreshed `graphify-out/`                          |
| P2       | RTL Tailwind migration (`ml` → `ms`) — incremental                              |
| P2       | `exportService` html2canvas → `html-to-image` evaluation                        |
| P2       | Coverage Stufe B₁ (42/39/25/35) merged; Stufe B full (50/50/35/50) after sprint |
| P3       | `strainImageFallback.ts` split (<700 LOC rule)                                  |

## Quality gates (every PR)

```bash
pnpm install --frozen-lockfile
pnpm run windows:doctor    # Windows only
pnpm run ci:audit
pnpm run gate:push         # before main merge
```

## CI babysitting checklist

- [ ] **CI Status** green (quality + security)
- [ ] Vitest count stable (expect +14 tests vs baseline)
- [ ] Coverage thresholds 40/30 not failing
- [ ] E2E Chromium shards green
- [ ] WebKit/Firefox advisory (continue-on-error OK)
- [ ] No new CodeQL / Semgrep regressions

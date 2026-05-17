# CI Audit & Health Dashboard

Last updated: 2026-05-17 (deps batch + stabilization merged to main)

## Merge policy (main)

- **Code owner review:** disabled on `main` (`require_code_owner_reviews=false`) for iterative solo-dev merges until re-enabled.
- **Required gate:** GitHub check `CI Status` (quality + security jobs).
- **Signatures:** disabled on `main` (iterative local/Cursor workflow); re-enable when SSH signing is configured on Windows.

This document records the CI/CD inventory, fixes applied during the stabilization audit, local verification results, and remaining risks that cannot be fully reproduced offline.

## CI Health (local snapshot)

| Gate                 | Command / location                                          | Local (2026-05-16)                     | CI notes                                                    |
| -------------------- | ----------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| Typecheck            | `pnpm run typecheck`                                        | PASS                                   | Node 24 on CI; local run used Node 22 (engine warning only) |
| Lint scopes          | `pnpm run lint:scopes`                                      | PASS (after `usePwaInstall` guard fix) | Strict, max-warnings 0                                      |
| MDC e2e              | `pnpm run mdc:e2e`                                          | PASS                                   | Nested `mdc:validate`                                       |
| Graphify doctor      | `pnpm run graphify:mcp:doctor`                              | PASS                                   | `graph.json` ~135h old, still valid                         |
| CSP consistency      | `node scripts/security/check-csp-consistency.mjs`           | PASS                                   | 5 delivery paths                                            |
| Production build     | `pnpm run build`                                            | PASS                                   | ~15m on Windows; Vite 7 + PWA                               |
| Bundle budget        | `node scripts/check-bundle-budget.mjs apps/web/dist/assets` | PASS                                   | gzip + brotli                                               |
| E2E selectors        | `node scripts/check-e2e-selectors.mjs`                      | PASS                                   | 23 files, 0 fragile selectors                               |
| Unit tests (changed) | `vitest run` on touched specs                               | SKIP (worker timeout)                  | Run in CI / Linux agent                                     |
| Full E2E             | `pnpm run test:e2e`                                         | Not run locally                        | Chromium blocking in aggregator; Firefox advisory           |

## Dependency hygiene (2026-05-17)

- Closed 11 stale Dependabot PRs (#194–#203, #193 already closed) in favor of batched update PR.
- Batch includes: `react-i18next`, `i18next`, `tailwind-merge`, `msw`, `onnxruntime-web`, ESLint/typescript-eslint, CodeQL action v4.35.4, `actions/labeler` v6.1.0, `pnpm/action-setup` v6.0.6.
- Graphify automation PRs (#192, #204, #206) closed; refresh via `pnpm run graphify:mcp:doctor` on demand.

## Fixes applied

### Build / toolchain

- **`apps/web/vite.config.ts`**: `createRequire(import.meta.url)` for optional ML/Tauri module resolution in ESM config (fixes `require.resolve` crash under Vitest/Vite 7).

### Workflow correctness

- **Bundle budget path**: `benchmark.yml`, `ci.yml`, and `release-gate.yml` now call `check-bundle-budget.mjs` on `apps/web/dist/assets` (Vite emits JS under `assets/`, not `dist/` root).
- **`release-publish.yml`**: `release` job has `permissions: contents: write` for `gh release create/edit/upload`.
- **`dependabot-auto-merge.yml`**: job-level `contents: write` + `pull-requests: write` for `gh pr merge --auto`.

### E2E / UI stability

- Playwright helpers and selectors hardened (`tests/e2e/helpers.ts`, selector guard).
- New **`cloud-sync-panel.e2e.ts`** for Cloud Sync settings flow.
- **`SyncConflictModal`**: testids and conflict-resolution UX aligned with tests.
- Screenshot baselines refreshed under `tests/e2e/__app-screenshots__/`.

### Lint

- **`usePwaInstall.ts`**: type guard for `localStorage` preload JSON (removes `@typescript-eslint/no-unsafe-type-assertion` under `lint:scopes`).

## Architecture decisions (documented, not changed)

### E2E blocking policy (`ci.yml`)

The `ci-status` aggregator **hard-fails** on `quality` and `security`, but treats **`e2e` as advisory**:

- Chromium shards: blocking for signal; aggregator still exits 0 if only E2E fails (with `[WARN]`).
- Firefox shards: `continue-on-error: true` (cross-browser signal only).

**Rationale:** reduce false-red mainline from infra/flake while keeping quality/security strict. To make E2E blocking again, change `ci-status` to `exit 1` when `needs.e2e.result != success`.

### Lighthouse thresholds

- **`lighthouserc.json`**: strict performance budgets for deploy previews.
- **`benchmark.yml`**: Lighthouse step uses `continue-on-error` / warn path for weekly advisory runs.

Unification of scores across deploy vs benchmark is a follow-up (see plan risk list).

## Inventory reference (25 workflows)

Primary gates: `ci.yml`, `deploy.yml`, `codeql.yml`, `security-full.yml`, `snyk.yml`, `release-publish.yml`, `release-gate.yml`, `benchmark.yml`, `dependabot-auto-merge.yml`, `mutation-testing.yml`, `desktop-build.yml`, `fuzzing.yml`, plus preview/deploy helpers (Cloudflare/Netlify paused).

Shared setup: [`.github/actions/setup-node-ci`](actions/setup-node-ci/action.yml) — Corepack, Node 24, `pnpm install --frozen-lockfile`. Some older workflows still inline the same steps.

## Remaining risks / not verified locally

| Risk                                | Mitigation / next step                                           |
| ----------------------------------- | ---------------------------------------------------------------- |
| GitHub Secrets (`SNYK_TOKEN`, etc.) | Required for `snyk.yml`; document in repo settings, never commit |
| `gh release` on tag push            | Verify on next `v*` tag after `contents: write` fix              |
| Dependabot auto-merge               | Requires branch protection + auto-merge enabled in repo settings |
| OpenSSF Scorecard / Semgrep / Grype | Run in dedicated workflows; use CI logs for regressions          |
| Local Node 22 vs CI Node 24         | Prefer Node 24 locally (`engines.node >= 24`)                    |
| Vitest worker timeouts on Windows   | CI uses Linux; retry with `--pool forks` if needed locally       |
| PWA / Workbox size warnings         | Advisory in build log; separate from chunk budget script         |
| Preview deploy workflows            | Paused (`deploy-cloudflare.yml`, `preview-validation.yml`)       |

## Recommended local pre-push (light)

```bash
pnpm install --frozen-lockfile
pnpm run lint:changed
pnpm run typecheck
pnpm --filter @cannaguide/web test:run   # or targeted vitest paths
pnpm run build
node scripts/check-bundle-budget.mjs apps/web/dist/assets
pnpm run mdc:e2e
pnpm run graphify:mcp:doctor
```

Heavy suites (full E2E, mutation, Lighthouse CI): rely on GitHub Actions unless debugging a specific flake.

## Related docs

- [Workflows README](workflows/README.md)
- [SECURITY.md](../SECURITY.md)
- [Distribution](../docs/distribution.md)
- [Audit backlog](../docs/AUDIT_BACKLOG.md)

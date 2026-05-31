# CI Audit & Health Dashboard

Last updated: 2026-05-31 (Session 177 — Master Audit + Windows DX)

## Quick commands

| Task                         | Command                            |
| ---------------------------- | ---------------------------------- |
| Local CI audit (light gates) | `pnpm run ci:audit`                |
| Pre-push gate                | `pnpm run gate:push`               |
| Changed lint                 | `pnpm run lint:changed`            |
| Full CI quality (heavy)      | GitHub Actions `ci.yml` on PR/push |

## 2026-05-31 — Session 177 (Master Audit + Windows DX)

### Changes

| Area          | Change                                                            |
| ------------- | ----------------------------------------------------------------- |
| Bootstrap     | `postHydration.ts` parallel imports; unit tests                   |
| AI validation | Single Sentry event on dual-path failure + fingerprint            |
| Coverage      | Thresholds 40/40/30/40 (Stufe A)                                  |
| CI E2E        | WebKit job advisory in `ci.yml`                                   |
| Windows       | `windows:doctor`, `setup:windows`, MCP Node launchers, `.vscode/` |
| Docs          | `SESSION-177-ROADMAP.md`, handoff Session 177, S-07               |

### Local verification (Session 177)

| Gate                   | Status                             |
| ---------------------- | ---------------------------------- |
| typecheck              | PASS (Node 22 local)               |
| windows:doctor         | PASS (uv/gk warn only)             |
| Vitest (changed files) | PASS on Windows with `pool: forks` |
| Full test:coverage     | CI authoritative                   |

---

## 2026-05-30 — Session 176 (CI audit run)

### Findings & fixes

| Issue                                    | Root cause                                                                | Fix                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Cloudflare PR preview deploy fails       | `wrangler` not in monorepo; `pnpm add wrangler` blocked at workspace root | Added `wrangler` devDependency; `wranglerVersion` + `pnpm exec wrangler --version` in workflow |
| Preview branch names with `/`            | `cursor/foo` passed raw to `--branch`                                     | Sanitize to DNS-safe slug (max 63 chars)                                                       |
| Dependabot noise on tmp/qs/uuid          | Packages pinned in `pnpm.overrides`                                       | `dependabot.yml` ignore list                                                                   |
| `workflows/README.md` stale              | Still said Cloudflare paused / cleanup read-only                          | Rewritten to match PR #250 state                                                               |
| Snyk weekly workflow red without token   | Single job required `SNYK_TOKEN`                                          | Split `snyk-skipped` job (notice) vs `snyk` scan job                                           |
| GitHub Pages deploy skipped              | Prior `main` CI failed (#248 typecheck) before #250 merge                 | Expected; re-runs after green CI on `main`                                                     |
| Scheduled stale/Snyk “failures” (May 25) | **Account billing lock** — jobs never started                             | Org/repo billing; not fixable in code                                                          |
| Workers Builds check                     | Cloudflare dashboard Worker Git integration                               | Documented in `docs/distribution.md` — disconnect in dashboard                                 |

### Local audit snapshot (Session 176, Node 24)

Run via `pnpm run ci:audit` after `pnpm install --frozen-lockfile`.

| Gate                  | Status                    |
| --------------------- | ------------------------- |
| typecheck             | PASS                      |
| lint:scopes           | PASS                      |
| mdc:e2e               | PASS                      |
| graphify:mcp:doctor   | PASS (graph age advisory) |
| audit-backlog         | PASS                      |
| csp-consistency       | PASS                      |
| e2e-selectors         | PASS                      |
| build + bundle-budget | PASS (when run)           |

Full Vitest (2688 tests) and E2E remain in GitHub Actions `ci.yml`.

---

## 2026-05-30 — Audit consolidation (PR #250)

| Area             | Change                                                          |
| ---------------- | --------------------------------------------------------------- |
| Typecheck        | `actionCreator` matchers in Redux listeners                     |
| Vercel build     | Tauri stubs when optional packages missing                      |
| react-dom        | `^19.2.6` — 2688 Vitest tests                                   |
| GitHub Pages     | Trust CI on `workflow_run`; `BUILD_BASE_PATH=/CannaGuide-2025/` |
| Cloudflare Pages | `deploy-cloudflare.yml` with secrets gate + PR preview          |
| Deploy cleanup   | `cleanup-deployments.yml` deletes stale deployments             |
| harden-runner    | v2.19.4 repo-wide                                               |

**CI note:** `ci.yml` ignores `**/*.md` and `docs/**` — doc-only commits do not run CI.

---

## Merge policy (main)

- **Required gate:** GitHub check **CI Status** (quality + security; E2E advisory).
- **Code owner review:** disabled on `main` for iterative solo-dev workflow.
- **Signatures:** disabled on `main` until SSH signing configured locally.

## Architecture decisions (unchanged)

### E2E blocking policy (`ci.yml`)

`ci-status` **hard-fails** on `quality` and `security`; **E2E is advisory** (`[WARN]` only).

### Lighthouse

- Deploy: `deploy.yml` + `lighthouserc.json`
- Weekly: `benchmark.yml` (`continue-on-error`)

## Inventory (25 workflows)

See [workflows/README.md](workflows/README.md). Shared setup: [setup-node-ci](actions/setup-node-ci/action.yml).

## Remaining risks

| Risk                                 | Mitigation                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| GitHub Actions billing lock          | Restore billing; stale/scheduled jobs show “account locked”                      |
| `SNYK_TOKEN` missing                 | `snyk-skipped` job succeeds with notice; add token for scans (cron Mo 02:00 UTC) |
| Cloudflare Workers Builds (PR check) | Dashboard: disable Worker Git build (see `docs/distribution.md` P0-03)           |
| CVE-2026-41242 (protobufjs)          | `auditConfig.ignoreCves` — false positive; see AUDIT_BACKLOG S-07                |
| Dependabot override packages         | Ignored in `dependabot.yml`; bump via manual PR + `pnpm.overrides`               |
| Doc-only commits skip CI             | Touch non-ignored path or `workflow_dispatch` CI                                 |
| Coverage target 50 %                 | Stufe A gates 40/40/30/40 in `vite.config.ts` (Session 177)                      |
| Local Node 22 vs CI 24               | Use Node ≥24 (`engines`)                                                         |
| Mutation testing                     | Weekly `mutation-testing.yml`; advisory ≥50 % score target                       |
| GitKraken MCP (`gk`)                 | Requires GitKraken CLI + `gk auth login`; see `pnpm run mcp:doctor`              |

## Recommended pre-push

```bash
pnpm install --frozen-lockfile
pnpm run ci:audit          # or gate:push for tests + build
```

Heavy: full E2E (`pnpm run test:e2e`), mutation, Lighthouse — use CI unless debugging flakes.

## Related docs

- [Workflows README](workflows/README.md)
- [Distribution](../docs/distribution.md)
- [SECURITY.md](../SECURITY.md)
- [Audit backlog](../docs/AUDIT_BACKLOG.md)

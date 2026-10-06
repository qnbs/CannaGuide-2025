# CI Audit & Health Dashboard

Last updated: 2026-10-06 (live merge gate reconciled with `ci.yml`)

## Current policy (2026-10-06)

The dated session notes below are history. They are not the live merge gate.
`workflow-inventory: 29`

| Fact                    | Live behavior                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required check          | `✅ CI Status`                                                                                                                                                                              |
| What it requires        | build, unit tests and coverage, lint/types, security, and Chromium E2E. Rust runs when `apps/desktop` changes.                                                                              |
| Chromium E2E            | Blocking. `ci-status` fails unless `needs.e2e.result` is `success`.                                                                                                                         |
| Cross-browser E2E       | Advisory (`continue-on-error`) and label-gated. A skip there does not satisfy Chromium E2E.                                                                                                 |
| Docs-only pull requests | The workflow still runs. `changes` skips the code pipeline, and `✅ CI Status` passes only after that decision. A push to `main` still ignores `**/*.md`, `docs/**`, and `graphify-out/**`. |
| Signatures              | Required by the Main ruleset (`required_signatures`). Merges are squash-only. There is no admin bypass.                                                                                     |
| Snyk weekly scan        | Not a merge gate. A missing `SNYK_TOKEN` is an explicit skip, not a clean scan. High or Critical findings fail that workflow.                                                               |
| Mutation                | Weekly Stryker job. The break score stays at 50. It is not part of `✅ CI Status`.                                                                                                          |

`.github/workflows/ci.yml` header: `workflow-version: 2026-08-04-e2e-blocking`.

## Quick commands

| Task                         | Command                            |
| ---------------------------- | ---------------------------------- |
| Local CI audit (light gates) | `pnpm run ci:audit`                |
| Pre-push gate                | `pnpm run gate:push`               |
| Changed lint                 | `pnpm run lint:changed`            |
| Full CI quality (heavy)      | GitHub Actions `ci.yml` on PR/push |

## 2026-06-01 — Phase 0 (Master Audit execution)

Historical snapshot. Chromium E2E later became blocking. Do not treat this table as the live gate.

| Change           | Detail                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Merge gate**   | `ci-status` requires **Quality + Security** only                                        |
| E2E              | **Advisory** — failure emits `::warning::`, does not block merge                        |
| E2E retries      | `--retries=2` on Chromium shard                                                         |
| Advisory job     | Separate `advisory` job: critical-path, file-budget, localStorage (`continue-on-error`) |
| Feature branches | Full CI requires a pull request; direct push CI runs only on `main`                     |
| AI safety        | `services/ai/safetyPipeline.ts` extracted from `geminiService`                          |
| Docs CI          | `ci-docs.yml` for markdown-only changes                                                 |
| V-06             | Deferred to **v2.0** in `AUDIT_BACKLOG.md`                                              |

**Branch:** use an editor-neutral `<area>/<description>` name and open a pull request for CI evidence.

**Non-blocking PR checks (expected red/warn):** Cloudflare Pages preview (project name mismatch / optional), Workers Builds dashboard hook, `ci-docs` only when `*.md` paths change.

---

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

| Issue                                    | Root cause                                                                | Fix                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Cloudflare PR preview deploy fails       | `wrangler` not in monorepo; `pnpm add wrangler` blocked at workspace root | Added `wrangler` devDependency; `wranglerVersion` + `pnpm exec wrangler --version` in workflow (currently wrangler 4.x) |
| Preview branch names with `/`            | `feature/foo` passed raw to `--branch`                                    | Sanitize to DNS-safe slug (max 63 chars)                                                                                |
| Dependabot noise on tmp/qs/uuid          | Packages pinned in `pnpm.overrides`                                       | `dependabot.yml` ignore list                                                                                            |
| `workflows/README.md` stale              | Still said Cloudflare paused / cleanup read-only                          | Rewritten to match PR #250 state                                                                                        |
| Snyk weekly workflow red without token   | Single job required `SNYK_TOKEN`                                          | Split `snyk-skipped` job (notice) vs `snyk` scan job                                                                    |
| GitHub Pages deploy skipped              | Prior `main` CI failed (#248 typecheck) before #250 merge                 | Expected; re-runs after green CI on `main`                                                                              |
| Scheduled stale/Snyk “failures” (May 25) | **Account billing lock** — jobs never started                             | Org/repo billing; not fixable in code                                                                                   |
| Workers Builds check                     | Cloudflare dashboard Worker Git integration                               | Documented in `docs/distribution.md` — disconnect in dashboard                                                          |

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

Full Vitest (2812 tests) and E2E remain in GitHub Actions `ci.yml`.

---

## 2026-05-30 — Audit consolidation (PR #250)

| Area             | Change                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Typecheck        | `actionCreator` matchers in Redux listeners                                                                 |
| Vercel build     | Tauri stubs when optional packages missing                                                                  |
| react-dom        | `^19.2.7` — 2812 Vitest tests                                                                               |
| GitHub Pages     | Trust CI on `workflow_run`; `BUILD_BASE_PATH=/CannaGuide-2025/`                                             |
| Cloudflare Pages | `deploy-cloudflare.yml` with secrets gate + PR preview                                                      |
| Deploy cleanup   | Post-deploy prune in `deploy.yml` + `deploy-cloudflare.yml`; nightly `cleanup-deployments.yml` (keep 3/env) |
| harden-runner    | v2.19.4 repo-wide                                                                                           |

**CI note:** A push to `main` ignores `**/*.md` and `docs/**`. Pull requests do not use that filter; the `changes` job decides whether the code pipeline runs.

---

## Merge policy (main)

See [Current policy (2026-10-06)](#current-policy-2026-10-06). The required check is `✅ CI Status` (build + unit/coverage + lint/types + security + Chromium E2E). Signatures are required. Squash is the only merge method.

## Architecture decisions (unchanged)

### E2E blocking policy (`ci.yml`)

Chromium E2E is blocking inside `✅ CI Status`. Cross-browser E2E stays advisory.

### Lighthouse

- Deploy: `deploy.yml` + `lighthouserc.json`
- Weekly: `benchmark.yml` (`continue-on-error`)

## Inventory (29 workflows)

See [workflows/README.md](workflows/README.md). Shared setup: [setup-node-ci](actions/setup-node-ci/action.yml).

## Remaining risks

| Risk                                 | Mitigation                                                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| GitHub Actions billing lock          | Restore billing; stale/scheduled jobs show “account locked”                                                          |
| `SNYK_TOKEN` missing                 | Weekly scan records an explicit skip and is not a clean result. High/Critical fails that workflow. Not a merge gate. |
| Cloudflare Workers Builds (PR check) | Dashboard: disable Worker Git build (see `docs/distribution.md` P0-03)                                               |
| CVE-2026-41242 (protobufjs)          | `auditConfig.ignoreCves` — false positive; see AUDIT_BACKLOG S-07                                                    |
| Dependabot override packages         | Ignored in `dependabot.yml`; bump via manual PR + `pnpm.overrides`                                                   |
| Doc-only commits skip CI             | Touch non-ignored path or `workflow_dispatch` CI                                                                     |
| Coverage target 50 %                 | Stufe A gates 40/40/30/40 in `vite.config.ts` (Session 177)                                                          |
| Local Node 22 vs CI 24               | Use Node ≥24 (`engines`)                                                                                             |
| Mutation testing                     | Weekly `mutation-testing.yml`; advisory ≥50 % score target                                                           |
| GitKraken MCP (`gk`)                 | Requires GitKraken CLI + `gk auth login`; see `pnpm run mcp:doctor`                                                  |

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

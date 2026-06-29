# GitHub Actions workflows

Inventory of workflow files in this directory. Production web deploys: **GitHub Pages** (`deploy.yml`), **Vercel** (dashboard), and optionally **Cloudflare Pages** (`deploy-cloudflare.yml` when secrets are set).

CI health, local audit script, and merge policy: [`.github/CI-AUDIT.md`](../CI-AUDIT.md). Run locally: `pnpm run ci:audit`.

## Core CI/CD

| Workflow                                           | Trigger                            | Purpose                                                                              |
| -------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| [`ci.yml`](./ci.yml)                               | `push`/`PR` `main`, dispatch       | Quality + security + E2E; required check **CI Status**.                              |
| [`deploy.yml`](./deploy.yml)                       | After **successful CI** on `main`  | GitHub Pages (`BUILD_BASE_PATH=/CannaGuide-2025/`); trusts CI on `workflow_run`.     |
| [`deploy-cloudflare.yml`](./deploy-cloudflare.yml) | CI success on `main`, PR, dispatch | Cloudflare Pages mirror (`BUILD_BASE_PATH=/`); skips without `CLOUDFLARE_*` secrets. |
| [`desktop-build.yml`](./desktop-build.yml)         | Tag `v*`                           | Tauri desktop matrix (optional signing secrets).                                     |
| [`release-gate.yml`](./release-gate.yml)           | Tag `v*`                           | Pre-release checks.                                                                  |
| [`release-publish.yml`](./release-publish.yml)     | Tag `v*`                           | SBOM + GitHub Release.                                                               |

## Maintenance & automation

| Workflow                                                   | Purpose                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------- |
| [`dependabot-auto-merge.yml`](./dependabot-auto-merge.yml) | Auto-merge qualifying Dependabot PRs (skips security-labeled).    |
| [`cleanup-deployments.yml`](./cleanup-deployments.yml)     | Weekly prune of stale GitHub Deployments (keep 3/env; `dry_run`). |
| [`graphify-update.yml`](./graphify-update.yml)             | Refresh `graphify-out/` on `main` when code/docs change.          |
| [`stale.yml`](./stale.yml)                                 | Mark stale issues/PRs (scheduled).                                |
| [`labeler.yml`](./labeler.yml)                             | PR labels from `.github/labeler.yml`.                             |

## Security & quality

| Workflow                                   | Purpose                                                              |
| ------------------------------------------ | -------------------------------------------------------------------- |
| [`codeql.yml`](./codeql.yml)               | CodeQL analysis (advanced — disable default setup in repo settings). |
| [`security-scan.yml`](./security-scan.yml) | Composite security scans.                                            |
| [`security-full.yml`](./security-full.yml) | Extended / scheduled security suite.                                 |
| [`snyk.yml`](./snyk.yml)                   | Weekly Snyk SARIF (advisory; `SNYK_TOKEN` + setup-node-ci).          |
| [`scorecard.yml`](./scorecard.yml)         | OpenSSF Scorecard.                                                   |
| [`config-guard.yml`](./config-guard.yml)   | Devcontainer/VS Code guard on PRs.                                   |

## Testing & experiments

| Workflow                                         | Purpose                 |
| ------------------------------------------------ | ----------------------- |
| [`e2e-integration.yml`](./e2e-integration.yml)   | IoT integration tests.  |
| [`benchmark.yml`](./benchmark.yml)               | Performance benchmarks. |
| [`mutation-testing.yml`](./mutation-testing.yml) | Stryker mutation tests. |
| [`fuzzing.yml`](./fuzzing.yml)                   | Property fuzz tests.    |
| [`cflite_pr.yml`](./cflite_pr.yml)               | ClusterFuzzLite on PRs. |

## Paused / manual-only

| Workflow                                             | Notes                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [`preview-validation.yml`](./preview-validation.yml) | **Disabled** — was Netlify deploy previews; re-enable when Netlify returns. |

## CI path filters

`ci.yml` ignores `**/*.md` and `docs/**` on push/PR. Doc-only commits do not run CI. Include a code or workflow change when you need a fresh **CI Status** signal.

## External checks (not in this repo)

| Check                               | Source               | Action                                                                             |
| ----------------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| **Workers Builds: cannaguide-2025** | Cloudflare dashboard | Disconnect Workers Git build or remove unused Worker — see `docs/distribution.md`. |
| **Vercel**                          | Vercel dashboard     | Configured via `vercel.json`.                                                      |

Pinning: workflow `uses:` references remain **SHA-pinned** per repository policy.

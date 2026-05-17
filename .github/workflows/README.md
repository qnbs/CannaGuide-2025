# GitHub Actions workflows

Inventory of the **25** workflow files in this directory. Production web deploys: **GitHub Pages** (`deploy.yml`) and **Vercel** (dashboard). See [`docs/distribution.md`](../../docs/distribution.md).

CI health, applied fixes, and merge policy: [`.github/CI-AUDIT.md`](../CI-AUDIT.md). E2E is advisory in the `ci-status` aggregator (quality + security block).

## Core CI/CD

| Workflow                                           | Purpose                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`ci.yml`](./ci.yml)                               | Default branch + PR quality gates (lint, tests, build, coverage shards).                             |
| [`deploy.yml`](./deploy.yml)                       | Build and deploy to **GitHub Pages** after CI on `main`; optional E2E + Lighthouse against live URL. |
| [`deploy-cloudflare.yml`](./deploy-cloudflare.yml) | **Paused:** only `workflow_dispatch` stub — automated Cloudflare Pages deploy disabled.              |
| [`desktop-build.yml`](./desktop-build.yml)         | Tauri desktop matrix on tag push `v*` (optional signing secrets).                                    |
| [`release-gate.yml`](./release-gate.yml)           | Pre-release checks on tag `v*`.                                                                      |
| [`release-publish.yml`](./release-publish.yml)     | Release artifacts + SBOM + GitHub Release on tag `v*`.                                               |

## Maintenance & automation

| Workflow                                                   | Purpose                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| [`dependabot-auto-merge.yml`](./dependabot-auto-merge.yml) | Auto-merge qualifying Dependabot PRs.                              |
| [`cleanup-deployments.yml`](./cleanup-deployments.yml)     | Weekly reporting on GitHub Deployment API clutter (read-oriented). |
| [`graphify-update.yml`](./graphify-update.yml)             | Refresh `graphify-out/` on pushes to `main` when code/docs change. |
| [`stale.yml`](./stale.yml)                                 | Mark stale issues/PRs.                                             |
| [`labeler.yml`](./labeler.yml)                             | PR label rules from `.github/labeler.yml`.                         |

## Security & quality

| Workflow                                   | Purpose                                                      |
| ------------------------------------------ | ------------------------------------------------------------ |
| [`codeql.yml`](./codeql.yml)               | CodeQL analysis.                                             |
| [`security-scan.yml`](./security-scan.yml) | Composite security scans (Semgrep, secrets, deps).           |
| [`security-full.yml`](./security-full.yml) | Extended / scheduled security suite.                         |
| [`snyk.yml`](./snyk.yml)                   | Snyk (requires org token).                                   |
| [`scorecard.yml`](./scorecard.yml)         | OpenSSF Scorecard.                                           |
| [`config-guard.yml`](./config-guard.yml)   | Blocks risky patterns in devcontainer/VS Code config on PRs. |

## Data & strains

| Workflow                                                 | Purpose                                         |
| -------------------------------------------------------- | ----------------------------------------------- |
| [`strains-merge.yml`](./strains-merge.yml)               | Validates strain catalog on relevant PRs.       |
| [`strains-daily-update.yml`](./strains-daily-update.yml) | Scheduled strain data sync (secrets-dependent). |

## Testing & experiments

| Workflow                                         | Purpose                                            |
| ------------------------------------------------ | -------------------------------------------------- |
| [`e2e-integration.yml`](./e2e-integration.yml)   | IoT integration tests (workflow_dispatch / paths). |
| [`benchmark.yml`](./benchmark.yml)               | Performance benchmarks (manual / scheduled).       |
| [`mutation-testing.yml`](./mutation-testing.yml) | Stryker mutation tests.                            |
| [`fuzzing.yml`](./fuzzing.yml)                   | Fuzzing harness.                                   |
| [`cflite_pr.yml`](./cflite_pr.yml)               | ClusterFuzzLite on PRs.                            |

## Paused / manual-only

| Workflow                                             | Notes                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`preview-validation.yml`](./preview-validation.yml) | **Disabled:** was tied to Netlify deploy previews; Netlify paused until v2.0. Only `workflow_dispatch`. |
| [`deploy-cloudflare.yml`](./deploy-cloudflare.yml)   | **Paused:** no automatic deploy; optional manual run prints notice only.                                |

Pinning: workflow `uses:` references should remain **SHA-pinned** per repository policy (`CHANGELOG.md` Security section).

# DevOps Quality Gates

Inventory of automated gates in CannaGuide 2025 — what runs where, and how to reproduce locally.

Last updated: 2026-07-01

---

## Merge gate (required)

GitHub Actions job **`CI Status`** passes only when **Quality Gates** and **Security** succeed (see `.github/workflows/ci.yml`).

| Gate                                              | CI step    | Local command                                               |
| ------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| Lint (changed)                                    | `quality`  | `pnpm run lint:changed`                                     |
| Lint (strict scopes)                              | `quality`  | `pnpm run lint:scopes`                                      |
| MDC rules                                         | `quality`  | `pnpm run mdc:e2e`                                          |
| Graphify MCP doctor                               | `quality`  | `pnpm run graphify:mcp:doctor`                              |
| Typecheck                                         | `quality`  | `pnpm run typecheck`                                        |
| Zero `any` in app source                          | `quality`  | inline grep in `ci.yml`                                     |
| Unit tests + global coverage floors               | `quality`  | `pnpm run test:coverage`                                    |
| **Critical path coverage (≥80% lines/functions)** | `quality`  | `pnpm run check:critical-path-coverage`                     |
| **File budget (≤700 LOC on changed files)**       | `quality`  | `pnpm run check:file-budget`                                |
| Build                                             | `quality`  | `pnpm run build`                                            |
| Bundle budget                                     | `quality`  | `node scripts/check-bundle-budget.mjs apps/web/dist/assets` |
| Service dependency acyclic                        | `quality`  | `node scripts/generate-service-map.mjs`                     |
| i18n completeness                                 | `quality`  | `pnpm run check:i18n`                                       |
| Strain catalog integrity                          | `quality`  | `pnpm run strains:check-integrity`                          |
| Documentation metrics (badges ↔ source)           | `quality`  | `pnpm run check:doc-metrics`                                |
| Audit backlog (open HIGH)                         | `quality`  | `node scripts/check-audit-backlog.mjs`                      |
| E2E selector stability                            | `quality`  | `node scripts/check-e2e-selectors.mjs`                      |
| CSP consistency                                   | `quality`  | `node scripts/security/check-csp-consistency.mjs`           |
| pnpm audit (critical, prod)                       | `security` | `pnpm audit --audit-level=critical --prod`                  |
| Trojan-source scan                                | `security` | `pnpm run security:trojan-source`                           |
| Gitleaks                                          | `security` | `pnpm run security:secrets`                                 |

### Critical path coverage

Enforced files (see `scripts/check-critical-path-coverage.mjs`):

- `apps/web/services/ai/safetyPipeline.ts`
- `apps/web/services/syncEncryptionService.ts`
- `apps/web/services/plantSimulationService.ts`
- `apps/web/services/local-ai/vision/diagnosisService.ts`

Minimum: **80% lines** and **80% functions** per file. Branch coverage is reported as advisory until the P1 coverage sprint closes.

### File budget

- Max **700 LOC** per file in `services/`, `stores/`, `components/`, `hooks/`, `workers/`, `utils/`, `packages/ai-core/src`
- **Changed files** over budget → **fail**
- Grandfathered god-files → warn only (see `scripts/check-file-budget.mjs`)

---

## Advisory (non-blocking)

| Gate                    | CI job              | Local command                                       |
| ----------------------- | ------------------- | --------------------------------------------------- |
| E2E Chromium            | `e2e`               | `pnpm run build && pnpm run test:e2e`               |
| E2E cross-browser       | `e2e-cross-browser` | Playwright firefox/webkit                           |
| Critical path JS size   | `advisory`          | `pnpm run measure:critical-path`                    |
| File budget (full scan) | `advisory`          | `FILE_BUDGET_ADVISORY=1 pnpm run check:file-budget` |
| localStorage allowlist  | `advisory`          | `pnpm run check:localstorage`                       |

---

## Pre-commit / pre-push

| Hook                           | Command                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `pre-commit`                   | `lint-staged` (eslint + prettier on staged files)                                                  |
| `commit-msg`                   | commitlint conventional commits                                                                    |
| `pre-push`                     | typecheck + lint:scopes + file-budget                                                              |
| **`gate:push`** (manual, full) | `pnpm run gate:push` — identity, lint, mdc, graphify, typecheck, tests, scopes, file-budget, build |

Skip hooks (emergency only): `git push --no-verify`

---

## Local CI mirror

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/v24.16.0/bin:$PATH"

pnpm run ci:audit          # lightweight subset
pnpm run gate:push         # full pre-push gate
```

---

## Security / Dependabot

Transitive vulnerabilities remediated via root `pnpm.overrides` are documented in [`SECURITY.md`](../SECURITY.md#transitive-dependency-remediation-pnpm-overrides).

After adding overrides: `pnpm install`, `pnpm audit`, confirm GitHub **Security → Dependabot** alerts resolve.

---

## Related docs

- [`.github/CI-AUDIT.md`](../.github/CI-AUDIT.md) — audit history and dashboard
- [`docs/HOUSEKEEPING.md`](./HOUSEKEEPING.md) — release checklist
- [`AGENTS.md`](../AGENTS.md) — Cloud Agent workflow

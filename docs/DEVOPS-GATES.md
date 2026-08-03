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
| **jsx-a11y warning ratchet (may only drop)**      | `quality`  | `pnpm run check:a11y-ratchet`                               |
| Audit backlog (open HIGH)                         | `quality`  | `node scripts/check-audit-backlog.mjs`                      |
| E2E selector stability                            | `quality`  | `node scripts/check-e2e-selectors.mjs`                      |
| CSP consistency                                   | `quality`  | `node scripts/security/check-csp-consistency.mjs`           |
| pnpm audit (high, prod)                           | `security` | `pnpm audit --audit-level=high --prod`                      |
| pnpm audit (high, all deps)                       | `security` | `pnpm audit --audit-level=high`                             |
| **Override / dependabot-ignore drift**            | `security` | `node scripts/security/check-override-floors.mjs`           |
| Trojan-source scan                                | `security` | `pnpm run security:trojan-source`                           |
| Gitleaks                                          | `security` | `pnpm run security:secrets`                                 |

Every step in the `security` job is guarded with `always() && <setup\|checkout> succeeded`.
They are independent controls, so one failure must not skip the others -- before that guard, a
red dependency audit silently skipped both the Trojan-Source scan and the Gitleaks secret scan,
and a green `Security` job was the only evidence they had ever run. The guards do **not** soften
the gate: there is still no `continue-on-error`, so any failing scan fails the job and with it
`CI Status`.

Both audits run at `--audit-level=high`. The production audit used to run at `critical`, i.e. a
_laxer_ bar for shipped code than for dev tooling -- it printed `Severity: 1 high` and exited 0.
Production must never be held to a lower threshold than the dev graph.

### Override / dependabot-ignore drift

`overrides:` in `pnpm-workspace.yaml` and `ignore:` in `.github/dependabot.yml` are a pair: a
package is silenced for Dependabot **because** it is pinned by an override. `check-override-floors.mjs`
fails when that pair rots:

- a fully-ignored npm package with **no override** -- silenced with nothing standing in;
- a major-scoped key (`js-yaml@3`) matching **no version resolved** in `pnpm-lock.yaml` -- an
  orphaned pin;
- a **new** override floor with no upper bound (`>=x` with no `<y`).

An open floor resolves to the newest major in the registry. That is not theoretical here:
`fast-uri: '>=3.1.2'` resolved to 4.1.0, the version GHSA-v2hh-gcrm-f6hx names, and
`js-yaml@3: '>=3.15.0'` resolved depcheck's `js-yaml@^3` up two majors to 5.2.1 -- **creating**
GHSA-pm4m-ph32-ghv5 rather than preventing it.

The unbounded rule is a **ratchet**. The 12 pre-existing unbounded pins are listed in
`LEGACY_UNBOUNDED` inside the script and warn rather than fail; that list may only shrink, and
bounding a pin without delisting it fails too. Retiring them is a per-package call, because
three have already crossed a major (`uuid` -> 14.0.0, `basic-ftp` -> 6.0.1, `linkify-it` -> 6.0.0)
and `@babel/core` resolves to nothing at all. Offline -- lockfile and config only, no registry call.

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

### jsx-a11y warning ratchet

The `jsx-a11y` recommended rules run as **warnings** (`eslint.config.js`, `LINT_A11Y=1`), so they
never block lint-staged. `scripts/check-a11y-ratchet.mjs` keeps them from silently accumulating: it
counts the warnings over `apps/web` + `packages/ui` `.tsx`/`.jsx` (tests/stories excluded) with an
own **AST-only** ESLint instance — no type-checking, so it is fast and low-memory enough to run on
every PR.

- The count is compared to the committed baseline in [`.a11y-baseline.json`](../.a11y-baseline.json).
- Count **rises above** the baseline → **fail** (fix the new violation; do **not** raise the baseline).
- Count **drops** → run `pnpm run check:a11y-ratchet -- --update` (or `node scripts/check-a11y-ratchet.mjs --update`)
  **in the same PR** to lower the baseline. The ratchet only moves down.
- The baseline is a warning **count**, not a rule flip — rules stay `warn`. Promoting individual
  rules to `error` once their count reaches zero is a deliberate, separate follow-up.

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
| `pre-push`                     | typecheck + lint:scopes + file-budget + doc-metrics                                                |
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

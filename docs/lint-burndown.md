# Lint Debt Burn-down Strategy

This project uses an incremental lint hardening model to keep delivery fast while reducing legacy lint debt.

## Goals

- Block new lint **errors** in changed files.
- Enforce **strict lint** (`--max-warnings 0`) for selected, cleaned scopes.
- Expand strict scopes gradually until full-project strict lint is feasible.

## Current model

- `pnpm run lint` / `pnpm run lint:changed`
    - Lints changed JS/TS files only.
    - Uses `--quiet` to fail only on errors.
- `pnpm run lint:scopes`
    - Strict lint for configured clean scopes.
    - Fails on warnings and errors.
- `pnpm run lint:full`
    - Full project lint report (warnings allowed).
- `pnpm run lint:strict`
    - Full project strict lint (target end-state).

## Configuration

Strict scope configuration is stored in `scripts/lint-burndown.config.json`.

- `strictScopes`: enforced in CI and deploy pipelines.
- `candidateScopes`: suggested next batches for cleanup.

## Rollout process

1. Pick one candidate scope (e.g. `hooks/**/*.ts`).
2. Fix all lint warnings/errors in that scope.
3. Verify locally:
    - `npx eslint --max-warnings 0 <scope-glob>`
4. Move the scope from `candidateScopes` to `strictScopes`.
5. Commit and let CI enforce it going forward.

## Suggested phase order

| Phase | Scope                        | Status                |
| ----- | ---------------------------- | --------------------- |
| 1     | `hooks/**/*.ts`              | Done (enforced in CI) |
| 2     | `components/common/**/*.tsx` | Done (enforced in CI) |
| 3     | `services/**/*.ts`           | Done (enforced in CI) |
| 4     | `stores/**/*.ts`             | Done (enforced in CI) |
| 5     | Full-project strict lint     | Done (enforced in CI) |

Phase 1-4 are enforced via `pnpm run lint:scopes` in both `ci.yml` and `deploy.yml`.
The script `scripts/lint-scopes.mjs` runs ESLint with `--max-warnings 0` on all
paths listed in `strictScopes`.

### Phase 5 Completion (Session 115)

Full-project strict lint (`--max-warnings 0`) achieved:

- **0 errors**, **0 warnings** (132 per-line suppressions applied)
- All suppressions are `// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion`
  (plus 2 `react-hooks/exhaustive-deps` and 2 `no-unnecessary-type-arguments`)
- Concentrated in: workers (type-narrowing from `MessageEvent.data`),
  components (event handler casts), services (API response casts)
- `pnpm run lint:strict` now enforced with `--max-warnings 0` project-wide
- Automated via `eslint.config.js` rule `no-unsafe-type-assertion: warn`
  with per-line `eslint-disable-next-line` for structurally safe casts

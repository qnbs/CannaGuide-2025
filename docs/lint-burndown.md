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

| Phase | Scope                        | Status                   |
| ----- | ---------------------------- | ------------------------ |
| 1     | `hooks/**/*.ts`              | Done (enforced in CI)    |
| 2     | `components/common/**/*.tsx` | Done (enforced in CI)    |
| 3     | `services/**/*.ts`           | Done (enforced in CI)    |
| 4     | `stores/**/*.ts`             | Done (enforced in CI)    |
| 5     | Full-project strict lint     | Evaluated (123 warnings) |

Phase 1-4 are enforced via `pnpm run lint:scopes` in both `ci.yml` and `deploy.yml`.
The script `scripts/lint-scopes.mjs` runs ESLint with `--max-warnings 0` on all
paths listed in `strictScopes`.

### Phase 5 Evaluation (Session 113)

Full-project strict lint (`--max-warnings 0`) across all source directories:

- **0 errors**, **123 warnings**
- All 123 warnings are `@typescript-eslint/no-unsafe-type-assertion`
- Concentrated in: workers (type-narrowing from `MessageEvent.data`),
  components (event handler casts), services (API response casts)
- **Blocker:** Workers require `as` casts for `MessageEvent.data` since
  TypeScript cannot infer worker message types from `postMessage`. These
  are structurally safe but ESLint cannot verify them statically.
- **Path forward:** Suppress per-line in workers with `// eslint-disable-next-line`
  or configure `no-unsafe-type-assertion` to `warn` project-wide (already the case).
  Full zero-warning is achievable with ~123 targeted suppressions.

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

1. `hooks/**/*.ts`
2. `components/common/**/*.tsx`
3. `services/**/*.ts`
4. `stores/**/*.ts`
5. Full-project strict lint (`pnpm run lint:strict`)

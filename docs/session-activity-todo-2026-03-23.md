# Session Activity TODO (2026-03-23)

## P0

- Add `fuzzing` workflow as required status check in branch protection for `main`.
- Validate all active maintainers have at least one registered SSH signing key for verified commits.
- Confirm no automation uses `--no-verify` in release scripts or bots.

## P1

- Add troubleshooting section to main README: committer mismatch quick-fix (`env | rg '^GIT_'`, unset overrides).
- Add weekly scheduled report that summarizes latest commit verification status and signing anomalies.
- Evaluate extending property-based fuzzing to `commandService` ranking invariants and parser-heavy services.

## P2

- Add seed replay support for fuzz failures (persist failing seed in CI artifacts).
- Add a lightweight `devcontainer:doctor` script to print versions (`node`, `npm`, `gh`, `git`) + signing readiness.
- Consolidate all handoff docs into a single rolling index page for faster operator onboarding.

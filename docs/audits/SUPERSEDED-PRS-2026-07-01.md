# Superseded Open PRs (2026-07-01)

These draft PRs remain open on GitHub but are **fully superseded by `main`**. Close manually in the GitHub UI when convenient.

| PR | Branch | Status on `main` | Action |
|----|--------|------------------|--------|
| **#361** | `cursor/fix-cloud-update-node-path-1ff7` | Node 24 fix merged via **#360** (`nvm which 24` in `scripts/cursor-cloud-update.sh` + bashrc persistence) | **Close** — do not merge (would regress docs/React pins) |
| **#363** | `cursor/cloud-env-setup-notes-4e17` | Vitest isolation **fixed** in `042a0336` (`vi.hoisted()` + `resetModules`); `AGENTS.md` documents the pattern | **Close** — outdated “known flakiness” wording |
| **#364** | `cursor/ai-disclaimer-and-backlog-4ff3` | Merged to `main` in v1.9.0 release (`f07226c2`) | **Close** if still open |

Cloud Agent note: `gh pr close` fails with `Resource not accessible by integration` — repository maintainer must close via UI.

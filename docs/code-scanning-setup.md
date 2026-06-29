# Code Scanning Setup

Troubleshooting for **Security → Code scanning** and the PR banner  
_"Code scanning configuration error — CodeQL and Snyk Open Source are reporting errors."_

---

## Root cause (most common)

This repository uses **CodeQL default setup** (GitHub-managed `Analyze (*)` jobs on pull requests).  
A second **advanced** CodeQL workflow or duplicate Snyk SARIF upload causes configuration conflicts.

| Source             | Integration                                                                        |
| ------------------ | ---------------------------------------------------------------------------------- |
| CodeQL (automated) | GitHub **default setup** — `Analyze (javascript-typescript)`, `python`, `rust`     |
| CodeQL (manual)    | [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml) — dispatch only  |
| Snyk Open Source   | **Snyk GitHub App** (`security/snyk` PR check)                                     |
| Snyk (weekly)      | [`.github/workflows/snyk.yml`](../.github/workflows/snyk.yml) — advisory, no SARIF |

---

## Current policy (2026-06-29)

1. **Default setup** runs CodeQL on every PR/push (no SARIF upload from our workflow).
2. **`codeql.yml`** is **workflow_dispatch only** — manual monorepo build scan when needed.
3. **`snyk.yml`** runs weekly with `setup-node-ci`; alerts come from the Snyk App, not SARIF upload.

This avoids the dual-CodeQL conflict that triggers the configuration-error banner.

---

## Optional: switch to advanced CodeQL only

**Most users do not need this.** The repo already avoids conflicts by using default setup + `codeql.yml` dispatch-only.

### Why “CodeQL” may be missing in repository Settings

CodeQL **is active** if PR checks show `Analyze (javascript-typescript)`, `Analyze (python)`, `Analyze (rust)`, or `Analyze (actions)`.  
Those jobs come from GitHub **CodeQL default setup** — even when there is no **CodeQL analysis** row under **Settings → Code security** on the repository.

Common reasons the per-repo toggle is absent:

| Reason                                  | What to do                                                                                                                                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Organization security configuration** | CodeQL is managed at **org** level (GitHub _code security configurations_). Edit the applied configuration under **Organization → Settings → Code security → Configurations** — not per-repo Settings.                                                    |
| **Enforced org policy**                 | If the org config sets CodeQL default setup to **Enabled** (enforced), repos cannot **Switch to advanced** locally. Use **Enabled with advanced setup allowed** in the org configuration, or change the org policy.                                       |
| **Wrong navigation**                    | Repo path: **Settings → Advanced Security** (sidebar **Security**), scroll to **Code security** / **Code scanning**. Older UI: **Code security and analysis**. Viewing alerts: **Security** tab → **Code scanning** (not the same as enabling/disabling). |
| **Insufficient permissions**            | Only repo/org **admins** see security configuration controls.                                                                                                                                                                                             |
| **Public repository**                   | CodeQL default setup is free on public repos; controls may still be org-managed rather than repo-managed.                                                                                                                                                 |

Reference: [GitHub — security configurations at scale](https://docs.github.com/en/code-security/securing-your-organization/enabling-security-features-in-your-organization/understanding-github-security-configurations)

### If you have repo-level control (rare with org configs)

1. **Settings → Advanced Security** → section **Code security** / **Code scanning**.
2. In the **CodeQL analysis** row: **Switch to advanced** (only visible when default setup is repo-managed).
3. Restore `push` / `pull_request` / `schedule` in [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml).
4. Re-run **CodeQL** on `main`.

Reference: [GitHub Docs — default setup blocks SARIF upload](https://docs.github.com/en/code-security/code-scanning/troubleshooting-sarif/default-setup-enabled)

---

## Snyk Open Source

| Check                    | Action                                                       |
| ------------------------ | ------------------------------------------------------------ |
| PR check `security/snyk` | Snyk GitHub App — should pass when org billing is active     |
| Weekly `snyk.yml`        | Requires `SNYK_TOKEN` secret; advisory (`continue-on-error`) |
| SARIF upload             | **Disabled** — use Snyk App for Security tab alerts          |

If weekly Snyk fails on **Install dependencies**, ensure `pnpm-lock.yaml` is valid (`node scripts/check-pnpm-lockfile.mjs`) and the workflow uses [`.github/actions/setup-node-ci`](../.github/actions/setup-node-ci/action.yml).

---

## Local verification

```bash
node scripts/check-pnpm-lockfile.mjs
pnpm install --frozen-lockfile
pnpm run build
```

---

## Related

- [SECURITY.md](../SECURITY.md) — supply chain policy
- [`.github/CI-AUDIT.md`](../.github/CI-AUDIT.md) — CI health dashboard
- [HOUSEKEEPING.md](./HOUSEKEEPING.md) — release checklist

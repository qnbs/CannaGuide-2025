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

Repository maintainers (admin) who want monorepo `pnpm run build` on every PR:

1. Open **Settings → Code security** (or **Security → Advanced Security**).
2. Under **Code scanning**, find **CodeQL analysis**.
3. Click **Switch to advanced** (disables default setup).
4. Restore `push` / `pull_request` / `schedule` triggers in [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml).
5. Re-run **CodeQL** on `main`.

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

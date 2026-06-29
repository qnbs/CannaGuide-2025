# Code Scanning Setup

Troubleshooting for **Security → Code scanning** and the PR banner  
_"Code scanning configuration error — CodeQL and Snyk Open Source are reporting errors."_

---

## Root cause (most common)

GitHub **CodeQL default setup** is enabled **and** this repo runs **advanced** workflows:

| Source           | File / integration                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| CodeQL advanced  | [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml)               |
| CodeQL default   | Repository **Settings → Code security → Code scanning**                         |
| Snyk Open Source | Snyk GitHub App + [`.github/workflows/snyk.yml`](../.github/workflows/snyk.yml) |

Default + advanced CodeQL together produce configuration conflicts and duplicate `Analyze (*)` jobs on pull requests.

---

## Fix: use advanced CodeQL only (recommended)

Repository maintainers (admin):

1. Open **Settings → Code security** (or **Security → Advanced Security**).
2. Under **Code scanning**, find **CodeQL analysis**.
3. If you see **Switch to advanced** — default setup is active.
4. Click **Switch to advanced** (or **Disable CodeQL** on default, then rely on `codeql.yml`).
5. Confirm the canonical workflow is [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml).

After switching, re-run the latest **CodeQL** workflow on `main`. The Security tab configuration error should clear within one analysis cycle.

Reference: [GitHub Docs — default setup blocks SARIF upload](https://docs.github.com/en/code-security/code-scanning/troubleshooting-sarif/default-setup-enabled)

---

## Snyk Open Source

| Check                    | Action                                                                |
| ------------------------ | --------------------------------------------------------------------- |
| PR check `security/snyk` | Snyk GitHub App — should pass when org billing is active              |
| Weekly `snyk.yml`        | Requires `SNYK_TOKEN` secret; advisory (`continue-on-error`)          |
| SARIF upload             | Uses `category: snyk-open-source` to avoid CodeQL category collisions |

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

# Code Scanning Setup

Troubleshooting for **Security → Code scanning** and the PR banner  
_"Code scanning configuration error — CodeQL and Snyk Open Source are reporting errors."_

---

## Root cause (most common)

The banner appears when **two** CodeQL sources run at once — GitHub **default setup** (managed
`Analyze (*)` jobs) **and** an advanced `codeql.yml` with push/PR triggers. This repo now runs
**advanced only** (default setup disabled), so there is a single source.

| Source               | Integration                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CodeQL (advanced)    | [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml) — matrix (`javascript-typescript`, `actions`, `python`, `rust`), on push/PR/schedule |
| CodeQL default setup | **Disabled** (Settings → Code security → CodeQL), so it cannot conflict with the advanced workflow                                                     |
| Snyk Open Source     | **Snyk GitHub App** (`security/snyk` PR check)                                                                                                         |
| Snyk (weekly)        | [`.github/workflows/snyk.yml`](../.github/workflows/snyk.yml) — advisory, no SARIF                                                                     |

---

## Current policy (2026-07-15)

1. **`codeql.yml`** is the single CodeQL source — a language matrix (`javascript-typescript`,
   `actions`, `python`, `rust`, `build-mode: none`) on push to `main`, PRs, a weekly schedule, and
   manual dispatch. Default setup is **disabled**, so there is no dual-source conflict.
2. **`snyk.yml`** runs weekly with `setup-node-ci`; alerts come from the Snyk App, not a SARIF upload.

---

## Reverting to default setup (if ever needed)

Default setup and an advanced workflow are **mutually exclusive**. While default setup is enabled it
takes over analysis and **rejects the SARIF upload from any advanced run — including a manual
`workflow_dispatch`** (_"CodeQL analyses from advanced configurations cannot be processed when the
default setup is enabled"_). So reverting is **not** "re-enable default setup and leave dispatch on":

1. **Disable the advanced workflow first** — delete [`codeql.yml`](../.github/workflows/codeql.yml),
   or comment out **all** of its triggers (`push`, `pull_request`, `schedule`, **and**
   `workflow_dispatch`). Manual dispatch is _not_ a supported fallback while default setup is on — it
   would only produce failing SARIF-upload runs.
2. **Then** re-enable **Settings → Code security → CodeQL → default setup**.

Do the two steps in that order so there is never a window where both sources run at once.

### Finding the CodeQL controls in Settings

The advanced workflow needs no per-repo toggle — it is just a workflow file, and its
`Analyze (<language>)` checks come from [`codeql.yml`](../.github/workflows/codeql.yml), **not** from
default setup. The **Settings → Code security → Code scanning** controls only matter if you want to
switch _back_ to default setup, and they may be **org-managed** rather than per-repo:

| Situation                               | Where to look                                                                                                                                                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Organization security configuration** | Default setup is managed at **org** level (GitHub _code security configurations_). Edit the applied configuration under **Organization → Settings → Code security → Configurations** — not per-repo Settings.                                             |
| **Enforced org policy**                 | If the org config sets CodeQL default setup to **Enabled** (enforced), repos cannot **Switch to advanced** locally. Use **Enabled with advanced setup allowed** in the org configuration, or change the org policy.                                       |
| **Wrong navigation**                    | Repo path: **Settings → Advanced Security** (sidebar **Security**), scroll to **Code security** / **Code scanning**. Older UI: **Code security and analysis**. Viewing alerts: **Security** tab → **Code scanning** (not the same as enabling/disabling). |
| **Insufficient permissions**            | Only repo/org **admins** see security configuration controls.                                                                                                                                                                                             |
| **Public repository**                   | Default setup is free on public repos; controls may still be org-managed rather than repo-managed.                                                                                                                                                        |

References: [GitHub — security configurations at scale](https://docs.github.com/en/code-security/securing-your-organization/enabling-security-features-in-your-organization/understanding-github-security-configurations)
· [GitHub Docs — default setup blocks SARIF upload](https://docs.github.com/en/code-security/code-scanning/troubleshooting-sarif/default-setup-enabled)

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

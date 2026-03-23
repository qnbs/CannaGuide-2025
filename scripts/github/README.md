# GitHub Repo Hardening Automation

This script configures repository settings via GitHub API.

## Required PAT scopes/permissions

Use a fine-grained PAT with repository access and at least:

- Administration: read/write
- Actions: read/write
- Metadata: read-only

## Quick start

```bash
export GITHUB_PAT="<your_token>"
export GITHUB_OWNER="qnbs"
export GITHUB_REPO="CannaGuide-2025"
node ./scripts/github/harden-repo-settings.mjs
```

## Optional env vars

- `GITHUB_MAIN_BRANCH` (default: `main`)
- `ENV_REVIEWERS` comma-separated GitHub logins for environment approvals
- `REQUIRED_STATUS_CHECKS` comma-separated status check names
- `DRY_RUN=true` for preview mode

## Example dry run

```bash
DRY_RUN=true node ./scripts/github/harden-repo-settings.mjs
```

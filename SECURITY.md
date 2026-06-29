# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.8.x   | :white_check_mark: |
| 1.7.x   | :white_check_mark: |
| < 1.7   | :x:                |

## Cloud sync encryption (GitHub Gist)

Optional **end-to-end encryption** for the CRDT sync blob stored in a private/unlisted GitHub Gist:

- **With encryption key set** (Settings → Data → Cloud sync → E2EE): the gist file content is encrypted with **AES-256-GCM** via [`apps/web/services/syncEncryptionService.ts`](apps/web/services/syncEncryptionService.ts) before upload; pulls decrypt using the same user-managed key.
- **Without a key:** the sync payload is still wrapped as structured CRDT JSON (`crdt-v1`), but the gist file is **not** E2EE — rely on GitHub account security and gist secrecy (unlisted + URL obscurity). Users handling sensitive grow data should generate or supply a key.

Automated tests for encrypt/decrypt roundtrips and plaintext detection live in `apps/web/services/syncEncryptionService.test.ts`; transport behaviour is covered in `apps/web/services/syncService.test.ts` (push/pull with and without keys).

## Reporting a Vulnerability

If you believe you have found a security vulnerability, **do not open a public issue**.

Please report it privately by following one of these paths:

1. **GitHub Security Advisories (preferred):** Use [GitHub's private vulnerability reporting](https://github.com/qnbs/CannaGuide-2025/security/advisories/new) to create a private advisory.
2. **Email:** Contact the repository maintainers through the channels listed in the project profile.

### What to Include

- A short description of the issue.
- The affected file, workflow, dependency, or feature.
- Steps to reproduce.
- Any proof-of-concept or log output that is safe to share.

### Disclosure Timeline

- **Acknowledgement:** We will acknowledge receipt within **48 hours**.
- **Assessment:** We aim to confirm the vulnerability within **5 business days**.
- **Remediation:** A fix will be developed and released as soon as possible, typically within **30 days** for critical issues.
- **Disclosure:** We coordinate public disclosure only after a fix is available.

We will review reports as quickly as possible and coordinate remediation before public disclosure.

## CI operations

Merge policy, gate inventory, deploy E2E/Lighthouse notes, and remaining risks are documented in [`.github/CI-AUDIT.md`](.github/CI-AUDIT.md). Required check on `main`: **CI Status** (quality + security). Cloudflare Workers build status from the dashboard integration is informational only and does not block merges.

### Code scanning configuration

If the Security tab shows **Code scanning configuration error** for CodeQL or Snyk Open Source, switch the repository from **CodeQL default setup** to **advanced** and use [`.github/workflows/codeql.yml`](.github/workflows/codeql.yml). See [docs/code-scanning-setup.md](docs/code-scanning-setup.md).

## Supply-Chain Security

### SHA-Pinning Mandate

All third-party GitHub Actions **must** be pinned to a full 40-character commit SHA. Mutable tags (`@v4`, `@latest`, `@main`) are **never** permitted in any workflow.

```yaml
# ✅ CORRECT — pinned to immutable commit SHA
uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd

# ❌ FORBIDDEN — mutable tag can be force-pushed by attacker
uses: actions/checkout@v4
```

### Docker Image Pinning

All `FROM` directives in Dockerfiles **must** include an `@sha256:` digest alongside the human-readable tag.

```dockerfile
# ✅ CORRECT
FROM node:24-alpine@sha256:b88333c42c23fbd91596ebd7fd10de239cedab9617...

# ❌ FORBIDDEN
FROM node:24-alpine
```

### Rationale

These policies were adopted on 2026-03-24 in response to the [Trivy supply-chain attack](https://github.com/advisories/GHSA-69fq-xp46-6x23) (March 2026), where mutable tags in `aquasecurity/trivy-action` and `aquasecurity/setup-trivy` were force-pushed to malicious commits, exfiltrating GitHub Secrets from CI runners. SHA-pinning ensures immutability: even if a tag is compromised, the workflow always runs the exact audited code.

### Removed Tools

- **Trivy** (`aquasecurity/trivy-action`): Removed from all workflows on 2026-03-24 due to the supply-chain attack ([GHSA-69fq-xp46-6x23](https://github.com/advisories/GHSA-69fq-xp46-6x23)). This was the second compromise of the Aqua Security service account within one month, rendering the entire Trivy ecosystem unreliable. Replaced by **Grype** (`anchore/scan-action`) for container image and filesystem scanning in `docker.yml` and `security-full.yml`. Remaining filesystem coverage is provided by CodeQL, Snyk, Semgrep, Gitleaks, and `pnpm audit`.

### GitHub Build Attestation

Every tagged release generates **GitHub build provenance attestation**
via `actions/attest-build-provenance` and **SBOM attestation** via
`actions/attest-sbom`. These attestations are stored in the GitHub
Attestations database and verifiable via the `gh` CLI.

> **Note:** `slsa-framework/slsa-github-generator` (SLSA L3) was
> removed in April 2026 due to Go build failures on ubuntu-24.04
> runners. GitHub-native attestations provide equivalent build
> provenance verification.

- **Verification:** Use `gh attestation verify` to validate:

```bash
# Verify build provenance
gh attestation verify cannaguide-v*.tar.gz --repo qnbs/CannaGuide-2025

# Verify SBOM attestation
gh attestation verify cannaguide-v*.tar.gz \
  --repo qnbs/CannaGuide-2025 \
  --predicate-type https://cyclonedx.org/bom
```

### CycloneDX SBOM

Every release includes a **CycloneDX JSON** Software Bill of Materials
generated by [Syft](https://github.com/anchore/syft) via `anchore/sbom-action`.
The SBOM is signed with `actions/attest-sbom` and attached as a release asset
(`cannaguide-sbom.cyclonedx.json`).

The SBOM covers:

- All pnpm workspace packages and their dependencies
- The full monorepo dependency tree from `pnpm-lock.yaml`
- NTIA minimum elements compliant

### Transitive dependency remediation (pnpm overrides)

When Dependabot flags a **transitive** npm package and maintainers of direct dependencies have not yet adopted a patched release, this repository forces a **minimum safe version** using root **`pnpm.overrides`** (see `package.json`). Each intentional override is recorded here for auditors and agents.

| Package      | Minimum version | Advisory                                                                                                                                                      | Typical chain                                                                                               | Notes                                                                                                                                          |
| ------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `ip-address` | 10.1.1          | [GHSA-v2v4-37r5-5v8g](https://github.com/advisories/GHSA-v2v4-37r5-5v8g) (CVE-2026-42338, medium, XSS)                                                        | `socks` → `socks-proxy-agent` → `pac-proxy-agent` → `proxy-agent` → `@lhci/cli` / Puppeteer (Lighthouse CI) | Advisory affects HTML-emitting `Address6` helpers; resolution only affects **dev** tooling (e.g. Lighthouse). Lockfile resolves to **10.2.0**. |
| `undici`     | 7.28.0 (&lt;8)  | [GHSA-p88m-4jfj-68fv](https://github.com/advisories/GHSA-p88m-4jfj-68fv), [GHSA-pr7r-676h-xcf6](https://github.com/advisories/GHSA-pr7r-676h-xcf6) (moderate) | `jsdom` → `undici` (Vitest/jsdom test environment)                                                          | Capped at **&lt;8.0.0** — undici 8.x breaks jsdom 29 `require()` integration. Lockfile resolves to **7.28.0**.                                 |

After merging an override, confirm in GitHub **Security → Dependabot** that the related alert moves to **resolved** (or dismiss with justification if a false positive).

```bash
# Inspect SBOM component count and root component
jq '.metadata.component.name, (.components | length)' cannaguide-sbom.cyclonedx.json

# Verify SBOM attestation
gh attestation verify cannaguide-v*.tar.gz \
  --repo qnbs/CannaGuide-2025 \
  --predicate-type https://cyclonedx.org/bom
```

### Audit Verification Status (2026-04-10)

Independent audit verified on 2026-04-10 (Session 121):

- **SLSA L3 Provenance:** Replaced by GitHub-native build attestation
  via `actions/attest-build-provenance@v4.1.0` (2-job architecture:
  `build` -> `release`) in `release-publish.yml`. SLSA L3 via
  `slsa-github-generator` removed April 2026 (Go build failures
  on ubuntu-24.04 runners).
- **CycloneDX SBOM:** Generated via `anchore/sbom-action@v0.18.0`,
  signed via `actions/attest-sbom@v4.1.0`, uploaded as release asset
- **SHA-Pinning:** All 10 GitHub Actions pinned to 40-char commit SHAs
- **Build Provenance:** Generated on GitHub-hosted runner via
  `actions/attest-build-provenance` reusable action
- **Backward Compat:** `gh attestation verify` provides full
  attestation verification for both build provenance and SBOM

### Actions Allowlist

GitHub Actions are restricted to a curated allowlist (`allowed_actions: selected`):

- GitHub-owned actions (e.g., `actions/*`, `github/*`, `docker/*`)
- Verified marketplace creators
- Explicitly approved third-party: `anchore/*`, `gitleaks/*`, `ossf/*`, `snyk/*`, `Swatinem/*`, `dtolnay/*`, `google/clusterfuzzlite/*`, `peter-evans/*`, `slsa-framework/*`

Adding a new third-party action requires updating the allowlist via repository Settings > Actions > General.

### AI Input Sanitization (2026-06-29)

All user-controlled strings reaching LLM prompts must pass through
[`apps/web/services/ai/safetyPipeline.ts`](apps/web/services/ai/safetyPipeline.ts)
(`sanitizeForPrompt`). As of the 2026-06-29 audit, secondary paths were hardened:

- Stream mentor (`aiService.buildMentorStreamPrompt`)
- Deep-dive guides (`aiService` / `geminiService.generateDeepDive`)
- Strain AI lookup (`externalStrainLookups.lookupWithAI`)
- Local AI handlers (`local-ai/inference/promptHandlers`)

See [`docs/audits/AUDIT-REPORT-2026-06-29.md`](docs/audits/AUDIT-REPORT-2026-06-29.md) finding **S-08**.

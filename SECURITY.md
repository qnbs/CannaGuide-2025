# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.11.x  | :white_check_mark: |
| 1.10.x  | :white_check_mark: |
| < 1.10  | :x:                |

## Cloud sync encryption (GitHub Gist)

> **Currently disabled in the UI** (`CLOUD_SYNC_DISABLED` in `apps/web/constants.ts`): push/pull
> never sent an `Authorization` header, and the production CSP does not allow `api.github.com`, so
> every sync attempt would fail immediately. The optional-E2EE design documented below is the
> **pre-remediation baseline**, not the target: `docs/AUDIT_REMEDIATION_PLAN.md` requires E2EE to
> become mandatory, not opt-in, as a condition of re-enabling this feature -- the payload is a full
> app-state backup sitting in a Gist that is unlisted but not access-controlled.

Optional **end-to-end encryption** for the CRDT sync blob stored in a private/unlisted GitHub Gist
(pre-remediation design, see the note above):

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

Merge policy, gate inventory, deploy E2E/Lighthouse notes, and remaining risks are documented in [`.github/CI-AUDIT.md`](.github/CI-AUDIT.md). Required check on `main`: **✅ CI Status** (build, unit tests and coverage, lint/types, security, and blocking Chromium E2E). Cloudflare Workers build status from the dashboard integration is informational only and does not block merges.

### Code scanning configuration

If the Security tab shows **Code scanning configuration error** for CodeQL or Snyk Open Source, the repo workflows are aligned with **CodeQL default setup** (see [docs/code-scanning-setup.md](docs/code-scanning-setup.md)). Per-repo **Switch to advanced** is often unavailable when the **organization** manages CodeQL via a security configuration — that is expected.

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
> runners. Verify the replacement GitHub-native attestations and their predicates;
> their presence alone does not establish a SLSA level.

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

When Dependabot flags a **transitive** npm package and maintainers of direct dependencies have not yet adopted a patched release, this repository forces a **minimum safe version** using root **`pnpm.overrides`** in `pnpm-workspace.yaml` (pnpm 11 ignores `package.json`'s `pnpm` field). Each intentional override is recorded here for auditors and agents.

| Package                      | Minimum version   | Advisory                                                                                                                                                                                                           | Typical chain                                                                                                             | Notes                                                                                                                                                                                                             |
| ---------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ip-address`                 | 10.7.4 (&lt;11)   | [GHSA-rxp7-6hxx-x8q5](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5) and the earlier 10.x advisory set                                                                                                         | `socks`, including MQTT and Lighthouse/Puppeteer proxy paths                                                              | Lockfile resolves to **10.7.4**. Dependency reachability includes runtime paths; presence in a browser bundle and exploitability are separate questions.                                                          |
| `undici`                     | 7.30.1 (&lt;8)    | [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c) (high) and concurrent moderate advisories                                                                                                 | jsdom test environment; Wrangler → Miniflare                                                                              | Resolves to **7.30.1**. Keeps consumers on their existing 7.x API.                                                                                                                                                |
| `linkify-it`                 | 5.0.2 (&lt;6)     | [GHSA-22p9-wv53-3rq4](https://github.com/advisories/GHSA-22p9-wv53-3rq4) (high, ReDoS)                                                                                                                             | `typedoc` → `markdown-it` → `linkify-it`                                                                                  | Lockfile resolves to **5.0.2**. The bound retains Markdown-it 14's required 5.x default export; 6.0.0 broke TypeDoc module initialization.                                                                        |
| `markdown-it`                | 14.3.3 (&lt;15)   | [GHSA-r7fv-28h4-cvq7](https://github.com/advisories/GHSA-r7fv-28h4-cvq7), [GHSA-gfr2-rv44-r23c](https://github.com/advisories/GHSA-gfr2-rv44-r23c) (high)                                                          | `typedoc` → `markdown-it`                                                                                                 | Dev-only TypeDoc. Bounded to the consumer's 14.x API; resolves to **14.3.3**.                                                                                                                                     |
| `dompurify`                  | 3.4.17 (&lt;4)    | [GHSA-cg2g-xh64-v4q7](https://github.com/advisories/GHSA-cg2g-xh64-v4q7) (critical), [GHSA-mrv2-3pqr-j5jr](https://github.com/advisories/GHSA-mrv2-3pqr-j5jr) (high)                                               | Direct HTML rendering and jsPDF's optional HTML conversion                                                                | Resolves to **3.4.17** throughout. The advisories require non-default template/shadow-root or IN_PLACE/hook configurations absent from inspected app callers; package findings alone do not prove an app exploit. |
| `zod@4`                      | 4.6.7 (&lt;5)     | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) (high)                                                                                                                                    | Web/ai-core validation, React Hooks lint tooling and Stryker protocol                                                     | All 4.x copies resolve to **4.6.7**. Zod 3 consumers are a separate migration; do not force their declared major without compatibility proof.                                                                     |
| `qs`                         | 6.16.1 (&lt;7)    | [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx), [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) (moderate)                                                      | Query-string consumers                                                                                                    | Resolves to **6.16.1**; retired from the unbounded-floor allowlist.                                                                                                                                               |
| `fflate`                     | 0.8.3 (&lt;0.9)   | [GHSA-px8p-9vwx-vf98](https://github.com/advisories/GHSA-px8p-9vwx-vf98) (moderate)                                                                                                                                | jsPDF and other ZIP consumers                                                                                             | Replaces jsPDF's exact **0.8.2** resolution with **0.8.3**, matching the already-present patched copy.                                                                                                            |
| `postcss-selector-parser@6`  | 6.1.5 (&lt;7)     | [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) (moderate, quadratic flat-selector parsing)                                                                                               | `apps/web` → `@tailwindcss/typography` 0.5.x                                                                              | Build-time CSS only; selectors come from trusted sources. Resolves to the upstream 6.x backport **6.1.5**; stays off the 7.x API. Tailwind CSS output is byte-identical to 6.0.10.                                |
| `js-yaml`                    | 3.15.2 / 4.3.2    | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) (high, merge-key CPU)                                                                                                                     | `@lhci/cli` → `@lhci/utils` (v3); `eslint` → `@eslint/eslintrc` (v4)                                                      | Scoped overrides `js-yaml@3` and `js-yaml@4`. Do not open the floor onto 5.x. Lockfile resolves to **3.15.2** / **4.3.2**.                                                                                        |
| `fast-uri`                   | 4.2.3 (&lt;5)     | [GHSA-w74x-v6f9-j3xg](https://github.com/advisories/GHSA-w74x-v6f9-j3xg), [GHSA-wjr9-j795-jxcr](https://github.com/advisories/GHSA-wjr9-j795-jxcr) and related low advisories                                      | AJV / JSON schema consumers                                                                                               | Resolves to **4.2.3**, retaining the installed 4.x API.                                                                                                                                                           |
| `sharp`                      | 0.35.4 (&lt;1)    | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) (high, libheif)                                                                                                                           | `@xenova/transformers` (optional, Node) and `wrangler` → `miniflare`                                                      | Not bundled into the browser PWA. Lockfile resolves to **0.35.5**.                                                                                                                                                |
| `@tauri-apps/plugin-updater` | 2.13.1            | [SNYK-JS-TAURIAPPSPLUGINUPDATER-20081664](https://security.snyk.io/vuln/SNYK-JS-TAURIAPPSPLUGINUPDATER-20081664) (high, signature/version validation)                                                              | `apps/desktop` direct dependency; Rust crate `tauri-plugin-updater` pinned to the same line                               | Paired JS + Rust bump. Desktop release lane must not ship below 2.12.0.                                                                                                                                           |
| `handlebars`                 | 4.7.10 (&lt;5)    | [GHSA-8r5x-fm3f-whwj](https://github.com/advisories/GHSA-8r5x-fm3f-whwj), [GHSA-p8wg-vrv2-v86f](https://github.com/advisories/GHSA-p8wg-vrv2-v86f) (critical; AST injection in `compile`, prototype-method bypass) | `conventional-changelog-cli` → `conventional-changelog` → `conventional-changelog-core` → `conventional-changelog-writer` | Dev-only changelog tooling. Floor stays on 4.x. Lockfile resolves to **4.7.10**.                                                                                                                                  |
| `body-parser@1`              | 1.20.9 (&lt;2)    | [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828) (high, compressed-request DoS)                                                                                                            | LHCI → Express 4                                                                                                          | Resolves to **1.20.9**; no app backend is introduced.                                                                                                                                                             |
| `@humanfs/node`              | 0.16.8 (&lt;0.17) | [GHSA-p498-v437-472g](https://github.com/advisories/GHSA-p498-v437-472g) (moderate)                                                                                                                                | ESLint                                                                                                                    | Resolves to **0.16.8** only; root ESLint/@eslint/js align at 9.39.5 as an interim patch. The supported-major migration remains open.                                                                              |
| `serialize-javascript`       | 7.1.3 (&lt;8)     | [GHSA-m5mm-p8h7-m29v](https://github.com/advisories/GHSA-m5mm-p8h7-m29v) (low)                                                                                                                                     | Rollup terser plugin                                                                                                      | Resolves to **7.1.3**; the newer 7.1.4 release remains subject to the unchanged 24-hour quarantine.                                                                                                               |

On **2026-10-24**, the prepared correction lockfile passed production audits at both high
and low thresholds with zero reported advisories. The complete audit still failed on
Zod 3 (high) and postcss-selector-parser 6 (moderate). Zod 3 occurs in Socket patch tooling
and Chromium BiDi, whose shipped mapper also bundles Zod code. An external dependency
override alone cannot replace those bytes. The existing extract-zip/braces exceptions
remain unchanged and expire on **2026-11-15**. See [the current checkpoint](docs/toolchain-update.md#current-head-ci-and-follow-up-evidence--2026-10-24)
for the boundary between local proof, CI qualification and deployment.

On **2026-10-26**, the postcss-selector-parser 6 finding was remediated with the
`postcss-selector-parser@6` override above, once upstream published the 6.1.5 backport.
`scripts/security/postcss-selector-parser.test.mjs` pins the resolved version through
the real Typography consumer and checks flat-selector parse time against a same-size
benign control. Zod 3 remains open.

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

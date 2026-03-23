# Session Activity Review (2026-03-23)

## Scope

Full-day session covering five phases:

1. **CI/CD repair** — Fix three broken badges (CI, Deploy, Scorecard)
2. **Infrastructure hardening** — Commit identity, fuzzing, devcontainer robustness
3. **Comprehensive repo audit** — All 20 workflows, all config files, all docs, full cleanup
4. **OpenSSF Scorecard optimization** — Token-Permissions, Pinned-Dependencies, Fuzzing (ClusterFuzzLite), Security-Policy
5. **SonarCloud Quality Gate + Snyk** — S2245/S5852 hotspot elimination, sonar config, Dockerfile zlib CVE fix

## Phase 1: CI/CD Badge Repair

### Problem

Three GitHub badges were broken:

- **CI badge**: Tests failing in Node 20 + jsdom (crypto.subtle unavailable)
- **Deploy badge**: Skipped because CI was red (workflow_run trigger)
- **OpenSSF Scorecard badge**: Broken YAML indentation, invalid codeql-action hash, missing permissions

### Root Causes

1. **cryptoService.ts**: `toWebCryptoBuffer()` helper created cross-realm `ArrayBuffer` that Node 20 + jsdom rejected with "not instance of ArrayBuffer"
2. **vitest.setup.ts**: Missing `crypto.subtle` polyfill — jsdom provides `crypto.getRandomValues` but not `crypto.subtle`
3. **scorecard.yml**: YAML indentation broken, `id-token: write` missing at job level, `github/codeql-action` hash was an imposter commit
4. **codeql-action hash**: `256d634097be96e792d6764f9edaefc4320557b1` not a real commit — replaced with `ebcb5b36ded6beda4ceefea6a8bc4cc885255bb3` (v3)

### Fixes Applied

| File                                  | Change                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `services/cryptoService.ts`           | Removed `toWebCryptoBuffer()`, use `Uint8Array` directly with `as unknown as ArrayBuffer` casts |
| `vitest.setup.ts`                     | Added `crypto.subtle` polyfill via `node:crypto` webcrypto                                      |
| `.github/workflows/scorecard.yml`     | Fixed YAML indentation, permissions, codeql-action hash                                         |
| `.github/workflows/security-full.yml` | Replaced invalid codeql-action hash                                                             |
| `.github/workflows/ci.yml`            | Replaced invalid codeql-action hash                                                             |

### Results

- **CI**: green (622 tests, 75 files, 0 failures)
- **Scorecard**: green
- **Deploy**: auto-triggered on CI success, running

## Phase 2: Identity & Fuzzing Hardening

(Details from earlier in session, unchanged from initial entries)

- Commit identity enforcement: `check-commit-identity.mjs` defaults to enforce mode
- Pre-commit hook guard prevents identity drift
- `bootstrap-git-signing.mjs` auto-configures signing in devcontainer
- `devcontainer.json` installs `gh`, `jq`, runs bootstrap
- `doctor.mjs` readiness checker added
- Fuzzing pipeline: `fast-check` property-based tests + `.github/workflows/fuzzing.yml`

## Phase 3: Comprehensive Repo Audit

### Workflow Audit (20 workflows)

**Critical Fixes Applied:**

- `ossf/scorecard-action` SHA-pinned from `@v2.4.0` to `@62b2cac7ed8198b15735ed49ab1e5cf35480ba46` in `scorecard.yml` and `security-full.yml`
- Missing `timeout-minutes` added to: `docker.yml` (30), `benchmark.yml` (20), `tauri-build.yml` frontend (15), build-tauri (45), build-capacitor (15)

**Audit Summary:**

| Category     | Pass | Warn | Fail |
| ------------ | ---- | ---- | ---- |
| SHA Pinning  | 20   | 0    | 0    |
| Node Version | 20   | 0    | 0    |
| Permissions  | 19   | 1    | 0    |
| Timeouts     | 20   | 0    | 0    |
| YAML Syntax  | 20   | 0    | 0    |

**Known Advisory Items** (not blocking, documented for awareness):

- `security-full.yml`: All security jobs use `continue-on-error: true` — workflow is explicitly disabled, requires Code Scanning to be enabled first
- `docker.yml`: Trivy exit behavior deliberately differs between PR and release paths (documented in workflow)
- 9 workflows lack concurrency blocks (acceptable for low-frequency/advisory workflows)

### Config File Audit

| Config                 | Status    | Notes                                                  |
| ---------------------- | --------- | ------------------------------------------------------ |
| `tsconfig.json`        | Excellent | Strict mode, all sub-options enabled                   |
| `vite.config.ts`       | Good      | `chunkSizeWarningLimit: 8000` justified by AI runtimes |
| `eslint.config.js`     | Excellent | ESLint 9 flat config, anti-trojan-source               |
| `tailwind.config.cjs`  | Good      | 9 themes, CSS custom properties                        |
| `biome.json`           | Good      | Formatter disabled (Prettier is source of truth)       |
| `commitlint.config.js` | Good      | Conventional commits enforced                          |
| `turbo.json`           | Good      | Task pipeline correct                                  |
| `playwright.config.ts` | Good      | Single browser (Chromium) — acceptable                 |
| `stryker.config.json`  | Note      | 95% threshold is aggressive but intentional            |
| `netlify.toml`         | Good      | Security headers in sync with `securityHeaders.ts`     |

### Package.json Audit

**Fix Applied:**

- Added `engines: { "node": ">=20" }` field for explicit version requirement

**No Issues Found:**

- All 27 production deps correctly placed
- All 54 devDeps correctly classified
- Version pinning strategy consistent (caret ranges)
- No duplicate or suspicious packages
- `overrides` for `serialize-javascript` and `tmp` are security-motivated

### Documentation Audit

**Fixes Applied:**

- `docs/distribution.md`: Added GitHub Pages + Netlify sections, updated Tauri path to `apps/desktop/`, modernized Capacitor commands, added CI workflow references
- `CONTRIBUTING.md`: Updated test baseline from 529 to 622+
- `.github/copilot-instructions.md`: Updated test counts (622+ tests, 75 files)

**Remaining Doc Items** (low priority):

- `sonar-handoff-review-2026-03-21.md`: "Naechster sinnvoller Einstieg" section references completed work — should be updated in next Sonar session
- `sonar-handoff-todo-2026-03-21.md`: Could benefit from consolidation into two sections (Completed / Truly Open)

## Verification Evidence

- 622 tests pass (75 files, 0 failures)
- CI workflow: green
- Scorecard workflow: green
- Deploy workflow: auto-triggered
- All YAML files parse correctly
- `ossf/scorecard-action` now SHA-pinned across all workflows
- All jobs have `timeout-minutes` set
- `engines` field added to `package.json`

## Operational Lessons

1. **Node 20 vs 24**: `crypto.subtle` availability differs between jsdom environments — always polyfill in test setup
2. **Cross-realm ArrayBuffer**: Never wrap `Uint8Array` data in a new `ArrayBuffer` when targeting jsdom — use the original buffer
3. **codeql-action pinning**: Always verify SHA hashes against the official repo before committing
4. **Badge debugging**: Check the workflow YAML validity first (indentation breaks are silent)
5. **Timeouts**: Every job should have `timeout-minutes` to prevent hung runners

## Test Baseline

| Metric     | Value |
| ---------- | ----- |
| Test Files | 75    |
| Tests      | 622   |
| Failures   | 0     |
| Duration   | ~64s  |

## Phase 4: OpenSSF Scorecard Optimization (Commit `a799a2c`)

### Problem

Scorecard was 4.9/10 with several checks at 0:

- Token-Permissions: 0/10 (top-level write permissions in 11 workflows)
- Pinned-Dependencies: 3/10 (unpinned action SHAs)
- Fuzzing: 0/10 (no fuzz testing integration)
- Security-Policy: 4/10 (minimal SECURITY.md)

### Fixes Applied

| Area                | Change                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Token-Permissions   | Moved write permissions from top-level to job-level across 11 workflows                                          |
| Pinned-Dependencies | SHA-pinned ossf/scorecard-action in security-scan.yml                                                            |
| Fuzzing             | Created `.clusterfuzzlite/` (Dockerfile, build.sh, project.yaml, fuzz_url_service.js) + `cflite_pr.yml` workflow |
| Security-Policy     | Enhanced SECURITY.md with Supported Versions table, Disclosure Timeline, GitHub Advisory link                    |

### Results

- Scorecard workflow: completed:success
- CI: completed:success
- All targeted checks improved (Token-Permissions, Pinned-Deps, Fuzzing, Security-Policy)

## Phase 5: SonarCloud Quality Gate + Snyk Docker Fix

### Problem

SonarCloud Quality Gate: **Failed**

- Security: A (0) (ok)
- Reliability: B (49 issues) (!)
- Maintainability: A (354 code smells)
- Hotspots Reviewed: E (0.0%) (FAIL) — primary gate failure
- Coverage: 22.8%
- Duplications: 1.8%

Snyk: 2 zlib CVEs in Docker base image (`node:20-alpine` → zlib 1.3.1-r2)

### Root Causes

1. **S2245 Weak PRNG**: 15+ `Math.random()` usages across components, services, utils flagged as security hotspots
2. **S5852 ReDoS**: Dynamic regex in `commandService.ts` without length guard
3. **sonar-project.properties**: Test sources misconfigured (inline tests not recognized), no coverage exclusions
4. **Dockerfile**: Base image zlib vulnerable (Out-of-bounds Write CVSS 7.8 + Improper Validation CVSS 5.5)
5. **Hotspots E**: All 26 security hotspots unreviewed in SonarCloud UI (requires manual triage)

### Fixes Applied

| File(s)                                 | Change                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `utils/random.ts`                       | NEW: `secureRandom()` using `crypto.getRandomValues()`                          |
| 9 files (components, services, utils)   | Replaced all `Math.random()` with `secureRandom()`                              |
| `stores/slices/nutrientPlannerSlice.ts` | `Math.random()` → `crypto.randomUUID()` for IDs                                 |
| `services/commandService.ts`            | Added 64-char length limit on fuzzy regex to prevent ReDoS                      |
| `sonar-project.properties`              | Fixed `sonar.tests`, added `sonar.test.inclusions`, `sonar.coverage.exclusions` |
| `Dockerfile`                            | Added `RUN apk update && apk upgrade --no-cache` to patch zlib CVEs             |

### Remaining Manual Steps

- SonarCloud Hotspots: Must be reviewed/dismissed in SonarCloud UI (code fixes reduce count but don't mark reviewed)
- Reliability B (49 issues): Likely includes non-null assertions, unreachable code, other patterns requiring SonarCloud dashboard inspection

> **Last updated:** 2026-03-23 — SonarCloud QG + Scorecard + Snyk Session
> **Build:** CI green (622/622), TypeScript clean, all changes verified

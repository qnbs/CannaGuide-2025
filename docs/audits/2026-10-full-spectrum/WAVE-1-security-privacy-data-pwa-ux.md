# Wave 1 -- Security, Privacy, Data, PWA, Testing, Governance, First-Run UX

**Date:** 2026-10-07
**Audited head:** `3d8b706d3593f087f5b483993aff74483260c66c` (0 open PRs at the time; release lane active)
**Method:** see [`README.md`](./README.md). Source reads on an extracted snapshot; browser evidence from
the public Vercel production origin with a fresh profile; GET-only reads of GitHub metadata.

## 1. Authority and policy ingestion

- `main` head and open PRs were re-fetched before any read. Release preparation was owned by a
  separate mutation lane; this lane stayed read-only.
- Policies read and applied: `CLAUDE.md` (binding verify commands, CanG plant cap 3, trap list),
  `AGENTS.md`, `docs/release-process.md`, `docs/GITHUB-SETTINGS-GUIDE.md`,
  `docs/AUDIT_REMEDIATION_PLAN.md`, `docs/DEVOPS-GATES.md`, workflow files.
- The repository's own remediation plan lists unresolved P1 items (contrast, label accessibility,
  privacy text accuracy, gist-sync) that "still prevent a confident release-ready claim". These
  were re-measured below; none had been applied on the audited head.

## 2. Verified positives (do not re-audit unless the code changes)

- All 29 workflows pin every action by commit SHA (0 unpinned). Three cleanup / stale / branch
  workflows run with `permissions: {}`. Exactly one `pull_request_target` workflow exists (the
  labeler).
- No `innerHTML =`, `outerHTML =`, `insertAdjacentHTML`, `document.write`, `new Function` in app
  source, no `window.open`, no `postMessage(..., '*')`. All 6 `dangerouslySetInnerHTML` sites sanitize
  with DOMPurify. Every `target="_blank"` link carries `rel="noopener"`.
- Production security headers equal the repository contract on Vercel and Cloudflare Pages
  (CSP including `frame-ancestors 'none'`, HSTS, nosniff, Referrer-Policy, Permissions-Policy,
  X-Frame-Options, COOP, COEP). SharedArrayBuffer works on those two hosts.
- First load of the production app contacts no third-party host (all requests same-origin).
- axe-core (WCAG 2.0/2.1 A + AA) reported 0 violations on the age gate, language picker and every
  onboarding screen on desktop and mobile.
- Hygiene counters on non-test source: `TODO/FIXME/HACK` 0, `@ts-ignore` 0, `: any` 1,
  `biome-ignore` 0. Tauri: unsafe `export_data` / `import_data` commands were removed earlier; the
  updater has a public key.
- `check:doc-metrics`, `check:file-budget` and the override-floor gate pass on the audited head.

## 3. Coverage ledger (end of wave 1)

B = breadth complete, D = deep dive done.

| Domain                      | B       | D       | Open evidence gaps after wave 1                                           |
| --------------------------- | ------- | ------- | ------------------------------------------------------------------------- |
| Architecture / topology     | yes     | partial | import graph and cycles not machine-checked                               |
| Product / first-run UX      | yes     | partial | main app shell not walked (closed in wave 3)                              |
| Accessibility               | yes     | partial | shell, keyboard, Settings (closed in wave 3); screen reader not evidenced |
| i18n                        | partial | no      | locale parity gate truth (closed in wave 2)                               |
| Data / persistence          | yes     | yes     | migrations, hostile import / restore not yet exercised                    |
| PWA / offline               | yes     | partial | deployed update lifecycle across two versions                             |
| AI / local AI               | partial | no      | download and consent lifecycle (closed in wave 3 by source reading)       |
| Frontend engineering        | partial | partial | hook / race review, render churn                                          |
| Desktop / Tauri             | yes     | partial | Rust sources (closed in wave 2)                                           |
| Security                    | yes     | yes     | advisory scan (closed in wave 2)                                          |
| Privacy                     | yes     | yes     | Sentry behaviour (closed in wave 3)                                       |
| Performance                 | partial | no      | bundle budgets, Lighthouse (partly closed in wave 3)                      |
| Testing                     | yes     | partial | mutation run, flaky-test census                                           |
| CI / CD                     | yes     | partial | per-workflow deep read of all 29                                          |
| Release                     | yes     | yes     | post-release verification (closed in wave 2)                              |
| Dependencies / supply chain | partial | partial | advisories (closed in wave 2)                                             |
| Docs truth                  | yes     | yes     | in-app help content                                                       |
| Vercel / Cloudflare control | yes     | yes     | Cloudflare configuration unreadable without a credential                  |
| GitHub governance           | yes     | yes     | environments and secret settings are admin-only                           |
| Observability               | partial | no      | closed in wave 3                                                          |

## 4. Findings

### PRIV-001 -- Privacy claims, onboarding copy and erase-all do not match runtime (S2, CONFIRMED)

Tracker: QNB-273; fix in progress in PR #550.

| ID  | Finding                                         | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | In-app privacy statement is inaccurate          | `apps/web/locales/{en,de}/legal.ts` states that the only external connections are Google Fonts and the AI provider APIs. The production app loads no Google Fonts (`font-src 'self'`); on the other hand it can contact Hugging Face model hosts, `cdn.jsdelivr.net` (ONNX Runtime WASM), ElevenLabs (cloud TTS), the four AI providers and, for opt-in features, GitHub.                                                             |
| F2  | "Erase all data" leaves user data on the device | `privacyService.eraseAllData()` deleted a static list of 7 IndexedDB names. The app also creates `cannaguide-crdt-v1` (Yjs persistence holding plants, journal entries, schedules, settings) and the RAG embedding cache. The CRDT database exists for every user after the first-run flow (browser-verified) although cloud sync is disabled. `deleteDatabase` resolved on `onblocked`, so a blocked delete was reported as success. |
| F3  | Onboarding promises sync that does not exist    | The "Offline Sync" step says data syncs seamlessly across devices; `CLOUD_SYNC_DISABLED = true` and the production CSP blocks the GitHub API.                                                                                                                                                                                                                                                                                         |
| F4  | Outdated legal reference                        | `legal.ts` cites "section 5 TMG"; the TMG was replaced by the DDG. Whether an imprint is required is `LEGAL_REVIEW_REQUIRED` (not an engineering judgement).                                                                                                                                                                                                                                                                          |
| F5  | Undisclosed third-party proxies in code         | `strainApiService.ts` falls back to public CORS proxies, so user search terms would reach third parties. Inert in production today because the CSP blocks them. It must not be "fixed" by allow-listing.                                                                                                                                                                                                                              |

### CSP-001 -- Features call hosts the production CSP blocks (S2, CONFIRMED)

Tracker: QNB-274. Production `connect-src` allows `'self'`, the four AI providers, Hugging Face
(plus its CDN hosts), `cdn.jsdelivr.net` and ElevenLabs. Controlled in-page `fetch` probes to
`api.github.com`, `api.otreeba.com`, `cannlytics.com`, the Cansativa gateway, and two public CORS
proxies were all blocked by CSP (`securitypolicyviolation` events), while the AI-provider control reached its
server. Settings -> Data management exposes Community Share, which can only fail in production;
strain lookups and the Cansativa service behave the same. Unit tests mock `fetch`, so CI stays
green. `strainApiService` also reads API keys from `VITE_*` build variables, which would be shipped
publicly if ever set (pattern risk; not set today).

### SYNC-001 -- Cloud sync is a stopgap (S2, CONFIRMED)

Tracker: QNB-275. `CLOUD_SYNC_DISABLED` hides only the cloud-sync panel. The product decision
(personal-token gists vs. a backend vs. removal) is open; onboarding copy depends on it.

### PWA-001 -- Service worker activation model (S2, HIGH)

Tracker: QNB-237. `public/sw.js` calls `self.skipWaiting()` unconditionally in `install`;
`bootstrap/serviceWorker.ts` reloads the page on `controllerchange` while the UI also dispatches a
`swUpdate` event for an in-app update prompt. A new worker therefore takes control and the page
reloads without waiting for the user, which makes the prompt redundant or racy and can lose unsaved
UI state. Not observed across two real deployments yet. Choose one model (prompt then `SKIP_WAITING`
message, or silent update and remove the prompt) and add an invariant test.

### A11Y-001 / UX-001 -- static accessibility debt and first-run path (S2, CONFIRMED)

Static gates: `node scripts/check-contrast.mjs` reports 126 checks across 9 themes with 14 below WCAG
AA; `.a11y-baseline.json` ceiling is 83 `jsx-a11y` warnings (76 are `control-has-associated-label`);
strict gates are off. The runtime picture is refined in wave 3 (the defect is concentrated in
Settings and has one root cause).

First-run path: age gate -> language picker -> 8 wizard screens = **10 mandatory screens**.
Every dialog has `showCloseButton={false}` and a no-op `onClose`; there is no skip and no Escape
handling. Language is chosen twice. Labels such as "Espanol" / "Francais" and the gate headline
"Willkommen -- Bitte oben rechts die Sprache waehlen" are ASCII-transliterated user-visible text.
axe finds no violations on any first-run screen: the problem is length and escape hatches.

### CI-001 -- Credential scoping in CI / CD (S2, HIGH; details kept private)

Deploy, signing and release workflows rely on repository-level secrets without GitHub Environments
that require reviewers or restrict deployment refs, and some are dispatchable from any branch.
Documentation prescribes a broad personal-access-token for the release workflow. Hardening mode of
the egress firewall step is `audit` in most jobs. Remediation (draft D3): Environments with
reviewers and ref rules, narrower per-purpose tokens or a GitHub App, trusted `workflow_run` for PR
previews, `block` mode with allow-lists for sensitive jobs. Sequence after the release; do not alter
the release path mid-release.

### GOV-001 -- Governance drift (S3, CONFIRMED; details kept private)

The repository's own live governance check (`check-repository-governance.mjs --live`) is not green,
and `CLAUDE.md` states ruleset properties (thread resolution) that the live ruleset does not
enforce. These are owner-level settings; decision options are in draft D4.

### TYPE-001 -- Unvalidated JSON at trust boundaries (S2, CONFIRMED)

34 non-test sites in `apps/web/services` parse persisted or network JSON with `as T` (provider
responses, rate-limiter cost and budget state, key metadata, runtime config), and 355 of the
repository's `eslint-disable` comments suppress `no-unsafe-type-assertion`. A corrupted or tampered
budget record can silently defeat cost-cap logic. Zod is already used elsewhere. Draft D5.

### DESKTOP-001 -- Tauri filesystem scope (S2, HIGH)

`capabilities/fs.json` allows read and write of text files under `$DOCUMENT/**/*.json` and
`*.cannaguide`, and the webview CSP keeps `script-src 'unsafe-inline'`. Any script execution in the
webview could read or overwrite arbitrary JSON under Documents. Draft D6; wave 2 adds the Rust
review.

### TEST-001 -- Test and gate gaps (S3, CONFIRMED)

The critical-path coverage gate covers 4 files; global floors are low (43 / 41 / 25 / 35);
`indexedDBStorage.ts` and `db/connection.ts` have no test file; `aiProviderService`, `aiService`
and `mqttClientService` have no sibling tests. Candidate invariants (tracker QNB-256):

| #   | Invariant                                                           | Check                                                                                                           |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| I1  | Every IndexedDB database the app creates is erased                  | static registry scan plus a runtime test that creates all, erases, and asserts `indexedDB.databases()` is empty |
| I2  | Every host fetched by source is in `connect-src` or marked disabled | parse `securityHeaders.ts` and the host inventory                                                               |
| I3  | Critical-path coverage list is meaningful                           | add persistence adapter, db connection, provider services                                                       |
| I4  | No unvalidated persisted JSON                                       | ratchet on `JSON.parse(...) as T` count                                                                         |
| I5  | A waiting service worker does not take control without consent      | SW unit test with a fake `self`                                                                                 |
| I6  | Paths referenced from code comments and docs resolve                | link checker for `.cursor/rules/*` and `docs/*` references                                                      |

### DOC-001 -- Docs truth (S3, CONFIRMED)

`public/sw.js` refers to `.cursor/rules/204-pwa-cache-and-sw.mdc`, which does not exist (the
`.cursor` directory is absent from `main`). `CLAUDE.md` claims thread resolution is required by the
ruleset. `docs/AUDIT_REMEDIATION_PLAN.md` counts are older than the measured ones. Tracker: QNB-266.

## 5. Heat map (qualitative)

| Subsystem                      | Correctness | Data integrity | Security | Privacy | UX   | A11y | Test confidence |
| ------------------------------ | ----------- | -------------- | -------- | ------- | ---- | ---- | --------------- |
| Persistence (IndexedDB + CRDT) | Med         | High risk      | Low      | High    | Low  | --   | Med             |
| Privacy and legal copy         | --          | --             | --       | High    | Med  | --   | Low             |
| First run / onboarding         | Low         | Low            | Low      | Med     | High | Low  | Med             |
| Community Share / lookups      | High        | Low            | Med      | Med     | High | --   | High (mocked)   |
| Service worker / PWA update    | Med         | Med            | Low      | Low     | Med  | --   | Unknown         |
| CI credentials / release       | --          | --             | High     | --      | --   | --   | Low             |
| Tauri desktop                  | Low         | Med            | Med      | Low     | ?    | ?    | Low             |
| Theming / contrast             | --          | --             | --       | --      | Med  | High | Low             |
| AI facade / providers          | Low         | Med            | Low      | Low     | Low  | --   | Med             |

## 6. Sequencing

Nothing in this wave moved the release candidate. After the v1.10.0 release the order of attention
is: privacy slices (PR #550), CSP-gated features (QNB-274), then D3 / D6 (security design), D1 / D2
(accessibility and onboarding), D5, D4 (owner settings), and the sync decision (QNB-275).

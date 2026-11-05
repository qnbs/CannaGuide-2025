# Finding Ledger A -- Product, Privacy, PWA, UX, Performance, Local AI

Findings whose primary surface is the web application and its runtime behaviour.

Stable IDs have the form `CG-AUD-20261008-NNN`. Schema, status vocabulary, severity model and counters are in [`LEDGER.md`](./LEDGER.md). Do not renumber; later waves append.

### CG-AUD-20261008-017 -- In-app privacy statement lists connections that do not exist and omits processors that can be contacted

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Privacy disclosures | severity S2 | confidence CONFIRMED | status OWNED_BY_ACTIVE_PR
- **Affected surface:** apps/web/locales/{en,de,es,fr,nl}/legal.ts
- **Observed:** The statement says the only external connections are Google Fonts and AI provider APIs. The app loads no Google Fonts (`font-src` is self) and can contact Hugging Face model hosts, cdn.jsdelivr.net (ONNX Runtime WASM), ElevenLabs when cloud TTS is enabled, and the four AI providers.
- **Expected:** The statement lists every contacted host class and no non-existent one.
- **Evidence:** legal.ts line 41; browser run: first load and the post-onboarding session made only same-origin requests; hosts contacted on use from source (see 045).
- **Diagnosis:** Copy not updated after the font and local-AI changes.
- **Impact:** Misleading privacy claim. Production relevance: Live in v1.10.0. Release relevance: Decision input; the owner chose to fix after release.
- **Ownership:** GitHub: PR #550 | Linear: QNB-273 | active PR: #550 (open, Cursor) | workstream: WS-PRIVACY | Linear escalation required: NO
- **Required correction:** Correct the copy in five locales; mention jsDelivr and Hugging Face; do not claim active error reporting. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** No text names a non-existent connection or omits a contacted processor class. Verification: Copy test against connect-src; `check:i18n`.
- **Disposition / implementation:** Owned by the active privacy lane. Implementation status: IN_PROGRESS (PR #550).
- **Dependencies and gates:** dependencies: 046 (error-reporting wording). | user/provider gate: Legal review for conclusions | follow-up: Re-verify on the resulting main.
- **Live-main revalidation:** legal.ts line 41 unchanged on c49560d9 on 2026-10-08; PR #550 head 60376d36 rewrites it (0 unresolved threads at last read).

### CG-AUD-20261008-018 -- "Erase all data" leaves databases behind and can report success while a delete is blocked

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: IndexedDB / erase | severity S2 | confidence CONFIRMED | status OWNED_BY_ACTIVE_PR
- **Affected surface:** apps/web/services/privacyService.ts and the database owners
- **Observed:** Erase deleted a static list of 7 IndexedDB names. `cannaguide-crdt-v1` (plants, journal, schedules, settings), the RAG embedding cache and the downloaded vision model database were not erased. `deleteDatabase` resolved on `onblocked`, so a blocked delete counted as success. The CRDT database exists for every user from the first run.
- **Expected:** Every created database is erased; unverified or failed erasure is reported as such.
- **Evidence:** privacyService.ts INDEXED_DB_NAMES (7 entries on main); browser: the CRDT database present after onboarding.
- **Diagnosis:** Static name list without a registry invariant.
- **Impact:** Personal data remains after an explicit erase request. Production relevance: Live in v1.10.0. Release relevance: Decision input.
- **Ownership:** GitHub: PR #550 | Linear: QNB-273 | active PR: #550 (open, Cursor) | workstream: WS-PRIVACY | Linear escalation required: NO
- **Required correction:** Registry of 10 database names, close own connections first, timeout and verification semantics. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** No CannaGuide*/cannaguide-*/plantDiseaseModel database remains after erase; blocked deletion reported. Verification: Registry scan test plus runtime `indexedDB.databases()` assertion; negative tests for late open and failed close.
- **Disposition / implementation:** Owned by the active privacy lane. Implementation status: IN_PROGRESS (PR #550).
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: 048-051 review notes.
- **Live-main revalidation:** privacyService.ts still lists 7 names on c49560d9 on 2026-10-08; PR #550 registers 10 (independent scan found exactly those 10 in the audited tree).

### CG-AUD-20261008-019 -- Onboarding promises cross-device sync that does not exist

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Privacy disclosures / onboarding | severity S3 | confidence CONFIRMED | status OWNED_BY_ACTIVE_PR
- **Affected surface:** apps/web/locales/*/onboarding.ts (step "Offline Sync")
- **Observed:** The step says data syncs seamlessly across devices; `CLOUD_SYNC_DISABLED = true` and the production CSP blocks the GitHub API.
- **Expected:** Copy describes local CRDT persistence only until the sync decision ships.
- **Evidence:** onboarding.ts lines 41-46; constants.ts line 15.
- **Diagnosis:** Copy ahead of a stopgap flag.
- **Impact:** Misleading product claim. Production relevance: Live in v1.10.0. Release relevance: Decision input.
- **Ownership:** GitHub: PR #550 | Linear: QNB-273 (slice C) | active PR: #550 | workstream: WS-PRIVACY | Linear escalation required: NO
- **Required correction:** Replace the sync step text. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** No sync claim without a transport. Verification: Copy test.
- **Disposition / implementation:** Owned by the active privacy lane. Implementation status: IN_PROGRESS (PR #550).
- **Dependencies and gates:** dependencies: 023 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Text unchanged on c49560d9 on 2026-10-08.

### CG-AUD-20261008-020 -- Outdated legal reference (section 5 TMG) and unreviewed imprint rationale

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Legal references | severity S3 | confidence CONFIRMED | status BLOCKED_BY_USER_GATE
- **Affected surface:** apps/web/locales/*/legal.ts
- **Observed:** The text cites "section 5 TMG"; the TMG was replaced by the DDG. Whether an imprint is required is a legal question.
- **Expected:** Current statute reference; legal conclusions reviewed by a qualified person.
- **Evidence:** legal.ts line 62.
- **Diagnosis:** Statute change.
- **Impact:** Outdated legal text. Production relevance: Live. Release relevance: None (wording only).
- **Ownership:** GitHub: PR #550 | Linear: QNB-273 | active PR: #550 | workstream: WS-PRIVACY | Linear escalation required: NO
- **Required correction:** Update the citation wording; leave conclusions review-gated. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Reference corrected; conclusions explicitly LEGAL_REVIEW_REQUIRED. Verification: Copy test.
- **Disposition / implementation:** Citation in #550; legal conclusion is not an engineering judgement. Implementation status: IN_PROGRESS (PR #550).
- **Dependencies and gates:** dependencies: none | user/provider gate: Legal review (owner) | follow-up: The KCanG age-gate rationale needs the same review.
- **Live-main revalidation:** legal.ts line 62 unchanged on c49560d9 on 2026-10-08.

### CG-AUD-20261008-021 -- Strain lookups fall back to third-party CORS proxies

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: External APIs / proxies | severity S3 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** apps/web/services/strainApiService.ts, services/strain-lookup/*
- **Observed:** On failure the service retries through public CORS proxies, which would expose user search terms to third parties. Inert in production because the CSP blocks them.
- **Expected:** No third-party proxy ever sees user input.
- **Evidence:** Source read; browser probes to the proxy hosts are CSP-blocked.
- **Diagnosis:** Browser CORS workaround.
- **Impact:** Latent privacy leak if the CSP is widened. Production relevance: Blocked by CSP. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-274 | active PR: none | workstream: WS-CSP-NETWORK | Linear escalation required: NO
- **Required correction:** Remove the proxy fallback; never fix by allow-listing. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** No proxy host in source or CSP. Verification: Invariant test over source hosts vs connect-src.
- **Disposition / implementation:** Queued; waits for the active lease. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 022 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Proxy fallback code present on c49560d9 on 2026-10-08.

### CG-AUD-20261008-022 -- Community Share, strain lookups and the Cansativa call hosts the production CSP blocks

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: CSP | severity S2 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** services/communityShareService.ts, strain-lookup, cansativaService; Settings -> Data management
- **Observed:** In-page probes to api.github.com, api.otreeba.com, cannlytics.com, the Cansativa gateway and two proxies are blocked by connect-src while an AI-provider control host answered. The UI exposes Community Share, which can only fail in production. Unit tests mock fetch, so CI stays green.
- **Expected:** No UI affordance leads to a CSP-blocked request.
- **Evidence:** Probe results on all three hosts; securityHeaders.ts connect-src list.
- **Diagnosis:** Features shipped behind a CSP that never allowed them; mocked tests.
- **Impact:** Broken features and dishonest UI. Production relevance: Live in v1.10.0. Release relevance: Release notes must not advertise them.
- **Ownership:** GitHub: none | Linear: QNB-274 | active PR: none | workstream: WS-CSP-NETWORK | Linear escalation required: NO
- **Required correction:** Gate the three feature families like cloud sync and remove the proxy fallback; allow-list only after a product decision. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** No control issues a blocked request; invariant test over source hosts; proxy fallback removed. Verification: Browser run on the preview; invariant test.
- **Disposition / implementation:** Queued after the privacy lane (default bias: gate before broadening CSP). Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 017, 021 | user/provider gate: Product decision for any allow-list | follow-up: none
- **Live-main revalidation:** Community Share panel and hosts present on c49560d9 on 2026-10-08; probes re-run on 2026-10-08 against all three hosts: all blocked.

### CG-AUD-20261008-023 -- Cloud sync is only a stopgap flag; the product path is undecided

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Cloud sync | severity S2 | confidence CONFIRMED | status BLOCKED_BY_USER_GATE
- **Affected surface:** constants.ts `CLOUD_SYNC_DISABLED`, CloudSyncPanel, onboarding, crdtSyncBridge
- **Observed:** The flag hides the cloud-sync panel only. The transport (personal-token gists) is blocked by the CSP; the CRDT bridge still persists locally for every user.
- **Expected:** A decided path (personal-token gists vs backend vs removal) with matching copy.
- **Evidence:** constants.ts line 15; QNB-275.
- **Diagnosis:** Deferred product decision.
- **Impact:** Copy and code drift. Production relevance: Sync unavailable. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-275 | active PR: none | workstream: WS-SYNC-DECISION | Linear escalation required: NO
- **Required correction:** Owner decision, then specification. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Decision recorded; copy and code match. Verification: n/a
- **Disposition / implementation:** Owner gate; keep disabled until decided. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: Owner (product) | follow-up: none
- **Live-main revalidation:** Flag still true on c49560d9 on 2026-10-08.

### CG-AUD-20261008-024 -- Service worker auto-activates and the page reloads while the UI also shows an update prompt

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Service worker / update lifecycle | severity S3 | confidence HIGH | status QUEUED_EXISTING_OWNER
- **Affected surface:** apps/web/public/sw.js, bootstrap/serviceWorker.ts
- **Observed:** The `install` handler calls `self.skipWaiting()` unconditionally (documented as intentional auto-activation) and a `SKIP_WAITING` message handler also exists; the page reloads on `controllerchange` while a `swUpdate` event drives an in-app prompt. The update path can reload mid-form and the prompt is redundant.
- **Expected:** One documented update model.
- **Evidence:** sw.js lines 134-137 and 460; serviceWorker.ts.
- **Diagnosis:** Two update models coexist.
- **Impact:** Lost unsaved UI state; confusing prompt. Production relevance: Live. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-237 | active PR: none | workstream: WS-PWA-OFFLINE | Linear escalation required: NO
- **Required correction:** Choose prompt-then-skipWaiting or silent update and remove the other. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** A waiting worker never takes control without the chosen consent signal; test covers it. Verification: SW unit test with a fake self; deployed lifecycle check across two versions.
- **Disposition / implementation:** Queued with the deployed-lifecycle qualification. Downgraded from a defect to a design risk because the auto-activation is documented intent. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: Two deployments needed to observe. | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Both handlers present on c49560d9 on 2026-10-08; the install-time comment states the intent.

### CG-AUD-20261008-025 -- 14 contrast pairs below WCAG AA and strict accessibility gates are off

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: Accessibility (static gates) | severity S2 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** packages/ui themes, scripts/check-contrast.mjs, .a11y-baseline.json
- **Observed:** 126 checks across 9 themes, 14 below AA (for example 2.21:1 to 4.49:1); the jsx-a11y ceiling is 83 warnings (76 control-has-associated-label); gates run in warn mode.
- **Expected:** Zero pairs below AA and strict gates in CI.
- **Evidence:** Gate output on the exact-head snapshot; docs/AUDIT_REMEDIATION_PLAN.md lists the same debt.
- **Diagnosis:** Brand hues pinned; token work deferred.
- **Impact:** Low-contrast text for some themes. Production relevance: Live. Release relevance: Unresolved P1 in the repository's own plan.
- **Ownership:** GitHub: none | Linear: QNB-238 | active PR: none | workstream: WS-UX-A11Y | Linear escalation required: NO
- **Required correction:** Token adjustments for the 14 pairs; lower the baseline in the same PR; separate PR flips --strict. Implementation brief: D1 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** check-contrast reports 0 and runs strict; baseline equals the real count. Verification: Gate runs; no new suppressions.
- **Disposition / implementation:** Brief D1 (slice 3-5). Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Static gate output taken on 3d8b706d; the theme and baseline files are unchanged on c49560d9 on 2026-10-08.

### CG-AUD-20261008-026 -- First run requires 10 mandatory screens with no skip, no close and a double language choice

- **Meta:** Wave 1 (security, privacy, data, PWA, UX); snapshot 2026-10-07, main 3d8b706d | domain: First-use UX | severity S2 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** components/common/OnboardingModal.tsx, age gate, language picker
- **Observed:** Age gate, language picker and 8 wizard screens are mandatory; every dialog has no close button and a no-op onClose; language is chosen twice; labels such as "Espanol" and "Francais" and the gate headline are ASCII-transliterated user-visible text. axe finds no violations on these screens.
- **Expected:** A short, dismissible path; correct diacritics.
- **Evidence:** Browser walk (33-45 s programmatic pass); OnboardingModal.tsx.
- **Diagnosis:** Linear wizard design.
- **Impact:** Drop-off before first value. Production relevance: Live. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-238 | active PR: none | workstream: WS-UX-A11Y | Linear escalation required: NO
- **Required correction:** Brief D2 after owner decisions on required gate steps. Implementation brief: D2 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** At most 3 mandatory screens (adjustable); dismissible tour; no transliterated labels. Verification: e2e plus axe.
- **Disposition / implementation:** Queued; owner decisions needed first. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: Owner (product, legal gate scope) | follow-up: none
- **Live-main revalidation:** Re-walked on 2026-10-08 on the live site (1.10.0): same 10 screens.

### CG-AUD-20261008-041 -- Settings has critical axe violations in 10 of 12 sub-tabs with one shared root cause

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: Accessibility (runtime) | severity S2 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** apps/web/components/views/settings/SettingsShared.tsx (SettingsRow), components/common/Switch.tsx, About/Data Management tabs
- **Observed:** button-name (critical), label (critical) and aria-prohibited-attr (serious) on Settings; Voice & Speech alone has 55 unnamed controls; About has list violations; Data Management two unnamed buttons; heading-order in Help and Settings. Identical on desktop and mobile for the tabs measured on both. The rest of the shell is clean.
- **Expected:** Every control has a programmatic name.
- **Evidence:** axe-core 4.12 run on production 1.10.0; SettingsShared.tsx line 28 `aria-label` on a role-less div; Switch names itself only from caller props (48 call sites).
- **Diagnosis:** SettingsRow places the label on a wrapper div instead of naming the control.
- **Impact:** Screen-reader users cannot identify settings controls. Production relevance: Live. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-238 | active PR: none | workstream: WS-UX-A11Y | Linear escalation required: NO
- **Required correction:** Brief D1: label id by context in SettingsRow, consumed by Switch/Select/inputs; list and button fixes. Implementation brief: D1 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** 0 critical/serious on every Settings tab on desktop and mobile; regression test for unnamed SettingsRow children. Verification: Per-tab axe spec.
- **Disposition / implementation:** Queued; highest-leverage a11y fix. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: none
- **Live-main revalidation:** SettingsShared.tsx line 28 confirmed on c49560d9 on 2026-10-08; live re-run 2026-10-08.

### CG-AUD-20261008-042 -- Strains view has 21 interactive targets below 24x24 CSS pixels

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: Accessibility (WCAG 2.2) | severity S4 | confidence CONFIRMED | status OPEN
- **Affected surface:** Strains view
- **Observed:** Measured with bounding boxes on desktop; outside the WCAG 2.1 scope used elsewhere, relevant for 2.2 SC 2.5.8.
- **Expected:** Targets at least 24x24 or spaced.
- **Evidence:** Browser measurement.
- **Diagnosis:** Dense list controls.
- **Impact:** Motor accessibility. Production relevance: Live. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-238 (note) | active PR: none | workstream: WS-UX-A11Y | Linear escalation required: NO
- **Required correction:** Track if the product commits to WCAG 2.2. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Targets meet 2.5.8. Verification: Measurement script.
- **Disposition / implementation:** Note only. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: Product commitment to 2.2 | follow-up: none
- **Live-main revalidation:** Measured 2026-10-08.

### CG-AUD-20261008-043 -- Two eval CSP reports per load come from Zod 4's JIT capability probe

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: Runtime / CSP | severity S4 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** assets/strains-data-*.js (bundled zod 4.4.2), apps/web bootstrap
- **Observed:** The chunk contains `new Function("")` inside Zod's `allowsEval`; the strict CSP blocks it, Zod falls back to the non-JIT parser. No functional failure, but console noise and every schema runs on the slower path. No app code sets `jitless`.
- **Expected:** No CSP violation events at startup.
- **Evidence:** Chunk text; zod/v4/core/util.js (line ~120 probe, ~146 jitless skip); apps/web and ai-core depend on zod ^4.4.2.
- **Diagnosis:** Library capability probe under a strict CSP.
- **Impact:** Noise can mask real violations. Production relevance: Live. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-274 (acceptance item 4) | active PR: none | workstream: WS-CSP-NETWORK | Linear escalation required: NO
- **Required correction:** Call `z.config({ jitless: true })` once at bootstrap (and worker entries that import Zod). Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Zero eval securitypolicyviolation events at startup. Verification: e2e smoke listener.
- **Disposition / implementation:** Queued; tiny slice. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: none
- **Live-main revalidation:** No jitless usage on c49560d9 on 2026-10-08.

### CG-AUD-20261008-044 -- The entry preloads 50 assets (about 679 KB brotli) and 58% is feature-specific code; the repository metric cannot see it

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: Performance / bundle | severity S3 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** apps/web/vite.config.ts chunking, scripts/measure-critical-path.mjs, scripts/check-bundle-budget.mjs
- **Observed:** index.html declares 48 modulepreload links + entry + stylesheet: 2.8 MB raw, 749 KB gzip, about 679 KB brotli. Fifteen chunks the repository treats as lazy are in the set (pdf-export 130 KB br, charts-recharts 101, strains-data 86, charts-d3 31, localAI 31, ten local-AI service chunks): about 394 KB brotli. The metric selects chunks by name, reported 5 chunks / 318 KB on 2026-06-01 and is advisory (`continue-on-error`).
- **Expected:** The metric measures what the browser fetches; feature code stays out of the entry graph.
- **Evidence:** Public index.html fetched and compressed locally; script source.
- **Diagnosis:** Static import edges drag feature modules into the entry; heuristic metric.
- **Impact:** Slow first load on low-end devices. Production relevance: Live. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-236 | active PR: none | workstream: WS-PERFORMANCE | Linear escalation required: NO
- **Required correction:** Brief D10. Implementation brief: D10 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** Preloaded brotli at most 400 KB (adjustable); no jspdf/recharts/d3/local-AI in the preloads; ratchet in CI. Verification: New metric; e2e unchanged.
- **Disposition / implementation:** Queued with the performance re-baseline. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: Baseline: DOMContentLoaded 2.2 s, load 2.3 s on the 2-core reference host.
- **Live-main revalidation:** Measured on the live 1.10.0 site 2026-10-08; scripts unchanged on c49560d9.

### CG-AUD-20261008-045 -- ONNX Runtime WASM (about 25.6 MiB) is loaded from a public CDN at runtime without an integrity check

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: Local AI / supply chain | severity S3 | confidence CONFIRMED | status OPEN
- **Affected surface:** packages/ai-core/src/ml.ts `ORT_WASM_CDN_BASE`
- **Observed:** The URL is version-pinned on cdn.jsdelivr.net but ONNX Runtime fetches the file internally with no SRI or `fetch(..., {integrity})`; transformers.js also loads its own pinned WASM from jsDelivr. The CDN is used because the file exceeds Cloudflare Pages' 25 MiB per-file limit. Offline-first claim: first local inference needs the network unless the service worker caches the cross-origin file (not verified).
- **Expected:** Integrity-pinned or self-hosted runtime binary.
- **Evidence:** ml.ts comments and constant.
- **Diagnosis:** Hosting limit workaround.
- **Impact:** A CDN or package compromise executes code in the app origin's worker. Production relevance: On use only (opt-in local AI). Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED | active PR: none | workstream: WS-DEPS-SUPPLY-CHAIN | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Fetch the .wasm with `integrity` and pass `wasmBinary`, or self-host where the size limit allows; disclose in privacy copy. Implementation brief: D12 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** Runtime binary verified by hash. Verification: Unit test with a wrong hash.
- **Disposition / implementation:** Unassigned design note. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 017 | user/provider gate: none | follow-up: Offline caching of the file unverified.
- **Live-main revalidation:** ORT_WASM_CDN_BASE unchanged on c49560d9 on 2026-10-08.

### CG-AUD-20261008-046 -- Sentry session replay has masking explicitly disabled (inert today)

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: Observability / privacy | severity S3 | confidence CONFIRMED | status OPEN
- **Affected surface:** apps/web/services/sentryService.ts
- **Observed:** `replayIntegration({ maskAllText: false, blockAllMedia: false })` turns off the defaults; sampling is 1% of sessions and 100% of error sessions. Sentry initialises only when `VITE_SENTRY_DSN` is set (undocumented knob); no hosted build sets it and the production CSP has no Sentry host, so nothing leaves the device today.
- **Expected:** Replay never records unmasked text or media.
- **Evidence:** sentryService.ts lines 56-76; Vercel env metadata (one key); no workflow references the DSN.
- **Diagnosis:** Overrides added for debuggability.
- **Impact:** Grow-journal text, notes and photos recorded in clear if a DSN is ever set. Production relevance: Latent. Release relevance: None.
- **Ownership:** GitHub: none | Linear: UNASSIGNED (related QNB-273) | active PR: none | workstream: WS-PRIVACY | Linear escalation required: PENDING_AUTHORIZATION
- **Required correction:** Brief D11: remove both overrides; test; document or remove the DSN path. Implementation brief: D11 in IMPLEMENTATION-BRIEFS.md.
- **Acceptance / verification:** Replay options keep masking on; test enforces it. Verification: Unit test.
- **Disposition / implementation:** Unassigned; outside #550 scope. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: none | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Lines 74-75 unchanged on c49560d9 on 2026-10-08.

### CG-AUD-20261008-047 -- GitHub Pages is not cross-origin isolated, so SharedArrayBuffer is unavailable there

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: Delivery / host parity | severity S4 | confidence CONFIRMED | status QUEUED_EXISTING_OWNER
- **Affected surface:** GitHub Pages delivery
- **Observed:** No custom response headers are possible, so COOP/COEP cannot be sent: `crossOriginIsolated` is false and `SharedArrayBuffer` undefined (Vercel and Cloudflare: true / available). Whether the app feature-detects correctly and the local-AI throughput cost are not measured.
- **Expected:** Documented platform difference with graceful degradation.
- **Evidence:** Gate-level browser run on all three hosts (desktop and mobile).
- **Diagnosis:** Platform limitation (documented in `_headers`).
- **Impact:** Reduced local-AI throughput on that host. Production relevance: Live. Release relevance: None.
- **Ownership:** GitHub: none | Linear: QNB-261, QNB-237 | active PR: none | workstream: WS-PWA-OFFLINE | Linear escalation required: NO
- **Required correction:** Add a parity-matrix row; measure local-AI per host. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Row documented; degradation measured. Verification: Per-host local-AI probe.
- **Disposition / implementation:** Queued. Implementation status: NOT_STARTED.
- **Dependencies and gates:** dependencies: 006 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Measured 2026-10-08 on 1.10.0.

### CG-AUD-20261008-048 -- PR 550 review note: the registry scanner test is closed-world

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: IndexedDB / erase (review note) | severity S3 | confidence CONFIRMED | status OWNED_BY_ACTIVE_PR
- **Affected surface:** apps/web/services/privacyDatabaseRegistry.test.ts (PR #550 head 5234c8fa)
- **Observed:** The name pattern matches only `indexedDB.open('literal'`, `dbName: 'literal'` and five specific constant names; a database created through another constant name passes silently, recreating the drift class. A broader scan of the audited tree finds exactly the 10 registered names today.
- **Expected:** A runtime invariant independent of source spelling.
- **Evidence:** Test source; independent scan.
- **Diagnosis:** Static pattern.
- **Impact:** Future drift. Production relevance: n/a Release relevance: n/a
- **Ownership:** GitHub: PR #550 | Linear: QNB-273 | active PR: #550 | workstream: WS-PRIVACY | Linear escalation required: NO
- **Required correction:** Add a test that creates every registered database, erases, and asserts `indexedDB.databases()` is empty of app names. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Runtime half of the invariant exists. Verification: Unit test with fake-indexeddb or e2e.
- **Disposition / implementation:** Posted to the owner; the active writer decides. Implementation status: IN_PROGRESS (PR #550).
- **Dependencies and gates:** dependencies: 018 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** PR head advanced to 60376d36 after the note; not re-reviewed.

### CG-AUD-20261008-049 -- PR 550 review note: data export opens databases without an existence check and creates missing ones

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: IndexedDB / export (review note) | severity S3 | confidence CONFIRMED | status OWNED_BY_ACTIVE_PR
- **Affected surface:** privacyService.readAllFromDatabase (PR #550 head 5234c8fa)
- **Observed:** `indexedDB.open(name)` with no version creates an empty version-1 database when absent, which can prevent the later schema initialization.
- **Expected:** Export is read-only and side-effect free.
- **Evidence:** Source at the PR head.
- **Diagnosis:** No existence check.
- **Impact:** Schema initialization side effects. Production relevance: n/a Release relevance: n/a
- **Ownership:** GitHub: PR #550 | Linear: QNB-273 | active PR: #550 | workstream: WS-PRIVACY | Linear escalation required: NO
- **Required correction:** Check `indexedDB.databases()` first (treat unavailable as unknown) or abort in onupgradeneeded. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Export of an absent database creates nothing. Verification: Regression test for absent DB.
- **Disposition / implementation:** Posted to the owner. Implementation status: IN_PROGRESS (PR #550).
- **Dependencies and gates:** dependencies: 018 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Same as 048.

### CG-AUD-20261008-050 -- PR 550 review note: the export dumps the whole localStorage and the secure database

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: Export scope (review note) | severity S4 | confidence CONFIRMED | status OWNED_BY_ACTIVE_PR
- **Affected surface:** privacyService.exportAllUserData
- **Observed:** No credential leak (the AES key is non-extractable and serialises to `{}`; the IoT password is ciphertext), but the file carries the IoT username, the encrypted blob and consent flags of no use to the user.
- **Expected:** Data minimisation with an explicit key allow-list.
- **Evidence:** cryptoService.ts (extractable=false); useIotStore.
- **Diagnosis:** Wholesale dump.
- **Impact:** Low. Production relevance: n/a Release relevance: n/a
- **Ownership:** GitHub: PR #550 | Linear: QNB-273 | active PR: #550 | workstream: WS-PRIVACY | Linear escalation required: NO
- **Required correction:** Export an allow-list of keys and drop the secure database. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Export contains only user-authored records. Verification: Unit test.
- **Disposition / implementation:** Posted to the owner. Implementation status: IN_PROGRESS (PR #550).
- **Dependencies and gates:** dependencies: 018 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Same as 048.

### CG-AUD-20261008-051 -- PR 550 review note: unverified absence can be reported as confirmed erasure

- **Meta:** Wave 3 (app shell, runtime, performance, review notes); snapshot 2026-10-08, main c49560d9 | domain: Erase verification (review note) | severity S3 | confidence CONFIRMED | status OWNED_BY_ACTIVE_PR
- **Affected surface:** privacyService.namedDatabasesStillPresent, closeOwnedConnections
- **Observed:** The presence check returns false when `indexedDB.databases()` is missing or throws, and closer errors are swallowed, so unverified absence reads as confirmed.
- **Expected:** Distinguish ERASURE_VERIFIED, ERASURE_ATTEMPTED_BUT_UNVERIFIED and ERASURE_FAILED.
- **Evidence:** Source at the PR head.
- **Diagnosis:** Boolean API.
- **Impact:** Overclaimed erasure. Production relevance: n/a Release relevance: n/a
- **Ownership:** GitHub: PR #550 | Linear: QNB-273 | active PR: #550 | workstream: WS-PRIVACY | Linear escalation required: NO
- **Required correction:** Tri-state result; UI claims "verified" only when verified; negative tests for late open, failed close, databases() throwing. Brief: lives in the owner issue or the active PR.
- **Acceptance / verification:** Fail-closed semantics with tests. Verification: Unit tests.
- **Disposition / implementation:** Raised by an independent review in the owner issue; the active writer decides. Implementation status: IN_PROGRESS (PR #550).
- **Dependencies and gates:** dependencies: 018 | user/provider gate: none | follow-up: none
- **Live-main revalidation:** Same as 048.

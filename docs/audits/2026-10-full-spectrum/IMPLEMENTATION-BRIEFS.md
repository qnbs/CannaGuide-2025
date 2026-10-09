# Implementation Briefs D1-D12

Implementation-ready briefs for the findings of the 2026-10 full-spectrum audit that no existing tracker owner covers (and for the larger slices of those that do). Briefs live in the repository because the tracker is a compact control plane (decision CG-DEC-001): **nothing here is filed as an issue by default.** If the owner later authorizes issue creation, the proposal is one issue per workstream (see [`WORKSTREAMS.md`](./WORKSTREAMS.md)), each citing its brief and finding IDs.

All briefs are post-release work (v1.10.0 is published). None may start while another mutation lane owns the same files; the current source lane (QNB-273 / PR #550) forbids parallel source PRs, workflow edits, desktop edits and CSP changes until it is merged and proved.

Repository verification rules that apply to every brief (see `CLAUDE.md`): use `pnpm verify`, `pnpm verify:test`, `pnpm verify:lint` (scoped), never a bare `turbo run`; scoped single-spec runs without `--`; no new `eslint-disable` or `biome-ignore`; new source is ASCII-only; keep each PR well under 100 changed files; run prettier over `git status --porcelain`; frozen-lockfile installs only.

## Brief index

| Brief | Title                                                                         | Findings                                       | Existing Linear owner           | Workstream           |
| ----- | ----------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------- | -------------------- |
| D1    | Name every Settings control via SettingsRow; burn down contrast failures      | CG-AUD-20261008-025, CG-AUD-20261008-041       | QNB-238                         | WS-UX-A11Y           |
| D2    | Shorten and make the first-run path dismissible                               | CG-AUD-20261008-026                            | QNB-238                         | WS-UX-A11Y           |
| D3    | Scope deploy, signing and release credentials                                 | CG-AUD-20261008-027 (with CG-AUD-20261008-010) | none (related QNB-252, QNB-267) | WS-CI-GOVERNANCE     |
| D4    | Reconcile live rulesets with the expected state and CLAUDE.md                 | CG-AUD-20261008-028                            | none (related QNB-266)          | WS-CI-GOVERNANCE     |
| D5    | Validate persisted state and provider JSON at runtime                         | CG-AUD-20261008-029                            | none (related QNB-256)          | WS-TEST-QUALITY      |
| D6    | Narrow the Tauri filesystem scope, CSP and unused plugins                     | CG-AUD-20261008-030, CG-AUD-20261008-039       | none                            | WS-DESKTOP           |
| D7    | Make the locale gates match what the docs claim                               | CG-AUD-20261008-037                            | none (related QNB-266)          | WS-I18N              |
| D8    | Lift override floors above patched versions; cover Rust and no-fix advisories | CG-AUD-20261008-033 to CG-AUD-20261008-036     | none (related QNB-266)          | WS-DEPS-SUPPLY-CHAIN |
| D9    | Make the Desktop Build workflow start and guard it                            | CG-AUD-20261008-038                            | QNB-254 (sequencing)            | WS-RELEASE-OPS       |
| D10   | Measure the real preload set; slim the entry graph                            | CG-AUD-20261008-044                            | QNB-236                         | WS-PERFORMANCE       |
| D11   | Keep Sentry replay masking on                                                 | CG-AUD-20261008-046                            | none (related QNB-273)          | WS-PRIVACY           |
| D12   | Verify the ONNX Runtime WASM by hash                                          | CG-AUD-20261008-045                            | none                            | WS-DEPS-SUPPLY-CHAIN |

Findings with an existing owner and no brief here (for example CG-AUD-20261008-009 dry-run, CG-AUD-20261008-022 CSP-blocked features, CG-AUD-20261008-043 Zod jitless) carry their implementation brief in the owner issue; the ledger block says so.

---

## D1 -- a11y(settings): name every Settings control via SettingsRow, burn down contrast failures

**Origin and class.** Wave 1 + wave 3, finding A11Y-001. VERIFIED_ACCESSIBILITY_GAP, severity S2
(axe `critical`), CONFIRMED (browser-observed and traced to source).

**Evidence.**

- Runtime (public production, axe-core 4.12, A + AA + best-practice, desktop and mobile): 0
  violations on the age gate, language picker, all 8 wizard screens, Plants, Strains, Equipment and
  Knowledge; skip link, one `h1`, landmarks and visible focus rings are fine. **Settings has
  critical or serious violations in 10 of 12 sub-tabs** (`button-name`, `label`,
  `aria-prohibited-attr`); Voice & Speech alone has 55 unnamed controls. About has `list`
  violations; Data Management has 2 unnamed buttons; `heading-order` appears in Help and Settings.
- Static: `node scripts/check-contrast.mjs` -> 126 checks, 14 below AA; `.a11y-baseline.json`
  ceiling 83 (76 `control-has-associated-label`); strict gates are off.
- Root cause: `apps/web/components/views/settings/SettingsShared.tsx:28` puts `aria-label` on a
  role-less wrapper `div` instead of naming the control; `components/common/Switch.tsx` names the
  switch only when its caller passes `label` or `aria-label`; 48 `<Switch` call sites.

**Binding decisions already in the repo plan (do not re-litigate).** Brand hues stay pinned (adjust
via adjacent / neutral tokens); unreachable pairs are marked `// PARKED(WS-C3)`; the `--strict`
flip is a separate PR.

**Implementation brief.**

1. `SettingsRow` always creates a label id (`useId`) and provides it through a small React context;
   `Switch`, `SettingsSelect` and the range / number / time inputs read `aria-labelledby` from it
   unless an explicit name is passed; remove `aria-label` from the `div` (use `role="group"` +
   `aria-labelledby` if grouping is wanted). Unit test per control kind; axe test per Settings
   sub-tab.
2. `AboutTab` list markup; the two Data Management buttons; heading order in Help and Settings.
3. WS-C3: token adjustments for the 14 failing contrast pairs -> `check-contrast` reports 0.
4. Lower `.a11y-baseline.json` with `node scripts/check-a11y-ratchet.mjs --update` in the same PR
   as the fix (never raise it).
5. Separate PR: `check-contrast --strict` in CI and a Playwright axe spec that walks the Settings
   sub-tabs on desktop and mobile.

**Acceptance.** 0 critical or serious axe violations on every Settings sub-tab (desktop and
mobile); `check-contrast` 0 below AA and strict in CI; baseline equals the real count; a regression
test fails when a `SettingsRow` child has no accessible name; no new suppressions.

**Note.** The Strains view has 21 targets below 24x24 CSS px (WCAG 2.2 SC 2.5.8); track separately
if the product commits to WCAG 2.2.

**Brief completion.**

- **Findings:** 025, 041
- **Non-goals:** No brand-hue change; no Settings redesign; WCAG 2.2 target size is separate.
- **Negative tests:** A SettingsRow child without an accessible name fails a test; an axe test fails on aria-label on a role-less element.
- **Production proof:** axe-core run on production after deploy: 0 critical/serious on every Settings tab, desktop and mobile.
- **Existing owner:** QNB-238
- **Suggested PR titles:** fix(a11y): name Settings controls through SettingsRow; chore(a11y): switch check-contrast to strict
- **Stop conditions:** Token fixes would change pinned brand hues, or a PR would exceed the review-size limit.

---

## D2 -- ux(onboarding): shorten, make dismissible, merge language choice, fix ASCII labels

**Origin and class.** Wave 1, finding UX-001. VERIFIED_UX_GAP, S2, CONFIRMED.

**Evidence.** From a fresh profile to the first usable screen: **10 mandatory screens** -- age gate
(with a DE / EN toggle), language picker (Deutsch, English, Espanol, Francais, Nederlands -- ASCII
transliterations), then 8 wizard screens: Strain Encyclopedia, Grow Room, Workshop, Knowledge
Center, Offline Sync, Experience Level, Main Goal, Space and Budget (`ONBOARDING_TOTAL_STEPS = 9`
counts the language step). The programmatic pass took about 33-45 seconds on the audit host. Every
dialog uses `showCloseButton={false}` and a no-op `onClose`; controls are Back / Next only: no skip,
no Escape. The gate headline "Willkommen -- Bitte oben rechts die Sprache waehlen" is ASCII-
transliterated user-visible German. Language is chosen twice. The Offline Sync step promises
cross-device sync that does not exist (PRIV-001 slice C, SYNC-001). The last step needs a size and a
budget before its button works. axe finds no violations on any of these screens.

**Decisions needed from the owner first.** (1) Which gate steps are legally required (the age /
KCanG gate stays). (2) Does language selection move into the gate? (3) Does the tour become
optional or contextual? (4) Which answers can safely default?

**Implementation brief (after decisions).** (1) Accessible close / skip with confirmation and a
persisted "seen" state. (2) Diacritics in language labels and gate copy (locale files are exempt
from the ASCII-only rule; code stays ASCII). (3) Merge the language choice. (4) Shorten the tour or
move it to progressive disclosure. (5) Update the e2e specs and add a first-run budget (steps and
seconds). Keep the sync-step text change inside the privacy PR; do not duplicate.

**Acceptance.** At most 3 mandatory screens before the first action (owner may adjust); the tour is
dismissible by keyboard and resumable from Help; no ASCII-transliterated user-visible labels; e2e
green; axe stays at 0 on every first-run screen.

**Brief completion.**

- **Findings:** 026
- **Non-goals:** No change to the legal age-gate wording without owner review; no new onboarding content.
- **Negative tests:** The age gate cannot be skipped; the tour closes by keyboard; reopening from Help works.
- **Production proof:** Programmatic walk on production counts at most 3 mandatory screens.
- **Existing owner:** QNB-238
- **Suggested PR title:** feat(onboarding): short dismissible first-run path
- **Stop conditions:** Owner decisions on required gate steps are missing.

---

## D3 -- ci(security): scope deploy, signing and release credentials

**Origin and class.** Wave 1, finding CI-001. DESIGN_RISK, S2, HIGH. Owner-level settings are
involved; details of the current exposure are kept in the private tracker.

**Scope.** Deploy, signing and release workflows should not run with repository-wide secrets
without a human approval step or ref restriction. Documentation currently prescribes a broad
personal-access-token for the release workflow.

**Implementation brief (pick per secret).**

- GitHub Environments with required reviewers and deployment ref rules (`release`,
  `desktop-signing`, `cloudflare-production`, `cloudflare-preview`).
- Ref guard on dispatchable workflows (`github.ref == refs/heads/main`).
- Separate least-privilege Cloudflare credentials (deploy vs. delete vs. read-only audit).
- A fine-grained token or GitHub App scoped to this repository (contents: write) for tags in place
  of the broad token; update `docs/GITHUB-SETTINGS-GUIDE.md`.
- Move PR previews to a trusted `workflow_run` that consumes a secret-free build artifact.
- Move the egress-firewall step from `audit` to `block` with an allow-list for sensitive jobs.

**Acceptance.** No secret-bearing job can start from an arbitrary branch without reviewer approval;
the release token is replaced or narrowed and documented. **Sequencing:** after the release lane is
quiet; do not alter the release path mid-release.

**Brief completion.**

- **Findings:** 027, 010
- **Non-goals:** No secret rotation in the same PR; no change to the release path mid-release.
- **Negative tests:** A workflow policy test fails when a secret-bearing job lacks an approval environment or ref guard.
- **Production proof:** A dispatch from a non-main branch cannot reach the credential (owner verifies in settings).
- **Existing owner:** none (related QNB-252, QNB-267)
- **Suggested PR title:** ci(security): scope deploy, signing and release credentials
- **Stop conditions:** The change needs owner/admin settings: hand over instead of editing around them.

---

## D4 -- governance(rulesets): reconcile live rulesets with the expected state and CLAUDE.md

**Origin and class.** Wave 1, finding GOV-001. VERIFIED_CONTROL_PLANE_DRIFT, S3, CONFIRMED. Owner /
admin settings; specifics kept in the private tracker.

**Scope.** `node scripts/check-repository-governance.mjs --live` (GET only) is not green, and
`CLAUDE.md` states that the ruleset requires thread resolution, which the live ruleset does not
enforce. Decide per item: keep the current bypass model but record it in the expected ruleset files
(or narrow it to pull-request bypass); enable thread resolution and strict status checks (or a
merge queue) or correct `CLAUDE.md`; fold a deterministic CodeQL result into `CI Status`.

**Acceptance.** The live check is green or the expected files record each accepted exception;
`CLAUDE.md` matches the live state. The exact-head discipline of the correction process assumes
strict status checks.

**Brief completion.**

- **Findings:** 028
- **Non-goals:** No agent changes rulesets; owner/admin action only.
- **Negative tests:** The live governance check fails on an unrecorded exception.
- **Production proof:** Live check output is green or lists only recorded exceptions.
- **Existing owner:** none (related QNB-266)
- **Suggested PR title:** docs(governance): align CLAUDE.md with the live rulesets
- **Stop conditions:** Any step would change a ruleset.

---

## D5 -- type(trust-boundary): validate persisted state and provider JSON at runtime

**Origin and class.** Wave 1, finding TYPE-001. VERIFIED_INVARIANT_GAP, S2 / S3, CONFIRMED.

**Evidence.** 34 non-test sites in `apps/web/services` parse persisted or network JSON with `as T`
(provider responses, rate-limiter cost / budget / audit state, key metadata, runtime config);
355 of the repository's `eslint-disable` comments suppress `no-unsafe-type-assertion`. A corrupted
or tampered budget record can silently disable cost-cap logic. Zod is already used elsewhere
(`GistPayloadSchema`).

**Brief.** Schema + `safeParse` with a safe default and a recorded diagnostic on failure: persisted
state first (`aiRateLimiter`, `apiKeyService`, `aiProviderService` metadata), then provider
responses. Tests for malformed and old-version payloads; ratchet the suppression count down.

**Acceptance.** No `JSON.parse(...) as T` left for persisted state; negative-path tests; lower
suppression count.

**Brief completion.**

- **Findings:** 029
- **Non-goals:** No behaviour change beyond safe defaults and diagnostics.
- **Negative tests:** Malformed, old-version and tampered payloads fall back safely and record a diagnostic.
- **Production proof:** n/a (internal); the suppression ratchet count drops.
- **Existing owner:** none (related QNB-256)
- **Suggested PR title:** refactor(services): validate persisted and provider JSON with Zod
- **Stop conditions:** More than 100 files: split per service.

---

## D6 -- desktop(fs): narrow the Tauri filesystem scope, CSP and unused plugins

**Origin and class.** Waves 1-2, finding DESKTOP-001. DESIGN_RISK, S2, HIGH.

**Evidence.** `capabilities/fs.json` allows read and write of text files under
`$DOCUMENT/**/*.json` and `$DOCUMENT/**/*.cannaguide` (plus `$APPDATA/cannaguide/**`); the webview
CSP keeps `script-src 'unsafe-inline'` and `img-src ... https:`. Any script execution in the webview
can read or overwrite arbitrary JSON under Documents. The earlier `export_data` / `import_data`
commands were removed for the same class of risk. `tauri_plugin_process` is registered without a
capability; `tauri_plugin_shell` is used only for `shell:allow-open` (the opener plugin replaces it
in Tauri v2).

**Brief.** Remove the `$DOCUMENT` wildcard; use the dialog plugin to obtain user-selected paths and
rely on the dynamic scope Tauri grants for them; keep `$APPDATA/cannaguide/**` only; tighten the
CSP where the web build does not need the broad form; drop unused plugins or give them explicit
capabilities; add a test asserting the capability files contain no `$DOCUMENT/**` allow.

**Acceptance.** No wildcard allow outside app data; import / export still works through dialogs on
Windows, macOS and Linux.

**Brief completion.**

- **Findings:** 030, 039
- **Non-goals:** No new desktop features; no distribution work.
- **Negative tests:** A test asserts the capability files contain no $DOCUMENT wildcard allow.
- **Production proof:** n/a (no distribution); manual import/export through dialogs on a dev build.
- **Existing owner:** none
- **Suggested PR title:** fix(desktop): narrow filesystem scope and CSP
- **Stop conditions:** The source lease still forbids desktop edits.

---

## D7 -- i18n(gates): make the locale gates match what the docs claim

**Origin and class.** Wave 2, finding I18N-001. VERIFIED_DOCS_DRIFT + gate gap, S3, CONFIRMED.

**Scope.** (1) Wire `check:i18n-usage` into the scoped verify path or CI quality job (cheapest win;
it catches "used in code, missing in EN", the consent-modal bug class). (2) Decide the promotion
path for es / fr / nl from warn-only to blocking after the backfill in
`docs/i18n-parity-backlog.md`, or record an explicit "community locale" tier. (3) Decide the fate of
`lint:i18n` (strict or removed). (4) Correct the `CLAUDE.md` / README wording to the real gate
behaviour. (5) Add the "untranslated value identical to EN" heuristic from the backlog.

**Acceptance.** Every gate named in `CLAUDE.md` is enforced somewhere or removed from the claim;
the es / fr / nl tier is explicit in docs and in the script header.

**Brief completion.**

- **Findings:** 037
- **Non-goals:** No translation backfill.
- **Negative tests:** The gate fails on a key missing in a required language and on a key used in code but missing in EN.
- **Production proof:** CI wiring shown in a run.
- **Existing owner:** none (related QNB-266)
- **Suggested PR title:** ci(i18n): enforce the locale gates the docs claim
- **Stop conditions:** Promoting es/fr/nl to blocking would turn CI red before the backfill.

---

## D8 -- deps(security): lift override floors above advisory-patched versions

**Origin and class.** Wave 2, finding DEP-001. S3 (Medium for the runtime pair), CONFIRMED.

**Evidence.** See wave 2, section 1: 11 `pnpm audit` advisories (moderate) and, from Dependabot, 2
high alerts for the dev-only `extract-zip` (no patched version) plus a Rust `glib 0.18.5` alert;
`qs` and `markdown-it` are pinned by override floors below the patched versions and are
Dependabot-ignored; `ip-address` is bounded but its floor is below the patched versions; `fflate`
has a vulnerable copy under `jspdf`.

**Brief.**

- Bounded floors at or above patched versions: `qs '>=6.16.0 <7'`, `markdown-it '>=14.3.1 <15'`,
  `ip-address '>=10.7.1 <11'`.
- `fflate`: a bounded override `>=0.8.3 <0.9`, or a `jspdf` bump that dedupes to 0.8.3.
- Let Dependabot update `postcss-selector-parser`, `@humanfs/node`, `sprintf-js` (no override exists;
  find out why the lockfile did not move).
- `extract-zip` (high, development scope, no fix): decide between removing the dependency chain
  (Lighthouse CI -> puppeteer), an override to a maintained fork, or a documented, time-boxed audit
  exception with the Dependabot alert dismissed as "no fix, dev tooling only" and the reason
  recorded in the repository's audit-exception file.
- `glib` 0.18.5 (Rust): track the Tauri / wry upstream GTK bindings upgrade; add a `cargo audit`
  (or equivalent) step to `dependency-health.yml` so the Rust lockfile has coverage independent of
  Dependabot.
- Shrink `LEGACY_UNBOUNDED` in `scripts/security/check-override-floors.mjs` by removing `qs` and
  `markdown-it` (the ratchet may only shrink).
- Add a gate that fails when the lockfile-resolved version of an override-pinned package is below
  its patched advisory version, or run `pnpm audit --audit-level=moderate --prod` in
  `dependency-health.yml` for visibility.

**Verification.** The lockfile changes, so CI runs a frozen-lockfile install; locally use only the
scoped verify commands and never a bare `pnpm install` (trap 2). Re-run `pnpm audit` read-only to
confirm the count drops. **Sequencing:** do not touch the lockfile mid-release.

**Brief completion.**

- **Findings:** 033, 034, 035, 036
- **Non-goals:** No major-version dependency upgrades.
- **Negative tests:** The override gate fails when a pinned resolution is below its patched advisory version.
- **Production proof:** Next read-only pnpm audit and Dependabot alert count drop.
- **Existing owner:** none (related QNB-266)
- **Suggested PR title:** fix(deps): lift override floors above patched versions
- **Stop conditions:** The lockfile change fails the supply-chain policy (minimum release age) or the source lease is active.

---

## D9 -- ci(desktop): make the Desktop Build workflow start, publish updater artifacts, guard it

**Origin and class.** Wave 2, finding DESKTOP-002. VERIFIED_DEFECT + DOCS_DRIFT, S3; effect
CONFIRMED, cause PLAUSIBLE.

**Evidence.** `Desktop Build (Tauri v2)` has three runs in its history (tags v1.8.2, v1.9.0,
v1.10.0), all `startup_failure` with zero jobs; no dispatch run ever. The Actions policy is
`selected` and `desktop-build.yml` is the only workflow using `pnpm/action-setup`, which matches no
allow-list pattern. The updater endpoint `.../releases/latest/download/latest.json` returns HTTP 404;
`tauri.conf.json` has no `bundle.createUpdaterArtifacts`; the `tauri-action` step has no `tagName`
or `releaseId`; `docs/distribution.md` and ADR 0012 document the endpoint as working.

**Brief.**

- Step 0 (owner): read the annotation on the latest run page to confirm the cause.
- Step 1: remove the `pnpm/action-setup` step (a `corepack enable` step already precedes it) or use
  the repository's composite action, or add `pnpm/*` to the allow-list.
- Step 2: one `workflow_dispatch` run on a branch proving the four matrix targets start and finish.
- Step 3: add a post-release check (release gate or runbook) that fails when the tag's Desktop Build
  is `startup_failure`.
- Step 4 (product decision): publish desktop artifacts and `latest.json` with releases
  (`createUpdaterArtifacts`, `tagName`), or remove the updater capability and mark desktop as
  non-distributed in the docs.

**Acceptance.** A dispatch run completes (or fails for a real build reason, not
`startup_failure`); the next tag push does not end in `startup_failure`; docs match reality and the
updater endpoint resolves or is removed.

**Brief completion.**

- **Findings:** 038
- **Non-goals:** No signing certificates or notarization work.
- **Negative tests:** The release check fails when the tag's Desktop Build concludes startup_failure.
- **Production proof:** A workflow_dispatch run URL showing the four targets start.
- **Existing owner:** QNB-254 (sequencing)
- **Suggested PR title:** fix(ci): start the desktop build workflow and guard it
- **Stop conditions:** A zero-job startup_failure needs control-plane diagnosis before source mutation; never create retrigger commits.

---

## D10 -- perf(critical-path): measure the real preload set and slim the entry graph

**Origin and class.** Wave 3, finding PERF-001. VERIFIED_PERFORMANCE_GAP + metric gap, S3,
CONFIRMED.

**Evidence.** `index.html` preloads 50 assets, 2.8 MB raw / about 679 KB brotli; 15 feature-specific
chunks make up 58% of the brotli (`pdf-export` 130 KB, `charts-recharts` 101, `strains-data` 86,
`charts-d3` 31, `localAI` 31, plus ten small local-AI service chunks). The repository metric
(`measure-critical-path.mjs`) selects chunks by name, is advisory, and reported 5 chunks / 318 KB
brotli on 2026-06-01. Baseline on the 2-core reference host: DOMContentLoaded 2.2 s, load 2.3 s.

**Brief.** (1) Metric = parse `dist/index.html` (entry + every `modulepreload` + stylesheet), record
it in `artifacts/`, ceiling at today's value, advisory -> blocking after one release. (2) Trace the
static import edges with the `dist/stats.html` visualizer the build already emits and replace them
with dynamic `import()` for PDF export, charts and local-AI services. (3) Re-measure on the
reference host.

**Acceptance.** Preloaded brotli at most 400 KB (owner may adjust); `jspdf`, recharts, d3 and
local-AI chunks absent from the `index.html` preloads; ratchet in CI; no behaviour change in e2e.

**Brief completion.**

- **Findings:** 044
- **Non-goals:** No feature removal.
- **Negative tests:** The budget gate fails when a feature chunk appears in the index.html preload set.
- **Production proof:** Re-measure the production index.html preload set.
- **Existing owner:** QNB-236
- **Suggested PR title:** perf(web): keep feature chunks out of the entry graph
- **Stop conditions:** A dynamic import changes behaviour covered by e2e.

---

## D11 -- privacy(sentry): stop disabling replay masking before any DSN is set

**Origin and class.** Wave 3, finding SENTRY-001. VERIFIED_PRIVACY_RISK (latent), S3, CONFIRMED.

**Evidence.** `services/sentryService.ts` passes `replayIntegration({ maskAllText: false,
blockAllMedia: false })`, which turns off Sentry's default masking. Replay sampling is 1% of
sessions and 100% of error sessions. Sentry is inert in the hosted builds (no DSN, no Sentry host in
`connect-src`), but the knob is undocumented and any build that sets `VITE_SENTRY_DSN` would record
grow-journal text, notes and photos in clear.

**Brief.** Remove both overrides (defaults mask text and block media) or set them to `true`; add a
unit test asserting the replay options keep masking on; document the DSN knob and its CSP
consequence, or remove the dead path.

**Acceptance.** Replay cannot capture unmasked text or media; the test enforces it.

**Brief completion.**

- **Findings:** 046
- **Non-goals:** No Sentry enablement.
- **Negative tests:** A unit test fails when the replay options disable masking.
- **Production proof:** n/a (inert in hosted builds).
- **Existing owner:** none (related QNB-273)
- **Suggested PR title:** fix(privacy): keep Sentry replay masking on
- **Stop conditions:** The change would also alter the privacy copy owned by the active lane.

---

## D12 -- local-ai(supply-chain): verify the ONNX Runtime WASM by hash

**Origin and class.** Wave 3, finding CG-AUD-20261008-045. DESIGN_RISK, S3, CONFIRMED (source).

**Evidence.** `packages/ai-core/src/ml.ts` loads `ort-wasm-simd-threaded.jsep.wasm` (about 25.6 MiB) from `https://cdn.jsdelivr.net/npm/onnxruntime-web@<version>/dist/` at runtime; the version is pinned and a test keeps it equal to the installed package, but ONNX Runtime fetches the file internally with no integrity check. transformers.js loads its own pinned WASM from jsDelivr the same way. The CDN is used because the file exceeds Cloudflare Pages' 25 MiB per-file limit.

**Brief.** Goal: the runtime binary is verified before execution. Smallest safe slice: a loader that fetches the `.wasm` with `fetch(url, { integrity })` and passes the bytes as `wasmBinary`; the expected hash lives next to `ORT_VERSION` and a test recomputes it from the installed package. Alternative: self-host on hosts that allow the size. Also verify whether the service worker caches the cross-origin file (offline-first claim) and list jsDelivr and Hugging Face in the privacy copy (lane PR #550).

**Acceptance.** A wrong hash is rejected before execution; the happy path loads; a unit test covers both; the hash updates with `ORT_VERSION` in one place.

**Brief completion.**

- **Findings:** 045
- **Non-goals:** No model changes; no change to transformers.js beyond the same check if feasible.
- **Negative tests:** A tampered binary (wrong hash) is rejected; a network failure surfaces a clear error.
- **Production proof:** First local inference on production with a network trace showing the verified fetch.
- **Existing owner:** none
- **Suggested PR title:** fix(local-ai): verify the ONNX Runtime WASM by hash
- **Stop conditions:** The ONNX Runtime API cannot accept `wasmBinary` for the used backend; or the source lease is active.

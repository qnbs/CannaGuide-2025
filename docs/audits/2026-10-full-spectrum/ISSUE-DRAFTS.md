# Issue Drafts D1-D11

Implementation-ready drafts for every actionable finding of the 2026-10 full-spectrum audit that the
private tracker could not hold. Each draft follows the tracker's issue shape: origin and class,
evidence, scope, implementation brief, acceptance. All drafts are **post-release** work (v1.10.0 is
published) unless stated; none of them should be started while another mutation lane owns the same
files.

Repository verification rules that apply to every brief (see `CLAUDE.md`): use `pnpm verify`,
`pnpm verify:test`, `pnpm verify:lint` (scoped), never a bare `turbo run`; scoped single-spec runs
without `--`; no new `eslint-disable` or `biome-ignore`; new source is ASCII-only; keep each PR well
under 100 changed files; run prettier over `git status --porcelain`.

## Conversion table

| Draft | Title (tracker prefix `CannaGuide-2025 `)                                                                                                | Parent / relations                       | Priority                         | Labels                                                           | Tracker issue |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------- | ---------------------------------------------------------------- | ------------- |
| D1    | a11y(settings): name every Settings control via SettingsRow (critical axe violations) and burn down the 14 AA contrast failures          | parent QNB-238; related QNB-256, QNB-255 | High                             | Docs / i18n / A11y, Product / UX                                 | pending       |
| D2    | ux(onboarding): shorten the 10-screen mandatory first-run path, make it dismissible, merge the double language choice, fix ASCII labels  | parent QNB-238; related QNB-273, QNB-275 | Medium                           | Product / UX, Docs / i18n / A11y                                 | pending       |
| D3    | ci(security): scope deploy, signing and release credentials with GitHub Environments and narrower tokens                                 | related QNB-252, QNB-267                 | Medium                           | Security, DevOps / Release, Toolchain / Governance, Gated / Hold | pending       |
| D4    | governance(rulesets): reconcile live GitHub rulesets with the expected state and CLAUDE.md                                               | related QNB-266                          | Low                              | Toolchain / Governance, Security, Gated / Hold                   | pending       |
| D5    | type(trust-boundary): validate persisted state and provider JSON at runtime instead of `as T`                                            | related QNB-256                          | Low                              | Data Integrity, Security, Toolchain / Governance                 | pending       |
| D6    | desktop(fs): narrow the Tauri filesystem scope, CSP and unused plugins                                                                   | related D9                               | Medium                           | Security, Native / Core                                          | pending       |
| D7    | i18n(gates): make the locale gates match what the docs claim                                                                             | related QNB-266                          | Low                              | Docs / i18n / A11y, CI / Testing                                 | pending       |
| D8    | deps(security): lift override floors above advisory-patched versions                                                                     | related QNB-266                          | Medium (runtime pair), Low (dev) | Security, Toolchain / Governance                                 | pending       |
| D9    | ci(desktop): make the Desktop Build workflow start, publish updater artifacts, guard it in the release gate                              | related QNB-266, QNB-255                 | Medium                           | CI / Testing, DevOps / Release                                   | pending       |
| D10   | perf(critical-path): measure the real modulepreload set and move jsPDF, charts, strain data and local-AI services out of the entry graph | related QNB-236                          | Medium                           | CI / Testing (and a performance label if one exists)             | pending       |
| D11   | privacy(sentry): stop disabling replay masking before any DSN is ever set                                                                | related QNB-273                          | Low                              | Security, Data Integrity                                         | pending       |

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

---

## D8 -- deps(security): lift override floors above advisory-patched versions

**Origin and class.** Wave 2, finding DEP-001. S3 (Medium for the runtime pair), CONFIRMED.

**Evidence.** See wave 2, section 1: 11 moderate advisories; `qs` and `markdown-it` are pinned by
override floors below the patched versions and are Dependabot-ignored; `ip-address` is bounded but
its floor is below the patched versions; `fflate` has a vulnerable copy under `jspdf`.

**Brief.**

- Bounded floors at or above patched versions: `qs '>=6.16.0 <7'`, `markdown-it '>=14.3.1 <15'`,
  `ip-address '>=10.7.1 <11'`.
- `fflate`: a bounded override `>=0.8.3 <0.9`, or a `jspdf` bump that dedupes to 0.8.3.
- Let Dependabot update `postcss-selector-parser`, `@humanfs/node`, `sprintf-js` (no override exists;
  find out why the lockfile did not move).
- Shrink `LEGACY_UNBOUNDED` in `scripts/security/check-override-floors.mjs` by removing `qs` and
  `markdown-it` (the ratchet may only shrink).
- Add a gate that fails when the lockfile-resolved version of an override-pinned package is below
  its patched advisory version, or run `pnpm audit --audit-level=moderate --prod` in
  `dependency-health.yml` for visibility.

**Verification.** The lockfile changes, so CI runs a frozen-lockfile install; locally use only the
scoped verify commands and never a bare `pnpm install` (trap 2). Re-run `pnpm audit` read-only to
confirm the count drops. **Sequencing:** do not touch the lockfile mid-release.

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

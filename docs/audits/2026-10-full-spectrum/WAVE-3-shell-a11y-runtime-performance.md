# Wave 3 -- App-Shell Accessibility, Runtime (`eval`, Bundle), Local-AI Network Lifecycle, Sentry, Host Parity

**Date:** 2026-10-08
**Audited head:** `c49560d9d3d36c9a84f71e3095a8e3a3eea3534a` (v1.10.0), live on all three hosts
**Method:** see [`README.md`](./README.md). Browser evidence from the public production origins with a
fresh temporary profile; onboarding passed programmatically; nothing was written to any server.

## 1. App-shell accessibility walk (A11Y-001 refined, S2, CONFIRMED)

Onboarding path walked: age gate, language picker, then 8 wizard screens (Strain Encyclopedia, Grow
Room, Workshop, Knowledge Center, Offline Sync, Experience Level, Main Goal, Space and Budget; the
last needs a size and a budget choice before its final button works). axe-core 4.12 with
`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, best-practice; desktop 1280x900 and mobile 390x844.

**Good (do not regress).** Plants, Strains, Equipment and Knowledge: 0 violations. Skip link
present, one `h1` per view, `main` and `nav` landmarks, visible focus ring on 30 of 30 Tab stops,
no unnamed controls in those views. Help: 1 moderate (`heading-order`).

**Not good: Settings.** Critical or serious violations in **10 of 12 sub-tabs**, identical on
desktop and mobile for the tabs measured on both (Strain View was measured on desktop only). The two
clean tabs are Grow Management and Hardware & IoT.

| Settings tab       | Unnamed controls | Main violations (axe)                                                          |
| ------------------ | ---------------- | ------------------------------------------------------------------------------ |
| Plant & Simulation | 10               | `button-name` (critical), `label` (critical), `aria-prohibited-attr` (serious) |
| General & UI       | 3                | `button-name`, `aria-prohibited-attr`                                          |
| AI Configuration   | 11               | `button-name`, `aria-prohibited-attr`                                          |
| Voice & Speech     | 55               | `button-name`, `label`, `aria-prohibited-attr`                                 |
| Strain View        | 6                | `button-name` (Select triggers with `role=combobox`), `aria-prohibited-attr`   |
| Notifications      | 10               | `button-name`, `label` (time inputs), `aria-prohibited-attr`                   |
| Defaults           | 3                | `button-name`, `label`, `aria-prohibited-attr`                                 |
| Privacy & Security | 3                | `button-name`, `aria-prohibited-attr`                                          |
| Data Management    | 0                | `button-name` x2 (icon buttons)                                                |
| About              | 0                | `list` (serious, 4 nodes: `ul` / `ol` with non-`li` children)                  |
| Grow Management    | 0                | none                                                                           |
| Hardware & IoT     | 0                | none                                                                           |

Plus `heading-order` (moderate) in Help and most Settings tabs. Strains view: 21 interactive
targets below 24x24 CSS px (WCAG 2.2 SC 2.5.8, outside the 2.1 scope used above).

**Root cause (one place).** `apps/web/components/views/settings/SettingsShared.tsx:28` --
`SettingsRow` renders `<div ... aria-label={label}>{children}</div>`. A `div` without a role may not
carry `aria-label` (`aria-prohibited-attr`), and the attribute does not name the child control.
`components/common/Switch.tsx` names the switch only when the caller passes `label` or `aria-label`;
48 `<Switch` call sites exist and the settings rows rely on the wrapper. The row `h4` only gets an id
when the optional `id` prop is passed. Fix shape: always create a label id (`useId`) in
`SettingsRow`, provide it through context, and let `Switch`, `SettingsSelect` and the range / number
/ time inputs read `aria-labelledby` from it. The static count (76 label warnings) is a lint ceiling;
the runtime defect is concentrated here. Draft D1.

## 2. `eval` CSP reports: source identified (EVAL-001, S3, CONFIRMED)

Every load reports two `script-src` -> `eval` violations from `assets/strains-data-*.js`. The chunk
contains `navigator?.userAgent?.includes("Cloudflare")) return !1; try { return new Function(""), !0 }
catch { return !1 }`, which is the shape of `allowsEval` in `zod@4.4.2`
(`zod/v4/core/util.js`); `apps/web` and `packages/ai-core` both depend on `zod ^4.4.2`. The strict
CSP blocks `new Function`, the `catch` returns false and Zod falls back to its non-JIT parser: no
functional failure, but console noise and every schema runs on the slower path. Zod skips the probe
under `jitless` (its source comment recommends this for strict CSPs), so `z.config({ jitless: true
})` once at bootstrap removes the reports without any CSP change. No application code sets `jitless`
today. Tracker: QNB-274 acceptance item 4.

## 3. Critical-path bundle (PERF-001 refined, S3, CONFIRMED)

Measured on the production `index.html`, fetching every referenced asset and compressing locally:

- 48 `modulepreload` links + 1 entry script + 1 stylesheet = **50 assets, 2.8 MB raw, 749 KB gzip,
  about 679 KB brotli** (JS only: 2.55 MB raw, about 651 KB brotli). These are static imports of the
  entry graph.
- **15 chunks are feature-specific code** that the repository's comments and budgets call lazy or
  non-critical: `pdf-export` (jsPDF, 433 KB raw / 130 KB brotli), `charts-recharts` (420 / 101),
  `strains-data` (610 / 86), `charts-d3` (101 / 31), `localAI` (94 / 31) and ten small local-AI
  service chunks. Together **1.7 MB raw, about 394 KB brotli, 58% of everything preloaded.** The heavy
  `ai-runtime` (WebLLM) and `three` chunks are correctly not preloaded.
- **The repository metric does not see this.** `scripts/measure-critical-path.mjs` selects chunks
  by file-name pattern, reports 5 chunks / 318 KB brotli (committed `artifacts/critical-path-latest.json`
  from 2026-06-01), runs `continue-on-error: true` in CI and is advisory by default.
  `check-bundle-budget.mjs` treats `strains-data` as a lazy chunk by size, which is not the same as
  lazy by loading.
- Baseline from the first run (2-core reference host, cold, fresh profile, before any interaction):
  73 requests, 68 JS files, about 1.1 MB JS transferred, DOMContentLoaded 2.2 s, load 2.3 s.

Draft D10. Evidence generator: a 50-line Node script doing GET requests against the public site.

## 4. Local-AI network lifecycle (source read)

- Startup preload is opt-in: `localAi.autoPreloadOnStartup` defaults to `false`
  (`stores/slices/settingsSlice.ts`), checked in `bootstrap/postHydration.ts` and `preloadService.ts`;
  the orchestrator documents that downloads are consent-gated. Browser check agrees: after the full
  onboarding and visits to Strains, Equipment, Knowledge, Help and Settings, all 121 requests went to
  the production origin.
- Hosts contacted only on use: `huggingface.co` (model weights; the plant-disease ONNX model URL is
  hard-coded) and `cdn.jsdelivr.net` (**ONNX Runtime WASM, about 25.6 MiB, loaded at runtime**;
  `ORT_WASM_CDN_BASE` in `packages/ai-core/src/ml.ts`; transformers.js also loads its own pinned
  WASM from jsDelivr).
- **AI-001 (design note, S3):** the WASM is fetched from a public CDN with an exact-version URL but
  without an integrity check (ONNX Runtime fetches it internally; no SRI or `fetch(..., { integrity
})` path). A CDN or package compromise would execute attacker code in the app origin's worker. The
  CDN is used because the file exceeds Cloudflare Pages' 25 MiB per-file limit (documented in
  `ml.ts`). Options: a small loader that fetches the `.wasm` with `integrity` and passes
  `wasmBinary`; or self-hosting on hosts that allow the size. It also matters for the offline-first
  claim: the first local inference needs the network unless the service worker caches the
  cross-origin file (not verified). The privacy copy must list jsDelivr and Hugging Face (PRIV-001).

## 5. Sentry (SENTRY-001, S3 latent, CONFIRMED)

- `services/sentryService.ts` initialises only when `VITE_SENTRY_DSN` is set, the build is
  production, and local-only mode is off. Sampling when active: traces 0.1, session replay 0.01,
  replay on error 1.0.
- No hosted build sets a DSN (Vercel project environment metadata has one key, `BUILD_BASE_PATH`; no
  workflow, document or `vite.config.ts` mentions `VITE_SENTRY_DSN`; the knob is undocumented), and
  the production CSP has no Sentry host in `connect-src`. Sentry is inert in the shipped builds.
- **Latent issue:** `replayIntegration({ maskAllText: false, blockAllMedia: false })` explicitly
  turns off Sentry's default masking. With a DSN, a replay would record grow-journal text, notes and
  photos in clear, contradicting the "all data stays on your device" promise. Fix: remove both
  overrides (the defaults mask text and block media) and add a unit test that keeps masking on.
  Draft D11. Consequence for PRIV-001: the privacy copy must not claim active error reporting.

## 6. Three-host behavioural parity at the gate (PARITY-001)

Same script on each public origin, desktop and mobile, no credentials. Six controlled `fetch` probes
to hosts used by dormant features test only the CSP (blocked before leaving the browser).

| Signal                                      | Vercel                                                                                    | Cloudflare Pages | GitHub Pages               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------- | -------------------------- |
| axe (A + AA) on the gate                    | 0 (mobile; the desktop run was captured before render after a slow load and is discarded) | 0                | 0                          |
| `crossOriginIsolated` / `SharedArrayBuffer` | true / available                                                                          | true / available | **false / undefined**      |
| CSP blocks the six probe hosts              | yes                                                                                       | yes              | yes                        |
| Zod `eval` probe CSP report                 | yes                                                                                       | yes              | yes (one report, meta CSP) |
| Third-party requests at load                | none                                                                                      | none             | none                       |

GitHub Pages cannot send COOP / COEP headers, so it is not cross-origin isolated and has no
`SharedArrayBuffer` (an intentional platform difference documented in `_headers`). Features that need
shared memory (multi-threaded WASM for ONNX / transformers.js) can only run single-threaded or must
feature-detect on that host. Whether the app detects this correctly, and the local-AI throughput
cost, is not yet measured; it belongs to the deployed-lifecycle qualification (QNB-237). No
functional difference between Vercel and Cloudflare was found at the gate.

## 7. Independent review notes on PR 550 (privacy / erase registry), head `5234c8fa`

Read-only, via the GitHub contents API at the exact head. Also posted to the tracker.

- **Verified:** the registry has 10 database names, and a broader scan of the audited tree
  (`indexedDB.open`, `openDB`, `IndexeddbPersistence`, `*_DB*` constants) finds exactly those 10. No
  database is missing from erase today.
- **Scanner is closed-world:** `NAME_PATTERN` in `privacyDatabaseRegistry.test.ts` matches only
  `indexedDB.open('literal'`, `dbName: 'literal'` and five specific constant names. A database
  created through another constant name passes silently, recreating the drift class. Pair it with a
  runtime test: create every registered database, run `eraseAllData()`, assert
  `indexedDB.databases()` holds no `CannaGuide*`, `cannaguide-*` or `plantDiseaseModel` entry.
- **Export reads are not side-effect free:** `readAllFromDatabase` opens without a version or an
  existence check, so a missing database is created empty at version 1.
- **Export scope:** `exportAllUserData` dumps the whole `localStorage` and includes the secure
  database (ciphertext and a non-extractable key that serializes to `{}`); prefer an explicit key
  allow-list and drop the secure database.
- **Fail-closed shape:** return `{ erased, failed, unverified }` and show "erased and verified"
  only when `unverified === false`.

## 8. Corrections

1. EVAL-001: first attributed to "a dependency" without evidence; now confirmed as Zod 4.
2. Settings tab count: 9 of 12 corrected to 10 of 12.
3. Sentry: a first statement about default replay masking was wrong; masking is explicitly disabled.

## 9. Open after wave 3

Screen-reader behaviour (not evidenced), local-AI throughput per host, a service-worker update across
two real deployments, hostile import / restore exercise, Lighthouse CI numbers on a reference device,
`cargo audit`, license review.

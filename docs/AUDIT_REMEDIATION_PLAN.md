# Audit Remediation Plan

Tracked backlog from the 2026-08-05 P0 branch-integration pass. This document exists so the
findings below survive outside any one contributor's local session -- several were previously
tracked only in an uncommitted, machine-local Claude Code plan file.

Severity follows this repo's usual meaning: **P1** blocks a confident "release ready" claim but
does not block ongoing development; **P2** is engineering hardening; **P3** is backlog polish.
Nothing in this document is release-blocking on its own -- the items that _were_ release-blocking
(local-AI consent gating, service-worker precache budget, ONNX Runtime version/delivery, Cloudflare
deploy honesty, the stale v1.10.0 release branch) were resolved in the same pass that produced this
file; see `CHANGELOG.md` under `[Unreleased]` for the specifics and PR references.

## P1 -- Accessibility

**Status:** partially in progress, not resumed since 2026-07-18.

Measured state as of this pass:

- `.a11y-baseline.json` baselines 83 `jsx-a11y` warnings (76 `control-has-associated-label`, 5
  `no-autofocus`, 1 `no-interactive-element-to-noninteractive-role`, 1
  `role-supports-aria-props`). `check-a11y-ratchet.mjs` only fails if this count _rises_ -- it is a
  ceiling, not a target, and does not block release on the existing 83.
- `node scripts/check-contrast.mjs` reports 14 WCAG-AA failures across 9 themes, several badly
  under the 4.5:1 threshold (`purpleHaze` `neutral-500` on `bg-component`: 2.21:1; `runtzRainbow`:
  2.56:1; `lemonSkunk` primary-button label: 2.93:1). The check runs in CI (`verify` job) but in
  advisory mode -- `--strict` is not passed, so these findings do not fail the gate.
- README.md displays an unqualified `WCAG 2.1 AA` badge (both EN and DE, two occurrences) despite
  the above. This pass adds a footnote linking here rather than removing the badge outright, since
  the underlying work is scoped and partially done (see below) -- but the badge should not be
  treated as a compliance claim until the contrast failures are at zero and the ratchet baseline
  reflects real fixes, not just a raised ceiling.

**This is not new, unscoped work.** A prior session (paused 2026-07-18, "weekly limit ~97%") did
the classification and produced a full execution plan with three of six sub-phases merged:

| Phase                                                                                                                    | Status      | PRs        |
| ------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------- |
| WS-0 (Stryker mutation-testing hardening)                                                                                | Merged      | #452       |
| WS-C1 (`text-slate-500` -> `text-muted`, 253 sites / 109 files)                                                          | Merged      | #453, #454 |
| WS-C2 batch 1 (3 unambiguous chart-hex files -> `chartPalette`)                                                          | Merged      | #455       |
| WS-C2 remaining (~60 hex sites, chart-adjacent files needing classify-or-exclude judgment)                               | Not started | --         |
| WS-C3 (resolve the 14 AA-contrast pairs via token adjustment, then flip `check-contrast.mjs --strict` in a follow-up PR) | Not started | --         |
| WS-C4 (fix the 76 real `control-has-associated-label` sites, then `check-a11y-ratchet.mjs --update` in the same PR)      | Not started | --         |

Next step for whoever resumes this: branch fresh off `main`, work the file list documented in
the original plan (chart-hex files needing case-by-case classification: `settingsConstants.ts`,
`analyticsFormatters.ts`, `IotDashboardView.tsx`, `DevTelemetryPanel.tsx`, the grow modals,
`PlantVisualizer`, `PlantTagGenerator`, `StrainLookupSection`). Two operator decisions already
made and still binding: brand hues are pinned (fix AA via adjacent/neutral tokens, not a brand
shift; anything unreachable gets `// PARKED(WS-C3)` and goes back to the maintainer), and the
`--strict` flip must land in a separate PR from whichever PR first makes the checks pass clean.

## P1 -- Legal and privacy text accuracy

**Status:** not started.

`apps/web/locales/en/legal.ts` (and its 4 sibling locales) currently:

- Claims "All your data is stored locally... We do not operate servers" while the app's own CSP
  (`apps/web/index.html`) allowlists `huggingface.co`, `cdn-lfs.huggingface.co`, `cdn-lfs.hf.co`,
  `huggingfaceusercontent.com`, `cdn.jsdelivr.net`, and `api.elevenlabs.io`. The "Third-Party
  Services" section lists only "(1) Google Fonts, (2) AI provider APIs" -- Hugging Face model
  hosting, the jsDelivr ORT/transformers CDN, ElevenLabs TTS, and GitHub Gist sync (see below) are
  undisclosed.
- The "Google Fonts" claim is itself stale: fonts are now self-hosted (`font-src 'self'` only,
  local `.woff2` files), so this line is not just incomplete but factually wrong.
- Cites "Section 5 TMG" for the Impressum. The TMG was superseded by the Digitale-Dienste-Gesetz
  (DDG) in May 2024.
- States the age-gate is required "under the German Cannabis Act (KCanG)" as though the statute
  mandates an app-level age gate. This is presented as settled law rather than a documented product
  decision -- the actual statutory basis (if any beyond general youth-protection policy) needs
  qualified legal review, not an engineering judgment call.
- The cloud-sync encryption disclosure (`apps/web/locales/en/settings.ts`, the `sync.gistSecurityWarning`
  and `e2ee` keys) is, by contrast, honestly worded: it already states the Gist URL is publicly
  accessible if known and frames E2EE as opt-in protection, not a default guarantee. No change
  needed there.

This repo does not give legal advice and neither does this document. What's actionable without a
lawyer: add the missing third-party disclosures (Hugging Face, jsDelivr, ElevenLabs, GitHub Gist),
correct the TMG reference to DDG, and correct the Google Fonts claim -- all factual corrections, not
legal judgment calls. The KCanG age-gate rationale needs an owner to get qualified review before
its wording changes.

## P1 -- GitHub Gist cloud sync: real redesign

**Status:** symptom contained this pass (see `CHANGELOG.md`, `fix(sync): disable GitHub Gist cloud
sync`), root cause untouched.

`apps/web/services/syncService.ts`'s `pushToGist` and `pullFromGist` never send an `Authorization`
header, and the production CSP's `connect-src` (checked identically across `index.html`,
`securityHeaders.ts`, `vercel.json`, `netlify.toml`, `public/_headers`) does not allow
`api.github.com`. Both defects are independent and either one alone is enough to make every
push/pull fail. This pass added `CLOUD_SYNC_DISABLED` (`apps/web/constants.ts`) and gated the
Settings panel on it, rather than attempting the real fix inline with unrelated P0 work.

A real fix needs, at minimum:

- An authentication model: either a user-supplied fine-grained GitHub PAT (minimal Gist scope,
  encrypted at rest, no token in logs/telemetry/URLs, documented revocation path) or an OAuth
  device flow through a backend this project does not currently have. The backend option is a
  bigger commitment (hosting, secret management, an actual server) that this offline-first,
  no-backend app has deliberately avoided everywhere else -- that tension is itself a decision for
  the maintainer, not an engineering default.
- Adding exactly `https://api.github.com` to `connect-src` in all five places listed above (never a
  broader GitHub-origin wildcard).
- Deciding whether E2EE becomes mandatory for this path rather than opt-in, given the payload is a
  full app-state backup (grow logs, notes, potentially health/diagnosis history) sitting in a Gist
  that is unlisted but not access-controlled.
- Re-verifying the existing conflict-resolution flow (`SyncConflictModal`, `forceLocalToGist`,
  `forceRemoteToLocal`) once auth actually works end to end -- it was never exercised against a real
  authenticated backend.
- Removing `CLOUD_SYNC_DISABLED` and re-enabling `apps/web/tests/e2e/cloud-sync-panel.e2e.ts`'s
  disabled-state assertions once the above lands, replacing them with real push/pull coverage
  (mocked GitHub API, per that test file's existing header comment).

## P2 -- Everything else from the original audit brief not otherwise covered

One line each; none of these were investigated in depth this pass.

- **CSP tightening beyond the Gist origin** -- inventory remaining inline script/style allowances
  and third-party origins; confirm each is still load-bearing.
- **Live-smoke tests as a blocking deploy gate** -- current post-deploy checks on GitHub Pages,
  Vercel, and Cloudflare verify the deployment step succeeded, not that the deployed app actually
  hydrates and functions; making that blocking (not just informational) was flagged as a gap in the
  original audit and not addressed here.
- **Workflow consolidation** -- 28 workflow files exist under `.github/workflows/`; no attempt was
  made to reduce or restructure them in this pass.
- **Cross-platform deployment-identity verification** -- confirming GitHub Pages, Vercel, and
  Cloudflare all serve the same commit SHA after a release was not re-verified this pass.
- **Tauri/desktop hardening** -- native command surface, filesystem access scoping, and CSP inside
  the webview were not reviewed this pass; `@cannaguide/desktop` is excluded from the default build
  and needs the Rust toolchain to even build.
- **v1.10.0 release cut** -- deliberately not attempted. The stale `release/v1.10.0` branch (PR
  #470) was closed as part of this pass specifically so a future release is cut from a `main` that
  actually contains the P0 fixes, not recreated from the stale branch.

## Provenance

This document consolidates findings from three sources: live re-verification against the current
repository and GitHub state (2026-08-05, superseding an earlier 2026-08-04 audit snapshot that had
already drifted in places -- e.g. it referenced PR mergeability states and CI semantics that had
since changed); a paused prior session's WS-C execution plan (2026-07-18, tracked at
`~/.claude/plans/master-prompt-zazzy-leaf.md`, which is machine-local and not otherwise visible to
other contributors -- hence folding its live status in here); and an untracked scratch resume note
(`WS-C-RESUME-TODO.md`, repo root, self-labeled "not for commit, delete when done") whose content is
now fully represented above and has been deleted.

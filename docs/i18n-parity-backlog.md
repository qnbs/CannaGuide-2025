# i18n Parity & Gate-Hardening Backlog

Deferred from the contained i18n key-integrity fixes (branch `fix/i18n-consent-and-orphans`).
That PR fixed the **defects** (consent-modal namespace mismatch, EN-missing `addStrainModal`
placeholder keys, three dangling orphans). This file captures the **larger parity work** that
needs its own comprehensive planning pass — do **not** action these blind; each needs a proper
per-namespace key-set diff first.

## Why the gaps are invisible today

- `apps/web/i18n.ts` sets `fallbackLng: 'en'`, so a key missing in es/fr/nl silently renders the
  **English** string instead of a raw placeholder. Real gaps therefore ship green.
- i18next here registers **one namespace** (`translation`) holding every top-level block
  (`common`, `settingsView`, `strainsView`, …). Components must address keys by full path
  (`t('settingsView.security.…')`), **never** with a `{ ns: '…' }` option — a wrong `ns` returns
  the raw key (this was the consent-modal bug; grep the codebase for `{ ns:` to find any others).

## 1. Missing-key backfill (es / fr / nl)

Counts are approximate (measured by key-token diff vs EN; es/fr/nl format compactly). Translate
to correct cannabis-domain trade terms, not literal English.

| Namespace | Gap (approx.)          | Notes                                                                                                                                                          |
| --------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `help`    | ~217 keys              | No EN spread — genuine fallback. Whole FAQ entries missing (`aeroponicsBasics`, `autoflowerQuality`, `balancedHybrids`, `co2Enrichment`, …).                   |
| `strains` | ~150 keys (es)         | Includes the `cansativa.*` seedbank block + `providers` block, plus scattered nested keys. "Chiefly cansativa" is **overstated** — cansativa is only ~15 keys. |
| `plants`  | ~32 keys (**fr only**) | es/nl are ~complete. `actionModals.*`, `historyChart.events.*`, `detailedView.status.*`, `lifecycle.remaining`, `mediums.*`.                                   |

**REFUTED (do not backfill):**

- `common` (~219 claimed) — es/fr/nl use `...enCommon` spread, so every EN key is present (as
  English values until translated), incl. the `accessibility.*` block. Structurally complete.
- `plants` for es/nl — effectively complete.

## 2. Strain-name catalog directory (es / fr / nl)

en/de have `apps/web/locales/{en,de}/strains/` (27 files `a.ts`–`z.ts` + `numeric.ts`) — the
per-strain display-name catalog. es/fr/nl have **no** `strains/` directory (this is the real
"14 vs 13 files per locale" difference, not a missing UI namespace). Scope the translation/import
strategy before adding — it is 27 data files × 3 locales.

## 3. Gate hardening (stop-and-ask — turns today's hidden gaps red)

Current i18n gates and why they stay green:

- `scripts/check-i18n-completeness.mjs` (tsx) — structural key-set compare, but
  `REQUIRED_LANGS = {'de'}`, so **es/fr/nl are WARN-only** (non-blocking). Runs blocking in
  `ci.yml`, `deploy.yml`, `release-gate.yml` but passes because of the WARN-only langs + the
  `common` spread + DE being complete.
- `scripts/check-i18n-keys-usage.mjs` (tsx) — flags "used in code, missing in EN". **Wired into no
  CI job / no gate:push** — so it never runs. It _would_ have caught the consent-modal bug.
- `scripts/check-i18n-hardcoded.mjs` (node) — hardcoded-JSX heuristic, exit 0 unless
  `CHECK_I18N_STRICT=1`. Wired nowhere.

Proposed hardening (design in the dedicated pass):

1. **Wire `check:i18n-usage` into the `verify` gate** (cheapest high-value win — catches
   used-but-EN-missing keys and the `{ ns:'…' }` mismatch class).
2. Promote es/fr/nl to blocking in completeness **after** the §1 backfill lands (else instant red).
3. Add a **key-name-integrity** check (non-EN key _names_ diverging from EN) and an **orphan-key**
   check (key present in one locale, absent from EN) so the class of bug fixed in the contained PR
   cannot recur silently.
4. Consider an "untranslated value" heuristic (non-EN value byte-identical to EN) to distinguish
   real translations from spread-filled English.

## Reference

- Contained fixes: branch `fix/i18n-consent-and-orphans` (consent modal, placeholders, orphans).
- Related plan: `Documentation-Truth & Gate Hardening` program, WS-I18N section.

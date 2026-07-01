# Repository & Documentation Housekeeping

Checklist for release cuts, audit closures, and periodic maintenance. Run before tagging a release or merging a large audit PR.

---

## 1. Metrics sync

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/v24.16.0/bin:$PATH"
pnpm run docs:sync-metrics        # updates README, ARCHITECTURE, CI-AUDIT, copilot-instructions
```

Manual verification:

- Strain count in `apps/web/data/strains/catalog-version.json`
- CI workflow count in `.github/workflows/` (see `.github/workflows/README.md`)

---

## 2. Quality gates

```bash
pnpm run typecheck
pnpm run lint:changed
pnpm run lint:scopes
pnpm run build
pnpm --filter @cannaguide/web test:run    # full suite (~3 min)
pnpm run strains:check-integrity
pnpm audit --audit-level=critical --prod
```

---

## 3. Documentation drift

| Doc                             | Check                                         |
| ------------------------------- | --------------------------------------------- |
| `CHANGELOG.md`                  | Unreleased section reflects this PR           |
| `ROADMAP.md`                    | v1.9.x status matches shipped work            |
| `docs/AUDIT_BACKLOG.md`         | No stale open checkboxes for done items       |
| `docs/audits/AUDIT-REPORT-*.md` | Severity table matches code state             |
| `AGENTS.md`                     | Node 24 PATH, React versions, dev commands    |
| `SECURITY.md`                   | `pnpm.overrides` table matches `package.json` |
| `CONTRIBUTING.md`               | Strain encyclopedia section current           |
| `docs/api/README.md`            | New service modules linked                    |

---

## 4. Architecture & ADRs

- New cross-cutting patterns → `docs/adr/` (use `docs/adr/template.md`)
- Settings / data-management changes → `docs/api/settings-modules.md`
- State bridge changes → ADR-0015 + `uiStateBridge.test.ts`

---

## 5. God-file budget

```bash
pnpm run check:file-budget
```

Target: **≤700 LOC** per view/service file (grandfathered exceptions documented in `scripts/check-file-budget.mjs`).

Resolved in v1.9.0 cycle: `BreedingLab.tsx`, `GenealogyView.tsx`, `StrainDetailView.tsx`, `dbService.ts` (→ `services/db/*`), `GrowRoom3D.tsx`, `pdfReportService.ts`, `simulationSlice.ts`, `SettingsView.tsx`, and related view splits.

Grandfathered (warn only, see `scripts/check-file-budget.mjs`): `workerBus.ts` (1193 LOC), `geminiService.ts`, `plantSimulationService.ts`.

---

## 6. CI / security housekeeping

- [ ] Actions on `main` green (Quality + Security required)
- [ ] Dependabot / `pnpm audit` reviewed (non-critical dev transitive accepted with rationale in `SECURITY.md`)
- [ ] Gitleaks / Semgrep / CodeQL — no new findings on changed paths

---

## 7. Post-merge

1. Watch [GitHub Actions](https://github.com/qnbs/CannaGuide-2025/actions) on `main` until CI Status passes.
2. Update `docs/audits/AUDIT-CLOSURE-*.md` if this was an audit release.
3. Optional: `pnpm run changelog:latest` for version tag prep.

---

## Related

- [AUDIT-CLOSURE-2026-06-29.md](audits/AUDIT-CLOSURE-2026-06-29.md)
- [AUDIT-REPORT-2026-06-29.md](audits/AUDIT-REPORT-2026-06-29.md)
- [GITHUB-SETTINGS-GUIDE.md](GITHUB-SETTINGS-GUIDE.md) — Rulesets, RELEASE_PAT, Agent limits
- [release-process.md](release-process.md)

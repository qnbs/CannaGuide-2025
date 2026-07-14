# UI/UX Perfection 2026-Q3 -- A-04 + A-05

Closes the two remaining **UI/UX** items of the 2026-07-02 full audit
([AUDIT-REPORT-2026-07-02-FULL.md](audits/AUDIT-REPORT-2026-07-02-FULL.md) §5).
Everything else still open in that backlog is Testing/CI (A-02, A-03, A-06) or P3 roadmap
(A-10 -- A-12), not UI/UX.

Date: 2026-07-14

---

## A-04 -- Recharts chart accessibility

### The gap

15 charts across 8 files. `accessibilityLayer` -- the Recharts feature that makes a chart
focusable and arrow-key navigable -- was used **nowhere in the repo**, although the installed
version (3.9.2) has supported it since 2.10. Four charts carried a copy-pasted
`role="img"` + `aria-label`; the other four files had no accessibility affordances at all.
No chart exposed its data in any form a screen reader could read.

### The fix

New shared wrapper: `apps/web/components/common/AccessibleChart.tsx`. Three mechanisms, and
they only work together:

1. **`<figcaption>` names the figure** -- deliberately _not_ `role="img"` on the container.
   `role="img"` marks all descendants as presentational, which would silently defeat
   `accessibilityLayer`. The two measures are mutually exclusive; the old `role="img"`
   wrappers were the weaker half of the pair.
2. **`accessibilityLayer` on every chart root** -- keyboard navigation through the data points.
3. **A visually hidden `<table>`** of the plotted series -- the actual numbers, for readers
   that cannot interpret a plot at all. Generalized from the visible table that already sat
   beside the strain-performance chart in `AnalyticsDashboardView.tsx`.

Charts that already render the same numbers in a _visible_ table pass `omitDataTable` rather
than duplicating them (`StrainComparisonView`, strain performance in `AnalyticsDashboardView`).

### Migrated

| File                                                                   | Charts                            |
| ---------------------------------------------------------------------- | --------------------------------- |
| `components/views/plants/VPDChart.tsx`                                 | LineChart                         |
| `components/views/plants/ComparisonView.tsx`                           | LineChart                         |
| `components/views/plants/analytics/EnvironmentDashboard.tsx`           | 3x ComposedChart                  |
| `components/views/plants/detailedPlantViewTabs/MetricsOverviewTab.tsx` | LineChart                         |
| `components/views/equipment/hydro/HydroChartPanel.tsx`                 | LineChart                         |
| `components/views/strains/StrainComparisonView.tsx`                    | RadarChart                        |
| `components/views/strains/strainLookup/charts.tsx`                     | PieChart, RadarChart, 2x BarChart |
| `components/views/knowledge/AnalyticsDashboardView.tsx`                | PieChart, 2x AreaChart, BarChart  |

### Note on `CHART_MARGIN`

The plan called for deduplicating the `CHART_MARGIN` constant declared in two views. On
inspection the two declarations hold **different values** (`{top:12,right:8,left:0,bottom:6}`
vs `{top:8,right:12,left:0,bottom:0}`), so merging them would have silently shifted chart
margins. Each view keeps its own; `AccessibleChart` exports the former as the default for new
charts.

---

## A-05 -- 3D room keyboard navigation

### Scope correction

A-05's acceptance criterion was "full keyboard control of **equipment placement**". That
feature does not exist. `GrowRoom3D.tsx` is a read-only three.js visualization with
`OrbitControls` (`enablePan = false`) that dispatches nothing, and the equipment model
(`types/schemas.ts`) is an AI recommendation list carrying **no coordinates**. There is no
placement to make keyboard-accessible.

The real defect was narrower and worse: the `<canvas>` had **no `tabIndex`**, so the 3D room
was unreachable by keyboard entirely. Equipment placement is now tracked separately as
**A-13** (a feature, not an a11y fix).

### The fix

In `apps/web/components/views/plants/GrowRoom3D.tsx`:

- `tabIndex={0}` + `role="img"` + a visible focus ring -- the canvas is now reachable by Tab.
- Keyboard camera control: **arrow keys** orbit, **`+` / `-`** dolly, **`Home`** resets the
  framing. Implemented against the existing `controlsRef` / `cameraRef` via
  `THREE.Spherical`, honouring the `minDistance` / `maxDistance` / `maxPolarAngle` limits
  OrbitControls already enforces for the pointer path.
- Keyboard use sets the same `userInteractedRef` flag as pointer use, so it stops auto-orbit
  identically.
- `aria-describedby` points at a screen-reader-only hint, so the controls are discoverable.
  Key `plantsView.growRoom3d.keyboardHint`, translated in all 5 locales.

---

## Verification

- `pnpm --filter @cannaguide/web typecheck` -- clean.
- `pnpm --filter @cannaguide/web test:run AccessibleChart` -- 7 tests covering the
  accessibility contract (figure naming, conditional `aria-describedby`, one table column per
  series, one row per data point, formatter application).
- e2e a11y (`accessibility.deploy.e2e.ts`) previously ran axe against the landing view only,
  leaving every other view unscanned; it now also scans the strains view. Note this does not
  guarantee a chart is on screen -- the deploy target has no seeded user data, so most charts
  do not render there. The `AccessibleChart` contract is covered by the unit test above, not
  by axe. Runs in CI, not locally.

### A trap worth recording

`pnpm --filter @cannaguide/web test:run -- <spec>` resolves to `vitest run -- <spec>`. The `--`
swallows the file filter, so vitest runs the **entire suite** -- measured here at >6 min and
~635 MB RSS, which is exactly how a 4 GB dev box slides into an OOM. Drop the `--`:

```bash
pnpm --filter @cannaguide/web test:run <spec>   # 1 file, 21 s
```

A scoped run is only scoped if the summary says `Test Files 1 passed (1)`.

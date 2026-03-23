# Sonar Handoff TODO (Update 2026-03-23 — Session Close)

<!-- markdownlint-disable MD007 -->

## Session-Update 2026-03-23 (SonarCloud QG + Scorecard + Admin Hardening)

### SonarCloud Quality Gate Status

- Security: A (0) (ok)
- Reliability: B (49 issues) (!) — erfordert Dashboard-Inspektion
- Maintainability: A (354 code smells)
- Hotspots Reviewed: E (0.0%) (FAIL) — manuelles Review im SonarCloud-UI noetig
- Coverage: 22.8% (sonar.coverage.exclusions jetzt konfiguriert)
- Duplications: 1.8%

### In dieser Runde erledigt (2026-03-23)

- **S2245 (Weak PRNG):** ALLE 15 `Math.random()`-Stellen durch `secureRandom()` ersetzt (crypto.getRandomValues). Betroffen: breedingUtils.tsx, TipOfTheDay.tsx, DeepDiveModal.tsx, imageGenerationService.ts, plantSimulationService.ts, localAiPreloadService.ts, geminiService.ts, strainFactory.ts, localAiFallbackService.ts. Neues Utility: `utils/random.ts`.
- **S2245 (IDs):** `nutrientPlannerSlice.ts` Math.random() → crypto.randomUUID()
- **S5852 (ReDoS):** `commandService.ts` fuzzy-Regex mit 64-Zeichen-Limit abgesichert
- **sonar-project.properties:** `sonar.tests` korrigiert (Inline-Tests), `sonar.test.inclusions` fuer fuzz-Tests, `sonar.coverage.exclusions` fuer data/types/workers/locales/public
- **Dockerfile:** `apk upgrade` fuer zlib-CVE-Fix
- **CodeQL Default Setup:** Extended Query Suite aktiviert (JS/TS + Actions)
- **OpenSSF Scorecard:** 8.5/10 (11 Checks auf 10/10)

### Naechste Schritte fuer SonarCloud

1. **Hotspots reviewen:** Alle Security Hotspots im SonarCloud-UI durchgehen und als Safe/Fixed markieren
2. **Reliability B:** 49 Bug-Issues im Dashboard inspizieren — wahrscheinlich Non-null-Assertions, unreachable Code, etc.
3. **Coverage erhoehen:** Neue Tests fuer services/ und stores/ (Ziel: >30%)

---

## Session-Close Update (2026-03-22)

Seit dem letzten Zwischenstand wurden zusaetzlich abgeschlossen:

- `components/views/strains/StrainListItem.tsx` (Interaktionshaertung)
- `components/views/strains/StrainGridItem.tsx` (Interaktionshaertung)
- `.husky/pre-push`, `scripts/prettier-check-changed.mjs`, `package.json` (zus. Push-Gates: lint-changed, typecheck, test:changed, prettier:check:changed)
- `styles.css` (Checkbox-Checkmark-Rendering-Fix)
- `components/common/DataExportModal.tsx` (zusaetzlicher Confirm-Schritt fuer Export)
- `components/views/strains/ExportsManagerView.tsx` (Confirm vor Download)
- `components/views/settings/DataManagementTab.tsx` (Confirm vor Full-Backup-Export)
- `locales/en/common.ts`, `locales/de/common.ts` (downloadConfirm)
- `.devcontainer/devcontainer.json` (`rg`-Installation beim Container-Setup)
- `scripts/check-commit-identity.mjs`, `package.json` (praeventiver Committer-/Signing-Gate im pre-push Stack)

Abschluss-Commits:

- `11e85bd`
- `83b2d25`

Basis: neue Sonar-Liste aus dem letzten Nutzerblock (100 von 172 angezeigt).
Prioritaet: Major/Critical zuerst, dann Minor-Konventionen.

## A. In dieser Runde bereits erledigt (aus TODO entfernt)

- components/common/Card.tsx
- components/common/CommandPalette.tsx
- components/common/SegmentedControl.tsx
- components/common/Tabs.tsx
- components/views/PlantsView.tsx (Ternary/Key-Refactor gestartet)
- components/views/equipment/SaveSetupModal.tsx
- components/views/equipment/SeedbanksView.tsx
- components/views/equipment/SetupConfigurator.tsx
- components/views/help/HelpSubNav.tsx
- components/views/knowledge/BreedingArPreview.tsx
- components/views/knowledge/GuideView.tsx (Teilfix)
- components/views/knowledge/MentorArchiveTab.tsx
- components/views/plants/AiDiagnosticsModal.tsx
- components/views/plants/App.tsx
- components/views/settings/DataManagementTab.tsx
- hooks/useStorageEstimate.ts

## B. Neu aufgenommener Rest-Backlog aus letzter Nutzerliste

Ergaenzung 2026-03-22 (neu ingestierter Workspace-Scan, dedupliziert gegen erledigte Punkte):

- `services/ttsService.ts`: erledigt (readonly synth Initialisierung direkt am Feld, Konstruktor vereinfacht)
- `services/growReminderService.ts`: erledigt (Zeitparser ohne NaN-Defaults, stricte Guard-Validierung)
- `services/plantSimulationService.ts`: verbleibende Lesbarkeits-/Komplexitaets-Smells in langen Number.isFinite-Bloecken clustern
  Statusupdate: nullish-Fallbacks (`||` -> `??`) in Stress-Countern, Substrat-RH-Zweig und Projection-State vereinheitlicht.
  Statusupdate 2: zentrale finite-Helper eingefuehrt und in Environment/Medium/NutrientPool/RootSystem-Normalizern angewendet.
- `components/views/settings/DataManagementTab.tsx`: erledigt (parsed-Guard nullish-safe/typed normalisiert)
- `components/views/strains/StrainGridItem.tsx`: erledigt (native overlay button statt role/tabindex div)
- `components/views/strains/StrainListItem.tsx`: erledigt (native overlay button statt role/tabindex div)
- `stores/slices/genealogySlice.ts`: erledigt (`Number.isFinite` vereinheitlicht)
- `stores/slices/settingsSlice.ts`: erledigt (DOM-Cleanup via `remove`)

1. Common / Accessibility / Lesbarkeit

- components/views/equipment/SeedbanksView.tsx: Restpruefung nach Teilfix
- components/views/settings/SettingsSubNav.tsx: erledigt (tabIndex auf tablist)
- components/views/strains/StrainToolbar.tsx: erledigt (native select/option)

1. Plants-Views Cluster

- components/views/plants/DashboardSummary.tsx: erledigt
- components/views/plants/HistoryChart.tsx: erledigt (Set.has)
- components/views/plants/PlantLifecycleTimeline.tsx: erledigt
- components/views/plants/PlantSlot.tsx: erledigt
- components/views/plants/SensorIntegrationPanel.tsx: erledigt
- components/views/plants/detailedPlantViewTabs/JournalTab.tsx: teilweise erledigt (Filter-Classname-Block)
- components/views/plants/detailedPlantViewTabs/PhotosTab.tsx: erledigt
- components/views/plants/detailedPlantViewTabs/SimulationDebugTab.tsx: erledigt

1. Knowledge / Help Cluster

- components/views/knowledge/GuideView.tsx: optional chaining/nested template literal Reststellen
- components/views/knowledge/MentorView.tsx: teilweise erledigt (Set.has umgesetzt)
- components/views/knowledge/BreedingArPreview.tsx: Restcheck

1. Strains Cluster (groesserer Block)

- components/views/strains/AddStrainModal.tsx: erledigt (Regex entkoppelt)
- components/views/strains/BreedingLab.tsx: erledigt (nested ternary/class branching)
- components/views/strains/GenealogyView.tsx: erledigt (Number.isFinite + branch guard)
- components/views/strains/InlineStrainSelector.tsx: erledigt (ternary class extraction)
- components/views/strains/StrainImageGalleryTab.tsx: erledigt (A11y interactive/non-interactive)
- components/views/strains/StrainImageGenerator.tsx: erledigt (button branching)
- components/views/strains/StrainLibraryView.tsx: erledigt (main content branching)
- components/views/strains/StrainTipsView.tsx: erledigt (reduce-assignment + toSorted)
- components/views/strains/StrainTreeNode.tsx: erledigt (aria-selected)
- components/views/strains/StrainsView.tsx: nested ternary (2x)
- components/views/strains/StrainsView.tsx: erledigt (export source + onDelete branching)

1. Hooks / Services Cluster

- hooks/useDocumentEffects.ts: erledigt (nested ternary entkoppelt)
- hooks/useFocusTrap.ts: erledigt (else-if Normalisierung)
- services/chemotypeService.ts: erledigt (toSorted)
- services/cryptoService.ts: erledigt (Error-Objekte bei rejection)
- services/dbService.ts: erledigt (Error-Objekte + reduce initial value)
- services/entourageService.ts: erledigt (THC/CBD ratio branching)
- services/exportService.ts: teilweise erledigt (removeChild -> remove), nested template literals offen

## C. Nächste Welle (konkret)

1. JournalTab Reststellen (remaining nested-template-literal Hinweise) und MentorView nested-template-literal: teilweise erledigt (Maintainability/Lesbarkeit bereinigt, Rest nur nach neuem Sonar-Run validieren)
1. Strains-Cluster Rest: aktuell kein konkreter offener Punkt aus den priorisierten Dateien
1. Klick-Regression Strains-Detailansicht: erledigt (List/Grid-Selektionspfad repariert, TreeNode-Layering gehaertet, zwei Regressionstests hinzugefuegt)
1. Zusatz-Regressionstestlauf Plants/Settings/Strains: erledigt (20/20 Tests gruen, keine neuen Overlay-Click-Risiken im Scan)
1. Zusatzblock Hook/Service-Komplexitaet: erledigt (useSimulationBridge, localAiFallbackService, geminiService)
1. services/exportService nested-template-literal Block komplettieren: erledigt
1. SeedbanksView Restpruefung und GuideView Reststellen: erledigt

## F. Aktueller Restfokus

### F0. Neu ingestierter Security-Hotspot-Block (26 To-Review)

Quelle: aktueller Sonar-Hinweisblock des Nutzers (Review priority: Medium).

- S5852 DoS (regex runtime/backtracking): 7 Hotspots
- S2245 Weak Cryptography (PRNG): 19 Hotspots

Status dieser Sitzung (bereits umgesetzt):

- `components/views/strains/AddStrainModal.tsx` -> regex-Split entfernt (lineares CSV-Parsing).
- `services/geneticsService.ts` -> regex-basierte Parent-/Canonical-Parser durch String-Parsing ersetzt.
- `stores/listenerMiddleware.ts` -> Assistant-Regex durch prefixbasiertes Parsing ersetzt.
- `components/views/plants/GrowRoom3D.tsx` -> `Math.random` im Partikel-Setup durch WebCrypto ersetzt.

Reststrategie fuer verbleibende Hotspots:

1. S2245-Clusterung nach Sicherheitskontext:

- sicherheitsrelevant (IDs/Secrets/Token): sofort auf `crypto.randomUUID`/`crypto.getRandomValues` migrieren.
- nicht sicherheitsrelevant (reine UI-/Animationszufaelle): Review-Dokumentation + ggf. akzeptieren.
- Simulationszufall: ggf. seeded PRNG fuer Reproduzierbarkeit statt ad-hoc Random.

1. S5852-Clusterung nach Regex-Typ:

- regex-Splits ersetzen (delimiter-parser ohne backtracking).
- greedy/unbounded patterns (`.*`) in bounded oder indexbasierte Operationen ueberfuehren.

1. Abschluss je Hotspot: Sonar-Reviewentscheid (Fix/Accept) + kurze Begruendung im Handoff.

1. Sonar neu laufen lassen und verbleibende Issues gegen den aktuellen Branchstand neu clustern.
1. GenealogyView-Cluster als naechsten Entry-Point abarbeiten (Smells + ggf. Tests).
   Statusupdate: erste Welle erledigt (Decision-Logik in `genealogyViewUtils.ts` extrahiert, nested branchings reduziert, Regressionstest `genealogyViewUtils.test.ts` hinzugefuegt).
1. Plants UI-Smells Cluster fortsetzen (insb. interaction/readability in detail tabs).
   Statusupdate: `JournalTab.tsx` und `OverviewTab.tsx` in einer low-risk Welle bereinigt (Details-Reliability bei numerischen Nullwerten, unnötige Type-Assertion entfernt).
1. db/crypto reliability smells fortsetzen (error-normalization, recovery guards).
   Statusupdate: `cryptoService.ts` Decrypt-/Legacy-Migration gegen malformed payloads gehaertet; `growLogRagService.ts` nullish-sicheres Details-Stringifying umgesetzt.
   Statusupdate 2: `dbService.ts` Query/Search-Guards gehaertet (fehlender Index -> leeres Ergebnis statt Throw, token-scan Fehler liefert deterministisches leeres Set).
   Statusupdate 3: weitere Reliability-Haertung + Testabdeckung abgeschlossen:
    - `cryptoService.ts` BufferSource-Typisierung fuer WebCrypto gehaertet.
    - `dbService.ts` unsafe casts in Search-/Entity-Pfaden reduziert.
    - neue Testdateien `services/cryptoService.test.ts` und `services/dbService.test.ts` mit Error-/Fallback-Pfaden hinzugefuegt.
    - zusaetzliche Abdeckung fuer `searchIndex` Cursor-Error, `addImage` Warnschwelle/Compression-Fallback, `optimizeSimulationForPersistence` Archivierung, `getArchivedPlantLogs` unknown plant.
      Statusupdate 4: service-cluster ausserhalb db/crypto weiter abgesichert (low-risk tests):
    - `services/aiLoadingMessages.test.ts`
    - `services/consentService.test.ts`
    - `services/ttsService.test.ts`
    - `services/syncService.test.ts`
    - `services/communityShareService.test.ts`
    - `services/imageService.test.ts`
    - `services/sentryService.test.ts`
      Verifikation: 10 Service-Testdateien in Sammellauf, 49/49 Tests gruen.
1. Vor jedem Push verbindlich: `npx prettier --check` auf dem geaenderten Stapel, plus `node scripts/lint-changed.mjs` und `npx tsc --noEmit`.

## G. Strategischer Plan fuer neue Sonar-Liste (432 Issues, Stand 2026-03-22)

1. Phase 0: Baseline + Safety-Net

- vorhandene lokale Regressionstests als Gate beibehalten (plants/settings/strains)
- pro Cluster: lint + tsc + betroffene Test-Suite + prettier-check

1. Phase 1: High-Value Low-Risk (Common/UI-Foundation)

- `globalThis`/`globalThis.window` Portability-SmelIs in common/plants/settings beseitigen
- deprecated APIs in UI-Primitives: `ElementRef` (dialog/select) ersetzen
- deprecated DOM API `document.execCommand` in EditResponseModal ersetzen (Clipboard API + Fallback)
- offensichtliche redundant assertions und negated-condition readability in common/help/plants aufloesen

Status Phase 1 (aktueller Stand):

- erledigt in diesem Batch:
    - `ElementRef` -> `ComponentRef` in `components/ui/dialog.tsx` und `components/ui/select.tsx`
    - redundante Assertions in `components/common/RangeSlider.tsx`, `components/common/SearchBar.tsx`, `components/views/plants/detailedPlantViewTabs/PostHarvestTab.tsx`
- offen naechst:
    - erledigt: `App.tsx`, `GrowReminderPanel.tsx`, `CloudSyncPanel.tsx`, `BreedingArPreview.tsx`, `GrowRoom3D.tsx`
    - `document.execCommand`-Ablösung in `components/common/EditResponseModal.tsx` ist im aktuellen Code nicht mehr vorhanden

1. Phase 2: Accessibility- und Reliability-Majors zuerst

- `components/common/Tabs.tsx`: non-interactive event listener -> semantisch interaktiv
- `components/common/CameraModal.tsx`: `<video>` caption-track-Anforderung sauber adressieren

Status Phase 2 (aktueller Stand):

- erledigt in diesem Batch:
    - `components/common/Tabs.tsx` A11y-Interaktion korrigiert
    - `components/common/CameraModal.tsx` Caption-Track ergänzt

1. Phase 3: Equipment-/Knowledge-Cluster

- regex `.match` -> `RegExp.exec`, `replace` -> `replaceAll`, duplizierte imports konsolidieren
- stringification-Risiken bei Error-Messages durch sichere Normalisierung beheben

1. Phase 4: Plants-Deep-Cluster

- `window`-Nutzung, deprecated Optionen (`includeMargin`) und `.at(...)` Empfehlungen
- verbleibende minor readability/type issues in detailed tabs

1. Phase 5: Abschluss + Push-Batch

- nur bei commit/push: Handoff-Review + TODO mit finalem Delta aktualisieren
- finaler Gate: changed-lint + tsc + relevante Tests + prettier-check + git diff review

## D. Validierung je Welle

- npx tsc --noEmit
- node scripts/lint-changed.mjs
- Diagnostics-Check der geaenderten Dateien

## E. Abschlusskriterien

- Sonar-Issues der jeweiligen Welle auf erledigt gesetzt
- keine neuen Type- oder Lint-Fehler
- keine regressiven Keyboard-/Fokusprobleme in UI-A11y-Fixes

## H. Security Alert Queue (Dependabot + CodeQL, Stand 2026-03-22)

### H1. Dependabot-Queue (vom Nutzerblock uebernommen)

- #9 Serialize JavaScript is Vulnerable to RCE via RegExp.flags and Date.prototype.toISOString() (high)
- #11 fast-xml-parser numeric entity expansion bypass (high)
- #4 Got allows a redirect to a UNIX socket (moderate)
- #13 fast-xml-parser entity expansion limits bypass via falsy evaluation (moderate)
- #7 esbuild dev server request exposure (moderate)
- #8 tmp symlink temp file write (low)

### H2. CodeQL-Queue (vom Nutzerblock uebernommen)

- #146/#145 Incomplete URL substring sanitization in sw.js/public/sw.js
- #13/#12 Incomplete URL substring sanitization in sw.js/public/sw.js (aeltere Duplikate)
- #6 Prototype-polluting function in services/migrationLogic.ts
- #144/#143/#142/#141/#140 Insecure randomness in dist/assets/\* (generated output)

### H3. Umsetzungsstatus dieser Sitzung

- Erledigt: `sw.js` und `public/sw.js` auf strikte Protokoll-Allowlist (`http:`/`https:`) umgestellt.
- Erledigt: `services/migrationLogic.ts` (`deepMergeSettings`) mit geharteter Key-Filterung fuer `__proto__`/`constructor`/`prototype` + sicherem Rekursionspfad aktualisiert.
- Erledigt: verwundbare Build-Transitivkette entfernt durch Ausbau von `vite-plugin-imagemin` aus `vite.config.ts` und `package.json`.
- Erledigt: Security-Overrides gesetzt (`serialize-javascript=7.0.4`, `tmp=0.2.5`) und Lockfile neu aufgeloest.
- Erledigt: CodeQL workflow `paths-ignore` auf rekursive Muster gehaertet (`dist/**`, `node_modules/**`, `coverage/**`, `test-results/**`, `.stryker-tmp/**`).

### H4. Verifikation dieser Sitzung

- `npm audit --json`: 0 vulnerabilities
- `npx tsc --noEmit`: erfolgreich
- `node scripts/lint-changed.mjs`: erfolgreich
- `npx vitest run services/migrationLogic.test.ts`: 10/10 gruen

### H6. Finaler Queue-Status (2026-03-22, nach Folgewellen)

- Dependabot Alerts (`state=open`): 0
- Code Scanning Alerts (`state=open`): 0

Hinweis zur Schliessung:

- offene Legacy-Alerts aus altem Analyse-Commit wurden nach Verifikation gegen aktuellen `main` als veraltet/superseded geschlossen.
- aktive Alerts wurden zuvor technisch behoben (SW origin/message checks, worker message checks, merge hardening, script hardening).

### H5. Naechste Ausfuehrungsschritte (Pflicht)

1. CodeQL-Workflow auf `main` erneut laufen lassen, damit offene historische Alerts automatisch auf `fixed` wechseln.
1. Dependabot-Alert-Ansicht auf neue Baseline synchronisieren (Lockfile ist bereits bereinigt).
1. Falls Restalerts verbleiben: einzelne Alert-ID gegen aktuellen Commit hash neu triagieren und nur noch echte Treffer in Cluster aufnehmen.

<!-- markdownlint-enable MD007 -->

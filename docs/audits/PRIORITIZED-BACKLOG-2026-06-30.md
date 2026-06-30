# CannaGuide 2025 — Priorisierter Backlog (Stand: 30.06.2026)

**Basis:** [`AUDIT-REPORT-2026-06-29.md`](./AUDIT-REPORT-2026-06-29.md) + unabhängige Verifikation der God-File-/Critical-Path-/Compliance-Befunde am 30.06.2026.
**Status-App:** v1.8.2 (`main`). Keine offenen P0-Security-Findings.
**Zweck:** Umsetzungsfertiger Backlog (Issue-Vorlagen) für Stufe-1/Stufe-2-Maßnahmen mit konkreten Refactoring-Vorschlägen, Test-Plan für Critical Paths und Disclaimer-/Privacy-Texten.

> Verifizierte Fakten (30.06.2026): Die genannten God-Files existieren und überschreiten das 700-LOC-Budget (`scripts/check-file-budget.mjs`, `MAX_LINES = 700`). `plantSimulationService.ts` ist mit **371 LOC** bereits unter Budget (Audit-Eintrag veraltet). Coverage-Schwellen in `apps/web/vite.config.ts`: lines 42 % / functions 39 % / branches 25 % / statements 35 %.

---

## Sofort umgesetzt in diesem PR (Teil von Stufe 2 #5)

**Einheitliche KI-Disclaimer** über alle KI-Oberflächen. Neue, wiederverwendbare Komponente `apps/web/components/common/AiDisclaimer.tsx` (i18n via `ai.disclaimer`, optional `legal.medicalDisclaimer`) eingebunden in zuvor disclaimer-lose Flächen:

- `components/views/equipment/AiEquipmentPanel.tsx` (Cloud-KI-Equipment-Empfehlung)
- `components/views/plants/LeafDiagnosisPanel.tsx` (lokaler ONNX-Blatt-Scanner)
- `components/views/strains/StrainImageGenerator.tsx` (lokale Bildgenerierung)
- `components/views/plants/detailedPlantViewTabs/AiTab.tsx` (proaktive Diagnose-Karte)

Damit ist der Befund „uneinheitliche/fehlende KI-Disclaimer" geschlossen; künftige KI-Flächen nutzen dieselbe Komponente.

---

## Stufe 1 — höchste Priorität

### P1-1 — Coverage-Sprint auf Critical Paths
**Problem:** Branch-Coverage projektweit ~25 %; Kernpfade (KI, Sicherheit, Sync, Simulation, Diagnose) unzureichend abgesichert → hohes Regressionsrisiko.
**Zielpfade (verifizierte Pfade/Größen):**
| Service | Pfad | LOC |
|---|---|---|
| aiFacade | `apps/web/services/aiFacade.ts` | 41 (Barrel) |
| safetyPipeline | `apps/web/services/ai/safetyPipeline.ts` | 150 |
| syncEncryptionService | `apps/web/services/syncEncryptionService.ts` | 94 |
| plantSimulationService | `apps/web/services/plantSimulationService.ts` | 371 |
| diagnosisService | `apps/web/services/local-ai/vision/diagnosisService.ts` | 353 |

**Ziel:** ≥ 80 % Lines/Functions auf diesen Dateien; danach Coverage-Floors in `vite.config.ts` schrittweise anheben (Roadmap-Ziel 50/50/35/50).
**Test-Plan:** siehe Abschnitt „Critical-Path-Test-Plan" unten.
**Akzeptanz:** `pnpm --filter @cannaguide/web test:coverage` zeigt ≥ 80 % für die fünf Pfade; CI-Floors angehoben.

### P1-2 — God-Files refaktorisieren (≤ 700 LOC)

> **Status 30.06.2026 (dieser PR):** 5 große Views aufgesplittet und je manuell verifiziert:
> `BreedingLab.tsx` 1198→94 · `GenealogyView.tsx` 1074→644 · `StrainDetailView.tsx` 1056→196 · `CalculatorHubView.tsx` 1511→124 · `StrainLookupSection.tsx` 1211→401 LOC (alle ≤700, Logik in Hooks/Sub-Module ausgelagert). **Verbleibend:** `workerBus.ts` (1193), `dbService.ts` (927), `pdfReportService.ts` (923), `GrowRoom3D.tsx` (848), `simulationSlice.ts` (834) — Service-/Slice-Splits, höheres Risiko, als eigene Follow-ups.

**Verifizierte Top-Offender (LOC, ursprünglich):**
`CalculatorHubView.tsx` (1511), `StrainLookupSection.tsx` (1211), `BreedingLab.tsx` (1198), `workerBus.ts` (1193), `GenealogyView.tsx` (1074), `StrainDetailView.tsx` (1056), `dbService.ts` (927), `pdfReportService.ts` (923), `GrowRoom3D.tsx` (848), `simulationSlice.ts` (834).

> Hinweis: Das Audit nennt `knowledgeGraphService.ts` (777), übersieht aber größere Offender (`CalculatorHubView.tsx`, `StrainLookupSection.tsx`, `pdfReportService.ts`, `simulationSlice.ts`). Diese sind im Backlog ergänzt.

**Refactoring-Muster (pro View):**
1. **Reine Logik in Hooks** auslagern: z. B. `BreedingLab.tsx` → `useBreedingLab()` (State/Reducer, Cross-Berechnung, Persistenz) + Präsentations-Subkomponenten `BreedingParentPicker`, `BreedingResultPanel`, `PunnettGrid`.
2. **Tabellen/Listen** als memoisierte Subkomponenten extrahieren (bereits gutes Vorbild: `RecommendationTable` in `AiEquipmentPanel.tsx`).
3. **Schwere Renderer isolieren**: `GenealogyView.tsx` → D3-Tree-Renderer (`GenealogyTreeCanvas`) von Daten-/UI-Logik trennen; `GrowRoom3D.tsx` → Three.js-Szene in `GrowRoom3DScene` + Steuerung in `useGrowRoom3D`.
4. **Service-Splits** entlang Verantwortlichkeiten: `dbService.ts` → `db/{schema,migrations,plantRepo,strainRepo,queries}.ts`; `workerBus.ts` → Transport vs. Message-Registry vs. Typen.

**Beispiel (BreedingLab, Skizze):**
```
components/views/strains/breeding/
  BreedingLab.tsx          (~200 LOC: Layout + Komposition)
  BreedingParentPicker.tsx
  BreedingResultPanel.tsx
  PunnettGrid.tsx
hooks/useBreedingLab.ts    (State, Aktionen, Selektoren)
```
**Akzeptanz:** `pnpm run check:file-budget` ohne neue Überschreitungen; Verhalten via vorhandener Tests + neue Subkomponenten-Tests unverändert.

### P1-3 — Local-AI Mobile/Battery UX & Safeguards
- Modellgrößen-/Download-Warnung + Progress-UI (Teil vorhanden in `LeafDiagnosisPanel`).
- Persistenter Status-Chip für aktiven Provider/Fallback.
- Default Eco-Mode bei < 25 % Akku inkl. Hysterese gegen Flattern.
- Robuste Error-Recovery bei Inferenz-Fehlern.
- Real-Device-Tests (Mid/Low-End Phones/Tablets).
**Akzeptanz:** Eco-Mode greift automatisch < 25 % und schaltet erst > 35 % zurück; Status-Chip dauerhaft sichtbar; manueller Test auf mind. einem Low-End-Gerät dokumentiert.

---

## Stufe 2 — hohe Dringlichkeit (1–2 Wochen)

### P2-1 — CRDT Conflict-Resolution-UI
Konflikt-Modal/Notification bei Gist-Sync-Divergenz. Vorhandenes `SyncConflictModal.tsx` (+Test) prüfen und in `syncService`/`crdtSyncBridge` verdrahten. **Akzeptanz:** Erzwungener Konflikt zeigt UI mit „lokal behalten / remote übernehmen / zusammenführen".

### P2-2 — Rechtliche/Compliance-Härtung
- **Erledigt (dieser PR):** einheitliche KI-Disclaimer; Privacy-Policy-Modal aus `Settings → About` erreichbar gemacht (lokaler State in `AboutTab`, vorher toter Einstieg).
- **Offen:** „Mehr erfahren"-Link im Onboarding-Legal-Step; In-App-Consent-Widerruf (`consentService.revokeConsent()`).
- Per-Provider-AI-Consent (`aiConsentService`) tatsächlich vor Cloud-Calls erzwingen (Service + i18n vorhanden, UI-Enforcement fehlt).
- Disclaimer-/Privacy-Texte: siehe Abschnitt unten.

### P2-3 — Strain-Daten-Strategie & Integrität
ADR für Versionierung + Update-Prozess (CI-Job/kontrollierte Community-PR). `strains:check-*`-Skripte regelmäßig + Duplikat-Checks härten.

### P2-4 — a11y-Warnings reduzieren (Ziel WCAG 2.2 AA)
Fokus: Charts, dynamische Inhalte, Modals.

---

## Stufe 3 — operativ/kurzfristig
- `pnpm run security:scan` + `pnpm audit`: verbleibende Findings priorisiert beheben (Overrides wo sinnvoll).
- Deployment konsolidieren (Vercel primär), andere Hosts sauber pausieren/archivieren.
- Contributor-Onboarding vereinfachen; `CONTRIBUTING.md`/`AGENTS.md` aktualisieren.
- Desktop (`apps/desktop`/Tauri) Status klären/integrieren.
- Post-Audit-Regression-Monitoring (E2E + Visual Regression nach Deps-/AI-Safety-Änderungen).

---

## Critical-Path-Test-Plan (P1-1)

**Allgemein:** Vitest + jsdom; deterministisch (keine echten Netzwerk-Calls, Zeit/Random gemockt). Verschlüsselung über WebCrypto-Polyfill aus `vitest.setup.ts`.

### `safetyPipeline.ts`
- `sanitizeForPrompt()`: entfernt/redigiert Injection-Pattern, normalisiert Homoglyphen, neutralisiert HTML (DOMPurify).
- `isTopicRelevant()`: akzeptiert On-Topic-Horticulture, lehnt Off-Topic ab (Tabelle aus Positiv-/Negativ-Beispielen).
- Property-Based (fast-check): beliebiger Input erzeugt nie unsanitisierte Injektions-Marker im Output.

### `syncEncryptionService.ts`
- Roundtrip: `decryptSyncPayload(encryptSyncPayload(x, key), key) === x`.
- Falscher Key → Fehler/kein Klartext.
- Envelope-Format `{ v: 2, iv, data }`; v-Mismatch wird behandelt.
- IV-Eindeutigkeit über mehrere Aufrufe.

### `plantSimulationService.ts`
- Determinismus mit fixem Seed; Tageszyklus mit bekanntem Input → erwartete Stage-Übergänge.
- VPD/Umwelt-Korrekturen an Grenzwerten (Branch-Coverage).
- Post-Harvest-State-Übergänge.

### `diagnosisService.ts`
- Zero-Shot-Klassifikation mit gemocktem Modell-Output → erwartetes Label/Confidence.
- Rule-based Fallback bei Modell-Fehler.
- Mapping Label → Empfehlungen/Lexikon-Keys.

### `aiFacade.ts` / Orchestrierung
- 3-Layer-Fallback: Cloud-Fehler → Local → Rule-based.
- Re-Export-Integrität (Konsumenten importieren nur Facade).

---

## Disclaimer-/Privacy-Textvorschläge (P2-2)

Vorhandene Keys nutzen/erweitern (`ai.disclaimer`, `legal.medicalDisclaimer`, `settingsView.data.sync.gistSecurityWarning`). Vorschläge (EN/DE), konsistent in `en,de,es,fr,nl` pflegen.

**Globaler KI-Disclaimer (`ai.disclaimer` — Bestand, bestätigt geeignet):**
- EN: *"AI-generated content. Always verify critical information."*
- DE: *"KI-generierter Inhalt. Überprüfe kritische Informationen immer."*

**Medizinisch/Gesundheit (`legal.medicalDisclaimer` — Bestand):**
- EN: *"This is not medical advice. Always consult a qualified professional for health-related decisions."*

**Neu vorgeschlagen — Onboarding/Reports/Footer (Key z. B. `legal.educationalUseNotice`):**
- DE: *"Rein edukativ und assistiv. Kein Ersatz für professionelle Beratung. Prüfe die in deiner Region geltenden Gesetze. Keine Garantie auf Richtigkeit von KI-Ergebnissen."*
- EN: *"For educational and assistive use only. Not a substitute for professional advice. Check the laws applicable in your region. No guarantee of accuracy for AI results."*

**Neu vorgeschlagen — Breeding/Simulation (Key z. B. `strainsView.breeding.disclaimer`):**
- DE: *"Genetik-/Ertragswerte sind theoretische Simulationen und keine garantierten Ergebnisse."*
- EN: *"Genetics/yield figures are theoretical simulations, not guaranteed outcomes."*

**Privacy-Hinweis Gist-Sync (Erweiterung von `settingsView.data.sync.gistSecurityWarning`):**
- DE: *"Hinweis: Ohne aktivierten E2EE-Schlüssel sind deine Daten im (nicht gelisteten) GitHub Gist lesbar, sobald die URL bekannt ist. GitHub unterliegt US-Jurisdiktion. Grow-Logs können sensibel sein — aktiviere E2EE oder nutze den Local-Only-Modus."*
- EN: *"Note: Without the E2EE key enabled, your data in the (unlisted) GitHub Gist is readable once the URL is known. GitHub is subject to US jurisdiction. Grow logs can be sensitive — enable E2EE or use Local-Only mode."*

**Empfehlung Age-Gate/Consent:** Zustimmung mit Zeitstempel/Version persistieren (z. B. `cg.gdpr.consent.v2` + `consentedAt`), In-App-Widerruf in Settings verlinken.

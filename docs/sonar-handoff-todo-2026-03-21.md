# Sonar Handoff TODO (naechste Session)

Basis: Sonar-Liste aus der letzten Anfrage (100 von 291 Issues angezeigt).
Prioritaet: zuerst hohe Wirkung mit geringem Risiko, danach breite Bereinigung nach Clustern.

## A. Sofort-Start (Top-Block aus letzter Anfrage)

1. components/common/AgeGateModal.tsx

- role="dialog" durch natives dialog-Element ersetzen.
- Fokus-/Close-Verhalten pruefen (Esc/Backdrop nur falls gewuenscht).

2. components/common/ConsentBanner.tsx

- role="dialog" durch natives dialog-Element ersetzen.

3. components/common/Card.tsx

- Non-native Interaktion auf native button/link umstellen oder vollstaendig a11y-konform machen.
- role="button" entfernen zugunsten nativer Elemente.
- tabIndex nur auf interaktiven Elementen.

4. components/common/CommandPalette.tsx

- Nested ternary (L198) in klare Zwischenausdruecke aufloesen.

5. components/common/DialogWrapper.tsx

- Bugfix: Bedingung liefert in true/false denselben Wert (L123).

6. components/common/ErrorBoundary.tsx

- requestSafeRecovery als readonly markieren.

7. components/common/OnboardingModal.tsx

- Nested ternary aufloesen.
- Alle index-keys ersetzen (L176, L221, L263, L309).

8. components/common/Pagination.tsx

- index-key ersetzen (L76).

9. components/common/RangeSlider.tsx

- Redundantes undefined/? im Typ entfernen (L13).
- isNaN durch Number.isNaN ersetzen (L76, L83).

10. components/common/SegmentedControl.tsx

- Non-interactive Event-Listener entfernen oder auf native interaktive Elemente migrieren.
- role="group" durch fieldset/details/optgroup/address-konforme Struktur ersetzen.

## B. Danach in Clustern abarbeiten

1. Accessibility-Rollen auf native HTML umstellen

- role="navigation" -> nav (z. B. components/views/HelpView.tsx)
- role="img" -> img mit alt (mehrfach in help/plants views)
- role="progressbar" -> progress (components/views/plants/VitalBar.tsx)
- role="list"/"listitem" -> ul/ol + li (GrowRoom3D etc.)
- role="button"-Smells in plants/tasks und diagnostics modals

2. Array-index-as-key global reduzieren

- Haeufig in common/components/views/equipment/plants/deepDive
- Vorgehen: stabile IDs aus Datenobjekten nutzen, sonst deterministischen String-Key bilden.

3. Lesbarkeit/Intentionality

- Nested ternary in mehrere Statements aufteilen
- Nested template literals in benannte Teilstrings aufteilen
- Else-if Normalisierungen (if als einzige else-Anweisung)

4. Konvention/ES2015

- parseInt -> Number.parseInt
- isNaN -> Number.isNaN
- Optional Chaining statt manueller null/undefined Checks
- includes-Checks mit Set.has bei passenden Stellen

5. Reliability/Bug-Smells

- Gleiches Ergebnis in true/false-Bedingungen (GrowSetupModal/DialogWrapper)
- Promise-Reject-Reason als Error (LogActionModal)

## C. Empfohlene Abarbeitungsreihenfolge (Wellen)

1. Welle 1

- Alle common/\* Punkte aus Abschnitt A komplett

2. Welle 2

- Accessibility-Rollen in Help/Plants/equipment views

3. Welle 3

- index-key Cluster (beginnend mit stark gerenderten Listen)

4. Welle 4

- Nested ternary/template literal + Konventionssmells

## D. Validierung je Welle

Nach jeder Welle ausfuehren:

- npx tsc --noEmit
- node scripts/lint-changed.mjs
- optional gezielter Testlauf fuer betroffene Views

## E. Abschlusskriterien

Eine Welle gilt als abgeschlossen, wenn:

- Alle in der Welle geplanten Sonar-Hinweise behoben sind
- Typecheck/Lint gruen sind
- Keine regressiven A11y-Interaktionen auffallen (Keyboard/Fokus)

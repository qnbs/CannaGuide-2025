# Toolchain Update — Bestandsaufnahme & Migrationsplan

**Stand:** 2026-07-14 · **Repo:** CannaGuide-2025 @ `main` · **Host:** Ubuntu 22.04.5 LTS (MATE), glibc 2.35, Kernel 5.15

Alle Versionsangaben sind **gemessen** (lokale Runtimes, `package.json`, `.github/`) bzw. **abgefragt** (npm-Registry am 2026-07-14). Peer-Ranges sind wörtlich aus den Paket-Manifesten zitiert — sie sind der Grund, warum zwei naheliegende Upgrades **nicht** gehen.

---

## 0. Was der Ubuntu-Upgrade tatsächlich ändert — und was nicht

Ehrlich vorweg, weil es die Priorisierung bestimmt:

**Der Sprung auf 22.04 entsperrt pnpm 11 nicht.** pnpm 11 verlangt `node: >=22.13`; das Repo pinnt `engines.node: ">=24"` und CI fährt Node 24. Das war schon unter 20.04 erfüllt. pnpm 11 war also nie durch das Betriebssystem blockiert — es hat schlicht niemand hochgezogen.

Was 22.04 **wirklich** bringt:

| Aspekt                | 20.04                     | 22.04                 | Relevanz                                                                                                                                                                                         |
| --------------------- | ------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| glibc                 | 2.31                      | **2.35**              | Aktuelle Prebuilt-Binaries (Playwright-Browser, esbuild, SWC, `onnxruntime-web`-Natives) setzen zunehmend ≥2.32 voraus. Unter 20.04 drohten Fallbacks auf Kompilierung oder schlicht Fehlstarts. |
| Playwright-Systemdeps | teils nicht mehr gepflegt | offiziell unterstützt | `playwright install-deps` läuft wieder sauber → **WebKit-E2E wird lokal überhaupt erst reproduzierbar** (siehe Sprint-Plan PR 8).                                                                |
| Python                | 3.8                       | **3.10.12**           | Für `uv`/graphify irrelevant (uv bringt sein eigenes Python), aber Systemskripte profitieren.                                                                                                    |
| Sicherheit            | EOL (Mai 2025)            | supported bis 2027    | Der eigentliche Grund für den Upgrade.                                                                                                                                                           |

**Fazit:** Die Toolchain-Rückstände sind unabhängig vom OS entstanden. Der Upgrade beseitigt aber die Blockade für WebKit-E2E und macht Prebuilt-Binaries wieder verlässlich.

---

## 1. Ist-Zustand (gemessen)

### Lokale Runtimes

| Tool   | Version | Bemerkung                            |
| ------ | ------- | ------------------------------------ |
| Node   | 24.11.1 | via `fnm` 1.38.1                     |
| pnpm   | 10.33.0 | via corepack (`packageManager`-Feld) |
| npm    | 11.6.2  | nur als Registry-Client genutzt      |
| Python | 3.10.12 | System                               |
| uv     | 0.11.25 | für graphify                         |
| git    | 2.45.1  |                                      |

### Repo-Pins

| Paket                       | Gepinnt                     | Latest      | Delta                                                             |
| --------------------------- | --------------------------- | ----------- | ----------------------------------------------------------------- |
| **pnpm** (`packageManager`) | `10.33.0`                   | **11.13.0** | 🔴 1 Major zurück (10er-Linie steht bei 10.34.5)                  |
| **typescript**              | `5.9.3` (exakt, kein Caret) | **7.0.2**   | 🔴 2 Majors zurück — aber siehe §3, Sprung auf 7 ist **gesperrt** |
| **eslint**                  | `^9.39.4`                   | **10.7.0**  | 🔴 1 Major zurück — aber **blockiert**, siehe §3                  |
| **@eslint/js**              | `^9.39.4`                   | 10.0.1      | folgt eslint                                                      |
| **eslint-config-prettier**  | `^9.1.2`                    | **10.1.8**  | 🟡 1 Major zurück, unabhängig aktualisierbar                      |
| **turbo**                   | `^2.10.4`                   | 2.10.5      | 🟢 Patch                                                          |
| **@typescript-eslint/**\*   | `^8.63.0`                   | 8.64.0      | 🟢 Minor                                                          |
| vite                        | `^8.1.4`                    | 8.1.4       | 🟢 aktuell                                                        |
| vitest                      | `^4.1.10`                   | 4.1.10      | 🟢 aktuell                                                        |
| react / react-dom           | `^19.2.7`                   | 19.2.7      | 🟢 aktuell                                                        |
| tailwindcss                 | `^4.3.2`                    | 4.3.2       | 🟢 aktuell                                                        |
| @playwright/test            | `^1.61.1`                   | 1.61.1      | 🟢 aktuell                                                        |
| wrangler                    | `^4.110.0`                  | 4.110.0     | 🟢 aktuell                                                        |
| prettier                    | `^3.9.5`                    | 3.9.5       | 🟢 aktuell                                                        |
| husky / lint-staged         | `^9.1.7` / `^17.0.8`        | identisch   | 🟢 aktuell                                                        |

**Das Bild ist gut:** Dependabot hält die Anwendungs-Dependencies tagesaktuell. Der Rückstand liegt ausschließlich bei den drei Dingen, die Dependabot **nicht** anfassen kann oder darf: dem `packageManager`-Feld (pnpm), dem exakt gepinnten TypeScript und dem ESLint-Major.

---

## 2. Was jetzt geht — empfohlene Reihenfolge

### 2.1 🟢 pnpm 10.33.0 → 11.13.0 (klein, sofort)

**Warum es geht:** `pnpm@11.13.0` deklariert `engines: { node: ">=22.13" }`. Repo: `engines.node: ">=24"`, CI: Node 24. Erfüllt.

**Warum es ein Einzeiler ist:** CI installiert pnpm über **corepack** (`.github/actions/setup-node-ci/action.yml:17` → `corepack enable`, dann `actions/setup-node` mit `cache: pnpm`). Corepack liest die Version aus dem `packageManager`-Feld. Ein Feld ändern = lokal und in **allen 27 Workflows** synchron.

```jsonc
// package.json
- "packageManager": "pnpm@10.33.0"
+ "packageManager": "pnpm@11.13.0"
```

**Risiko / zu beobachten:**

- Der Lockfile-Format-Version kann sich ändern → `pnpm install` erzeugt einen großen `pnpm-lock.yaml`-Diff. Das ist erwartet, aber es muss **ein eigener Commit** sein, sonst ist der PR nicht reviewbar.
- `scripts/check-pnpm-lockfile.mjs` (Duplicate-Key-Detektor) läuft in der Setup-Action **vor** dem Install — gegen den neuen Lockfile verifizieren.
- `.npmrc` enthält `shamefully-hoist=true`, `strict-peer-dependencies=false`, `auto-install-peers=true`. Alle drei sind in pnpm 11 weiterhin gültig. **Achtung:** `strict-peer-dependencies=false` ist genau der Grund, warum ein Peer-Konflikt (§3) hier _nicht_ hart failen, sondern still durchrutschen würde — deshalb sind die Peer-Ranges unten manuell geprüft und nicht dem Installer überlassen.

**Verifikation:** `pnpm install --frozen-lockfile` muss in CI grün sein; `pnpm run typecheck` + `quality`-Job unverändert.

---

### 2.2 🟡 eslint-config-prettier 9.1.2 → 10.1.8 (unabhängig, risikoarm)

Peer: `eslint: ">=7.0.0"` — kompatibel mit dem aktuellen ESLint 9. Kein Grund zu warten. Breaking Change in v10: einige `no-*`-Regeln wurden entfernt/umbenannt; die Konfiguration nutzt nur den Default-Export (`prettierConfig` am Ende von `eslint.config.js`), also unkritisch.

---

### 2.3 🟡 TypeScript 5.9.3 → **6.0.3** (nicht 7!)

**Der Sprung heißt 5.9 → 6.0, nicht 5.9 → 7.** TS 6.0 ist die designierte Übergangs-Release zur Native-Portierung (TS 7 / „Corsa"): Deprecations werden zu Fehlern, Alt-Flags fallen weg. Genau dafür ist sie da.

**Beleg für die Grenze:**

```
typescript-eslint@8.64.0  peerDependencies.typescript = ">=4.8.4 <6.1.0"
@stryker-mutator/typescript-checker  peerDependencies.typescript = ">=3.6"
```

`6.0.3` erfüllt `<6.1.0`. **`7.0.2` erfüllt es nicht** → siehe §3.

**Vorgehen:**

1. `typescript` von `5.9.3` auf `6.0.3` heben (Pin bleibt **exakt** — das ist Absicht: TS-Minors sind faktisch Majors, weil neue Checks bestehenden Code brechen).
2. `@typescript-eslint/*` vorher auf `8.64.0` heben.
3. `pnpm run typecheck` über **alle** Pakete (`turbo run typecheck` + Root). Erwartete Fehlerklassen: verschärfte `exactOptionalPropertyTypes`-Diagnosen (das Repo hat es aktiv), entfernte Deprecations, strengere `unknown`-Propagierung in Catch-Blöcken.
4. **Hartes Nein zu `any` als Fixpfad** — das Zero-any-Gate in `ci.yml` failt sonst. Echte Typen oder `unknown` + Narrowing.

**Aufwand:** unbekannt bis der Typecheck einmal gelaufen ist. Deshalb ist dies der einzige Punkt hier, der einen **eigenen PR mit Puffer** braucht — nicht in einen Sammel-PR mischen.

---

### 2.4 🟢 turbo 2.10.4 → 2.10.5

Patch. Macht Dependabot von selbst (Gruppe `build-tools`) — **sobald der Auto-Merge-Fix aus PR #411 auf `main` liegt**. Nichts zu tun.

---

## 3. Was NICHT geht — mit Beweis

### 🔴 TypeScript 7.0.2 — gesperrt durch typescript-eslint

```
typescript-eslint@8.64.0        typescript: ">=4.8.4 <6.1.0"
@typescript-eslint/parser@8.64  typescript: ">=4.8.4 <6.1.0"
```

Es gibt **keine** typescript-eslint-Version, die TS 7 unterstützt (`dist-tags`: `latest: 8.64.0`, kein v9). Ein Upgrade auf TS 7 würde den gesamten Lint-Stack — und damit die blockierenden Gates `lint:changed`, `lint:scopes`, `lint:strict` — funktionsunfähig machen. Da `strict-peer-dependencies=false` gesetzt ist, würde `pnpm install` das **nicht** verhindern: es installiert klaglos und der Parser fällt erst zur Laufzeit um. Das ist die gefährliche Variante.

**Trigger zum Wiedervorlegen:** typescript-eslint v9 (oder ein 8.x mit erweitertem Peer-Range). Danach: TS 6 → 7 in einem eigenen PR.

### 🔴 ESLint 10.7.0 — gesperrt durch drei Plugins

`typescript-eslint` erlaubt ESLint 10 bereits (`eslint: "^8.57.0 || ^9.0.0 || ^10.0.0"`). Die Plugins nicht:

| Plugin                            | `peerDependencies.eslint` | ESLint 10?           |
| --------------------------------- | ------------------------- | -------------------- |
| `eslint-plugin-react@7.37.5`      | `^3 \|\| … \|\| ^9.7`     | ❌ **deckelt bei 9** |
| `eslint-plugin-import@2.32.0`     | `^2 \|\| … \|\| ^9`       | ❌ **deckelt bei 9** |
| `eslint-plugin-jsx-a11y@6.10.2`   | `^3 \|\| … \|\| ^9`       | ❌ **deckelt bei 9** |
| `eslint-plugin-react-hooks@7.1.1` | `… \|\| ^10.0.0`          | ✅                   |
| `eslint-config-prettier@10.1.8`   | `>=7.0.0`                 | ✅                   |
| `typescript-eslint@8.64.0`        | `… \|\| ^10.0.0`          | ✅                   |

Drei von sechs deckeln bei ESLint 9 — darunter **jsx-a11y**, das im Sprint-Plan (PR 4, a11y-Ratchet) gerade zum blockierenden Gate promoted wird. Ein ESLint-10-Upgrade jetzt würde diese Arbeit auf einen nicht unterstützten Peer stellen.

**Fallback-Anker:** ESLint hält die 9er-Linie als `maintenance: 9.39.5` — es gibt also einen gepflegten Patch-Pfad, kein Zeitdruck.

**Trigger zum Wiedervorlegen:** wenn `eslint-plugin-react`, `-import` und `-jsx-a11y` ESLint 10 in ihren Peers führen. Dann alle vier zusammen in **einem** PR (gemischte Majors im Lint-Stack sind nicht sinnvoll einzeln zu testen).

### 🟡 Node 26.5.0 — bewusst nicht

Repo und CI stehen konsistent auf Node 24 (`engines.node: ">=24"`, `NODE_VERSION: 24` in allen Workflows). Node 26 ist die aktuelle Linie. **Vor einem Wechsel ist zu verifizieren, ob 26 bereits Active LTS ist** — das habe ich nicht geprüft und behaupte es nicht. Solange Node 24 LTS ist, gibt es keinen Grund zu wechseln: der Nutzen ist marginal, das Risiko (Natives, Playwright, Wrangler-Workerd) real.

---

## 4. Migrationsplan (PR-Schnitt)

Jeder Punkt ein eigener PR — die Lockfile-Diffs machen Sammel-PRs unreviewbar, und ein TS-Major will isoliert bisektierbar sein.

| #   | Branch                            | Inhalt                                                                   | Größe                       | Risiko           |
| --- | --------------------------------- | ------------------------------------------------------------------------ | --------------------------- | ---------------- |
| 1   | `chore/pnpm-11`                   | `packageManager` → `pnpm@11.13.0` + regenerierter Lockfile               | 2 Dateien (Lockfile groß)   | niedrig          |
| 2   | `chore/eslint-config-prettier-10` | `eslint-config-prettier` → `^10.1.8`                                     | 2 Dateien                   | sehr niedrig     |
| 3   | `chore/typescript-6`              | `@typescript-eslint/*` → 8.64, `typescript` → `6.0.3`, Typfehler beheben | unbekannt, potenziell breit | **mittel-hoch**  |
| —   | _(warten)_                        | ESLint 10, TypeScript 7                                                  | —                           | blockiert, s. §3 |

**Reihenfolge zwingend:** pnpm zuerst (verändert den Lockfile für alles Weitere), TS zuletzt (größte Fläche).

**Einbettung in den laufenden Sprint:** Diese PRs kollidieren mit den Sprint-PRs, weil beide `pnpm-lock.yaml` anfassen. Empfehlung: **nach PR 1–3 des Sprints** (Dependabot-Triage, Drift-Guards, Docs-Truth-up) einschieben, **vor** den UI-lastigen PRs 5–7. Der TS-6-PR sollte **nicht** parallel zum a11y-Ratchet laufen — beide fassen `eslint.config.js` an.

---

## 5. Verifikation (Cloud-First, wie im Sprint)

Lokal auf dieser Maschine nur:

```bash
pnpm install --frozen-lockfile      # nach pnpm-11-Bump: ohne --frozen, dann Lockfile committen
pnpm run typecheck                  # der einzige lokal sinnvolle Vollcheck
pnpm --filter web run test:run -- <einzelne Datei>
```

**Niemals lokal:** volle Suite, E2E, Coverage, Mutation, Build-Matrix (3,7 GB RAM). Push den Branch, lies die Artefakte:

| Prüfung                                      | Job                         | Artefakt          |
| -------------------------------------------- | --------------------------- | ----------------- |
| Install + Lockfile-Integrität                | `quality` → `setup-node-ci` | Exit-Code         |
| Zero-`any` (nach TS-6-Fixes kritisch!)       | `quality`                   | Exit-Code         |
| Typecheck über alle Pakete                   | `quality`                   | Log               |
| Unit + Coverage-Thresholds (43/41/25/35)     | `quality`                   | `coverage-report` |
| Lint (`lint:changed`, `lint:scopes`)         | `quality`                   | Log               |
| Bundle-Budget (TS-Major kann Output ändern!) | `quality`                   | Size-Report       |

---

## 6. Rollback

| PR                     | Rückweg                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| pnpm 11                | `packageManager` zurück auf `pnpm@10.33.0`, `pnpm install` → Lockfile regeneriert sich. Corepack zieht die alte Version automatisch.                                           |
| eslint-config-prettier | Version zurückdrehen, `pnpm install`.                                                                                                                                          |
| TypeScript 6           | Revert des PRs. **Wichtig:** die Typfehler-Fixes sind meist _echte_ Verbesserungen — beim Revert prüfen, ob sich einzelne Fixes (Narrowing statt `any`) separat halten lassen. |

Alle drei sind reine Dev-Toolchain-Änderungen: **kein Runtime-Bundle-Impact**, kein Nutzer sieht etwas. Das Bundle-Budget-Gate deckt den Ausnahmefall ab (TS-Major ändert Emit).

---

## 7. Offene Beobachtungspunkte

- **typescript-eslint v9** — der Blocker für TS 7. `npm view typescript-eslint dist-tags` regelmäßig prüfen.
- **eslint-plugin-react / -import / -jsx-a11y mit ESLint-10-Peer** — der Blocker für ESLint 10.
- **Node 26 LTS-Status** — vor jedem Wechsel gegen den offiziellen Release-Plan verifizieren, nicht aus dem Bauch.
- **`strict-peer-dependencies=false` in `.npmrc`** — macht Peer-Konflikte still. Solange das gesetzt ist, muss jeder Major-Bump im Lint-/TS-Stack **manuell** gegen die Peer-Ranges geprüft werden (wie in §3). Mittelfristig erwägen, es auf `true` zu setzen und die dann sichtbaren Konflikte einmalig aufzuräumen — das ist die eigentliche strukturelle Schwachstelle.

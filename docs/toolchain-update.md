# Toolchain Update — Bestandsaufnahme & Migrationsplan

**Stand:** 2026-07-14 · **Repo:** CannaGuide-2025 @ `main` · **Host:** Ubuntu 22.04.5 LTS (MATE), glibc 2.35, Kernel 5.15

> **Historical migration evidence.** Version tables and proposed migrations below describe
> the July checkpoint, not today's update backlog. Current executable setup and resource
> rules are in [AGENTS.md](../AGENTS.md) and current scripts. The manual modernization
> campaign is [GitHub #579](https://github.com/qnbs/CannaGuide-2025/issues/579).
> Historical peer limits must be checked again before an upgrade. Section 8 retains the
> measured typecheck comparison; it is not a timing guarantee for other hosts.

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

## 1. Ausgangszustand (gemessen, VOR der Migration)

> **Hinweis:** Dieser Abschnitt ist die **Baseline vor** dem pnpm-Upgrade. `package.json` pinnt inzwischen `pnpm@11.13.0` (erledigt in PR #413, siehe §2.1). Die Tabelle bleibt als Ausgangsdokumentation stehen.

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

### 2.1 ✅ pnpm 10.33.0 → 11.13.0 — **erledigt in PR #413**

**Warum es geht:** `pnpm@11.13.0` deklariert `engines: { node: ">=22.13" }`. Repo: `engines.node: ">=24"`, CI: Node 24. Erfüllt.

**Die ursprüngliche Annahme war, es sei ein Einzeiler:** CI installiert pnpm über **corepack** (`.github/actions/setup-node-ci/action.yml:17` → `corepack enable`, dann `actions/setup-node` mit `cache: pnpm`). Corepack liest die Version aus dem `packageManager`-Feld — ein Feld ändern, und lokal wie alle 27 Workflows ziehen synchron nach:

```jsonc
// package.json
- "packageManager": "pnpm@10.33.0"
+ "packageManager": "pnpm@11.13.0"
```

**Es war kein Einzeiler.** Tatsächlich betroffen sind **vier** Dateien: `package.json`, `pnpm-workspace.yaml`, `.npmrc` und `pnpm-lock.yaml`. Die obige Annahme war falsch, und zwar auf die gefährliche Art: pnpm 11 hört auf, pnpm-Konfiguration an **zwei** Stellen zu lesen — beide Male **ohne Fehler**, nur mit einer leicht überlesbaren Warnung.

| Was                                                                  | Vorher         | Unter pnpm 11                                                    | Folge, wenn unmigriert                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm.overrides` (22 Pins)                                           | `package.json` | **ignoriert**                                                    | Die Pins für `tmp`, `qs`, `uuid`, `js-yaml` … verschwinden. Genau diese Pakete stehen in `dependabot.yml` auf der Ignore-Liste **mit der Begründung**, sie seien „via pnpm.overrides gepinnt“. Ergebnis: weder Dependabot noch Override — eine stille Supply-Chain-Regression. |
| `pnpm.auditConfig`, `pnpm.onlyBuiltDependencies`                     | `package.json` | **ignoriert**                                                    | `onlyBuiltDependencies` existiert nicht mehr; ersetzt durch `allowBuilds` in `pnpm-workspace.yaml`.                                                                                                                                                                            |
| `shamefully-hoist`, `strict-peer-dependencies`, `auto-install-peers` | `.npmrc`       | **ignoriert** (`pnpm config get shamefully-hoist` → `undefined`) | Hoisting entfällt → jedes Modul, das `apps/web` importiert **ohne es zu deklarieren**, lässt sich nicht mehr auflösen.                                                                                                                                                         |

**Zwei latente Defekte, die dabei ans Licht kamen** (beide an der Wurzel gefixt, nicht umschifft):

1. **`allowBuilds` war Datenmüll.** Es enthielt `b, d, e, i, l, s, u` — die sortierten Buchstaben von **„esbuild“**, ein String, den irgendwann etwas zeichenweise gespreizt hat. Es hat also nie ein Build-Skript freigegeben; `esbuild`, `sharp` und `msw` liefen ohne ihre Postinstall-Skripte.
2. **Drei Phantom-Dependencies in `apps/web`.** `onnxruntime-web` (gehört `packages/ai-core`), `@tauri-apps/api` (gehört `apps/desktop`) und `@sentry/browser` (nur transitiv über `@sentry/react`) werden importiert, waren aber **nie deklariert**. Sie wurden ausschließlich durch `shamefully-hoist` gefunden. Jetzt explizit deklariert.

**Verifikation (ausgeführt):** `pnpm install` sauber · `check:lockfile` OK · `tsc --noEmit` **0 Fehler** · alle 22 Overrides im regenerierten Lockfile vorhanden.

**Lehre für die kommenden Bumps:** `strictPeerDependencies: false` bleibt gesetzt — ein Peer-Konflikt (§3) failt hier also **nicht** hart, sondern rutscht still durch. Deshalb sind die Peer-Ranges unten manuell geprüft und nicht dem Installer überlassen.

---

### 2.2 🟡 eslint-config-prettier 9.1.2 → 10.1.8 (unabhängig, risikoarm)

Peer: `eslint: ">=7.0.0"` — kompatibel mit dem aktuellen ESLint 9. Kein Grund zu warten. Breaking Change in v10: einige `no-*`-Regeln wurden entfernt/umbenannt; die Konfiguration nutzt nur den Default-Export (`prettierConfig` am Ende von `eslint.config.js`), also unkritisch.

---

### 2.3 🟡 TypeScript 5.9.3 → **6.0.3** (nicht 7!)

**Der Sprung heißt 5.9 → 6.0, nicht 5.9 → 7.** TS 6.0 ist die designierte Übergangs-Release zur Native-Portierung (TS 7 / „Corsa"): Deprecations werden zu Fehlern, Alt-Flags fallen weg. Genau dafür ist sie da.

**Beleg für die Grenze:**

```text
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

```text
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

| #   | Branch                            | Inhalt                                                                                                                       | Größe                                                                    | Status                       |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------- |
| 1   | `chore/pnpm-11`                   | `packageManager` → `pnpm@11.13.0`, Config-Migration nach `pnpm-workspace.yaml`, `allowBuilds`-Fix, 3 Phantom-Deps deklariert | **4 Dateien**: `package.json`, `pnpm-workspace.yaml`, `.npmrc`, Lockfile | ✅ **PR #413**               |
| 2   | `chore/eslint-config-prettier-10` | `eslint-config-prettier` → `^10.1.8`                                                                                         | 2 Dateien                                                                | offen, sehr niedriges Risiko |
| 3   | `chore/typescript-6`              | `@typescript-eslint/*` → 8.64, `typescript` → `6.0.3`, Typfehler beheben                                                     | unbekannt, potenziell breit                                              | offen, **mittel-hoch**       |
| —   | _(warten)_                        | ESLint 10, TypeScript 7                                                                                                      | —                                                                        | blockiert, s. §3             |

**Reihenfolge zwingend:** pnpm zuerst (verändert den Lockfile für alles Weitere), TS zuletzt (größte Fläche).

**Einbettung in den laufenden Sprint:** Diese PRs kollidieren mit den Sprint-PRs, weil beide `pnpm-lock.yaml` anfassen. Empfehlung: **nach PR 1–3 des Sprints** (Dependabot-Triage, Drift-Guards, Docs-Truth-up) einschieben, **vor** den UI-lastigen PRs 5–7. Der TS-6-PR sollte **nicht** parallel zum a11y-Ratchet laufen — beide fassen `eslint.config.js` an.

---

## 5. Verifikation (Cloud-First, wie im Sprint)

Lokal auf dieser Maschine nur:

```bash
# Normalfall — verifiziert, dass der committete Lockfile zu package.json passt:
pnpm install --frozen-lockfile

# Nur nach einem Dependency-/Toolchain-Bump — ein frozen install kann den
# Lockfile nicht regenerieren, deshalb hier explizit ohne:
pnpm install --no-frozen-lockfile    # danach pnpm-lock.yaml committen

pnpm verify                          # betroffene Workspaces, seriell
pnpm --filter @cannaguide/web test:run path/to/single.test.ts
```

**Aktueller Hook-Vertrag:** `git push` führt den serialisierten `pre-push`-Hook aus:
Dependency-/Speicherprüfung, scoped Typecheck, geänderte Lint-Scopes, Dateibudget und
Dokumentationsmetriken. Hooks dürfen weder beim Commit noch beim Push umgangen werden.
Root-Manifest-, Workspace-Policy- oder Lockfile-Änderungen wählen alle Workspaces aus;
`scoped` bedeutet dann nicht klein. Ein vorheriger manueller Typecheck ersetzt den Hook nicht.

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

**pnpm 11 — Achtung, `packageManager` allein genügt NICHT.** Die Konfiguration ist mitgewandert; ein halber Rollback lässt die 22 Security-Overrides ins Leere laufen, weil pnpm 10 `pnpm-workspace.yaml` nicht als deren Heimat kennt. Der einzig sichere Rückweg ist `git revert` des gesamten PRs — er stellt alle vier Dateien gemeinsam wieder her:

| Datei                 | Was zurückmuss                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `package.json`        | `packageManager` → `pnpm@10.33.0` **und** der komplette `pnpm`-Block (`overrides`, `auditConfig`, `onlyBuiltDependencies`) |
| `pnpm-workspace.yaml` | `overrides`, `auditConfig`, `allowBuilds`, `shamefullyHoist`, `strictPeerDependencies`, `autoInstallPeers` entfernen       |
| `.npmrc`              | `shamefully-hoist`, `strict-peer-dependencies`, `auto-install-peers` wiederherstellen                                      |
| `pnpm-lock.yaml`      | mit `pnpm install --no-frozen-lockfile` unter pnpm 10 regenerieren                                                         |

Die drei explizit deklarierten Dependencies in `apps/web` (`@sentry/browser`, `onnxruntime-web`, `@tauri-apps/api`) sollten den Revert **überleben** — sie sind unter jeder pnpm-Version korrekt und beheben einen echten Bug.

| PR                     | Rückweg                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eslint-config-prettier | Version zurückdrehen, `pnpm install --no-frozen-lockfile`.                                                                                                                     |
| TypeScript 6           | Revert des PRs. **Wichtig:** die Typfehler-Fixes sind meist _echte_ Verbesserungen — beim Revert prüfen, ob sich einzelne Fixes (Narrowing statt `any`) separat halten lassen. |

Alle drei sind reine Dev-Toolchain-Änderungen: **kein Runtime-Bundle-Impact**, kein Nutzer sieht etwas. Das Bundle-Budget-Gate deckt den Ausnahmefall ab (TS-Major ändert Emit).

---

## 7. Offene Beobachtungspunkte

- **typescript-eslint v9** — der Blocker für TS 7. `npm view typescript-eslint dist-tags` regelmäßig prüfen.
- **eslint-plugin-react / -import / -jsx-a11y mit ESLint-10-Peer** — der Blocker für ESLint 10.
- **Node 26 LTS-Status** — vor jedem Wechsel gegen den offiziellen Release-Plan verifizieren, nicht aus dem Bauch.
- **`strictPeerDependencies: false` in `pnpm-workspace.yaml`** (seit pnpm 11; `.npmrc` hält nur noch `ignore-scripts=false`) — macht Peer-Konflikte still. Solange das gesetzt ist, muss jeder Major-Bump im Lint-/TS-Stack **manuell** gegen die Peer-Ranges geprüft werden (wie in §3). Mittelfristig erwägen, es auf `true` zu setzen und die dann sichtbaren Konflikte einmalig aufzuräumen — das ist die eigentliche strukturelle Schwachstelle.
- **`shamefullyHoist: true`** — verdeckt weiterhin nicht deklarierte Imports. Die drei bekannten sind jetzt deklariert, aber nur `tsc` hat sie aufgedeckt; rein zur Laufzeit genutzte Phantom-Deps (dynamische Imports ohne Typbezug) würden weiterhin unbemerkt bleiben. Ein späteres Abschalten legt sie offen — eigener PR, eigene Fehlerfläche.

---

## 8. Typecheck cost on the target machine -- measured

### Method

All figures below were measured on the maintainer's machine (dual-core, 3.8 GB RAM, Linux
5.15) with `/usr/bin/time -f "%e s | max RSS %M KB"`, against `apps/web`. Single run per
row, system otherwise idle apart from two idle VS Code `tsserver` processes (the normal
working state). Tool versions: **TypeScript 6.0.3**, **Node 24.11.1**,
**tsgo 7.0.0-dev.20260707.2**.

Wall time on this box varies with memory pressure -- an identical `tsc` run measured 263 s
with 1.0 GB free and 509 s with 0.9 GB free, because it swaps. Peak RSS is the stable and
more meaningful number here: the machine has ~1.5 GB free in normal use, so a 1.5 GB peak is
an OOM waiting to happen.

### Results

| Run                                                | Wall time | Max RSS     |
| -------------------------------------------------- | --------- | ----------- |
| `tsc --noEmit` (no `incremental`, the old default) | 321-341 s | **1.54 GB** |
| `tsgo --noEmit` (warm npx cache)                   | 171 s     | **1.72 GB** |
| `tsc --noEmit` **with `incremental`**, cold        | 341 s     | 1.54 GB     |
| `tsc --noEmit` **with `incremental`**, warm        | **91 s**  | **0.85 GB** |

### What this changed

`apps/web/tsconfig.json` had **no `incremental`**, so every typecheck recomputed the whole
program from scratch -- while `packages/ui` and `packages/ai-core` have had a build cache all
along. Turning it on (`incremental: true` + `tsBuildInfoFile` under `node_modules/.cache/`,
which is already git-ignored) cuts a warm run to **27% of the time and 45% of the peak
memory**.

The memory drop is the point. At a 1.5 GB peak with ~1.5 GB free, every typecheck was an OOM
candidate; at 0.85 GB it is not. That is what made the `pre-push` hook usable again, and it
is why the hook can afford to run a real typecheck instead of being bypassed.

### tsgo: rejected

`@typescript/native-preview` is **1.5x faster than plain `tsc` but uses more memory**
(1.72 GB vs 1.54 GB) -- and memory, not CPU, is the constraint here, so it makes the actual
problem worse. It is also **slower and heavier than incremental `tsc`** (171 s / 1.72 GB vs
91 s / 0.85 GB), so it loses on both axes against the fix we shipped. On top of that it
reports a `TS2430` in `services/webBluetoothSensorService.ts` that `tsc` does not: a gate
that goes red on something nobody can fix is a gate that gets switched off -- exactly how this
repo ended up with git hooks everyone bypassed via `--no-verify`.

**Re-evaluate** only when tsgo is stable _and_ its peak RSS drops below incremental `tsc`.

### Note on the scripts

- `scripts/scoped-verify.mjs` does the **diff scoping**: it derives the affected workspaces
  from the merge-base diff and runs `turbo run <task>` filtered to them, at
  `--concurrency=1`. This is what `pre-push` calls.
- `scripts/typecheck-filter.mjs` is only the `apps/web` wrapper around `tsc --noEmit` (it
  filters the known upstream RTK `TS2719`). It does no scoping of its own.

---

## 9. Manual security campaign checkpoint — 2026-10-24, Europe/Berlin

Current owner: [GitHub #579](https://github.com/qnbs/CannaGuide-2025/issues/579), coordinated
with Linear QNB-253/259; documentation acceptance remains QNB-266 / U12. This section records
the first bounded implementation from base `c5088863c168819cd031dd37480ae37a9a7f6211`.
It does not close the complete dependency inventory, documentation audit or product backlog.

| Family                            | Previous resolution | Prepared resolution           | Primary evidence                                                                                                                                                                                               |
| --------------------------------- | ------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOMPurify, including jsPDF        | 3.4.16              | 3.4.17                        | [Release](https://github.com/cure53/DOMPurify/releases/tag/3.4.17), [critical advisory](https://github.com/advisories/GHSA-cg2g-xh64-v4q7), [high advisory](https://github.com/advisories/GHSA-mrv2-3pqr-j5jr) |
| Vite                              | 8.3.2               | 8.3.5                         | [Release](https://github.com/vitejs/vite/releases/tag/v8.3.5), [patched floor 8.3.3](https://github.com/advisories/GHSA-587h-7wmj-h5pm)                                                                        |
| Vitest / coverage / mocker family | 4.1.11              | 4.1.12 throughout             | [Backported mock hardening](https://github.com/vitest-dev/vitest/releases/tag/v4.1.12)                                                                                                                         |
| markdown-it                       | 14.3.0              | 14.3.3, bounded below 15      | [npm metadata](https://registry.npmjs.org/markdown-it/14.3.3), [advisory](https://github.com/advisories/GHSA-gfr2-rv44-r23c)                                                                                   |
| Zod 4                             | 4.4.2               | 4.6.7 throughout              | [Release](https://github.com/colinhacks/zod/releases/tag/v4.6.7), [advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)                                                                                |
| qs                                | 6.15.2              | 6.16.1, bounded below 7       | [npm metadata](https://registry.npmjs.org/qs/6.16.1)                                                                                                                                                           |
| ip-address                        | 10.4.0              | 10.7.4, bounded below 11      | [npm metadata](https://registry.npmjs.org/ip-address/10.7.4)                                                                                                                                                   |
| fflate                            | 0.8.2 and 0.8.3     | 0.8.3 only, bounded below 0.9 | [npm metadata](https://registry.npmjs.org/fflate/0.8.3)                                                                                                                                                        |

The package manager generated the lockfile, followed by a successful deliberate frozen
install with the normal Husky preparation and dependency-state stamp. The 24-hour quarantine,
build-script policy and three existing audit exceptions remain unchanged. qs and markdown-it
were removed from `LEGACY_UNBOUNDED`; nine pre-existing entries remain. Native Rolldown pins
move with Vite's Rolldown 1.2.15 dependency, not independently of their JS package.

The local host is Ubuntu 22.04.5 x86_64 with 3793 MiB RAM. Node 24.22.1 was added through the
existing fnm installation for checks after the official [security release](https://github.com/nodejs/node/releases/tag/v24.22.1)
was confirmed. System Node and global defaults were not changed. The repository's existing
`>=24.15.0 <25` contract and pnpm 11.19.0 remain in place; Node-26 admission remains separate.

### Evidence and remaining qualification

- Six focused Vitest files passed, **70 tests**, under Node 24.22.1: SafeHtml,
  safetyPipeline, Zod jitless, AI response validation, export and PDF report tests. The
  sanitizer fixtures use the real library and cover both retained useful text/markup and
  removal of active HTML, SVG handlers and unsafe links. No models or AI requests were used.
- Production audits at both `--audit-level=high --prod` and `--audit-level=low --prod`
  returned **exit 0 with zero reported advisories** on the prepared lockfile. This is a
  dependency-scan result, not proof of absence of all application vulnerabilities.
- Both all-dependency audit levels still returned **exit 1**. The unignored findings are
  Zod 3 (high), `@humanfs/node` (moderate) and `postcss-selector-parser` (moderate).
  Zod 3 remains under Socket patch tooling and Chromium BiDi/Puppeteer. Current Socket
  CLI metadata still selects socket-patch 2.0.0, which pins Zod 3.25.76; even socket-patch
  5.0.1 retains that pin. A consumer migration needs separate compatibility proof. No
  new ignored advisory or forced Zod major was added to turn this gate green.
- extract-zip 2.0.2 and braces 3.0.4 were still unavailable in the live registry check.
  The three existing exceptions expire **2026-11-15**; they were not extended.
- A tiny fixed-code Vite build probe confirmed that the explicit esbuild minifier still
  removes debug/log calls and debugger statements while preserving warn/error calls.
  The Oxc-transform warning does not by itself demonstrate leaked production logging.
  Full production build/browser/coverage qualification remains a CI task.
- CI, review, merge, resulting-main, production/PWA lifecycle and desktop qualification
  have not been established for this implementation. The all-dependency audit failure
  remains a merge blocker; a successful production audit alone cannot satisfy CI Status.

The initial local inventories enumerate 230 documentation/explanatory surfaces, 3502
dependency/package/peer contexts and 281 toolchain uses. Enumeration is not final semantic
acceptance: each entry retains read/check/disposition fields, and #551's pinned audit
artifacts remain a separate historical source. The full U1/U12 reconciliation continues.

### Current-head CI and follow-up evidence — 2026-10-24

[PR #580](https://github.com/qnbs/CannaGuide-2025/pull/580) publishes signed head
`95db3541ffb82d258e5526b9a8289feb92782ca9` from the base above. Build, unit/coverage,
lint/types, documentation checks, CodeQL and both Chromium shards passed on that head.
CodeRabbit completed without actionable comments; CodeAnt and Codex also completed.
CodeAnt identified inaccurate README wording about background replay, which dispatches to
the first available window client rather than broadcasting actions to every tab.

The Security job failed on the all-dependency audit. In addition to Zod 3, the registry
published new body-parser and undici advisories on **2026-10-23** after the earlier audit.
This is a dependency failure, not evidence of exhausted Actions compute. The production
audit passed in CI. No merge or production qualification follows from those partial results.

The consolidated follow-up selects these compatible security floors, checked against npm
metadata on **2026-10-24**. Each selected minimum was published more than 24 hours earlier;
the quarantine and install-script policy remain unchanged.

| Package                               | Previous resolution | Selected minimum      | Primary evidence                                                                                                  |
| ------------------------------------- | ------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| body-parser (Express 4 / LHCI)        | 1.20.6              | 1.20.9, below 2       | [Advisory and patched branches](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828) |
| undici (jsdom / Miniflare)            | 7.30.0              | 7.30.1, below 8       | [Advisory](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c)                              |
| fast-uri (schema tooling)             | 4.2.1               | 4.2.3, below 5        | [Registry metadata](https://registry.npmjs.org/fast-uri/4.2.3)                                                    |
| serialize-javascript (Rollup tooling) | 7.0.7               | 7.1.3, below 8        | [Advisory](https://github.com/advisories/GHSA-m5mm-p8h7-m29v)                                                     |
| @humanfs/node (ESLint)                | 0.16.7 and 0.16.8   | 0.16.8, below 0.17    | [Advisory](https://github.com/advisories/GHSA-p498-v437-472g)                                                     |
| ESLint / @eslint/js at root           | 9.39.4              | 9.39.5, interim patch | [Patch release](https://github.com/eslint/eslint/releases/tag/v9.39.5)                                            |

`serialize-javascript@7.1.4` was published less than 24 hours before this check and is
not selected by bypassing quarantine. The floor admits it only after the normal policy
permits it. ESLint 9 is now marked unsupported in registry metadata: this patch removes
the vulnerable duplicate while the supported ESLint 10 migration remains a separate
plugin/configuration compatibility task. It is not a long-term supported toolchain target.

Zod 3 remains an open tooling security boundary. Chromium BiDi 14 ships its mapper as an
IIFE containing bundled Zod implementation code; overriding its external dependency does
not replace those executed bytes. A supported Puppeteer/BiDi migration must cover both
the declared dependency and the published mapper. Socket patch tooling also retains a
Zod 3 dependency. The moderate selector-parser finding requires a separately verified
Tailwind typography/parser migration. Neither finding has a new ignore or a claimed fix.

The follow-up lockfile was generated by pnpm and passed a normal frozen install, including
Husky preparation and the dependency-state stamp. Only the root importer changed; the
old ESLint/HumanFS duplicates disappeared along with the vulnerable patch resolutions.
The selected serialize-javascript resolution is 7.1.3. Focused tests, current audits and
current-head CI/review remain separate evidence. Results from `95db354` do not qualify a
later head. Merge, resulting-main, production/PWA lifecycle and desktop proof remain open.

Follow-up local evidence: the same six focused test files passed **70 tests** with
`undici@7.30.1`. Lockfile, bounded-floor, updater and registry-backed exception checks
passed. Production audits at high and low thresholds exited **0**, with zero advisories.
Complete audits at both thresholds exited **1**: Zod 3 remains the unignored high; the
low-threshold report also lists selector-parser 6 as moderate. Metadata counts include
existing ignored advisories and must not be read as a count of unignored high findings.

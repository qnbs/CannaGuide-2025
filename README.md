# CannaGuide 2025

> Your AI-powered digital companion for the entire cannabis cultivation cycle.

[![Deploy to GitHub Pages](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml)
[![CI](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)
[![CodeQL](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml)

**Live-Demo:** [https://qnbs.github.io/CannaGuide-2025/](https://qnbs.github.io/CannaGuide-2025/)

---

## Features

- **700+ Strain-Datenbank** — Sortier- und filterbar nach Chemotyp, Effekten, Terpenen und mehr
- **Grow-Log & Pflanzentracking** — Wachstumsphasen, Bewässerung, Dünger, Fotos und Notizen
- **KI-Assistent (Google Gemini)** — Anbauberatung, Sortenempfehlungen und Diagnosen per BYOK-Schlüssel
- **VPD-Rechner & Simulation** — Vapor Pressure Deficit live berechnen und visualisieren
- **Export** — Grow-Logs als PDF oder CSV exportieren
- **Text-to-Speech** — Geführte Anleitungen per Sprachausgabe (Web Speech API)
- **Command Palette** — Schnellnavigation via `Ctrl+K`
- **PWA** — Offline-fähig, installierbar auf dem Homescreen
- **Mehrsprachig** — Vollständig auf Deutsch und Englisch verfügbar
- **Dunkel- und Hell-Modus** — Automatisch oder manuell wählbar

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| State | Redux Toolkit |
| Styling | Tailwind CSS + Radix UI |
| Charts | Recharts + D3 |
| i18n | i18next / react-i18next |
| KI | Google Gemini (`@google/genai`) |
| Mobile | Capacitor (Android / iOS) |
| Desktop | Tauri |
| Tests | Vitest + Playwright |
| Deployment | GitHub Actions → GitHub Pages |
| Container | Docker + Nginx |

---

## Schnellstart

### Voraussetzungen

- Node.js ≥ 20
- npm ≥ 10

### Installation

```bash
git clone https://github.com/qnbs/CannaGuide-2025.git
cd CannaGuide-2025
npm install
npm run dev
```

Die App läuft dann unter `http://localhost:5173`.

---

## KI-Funktionen einrichten (BYOK)

Der KI-Assistent benötigt einen eigenen **Google Gemini API-Schlüssel**.

1. Schlüssel kostenlos erstellen: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. In der App: **Einstellungen → KI → API-Schlüssel eingeben**
3. Der Schlüssel wird ausschließlich lokal im Browser gespeichert (kein Server-Upload)

---

## Verfügbare npm-Skripte

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Lokaler Dev-Server |
| `npm run build` | Produktions-Build |
| `npm run build:gh` | Build für GitHub Pages (inkl. `404.html`) |
| `npm run preview` | Build lokal vorschauen |
| `npm run test` | Unit-Tests mit Vitest |
| `npm run test:coverage` | Testabdeckung |
| `npm run test:e2e:deploy` | Playwright E2E gegen Live-URL |
| `npm run lint` | Geänderte Dateien linten |
| `npm run lint:full` | Alle Dateien linten |
| `npm run format` | Prettier formatieren |
| `npm run docker:build` | Docker-Image bauen |
| `npm run docker:run` | Docker-Container starten (Port 8080) |
| `npm run tauri:dev` | Tauri Desktop-App (Dev) |
| `npm run tauri:build` | Tauri Desktop-App (Release) |
| `npm run cap:sync` | Capacitor sync (Android/iOS) |

---

## Deployment

Der Deployment-Workflow läuft automatisch bei jedem Push auf `main`:

1. `npm audit` — Sicherheitsprüfung
2. ESLint + Scope-Checks
3. Vitest Unit-Tests
4. `npm run build:gh` — Optimierter Build
5. Artifact-Upload → GitHub Pages Deploy

Manuelles Auslösen ist per **Actions → Deploy to GitHub Pages → Run workflow** möglich.

---

## Docker

```bash
# Image bauen
npm run docker:build

# Container starten (erreichbar unter http://localhost:8080)
npm run docker:run
```

---

## Projektstruktur (Auszug)

```
components/      React-Komponenten (Views, UI, Navigation)
data/            Strain-Datenbank und statische Daten
hooks/           Custom React Hooks
lib/             Utilities und Hilfsfunktionen
locales/         Übersetzungen (de / en)
services/        Business-Logik, KI, Export, Storage
stores/          Redux Slices und Store-Konfiguration
tests/           E2E-Tests (Playwright) und Mocks
types/           Zod-Schemas und TypeScript-Typen
workers/         Web Worker (VPD-Simulation, Szenario)
```

---

## Lizenz

[MIT](LICENSE)

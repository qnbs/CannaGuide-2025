# CannaGuide 2025

**An offline-first grow companion for home cannabis cultivation: plan, track, simulate and learn on your own device, with optional AI.**

[![Ask DeepWiki](https://img.shields.io/badge/Ask-DeepWiki-1f6feb)](https://deepwiki.com/qnbs/CannaGuide-2025)

[![CI](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)
[![CodeQL](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/codeql.yml)
[![Deploy](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml)
[![Release](https://img.shields.io/badge/release-v1.12.1-brightgreen)](https://github.com/qnbs/CannaGuide-2025/releases/latest)
[![OpenSSF Scorecard](https://img.shields.io/ossf-scorecard/github.com/qnbs/CannaGuide-2025?label=OpenSSF%20Scorecard)](https://scorecard.dev/viewer/?uri=github.com/qnbs/CannaGuide-2025)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Coverage](https://img.shields.io/badge/coverage-43%25%20lines-yellow)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)
[![PWA](https://img.shields.io/badge/PWA-offline--first-blueviolet)](https://qnbs.github.io/CannaGuide-2025/)

**[Open the web app](https://qnbs.github.io/CannaGuide-2025/)** · **[Download the desktop app](https://github.com/qnbs/CannaGuide-2025/releases/latest)** · [Changelog](CHANGELOG.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](SECURITY.md) · [Ask DeepWiki](https://deepwiki.com/qnbs/CannaGuide-2025)

---

## Contents

- [What it is](#what-it-is)
- [Features](#features)
- [Install](#install)
- [Privacy and data](#privacy-and-data)
- [Architecture](#architecture)
- [Development](#development)
- [Quality, security and releases](#quality-security-and-releases)
- [Releases and roadmap](#releases-and-roadmap)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)

---

## What it is

CannaGuide 2025 runs **client-side**: there is no CannaGuide backend and no account. Your grows, plants, journals and settings live in your browser's or desktop app's local storage (IndexedDB).

The app uses the network only for these:

- cloud AI requests, sent directly to the provider you choose with your own key;
- cloud text-to-speech (ElevenLabs), only when you turn it on and store your own key;
- the one-time download of on-device models;
- the desktop update check.

**Local-Only mode** turns off the cloud AI and text-to-speech requests and the update check, and loads Transformers.js models from the browser cache only. It does **not yet** cover every on-device model download: the remaining download paths are being closed in [#700](https://github.com/qnbs/CannaGuide-2025/issues/700).

- **Web app (PWA):** installable from the browser, and works offline after the first visit.
- **Desktop app:** a [Tauri 2](https://v2.tauri.app/) shell for Windows, macOS (Apple silicon and Intel) and Linux, with signed in-app updates.
- **AI is optional:**
    - Cloud models with **your own API key** (BYOK).
    - **On-device** models that run locally after a one-time download.
    - **Deterministic heuristics** as the fallback when neither is available.

Five languages (English, German, Spanish, French, Dutch) and nine visual themes.

---

## Features

| Area                          | What you get                                                                                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grows and plants**          | Several grows with lifecycle stages from seed to curing, journals with photo timelines, metrics charts, EC/pH and hydro logs, problem tracking, QR plant tags and PDF grow reports. The app enforces a limit of **3 active plants** (see [legal limits](#legal)). |
| **Simulation**                | A VPD-based environment and growth model run off the main thread, plus what-if scenarios and an optional ESP32/MQTT sensor dashboard.                                                                                                                             |
| **Strain library**            | **776 strains** with search and filters (type, effects, THC/CBD, terpenes), terpene and cannabinoid profiles, a genealogy explorer and breeding predictions.                                                                                                      |
| **AI assistance**             | A grow mentor with retrieval from your own journals, leaf diagnosis from photos, equipment recommendations and grow summaries. Every AI surface carries a disclaimer.                                                                                             |
| **Knowledge**                 | A searchable lexicon, a disease and deficiency atlas, guided learning paths and a calculator hub (VPD, nutrients, pH/EC).                                                                                                                                         |
| **Equipment and calculators** | A setup configurator and calculators for ventilation, lighting (PPFD/DLI), nutrients, pot size, CO₂ and humidity.                                                                                                                                                 |
| **Accessibility and voice**   | Keyboard and screen-reader support, three colour-blind modes, optional voice commands and text-to-speech.                                                                                                                                                         |
| **Data control**              | JSON export and import, a Local-Only mode, and clearing of AI history.                                                                                                                                                                                            |

---

## Install

### Web app (PWA)

Open **[qnbs.github.io/CannaGuide-2025](https://qnbs.github.io/CannaGuide-2025/)** and use your browser's _Install_ option to add it like an app. After the first load it works offline.

### Desktop app

Download the installer for your platform from the **[latest release](https://github.com/qnbs/CannaGuide-2025/releases/latest)**:

| Platform | File                                                                                        | First launch                                                                                             |
| -------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Windows  | `…_x64-setup.exe` (recommended) or `…_x64_en-US.msi`                                        | SmartScreen warns about an unknown publisher: _More info → Run anyway_.                                  |
| macOS    | `…_aarch64.dmg` (Apple silicon) or `…_x64.dmg` (Intel)                                      | The app is not notarized. If macOS blocks it, open _System Settings → Privacy & Security → Open Anyway_. |
| Linux    | `…_amd64.AppImage` (make it executable) or `…_amd64.deb` (`sudo apt install ./…_amd64.deb`) | No extra step.                                                                                           |

- **Updates:** from v1.12.1 on, the app updates itself (_Settings → About_). Updates are minisign-signed and verified before install. Before the restart, the app saves your data and waits up to 10 seconds for that save to finish. A save that takes longer is tracked in [#883](https://github.com/qnbs/CannaGuide-2025/issues/883). It never checks for updates in Local-Only mode or offline.
- **Coming from v1.12.0?** Those desktop builds exit at startup, so they cannot update themselves. Install v1.12.1 manually over them. Your data folder stays the same.

The installers are not code-signed with a Windows or Apple developer certificate yet, which is why the operating systems warn on first launch.

---

## Privacy and data

- **No backend and no account.**
- **No crash reporting, no analytics.** Errors are written to your browser's console and stay on your device; the app sends error reports nowhere.
- **Your data stays local.** Plant data lives in IndexedDB on your device. Export and import are explicit JSON files.
- **BYOK.** Cloud AI uses _your_ provider key, encrypted at rest with AES-GCM (Web Crypto). Requests go from your device directly to the provider you choose; nothing passes through a CannaGuide server.
- **Local-Only mode** keeps AI on the device and stops cloud requests. Enforcement for every on-demand model download is being completed in [#700](https://github.com/qnbs/CannaGuide-2025/issues/700).
- **Cloud sync is disabled.** The retained sync implementation is not offered until it has a product and security decision (see [SECURITY.md](SECURITY.md)).

### Legal

Germany's Cannabis Act ([KCanG §9](https://www.gesetze-im-internet.de/kcang/__9.html)) allows up to three plants per adult. CannaGuide models a single user, and **caps active plants at three across all grows**. Every plant that is not marked _Finished_ counts, including plants in grows you have archived. The app shows an age gate (18+) on first use.

---

## Architecture

A pnpm and Turborepo monorepo. Only `@cannaguide/web` runs in the browser; the desktop app embeds that same web build.

```text
apps/web/          PWA (React 19, Vite 8, Tailwind 4): views, Redux + Zustand stores,
                   services (AI, simulation, persistence, crypto, IoT), web workers, locales
apps/desktop/      Tauri 2 shell: single-instance profile lock, safe quit, signed updater
packages/ai-core/  Shared AI types and provider configs; isolates the ML runtimes
packages/ui/       Design tokens for the nine themes, and the Tailwind preset
scripts/           Build, release, security and documentation gates
```

| Layer           | Technology                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| UI              | React 19, TypeScript 6 (strict), Tailwind CSS 4, Radix UI, Recharts, D3, Three.js                                                                |
| State           | Redux Toolkit (persisted domain state) and Zustand (UI state), bridged by `uiStateBridge`                                                        |
| Persistence     | IndexedDB with debounced, multi-tab-safe snapshot writes; a service worker via `vite-plugin-pwa`                                                 |
| Background work | Web workers dispatched by the WorkerBus: priorities, backpressure, cancellation                                                                  |
| Cloud AI        | Gemini, OpenAI, Anthropic and xAI through one facade (`aiFacade` → `aiService` → `aiProviderService`), with rate limits and Zod-validated output |
| On-device AI    | WebLLM (Qwen2.5 0.5B/1.5B, Llama 3.2 3B), then Transformers.js and ONNX Runtime Web, then heuristics. Inference results are cached in IndexedDB. |
| i18n            | i18next with English, German, Spanish, French and Dutch                                                                                          |
| Desktop         | Tauri 2 (Rust): a profile lock with single instance, quit and update after the final save, and a minisign-signed updater feed                    |

More detail: [Architecture](docs/ARCHITECTURE.md) · [Monorepo](docs/monorepo-architecture.md) · [Worker bus](docs/worker-bus.md) · [AI facade](docs/api/ai-facade.md) · [Local AI](docs/api/local-ai-infrastructure.md) · [ADRs](docs/adr/)

---

## Development

**Prerequisites:** Node.js `>=24.15.0 <25`, and the pnpm version pinned in `package.json` (via Corepack). Use `.node-version` to match the Node.js version used in GitHub Actions.

```bash
corepack enable pnpm
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @cannaguide/web dev    # http://localhost:5173/CannaGuide-2025/

pnpm verify         # typecheck the workspaces your branch changed
pnpm verify:test    # their unit tests
pnpm verify:lint    # their lint
pnpm --filter @cannaguide/web test:run path/to/file.test.ts   # one spec (no "--" before the name)
```

- The desktop app needs the Rust toolchain and Tauri's system dependencies. It is excluded from the default build.
- Git hooks are mandatory. They run identity, lint, format, typecheck and budget checks.
- Read [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [AGENTS.md](AGENTS.md) for the binding resource rules (the reference machine is low-memory).

---

## Quality, security and releases

The 30 CI workflows live in [`.github/workflows/`](.github/workflows/). Merges into `main` require signed commits, squash merges, resolved review threads, the `✅ CI Status` check and CodeQL.

| Area                | How it is checked                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests               | Vitest unit and integration tests, Playwright E2E (Chromium is required) and component tests, fast-check property tests, and Stryker mutation tests on a schedule. CI enforces a 43% line-coverage floor.                                                                                                                                                           |
| Static analysis     | TypeScript strict, ESLint, CodeQL (JS/TS, Actions, Rust, Python), Semgrep, Gitleaks and trojan-source checks                                                                                                                                                                                                                                                        |
| Dependencies        | Lockfile-frozen installs, bounded override floors, Snyk and Grype scans, and Dependabot                                                                                                                                                                                                                                                                             |
| Documentation truth | `check-doc-metrics` fails CI when this README's version, toolchain, coverage or workflow numbers drift from the source.                                                                                                                                                                                                                                             |
| Desktop releases    | Every installer is **installed and launched** on its own runner before upload (start, second instance, concurrent launches, restart, safe quit). After that come minisign-signed updater bundles, a verified `latest.json`, `SHA256SUMS`, GitHub build-provenance attestations and a CycloneDX SBOM. Releases are created as drafts and reviewed before publishing. |

### CI/CD Workflows (30)

| Workflow                   | Trigger                             | Purpose                                                                                                                                                                                                                                                                                                        |
| -------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI                         | push, PR                            | Lint, typecheck, unit tests with coverage, build, security checks, Chromium E2E; the `✅ CI Status` merge gate                                                                                                                                                                                                 |
| CodeQL                     | push, PR, weekly                    | SAST for JS/TS, GitHub Actions, Rust and Python                                                                                                                                                                                                                                                                |
| Desktop Build (Tauri v2)   | PR (desktop paths), manual, release | Builds Windows, macOS (arm64, x64) and Linux, and launches every bundle before upload                                                                                                                                                                                                                          |
| Release Gate               | tag `v*`                            | Pre-release quality gate                                                                                                                                                                                                                                                                                       |
| Release Publish            | tag `v*`                            | Verified desktop assets, provenance and SBOM attestations, and a draft GitHub release                                                                                                                                                                                                                          |
| Deploy to GitHub Pages     | after CI on `main`                  | Production PWA, E2E smoke and Lighthouse                                                                                                                                                                                                                                                                       |
| Deploy to Cloudflare Pages | after CI on `main`                  | Mirror deployment of the PWA                                                                                                                                                                                                                                                                                   |
| Fuzzing                    | push, PR, weekly                    | fast-check property tests                                                                                                                                                                                                                                                                                      |
| IoT Integration Tests      | push, PR                            | MQTT and ESP32 mock integration                                                                                                                                                                                                                                                                                |
| OSSF Scorecard             | weekly, manual                      | Supply-chain posture                                                                                                                                                                                                                                                                                           |
| Snyk Security              | schedule, manual                    | Dependency vulnerability scan                                                                                                                                                                                                                                                                                  |
| Mutation Testing           | schedule, manual                    | Stryker on the Redux slices                                                                                                                                                                                                                                                                                    |
| + 18 more                  | various                             | On-demand Claude review, security full scan and scan, config guard, dependency health, docs gates, Cloudflare preview build, preview validation, Graphify update, strain catalog sync and merge check, benchmarks, Dependabot auto-merge, labeler, stale, branch and deployment cleanup, provenance quarantine |

Security policy and reporting: [SECURITY.md](SECURITY.md). Release procedure: [docs/release-process.md](docs/release-process.md). Gate inventory: [docs/DEVOPS-GATES.md](docs/DEVOPS-GATES.md).

---

## Releases and roadmap

| Version                                                                 | Date       | Highlights                                                                                                                          |
| ----------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [v1.12.1](https://github.com/qnbs/CannaGuide-2025/releases/tag/v1.12.1) | 2026-11-18 | Desktop recovery: the apps start again, one instance per user, safe quit and update, and every installer is launched before release |
| [v1.12.0](https://github.com/qnbs/CannaGuide-2025/releases/tag/v1.12.0) | 2026-11-18 | First desktop release with installers for all platforms. The desktop apps do not start, so use v1.12.1.                             |
| [v1.11.0](https://github.com/qnbs/CannaGuide-2025/releases/tag/v1.11.0) | 2026-10-27 | Web/PWA release                                                                                                                     |
| [v1.10.0](https://github.com/qnbs/CannaGuide-2025/releases/tag/v1.10.0) | 2026-10-07 | Semantic colour tokens and accessibility fixes across the nine themes                                                               |

Every change is in the [Changelog](CHANGELOG.md). Planned work is tracked in the [roadmap](ROADMAP.md) and in the open epics:

- the WorldScript → CannaGuide adaptation programme ([#876](https://github.com/qnbs/CannaGuide-2025/issues/876));
- the end-to-end AI audit ([#738](https://github.com/qnbs/CannaGuide-2025/issues/738));
- UI/UX ([#877](https://github.com/qnbs/CannaGuide-2025/issues/877)).

---

## Contributing

Contributions are welcome:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. [Open an issue](https://github.com/qnbs/CannaGuide-2025/issues) to discuss your change.
3. Then send a focused pull request. Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and must be signed.

**Acknowledgments:** the AI and ML runtimes from MLC WebLLM, Hugging Face Transformers.js and ONNX Runtime Web; React, Vite, Tailwind CSS, Radix UI, Redux Toolkit, Zustand, i18next, Zod, Recharts, D3 and Three.js; Tauri; and the security tooling of DOMPurify, CodeQL, Semgrep, Gitleaks, Snyk and OpenSSF Scorecard. Strain data was compiled with AI-assisted research from publicly available breeder, seedbank and community information.

Licensed under the [MIT License](LICENSE).

---

## Disclaimer

All information in this app is for educational purposes only. Cannabis cultivation is regulated, and the rules differ between countries. Check the law where you live, and always act responsibly. This app does not provide legal or medical advice. AI output can be wrong; verify it before acting on it.

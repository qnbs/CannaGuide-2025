[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/qnbs/CannaGuide-2025)

<!--
This README file supports two languages.
- English version is first.
- Deutsche Version (German version) follows below.
-->

# 🌿 CannaGuide 2025 (English)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/badge/release-v1.1.0-brightgreen)](https://github.com/qnbs/CannaGuide-2025/releases)
[![CI](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)
[![Deploy](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml)
[![Sentry](https://img.shields.io/badge/errors-Sentry-362D59?logo=sentry&logoColor=white)](https://sentry.io)
[![Tech Stack](https://img.shields.io/badge/stack-React%2019%20%7C%20TypeScript%20%7C%20Redux%20%7C%20Vite%207-3178C6?logo=react&logoColor=white)](https://react.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline-blueviolet)]()
[![Local AI](https://img.shields.io/badge/Local%20AI-On--Device%20ML-ff6f00?logo=tensorflow&logoColor=white)]()
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Dual%20Persistence-00897B?logo=indexeddb&logoColor=white)]()
[![i18n](https://img.shields.io/badge/i18n-EN%20|%20DE-orange)]()
[![WCAG 2.2 AA](https://img.shields.io/badge/a11y-WCAG%202.2%20AA-green)]()
[![DSGVO](https://img.shields.io/badge/DSGVO-compliant-blue)]()
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Google AI Studio](https://img.shields.io/badge/Google%20AI%20Studio-Ready-34A853?logo=google&logoColor=white)](https://aistudio.google.com/)
[![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-Enabled-000000?logo=githubcopilot&logoColor=white)](https://github.com/features/copilot)
[![Claude Opus 4.6](https://img.shields.io/badge/Claude-Opus%204.6-FF9900?logo=anthropic&logoColor=white)](https://www.anthropic.com/claude)
[![OpenAI GPT 5.4mini](https://img.shields.io/badge/OpenAI-GPT%205.4mini-412991?logo=openai&logoColor=white)](https://openai.com/)
[![xAI Grok 4.20](https://img.shields.io/badge/xAI-Grok%204.20-111111)](https://x.ai/)
[![Codespaces / VS Code](https://img.shields.io/badge/Codespaces%20%2F%20VS%20Code-Ready-007ACC?logo=visualstudiocode&logoColor=white)](https://github.com/features/codespaces)

**The Definitive AI-Powered Cannabis Cultivation Companion**

CannaGuide 2025 is your definitive AI-powered digital co-pilot for the entire cannabis cultivation lifecycle. Engineered for both novice enthusiasts and master growers, this state-of-the-art **Progressive Web App (PWA)** guides you from seed selection to a perfectly cured harvest. Simulate grows with an advanced VPD-based engine, explore a vast library of 700+ strains with a powerful genealogy tracker, diagnose plant issues with a photo, breed new genetics in the lab, plan equipment with Gemini-powered intelligence, monitor your room with live ESP32 sensors, and master your craft with an interactive, data-driven guide.

**Live App (GitHub Pages):** https://qnbs.github.io/CannaGuide-2025/

---

## Table of Contents

- [⭐ Project Philosophy](#-project-philosophy)
- [🚀 Key Features](#-key-features)
    - [1. The Grow Room (`Plants` View)](#1-the-grow-room-plants-view)
    - [2. The Strain Encyclopedia (`Strains` View)](#2-the-strain-encyclopedia-strains-view)
    - [3. The Workshop (`Equipment` View)](#3-the-workshop-equipment-view)
    - [4. The Library (`Knowledge` View)](#4-the-library-knowledge-view)
    - [5. The Help Desk (`Help` View)](#5-the-help-desk-help-view)
    - [6. The Command Center (`Settings` View)](#6-the-command-center-settings-view)
    - [7. Platform-Wide Features](#7-platform-wide-features)
- [💻 Technical Deep Dive](#-technical-deep-dive)
- [🧠 Local AI Architecture](#-local-ai-architecture)
- [🔒 Security & DSGVO/GDPR](#-security--dsgvogdpr)
- [🤖 Multi-Provider AI (BYOK)](#-multi-provider-ai-byok)
- [🏁 Getting Started (User Guide)](#-getting-started-user-guide)
- [🛠 Local Development (Developer Guide)](#-local-development-developer-guide)
- [📦 Distribution Targets](#-distribution-targets)
- [🔐 Gemini BYOK Setup](#-gemini-byok-setup)
- [🚀 GitHub Pages Deployment](#-github-pages-deployment)
- [🤔 Troubleshooting](#-troubleshooting)
- [🤖 Development with AI Studio & Open Source](#-development-with-ai-studio--open-source)
- [🤝 Contributing](#-contributing)
- [🗺 Roadmap](#-roadmap)
- [📊 Tools & Stack](#-tools--stack)
- [⚠ Disclaimer](#-disclaimer)
- [Deutsche Version](#-cannaguide-2025-deutsch)

---

## ⭐ Project Philosophy

CannaGuide 2025 is built upon a set of core principles designed to deliver a best-in-class experience:

> **Offline First**: Your garden doesn't stop when your internet does. The app is engineered to be **100% functional offline**. All actions (like logging watering or adding notes) performed while offline are automatically queued and synced in the background via the browser's SyncManager API once your connection is restored. When the cloud AI is unreachable, a **three-layer local AI stack** — WebLLM (Qwen2.5-1.5B on WebGPU), Transformers.js (text + CLIP vision), and deterministic heuristics — delivers real ML-powered plant diagnoses, mentor chat, and grow advice entirely on-device. All your data, notes, and AI archives are stored locally and accessible anytime, anywhere.

> **Performance is Key**: A fluid, responsive UI is non-negotiable. Heavy lifting, like the complex, multi-plant simulation, is offloaded to a dedicated **Web Worker**, ensuring the user interface remains smooth and instantaneous at all times. Large strain lists leverage **virtualized rendering** (via `useVirtualizer`) to maintain 60fps scrolling even with 700+ items.

> **Data Sovereignty**: Your data is yours, period. The ability to **export and import your entire application state** as a single file gives you complete control, ownership, and peace of mind for backups or device migration. Share your curated strain collections with the community via **anonymous GitHub Gists** — one click to export, one link to import.

> **AI as a Co-pilot**: We leverage the Google Gemini API not as a gimmick, but as a powerful tool to provide **actionable, context-aware insights**. From diagnosing a sick plant from a photo to generating a custom equipment list, AI serves to genuinely assist the grower at every stage. A **RAG-powered journal search** ensures the AI contextualizes advice with your actual grow history.

> **Resilience & Recovery**: Corruption-proof architecture with **safe recovery** mechanisms that automatically detect and repair corrupted state, plus **archive capping** (100 mentor + 50 advisor responses per plant) to prevent unbounded IndexedDB growth.

---

## 🚀 Key Features

### 1. The Grow Room (`Plants` View)

Your command center for managing and simulating up to three simultaneous grows.

- **Advanced Simulation Engine**: VPD-based simulation with altitude correction, biomass-scaled consumption, and structural growth, all offloaded to a dedicated **Web Worker**.
- **Simulation Profiles**: Choose between `Beginner`, `Intermediate`, and `Expert` simulation profiles in the settings to adjust complexity and reveal advanced physics parameters.
- **Grow Stats Dashboard**: Real-time yield forecasts, daily energy costs, cumulative spend, and an upcoming events timeline.
- **Live VPD Gauge**: Color-coded VPD ranges for each growth stage, with configurable leaf temperature offset and altitude correction.
- **ESP32 Sensor Integration**: Connect your ESP32-based environmental sensors via **WebBluetooth** to feed live temperature and humidity data directly into the simulation. Reads GATT Environmental Sensing characteristics for lab-grade accuracy.
- **AI-Powered Diagnostics**:
    - **Photo Diagnosis**: Upload or capture a plant photo. EXIF/GPS metadata is stripped, the image is compressed, and Gemini returns an instant diagnosis with actions and prevention tips.
    - **Proactive Advisor**: Get advice from Gemini based on live plant vitals. Recommendations are archived with full CRUD support and capped at 50 entries per plant.
    - **Deep Dive Guides**: Generate contextual deep-dive articles on topics like terpene preservation or defoliation timing.
- **Comprehensive Logging**: Maintain a detailed, filterable journal for every action. The **RAG-powered grow log** helps AI answer using relevant history with recency weighting.
- **Grow Reminders (Push Notifications)**: Set reminders for VPD alarms, watering, and harvest windows. Periodic Background Sync is used when available, with cooldown and snooze tracking.
- **Post-Harvest Simulation**: Track drying, curing, humidity, burping, terpene retention, chlorophyll degradation, and CBN conversion in one dedicated flow.
- **What-If Experiments**: Compare scenarios like +2°C vs. -2°C or Topping vs. LST on a clone without risking the real plant.

### 2. The Strain Encyclopedia (`Strains` View)

Your central knowledge hub, designed for deep exploration with **offline-first** access.

- **Vast Library**: Access detailed information on **700+ cannabis strains** with intelligent **alias resolution** (~30 common name variations like "GSC" → "Girl Scout Cookies", "GG#4" → "Gorilla Glue" automatically mapped).
- **Interactive Genealogy Tree**: Explore a crash-proof, d3-powered lineage tree with alias resolution, landrace highlighting, ancestry tracing, and configurable depth collapsing.
- **Entourage Effect Analysis**: Explore the science behind terpene-cannabinoid interactions with an evidence-based **terpene database** mapping pharmacological effects, cannabinoid receptor activity (CB1, CB2, TRPV1), and scientific citations.
- **Chemotype Calculator**: Analyze any strain's cannabinoid and terpene profile to determine the **dominant chemotype**, profile classification, and tailored cultivation guidance.
- **High-Performance Search & Filtering**: Find strains fast with IndexedDB full-text search, alphabetical filters, multi-select criteria, and a virtualized result list.
- **Personal Strain Collection**: Enjoy full **CRUD (Create, Read, Update, Delete)** functionality to add and manage your own custom strains.
- **Community Strain Sharing**: Export curated collections as anonymous GitHub Gists and import shared lists via gist URL, all validated with Zod schemas.
- **AI Grow Tips**: Generate strain-specific cultivation advice with a Gemini image and manage it in a dedicated tips archive.
- **Text-to-Speech**: Any AI-generated content can be read aloud using the **Speakable** component, with configurable voice selection, speech rate, and optional text highlighting.
- **Flexible Data Export**: Export your selected or filtered strain lists in formats **PDF, TXT**.

### 3. The Workshop (`Equipment` View)

Your toolkit for planning and optimizing your grow setup.

- **Advanced AI Setup Configurator**: Define your grow space, experience, budget, and priorities to get a brand-specific equipment list from Gemini AI.
- **Saved Setups**: Full **CRUD** functionality for your generated equipment lists. Edit, delete, and manage your setups for future use.
- **Suite of Calculators**: Access a comprehensive set of precision tools:
    - Ventilation Calculator (m³/h)
    - Light Calculator (PPFD/DLI & Wattage)
    - Electricity Cost Calculator
    - Nutrient Mix Calculator
    - EC/PPM Converter
    - Yield Estimator
- **Curated Shop Lists**: Browse recommended Grow Shops and Seedbanks for both European and US/Canadian markets.

### 4. The Library (`Knowledge` View)

Your complete resource for learning and problem-solving.

- **Context-Aware AI Mentor**: Ask the AI Mentor for advice based on your active plant and RAG-powered journal history. Conversations are archived with full CRUD support and capped at 100 entries.
- **Breeding Lab**: Cross your high-quality collected seeds to create entirely new, **permanent hybrid strains** with Punnett Square-based genetic modeling. New breeds are added to your personal library and can be used in future grows.
- **Interactive Sandbox**: Run what-if scenarios like Topping vs. LST on a clone to compare training effects with d3-powered charts.

### 5. The Help Desk (`Help` View)

Your go-to for in-app support and learning resources.

- **Comprehensive User Manual**: A detailed, built-in guide explaining every feature of the app.
- **Searchable FAQ**: Quickly find answers to common cultivation questions.
- **Grower's Lexicon**: An extensive glossary of cannabis terms, from cannabinoids and terpenes to advanced growing techniques.
- **Visual Guides**: Simple, animated guides for core techniques like Topping and LST.

### 6. The Command Center (`Settings` View)

A sophisticated hub to customize every aspect of your CannaGuide experience.

- **UI & Theme Customization**: Choose from multiple cannabis-inspired themes (`Midnight`, `Forest`, `Purple Haze`), adjust font sizes, and switch between `Comfortable` and `Compact` UI densities.
- **Accessibility Suite**: Activate a **Dyslexia-Friendly Font**, **Reduced Motion** mode, and various **Colorblind Modes** (Protanopia, Deuteranopia, Tritanopia).
- **Voice & Speech**: Configure Text-to-Speech (TTS) voices and rates, and manage voice command settings.
- **Simulation Tuning**: Adjust simulation parameters including **leaf temperature offset** and **altitude** for precision VPD calculations.
- **Local AI Settings**: Preload models on demand, force WASM for debugging, switch between balanced and lightweight text models, and monitor backend/storage status.
- **One-Tap Cloud Sync**: Back up and restore the app state to an anonymous GitHub Gist with Gist ID, sync timestamps, and Zod validation.
- **Data Sovereignty**: Backup, restore, reset specific data, and review storage usage with configurable auto-backup and persistence timing.

### 7. Platform-Wide Features

- **Full PWA & Offline Capability**: Install the app for a native-like experience with Network-First navigation, Cache-First assets, and full offline access to data and AI archives.
- **Command Palette (`Cmd/Ctrl + K`)**: A power-user tool with **40+ commands** grouped by Navigation, Strains, Plants, and Settings for instant, click-free access across the entire application.
- **Voice Control**: Navigate the app, search for strains, and perform actions using simple voice commands.
- **Full Internationalization (i18n)**: Complete EN/DE translations with the full namespaced locale set. AI responses are localized automatically.
- **Safe Recovery**: Automatic detection and repair of corrupted application state. If IndexedDB hydration fails, the app gracefully falls back to a clean state rather than presenting a blank screen.
- **Daily Strain Catalog Automation**: A daily GitHub Actions workflow merges, deduplicates, and validates the 700+ strain catalog, then opens PRs for new entries.
- **Local AI Fallback**: When the cloud API is unavailable, the app falls back to a three-layer local AI stack with caching for repeat queries. See [docs/local-ai-developer-guide.md](docs/local-ai-developer-guide.md) and [docs/local-ai-troubleshooting.md](docs/local-ai-troubleshooting.md).

---

## 💻 Technical Deep Dive

CannaGuide 2025 is built on a modern, robust, and scalable tech stack designed for performance and offline-first reliability.

### Key Technologies

| Category             | Technology                                                                                                      | Purpose                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)                               | Modern, type-safe, and performant user interface.                                                               |
| **State Management** | [Redux Toolkit](https://redux-toolkit.js.org/)                                                                  | Centralized, predictable state management with memoized selectors.                                              |
| **AI Integration**   | [Google Gemini API](https://ai.google.dev/gemini-api/docs) (`@google/genai`)                                    | Powers all online AI features; the local AI fallback stack keeps diagnostics and advice available offline.      |
| **Local AI**         | [@xenova/transformers](https://huggingface.co/docs/transformers.js) + [@mlc-ai/web-llm](https://webllm.mlc.ai/) | Three-layer on-device ML: WebLLM (Qwen2.5-1.5B, WebGPU), Transformers.js (Qwen text + CLIP vision), heuristics. |
| **Async Operations** | [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)                                                    | Manages all Gemini API interactions with automatic caching and loading states.                                  |
| **Concurrency**      | [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)                                 | Runs the complex plant simulation off the main thread to ensure a smooth UI.                                    |
| **Data Persistence** | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (dual-database architecture)        | Full offline functionality via `CannaGuideStateDB` (Redux) and `CannaGuideDB` (strains, images, search).        |
| **PWA & Offline**    | [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) (InjectManifest)         | Network-First navigation, Cache-First assets, Background Sync, and auto-update flow.                            |
| **Validation**       | [Zod](https://zod.dev/)                                                                                         | Runtime schema validation for AI responses, import payloads, and community shares.                              |
| **Visualization**    | [d3 v7](https://d3js.org/)                                                                                      | Genealogy trees, growth charts, and comparison visualizations.                                                  |
| **Styling**          | [Tailwind CSS](https://tailwindcss.com/)                                                                        | Utility-first approach with themed CSS custom properties.                                                       |
| **i18n**             | [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/)                               | Namespaced EN/DE translations with `getT()` for non-component contexts.                                         |
| **IoT**              | [WebBluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)                          | ESP32 GATT Environmental Sensing for live sensor data.                                                          |
| **Build**            | [Vite 7](https://vitejs.dev/) + [VitePWA](https://vite-pwa-org.netlify.app/)                                    | Lightning-fast HMR, optimized production builds, and SW injection.                                              |
| **Testing**          | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)                                           | Unit/integration tests and E2E smoke/accessibility checks.                                                      |

### Quality Gates

CannaGuide uses automated checks for everyday development and release confidence:

- Coverage target: 95%+ for lines, statements, and functions.
- Mutation testing: Stryker runs against core service, store, and component code.
- Security gating: `npm audit` is enforced in CI.
- Accessibility gating: Lighthouse CI runs with a 100% accessibility threshold.
- Container gating: Docker images are scanned with Trivy before release.

### Dual IndexedDB Architecture

The app uses two separate IndexedDB databases for clean separation of concerns:

- **`CannaGuideStateDB`**: Stores the serialized Redux state. Hydration uses a **promise-locked** pattern to prevent race conditions during concurrent reads — only the first call opens the database connection, and subsequent calls await the same promise. State is debounce-saved on every Redux change (1s) and force-saved on `visibilitychange`/`pagehide`.

- **`CannaGuideDB`**: Stores the strain library, compressed images (auto-pruned beyond a configurable threshold), and the full-text search index. Image pruning consolidates read + delete into a single `openDB()` call for efficiency.

### Memoized Selector Architecture

Performance-critical selectors like `selectPlantById` use a **manually managed Map cache** with explicit return typing `(state: RootState) => Plant | null` to avoid per-render re-computation. The cache is keyed by plant ID, and selectors use `??` (nullish coalescing) instead of `||` for correct `0`/`""` handling.

### Gemini Service Abstraction (`geminiService.ts`)

As noted in the [project's DeepWiki](https://deepwiki.com/qnbs/CannaGuide-2025), the `geminiService.ts` file is a critical component that acts as a central abstraction layer for all communication with the Google Gemini API. This design decouples the API logic from the UI components and the Redux state management layer (RTK Query), making the code cleaner, more maintainable, and easier to test.

All AI-powered features in the application route their requests through this service. RTK Query hooks (e.g., `useGetPlantAdviceMutation`) are configured to use a `queryFn` that calls the corresponding method in `geminiService`.

**Key Responsibilities & Methods:**

- **Initialization**: The service initializes a single `GoogleGenAI` instance, ensuring the API key is handled in one central location.
- **Context & Localization**: It uses helper functions (`formatPlantContextForPrompt`, `createLocalizedPrompt`) to automatically format real-time plant data into a consistent context report and prepend the correct language instruction (`"IMPORTANT: Your entire response must be exclusively in English..."`) to every prompt sent to the API. This ensures all AI responses are tailored and correctly localized.
- **RAG-Powered Context**: The `growLogRagService` performs token-based relevance ranking with recency boosting over the plant's entire journal to provide the AI with the most pertinent grow history entries, rather than dumping the full log.
- **Structured JSON Output**: For features requiring structured data, the service leverages Gemini's JSON mode.
    - `getEquipmentRecommendation`, `diagnosePlant`, `getMentorResponse`, `getStrainTips`, `generateDeepDive`: These methods pass a `responseSchema` in the request configuration. This forces the model to return a valid JSON object that matches the defined TypeScript types (e.g., `Recommendation`, `PlantDiagnosisResponse`), eliminating the need for fragile string parsing on the client side.
- **Multimodal Input (Vision)**:
    - `diagnosePlant`: This method demonstrates multimodal capabilities by accepting a Base64-encoded image and combining it with the text-based context report into a multipart request. The `gemini-2.5-flash` model then analyzes both the image and the data to provide a diagnosis.
- **Image Generation**:
    - `generateStrainImage`: This method uses the specialized `gemini-2.5-flash-image` model and configures `responseModalities: [Modality.IMAGE]` to generate a unique, artistic image for a given strain, which is then used in the AI Grow Tips feature.
- **Model Selection**: The service intelligently selects the appropriate model for the task. It uses the cost-effective and fast `gemini-2.5-flash` for most text and vision tasks, but switches to the more powerful `gemini-2.5-pro` for the complex `generateDeepDive` feature, which requires more advanced reasoning.
- **Error Handling**: Each method includes `try...catch` blocks that wrap the API call. On failure, it logs the error and throws a new, localized error message (using keys from the translation files, e.g., `'ai.error.diagnostics'`), which RTK Query then provides to the UI for graceful display.
- **Local Fallback**: When the API is unreachable, the three-layer local AI stack (WebLLM → Transformers.js → heuristics) provides ML-powered plant advice, diagnoses, and mentor chat entirely on-device.

### PWA Update Strategy (Deployment)

The app uses a low-friction update flow designed to avoid manual hard refreshes in most cases:

- **Proactive Update Checks**: The registration triggers `registration.update()` on load, on tab focus, when the page becomes visible again, and every 5 minutes in active sessions.
- **Fresh Service Worker Fetching**: Registration uses `updateViaCache: 'none'` so browser cache is less likely to delay new SW script discovery.
- **Navigation Network-First**: Page navigations attempt network first, then fall back to cache/offline. This helps deployments surface quickly.
- **Auto-Activation + Auto-Reload**: When a new worker is waiting, the app sends `SKIP_WAITING` and reloads automatically on `controllerchange`.
- **Background Sync**: Offline actions are queued and replayed when connectivity returns via the `SyncManager` API.
- **Manual Fallback**: The in-app update banner remains available as a safety fallback if automatic activation is delayed.

### Resilience & State Management

- **Safe Recovery**: The boot sequence wraps store creation in a `try/catch`. If IndexedDB hydration fails (corrupted state, schema mismatch), the app clears the corrupted state and restarts with defaults — no blank screen ever.
- **Promise-Locked Hydration**: IndexedDB reads are funneled through a single-promise lock to prevent race conditions when multiple slices try to hydrate concurrently.
- **Archive Capping**: Mentor archives are capped at **100 entries** and advisor archives at **50 entries per plant**, with FIFO culling to prevent unbounded storage growth.
- **Listener Middleware**: A Redux listener middleware handles side effects (URL sync, background sync registration, journal entry automation) with localized notifications via `getT()`.

### Project Structure

The codebase is organized into logical directories to promote maintainability and scalability:

- `components/`: Contains all React components, organized by view or commonality.
- `stores/`: Home to the Redux store, slices, selectors, and middleware.
- `services/`: Houses business logic, including the simulation engine, database interactions, AI service wrappers, community sharing, and IoT sensor integration.
- `hooks/`: Contains custom React hooks for shared logic like focus traps, PWA installation, virtualized lists, command palette, and more.
- `data/`: Stores static data, such as the strain library, lexicon, alias maps, and FAQ content.
- `locales/`: Contains all internationalization (i18n) translation files (namespaced: `common`, `plants`, `knowledge`, `strains`, `equipment`, `settings`, `help`, `commandPalette`, `onboarding`, `seedbanks`, `strainsData`).
- `workers/`: Web Worker scripts for background simulation processing.
- `utils/`: Shared utility functions.
- `types/`: TypeScript type definitions and Zod schemas.

---

## 🧠 Local AI Architecture

CannaGuide ships with a production-grade, three-layer on-device ML stack that provides privacy-preserving, zero-latency AI when the cloud API is unreachable (offline, quota exceeded, missing key) — or whenever models are pre-loaded and warm.

### Three-Layer Fallback Cascade

```
[Cloud Gemini API]
        │ ← unavailable?
        ▼
┌─ Layer 1 ─── WebLLM (WebGPU) ─────────────────────────────┐
│  Qwen2.5-1.5B-Instruct (q4f16_1, MLC-compiled)            │
│  Full chat-completion inference on GPU via @mlc-ai/web-llm  │
│  → Best quality, requires navigator.gpu                     │
└────────────────────────────────────────────────────────────┘
        │ ← WebGPU unavailable or load error?
        ▼
┌─ Layer 2 ─── Transformers.js (ONNX) ──────────────────────┐
│  Text:   Xenova/Qwen2.5-1.5B-Instruct (primary)           │
│          Xenova/Qwen3-0.5B (ultra-light fallback)          │
│  Vision: Xenova/clip-vit-large-patch14 (zero-shot, 33 lbl) │
│  Backend: WebGPU → WASM (auto-detected)                    │
└────────────────────────────────────────────────────────────┘
        │ ← model load fails or timeout?
        ▼
┌─ Layer 3 ─── Deterministic Heuristics ─────────────────────┐
│  Rule-based plant diagnosis (VPD, pH, EC, temp, moisture)  │
│  Localized EN/DE advice, zero network dependency           │
│  Guaranteed response — always available                     │
└────────────────────────────────────────────────────────────┘
```

### Model Inventory

| Constant                  | Model                                                    | Purpose                                                       | Runtime         |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- | --------------- |
| `WEBLLM_MODEL_ID`         | `Qwen2.5-1.5B-Instruct-q4f16_1-MLC`                      | Full chat completion on WebGPU, best local quality            | @mlc-ai/web-llm |
| `TEXT_MODEL_ID`           | `Xenova/Qwen2.5-1.5B-Instruct`                           | Primary text generation (multilingual, strong DE performance) | Transformers.js |
| `ALT_TEXT_MODEL_ID`       | `Xenova/Qwen3-0.5B`                                      | Ultra-light fallback for low-end devices                      | Transformers.js |
| `VISION_MODEL_ID`         | `Xenova/clip-vit-large-patch14`                          | Zero-shot plant condition classification (33 cannabis labels) | Transformers.js |
| `EMBEDDING_MODEL_ID`      | `Xenova/all-MiniLM-L6-v2`                                | 384-dim semantic embeddings for RAG & strain similarity       | Transformers.js |
| `SENTIMENT_MODEL_ID`      | `Xenova/distilbert-base-uncased-finetuned-sst-2-english` | Journal sentiment analysis (positive/negative/neutral)        | Transformers.js |
| `SUMMARIZATION_MODEL_ID`  | `Xenova/distilbart-cnn-6-6`                              | Text summarization for grow logs and mentor history           | Transformers.js |
| `ZERO_SHOT_TEXT_MODEL_ID` | `Xenova/mobilebert-uncased-mnli`                         | Query classification (15 grow topics) + language detection    | Transformers.js |

### 33 Zero-Shot Cannabis Condition Labels

The CLIP vision model classifies plant photos against a curated label set covering the full spectrum of cannabis cultivation problems:

**Nutrient Deficiencies** (10): Nitrogen, Phosphorus, Potassium, Calcium, Magnesium, Iron, Zinc, Sulfur, Manganese, Boron
**Environmental Stress** (7): Heat stress, Light stress, Light burn, Cold stress, Wind burn, Nutrient burn, Nutrient lockout
**Watering Issues** (2): Overwatering, Underwatering
**Pests & Disease** (9): Powdery mildew, Botrytis bud rot, Spider mites, Fungus gnats, Aphids, Thrips, Whiteflies, Fungal leaf spot, Septoria leaf spot
**Other** (5): Root rot, pH imbalance, Revegetation stress, Tobacco mosaic virus, Healthy plant

Each label maps to localized diagnostic text in both EN and DE with actionable cultivation advice.

### ONNX Backend Routing

`localAIModelLoader.ts` automatically detects the optimal execution provider:

1. **WebGPU** — when `navigator.gpu` is present (modern Chrome, Edge). Offers near-native GPU acceleration.
2. **WASM** — universal fallback for all browsers. Reliable but slower.

A **Force WASM** toggle in Settings overrides auto-detection for debugging. `onnxruntime-web` (v1.21+) is a direct dependency for stable WebGPU and WASM ONNX execution.

### Inference Caching & Retry

- **LRU Cache**: Map with max **64 entries**, keyed by the first 200 characters of each prompt. Identical prompts return cached results instantly without model inference.
- **Retry Logic**: Up to **2 retries** with 500ms exponential backoff before falling back to heuristics. Failed attempts do not pollute the cache.
- **Pipeline Cache**: `loadTransformersPipeline` stores pipeline promises keyed by `task::modelId`. Subsequent calls return the cached promise; failures auto-evict so the next call can retry.

### Central AI Routing (`aiService.ts`)

All AI calls originate from `aiService.ts`, which decides whether to route to the cloud (Gemini) or the local stack:

```ts
shouldRouteLocally() → isOffline() || localAiPreloadService.isReady()
```

- When offline **or** local models have been pre-loaded, requests are handled entirely on-device.
- `generateStrainImage` and `getEquipmentRecommendation` always route to Gemini (require cloud capabilities).
- The Gemini service's `shouldUseLocalFallback()` additionally checks `isReady()` before attempting local inference on API errors.

### Preload & Progress UI

Users can trigger on-demand model preloading from **Settings → General & UI**:

- Real-time progress bar showing loaded/total models and current label (text-model → vision-model → web-llm).
- Persistent status tracking via `localStorage` (state, timestamps, per-model readiness, persistent storage grant status).
- `isReady()` convenience check: returns `true` when state is `'ready'` or `'partial'` with the text model loaded.
- Preload timing benchmarks displayed after completion.

### Sentry Error Attribution

All local AI failures are captured via `captureLocalAiError()` in `sentryService.ts` with structured tags:

```
feature: local-ai
ai.stage: preload | inference | vision | webllm | fallback
ai.model: <model-id>
ai.backend: webgpu | wasm
retryAttempt: 0 | 1 | 2
```

This enables filtering and monitoring of local AI health in the Sentry dashboard separately from cloud AI errors.

### Bundle Strategy

Local AI runtimes are code-split into a dedicated `ai-runtime` chunk via Vite's `manualChunks`:

```
@xenova/transformers + onnxruntime-web + @mlc-ai/web-llm → ai-runtime.js
```

The chunk is excluded from `optimizeDeps` pre-bundling and loaded lazily only when local AI is needed, keeping the main bundle lean.

### Extended NLP Pipeline

Beyond core text generation and vision, the local stack includes dedicated NLP pipelines:

| Pipeline                     | Model              | Capabilities                                                                               |
| ---------------------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| **Sentiment Analysis**       | DistilBERT (SST-2) | Journal entry mood tracking, trend detection (improving/declining/stable), batch analysis  |
| **Text Summarization**       | DistilBART (CNN)   | Condense grow logs (up to 4096 chars), mentor chat compression, configurable output length |
| **Zero-Shot Classification** | MobileBERT (MNLI)  | 15 cannabis grow topic categories, smart query routing, language detection                 |
| **Semantic Embeddings**      | all-MiniLM-L6-v2   | 384-dim vectors, cosine similarity ranking, RAG context retrieval, strain matching         |

### Language Detection

`localAiLanguageDetectionService.ts` auto-detects input language for the bilingual EN/DE app:

1. **Model-based** — Zero-shot classification between "English text" and "German text" with confidence scores.
2. **Heuristic fallback** — Word-frequency analysis using German indicators (ä, ö, ü, ß + 35 common words) and English indicators for sub-3-char inputs or when the model is unavailable.

This enables automatic AI response language selection and journal entry tagging without user intervention.

### Image Similarity & Growth Progression

`localAiImageSimilarityService.ts` uses CLIP's 768-dimensional feature vectors for visual analysis:

- **Photo comparison** — Cosine similarity between two plant photos (0–1 score).
- **Similar image search** — Rank a collection of photos by visual similarity to a query image.
- **Growth progression tracking** — Analyze chronological photos to detect visual change rate and classify growth trends (accelerating / decelerating / stable).

Sequential processing prevents memory pressure on low-end devices.

### Health Monitoring & Adaptive Selection

`localAiHealthService.ts` provides comprehensive stack diagnostics:

- **Device classification**: `high-end` / `mid-range` / `low-end` / `unknown` based on WebGPU, core count, and RAM via `navigator.deviceMemory`.
- **Memory pressure detection**: Monitors `performance.memory` (Chromium) and warns at >80% heap usage.
- **Adaptive model recommendations**: Automatically suggests lighter models (Qwen3-0.5B, disable WebLLM) when memory or device class warrants it.
- **Storage quota monitoring**: Reports IndexedDB/Cache usage via `navigator.storage.estimate()`.
- **Health assessment**: Aggregates preload status, telemetry success rate, latency, and memory into `healthy` / `degraded` / `critical` / `unknown`.

### Concurrent Load Management

`localAIModelLoader.ts` enforces a maximum of **3 simultaneous pipeline loads** via an internal semaphore queue. This prevents memory exhaustion when preloading multiple models in parallel on memory-constrained devices.

### Service Architecture Overview

```
aiService.ts (Central Router)
├─ Cloud: geminiService.ts (Gemini, OpenAI, xAI, Anthropic)
└─ Local AI Stack:
   ├─ localAI.ts              ← Core: text generation, vision diagnosis, mentor chat
   ├─ localAiFallbackService  ← Layer 3: deterministic heuristics (VPD, pH, EC, temp)
   ├─ localAiNlpService       ← Sentiment, summarization, zero-shot classification
   ├─ localAiEmbeddingService ← Semantic search, RAG, strain similarity
   ├─ localAiLanguageDetectionService ← Auto EN/DE detection
   ├─ localAiImageSimilarityService   ← CLIP feature comparison, growth tracking
   ├─ localAiHealthService    ← Diagnostics, device class, adaptive selection
   ├─ localAiCacheService     ← IndexedDB persistent LRU cache (256 entries, 7d TTL)
   ├─ localAiTelemetryService ← Inference metrics, token throughput, backend usage
   ├─ localAiPreloadService   ← Progress tracking, status persistence, retry logic
   └─ localAIModelLoader      ← ONNX backend routing, pipeline cache, load semaphore
```

---

## 🔒 Security & DSGVO/GDPR

CannaGuide 2025 is designed with privacy-first principles and German cannabis law (KCanG) compliance:

### Legal Compliance

- **Age Gate (18+)**: Full-screen age verification modal blocks all content until the user confirms they are 18+ — required under KCanG §1.
- **DSGVO/GDPR Consent**: A consent banner requires explicit user approval before any data is stored in localStorage/IndexedDB.
- **Privacy Policy (Datenschutzerklärung)**: Full 8-section privacy policy modal including data storage, AI services, image processing, cookies, third-party services, user rights (DSGVO), and contact. Accessible from the consent banner and settings.
- **Geo-Legal Banner**: One-time legal notice reminding users to verify cannabis cultivation laws in their jurisdiction.

### Security Measures

- **Content Security Policy (CSP)**: Hardened across 4 delivery paths (Vite dev/preview, index.html meta, Netlify `_headers`, Docker nginx). `connect-src` restricted to specific AI API domains only. `form-action 'self'`, `upgrade-insecure-requests`, `frame-ancestors 'none'`.
- **API Key Encryption**: All API keys encrypted at rest with **AES-256-GCM** (Web Crypto API). Consolidated single `cryptoService.ts`.
- **EXIF/GPS Stripping**: Images re-encoded via canvas before AI transmission. Explicit consent required.
- **Consent Revocation**: Users can revoke image consent at any time.
- **AI Disclaimer**: Displayed on every AI response (Mentor, DeepDive, StrainTips, Diagnostics) plus a medical disclaimer on diagnostic results.
- **Injection Defense**: 30+ regex patterns in `geminiService.ts` prevent prompt injection attacks.
- **Rate Limiting**: Sliding-window rate limiter (15 req/min) with per-day token cost tracking.
- **DOMPurify**: All `dangerouslySetInnerHTML` content sanitized via DOMPurify v3.
- **Link Security**: All external links use `rel="noopener noreferrer"`.

---

## 🤖 Multi-Provider AI (BYOK)

CannaGuide supports **Bring Your Own Key (BYOK)** for multiple AI providers. All keys are encrypted at rest with AES-256-GCM:

| Provider                    | Models                                                                            | Key Format   |
| :-------------------------- | :-------------------------------------------------------------------------------- | :----------- |
| **Google Gemini** (default) | `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash-preview-image-generation` | `AIza...`    |
| **OpenAI**                  | `gpt-4o-mini`, `gpt-4o`                                                           | `sk-...`     |
| **xAI (Grok)**              | `grok-3-mini-fast`, `grok-3`                                                      | `xai-...`    |
| **Anthropic (Claude)**      | `claude-sonnet-4-20250514`                                                        | `sk-ant-...` |

Configure your provider in **Settings → General & UI → AI Security (Multi-Model BYOK)**. The selected provider is used for all AI features: Mentor, Diagnostics, DeepDive, StrainTips, and Equipment Recommendations. Image generation is currently Gemini-exclusive.

---

## 🏁 Getting Started (User Guide)

No installation is required beyond a modern web browser.

1.  **Onboarding**: On first launch, you'll be guided through a quick tutorial to set your preferred language.
2.  **Discover Strains**: Start in the **Strains** view. Use the search and filters to find a strain and save it as a favorite by clicking the heart icon.
3.  **Start Growing**: Navigate to the **Plants** dashboard. From an empty slot, click "Start New Grow," select a strain, and configure your setup.
4.  **Manage Your Grow**: The **Plants** dashboard is your command center. Log actions like watering and feeding, check on your plant's vitals, and get advice from the AI.
5.  **Use the Command Palette**: For the fastest access, press `Cmd/Ctrl + K` to navigate or perform actions instantly.

---

## 🛠 Local Development (Developer Guide)

This project is designed to run within Google's AI Studio, which handles the development server and environment variables. However, you can run it locally with a standard Node.js setup.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) (usually included with Node.js)
- A **Google Gemini API Key**. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/qnbs/CannaGuide-2025.git
    cd CannaGuide-2025
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

    This will start the Vite development server, typically at `http://localhost:5173`.

4.  **Set Gemini API key at runtime (BYOK):**
    Open the app and go to **Settings → General & UI → AI Security (Multi-Model BYOK)**.
    Enter your Gemini key there. The key is stored only in local IndexedDB on your current device/browser profile.

5.  **Quality checks:**
    ```bash
    npm run lint          # fast gate: lint changed JS/TS files (errors only)
    npm run test -- --run # run full test suite
    npm run build         # production build
    ```
    Optional for technical debt cleanup:
    ```bash
    npm run lint:full     # lint full project (warnings allowed)
    npm run lint:strict   # lint full project (warnings fail)
    ```

---

## 📦 Distribution Targets

Distribution starter scaffolding is available for desktop/mobile wrappers and self-hosting:

- Docker self-hosting: `Dockerfile`, `docker/nginx.conf`, `docker-compose.yml`
- Tauri desktop wrapper: `src-tauri/`
- Capacitor mobile wrapper: `capacitor.config.ts`

See full setup notes in `docs/distribution.md`.

---

## 🔐 Gemini BYOK Setup

This section covers the Gemini BYOK setup for the default provider. For switching between supported providers, see the Multi-Provider AI overview above:

1. **Get a Gemini API key in Google AI Studio**
    - Open: https://aistudio.google.com/app/apikey
    - Sign in with your Google account.
    - Click **Create API key** (or **Create API key in new project**).
    - Copy the generated key (starts with `AIza...`).

2. **Set your key inside CannaGuide**
    - Open **Settings → General & UI → AI Security (Multi-Model BYOK)**.
    - Paste your key and click **Save Key**.
    - Optionally click **Validate Key** to run a live connectivity/permissions check.

3. **What BYOK covers in this app**
    - The stored key is used by **all Gemini-backed features**: diagnostics, mentor, proactive advice, strain tips, image generation, deep dives, equipment recommendations, and garden summaries.
    - Keys are stored **locally only** in browser IndexedDB for your current device/profile.
    - Keys are **not** bundled into builds, committed to git, or shipped via `.env` in production.

4. **Security and operations notes**
    - Never share your key.
    - Remove keys on shared/public devices.
    - If key validation fails, verify that Gemini API access is enabled for your Google project and that quota/billing limits are not blocking requests.

---

## 🚀 GitHub Pages Deployment

This repository includes a ready-to-use GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Push changes to `main`.
2. In GitHub: `Settings → Pages → Source: GitHub Actions`.
3. Wait until workflow **Deploy to GitHub Pages** completes.
4. App URL (this repository): `https://qnbs.github.io/CannaGuide-2025/`
5. If you fork this repo, your URL is typically: `https://<your-username>.github.io/CannaGuide-2025/`

Important:

- `vite.config.ts` uses `base: '/CannaGuide-2025/'`.
- The Gemini API key is **not** part of the build; users must add it in-app via BYOK.

---

## 🤔 Troubleshooting

- **AI Features Not Working**: Usually caused by a missing/invalid API key. Open `Settings → General & UI → AI Security (Multi-Model BYOK)`, set or validate your key, and retry.
- **App Not Updating (PWA Caching)**: Deploy updates are usually detected automatically. If an update still seems delayed:
    1.  Bring the tab to foreground (focus/visibility triggers an update check).
    2.  Wait a few seconds for automatic activation and reload.
    3.  If needed, use the in-app update banner button.
    4.  Only as last resort: browser `Application → Service Workers → Update/Unregister`.
- **Data Corruption**: If the application state becomes corrupted, you can perform a hard reset by navigating to `Settings > Data Management > Reset All App Data`. **Warning: This will delete all your local data.**
- **Local AI Models Not Loading**: Ensure you have a stable connection for the initial model download. Check that browser storage is not full (Settings → Data Management → Storage Insights). If persistent storage is not granted, the browser may evict cached models. Try the "Preload Models" button again.
- **WebLLM Unavailable**: WebLLM requires WebGPU support (modern Chrome/Edge). On unsupported browsers, CannaGuide automatically falls back to Transformers.js (WASM). This is expected behavior — not an error.
- **Local AI Slow Performance**: Enable the **Force WASM** toggle in Settings → General & UI if you suspect WebGPU driver issues. Switch to the lightweight `Qwen3-0.5B` model for faster inference on low-end devices.
- **Cloud Sync Issues**: Gist push/pull is anonymous and rate-limited by GitHub. If push fails, wait a moment and retry. Ensure the Gist URL/ID is correct when pulling. Synced data is validated — corrupted Gists will show an error message.

---

## 🤖 Development with AI Studio & Open Source

This application was developed entirely with **Google's AI Studio**. The entire process, from the initial project scaffolding to implementing complex features like the Redux state management and the Web Worker simulation, was driven by iterative prompts in natural language.

This project is also fully open source. Dive into the code, fork the project, or contribute on GitHub. See firsthand how natural language can build sophisticated applications.

- **Fork the project in AI Studio:** [https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-](https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-)
- **View the source code on GitHub:** [https://github.com/qnbs/CannaGuide-2025](https://github.com/qnbs/CannaGuide-2025)

---

## 🤝 Contributing

We welcome contributions from the community! Whether you want to fix a bug, add a new feature, or improve translations, your help is appreciated.

1.  **Reporting Issues**: If you find a bug or have an idea, please [open an issue](https://github.com/qnbs/CannaGuide-2025/issues) on GitHub first to discuss it.
2.  **Making Changes**:
    - Fork the repository.
    - Create a new branch for your feature or bugfix (`git checkout -b feature/my-new-feature`).
    - Commit your changes (`git commit -am 'Add some feature'`).
    - Push to the branch (`git push origin feature/my-new-feature`).
    - Create a new Pull Request.

Please follow the existing code style and ensure your changes are well-documented. For details, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🗺 Roadmap

> Full details with milestones, epics, and linked issues: [ROADMAP.md](ROADMAP.md)

| Version  | Status      | Highlights                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1.0** | ✅ Released | 700+ strains, VPD simulation, Multi-Provider AI (Gemini/OpenAI/xAI/Anthropic), DSGVO, WCAG 2.2 AA, 307 tests, ESP32, Breeding Lab, EN/DE i18n                                                                                                                                                                                                                                                                  |
| **v1.1** | ✅ Released | **Local AI Stack** (WebLLM + Transformers.js + CLIP vision, 33 labels), ONNX backend routing (WebGPU/WASM), inference caching (LRU-64), model preload UI with benchmarks, Sentry local-AI attribution, One-Tap Cloud Sync (Gist), Daily Strain Catalog Automation (04:20 UTC), Playwright Component Tests, Netlify PR Previews, PWA auto-update with changelog, Docker ESP32-Mock, CI/CD for Tauri + Capacitor |
| **v1.2** | 🔄 Planned  | Additional languages (ES, FR, NL), Advanced nutrient scheduling with EC/pH automation, Community strain marketplace, Auto-generated grow reports (PDF)                                                                                                                                                                                                                                                         |
| **v1.3** | 📋 Planned  | Integration with additional IoT sensors, Time-lapse photo journal, Strain comparison tool, Advanced analytics dashboard, Three.js 3D visualizations                                                                                                                                                                                                                                                            |

---

## 📊 Tools & Stack

| Category           | Tool                                                           | Purpose                                                                     |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Error Tracking** | [Sentry](https://sentry.io)                                    | Runtime error monitoring, performance traces, session replay                |
| **Local AI**       | [Transformers.js](https://huggingface.co/docs/transformers.js) | On-device text generation (Qwen2.5/Qwen3) and CLIP zero-shot vision         |
| **Local AI**       | [WebLLM](https://webllm.mlc.ai/)                               | WebGPU-accelerated LLM inference (Qwen2.5-1.5B-Instruct)                    |
| **Local AI**       | [ONNX Runtime Web](https://onnxruntime.ai/)                    | Cross-browser ML execution (WebGPU + WASM backends)                         |
| **Cloud Sync**     | GitHub Gist API                                                | Anonymous one-tap full-state backup & restore                               |
| **Testing**        | [Vitest](https://vitest.dev/)                                  | Unit & integration tests (307+)                                             |
| **Testing**        | [Playwright](https://playwright.dev/)                          | E2E tests + Component tests                                                 |
| **Testing**        | [Stryker](https://stryker-mutator.io/)                         | Mutation testing                                                            |
| **Performance**    | [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | Automated performance & a11y audits                                         |
| **Security**       | Gitleaks, Semgrep, Trivy, npm audit                            | Multi-layer security scanning (on-demand via workflow_dispatch)             |
| **Build**          | [Vite 7](https://vitejs.dev/)                                  | Lightning-fast HMR & optimized builds                                       |
| **CI/CD**          | GitHub Actions (17 workflows)                                  | CI, deploy, benchmark, mutation testing, Tauri, Docker, daily strain update |
| **Hosting**        | GitHub Pages + Netlify                                         | Production + PR preview deployments                                         |
| **Desktop**        | [Tauri](https://tauri.app/)                                    | Native Windows/macOS/Linux apps                                             |
| **Mobile**         | [Capacitor](https://capacitorjs.com/)                          | iOS & Android builds                                                        |
| **Container**      | Docker + Chainguard nginx                                      | Hardened self-hosting                                                       |
| **Code Quality**   | ESLint 9 + Biome + Prettier                                    | Linting, formatting, static analysis                                        |

---

## ⚠ Disclaimer

> All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.

> This app does not provide legal or medical advice.

---

---

# 🌿 CannaGuide 2025 (Deutsch)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/qnbs/CannaGuide-2025)

[![Lizenz: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/badge/release-v1.1.0-brightgreen)](https://github.com/qnbs/CannaGuide-2025/releases)
[![CI](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/ci.yml)
[![Deploy](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml/badge.svg)](https://github.com/qnbs/CannaGuide-2025/actions/workflows/deploy.yml)
[![Sentry](https://img.shields.io/badge/errors-Sentry-362D59?logo=sentry&logoColor=white)](https://sentry.io)
[![Tech-Stack](https://img.shields.io/badge/stack-React%2019%20%7C%20TypeScript%20%7C%20Redux%20%7C%20Vite%207-3178C6?logo=react&logoColor=white)](https://react.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline-blueviolet)]()
[![Local AI](https://img.shields.io/badge/Local%20AI-On--Device%20ML-ff6f00?logo=tensorflow&logoColor=white)]()
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Dual%20Persistence-00897B?logo=indexeddb&logoColor=white)]()
[![i18n](https://img.shields.io/badge/i18n-EN%20|%20DE-orange)]()
[![WCAG 2.2 AA](https://img.shields.io/badge/a11y-WCAG%202.2%20AA-green)]()
[![DSGVO](https://img.shields.io/badge/DSGVO-konform-blue)]()
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Google AI Studio](https://img.shields.io/badge/Google%20AI%20Studio-Ready-34A853?logo=google&logoColor=white)](https://aistudio.google.com/)
[![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-Enabled-000000?logo=githubcopilot&logoColor=white)](https://github.com/features/copilot)
[![Claude Opus 4.6](https://img.shields.io/badge/Claude-Opus%204.6-FF9900?logo=anthropic&logoColor=white)](https://www.anthropic.com/claude)
[![OpenAI GPT 5.4mini](https://img.shields.io/badge/OpenAI-GPT%205.4mini-412991?logo=openai&logoColor=white)](https://openai.com/)
[![xAI Grok 4.20](https://img.shields.io/badge/xAI-Grok%204.20-111111)](https://x.ai/)
[![Codespaces / VS Code](https://img.shields.io/badge/Codespaces%20%2F%20VS%20Code-Ready-007ACC?logo=visualstudiocode&logoColor=white)](https://github.com/features/codespaces)

**Der definitive KI-gestützte Cannabis-Anbau-Begleiter**

CannaGuide 2025 ist Ihr digitaler Co-Pilot für den gesamten Lebenszyklus des Cannabisanbaus. Entwickelt für sowohl neugierige Einsteiger als auch für erfahrene Meisterzüchter, führt Sie diese hochmoderne **Progressive Web App (PWA)** von der Samenauswahl bis zur perfekt ausgehärteten Ernte. Simulieren Sie Anbauvorgänge mit einer fortschrittlichen VPD-basierten Engine, erkunden Sie eine Bibliothek mit 700+ Sorten mit einem leistungsstarken Genealogie-Tracker, diagnostizieren Sie Pflanzenprobleme per Foto, züchten Sie neue Genetiken im Labor, planen Sie Ihre Ausrüstung mit Gemini-gestützter Intelligenz, überwachen Sie Ihren Raum mit Live-ESP32-Sensoren und meistern Sie Ihr Handwerk mit einem interaktiven, datengesteuerten Leitfaden.

**Live-App (GitHub Pages):** https://qnbs.github.io/CannaGuide-2025/

---

## Inhaltsverzeichnis

- [⭐ Projektphilosophie](#-projektphilosophie-1)
- [🚀 Hauptfunktionen](#-hauptfunktionen)
    - [1. Der Grow Room (`Pflanzen`-Ansicht)](#1-der-grow-room-pflanzen-ansicht)
    - [2. Die Sorten-Enzyklopädie (`Sorten`-Ansicht)](#2-die-sorten-enzyklopädie-sorten-ansicht)
    - [3. Die Werkstatt (`Ausrüstung`-Ansicht)](#3-die-werkstatt-ausrüstung-ansicht)
    - [4. Die Bibliothek (`Wissen`-Ansicht)](#4-die-bibliothek-wissen-ansicht)
    - [5. Das Hilfe-Center (`Hilfe`-Ansicht)](#5-das-hilfe-center-hilfe-ansicht)
    - [6. Die Kommandozentrale (`Einstellungen`-Ansicht)](#6-die-kommandozentrale-einstellungen-ansicht)
    - [7. Plattformweite Funktionen](#7-plattformweite-funktionen)
- [💻 Technischer Deep Dive](#-technischer-deep-dive-1)
- [🧠 Lokale KI-Architektur](#-lokale-ki-architektur)
- [🔒 Sicherheit & DSGVO](#-sicherheit--dsgvo)
- [🤖 Multi-Provider KI (BYOK)](#-multi-provider-ki-byok)
- [🏁 Erste Schritte (Benutzerhandbuch)](#-erste-schritte-benutzerhandbuch)
- [🛠 Lokale Entwicklung (Entwicklerhandbuch)](#-lokale-entwicklung-entwicklerhandbuch)
- [📦 Distributionsziele](#-distributionsziele)
- [🔐 Gemini-BYOK-Einrichtung](#-gemini-byok-einrichtung)
- [🚀 GitHub Pages Deployment](#-github-pages-deployment-1)
- [🤔 Fehlerbehebung (Troubleshooting)](#-fehlerbehebung-troubleshooting)
- [🤖 Entwicklung mit AI Studio & Open Source](#-entwicklung-mit-ai-studio--open-source-1)
- [🤝 Mitwirken (Contributing)](#-mitwirken-contributing-1)
- [🗺 Roadmap](#-roadmap-1)
- [⚠ Haftungsausschluss](#-haftungsausschluss-1)

---

## ⭐ Projektphilosophie

CannaGuide 2025 basiert auf einer Reihe von Kernprinzipien, die darauf ausgelegt sind, ein erstklassiges Erlebnis zu bieten:

> **Offline First**: Ihr Garten macht keine Pause, wenn Ihre Internetverbindung ausfällt. Die App ist so konzipiert, dass sie **100% offline funktionsfähig** ist. Alle Aktionen, die offline durchgeführt werden, werden automatisch über die SyncManager-API im Hintergrund synchronisiert, sobald Ihre Verbindung wiederhergestellt ist. Wenn die Cloud-KI nicht erreichbar ist, aktiviert sich ein **dreistufiger lokaler KI-Stack** — WebLLM (Qwen2.5-1.5B auf WebGPU), Transformers.js (Text + CLIP-Vision), und deterministische Heuristiken — und liefert echte ML-gestützte Pflanzendiagnosen, Mentor-Chat und Anbauberatung vollständig auf dem Gerät. Alle Ihre Daten, Notizen und KI-Archive sind lokal gespeichert und jederzeit zugänglich.

> **Leistung ist entscheidend**: Eine flüssige, reaktionsschnelle Benutzeroberfläche ist unerlässlich. Rechenintensive Aufgaben, wie die komplexe Pflanzensimulation, werden in einen **Web Worker** ausgelagert. Große Sortenlisten nutzen **virtualisiertes Rendering** (via `useVirtualizer`), um selbst bei 700+ Einträgen flüssiges Scrollen mit 60fps zu gewährleisten.

> **Datensouveränität**: Ihre Daten gehören Ihnen. Die Möglichkeit, Ihren **gesamten Anwendungszustand zu exportieren und zu importieren**, gibt Ihnen vollständige Kontrolle. Teilen Sie Ihre kuratierte Sortensammlung mit der Community über **anonyme GitHub Gists** — ein Klick zum Exportieren, ein Link zum Importieren.

> **KI als Co-Pilot**: Wir nutzen KI nicht als Gimmick, sondern als leistungsstarkes Werkzeug, um **umsetzbare, kontextbezogene Einblicke** zu liefern. Eine **RAG-gestützte Journal-Suche** stellt sicher, dass die KI Ratschläge mit Ihrer tatsächlichen Anbauhistorie kontextualisiert.

> **Resilienz & Wiederherstellung**: Korruptionssichere Architektur mit **Safe-Recovery**-Mechanismen, die beschädigte Zustände automatisch erkennen und reparieren, plus **Archiv-Begrenzung** (100 Mentor- + 50 Berater-Antworten pro Pflanze), um unkontrolliertes IndexedDB-Wachstum zu verhindern.

---

## 🚀 Hauptfunktionen

### 1. Der Grow Room (`Pflanzen`-Ansicht)

Ihre Kommandozentrale zur Verwaltung und Simulation von bis zu drei gleichzeitigen Anbauprojekten.

- **Hochentwickelte Simulations-Engine**: VPD-basierte Simulation mit Höhenkorrektur, biomasse-skaliertem Ressourcenverbrauch und strukturellem Wachstum im dedizierten **Web Worker**.
- **Simulationsprofile**: Wählen Sie zwischen `Anfänger`, `Fortgeschritten` und `Experte`, um die Komplexität anzupassen.
- **Anbau-Statistik-Dashboard**: Echtzeit-Ertragsprognosen, tägliche Energiekosten, kumulative Kosten und ein Ereignis-Zeitplan für Ernte und offene Aufgaben.
- **Live-VPD-Anzeige**: Farbcodierte VPD-Bereiche für jede Wachstumsphase mit konfigurierbarem Blatttemperatur-Offset und Höhenkorrektur.
- **ESP32-Sensor-Integration**: Verbinden Sie Ihre ESP32-basierten Umgebungssensoren über **WebBluetooth**, um Live-Temperatur- und Feuchtigkeitsdaten direkt in die Simulation einzuspeisen. Liest GATT Environmental Sensing Characteristics für laborgrade Genauigkeit.
- **KI-gestützte Diagnose**:
    - **Foto-Diagnose**: Laden Sie ein Pflanzenfoto hoch oder nehmen Sie eines auf. EXIF/GPS wird entfernt, das Bild komprimiert, und Gemini liefert sofort Diagnose und Maßnahmen.
    - **Proaktiver Berater**: Erhalten Sie Ratschläge auf Basis der Live-Vitalwerte. Empfehlungen werden mit vollständigem CRUD archiviert und auf 50 Einträge pro Pflanze begrenzt.
    - **Deep-Dive-Leitfäden**: Erzeugen Sie kontextbezogene Tiefenanalysen zu Themen wie Terpenerhalt oder Entlaubungs-Timing.
- **Umfassendes Protokoll**: Führen Sie ein detailliertes, filterbares Journal für jede Aktion. Die **RAG-gestützte Anbauprotokoll-Suche** nutzt relevante Historie mit Aktualitätsgewichtung.
- **Grow-Erinnerungen (Push-Benachrichtigungen)**: Erinnerungen für VPD-Alarme, Bewässerung und Erntefenster. Periodic Background Sync wird wenn möglich genutzt, inklusive Abklingzeit und Snooze-Tracking.
- **Nach-Ernte-Simulation**: Trocknen, Fermentieren, Feuchte, Burping, Terpenerhalt, Chlorophyllabbau und CBN-Konversion in einem eigenen Ablauf.
- **Was-wäre-wenn-Experimente**: Vergleichen Sie Szenarien wie +2°C vs. -2°C oder Topping vs. LST auf einem Klon ohne Risiko fürs reale Projekt.

### 2. Die Sorten-Enzyklopädie (`Sorten`-Ansicht)

Ihr zentraler Wissens-Hub mit **Offline-First**-Zugriff.

- **Riesige Bibliothek**: Über **700+ Cannabissorten** mit intelligenter **Alias-Auflösung** (~30 gängige Namensvarianten wie „GSC" → „Girl Scout Cookies" werden automatisch zugeordnet).
- **Interaktiver Stammbaum**: Crash-sichere d3-Linienansicht mit Alias-Auflösung, Landrassen-Markierung, Abstammungsverfolgung und einstellbarer Tiefe.
- **Entourage-Effekt-Analyse**: Erkunden Sie die Wissenschaft hinter Terpen-Cannabinoid-Interaktionen mit einer evidenzbasierten **Terpendatenbank**, die pharmakologische Effekte, Cannabinoidrezeptor-Aktivität (CB1, CB2, TRPV1) und wissenschaftliche Zitationen abbildet.
- **Chemotyp-Rechner**: Analysieren Sie das Cannabinoid- und Terpenprofil jeder Sorte zur Bestimmung des **dominanten Chemotyps**, der Profilklassifikation und maßgeschneiderter Anbauberatung.
- **Hochleistungs-Suche & -Filter**: Schnelle IndexedDB-Volltextsuche mit alphabetischen Filtern, Mehrfachauswahl und virtueller Ergebnisliste.
- **Persönliche Sortensammlung**: Volle **CRUD**-Funktionalität.
- **Community-Sortenaustausch**: Exportieren Sie Sammlungen als anonyme GitHub Gists und importieren Sie geteilte Listen per Gist-URL, validiert mit Zod-Schemas.
- **KI-Anbau-Tipps**: Sortenspezifische Anbauratschläge mit Gemini-Bild und eigenem Tipps-Archiv.
- **Text-to-Speech**: Alle KI-generierten Inhalte können über die **Speakable**-Komponente vorgelesen werden.
- **Flexible Datenexport**: PDF, TXT.

### 3. Die Werkstatt (`Ausrüstung`-Ansicht)

Ihr Werkzeugkasten für die Planung und Optimierung Ihres Anbau-Setups.

- **Fortschrittlicher KI-Setup-Konfigurator**: Definieren Sie Anbauraum, Erfahrung, Budget und Prioritäten für eine markenspezifische Liste von Gemini.
- **Gespeicherte Setups**: Volle **CRUD**-Funktionalität.
- **Suite von Rechnern**: Lüftungsrechner (m³/h), Beleuchtungsrechner (PPFD/DLI & Wattzahl), Stromkostenrechner, Nährstoff-Mischrechner, EC/PPM-Umrechner, Ertragsschätzer.
- **Kuratierte Shop-Listen**: Empfohlene Grow Shops und Saatgutanbieter für europäische und US/kanadische Märkte.

### 4. Die Bibliothek (`Wissen`-Ansicht)

Ihre vollständige Ressource zum Lernen und zur Problemlösung.

- **Kontextsensitiver KI-Mentor**: Fragen Sie den KI-Mentor auf Basis Ihrer Pflanze und der RAG-gestützten Journal-Historie. Gespräche werden mit vollem CRUD archiviert und auf 100 Einträge begrenzt.
- **Zuchtlabor**: Kreuzen Sie Samen, um **permanente Hybridsorten** mit Punnett-Quadrat-basierter genetischer Modellierung zu erschaffen.
- **Interaktive Sandbox**: Was-wäre-wenn-Szenarien wie Topping vs. LST mit d3-Diagrammen vergleichen.

### 5. Das Hilfe-Center (`Hilfe`-Ansicht)

- **Umfassendes Benutzerhandbuch**: Detaillierter, integrierter Leitfaden.
- **Durchsuchbare FAQ**: Schnelle Antworten auf häufige Anbaufragen.
- **Grower-Lexikon**: Umfangreiches Glossar von Cannabis-Begriffen.
- **Visuelle Anleitungen**: Animierte Anleitungen für Techniken wie Topping und LST.

### 6. Die Kommandozentrale (`Einstellungen`-Ansicht)

- **UI & Theme-Anpassung**: Cannabis-inspirierte Themes (`Mitternacht`, `Wald`, `Purple Haze`), Schriftgrößen, `Komfortabler` und `Kompakter` Modus.
- **Barrierefreiheit-Suite**: **Legastheniker-freundliche Schriftart**, **Modus mit reduzierter Bewegung**, **Farbfehlsichtigkeits-Modi** (Protanopie, Deuteranopie, Tritanopie).
- **Sprache & Sprachausgabe**: TTS-Stimmen und -Raten, Sprachbefehl-Einstellungen.
- **Simulationstuning**: **Blatttemperatur-Offset** und **Höhe** für Präzisions-VPD-Berechnungen.
- **Lokale KI-Einstellungen**: Modelle on demand vorladen, WASM zum Debuggen erzwingen, zwischen Textmodellen wechseln und Backend-/Speicherstatus überwachen.
- **Ein-Tipp Cloud-Sync**: App-Zustand als anonymen GitHub Gist sichern und wiederherstellen, mit Gist-ID, Sync-Zeit und Zod-Validierung.
- **Datensouveränität**: Backup, Restore, gezielte Resets und Speicherübersicht mit Auto-Backup- und Persistenz-Timing.

### 7. Plattformweite Funktionen

- **Volle PWA- & Offline-Fähigkeit**: Native-ähnliche Installation mit Network-First-Navigation, Cache-First-Assets und vollem Offline-Zugriff.
- **Befehlspalette (`Cmd/Ctrl + K`)**: Über 40 Befehle für Navigation, Sorten, Pflanzen und Einstellungen.
- **Sprachsteuerung**: Navigieren, suchen und Aktionen per Sprache ausführen.
- **Volle Internationalisierung (i18n)**: Vollständige EN/DE-Übersetzungen mit dem kompletten Namespaceset. KI-Antworten werden automatisch lokalisiert.
- **Safe Recovery**: Automatische Erkennung und Reparatur beschädigter Zustände. Graceful Fallback statt leerer Bildschirm.
- **Tägliche Sortenkatalog-Automatisierung**: Ein täglicher GitHub-Actions-Workflow führt den 700+-Katalog zusammen, dedupliziert ihn und öffnet PRs für neue Einträge.
- **Lokaler KI-Fallback**: Bei nicht erreichbarer Cloud-API fällt die App auf einen dreistufigen lokalen KI-Stack mit Caching zurück.

---

## 💻 Technischer Deep Dive

CannaGuide 2025 basiert auf einem modernen, robusten und skalierbaren Tech-Stack.

### Schlüsseltechnologien

| Kategorie              | Technologie                                                                                                     | Zweck                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Frontend**           | [React 19](https://react.dev/) mit [TypeScript](https://www.typescriptlang.org/)                                | Modernes, typsicheres und performantes Benutzerinterface.                                                         |
| **Zustandsverwaltung** | [Redux Toolkit](https://redux-toolkit.js.org/)                                                                  | Zentralisierte, vorhersagbare Zustandsverwaltung mit memoisierten Selektoren.                                     |
| **KI-Integration**     | [Google Gemini API](https://ai.google.dev/gemini-api/docs) (`@google/genai`)                                    | Treibt alle KI-Funktionen an: Diagnose, Beratung, Bilderzeugung und Deep Dives.                                   |
| **Lokale KI**          | [@xenova/transformers](https://huggingface.co/docs/transformers.js) + [@mlc-ai/web-llm](https://webllm.mlc.ai/) | Dreistufiges On-Device-ML: WebLLM (Qwen2.5-1.5B, WebGPU), Transformers.js (Qwen Text + CLIP Vision), Heuristiken. |
| **Asynchrone Op.**     | [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)                                                    | Verwaltet alle Gemini-API-Interaktionen mit automatischem Caching und Ladezuständen.                              |
| **Nebenläufigkeit**    | [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)                                 | Komplexe Pflanzensimulation außerhalb des Haupt-Threads.                                                          |
| **Datenpersistenz**    | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (Dual-Datenbank-Architektur)        | Volle Offline-Funktionalität via `CannaGuideStateDB` (Redux) und `CannaGuideDB` (Sorten, Bilder, Suche).          |
| **Validierung**        | [Zod](https://zod.dev/)                                                                                         | Runtime-Schema-Validierung für KI-Antworten, Import-Payloads und Community-Shares.                                |
| **Visualisierung**     | [d3 v7](https://d3js.org/)                                                                                      | Stammbäume, Wachstumsdiagramme und Vergleichsvisualisierungen.                                                    |
| **PWA & Offline**      | [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) (InjectManifest)         | Network-First Navigation, Cache-First Assets, Background Sync und Auto-Update.                                    |
| **Styling**            | [Tailwind CSS](https://tailwindcss.com/)                                                                        | Utility-First-Ansatz mit Theme-CSS-Custom-Properties.                                                             |
| **i18n**               | [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/)                               | Namensraum-organisierte EN/DE-Übersetzungen mit `getT()` für Nicht-Komponenten-Kontexte.                          |
| **IoT**                | [WebBluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)                          | ESP32 GATT Environmental Sensing für Live-Sensordaten.                                                            |
| **Build**              | [Vite 7](https://vitejs.dev/) + [VitePWA](https://vite-pwa-org.netlify.app/)                                    | Blitzschnelles HMR, optimierte Produktionsbuilds und SW-Injection.                                                |
| **Testing**            | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)                                           | Unit-/Integrationstests und E2E-Smoke-/Accessibility-Checks.                                                      |

### Duale IndexedDB-Architektur

Die App verwendet zwei separate IndexedDB-Datenbanken:

- **`CannaGuideStateDB`**: Speichert den serialisierten Redux-Zustand. Die Hydration verwendet ein **Promise-Lock-Muster**, um Race Conditions bei gleichzeitigen Lesevorgängen zu verhindern. Der Zustand wird bei jeder Redux-Änderung verzögert gespeichert (1s) und bei `visibilitychange`/`pagehide` sofort geschrieben.

- **`CannaGuideDB`**: Speichert die Sortenbibliothek, komprimierte Bilder (automatisches Pruning über einem konfigurierbaren Schwellenwert) und den Volltextsuchindex.

### Memoisierte Selektor-Architektur

Performance-kritische Selektoren wie `selectPlantById` verwenden einen **manuell verwalteten Map-Cache** mit expliziter Rückgabetypisierung `(state: RootState) => Plant | null`, um Per-Render-Neuberechnung zu vermeiden.

### Gemini-Service-Abstraktion (`geminiService.ts`)

Wie im [DeepWiki des Projekts](https://deepwiki.com/qnbs/CannaGuide-2025) erwähnt, ist die Datei `geminiService.ts` eine entscheidende Komponente, die als zentrale Abstraktionsschicht für die gesamte Kommunikation mit der Google Gemini API fungiert.

**Hauptverantwortlichkeiten & Methoden:**

- **Initialisierung**: Einzelne `GoogleGenAI`-Instanz mit zentraler API-Key-Verwaltung.
- **Kontext & Lokalisierung**: Hilfsfunktionen formatieren Pflanzendaten automatisch und stellen die korrekte Sprachanweisung voran.
- **RAG-gestützter Kontext**: Der `growLogRagService` führt tokenbasierte Relevanz-Bewertung mit Aktualitäts-Boosting über das gesamte Pflanzenjournal durch.
- **Strukturierte JSON-Ausgabe**: `responseSchema`-basierter JSON-Modus für typsichere KI-Antworten.
- **Multimodale Eingabe (Vision)**: `diagnosePlant` kombiniert Base64-Bild + Textkontext.
- **Bilderzeugung**: `generateStrainImage` nutzt `gemini-2.5-flash-image` mit `Modality.IMAGE`.
- **Modellauswahl**: `gemini-2.5-flash` für die meisten Aufgaben, `gemini-2.5-pro` für `generateDeepDive`.
- **Fehlerbehandlung**: Lokalisierte Fehlermeldungen über Übersetzungsschlüssel.
- **Lokaler Fallback**: Dreistufiger lokaler KI-Stack (WebLLM → Transformers.js → Heuristiken) liefert ML-gestützte Beratung bei unerreichbarer API.

### PWA-Update-Strategie (Deployment)

- **Proaktive Update-Checks**: `registration.update()` beim Laden, Tab-Fokus, Sichtbarkeit und alle 5 Minuten.
- **Frische SW-Abfrage**: `updateViaCache: 'none'` für schnelle Erkennung.
- **Navigation Network-First**: Seiten-Navigationen gehen zuerst ins Netz.
- **Auto-Aktivierung + Auto-Reload**: `SKIP_WAITING` + automatischer Reload bei `controllerchange`.
- **Background Sync**: Offline-Aktionen werden bei wiederhergestellter Verbindung über die `SyncManager`-API replayed.
- **Manueller Fallback**: Update-Banner als Sicherheitsnetz.

### Resilienz & Zustandsverwaltung

- **Safe Recovery**: Boot-Sequenz mit `try/catch` — bei fehlerhafter IndexedDB-Hydration Fallback auf sauberen Zustand.
- **Promise-Lock-Hydration**: Einzelne-Promise-Sperre für gleichzeitige IndexedDB-Lesezugriffe.
- **Archiv-Begrenzung**: Mentor (100) und Berater (50/Pflanze) mit FIFO-Bereinigung.
- **Listener-Middleware**: Redux-Middleware für Seiteneffekte mit lokalisierten Benachrichtigungen via `getT()`.

### Projektstruktur

- `components/`: Alle React-Komponenten, nach Ansicht oder Gemeinsamkeit organisiert.
- `stores/`: Redux-Store, Slices, Selektoren und Middleware.
- `services/`: Geschäftslogik: Simulation, Datenbank, KI-Wrapper, Community-Sharing, IoT-Sensor-Integration.
- `hooks/`: Custom Hooks für Focus Traps, PWA, virtualisierte Listen, Befehlspalette u.v.m.
- `data/`: Statische Daten: Sortenbibliothek, Lexikon, Alias-Maps, FAQ.
- `locales/`: Internationalisierungs-Dateien (namensraumbasiert: `common`, `plants`, `knowledge`, `strains`, `equipment`, `settings`, `help`, `commandPalette`, `onboarding`, `seedbanks`, `strainsData`).
- `workers/`: Web-Worker-Skripte für Hintergrundsimulation.
- `utils/`: Gemeinsam genutzte Hilfsfunktionen.
- `types/`: TypeScript-Typdefinitionen und Zod-Schemas.

---

## 🧠 Lokale KI-Architektur

CannaGuide enthält einen produktionsreifen, dreistufigen On-Device-ML-Stack, der datenschutzfreundliche, latenzfreie KI liefert, wenn die Cloud-API nicht erreichbar ist (offline, Kontingent erschöpft, fehlender Key) — oder sobald Modelle vorab geladen und warm sind.

### Dreistufige Fallback-Kaskade

```
[Cloud Gemini API]
        │ ← nicht verfügbar?
        ▼
┌─ Stufe 1 ─── WebLLM (WebGPU) ─────────────────────────────┐
│  Qwen2.5-1.5B-Instruct (q4f16_1, MLC-kompiliert)          │
│  Volle Chat-Completion-Inferenz auf GPU via @mlc-ai/web-llm │
│  → Beste Qualität, erfordert navigator.gpu                  │
└────────────────────────────────────────────────────────────┘
        │ ← WebGPU nicht verfügbar oder Ladefehler?
        ▼
┌─ Stufe 2 ─── Transformers.js (ONNX) ──────────────────────┐
│  Text:   Xenova/Qwen2.5-1.5B-Instruct (primär)            │
│          Xenova/Qwen3-0.5B (Ultra-leicht-Fallback)         │
│  Vision: Xenova/clip-vit-large-patch14 (Zero-Shot, 33 Lbl) │
│  Backend: WebGPU → WASM (automatisch erkannt)              │
└────────────────────────────────────────────────────────────┘
        │ ← Modell-Lade fehler oder Timeout?
        ▼
┌─ Stufe 3 ─── Deterministische Heuristiken ─────────────────┐
│  Regelbasierte Pflanzendiagnose (VPD, pH, EC, Temp, Feucht)│
│  Lokalisierte EN/DE-Beratung, null Netzwerkabhängigkeit    │
│  Garantierte Antwort — immer verfügbar                      │
└────────────────────────────────────────────────────────────┘
```

### Modellbestand

| Konstante                 | Modell                                                   | Zweck                                                         | Laufzeit        |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- | --------------- |
| `WEBLLM_MODEL_ID`         | `Qwen2.5-1.5B-Instruct-q4f16_1-MLC`                      | Volle Chat-Completion auf WebGPU, beste lokale Qualität       | @mlc-ai/web-llm |
| `TEXT_MODEL_ID`           | `Xenova/Qwen2.5-1.5B-Instruct`                           | Primäre Textgenerierung (multilingual, starke DE-Performance) | Transformers.js |
| `ALT_TEXT_MODEL_ID`       | `Xenova/Qwen3-0.5B`                                      | Ultra-leichter Fallback für schwache Geräte                   | Transformers.js |
| `VISION_MODEL_ID`         | `Xenova/clip-vit-large-patch14`                          | Zero-Shot-Pflanzenzustandsklassifikation (33 Cannabis-Labels) | Transformers.js |
| `EMBEDDING_MODEL_ID`      | `Xenova/all-MiniLM-L6-v2`                                | 384-dim semantische Embeddings für RAG & Sortenähnlichkeit    | Transformers.js |
| `SENTIMENT_MODEL_ID`      | `Xenova/distilbert-base-uncased-finetuned-sst-2-english` | Journal-Stimmungsanalyse (positiv/negativ/neutral)            | Transformers.js |
| `SUMMARIZATION_MODEL_ID`  | `Xenova/distilbart-cnn-6-6`                              | Textzusammenfassung für Grow-Logs und Mentor-Verlauf          | Transformers.js |
| `ZERO_SHOT_TEXT_MODEL_ID` | `Xenova/mobilebert-uncased-mnli`                         | Frageklassifikation (15 Grow-Themen) + Spracherkennung        | Transformers.js |

### 33 Zero-Shot Cannabis-Zustandslabels

Das CLIP-Vision-Modell klassifiziert Pflanzenfotos gegen einen kuratierten Labelsatz, der das gesamte Spektrum der Cannabis-Anbauprobleme abdeckt:

**Nährstoffmängel** (10): Stickstoff, Phosphor, Kalium, Calcium, Magnesium, Eisen, Zink, Schwefel, Mangan, Bor
**Umweltstress** (7): Hitzestress, Lichtstress, Lichtverbrennung, Kältestress, Windschaden, Nährstoffbrand, Nährstoffblockade
**Bewässerungsprobleme** (2): Überwässerung, Unterwässerung
**Schädlinge & Krankheiten** (9): Mehltau, Botrytis-Blütenfäule, Spinnmilben, Trauermücken, Blattläuse, Thripse, Weiße Fliegen, Blattfleckenpilze, Septoria
**Sonstige** (5): Wurzelfäule, pH-Ungleichgewicht, Revegetationsstress, Tabakmosaikvirus, Gesunde Pflanze

Jedes Label ist mit lokalisierten Diagnosetexten in EN und DE mit umsetzbarer Anbauberatung verknüpft.

### ONNX-Backend-Routing

`localAIModelLoader.ts` erkennt automatisch den optimalen Ausführungs-Provider:

1. **WebGPU** — wenn `navigator.gpu` vorhanden (modernes Chrome, Edge). Bietet nahezu native GPU-Beschleunigung.
2. **WASM** — universeller Fallback für alle Browser. Zuverlässig, aber langsamer.

Ein **WASM-erzwingen**-Schalter in den Einstellungen überschreibt die automatische Erkennung zum Debuggen. `onnxruntime-web` (v1.21+) ist eine direkte Abhängigkeit für stabile WebGPU- und WASM-ONNX-Ausführung.

### Inferenz-Caching & Retry

- **LRU-Cache**: Map mit max. **64 Einträgen**, indiziert durch die ersten 200 Zeichen jedes Prompts. Identische Prompts liefern sofort gecachte Ergebnisse ohne Modell-Inferenz.
- **Retry-Logik**: Bis zu **2 Wiederholungen** mit 500ms exponentiellem Backoff, bevor auf Heuristiken zurückgefallen wird. Fehlgeschlagene Versuche verschmutzen den Cache nicht.
- **Pipeline-Cache**: `loadTransformersPipeline` speichert Pipeline-Promises, indiziert durch `task::modelId`. Folgeaufrufe geben das gecachte Promise zurück; Fehler werden automatisch entfernt, damit der nächste Aufruf es erneut versuchen kann.

### Zentrales KI-Routing (`aiService.ts`)

Alle KI-Aufrufe gehen von `aiService.ts` aus, das entscheidet, ob an die Cloud (Gemini) oder den lokalen Stack geroutet wird:

```ts
shouldRouteLocally() → isOffline() || localAiPreloadService.isReady()
```

- Wenn offline **oder** lokale Modelle vorab geladen wurden, werden Anfragen vollständig auf dem Gerät verarbeitet.
- `generateStrainImage` und `getEquipmentRecommendation` routen immer zu Gemini (erfordern Cloud-Fähigkeiten).
- Die `shouldUseLocalFallback()` im Gemini-Service prüft zusätzlich `isReady()`, bevor bei API-Fehlern lokale Inferenz versucht wird.

### Preload & Fortschritts-UI

Nutzer können das bedarfsgesteuerte Modell-Preloading unter **Einstellungen → Allgemein & UI** auslösen:

- Echtzeit-Fortschrittsbalken mit geladenen/gesamt Modellen und aktuellem Label (text-model → vision-model → web-llm).
- Persistente Statusverfolgung via `localStorage` (State, Zeitstempel, Pro-Modell-Bereitschaft, Persistent-Storage-Grant-Status).
- `isReady()`-Komfortprüfung: Gibt `true` zurück, wenn State `'ready'` oder `'partial'` mit geladenem Textmodell.
- Preload-Timing-Benchmarks werden nach Abschluss angezeigt.

### Sentry-Fehler-Attribution

Alle lokalen KI-Fehler werden über `captureLocalAiError()` in `sentryService.ts` mit strukturierten Tags erfasst:

```
feature: local-ai
ai.stage: preload | inference | vision | webllm | fallback
ai.model: <model-id>
ai.backend: webgpu | wasm
retryAttempt: 0 | 1 | 2
```

Dies ermöglicht das Filtern und Monitoring der lokalen KI-Gesundheit im Sentry-Dashboard, getrennt von Cloud-KI-Fehlern.

### Bundle-Strategie

Lokale KI-Laufzeiten werden über Vites `manualChunks` in einen dedizierten `ai-runtime`-Chunk aufgetrennt:

```
@xenova/transformers + onnxruntime-web + @mlc-ai/web-llm → ai-runtime.js
```

Der Chunk ist vom `optimizeDeps`-Pre-Bundling ausgeschlossen und wird nur bei Bedarf lazy geladen, um das Haupt-Bundle schlank zu halten.

### Erweiterte NLP-Pipeline

Neben Kerntext-Generierung und Vision umfasst der lokale Stack dedizierte NLP-Pipelines:

| Pipeline                     | Modell             | Fähigkeiten                                                                                      |
| ---------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| **Stimmungsanalyse**         | DistilBERT (SST-2) | Journal-Stimmungsverfolgung, Trendanalyse (besser/schlechter/stabil), Batch-Analyse              |
| **Textzusammenfassung**      | DistilBART (CNN)   | Grow-Logs verdichten (bis 4096 Zeichen), Mentor-Chat-Komprimierung, konfigurierbare Ausgabelänge |
| **Zero-Shot-Klassifikation** | MobileBERT (MNLI)  | 15 Cannabis-Grow-Themenkategorien, intelligentes Frage-Routing, Spracherkennung                  |
| **Semantische Embeddings**   | all-MiniLM-L6-v2   | 384-dim Vektoren, Kosinus-Ähnlichkeitsranking, RAG-Kontextabfrage, Sortenabgleich                |

### Spracherkennung

`localAiLanguageDetectionService.ts` erkennt automatisch die Eingabesprache für die zweisprachige EN/DE-App:

1. **Modellbasiert** — Zero-Shot-Klassifikation zwischen „English text" und „German text" mit Konfidenzwerten.
2. **Heuristischer Fallback** — Worthäufigkeitsanalyse mit deutschen Indikatoren (ä, ö, ü, ß + 35 häufige Wörter) und englischen Indikatoren bei Kurzeingaben oder wenn das Modell nicht verfügbar ist.

### Bildähnlichkeit & Wachstumsverlauf

`localAiImageSimilarityService.ts` nutzt CLIPs 768-dimensionale Feature-Vektoren für visuelle Analyse:

- **Fotovergleich** — Kosinus-Ähnlichkeit zwischen zwei Pflanzenfotos (Score 0–1).
- **Ähnliche-Bilder-Suche** — Ranking einer Fotosammlung nach visueller Ähnlichkeit zu einem Referenzbild.
- **Wachstumsverlauf-Tracking** — Analyse chronologischer Fotos zur Erkennung der visuellen Veränderungsrate und Klassifikation von Wachstumstrends (beschleunigend / abnehmend / stabil).

### Gesundheitsüberwachung & Adaptive Auswahl

`localAiHealthService.ts` liefert umfassende Stack-Diagnostik:

- **Geräteklassifikation**: `high-end` / `mid-range` / `low-end` / `unknown` basierend auf WebGPU, Kernanzahl und RAM via `navigator.deviceMemory`.
- **Speicherdruckerkennung**: Überwacht `performance.memory` (Chromium) und warnt ab >80% Heap-Auslastung.
- **Adaptive Modellempfehlungen**: Empfiehlt automatisch leichtere Modelle (Qwen3-0.5B, WebLLM deaktivieren) bei Speicher- oder Geräteklassen-Einschränkungen.
- **Speicherkontingentüberwachung**: Meldet IndexedDB/Cache-Nutzung via `navigator.storage.estimate()`.
- **Gesundheitsbewertung**: Aggregiert Preload-Status, Telemetrie-Erfolgsrate, Latenz und Speicher zu `healthy` / `degraded` / `critical` / `unknown`.

### Parallele Ladesteuerung

`localAIModelLoader.ts` begrenzt gleichzeitige Pipeline-Ladevorgänge auf maximal **3 Slots** via interner Semaphore-Queue. Dies verhindert Speichererschöpfung beim Vorladen mehrerer Modelle auf speicherbeschränkten Geräten.

### Service-Architektur-Übersicht

```
aiService.ts (Zentrales Routing)
├─ Cloud: geminiService.ts (Gemini, OpenAI, xAI, Anthropic)
└─ Lokaler KI-Stack:
   ├─ localAI.ts              ← Kern: Textgenerierung, Bilddiagnose, Mentor-Chat
   ├─ localAiFallbackService  ← Stufe 3: deterministische Heuristiken (VPD, pH, EC, Temp)
   ├─ localAiNlpService       ← Stimmungsanalyse, Zusammenfassung, Zero-Shot-Klassifikation
   ├─ localAiEmbeddingService ← Semantische Suche, RAG, Sortenähnlichkeit
   ├─ localAiLanguageDetectionService ← Auto EN/DE-Erkennung
   ├─ localAiImageSimilarityService   ← CLIP-Feature-Vergleich, Wachstumsverlauf
   ├─ localAiHealthService    ← Diagnostik, Geräteklasse, adaptive Auswahl
   ├─ localAiCacheService     ← IndexedDB persistenter LRU-Cache (256 Einträge, 7d TTL)
   ├─ localAiTelemetryService ← Inferenz-Metriken, Token-Durchsatz, Backend-Nutzung
   ├─ localAiPreloadService   ← Fortschrittsverfolgung, Statuspersistenz, Retry-Logik
   └─ localAIModelLoader      ← ONNX-Backend-Routing, Pipeline-Cache, Lade-Semaphore
```

---

## 🔒 Sicherheit & DSGVO

CannaGuide 2025 wurde mit Privacy-First-Prinzipien und Konformität zum deutschen Cannabisgesetz (KCanG) entwickelt:

### Rechtliche Konformität

- **Altersverifikation (18+)**: Vollbild-Altersverifikationsmodal blockiert alle Inhalte, bis der Nutzer bestätigt, 18+ Jahre alt zu sein — erforderlich nach KCanG §1.
- **DSGVO-Einwilligung**: Ein Consent-Banner erfordert die ausdrückliche Zustimmung des Nutzers, bevor Daten in localStorage/IndexedDB gespeichert werden.
- **Datenschutzerklärung**: Vollständige 8-Abschnitte-Datenschutzerklärung inkl. Datenspeicherung, KI-Dienste, Bildverarbeitung, Cookies, Drittanbieter, Betroffenenrechte (DSGVO) und Kontakt. Erreichbar über das Consent-Banner und die Einstellungen.
- **Geo-Legal-Banner**: Einmalige Rechtshinweismeldung, die Nutzer daran erinnert, die Cannabis-Anbaugesetze in ihrer Rechtsordnung zu prüfen.

### Sicherheitsmaßnahmen

- **Content Security Policy (CSP)**: Gehärtet über 4 Auslieferungswege (Vite dev/preview, index.html Meta, Netlify `_headers`, Docker nginx). `connect-src` auf spezifische KI-API-Domains beschränkt. `form-action 'self'`, `upgrade-insecure-requests`, `frame-ancestors 'none'`.
- **API-Schlüssel-Verschlüsselung**: Alle API-Schlüssel werden mit **AES-256-GCM** (Web Crypto API) verschlüsselt gespeichert. Konsolidierter `cryptoService.ts`.
- **EXIF/GPS-Entfernung**: Bilder werden vor der KI-Übertragung via Canvas neu kodiert. Explizite Einwilligung erforderlich.
- **Einwilligungswiderruf**: Nutzer können die Bildeinwilligung jederzeit widerrufen.
- **KI-Haftungsausschluss**: Bei jeder KI-Antwort angezeigt (Mentor, DeepDive, Sorten-Tipps, Diagnostik) plus medizinischer Disclaimer bei Diagnoseergebnissen.
- **Injection-Schutz**: 30+ Regex-Muster in `geminiService.ts` verhindern Prompt-Injection-Angriffe.
- **Rate Limiting**: Sliding-Window-Rate-Limiter (15 Req/Min) mit täglichem Token-Kosten-Tracking.
- **DOMPurify**: Alle `dangerouslySetInnerHTML`-Inhalte werden mit DOMPurify v3 bereinigt.
- **Link-Sicherheit**: Alle externen Links verwenden `rel="noopener noreferrer"`.

---

## 🤖 Multi-Provider KI (BYOK)

CannaGuide unterstützt **Bring Your Own Key (BYOK)** für mehrere KI-Anbieter. Alle Schlüssel werden mit AES-256-GCM verschlüsselt gespeichert:

| Anbieter                     | Modelle                                                                           | Schlüsselformat |
| :--------------------------- | :-------------------------------------------------------------------------------- | :-------------- |
| **Google Gemini** (Standard) | `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash-preview-image-generation` | `AIza...`       |
| **OpenAI**                   | `gpt-4o-mini`, `gpt-4o`                                                           | `sk-...`        |
| **xAI (Grok)**               | `grok-3-mini-fast`, `grok-3`                                                      | `xai-...`       |
| **Anthropic (Claude)**       | `claude-sonnet-4-20250514`                                                        | `sk-ant-...`    |

Konfigurieren Sie Ihren Anbieter unter **Einstellungen → Allgemein & UI → KI-Sicherheit**. Der ausgewählte Anbieter wird für alle KI-Funktionen verwendet: Mentor, Diagnostik, DeepDive, Sorten-Tipps und Ausrüstungsempfehlungen. Bilderzeugung ist derzeit Gemini-exklusiv.

---

## 🏁 Erste Schritte (Benutzerhandbuch)

Außer einem modernen Webbrowser ist keine Installation erforderlich.

1.  **Onboarding**: Beim ersten Start werden Sie durch ein kurzes Tutorial geführt, um Ihre bevorzugte Sprache einzustellen.
2.  **Sorten entdecken**: Beginnen Sie in der **Sorten**-Ansicht. Nutzen Sie die Suche und die Filter, um eine Sorte zu finden, und speichern Sie sie als Favorit, indem Sie auf das Herzsymbol klicken.
3.  **Anbau starten**: Navigieren Sie zum **Pflanzen**-Dashboard. Klicken Sie auf einen leeren Steckplatz, wählen Sie "Neuen Anbau starten", wählen Sie eine Sorte aus und konfigurieren Sie Ihr Setup.
4.  **Ihren Anbau verwalten**: Das **Pflanzen**-Dashboard ist Ihre Kommandozentrale. Protokollieren Sie Aktionen wie Gießen und Düngen, überprüfen Sie die Vitalwerte Ihrer Pflanze und holen Sie sich Ratschläge von der KI.
5.  **Befehlspalette verwenden**: Drücken Sie für den schnellsten Zugriff `Cmd/Ctrl + K`, um sofort zu navigieren oder Aktionen auszuführen.

---

## 🛠 Lokale Entwicklung (Entwicklerhandbuch)

Dieses Projekt ist für die Ausführung im Google AI Studio konzipiert, das den Entwicklungsserver und die Umgebungsvariablen bereitstellt. Sie können es jedoch auch lokal mit einem Standard-Node.js-Setup ausführen.

### Voraussetzungen

- [Node.js](https://nodejs.org/) (v18.x oder neuer empfohlen)
- [npm](https://www.npmjs.com/) (normalerweise bei Node.js enthalten)
- Ein **Google Gemini API Key**. Diesen erhalten Sie im [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Einrichtung

1.  **Repository klonen:**

    ```bash
    git clone https://github.com/qnbs/CannaGuide-2025.git
    cd CannaGuide-2025
    ```

2.  **Abhängigkeiten installieren:**

    ```bash
    npm install
    ```

3.  **Entwicklungsserver starten:**

    ```bash
    npm run dev
    ```

    Dies startet den Vite-Entwicklungsserver, typischerweise unter `http://localhost:5173`.

4.  **Gemini API-Key zur Laufzeit setzen (BYOK):**
    Öffnen Sie die App und gehen Sie zu **Einstellungen → Allgemein & UI → KI-Sicherheit (Multi-Model BYOK)**.
    Hinterlegen Sie dort Ihren Gemini-Key. Der Key wird nur lokal in IndexedDB auf diesem Gerät/Browserprofil gespeichert.

5.  **Qualitätsprüfungen:**
    ```bash
    npm run lint          # schneller Gate: geänderte JS/TS-Dateien (nur Errors)
    npm run test -- --run # komplette Testsuite
    npm run build         # Produktionsbuild
    ```
    Optional für technischen Schuldenabbau:
    ```bash
    npm run lint:full     # gesamtes Projekt linten (Warnings erlaubt)
    npm run lint:strict   # gesamtes Projekt linten (Warnings schlagen fehl)
    ```

---

## 📦 Distributionsziele

Distributionsstarter-Scaffolding ist für Desktop-/Mobil-Wrapper und Self-Hosting verfügbar:

- Docker Self-Hosting: `Dockerfile`, `docker/nginx.conf`, `docker-compose.yml`
- Tauri Desktop-Wrapper: `src-tauri/`
- Capacitor Mobil-Wrapper: `capacitor.config.ts`

Siehe vollständige Setup-Hinweise in `docs/distribution.md`.

---

## 🔐 Gemini-BYOK-Einrichtung

Dieser Abschnitt beschreibt das Gemini-BYOK-Setup für den Standard-Anbieter. Zum Wechsel zwischen den unterstützten Anbietern siehe die Multi-Provider-KI-Übersicht weiter oben:

1. **Gemini API-Key in Google AI Studio erstellen**
    - Öffnen Sie: https://aistudio.google.com/app/apikey
    - Melden Sie sich mit Ihrem Google-Konto an.
    - Klicken Sie auf **Create API key** (oder **Create API key in new project**).
    - Kopieren Sie den erzeugten Key (beginnt mit `AIza...`).

2. **Key in CannaGuide hinterlegen**
    - Öffnen Sie **Einstellungen → Allgemein & UI → KI-Sicherheit (Multi-Model BYOK)**.
    - Key einfügen und auf **Key speichern** klicken.
    - Optional **Key prüfen** nutzen, um Erreichbarkeit/Berechtigungen direkt zu testen.

3. **Was BYOK in der App abdeckt**
    - Der gespeicherte Key wird für **alle Gemini-Funktionen** verwendet: Diagnose, Mentor, proaktive Beratung, Sorten-Tipps, Bildgenerierung, Deep Dives, Equipment-Empfehlungen und Garden-Zusammenfassungen.
    - Der Key wird **nur lokal** in IndexedDB im aktuellen Browserprofil gespeichert.
    - Der Key ist **nicht** im Build enthalten, wird nicht in Git committet und nicht über `.env` im Produktionsbetrieb verteilt.

4. **Sicherheits- und Betriebs-Hinweise**
    - Teilen Sie Ihren Key niemals.
    - Entfernen Sie den Key auf gemeinsam genutzten Geräten.
    - Falls die Prüfung fehlschlägt: prüfen Sie Gemini-API-Zugriff, Projektberechtigungen sowie Quota-/Billing-Limits in Ihrem Google-Projekt.

---

## 🚀 GitHub Pages Deployment

Dieses Repository enthält einen einsatzbereiten GitHub-Actions-Workflow unter `.github/workflows/deploy.yml`.

1. Änderungen nach `main` pushen.
2. In GitHub: `Settings → Pages → Source: GitHub Actions`.
3. Warten, bis der Workflow **Deploy to GitHub Pages** erfolgreich abgeschlossen ist.
4. App-URL (dieses Repository): `https://qnbs.github.io/CannaGuide-2025/`
5. Bei Forks ist die URL typischerweise: `https://<dein-benutzername>.github.io/CannaGuide-2025/`

Wichtig:

- `vite.config.ts` nutzt `base: '/CannaGuide-2025/'`.
- Der Gemini API-Key ist **nicht** Teil des Builds; Nutzer hinterlegen ihn in der App via BYOK.

---

## 🤔 Fehlerbehebung (Troubleshooting)

- **KI-Funktionen funktionieren nicht**: Meist fehlt ein gültiger API-Key. Öffnen Sie `Einstellungen → Allgemein & UI → KI-Sicherheit (Multi-Model BYOK)`, validieren oder speichern Sie den Key und versuchen Sie es erneut. Prüfen Sie zusätzlich die Entwicklerkonsole auf `4xx`-Fehler.
- **App aktualisiert sich nicht (PWA-Caching)**: Deploy-Updates werden normalerweise automatisch erkannt. Falls ein Update verzögert wirkt:
    1.  Tab in den Vordergrund holen (Fokus/Sichtbarkeit triggert Update-Check).
    2.  Einige Sekunden auf automatische Aktivierung + Reload warten.
    3.  Falls nötig, den Update-Button im In-App-Banner nutzen.
    4.  Nur als letzter Schritt in den Browser-DevTools unter `Application → Service Workers` manuell `Update/Unregister` ausführen.
- **Datenprobleme**: Sollte der Zustand der Anwendung beschädigt werden, können Sie einen Hard-Reset durchführen, indem Sie zu `Einstellungen > Datenverwaltung > Alle App-Daten zurücksetzen` navigieren. **Achtung: Dies löscht alle Ihre lokalen Daten.**
- **Lokale KI-Modelle laden nicht**: Stellen Sie eine stabile Verbindung für den ersten Modell-Download sicher. Prüfen Sie, ob der Browserspeicher nicht voll ist (Einstellungen → Datenverwaltung → Speicherübersicht). Falls Persistent Storage nicht gewährt ist, kann der Browser gecachte Modelle entfernen. Versuchen Sie erneut „Modelle laden".
- **WebLLM nicht verfügbar**: WebLLM erfordert WebGPU-Unterstützung (modernes Chrome/Edge). Auf nicht unterstützten Browsern fällt CannaGuide automatisch auf Transformers.js (WASM) zurück. Dies ist erwartetes Verhalten — kein Fehler.
- **Lokale KI langsam**: Aktivieren Sie den **WASM-erzwingen**-Schalter in Einstellungen → Allgemein & UI, wenn Sie WebGPU-Treiberprobleme vermuten. Wechseln Sie zum leichtgewichtigen `Qwen3-0.5B`-Modell für schnellere Inferenz auf schwachen Geräten.
- **Cloud-Sync-Probleme**: Gist-Push/Pull ist anonym und von GitHub ratenbegrenzt. Bei Push-Fehlern kurz warten und erneut versuchen. Stellen Sie sicher, dass die Gist-URL/ID beim Pull korrekt ist. Synchronisierte Daten werden validiert — beschädigte Gists zeigen eine Fehlermeldung.

---

## 🤖 Entwicklung mit AI Studio & Open Source

Diese Anwendung wurde vollständig mit **Googles AI Studio** entwickelt. Der gesamte Prozess, vom anfänglichen Projekt-Setup bis zur Implementierung komplexer Funktionen wie der Redux-Zustandsverwaltung und der Web-Worker-Simulation, wurde durch iterative Anweisungen in natürlicher Sprache gesteuert.

Dieses Projekt ist zudem vollständig Open Source. Tauchen Sie in den Code ein, forken Sie das Projekt oder tragen Sie auf GitHub bei. Erleben Sie aus erster Hand, wie natürliche Sprache anspruchsvolle Anwendungen erstellen kann.

- **Projekt in AI Studio forken:** [https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-](https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-)
- **Quellcode auf GitHub ansehen:** [https://github.com/qnbs/CannaGuide-2025](https://github.com/qnbs/CannaGuide-2025)

---

## 🤝 Mitwirken (Contributing)

Wir freuen uns über Beiträge aus der Community! Ob Sie einen Fehler beheben, eine neue Funktion hinzufügen oder Übersetzungen verbessern möchten, Ihre Hilfe ist willkommen. Lesen Sie unsere [CONTRIBUTING.md](CONTRIBUTING.md) für detaillierte Richtlinien.

1.  **Probleme melden**: Wenn Sie einen Fehler finden oder eine Idee haben, [eröffnen Sie bitte zuerst ein Issue](https://github.com/qnbs/CannaGuide-2025/issues) auf GitHub, um es zu besprechen.
2.  **Änderungen vornehmen**:
    - Forken Sie das Repository.
    - Erstellen Sie einen neuen Branch für Ihr Feature oder Ihren Bugfix (`git checkout -b feature/mein-neues-feature`).
    - Committen Sie Ihre Änderungen (`git commit -am 'Füge ein Feature hinzu'`).
    - Pushen Sie den Branch (`git push origin feature/mein-neues-feature`).
    - Erstellen Sie einen neuen Pull Request.

Bitte halten Sie sich an den bestehenden Codestil und stellen Sie sicher, dass Ihre Änderungen gut dokumentiert sind.

---

## 🗺 Roadmap

> Vollständige Details mit Meilensteinen, Epics und verlinkten Issues: [ROADMAP.md](ROADMAP.md)

| Version  | Status            | Highlights                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1.0** | ✅ Veröffentlicht | 700+ Sorten, VPD-Simulation, Multi-Provider KI (Gemini/OpenAI/xAI/Anthropic), DSGVO, WCAG 2.2 AA, 307 Tests, ESP32, Zuchtlabor, EN/DE i18n                                                                                                                                                                                                                                                                              |
| **v1.1** | ✅ Veröffentlicht | **Lokaler KI-Stack** (WebLLM + Transformers.js + CLIP-Vision, 33 Labels), ONNX-Backend-Routing (WebGPU/WASM), Inferenz-Caching (LRU-64), Modell-Preload-UI mit Benchmarks, Sentry lokale-KI-Attribution, Ein-Tipp Cloud-Sync (Gist), Tägliche Sortenkatalog-Automatisierung (04:20 UTC), Playwright Component-Tests, Netlify PR-Previews, PWA Auto-Update mit Changelog, Docker ESP32-Mock, CI/CD für Tauri + Capacitor |
| **v1.2** | 🔄 Geplant        | Zusätzliche Sprachen (ES, FR, NL), Erweiterte Nährstoffplanung mit EC/pH-Automatisierung, Community-Sorten-Marktplatz, Auto-generierte Grow-Berichte (PDF)                                                                                                                                                                                                                                                              |
| **v1.3** | 📋 Geplant        | Zusätzliche IoT-Sensoren, Zeitraffer-Foto-Journal, Sorten-Vergleichstool, Erweitertes Analyse-Dashboard, Three.js 3D-Visualisierungen                                                                                                                                                                                                                                                                                   |

---

## ⚠ Haftungsausschluss

> Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und im Einklang mit dem Gesetz.

> Diese App bietet keine Rechts- oder Medizinberatung.

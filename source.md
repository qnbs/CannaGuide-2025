#  CannaGuide 2025 - Kompletter Quellcode

Dies ist eine strukturierte Dokumentation des gesamten Quellcodes der CannaGuide 2025 Anwendung.

## Verzeichnisstruktur

```
.
├── components/
│   ├── common/
│   ├── icons/
│   ├── navigation/
│   ├── settings/
│   ├── ui/
│   └── views/
│       ├── equipment/
│       ├── help/
│       ├── knowledge/
│       ├── plants/
│       └── strains/
├── data/
│   └── strains/
├── hooks/
├── locales/
│   ├── de/
│   │   └── strains/
│   └── en/
│       └── strains/
├── services/
├── stores/
│   └── slices/
├── types/
└── workers/
```

---

## 1. Konfiguration & Root-Dateien

In diesem Abschnitt befinden sich die grundlegenden Konfigurationsdateien des Projekts, die README-Dokumentation, PWA-Assets und die Haupteinstiegspunkte der Anwendung.

---

### `README.md`

```markdown
<!-- 
This README file supports two languages.
- English version is first.
- Deutsche Version (German version) follows below.
-->

# 🌿 CannaGuide 2025 (English)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/qnbs/CannaGuide-2025)

**The Definitive AI-Powered Cannabis Cultivation Companion**

CannaGuide 2025 is your definitive AI-powered digital co-pilot for the entire cannabis cultivation lifecycle. Engineered for both novice enthusiasts and master growers, this state-of-the-art **Progressive Web App (PWA)** guides you from seed selection to a perfectly cured harvest. Simulate grows with an advanced VPD-based engine, explore a vast library of over 480 strains, diagnose plant issues with a photo, plan equipment with Gemini-powered intelligence, and master your craft with an interactive, data-driven guide.

---

## Table of Contents

- [⭐ Project Philosophy](#-project-philosophy)
- [🚀 Key Features](#-key-features)
- [💻 Technical Deep Dive](#-technical-deep-dive)
- [🤖 Development with AI Studio & Open Source](#-development-with-ai-studio--open-source)
- [🤝 Contributing](#-contributing)
- [🏁 Getting Started](#-getting-started)
- [⚠️ Disclaimer](#️-disclaimer)
- [Deutsche Version](#-cannaguide-2025-deutsch)

---

## ⭐ Project Philosophy

CannaGuide 2025 is built upon a set of core principles designed to deliver a best-in-class experience:

*   **Offline First**: Your garden doesn't stop when your internet does. The app is engineered to be **100% functional offline**, ensuring you always have access to your data and tools.
*   **Performance is Key**: A fluid, responsive UI is non-negotiable. Heavy lifting, like the complex plant simulation, is offloaded to a **Web Worker** to keep the interface smooth and instantaneous.
*   **Data Sovereignty**: Your data is yours. The ability to **export and import your entire application state** gives you complete control, ownership, and peace of mind.
*   **AI as a Co-pilot**: We leverage AI not as a gimmick, but as a powerful tool to provide **actionable, context-aware insights** that truly assist the grower at every stage.

---

## 🚀 Key Features

### 1. The Grow Room (`Plants` View)
Your command center for managing and simulating up to three simultaneous grows.

*   **Ultra-Realistic Simulation Engine**: Experience a state-of-the-art simulation based on **VPD (Vapor Pressure Deficit)**, biomass-scaled resource consumption, and a structural growth model.
*   **AI-Powered Diagnostics**: Upload a photo of your plant to get an instant AI-based diagnosis, complete with immediate actions, long-term solutions, and preventative advice.
*   **AI Plant Advisor**: Get proactive, data-driven advice from Gemini AI based on your plant's real-time vitals. All recommendations can be archived with full **CRUD** functionality.
*   **Comprehensive Logging**: Track every action—from watering and feeding to training and pest control—in a detailed, filterable journal for each plant.
*   **Dynamic Task & Problem Generation**: The simulation engine automatically creates tasks (e.g., "Water Plant") and flags problems (e.g., "Nutrient Deficiency") based on the plant's evolving condition.

### 2. The Strain Encyclopedia (`Strains` View)
Your central knowledge hub, designed for deep exploration with **offline-first** access.

*   **Vast Library**: Access detailed information on **over 480 cannabis strains**.
*   **Interactive Genealogy Tree**: Visualize the complete genetic lineage of any strain in an interactive tree diagram.
*   **High-Performance Search & Filtering**: Instantly find strains with an IndexedDB-powered full-text search and advanced multi-select filters for THC/CBD range, flowering time, aroma, and more.
*   **Personal Strain Collection**: Enjoy full **CRUD (Create, Read, Update, Delete)** functionality to add and manage your own custom strains.
*   **AI Grow Tips**: Generate unique, AI-powered cultivation advice for any strain based on your experience level and goals, then manage it in a dedicated "Tips" archive.
*   **Flexible Data Export**: Export your selected or filtered strain lists in multiple formats, including **PDF, CSV, and JSON**.

### 3. The Library (`Knowledge` & `Help` Views)
Your complete resource for learning and problem-solving.

*   **Context-Aware AI Mentor**: Ask growing questions to the AI Mentor, which leverages your active plant's data for tailored advice. All conversations are archived with full **CRUD** support.
*   **Breeding Lab**: Cross your high-quality collected seeds to create entirely new, unique hybrid strains that are permanently added to your personal library.
*   **Interactive Sandbox**: Run "what-if" scenarios, like comparing Topping vs. LST on a clone of your plant, to visualize the impact of different training techniques over an accelerated 14-day simulation without risking your real plants.
*   **Comprehensive Guides**: Access a built-in grower's lexicon, visual guides for common techniques, and an extensive FAQ section.

### 4. Platform-Wide Features
*   **Full PWA & Offline Capability**: Install the app on your device for a native-like experience. The robust Service Worker ensures **100% offline functionality**, including access to all data and AI archives.
*   **Command Palette (`Cmd/Ctrl + K`)**: A power-user tool for instant, click-free navigation and actions across the entire application.
*   **Complete Data Sovereignty**: Export *all* your app data (plants, settings, archives, custom strains) to a single JSON file for **backup**. Import it later to **restore** your state on any device.
*   **Advanced Accessibility**: Features a **Dyslexia-Friendly Font**, **Reduced Motion** mode, and integrated **Text-to-Speech (TTS)** functionality for key content.

---

## 💻 Technical Deep Dive

CannaGuide 2025 is built on a modern, robust, and scalable tech stack designed for performance and offline-first reliability.

*   **Core Framework**: **React 19 & TypeScript** provide a modern, type-safe, and performant user interface.
*   **State Management**: **Redux Toolkit** serves as the single source of truth for the entire application state. This centralized approach ensures predictable state transitions, simplifies debugging with tools like Redux DevTools, and makes state persistence straightforward.
*   **AI Integration**: **Google Gemini API (`@google/genai`)** powers all intelligent features, using the `gemini-2.5-flash` model for its optimal balance of speed, cost, and its powerful ability to deliver structured JSON output.
*   **Asynchronous Operations**:
    *   **RTK Query** manages all interactions with the Gemini API, providing caching, automatic re-fetching, and streamlined loading/error state management.
    *   The complex plant growth simulation runs in a **Web Worker (`simulation.worker.ts`)**, ensuring the main UI thread remains responsive and smooth, even during intensive background calculations.
*   **Data Persistence**: A robust **IndexedDB** strategy ensures data integrity and offline availability.
    *   The entire Redux state is persisted to IndexedDB via a listener middleware, providing seamless state hydration on app startup.
    *   Large static assets, like the strain library and the full-text search index, are managed in a separate IndexedDB database for optimal performance and to avoid bloating the main state object.
*   **PWA & Offline Capability**: A **Service Worker (`sw.js`)** implements a "Cache First, then Network" strategy, making the application fully installable and functional without an internet connection.
*   **Styling**: **Tailwind CSS** enables a rapid, utility-first approach to building a consistent and responsive design system that is easy to maintain and customize.

---

## 🤖 Development with AI Studio & Open Source

This application was developed entirely with **Google's AI Studio**. The entire process, from the initial project scaffolding to implementing complex features like the Redux state management and the Web Worker simulation, was driven by iterative prompts in natural language.

This project is also fully open source. Dive into the code, fork the project, or contribute on GitHub. See firsthand how natural language can build sophisticated applications.

*   **Fork the project in AI Studio:** [https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-](https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-)
*   **View the source code on GitHub:** [https://github.com/qnbs/CannaGuide-2025](https://github.com/qnbs/CannaGuide-2025)

---

## 🤝 Contributing

We welcome contributions from the community! Whether you want to fix a bug, add a new feature, or improve translations, your help is appreciated.

1.  **Reporting Issues**: If you find a bug or have an idea, please [open an issue](https://github.com/qnbs/CannaGuide-2025/issues) on GitHub first to discuss it.
2.  **Making Changes**:
    *   Fork the repository.
    *   Create a new branch for your feature or bugfix (`git checkout -b feature/my-new-feature`).
    *   Commit your changes (`git commit -am 'Add some feature'`).
    *   Push to the branch (`git push origin feature/my-new-feature`).
    *   Create a new Pull Request.

Please follow the existing code style and ensure your changes are well-documented.

---

## 🏁 Getting Started

No installation or setup is required. The application runs entirely in your web browser.

1.  **Onboarding**: On first launch, you'll be guided through a quick tutorial to set your preferred language.
2.  **Discover Strains**: Start in the **Strains** view. Use the search and filters to find a strain and save it as a favorite by clicking the heart icon.
3.  **Start Growing**: Navigate to the **Plants** dashboard. From an empty slot, click "Start New Grow," select a strain from your favorites or the main list, and configure your setup.
4.  **Manage Your Grow**: The **Plants** dashboard is your command center. Log actions like watering and feeding, check on your plant's vitals, and get advice from the AI.
5.  **Use the Command Palette**: For the fastest access, press `Cmd/Ctrl + K` to navigate or perform actions instantly.

---

## ⚠️ Disclaimer

> All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.

---
---

# 🌿 CannaGuide 2025 (Deutsch)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/qnbs/CannaGuide-2025)

**Der definitive KI-gestützte Cannabis-Anbau-Begleiter**

CannaGuide 2025 ist Ihr digitaler Co-Pilot für den gesamten Lebenszyklus des Cannabisanbaus. Entwickelt für sowohl neugierige Einsteiger als auch für erfahrene Meisterzüchter, führt Sie diese hochmoderne **Progressive Web App (PWA)** von der Samenauswahl bis zur perfekt ausgehärteten Ernte. Simulieren Sie Anbauvorgänge mit einer fortschrittlichen VPD-basierten Engine, erkunden Sie eine Bibliothek mit über 480 Sorten, diagnostizieren Sie Pflanzenprobleme per Foto, planen Sie Ihre Ausrüstung mit Gemini-gestützter Intelligenz und meistern Sie Ihr Handwerk mit einem interaktiven, datengesteuerten Leitfaden.

---

## Inhaltsverzeichnis

- [⭐ Projektphilosophie](#-projektphilosophie-1)
- [🚀 Hauptfunktionen](#-hauptfunktionen-1)
- [💻 Technischer Deep Dive](#-technischer-deep-dive-1)
- [🤖 Entwicklung mit AI Studio & Open Source](#-entwicklung-mit-ai-studio--open-source-1)
- [🤝 Mitwirken (Contributing)](#-mitwirken-contributing-1)
- [🏁 Erste Schritte](#-erste-schritte-1)
- [⚠️ Haftungsausschluss](#️-haftungsausschluss-1)

---

## ⭐ Projektphilosophie

CannaGuide 2025 basiert auf einer Reihe von Kernprinzipien, die darauf ausgelegt sind, ein erstklassiges Erlebnis zu bieten:
```

### `package.json`

```json
{
  "name": "cannaguide-2025",
  "version": "2.1.0",
  "private": true,
  "description": "Your AI-powered digital companion for the entire cannabis cultivation cycle. Track plants, explore over 480 strains, get AI equipment advice, and master your grow with an interactive guide.",
  "dependencies": {
    "@google/genai": "^1.19.0",
    "@reduxjs/toolkit": "^2.2.6",
    "d3": "^7.9.0",
    "i18next": "^25.5.2",
    "immer": "^10.1.3",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-i18next": "^15.0.0",
    "react-redux": "^9.1.2",
    "reselect": "^5.1.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/d3": "^7.4.3",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.15.0",
    "@typescript-eslint/parser": "^7.15.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.34.3",
    "eslint-plugin-react-hooks": "^4.6.2",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.7",
    "prettier": "^3.3.2",
    "typescript": "^5.5.3"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  },
  "prettier": {
    "semi": false,
    "singleQuote": true,
    "trailingComma": "es5",
    "printWidth": 100,
    "tabWidth": 4
  }
}
```

### `tsconfig.json`

```json
{
    "compilerOptions": {
        "target": "ESNext",
        "lib": ["DOM", "DOM.Iterable", "ESNext", "WebWorker"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "noImplicitAny": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["./*"]
        }
    },
    "include": ["**/*.ts", "**/*.tsx"],
    "exclude": ["node_modules"]
}
```

### `.eslintrc.json`

```json
{
    "parser": "@typescript-eslint/parser",
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "plugins": ["react", "react-hooks", "@typescript-eslint"],
    "parserOptions": {
        "ecmaVersion": 2021,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "settings": {
        "react": {
            "version": "detect"
        }
    },
    "env": {
        "browser": true,
        "es2021": true,
        "node": true,
        "worker": true
    },
    "rules": {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
        "@typescript-eslint/no-explicit-any": "warn",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn"
    }
}
```

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="importmap">
{
  "imports": {
    "@/": "./",
    "zod": "https://aistudiocdn.com/zod@^3.23.8",
    "jspdf-autotable": "https://aistudiocdn.com/jspdf-autotable@^3.8.2",
    "jspdf": "https://aistudiocdn.com/jspdf@^2.5.1",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.19.0",
    "react-dom": "https://aistudiocdn.com/react-dom@^19.1.1",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.1.1/",
    "react/": "https://aistudiocdn.com/react@^19.1.1/",
    "react": "https://aistudiocdn.com/react@^19.1.1",
    "i18next": "https://aistudiocdn.com/i18next@^25.5.2",
    "react-i18next": "https://aistudiocdn.com/react-i18next@^15.0.0",
    "reselect": "https://aistudiocdn.com/reselect@^5.1.1",
    "immer": "https://aistudiocdn.com/immer@^10.1.3",
    "d3": "https://aistudiocdn.com/d3@^7.9.0",
    "immer/": "https://aistudiocdn.com/immer@^10.1.3/",
    "@reduxjs/toolkit": "https://aistudiocdn.com/@reduxjs/toolkit@^2.2.6",
    "react-redux": "https://aistudiocdn.com/react-redux@^9.1.2",
    "@reduxjs/toolkit/": "https://aistudiocdn.com/@reduxjs/toolkit@^2.2.6/",
    "zustand/": "https://aistudiocdn.com/zustand@^5.0.8/"
  }
}
</script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CannaGuide 2025 - Cannabis Grow Guide with Gemini</title>
    <meta name="description" content="Cannabis Grow Guide with Gemini - Your AI-powered digital companion for the entire cannabis cultivation cycle. Track plants, explore over 480 strains, get AI equipment advice, and master your grow with an interactive guide." />

    <!-- PWA -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0F172A" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="CannaGuide 2025" />
    <link rel="icon" href="favicon.ico" sizes="any" />
    <link rel="icon" href="icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="icon.svg" />

    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <style>
      :root, :root.dark.theme-midnight { color-scheme: dark; --color-bg-primary: 0 0 0; --color-bg-component: 10 10 10; --color-border: 120 120 120; --color-primary-50: 239 246 255; --color-primary-100: 219 234 254; --color-primary-200: 191 219 254; --color-primary-300: 147 197 253; --color-primary-400: 96 165 250; --color-primary-500: 59 130 246; --color-primary-600: 37 99 235; --color-primary-700: 29 78 216; --color-primary-800: 30 64 175; --color-primary-900: 30 58 138; --color-primary-950: 23 37 84; --color-accent-50: 236 254 255; --color-accent-100: 207 250 254; --color-accent-200: 165 243 252; --color-accent-300: 103 232 249; --color-accent-400: 34 211 238; --color-accent-500: 6 182 212; --color-accent-600: 8 145 178; --color-accent-700: 14 116 144; --color-accent-800: 21 94 117; --color-accent-900: 24 78 99; --color-accent-950: 8 46 60; --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 255 255 255; --color-neutral-400: 220 220 220; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23; --color-text-on-accent: 23 37 84; }
      :root.dark.theme-forest { color-scheme: dark; --color-bg-primary: 20 31 25; --color-bg-component: 28 44 35; --color-border: 41 61 49; --color-primary-50: 240 253 244; --color-primary-100: 220 252 231; --color-primary-200: 187 247 208; --color-primary-300: 134 239 172; --color-primary-400: 74 222 128; --color-primary-500: 34 197 94; --color-primary-600: 22 163 74; --color-primary-700: 21 128 61; --color-primary-800: 22 101 52; --color-primary-900: 20 83 45; --color-primary-950: 5 46 22; --color-accent-50: 236 252 241; --color-accent-100: 209 250 229; --color-accent-200: 167 243 208; --color-accent-300: 110 231 183; --color-accent-400: 52 211 153; --color-accent-500: 16 185 129; --color-accent-600: 5 150 105; --color-accent-700: 4 120 87; --color-accent-800: 6 95 70; --color-accent-900: 6 78 59; --color-accent-950: 3 44 34; --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23; --color-text-on-accent: 5 46 22; }
      :root.dark.theme-purpleHaze { color-scheme: dark; --color-bg-primary: 28 25 45; --color-bg-component: 40 37 68; --color-border: 55 51 86; --color-primary-50: 245 243 255; --color-primary-100: 238 234 254; --color-primary-200: 224 218 255; --color-primary-300: 198 189 255; --color-primary-400: 163 148 255; --color-primary-500: 128 109 251; --color-primary-600: 110 87 248; --color-primary-700: 93 68 227; --color-primary-800: 77 54 186; --color-primary-900: 64 45 153; --color-primary-950: 37 26 89; --color-accent-50: 252 246 255; --color-accent-100: 247 236 255; --color-accent-200: 239 219 255; --color-accent-300: 227 194 255; --color-accent-400: 210 159 255; --color-accent-500: 192 121 255; --color-accent-600: 173 83 248; --color-accent-700: 149 57 222; --color-accent-800: 122 46 179; --color-accent-900: 100 39 146; --color-accent-950: 67 19 98; --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23; --color-text-on-accent: 255 255 255; }
      :root.dark.theme-desertSky { color-scheme: dark; --color-bg-primary: 38 34 50; --color-bg-component: 56 50 71; --color-border: 71 63 90; --color-primary-50: 247 243 255; --color-primary-100: 237 232 253; --color-primary-200: 221 214 254; --color-primary-300: 196 181 253; --color-primary-400: 167 139 250; --color-primary-500: 139 92 246; --color-primary-600: 124 58 237; --color-primary-700: 109 40 217; --color-primary-800: 91 33 182; --color-primary-900: 76 29 149; --color-primary-950: 46 16 101; --color-accent-50: 254 245 231; --color-accent-100: 253 230 138; --color-accent-200: 252 211 77; --color-accent-300: 251 191 36; --color-accent-400: 245 158 11; --color-accent-500: 217 119 6; --color-accent-600: 180 83 9; --color-accent-700: 146 64 14; --color-accent-800: 120 53 15; --color-accent-900: 99 44 19; --color-accent-950: 57 25 10; --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23; --color-text-on-accent: 46 16 101; }
      :root.dark.theme-roseQuartz { color-scheme: dark; --color-bg-primary: 31 26 34; --color-bg-component: 47 38 52; --color-border: 66 53 72; --color-primary-50: 253 242 248; --color-primary-100: 252 231 243; --color-primary-200: 251 207 232; --color-primary-300: 249 168 212; --color-primary-400: 244 114 182; --color-primary-500: 236 72 153; --color-primary-600: 219 39 119; --color-primary-700: 190 24 93; --color-primary-800: 157 23 77; --color-primary-900: 131 24 67; --color-primary-950: 86 10 39; --color-accent-50: 254 240 254; --color-accent-100: 251 222 251; --color-accent-200: 245 190 245; --color-accent-300: 232 142 232; --color-accent-400: 217 99 217; --color-accent-500: 200 63 200; --color-accent-600: 172 45 172; --color-accent-700: 147 37 147; --color-accent-800: 120 34 120; --color-accent-900: 99 29 99; --color-accent-950: 67 14 67; --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23; --color-text-on-accent: 255 255 255; }
    </style>
    <style>
      body {
        background-color: rgb(var(--color-bg-primary));
        color: rgb(var(--color-neutral-300));
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      .glass-pane {
        background-color: rgb(var(--color-bg-component) / 0.5);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgb(var(--color-border) / 0.5);
        box-shadow: 0 0 0 1px rgba(var(--color-bg-primary), 0.1), 0 2px 4px rgba(0,0,0,0.1);
      }

      #toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-end;
      }

      .toast {
        background-color: rgb(var(--color-bg-component));
        border: 1px solid rgb(var(--color-border));
        transition: all 0.3s ease-in-out;
      }

      .toast-entering {
        opacity: 0;
        transform: translateX(100%);
      }
      .toast-entered {
        opacity: 1;
        transform: translateX(0);
      }
      .toast-exiting {
        opacity: 0;
        transform: scale(0.9);
      }

      .skeleton-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes pulse {
        50% {
          opacity: 0.5;
        }
      }

      @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
      }

      /* For Favorite Button Glow */
      .favorite-btn-glow {
          transition: color 0.3s ease;
      }
      .favorite-btn-glow.is-favorite {
          color: rgb(var(--color-primary-400));
          animation: favorite-glow 1.5s ease-in-out;
      }

      @keyframes favorite-glow {
        0% { text-shadow: 0 0 5px rgba(var(--color-primary-400), 0); }
        50% { text-shadow: 0 0 20px rgba(var(--color-primary-400), 0.8); }
        100% { text-shadow: 0 0 5px rgba(var(--color-primary-400), 0); }
      }

      /* Range Slider Styles */
      .range-slider-input {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 8px;
        background: transparent;
        cursor: pointer;
        position: absolute;
        pointer-events: none;
      }

      .range-slider-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background-color: var(--thumb-color, #3b82f6);
        border-radius: 50%;
        border: 2px solid rgb(var(--color-bg-component));
        pointer-events: auto;
        transition: transform 0.2s ease, background-color 0.2s ease;
        transform: scale(var(--thumb-scale, 1));
      }

      .range-slider-input::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background-color: var(--thumb-color, #3b82f6);
        border-radius: 50%;
        border: 2px solid rgb(var(--color-bg-component));
        pointer-events: auto;
        transition: transform 0.2s ease, background-color 0.2s ease;
        transform: scale(var(--thumb-scale, 1));
      }

      .history-chart-grid line,
      .history-chart-grid path {
        stroke: rgb(var(--color-border));
        stroke-opacity: 0.5;
      }
      .history-chart-labels {
        fill: rgb(var(--color-neutral-400));
        font-size: 10px;
        font-family: 'IBM Plex Mono', monospace;
      }
      
      .offline-banner {
        background-color: rgb(var(--color-primary-800));
        color: rgb(var(--color-primary-100));
        text-align: center;
        padding: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .card-interactive-glow {
        position: relative;
        overflow: hidden;
        transition: transform 0.2s ease-in-out, border-color 0.2s ease-in-out;
      }
      .card-interactive-glow:hover {
        transform: translateY(-4px);
        border-color: rgba(var(--color-primary-500), 0.5);
      }
      .card-interactive-glow::before {
        content: '';
        position: absolute;
        left: var(--x, 50%);
        top: var(--y, 50%);
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(var(--color-primary-500), 0.15) 0%, rgba(var(--color-primary-500), 0) 60%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      .card-interactive-glow:hover::before {
        opacity: 1;
      }

      @keyframes fade-in-overlay {
          from { opacity: 0; }
          to { opacity: 1; }
      }
      .modal-overlay-animate {
          animation: fade-in-overlay 0.3s ease-out forwards;
      }

      @keyframes slide-in-up {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .modal-content-animate {
        animation: slide-in-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }
      
      .animate-slide-in-up {
          animation: slide-in-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }

      @keyframes fade-in-stagger {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in-stagger {
          animation: fade-in-stagger 0.4s ease-out forwards;
          opacity: 0;
      }

      /* Custom Scrollbar Styles */
      /* For Webkit-based browsers (Chrome, Safari, Edge) */
      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }

      ::-webkit-scrollbar-track {
        background: rgb(var(--color-bg-primary));
      }

      ::-webkit-scrollbar-thumb {
        background-color: rgb(var(--color-bg-component));
        border-radius: 6px;
        border: 3px solid rgb(var(--color-bg-primary));
      }

      ::-webkit-scrollbar-thumb:hover {
        background-color: rgb(var(--color-border));
      }
      
       .no-scrollbar::-webkit-scrollbar {
            display: none;
        }

        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

      /* For Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: rgb(var(--color-bg-component)) rgb(var(--color-bg-primary));
      }

      kbd {
        background-color: rgb(var(--color-bg-primary));
        border: 1px solid rgb(var(--color-border));
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 0.75em;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        color: rgb(var(--color-neutral-300));
      }
      
      /* Accessibility & UI Styles */
      .dyslexia-font, .dyslexia-font body {
        font-family: 'IBM Plex Mono', monospace !important;
      }
      .reduced-motion *, .reduced-motion *::before, .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      .ui-density-compact .glass-pane,
      .ui-density-compact .card-interactive,
      .ui-density-compact .p-4 {
        padding: 0.75rem; /* 12px */
      }
       .ui-density-compact .py-2 {
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
       }
       .ui-density-compact .text-sm {
        font-size: 0.8rem;
       }
       .ui-density-compact .text-xs {
        font-size: 0.7rem;
       }
       
      /* TTS Styles */
      .tts-disabled .speakable-button {
          display: none !important;
      }
      .speakable-highlight {
          background-color: rgb(var(--color-primary-800) / 0.4);
          box-shadow: inset 0 0 0 2px rgb(var(--color-primary-500));
          border-radius: 4px;
          transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      }
      
      @keyframes pulse-glow {
        0%, 100% {
          box-shadow: 0 0 5px rgba(var(--color-primary-500), 0.2);
        }
        50% {
          box-shadow: 0 0 20px rgba(var(--color-primary-500), 0.7);
        }
      }
      .animate-pulse-glow {
        animation: pulse-glow 2s infinite;
      }
      
      /* Form Element Styles */
      .select-input, .input-base {
        background-color: rgb(var(--color-neutral-800));
        border: 1px solid rgb(var(--color-neutral-700));
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        color: rgb(var(--color-neutral-300));
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      
      .select-input {
        -webkit-appearance: none;
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
      }
      
      .select-input:focus, .input-base:focus {
        outline: none;
        border-color: rgb(var(--color-primary-500));
        box-shadow: 0 0 0 2px rgb(var(--color-primary-500) / 0.5);
      }
    </style>
    <script>
      tailwind.config = { darkMode: 'class', theme: { extend: { colors: { primary: { 50: 'rgb(var(--color-primary-50) / <alpha-value>)', 100: 'rgb(var(--color-primary-100) / <alpha-value>)', 200: 'rgb(var(--color-primary-200) / <alpha-value>)', 300: 'rgb(var(--color-primary-300) / <alpha-value>)', 400: 'rgb(var(--color-primary-400) / <alpha-value>)', 500: 'rgb(var(--color-primary-500) / <alpha-value>)', 600: 'rgb(var(--color-primary-600) / <alpha-value>)', 700: 'rgb(var(--color-primary-700) / <alpha-value>)', 800: 'rgb(var(--color-primary-800) / <alpha-value>)', 900: 'rgb(var(--color-primary-900) / <alpha-value>)', 950: 'rgb(var(--color-primary-950) / <alpha-value>)' }, accent: { 50: 'rgb(var(--color-accent-50) / <alpha-value>)', 100: 'rgb(var(--color-accent-100) / <alpha-value>)', 200: 'rgb(var(--color-accent-200) / <alpha-value>)', 300: 'rgb(var(--color-accent-300) / <alpha-value>)', 400: 'rgb(var(--color-accent-400) / <alpha-value>)', 500: 'rgb(var(--color-accent-500) / <alpha-value>)', 600: 'rgb(var(--color-accent-600) / <alpha-value>)', 700: 'rgb(var(--color-accent-700) / <alpha-value>)', 800: 'rgb(var(--color-accent-800) / <alpha-value>)', 900: 'rgb(var(--color-accent-900) / <alpha-value>)', 950: 'rgb(var(--color-accent-950) / <alpha-value>)' }, slate: { 50: 'rgb(var(--color-neutral-50) / <alpha-value>)', 100: 'rgb(var(--color-neutral-100) / <alpha-value>)', 200: 'rgb(var(--color-neutral-200) / <alpha-value>)', 300: 'rgb(var(--color-neutral-300) / <alpha-value>)', 400: 'rgb(var(--color-neutral-400) / <alpha-value>)', 500: 'rgb(var(--color-neutral-500) / <alpha-value>)', 600: 'rgb(var(--color-neutral-600) / <alpha-value>)', 700: 'rgb(var(--color-neutral-700) / <alpha-value>)', 800: 'rgb(var(--color-neutral-800) / <alpha-value>)', 900: 'rgb(var(--color-neutral-900) / <alpha-value>)', 950: 'rgb(var(--color-neutral-950) / <alpha-value>)' }, 'on-accent': 'rgb(var(--color-text-on-accent) / <alpha-value>)', }, fontFamily: { sans: ['Inter', 'sans-serif'], display: ['Lexend', 'sans-serif'], mono: ['IBM Plex Mono', 'monospace'], } } } }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <div id="toast-container"></div>
    <script type="module" src="index.tsx"></script>
    <script src="/register-sw.js"></script>
  </body>
</html>
```

### `index.tsx`

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { App } from '@/components/views/plants/App'
import { createAppStore } from '@/stores/store'
import { i18nPromise, i18nInstance } from './i18n'

const root = ReactDOM.createRoot(document.getElementById('root')!)

const initialize = async () => {
    await i18nPromise

    // The store is now initialized without preloadedState.
    // State hydration and migration will be handled by the `runDataMigrations` thunk.
    const store = createAppStore()

    root.render(
        <React.StrictMode>
            <Provider store={store}>
                <I18nextProvider i18n={i18nInstance}>
                    <App />
                </I18nextProvider>
            </Provider>
        </React.StrictMode>
    )
}

initialize()
```

### `metadata.json`

```json
{
  "name": "CannaGuide 2025 - Cannabis Grow Guide with Gemini",
  "description": "Your AI-powered digital companion for the entire cannabis cultivation cycle. Track plants, explore over 480 strains, get AI equipment advice, and master your grow with an interactive guide.",
  "prompt": "",
  "requestFramePermissions": [
    "camera"
  ]
}
```

### `manifest.json`

```json
{
  "name": "CannaGuide 2025",
  "short_name": "CannaGuide",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "description": "Your AI-powered digital companion for the entire cannabis cultivation cycle.",
  "icons": [
    {
      "src": "/pwa-icon-192.png",
      "type": "image/png",
      "sizes": "192x192",
      "purpose": "any"
    },
    {
      "src": "/pwa-icon-512.png",
      "type": "image/png",
      "sizes": "512x512",
      "purpose": "any maskable"
    }
  ]
}
```

### `sw.js`

```javascript
const CACHE_NAME = 'cannaguide-v6-pwa-cache'; // New version to force update
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-icon.svg',
  '/register-sw.js',
  // NOTE: These are placeholders for actual icon files that should be generated
  // and placed in the public directory for the manifest to work correctly.
  // '/pwa-icon-192.png', 
  // '/pwa-icon-512.png',
];

// Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        // Add core assets required for the app to run offline
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests and serve from cache first (Cache-First strategy)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a cached response, return it immediately.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If the resource is not in the cache, fetch it from the network.
      return fetch(event.request).then((networkResponse) => {
        // We don't cache API calls to Google or other dynamic resources.
        if (!networkResponse || networkResponse.status !== 200 || event.request.url.includes('googleapis.com')) {
          return networkResponse;
        }
        
        // For other resources (like from the CDN), clone the response and cache it for future use.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(error => {
        console.error('[SW] Fetch failed; returning offline fallback if available.', error);
        // As a last resort for navigation requests, return the cached root page.
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        // For other failed requests, the browser's default offline error will show.
        throw error;
      });
    })
  );
});
```

### `register-sw.js`

```javascript
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful:', registration)
            })
            .catch((error) => {
                console.error('ServiceWorker registration failed:', error)
            })
    })
}
```

### `pwa-icon.svg`

```xml
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <defs>
        <linearGradient id='cannaGuideLeafGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stop-color='rgb(74, 222, 128)'/>
            <stop offset='100%' stop-color='rgb(16, 185, 129)'/>
        </linearGradient>
    </defs>
    <path stroke-linecap='round' stroke-linejoin='round' d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' stroke='currentColor' fill='none' stroke-width='1.5'/>
    <g transform='translate(5.2, 5.2) scale(0.6)'>
        <path fill='url(#cannaGuideLeafGradient)' stroke='none' d='M20.21,12.79a.78.78,0,0,0,0-1.11,5.27,5.27,0,0,1-3.79-3.79.78.78,0,0,0-1.11,0L12,11.16,8.69,7.89a.78.78,0,0,0-1.11,0A5.27,5.27,0,0,1,3.79,11.68a.78.78,0,0,0,0,1.11L7.06,16a.79.79,0,0,0,1.11,0,3.15,3.15,0,0,0,4.46,0,.79.79,0,0,0,1.11,0Z'/>
        <path fill='url(#cannaGuideLeafGradient)' stroke='none' d='M16.94,16a.79.79,0,0,0,1.11,0L21.42,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L18.05,13.2A5.28,5.28,0,0,1,16.94,16Z'/>
        <path fill='url(#cannaGuideLeafGradient)' stroke='none' d='M12,21.9a.79.79,0,0,0,.55-.22l3.27-3.27a.78.78,0,0,0-1.11-1.11L12,20,9.29,17.31a.78.78,0,0,0-1.11,1.11L11.45,21.68A.79.79,0,0,0,12,21.9Z'/>
        <path fill='url(#cannaGuideLeafGradient)' stroke='none' d='M2.58,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L.1,12.21a.78.78,0,0,0,0,1.11.77.77,0,0,0,.55.22.79.79,0,0,0,.56-.22l1.37-1.37A5.28,5.28,0,0,1,2.58,12Z'/>
    </g>
</svg>
```

### `icon.svg`

```xml
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path fill='rgb(15, 23, 42)' d='M50,0 C10,0 0,10 0,50 C0,90 10,100 50,100 C90,100 100,90 100,50 C100,10 90,0 50,0 Z'/><g transform='scale(3.5) translate(4, 4)' stroke-width='0.5' fill='none' stroke='rgb(226, 232, 240)'><defs><linearGradient id='cannaGuideLeafGradient' x1='0%' y1='0%' x2='0%' y2='100%'><stop offset='0%' stop-color='rgb(74, 222, 128)'/><stop offset='100%' stop-color='rgb(16, 185, 129)'/></linearGradient></defs><path stroke-linecap='round' stroke-linejoin='round' d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'/><g transform='translate(5.2, 5.2) scale(0.6)'><path fill='url(%23cannaGuideLeafGradient)' stroke='none' d='M20.21,12.79a.78.78,0,0,0,0-1.11,5.27,5.27,0,0,1-3.79-3.79.78.78,0,0,0-1.11,0L12,11.16,8.69,7.89a.78.78,0,0,0-1.11,0A5.27,5.27,0,0,1,3.79,11.68a.78.78,0,0,0,0,1.11L7.06,16a.79.79,0,0,0,1.11,0,3.15,3.15,0,0,0,4.46,0,.79.79,0,0,0,1.11,0Z'/><path fill='url(%23cannaGuideLeafGradient)' stroke='none' d='M16.94,16a.79.79,0,0,0,1.11,0L21.42,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L18.05,13.2A5.28,5.28,0,0,1,16.94,16Z'/><path fill='url(%23cannaGuideLeafGradient)' stroke='none' d='M12,21.9a.79.79,0,0,0,.55-.22l3.27-3.27a.78.78,0,0,0-1.11-1.11L12,20,9.29,17.31a.78.78,0,0,0-1.11,1.11L11.45,21.68A.79.79,0,0,0,12,21.9Z'/><path fill='url(%23cannaGuideLeafGradient)' stroke='none' d='M2.58,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L.1,12.21a.78.78,0,0,0,0,1.11.77.77,0,0,0,.55.22.79.79,0,0,0,.56-.22l1.37-1.37A5.28,5.28,0,0,1,2.58,12Z'/></g></g></svg>
```

### `constants.ts`

```typescript
import { PlantStage } from '@/types'

export const STAGES_ORDER: PlantStage[] = [
    PlantStage.Seed,
    PlantStage.Germination,
    PlantStage.Seedling,
    PlantStage.Vegetative,
    PlantStage.Flowering,
    PlantStage.Harvest,
    PlantStage.Drying,
    PlantStage.Curing,
    PlantStage.Finished,
]

export const FLOWERING_STAGES: PlantStage[] = [PlantStage.Flowering, PlantStage.Harvest]
```

### `types.ts`

```typescript
import type React from 'react'
import type { EntityState } from '@reduxjs/toolkit'
import { z } from 'zod'
import { GrowSetupSchema, PlantSchema, StrainSchema, WaterDataSchema } from './types/schemas'

// --- Zod Type Inference ---
export type Plant = z.infer<typeof PlantSchema>
export type Strain = z.infer<typeof StrainSchema>
export type GrowSetup = z.infer<typeof GrowSetupSchema>
export type WaterData = z.infer<typeof WaterDataSchema>

// --- ENUMS ---

export enum View {
    Strains = 'Strains',
    Plants = 'Plants',
    Equipment = 'Equipment',
    Knowledge = 'Knowledge',
    Settings = 'Settings',
    Help = 'Help',
}

export enum PlantStage {
    Seed = 'SEED',
    Germination = 'GERMINATION',
    Seedling = 'SEEDLING',
    Vegetative = 'VEGETATIVE',
    Flowering = 'FLOWERING',
    Harvest = 'HARVEST',
    Drying = 'DRYING',
    Curing = 'CURING',
    Finished = 'FINISHED',
}

export enum StrainType {
    Sativa = 'Sativa',
    Indica = 'Indica',
    Hybrid = 'Hybrid',
}

export enum ProblemType {
    NutrientDeficiency = 'NUTRIENT_DEFICIENCY',
    Overwatering = 'OVERWATERING',
    Underwatering = 'UNDERWATERING',
    PestInfestation = 'PEST_INFESTATION',
    PH_TOO_HIGH = 'PH_TOO_HIGH',
    PH_TOO_LOW = 'PH_TOO_LOW',
    HUMIDITY_TOO_HIGH = 'HUMIDITY_TOO_HIGH',
    HUMIDITY_TOO_LOW = 'HUMIDITY_TOO_LOW',
    TEMPERATURE_TOO_HIGH = 'TEMPERATURE_TOO_HIGH',
    TEMPERATURE_TOO_LOW = 'TEMPERATURE_TOO_LOW',
    NUTRIENT_BURN = 'NUTRIENT_BURN',
}

export enum JournalEntryType {
    Watering = 'WATERING',
    Feeding = 'FEEDING',
    Training = 'TRAINING',
    Observation = 'OBSERVATION',
    System = 'SYSTEM',
    Photo = 'PHOTO',
    PestControl = 'PEST_CONTROL',
    Environment = 'ENVIRONMENT',
    Amendment = 'AMENDMENT',
}

export enum StrainViewTab {
    All = 'all',
    MyStrains = 'my-strains',
    Favorites = 'favorites',
    Exports = 'exports',
    Tips = 'tips',
}

export enum EquipmentViewTab {
    Configurator = 'configurator',
    Setups = 'setups',
    Calculators = 'calculators',
    GrowShops = 'growShops',
}

export enum KnowledgeViewTab {
    Mentor = 'mentor',
    Guide = 'guide',
    Archive = 'archive',
    Breeding = 'breeding',
    Sandbox = 'sandbox',
}

export enum PhotoCategory {
    FullPlant = 'FullPlant',
    Bud = 'Bud',
    Leaf = 'Leaf',
    Roots = 'Roots',
    ProblemArea = 'ProblemArea',
    Trichomes = 'Trichomes',
    Setup = 'Setup',
}

// --- TYPE ALIASES ---

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard'
export type YieldLevel = 'Low' | 'Medium' | 'High'
export type HeightLevel = 'Short' | 'Medium' | 'Tall'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation'
export type Language = 'en' | 'de'
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz'
export type UiDensity = 'comfortable' | 'compact'
export type SortKey = 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'yield'
export type SortDirection = 'asc' | 'desc'
export type ModalType =
    | 'watering'
    | 'feeding'
    | 'training'
    | 'pestControl'
    | 'observation'
    | 'photo'
    | 'amendment'
export type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt' | 'xml'
export type PlantCount = '1' | '2-3'
export type Budget = 'value' | 'balanced' | 'premium'
export type GrowStyle = 'beginner' | 'balanced' | 'yield'
export type ScenarioAction = 'NONE' | 'TOP' | 'LST'
export type NotificationType = 'success' | 'error' | 'info'

// --- INTERFACES ---

export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
    prompt(): Promise<void>
}

export interface GeneticModifiers {
    pestResistance: number // multiplier
    nutrientUtakeRate: number // multiplier
    stressTolerance: number // multiplier
    rue: number // Radiation Use Efficiency
}

export interface PlantProblem {
    type: ProblemType
    status: 'active' | 'resolved'
    severity: number // 0 to 1
    detectedAt: number // timestamp
    resolvedAt?: number
}

export interface Task {
    id: string
    title: string
    description: string
    priority: TaskPriority
    isCompleted: boolean
    createdAt: number
    completedAt?: number
}

export interface PhotoDetails {
    imageId?: string
    imageUrl?: string
    photoCategory?: PhotoCategory
    diagnosis?: string
}

export interface JournalEntry {
    id: string
    createdAt: number
    type: JournalEntryType
    notes: string
    details?: Record<string, any> | PhotoDetails
}

export interface PlantHistoryEntry {
    day: number
    height: number
    health: number
    stressLevel: number
    medium: {
        ph: number
        ec: number
        moisture: number
    }
}

export interface HarvestData {
    wetWeight: number
    dryWeight: number
    terpeneRetentionPercent: number
    moldRiskPercent: number
    dryingEnvironment: {
        temperature: number
        humidity: number
    }
    currentDryDay: number
    currentCureDay: number
    jarHumidity: number
    finalQuality: number
    chlorophyllPercent: number
    terpeneProfile: Record<string, number>
    cannabinoidProfile: {
        thc: number
        cbn: number
    }
    lastBurpDay: number
}

export interface AIResponse {
    title: string
    content: string
}

export interface RecommendationItem {
    name: string
    price: number
    rationale: string
    watts?: number
}

export type RecommendationCategory =
    | 'tent'
    | 'light'
    | 'ventilation'
    | 'circulationFan'
    | 'pots'
    | 'soil'
    | 'nutrients'
    | 'extra'

export type Recommendation = {
    [key in RecommendationCategory]: RecommendationItem
} & { proTip: string }

export interface PlantDiagnosisResponse {
    title: string
    confidence: number
    diagnosis: string
    immediateActions: string
    longTermSolution: string
    prevention: string
}

export interface MentorMessage {
    role: 'user' | 'model'
    title: string
    content: string
    uiHighlights?: { elementId: string; plantId?: string }[]
}

export interface StructuredGrowTips {
    nutrientTip: string
    trainingTip: string
    environmentalTip: string
    proTip: string
}

export interface DeepDiveGuide {
    introduction: string
    stepByStep: string[]
    prosAndCons: {
        pros: string[]
        cons: string[]
    }
    proTip: string
}

export interface KnowledgeArticle {
    id: string
    titleKey: string
    contentKey: string
    tags: string[]
    triggers: {
        ageInDays?: { min: number; max: number }
        plantStage?: PlantStage | PlantStage[]
        activeProblems?: ProblemType[]
    }
}

export interface SavedExport {
    id: string
    createdAt: number
    name: string
    source: 'selected' | 'all'
    format: ExportFormat
    count: number
    strainIds: string[]
    notes?: string
}

export interface SavedSetup {
    id: string
    createdAt: number
    name: string
    recommendation: Recommendation
    totalCost: number
    sourceDetails: {
        plantCount: PlantCount
        area: string
        budget: string
        growStyle: string
    }
}

export interface SavedStrainTip extends AIResponse {
    id: string
    createdAt: number
    strainId: string
    strainName: string
    imageUrl?: string
}

export interface ArchivedMentorResponse extends Omit<MentorMessage, 'role'> {
    id: string
    createdAt: number
    query: string
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string
    createdAt: number
    plantId: string
    plantStage: PlantStage
    query: string
}

export interface Seed {
    id: string
    strainId: string
    strainName: string
    createdAt: number
}

export interface Experiment {
    id: string
    createdAt: number
    name: string
    basePlantId: string
    basePlantName: string
    scenarioDescription: string
    durationDays: number
    originalHistory: PlantHistoryEntry[]
    modifiedHistory: PlantHistoryEntry[]
    originalFinalState: Plant
    modifiedFinalState: Plant
}

export interface Scenario {
    id: string
    titleKey: string
    descriptionKey: string
    durationDays: number
    plantAModifier: { action: ScenarioAction; day: number }
    plantBModifier: { action: ScenarioAction; day: number }
}

export interface AdvancedFilterState {
    thcRange: [number, number]
    cbdRange: [number, number]
    floweringRange: [number, number]
    selectedDifficulties: DifficultyLevel[]
    selectedYields: YieldLevel[]
    selectedHeights: HeightLevel[]
    selectedAromas: string[]
    selectedTerpenes: string[]
}

export interface AppSettings {
    fontSize: 'sm' | 'base' | 'lg'
    language: Language
    theme: Theme
    defaultView: View
    strainsViewSettings: {
        defaultSortKey: SortKey
        defaultSortDirection: SortDirection
        defaultViewMode: 'list' | 'grid'
        visibleColumns: Record<string, boolean>
    }
    notificationsEnabled: boolean
    notificationSettings: {
        stageChange: boolean
        problemDetected: boolean
        harvestReady: boolean
        newTask: boolean
    }
    onboardingCompleted: boolean
    simulationProfile: 'beginner' | 'expert' | 'experimental' | 'custom'
    simulationSettings: {
        difficulty: 'easy' | 'medium' | 'hard' | 'custom'
        autoJournaling: {
            stageChanges: boolean
            problems: boolean
            tasks: boolean
        }
        customDifficultyModifiers: {
            pestPressure: number
            nutrientSensitivity: number
            environmentalStability: number
        }
        autoAdvance: boolean
        speed: string
    }
    defaultGrowSetup: {
        light: { type: 'LED' | 'HPS' | 'CFL'; wattage: number }
        potSize: number
        medium: 'Soil' | 'Coco' | 'Hydro'
    }
    defaultJournalNotes: {
        watering: string
        feeding: string
    }
    defaultExportSettings: {
        source: 'all' | 'selected'
        format: ExportFormat
    }
    lastBackupTimestamp?: number
    accessibility: {
        reducedMotion: boolean
        dyslexiaFont: boolean
    }
    uiDensity: UiDensity
    quietHours: {
        enabled: boolean
        start: string
        end: string
    }
    tts: TTSSettings
    showArchivedInPlantsView: boolean
    isExpertMode: boolean
}

export interface Command {
    id: string
    title: string
    subtitle?: string
    icon: React.FC
    group: string
    action: () => void
    keywords?: string
    shortcut?: string[]
    isHeader?: boolean
}

export interface Notification {
    id: number
    message: string
    type: NotificationType
}

export interface StoredImageData {
    id: string
    data: string // base64 data URL
    createdAt: number
}

export interface LexiconEntry {
    key: string
    category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General'
}

export interface VisualGuide {
    id: string
    titleKey: string
    descriptionKey: string
}

export interface FAQItem {
    id: string
    questionKey: string
    answerKey: string
    triggers: {
        ageInDays?: { min: number; max: number }
        plantStage?: PlantStage | PlantStage[]
        activeProblems?: ProblemType[]
    }
}

export interface StrainTranslationData {
    description?: string
    typeDetails?: string
    genetics?: string
    yieldDetails?: {
        indoor: string
        outdoor: string
    }
    heightDetails?: {
        indoor: string
        outdoor: string
    }
}

export interface SpeechQueueItem {
    id: string
    text: string
}

export interface TTSSettings {
    enabled: boolean
    voiceName: string | null
    rate: number
    pitch: number
}

export interface GenealogyNode {
    name: string
    id: string
    children?: GenealogyNode[]
}

// Redux State Interfaces
export interface SimulationState {
    plants: EntityState<Plant>
    plantSlots: (string | null)[]
    selectedPlantId: string | null
    devSpeedMultiplier: number
}

export interface UserStrainsState extends EntityState<Strain> {}

export interface BreedingState {
    collectedSeeds: Seed[]
    breedingSlots: {
        parentA: string | null
        parentB: string | null
    }
}

export interface KnowledgeProgress {
    [sectionId: string]: string[]
}

export interface SandboxState {
    savedExperiments: Experiment[]
    isLoading: boolean
    error: string | null
}
```

### `i18n.ts`

```typescript
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { de, en } from './locales'

// Create a direct instance of i18next
export const i18nInstance = i18next.createInstance()

/**
 * Provides a global accessor to the translation function (`t`) from the initialized i18next instance.
 * This is the single source of truth for translations outside of React components (e.g., in services, stores).
 * @returns The translation function.
 */
export const getT = () => i18nInstance.t

// Detect initial language from browser settings. The store will sync it up later upon hydration.
const detectedLang = navigator.language.split('-')[0]
const initialLang: 'en' | 'de' = detectedLang === 'de' ? 'de' : 'en'

// The initialization is now a promise that the app will wait for
export const i18nPromise = i18nInstance.use(initReactI18next).init({
    lng: initialLang,
    fallbackLng: 'en',
    resources: {
        en: { translation: en },
        de: { translation: de },
    },
    interpolation: {
        escapeValue: false, // React already handles escaping
    },
})
```

### `types/schemas.ts`

```typescript
import { z } from 'zod'

// Enums as Zod enums
export const PlantStageSchema = z.enum([
    'SEED',
    'GERMINATION',
    'SEEDLING',
    'VEGETATIVE',
    'FLOWERING',
    'HARVEST',
    'DRYING',
    'CURING',
    'FINISHED',
])
export const StrainTypeSchema = z.enum(['Sativa', 'Indica', 'Hybrid'])
export const DifficultyLevelSchema = z.enum(['Easy', 'Medium', 'Hard'])
export const YieldLevelSchema = z.enum(['Low', 'Medium', 'High'])
export const HeightLevelSchema = z.enum(['Short', 'Medium', 'Tall'])
export const ProblemTypeSchema = z.enum([
    'NUTRIENT_DEFICIENCY',
    'OVERWATERING',
    'UNDERWATERING',
    'PEST_INFESTATION',
    'PH_TOO_HIGH',
    'PH_TOO_LOW',
    'HUMIDITY_TOO_HIGH',
    'HUMIDITY_TOO_LOW',
    'TEMPERATURE_TOO_HIGH',
    'TEMPERATURE_TOO_LOW',
    'NUTRIENT_BURN',
])
export const JournalEntryTypeSchema = z.enum([
    'WATERING',
    'FEEDING',
    'TRAINING',
    'OBSERVATION',
    'SYSTEM',
    'PHOTO',
    'PEST_CONTROL',
    'ENVIRONMENT',
    'AMENDMENT',
])
export const TaskPrioritySchema = z.enum(['high', 'medium', 'low'])
export const TrainingTypeSchema = z.enum(['LST', 'Topping', 'FIMing', 'Defoliation'])

// Schemas for nested interfaces
export const StrainSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: StrainTypeSchema,
    typeDetails: z.string().optional(),
    genetics: z.string().optional(),
    floweringType: z.enum(['Photoperiod', 'Autoflower']),
    thc: z.number(),
    cbd: z.number(),
    thcRange: z.string().optional(),
    cbdRange: z.string().optional(),
    floweringTime: z.number(),
    floweringTimeRange: z.string().optional(),
    description: z.string().optional(),
    agronomic: z.object({
        difficulty: DifficultyLevelSchema,
        yield: YieldLevelSchema,
        height: HeightLevelSchema,
        yieldDetails: z.object({ indoor: z.string(), outdoor: z.string() }).optional(),
        heightDetails: z.object({ indoor: z.string(), outdoor: z.string() }).optional(),
    }),
    aromas: z.array(z.string()).optional(),
    dominantTerpenes: z.array(z.string()).optional(),
    geneticModifiers: z.object({
        pestResistance: z.number(),
        nutrientUtakeRate: z.number(),
        stressTolerance: z.number(),
        rue: z.number(),
    }),
})

export const PlantProblemSchema = z.object({
    type: ProblemTypeSchema,
    status: z.enum(['active', 'resolved']),
    severity: z.number(),
    detectedAt: z.number(),
    resolvedAt: z.number().optional(),
})

export const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    priority: TaskPrioritySchema,
    isCompleted: z.boolean(),
    createdAt: z.number(),
    completedAt: z.number().optional(),
})

export const JournalEntrySchema = z.object({
    id: z.string(),
    createdAt: z.number(),
    type: JournalEntryTypeSchema,
    notes: z.string(),
    details: z.record(z.any()).optional(),
})

export const PlantHistoryEntrySchema = z.object({
    day: z.number(),
    height: z.number(),
    health: z.number(),
    stressLevel: z.number(),
    medium: z.object({
        ph: z.number(),
        ec: z.number(),
        moisture: z.number(),
    }),
})

export const HarvestDataSchema = z.object({
    wetWeight: z.number(),
    dryWeight: z.number(),
    terpeneRetentionPercent: z.number(),
    moldRiskPercent: z.number(),
    dryingEnvironment: z.object({ temperature: z.number(), humidity: z.number() }),
    currentDryDay: z.number(),
    currentCureDay: z.number(),
    jarHumidity: z.number(),
    finalQuality: z.number(),
    chlorophyllPercent: z.number(),
    terpeneProfile: z.record(z.number()),
    cannabinoidProfile: z.object({ thc: z.number(), cbn: z.number() }),
    lastBurpDay: z.number(),
})

export const PlantSchema = z.object({
    id: z.string(),
    name: z.string(),
    strain: StrainSchema,
    createdAt: z.number(),
    lastUpdated: z.number(),
    age: z.number(),
    stage: PlantStageSchema,
    height: z.number(),
    biomass: z.number(),
    health: z.number(),
    stressLevel: z.number(),
    nutrientPool: z.number(),
    problems: z.array(PlantProblemSchema),
    tasks: z.array(TaskSchema),
    journal: z.array(JournalEntrySchema),
    history: z.array(PlantHistoryEntrySchema),
    isTopped: z.boolean(),
    lstApplied: z.number(),
    environment: z.object({
        internalTemperature: z.number(),
        internalHumidity: z.number(),
        vpd: z.number(),
        co2Level: z.number(),
    }),
    medium: z.object({
        ph: z.number(),
        ec: z.number(),
        moisture: z.number(),
        microbeHealth: z.number(),
    }),
    rootSystem: z.object({
        health: z.number(),
        microbeActivity: z.number(),
        rootMass: z.number(),
    }),
    structuralModel: z.object({
        branches: z.number(),
        nodes: z.number(),
        leafCount: z.number(),
    }),
    equipment: z.object({
        light: z.object({ wattage: z.number(), isOn: z.boolean(), lightHours: z.number() }),
        fan: z.object({ isOn: z.boolean(), speed: z.number() }),
    }),
    harvestData: HarvestDataSchema.optional(),
})

export const GrowSetupSchema = z.object({
    potSize: z.number().min(1),
    medium: z.enum(['Soil', 'Coco', 'Hydro']),
    lightHours: z.number().min(0).max(24),
})

export const WaterDataSchema = z.object({
    amount: z.number().min(0),
    ph: z.number().min(0).max(14),
    ec: z.number().min(0).optional(),
})
```

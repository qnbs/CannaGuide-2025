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

*   **Offline First**: Ihr Garten macht keine Pause, wenn Ihre Internetverbindung ausfällt. Die App ist so konzipiert, dass sie **
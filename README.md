<!-- 
This README file supports two languages.
- English version is first.
- Deutsche Version (German version) follows below.
-->

# 🌿 CannaGuide 2025 (English)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/qnbs/CannaGuide-2025)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/qnbs/CannaGuide-2025)
[![Tech Stack](https://img.shields.io/badge/tech-React%2019%20|%20Redux%20|%20Gemini-informational)](https://ai.google.dev/)

**The Definitive AI-Powered Cannabis Cultivation Companion**

CannaGuide 2025 is your definitive AI-powered digital co-pilot for the entire cannabis cultivation lifecycle. Engineered for both novice enthusiasts and master growers, this state-of-the-art **Progressive Web App (PWA)** guides you from seed selection to a perfectly cured harvest. Simulate grows with an advanced VPD-based engine, explore a vast library of 700+ strains with a powerful genealogy tracker, diagnose plant issues with a photo, breed new genetics in the lab, plan equipment with Gemini-powered intelligence, and master your craft with an interactive, data-driven guide.

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
- [🏁 Getting Started (User Guide)](#-getting-started-user-guide)
- [🛠️ Local Development (Developer Guide)](#️-local-development-developer-guide)
- [🤔 Troubleshooting](#-troubleshooting)
- [🤖 Development with AI Studio & Open Source](#-development-with-ai-studio--open-source)
- [🤝 Contributing](#-contributing)
- [⚠️ Disclaimer](#️-disclaimer)
- [Deutsche Version](#-cannaguide-2025-deutsch)

---

## ⭐ Project Philosophy

CannaGuide 2025 is built upon a set of core principles designed to deliver a best-in-class experience:

> **Offline First**: Your garden doesn't stop when your internet does. The app is engineered to be **100% functional offline**. All actions (like logging watering or adding notes) performed while offline are automatically queued and synced in the background via the browser's SyncManager API once your connection is restored. All your data, notes, and AI archives are stored locally and accessible anytime, anywhere.

> **Performance is Key**: A fluid, responsive UI is non-negotiable. Heavy lifting, like the complex, multi-plant simulation, is offloaded to a dedicated **Web Worker**, ensuring the user interface remains smooth and instantaneous at all times.

> **Data Sovereignty**: Your data is yours, period. The ability to **export and import your entire application state** as a single file gives you complete control, ownership, and peace of mind for backups or device migration.

> **AI as a Co-pilot**: We leverage the Google Gemini API not as a gimmick, but as a powerful tool to provide **actionable, context-aware insights**. From diagnosing a sick plant from a photo to generating a custom equipment list, AI serves to genuinely assist the grower at every stage.

---

## 🚀 Key Features

### 1. The Grow Room (`Plants` View)
Your command center for managing and simulating up to three simultaneous grows.

-   **Advanced Simulation Engine**: Experience a state-of-the-art simulation based on **VPD (Vapor Pressure Deficit)**, biomass-scaled resource consumption, and a structural growth model that visually represents your plant's progress.
-   **Simulation Profiles**: Choose between `Beginner`, `Intermediate`, and `Expert` simulation profiles in the settings to adjust complexity and reveal advanced physics parameters.
-   **AI-Powered Diagnostics**:
    -   **Photo Diagnosis**: Upload a photo of your plant to get an instant AI-based diagnosis, complete with immediate actions, long-term solutions, and preventative advice.
    -   **Proactive Advisor**: Get data-driven advice from Gemini AI based on your plant's real-time vitals. All recommendations can be archived with full **CRUD** functionality.
-   **Comprehensive Logging**: Track every action—from watering and feeding to training and pest control—in a detailed, filterable journal for each plant.
-   **Post-Harvest Simulation**: Manage the critical **Drying & Curing** phases with a dedicated interface that tracks humidity, burping schedules, and chemical changes to achieve the perfect final product.

### 2. The Strain Encyclopedia (`Strains` View)
Your central knowledge hub, designed for deep exploration with **offline-first** access.

-   **Vast Library**: Access detailed information on **700+ cannabis strains**.
-   **Interactive Genealogy Tree**: Visualize the complete genetic lineage of any strain. Use analysis tools to **highlight landraces**, trace Sativa/Indica parentage, **calculate the genetic influence** of top ancestors, and **discover known descendants**.
-   **High-Performance Search & Filtering**: Instantly find strains with an IndexedDB-powered full-text search, alphabetical filtering, and an advanced multi-select filter drawer for THC/CBD range, flowering time, aroma, and more.
-   **Personal Strain Collection**: Enjoy full **CRUD (Create, Read, Update, Delete)** functionality to add and manage your own custom strains.
-   **AI Grow Tips**: Generate unique, AI-powered cultivation advice for any strain based on your experience level and goals, complete with a generated image, then manage it in a dedicated "Tips" archive.
-   **Flexible Data Export**: Export your selected or filtered strain lists in multiple formats, including **PDF, CSV, JSON, TXT, and XML**.

### 3. The Workshop (`Equipment` View)
Your toolkit for planning and optimizing your grow setup.

-   **Advanced AI Setup Configurator**: A multi-step process where you define your **plant count, grow space, experience, budget, and priorities** to receive a complete, brand-specific equipment list generated by Gemini AI.
-   **Saved Setups**: Full **CRUD** functionality for your generated equipment lists. Edit, delete, and manage your setups for future use.
-   **Suite of Calculators**: Access a comprehensive set of precision tools:
    -   Ventilation Calculator (m³/h)
    -   Light Calculator (PPFD/DLI & Wattage)
    -   Electricity Cost Calculator
    -   Nutrient Mix Calculator
    -   EC/PPM Converter
    -   Yield Estimator
-   **Curated Shop Lists**: Browse recommended Grow Shops and Seedbanks for both European and US/Canadian markets.

### 4. The Library (`Knowledge` View)
Your complete resource for learning and problem-solving.

-   **Context-Aware AI Mentor**: Ask growing questions to the AI Mentor, which leverages your active plant's data for tailored advice. All conversations are archived with full **CRUD** support.
-   **Breeding Lab**: Cross your high-quality collected seeds to create entirely new, **permanent hybrid strains** that are added to your personal library and can be used in future grows.
-   **Interactive Sandbox**: Run "what-if" scenarios, like comparing **Topping vs. LST** on a clone of your plant, to visualize the impact of different training techniques over an accelerated simulation without risking your real plants.

### 5. The Help Desk (`Help` View)
Your go-to for in-app support and learning resources.

-   **Comprehensive User Manual**: A detailed, built-in guide explaining every feature of the app.
-   **Searchable FAQ**: Quickly find answers to common cultivation questions.
-   **Grower's Lexicon**: An extensive glossary of cannabis terms, from cannabinoids and terpenes to advanced growing techniques.
-   **Visual Guides**: Simple, animated guides for core techniques like Topping and LST.

### 6. The Command Center (`Settings` View)
A sophisticated hub to customize every aspect of your CannaGuide experience.

-   **UI & Theme Customization**: Choose from multiple themes (`Midnight`, `Forest`, etc.), adjust font sizes, and switch between `Comfortable` and `Compact` UI densities.
-   **Accessibility Suite**: Activate a **Dyslexia-Friendly Font**, **Reduced Motion** mode, and various **Colorblind Modes** (Protanopia, Deuteranopia, Tritanopia).
-   **Voice & Speech**: Configure Text-to-Speech (TTS) voices and rates, and manage voice command settings.
-   **Data Sovereignty**: Export your entire app state for **backup**, import it to **restore**, or perform granular resets like clearing AI archives or plant data. View a breakdown of your storage usage.
-   **Privacy & Security**: Secure your app with an optional 4-digit **PIN on launch** and configure automatic clearing of AI chat history on exit.

### 7. Platform-Wide Features
-   **Full PWA & Offline Capability**: Install the app on your device for a native-like experience. The robust Service Worker ensures **100% offline functionality**, including access to all data and AI archives.
-   **Command Palette (`Cmd/Ctrl + K`)**: A power-user tool for instant, click-free navigation and actions across the entire application.
-   **Voice Control**: Navigate the app, search for strains, and perform actions using simple voice commands.

---

## 💻 Technical Deep Dive

CannaGuide 2025 is built on a modern, robust, and scalable tech stack designed for performance and offline-first reliability.

### Key Technologies

| Category             | Technology                                                                                                    | Purpose                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Frontend**         | [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)                             | Modern, type-safe, and performant user interface.                                      |
| **State Management** | [Redux Toolkit](https://redux-toolkit.js.org/)                                                                | Centralized, predictable state management for the entire application.                  |
| **AI Integration**   | [Google Gemini API](https://ai.google.dev/gemini-api/docs) (`@google/genai`)                                  | Powers all AI features, including diagnostics, advice, and content generation.         |
| **Async Operations** | [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)                                                  | Manages all interactions with the Gemini API, providing caching and state management.    |
| **Concurrency**      | [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)                               | Runs the complex plant simulation off the main thread to ensure a smooth UI.           |
| **Data Persistence** | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)                                   | Provides a robust, client-side database for full offline functionality.                |
| **PWA & Offline**    | [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)                        | Implements a "Cache First, then Network" strategy for offline access.                  |
| **Styling**          | [Tailwind CSS](https://tailwindcss.com/) (via CDN)                                                            | Enables a rapid, utility-first approach to building a consistent and responsive design.  |

### Gemini Service Abstraction (`geminiService.ts`)

As noted in the [project's DeepWiki](https://deepwiki.com/qnbs/CannaGuide-2025), the `geminiService.ts` file is a critical component that acts as a central abstraction layer for all communication with the Google Gemini API. This design decouples the API logic from the UI components and the Redux state management layer (RTK Query), making the code cleaner, more maintainable, and easier to test.

All AI-powered features in the application route their requests through this service. RTK Query hooks (e.g., `useGetPlantAdviceMutation`) are configured to use a `queryFn` that calls the corresponding method in `geminiService`.

**Key Responsibilities & Methods:**

*   **Initialization**: The service initializes a single `GoogleGenAI` instance, ensuring the API key is handled in one central location.
*   **Context & Localization**: It uses helper functions (`formatPlantContextForPrompt`, `createLocalizedPrompt`) to automatically format real-time plant data into a consistent context report and prepend the correct language instruction (`"IMPORTANT: Your entire response must be exclusively in English..."`) to every prompt sent to the API. This ensures all AI responses are tailored and correctly localized.
*   **Structured JSON Output**: For features requiring structured data, the service leverages Gemini's JSON mode.
    *   `getEquipmentRecommendation`, `diagnosePlant`, `getMentorResponse`, `getStrainTips`, `generateDeepDive`: These methods pass a `responseSchema` in the request configuration. This forces the model to return a valid JSON object that matches the defined TypeScript types (e.g., `Recommendation`, `PlantDiagnosisResponse`), eliminating the need for fragile string parsing on the client side.
*   **Multimodal Input (Vision)**:
    *   `diagnosePlant`: This method demonstrates multimodal capabilities by accepting a Base64-encoded image and combining it with the text-based context report into a multipart request. The `gemini-2.5-flash` model then analyzes both the image and the data to provide a diagnosis.
*   **Image Generation**:
    *   `generateStrainImage`: This method uses the specialized `gemini-2.5-flash-image` model and configures `responseModalities: [Modality.IMAGE]` to generate a unique, artistic image for a given strain, which is then used in the AI Grow Tips feature.
*   **Model Selection**: The service intelligently selects the appropriate model for the task. It uses the cost-effective and fast `gemini-2.5-flash` for most text and vision tasks, but switches to the more powerful `gemini-2.5-pro` for the complex `generateDeepDive` feature, which requires more advanced reasoning.
*   **Error Handling**: Each method includes `try...catch` blocks that wrap the API call. On failure, it logs the error and throws a new, user-friendly error message (using keys from the translation files, e.g., `'ai.error.diagnostics'`), which RTK Query then provides to the UI for graceful display.

### Project Structure
The codebase is organized into logical directories to promote maintainability and scalability:
-   `components/`: Contains all React components, organized by view or commonality.
-   `stores/`: Home to the Redux store, slices, selectors, and middleware.
-   `services/`: Houses business logic, including the simulation engine, database interactions, and API service wrappers.
-   `hooks/`: Contains custom React hooks for shared logic like focus traps, PWA installation, and more.
-   `data/`: Stores static data, such as the strain library, lexicon, and FAQ content.
-   `locales/`: Contains all internationalization (i18n) translation files.

---

## 🏁 Getting Started (User Guide)

No installation is required beyond a modern web browser.

1.  **Onboarding**: On first launch, you'll be guided through a quick tutorial to set your preferred language.
2.  **Discover Strains**: Start in the **Strains** view. Use the search and filters to find a strain and save it as a favorite by clicking the heart icon.
3.  **Start Growing**: Navigate to the **Plants** dashboard. From an empty slot, click "Start New Grow," select a strain, and configure your setup.
4.  **Manage Your Grow**: The **Plants** dashboard is your command center. Log actions like watering and feeding, check on your plant's vitals, and get advice from the AI.
5.  **Use the Command Palette**: For the fastest access, press `Cmd/Ctrl + K` to navigate or perform actions instantly.

---

## 🛠️ Local Development (Developer Guide)

This project is designed to run within Google's AI Studio, which handles the development server and environment variables. However, you can run it locally with a standard Node.js setup.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) (usually included with Node.js)
*   A **Google Gemini API Key**. You can obtain one from [Google AI Studio](https://ai.studio.google.com/app/apikey).

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

3.  **Set up environment variables:**
    The application requires a Google Gemini API key. Create a `.env` file in the root of the project:
    ```bash
    touch .env
    ```
    Open the `.env` file and add your API key:
    ```
    VITE_API_KEY=YOUR_GEMINI_API_KEY
    ```
    > **Note**: The app uses Vite, which exposes `VITE_` prefixed variables to the client. The application code will need to access it as `import.meta.env.VITE_API_KEY`. (This has been abstracted to `process.env.API_KEY` for compatibility with AI Studio).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically at `http://localhost:5173`.

---

## 🤔 Troubleshooting

*   **AI Features Not Working**: This is almost always due to a missing or invalid Gemini API key. Ensure your environment variable (`VITE_API_KEY` for local dev) is correctly set up and the key is valid. Check your browser's developer console for any `4xx` errors related to the Google API.
*   **App Not Updating (PWA Caching)**: If you've made changes but don't see them, the Service Worker might be serving a cached version.
    1.  Open your browser's developer tools.
    2.  Go to the `Application` tab.
    3.  Find `Service Workers`, check "Update on reload", and click "Unregister".
    4.  Go to `Storage`, click "Clear site data".
    5.  Refresh the page.
*   **Data Corruption**: If the application state becomes corrupted, you can perform a hard reset by navigating to `Settings > Data Management > Reset All App Data`. **Warning: This will delete all your local data.**

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

## ⚠️ Disclaimer

> All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.

---
---

# 🌿 CannaGuide 2025 (Deutsch)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/qnbs/CannaGuide-2025)

[![Lizenz: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build-Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/qnbs/CannaGuide-2025)
[![Tech-Stack](https://img.shields.io/badge/tech-React%2019%20|%20Redux%20|%20Gemini-informational)](https://ai.google.dev/)

**Der definitive KI-gestützte Cannabis-Anbau-Begleiter**

CannaGuide 2025 ist Ihr digitaler Co-Pilot für den gesamten Lebenszyklus des Cannabisanbaus. Entwickelt für sowohl neugierige Einsteiger als auch für erfahrene Meisterzüchter, führt Sie diese hochmoderne **Progressive Web App (PWA)** von der Samenauswahl bis zur perfekt ausgehärteten Ernte. Simulieren Sie Anbauvorgänge mit einer fortschrittlichen VPD-basierten Engine, erkunden Sie eine Bibliothek mit 700+ Sorten mit einem leistungsstarken Genealogie-Tracker, diagnostizieren Sie Pflanzenprobleme per Foto, züchten Sie neue Genetiken im Labor, planen Sie Ihre Ausrüstung mit Gemini-gestützter Intelligenz und meistern Sie Ihr Handwerk mit einem interaktiven, datengesteuerten Leitfaden.

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
- [🏁 Erste Schritte (Benutzerhandbuch)](#-erste-schritte-benutzerhandbuch)
- [🛠️ Lokale Entwicklung (Entwicklerhandbuch)](#️-lokale-entwicklung-entwicklerhandbuch)
- [🤔 Fehlerbehebung (Troubleshooting)](#-fehlerbehebung-troubleshooting)
- [🤖 Entwicklung mit AI Studio & Open Source](#-entwicklung-mit-ai-studio--open-source-1)
- [🤝 Mitwirken (Contributing)](#-mitwirken-contributing-1)
- [⚠️ Haftungsausschluss](#️-haftungsausschluss-1)

---

## ⭐ Projektphilosophie

CannaGuide 2025 basiert auf einer Reihe von Kernprinzipien, die darauf ausgelegt sind, ein erstklassiges Erlebnis zu bieten:

> **Offline First**: Ihr Garten macht keine Pause, wenn Ihre Internetverbindung ausfällt. Die App ist so konzipiert, dass sie **100% offline funktionsfähig** ist. Alle Aktionen (wie das Protokollieren von Gießvorgängen oder das Hinzufügen von Notizen), die offline durchgeführt werden, werden automatisch in eine Warteschlange gestellt und im Hintergrund über die SyncManager-API des Browsers synchronisiert, sobald Ihre Verbindung wiederhergestellt ist. Alle Ihre Daten, Notizen und KI-Archive sind lokal gespeichert und jederzeit und überall zugänglich.

> **Leistung ist entscheidend**: Eine flüssige, reaktionsschnelle Benutzeroberfläche ist unerlässlich. Rechenintensive Aufgaben, wie die komplexe Pflanzensimulation, werden in einen **Web Worker** ausgelagert, um die Hauptoberfläche geschmeidig und reaktionsschnell zu halten.

> **Datensouveränität**: Ihre Daten gehören Ihnen. Die Möglichkeit, Ihren **gesamten Anwendungszustand zu exportieren und zu importieren**, gibt Ihnen vollständige Kontrolle, Eigentum und Sicherheit.

> **KI als Co-Pilot**: Wir nutzen KI nicht als Gimmick, sondern als leistungsstarkes Werkzeug, um **umsetzbare, kontextbezogene Einblicke** zu liefern, die den Züchter in jeder Phase wirklich unterstützen.

---

## 🚀 Hauptfunktionen

### 1. Der Grow Room (`Pflanzen`-Ansicht)
Ihre Kommandozentrale zur Verwaltung und Simulation von bis zu drei gleichzeitigen Anbauprojekten.

-   **Hochentwickelte Simulations-Engine**: Erleben Sie eine Simulation, die auf **VPD (Dampfdruckdefizit)**, biomasse-skaliertem Ressourcenverbrauch und einem strukturellen Wachstumsmodell basiert.
-   **Simulationsprofile**: Wählen Sie in den Einstellungen zwischen den Simulationsprofilen `Anfänger`, `Fortgeschritten` und `Experte`, um die Komplexität anzupassen und erweiterte Physik-Parameter anzuzeigen.
-   **KI-gestützte Diagnose**:
    -   **Foto-Diagnose**: Laden Sie ein Foto Ihrer Pflanze hoch, um eine sofortige KI-basierte Diagnose zu erhalten, komplett mit Sofortmaßnahmen, langfristigen Lösungen und präventiven Ratschlägen.
    -   **Proaktiver Berater**: Erhalten Sie datengesteuerte Ratschläge von Gemini AI basierend auf den Echtzeit-Vitalwerten Ihrer Pflanze. Alle Empfehlungen können mit voller **CRUD**-Funktionalität archiviert werden.
-   **Umfassendes Protokoll**: Verfolgen Sie jede Aktion – von der Bewässerung über die Düngung bis hin zum Training und zur Schädlingsbekämpfung – in einem detaillierten, filterbaren Journal für jede Pflanze.
-   **Nach-Ernte-Simulation**: Managen Sie die kritischen Phasen des **Trocknens & Fermentierens (Curing)** mit einer dedizierten Oberfläche, die Feuchtigkeit, Lüftungspläne und chemische Veränderungen verfolgt, um das perfekte Endprodukt zu erzielen.

### 2. Die Sorten-Enzyklopädie (`Sorten`-Ansicht)
Ihr zentraler Wissens-Hub, konzipiert für tiefgehende Erkundungen mit **Offline-First**-Zugriff.

-   **Riesige Bibliothek**: Greifen Sie auf detaillierte Informationen zu **700+ Cannabissorten** zu.
-   **Interaktiver Stammbaum**: Visualisieren Sie die vollständige genetische Abstammung jeder Sorte. Nutzen Sie Analysewerkzeuge, um **Landrassen hervorzuheben**, Sativa/Indica-Linien zu verfolgen, den **genetischen Einfluss** der Top-Vorfahren zu berechnen und **bekannte Nachkommen zu entdecken**.
-   **Hochleistungs-Suche & -Filter**: Finden Sie sofort Sorten mit einer IndexedDB-gestützten Volltextsuche, alphabetischer Filterung und einem erweiterten Mehrfachauswahl-Filtermenü für THC/CBD-Bereich, Blütezeit, Aroma und mehr.
-   **Persönliche Sortensammlung**: Genießen Sie volle **CRUD (Erstellen, Lesen, Aktualisieren, Löschen)**-Funktionalität, um Ihre eigenen benutzerdefinierten Sorten hinzuzufügen und zu verwalten.
-   **KI-Anbau-Tipps**: Generieren Sie einzigartige, KI-gestützte Anbauratschläge für jede Sorte basierend auf Ihrem Erfahrungslevel und Ihren Zielen, komplett mit einem generierten Bild, und verwalten Sie diese in einem dedizierten "Tipps"-Archiv.
-   **Flexible Datenexport**: Exportieren Sie Ihre ausgewählten oder gefilterten Sortenlisten in mehreren Formaten, einschließlich **PDF, CSV, JSON, TXT und XML**.

### 3. Die Werkstatt (`Ausrüstung`-Ansicht)
Ihr Werkzeugkasten für die Planung und Optimierung Ihres Anbau-Setups.

-   **Fortschrittlicher KI-Setup-Konfigurator**: Ein mehrstufiger Prozess, in dem Sie Ihre **Pflanzenanzahl, Anbaufläche, Erfahrung, Budget und Prioritäten** definieren, um eine vollständige, markenspezifische Ausrüstungsliste von der Gemini-KI zu erhalten.
-   **Gespeicherte Setups**: Volle **CRUD**-Funktionalität für Ihre generierten Ausrüstungslisten. Bearbeiten, löschen und verwalten Sie Ihre Setups für die zukünftige Verwendung.
-   **Suite von Rechnern**: Greifen Sie auf eine umfassende Sammlung von Präzisionswerkzeugen zu:
    -   Lüftungsrechner (m³/h)
    -   Beleuchtungsrechner (PPFD/DLI & Wattzahl)
    -   Stromkostenrechner
    -   Nährstoff-Mischrechner
    -   EC/PPM-Umrechner
    -   Ertragsschätzer
-   **Kuratierte Shop-Listen**: Durchsuchen Sie empfohlene Grow Shops und Anbieter von Saatgut für den europäischen und den US/kanadischen Markt.

### 4. Die Bibliothek (`Wissen`-Ansicht)
Ihre vollständige Ressource zum Lernen und zur Problemlösung.

-   **Kontextsensitiver KI-Mentor**: Stellen Sie dem KI-Mentor Anbaufragen, der die Daten Ihrer aktiven Pflanze für maßgeschneiderte Ratschläge nutzt. Alle Gespräche werden mit voller **CRUD**-Unterstützung archiviert.
-   **Zuchtlabor**: Kreuzen Sie Ihre hochwertigsten Samen, um völlig neue, **permanente Hybridsorten** zu erschaffen, die Ihrer persönlichen Bibliothek hinzugefügt und in zukünftigen Anbauprojekten verwendet werden können.
-   **Interaktive Sandbox**: Führen Sie risikofreie "Was-wäre-wenn"-Szenarien durch, wie z. B. den Vergleich von **Topping vs. LST** an einem Klon Ihrer Pflanze, um die Auswirkungen verschiedener Trainingstechniken über eine beschleunigte Simulation zu visualisieren.

### 5. Das Hilfe-Center (`Hilfe`-Ansicht)
Ihre Anlaufstelle für In-App-Support und Lernressourcen.

-   **Umfassendes Benutzerhandbuch**: Ein detaillierter, integrierter Leitfaden, der jede Funktion der App erklärt.
-   **Durchsuchbare FAQ**: Finden Sie schnell Antworten auf häufige Anbaufragen.
-   **Grower-Lexikon**: Ein umfangreiches Glossar von Cannabis-Begriffen, von Cannabinoiden und Terpenen bis hin zu fortgeschrittenen Anbautechniken.
-   **Visuelle Anleitungen**: Einfache, animierte Anleitungen für grundlegende Techniken wie Topping und LST.

### 6. Die Kommandozentrale (`Einstellungen`-Ansicht)
Ein hochentwickelter Hub zur Anpassung jedes Aspekts Ihres CannaGuide-Erlebnisses.

-   **UI & Theme-Anpassung**: Wählen Sie aus mehreren Themes (`Mitternacht`, `Wald` usw.), passen Sie die Schriftgrößen an und wechseln Sie zwischen `Komfortabler` und `Kompakter` UI-Dichte.
-   **Barrierefreiheit-Suite**: Aktivieren Sie eine **Legastheniker-freundliche Schriftart**, einen **Modus mit reduzierter Bewegung** und verschiedene **Farbfehlsichtigkeits-Modi** (Protanopie, Deuteranopie, Tritanopie).
-   **Sprache & Sprachausgabe**: Konfigurieren Sie Text-zu-Sprache (TTS)-Stimmen und -Raten und verwalten Sie die Einstellungen für Sprachbefehle.
-   **Datensouveränität**: Exportieren Sie Ihren gesamten App-Zustand zur **Sicherung**, importieren Sie ihn zur **Wiederherstellung** oder führen Sie granulare Resets durch, wie das Leeren von KI-Archiven oder Pflanzendaten. Sehen Sie eine Aufschlüsselung Ihrer Speichernutzung.
-   **Privatsphäre & Sicherheit**: Sichern Sie Ihre App mit einer optionalen 4-stelligen **PIN beim Start** und konfigurieren Sie das automatische Leeren des KI-Chatverlaufs beim Beenden.

### 7. Plattformweite Funktionen
-   **Volle PWA- & Offline-Fähigkeit**: Installieren Sie die App auf Ihrem Gerät für ein natives Erlebnis. Der robuste Service Worker gewährleistet **100% Offline-Funktionalität**, einschließlich Zugriff auf alle Daten und KI-Archive.
-   **Befehlspalette (`Cmd/Ctrl + K`)**: Ein Power-User-Tool für sofortige, klickfreie Navigation und Aktionen in der gesamten Anwendung.
-   **Sprachsteuerung**: Navigieren Sie durch die App, suchen Sie nach Sorten und führen Sie Aktionen mit einfachen Sprachbefehlen aus.

---

## 💻 Technischer Deep Dive

CannaGuide 2025 basiert auf einem modernen, robusten und skalierbaren Tech-Stack, der auf Leistung und Offline-First-Zuverlässigkeit ausgelegt ist.

### Schlüsseltechnologien

| Kategorie             | Technologie                                                                                                    | Zweck                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Frontend**          | [React 19](https://react.dev/) mit [TypeScript](https://www.typescriptlang.org/)                              | Modernes, typsicheres und performantes Benutzerinterface.                               |
| **Zustandsverwaltung**| [Redux Toolkit](https://redux-toolkit.js.org/)                                                                 | Zentralisierte, vorhersagbare Zustandsverwaltung für die gesamte Anwendung.             |
| **KI-Integration**    | [Google Gemini API](https://ai.google.dev/gemini-api/docs) (`@google/genai`)                                   | Treibt alle KI-Funktionen an, einschließlich Diagnose, Beratung und Content-Erstellung. |
| **Asynchrone Op.**    | [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)                                                   | Verwaltet alle Interaktionen mit der Gemini API, bietet Caching und Zustandsmanagement. |
| **Nebenläufigkeit**   | [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)                                | Führt die komplexe Pflanzensimulation außerhalb des Haupt-Threads aus, um die UI flüssig zu halten. |
| **Datenpersistenz**   | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)                                    | Bietet eine robuste, clientseitige Datenbank für volle Offline-Funktionalität.          |
| **PWA & Offline**     | [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)                         | Implementiert eine "Cache First, then Network"-Strategie für Offline-Zugriff.           |
| **Styling**           | [Tailwind CSS](https://tailwindcss.com/) (via CDN)                                                             | Ermöglicht einen schnellen, Utility-First-Ansatz für ein konsistentes Designsystem.     |

### Gemini-Service-Abstraktion (`geminiService.ts`)

Wie im [DeepWiki des Projekts](https://deepwiki.com/qnbs/CannaGuide-2025) erwähnt, ist die Datei `geminiService.ts` eine entscheidende Komponente, die als zentrale Abstraktionsschicht für die gesamte Kommunikation mit der Google Gemini API fungiert. Dieses Design entkoppelt die API-Logik von den UI-Komponenten und der Redux-Zustandsverwaltung (RTK Query), was den Code sauberer, wartbarer und einfacher testbar macht.

Alle KI-gestützten Funktionen in der Anwendung leiten ihre Anfragen über diesen Dienst. RTK Query-Hooks (z. B. `useGetPlantAdviceMutation`) sind so konfiguriert, dass sie eine `queryFn` verwenden, die die entsprechende Methode im `geminiService` aufruft.

**Hauptverantwortlichkeiten & Methoden:**

*   **Initialisierung**: Der Dienst initialisiert eine einzige `GoogleGenAI`-Instanz und stellt sicher, dass der API-Schlüssel an einem zentralen Ort gehandhabt wird.
*   **Kontext & Lokalisierung**: Er verwendet Hilfsfunktionen (`formatPlantContextForPrompt`, `createLocalizedPrompt`), um Echtzeit-Pflanzendaten automatisch in einen konsistenten Kontextbericht zu formatieren und jeder an die API gesendeten Anfrage die korrekte Sprachanweisung (`"WICHTIG: Deine gesamte Antwort muss ausschließlich auf Deutsch sein..."`) voranzustellen. Dies stellt sicher, dass alle KI-Antworten maßgeschneidert und korrekt lokalisiert sind.
*   **Strukturierte JSON-Ausgabe**: Für Funktionen, die strukturierte Daten erfordern, nutzt der Dienst den JSON-Modus von Gemini.
    *   `getEquipmentRecommendation`, `diagnosePlant`, `getMentorResponse`, `getStrainTips`, `generateDeepDive`: Diese Methoden übergeben ein `responseSchema` in der Anfragekonfiguration. Dies zwingt das Modell, ein gültiges JSON-Objekt zurückzugeben, das den definierten TypeScript-Typen entspricht (z. B. `Recommendation`, `PlantDiagnosisResponse`), wodurch ein fehleranfälliges Parsen von Zeichenketten auf der Client-Seite vermieden wird.
*   **Multimodale Eingabe (Vision)**:
    *   `diagnosePlant`: Diese Methode demonstriert multimodale Fähigkeiten, indem sie ein Base64-kodiertes Bild akzeptiert und es mit dem textbasierten Kontextbericht zu einer mehrteiligen Anfrage kombiniert. Das `gemini-2.5-flash`-Modell analysiert dann sowohl das Bild als auch die Daten, um eine Diagnose zu stellen.
*   **Bilderzeugung**:
    *   `generateStrainImage`: Diese Methode verwendet das spezialisierte `gemini-2.5-flash-image`-Modell und konfiguriert `responseModalities: [Modality.IMAGE]`, um ein einzigartiges, künstlerisches Bild für eine bestimmte Sorte zu generieren, das dann in der Funktion "KI-Anbau-Tipps" verwendet wird.
*   **Modellauswahl**: Der Dienst wählt intelligent das passende Modell für die jeweilige Aufgabe aus. Er verwendet das kostengünstige und schnelle `gemini-2.5-flash` für die meisten Text- und Bildanalyseaufgaben, wechselt aber zum leistungsfähigeren `gemini-2.5-pro` für die komplexe `generateDeepDive`-Funktion, die fortgeschrittenere Schlussfolgerungen erfordert.
*   **Fehlerbehandlung**: Jede Methode enthält `try...catch`-Blöcke, die den API-Aufruf umschließen. Bei einem Fehler wird der Fehler protokolliert und eine neue, benutzerfreundliche Fehlermeldung (unter Verwendung von Schlüsseln aus den Übersetzungsdateien, z. B. `'ai.error.diagnostics'`) geworfen, die RTK Query dann der Benutzeroberfläche zur anmutigen Anzeige zur Verfügung stellt.

### Projektstruktur
Die Codebasis ist in logische Verzeichnisse organisiert, um Wartbarkeit und Skalierbarkeit zu fördern:
-   `components/`: Enthält alle React-Komponenten, organisiert nach Ansicht oder Gemeinsamkeit.
-   `stores/`: Beherbergt den Redux-Store, Slices, Selektoren und Middleware.
-   `services/`: Enthält die Geschäftslogik, einschließlich der Simulations-Engine, Datenbankinteraktionen und API-Service-Wrapper.
-   `hooks/`: Enthält benutzerdefinierte React-Hooks für gemeinsam genutzte Logik wie Focus Traps, PWA-Installation und mehr.
-   `data/`: Speichert statische Daten wie die Sortenbibliothek, das Lexikon und FAQ-Inhalte.
-   `locales/`: Enthält alle Internationalisierungs- (i18n) Übersetzungsdateien.

---

## 🏁 Erste Schritte (Benutzerhandbuch)

Außer einem modernen Webbrowser ist keine Installation erforderlich.

1.  **Onboarding**: Beim ersten Start werden Sie durch ein kurzes Tutorial geführt, um Ihre bevorzugte Sprache einzustellen.
2.  **Sorten entdecken**: Beginnen Sie in der **Sorten**-Ansicht. Nutzen Sie die Suche und die Filter, um eine Sorte zu finden, und speichern Sie sie als Favorit, indem Sie auf das Herzsymbol klicken.
3.  **Anbau starten**: Navigieren Sie zum **Pflanzen**-Dashboard. Klicken Sie auf einen leeren Steckplatz, wählen Sie "Neuen Anbau starten", wählen Sie eine Sorte aus und konfigurieren Sie Ihr Setup.
4.  **Ihren Anbau verwalten**: Das **Pflanzen**-Dashboard ist Ihre Kommandozentrale. Protokollieren Sie Aktionen wie Gießen und Düngen, überprüfen Sie die Vitalwerte Ihrer Pflanze und holen Sie sich Ratschläge von der KI.
5.  **Befehlspalette verwenden**: Drücken Sie für den schnellsten Zugriff `Cmd/Ctrl + K`, um sofort zu navigieren oder Aktionen auszuführen.

---

## 🛠️ Lokale Entwicklung (Entwicklerhandbuch)

Dieses Projekt ist für die Ausführung im Google AI Studio konzipiert, das den Entwicklungsserver und die Umgebungsvariablen bereitstellt. Sie können es jedoch auch lokal mit einem Standard-Node.js-Setup ausführen.

### Voraussetzungen
*   [Node.js](https://nodejs.org/) (v18.x oder neuer empfohlen)
*   [npm](https://www.npmjs.com/) (normalerweise bei Node.js enthalten)
*   Ein **Google Gemini API Key**. Diesen erhalten Sie im [Google AI Studio](https://ai.studio.google.com/app/apikey).

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

3.  **Umgebungsvariablen einrichten:**
    Die Anwendung benötigt einen Google Gemini API-Schlüssel. Erstellen Sie eine `.env`-Datei im Stammverzeichnis des Projekts:
    ```bash
    touch .env
    ```
    Öffnen Sie die `.env`-Datei und fügen Sie Ihren API-Schlüssel hinzu:
    ```
    VITE_API_KEY=DEIN_GEMINI_API_SCHLÜSSEL
    ```
    > **Hinweis**: Die App verwendet Vite, das `VITE_`-präfixierte Variablen für den Client verfügbar macht. Der Anwendungscode greift darauf über `import.meta.env.VITE_API_KEY` zu (für die Kompatibilität mit AI Studio auf `process.env.API_KEY` abstrahiert).

4.  **Entwicklungsserver starten:**
    ```bash
    npm run dev
    ```
    Dies startet den Vite-Entwicklungsserver, typischerweise unter `http://localhost:5173`.

---

## 🤔 Fehlerbehebung (Troubleshooting)

*   **KI-Funktionen funktionieren nicht**: Dies liegt fast immer an einem fehlenden oder ungültigen Gemini API-Schlüssel. Stellen Sie sicher, dass Ihre Umgebungsvariable (`VITE_API_KEY` für lokale Entwicklung) korrekt eingerichtet ist. Überprüfen Sie die Entwicklerkonsole Ihres Browsers auf `4xx`-Fehler.
*   **App aktualisiert sich nicht (PWA-Caching)**: Wenn Sie Änderungen vorgenommen haben, diese aber nicht sehen, könnte der Service Worker eine zwischengespeicherte Version ausliefern.
    1.  Öffnen Sie die Entwicklertools Ihres Browsers.
    2.  Gehen Sie zum Tab `Anwendung` (Application).
    3.  Suchen Sie `Service Workers`, aktivieren Sie "Update on reload" und klicken Sie auf "Unregister".
    4.  Gehen Sie zu `Speicher` (Storage) und klicken Sie auf "Site data löschen".
    5.  Aktualisieren Sie die Seite.
*   **Datenprobleme**: Sollte der Zustand der Anwendung beschädigt werden, können Sie einen Hard-Reset durchführen, indem Sie zu `Einstellungen > Datenverwaltung > Alle App-Daten zurücksetzen` navigieren. **Achtung: Dies löscht alle Ihre lokalen Daten.**

---

## 🤖 Entwicklung mit AI Studio & Open Source

Diese Anwendung wurde vollständig mit **Googles AI Studio** entwickelt. Der gesamte Prozess, vom anfänglichen Projekt-Setup bis zur Implementierung komplexer Funktionen wie der Redux-Zustandsverwaltung und der Web-Worker-Simulation, wurde durch iterative Anweisungen in natürlicher Sprache gesteuert.

Dieses Projekt ist zudem vollständig Open Source. Tauchen Sie in den Code ein, forken Sie das Projekt oder tragen Sie auf GitHub bei. Erleben Sie aus erster Hand, wie natürliche Sprache anspruchsvolle Anwendungen erstellen kann.

*   **Projekt in AI Studio forken:** [https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-](https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-)
*   **Quellcode auf GitHub ansehen:** [https://github.com/qnbs/CannaGuide-2025](https://github.com/qnbs/CannaGuide-2025)

---

## 🤝 Mitwirken (Contributing)

Wir freuen uns über Beiträge aus der Community! Ob Sie einen Fehler beheben, eine neue Funktion hinzufügen oder Übersetzungen verbessern möchten, Ihre Hilfe ist willkommen.

1.  **Probleme melden**: Wenn Sie einen Fehler finden oder eine Idee haben, [eröffnen Sie bitte zuerst ein Issue](https://github.com/qnbs/CannaGuide-2025/issues) auf GitHub, um es zu besprechen.
2.  **Änderungen vornehmen**:
    *   Forken Sie das Repository.
    *   Erstellen Sie einen neuen Branch für Ihr Feature oder Ihren Bugfix (`git checkout -b feature/mein-neues-feature`).
    *   Committen Sie Ihre Änderungen (`git commit -am 'Füge ein Feature hinzu'`).
    *   Pushen Sie den Branch (`git push origin feature/mein-neues-feature`).
    *   Erstellen Sie einen neuen Pull Request.

Bitte halten Sie sich an den bestehenden Codestil und stellen Sie sicher, dass Ihre Änderungen gut dokumentiert sind.

---

## ⚠️ Haftungsausschluss

> Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und im Einklang mit dem Gesetz.

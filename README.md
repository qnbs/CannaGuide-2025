<!-- 
This README file supports two languages.
- English version is first.
- Deutsche Version (German version) follows below.
-->

# 🌿 CannaGuide 2025 (English)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/qnbs/CannaGuide-2025)
[![Tech Stack](https://img.shields.io/badge/tech-React%20|%20Redux%20|%20Gemini-informational)](https://ai.google.dev/)

**The Definitive AI-Powered Cannabis Cultivation Companion**

CannaGuide 2025 is your definitive AI-powered digital co-pilot for the entire cannabis cultivation lifecycle. Engineered for both novice enthusiasts and master growers, this state-of-the-art **Progressive Web App (PWA)** guides you from seed selection to a perfectly cured harvest. Simulate grows with an advanced VPD-based engine, explore a vast library of over 480 strains, diagnose plant issues with a photo, plan equipment with Gemini-powered intelligence, and master your craft with an interactive, data-driven guide.

---

## Table of Contents

- [⭐ Project Philosophy](#-project-philosophy)
- [🚀 Key Features](#-key-features)
- [💻 Technical Deep Dive](#-technical-deep-dive)
- [🏁 Getting Started (User Guide)](#-getting-started-user-guide)
- [🛠️ Installation & Local Development (Developer Guide)](#️-installation--local-development-developer-guide)
- [🤔 Troubleshooting](#-troubleshooting)
- [🔒 Security](#-security)
- [🤖 Development with AI Studio & Open Source](#-development-with-ai-studio--open-source)
- [🤝 Contributing](#-contributing)
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

*   **Dynamic Simulation Engine**: Experience a state-of-the-art simulation based on **VPD (Vapor Pressure Deficit)**, biomass-scaled resource consumption, and a structural growth model.
*   **AI-Powered Diagnostics**: Upload a photo of your plant to get an instant AI-based diagnosis, complete with immediate actions, long-term solutions, and preventative advice.
*   **AI Plant Advisor**: Get proactive, data-driven advice from Gemini AI based on your plant's real-time vitals. All recommendations can be archived with full **CRUD** functionality.
*   **Comprehensive Logging**: Track every action—from watering and feeding to training and pest control—in a detailed, filterable journal for each plant.
*   **Dynamic Task & Problem Generation**: The simulation engine automatically creates tasks (e.g., "Water Plant") and flags problems (e.g., "Nutrient Deficiency") based on the plant's evolving condition.

### 2. The Strain Encyclopedia (`Strains` View)
Your central knowledge hub, designed for deep exploration with **offline-first** access.

*   **Vast Library**: Access detailed information on **over 480 cannabis strains**.
*   **Interactive Genealogy Tree**: Visualize the complete genetic lineage of any strain in an interactive D3.js-powered tree diagram.
*   **High-Performance Search & Filtering**: Instantly find strains with an IndexedDB-powered full-text search and advanced multi-select filters for THC/CBD range, flowering time, aroma, and more.
*   **Personal Strain Collection**: Enjoy full **CRUD (Create, Read, Update, Delete)** functionality to add and manage your own custom strains.
*   **AI Grow Tips**: Generate unique, AI-powered cultivation advice for any strain based on your experience level and goals, then manage it in a dedicated "Tips" archive.
*   **Flexible Data Export**: Export your selected or filtered strain lists in multiple formats, including **PDF, CSV, JSON, TXT, and XML**.

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
*   **State Management**: **Redux Toolkit (^2.2)** serves as the single source of truth for the entire application state. This centralized approach ensures predictable state transitions, simplifies debugging, and makes state persistence straightforward.
*   **AI Integration**: **Google Gemini API (`@google/genai` ^1.19)** powers all intelligent features, using the `gemini-2.5-flash` model for its optimal balance of speed, cost, and its powerful ability to deliver structured JSON output.
*   **Asynchronous Operations**:
    *   **RTK Query** manages all interactions with the Gemini API, providing caching, automatic re-fetching, and streamlined loading/error state management.
    *   The plant growth simulation runs in a **Web Worker (`simulation.worker.ts`)**, ensuring the main UI thread remains responsive and smooth, even during intensive background calculations.
*   **Data Persistence**: A robust **IndexedDB** strategy ensures data integrity and offline availability.
    *   The entire Redux state is persisted to a dedicated IndexedDB database via a **listener middleware**, providing seamless state hydration on app startup.
    *   A separate IndexedDB database (`dbService.ts`) manages large static assets, like the strain library, user-uploaded images, and the full-text search index, for optimal performance.
*   **PWA & Offline Capability**: A **Service Worker (`sw.js`)** implements a "Cache First, then Network" strategy, making the application fully installable and functional without an internet connection.
*   **Styling**: **Tailwind CSS** enables a rapid, utility-first approach to building a consistent and responsive design system.

---

## 🏁 Getting Started (User Guide)

No installation is required beyond a modern web browser.

1.  **Onboarding**: On first launch, you'll be guided through a quick tutorial to set your preferred language.
2.  **Discover Strains**: Start in the **Strains** view. Use the search and filters to find a strain and save it as a favorite by clicking the heart icon.
3.  **Start Growing**: Navigate to the **Plants** dashboard. From an empty slot, click "Start New Grow," select a strain from your favorites or the main list, and configure your setup.
4.  **Manage Your Grow**: The **Plants** dashboard is your command center. Log actions like watering and feeding, check on your plant's vitals, and get advice from the AI.
5.  **Use the Command Palette**: For the fastest access, press `Cmd/Ctrl + K` to navigate or perform actions instantly.

---

## 🛠️ Installation & Local Development (Developer Guide)

To run CannaGuide 2025 locally for development, follow these steps.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) (usually included with Node.js)
*   A **Google Gemini API Key**. You can obtain one from [Google AI Studio](https://ai.studio.google.com/app/apikey).

### Installation
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
    The application requires a Google Gemini API key to function. Create a `.env` file in the root of the project:
    ```bash
    touch .env
    ```
    Open the `.env` file and add your API key:
    ```
    API_KEY=YOUR_GEMINI_API_KEY
    ```
    > **Note**: This setup assumes a development environment that injects environment variables (like Vite or Create React App). The application code directly accesses `process.env.API_KEY`.

4.  **Run the application:**
    This project is designed to run within Google's AI Studio, which handles the development server. If running locally, you would typically use a command like:
    ```bash
    npm start 
    ```
    (Note: `package.json` does not contain this script; you would need to add it or use a local server.)

### Build Process
To create a production-ready build, you would typically run:
```bash
npm run build
```
This command would bundle and optimize the code, preparing it for deployment. (Note: `package.json` does not contain this script.)

---

## 🤔 Troubleshooting

*   **AI Features Not Working**: This is almost always due to a missing or invalid Gemini API key. Ensure your `.env` file is correctly set up and the key is valid. Check your browser's developer console for any `4xx` errors related to the Google API.
*   **App Not Updating (PWA Caching)**: If you've made changes but don't see them, the Service Worker might be serving a cached version.
    1.  Open your browser's developer tools.
    2.  Go to the `Application` tab.
    3.  Find `Service Workers`, check "Update on reload", and click "Unregister" for the CannaGuide service worker.
    4.  Go to `Storage`, click "Clear site data".
    5.  Refresh the page.
*   **Data Corruption**: If the application state becomes corrupted, you can perform a hard reset by navigating to `Settings > Data Management > Reset All App Data`. **Warning: This will delete all your local data.**

---

## 🔒 Security

*   **API Key Management**: Your Gemini API key is a secret. **Do not** commit your `.env` file or expose the key in client-side code that is publicly accessible. The `.gitignore` file should include `.env`.
*   **Dependencies**: Regularly check for vulnerabilities in the project's dependencies by running:
    ```bash
    npm audit
    ```
    Keep packages updated to their latest stable versions to mitigate security risks.

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

[![Lizenz: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build-Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/qnbs/CannaGuide-2025)
[![Tech-Stack](https://img.shields.io/badge/tech-React%20|%20Redux%20|%20Gemini-informational)](https://ai.google.dev/)

**Der definitive KI-gestützte Cannabis-Anbau-Begleiter**

CannaGuide 2025 ist Ihr digitaler Co-Pilot für den gesamten Lebenszyklus des Cannabisanbaus. Entwickelt für sowohl neugierige Einsteiger als auch für erfahrene Meisterzüchter, führt Sie diese hochmoderne **Progressive Web App (PWA)** von der Samenauswahl bis zur perfekt ausgehärteten Ernte. Simulieren Sie Anbauvorgänge mit einer fortschrittlichen VPD-basierten Engine, erkunden Sie eine Bibliothek mit über 480 Sorten, diagnostizieren Sie Pflanzenprobleme per Foto, planen Sie Ihre Ausrüstung mit Gemini-gestützter Intelligenz und meistern Sie Ihr Handwerk mit einem interaktiven, datengesteuerten Leitfaden.

---

## Inhaltsverzeichnis

- [⭐ Projektphilosophie](#-projektphilosophie-1)
- [🚀 Hauptfunktionen](#-hauptfunktionen-1)
- [💻 Technischer Deep Dive](#-technischer-deep-dive-1)
- [🏁 Erste Schritte (Benutzerhandbuch)](#-erste-schritte-benutzerhandbuch)
- [🛠️ Installation & Lokale Entwicklung (Entwicklerhandbuch)](#️-installation--lokale-entwicklung-entwicklerhandbuch)
- [🤔 Fehlerbehebung (Troubleshooting)](#-fehlerbehebung-troubleshooting)
- [🔒 Sicherheit](#-sicherheit-1)
- [🤖 Entwicklung mit AI Studio & Open Source](#-entwicklung-mit-ai-studio--open-source-1)
- [🤝 Mitwirken (Contributing)](#-mitwirken-contributing-1)
- [⚠️ Haftungsausschluss](#️-haftungsausschluss-1)

---

## ⭐ Projektphilosophie

CannaGuide 2025 basiert auf einer Reihe von Kernprinzipien, die darauf ausgelegt sind, ein erstklassiges Erlebnis zu bieten:

*   **Offline First**: Ihr Garten macht keine Pause, wenn Ihre Internetverbindung ausfällt. Die App ist so konzipiert, dass sie **100% offline funktionsfähig** ist, sodass Sie immer Zugriff auf Ihre Daten und Werkzeuge haben.
*   **Leistung ist entscheidend**: Eine flüssige, reaktionsschnelle Benutzeroberfläche ist unerlässlich. Rechenintensive Aufgaben, wie die komplexe Pflanzensimulation, werden in einen **Web Worker** ausgelagert, um die Hauptoberfläche geschmeidig und reaktionsschnell zu halten.
*   **Datensouveränität**: Ihre Daten gehören Ihnen. Die Möglichkeit, Ihren **gesamten Anwendungszustand zu exportieren und zu importieren**, gibt Ihnen vollständige Kontrolle, Eigentum und Sicherheit.
*   **KI als Co-Pilot**: Wir nutzen KI nicht als Gimmick, sondern als leistungsstarkes Werkzeug, um **umsetzbare, kontextbezogene Einblicke** zu liefern, die den Züchter in jeder Phase wirklich unterstützen.

---

## 🚀 Hauptfunktionen

### 1. Der Grow Room (`Pflanzen`-Ansicht)
Ihre Kommandozentrale zur Verwaltung und Simulation von bis zu drei gleichzeitigen Anbauprojekten.

*   **Dynamische Simulations-Engine**: Erleben Sie eine hochmoderne Simulation, die auf **VPD (Dampfdruckdefizit)**, biomasse-skaliertem Ressourcenverbrauch und einem strukturellen Wachstumsmodell basiert.
*   **KI-gestützte Diagnose**: Laden Sie ein Foto Ihrer Pflanze hoch, um eine sofortige KI-basierte Diagnose zu erhalten, komplett mit Sofortmaßnahmen, langfristigen Lösungen und präventiven Ratschlägen.
*   **KI-Pflanzenberater**: Erhalten Sie proaktive, datengesteuerte Ratschläge von Gemini AI basierend auf den Echtzeit-Vitalwerten Ihrer Pflanze. Alle Empfehlungen können mit voller **CRUD**-Funktionalität archiviert werden.
*   **Umfassendes Protokoll**: Verfolgen Sie jede Aktion – von der Bewässerung über die Düngung bis hin zum Training und zur Schädlingsbekämpfung – in einem detaillierten, filterbaren Journal für jede Pflanze.
*   **Dynamische Aufgaben- & Problemgenerierung**: Die Simulations-Engine erstellt automatisch Aufgaben (z. B. "Pflanze wässern") und meldet Probleme (z. B. "Nährstoffmangel") basierend auf dem sich entwickelnden Zustand der Pflanze.

### 2. Die Sorten-Enzyklopädie (`Sorten`-Ansicht)
Ihr zentraler Wissens-Hub, konzipiert für tiefgehende Erkundungen mit **Offline-First**-Zugriff.

*   **Riesige Bibliothek**: Greifen Sie auf detaillierte Informationen zu **über 480 Cannabissorten** zu.
*   **Interaktiver Stammbaum**: Visualisieren Sie die vollständige genetische Abstammung jeder Sorte in einem interaktiven, D3.js-basierten Baumdiagramm.
*   **Hochleistungs-Suche & -Filter**: Finden Sie sofort Sorten mit einer IndexedDB-gestützten Volltextsuche und erweiterten Mehrfachauswahlfiltern für THC/CBD-Bereich, Blütezeit, Aroma und mehr.
*   **Persönliche Sortensammlung**: Genießen Sie volle **CRUD (Erstellen, Lesen, Aktualisieren, Löschen)**-Funktionalität, um Ihre eigenen benutzerdefinierten Sorten hinzuzufügen und zu verwalten.
*   **KI-Anbau-Tipps**: Generieren Sie einzigartige, KI-gestützte Anbauratschläge für jede Sorte basierend auf Ihrem Erfahrungslevel und Ihren Zielen und verwalten Sie diese in einem dedizierten "Tipps"-Archiv.
*   **Flexible Datenexport**: Exportieren Sie Ihre ausgewählten oder gefilterten Sortenlisten in mehreren Formaten, einschließlich **PDF, CSV, JSON, TXT und XML**.

### 3. Die Bibliothek (`Wissen`- & `Hilfe`-Ansichten)
Ihre vollständige Ressource zum Lernen und zur Problemlösung.

*   **Kontextsensitiver KI-Mentor**: Stellen Sie dem KI-Mentor Anbaufragen, der die Daten Ihrer aktiven Pflanze für maßgeschneiderte Ratschläge nutzt. Alle Gespräche werden mit voller **CRUD**-Unterstützung archiviert.
*   **Zuchtlabor**: Kreuzen Sie Ihre hochwertigen, gesammelten Samen, um völlig neue, einzigartige Hybridsorten zu schaffen, die dauerhaft Ihrer persönlichen Bibliothek hinzugefügt werden.
*   **Interaktive Sandbox**: Führen Sie "Was-wäre-wenn"-Szenarien durch, wie z. B. den Vergleich von Topping vs. LST an einem Klon Ihrer Pflanze, um die Auswirkungen verschiedener Trainingstechniken über eine beschleunigte 14-tägige Simulation zu visualisieren, ohne Ihre echten Pflanzen zu riskieren.
*   **Umfassende Anleitungen**: Greifen Sie auf ein integriertes Grower-Lexikon, visuelle Anleitungen für gängige Techniken und einen umfangreichen FAQ-Bereich zu.

### 4. Plattformweite Funktionen
*   **Volle PWA- & Offline-Fähigkeit**: Installieren Sie die App auf Ihrem Gerät für ein natives Erlebnis. Der robuste Service Worker gewährleistet **100% Offline-Funktionalität**, einschließlich Zugriff auf alle Daten und KI-Archive.
*   **Befehlspalette (`Cmd/Ctrl + K`)**: Ein Power-User-Tool für sofortige, klickfreie Navigation und Aktionen in der gesamten Anwendung.
*   **Vollständige Datensouveränität**: Exportieren Sie *alle* Ihre App-Daten (Pflanzen, Einstellungen, Archive, eigene Sorten) in eine einzige JSON-Datei zur **Sicherung**. Importieren Sie sie später, um Ihren Zustand auf jedem Gerät **wiederherzustellen**.
*   **Erweiterte Barrierefreiheit**: Bietet eine **Legastheniker-freundliche Schriftart**, einen **Modus mit reduzierter Bewegung** und eine integrierte **Text-zu-Sprache (TTS)**-Funktionalität für wichtige Inhalte.

---

## 💻 Technischer Deep Dive

CannaGuide 2025 basiert auf einem modernen, robusten und skalierbaren Tech-Stack, der auf Leistung und Offline-First-Zuverlässigkeit ausgelegt ist.

*   **Kern-Framework**: **React 19 & TypeScript** bieten eine moderne, typsichere und performante Benutzeroberfläche.
*   **Zustandsverwaltung**: **Redux Toolkit (^2.2)** dient als zentrale Datenquelle ("Single Source of Truth") für den gesamten Anwendungszustand. Dieser zentralisierte Ansatz gewährleistet vorhersagbare Zustandsübergänge, vereinfacht das Debugging und erleichtert die Persistenz des Zustands.
*   **KI-Integration**: Die **Google Gemini API (`@google/genai` ^1.19)** treibt alle intelligenten Funktionen an und verwendet das `gemini-2.5-flash`-Modell für seine optimale Balance aus Geschwindigkeit, Kosten und seiner Fähigkeit, strukturierte JSON-Ausgaben zu liefern.
*   **Asynchrone Operationen**:
    *   **RTK Query** verwaltet alle Interaktionen mit der Gemini-API und bietet Caching, automatisches Neuladen und ein optimiertes Lade-/Fehlerzustandsmanagement.
    *   Die komplexe Pflanzenwachstumssimulation läuft in einem **Web Worker (`simulation.worker.ts`)**, wodurch sichergestellt wird, dass der Haupt-UI-Thread auch bei intensiven Hintergrundberechnungen reaktionsschnell und flüssig bleibt.
*   **Datenpersistenz**: Eine robuste **IndexedDB**-Strategie gewährleistet Datenintegrität und Offline-Verfügbarkeit.
    *   Der gesamte Redux-Zustand wird über eine **Listener-Middleware** in einer dedizierten IndexedDB-Datenbank persistiert, was eine nahtlose Zustandshydratisierung beim Start der App ermöglicht.
    *   Große statische Daten wie die Sortenbibliothek, benutzerseitig hochgeladene Bilder und der Volltext-Suchindex werden in einer separaten IndexedDB-Datenbank (`dbService.ts`) verwaltet, um die Leistung zu optimieren.
*   **PWA & Offline-Fähigkeit**: Ein **Service Worker (`sw.js`)** implementiert eine "Cache First, then Network"-Strategie, wodurch die Anwendung vollständig installierbar und ohne Internetverbindung funktionsfähig ist.
*   **Styling**: **Tailwind CSS** ermöglicht einen schnellen, Utility-First-Ansatz zum Erstellen eines konsistenten und responsiven Designsystems.

---

## 🏁 Erste Schritte (Benutzerhandbuch)

Außer einem modernen Webbrowser ist keine Installation erforderlich.

1.  **Onboarding**: Beim ersten Start werden Sie durch ein kurzes Tutorial geführt, um Ihre bevorzugte Sprache einzustellen.
2.  **Sorten entdecken**: Beginnen Sie in der **Sorten**-Ansicht. Nutzen Sie die Suche und die Filter, um eine Sorte zu finden, und speichern Sie sie als Favorit, indem Sie auf das Herzsymbol klicken.
3.  **Anbau starten**: Navigieren Sie zum **Pflanzen**-Dashboard. Klicken Sie auf einen leeren Steckplatz, wählen Sie "Neuen Anbau starten", wählen Sie eine Sorte aus Ihren Favoriten oder der Hauptliste aus und konfigurieren Sie Ihr Setup.
4.  **Ihren Anbau verwalten**: Das **Pflanzen**-Dashboard ist Ihre Kommandozentrale. Protokollieren Sie Aktionen wie Gießen und Düngen, überprüfen Sie die Vitalwerte Ihrer Pflanze und holen Sie sich Ratschläge von der KI.
5.  **Befehlspalette verwenden**: Drücken Sie für den schnellsten Zugriff `Cmd/Ctrl + K`, um sofort zu navigieren oder Aktionen auszuführen.

---

## 🛠️ Installation & Lokale Entwicklung (Entwicklerhandbuch)

Um CannaGuide 2025 lokal für die Entwicklung auszuführen, befolgen Sie diese Schritte.

### Voraussetzungen
*   [Node.js](https://nodejs.org/) (v18.x oder neuer empfohlen)
*   [npm](https://www.npmjs.com/) (normalerweise bei Node.js enthalten)
*   Ein **Google Gemini API Key**. Diesen erhalten Sie im [Google AI Studio](https://ai.studio.google.com/app/apikey).

### Installation
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
    API_KEY=YOUR_GEMINI_API_KEY
    ```
    > **Hinweis**: Dieses Setup geht von einer Entwicklungsumgebung aus, die Umgebungsvariablen bereitstellt (wie Vite oder Create React App). Der Anwendungscode greift direkt auf `process.env.API_KEY` zu.

4.  **Anwendung ausführen:**
    Dieses Projekt ist für die Ausführung im Google AI Studio konzipiert, das den Entwicklungsserver bereitstellt. Bei lokaler Ausführung würden Sie typischerweise einen Befehl wie diesen verwenden:
    ```bash
    npm start 
    ```
    (Hinweis: Die `package.json` enthält dieses Skript nicht; Sie müssten es hinzufügen oder einen lokalen Server verwenden.)

### Build-Prozess
Um einen produktionsfertigen Build zu erstellen, würden Sie typischerweise Folgendes ausführen:
```bash
npm run build
```
Dieser Befehl würde den Code bündeln und optimieren und ihn für die Bereitstellung vorbereiten. (Hinweis: Die `package.json` enthält dieses Skript nicht.)

---

## 🤔 Fehlerbehebung (Troubleshooting)

*   **KI-Funktionen funktionieren nicht**: Dies liegt fast immer an einem fehlenden oder ungültigen Gemini API-Schlüssel. Stellen Sie sicher, dass Ihre `.env`-Datei korrekt eingerichtet ist und der Schlüssel gültig ist. Überprüfen Sie die Entwicklerkonsole Ihres Browsers auf `4xx`-Fehler im Zusammenhang mit der Google-API.
*   **App aktualisiert sich nicht (PWA-Caching)**: Wenn Sie Änderungen vorgenommen haben, diese aber nicht sehen, könnte der Service Worker eine zwischengespeicherte Version ausliefern.
    1.  Öffnen Sie die Entwicklertools Ihres Browsers.
    2.  Gehen Sie zum Tab `Anwendung` (Application).
    3.  Suchen Sie `Service Workers`, aktivieren Sie "Update on reload" (Bei Neuladen aktualisieren) und klicken Sie auf "Unregister" (Registrierung aufheben) für den CannaGuide-Service-Worker.
    4.  Gehen Sie zu `Speicher` (Storage) und klicken Sie auf "Site data löschen" (Clear site data).
    5.  Aktualisieren Sie die Seite.
*   **Datenprobleme**: Sollte der Zustand der Anwendung beschädigt werden, können Sie einen Hard-Reset durchführen, indem Sie zu `Einstellungen > Datenverwaltung > Alle App-Daten zurücksetzen` navigieren. **Achtung: Dies löscht alle Ihre lokalen Daten.**

---

## 🔒 Sicherheit

*   **API-Schlüssel-Verwaltung**: Ihr Gemini API-Schlüssel ist ein Geheimnis. **Übergeben Sie Ihre `.env`-Datei nicht an die Versionskontrolle** und legen Sie den Schlüssel nicht in clientseitigem Code offen, der öffentlich zugänglich ist. Die `.gitignore`-Datei sollte `.env` enthalten.
*   **Abhängigkeiten**: Überprüfen Sie regelmäßig die Abhängigkeiten des Projekts auf Schwachstellen, indem Sie Folgendes ausführen:
    ```bash
    npm audit
    ```
    Halten Sie Pakete auf ihren neuesten stabilen Versionen, um Sicherheitsrisiken zu minimieren.

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

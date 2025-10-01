
# CannaGuide 2025 - Quellcode-Dokumentation (Teil 1: Kern & Setup)

Dieses Dokument enthält die grundlegenden Einrichtungsdateien für die CannaGuide 2025-Anwendung und bietet einen Überblick über die Projektstruktur, Abhängigkeiten und Einstiegspunkte.

## Inhaltsverzeichnis
- [`README.md`](#readmemd)
- [`package.json`](#packagejson)
- [`tsconfig.json`](#tsconfigjson)
- [`.eslintrc.json`](#eslintrcjson)
- [`metadata.json`](#metadatasjson)
- [`index.html`](#indexhtml)
- [`index.tsx`](#indextsx)
- [`sw.js`](#swjs)
- [`register-sw.js`](#register-swjs)
- [`manifest.json`](#manifestjson)
- [`i18n.ts`](#i18nts)

---

## `README.md`

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
*   **Asynchronous Simulation**: The complex plant growth simulation runs in a **Web Worker (`simulation.worker.ts`)**, ensuring the main UI thread remains responsive and smooth, even during intensive background calculations. This is crucial for a fluid user experience.
*   **Data Persistence**: A robust **dual IndexedDB strategy** ensures data integrity and offline availability.
    *   The entire Redux state is persisted to IndexedDB via middleware, providing seamless state hydration on app startup.
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

*   **Offline First**: Ihr Garten macht keine Pause, wenn Ihre Internetverbindung ausfällt. Die App ist so konzipiert, dass sie **100% offline funktionsfähig** ist, sodass Sie jederzeit Zugriff auf Ihre Daten und Werkzeuge haben.
*   **Performance ist entscheidend**: Eine flüssige, reaktionsschnelle Benutzeroberfläche ist nicht verhandelbar. Rechenintensive Aufgaben, wie die komplexe Pflanzensimulation, werden in einen **Web Worker** ausgelagert, um die Benutzeroberfläche geschmeidig und direkt zu halten.
*   **Datenhoheit**: Ihre Daten gehören Ihnen. Die Möglichkeit, Ihren gesamten Anwendungszustand zu **exportieren und zu importieren**, gibt Ihnen vollständige Kontrolle, Besitz und Sorgenfreiheit.
*   **KI als Co-Pilot**: Wir nutzen KI nicht als Gimmick, sondern als leistungsstarkes Werkzeug, um **umsetzbare, kontextbezogene Einblicke** zu liefern, die den Züchter in jeder Phase wirklich unterstützen.

---

## 🚀 Hauptfunktionen

### 1. Der Grow Room (`Pflanzen`-Ansicht)
Ihre Kommandozentrale zur Verwaltung und Simulation von bis zu drei gleichzeitigen Grows.

*   **Ultrarealistische Simulations-Engine**: Erleben Sie eine hochmoderne Simulation, die auf **VPD (Dampfdruckdefizit)**, Biomasse-skaliertem Ressourcenverbrauch und einem strukturellen Wachstumsmodell basiert.
*   **KI-gestützte Diagnose**: Laden Sie ein Foto Ihrer Pflanze hoch, um eine sofortige KI-basierte Diagnose zu erhalten, komplett mit Sofortmaßnahmen, langfristigen Lösungen und präventiven Ratschlägen.
*   **KI-Pflanzenberater**: Erhalten Sie proaktive, datengestützte Ratschläge von Gemini AI basierend auf den Echtzeit-Vitalwerten Ihrer Pflanze. Alle Empfehlungen können mit voller **CRUD**-Funktionalität archiviert werden.
*   **Umfassendes Journaling**: Verfolgen Sie jede Aktion – von der Bewässerung über die Düngung bis hin zu Training und Schädlingsbekämpfung – in einem detaillierten, filterbaren Journal für jede Pflanze.
*   **Dynamische Aufgaben- & Problemerstellung**: Die Simulations-Engine erstellt automatisch Aufgaben (z.B. "Pflanze gießen") und meldet Probleme (z.B. "Nährstoffmangel") basierend auf dem sich entwickelnden Zustand der Pflanze.

### 2. Die Sorten-Enzyklopädie (`Sorten`-Ansicht)
Ihre zentrale Wissensbibliothek, konzipiert für tiefgehende Erkundungen mit **Offline-First**-Zugriff.

*   **Riesige Bibliothek**: Zugriff auf detaillierte Informationen zu **über 480 Cannabissorten**.
*   **Hochleistungs-Suche & Filterung**: Finden Sie Sorten sofort mit einer IndexedDB-gestützten Volltextsuche und erweiterten Mehrfachauswahl-Filtern für THC/CBD-Bereich, Blütezeit, Aroma und mehr.
*   **Persönliche Sorten-Sammlung**: Profitieren Sie von voller **CRUD-Funktionalität (Erstellen, Lesen, Aktualisieren, Löschen)**, um Ihre eigenen Sorten hinzuzufügen und zu verwalten.
*   **KI-Anbau-Tipps**: Generieren Sie einzigartige, KI-gestützte Anbauratschläge für jede Sorte basierend auf Ihrem Erfahrungslevel und Ihren Zielen, und verwalten Sie diese in einem dedizierten "Tipps"-Archiv.
*   **Flexibler Datenexport**: Exportieren Sie Ihre ausgewählten oder gefilterten Sortenlisten in mehreren Formaten, einschließlich **PDF, CSV und JSON**.

### 3. Die Bibliothek (`Wissen` & `Hilfe`-Ansichten)
Ihre vollständige Ressource zum Lernen und zur Problemlösung.

*   **Kontextsensitiver KI-Mentor**: Stellen Sie dem KI-Mentor Anbaufragen, der die Daten Ihrer aktiven Pflanze für maßgeschneiderte Ratschläge nutzt. Alle Konversationen werden mit voller **CRUD**-Unterstützung archiviert.
*   **Zuchtlabor**: Kreuzen Sie Ihre hochwertigen, gesammelten Samen, um völlig neue, einzigartige Hybrid-Sorten zu erschaffen, die dauerhaft Ihrer persönlichen Bibliothek hinzugefügt werden.
*   **Interaktive Sandbox**: Führen Sie "Was-wäre-wenn"-Szenarien durch, wie z.B. den Vergleich von Topping vs. LST an einem Klon Ihrer Pflanze, um die Auswirkungen verschiedener Trainingstechniken über eine beschleunigte 14-tägige Simulation zu visualisieren, ohne Ihre echten Pflanzen zu riskieren.
*   **Umfassende Leitfäden**: Greifen Sie auf ein integriertes Grower-Lexikon, visuelle Anleitungen für gängige Techniken und einen umfangreichen FAQ-Bereich zu.

### 4. Plattformweite Funktionen
*   **Volle PWA- & Offline-Fähigkeit**: Installieren Sie die App auf Ihrem Gerät für ein natives Erlebnis. Der robuste Service Worker gewährleistet **100% Offline-Funktionalität**, einschließlich des Zugriffs auf alle Daten und KI-Archive.
*   **Befehlspalette (`Cmd/Strg + K`)**: Ein Power-User-Tool für sofortige Navigation und Aktionen in der gesamten Anwendung ohne Klicks.
*   **Vollständige Datenhoheit**: Exportieren Sie *alle* Ihre App-Daten (Pflanzen, Einstellungen, Archive, eigene Sorten) in eine einzige JSON-Datei für ein **Backup**. Importieren Sie diese später, um Ihren Zustand auf jedem Gerät wiederherzustellen.
*   **Erweiterte Barrierefreiheit**: Bietet eine **Legastheniker-freundliche Schriftart**, einen Modus für **Reduzierte Bewegung** und integrierte **Text-to-Speech (TTS)**-Funktionalität für wichtige Inhalte.

---

## 💻 Technischer Deep Dive

CannaGuide 2025 basiert auf einem modernen, robusten und skalierbaren Technologie-Stack, der für Leistung und Offline-First-Zuverlässigkeit konzipiert ist.

*   **Kern-Framework**: **React 19 & TypeScript** bieten eine moderne, typsichere und performante Benutzeroberfläche.
*   **Zustandsverwaltung**: **Redux Toolkit** dient als die alleinige "Source of Truth" für den gesamten Anwendungszustand. Dieser zentrale Ansatz gewährleistet vorhersagbare Zustandsübergänge, vereinfacht das Debugging mit Tools wie den Redux DevTools und macht die Persistenz des Zustands unkompliziert.
*   **KI-Integration**: Die **Google Gemini API (`@google/genai`)** treibt alle intelligenten Funktionen an und verwendet das `gemini-2.5-flash`-Modell wegen seiner optimalen Balance aus Geschwindigkeit, Kosten und seiner Fähigkeit, strukturierte JSON-Ausgaben zu liefern.
*   **Asynchrone Simulation**: Die komplexe Pflanzenwachstumssimulation läuft in einem **Web Worker (`simulation.worker.ts`)**, wodurch der Haupt-UI-Thread auch bei intensiven Hintergrundberechnungen reaktionsschnell und flüssig bleibt. Dies ist entscheidend für ein flüssiges Benutzererlebnis.
*   **Datenpersistenz**: Eine robuste **duale IndexedDB-Strategie** gewährleistet Datenintegrität und Offline-Verfügbarkeit.
    *   Der gesamte Redux-Zustand wird über Middleware in IndexedDB persistiert, was eine nahtlose Zustandshydrierung beim App-Start ermöglicht.
    *   Große statische Daten, wie die Sortenbibliothek und der Volltext-Suchindex, werden für optimale Leistung in einer separaten IndexedDB-Datenbank verwaltet, um das Hauptzustandsobjekt nicht aufzublähen.
*   **PWA & Offline-Fähigkeit**: Ein **Service Worker (`sw.js`)** implementiert eine "Cache First, then Network"-Strategie, wodurch die Anwendung vollständig installierbar und ohne Internetverbindung funktionsfähig ist.
*   **Styling**: **Tailwind CSS** ermöglicht einen schnellen, Utility-First-Ansatz zum Aufbau eines konsistenten und responsiven Designsystems, das einfach zu warten und anzupassen ist.

---

## 🤖 Entwicklung mit AI Studio & Open Source

Diese Anwendung wurde vollständig mit **Googles AI Studio** entwickelt. Der gesamte Prozess, vom initialen Projekt-Setup bis zur Implementierung komplexer Features wie der Redux-Zustandsverwaltung und der Web-Worker-Simulation, wurde durch iterative Befehle in natürlicher Sprache gesteuert.

Dieses Projekt ist zudem vollständig Open Source. Tauchen Sie in den Code ein, forken Sie das Projekt oder tragen Sie auf GitHub bei. Sehen Sie aus erster Hand, wie natürliche Sprache anspruchsvolle Anwendungen erstellen kann.

*   **Forken Sie das Projekt in AI Studio:** [https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-](https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-)
*   **Sehen Sie den Quellcode auf GitHub ein:** [https://github.com/qnbs/CannaGuide-2025](https://github.com/qnbs/CannaGuide-2025)

---

## 🤝 Mitwirken (Contributing)

Wir freuen uns über Beiträge aus der Community! Ob Sie einen Fehler beheben, eine neue Funktion hinzufügen oder Übersetzungen verbessern möchten – Ihre Hilfe ist willkommen.

1.  **Probleme melden**: Wenn Sie einen Fehler finden oder eine Idee haben, [öffnen Sie bitte zuerst ein Issue](https://github.com/qnbs/CannaGuide-2025/issues) auf GitHub, um es zu diskutieren.
2.  **Änderungen vornehmen**:
    *   Forken Sie das Repository.
    *   Erstellen Sie einen neuen Branch für Ihr Feature oder Ihre Fehlerbehebung (`git checkout -b feature/mein-neues-feature`).
    *   Committen Sie Ihre Änderungen (`git commit -am 'Füge ein Feature hinzu'`).
    *   Pushen Sie den Branch (`git push origin feature/mein-neues-feature`).
    *   Erstellen Sie einen neuen Pull Request.

Bitte halten Sie sich an den bestehenden Code-Stil und stellen Sie sicher, dass Ihre Änderungen gut dokumentiert sind.

---

## 🏁 Erste Schritte

Es ist keine Installation oder Einrichtung erforderlich. Die Anwendung läuft vollständig in Ihrem Webbrowser.

1.  **Onboarding**: Beim ersten Start werden Sie durch ein kurzes Tutorial geführt, um Ihre bevorzugte Sprache einzustellen.
2.  **Sorten entdecken**: Beginnen Sie in der **Sorten**-Ansicht. Nutzen Sie die Suche und Filter, um eine Sorte zu finden, und speichern Sie sie als Favorit, indem Sie auf das Herz-Symbol klicken.
3.  **Anbau starten**: Navigieren Sie zum **Pflanzen**-Dashboard. Klicken Sie in einem leeren Slot auf "Neuen Anbau starten", wählen Sie eine Sorte aus Ihren Favoriten oder der Hauptliste und konfigurieren Sie Ihr Setup.
4.  **Ihren Grow verwalten**: Das **Pflanzen**-Dashboard ist Ihre Kommandozentrale. Protokollieren Sie Aktionen wie Gießen und Düngen, überprüfen Sie die Vitalwerte Ihrer Pflanze und holen Sie sich Rat von der KI.
5.  **Befehlspalette nutzen**: Für den schnellsten Zugriff drücken Sie `Cmd/Strg + K`, um sofort zu navigieren oder Aktionen auszuführen.

---

## ⚠️ Haftungsausschluss

> Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und gesetzeskonform.
```

---

## `package.json`

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
    "react-redux": "^9.1.2",
    "reselect": "^5.1.1"
  },
  "prettier": {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "es5",
    "printWidth": 100,
    "tabWidth": 4,
    "jsxSingleQuote": true
  }
}
```

---

## `tsconfig.json`

```json
{
    "compilerOptions": {
        "target": "ESNext",
        "lib": ["DOM", "DOM.Iterable", "ESNext"],
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

---

## `.eslintrc.json`

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
        "node": true
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

---

## `metadata.json`

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

---

## `index.html`

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
    "zustand/": "https://aistudiocdn.com/zustand@^5.0.8/",
    "@reduxjs/toolkit/": "https://aistudiocdn.com/@reduxjs/toolkit@^2.9.0/"
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

---

## `index.tsx`

```typescript
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { Provider } from 'react-redux';
// import { I18nextProvider } from 'react-i18next';
// import { App } from './App';
// import { ErrorBoundary } from './components/common/ErrorBoundary';
// // FIX: Corrected import path for Redux store to use the '@/' alias.
// import { createAppStore, RootState } from '@/stores/store';
// import { i18nPromise, i18nInstance } from './i18n';
// import { indexedDBStorage } from './stores/indexedDBStorage';
// import { mergeSettings } from './stores/slices/settingsSlice';
// 
// const root = ReactDOM.createRoot(document.getElementById('root')!);
// const REDUX_STATE_KEY = 'cannaguide-redux-storage';
// 
// const initialize = async () => {
//   await i18nPromise;
// 
//   let preloadedState: Partial<RootState> = {};
//   try {
//       const persistedString = await indexedDBStorage.getItem(REDUX_STATE_KEY);
//       if (persistedString) {
//           const persistedState = JSON.parse(persistedString);
//           if(persistedState.settings) {
//               persistedState.settings = { settings: mergeSettings(persistedState.settings.settings) };
//           }
//           preloadedState = persistedState;
//           console.log('[Persistence] State loaded from IndexedDB.');
//       }
//   } catch (e) {
//       console.error("[Persistence] Failed to load or parse persisted state, starting fresh.", e);
//   }
// 
//   const store = createAppStore(preloadedState);
// 
//   // FIX: Wrapped component tree within ErrorBoundary components to provide the required 'children' prop and fix component hierarchy.
//   root.render(
//     <React.StrictMode>
//       <ErrorBoundary scope="Global App">
//         <Provider store={store}>
//           <ErrorBoundary scope="Redux Store">
//             <I18nextProvider i18n={i18nInstance}>
//               <App />
//             </I18nextProvider>
//           </ErrorBoundary>
//         </Provider>
//       </ErrorBoundary>
//     </React.StrictMode>
//   );
// };
// 
// initialize();
```

---

## `sw.js`

```javascript
const CACHE_NAME = 'cannaguide-v3-stable';

// Install-Event: Sofort aktivieren, ohne auf Caching zu warten.
self.addEventListener('install', event => {
  console.log('[Service Worker] Install Event - Skipping wait...');
  event.waitUntil(self.skipWaiting());
});

// Activate-Event: Alte Caches löschen und Kontrolle übernehmen.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate Event - Clearing old caches...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch-Event: "Network-First"-Strategie.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Do not cache any Google API calls to ensure fresh data from Gemini
  if (event.request.url.includes('googleapis.com')) {
    return; // Let the browser handle the request normally, bypassing the service worker.
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If successful, store a copy in the cache for offline use
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => {
        // If the network fails, try to respond from the cache
        return caches.match(event.request);
      })
  );
});
```

---

## `register-sw.js`

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful:', registration);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });
}
```

---

## `manifest.json`

```json
{
  "name": "CannaGuide 2025",
  "short_name": "CannaGuide",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "pwa-icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

---

## `i18n.ts`

```typescript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { de, en } from './locales';

// Create a direct instance of i18next
export const i18nInstance = i18next.createInstance();

/**
 * Provides a global accessor to the translation function (`t`) from the initialized i18next instance.
 * This is the single source of truth for translations outside of React components (e.g., in services, stores).
 * @returns The translation function.
 */
export const getT = () => i18nInstance.t;

// Detect initial language from browser settings. The store will sync it up later upon hydration.
const detectedLang = navigator.language.split('-')[0];
const initialLang: 'en' | 'de' = detectedLang === 'de' ? 'de' : 'en';

// The initialization is now a promise that the app will wait for
export const i18nPromise = i18nInstance
    .use(initReactI18next)
    .init({
        lng: initialLang,
        fallbackLng: 'en',
        resources: {
            en: { translation: en },
            de: { translation: de },
        },
        interpolation: {
            escapeValue: false, // React already handles escaping
        },
    });
```

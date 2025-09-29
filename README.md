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

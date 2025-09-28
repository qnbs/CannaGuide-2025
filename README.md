# 🌿 CannaGuide 2025 (English)

**The Definitive AI-Powered Cannabis Cultivation Companion**

CannaGuide 2025 is your definitive AI-powered digital co-pilot for the entire cannabis cultivation lifecycle. Engineered for both novice enthusiasts and master growers, this state-of-the-art **Progressive Web App (PWA)** guides you from seed selection to a perfectly cured harvest. Simulate grows with an advanced VPD-based engine, explore a vast library of over 480 strains, diagnose plant issues with a photo, plan equipment with Gemini-powered intelligence, and master your craft with an interactive, data-driven guide.

---

## Table of Contents

- [🚀 Key Features](#-key-features)
  - [1. The Strain Encyclopedia (`Strains` View)](#1-the-strain-encyclopedia-strains-view)
  - [2. The Grow Room (`Plants` View)](#2-the-grow-room-plants-view)
  - [3. The Workshop (`Equipment` View)](#3-the-workshop-equipment-view)
  - [4. The Library (`Knowledge` & `Help` Views)](#4-the-library-knowledge--help-views)
  - [5. The Control Panel (`Settings` View)](#5-the-control-panel-settings-view)
  - [6. Platform-Wide Features](#6-platform-wide-features)
- [🤖 Development with AI Studio & Open Source](#-development-with-ai-studio--open-source)
- [💻 Advanced Technical Architecture](#-advanced-technical-architecture)
- [🏁 Getting Started](#-getting-started)
- [⚠️ Disclaimer](#️-disclaimer)
- [Deutsche Version](#-cannaguide-2025-deutsch)

---

## 🚀 Key Features

### 1. The Strain Encyclopedia (`Strains` View)

Your central knowledge hub, designed for deep exploration with **offline-first** access.

*   **Vast Library**: Access detailed information on **over 480 cannabis strains**.
*   **High-Performance Search**: Instantly find strains by name, genetics, or aroma, powered by an **IndexedDB-based full-text search index**.
*   **Comprehensive Filtering & Sorting**: Precisely narrow your search with multi-select filters and sortable columns.
*   **Your Personal Strain Collection**: Enjoy full **CRUD (Create, Read, Update, Delete)** functionality to add and manage your own custom strains.
*   **AI Grow Tips with Archive**: Generate unique, AI-powered cultivation advice for any strain and manage it in a dedicated "Tips" archive with full **CRUD** functionality.
*   **Professional Exporting & Management**: Export filtered or selected strain data as **PDF**, **CSV**, **TXT**, **JSON**, or **XML**. Manage all past exports in the "Exports" tab, also with full **CRUD** support.
*   **Dual View Modes & Bulk Actions**: Switch between a detailed list and a visual grid. Select multiple strains at once to export or add/remove from favorites.

### 2. The Grow Room (`Plants` View)

Your command center for managing and simulating up to three simultaneous grows.

*   **State-of-the-Art Simulation Engine**: Experience a realistic simulation based on **VPD (Vapor Pressure Deficit)**, biomass-scaled resource consumption, and a structural growth model.
*   **AI-Powered Diagnostics**: Upload a photo of your plant to get an instant AI-based diagnosis and recommended solutions.
*   **AI Plant Advisor with Full CRUD Archive**: Get proactive, data-driven advice from Gemini AI. **Save, view, edit, and delete** recommendations to build a unique history of AI-guided care.
*   **Global Advisor Archive**: A dedicated dashboard view that aggregates and makes searchable all saved AI advisor responses from all your plants.
*   **Detailed Plant View**: Dive deep into a single plant with tabs for **Overview**, **Journal**, **Tasks**, **Photos**, and **AI interactions**.
*   **Interactive Dashboard**: Manage your plants in three slots. Each `PlantCard` displays a dynamic visual representation and real-time vitals.

### 3. The Workshop (`Equipment` View)

Plan and optimize your real-world grow setup with powerful, AI-driven tools.

*   **AI Setup Configurator**: Generate a complete, customized equipment list based on plant count and growing style.
*   **Saved Setups with Full CRUD & Export**: **Save, edit, delete**, and **export** your generated setups in various formats.
*   **Essential Calculators**: A suite of tools for fine-tuning: Ventilation, Lighting, Nutrients, Cost, EC/PPM Converter, and a Yield Estimator.
*   **Curated Grow Shops**: A list of reputable online grow shops in Europe and the USA.

### 4. The Library (`Knowledge` & `Help` Views)

Your complete resource for learning and problem-solving.

*   **Interactive Grow Guide**: A guided journey through the five main phases of cultivation with visual progress tracking.
*   **AI Mentor with CRUD Archive**: Ask general growing questions to the AI. **Save, view, edit, and delete** the responses to build your personal knowledge base.
*   **Comprehensive Help Center**: A detailed, searchable FAQ and in-depth lexicons.
*   **Breeding Lab**: Cross your high-quality collected seeds to create entirely new, unique hybrid strains that are permanently added to your library.

### 5. The Control Panel (`Settings` View)

Customize the app to your preferences and manage your data with full control.

*   **Deep Personalization**: Adjust language (EN/DE), theme (5 options), font size, and UI density.
*   **Advanced Accessibility**: Enable a **Dyslexia-Friendly Font**, **Reduced Motion**, or **Text-to-Speech (TTS)** functionality.
*   **Complete Data Sovereignty**: Export *all* your app data (plants, settings, archives) to a single JSON file for **backup**. Import it later to **restore** your state.

### 6. Platform-Wide Features

*   **Command Palette (`Cmd/Ctrl + K`)**: A power-user tool for instant, click-free navigation and actions.
*   **Offline-First PWA**: Thanks to a robust Service Worker, the app is installable and works completely offline, including access to all data and AI archives.
*   **Text-to-Speech (TTS) Integration**: Have descriptions, guides, and AI responses read aloud for a hands-free, accessible experience.
*   **Seamless PWA Installation**: A non-intrusive in-app install prompt for a native-like experience.

---

## 🤖 Development with AI Studio & Open Source

This application was developed entirely with **Google's AI Studio**. The entire process, from the initial project to implementing complex features, was driven by iterative prompts in natural language.

This project is also fully open source. Dive into the code, fork the project, or contribute on GitHub. See firsthand how natural language can build sophisticated applications.

*   **Fork the project in AI Studio:** [https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-](https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-)
*   **View the source code on GitHub:** [https://github.com/qnbs/CannaGuide-2025](https://github.com/qnbs/CannaGuide-2025)

---

## 💻 Advanced Technical Architecture

*   **Core:** React 19 & TypeScript for a modern, type-safe, and performant user interface.
*   **AI Integration:** Google Gemini API (`@google/genai`) using the `gemini-2.5-flash` model for fast, structured JSON output that powers all AI features.
*   **State Management:** Zustand with Immer middleware for a minimalistic, powerful, and scalable global state. Selectors are memoized with `reselect` for optimal performance.
*   **Styling:** Tailwind CSS (via CDN) for a utility-first design system.
*   **Dual Persistence Strategy:**
    *   **IndexedDB (via `zustand/middleware/persist`):** For robust, asynchronous storage of the entire application state.
    *   **IndexedDB (Direct):** For high-performance local storage of large, static datasets like the strain library and the full-text search index.
*   **PWA & Offline Capability:** Service Worker implementing a robust "Cache First, then Network" strategy for a true offline-first experience.
*   **Tooling:** `jsPDF` & `jsPDF-AutoTable` for professional PDF generation.

---

## 🏁 Getting Started

No installation or setup is required. The application runs entirely in your web browser.

1.  **Discover Strains:** Start in the **Strains** view. Use the search and filters to find a strain and save it as a favorite.
2.  **Start Growing:** From an empty slot on the **Plants** dashboard, click "Start a New Grow," select a strain, and configure your setup.
3.  **Manage Plants:** The **Plants** dashboard is your command center. The simulation progresses automatically if enabled. Click on a plant to check its detailed status and log actions.
4.  **Learn & Plan:** Use the **Knowledge** and **Equipment** views to deepen your understanding and plan your real-world setup.
5.  **Use the Command Palette:** For the fastest access, press `Cmd/Ctrl + K` to navigate or perform actions instantly.

---

## ⚠️ Disclaimer

> All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.

---
---

# 🌿 CannaGuide 2025 (Deutsch)

**Der definitive KI-gestützte Cannabis-Anbau-Begleiter**

CannaGuide 2025 ist Ihr digitaler Co-Pilot für den gesamten Lebenszyklus des Cannabisanbaus. Entwickelt für sowohl neugierige Einsteiger als auch für erfahrene Meisterzüchter, führt Sie diese hochmoderne **Progressive Web App (PWA)** von der Samenauswahl bis zur perfekt ausgehärteten Ernte. Simulieren Sie Anbauvorgänge mit einer fortschrittlichen VPD-basierten Engine, erkunden Sie eine Bibliothek mit über 480 Sorten, diagnostizieren Sie Pflanzenprobleme per Foto, planen Sie Ihre Ausrüstung mit Gemini-gestützter Intelligenz und meistern Sie Ihr Handwerk mit einem interaktiven, datengesteuerten Leitfaden.

---

## Inhaltsverzeichnis

- [🚀 Hauptfunktionen](#-hauptfunktionen)
  - [1. Die Sorten-Enzyklopädie (`Sorten`-Ansicht)](#1-die-sorten-enzyklopädie-sorten-ansicht)
  - [2. Der Grow Room (`Pflanzen`-Ansicht)](#2-der-grow-room-pflanzen-ansicht)
  - [3. Die Werkstatt (`Ausrüstung`-Ansicht)](#3-die-werkstatt-ausrüstung-ansicht)
  - [4. Die Bibliothek (`Wissen` & `Hilfe`-Ansichten)](#4-die-bibliothek-wissen--hilfe-ansichten)
  - [5. Das Kontrollzentrum (`Einstellungen`-Ansicht)](#5-das-kontrollzentrum-einstellungen-ansicht)
  - [6. Plattformweite Funktionen](#6-plattformweite-funktionen)
- [🤖 Entwicklung mit AI Studio & Open Source](#-entwicklung-mit-ai-studio--open-source-1)
- [💻 Fortschrittliche Technische Architektur](#-fortschrittliche-technische-architektur)
- [🏁 Erste Schritte](#-erste-schritte)
- [⚠️ Haftungsausschluss](#️-haftungsausschluss-1)

---

## 🚀 Hauptfunktionen

### 1. Die Sorten-Enzyklopädie (`Sorten`-Ansicht)

Ihre zentrale Wissensbibliothek, konzipiert für tiefgehende Erkundungen mit **Offline-First**-Zugriff.

*   **Riesige Bibliothek**: Zugriff auf detaillierte Informationen zu **über 480 Cannabissorten**.
*   **Hochleistungs-Volltextsuche**: Finden Sie Sorten sofort nach Name, Genetik oder Aroma dank eines **IndexedDB-gestützten** Suchindex.
*   **Umfassende Filter & Sortierung**: Grenzen Sie Ihre Suche mit Mehrfachauswahl-Filtern und sortierbaren Spalten präzise ein.
*   **Ihre persönliche Sorten-Sammlung**: Profitieren Sie von voller **CRUD-Funktionalität (Erstellen, Lesen, Aktualisieren, Löschen)**, um Ihre eigenen Sorten hinzuzufügen und zu verwalten.
*   **KI-Anbau-Tipps mit Archiv**: Generieren Sie einzigartige, KI-gestützte Anbauratschläge für jede Sorte und verwalten Sie diese in einem dedizierten "Tipps"-Archiv mit voller **CRUD**-Funktionalität.
*   **Professioneller Export & Management**: Exportieren Sie gefilterte oder ausgewählte Sortendaten als **PDF**, **CSV**, **TXT**, **JSON** oder **XML**. Verwalten Sie alle Exporte im "Exporte"-Tab, ebenfalls mit voller **CRUD**-Unterstützung.
*   **Duale Ansichtsmodi & Massenaktionen**: Wechseln Sie zwischen einer detaillierten Liste und einem visuellen Raster. Wählen Sie mehrere Sorten gleichzeitig aus, um sie zu exportieren oder zu den Favoriten hinzuzufügen/zu entfernen.

### 2. Der Grow Room (`Pflanzen`-Ansicht)

Ihre Kommandozentrale zur Verwaltung und Simulation von bis zu drei gleichzeitigen Grows.

*   **Hochmoderne Simulations-Engine**: Erleben Sie eine realistische Simulation, die auf **VPD (Dampfdruckdefizit)**, Biomasse-skaliertem Ressourcenverbrauch und einem strukturellen Wachstumsmodell basiert.
*   **KI-gestützte Diagnose**: Laden Sie ein Foto Ihrer Pflanze hoch, um eine sofortige KI-basierte Diagnose und empfohlene Lösungen zu erhalten.
*   **KI-Pflanzenberater mit vollem CRUD-Archiv**: Erhalten Sie proaktive, datengestützte Ratschläge von Gemini AI. **Speichern, ansehen, bearbeiten und löschen** Sie Empfehlungen, um eine einzigartige Historie der KI-geführten Pflege aufzubauen.
*   **Globales Berater-Archiv**: Eine dedizierte Ansicht auf dem Haupt-Dashboard, die alle gespeicherten KI-Berater-Antworten von all Ihren Pflanzen aggregiert und durchsuchbar macht.
*   **Detaillierte Pflanzenansicht**: Tauchen Sie tief in eine einzelne Pflanze ein, mit Reitern für **Übersicht**, **Tagebuch**, **Aufgaben**, **Fotos** und **KI-Interaktionen**.
*   **Interaktives Dashboard**: Verwalten Sie Ihre Pflanzen in drei Slots. Jede `Pflanzenkarte` zeigt eine dynamische visuelle Darstellung und Echtzeit-Vitalwerte.

### 3. Die Werkstatt (`Ausrüstung`-Ansicht)

Planen und optimieren Sie Ihr reales Grow-Setup mit leistungsstarken, KI-gestützten Werkzeugen.

*   **KI-Setup-Konfigurator**: Generieren Sie eine komplette, individualisierte Ausrüstungsliste basierend auf Pflanzenanzahl und Anbaustil.
*   **Gespeicherte Setups mit voller CRUD & Export**: **Speichern, bearbeiten, löschen** und **exportieren** Sie Ihre generierten Setups in verschiedenen Formaten.
*   **Essentielle Rechner**: Eine Suite von Werkzeugen zur Feinabstimmung: Belüftung, Beleuchtung, Nährstoffe, Kosten, EC/PPM-Umrechner und ein Ertragsschätzer.
*   **Kuratierte Grow-Shops**: Eine Liste von seriösen Online-Grow-Shops in Europa und den USA.

### 4. Die Bibliothek (`Wissen` & `Hilfe`-Ansichten)

Ihre vollständige Ressource zum Lernen und zur Problemlösung.

*   **Interaktiver Grow-Guide**: Eine geführte Reise durch die fünf Hauptphasen des Anbaus mit visueller Fortschrittsverfolgung.
*   **KI-Mentor mit CRUD-Archiv**: Stellen Sie allgemeine Anbaufragen an die KI. **Speichern, ansehen, bearbeiten und löschen** Sie die Antworten, um Ihre persönliche Wissensdatenbank aufzubauen.
*   **Umfassendes Hilfecenter**: Eine detaillierte, durchsuchbare FAQ und tiefgehende Lexika.
*   **Zuchtlabor**: Kreuzen Sie Ihre hochwertigen, gesammelten Samen, um völlig neue, einzigartige Hybrid-Sorten zu erschaffen, die dauerhaft Ihrer Bibliothek hinzugefügt werden.

### 5. Das Kontrollzentrum (`Einstellungen`-Ansicht)

Passen Sie die App an Ihre Vorlieben an und verwalten Sie Ihre Daten mit voller Kontrolle.

*   **Tiefgreifende Personalisierung**: Passen Sie Sprache (DE/EN), Thema (5 Optionen), Schriftgröße und UI-Dichte an.
*   **Erweiterte Barrierefreiheit**: Aktivieren Sie eine **Legastheniker-freundliche Schriftart**, **Reduzierte Bewegung** oder die **Text-to-Speech (TTS)**-Funktionalität.
*   **Vollständige Datenhoheit**: Exportieren Sie *alle* Ihre App-Daten (Pflanzen, Einstellungen, Archive) in eine einzige JSON-Datei für ein **Backup**. Importieren Sie diese später, um Ihren Zustand wiederherzustellen.

### 6. Plattformweite Funktionen

*   **Befehlspalette (`Cmd/Strg + K`)**: Ein Power-User-Tool für sofortige Navigation und Aktionen ohne Klicks.
*   **Offline-First PWA**: Dank eines robusten Service Workers ist die App installierbar und funktioniert vollständig offline, einschließlich des Zugriffs auf alle Daten und KI-Archive.
*   **Text-to-Speech (TTS) Integration**: Lassen Sie sich Beschreibungen, Anleitungen und KI-Antworten vorlesen – für eine barrierefreie Nutzung ohne Hände.
*   **Nahtlose PWA-Installation**: Eine unaufdringliche Installationsaufforderung in der App für ein natives Erlebnis.

---

## 🤖 Entwicklung mit AI Studio & Open Source

Diese Anwendung wurde vollständig mit **Googles AI Studio** entwickelt. Der gesamte Prozess, vom initialen Projekt bis zur Implementierung komplexer Features, wurde durch iterative Befehle in natürlicher Sprache gesteuert.

Dieses Projekt ist zudem vollständig Open Source. Tauchen Sie in den Code ein, forken Sie das Projekt oder tragen Sie auf GitHub bei. Sehen Sie aus erster Hand, wie natürliche Sprache anspruchsvolle Anwendungen erstellen kann.

*   **Forken Sie das Projekt in AI Studio:** [https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-](https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-)
*   **Sehen Sie den Quellcode auf GitHub ein:** [https://github.com/qnbs/CannaGuide-2025](https://github.com/qnbs/CannaGuide-2025)

---

## 💻 Fortschrittliche Technische Architektur

*   **Kerntechnologie:** React 19 & TypeScript für eine moderne, typsichere und performante Benutzeroberfläche.
*   **KI-Integration:** Google Gemini API (`@google/genai`) mit dem Modell `gemini-2.5-flash` für schnelle, strukturierte JSON-Ausgaben, die alle KI-Funktionen antreiben.
*   **Zustandsverwaltung:** Zustand mit Immer-Middleware für eine minimalistische, leistungsstarke und skalierbare globale Zustandsverwaltung. Selektoren sind mit `reselect` für optimale Performance memoisier.
*   **Styling:** Tailwind CSS (via CDN) für ein Utility-First-Design-System.
*   **Duale Persistenzstrategie:**
    *   **IndexedDB (via `zustand/middleware/persist`):** Für robuste, asynchrone Speicherung des gesamten Anwendungszustands.
    *   **IndexedDB (Direkt):** Für hochperformante lokale Speicherung großer, statischer Datensätze wie die Sortenbibliothek und den Volltext-Suchindex.
*   **PWA & Offline-Fähigkeit:** Service Worker mit einer robusten "Cache First, then Network"-Strategie für eine echte Offline-First-Erfahrung.
*   **Werkzeuge:** `jsPDF` & `jsPDF-AutoTable` für die professionelle PDF-Erstellung.

---

## 🏁 Erste Schritte

Es ist keine Installation oder Einrichtung erforderlich. Die Anwendung läuft vollständig in Ihrem Webbrowser.

1.  **Sorten entdecken:** Beginnen Sie in der **Sorten**-Ansicht. Nutzen Sie die Suche und Filter, um eine Sorte zu finden, und speichern Sie sie als Favorit.
2.  **Anbau starten:** Klicken Sie in einem leeren Slot im **Pflanzen**-Dashboard auf "Neuen Anbau starten", wählen Sie eine Sorte und konfigurieren Sie Ihr Setup.
3.  **Pflanzen verwalten:** Das **Pflanzen**-Dashboard ist Ihre Kommandozentrale. Die Simulation schreitet automatisch voran, wenn aktiviert. Klicken Sie auf eine Pflanze, um ihren detaillierten Status zu überprüfen und Aktionen zu protokollieren.
4.  **Lernen & Planen:** Nutzen Sie die Ansichten **Wissen** und **Ausrüstung**, um Ihr Verständnis zu vertiefen und Ihr reales Setup zu planen.
5.  **Befehlspalette nutzen:** Für den schnellsten Zugriff drücken Sie `Cmd/Strg + K`, um sofort zu navigieren oder Aktionen auszuführen.

---

## ⚠️ Haftungsausschluss

> Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und gesetzeskonform.

---

### Translation Keys
- `common.disclaimer.text`
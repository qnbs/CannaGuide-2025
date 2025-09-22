
# 🌿 Cannabis Grow Guide with Gemini

**Your AI-powered digital companion for the entire cannabis cultivation cycle.**

This advanced web application is designed to help both novice and experienced growers master their cultivation journey—from seed selection to a successful harvest and cure. Track your plants in a realistic simulation, learn about hundreds of strains, plan your equipment with AI-powered recommendations, and deepen your knowledge with our interactive step-by-step guide.

---

## Table of Contents

- [🚀 Key Features](#-key-features)
  - [1. The Strain Database (`Strains` View)](#1-the-strain-database-strains-view)
  - [2. The Grow Room (`Plants` View)](#2-the-grow-room-plants-view)
  - [3. The Workshop (`Equipment` View)](#3-the-workshop-equipment-view)
  - [4. The Library (`Knowledge` & `Help` Views)](#4-the-library-knowledge--help-views)
  - [5. The Control Panel (`Settings` View)](#5-the-control-panel-settings-view)
- [🤖 Development with AI Studio & Open Source](#-development-with-ai-studio--open-source)
- [💻 Tech Stack](#-tech-stack)
- [🏁 Getting Started](#-getting-started)
- [⚠️ Disclaimer](#️-disclaimer)
- [Deutsche Version (German Version)](#-cannabis-grow-guide-with-gemini-deutsch)

---

## 🚀 Key Features

This application is structured into several main views, each packed with powerful features to guide your cultivation journey.

### 1. The Strain Database (`Strains` View)

Your central library for cannabis knowledge, fully available offline and designed for deep exploration.

*   **Massive Library**: Access detailed information on over 300+ cannabis strains.
*   **Powerful Filtering & Sorting**:
    *   **Advanced Search**: Instantly find strains by name.
    *   **Comprehensive Filters**: Narrow down your search with a sophisticated filter modal, including THC/CBD content ranges, flowering time, difficulty level, strain type (Sativa, Indica, Hybrid), specific aromas, and dominant terpenes.
    *   **Flexible Sorting**: Organize the list by name, THC/CBD content, flowering time, and more, in ascending or descending order.
    *   **Favorites**: Toggle to view only your favorite strains.
*   **Dual View Modes**: Switch seamlessly between a detailed **List View** with configurable columns and a visually appealing **Grid View**.
*   **Full CRUD for Your Strains**: You have complete control over your personal strain collection.
    *   **Create**: Add your own custom strains using a detailed form that captures everything from genetics and cannabinoid profiles to agronomic data and descriptions.
    *   **Read**: View your custom strains alongside the main database.
    *   **Update**: Easily edit any information for the strains you've created.
    *   **Delete**: Remove your custom strains with a confirmation step.
*   **AI Grow Tips with CRUD Archive**:
    *   **Generate Tips**: Get unique, AI-powered cultivation advice tailored to any specific strain.
    *   **Manage Your Archive**: **Save**, **view**, **edit**, and **delete** these tips in a dedicated, searchable "Tips" archive.
*   **Professional Exporting & Management**:
    *   **Multiple Formats**: Export your strain data as a professional multi-page **PDF** report, a data-friendly **CSV** file, a simple **TXT** file, or a developer-friendly **JSON** file.
    *   **Flexible Sources**: Choose to export only selected strains, your favorites, the currently filtered list, or the entire database.
    *   **Full CRUD for Exports**: The "Exports" tab keeps a log of your past exports. **Re-download** any export, **edit** its name and add notes, or **delete** it from your history.

### 2. The Grow Room (`Plants` View)

Your command center for managing and simulating up to three simultaneous grows.

*   **Interactive Dashboard**:
    *   **Plant Slots**: Manage your active grows in three dedicated slots. An empty slot prompts you to start a new plant.
    *   **At-a-Glance Status**: Each `PlantCard` displays a visual representation of the plant, its current stage, age, height, and a health indicator for immediate feedback.
    *   **Garden Overview**: A summary panel shows your total active grows, open tasks, and an overall "Garden Health" score based on average plant stress.
    *   **Global Actions**: Use the "Water All" button to efficiently care for thirsty plants or the "Simulate Next Day" button to advance the simulation.
*   **AI-Powered Diagnostics**: Upload a photo of a leaf or problem area to get an instant AI-based diagnosis and recommended solution.
*   **Detailed Plant View**: Click on any plant to dive deep into its status.
    *   **Comprehensive Tabs**: Navigate between **Overview**, **Journal**, **Tasks**, **Photos**, and the **AI Advisor**.
    *   **Overview**: See a large plant visual, detailed vitals (pH, EC, moisture, stress) with ideal range indicators, a complete lifecycle timeline, and a historical chart of its growth and stress levels.
    *   **Journal**: A complete, filterable log of every action and event in the plant's life, from watering and feeding to system-generated stage changes and problem detections.
    *   **Photo Gallery**: The "Photos" tab provides a beautiful gallery view of all images you've logged in the journal.
*   **AI-Powered Plant Advisor with Full CRUD**:
    *   **Personalized Advice**: Get proactive, data-driven advice from Gemini AI based on your plant's current vitals, stage, and problems.
    *   **Plant-Specific Archive**: You have full **CRUD** control over the AI's advice for each plant. **Save**, **view**, **edit**, and **delete** recommendations to build a unique history of AI-guided care.
*   **Global Advisor Archive**: A dedicated view on the main dashboard that aggregates all saved AI advisor responses from all your past and present plants, creating a powerful, searchable knowledge base of your AI interactions.

### 3. The Workshop (`Equipment` View)

Plan and optimize your real-world grow setup with powerful tools.

*   **AI Setup Configurator**:
    *   **Guided Process**: A simple, step-by-step wizard asks for your plant count and desired configuration style (Standard, Medium, Premium).
    *   **Tailored Recommendations**: Gemini AI generates a complete, itemized equipment list with product suggestions, pricing estimates, and a rationale for each choice.
*   **Saved Setups with Full CRUD & Export**:
    *   **Save & Manage**: Save your generated setups for future reference.
    *   **Full Editing**: **Update** any saved setup by changing its name, swapping components, or adjusting prices.
    *   **Export**: Export your saved setups to PDF, CSV, TXT, or JSON for shopping or sharing.
    *   **Delete**: Remove old setups you no longer need.
*   **Essential Calculators**: A suite of tools to fine-tune your grow:
    *   **Ventilation**, **Lighting**, **Nutrients**, **Cost**, **EC/PPM Converter**, and a **Yield Estimator**.
*   **Curated Grow Shops**: A helpful guide listing reputable online grow shops in Europe and the USA, complete with descriptions, ratings, and strengths to help you source your gear.

### 4. The Library (`Knowledge` & `Help` Views)

Your complete resource for learning and problem-solving.

*   **Interactive Grow Guide**:
    *   **Step-by-Step Learning**: A guided journey through the five main phases of cultivation, from preparation to curing.
    *   **Progress Tracking**: Mark off checklist items in each phase to track your learning progress visually.
*   **AI Mentor with CRUD Archive**:
    *   **Ask Anything**: Pose any general growing question to the AI Mentor and receive a comprehensive, formatted answer.
    *   **Personal Knowledge Base**: You have full **CRUD** control over your mentor sessions. **Save**, **view**, **edit** (title and content), and **delete** responses to build your own curated knowledge database.
*   **Comprehensive Help Center**:
    *   **Getting Started & FAQ**: A detailed introduction to the app's features and an extensive, updated FAQ section to answer common questions.
    *   **In-Depth Lexicons**: Detailed, accordion-style glossaries covering **Cannabinoids**, **Terpenes**, and **Flavonoids** to deepen your scientific understanding.
    *   **Cultivation Guides**: Sections on agronomic basics, plant care, and advanced training techniques.

### 5. The Control Panel (`Settings` View)

Customize the app to your exact preferences and manage your data with confidence.

*   **Personalization**: Adjust the app's **language** (English/German), **theme**, and **font size**. Set your preferred default view on startup.
*   **Advanced Accessibility**: Enable **High Contrast Mode**, a **Dyslexia-Friendly Font**, or **Reduced Motion** for a tailored viewing experience.
*   **UI Density**: Switch between a spacious `Comfortable` layout or a data-rich `Compact` view.
*   **View Customization**: Configure the Strains View by setting a default sort order, view mode, and choosing which data columns are visible.
*   **Simulation Control**: Fine-tune the plant simulation with settings for speed, difficulty, and toggles for automatic background progression and journaling.
*   **Data Management**:
    *   **Full Backup & Restore**: Export *all* your app data (plants, settings, favorites, custom strains, archives) to a single JSON file. Import it later to restore your state on any device.
    *   **Reset Options**: Safely reset just your plants or perform a full factory reset of the entire application.

---

## 🤖 Development with AI Studio & Open Source

This application was developed entirely with **Google's AI Studio**, an innovative platform that enables the creation and modification of complex, feature-rich web applications through natural language commands. The entire process, from scaffolding the initial project to implementing complex features like the simulation engine and AI-powered tools, was driven by iterative prompts.

This project is also fully open source. You are welcome to review the source code, report issues, or contribute to development on GitHub.

*   **See how it was made or fork the project in AI Studio:** [https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-](https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-)
*   **Contribute or view the source code on GitHub:** [https://github.com/qnbs/Cannabis-Grow-Guide-2025](https://github.com/qnbs/Cannabis-Grow-Guide-2025)

---

## 💻 Tech Stack

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS
*   **AI Integration:** Google Gemini API (`@google/genai`)
*   **Data Persistence:** `localStorage`, `IndexedDB` (for images)
*   **PDF Generation:** `jsPDF` & `jsPDF-AutoTable`

---

## 🏁 Getting Started

No installation or setup is required. The application runs entirely in your web browser.

1.  **Discover Strains:** Start in the **Strains** view to browse the database. Use the filters and search bar to find a strain that interests you and save it as a favorite with the heart icon.
2.  **Start Growing:** From a strain's detail page, click "Start Growing" to configure your initial setup and add the new plant to your **Plants** dashboard.
3.  **Manage Plants:** The **Plants** view is your main dashboard. The simulation progresses automatically. Click on a plant to check its detailed status, log actions in its journal, and complete tasks to keep it healthy and stress-free.
4.  **Learn & Plan:** Use the **Knowledge** and **Equipment** views to deepen your understanding and plan your real-world setup with the AI configurator and calculators.
5.  **Use the Command Palette:** For quick access, press `Cmd/Ctrl + K` at any time to jump between sections or perform actions instantly.

---

## ⚠️ Disclaimer

> All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations that vary by country and region. Please inform yourself about the laws in your area and always act responsibly and in accordance with the law.

---
---

# 🌿 Cannabis Grow Guide with Gemini (Deutsch)

**Ihr KI-gestützter digitaler Begleiter für den gesamten Cannabis-Anbauzyklus.**

Diese fortschrittliche Webanwendung wurde entwickelt, um sowohl Anfängern als auch erfahrenen Züchtern zu helfen, ihre Anbaureise zu meistern – von der Samenauswahl bis zur erfolgreichen Ernte und Aushärtung. Verfolgen Sie Ihre Pflanzen in einer realistischen Simulation, lernen Sie alles über Hunderte von Sorten, planen Sie Ihre Ausrüstung mit KI-gestützten Empfehlungen und vertiefen Sie Ihr Wissen mit unserer interaktiven Schritt-für-Schritt-Anleitung.

---

## Inhaltsverzeichnis

- [🚀 Hauptfunktionen](#-hauptfunktionen-1)
  - [1. Die Sortendatenbank (Ansicht `Sorten`)](#1-die-sortendatenbank-ansicht-sorten)
  - [2. Der Grow Room (Ansicht `Pflanzen`)](#2-der-grow-room-ansicht-pflanzen)
  - [3. Die Werkstatt (Ansicht `Ausrüstung`)](#3-die-werkstatt-ansicht-ausrüstung)
  - [4. Die Bibliothek (Ansichten `Wissen` & `Hilfe`)](#4-die-bibliothek-ansichten-wissen--hilfe)
  - [5. Das Kontrollzentrum (Ansicht `Einstellungen`)](#5-das-kontrollzentrum-ansicht-einstellungen)
- [🤖 Entwicklung mit AI Studio & Open Source](#-entwicklung-mit-ai-studio--open-source-1)
- [💻 Technologiestapel](#-technologiestapel-1)
- [🏁 Erste Schritte](#-erste-schritte-1)
- [⚠️ Haftungsausschluss](#️-haftungsausschluss-1)

---

## 🚀 Hauptfunktionen

Diese Anwendung ist in mehrere Hauptansichten gegliedert, die jeweils mit leistungsstarken Funktionen ausgestattet sind, um Sie auf Ihrer Anbaureise zu begleiten.

### 1. Die Sortendatenbank (Ansicht `Sorten`)

Ihre zentrale Bibliothek für Cannabis-Wissen, vollständig offline verfügbar und für tiefgehende Erkundungen konzipiert.

*   **Riesige Bibliothek**: Greifen Sie auf detaillierte Informationen zu über 300+ Cannabissorten zu.
*   **Leistungsstarke Filter & Sortierung**:
    *   **Erweiterte Suche**: Finden Sie Sorten sofort nach Namen.
    *   **Umfassende Filter**: Grenzen Sie Ihre Suche mit einem anspruchsvollen Filter-Modal ein, einschließlich THC/CBD-Gehaltsbereichen, Blütezeit, Schwierigkeitsgrad, Sortentyp (Sativa, Indica, Hybrid), spezifischen Aromen und dominanten Terpenen.
    *   **Flexible Sortierung**: Organisieren Sie die Liste nach Name, THC/CBD-Gehalt, Blütezeit und mehr, in auf- oder absteigender Reihenfolge.
    *   **Favoriten**: Schalten Sie um, um nur Ihre Lieblingssorten anzuzeigen.
*   **Duale Ansichtsmodi**: Wechseln Sie nahtlos zwischen einer detaillierten **Listenansicht** mit konfigurierbaren Spalten und einer visuell ansprechenden **Rasteransicht**.
*   **Volle CRUD für Ihre Sorten**: Sie haben die vollständige Kontrolle über Ihre persönliche Sortensammlung.
    *   **Erstellen**: Fügen Sie Ihre eigenen Sorten mit einem detaillierten Formular hinzu, das alles von der Genetik und den Cannabinoidprofilen bis hin zu agronomischen Daten und Beschreibungen erfasst.
    *   **Lesen**: Sehen Sie Ihre benutzerdefinierten Sorten neben der Hauptdatenbank an.
    *   **Aktualisieren**: Bearbeiten Sie ganz einfach alle Informationen für die von Ihnen erstellten Sorten.
    *   **Löschen**: Entfernen Sie Ihre benutzerdefinierten Sorten nach einer Bestätigung.
*   **KI-Anbau-Tipps mit CRUD-Archiv**:
    *   **Tipps generieren**: Erhalten Sie einzigartige, KI-gestützte Anbauratschläge, die auf eine bestimmte Sorte zugeschnitten sind.
    *   **Archiv verwalten**: **Speichern**, **ansehen**, **bearbeiten** und **löschen** Sie diese Tipps in einem dedizierten, durchsuchbaren "Tipps"-Archiv.
*   **Professioneller Export & Verwaltung**:
    *   **Mehrere Formate**: Exportieren Sie Ihre Sortendaten als professionellen, mehrseitigen **PDF**-Bericht, eine datenfreundliche **CSV**-Datei, eine einfache **TXT**-Datei oder eine entwicklerfreundliche **JSON**-Datei.
    *   **Flexible Quellen**: Wählen Sie, ob Sie nur ausgewählte Sorten, Ihre Favoriten, die aktuell gefilterte Liste oder die gesamte Datenbank exportieren möchten.
    *   **Volle CRUD für Exporte**: Der "Exporte"-Tab speichert ein Protokoll Ihrer letzten Exporte. **Laden Sie jeden Export erneut herunter**, **bearbeiten** Sie seinen Namen und fügen Sie Notizen hinzu oder **löschen** Sie ihn aus Ihrem Verlauf.

### 2. Der Grow Room (Ansicht `Pflanzen`)

Ihre Kommandozentrale zur Verwaltung und Simulation von bis zu drei gleichzeitigen Grows.

*   **Interaktives Dashboard**:
    *   **Pflanzen-Slots**: Verwalten Sie Ihre aktiven Grows in drei dedizierten Slots. Ein leerer Slot fordert Sie auf, eine neue Pflanze zu starten.
    *   **Status auf einen Blick**: Jede `Pflanzenkarte` zeigt eine visuelle Darstellung der Pflanze, ihre aktuelle Phase, ihr Alter, ihre Höhe und einen Gesundheitsindikator für sofortiges Feedback.
    *   **Gartenübersicht**: Ein zusammenfassendes Panel zeigt Ihre gesamten aktiven Grows, offene Aufgaben und eine allgemeine "Gartengesundheit"-Punktzahl basierend auf dem durchschnittlichen Pflanzenstress.
    *   **Globale Aktionen**: Verwenden Sie die "Alle gießen"-Schaltfläche, um durstige Pflanzen effizient zu versorgen, oder die "Nächster Tag"-Schaltfläche, um die Simulation voranzutreiben.
*   **KI-gestützte Diagnose**: Laden Sie ein Foto eines Blattes oder einer Problemzone hoch, um eine sofortige KI-basierte Diagnose und eine empfohlene Lösung zu erhalten.
*   **Detaillierte Pflanzenansicht**: Klicken Sie auf eine Pflanze, um tief in ihren Status einzutauchen.
    *   **Umfassende Tabs**: Navigieren Sie zwischen **Übersicht**, **Journal**, **Aufgaben**, **Fotos** und dem **KI-Berater**.
    *   **Übersicht**: Sehen Sie eine große Pflanzenvisualisierung, detaillierte Vitalwerte (pH, EC, Feuchtigkeit, Stress) mit Idealbereichsindikatoren, eine vollständige Lebenszyklus-Zeitleiste und ein historisches Diagramm ihres Wachstums und ihrer Stresslevel.
    *   **Journal**: Ein vollständiges, filterbares Protokoll jeder Aktion und jedes Ereignisses im Leben der Pflanze, vom Gießen und Düngen bis hin zu systemgenerierten Phasenwechseln und Problemerkennungen.
    *   **Fotogalerie**: Der "Fotos"-Tab bietet eine schöne Galerieansicht aller Bilder, die Sie im Journal protokolliert haben.
*   **KI-gestützter Pflanzenberater mit voller CRUD-Funktionalität**:
    *   **Personalisierte Ratschläge**: Erhalten Sie proaktive, datengestützte Ratschläge von der Gemini-KI basierend auf den aktuellen Vitalwerten, der Phase und den Problemen Ihrer Pflanze.
    *   **Pflanzenspezifisches Archiv**: Sie haben die volle **CRUD**-Kontrolle über die Ratschläge der KI für jede Pflanze. **Speichern**, **ansehen**, **bearbeiten** und **löschen** Sie Empfehlungen, um eine einzigartige Historie der KI-geführten Pflege aufzubauen.
*   **Globales Berater-Archiv**: Eine dedizierte Ansicht auf dem Haupt-Dashboard, die alle gespeicherten KI-Berater-Antworten von all Ihren vergangenen und gegenwärtigen Pflanzen zusammenfasst und so eine leistungsstarke, durchsuchbare Wissensdatenbank Ihrer KI-Interaktionen erstellt.

### 3. Die Werkstatt (Ansicht `Ausrüstung`)

Planen und optimieren Sie Ihr reales Grow-Setup mit leistungsstarken Werkzeugen.

*   **KI-Setup-Konfigurator**:
    *   **Geführter Prozess**: Ein einfacher Schritt-für-Schritt-Assistent fragt nach Ihrer Pflanzenanzahl und dem gewünschten Konfigurationsstil (Standard, Medium, Premium).
    *   **Maßgeschneiderte Empfehlungen**: Die Gemini-KI generiert eine vollständige, detaillierte Ausrüstungsliste mit Produktvorschlägen, Preisschätzungen und einer Begründung für jede Wahl.
*   **Gespeicherte Setups mit voller CRUD-Funktionalität & Export**:
    *   **Speichern & Verwalten**: Speichern Sie Ihre generierten Setups zur späteren Verwendung.
    *   **Vollständige Bearbeitung**: **Aktualisieren** Sie jedes gespeicherte Setup, indem Sie den Namen ändern, Komponenten austauschen oder Preise anpassen.
    *   **Exportieren**: Exportieren Sie Ihre gespeicherten Setups als PDF, CSV, TXT oder JSON zum Einkaufen oder Teilen.
    *   **Löschen**: Entfernen Sie alte Setups, die Sie nicht mehr benötigen.
*   **Essentielle Rechner**: Eine Reihe von Werkzeugen zur Feinabstimmung Ihres Grows:
    *   **Belüftung**, **Beleuchtung**, **Nährstoffe**, **Kosten**, **EC/PPM-Umrechner** und ein **Ertragsschätzer**.
*   **Kuratierte Grow-Shops**: Ein hilfreicher Leitfaden, der seriöse Online-Grow-Shops in Europa und den USA auflistet, komplett mit Beschreibungen, Bewertungen und Stärken, um Ihnen bei der Beschaffung Ihrer Ausrüstung zu helfen.

### 4. Die Bibliothek (Ansichten `Wissen` & `Hilfe`)

Ihre vollständige Ressource zum Lernen und zur Problemlösung.

*   **Interaktiver Grow-Guide**:
    *   **Schritt-für-Schritt-Lernen**: Eine geführte Reise durch die fünf Hauptphasen des Anbaus, von der Vorbereitung bis zum Curing.
    *   **Fortschrittsverfolgung**: Haken Sie Checklistenpunkte in jeder Phase ab, um Ihren Lernfortschritt visuell zu verfolgen.
*   **KI-Mentor mit CRUD-Archiv**:
    *   **Fragen Sie alles**: Stellen Sie dem KI-Mentor eine beliebige allgemeine Anbaufrage und erhalten Sie eine umfassende, formatierte Antwort.
    *   **Persönliche Wissensdatenbank**: Sie haben die volle **CRUD**-Kontrolle über Ihre Mentor-Sitzungen. **Speichern**, **ansehen**, **bearbeiten** (Titel und Inhalt) und **löschen** Sie Antworten, um Ihre eigene kuratierte Wissensdatenbank aufzubauen.
*   **Umfassendes Hilfecenter**:
    *   **Erste Schritte & FAQ**: Eine detaillierte Einführung in die Funktionen der App und ein umfangreicher, aktualisierter FAQ-Bereich zur Beantwortung häufiger Fragen.
    *   **Tiefgehende Lexika**: Detaillierte Glossare im Akkordeon-Stil zu **Cannabinoiden**, **Terpenen** und **Flavonoiden**, um Ihr wissenschaftliches Verständnis zu vertiefen.
    *   **Anbauleitfäden**: Abschnitte zu agronomischen Grundlagen, Pflanzenpflege und fortgeschrittenen Trainingstechniken.

### 5. Das Kontrollzentrum (Ansicht `Einstellungen`)

Passen Sie die App an Ihre genauen Vorlieben an und verwalten Sie Ihre Daten mit Zuversicht.

*   **Personalisierung**: Passen Sie die **Sprache** (Englisch/Deutsch), das **Thema** und die **Schriftgröße** der App an. Legen Sie Ihre bevorzugte Standardansicht beim Start fest.
*   **Erweiterte Barrierefreiheit**: Aktivieren Sie einen **Hochkontrastmodus**, eine **Legastheniker-freundliche Schriftart** oder **Reduzierte Bewegung** für ein maßgeschneidertes Seherlebnis.
*   **UI-Dichte**: Wechseln Sie zwischen einem geräumigen `Komfortablen` Layout oder einer datenreichen `Kompakten` Ansicht.
*   **Ansichtsanpassung**: Konfigurieren Sie die Sortenansicht, indem Sie eine Standard-Sortierreihenfolge, einen Ansichtsmodus und die sichtbaren Datenspalten festlegen.
*   **Simulationssteuerung**: Feinabstimmung der Pflanzensimulation mit Einstellungen für Geschwindigkeit, Schwierigkeit und Schaltern für den automatischen Hintergrundfortschritt und das Journaling.
*   **Datenverwaltung**:
    *   **Vollständiges Backup & Wiederherstellung**: Exportieren Sie *alle* Ihre App-Daten (Pflanzen, Einstellungen, Favoriten, benutzerdefinierte Sorten, Archive) in eine einzige JSON-Datei. Importieren Sie sie später, um Ihren Zustand auf jedem Gerät wiederherzustellen.
    *   **Zurücksetzungsoptionen**: Setzen Sie sicher nur Ihre Pflanzen zurück oder führen Sie einen vollständigen Werksreset der gesamten Anwendung durch.

---

## 🤖 Entwicklung mit AI Studio & Open Source

Diese Anwendung wurde vollständig mit **Googles AI Studio** entwickelt, einer innovativen Plattform, die die Erstellung und Änderung komplexer, funktionsreicher Webanwendungen durch Befehle in natürlicher Sprache ermöglicht. Der gesamte Prozess, vom Aufbau des initialen Projekts bis zur Implementierung komplexer Funktionen wie der Simulations-Engine und den KI-gestützten Werkzeugen, wurde durch iterative Prompts gesteuert.

Dieses Projekt ist zudem vollständig Open Source. Sie sind herzlich eingeladen, den Quellcode einzusehen, Fehler zu melden oder auf GitHub zur Entwicklung beizutragen.

*   **Sehen Sie, wie es gemacht wurde, oder forken Sie das Projekt in AI Studio:** [https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-](https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-)
*   **Tragen Sie bei oder sehen Sie den Quellcode auf GitHub ein:** [https://github.com/qnbs/Cannabis-Grow-Guide-2025](https://github.com/qnbs/Cannabis-Grow-Guide-2025)

---

## 💻 Technologiestapel

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS
*   **KI-Integration:** Google Gemini API (`@google/genai`)
*   **Datenpersistenz:** `localStorage`, `IndexedDB` (für Bilder)
*   **PDF-Generierung:** `jsPDF` & `jsPDF-AutoTable`

---

## 🏁 Erste Schritte

Es ist keine Installation oder Einrichtung erforderlich. Die Anwendung läuft vollständig in Ihrem Webbrowser.

1.  **Sorten entdecken:** Beginnen Sie in der **Sorten**-Ansicht, um die Datenbank zu durchsuchen. Verwenden Sie die Filter und die Suchleiste, um eine Sorte zu finden, die Sie interessiert, und speichern Sie sie mit dem Herz-Symbol als Favorit.
2.  **Anbau starten:** Klicken Sie auf der Detailseite einer Sorte auf "Anbau starten", um Ihr initiales Setup zu konfigurieren und die neue Pflanze Ihrem **Pflanzen**-Dashboard hinzuzufügen.
3.  **Pflanzen verwalten:** Die **Pflanzen**-Ansicht ist Ihr Haupt-Dashboard. Die Simulation schreitet automatisch voran. Klicken Sie auf eine Pflanze, um ihren detaillierten Status zu überprüfen, Aktionen in ihrem Journal zu protokollieren und Aufgaben zu erledigen, um sie gesund und stressfrei zu halten.
4.  **Lernen und Planen:** Nutzen Sie die Ansichten **Wissen** und **Ausrüstung**, um Ihr Verständnis zu vertiefen und Ihr reales Setup mit dem KI-Konfigurator und den Rechnern zu planen.
5.  **Befehlspalette nutzen:** Für einen schnellen Zugriff drücken Sie jederzeit `Cmd/Strg + K`, um zwischen den Bereichen zu springen oder Aktionen sofort auszuführen.

---

## ⚠️ Haftungsausschluss

> Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen, die je nach Land und Region variieren. Bitte informieren Sie sich über die Gesetze in Ihrer Gegend und handeln Sie stets verantwortungsbewusst und gesetzeskonform.

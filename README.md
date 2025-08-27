
# Cannabis Grow Guide 2025

![Cannabis Grow Guide Banner](https://raw.githubusercontent.com/user-attachments/assets/5195b05a-2933-40a2-b91c-99a343ec2d17)

Willkommen beim **Cannabis Grow Guide 2025**, Ihrem interaktiven digitalen Begleiter für den gesamten Cannabis-Anbauzyklus. Diese fortschrittliche Webanwendung wurde entwickelt, um sowohl Anfängern als auch erfahrenen Züchtern zu helfen, ihre Anbau-Reise von der Auswahl des Samens bis zur erfolgreichen Ernte und Veredelung zu meistern.

Verfolgen Sie Ihre Pflanzen in einer realitätsnahen Simulation, lernen Sie alles über Hunderte von Sorten, planen Sie Ihre Ausrüstung mit KI-gestützten Empfehlungen und vertiefen Sie Ihr Wissen mit unserer interaktiven Schritt-für-Schritt-Anleitung.

---

## ✨ Hauptfunktionen

Die App ist in mehrere Kernbereiche unterteilt, um eine intuitive und umfassende Erfahrung zu gewährleisten:

### 🌿 **Sorten-Datenbank (Strains)**
- **Umfassende Bibliothek:** Entdecken Sie Hunderte von Cannabissorten mit detaillierten Informationen zu Genetik, THC/CBD-Gehalt, Blütezeit, Aroma und agronomischen Daten.
- **Erweiterte Filter & Suche:** Finden Sie die perfekte Sorte mit leistungsstarken Filteroptionen für Typ, THC-Gehalt, Schwierigkeit, Blütezeit, Aroma und mehr.
- **Personalisierung:** Speichern Sie Ihre Lieblingssorten, fügen Sie eigene, benutzerdefinierte Sorten hinzu und verwalten Sie Ihre Sammlung.
- **Datenexport:** Exportieren Sie ausgewählte, gefilterte oder alle Sortenlisten als **JSON**, **CSV** oder professionell formatiertes **PDF**. Verwalten Sie Ihre Exporthistorie.

### 🌱 **Pflanzen-Management (Plants)**
- **Grow-Dashboard:** Verwalten Sie bis zu drei Pflanzen gleichzeitig in einer übersichtlichen Dashboard-Ansicht.
- **Dynamische Simulation:** Beobachten Sie das Wachstum Ihrer Pflanzen in Echtzeit. Die Simulation berücksichtigt Sorte, Alter, Stressfaktoren und Ihre Pflegemaßnahmen.
- **Detailansicht:** Tauchen Sie tief in die Daten jeder Pflanze ein – mit detaillierten Vitalwerten (pH, EC, Feuchtigkeit), Umgebungsbedingungen, Wachstumshistorie in Diagrammen und einer interaktiven Lebenszyklus-Zeitleiste.
- **Journal & Aufgaben:** Führen Sie ein detailliertes Anbau-Tagebuch für jede Pflanze. Protokollieren Sie Gießen, Düngen, Training und Beobachtungen. Ein intelligentes System generiert automatisch Aufgaben, wenn Probleme erkannt werden.
- **KI-Berater:** Erhalten Sie auf Basis der Echtzeit-Daten Ihrer Pflanze intelligente Analysen und Handlungsempfehlungen von der integrierten KI.

### 🛠️ **Ausrüstungs-Planer (Equipment)**
- **KI-Setup-Konfigurator:** Lassen Sie sich in nur drei Schritten (Fläche, Stil, Budget) ein komplettes, auf Sie zugeschnittenes Anbau-Setup empfehlen.
- **Praktische Rechner:** Nutzen Sie integrierte Tools zur Berechnung der optimalen Lüfterleistung, der benötigten LED-Wattzahl oder der korrekten Düngermenge.
- **Ausrüstung & Shops:** Erhalten Sie eine kuratierte Liste essenzieller Ausrüstungsgegenstände und empfohlener Online-Shops.

### 🎓 **Wissensdatenbank (Knowledge)**
- **Interaktiver Grow-Guide:** Folgen Sie einer umfassenden Schritt-für-Schritt-Anleitung, die Sie von der Vorbereitung über die Keimung, das Wachstum, die Blüte bis hin zur Ernte und Veredelung (Curing) führt.
- **Fortschritts-Tracking:** Haken Sie erledigte Aufgaben in Checklisten ab und verfolgen Sie Ihren Lernfortschritt visuell.
- **Profi-Tipps:** Entdecken Sie in jeder Phase wertvolle Tipps und Tricks, um die Qualität und den Ertrag Ihrer Ernte zu maximieren.

### ❓ **Hilfe-Center & Lexikon (Help)**
- **Umfassende Lexika:** Vertiefen Sie Ihr Wissen mit detaillierten Erklärungen zu Cannabinoiden, Terpenen, Flavonoiden und agronomischen Grundlagen.
- **Pflanzenpflege-ABC:** Ein Nachschlagewerk für häufige Probleme, Nährstoffmängel und fortgeschrittene Trainingstechniken.
- **FAQ & Glossar:** Finden Sie schnelle Antworten auf häufig gestellte Fragen und lernen Sie die wichtigsten Fachbegriffe kennen.

---

## 💻 Technologie-Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS mit einem benutzerdefinierten Design-System für Light- & Dark-Mode.
- **Datenvisualisierung:** Benutzerdefinierte, performante SVG-Komponenten für Pflanzendarstellung und Verlaufsdiagramme.
- **Datenexport:** `jspdf` & `jspdf-autotable` für die Erstellung von PDF-Dokumenten.
- **State Management:** React Hooks (`useState`, `useEffect`, `useContext`) und benutzerdefinierte Hooks für eine saubere und reaktive Zustandsverwaltung.
- **KI-Integration:** Konzipiert für die **Google Gemini API** (aktuell mit einem Mock-Service implementiert).
- **Lokale Speicherung:** Alle Benutzerdaten werden sicher und privat im `localStorage` des Browsers gespeichert. Es findet kein Datentransfer zu einem Server statt.

---

## 🚀 Ausführung und Bereitstellung

Dieses Repository enthält alles, was Sie benötigen, um die App lokal auszuführen.

**App in AI Studio ansehen:** [https://ai.studio/apps/drive/1xTLNTrer4qHP5EmMXjZmbxGuKVWDvnPQ](https://ai.studio/apps/drive/1xTLNTrer4qHP5EmMXjZmbxGuKVWDvnPQ)

### Lokale Ausführung

Diese App ist als modernes Webprojekt ohne Build-Schritt konzipiert. Sie verwendet ES-Module und ein `importmap`, um Abhängigkeiten direkt im Browser zu laden. Sie benötigen daher **kein `npm install`**.

**Voraussetzungen:**
*   Ein beliebiger lokaler Webserver.

**Schritte zur Ausführung:**

1.  **Klonen Sie das Repository** (oder laden Sie die Dateien herunter).

2.  **Starten Sie einen lokalen Webserver** im Hauptverzeichnis des Projekts. Hier sind einige einfache Optionen:

    *   **Mit Python (falls installiert):**
        ```bash
        # Für Python 3
        python -m http.server
        ```

    *   **Mit Node.js (falls `npx` verfügbar ist):**
        ```bash
        npx serve
        ```
        
    *   **Mit VS Code:** Installieren Sie die beliebte Erweiterung **"Live Server"** und klicken Sie unten rechts auf "Go Live".

3.  **Öffnen Sie die App im Browser:**
    Navigieren Sie zu der Adresse, die Ihr Webserver anzeigt (z. B. `http://localhost:8000` oder `http://localhost:3000`).

#### Hinweis zum Gemini API-Schlüssel

-   Die aktuelle Version der App verwendet einen **simulierten (gemockten) Gemini-Dienst** (`services/geminiService.ts`), sodass für die lokale Ausführung **kein API-Schlüssel erforderlich ist**.
-   Für eine echte Integration mit der Google Gemini API erwartet die Anwendung, dass der API-Schlüssel als Umgebungsvariable `process.env.API_KEY` bereitgestellt wird. Dies wird typischerweise von der Bereitstellungsumgebung (wie Google AI Studio) gehandhabt.

---

## 📂 Projektstruktur

Die Codebasis ist modular und nach Funktionen organisiert, um eine einfache Wartung und Erweiterbarkeit zu gewährleisten:

```
/
├── components/       # Wiederverwendbare React-Komponenten
│   ├── common/       # Allgemeine UI-Elemente (Button, Card, etc.)
│   ├── icons/        # SVG-Icon-Komponenten
│   ├── navigation/   # Navigationskomponenten (z.B. BottomNav)
│   └── views/        # Hauptkomponenten für jede Ansicht (Strains, Plants, etc.)
├── constants.ts      # App-weite Konstanten (z.B. Pflanzen-Stadien)
├── context/          # React Context Provider (Settings, Notifications)
├── data/             # Statische Daten (z.B. Sorten-Informationen)
├── hooks/            # Benutzerdefinierte React Hooks (z.B. usePlantManager)
├── services/         # Dienste für externe Logik (z.B. Gemini API, Export)
├── types.ts          # TypeScript-Typdefinitionen
├── App.tsx           # Haupt-App-Komponente und Routing
├── index.html        # Einstiegspunkt der App
└── index.tsx         # React-Initialisierung
```

---

## ⚖️ Haftungsausschluss

Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Regelungen, die von Land zu Land unterschiedlich sind. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und gesetzeskonform.

---

## 📜 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

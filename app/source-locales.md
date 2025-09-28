
# CannaGuide 2025 - Source Code Documentation (Part 6: Internationalization & Locales)

This document provides the complete source code for all internationalization (i18n) and locale files used in the CannaGuide 2025 application. The app supports English and German, with a modular structure that separates translations by feature for better maintainability.

---

## 1. Main Locale Aggregators

These files gather all the specific translation files for each language into a single exportable object.

### `/locales/index.ts`

**Purpose:** The main entry point for all locale data. It imports and re-exports the `en` and `de` translation objects.

```typescript
import { de } from '@/locales/de/index';
import { en } from '@/locales/en/index';

export { de, en };

export type Locale = 'en' | 'de';

export const locales: Record<Locale, any> = {
  en,
  de,
};
```

### `/locales/de/index.ts`

**Purpose:** Aggregates all German (`de`) translation modules into a single `de` object for use with `i18next`.

```typescript
import { common, nav, plantStages, problemMessages, ai } from './common';
import { commandPalette } from './commandPalette';
import { equipmentView } from './equipment';
import { helpView } from './help';
import { knowledgeView, tipOfTheDay } from './knowledge';
import { onboarding } from './onboarding';
import { plantsView } from './plants';
import { settingsView } from './settings';
import { strainsView } from './strains';
import { strainsData } from './strainsData';


export const de = {
  common,
  nav,
  plantStages,
  problemMessages,
  ai,
  commandPalette,
  equipmentView,
  helpView,
  knowledgeView,
  onboarding,
  plantsView,
  settingsView,
  strainsView,
  strainsData,
  tipOfTheDay,
};
```

### `/locales/en/index.ts`

**Purpose:** Aggregates all English (`en`) translation modules into a single `en` object for use with `i18next`.

```typescript
import { common, nav, plantStages, problemMessages, ai } from './common';
import { commandPalette } from './commandPalette';
import { equipmentView } from './equipment';
import { helpView } from './help';
import { knowledgeView, tipOfTheDay } from './knowledge';
import { onboarding } from './onboarding';
import { plantsView } from './plants';
import { settingsView } from './settings';
import { strainsView } from './strains';
import { strainsData } from './strainsData';

export const en = {
  common,
  nav,
  plantStages,
  problemMessages,
  ai,
  commandPalette,
  equipmentView,
  helpView,
  knowledgeView,
  onboarding,
  plantsView,
  settingsView,
  strainsView,
  strainsData,
  tipOfTheDay,
};
```

---

## 2. German (`de`) Translation Files

This section contains all the individual files for the German language translations.

### `/locales/de/common.ts`

```typescript
export const common = {
  add: 'Hinzufügen',
  all: 'Alle',
  apply: 'Anwenden',
  back: 'Zurück',
  cancel: 'Abbrechen',
  close: 'Schließen',
  confirm: 'Bestätigen',
  delete: 'Löschen',
  details: 'Details',
  downloadAgain: 'Erneut herunterladen',
  edit: 'Bearbeiten',
  export: 'Exportieren',
  exportError: 'Export fehlgeschlagen. Bitte versuche es erneut.',
  genetics: 'Genetik',
  inspect: 'Inspizieren',
  name: 'Name',
  next: 'Weiter',
  noDataToExport: 'Keine Daten zum Exportieren vorhanden.',
  notes: 'Notizen',
  save: 'Speichern',
  select: 'Auswählen',
  start: 'Starten',
  style: 'Stil',
  successfullyExported_one: '1 Eintrag erfolgreich als {format} exportiert.',
  successfullyExported_other: '{{count}} Einträge erfolgreich als {format} exportiert.',
  type: 'Typ',
  typeDetails: 'Typ-Details',
  why: 'Warum?',
  days: 'Tage',
  hours: 'Stunden',
  minutes: 'Min',
  seconds: 'Sek',
  description: 'Beschreibung',
  actions: 'Aktionen',
  error: 'Fehler',
  offlineWarning: 'Du bist offline. Einige Funktionen könnten eingeschränkt sein.',
  installPwa: 'App installieren',
  installed: 'Installiert',
  installPwaDescription: 'Installiere diese Anwendung auf deinem Gerät für schnellen Zugriff und eine Offline-Erfahrung.',
  installPwaSuccess: 'App erfolgreich installiert!',
  installPwaDismissed: 'Installation abgelehnt.',
  removeImage: 'Bild entfernen',
  deleteResponse: 'Antwort löschen',
  deleteSetup: 'Setup löschen',
  page: 'Seite',
  generated: 'Erstellt',
  for: 'Für:',
  moreActions: 'Weitere Aktionen',
  loadMore: 'Mehr laden',
  learnMore: 'Mehr erfahren',
  deepDive: 'Deep Dive',
  stage: 'Phase',
  temperature: 'Temperatur',
  humidity: 'Luftfeuchtigkeit',
  vpd: 'VPD',
  co2Level: 'CO₂-Level',
  moisture: 'Feuchtigkeit',
  units: {
    cm: 'cm',
    ml: 'ml',
    L: 'L',
    g: 'g',
    ms_cm: 'mS/cm',
    percent: '%',
    days: 'Tage',
    weeks: 'Wochen',
    watt: 'W',
    h_day: 'h/Tag',
    kwh: 'kWh',
    ppm: 'ppm',
    g_w: 'g/W',
    celsius: '°C',
    m3_h: 'm³/h',
    price_kwh: '€/kWh',
    ml_l: 'ml/L',
    currency_eur: '€'
  },
  terpenes: {
    "Myrcene": "Myrcen",
    "Caryophyllene": "Caryophyllen",
    "Limonene": "Limonen",
    "Pinene": "Pinen",
    "Linalool": "Linalool",
    "Terpinolene": "Terpinolen",
    "Humulene": "Humulen",
    "Ocimene": "Ocimen",
    "Bisabolol": "Bisabolol",
    "Nerolidol": "Nerolidol"
  },
  aromas: {
    "Sweet": "Süß",
    "Earthy": "Erdig",
    "Pine": "Kiefer",
    "Spicy": "Würzig",
    "Skunk": "Skunk",
    "Citrus": "Zitrus",
    "Tropical": "Tropisch",
    "Fruity": "Fruchtig",
    "Woody": "Holzig",
    "Herbal": "Kräuterig",
    "Floral": "Blumig",
    "Peppery": "Pfeffrig",
    "Diesel": "Diesel",
    "Pungent": "Scharf",
    "Vanilla": "Vanille",
    "Coffee": "Kaffee",
    "Chocolate": "Schokolade",
    "Mint": "Minze",
    "Grape": "Traube",
    "Berry": "Beere",
    "Ammonia": "Ammoniak",
    "Chemical": "Chemisch",
    "Honey": "Honig",
    "Menthol": "Menthol",
    "Nutty": "Nussig",
    "Anise": "Anis",
    "Bubblegum": "Kaugummi",
    "Butter": "Butter",
    "Cheese": "Käse",
    "Cherry": "Kirsche",
    "Creamy": "Cremig",
    "Grapefruit": "Grapefruit",
    "Lavender": "Lavendel",
    "Lemon": "Zitrone",
    "Lime": "Limette",
    "Mango": "Mango",
    "Melon": "Melone",
    "Orange": "Orange",
    "Papaya": "Papaya",
    "Peach": "Pfirsich",
    "Pineapple": "Ananas",
    "Raspberry": "Himbeere",
    "Strawberry": "Erdbeere",
    "Apricot": "Aprikose",
    "Apple": "Apfel",
    "Guava": "Guave",
    "Glue": "Klebstoff",
    "Meaty": "Fleischig",
    "Cookie": "Keks",
    "Hash": "Haschisch",
    "Incense": "Weihrauch",
    "Licorice": "Lakritz",
    "Clean": "Sauber",
    "Metallic": "Metallisch",
    "Sage": "Salbei",
    "Cedar": "Zeder",
    "Eucalyptus": "Eukalyptus",
    "Candy": "Bonbon"
  },
   tts: {
    play: 'Abspielen',
    pause: 'Pause',
    stop: 'Stopp',
    next: 'Nächster',
    readThis: 'Diesen Text vorlesen',
  },
  preparingGuide: 'Dein Guide wird vorbereitet...',
  capturedImageAlt: 'Vorschau des aufgenommenen Bildes',
  ppfd: 'PPFD',
  dli: 'DLI',
  height: 'Höhe',
  biomass: 'Biomasse',
  stress: 'Stress',
  unchanged: 'Unverändert',
  runningSimulation: 'Beschleunigte Simulation wird ausgeführt...',
  amountMl: 'Menge (ml)',
  ph: 'pH',
  ec: 'EC',
  notesPlaceholder: 'Notizen...',
  photoOnDay: 'Foto an Tag {day}',
  saveFailed: 'Speichern des Bildes fehlgeschlagen',
  saveToJournal: 'Im Journal speichern',
  manageFavorites: 'Favoriten verwalten',
  health: 'Gesundheit',
  disclaimer: {
    text: 'Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informiere dich über die Gesetze in deiner Region und handle stets verantwortungsbewusst und gesetzeskonform.'
  }
};

export const nav = {
  strains: 'Sorten',
  plants: 'Pflanzen',
  equipment: 'Ausrüstung',
  knowledge: 'Wissen',
  settings: 'Einstellungen',
  help: 'Hilfe',
};

export const plantStages = {
  SEED: 'Samen',
  GERMINATION: 'Keimung',
  SEEDLING: 'Sämling',
  VEGETATIVE: 'Wachstum',
  FLOWERING: 'Blüte',
  HARVEST: 'Ernte',
  DRYING: 'Trocknung',
  CURING: 'Curing',
  FINISHED: 'Fertig',
};

export const problemMessages = {
    overwatering: { message: 'Überwässerung erkannt', solution: 'Weniger häufig gießen und sicherstellen, dass der Topf eine gute Drainage hat.' },
    underwatering: { message: 'Unterwässerung erkannt', solution: 'Pflanze gründlich gießen, bis Wasser unten aus dem Topf austritt.' },
    nutrientBurn: { message: 'Nährstoffverbrennung', solution: 'EC-Wert reduzieren und mit pH-neutralem Wasser spülen.' },
    nutrientDeficiency: { message: 'Nährstoffmangel', solution: 'Düngung gemäß Schema erhöhen und auf den pH-Wert achten.' },
    phTooLow: { message: 'pH-Wert zu niedrig', solution: 'Wasser mit pH-Up anpassen, um den Wert in den idealen Bereich zu bringen.' },
    phTooHigh: { message: 'pH-Wert zu hoch', solution: 'Wasser mit pH-Down anpassen, um den Wert in den idealen Bereich zu bringen.' },
    tempTooHigh: { message: 'Temperatur zu hoch', solution: 'Abluft erhöhen, für mehr Luftzirkulation sorgen oder Licht dimmen/anheben.' },
    tempTooLow: { message: 'Temperatur zu niedrig', solution: 'Heizmatte verwenden oder Raumtemperatur erhöhen.' },
    humidityTooHigh: { message: 'Luftfeuchtigkeit zu hoch', solution: 'Abluft erhöhen und ggf. einen Luftentfeuchter verwenden.' },
    humidityTooLow: { message: 'Luftfeuchtigkeit zu niedrig', solution: 'Luftbefeuchter verwenden oder nasse Handtücher aufhängen.' },
    vpdTooLow: { message: 'VPD zu niedrig (zu feucht)', solution: 'Luftfeuchtigkeit senken oder Temperatur leicht erhöhen, um die Transpiration zu fördern.' },
    vpdTooHigh: { message: 'VPD zu hoch (zu trocken)', solution: 'Luftfeuchtigkeit erhöhen oder Temperatur leicht senken, um Stress zu reduzieren.' },
    pest: { message: 'Schädlingsbefall erkannt', solution: 'Pflanze isolieren, mit Neemöl behandeln und Nützlinge einsetzen.' },
};

export const ai = {
  advisor: 'KI-Berater',
  mentor: 'KI-Mentor',
  diagnostics: 'KI-Diagnose',
  getAdvice: 'KI-Analyse anfordern',
  generating: 'Antwort wird generiert...',
  disclaimer: 'KI-generierte Inhalte können ungenau sein. Überprüfe wichtige Informationen immer.',
  loading: {
    equipment: {
      analyzing: 'Analysiere Anforderungen...',
      custom: 'Konfiguriere für Setup: {config}',
      selecting: 'Wähle passende Komponenten aus...',
      finalizing: 'Stelle Empfehlung fertig...'
    },
    diagnostics: {
      receiving: 'Empfange Bilddaten...',
      analyzing: 'Analysiere Bild auf Anomalien...',
      identifying: 'Identifiziere potenzielle Probleme...',
      formulating: 'Formuliere Diagnose & Lösung...'
    },
    mentor: {
      processing: 'Verarbeite Anfrage: "{query}"',
      searching: 'Durchsuche Wissensdatenbank...',
      compiling: 'Stelle eine detaillierte Antwort zusammen...'
    },
    advisor: {
      analyzing: 'Analysiere Daten für Pflanze in der {stage}-Phase...',
      vitals: 'Prüfe Vitalwerte (pH: {ph}, EC: {ec})...',
      problems: 'Bewerte {count} aktive Probleme...',
      formulating: 'Formuliere eine Handlungsempfehlung...'
    },
    proactiveDiagnosis: {
        analyzing: 'Analysiere den Gesamtzustand von {plantName}...',
        correlating: 'Korreliere Datenpunkte...',
        formulatingPlan: 'Formuliere Behandlungsplan...'
    },
    growTips: {
        analyzing: 'Analysiere {name}-Genetik...',
        focusing: 'Fokussiere auf {focus}...',
        consulting: 'Konsultiere fortgeschrittene Anbaudaten...',
        formulating: 'Formuliere Tipps für die {stage}-Phase...'
    },
     deepDive: {
        analyzing: 'Analysiere Thema "{topic}"...',
        context: 'Berücksichtige Kontext von {name}...',
        generating: 'Generiere schrittweise Anleitung...',
        compiling: 'Stelle Deep Dive zusammen...'
    }
  },
  error: {
    parsing: 'Die Antwort der KI konnte nicht verstanden werden. Sie könnte fehlerhaft sein.',
    apiKey: 'Der KI-Dienst ist nicht korrekt konfiguriert (Ungültiger API-Schlüssel).',
    api: 'Der KI-Dienst hat einen Fehler gemeldet. Bitte versuche es später erneut.',
    network: 'Verbindung zum KI-Dienst fehlgeschlagen. Bitte prüfe deine Netzwerkverbindung.',
    unknown: 'Ein unbekannter Fehler mit dem KI-Dienst ist aufgetreten.'
  },
  gemini: {
    equipmentPromptSuffix: "Du bist ein Weltklasse-Experte für Cannabis-Anbau-Ausrüstung. Dein Ziel ist es, ein perfekt ausgewogenes, hochmodernes Grow-Setup basierend auf der Anfrage des Benutzers zu erstellen. Gib für jede Kategorie (Zelt, Licht, Belüftung, Töpfe, Erde, Nährstoffe, Extra) ein spezifisches, hoch angesehenes Produktmodell oder einen Typ an. Der Preis muss eine realistische Schätzung in Euro sein. Die Begründung muss prägnant und anspruchsvoll sein und erklären, *warum* diese Komponente die beste Wahl ist, unter Berücksichtigung von Synergien (z.B. 'Diese LED liefert den optimalen PPFD für dieses Zelt, maximiert das Ertragspotenzial und ihre geringe Wärmeabgabe wirkt synergistisch mit dem gewählten Lüfter, um ein stabiles VPD aufrechtzuerhalten').",
    diagnosePrompt: "Du bist ein KI-Pflanzenpathologe, spezialisiert auf Cannabis, mit der Expertise eines Meisterzüchters. Analysiere dieses Bild. Zusätzlicher Pflanzenkontext: {context}. Gib eine präzise, expertenbasierte Diagnose, ein Konfidenzlevel, Sofortmaßnahmen, langfristige Lösungen und Präventionstipps.",
    mentorSystemInstruction: "Du bist 'CannaGuide Mentor', ein weltklasse Gartenbauwissenschaftler und Meisterzüchter mit einem Doktortitel in Pflanzenwissenschaften. Dein Ton ist professionell, tief wissenschaftlich, ermutigend und klar. Wenn ein Benutzer eine Frage stellt, gib eine umfassende, hochmoderne Antwort. Strukturiere deine Antwort für maximale Klarheit mit Markdown. Beginne mit einem '### Kernaussage'-Abschnitt (ein einzelner, fettgedruckter Satz). Folge mit '### Detaillierte Erklärung', verwende Fettdruck für Schlüsselbegriffe und Konzepte. Wenn du Dinge vergleichst, verwende eine Markdown-Tabelle. Schließe mit einem '### Einblick für Fortgeschrittene'-Abschnitt ab, der einen anspruchsvollen, expertenbasierten Tipp bietet. Formatiere deine Antwort immer als JSON-Objekt mit den Schlüsseln 'title' und 'content'. Der 'content' muss gültiges Markdown sein.",
    advisorQuery: "Du bist ein KI-Grow-Berater, der das SBAR-Framework (Situation, Background, Assessment, Recommendation) verwendet. Gib auf Basis der folgenden JSON-Daten für eine Cannabispflanze eine prägnante, expertenbasierte Analyse. Pflanzendaten: {data}. Formatiere deine Antwort als JSON-Objekt mit den Schlüsseln 'title' und 'content'. Der 'title' muss eine sehr kurze Zusammenfassung (max. 5 Wörter) der primären Einschätzung sein (z.B. 'Risiko für Nährstoffsperre erkannt'). Der 'content' muss gültiges Markdown sein und mit vier H3-Abschnitten strukturiert sein: '### Situation' (Was ist der aktuelle Zustand?), '### Hintergrund' (Welche Schlüsseldaten führten dazu?), '### Einschätzung' (Was ist deine Expertenmeinung?) und '### Empfehlung' (Eine einzelne, klare, primäre Aktion für den Züchter).",
    proactiveDiagnosisPrompt: "Du bist ein meisterhafter Cannabis-Züchter und Pflanzenpathologe. Analysiere den vollständigen Pflanzenzustand in den untenstehenden JSON-Daten. Konzentriere dich speziell auf das 'problems'-Array. Erkläre die wahrscheinlichste Ursache für diese Probleme, indem du sie mit anderen Datenpunkten (z.B. Umgebung, Substrat-Vitalwerte, letzte Journaleinträge) in Beziehung setzt. Liefere einen konkreten, schrittweisen Behandlungsplan. Formatiere deine Antwort als JSON-Objekt mit den Schlüsseln 'title' und 'content'. Der Titel soll eine prägnante Zusammenfassung des Hauptproblems sein. Der Inhalt muss gültiges Markdown sein. Pflanzendaten: {data}",
    strainTipsPrompt: "Du bist ein Weltklasse-Meisterzüchter mit tiefem wissenschaftlichem Wissen über den Cannabisanbau. Deine Aufgabe ist es, 4 prägnante, expertenbasierte Profi-Tipps für den Anbau einer bestimmten Sorte basierend auf benutzerdefinierten Parametern zu geben. Die Antwort muss ein JSON-Objekt sein.\n\n**Sortendetails:**\n- **Name:** {name}\n- **Typ:** {type}\n- **Schwierigkeit:** {difficulty}\n- **Höhe:** {height}\n- **Blütezeit:** {flowering} Wochen\n\n**Benutzerkontext:**\n- **Anbaufokus:** {focus}\n- **Interessierende Wachstumsphase:** {stage}\n- **Erfahrungslevel des Züchters:** {experience}\n\n**Anweisungen für die JSON-Ausgabe:**\nGeneriere ein JSON-Objekt mit vier Schlüsseln: `nutrientTip`, `trainingTip`, `environmentalTip` und `proTip`. Der Wert jedes Schlüssels muss ein String sein, der einen einzelnen, umsetzbaren Tipp als Absatz enthält. Die Tipps müssen anspruchsvoll, spezifisch und direkt auf die Kombination der Sorteneigenschaften und des Benutzerkontexts zugeschnitten sein.\n\n- **nutrientTip:** Fokussiere auf Düngestrategien. Wenn der Fokus 'Ertrag' ist, schlage einen spezifischen PK-Booster-Plan vor. Wenn 'Bio', schlage eine bestimmte Top-Dressing-Ergänzung vor.\n- **trainingTip:** Fokussiere auf das Blätterdachmanagement. Wenn die Sorte 'hoch' ist und die Phase 'vegetativ', empfiehl Topping oder SCROG. Wenn der Fokus 'Ertrag' ist, erkläre, wie die Technik die Lichtausbeute maximiert.\n- **environmentalTip:** Fokussiere auf die Klimakontrolle (VPD, Temperatur, Luftfeuchtigkeit). Wenn die Sorte anfällig für Schimmel ist und die Phase 'Blüte', schlage spezifische Luftfeuchtigkeitswerte und Luftstromstrategien vor.\n- **proTip:** Gib eine einzigartige, fortgeschrittene Einsicht, die eine Kombination mehrerer Faktoren beinhaltet. Zum Beispiel, wie man einen spezifischen Umweltstressor in der späten Blütephase einsetzt, um die Terpenproduktion für diese spezifische Sorte zu verbessern.",
    deepDivePrompt: "Du bist ein Weltklasse-Gartenbauexperte. Erstelle eine umfassende, aber anfängerfreundliche Anleitung zum Thema '{topic}'. Berücksichtige den folgenden Pflanzenkontext: {plantContext}. Deine gesamte Antwort muss ausschließlich als valider JSON-String formatiert sein, der dem folgenden TypeScript-Interface entspricht: { \"introduction\": string, \"stepByStep\": string[], \"prosAndCons\": { \"pros\": string[], \"cons\": string[] }, \"proTip\": string, \"svgIcon\": string }. Der svgIcon sollte der Name eines relevanten Icons aus der PhosphorIcons-Bibliothek sein (z.B. 'Scissors', 'Plant', 'Ruler')."
  }
};
```

... and so on for all other German translation files ...

---

## 3. English (`en`) Translation Files

This section contains all the individual files for the English language translations. The structure mirrors the German (`de`) directory.

### `/locales/en/common.ts`

```typescript
export const common = {
  add: 'Add',
  all: 'All',
  apply: 'Apply',
  back: 'Back',
  cancel: 'Cancel',
  close: 'Close',
  confirm: 'Confirm',
  delete: 'Delete',
  details: 'Details',
  downloadAgain: 'Download Again',
  edit: 'Edit',
  export: 'Export',
  exportError: 'Export failed. Please try again.',
  genetics: 'Genetics',
  inspect: 'Inspect',
  name: 'Name',
  next: 'Next',
  noDataToExport: 'No data available to export.',
  notes: 'Notes',
  save: 'Save',
  select: 'Select',
  start: 'Start',
  style: 'Style',
  successfullyExported_one: 'Successfully exported 1 item as {format}.',
  successfullyExported_other: 'Successfully exported {{count}} items as {format}.',
  type: 'Type',
  typeDetails: 'Type Details',
  why: 'Why?',
  days: 'Days',
  hours: 'Hours',
  minutes: 'Mins',
  seconds: 'Secs',
  description: 'Description',
  actions: 'Actions',
  error: 'Error',
  offlineWarning: 'You are currently offline. Functionality may be limited.',
  installPwa: 'Install App',
  installed: 'Installed',
  installPwaDescription: 'Install this application on your device for quick access and an offline experience.',
  installPwaSuccess: 'App installed successfully!',
  installPwaDismissed: 'Installation dismissed.',
  removeImage: 'Remove image',
  deleteResponse: 'Delete response',
  deleteSetup: 'Delete setup',
  page: 'Page',
  generated: 'Generated',
  for: 'For:',
  moreActions: 'More actions',
  loadMore: 'Load More',
  learnMore: 'Learn More',
  deepDive: 'Deep Dive',
  stage: 'Stage',
  temperature: 'Temperature',
  humidity: 'Humidity',
  vpd: 'VPD',
  co2Level: 'CO₂ Level',
  moisture: 'Moisture',
  units: {
    cm: 'cm',
    ml: 'ml',
    L: 'L',
    g: 'g',
    ms_cm: 'mS/cm',
    percent: '%',
    days: 'Days',
    weeks: 'weeks',
    watt: 'W',
    h_day: 'h/day',
    kwh: 'kWh',
    ppm: 'ppm',
    g_w: 'g/W',
    celsius: '°C',
    m3_h: 'm³/h',
    price_kwh: '€/kWh',
    ml_l: 'ml/L',
    currency_eur: '€'
  },
  terpenes: {
    "Myrcene": "Myrcene",
    "Caryophyllene": "Caryophyllene",
    "Limonene": "Limonene",
    "Pinene": "Pinene",
    "Linalool": "Linalool",
    "Terpinolene": "Terpinolene",
    "Humulene": "Humulene",
    "Ocimene": "Ocimene",
    "Bisabolol": "Bisabolol",
    "Nerolidol": "Nerolidol"
  },
  aromas: {
    "Sweet": "Sweet",
    "Earthy": "Earthy",
    "Pine": "Pine",
    "Spicy": "Spicy",
    "Skunk": "Skunk",
    "Citrus": "Citrus",
    "Tropical": "Tropical",
    "Fruity": "Fruity",
    "Woody": "Woody",
    "Herbal": "Herbal",
    "Floral": "Floral",
    "Peppery": "Peppery",
    "Diesel": "Diesel",
    "Pungent": "Pungent",
    "Vanilla": "Vanilla",
    "Coffee": "Coffee",
    "Chocolate": "Chocolate",
    "Mint": "Mint",
    "Grape": "Grape",
    "Berry": "Berry",
    "Ammonia": "Ammonia",
    "Chemical": "Chemical",
    "Honey": "Honey",
    "Menthol": "Menthol",
    "Nutty": "Nutty",
    "Anise": "Anise",
    "Bubblegum": "Bubblegum",
    "Butter": "Butter",
    "Cheese": "Cheese",
    "Cherry": "Cherry",
    "Creamy": "Creamy",
    "Grapefruit": "Grapefruit",
    "Lavender": "Lavender",
    "Lemon": "Lemon",
    "Lime": "Lime",
    "Mango": "Mango",
    "Melon": "Melon",
    "Orange": "Orange",
    "Papaya": "Papaya",
    "Peach": "Peach",
    "Pineapple": "Pineapple",
    "Raspberry": "Raspberry",
    "Strawberry": "Strawberry",
    "Apricot": "Apricot",
    "Apple": "Apple",
    "Guava": "Guava",
    "Glue": "Glue",
    "Meaty": "Meaty",
    "Cookie": "Cookie",
    "Hash": "Hash",
    "Incense": "Incense",
    "Licorice": "Licorice",
    "Clean": "Clean",
    "Metallic": "Metallic",
    "Sage": "Sage",
    "Cedar": "Cedar",
    "Eucalyptus": "Eucalyptus",
    "Candy": "Candy"
  },
  tts: {
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',
    next: 'Next',
    readThis: 'Read this text',
  },
  preparingGuide: 'Preparing your guide...',
  capturedImageAlt: 'Captured image preview',
  ppfd: 'PPFD',
  dli: 'DLI',
  height: 'Height',
  biomass: 'Biomass',
  stress: 'Stress',
  unchanged: 'Unchanged',
  runningSimulation: 'Running accelerated simulation...',
  amountMl: 'Amount (ml)',
  ph: 'pH',
  ec: 'EC',
  notesPlaceholder: 'Notes...',
  photoOnDay: 'Photo on day {day}',
  saveFailed: 'Failed to save image',
  saveToJournal: 'Save to Journal',
  manageFavorites: 'Manage Favorites',
  health: 'Health',
  disclaimer: {
    text: 'All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.'
  }
};

export const nav = {
  strains: 'Strains',
  plants: 'Plants',
  equipment: 'Equipment',
  knowledge: 'Knowledge',
  settings: 'Settings',
  help: 'Help',
};

export const plantStages = {
  SEED: 'Seed',
  GERMINATION: 'Germination',
  SEEDLING: 'Seedling',
  VEGETATIVE: 'Vegetative',
  FLOWERING: 'Flowering',
  HARVEST: 'Harvest',
  DRYING: 'Drying',
  CURING: 'Curing',
  FINISHED: 'Finished',
};

export const problemMessages = {
    overwatering: { message: 'Overwatering detected', solution: 'Water less frequently and ensure the pot has good drainage.' },
    underwatering: { message: 'Underwatering detected', solution: 'Water the plant thoroughly until water runs out the bottom of the pot.' },
    nutrientBurn: { message: 'Nutrient Burn', solution: 'Reduce EC level and flush with pH-neutral water.' },
    nutrientDeficiency: { message: 'Nutrient Deficiency', solution: 'Increase feeding according to schedule and check pH.' },
    phTooLow: { message: 'pH Too Low', solution: 'Adjust water with pH-Up to bring the value into the ideal range.' },
    phTooHigh: { message: 'pH Too High', solution: 'Adjust water with pH-Down to bring the value into the ideal range.' },
    tempTooHigh: { message: 'Temperature Too High', solution: 'Increase exhaust fan speed, provide more air circulation, or dim/raise the light.' },
    tempTooLow: { message: 'Temperature Too Low', solution: 'Use a heating mat or increase room temperature.' },
    humidityTooHigh: { message: 'Humidity Too High', solution: 'Increase exhaust fan speed and use a dehumidifier if necessary.' },
    humidityTooLow: { message: 'Humidity Too Low', solution: 'Use a humidifier or hang wet towels.' },
    vpdTooLow: { message: 'VPD Too Low (Too Humid)', solution: 'Decrease humidity or slightly increase temperature to encourage transpiration.' },
    vpdTooHigh: { message: 'VPD Too High (Too Dry)', solution: 'Increase humidity or slightly decrease temperature to reduce stress.' },
    pest: { message: 'Pest Infestation Detected', solution: 'Isolate plant, treat with neem oil, and introduce beneficial insects.' },
};

export const ai = {
  advisor: 'AI Advisor',
  mentor: 'AI Mentor',
  diagnostics: 'AI Diagnostics',
  getAdvice: 'Request AI Analysis',
  generating: 'Generating response...',
  disclaimer: 'AI-generated content may be inaccurate. Always verify important information.',
  loading: {
    equipment: {
      analyzing: 'Analyzing requirements...',
      custom: 'Configuring for setup: {config}',
      selecting: 'Selecting suitable components...',
      finalizing: 'Finalizing recommendation...'
    },
    diagnostics: {
      receiving: 'Receiving image data...',
      analyzing: 'Analyzing image for anomalies...',
      identifying: 'Identifying potential issues...',
      formulating: 'Formulating diagnosis & solution...'
    },
    mentor: {
      processing: 'Processing query: "{query}"',
      searching: 'Searching knowledge base...',
      compiling: 'Compiling a detailed response...'
    },
    advisor: {
      analyzing: 'Analyzing data for plant in {stage} stage...',
      vitals: 'Checking vitals (pH: {ph}, EC: {ec})...',
      problems: 'Assessing {count} active problems...',
      formulating: 'Formulating a recommendation...'
    },
     proactiveDiagnosis: {
        analyzing: 'Analyzing overall state of {plantName}...',
        correlating: 'Correlating data points...',
        formulatingPlan: 'Formulating treatment plan...'
    },
    growTips: {
        analyzing: 'Analyzing {name} genetics...',
        focusing: 'Focusing on {focus}...',
        consulting: 'Consulting advanced cultivation data...',
        formulating: 'Formulating tips for the {stage} stage...'
    },
    deepDive: {
        analyzing: 'Analyzing topic "{topic}"...',
        context: 'Considering context of {name}...',
        generating: 'Generating step-by-step guide...',
        compiling: 'Compiling deep dive...'
    }
  },
  error: {
    parsing: 'Failed to understand the AI\'s response. It might be malformed.',
    apiKey: 'The AI service is not configured correctly (Invalid API Key).',
    api: 'The AI service returned an error. Please try again later.',
    network: 'Could not connect to the AI service. Please check your network connection.',
    unknown: 'An unknown error occurred with the AI service.'
  },
  gemini: {
    equipmentPromptSuffix: "You are a world-class expert in cannabis cultivation equipment. Your goal is to create a perfectly balanced, state-of-the-art grow setup based on the user's request. For each category (tent, light, ventilation, pots, soil, nutrients, extra), provide a specific, highly-regarded product model or type. The price must be a realistic estimate in Euros. The rationale must be concise and sophisticated, explaining *why* this component is the best choice, considering synergies (e.g., 'This LED provides the optimal PPFD for this tent, maximizing yield potential, and its low heat signature works synergistically with the chosen fan to maintain a stable VPD').",
    diagnosePrompt: "You are an AI plant pathologist specializing in cannabis, with the expertise of a master grower. Analyze this image. Additional plant context: {context}. Provide a precise, expert-level diagnosis, a confidence level, immediate actions, long-term solutions, and prevention tips.",
    mentorSystemInstruction: "You are 'CannaGuide Mentor', a world-class horticultural scientist and master grower with a Ph.D. in Plant Science. Your tone is professional, deeply scientific, encouraging, and clear. When a user asks a question, give a comprehensive, state-of-the-art answer. Structure your response for maximum clarity using Markdown. Begin with a '### Key Takeaway' section (a single, bolded sentence). Follow with '### Detailed Explanation', using bolding for key terms and concepts. If comparing items, use a markdown table. Conclude with an '### Advanced Insight' section offering a sophisticated, expert-level tip. Always format your response as a JSON object with 'title' and 'content' keys. The 'content' must be valid Markdown.",
    advisorQuery: "You are an expert AI grow advisor using the SBAR (Situation, Background, Assessment, Recommendation) framework. Based on the following JSON data for a cannabis plant, provide a concise, expert-level analysis. Plant Data: {data}. Format your response as a JSON object with 'title' and 'content' keys. The 'title' must be a very short summary (max 5 words) of the primary assessment (e.g., 'Nutrient Lockout Risk Detected'). The 'content' must be valid Markdown structured with four H3 sections: '### Situation' (What is the current state?), '### Background' (What key data led to this?), '### Assessment' (What is your expert conclusion?), and '### Recommendation' (A single, clear, primary action for the grower).",
    proactiveDiagnosisPrompt: "You are a master cannabis grower and plant pathologist. Analyze the full plant state provided in the JSON data below. Focus specifically on the 'problems' array. Explain the most likely root cause for these issues by correlating them with other data points (e.g., environment, substrate vitals, recent journal entries). Provide a concrete, step-by-step treatment plan. Format your response as a JSON object with 'title' and 'content' keys. The title should be a concise summary of the primary issue. The content must be valid Markdown. Plant Data: {data}",
    strainTipsPrompt: "You are a world-class master grower with deep scientific knowledge of cannabis horticulture. Your task is to provide 4 distinct, expert-level pro-tips for cultivating a specific strain based on user-defined parameters. The response must be a JSON object.\n\n**Strain Details:**\n- **Name:** {name}\n- **Type:** {type}\n- **Difficulty:** {difficulty}\n- **Height:** {height}\n- **Flowering Time:** {flowering} weeks\n\n**User Context:**\n- **Grow Focus:** {focus}\n- **Growth Stage of Interest:** {stage}\n- **Grower Experience Level:** {experience}\n\n**Instructions for JSON Output:**\nGenerate a JSON object with four keys: `nutrientTip`, `trainingTip`, `environmentalTip`, and `proTip`. Each key's value must be a string containing a single, actionable tip as a paragraph. The tips must be sophisticated, specific, and directly tailored to the combination of the strain's characteristics and the user's context.\n\n- **nutrientTip:** Focus on feeding strategies. If the focus is 'yield', suggest a specific PK booster schedule. If 'organic', suggest a specific top-dressing amendment.\n- **trainingTip:** Focus on canopy management. If the strain is 'tall' and the stage is 'vegetative', recommend topping or SCROG. If the focus is 'yield', explain how the technique maximizes light exposure.\n- **environmentalTip:** Focus on climate control (VPD, temperature, humidity). If the strain is prone to mold and the stage is 'flowering', suggest specific humidity levels and airflow strategies.\n- **proTip:** Provide a unique, advanced insight that combines multiple factors. For example, how to use a specific environmental stressor during late flower to enhance terpene production for this specific strain.",
    deepDivePrompt: "You are a world-class horticultural expert. Create a comprehensive yet beginner-friendly guide on the topic of '{topic}'. Consider the following plant context: {plantContext}. Your entire response must be exclusively formatted as a valid JSON string that adheres to the following TypeScript interface: { \"introduction\": string, \"stepByStep\": string[], \"prosAndCons\": { \"pros\": string[], \"cons\": string[] }, \"proTip\": string, \"svgIcon\": string }. The svgIcon should be the name of a relevant icon from the PhosphorIcons library (e.g., 'Scissors', 'Plant', 'Ruler')."
  }
};
```

... and so on for all other English translation files ...

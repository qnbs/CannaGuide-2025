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
  name: 'Name',
  next: 'Weiter',
  noDataToExport: 'Keine Daten zum Exportieren vorhanden.',
  notes: 'Notizen',
  save: 'Speichern',
  start: 'Starten',
  style: 'Stil',
  successfullyExported: '{count} Einträge erfolgreich als {format} exportiert.',
  type: 'Typ',
  typeDetails: 'Typ-Details',
  why: 'Warum?',
  days: 'Tage',
  description: 'Beschreibung',
  actions: 'Aktionen',
  error: 'Fehler',
  offlineWarning: 'Du bist offline. Einige Funktionen könnten eingeschränkt sein.',
  installPwa: 'App installieren',
  installPwaDescription: 'Installiere diese Anwendung auf deinem Gerät für schnellen Zugriff und eine Offline-Erfahrung.',
  installPwaSuccess: 'App erfolgreich installiert!',
  installPwaDismissed: 'Installation abgelehnt.',
  removeImage: 'Bild entfernen',
  deleteResponse: 'Antwort löschen',
  deleteSetup: 'Setup löschen',
  page: 'Seite',
  generated: 'Erstellt',
  for: 'Für:',
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
    growTips: {
        analyzing: 'Analysiere Sortenprofil...',
        consulting: 'Konsultiere agronomische Daten...',
        formulating: 'Formuliere Anbau-Tipps...'
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
    equipmentPromptSuffix: "Du bist ein Weltklasse-Experte für Cannabis-Anbau-Ausrüstung. Dein Ziel ist es, ein perfekt ausgewogenes, hochmodernes Grow-Setup basierend auf der Anfrage des Benutzers zu erstellen. Gib für jede Kategorie (Zelt, Licht, Belüftung, Töpfe, Erde, Nährstoffe, Extra) ein spezifisches, hoch angesehenes Produktmodell oder einen Typ an. Der Preis muss eine realistische Schätzung in Euro sein. Die Begründung muss prägnant und anspruchsvoll sein und erklären, *warum* diese Komponente die beste Wahl ist, unter Berücksichtigung von Synergien (z.B. 'Diese LED liefert den optimalen PPFD für dieses Zelt, maximiert das Ertragspotenzial und ihre geringe Wärmeabgabe wirkt synergistisch mit dem gewählten Lüfter, um ein stabiles VPD aufrechtzuerhalten'). Schließe mit einem 'Profi-Tipp'-Abschnitt ab, der einen fortgeschrittenen Ratschlag für die Verwendung dieses Setups bietet.",
    diagnosePrompt: "Du bist ein KI-Pflanzenpathologe, spezialisiert auf Cannabis, mit der Expertise eines Meisterzüchters. Analysiere dieses Bild. Pflanzenkontext: {context}. Gib eine präzise, expertenbasierte Diagnose. Formatiere die Antwort als JSON-Objekt mit den Schlüsseln 'title' und 'content'. Der 'title' muss das spezifische Problem sein (z.B. 'Stickstoffmangel', 'Lichtverbrennung', 'Spinnmilben'). Der 'content' muss gültiges Markdown sein und mit den folgenden H3-Abschnitten strukturiert sein: '### Diagnose' (erklärt, was du siehst und warum, mit einem Konfidenzlevel von 1-100%), '### Sofortmaßnahme' (klare, umsetzbare Schritte), '### Langfristige Lösung' (wie man es dauerhaft behebt) und '### Prävention' (wie man es in Zukunft vermeidet). Sei anspruchsvoll und gründlich.",
    mentorSystemInstruction: "Du bist 'CannaGuide Mentor', ein weltklasse Gartenbauwissenschaftler und Meisterzüchter mit einem Doktortitel in Pflanzenwissenschaften. Dein Ton ist professionell, tief wissenschaftlich, ermutigend und klar. Wenn ein Benutzer eine Frage stellt, gib eine umfassende, hochmoderne Antwort. Strukturiere deine Antwort für maximale Klarheit mit Markdown. Beginne mit einem '### Kernaussage'-Abschnitt (ein einzelner, fettgedruckter Satz). Folge mit '### Detaillierte Erklärung', verwende Fettdruck für Schlüsselbegriffe und Konzepte. Wenn du Dinge vergleichst, verwende eine Markdown-Tabelle. Schließe mit einem '### Einblick für Fortgeschrittene'-Abschnitt ab, der einen anspruchsvollen, expertenbasierten Tipp bietet. Formatiere deine Antwort immer als JSON-Objekt mit den Schlüsseln 'title' und 'content'. Der 'content' muss gültiges Markdown sein.",
    advisorQuery: "Du bist ein KI-Grow-Berater, der das SBAR-Framework (Situation, Background, Assessment, Recommendation) verwendet. Gib auf Basis der folgenden JSON-Daten für eine Cannabispflanze eine prägnante, expertenbasierte Analyse. Pflanzendaten: {data}. Formatiere deine Antwort als JSON-Objekt mit den Schlüsseln 'title' und 'content'. Der 'title' muss eine sehr kurze Zusammenfassung (max. 5 Wörter) der primären Einschätzung sein (z.B. 'Risiko für Nährstoffsperre erkannt'). Der 'content' muss gültiges Markdown sein und mit vier H3-Abschnitten strukturiert sein: '### Situation' (Was ist der aktuelle Zustand?), '### Hintergrund' (Welche Schlüsseldaten führten dazu?), '### Einschätzung' (Was ist deine Expertenmeinung?) und '### Empfehlung' (Eine einzelne, klare, primäre Aktion für den Züchter).",
    strainTipsQuery: "Gib 3 prägnante, anspruchsvolle und expertenbasierte Profi-Tipps für den Anbau dieser spezifischen Sorte: {name} (Typ: {type}, Schwierigkeit: {difficulty}, Höhe: {height}, Blütezeit: {flowering} Wochen). Basiere die Tipps auf ihren einzigartigen Eigenschaften.",
    strainTipsSystemInstruction: "Du bist ein Meisterzüchter, der hochmoderne Ratschläge gibt. Die Antwort muss ein JSON-Objekt mit den Schlüsseln 'title' und 'content' sein. Der Titel sollte 'Profi-Tipps für den Anbau von {name}' lauten. Der 'content' muss gültiges Markdown sein und genau drei Aufzählungspunkte als Tipps enthalten. Jeder Tipp muss sehr spezifisch und umsetzbar sein und sich direkt auf die bekannten Eigenschaften der Sorte beziehen (z.B. bei einer 'hohen' Sativa spezifisches Training empfehlen; bei einer 'schweren' Sorte vor Nährstoffempfindlichkeit warnen)."
  }
};


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
    equipmentPromptSuffix: "Du bist ein Weltklasse-Experte für Cannabis-Anbau-Ausrüstung. Dein Ziel ist es, ein perfekt ausgewogenes, leistungsstarkes Grow-Setup basierend auf der Anfrage des Benutzers zu erstellen. Gib für jede Kategorie (Zelt, Licht, Belüftung, Töpfe, Erde, Nährstoffe, Extra) ein spezifisches, angesehenes Produktmodell oder einen Typ an. Der Preis muss eine realistische Schätzung in Euro sein. Die Begründung muss prägnant sein und erklären, *warum* diese spezielle Komponente die beste Wahl für die angegebenen Ziele des Benutzers ist (z.B. 'Diese LED-Leuchte liefert den optimalen PPFD für diese Zeltgröße, maximiert das Ertragspotenzial und ist gleichzeitig energieeffizient'). Stelle sicher, dass das gesamte Setup synergetisch ist und den bestmöglichen Wert und die bestmögliche Leistung für die gegebenen Parameter bietet.",
    diagnosePrompt: "Du bist ein KI-Pflanzenpathologe, spezialisiert auf Cannabis. Analysiere dieses Bild. Pflanzenkontext: {context}. Gib eine präzise Diagnose. Identifiziere das wahrscheinlichste Problem (z.B. 'Stickstoffmangel', 'Lichtverbrennung', 'Spinnmilben'). Formatiere die Antwort als JSON-Objekt mit den Schlüsseln 'title' und 'content'. Der 'title' muss der Name des Problems sein. Der 'content' muss gültiges Markdown sein und wie folgt strukturiert sein: Erstens, ein 'Diagnose'-Abschnitt, der erklärt, was du siehst und warum es auf dieses Problem hindeutet. Zweitens, ein 'Lösung'-Abschnitt mit klaren, umsetzbaren Schritten, die der Züchter unternehmen sollte. Drittens, ein 'Prävention'-Abschnitt mit Tipps, um dieses Problem in Zukunft zu vermeiden.",
    mentorSystemInstruction: "Du bist 'CannaGuide Mentor', ein weltweit führender Experte für Cannabis-Gartenbau mit einem Doktortitel in Pflanzenwissenschaften. Dein Ton ist professionell, wissenschaftlich, ermutigend und klar. Wenn ein Benutzer eine Frage stellt, gib eine umfassende, hochmoderne Antwort. Strukturiere deine Antwort für maximale Klarheit mit Markdown: Beginne mit einer direkten Zusammenfassung, gefolgt von detaillierten Erklärungen, verwende Aufzählungszeichen für Listen von Aktionen oder Faktoren und schließe mit einem 'Profi-Tipp', der eine fortgeschrittene Einsicht bietet. Formatiere deine Antwort immer als JSON-Objekt mit den Schlüsseln 'title' und 'content'. Der 'content' muss gültiges Markdown sein.",
    advisorQuery: "Du bist ein KI-Grow-Berater. Gib auf Basis der folgenden JSON-Daten für eine Cannabispflanze eine prägnante, expertenbasierte Analyse und eine primäre, umsetzbare Empfehlung. Pflanzendaten: {data}. Formatiere deine Antwort als JSON-Objekt mit den Schlüsseln 'title' und 'content'. Der 'title' muss eine sehr kurze Zusammenfassung (max. 5 Wörter) des Hauptproblems oder Ratschlags sein (z.B. 'pH-Wert driftet hoch, Anpassung nötig'). Der 'content' muss gültiges Markdown sein und mit einem 'Schlüsselbeobachtung:'-Abschnitt, der den kritischsten Datenpunkt erklärt, den du identifiziert hast, und einem 'Empfehlung:'-Abschnitt mit einer klaren, einzelnen Aktion, die der Züchter *jetzt* unternehmen sollte, strukturiert sein."
  }
};

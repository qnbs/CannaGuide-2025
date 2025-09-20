
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
  genetics: 'Genetik',
  name: 'Name',
  next: 'Weiter',
  noDataToExport: 'Keine Daten zum Exportieren vorhanden.',
  notes: 'Notizen',
  save: 'Speichern',
  start: 'Starten',
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
    equipmentPromptSuffix: 'Gib spezifische Produkttypen an (z.B. \'Mars Hydro TS 1000\' oder \'Stofftopf 5 Gallonen\'), aber vermeide Markenbevorzugung, es sei denn, ein bestimmtes Modell ist für diese Kategorie ikonisch. Preise sollten realistische Schätzungen in Euro sein. Die Begründung sollte prägnant sein und erklären, warum der Artikel zu den Bedürfnissen des Benutzers passt. Folgende Kategorien müssen enthalten sein: Zelt, Licht, Belüftung, Töpfe, Erde, Nährstoffe, Extra.',
    diagnosePrompt: 'Analysiere dieses Bild eines Cannabis-Pflanzenblatts/-pflanze. Der Benutzer sucht nach einer möglichen Problemdiagnose. Pflanzenkontext: {context}. Liefere eine prägnante Diagnose. Identifiziere das wahrscheinlichste Problem (z.B. \'Stickstoffmangel\', \'Lichtverbrennung\', \'Spinnmilben\'). Formatiere die Antwort als JSON-Objekt mit den Schlüsseln "title" und "content". Der "title" sollte der Name des Problems sein. Der "content" sollte eine 2-3 Sätze lange Erklärung des Problems und eine vorgeschlagene Lösung sein.',
    mentorSystemInstruction: 'Du bist ein Experte für den Cannabisanbau und ein Mentor. Dein Ton ist hilfsbereit, ermutigend und wissenschaftlich. Gib detaillierte, umsetzbare Ratschläge. Formatiere deine Antwort als JSON-Objekt mit den Schlüsseln \'title\' und \'content\'. Der \'title\' sollte eine prägnante Zusammenfassung der Antwort sein. Der \'content\' sollte die detaillierte Erklärung sein, unter Verwendung von Markdown für die Formatierung (wie Listen oder Fettdruck).',
    advisorQuery: 'Gib auf Basis der folgenden Daten für eine Cannabispflanze eine prägnante Analyse und eine zentrale Empfehlung für den Züchter. Pflanzendaten: {data}. Formatiere die Antwort als JSON-Objekt mit den Schlüsseln "title" und "content". Der "title" sollte eine sehr kurze Zusammenfassung des Ratschlags sein (z.B. "Leicht hoher pH-Wert, Anpassung vorschlagen"). Der "content" sollte eine 2-4 Sätze lange Erklärung deiner Beobachtung und eine klare, umsetzbare Empfehlung sein.'
  }
};
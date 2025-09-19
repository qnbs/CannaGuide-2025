
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
  error: 'Fehler bei der KI-Anfrage',
  disclaimer: 'KI-generierte Inhalte können ungenau sein. Überprüfe wichtige Informationen immer.',
  loading: {
    equipment: {
      analyzing: 'Analysiere Anforderungen...',
      budget: 'Berücksichtige {budget} Budget...',
      area: 'Optimiere für {area}cm Fläche...',
      style: 'Wähle Komponenten für den Stil "{style}"...',
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
  }
};
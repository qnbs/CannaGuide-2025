export const plantsView = {
  emptySlot: {
    title: 'Leerer Pflanzen-Slot',
    subtitle: 'Beginne einen neuen Anbau',
    subtitleInline: 'oder wähle eine Sorte aus der Bibliothek.',
  },
  plantCard: {
    day: 'Tag',
    stage: 'Phase',
  },
  vitals: {
    ph: 'pH',
    ec: 'EC',
    moisture: 'Feuchtigkeit',
  },
  gardenVitals: {
    title: 'Garten-Vitalwerte',
    avgTemp: 'Ø Temp',
    avgHumidity: 'Ø LF',
  },
  summary: {
    gardenHealth: 'Gartengesundheit',
    activeGrows: 'Aktive Grows',
    openTasks: 'Offene Aufgaben',
    waterAll: 'Alle Pflanzen gießen',
  },
  tasks: {
    title: 'Aufgaben',
    none: 'Keine offenen Aufgaben.',
    priority: 'Priorität',
    priorities: {
        high: 'Hoch',
        medium: 'Mittel',
        low: 'Niedrig'
    }
  },
  warnings: {
    title: 'Warnungen',
    none: 'Keine aktiven Probleme erkannt.',
  },
  detailedView: {
    tabs: {
      overview: 'Übersicht',
      journal: 'Tagebuch',
      tasks: 'Aufgaben',
      photos: 'Fotos',
      ai: 'KI-Berater',
      postHarvest: 'Nach-Ernte'
    },
    tasksComplete: 'Erledigen',
    tasksNoEntries: 'Keine abgeschlossenen Aufgaben.',
    journalNoEntries: 'Keine Journaleinträge für diesen Filter.',
    journalFilters: {
        watering: 'Gießen',
        feeding: 'Düngen',
        training: 'Training',
        observation: 'Beobachtung',
        pestControl: 'Schädlingsbekämpfung',
        amendment: 'Zusatz',
        system: 'System',
        photo: 'Foto',
        environment: 'Umgebung'
    },
    photosNoEntries: 'Keine Fotos im Journal gefunden.',
    lifecycle: 'Lebenszyklus',
    history: 'Verlauf',
    historyNoData: 'Nicht genügend Daten für eine Grafik vorhanden.',
    historyChart: {
        events: {
            watering: 'Gegossen',
            feeding: 'Gedüngt',
            training: 'Training'
        }
    },
    vitals: 'Vitalwerte',
    height: 'Höhe',
    stress: 'Stresslevel',
    structuralModel: 'Strukturmodell',
    healthStatus: 'Gesundheit & Status',
    activeIssues: 'Aktive Probleme',
    environment: 'Umgebung',
    substrateAndRoots: 'Substrat & Wurzeln',
    rootHealth: 'Wurzelgesundheit',
    microbeHealth: 'Mikroben-Gesundheit',
    controls: {
        title: 'Ausrüstungssteuerung',
        light: 'Licht',
        fan: 'Umluftventilator',
        fanSpeed: 'Ventilatorgeschwindigkeit'
    },
    status: {
        title: 'Echtzeit-Status',
        syncActive: 'Simulation aktiv'
    }
  },
  aiAdvisor: {
    description: 'Fordere eine KI-Analyse des aktuellen Zustands deiner Pflanze an, um gezielte Ratschläge und Handlungsempfehlungen zu erhalten.',
    proactiveDiagnosisTitle: 'Proaktive Diagnose',
    proactiveDiagnosisDescription: 'Führe eine vollständige Analyse aller Anbaudaten durch, um Ursachen für Probleme zu finden und einen Behandlungsplan zu erhalten.',
    runDiagnosis: 'Vollständige Diagnose durchführen',
    archiveTitle: 'Berater-Archiv',
    archiveEmpty: 'Es wurden keine Berater-Antworten für diese Pflanze archiviert.',
    exportModal: {
      sources: {
        selected_one: '1 ausgewählte Antwort',
        selected_other: '{{count}} ausgewählte Antworten',
        all_one: 'Alle 1 gefilterte Antwort',
        all_other: 'Alle {{count}} gefilterten Antworten',
      }
    }
  },
  aiDiagnostics: {
    title: 'KI-Pflanzendiagnose',
    description: 'Lade ein Foto eines Problems hoch (z.B. ein verfärbtes Blatt), um eine KI-gestützte Diagnose zu erhalten.',
    dragDrop: 'Bild hierher ziehen oder klicken zum Auswählen',
    capture: 'Foto aufnehmen',
    cameraError: 'Kamerazugriff fehlgeschlagen. Bitte Berechtigungen prüfen.',
    plantContext: 'Pflanzenkontext (optional)',
    generalContext: 'Allgemein / Unbekannte Pflanze',
    userNotesPlaceholder: 'Zusätzliche Notizen hinzufügen... (z.B. "obere Blätter betroffen")',
    validation: {
        imageOnly: 'Bitte nur Bilddateien hochladen.'
    },
    diagnosis: 'Diagnose',
    confidence: 'Konfidenz',
    actions: 'Sofortmaßnahmen',
    solution: 'Langfristige Lösung',
    prevention: 'Prävention',
    savedToJournal: 'Diagnose im Journal gespeichert.',
    waitingDesc: 'Lade ein Bild hoch, um eine Diagnose zu starten.',
    retake: 'Erneut aufnehmen',
  },
  inlineSelector: {
    title: 'Wähle einen leeren Slot',
    subtitle: 'Wähle einen leeren Slot auf deinem Dashboard, um mit dem Anbau von',
  },
  setupModal: {
    title: 'Setup für {name} konfigurieren',
    subtitle: 'Passe die Startbedingungen für deinen neuen Anbau an.',
    lightType: 'Licht-Typ',
    wattage: 'Leistung (Watt)',
    potSize: 'Topfgröße (Liter)',
    medium: 'Anbaumedium',
    temperature: 'Temperatur (°C)',
    humidity: 'Luftfeuchtigkeit (%)',
    lightHours: 'Lichtstunden / Tag',
  },
  confirmationModal: {
    title: 'Anbau starten?',
    text: 'Deine Pflanze wird mit den gewählten Einstellungen initialisiert und in deinem Grow Room platziert. Bist du bereit, zu beginnen?',
    confirmButton: 'Anbau bestätigen',
  },
  actionModals: {
    logWatering: 'Gießvorgang protokollieren',
    logFeeding: 'Düngervorgang protokollieren',
    logTraining: 'Training protokollieren',
    logPestControl: 'Schädlingsbekämpfung protokollieren',
    logObservation: 'Beobachtung protokollieren',
    logPhoto: 'Foto protokollieren',
    logAmendment: 'Bodenverbesserung protokollieren',
    defaultNotes: {
        watering: 'Mit angepasstem pH-Wert gegossen.',
        feeding: 'Nährlösung gemäß Schema verabreicht.'
    }
  },
  notifications: {
    allSlotsFull: 'Alle deine Anbau-Slots sind voll!',
    growStarted: 'Anbau von {name} erfolgreich gestartet!',
    seedCollected: 'Hochwertiger Samen von {name} gesammelt!',
  },
  archivedPlant: 'Archivierte Pflanze',
  syncProgress: 'Synchronisiere Simulationsfortschritt...',
  postHarvest: {
    title: 'Nach-Ernte-Management',
    drying: 'Trocknung',
    curing: 'Curing',
    day: 'Tag',
    days_one: '1 Tag',
    days_other: '{{count}} Tage',
    currentConditions: 'Aktuelle Bedingungen',
    targetConditions: 'Ziel-Bedingungen',
    temperature: 'Temperatur',
    humidity: 'Luftfeuchtigkeit',
    dryingProgress: 'Trocknungsfortschritt',
    curingProgress: 'Curing-Fortschritt',
    jarHumidity: 'Glas-Feuchtigkeit',
    finalQuality: 'Endqualität',
    ideal: 'Ideal',
    tooHigh: 'Zu hoch',
    tooLow: 'Zu niedrig',
    simulateNextDay: 'Nächsten Tag simulieren',
    burpJars: 'Gläser lüften',
    burpComplete: 'Lüften abgeschlossen!',
    finishDrying: 'Trocknung abschließen',
    finishCuring: 'Curing abschließen',
    processComplete: 'Prozess abgeschlossen',
  },
  harvestPlant: 'Pflanze ernten'
};

export const plantsView = {
  title: 'Mein Garten',
  syncProgress: 'Pflanzen-Fortschritt wird synchronisiert...',
  emptySlot: {
    title: 'Neuen Anbau starten',
    subtitle: 'Wähle einen leeren Platz, um zu beginnen.',
    subtitleInline: 'Wähle eine Sorte, um eine neue Simulation zu starten.',
  },
  inlineSelector: {
    title: 'Sorte für Slot auswählen',
    subtitle: 'Wähle eine Sorte für den Anbau in diesem Slot aus.',
  },
  setupModal: {
    title: 'Setup für {name} konfigurieren',
    subtitle: 'Definiere die Startbedingungen für deine neue Pflanze.',
    lightType: 'Licht-Typ',
    wattage: 'Leistung (Watt)',
    potSize: 'Topfgröße (L)',
    medium: 'Medium',
    temperature: 'Temperatur (°C)',
    humidity: 'Luftfeuchtigkeit (%)',
    lightHours: 'Lichtstunden (an)',
  },
  confirmationModal: {
    title: 'Bist du bereit, dein Projekt zu starten?',
    text: 'Sobald du auf \'Keimung starten\' klickst, beginnt das Leben deiner Pflanze in Echtzeit. Die Simulation wird von nun an kontinuierlich im Hintergrund laufen, genau wie bei einer echten Pflanze. Du kannst sie jederzeit besuchen, pflegen und beobachten. Dies ist der Beginn einer langen Reise.',
    confirmButton: 'Keimung starten'
  },
  notifications: {
    allSlotsFull: 'Alle Pflanzen-Slots sind derzeit belegt.',
    growStarted: 'Anbau von {name} erfolgreich gestartet!',
    waterAllSuccess: '{count} durstige Pflanzen gegossen.',
    waterAllNone: 'Alle Pflanzen sind ausreichend bewässert.',
  },
  gardenVitals: {
    title: 'Garten-Vitalwerte',
    avgTemp: 'Ø Temp',
    avgHumidity: 'Ø LF',
  },
  summary: {
    gardenHealth: 'Gartengesundheit',
    activeGrows: 'Aktive Anbauten',
    openTasks: 'Offene Aufgaben',
    activeProblems: 'Aktive Probleme',
    waterAll: 'Alle durstigen Pflanzen gießen',
    advanceDay: 'Nächsten Tag simulieren',
  },
  tasks: {
    title: 'Wichtige Aufgaben',
    none: 'Keine offenen Aufgaben. Alles im grünen Bereich!',
    priority: 'Priorität',
    priorities: {
        high: 'Hoch',
        medium: 'Mittel',
        low: 'Niedrig'
    }
  },
  warnings: {
    title: 'Aktive Warnungen',
    none: 'Keine aktiven Probleme erkannt. Weiter so!',
  },
  plantCard: {
    day: 'Tag',
  },
  vitals: {
    ph: 'pH',
    ec: 'EC',
    moisture: 'Feuchtigkeit',
  },
  detailedView: {
    status: {
        title: 'Echtzeit-Anbaustatus',
        syncActive: 'Simulation aktiv',
    },
    controls: {
        title: 'Ausrüstungskontrolle',
        light: 'Licht',
        fan: 'Lüfter',
        fanSpeed: 'Lüftergeschwindigkeit',
    },
    lifecycle: 'Pflanzen-Lebenszyklus',
    history: 'Wachstums- & Stress-Verlauf',
    historyNoData: 'Nicht genügend Daten für das Diagramm vorhanden.',
    vitals: 'Substrat-Vitalwerte',
    environment: 'Umgebung',
    height: 'Höhe',
    stress: 'Stress',
    tabs: {
      overview: 'Übersicht',
      ai: 'KI-Berater',
      journal: 'Journal',
      tasks: 'Aufgaben',
      photos: 'Fotos',
    },
    journalFilters: {
        watering: 'Gießen',
        feeding: 'Düngen',
        training: 'Training',
        observation: 'Beobachtung',
        system: 'System',
        photo: 'Foto',
        pestControl: 'Schädlingsbek.',
        environment: 'Umgebung',
        amendment: 'Zusatz',
    },
    journalNoEntries: 'Keine Journaleinträge entsprechen dem Filter.',
    tasksComplete: 'Erledigt',
    tasksNoEntries: 'Noch keine erledigten Aufgaben.',
    photosNoEntries: 'Es wurden noch keine Fotos protokolliert.',
  },
  historyChart: {
    events: {
      watering: 'Gegossen',
      feeding: 'Gedüngt',
      training: 'Trainiert',
    }
  },
  actionModals: {
    logWatering: 'Gießen protokollieren',
    logFeeding: 'Düngung protokollieren',
    logTraining: 'Training protokollieren',
    logPestControl: 'Schädlingsbekämpfung protokollieren',
    logObservation: 'Beobachtung protokollieren',
    logPhoto: 'Foto protokollieren',
    defaultNotes: {
        watering: 'Standardbewässerung mit pH-angepasstem Wasser.',
        feeding: 'Standarddüngung gemäß Schema.'
    }
  },
  aiAdvisor: {
    archiveTitle: 'Berater-Archiv',
    archiveEmpty: 'Für diese Pflanze wurde noch kein Ratschlag archiviert.',
  },
  aiDiagnostics: {
    title: 'KI-Pflanzendoktor',
    description: 'Lade ein klares Foto eines Blattes oder einer Problemzone hoch, um eine KI-gestützte Diagnose zu erhalten.',
    dragDrop: 'Bild hierher ziehen oder klicken zum Auswählen',
    capture: 'Kamera verwenden',
    cameraError: 'Kamerazugriff fehlgeschlagen. Bitte Berechtigungen prüfen.',
    retake: 'Erneut aufnehmen',
    validation: {
        imageOnly: 'Bitte eine Bilddatei hochladen.',
    },
    plantContext: 'Kontext bereitstellen für',
    generalContext: 'Allgemeine Diagnose (Keine Pflanze)',
    userNotesPlaceholder: 'Füge zusätzliche Notizen für die KI hinzu...',
    confidence: 'Konfidenz',
    diagnosis: 'Diagnose',
    actions: 'Sofortmaßnahmen',
    solution: 'Langzeitlösung',
    prevention: 'Prävention',
    savedToJournal: 'Diagnose im Pflanzen-Journal gespeichert.',
    waitingDesc: 'Lade ein Foto hoch und gib Kontext an, um eine Diagnose zu erhalten.',
  },
  archivedPlant: 'Archivierte Pflanze',
};
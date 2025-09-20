export const plantsView = {
  title: 'Meine Pflanzen',
  tabs: {
    dashboard: 'Dashboard',
    archive: 'Berater-Archiv',
  },
  emptySlot: {
    title: 'Leerer Slot',
    subtitle: 'Starte einen neuen Anbau über die Sorten-Ansicht.',
    button: 'Sorte auswählen',
  },
  plantCard: {
    day: 'Tag',
    stage: 'Phase',
  },
  summary: {
    activeGrows: 'Aktive Grows',
    openTasks: 'Offene Aufgaben',
    gardenHealth: 'Garten-Gesundheit',
    waterAll: 'Alle gießen',
    simulateNextDay: 'Nächster Tag',
    heightChart: 'Höhenverlauf',
  },
  tasks: {
    title: 'Aufgaben',
    none: 'Keine offenen Aufgaben. Gut gemacht!',
    priority: 'Priorität',
    priorities: {
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig',
    },
    wateringTask: {
      title: 'Pflanze gießen',
      description: 'Das Substrat ist zu trocken.',
    }
  },
  warnings: {
    title: 'Warnungen',
    none: 'Keine Probleme erkannt. Alles im grünen Bereich!',
  },
  notifications: {
    startSuccess: 'Anbau von {name} erfolgreich gestartet!',
    allSlotsFull: 'Alle Anbau-Slots sind belegt.',
    stageChange: 'Phase gewechselt zu: {stage}',
    harvestReady: '{name} ist bereit zur Ernte!',
    finalYield: 'Finaler Ertrag berechnet: {yield}g',
    waterAllSuccess: '{count} Pflanzen wurden gegossen.',
    waterAllNone: 'Keine Pflanzen mussten gegossen werden.',
  },
  setupModal: {
    title: 'Setup für {name}',
    subtitle: 'Konfiguriere die Umgebungsbedingungen für deinen Anbau.',
    lightSource: 'Lichtquelle',
    potSize: 'Topfgröße',
    medium: 'Medium',
    mediums: {
      soil: 'Erde',
      coco: 'Kokos',
      hydro: 'Hydro',
    },
    environment: 'Umgebung',
    temp: 'Temperatur (°C)',
    humidity: 'Luftfeuchte (%)',
    lightHours: 'Lichtstunden/Tag',
    validation: {
      light: 'Die Lichtstunden müssen zwischen 1 und 24 liegen.',
      temp: 'Die Temperatur muss zwischen 10°C und 40°C liegen.',
      humidity: 'Die Luftfeuchtigkeit muss zwischen 10% und 99% liegen.',
    }
  },
  detailedView: {
    tabs: {
      overview: 'Übersicht',
      journal: 'Journal',
      tasks: 'Aufgaben',
      photos: 'Fotos',
    },
    vitals: 'Vitalwerte',
    ph: 'pH-Wert',
    ec: 'EC-Wert',
    moisture: 'Substratfeuchte',
    stress: 'Stresslevel',
    height: 'Höhe',
    age: 'Alter',
    stage: 'Phase',
    history: 'Verlauf',
    historyNoData: 'Nicht genügend Daten für den Verlaufschart.',
    lifecycle: 'Lebenszyklus',
    journalFilters: {
      watering: 'Gießen',
      feeding: 'Düngen',
      training: 'Training',
      observation: 'Beobachtung',
      system: 'System',
      photo: 'Foto',
    },
    journalNoEntries: 'Keine Journal-Einträge für diesen Filter gefunden.',
    tasksComplete: 'Erledigt',
    tasksNoEntries: 'Keine Aufgaben für diese Pflanze.',
    photosNoEntries: 'Keine Fotos für diese Pflanze im Journal.',
  },
  actionModals: {
    wateringTitle: 'Gießen protokollieren',
    waterAmount: 'Wassermenge (ml)',
    phValue: 'pH-Wert',
    feedingTitle: 'Düngung protokollieren',
    ecValue: 'EC-Wert (mS/cm)',
    observationTitle: 'Beobachtung hinzufügen',
    observationPlaceholder: 'Was hast du bemerkt?',
    trainingTitle: 'Training protokollieren',
    trainingType: 'Trainingsart',
    trainingTypes: {
      topping: 'Topping',
      lst: 'LST',
      defoliation: 'Entlaubung',
    },
    photoTitle: 'Foto hinzufügen',
    photoNotes: 'Notizen zum Foto',
    defaultNotes: {
      watering: 'Pflanze gegossen.',
      feeding: 'Pflanze gedüngt.',
    },
  },
  aiDiagnostics: {
    title: 'KI Pflanzendoktor',
    buttonLabel: 'Bild hochladen',
    prompt: 'Lade ein Foto eines Blattes oder der Pflanze hoch, um eine Diagnose zu erhalten.',
    diagnoseButton: 'Diagnose stellen',
  },
   aiAdvisor: {
    description: 'Erhalte eine datengestützte Analyse und Handlungsempfehlungen für deine Pflanze von der KI.',
    archiveTitle: 'Berater-Archiv',
    archiveEmpty: 'Keine gespeicherten Analysen für diese Pflanze.',
    archiveEmptyGlobal: {
        title: 'Das Berater-Archiv ist leer',
        subtitle: 'Gespeicherte Empfehlungen des KI-Beraters für alle Pflanzen werden hier angezeigt.'
    },
    unknownPlant: 'Unbekannte Pflanze',
  },
  quickActions: {
      title: "Schnellaktionen",
      simulateNextDay: "Nächsten Tag simulieren"
  },
  journal: {
    problemDetected: 'Problem erkannt: {message}',
    newTask: 'Neue Aufgabe: {title}',
  }
};
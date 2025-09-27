export const plantsView = {
  emptySlot: {
    title: 'Leerer Pflanzen-Slot',
    subtitle: 'Beginne hier einen neuen Anbau.',
    subtitleInline: 'Klicke, um eine Sorte auszuwählen.',
  },
  inlineSelector: {
    title: 'Wähle einen Slot für deinen neuen Anbau',
    subtitle: 'Du hast einen Anbau mit der Sorte {name} initiiert. Wähle einen leeren Slot unten aus, um fortzufahren.',
  },
  setupModal: {
    title: 'Setup für {name}',
    subtitle: 'Konfiguriere die anfänglichen Umgebungs- und Ausrüstungsparameter für deinen neuen Anbau.',
    lightType: 'Licht-Typ',
    wattage: 'Leistung (Watt)',
    potSize: 'Topfgröße (Liter)',
    medium: 'Anbaumedium',
    temperature: 'Temperatur (°C)',
    humidity: 'Luftfeuchtigkeit (%)',
    lightHours: 'Lichtstunden pro Tag',
  },
  confirmationModal: {
    title: 'Bereit zum Wachsen!',
    text: 'Dein Setup ist konfiguriert und der Samen ist bereit. Bestätige, um den Anbau zu beginnen und die Simulation zu starten.',
    confirmButton: 'Anbau beginnen',
  },
  gardenVitals: {
    title: 'Garten-Vitalwerte',
    avgTemp: 'Ø Temp',
    avgHumidity: 'Ø Feucht.',
  },
  summary: {
    gardenHealth: 'Gartengesundheit',
    activeGrows: 'Aktive Grows',
    waterAll: 'Alle durstigen Pflanzen gießen',
    openTasks: 'Offene Aufgaben',
  },
  tasks: {
    title: 'Aufgaben',
    none: 'Keine offenen Aufgaben. Gut gemacht!',
    priority: 'Priorität',
    priorities: {
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig',
    }
  },
  warnings: {
    title: 'Warnungen',
    none: 'Keine aktiven Probleme erkannt.',
  },
  aiDiagnostics: {
    title: 'KI-Pflanzendiagnose',
    description: 'Lade ein Foto eines Blattes oder einer Problemzone hoch, um eine KI-basierte Diagnose und Handlungsempfehlungen zu erhalten.',
    dragDrop: 'Bild hierher ziehen oder klicken, um hochzuladen',
    capture: 'Foto aufnehmen',
    cameraError: 'Kamerazugriff fehlgeschlagen. Bitte Berechtigungen prüfen.',
    plantContext: 'Pflanzenkontext auswählen (optional)',
    generalContext: 'Allgemein (keine spezifische Pflanze)',
    userNotesPlaceholder: 'Zusätzliche Beobachtungen hinzufügen... (z.B. "obere Blätter betroffen")',
    confidence: 'Konfidenz',
    diagnosis: 'Diagnose',
    actions: 'Sofortmaßnahmen',
    solution: 'Langfristige Lösung',
    prevention: 'Prävention',
    validation: {
      imageOnly: 'Bitte nur Bilddateien hochladen.',
    },
    savedToJournal: 'Diagnose im Journal gespeichert!',
    waitingDesc: 'Lade ein Bild hoch, um eine Diagnose zu starten.',
    retake: 'Neu aufnehmen',
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
      title: 'Echtzeit-Status',
      syncActive: 'Simulation aktiv & synchronisiert',
    },
    controls: {
      title: 'Ausrüstungskontrolle',
      light: 'Licht',
      fan: 'Umluftventilator',
      fanSpeed: 'Lüftergeschwindigkeit',
    },
    tabs: {
      overview: 'Übersicht',
      journal: 'Journal',
      tasks: 'Aufgaben',
      photos: 'Fotos',
      ai: 'KI-Berater',
    },
    lifecycle: 'Lebenszyklus',
    history: 'Verlauf',
    vitals: 'Vitalwerte',
    environment: 'Umgebung',
    height: 'Höhe',
    stress: 'Stress',
    journalFilters: {
      watering: 'Gießen',
      feeding: 'Düngen',
      training: 'Training',
      observation: 'Beobachtung',
      pestControl: 'Schädlingsbekämpfung',
      amendment: 'Zusatz',
      system: 'System',
      photo: 'Foto',
      environment: 'Umgebung',
    },
    journalNoEntries: 'Keine Journaleinträge für diesen Filter gefunden.',
    tasksComplete: 'Erledigen',
    tasksNoEntries: 'Keine erledigten Aufgaben.',
    photosNoEntries: 'Keine Fotos im Journal gefunden.',
    historyNoData: 'Nicht genügend Daten für eine Grafik vorhanden.',
    historyChart: {
        events: {
            watering: 'Gießen',
            feeding: 'Düngen',
            training: 'Training',
        }
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
      watering: 'Standard-Bewässerung durchgeführt.',
      feeding: 'Nährstoffe nach Schema verabreicht.',
    },
    trainingTypes: {
      lst: 'LST',
      topping: 'Topping',
      fiming: 'FIMing',
      defoliation: 'Entlaubung'
    }
  },
  aiAdvisor: {
    archiveTitle: 'Berater-Archiv',
    archiveEmpty: 'Keine archivierten Beratungen für diese Pflanze.',
    exportModal: {
      sources: {
        selected: 'Ausgewählte ({count})',
        all: 'Alle gefilterten ({count})',
      }
    }
  },
  archivedPlant: 'Archivierte Pflanze',
  notifications: {
    growStarted: 'Anbau von {name} erfolgreich gestartet!',
    allSlotsFull: 'Alle Pflanzen-Slots sind belegt.',
    waterAllSuccess_one: '1 Pflanze wurde gegossen.',
    waterAllSuccess_other: '{{count}} Pflanzen wurden gegossen.',
    waterAllNone: 'Keine Pflanzen mussten gegossen werden.',
  },
  syncProgress: 'Synchronisiere Pflanzen-Fortschritt...'
};

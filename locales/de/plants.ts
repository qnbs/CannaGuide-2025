export const plantsView = {
  title: 'Mein Grow Room',
  plantCard: {
    day: 'Tag',
  },
  emptySlot: {
    title: 'Leerer Pflanz-Slot',
    subtitle: 'Beginne einen neuen Anbau im Sorten-Bereich.',
  },
  archivedPlant: 'Archivierte Pflanze',
  vitals: {
    ph: 'pH-Wert',
    ec: 'EC-Wert',
    moisture: 'Feuchtigkeit',
  },
  notifications: {
    startSuccess: 'Anbau für {name} erfolgreich gestartet!',
    allSlotsFull: 'Alle Anbau-Slots sind belegt. Beende einen Anbau, um einen neuen zu starten.',
    stageChange: 'Pflanze hat die Phase erreicht: {stage}',
    harvestReady: '{name} ist bereit zur Ernte!',
    finalYield: 'Finaler Ertrag berechnet: {yield}g',
    waterAllSuccess: '{count} Pflanzen erfolgreich gegossen.',
    waterAllNone: 'Keine Pflanzen mussten gegossen werden.',
  },
  setupModal: {
    title: 'Setup für {name}',
    subtitle: 'Konfiguriere deine Anbau-Umgebung.',
    lightSource: 'Lichtquelle',
    potSize: 'Topfgröße',
    medium: 'Anbaumedium',
    mediums: {
      soil: 'Erde',
      coco: 'Kokos',
      hydro: 'Hydro',
    },
    environment: 'Umgebung',
    temp: 'Temperatur (°C)',
    humidity: 'Luftfeuchtigkeit (%)',
    lightHours: 'Lichtstunden/Tag',
    validation: {
        light: 'Lichtstunden müssen zwischen 1 und 24 sein.',
        temp: 'Temperatur muss zwischen 10 und 40°C sein.',
        humidity: 'Luftfeuchtigkeit muss zwischen 10 und 99% sein.',
    }
  },
  detailedView: {
    vitals: 'Vitalwerte',
    stage: 'Phase',
    height: 'Höhe',
    stress: 'Stress',
    lifecycle: 'Lebenszyklus',
    history: 'Verlauf',
    historyNoData: 'Nicht genügend Daten für den Verlauf.',
    journal: 'Journal',
    photos: 'Fotos',
    tasks: 'Aufgaben',
    tabs: {
      overview: 'Übersicht',
      journal: 'Journal',
      photos: 'Fotos',
      tasks: 'Aufgaben',
    },
    journalFilters: {
        watering: 'Gießen',
        feeding: 'Düngen',
        training: 'Training',
        observation: 'Beobachtung',
        system: 'System',
        photo: 'Foto',
    },
    journalNoEntries: 'Keine Journal-Einträge für diesen Filter.',
    photosNoEntries: 'Noch keine Fotos im Journal hinzugefügt.',
    tasksComplete: 'Erledigt',
    tasksNoEntries: 'Keine abgeschlossenen Aufgaben.',
  },
  aiAdvisor: {
    description: 'Erhalte eine KI-basierte Analyse des aktuellen Zustands deiner Pflanze und eine Handlungsempfehlung.',
    archiveTitle: 'Berater-Archiv',
    archiveEmpty: 'Gespeicherte Ratschläge für diese Pflanze werden hier angezeigt.',
  },
  aiDiagnostics: {
    title: 'KI-Pflanzendoktor',
    description: 'Lade ein Bild eines Blattes oder einer Problemzone hoch, um eine KI-basierte Diagnose zu erhalten.',
    buttonLabel: 'Bild hochladen',
    prompt: 'PNG, JPG, WEBP bis zu 10MB',
    cameraError: 'Kamerazugriff fehlgeschlagen. Bitte Berechtigungen prüfen.',
    capture: 'Foto aufnehmen',
    retake: 'Wiederholen',
  },
  gardenVitals: {
      title: 'Garten-Übersicht',
      avgTemp: 'Ø Temp.',
      avgHumidity: 'Ø Feucht.',
  },
  summary: {
    gardenHealth: 'Gartengesundheit',
    activeGrows: 'Aktive Grows',
    openTasks: 'Offene Aufgaben',
    waterAll: 'Alle gießen',
    simulateNextDay: 'Nächsten Tag simulieren',
  },
  tasks: {
      title: 'Aufgaben & Warnungen',
      none: 'Keine offenen Aufgaben. Gut gemacht!',
      priority: 'Priorität',
      priorities: {
          low: 'Niedrig',
          medium: 'Mittel',
          high: 'Hoch',
      },
      wateringTask: {
          title: 'Gießen erforderlich',
          description: 'Die Substratfeuchtigkeit ist niedrig.'
      }
  },
  warnings: {
      title: 'Aktive Warnungen',
      none: 'Keine Warnungen. Alles sieht gut aus!',
  },
  actionModals: {
    logAction: 'Aktion protokollieren',
    idealRange: 'Ideal: {min} - {max}',
    current: 'Aktuell',
    wateringTitle: 'Gießen protokollieren',
    feedingTitle: 'Düngung protokollieren',
    observationTitle: 'Beobachtung protokollieren',
    trainingTitle: 'Training protokollieren',
    photoTitle: 'Foto protokollieren',
    waterAmount: 'Wassermenge (ml)',
    phValue: 'pH-Wert (Eingang)',
    ecValue: 'EC-Wert (Eingang)',
    runoffPh: 'pH-Wert (Drainage)',
    runoffEc: 'EC-Wert (Drainage)',
    runoff: 'Drainage (optional)',
    nutrientDetails: 'Dünger-Details',
    nutrientDetailsPlaceholder: 'z.B. BioBizz Grow 2ml/L',
    observationPlaceholder: 'Was hast du beobachtet?',
    trainingType: 'Trainingsart',
    trainingTypes: {
      topping: {
        label: 'Topping',
        tooltip: 'Abschneiden des Haupttriebs, um zwei neue Haupttriebe zu fördern und eine buschigere Pflanze zu erzeugen.'
      },
      lst: {
        label: 'LST',
        tooltip: 'Sanftes Herunterbiegen von Ästen, um ein breites, flaches Blätterdach für eine bessere Lichtausbeute zu schaffen.'
      },
      defoliation: {
        label: 'Entlaubung',
        tooltip: 'Strategisches Entfernen von Fächerblättern, um die Lichtdurchdringung und Luftzirkulation zu den unteren Blüten zu verbessern.'
      },
      fiming: {
        label: 'FIMing',
        tooltip: 'Eine Variante des Toppings, bei der nur ein Teil des neuen Triebs entfernt wird, was zu vier oder mehr neuen Trieben führen kann.'
      },
      scrog: {
        label: 'SCROG',
        tooltip: 'Verwendung eines Netzes (Screen of Green), um die Triebe horizontal zu führen und ein perfekt ebenes Blätterdach zu schaffen.'
      },
      superCropping: {
        label: 'Super Cropping',
        tooltip: 'Vorsichtiges Quetschen und Biegen von Stängeln, um das innere Gewebe zu verletzen, was zu stärkerem Wachstum und besserem Nährstofffluss führt.'
      }
    },
    photoNotes: 'Notizen zum Foto',
    photoCategory: 'Kategorie',
    photoCategories: {
      'Full Plant': 'Ganze Pflanze',
      'Bud': 'Blüte',
      'Leaf': 'Blatt',
      'Problem': 'Problem',
      'Trichomes': 'Trichome',
    },
    healthStatus: 'Gesundheitszustand',
    healthStatuses: {
      'Excellent': 'Ausgezeichnet',
      'Good': 'Gut',
      'Showing Issues': 'Zeigt Probleme',
    },
    observationTags: 'Tags (kommagetrennt)',
    observationTagsPlaceholder: 'z.B. Schädlinge, Mangelerscheinung',
    defaultNotes: {
        watering: 'Pflanze gegossen.',
        feeding: 'Pflanze gedüngt.',
    }
  }
};
export const equipmentView = {
  title: 'Ausrüstung',
  tabs: {
    configurator: 'Konfigurator',
    calculators: 'Rechner',
    setups: 'Meine Setups',
  },
  configurator: {
    title: 'Setup Konfigurator',
    subtitleNew: 'Wähle die Anzahl der Pflanzen und deine bevorzugte Konfiguration, um eine maßgeschneiderte Ausrüstungsliste zu erhalten.',
    step1TitleNew: 'Wie viele Pflanzen möchtest du anbauen?',
    step2TitleNew: 'Wähle deine Konfiguration',
    plantCount: '{count} Pflanze(n)',
    details: {
      zelt: 'Zelt',
      beleuchtung: 'Beleuchtung',
      abluft: 'Abluft',
      toepfe: 'Töpfe',
      medium: 'Medium',
    },
    setups: {
      '1': {
        standard: {
          title: 'Standard-Setup (Preis/Leistung)',
          description: 'Eine ausgewogene Konfiguration für Einsteiger, die gute Ergebnisse ohne hohe Anfangsinvestitionen anstreben.',
          prompt: 'Erstelle eine anfängerfreundliche Grow-Setup-Empfehlung für 1 Pflanze in einer 60x60x180cm Growbox. Die Beleuchtung sollte eine 100-120W LED sein. Die Abluft sollte ein AC-Lüfter mit ~145-180 m³/h sein. Der Topf sollte ein 15-19L Stofftopf sein. Das Medium ist Light-Mix Erde. Das Budget ist niedrig und preis-leistungsorientiert.'
        },
        medium: {
          title: 'Medium-Setup (Ausgewogen)',
          description: 'Ein Upgrade zum Standard-Setup mit besserer Beleuchtung und mehr Platz für höhere Qualität und Ertrag.',
          prompt: 'Erstelle eine Grow-Setup-Empfehlung für 1 Pflanze in einer 80x80x180cm Growbox. Die Beleuchtung sollte eine 150W LED sein. Die Abluft sollte ein AC-Lüfter mit ~220 m³/h sein. Der Topf sollte ein 19L Stofftopf sein. Das Medium ist All-Mix Erde. Das Budget ist mittel, mit Fokus auf ein gutes Gleichgewicht zwischen Kosten und Qualität.'
        },
        premium: {
          title: 'Premium-Setup (Maximale Kontrolle)',
          description: 'High-End-Komponenten für Züchter, die volle Kontrolle und maximale Qualität und Ertrag anstreben.',
          prompt: 'Erstelle eine High-End Grow-Setup-Empfehlung für 1 Pflanze in einer Premium 60x60x180cm Growbox. Die Beleuchtung sollte eine 150W High-End LED sein. Die Abluft sollte ein EC-Lüfter mit Controller und ~180-250 m³/h sein. Der Topf sollte ein 19-25L Stofftopf sein. Das Medium ist ein Coco/Perlite Mix. Das Budget ist hoch.'
        }
      },
      '2': {
        standard: {
          title: 'Standard-Setup (Preis/Leistung)',
          description: 'Eine solide Konfiguration für 2 Pflanzen, optimiert für gute Erträge und einfache Handhabung.',
          prompt: 'Erstelle eine Grow-Setup-Empfehlung für 2 Pflanzen in einer 80x80 oder 120x60cm Growbox. Die Beleuchtung sollte eine 200-240W LED sein. Die Abluft sollte ein AC-Lüfter mit ~220-280 m³/h sein. Töpfe: 2x 15-19L Stofftöpfe. Medium: All-Mix Erde. Das Budget ist niedrig und preis-leistungsorientiert.'
        },
        medium: {
            title: 'Medium-Setup (Ausgewogen)',
            description: 'Mehr Platz und eine stärkere Lampe für zwei Pflanzen, um das Ertragspotenzial deutlich zu steigern.',
            prompt: 'Erstelle eine Grow-Setup-Empfehlung für 2 Pflanzen in einer 100x100x200cm Growbox. Die Beleuchtung sollte eine 280-300W LED sein. Die Abluft sollte ein AC-Lüfter mit ~360 m³/h sein. Töpfe: 2x 25L Stofftöpfe. Das Medium ist Coco/Perlite Mix. Das Budget ist mittel, mit Fokus auf hohen Ertrag.'
        },
        premium: {
          title: 'Premium-Setup (Maximale Kontrolle)',
          description: 'Fortgeschrittenes Setup für maximale Erträge und volle Kontrolle über die Umgebung von 2 Pflanzen.',
          prompt: 'Erstelle eine High-End Grow-Setup-Empfehlung für 2 Pflanzen in einer Premium 80x80 oder 120x60cm Growbox. Die Beleuchtung sollte eine 250-300W High-End LED sein. Die Abluft sollte ein EC-Lüfter mit Controller und ~280-360 m³/h sein. Töpfe: 2x 19-25L Stofftöpfe. Medium: Coco/Perlite Mix oder ein Hydro-System. Das Budget ist hoch.'
        }
      },
      '3': {
        standard: {
          title: 'Standard-Setup (Preis/Leistung)',
          description: 'Eine effiziente Konfiguration für den Anbau von 3 Pflanzen mit Fokus auf einen hohen Gesamtertrag.',
          prompt: 'Erstelle eine Grow-Setup-Empfehlung für 3 Pflanzen in einer 100x100x200cm Growbox. Die Beleuchtung sollte eine 300-320W LED sein. Die Abluft sollte ein AC-Lüfter mit ~360 m³/h sein. Töpfe: 3x 19-25L Stofftöpfe. Medium: All-Mix oder Coco. Das Budget ist niedrig und preis-leistungsorientiert.'
        },
        medium: {
            title: 'Medium-Setup (Ausgewogen)',
            description: 'Ein größeres Zelt und eine stärkere Beleuchtung, um das volle Potenzial von drei Pflanzen auszuschöpfen.',
            prompt: 'Erstelle eine Grow-Setup-Empfehlung für 3 Pflanzen in einer 120x120x200cm Growbox. Die Beleuchtung sollte eine 400W LED sein. Die Abluft sollte ein EC-Lüfter mit ~400 m³/h sein. Töpfe: 3x 25L Stofftöpfe. Medium: Coco/Perlite. Das Budget ist mittel und auf Qualität und Kontrolle ausgerichtet.'
        },
        premium: {
          title: 'Premium-Setup (Maximale Kontrolle)',
          description: 'Ein großzügiges High-End-Setup für 3 Pflanzen, das auf maximale Qualität, Ertrag und Automatisierung ausgelegt ist.',
          prompt: 'Erstelle eine High-End Grow-Setup-Empfehlung für 3 Pflanzen in einer Premium 120x120x220cm Growbox. Die Beleuchtung sollte eine 450-500W Multi-Bar LED sein. Die Abluft sollte ein EC-Lüfter mit Controller, Schalldämpfer und ~400-500 m³/h sein. Töpfe: 3x 30-50L Stofftöpfe. Medium: Living Soil oder Coco. Das Budget ist hoch.'
        }
      }
    },
    generate: 'Setup generieren',
    resultsTitle: 'Deine persönliche Setup-Empfehlung',
    resultsSubtitle: 'Für deine {area}cm Fläche, mit einem {budget} Budget und dem Stil "{style}", ist dies eine von der KI generierte Konfiguration.',
    costBreakdown: 'Kostenaufschlüsselung',
    total: 'Gesamt',
    startOver: 'Neu starten',
    tryAgain: 'Erneut versuchen',
    saveSetup: 'Setup speichern',
    setupNamePrompt: 'Wie möchtest du dieses Setup nennen?',
    setupSaveConfirm: 'Möchtest du das Setup als "{name}" speichern?',
    setupSaveSuccess: 'Setup "{name}" erfolgreich gespeichert!',
    setupSaveError: 'Fehler beim Speichern des Setups.',
    error: 'Die KI konnte keine Empfehlung generieren. Bitte versuche es später erneut.',
    categories: {
      tent: 'Growbox (Zelt)',
      light: 'Beleuchtung',
      ventilation: 'Abluftsystem',
      pots: 'Töpfe',
      soil: 'Erde & Substrat',
      nutrients: 'Dünger',
      extra: 'Zubehör',
    },
    rationaleModalTitle: 'Warum {category}?',
    budgets: {
      low: 'niedrigen',
      medium: 'mittleren',
      high: 'hohen',
    },
    styles: {
      beginner: 'Anfänger',
      balanced: 'Ausgewogen',
      yield: 'Ertrag',
      stealth: 'Tarnung',
    },
    setupNameBudgets: {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
    },
  },
  calculators: {
    ventilation: {
      title: 'Lüfter-Rechner',
      description: 'Berechne die benötigte Lüfterleistung (m³/h) für deine Growbox.',
      width: 'Breite',
      depth: 'Tiefe',
      height: 'Höhe',
      result: 'Empfohlene Abluftleistung',
    },
    light: {
      title: 'Licht-Rechner',
      description: 'Schätze die benötigte LED-Lichtleistung für deine Fläche.',
      width: 'Breite',
      depth: 'Tiefe',
      result: 'Empfohlene LED-Leistung',
    },
    nutrients: {
      title: 'Nährstoff-Rechner',
      description: 'Berechne die richtige Düngermenge für deine Gießkanne.',
      waterAmount: 'Wassermenge',
      dose: 'Dosis',
      result: 'Benötigter Dünger',
    },
    yield: {
      title: 'Ertrags-Schätzer',
      description: 'Erhalte eine grobe Schätzung deines potenziellen Ertrags (g).',
      area: 'Fläche',
      wattage: 'Lichtleistung',
      level: 'Erfahrungslevel',
      levels: {
          beginner: 'Anfänger',
          advanced: 'Fortgeschritten',
          expert: 'Experte'
      },
      result: 'Geschätzter Ertrag'
    },
    calculate: 'Berechnen',
  },
  savedSetups: {
    title: 'Meine gespeicherten Setups',
    noSetups: {
      title: 'Keine gespeicherten Setups',
      subtitle: 'Wenn du eine Empfehlung aus dem Konfigurator speicherst, erscheint sie hier.',
    },
    inspect: 'Inspizieren',
    deleteConfirm: 'Möchtest du das Setup "{name}" wirklich endgültig löschen?',
    deleteSuccess: 'Setup "{name}" wurde gelöscht.',
    updateSuccess: 'Setup "{name}" wurde aktualisiert.',
    updateError: 'Fehler beim Aktualisieren des Setups.',
    exportConfirm: 'Möchtest du das Setup "{name}" wirklich als {format} exportieren?',
    exportSuccess: 'Setup "{name}" erfolgreich exportiert.',
    modal: {
      title: 'Setup Details',
      editMode: 'Bearbeitungsmodus',
      saveChanges: 'Änderungen speichern',
      item: 'Komponente',
      price: 'Preis',
      rationale: 'Begründung',
    },
    pdfReport: {
      setup: 'Setup-Bericht',
      createdAt: 'Erstellt am',
      source: 'Quelle',
      budget: 'Budget',
      total: 'Gesamt',
      product: 'Produkt',
      rationale: 'Begründung',
      price: 'Preis (€)',
      item: 'Komponente',
    }
  }
};
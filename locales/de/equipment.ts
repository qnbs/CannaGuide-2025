
export const equipmentView = {
  tabs: {
    configurator: 'Setup-Konfigurator',
    setups: 'Meine Setups',
    calculators: 'Rechner',
    growShops: 'Grow Shops',
  },
  configurator: {
    title: 'KI-Ausrüstungs-Konfigurator',
    subtitleNew: 'Beantworte zwei einfache Fragen, um eine komplette, KI-generierte Ausrüstungsempfehlung für deinen Grow zu erhalten.',
    step1TitleNew: '1. Wie viele Pflanzen möchtest du anbauen?',
    plantCount_one: '1 Pflanze',
    plantCount_other: '{{range}} Pflanzen',
    step2TitleNew: '2. Wähle deinen Konfigurationsstil',
    generate: 'Setup generieren',
    setupSaveSuccess: 'Setup "{{name}}" erfolgreich gespeichert!',
    resultsTitle: 'Dein KI-generiertes Setup',
    resultsSubtitle: 'Für: {{area}} Fläche, mit Fokus auf {{style}} und einem {{budget}} Budget.',
    resultsSubtitleNew: 'Für: {{plants}} Pflanzen, mit einem {{budget}} Budget.',
    total: 'Gesamtkosten',
    error: 'Bei der Generierung deines Setups ist ein Fehler aufgetreten.',
    tryAgain: 'Erneut versuchen',
    saveSetup: 'Setup speichern',
    startOver: 'Neu beginnen',
    costBreakdown: 'Kostenaufschlüsselung',
    setupNamePrompt: 'Gib einen Namen für dieses Setup ein:',
    budgets: {
      value: 'Preis/Leistung',
      balanced: 'Ausgewogen',
      premium: 'Premium',
    },
    budgetDescriptions: {
        value: 'Fokus auf das Wesentliche mit zuverlässiger, kostengünstiger Ausrüstung.',
        balanced: 'Eine Mischung aus hochwertigen und preiswerten Komponenten für ein optimales Gleichgewicht.',
        premium: 'Keine Kompromisse. Die beste verfügbare Technologie für maximale Qualität und Ertrag.'
    },
    styles: {
      beginner: 'einfache Handhabung',
      balanced: 'ein Gleichgewicht aus Qualität und Ertrag',
      yield: 'Ertragsmaximierung',
    },
    setupNameBudgets: {
        value: 'Preis/Leistung',
        balanced: 'Ausgewogen',
        premium: 'Premium',
    },
    categories: {
      tent: 'Growbox',
      light: 'Beleuchtung',
      ventilation: 'Abluft',
      circulationFan: 'Umluftventilator',
      pots: 'Töpfe & Untersetzer',
      soil: 'Medium/Substrat',
      nutrients: 'Nährstoffe',
      extra: 'Extras & Überwachung',
    },
    details: {
      zelt: 'Zelt',
      beleuchtung: 'Beleuchtung',
      abluft: 'Abluft',
      toepfe: 'Töpfe',
      medium: 'Medium',
    },
  },
  savedSetups: {
    exportTitle: 'Gespeicherte Setups',
    noSetups: {
      title: 'Keine gespeicherten Setups',
      subtitle: 'Nutze den Konfigurator, um dein erstes Setup zu generieren und zu speichern!',
    },
    deleteConfirm: 'Möchtest du dieses Setup wirklich löschen?',
    editTitle: 'Setup-Namen bearbeiten',
    pdfReport: {
      setup: 'Setup-Bericht',
      createdAt: 'Erstellt am',
      item: 'Gegenstand',
      product: 'Produkt',
      rationale: 'Begründung',
      price: 'Preis (€)',
      category: 'Kategorie',
    },
    noDetails: 'Keine detaillierten Komponenteninformationen für dieses Setup verfügbar.',
  },
  calculators: {
    yes: 'Ja',
    no: 'Nein',
    ventilation: {
      title: 'Abluft-Rechner',
      description: 'Berechne die benötigte Leistung (m³/h) des Abluftventilators für deinen Grow-Raum.',
      width: 'Breite',
      depth: 'Tiefe',
      height: 'Höhe',
      lightWattage: 'Lampenleistung',
      lightWattageTooltip: 'Die Wärme deiner Lampe ist ein Hauptfaktor für den Belüftungsbedarf.',
      carbonFilter: 'Aktivkohlefilter im Einsatz?',
      carbonFilterTooltip: 'Aktivkohlefilter reduzieren den Luftstrom und erfordern einen stärkeren Lüfter (ca. +35%).',
      result: 'Empfohlene Lüfterleistung',
    },
    light: {
      title: 'Beleuchtungs-Rechner',
      description: 'Schätze die benötigte LED-Leistung für deine Anbaufläche basierend auf der Wachstumsphase.',
      width: 'Breite der Fläche',
      depth: 'Tiefe der Fläche',
      stage: 'Wachstumsphase',
      result: 'Empfohlene LED-Leistung',
      ppfdTooltip: 'PPFD (Photosynthetische Photonenflussdichte) ist die Menge an Licht, die tatsächlich bei deinen Pflanzen ankommt.',
      dliTooltip: 'DLI (Tägliche Lichtmenge) ist die Gesamtmenge an Licht, die deine Pflanzen pro Tag erhalten.',
    },
    cost: {
      title: 'Stromkosten-Rechner',
      description: 'Schätze die Betriebskosten deiner Ausrüstung.',
      lightPower: 'Lampenleistung',
      lightHours: 'Lichtstunden',
      fanPower: 'Lüfterleistung',
      fanHours: 'Lüfterstunden',
      otherPower: 'Sonstige Geräte',
      price: 'Preis pro kWh',
      daily: 'Tageskosten',
      weekly: 'Wochenkosten',
      monthly: 'Monatskosten',
      cycle: '90-Tage-Zyklus',
      cycleSub: '(ca.)',
    },
    nutrients: {
      title: 'Nährstoff-Mischrechner',
      description: 'Berechne die Menge jeder Nährstoffkomponente für deine Reservoirgröße.',
      reservoir: 'Reservoirgröße',
      component: 'Komponente',
      dose: 'Dosis',
      totalFor: 'Gesamt für',
      addComponent: 'Komponente hinzufügen',
    },
    converter: {
      title: 'EC / PPM Umrechner',
      description: 'Rechne zwischen elektrischer Leitfähigkeit (EC) und Teilen pro Million (PPM) mit verschiedenen Skalen um.',
      resultInfo: 'Werte sind zur Vereinfachung gerundet.',
    },
    yield: {
      title: 'Ertrags-Schätzer',
      description: 'Erhalte eine grobe Schätzung deines potenziellen Ertrags basierend auf Lampenleistung und Effizienz.',
      lightWattage: 'Lampenleistung',
      efficiency: 'Effizienz (g/W)',
      efficiencyTooltip: 'Anfänger: 0.8-1.0, Fortgeschritten: 1.0-1.5, Experte: 1.5+',
      result: 'Geschätzter Ertrag',
      range: 'Spanne: {{low}}g - {{high}}g',
      levels: {
        '0': 'Anfänger',
        '1': 'Fortgeschritten',
        '2': 'Experte'
      },
      techniques: {
        '0': 'Kein Training',
        '1': 'LST (Low-Stress Training)',
        '2': 'Topping / Main-Lining',
        '3': 'SCROG (Screen of Green)'
      },
    }
  },
  growShops: {
    region: {
      europe: 'Europa',
      usa: 'USA',
    },
    selectShopTitle: 'Wähle einen Shop',
    selectShopSubtitle: 'Wähle einen empfohlenen Grow Shop aus der Liste, um mehr Details zu sehen.',
    strengths: 'Stärken',
    shipping: 'Versand',
    paymentMethods: 'Zahlungsmethoden',
    visitShop: 'Besuche {{shopName}}',
    
    us: {
        shopKeys: ['growGeneration', 'hydrobuilder', 'amazonGrow']
    },
    european: {
        shopKeys: ['growmart', 'zamnesia', 'royalQueen']
    },
    shops: {
        growGeneration: { name: 'GrowGeneration', location: 'USA (landesweit)', rating: 4.6, url: 'https://growgeneration.com/', description: 'Eine der größten hydroponischen Einzelhandelsketten in den USA.', strengths: ['Ladengeschäfte', 'Kommerzielle Lösungen', 'Großes Sortiment'], shipping: 'Nur USA', paymentMethods: ['credit_card', 'paypal'] },
        hydrobuilder: { name: 'Hydrobuilder', location: 'USA', rating: 4.7, url: 'https://hydrobuilder.com/', description: 'Großer Online-Händler mit breitem Sortiment.', strengths: ['Komplette Grow-Kits', 'Gute Preise', 'US-Kundenservice'], shipping: 'Nur USA', paymentMethods: ['credit_card', 'paypal', 'crypto'] },
        amazonGrow: { name: 'Amazon', location: 'Online', rating: 4.2, url: 'https://www.amazon.com/', description: 'Bietet eine Auswahl an grundlegender Ausrüstung für Einsteiger.', strengths: ['Schneller Versand (Prime)', 'Einfache Rückgabe', 'Große Auswahl an Einsteigerprodukten'], shipping: 'Weltweit', paymentMethods: ['credit_card', 'paypal'] },
        growmart: { name: 'Growmart', location: 'Deutschland', rating: 4.8, url: 'https://www.growmart.de/', description: 'Führender deutscher Online-Shop mit großer Auswahl.', strengths: ['Große Auswahl', 'Schneller Versand', 'Guter Kundenservice'], shipping: 'EU-weit', paymentMethods: ['credit_card', 'paypal', 'bank_transfer'] },
        zamnesia: { name: 'Zamnesia', location: 'Niederlande', rating: 4.7, url: 'https://www.zamnesia.com/', description: 'Bekannter niederländischer Head- und Growshop.', strengths: ['Samen & Ausrüstung', 'Diskreter Versand', 'Große Community'], shipping: 'Weltweit', paymentMethods: ['credit_card', 'paypal', 'bank_transfer', 'crypto'] },
        royalQueen: { name: 'Royal Queen Seeds', location: 'Spanien', rating: 4.9, url: 'https://www.royalqueenseeds.com/', description: 'Samenbank, die auch hochwertige Ausrüstung anbietet.', strengths: ['Preisgekrönte Genetik', 'Hochwertiges Zubehör', 'Anleitungen'], shipping: 'EU-weit', paymentMethods: ['credit_card', 'bank_transfer', 'crypto'] }
    }
  }
};